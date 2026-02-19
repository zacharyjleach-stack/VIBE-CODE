"""
/api/checkout - Create Stripe checkout sessions
"""
import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import User
from app.services import StripeService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["checkout"])


class CheckoutRequest(BaseModel):
    """Request to create a checkout session"""
    user_email: str
    plan: str  # "pro" or "lifetime"


class CheckoutResponse(BaseModel):
    """Response with checkout URL"""
    url: str


@router.post("/checkout", response_model=CheckoutResponse)
async def create_checkout(
    request: CheckoutRequest,
    db: AsyncSession = Depends(get_db),
) -> CheckoutResponse:
    """
    Create a Stripe checkout session for Pro subscription or Lifetime purchase.

    - pro: £20/month recurring subscription
    - lifetime: £550 one-time payment
    """
    if request.plan not in ("pro", "lifetime"):
        raise HTTPException(
            status_code=400,
            detail="Plan must be 'pro' or 'lifetime'",
        )

    # Find or create user by email
    result = await db.execute(
        select(User).where(User.email == request.user_email)
    )
    user = result.scalar_one_or_none()

    if not user:
        # Create new user
        user = User(email=request.user_email)
        db.add(user)
        await db.commit()
        await db.refresh(user)

    # Create checkout session
    stripe_service = StripeService(db)
    url = await stripe_service.create_checkout_session(user, request.plan)

    return CheckoutResponse(url=url)


class PortalRequest(BaseModel):
    """Request to create a billing portal session"""
    user_email: str


@router.post("/portal", response_model=CheckoutResponse)
async def create_portal_session(
    request: PortalRequest,
    db: AsyncSession = Depends(get_db),
) -> CheckoutResponse:
    """
    Create a Stripe customer portal session for managing subscription.
    """
    result = await db.execute(
        select(User).where(User.email == request.user_email)
    )
    user = result.scalar_one_or_none()

    if not user or not user.stripe_customer_id:
        raise HTTPException(
            status_code=404,
            detail="User not found or no active subscription",
        )

    stripe_service = StripeService(db)
    url = await stripe_service.create_customer_portal_session(user)

    return CheckoutResponse(url=url)
