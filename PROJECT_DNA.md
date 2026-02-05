# PROJECT DNA: Iris & Aegis

> **The Single Source of Truth.** Read this file before doing ANY work.

---

## 1. PRIME DIRECTIVE

**Iris & Aegis** is a dual-AI Vibe Coding Platform that rivals Cursor and Copilot.

- **Iris** = Creative visionary. Captures user intent, offers ideas, connects to integrations.
- **Aegis** = Execution powerhouse. 16-agent swarm that builds code from Iris's instructions.

**The user types ideas → Iris refines them → Aegis builds it.**

---

## 2. TECH STACK (Non-Negotiable)

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 (App Router), React 18, TypeScript |
| Styling | Tailwind CSS, Framer Motion |
| State | Zustand |
| Backend | Node.js, Express, TypeScript |
| Real-time | Socket.IO (WebSocket) |
| Cache | Redis |
| Diagrams | Mermaid.js |
| Containerization | Docker Compose |

---

## 3. DESIGN SYSTEM

### Theme: "Bento Box" + Glassmorphism

| Element | Iris (Left/Creative) | Aegis (Right/Execution) |
|---------|---------------------|------------------------|
| Primary Color | `#8B5CF6` (Purple) | `#06B6D4` (Cyan) |
| Secondary | `#A78BFA` | `#22D3EE` |
| Background | `#0F0A1F` (Deep purple-black) | `#0A1628` (Deep blue-black) |
| Accent | `#F472B6` (Pink) | `#10B981` (Green) |
| Font | Inter, system-ui | JetBrains Mono (terminal feel) |

### UI Rules
- Cards: `rounded-2xl` or `rounded-3xl`
- Glass effect: `bg-white/5 backdrop-blur-xl border border-white/10`
- Shadows: `shadow-2xl shadow-purple-500/10` (Iris) or `shadow-cyan-500/10` (Aegis)
- Grid layouts: Bento-style asymmetric grids
- Animations: Subtle, 300ms default, ease-out

---

## 4. FILE STRUCTURE

```
VIBE-CODE/
├── PROJECT_DNA.md          # THIS FILE - The truth
├── .claudeignore           # Block expensive files
├── package.json            # Monorepo root
├── docker-compose.yml      # Multi-service orchestration
│
├── client/iris/            # FRONTEND
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx           # Split-Gate landing
│   │   │   ├── layout.tsx         # Root layout
│   │   │   ├── globals.css        # Global styles
│   │   │   ├── iris/page.tsx      # Iris creative interface
│   │   │   ├── aegis/page.tsx     # Aegis command center
│   │   │   └── api/
│   │   │       └── chat/route.ts  # LLM chat endpoint
│   │   ├── components/
│   │   │   ├── ChatPanel.tsx      # Iris chat interface
│   │   │   ├── DeployButton.tsx   # Handoff to Aegis
│   │   │   ├── VisualizationPanel.tsx  # Agent swarm grid
│   │   │   └── SplitPane.tsx      # Resizable layout
│   │   ├── context/
│   │   │   └── NeuralContext.tsx  # Cross-page state sharing
│   │   ├── store/
│   │   │   └── vibeStore.ts       # Zustand state
│   │   ├── hooks/
│   │   │   └── useAegisConnection.ts  # WebSocket hook
│   │   └── lib/
│   │       └── api.ts             # API client
│   └── package.json
│
├── server/aegis/           # BACKEND
│   ├── src/
│   │   ├── index.ts               # Express + WebSocket server
│   │   ├── core/
│   │   │   ├── SwarmManager.ts    # 16 worker slot management
│   │   │   └── WorkerSlot.ts      # Agent abstraction
│   │   ├── services/
│   │   │   ├── MissionOrchestrator.ts  # Task decomposition
│   │   │   └── FileSystemManager.ts    # Workspace isolation
│   │   ├── routes/
│   │   │   ├── handoff.ts         # POST /api/handoff
│   │   │   └── status.ts          # GET /api/status/*
│   │   └── websocket/
│   │       └── ProgressEmitter.ts # Real-time events
│   └── package.json
│
└── shared/protocol/        # SHARED TYPES
    ├── src/
    │   ├── mission-brief.ts    # MissionBrief, VibeContext
    │   ├── agent-status.ts     # AgentStatus enum, SwarmState
    │   ├── api-contracts.ts    # HandoffRequest/Response
    │   └── events.ts           # Real-time event types
    └── package.json
```

---

## 5. DATA PROTOCOL

