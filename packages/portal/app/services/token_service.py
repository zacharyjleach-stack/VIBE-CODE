"""Token management service"""
import logging
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.models import Subscription, TokenLedger, User
from app.models.user import PlanType, SubscriptionStatus, TokenAction

logger = logging.getLogger(__name__)
settings = get_settings()


class TokenService:
    """Service for managing user token balances"""

    # Token costs per action
    COSTS = {
        TokenAction.VIBE_CHECK: settings.token_costs_vibe_check,
        TokenAction.CONTEXT_SYNC: settings.token_costs_context_sync,
        TokenAction.AGENT_RELAY: settings.token_costs_agent_relay,
    }

    def __init__(self, db: AsyncSession):
        self.db = db

    async def check_access(self, user: User) -> dict:
        """
        Check if a user has access to use tokens.
        Returns access status and current balance.
        """
        # Lifetime license bypasses all checks
        if user.lifetime_license:
            return {
                "allowed": True,
                "balance": -1,  # Indicates unlimited
                "plan": "lifetime",
                "status": "lifetime",
                "lifetimeLicense": True,
            }

        # Get subscription
        result = await self.db.execute(
            select(Subscription).where(Subscription.user_id == user.id)
        )
        subscription = result.scalar_one_or_none()

        plan = subscription.plan if subscription else PlanType.FREE
        status = subscription.status if subscription else SubscriptionStatus.TRIALING

        # Active Pro subscription has unlimited tokens
        if plan == PlanType.PRO and status == SubscriptionStatus.ACTIVE:
            return {
                "allowed": True,
                "balance": -1,  # Indicates unlimited
                "plan": "pro",
                "status": "active",
                "lifetimeLicense": False,
            }

        # Free tier checks token balance
        if user.token_balance <= 0:
            return {
                "allowed": False,
                "balance": 0,
                "plan": "free",
                "status": "expired",
                "message": "Free trial expired. Upgrade to continue.",
                "upgradeUrl": f"{settings.app_url}/billing",
                "lifetimeLicense": False,
            }

        return {
            "allowed": True,
            "balance": user.token_balance,
            "plan": "free",
            "status": "trialing",
            "lifetimeLicense": False,
        }

    async def spend_tokens(
        self,
        user: User,
        action: TokenAction,
        project_id: Optional[str] = None,
    ) -> dict:
        """
        Deduct tokens for an action.
        Returns the result with new balance.
        """
        # Check access first
        access = await self.check_access(user)

        if not access["allowed"]:
            return {
                "success": False,
                "error": "insufficient_tokens",
                "balance": 0,
                "message": access.get("message", "No tokens remaining"),
                "upgradeUrl": access.get("upgradeUrl"),
            }

        # Unlimited plans don't deduct
        if access["balance"] == -1:
            return {
                "success": True,
                "tokensUsed": 0,
                "balance": -1,
                "plan": access["plan"],
            }

        # Calculate cost
        cost = self.COSTS.get(action, 0)

        if cost > user.token_balance:
            return {
                "success": False,
                "error": "insufficient_tokens",
                "balance": user.token_balance,
                "required": cost,
                "message": f"This action requires {cost} tokens but you only have {user.token_balance}",
                "upgradeUrl": f"{settings.app_url}/billing",
            }

        # Deduct tokens
        new_balance = user.token_balance - cost
        user.token_balance = new_balance

        # Create ledger entry
        ledger_entry = TokenLedger(
            user_id=user.id,
            action=action,
            amount=-cost,
            balance_after=new_balance,
            description=f"Spent {cost} tokens on {action.value}",
            project_id=project_id,
        )
        self.db.add(ledger_entry)
        await self.db.commit()

        logger.info(f"User {user.id} spent {cost} tokens on {action.value}, new balance: {new_balance}")

        return {
            "success": True,
            "tokensUsed": cost,
            "balance": new_balance,
            "plan": "free",
        }

    async def credit_tokens(
        self,
        user: User,
        amount: int,
        action: TokenAction,
        description: Optional[str] = None,
    ) -> dict:
        """Add tokens to a user's balance"""
        new_balance = user.token_balance + amount
        user.token_balance = new_balance

        # Create ledger entry
        ledger_entry = TokenLedger(
            user_id=user.id,
            action=action,
            amount=amount,
            balance_after=new_balance,
            description=description or f"Credited {amount} tokens",
        )
        self.db.add(ledger_entry)
        await self.db.commit()

        logger.info(f"Credited {amount} tokens to user {user.id}, new balance: {new_balance}")

        return {
            "success": True,
            "tokensAdded": amount,
            "balance": new_balance,
        }

    async def get_balance(self, user: User) -> dict:
        """Get current token balance and usage stats"""
        access = await self.check_access(user)

        # Get recent ledger entries
        result = await self.db.execute(
            select(TokenLedger)
            .where(TokenLedger.user_id == user.id)
            .order_by(TokenLedger.created_at.desc())
            .limit(20)
        )
        entries = result.scalars().all()

        history = [
            {
                "action": entry.action.value,
                "amount": entry.amount,
                "balanceAfter": entry.balance_after,
                "description": entry.description,
                "createdAt": entry.created_at.isoformat(),
            }
            for entry in entries
        ]

        return {
            "balance": access["balance"],
            "plan": access["plan"],
            "status": access.get("status", "unknown"),
            "lifetimeLicense": access.get("lifetimeLicense", False),
            "history": history,
        }
