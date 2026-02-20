# Aegis — Universal Agentic Bridge
## Context for Claude Code (read this first in every session)

---

## What This Is

**Aegis** is a commercial developer tool that acts as a real-time context bridge between multiple AI coding agents (Cursor, Claude Code, Gemini CLI, etc.). When two AI agents are working on the same codebase simultaneously, they drift out of sync. Aegis prevents that.

**Product pillars:**
- `aegis relay` — WebSocket server (ws://localhost:7734) that syncs context across all connected agents
- `aegis watch` — File watcher that detects agent activity and broadcasts changes
- `aegis verify` — Token Sentry: checks subscription status before allowing vibe checks
- `aegis upgrade` — CLI command to open billing in browser
- Desktop HUD — Electron-style floating overlay showing live agent status
- Web portal — Marketing site + auth + billing dashboard
- Python desktop app — CustomTkinter GUI (packages/desktop/)
- FastAPI portal — Python backend for subscription management (packages/portal/)

**Business model:** Freemium. 5,000 free tokens, then $20/mo Pro or $550 lifetime Founder's License.

---

## Monorepo Structure

```
VIBE-CODE/
├── src/                          # Core TypeScript CLI + relay
│   ├── cli/
│   │   ├── index.ts              # CLI entry, registers all commands
│   │   └── commands/
│   │       ├── verify.ts         # Token Sentry check → POST /api/verify
│   │       └── upgrade.ts        # Opens billing URL, shows token balance
│   ├── core/
│   │   ├── AgentDetector.ts      # Detects Cursor/Claude/Gemini processes
│   │   ├── RelayManager.ts       # Manages WebSocket connections
│   │   ├── StateManager.ts       # Shared state store
│   │   └── Watcher.ts            # File system watcher (chokidar)
│   ├── relay/
│   │   └── WebSocketRelay.ts     # WS server, broadcastTokenBalance(), broadcastTokenExpired()
│   ├── brain/
│   │   └── OpenAIBridge.ts       # OpenAI API integration
│   ├── guard/
│   │   ├── LogicGuard.ts         # Diff conflict detection
│   │   └── VibeChecker.ts        # Playwright screenshot + vision AI
│   ├── wallet/
│   │   └── StripeManager.ts      # Stripe payment logic
│   └── types/index.ts
├── packages/
│   ├── web/                      # Next.js 14 App Router — marketing + dashboard
│   │   ├── src/app/
│   │   │   ├── page.tsx          # Landing page (HeroSection, FeaturesGrid, PricingPreview, Footer)
│   │   │   ├── layout.tsx        # ClerkProvider (conditional on key), Inter font
│   │   │   ├── globals.css       # Design system: --bg, --surface, --border, --accent (#6366F1)
│   │   │   └── api/              # Route handlers (checkout, tokens, webhooks)
│   │   ├── src/components/
│   │   │   ├── HeroSection.tsx   # GSAP entrance animation, terminal product viz
│   │   │   ├── FeaturesGrid.tsx  # GSAP ScrollTrigger, Lucide icons, gap-px grid
│   │   │   ├── PricingPreview.tsx # GSAP ScrollTrigger, white/dark card split
│   │   │   └── Footer.tsx        # 3-column link layout
│   │   ├── src/middleware.ts     # clerkMiddleware() — never use authMiddleware()
│   │   └── .env.local           # Clerk keys, Stripe keys (gitignored)
│   ├── hud/                     # Electron HUD overlay (React + Vite)
│   │   └── src/renderer/
│   │       ├── App.tsx           # trialExpired state, TrialExpiredOverlay
│   │       └── index.css         # trial-overlay styles, pulse-red animation
│   ├── desktop/                 # Python CustomTkinter desktop app
│   │   ├── main.py               # Entry: setup_logging → configure_theme → MainWindow
│   │   ├── aegis_app/
│   │   │   ├── config.py         # API_BASE_URL, ENDPOINTS, THEME colours, POPUP_SIZE
│   │   │   ├── core/status_checker.py  # SubscriptionStatus dataclass, check_status_async()
│   │   │   └── ui/
│   │   │       ├── main_window.py      # Sidebar nav, agent cards, activity feed
│   │   │       └── subscription_popup.py # "FREE VERSION EXPIRED" modal, LoginPopup
│   │   └── aegis.spec           # PyInstaller: console=False, onefile, macOS bundle
│   └── portal/                  # FastAPI Python backend
│       └── app/
│           ├── main.py           # FastAPI app, CORS, router registration
│           ├── api/
│           │   ├── check_status.py  # GET /api/check_status (X-API-Key header → 402 if expired)
│           │   ├── checkout.py      # POST /api/checkout (Stripe session)
│           │   ├── webhook.py       # POST /api/webhook (Stripe events)
│           │   └── tokens.py        # Token spend/balance endpoints
│           ├── services/
│           │   ├── stripe_service.py  # checkout_session, handle_checkout_completed
│           │   └── token_service.py   # check_access(), spend_tokens()
│           └── models/user.py        # User, Subscription, TokenLedger, ApiKey (SQLAlchemy)
```

---

## Design System

**Dark theme — Framer-style (clean, minimal, NOT glowy AI aesthetic):**

```css
--bg: #09090B          /* near-black background */
--surface: #111113     /* card backgrounds */
--surface-hover: #18181B
--border: #27272A      /* clean 1px borders, no glassmorphism */
--text: #FAFAFA
--text-muted: #A1A1AA
--text-subtle: #52525B
--accent: #6366F1      /* indigo, used sparingly */
--success: #22C55E
```

**Rules:**
- NO glassmorphism blur, NO glow orbs, NO rainbow gradients
- Lucide React for all icons (no emojis as icons)
- GSAP + useGSAP for all animations, ScrollTrigger for scroll effects
- `gap-px bg-[var(--border)]` pattern for grid dividers
- `.btn-primary` = white fill, `.btn-secondary` = ghost with border

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Web frontend | Next.js 14 App Router, TypeScript, Tailwind CSS |
| Auth | Clerk v6 (`clerkMiddleware()` — NEVER `authMiddleware()`) |
| Animations | GSAP 3 + @gsap/react (useGSAP hook) |
| Icons | Lucide React |
| Payments | Stripe (keys in .env.local, not yet fully wired) |
| CLI | Node.js + Commander + TypeScript |
| HUD | Electron + React + Vite |
| Desktop | Python CustomTkinter + PyInstaller |
| Backend | FastAPI + SQLAlchemy (async) + PostgreSQL |
| File watching | chokidar |
| Browser automation | Playwright |
| AI | OpenAI API |

---

## Environment Variables

### packages/web/.env.local (gitignored)
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_Y29vbC1jb3ctNjcuY2xlcmsuYWNjb3VudHMuZGV2JA   ← SET
CLERK_SECRET_KEY=sk_test_4EVy8pAWTgMY5gfRFZYGxNqaLUhsqNAWCLANapIb71               ← SET
STRIPE_SECRET_KEY=                                                                    ← MISSING
STRIPE_WEBHOOK_SECRET=                                                                ← MISSING
STRIPE_PRO_PRICE_ID=                                                                  ← MISSING
STRIPE_LIFETIME_PRICE_ID=                                                             ← MISSING
NEXT_PUBLIC_APP_URL=http://localhost:3000
OPENAI_API_KEY=                                                                       ← in .aegis/.env
```

### ~/.claude/.env (MCP keys — not in repo)
```
TWENTYFIRST_API_KEY=3a21ff...   ← SET
SUPABASE_ACCESS_TOKEN=sb_secret_KCKU4b...   ← SET
VERCEL_TOKEN=vcp_3G8Y...   ← SET
NOTION_API_KEY=secret_7Chj...   ← SET
PENPOT_BASE_URL=https://design.penpot.app   ← SET
FIGMA_ACCESS_TOKEN=   ← MISSING
STRIPE_SECRET_KEY=   ← MISSING (real key needed)
GITHUB_TOKEN=   ← MISSING
BRAVE_API_KEY=   ← MISSING
GOOGLE_AI_API_KEY=   ← MISSING
LINEAR_API_KEY=   ← MISSING
PENPOT_ACCESS_TOKEN=   ← MISSING
DATABASE_URL=   ← MISSING
```

---

## Installed MCPs (in ~/.claude/settings.json)

### Working now (no key needed):
- `playwright` — browse, click, screenshot any website
- `context7` — up-to-date docs for any library
- `filesystem` — full read/write on /home/user
- `memory` — persistent knowledge graph
- `sequential-thinking` — step-by-step reasoning
- `chrome-devtools` — DOM, network, console inspection
- `code-runner` — execute JS/TS/Python snippets
- `git` — commit, diff, log, branch
- `ux-ui` — design patterns and recipes
- `everything` — MCP test server

### Needs API key to activate:
- `21st-magic` — 21st.dev UI component generation (KEY SET ✓)
- `supabase` — Supabase management (KEY SET ✓)
- `vercel` — deploy and manage (KEY SET ✓)
- `notion` — Notion workspace (KEY SET ✓)
- `figma` — Figma designs (missing key)
- `stripe` — Stripe API (missing real key)
- `github` — GitHub API (missing key)
- `brave-search` — web search (missing key)
- `image-gen` — Gemini image generation (missing key)
- `penpot` — Penpot designs (missing access token)
- `linear` — Linear issues (missing key)
- `postgres` — direct SQL (missing DATABASE_URL)
- `google-workspace` — Gmail/Drive/Docs (missing OAuth)

---

## Available Slash Commands (.claude/commands/)

Animation & 3D: `gsap`, `framer`, `three`, `lottie`, `video-hero`
Marketing: `landing`, `waitlist`, `pricing`, `social-proof`, `onboarding`
Content: `blog`, `changelog`, `og-image`, `analytics`, `charts`
Product: `notifications`, `upload`, `cookie-banner`, `seo`, `responsive`
Dev: `component`, `page`, `api`, `hook`, `db`, `fix`, `review`
Deploy: `deploy`, `env`, `auth-guard`, `stripe-product`
Integrations: `ai`, `supabase`, `shadcn`, `trpc`, `resend`, `remotion`

---

## What Still Needs Building

### High priority (needed to sell):
1. `/billing` page — real Stripe checkout (need STRIPE_SECRET_KEY + price IDs)
2. `/dashboard` — logged-in user page showing token balance, usage graph, API key
3. `/sign-in` and `/sign-up` — Clerk hosted pages already handle this at clerk routes
4. Mobile nav — hamburger menu for <768px
5. `/changelog` page — product updates

### Nice to have:
- `/blog` — content marketing
- `/docs` — developer documentation
- OG image generation for social sharing
- Email onboarding sequence (Resend)
- Cookie consent banner (GDPR)

---

## How to Run

```bash
# Web (Next.js) — runs on http://localhost:3000
cd packages/web && npm run dev

# CLI relay
npm run build && node dist/cli/index.js watch

# Portal (FastAPI) — runs on http://localhost:8000
cd packages/portal && uvicorn app.main:app --reload

# Desktop app
cd packages/desktop && python main.py
```

---

## Git

Branch: `claude/iris-aegis-architecture-SIcFr`
Remote: `origin`
Push: `git push -u origin claude/iris-aegis-architecture-SIcFr`

Recent commits:
- `7589a32` — Professional redesign + GSAP + 16 skills + 9 MCPs
- `0867beb` — 7 general tool skills (remotion, framer, supabase, etc.)
- `58a2396` — 14 project-specific skills
- `395b8dc` — Clerk v6.38.0 upgrade
- `356a585` — Clerk middleware

---

## Key Decisions Made

1. **Clerk auth** — Always use `clerkMiddleware()` from `@clerk/nextjs/server`. Never `authMiddleware()` (deprecated). ClerkProvider is conditional (won't crash without key).
2. **No glassmorphism** — Removed entirely. Use `border: 1px solid var(--border)` instead.
3. **GSAP not Framer Motion** — GSAP for all animations going forward. Framer Motion is installed but being phased out.
4. **Python desktop** — PyInstaller `--noconsole --onefile` for distribution. Entry point is `packages/desktop/main.py`.
5. **Token Sentry** — `aegis verify` calls `POST /api/verify` with `AEGIS_API_KEY`. Returns 402 → process.exit(1) with "TRIAL EXPIRED" box.
6. **Design accent colour** — `#6366F1` (Tailwind indigo-500). NOT the old `#7C6AFF`.
