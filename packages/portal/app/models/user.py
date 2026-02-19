"""User and Subscription Models"""
import secrets
from datetime import datetime
from enum import Enum as PyEnum
from typing import Optional

from sqlalchemy import Boolean, Enum, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class PlanType(str, PyEnum):
    FREE = "free"
    PRO = "pro"
    LIFETIME = "lifetime"


class SubscriptionStatus(str, PyEnum):
    TRIALING = "trialing"
    ACTIVE = "active"
    CANCELLED = "cancelled"
    EXPIRED = "expired"
    LIFETIME = "lifetime"


class TokenAction(str, PyEnum):
    CREDIT = "credit"
    DEBIT = "debit"
    SIGNUP_BONUS = "signup_bonus"
    PURCHASE = "purchase"
    VIBE_CHECK = "vibe_check"
    CONTEXT_SYNC = "context_sync"
    AGENT_RELAY = "agent_relay"


class User(Base):
    """User account model"""

    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    hashed_password: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Token balance
    token_balance: Mapped[int] = mapped_column(Integer, default=5000)

    # Lifetime license flag
    lifetime_license: Mapped[bool] = mapped_column(Boolean, default=False)

    # Stripe customer ID
    stripe_customer_id: Mapped[Optional[str]] = mapped_column(
        String(255), unique=True, nullable=True
    )

    # Relationships
    subscription: Mapped[Optional["Subscription"]] = relationship(
        back_populates="user", uselist=False
    )
    api_keys: Mapped[list["ApiKey"]] = relationship(back_populates="user")
    token_ledger: Mapped[list["TokenLedger"]] = relationship(back_populates="user")


class Subscription(Base):
    """Subscription model for tracking plan status"""

    __tablename__ = "subscriptions"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True)
    plan: Mapped[PlanType] = mapped_column(Enum(PlanType), default=PlanType.FREE)
    status: Mapped[SubscriptionStatus] = mapped_column(
        Enum(SubscriptionStatus), default=SubscriptionStatus.TRIALING
    )

    # Stripe subscription ID
    stripe_subscription_id: Mapped[Optional[str]] = mapped_column(
        String(255), unique=True, nullable=True
    )

    # Billing period
    current_period_start: Mapped[Optional[datetime]] = mapped_column(nullable=True)
    current_period_end: Mapped[Optional[datetime]] = mapped_column(nullable=True)

    # Cancellation
    cancel_at_period_end: Mapped[bool] = mapped_column(Boolean, default=False)

    # Relationship
    user: Mapped["User"] = relationship(back_populates="subscription")


class TokenLedger(Base):
    """Token transaction ledger for auditing"""

    __tablename__ = "token_ledger"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    action: Mapped[TokenAction] = mapped_column(Enum(TokenAction))
    amount: Mapped[int] = mapped_column(Integer)
    balance_after: Mapped[int] = mapped_column(Integer)
    description: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    project_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Relationship
    user: Mapped["User"] = relationship(back_populates="token_ledger")


class ApiKey(Base):
    """API Key model for desktop app authentication"""

    __tablename__ = "api_keys"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)

    # Key is hashed for security, prefix stored for display
    key_hash: Mapped[str] = mapped_column(String(255), unique=True)
    key_prefix: Mapped[str] = mapped_column(String(20))  # e.g., "aegis_abc..."

    # Metadata
    name: Mapped[str] = mapped_column(String(100), default="Default Key")
    is_revoked: Mapped[bool] = mapped_column(Boolean, default=False)
    last_used_at: Mapped[Optional[datetime]] = mapped_column(nullable=True)

    # Relationship
    user: Mapped["User"] = relationship(back_populates="api_keys")

    @classmethod
    def generate_key(cls) -> tuple[str, str, str]:
        """
        Generate a new API key.
        Returns: (full_key, key_hash, key_prefix)
        """
        import hashlib

        # Generate a secure random key
        key = f"aegis_{secrets.token_urlsafe(32)}"
        key_hash = hashlib.sha256(key.encode()).hexdigest()
        key_prefix = key[:12] + "..."

        return key, key_hash, key_prefix
