# ⬡ AEGIS — Universal Agentic Bridge & Governance Layer

> The Ghost in the Machine that synchronizes your entire AI coding team.

---

## What is Aegis?

Aegis connects **Cursor**, **Claude Code**, and **Gemini** into a single, cohesive AI team. When any agent makes a change, Aegis intercepts it, analyzes it with GPT-4o, and instantly whispers context to all other agents so they never hallucinate conflicting code.

---

## Three-Layer Architecture

### 1. ⬡ The CLI (`packages/cli`)
```bash
aegis init      # Detect all agents, scaffold AEGIS_STATE.json
aegis watch     # Start the relay - monitor all changes in real-time
aegis verify    # Playwright + GPT-4o Vision vibe check
aegis status    # View agent sync dashboard
```

### 2. 🖥️ The HUD (`packages/hud`) — Electron Desktop Overlay
A semi-transparent sidebar that lives on your screen:
- **Live Pulse**: Blue = Claude thinking, Green = Cursor writing, Orange = Gemini
- **A2A Chat**: See agent-to-agent messages in real-time
- **Gas Gauge**: Live API token spend tracker
- **Picture-in-Picture**: Vibe check results pop up, linger 5 seconds, disappear

### 3. 🌐 The Nexus (`packages/nexus`) — Visual Command Center
Opens at `http://localhost:3737`:
- **Agent Node Graph**: Interactive React Flow graph showing agents as glowing nodes
- **Memory Timeline**: Scrub back 20 minutes to see exact project state at any point
- **Token Tracker**: Real-time spend gauge so you're never surprised by a bill
- **Activity Feed**: Live stream of all agent events

### 4. 📄 Validation Reports (`packages/report`)
Every `aegis verify` generates a shareable URL:
- **Vibe Score**: 0-100 AI assessment of your UI
- **Code Diff**: Color-coded changes
- **Screenshot**: Visual proof
- **Share to X**: One-click "Aegis Verified" badge post

---

## Getting Started

```bash
# Install all packages
npm install

# Initialize in your project
aegis init

# Start everything
npm run nexus     # http://localhost:3737
npm run hud       # Electron overlay (requires display)

# In your project directory
aegis watch       # Start the relay
```

---

## The Stack

| Layer | Tech |
|-------|------|
| CLI | Commander.js + Node.js |
| File Watching | Chokidar |
| AI Analysis | OpenAI GPT-4o |
| Visual Check | Playwright + GPT-4o Vision |
| Desktop HUD | Electron + React + Vite |
| Nexus Dashboard | Next.js + React Flow + Framer Motion |
| Validation Report | Next.js (shareable SSR pages) |
| Agent Sync | WebSocket (ws://localhost:7734) |
| Database | SQLite + Prisma |
| Payments | Stripe (metered + subscription) |

---

## Pricing

| Tier | Price | Features |
|------|-------|---------|
| Free | £0 | 1 project, local sync, 10 chats/mo |
| Starter | £9/mo | 1,000 chats, 10 deploys |
| Pro | £20/mo | 3,000 chats, 50 deploys, Validation Reports |
| Unlimited | £80/mo | Unlimited everything, 500 deploys |

---

## Aesthetic

- **Dark mode always**: Deep charcoal `#0A0A0C` background
- **Neon accents**: Purple `#7C6AFF` (Claude), Green `#00FF88` (Cursor), Orange `#FF6B35` (Gemini), Cyan `#00D4FF` (Aegis)
- **Typography**: JetBrains Mono — feels like a developer tool
- **Glassmorphism**: `backdrop-filter: blur(20px)` throughout

---

*Built by Aegis. Verified by Aegis.*
