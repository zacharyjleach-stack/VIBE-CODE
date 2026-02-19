"""
Aegis Desktop App Configuration
"""
import os
from pathlib import Path

# ── API Configuration ─────────────────────────────────────────────────────────
API_BASE_URL = os.getenv("AEGIS_API_URL", "https://aegissolutions.co.uk")
API_TIMEOUT = 10  # seconds

# ── Endpoints ─────────────────────────────────────────────────────────────────
ENDPOINTS = {
    "check_status": f"{API_BASE_URL}/api/check_status",
    "billing": f"{API_BASE_URL}/billing",
    "dashboard": f"{API_BASE_URL}/dashboard",
    "login": f"{API_BASE_URL}/sign-in",
}

# ── App Metadata ──────────────────────────────────────────────────────────────
APP_NAME = "Aegis"
APP_VERSION = "1.0.0"
APP_AUTHOR = "Aegis Solutions"

# ── Paths ─────────────────────────────────────────────────────────────────────
APP_DATA_DIR = Path.home() / ".aegis"
CONFIG_FILE = APP_DATA_DIR / "config.json"
LOG_FILE = APP_DATA_DIR / "aegis.log"

# ── UI Theme ──────────────────────────────────────────────────────────────────
THEME = {
    "bg_dark": "#0D0D0F",
    "bg_surface": "#1A1A1F",
    "bg_card": "#242429",
    "border": "#2E2E35",
    "accent": "#7C6AFF",
    "accent_hover": "#9485FF",
    "success": "#00FF88",
    "warning": "#FFB800",
    "error": "#FF3B30",
    "text": "#E8E8F0",
    "text_dim": "#8E8E96",
}

# ── Window Dimensions ─────────────────────────────────────────────────────────
MAIN_WINDOW_SIZE = (1200, 800)
POPUP_SIZE = (480, 360)

# ── Token Costs (mirrors web/lib/tokens.ts) ───────────────────────────────────
TOKEN_COSTS = {
    "vibe_check": 100,
    "context_sync": 10,
    "agent_relay": 5,
}

# ── Subscription Plans ────────────────────────────────────────────────────────
PLANS = {
    "free": {
        "name": "Free",
        "tokens": 5000,
        "price": 0,
    },
    "pro": {
        "name": "Pro",
        "tokens": -1,  # unlimited
        "price": 20,
    },
    "lifetime": {
        "name": "Lifetime",
        "tokens": -1,  # unlimited
        "price": 550,
    },
}
