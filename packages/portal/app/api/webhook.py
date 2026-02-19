"""
/api/webhook - Stripe webhook handler
"""
import logging

import stripe
from fastapi import APIRouter, Depends, Header, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import get_db
from app.services import StripeService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["webhook"])
settings = get_settings()

# Initialize Stripe
stripe.api_key = settings.stripe_secret_key


@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(None, alias="Stripe-Signature"),
    db: AsyncSession = Depends(get_db),
):
    """
    Handle Stripe webhook events.

    Events handled:
    - checkout.session.completed: Activate subscription/license
    - customer.subscription.updated: Update subscription status
    - customer.subscription.deleted: Cancel subscription
    """
    if not stripe_signature:
        raise HTTPException(status_code=400, detail="Missing Stripe signature")

    # Get raw body
    payload = await request.body()

    try:
        event = stripe.Webhook.construct_event(
            payload,
            stripe_signature,
            settings.stripe_webhook_secret,
        )
    except ValueError as e:
        logger.error(f"Invalid payload: {e}")
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError as e:
        logger.error(f"Invalid signature: {e}")
        raise HTTPException(status_code=400, detail="Invalid signature")

    logger.info(f"Received Stripe event: {event.type}")

    stripe_service = StripeService(db)

    try:
        if event.type == "checkout.session.completed":
            session = event.data.object
            await stripe_service.handle_checkout_completed(session)

        elif event.type == "customer.subscription.updated":
            subscription = event.data.object
            await stripe_service.handle_subscription_updated(subscription)

        elif event.type == "customer.subscription.deleted":
            subscription = event.data.object
            await stripe_service.handle_subscription_deleted(subscription)

        elif event.type == "invoice.paid":
            # Subscription renewal successful
            logger.info(f"Invoice paid: {event.data.object.id}")

        elif event.type == "invoice.payment_failed":
            # Subscription renewal failed
            logger.warning(f"Invoice payment failed: {event.data.object.id}")

        else:
            logger.debug(f"Unhandled event type: {event.type}")

    except Exception as e:
        logger.exception(f"Error handling webhook: {e}")
        raise HTTPException(status_code=500, detail="Webhook handler error")

    return {"received": True}
