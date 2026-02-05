# IRIS & AEGIS MASTER PLAN

## 1. Stack
- Frontend: Next.js 14, Tailwind, Framer Motion (Iris).
- Backend: Node.js, Express, Redis, WebSocket (Aegis).

## 2. Architecture
- `server/src/swarm/`: Agent logic (Architect, Builder).
- `server/src/services/`: External tools (GitHub, OpenAI).
- `server/src/config/`: Environment & configuration loading.
- `client/lib/`: Shared utilities (cn helper).

## 3. Security
- API Keys managed via .env (never committed).
- `.claudeignore` blocks expensive files from context.

## 4. Monetization Logic (Subscription Model)
- **Currency:** GBP (£).
- **Model:** Fixed subscription pricing, no token counting.
- **Tiers:**
  - **Free:** £0/month (10 requests/day, 1 agent).
  - **Starter:** £18/month (100 requests/day, 4 agents).
  - **Pro:** £80/month (1,000 requests/day, 16 agents).
  - **Ultra:** £170/month (Unlimited requests, Unlimited agents).
- **Gating:** Daily request limits enforced. Returns 402 when limit exceeded.
- **Protection:** Prevents API key abuse through tier-based feature access and daily quotas.

---

## BUILD LOG

### Session 1 — Full Ecosystem Init
**Files Created:**
- `.claudeignore` — Budget firewall (blocks node_modules, .next, dist, .env, etc.)
- `PROJECT_DNA.md` — This file. The brain.
- `client/lib/utils.ts` — `cn()` Tailwind merge helper.
- `server/src/swarm/Architect.ts` — Methods: `analyzeRepo`, `planFeature`.
- `server/src/swarm/Builder.ts` — Methods: `writeCode`, `fixError`.
- `server/src/swarm/AgentProtocol.ts` — JSON interfaces: `AgentMessage`, `AgentTask`, `AgentResult`.
- `server/src/config/env.ts` — Loads dotenv, exports `Config`, warns on missing keys.
- `server/src/services/GitHubService.ts` — `createPullRequest(title, branch)`, checks for token.
- `server/src/index.ts` — Express server, boots with `[Online/Offline Mode]` based on keys.
- `.env.example` — Template: ANTHROPIC_API_KEY, OPENAI_API_KEY, GITHUB_TOKEN, REDIS_URL.
- `.env` — Local copy (empty keys, gitignored).

**Packages Installed:**
- `framer-motion`, `clsx`, `tailwind-merge`, `lucide-react`, `dotenv`

**Status:** Aegis boots in Offline Mode. Ready for API key injection + frontend wiring.

### Session 1.1 — First Boot
- Ran `npx tsx server/src/index.ts` — server started on port 4000.
- `/health` returns `{"status":"Aegis Systems Online","mode":"Online"}`.
- GitHub token auto-detected from environment (Codespace).
- ANTHROPIC_API_KEY & OPENAI_API_KEY still empty — warnings logged as expected.

**Status:** Aegis is live. Backend confirmed working. Ready for frontend wiring or swarm logic.

### Session 1.2 — Iris Boot Test
- Ran `npx next dev -p 3000` inside `client/iris/`.
- Next.js 14.2.35 compiled successfully (3874 modules, 19s).
- `http://localhost:3000` returns HTTP 200.
- Minor warnings: `themeColor`/`viewport` metadata should move to `viewport` export (non-breaking).

**Status:** Both Iris (:3000) and Aegis (:4000) are live. Full stack confirmed running.

### Session 1.3 — Full Backend Wiring + Frontend Reconnection
**Problem:** Iris frontend was intact but rendered blank — Aegis only had `/health`, missing all routes Iris needs.

**Aegis Rebuilt (`server/src/index.ts`):**
- Moved to port 8080 (matches Iris expectations).
- Added Socket.IO for real-time WebSocket communication.
- Routes added with mock responses:
  - `GET /health` — operational status
  - `POST /sessions` / `GET /sessions/:id` / `PATCH /sessions/:id` — session CRUD
  - `GET /agents/status` — 16 agent slots
  - `POST /handoff` — triggers simulated build job (agents animate over 15s)
  - `GET /jobs/:id` / `POST /jobs/:id/cancel` — job management
  - `POST /visualize/diagram` — generates Mermaid diagram from tech stack
