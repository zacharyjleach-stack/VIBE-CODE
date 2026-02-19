"""
/api/check_status - Subscription status check endpoint for desktop app
"""
import hashlib
import logging
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import get_db
from app.models import ApiKey, Subscription, User
from app.models.user import PlanType, SubscriptionStatus
from app.services import TokenService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["status"])
settings = get_settings()


class StatusResponse(BaseModel):
    """Response model for status check"""
    allowed: bool
    plan: str
    status: str
    balance: int
    lifetimeLicense: bool
    email: Optional[str] = None
    expiresAt: Optional[str] = None
    message: Optional[str] = None
    upgradeUrl: Optional[str] = None


async def get_user_from_api_key(
    api_key: str,
    db: AsyncSession,
) -> Optional[User]:
    """Validate API key and return associated user"""
    if not api_key:
        return None

    # Hash the key to compare
    key_hash = hashlib.sha256(api_key.encode()).hexdigest()

    # Find the API key
    result = await db.execute(
        select(ApiKey).where(
            ApiKey.key_hash == key_hash,
            ApiKey.is_revoked == False,
        )
    )
    api_key_obj = result.scalar_one_or_none()

    if not api_key_obj:
        return None

    # Update last used timestamp
    api_key_obj.last_used_at = datetime.utcnow()

    # Get the user
    result = await db.execute(
        select(User).where(User.id == api_key_obj.user_id)
    )
    return result.scalar_one_or_none()


@router.get("/check_status", response_model=StatusResponse)
async def check_status(
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
    db: AsyncSession = Depends(get_db),
) -> StatusResponse:
    """
    Check subscription status using API key.
    Called by the desktop app on startup.

    Returns:
    - allowed: Whether the user can use the app
    - plan: Current plan (free/pro/lifetime)
    - status: Subscription status
    - balance: Token balance (-1 for unlimited)
    - lifetimeLicense: Whether user has lifetime access
    """
    if not x_api_key:
        raise HTTPException(
            status_code=401,
            detail="API key required. Pass via X-API-Key header.",
        )

    # Validate API key and get user
    user = await get_user_from_api_key(x_api_key, db)

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid API key",
        )

    # Use token service to check access
    token_service = TokenService(db)
    access = await token_service.check_access(user)

    # Get subscription for expiry info
    result = await db.execute(
        select(Subscription).where(Subscription.user_id == user.id)
    )
    subscription = result.scalar_one_or_none()

    expires_at = None
    if subscription and subscription.current_period_end:
        expires_at = subscription.current_period_end.isoformat()

    # Build response
    response = StatusResponse(
        allowed=access["allowed"],
        plan=access["plan"],
        status=access.get("status", "unknown"),
        balance=access["balance"],
        lifetimeLicense=access.get("lifetimeLicense", False),
        email=user.email,
        expiresAt=expires_at,
    )

    # Add upgrade URL if not allowed
    if not access["allowed"]:
        response.message = access.get("message", "Subscription required")
        response.upgradeUrl = f"{settings.app_url}/billing"

    await db.commit()  # Commit the last_used_at update

    return response


@router.post("/check_status", response_model=StatusResponse)
async def check_status_and_spend(
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
    action: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
) -> StatusResponse:
    """
    Check status and optionally spend tokens for an action.
    Same as GET but can deduct tokens.
    """
    if not x_api_key:
        raise HTTPException(
            status_code=401,
            detail="API key required",
        )

    user = await get_user_from_api_key(x_api_key, db)

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid API key",
        )

    token_service = TokenService(db)

    # If action specified, try to spend tokens
    if action:
        from app.models.user import TokenAction

        try:
            token_action = TokenAction(action)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid action: {action}",
            )

        spend_result = await token_service.spend_tokens(user, token_action)

        if not spend_result["success"]:
            raise HTTPException(
                status_code=402,
                detail={
                    "allowed": False,
                    "message": spend_result.get("message", "Insufficient tokens"),
                    "balance": spend_result.get("balance", 0),
                    "upgradeUrl": f"{settings.app_url}/billing",
                },
            )

    # Get current access status
    access = await token_service.check_access(user)

    return StatusResponse(
        allowed=access["allowed"],
        plan=access["plan"],
        status=access.get("status", "unknown"),
        balance=access["balance"],
        lifetimeLicense=access.get("lifetimeLicense", False),
        email=user.email,
    )
