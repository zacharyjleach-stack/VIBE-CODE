"""Initial schema: users, subscriptions, token_ledger, api_keys

Revision ID: 001
Revises:
Create Date: 2026-01-01 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── users ──────────────────────────────────────────────────────────────
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("hashed_password", sa.String(length=255), nullable=True),
        sa.Column("token_balance", sa.Integer(), nullable=False, server_default="5000"),
        sa.Column("lifetime_license", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("stripe_customer_id", sa.String(length=255), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
        sa.UniqueConstraint("stripe_customer_id"),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)

    # ── subscriptions ──────────────────────────────────────────────────────
    plan_type_enum = sa.Enum(
        "free", "pro", "lifetime", name="plantype", create_type=True
    )
    subscription_status_enum = sa.Enum(
        "trialing", "active", "cancelled", "expired", "lifetime",
        name="subscriptionstatus", create_type=True,
    )

    op.create_table(
        "subscriptions",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column(
            "plan",
            plan_type_enum,
            nullable=False,
            server_default="free",
        ),
        sa.Column(
            "status",
            subscription_status_enum,
            nullable=False,
            server_default="trialing",
        ),
        sa.Column("stripe_subscription_id", sa.String(length=255), nullable=True),
        sa.Column("current_period_start", sa.DateTime(timezone=True), nullable=True),
        sa.Column("current_period_end", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "cancel_at_period_end", sa.Boolean(), nullable=False, server_default="false"
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id"),
        sa.UniqueConstraint("stripe_subscription_id"),
    )

    # ── token_ledger ───────────────────────────────────────────────────────
    token_action_enum = sa.Enum(
        "credit", "debit", "signup_bonus", "purchase",
        "vibe_check", "context_sync", "agent_relay",
        name="tokenaction", create_type=True,
    )

    op.create_table(
        "token_ledger",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("action", token_action_enum, nullable=False),
        sa.Column("amount", sa.Integer(), nullable=False),
        sa.Column("balance_after", sa.Integer(), nullable=False),
        sa.Column("description", sa.String(length=500), nullable=True),
        sa.Column("project_id", sa.String(length=255), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_token_ledger_user_id"), "token_ledger", ["user_id"], unique=False
    )

    # ── api_keys ───────────────────────────────────────────────────────────
    op.create_table(
        "api_keys",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("key_hash", sa.String(length=255), nullable=False),
        sa.Column("key_prefix", sa.String(length=20), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False, server_default="Default Key"),
        sa.Column("is_revoked", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("last_used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("key_hash"),
    )
    op.create_index(
        op.f("ix_api_keys_user_id"), "api_keys", ["user_id"], unique=False
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_api_keys_user_id"), table_name="api_keys")
    op.drop_table("api_keys")

    op.drop_index(op.f("ix_token_ledger_user_id"), table_name="token_ledger")
    op.drop_table("token_ledger")

    op.drop_table("subscriptions")
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_table("users")

    # Drop custom enum types
    sa.Enum(name="tokenaction").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="subscriptionstatus").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="plantype").drop(op.get_bind(), checkfirst=True)