- Job simulation: 5 stages over 15s, broadcasts progress via WebSocket, animates 3 agents.
- Installed: `socket.io`, `cors`.

**Iris Proxy (`client/iris/src/app/api/aegis/[...path]/route.ts`):**
- Next.js catch-all route proxies `/api/aegis/*` -> `http://localhost:8080/*`.
- Supports GET, POST, PATCH.
- Returns 502 with clear error if Aegis unreachable.

**Iris `.env.local` Updated:**
- `NEXT_PUBLIC_AEGIS_API_URL=/api/aegis` (proxied)
- `NEXT_PUBLIC_AEGIS_WS_URL=ws://localhost:8080` (direct WebSocket)
- `AEGIS_INTERNAL_URL=http://localhost:8080` (server-side proxy target)

**Chat (`/api/chat`):**
- Already functional — gracefully returns fallback message when no LLM keys configured.
- Add `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` to `.env.local` for real AI responses.

**Status:** Full stack running. Iris (:3000) -> Proxy -> Aegis (:8080). WebSocket connected. Chat works (offline mode). Deploy button triggers animated swarm simulation.

### Session 1.4 — Swarm Command Routing + Integrations Panel

**Feature 1: Swarm Command Routing (ChatPanel.tsx)**
- Chat input now parses agent commands before sending to AI.
- Command patterns supported:
  - `1 build a login page` — assigns task to Agent #1
  - `@3 fix the navbar` — assigns task to Agent #3
  - `#5 write unit tests` — assigns task to Agent #5
  - `agent 7 refactor the API` — assigns task to Agent #7
  - `1-4 scaffold the frontend` — assigns same task to Agents #1 through #4
- Commands update agent status in real-time via WebSocket.
- Each agent simulates work for 5-15s then completes.
- System messages confirm assignment: "Agent #1 assigned: build a login page"
- Placeholder updated to hint at command syntax.

**Feature 2: Integrations Panel (IntegrationsPanel.tsx)**
- New tab "Integrations" added to VisualizationPanel (4th tab with link icon).
- Toggle switches for 6 services: GitHub, VS Code, Vercel, Docker, Redis, Supabase.
- Each card shows: icon, name, description, toggle, external link when connected.
- Connected count shown in header badge.
- Styled with glassmorphism matching Iris theme.

**Backend: Agent Command Endpoint (server/src/index.ts)**
- `POST /agents/command` — accepts `{ agentId: 1-16, task: string }`.
- Sets agent to "working" status, broadcasts via WebSocket.
- Simulates completion after 5-15s, broadcasts "success" status.

**Files Modified:**
- `client/iris/src/components/ChatPanel.tsx` — added parseSwarmCommand, dispatchSwarmCommand, range commands
- `client/iris/src/components/VisualizationPanel.tsx` — added Integrations tab + IntegrationsIcon
- `server/src/index.ts` — added POST /agents/command route

**Files Created:**
- `client/iris/src/components/IntegrationsPanel.tsx` — full integration toggle panel with 6 services

**Status:** Full stack live. Agents individually programmable via chat. Integrations panel with toggles ready for wiring.

### Session 2 — Subscription & Token Gating System

**Mission:** Prevent API key abuse by implementing usage limits and GBP-based pricing tiers.

**Monetization Added to DNA:**
- Currency: GBP (£)
- Tiers: Free (£0, 5k tokens), Starter (£18, 100k), Pro (£80, 1M), Ultra (£170, 5M)
- Gating: 402 Payment Required when usage exceeds limit

**Backend: UsageManager (`server/src/billing/UsageManager.ts`)**
- `TIERS` constant with all pricing/limit definitions
- Mock user state with tier, usage, resetDate
- `checkLimit(cost)`: Returns false if usage would exceed limit, increments usage if allowed
- `upgradeTier(tierName)`: Changes user tier
- `getUsagePercentage()`, `getRemainingTokens()`: Helper methods
- `resetUsage()`: For monthly billing cycles

**Backend: Token Gating Routes (`server/src/index.ts`)**
- `/handoff` now checks 100 token cost before starting job
- `/agents/command` checks 50 token cost per agent assignment
- Both return 402 error with upgrade message when limit exceeded
- New routes:
  - `GET /billing/usage` — current usage stats
  - `GET /billing/tiers` — all available plans
  - `POST /billing/upgrade` — mock subscription (changes tier)
  - `POST /billing/reset` — reset usage counter

