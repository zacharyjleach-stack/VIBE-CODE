# ⬡ AEGIS — Universal Agentic Bridge & Governance Layer

> The Ghost in the Machine that synchronizes your entire AI coding team.

---

## What is Aegis?

Aegis connects **Cursor**, **Claude Code**, and **Gemini** into a single, cohesive AI team. When any agent makes a change, Aegis intercepts it, analyzes it with GPT-4o, and instantly whispers context to all other agents so they never hallucinate conflicting code.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     AEGIS ECOSYSTEM                              │
├──────────────────┬──────────────────┬───────────────────────────┤
│   packages/web   │  packages/hud    │    packages/nexus         │
│   Marketing +    │  Desktop Overlay │    Visual Command         │
│   Dashboard      │  (Electron)      │    Center (Next.js)       │
│   Port: 3000     │  Always-on-top   │    Port: 3737             │
├──────────────────┴──────────────────┴───────────────────────────┤
│                       WebSocket Relay                            │
│                     ws://localhost:7734                          │
├─────────────────────────────────────────────────────────────────┤
│   src/cli        │  src/core        │    src/brain              │
│   aegis init     │  Watcher         │    OpenAI Bridge          │
│   aegis watch    │  RelayManager    │    Diff Analyzer          │
│   aegis verify   │  StateManager    │    Instruction Gen        │
├──────────────────┴──────────────────┴───────────────────────────┤
│                    PostgreSQL + Prisma                           │
│        Users · Subscriptions · TokenLedger · Projects            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Five-Layer System

### 1. ⬡ The CLI (`src/cli`)
```bash
aegis init      # Detect agents, scaffold AEGIS_STATE.json
aegis watch     # Start relay - monitor changes in real-time
aegis verify    # Playwright + GPT-4o Vision vibe check
aegis status    # View agent sync dashboard
```

### 2. 🖥️ The HUD (`packages/hud`) — Electron Desktop Overlay
A semi-transparent sidebar that lives on your screen:
- **Live Pulse**: Blue = Claude thinking, Green = Cursor writing, Orange = Gemini
- **A2A Chat**: See agent-to-agent messages in real-time
- **Gas Gauge**: Live API token spend tracker
- **Picture-in-Picture**: Vibe check results pop up, linger 5s, disappear

### 3. 🌐 The Nexus (`packages/nexus`) — Visual Command Center
Opens at `http://localhost:3737`:
- **Agent Node Graph**: Interactive React Flow graph showing agents as glowing nodes
- **Memory Timeline**: Scrub back 20 minutes to see exact project state
- **Token Tracker**: Real-time spend gauge
- **Activity Feed**: Live stream of all agent events

### 4. 📄 Validation Reports (`packages/report`)
Every `aegis verify` generates a shareable URL:
- **Vibe Score**: 0-100 AI assessment of your UI
- **Code Diff**: Color-coded changes
- **Screenshot**: Visual proof
- **Share to X**: One-click "Aegis Verified" badge post

### 5. 🌍 The Web (`packages/web`) — Commercial Hub
The marketing site, dashboard, and Token Sentry:
- **Landing Page**: High-conversion "Download Aegis" page
- **Dashboard**: Real-time Token Tank, usage history, API keys
- **Billing**: Stripe-powered pricing (Pro $20/mo, Lifetime $550)
- **Token Sentry API**: `/api/verify` endpoint for CLI/HUD access control

---

## Token Sentry System

Every new account starts with **5,000 free tokens**.

| Action | Token Cost |
|--------|------------|
| Vibe Check | 100 |
| Context Sync | 10 |
| Agent Relay | 5 |

When tokens run out, CLI and HUD show "Trial Expired" with upgrade link.

**Lifetime License** = Unlimited tokens forever.

---

## Getting Started

```bash
# Clone and install
git clone https://github.com/aegis-dev/aegis.git
cd aegis
npm install

# Setup database
npx prisma generate
npx prisma db push

# Start the web (marketing + dashboard)
npm run web       # http://localhost:3000

# Start the nexus (visual command center)
npm run nexus     # http://localhost:3737

# In your project directory
aegis init
aegis watch
```

---

## Environment Variables

```env
# Database
DATABASE_URL="postgresql://..."

# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_LIFETIME_PRICE_ID=price_...

# OpenAI
OPENAI_API_KEY=sk-...

# App
NEXT_PUBLIC_APP_URL=https://aegis.dev
```

---

## The Stack

| Layer | Tech |
|-------|------|
| CLI | Commander.js + Node.js + TypeScript |
| File Watching | Chokidar |
| AI Analysis | OpenAI GPT-4o |
| Visual Check | Playwright + GPT-4o Vision |
| Desktop HUD | Electron + React + Vite |
| Nexus Dashboard | Next.js 14 + React Flow + Framer Motion |
| Marketing Site | Next.js 14 + Tailwind + Clerk Auth |
| Agent Sync | WebSocket (ws://localhost:7734) |
| Database | PostgreSQL + Prisma |
| Payments | Stripe (subscriptions + one-time) |

---

## Pricing

| Tier | Price | Tokens | Features |
|------|-------|--------|----------|
| **Free** | $0 | 5,000 | Local sync, basic vibe checks |
| **Pro** | $20/mo | Unlimited | Full access, Desktop HUD, Nexus |
| **Lifetime** | $550 once | ∞ Forever | Everything, early access, Discord |

---

## Aesthetic

- **Dark mode always**: Deep charcoal `#0A0A0C`
- **Neon accents**:
  - Purple `#7C6AFF` (Aegis/Claude)
  - Green `#00FF88` (Cursor)
  - Orange `#FF6B35` (Gemini)
  - Cyan `#00D4FF` (Highlights)
- **Typography**: Inter + JetBrains Mono
- **Glassmorphism**: `backdrop-filter: blur(20px)` throughout

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/verify` | POST | Token Sentry - spend tokens |
| `/api/verify` | GET | Check access without spending |
| `/api/checkout` | POST | Create Stripe checkout session |
| `/api/webhook` | POST | Stripe webhook handler |
| `/api/tokens` | GET | Get user's token balance + history |

---

*Built by Aegis. Verified by Aegis.*
