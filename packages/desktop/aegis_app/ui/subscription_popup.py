"""
Aegis Subscription Popup - Displayed when free trial expires
"""
import webbrowser
from typing import Callable, Optional

import customtkinter as ctk

from aegis_app.config import ENDPOINTS, POPUP_SIZE, THEME


class SubscriptionPopup(ctk.CTkToplevel):
    """
    High-quality popup window for expired subscription.
    Features:
    - Modern dark glassmorphic design
    - Animated logo
    - Clear messaging
    - Large "Go to Web UI" button
    """

    def __init__(
        self,
        parent: Optional[ctk.CTk] = None,
        on_upgrade: Optional[Callable[[], None]] = None,
        on_dismiss: Optional[Callable[[], None]] = None,
        message: str = "Your free trial has expired",
    ):
        super().__init__(parent)

        self._on_upgrade = on_upgrade
        self._on_dismiss = on_dismiss

        # ── Window Configuration ──────────────────────────────────────────
        self.title("Aegis - Subscription Required")
        self.geometry(f"{POPUP_SIZE[0]}x{POPUP_SIZE[1]}")
        self.resizable(False, False)
        self.configure(fg_color=THEME["bg_dark"])

        # Center on screen
        self.update_idletasks()
        x = (self.winfo_screenwidth() - POPUP_SIZE[0]) // 2
        y = (self.winfo_screenheight() - POPUP_SIZE[1]) // 2
        self.geometry(f"+{x}+{y}")

        # Make modal
        self.transient(parent)
        self.grab_set()

        # Bring to front
        self.lift()
        self.attributes("-topmost", True)
        self.focus_force()

        # ── Build UI ──────────────────────────────────────────────────────
        self._build_ui(message)

        # Handle window close
        self.protocol("WM_DELETE_WINDOW", self._on_close)

    def _build_ui(self, message: str) -> None:
        """Construct the popup UI"""

        # Main container with padding
        container = ctk.CTkFrame(
            self,
            fg_color=THEME["bg_surface"],
            corner_radius=16,
            border_width=1,
            border_color=THEME["border"],
        )
        container.pack(fill="both", expand=True, padx=20, pady=20)

        # ── Logo Section ──────────────────────────────────────────────────
        logo_frame = ctk.CTkFrame(container, fg_color="transparent")
        logo_frame.pack(pady=(30, 20))

        # Hexagon icon (using text, could be replaced with image)
        logo_label = ctk.CTkLabel(
            logo_frame,
            text="⬡",
            font=ctk.CTkFont(size=48),
            text_color=THEME["error"],
        )
        logo_label.pack()

        # Animate pulse effect
        self._animate_logo(logo_label)

        # ── Title ─────────────────────────────────────────────────────────
        title_label = ctk.CTkLabel(
            container,
            text="FREE VERSION EXPIRED",
            font=ctk.CTkFont(family="Segoe UI", size=18, weight="bold"),
            text_color=THEME["text"],
        )
        title_label.pack(pady=(10, 8))

        # ── Message ───────────────────────────────────────────────────────
        message_label = ctk.CTkLabel(
            container,
            text=message,
            font=ctk.CTkFont(size=13),
            text_color=THEME["text_dim"],
            wraplength=380,
        )
        message_label.pack(pady=(0, 5))

        # Subtext
        subtext_label = ctk.CTkLabel(
            container,
            text="Upgrade to Pro for unlimited access to all features.",
            font=ctk.CTkFont(size=12),
            text_color=THEME["text_dim"],
        )
        subtext_label.pack(pady=(0, 25))

        # ── Upgrade Button ────────────────────────────────────────────────
        upgrade_btn = ctk.CTkButton(
            container,
            text="Go to Web UI",
            font=ctk.CTkFont(size=15, weight="bold"),
            fg_color=THEME["accent"],
            hover_color=THEME["accent_hover"],
            text_color="#FFFFFF",
            corner_radius=10,
            height=50,
            width=280,
            command=self._handle_upgrade,
        )
        upgrade_btn.pack(pady=(0, 12))

        # Arrow indicator
        arrow_label = ctk.CTkLabel(
            container,
            text="Opens aegissolutions.co.uk/billing in your browser",
            font=ctk.CTkFont(size=10),
            text_color=THEME["text_dim"],
        )
        arrow_label.pack(pady=(0, 20))

        # ── Dismiss Link ──────────────────────────────────────────────────
        dismiss_btn = ctk.CTkButton(
            container,
            text="Continue with limited features",
            font=ctk.CTkFont(size=11),
            fg_color="transparent",
            hover_color=THEME["bg_card"],
            text_color=THEME["text_dim"],
            corner_radius=6,
            height=32,
            command=self._handle_dismiss,
        )
        dismiss_btn.pack(pady=(0, 10))

    def _animate_logo(self, label: ctk.CTkLabel, step: int = 0) -> None:
        """Pulse animation for the logo"""
        # Alternate between normal and dimmed
        colors = [THEME["error"], "#CC2F26", THEME["error"]]
        color = colors[step % len(colors)]
        label.configure(text_color=color)

        # Schedule next frame
        self.after(800, lambda: self._animate_logo(label, step + 1))

    def _handle_upgrade(self) -> None:
        """Open billing page in browser"""
        webbrowser.open(ENDPOINTS["billing"])
        if self._on_upgrade:
            self._on_upgrade()
        self.destroy()

    def _handle_dismiss(self) -> None:
        """Close popup and continue with limited features"""
        if self._on_dismiss:
            self._on_dismiss()
        self.destroy()

    def _on_close(self) -> None:
        """Handle window close button"""
        self._handle_dismiss()