**Frontend: Pricing Page (`client/iris/src/app/pricing/page.tsx`)**
- 4 glassmorphism cards (Free/Starter/Pro/Ultra)
- Color-coded: Gray, Blue, Purple (Featured), Gold
- Each shows: price, token limit, features list
- Subscribe buttons hit `/api/aegis/billing/upgrade`
- Framer Motion animations on load & hover

**Frontend: Usage Indicator (`client/iris/src/components/UsageIndicator.tsx`)**
- Live progress bar showing tokens consumed vs limit
- Color-coded: Green (safe), Amber (80%+ warning), Red (95%+ critical)
- Auto-polls usage every 30s
- Shows "Upgrade" link when critical
- Displays tier name, percentage, remaining tokens

**Files Created:**
- `server/src/billing/UsageManager.ts` — billing logic & tier definitions
- `client/iris/src/app/pricing/page.tsx` — pricing UI with 4 tiers
- `client/iris/src/components/UsageIndicator.tsx` — real-time usage widget

**Files Modified:**
- `PROJECT_DNA.md` — added Monetization Logic section
- `server/src/index.ts` — added UsageManager imports, token checks on AI routes, 4 billing endpoints

**Status:** Token gating active. All AI requests now cost tokens. Users hit 402 when limit exceeded. Pricing page live at `/pricing`. Ready for payment integration (Stripe/Paddle).

### Session 2.1 — Switch to Subscription Model

**Mission:** Replace token-based billing with simple subscription tiers (no token counting).

**Rationale:**
- Token counting creates anxiety ("How much will this cost?")
- Fixed pricing = predictable costs for users
- Simpler to understand and sell
- Daily limits reset automatically (no monthly tracking)

**Backend: UsageManager Refactor (`server/src/billing/UsageManager.ts`)**
- Removed: `tokenLimit`, `checkLimit()`, token counting
- Added: `requestsPerDay`, `maxAgents`, `integrations[]`, `aiModels[]`
- New methods:
  - `canMakeRequest()`: Checks daily limit (auto-resets at midnight)
  - `canUseAgents(count)`: Validates agent tier limit
  - `hasIntegration(name)`: Feature gating for integrations
  - `hasAIModel(name)`: Model access control
  - `getCurrentFeatures()`: Returns all tier features
- Tiers updated:
  - Free: 10/day, 1 agent, Haiku only
  - Starter: 100/day, 4 agents, Haiku + Sonnet, GitHub/VS Code
  - Pro: 1,000/day, 16 agents, All models, All integrations
  - Ultra: Unlimited everything

**Backend: API Route Updates (`server/src/index.ts`)**
- `/handoff`: Now checks `canMakeRequest()` instead of token cost
- `/agents/command`: Adds `canUseAgents()` check (403 if agent ID exceeds tier)
- `/billing/usage`: Returns `requestsToday`, `limit`, `features` (not tokens)
- `/billing/upgrade`: Returns subscription data, not token limits
- `/billing/reset`: Now resets daily usage (was monthly)

**Frontend: Pricing Page (`client/iris/src/app/pricing/page.tsx`)**
- Removed token counts from cards
- Added: Daily request limits + agent limits as primary metrics
- Footer: "No usage anxiety" messaging
- Infinity icon for Ultra tier

**Frontend: Usage Indicator (`client/iris/src/components/UsageIndicator.tsx`)**
- Shows "X / Y requests" instead of "X / Y tokens"
- Displays "Unlimited Requests" with infinity icon for Ultra tier
- Added agent limit badge at bottom
- Daily reset message instead of monthly

**Files Modified:**
- `server/src/billing/UsageManager.ts` — complete subscription rewrite
- `server/src/index.ts` — updated all gating logic + billing routes
- `client/iris/src/app/pricing/page.tsx` — subscription-focused UI
- `client/iris/src/components/UsageIndicator.tsx` — daily usage tracking
- `PROJECT_DNA.md` — updated monetization section

**Status:** Subscription model live. No token counting. Daily limits enforced. ULTRA tier = unlimited. Ready for Stripe/Paddle integration.
