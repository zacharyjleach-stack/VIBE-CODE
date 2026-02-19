"""Stripe payment service"""
import logging
from typing import Optional

import stripe
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.models import Subscription, User
from app.models.user import PlanType, SubscriptionStatus

logger = logging.getLogger(__name__)
settings = get_settings()

# Initialize Stripe
stripe.api_key = settings.stripe_secret_key


class StripeService:
    """Service for handling Stripe payments and subscriptions"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_checkout_session(
        self,
        user: User,
        plan: str,
    ) -> str:
        """
        Create a Stripe checkout session for subscription or one-time purchase.
        Returns the checkout URL.
        """
        # Ensure user has a Stripe customer ID
        if not user.stripe_customer_id:
            customer = stripe.Customer.create(
                email=user.email,
                metadata={"user_id": str(user.id)},
            )
            user.stripe_customer_id = customer.id
            await self.db.commit()

        # Determine checkout mode and price
        if plan == "lifetime":
            # One-time payment for lifetime
            session = stripe.checkout.Session.create(
                customer=user.stripe_customer_id,
                mode="payment",
                line_items=[
                    {
                        "price": settings.stripe_lifetime_price_id,
                        "quantity": 1,
                    }
                ],
                success_url=settings.success_url,
                cancel_url=settings.cancel_url,
                metadata={
                    "user_id": str(user.id),
                    "plan": "lifetime",
                },
            )
        else:
            # Recurring subscription for pro
            session = stripe.checkout.Session.create(
                customer=user.stripe_customer_id,
                mode="subscription",
                line_items=[
                    {
                        "price": settings.stripe_pro_price_id,
                        "quantity": 1,
                    }
                ],
                success_url=settings.success_url,
                cancel_url=settings.cancel_url,
                metadata={
                    "user_id": str(user.id),
                    "plan": "pro",
                },
            )

        return session.url

    async def handle_checkout_completed(self, session: stripe.checkout.Session) -> None:
        """Handle successful checkout completion"""
        user_id = int(session.metadata.get("user_id", 0))
        plan = session.metadata.get("plan", "pro")

        if not user_id:
            logger.error("No user_id in checkout session metadata")
            return

        # Get user
        result = await self.db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()

        if not user:
            logger.error(f"User {user_id} not found")
            return

        # Get or create subscription
        result = await self.db.execute(
            select(Subscription).where(Subscription.user_id == user_id)
        )
        subscription = result.scalar_one_or_none()

        if not subscription:
            subscription = Subscription(user_id=user_id)
            self.db.add(subscription)

        if plan == "lifetime":
            # Activate lifetime license
            user.lifetime_license = True
            subscription.plan = PlanType.LIFETIME
            subscription.status = SubscriptionStatus.LIFETIME
            logger.info(f"Activated lifetime license for user {user_id}")
        else:
            # Activate pro subscription
            subscription.plan = PlanType.PRO
            subscription.status = SubscriptionStatus.ACTIVE
            subscription.stripe_subscription_id = session.subscription

            # Get subscription details for period dates
            if session.subscription:
                sub = stripe.Subscription.retrieve(session.subscription)
                subscription.current_period_start = sub.current_period_start
                subscription.current_period_end = sub.current_period_end

            logger.info(f"Activated pro subscription for user {user_id}")

        await self.db.commit()

    async def handle_subscription_updated(
        self, stripe_subscription: stripe.Subscription
    ) -> None:
        """Handle subscription update events"""
        result = await self.db.execute(
            select(Subscription).where(
                Subscription.stripe_subscription_id == stripe_subscription.id
            )
        )
        subscription = result.scalar_one_or_none()

        if not subscription:
            logger.warning(f"Subscription {stripe_subscription.id} not found in DB")
            return

        # Update status
        status_map = {
            "active": SubscriptionStatus.ACTIVE,
            "trialing": SubscriptionStatus.TRIALING,
            "canceled": SubscriptionStatus.CANCELLED,
            "past_due": SubscriptionStatus.EXPIRED,
            "unpaid": SubscriptionStatus.EXPIRED,
        }

        subscription.status = status_map.get(
            stripe_subscription.status, SubscriptionStatus.EXPIRED
        )
        subscription.current_period_start = stripe_subscription.current_period_start
        subscription.current_period_end = stripe_subscription.current_period_end
        subscription.cancel_at_period_end = stripe_subscription.cancel_at_period_end

        await self.db.commit()
        logger.info(
            f"Updated subscription {stripe_subscription.id} to {subscription.status}"
        )

    async def handle_subscription_deleted(
        self, stripe_subscription: stripe.Subscription
    ) -> None:
        """Handle subscription cancellation"""
        result = await self.db.execute(
            select(Subscription).where(
                Subscription.stripe_subscription_id == stripe_subscription.id
            )
        )
        subscription = result.scalar_one_or_none()

        if subscription:
            subscription.status = SubscriptionStatus.CANCELLED
            subscription.plan = PlanType.FREE
            await self.db.commit()
            logger.info(f"Cancelled subscription {stripe_subscription.id}")

    async def create_customer_portal_session(self, user: User) -> str:
        """Create a Stripe customer portal session"""
        if not user.stripe_customer_id:
            raise ValueError("User has no Stripe customer ID")

        session = stripe.billing_portal.Session.create(
            customer=user.stripe_customer_id,
            return_url=f"{settings.app_url}/dashboard",
        )

        return session.url