class LoginPopup(ctk.CTkToplevel):
    """
    Popup for entering API key / logging in.
    """

    def __init__(
        self,
        parent: Optional[ctk.CTk] = None,
        on_submit: Optional[Callable[[str], None]] = None,
        on_cancel: Optional[Callable[[], None]] = None,
    ):
        super().__init__(parent)

        self._on_submit = on_submit
        self._on_cancel = on_cancel

        # ── Window Configuration ──────────────────────────────────────────
        self.title("Aegis - Enter API Key")
        self.geometry("420x300")
        self.resizable(False, False)
        self.configure(fg_color=THEME["bg_dark"])

        # Center on screen
        self.update_idletasks()
        x = (self.winfo_screenwidth() - 420) // 2
        y = (self.winfo_screenheight() - 300) // 2
        self.geometry(f"+{x}+{y}")

        # Make modal
        self.transient(parent)
        self.grab_set()
        self.lift()
        self.focus_force()

        self._build_ui()
        self.protocol("WM_DELETE_WINDOW", self._handle_cancel)

    def _build_ui(self) -> None:
        """Build the login UI"""
        container = ctk.CTkFrame(
            self,
            fg_color=THEME["bg_surface"],
            corner_radius=16,
            border_width=1,
            border_color=THEME["border"],
        )
        container.pack(fill="both", expand=True, padx=20, pady=20)

        # Logo
        logo_label = ctk.CTkLabel(
            container,
            text="⬡ AEGIS",
            font=ctk.CTkFont(size=20, weight="bold"),
            text_color=THEME["accent"],
        )
        logo_label.pack(pady=(25, 20))

        # Title
        title_label = ctk.CTkLabel(
            container,
            text="Enter Your API Key",
            font=ctk.CTkFont(size=14, weight="bold"),
            text_color=THEME["text"],
        )
        title_label.pack(pady=(0, 5))

        # Subtitle
        subtitle_label = ctk.CTkLabel(
            container,
            text="Find your key at aegissolutions.co.uk/dashboard",
            font=ctk.CTkFont(size=11),
            text_color=THEME["text_dim"],
        )
        subtitle_label.pack(pady=(0, 20))

        # API Key Entry
        self._key_entry = ctk.CTkEntry(
            container,
            width=320,
            height=42,
            placeholder_text="aegis_xxxxxxxxxxxxxxxxxxxxx",
            font=ctk.CTkFont(family="Consolas", size=12),
            fg_color=THEME["bg_card"],
            border_color=THEME["border"],
            text_color=THEME["text"],
        )
        self._key_entry.pack(pady=(0, 20))
        self._key_entry.focus()

        # Submit Button
        submit_btn = ctk.CTkButton(
            container,
            text="Activate",
            font=ctk.CTkFont(size=13, weight="bold"),
            fg_color=THEME["accent"],
            hover_color=THEME["accent_hover"],
            text_color="#FFFFFF",
            corner_radius=8,
            height=40,
            width=200,
            command=self._handle_submit,
        )
        submit_btn.pack(pady=(0, 10))

        # Get Key Link
        get_key_btn = ctk.CTkButton(
            container,
            text="Get an API key",
            font=ctk.CTkFont(size=11),
            fg_color="transparent",
            hover_color=THEME["bg_card"],
            text_color=THEME["accent"],
            corner_radius=6,
            height=28,
            command=lambda: webbrowser.open(ENDPOINTS["dashboard"]),
        )
        get_key_btn.pack()

        # Bind Enter key
        self._key_entry.bind("<Return>", lambda e: self._handle_submit())

    def _handle_submit(self) -> None:
        """Submit the API key"""
        key = self._key_entry.get().strip()
        if key and self._on_submit:
            self._on_submit(key)
        self.destroy()

    def _handle_cancel(self) -> None:
        """Cancel login"""
        if self._on_cancel:
            self._on_cancel()
        self.destroy()
