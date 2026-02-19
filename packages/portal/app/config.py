"""
Aegis Portal Configuration
"""
from functools import lru_cache
from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # ── Application ───────────────────────────────────────────────────────
    app_name: str = "Aegis Portal"
    app_version: str = "1.0.0"
    debug: bool = False
    secret_key: str = "change-me-in-production"

    # ── Database ──────────────────────────────────────────────────────────
    database_url: str = "postgresql+asyncpg://localhost:5432/aegis"

    # ── Stripe ────────────────────────────────────────────────────────────
    stripe_secret_key: str = ""
    stripe_webhook_secret: str = ""
    stripe_pro_price_id: str = ""
    stripe_lifetime_price_id: str = ""

    # ── Pricing (in cents) ────────────────────────────────────────────────
    pro_price_cents: int = 2000  # £20
    lifetime_price_cents: int = 55000  # £550

    # ── Token Configuration ───────────────────────────────────────────────
    free_tokens: int = 5000
    token_costs_vibe_check: int = 100
    token_costs_context_sync: int = 10
    token_costs_agent_relay: int = 5

    # ── CORS ──────────────────────────────────────────────────────────────
    cors_origins: str = "*"

    # ── URLs ──────────────────────────────────────────────────────────────
    app_url: str = "https://aegissolutions.co.uk"
    success_url: str = "https://aegissolutions.co.uk/dashboard?success=true"
    cancel_url: str = "https://aegissolutions.co.uk/billing?cancelled=true"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",")]


@lru_cache
def get_settings() -> Settings:
    return Settings()
