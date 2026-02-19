"""
/api/tokens - Token balance and usage endpoints
"""
import hashlib
import logging
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import ApiKey, User
from app.services import TokenService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["tokens"])


class TokenBalanceResponse(BaseModel):
    """Token balance response"""
    balance: int
    plan: str
    status: str
    lifetimeLicense: bool
    history: list[dict]


class SpendRequest(BaseModel):
    """Request to spend tokens"""
    action: str
    projectId: Optional[str] = None


class SpendResponse(BaseModel):
    """Token spend response"""
    success: bool
    tokensUsed: int
    balance: int
    plan: str
    error: Optional[str] = None
    message: Optional[str] = None
    upgradeUrl: Optional[str] = None


async def get_user_from_api_key(
    api_key: str,
    db: AsyncSession,
) -> Optional[User]:
    """Validate API key and return associated user"""
    if not api_key:
        return None

    key_hash = hashlib.sha256(api_key.encode()).hexdigest()

    result = await db.execute(
        select(ApiKey).where(
            ApiKey.key_hash == key_hash,
            ApiKey.is_revoked == False,
        )
    )
    api_key_obj = result.scalar_one_or_none()

    if not api_key_obj:
        return None

    result = await db.execute(
        select(User).where(User.id == api_key_obj.user_id)
    )
    return result.scalar_one_or_none()


@router.get("/tokens", response_model=TokenBalanceResponse)
async def get_token_balance(
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
    db: AsyncSession = Depends(get_db),
) -> TokenBalanceResponse:
    """
    Get current token balance and usage history.
    """
    if not x_api_key:
        raise HTTPException(status_code=401, detail="API key required")

    user = await get_user_from_api_key(x_api_key, db)

    if not user:
        raise HTTPException(status_code=401, detail="Invalid API key")

    token_service = TokenService(db)
    balance_info = await token_service.get_balance(user)

    return TokenBalanceResponse(**balance_info)


@router.post("/tokens/spend", response_model=SpendResponse)
async def spend_tokens(
    request: SpendRequest,
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
    db: AsyncSession = Depends(get_db),
) -> SpendResponse:
    """
    Spend tokens for an action.

    Actions:
    - vibe_check: 100 tokens
    - context_sync: 10 tokens
    - agent_relay: 5 tokens
    """
    if not x_api_key:
        raise HTTPException(status_code=401, detail="API key required")

    user = await get_user_from_api_key(x_api_key, db)

    if not user:
        raise HTTPException(status_code=401, detail="Invalid API key")

    # Validate action
    from app.models.user import TokenAction

    try:
        action = TokenAction(request.action)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid action: {request.action}. Valid actions: vibe_check, context_sync, agent_relay",
        )

    token_service = TokenService(db)
    result = await token_service.spend_tokens(user, action, request.projectId)

    if not result["success"]:
        raise HTTPException(
            status_code=402,
            detail=SpendResponse(
                success=False,
                tokensUsed=0,
                balance=result.get("balance", 0),
                plan="free",
                error=result.get("error"),
                message=result.get("message"),
                upgradeUrl=result.get("upgradeUrl"),
            ).model_dump(),
        )

    return SpendResponse(
        success=True,
        tokensUsed=result["tokensUsed"],
        balance=result["balance"],
        plan=result["plan"],
    )
