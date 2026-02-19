#!/usr/bin/env python3
"""
Aegis Desktop App - Entry Point

This is the main entry point for the Aegis desktop application.
It initializes CustomTkinter, configures the theme, and launches the main window.

Usage:
    python main.py                  # Run the app
    pyinstaller aegis.spec          # Build executable
"""

import logging
import sys
from pathlib import Path

import customtkinter as ctk

# Ensure package is importable
sys.path.insert(0, str(Path(__file__).parent))

from aegis_app.config import APP_DATA_DIR, LOG_FILE, THEME
from aegis_app.ui import MainWindow


def setup_logging() -> None:
    """Configure application logging"""
    APP_DATA_DIR.mkdir(parents=True, exist_ok=True)

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        handlers=[
            logging.FileHandler(LOG_FILE, encoding="utf-8"),
            logging.StreamHandler(sys.stdout),
        ],
    )


def configure_theme() -> None:
    """Configure CustomTkinter appearance"""
    # Set appearance mode (dark/light/system)
    ctk.set_appearance_mode("dark")

    # Set default color theme
    ctk.set_default_color_theme("blue")


def main() -> int:
    """Main entry point"""
    # Setup
    setup_logging()
    logger = logging.getLogger(__name__)
    logger.info("Starting Aegis Desktop App...")

    # Configure theme
    configure_theme()

    try:
        # Create and run main window
        app = MainWindow()
        app.mainloop()
        return 0

    except KeyboardInterrupt:
        logger.info("Application interrupted by user")
        return 0

    except Exception as e:
        logger.exception(f"Fatal error: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
