"""
Aegis Main Window - The primary application interface
"""
import logging
import webbrowser
from typing import Optional

import customtkinter as ctk

from aegis_app.config import APP_NAME, APP_VERSION, ENDPOINTS, MAIN_WINDOW_SIZE, THEME
from aegis_app.core import StatusChecker, SubscriptionStatus
from aegis_app.ui.subscription_popup import LoginPopup, SubscriptionPopup

logger = logging.getLogger(__name__)


class MainWindow(ctk.CTk):
    """
    Main Aegis Desktop Application Window.
    Features:
    - Status checking on startup
    - Agent monitoring dashboard
    - Token balance display
    - Settings panel
    """

    def __init__(self):
        super().__init__()

        # Initialize status checker
        self._status_checker = StatusChecker()
        self._current_status: Optional[SubscriptionStatus] = None

        # ── Window Configuration ──────────────────────────────────────────
        self.title(f"{APP_NAME} v{APP_VERSION}")
        self.geometry(f"{MAIN_WINDOW_SIZE[0]}x{MAIN_WINDOW_SIZE[1]}")
        self.minsize(900, 600)
        self.configure(fg_color=THEME["bg_dark"])

        # Set app icon (would need actual icon file)
        # self.iconbitmap("assets/icon.ico")

        # Configure grid
        self.grid_columnconfigure(1, weight=1)
        self.grid_rowconfigure(0, weight=1)

        # ── Build UI ──────────────────────────────────────────────────────
        self._build_sidebar()
        self._build_main_content()
        self._build_status_bar()

        # ── Startup Check ─────────────────────────────────────────────────
        self.after(100, self._perform_startup_check)

    def _build_sidebar(self) -> None:
        """Build the left sidebar navigation"""
        sidebar = ctk.CTkFrame(
            self,
            fg_color=THEME["bg_surface"],
            corner_radius=0,
            width=220,
        )
        sidebar.grid(row=0, column=0, rowspan=2, sticky="nsw")
        sidebar.grid_propagate(False)

        # Logo
        logo_frame = ctk.CTkFrame(sidebar, fg_color="transparent")
        logo_frame.pack(fill="x", padx=20, pady=(25, 30))

        logo_icon = ctk.CTkLabel(
            logo_frame,
            text="⬡",
            font=ctk.CTkFont(size=32),
            text_color=THEME["accent"],
        )
        logo_icon.pack(side="left")

        logo_text = ctk.CTkLabel(
            logo_frame,
            text="AEGIS",
            font=ctk.CTkFont(size=18, weight="bold"),
            text_color=THEME["text"],
        )
        logo_text.pack(side="left", padx=(10, 0))

        # Navigation buttons
        nav_items = [
            ("Dashboard", "dashboard", True),
            ("Agents", "agents", False),
            ("Projects", "projects", False),
            ("Vibe Check", "vibe", False),
            ("Settings", "settings", False),
        ]

        for label, page, is_active in nav_items:
            btn = ctk.CTkButton(
                sidebar,
                text=f"  {label}",
                font=ctk.CTkFont(size=13),
                fg_color=THEME["accent"] if is_active else "transparent",
                hover_color=THEME["bg_card"],
                text_color=THEME["text"],
                anchor="w",
                corner_radius=8,
                height=40,
                command=lambda p=page: self._navigate(p),
            )
            btn.pack(fill="x", padx=15, pady=3)

        # Spacer
        spacer = ctk.CTkFrame(sidebar, fg_color="transparent")
        spacer.pack(fill="both", expand=True)

        # Token display
        self._token_frame = ctk.CTkFrame(
            sidebar,
            fg_color=THEME["bg_card"],
            corner_radius=10,
        )
        self._token_frame.pack(fill="x", padx=15, pady=(0, 10))

        token_header = ctk.CTkLabel(
            self._token_frame,
            text="TOKEN BALANCE",
            font=ctk.CTkFont(size=9, weight="bold"),
            text_color=THEME["text_dim"],
        )
        token_header.pack(pady=(12, 2))

        self._token_label = ctk.CTkLabel(
            self._token_frame,
            text="...",
            font=ctk.CTkFont(size=20, weight="bold"),
            text_color=THEME["accent"],
        )
        self._token_label.pack(pady=(0, 12))

        # Upgrade button
        self._upgrade_btn = ctk.CTkButton(
            sidebar,
            text="Upgrade Plan",
            font=ctk.CTkFont(size=12),
            fg_color=THEME["accent"],
            hover_color=THEME["accent_hover"],
            text_color="#FFFFFF",
            corner_radius=8,
            height=36,
            command=self._open_billing,
        )
        self._upgrade_btn.pack(fill="x", padx=15, pady=(0, 20))

    def _build_main_content(self) -> None:
        """Build the main content area"""
        main = ctk.CTkFrame(self, fg_color=THEME["bg_dark"], corner_radius=0)
        main.grid(row=0, column=1, sticky="nsew", padx=0, pady=0)
        main.grid_columnconfigure(0, weight=1)
        main.grid_rowconfigure(1, weight=1)

        # Header
        header = ctk.CTkFrame(main, fg_color="transparent", height=70)
        header.grid(row=0, column=0, sticky="ew", padx=30, pady=(20, 10))
        header.grid_propagate(False)

        header_title = ctk.CTkLabel(
            header,
            text="Dashboard",
            font=ctk.CTkFont(size=24, weight="bold"),
            text_color=THEME["text"],
        )
        header_title.pack(side="left", pady=15)

        # Status indicator
        self._status_indicator = ctk.CTkLabel(
            header,
            text="● Checking...",
            font=ctk.CTkFont(size=11),
            text_color=THEME["text_dim"],
        )
        self._status_indicator.pack(side="right", pady=15)

        # Content grid
        content = ctk.CTkFrame(main, fg_color="transparent")
        content.grid(row=1, column=0, sticky="nsew", padx=30, pady=10)
        content.grid_columnconfigure((0, 1, 2), weight=1)
        content.grid_rowconfigure((0, 1), weight=1)

        # Agent cards
        agents = [
            ("Claude", "claude", THEME["accent"]),
            ("Cursor", "cursor", THEME["success"]),
            ("Gemini", "gemini", THEME["warning"]),
        ]

        for i, (name, agent_type, color) in enumerate(agents):
            card = self._create_agent_card(content, name, agent_type, color)
            card.grid(row=0, column=i, sticky="nsew", padx=10, pady=10)

        # Activity feed
        activity_card = self._create_activity_card(content)
        activity_card.grid(row=1, column=0, columnspan=2, sticky="nsew", padx=10, pady=10)

        # Quick actions
        actions_card = self._create_actions_card(content)
        actions_card.grid(row=1, column=2, sticky="nsew", padx=10, pady=10)

    def _create_agent_card(
        self, parent: ctk.CTkFrame, name: str, agent_type: str, color: str
    ) -> ctk.CTkFrame:
        """Create an agent status card"""
        card = ctk.CTkFrame(
            parent,
            fg_color=THEME["bg_surface"],
            corner_radius=12,
            border_width=1,
            border_color=THEME["border"],
        )

        # Header
        header = ctk.CTkFrame(card, fg_color="transparent")
        header.pack(fill="x", padx=20, pady=(20, 10))

        icon = ctk.CTkLabel(
            header,
            text="●",
            font=ctk.CTkFont(size=14),
            text_color=color,
        )
        icon.pack(side="left")

        title = ctk.CTkLabel(
            header,
            text=name,
            font=ctk.CTkFont(size=14, weight="bold"),
            text_color=THEME["text"],
        )
        title.pack(side="left", padx=(8, 0))

        status = ctk.CTkLabel(
            header,
            text="Idle",
            font=ctk.CTkFont(size=11),
            text_color=THEME["text_dim"],
        )
        status.pack(side="right")

        # Divider
        divider = ctk.CTkFrame(card, fg_color=THEME["border"], height=1)
        divider.pack(fill="x", padx=20, pady=10)

        # Stats
        stats_frame = ctk.CTkFrame(card, fg_color="transparent")
        stats_frame.pack(fill="x", padx=20, pady=(0, 20))

        for stat_name, stat_value in [("Files", "0"), ("Syncs", "0")]:
            stat_container = ctk.CTkFrame(stats_frame, fg_color="transparent")
            stat_container.pack(side="left", expand=True)

            stat_label = ctk.CTkLabel(
                stat_container,
                text=stat_name,
                font=ctk.CTkFont(size=10),
                text_color=THEME["text_dim"],
            )
            stat_label.pack()

            stat_value_label = ctk.CTkLabel(
                stat_container,
                text=stat_value,
                font=ctk.CTkFont(size=18, weight="bold"),
                text_color=THEME["text"],
            )
            stat_value_label.pack()

        return card

    def _create_activity_card(self, parent: ctk.CTkFrame) -> ctk.CTkFrame:
        """Create the activity feed card"""
        card = ctk.CTkFrame(
            parent,
            fg_color=THEME["bg_surface"],
            corner_radius=12,
            border_width=1,
            border_color=THEME["border"],
        )

        header = ctk.CTkLabel(
            card,
            text="Recent Activity",
            font=ctk.CTkFont(size=14, weight="bold"),
            text_color=THEME["text"],
        )
        header.pack(anchor="w", padx=20, pady=(20, 15))

        # Placeholder items
        for i in range(4):
            item = ctk.CTkFrame(card, fg_color="transparent")
            item.pack(fill="x", padx=20, pady=5)

            dot = ctk.CTkLabel(
                item,
                text="●",
                font=ctk.CTkFont(size=8),
                text_color=THEME["accent"],
            )
            dot.pack(side="left")

            text = ctk.CTkLabel(
                item,
                text="Waiting for agent activity...",
                font=ctk.CTkFont(size=11),
                text_color=THEME["text_dim"],
            )
            text.pack(side="left", padx=(8, 0))

        return card

    def _create_actions_card(self, parent: ctk.CTkFrame) -> ctk.CTkFrame:
        """Create quick actions card"""
        card = ctk.CTkFrame(
            parent,
            fg_color=THEME["bg_surface"],
            corner_radius=12,
            border_width=1,
            border_color=THEME["border"],
        )

        header = ctk.CTkLabel(
            card,
            text="Quick Actions",
            font=ctk.CTkFont(size=14, weight="bold"),
            text_color=THEME["text"],
        )
        header.pack(anchor="w", padx=20, pady=(20, 15))

        actions = [
            ("Run Vibe Check", self._run_vibe_check),
            ("Sync All Agents", self._sync_agents),
            ("Open Dashboard", lambda: webbrowser.open(ENDPOINTS["dashboard"])),
        ]

        for label, command in actions:
            btn = ctk.CTkButton(
                card,
                text=label,
                font=ctk.CTkFont(size=12),
                fg_color=THEME["bg_card"],
                hover_color=THEME["border"],
                text_color=THEME["text"],
                corner_radius=8,
                height=36,
                command=command,
            )
            btn.pack(fill="x", padx=20, pady=5)

        return card

    def _build_status_bar(self) -> None:
        """Build the bottom status bar"""
        status_bar = ctk.CTkFrame(
            self,
            fg_color=THEME["bg_surface"],
            corner_radius=0,
            height=32,
        )
        status_bar.grid(row=1, column=1, sticky="ew")

        self._connection_label = ctk.CTkLabel(
            status_bar,
            text="● Disconnected",
            font=ctk.CTkFont(size=10),
            text_color=THEME["text_dim"],
        )
        self._connection_label.pack(side="left", padx=15, pady=6)

        version_label = ctk.CTkLabel(
            status_bar,
            text=f"v{APP_VERSION}",
            font=ctk.CTkFont(size=10),
            text_color=THEME["text_dim"],
        )
        version_label.pack(side="right", padx=15, pady=6)

    def _perform_startup_check(self) -> None:
        """Check subscription status on startup"""
        logger.info("Performing startup subscription check...")

        # Check if we have a user key
        if not self._status_checker.has_user_key:
            self._show_login_popup()
            return

        # Update UI to show checking
        self._status_indicator.configure(text="● Checking subscription...")

        # Perform async check
        self._status_checker.check_status_async(
            on_complete=self._handle_status_result,
            on_error=lambda e: self._handle_status_result(SubscriptionStatus.offline()),
        )

    def _handle_status_result(self, status: SubscriptionStatus) -> None:
        """Handle the result of a status check"""
        self._current_status = status
        logger.info(f"Status check result: valid={status.is_valid}, plan={status.plan}")

        # Update UI
        self._update_status_display(status)

        # Show popup if expired
        if not status.can_use_app:
            self._show_subscription_popup(status.error_message or "Your subscription has expired")

    def _update_status_display(self, status: SubscriptionStatus) -> None:
        """Update UI elements based on status"""
        # Update token display
        self._token_label.configure(text=status.tokens_remaining)

        # Update status indicator
        if status.is_lifetime:
            self._status_indicator.configure(
                text="● Lifetime License",
                text_color=THEME["success"],
            )
            self._upgrade_btn.configure(state="disabled", text="Lifetime Active")
        elif status.state.value == "active":
            self._status_indicator.configure(
                text=f"● Pro Active",
                text_color=THEME["success"],
            )
        elif status.can_use_app:
            self._status_indicator.configure(
                text=f"● Free Tier ({status.token_balance:,} tokens)",
                text_color=THEME["warning"],
            )
        else:
            self._status_indicator.configure(
                text="● Expired",
                text_color=THEME["error"],
            )

    def _show_subscription_popup(self, message: str) -> None:
        """Show the subscription expired popup"""
        popup = SubscriptionPopup(
            parent=self,
            message=message,
            on_upgrade=None,
            on_dismiss=self._on_popup_dismiss,
        )
        popup.focus()

    def _show_login_popup(self) -> None:
        """Show the API key login popup"""
        popup = LoginPopup(
            parent=self,
            on_submit=self._on_api_key_submit,
            on_cancel=self._on_login_cancel,
        )
        popup.focus()

    def _on_api_key_submit(self, key: str) -> None:
        """Handle API key submission"""
        self._status_checker.user_key = key
        self._perform_startup_check()

    def _on_login_cancel(self) -> None:
        """Handle login cancellation"""
        # Continue with limited features
        self._status_indicator.configure(
            text="● No API Key",
            text_color=THEME["warning"],
        )
        self._token_label.configure(text="N/A")

    def _on_popup_dismiss(self) -> None:
        """Handle popup dismissal"""
        logger.info("User dismissed subscription popup")

    def _navigate(self, page: str) -> None:
        """Navigate to a different page"""
        logger.info(f"Navigate to: {page}")
        # TODO: Implement page switching

    def _open_billing(self) -> None:
        """Open billing page in browser"""
        webbrowser.open(ENDPOINTS["billing"])

    def _run_vibe_check(self) -> None:
        """Run a vibe check"""
        logger.info("Starting vibe check...")
        # TODO: Implement vibe check

    def _sync_agents(self) -> None:
        """Sync all connected agents"""
        logger.info("Syncing agents...")
        # TODO: Implement agent sync
