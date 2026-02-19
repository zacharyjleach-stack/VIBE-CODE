"""
Aegis Status Checker - Validates subscription status against the web portal
"""
import json
import logging
import threading
from dataclasses import dataclass
from enum import Enum
from pathlib import Path
from typing import Callable, Optional

import requests

from aegis_app.config import API_TIMEOUT, APP_DATA_DIR, CONFIG_FILE, ENDPOINTS

logger = logging.getLogger(__name__)


class PlanType(Enum):
    FREE = "free"
    PRO = "pro"
    LIFETIME = "lifetime"
    UNKNOWN = "unknown"


class SubscriptionState(Enum):
    ACTIVE = "active"
    TRIALING = "trialing"
    EXPIRED = "expired"
    CANCELLED = "cancelled"
    LIFETIME = "lifetime"
    UNKNOWN = "unknown"


@dataclass
class SubscriptionStatus:
    """Represents the current subscription status"""
    is_valid: bool
    plan: PlanType
    state: SubscriptionState
    token_balance: int
    is_lifetime: bool
    user_email: Optional[str] = None
    expires_at: Optional[str] = None
    error_message: Optional[str] = None

    @property
    def can_use_app(self) -> bool:
        """Returns True if the user can use the app"""
        if self.is_lifetime:
            return True
        if self.state in (SubscriptionState.ACTIVE, SubscriptionState.TRIALING):
            return True
        if self.plan == PlanType.FREE and self.token_balance > 0:
            return True
        return False

    @property
    def tokens_remaining(self) -> str:
        """Human-readable token balance"""
        if self.is_lifetime or self.plan == PlanType.PRO:
            return "Unlimited"
        return f"{self.token_balance:,}"

    @classmethod
    def expired(cls, message: str = "Subscription expired") -> "SubscriptionStatus":
        """Factory for expired status"""
        return cls(
            is_valid=False,
            plan=PlanType.FREE,
            state=SubscriptionState.EXPIRED,
            token_balance=0,
            is_lifetime=False,
            error_message=message,
        )

    @classmethod
    def offline(cls) -> "SubscriptionStatus":
        """Factory for offline/error status - allows limited use"""
        return cls(
            is_valid=True,
            plan=PlanType.FREE,
            state=SubscriptionState.UNKNOWN,
            token_balance=0,
            is_lifetime=False,
            error_message="Offline mode - limited functionality",
        )


class StatusChecker:
    """
    Handles subscription status checks against the Aegis web portal.
    Supports background checking with callbacks.
    """

    def __init__(self):
        self._user_key: Optional[str] = None
        self._cached_status: Optional[SubscriptionStatus] = None
        self._load_user_key()

    def _load_user_key(self) -> None:
        """Load user key from local config"""
        if CONFIG_FILE.exists():
            try:
                with open(CONFIG_FILE, "r") as f:
                    config = json.load(f)
                    self._user_key = config.get("user_key")
            except (json.JSONDecodeError, IOError) as e:
                logger.warning(f"Failed to load config: {e}")

    def _save_user_key(self, key: str) -> None:
        """Save user key to local config"""
        APP_DATA_DIR.mkdir(parents=True, exist_ok=True)
        config = {}
        if CONFIG_FILE.exists():
            try:
                with open(CONFIG_FILE, "r") as f:
                    config = json.load(f)
            except (json.JSONDecodeError, IOError):
                pass

        config["user_key"] = key
        with open(CONFIG_FILE, "w") as f:
            json.dump(config, f, indent=2)
        self._user_key = key

    @property
    def user_key(self) -> Optional[str]:
        return self._user_key

    @user_key.setter
    def user_key(self, value: str) -> None:
        self._save_user_key(value)

    @property
    def has_user_key(self) -> bool:
        return bool(self._user_key)

    def check_status_sync(self) -> SubscriptionStatus:
        """
        Synchronous status check - blocks until complete.
        Returns SubscriptionStatus with validity info.
        """
        if not self._user_key:
            return SubscriptionStatus.expired("No user key configured")

        try:
            response = requests.get(
                ENDPOINTS["check_status"],
                headers={
                    "X-API-Key": self._user_key,
                    "Content-Type": "application/json",
                },
                timeout=API_TIMEOUT,
            )

            if response.status_code == 200:
                data = response.json()
                return self._parse_status_response(data)

            elif response.status_code == 401:
                return SubscriptionStatus.expired("Invalid API key")

            elif response.status_code == 402:
                # Payment required - free trial expired
                data = response.json() if response.text else {}
                return SubscriptionStatus(
                    is_valid=False,
                    plan=PlanType.FREE,
                    state=SubscriptionState.EXPIRED,
                    token_balance=0,
                    is_lifetime=False,
                    error_message=data.get("message", "Free trial expired"),
                )

            elif response.status_code == 403:
                return SubscriptionStatus.expired("Access denied")

            else:
                logger.error(f"Unexpected status code: {response.status_code}")
                return SubscriptionStatus.offline()

        except requests.exceptions.Timeout:
            logger.warning("Status check timed out")
            return SubscriptionStatus.offline()

        except requests.exceptions.ConnectionError:
            logger.warning("Could not connect to Aegis server")
            return SubscriptionStatus.offline()

        except requests.exceptions.RequestException as e:
            logger.error(f"Request failed: {e}")
            return SubscriptionStatus.offline()

    def _parse_status_response(self, data: dict) -> SubscriptionStatus:
        """Parse API response into SubscriptionStatus"""
        try:
            plan_str = data.get("plan", "free").lower()
            plan = PlanType(plan_str) if plan_str in [p.value for p in PlanType] else PlanType.FREE

            state_str = data.get("status", "unknown").lower()
            state = SubscriptionState(state_str) if state_str in [s.value for s in SubscriptionState] else SubscriptionState.UNKNOWN

            is_lifetime = data.get("lifetimeLicense", False) or plan == PlanType.LIFETIME

            return SubscriptionStatus(
                is_valid=data.get("allowed", True),
                plan=plan,
                state=SubscriptionState.LIFETIME if is_lifetime else state,
                token_balance=data.get("balance", data.get("tokenBalance", 0)),
                is_lifetime=is_lifetime,
                user_email=data.get("email"),
                expires_at=data.get("expiresAt"),
            )
        except Exception as e:
            logger.error(f"Failed to parse status response: {e}")
            return SubscriptionStatus.offline()

    def check_status_async(
        self,
        on_complete: Callable[[SubscriptionStatus], None],
        on_error: Optional[Callable[[Exception], None]] = None,
    ) -> threading.Thread:
        """
        Asynchronous status check - runs in background thread.
        Calls on_complete with result when done.
        """
        def _check():
            try:
                status = self.check_status_sync()
                self._cached_status = status
                on_complete(status)
            except Exception as e:
                logger.error(f"Async status check failed: {e}")
                if on_error:
                    on_error(e)
                else:
                    on_complete(SubscriptionStatus.offline())

        thread = threading.Thread(target=_check, daemon=True)
        thread.start()
        return thread

    @property
    def cached_status(self) -> Optional[SubscriptionStatus]:
        """Returns last known status without making API call"""
        return self._cached_status

    def clear_cache(self) -> None:
        """Clear cached status"""
        self._cached_status = None