### VibeContext (Iris → Aegis handoff)
```typescript
interface VibeContext {
  userIntent: string;        // What the user wants to build
  techStack: {
    frontend?: string;
    backend?: string;
    database?: string;
    styling?: string;
  };
  constraints: string[];     // Budget, timeline, requirements
  mood: string;              // Creative direction
  confidenceScore: number;   // 0-100, how clear is the intent
}
```

### HandoffRequest (Frontend → Backend)
```typescript
interface HandoffRequest {
  vibeContext: VibeContext;
  priority: 'low' | 'medium' | 'high';
  userId?: string;
}
```

### AgentStatus (Real-time updates)
```typescript
type AgentStatus = 'idle' | 'thinking' | 'coding' | 'testing' | 'complete' | 'error';

interface SwarmUpdate {
  jobId: string;
  agents: Array<{
    id: number;
    status: AgentStatus;
    task?: string;
    progress?: number;
  }>;
}
```

---

## 6. PRICING MODEL

| Tier | Price | Iris Chat | Aegis Deploys | Margin |
|------|-------|-----------|---------------|--------|
| **Free** | £0 | 10/month | 1/month | Loss leader |
| **Starter** | £9/month | 1,000/month | 10/month | £7 profit |
| **Pro** | £20/month | 3,000/month | 50/month | £12 profit |
| **Unlimited** | £80/month | Unlimited | 500/month | £40 profit |

**LLM Strategy:**
- Iris Chat: Claude 3 Haiku or GPT-3.5 (cheap, fast)
- Aegis Code Gen: Claude 3.5 Sonnet or GPT-4o (quality matters)

---

## 7. API ENDPOINTS

### Frontend (Port 3000)
| Route | Purpose |
|-------|---------|
| `/` | Split-Gate landing page |
| `/iris` | Creative chat interface |
| `/aegis` | Command center / swarm view |
| `/api/chat` | LLM chat proxy |

### Backend (Port 3001)
| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/handoff` | Submit VibeContext for execution |
| GET | `/api/status/:jobId` | Get job status |
| GET | `/api/agents` | Get swarm state |
| WS | `/` | Real-time progress updates |

---

## 8. ENVIRONMENT VARIABLES

```env
# LLM Provider: 'openai' | 'anthropic' | 'ollama' | 'demo'
LLM_PROVIDER=demo

# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022

# Ollama (local)
OLLAMA_URL=http://localhost:11434/api/chat
OLLAMA_MODEL=llama3

# Backend
AEGIS_API_URL=http://localhost:3001
REDIS_URL=redis://localhost:6379
```

---

## 9. COMMANDS

```bash
# Install all dependencies
npm install

# Run frontend (Iris)
cd client/iris && npm run dev

# Run backend (Aegis)
cd server/aegis && npm run dev

# Run everything with Docker
docker-compose up

# Build for production
npm run build --workspaces
```

---

## 10. CURRENT STATUS

### Completed ✅
- [x] Monorepo structure
- [x] Shared protocol types
- [x] Iris frontend with Split-Gate landing
- [x] Aegis backend with SwarmManager
- [x] WebSocket real-time updates
- [x] NeuralContext for state sharing
- [x] LLM chat API route (multi-provider)

### In Progress 🔄
- [ ] Bento Box UI theme implementation
- [ ] WebSocket offline fallback
- [ ] Usage tracking for billing

### Todo 📋
- [ ] User authentication (Clerk/NextAuth)
- [ ] Stripe billing integration
- [ ] Rate limiting per tier
- [ ] GitHub integration
- [ ] VS Code extension
- [ ] Real code generation in Aegis workers

---

## 11. RULES FOR CLAUDE

1. **Read this file first** before any task
2. **Never read** `package-lock.json`, `node_modules/`, `.next/`, `.git/`
3. **Be concise** - output code, not explanations
4. **Use search_and_replace** for small edits, not full file rewrites
5. **Follow the design system** exactly - colors, spacing, effects
6. **Update this file** when architecture decisions change
7. **Commit frequently** with clear messages

---

## 12. QUICK PROMPTS

**Start a session:**
```
Read PROJECT_DNA.md. Continue building Iris & Aegis.
```

**Implement a feature:**
```
Read PROJECT_DNA.md. Implement [FEATURE] following the design system.
```

**Fix bugs:**
```
Read PROJECT_DNA.md. Compare current code to the spec and fix discrepancies.
```

**Add a new page:**
```
Read PROJECT_DNA.md. Create /[route] page matching the Bento Box theme.
```

---

*Last updated: 2026-02-05*
*Branch: claude/iris-aegis-architecture-SIcFr*
