import express from "express";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import cors from "cors";
import { Config } from "./config/env";
import { GitHubService } from "./services/GitHubService";
import { UsageManager, TIERS } from "./billing/UsageManager";

const app = express();
const httpServer = createServer(app);
const PORT = Number(process.env.PORT) || 8080;

// Socket.IO for real-time Iris <-> Aegis communication
const io = new SocketIOServer(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] },
  transports: ["websocket", "polling"],
});

app.use(cors());
app.use(express.json());

const github = new GitHubService();
const mode = Config.isOnline ? "Online" : "Offline";

// ==================== Mock State ====================

let agents = Array.from({ length: 16 }, (_, i) => ({
  id: i,
  status: i < 3 ? "idle" as const : "idle" as const,
  currentTask: undefined as string | undefined,
  progress: undefined as number | undefined,
  startedAt: undefined as string | undefined,
  completedAt: undefined as string | undefined,
  error: undefined as string | undefined,
}));

const sessions: Record<string, {
  id: string;
  createdAt: string;
  lastActivityAt: string;
  vibeContext: any;
  messages: any[];
  currentJobId?: string;
}> = {};

// ==================== Routes ====================

// Health
app.get("/health", (_req, res) => {
  res.json({ status: "operational", version: "1.0.0", mode });
});

// Sessions
app.post("/sessions", (_req, res) => {
  const id = `session_${Date.now()}`;
  const session = {
    id,
    createdAt: new Date().toISOString(),
    lastActivityAt: new Date().toISOString(),
    vibeContext: {
      sessionId: id,
      userIntent: "",
      techStack: { additionalServices: [] },
      constraints: [],
      stylePreferences: {},
      metadata: { createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), version: 1, confidence: 0 },
    },
    messages: [],
  };
  sessions[id] = session;
  res.json(session);
});

app.get("/sessions/:id", (req, res) => {
  const session = sessions[req.params.id];
  if (!session) return res.status(404).json({ error: "Session not found" });
  res.json(session);
});

app.patch("/sessions/:id", (req, res) => {
  const session = sessions[req.params.id];
  if (!session) return res.status(404).json({ error: "Session not found" });
  if (req.body.vibeContext) {
    session.vibeContext = { ...session.vibeContext, ...req.body.vibeContext };
  }
  session.lastActivityAt = new Date().toISOString();
  res.json(session);
});

// Agents
app.get("/agents/status", (_req, res) => {
  res.json({ agents });
});

// Handoff
app.post("/handoff", (req, res) => {
  const { vibeContext, priority, dryRun } = req.body;

  if (dryRun) {
    return res.json({
      success: true,
      message: "Vibe context validated successfully",
      validationErrors: [],
    });
  }

  // Subscription gating: Check daily request limit
  if (!UsageManager.canMakeRequest()) {
    const user = UsageManager.getUser();
    const tier = TIERS[user.tier];
    return res.status(402).json({
      error: "Upgrade Required",
      message: `Daily request limit exceeded (${user.requestsToday}/${tier.requestsPerDay}). Please upgrade your plan.`,
      currentTier: user.tier,
      requestsToday: user.requestsToday,
      limit: tier.requestsPerDay,
      upgradeUrl: "/pricing"
    });
  }

  const jobId = `job_${Date.now()}`;

  // Simulate agents starting work
  agents[0] = { ...agents[0], status: "working", currentTask: "Analyzing requirements", progress: 10, startedAt: new Date().toISOString() };
  agents[1] = { ...agents[1], status: "working", currentTask: "Planning architecture", progress: 5, startedAt: new Date().toISOString() };

  // Broadcast agent update to all connected Iris clients
  io.emit("agent_update", { agents });

  // Simulate progress over time
  simulateJob(jobId);

  res.json({
    success: true,
    jobId,
    estimatedTime: 30,
    message: "Build initiated — Aegis Swarm is on it.",
  });
});

// Job status
app.get("/jobs/:id", (req, res) => {
  res.json({
    jobId: req.params.id,
    status: "running",
    progress: 45,
    stage: "building",
    message: "Generating project structure...",
  });
});

app.post("/jobs/:id/cancel", (req, res) => {
  // Reset agents
  agents = agents.map((a) => ({ ...a, status: "idle" as const, currentTask: undefined, progress: undefined }));
  io.emit("agent_update", { agents });
  res.json({ success: true });
});

// Agent Commands — direct task assignment to individual agents
app.post("/agents/command", (req, res) => {
  const { agentId, task } = req.body;

  if (!agentId || agentId < 1 || agentId > 16) {
    return res.status(400).json({ error: "Invalid agent ID (1-16)" });
  }
  if (!task) {
    return res.status(400).json({ error: "Task is required" });
  }

  // Subscription gating: Check daily request limit
  if (!UsageManager.canMakeRequest()) {
    const user = UsageManager.getUser();
    const tier = TIERS[user.tier];
    return res.status(402).json({
      error: "Upgrade Required",
      message: `Daily request limit exceeded (${user.requestsToday}/${tier.requestsPerDay}). Please upgrade your plan.`,
      currentTier: user.tier,
      requestsToday: user.requestsToday,
      limit: tier.requestsPerDay,
      upgradeUrl: "/pricing"
    });
  }

  // Check agent tier limit
  if (!UsageManager.canUseAgents(agentId)) {
    const tier = TIERS[UsageManager.getUser().tier];
    return res.status(403).json({
      error: "Agent Limit Exceeded",
      message: `Your ${UsageManager.getUser().tier} plan allows up to ${tier.maxAgents} concurrent agent${tier.maxAgents === 1 ? '' : 's'}.`,
      currentTier: UsageManager.getUser().tier,
      maxAgents: tier.maxAgents,
      requestedAgent: agentId,
      upgradeUrl: "/pricing"
    });
  }

  const idx = agentId - 1;
  agents[idx] = {
    ...agents[idx],
    status: "working" as const,
    currentTask: task,
    progress: 10,
    startedAt: new Date().toISOString(),
    completedAt: undefined,
    error: undefined,
  };

  io.emit("agent_update", { agents });

  // Simulate agent working and completing
  const duration = 5000 + Math.random() * 10000; // 5-15s
  setTimeout(() => {
    agents[idx] = {
      ...agents[idx],
      status: "success" as const,
      progress: 100,
      currentTask: `Done: ${task}`,
      completedAt: new Date().toISOString(),
    };
    io.emit("agent_update", { agents });
  }, duration);

  res.json({
    success: true,
    agentId,
    task,
    message: `Agent #${agentId} assigned: "${task}"`,
  });
});

// Visualization
app.post("/visualize/diagram", (req, res) => {
  const { vibeContext } = req.body;
  const fe = vibeContext?.techStack?.frontend?.name || "Frontend";
  const be = vibeContext?.techStack?.backend?.name || "Backend";
  const db = vibeContext?.techStack?.database?.name || "Database";

  const diagram = `graph TD
    User[User] --> ${fe}[${fe}]
    ${fe} --> API[API Layer]
    API --> ${be}[${be}]
    ${be} --> ${db}[${db}]
    ${be} --> Cache[Redis Cache]
    style ${fe} fill:#6366f1,stroke:#4f46e5,color:#fff
    style ${be} fill:#10b981,stroke:#059669,color:#fff
    style ${db} fill:#f59e0b,stroke:#d97706,color:#fff`;

  res.json({ diagram });
});

// ==================== Billing Routes ====================

// Get current usage
app.get("/billing/usage", (_req, res) => {
  const user = UsageManager.getUser();
  const tier = TIERS[user.tier];
  const features = UsageManager.getCurrentFeatures();

  res.json({
    userId: user.id,
    tier: user.tier,
    requestsToday: user.requestsToday,
    limit: tier.requestsPerDay === 0 ? "Unlimited" : tier.requestsPerDay,
    percentage: UsageManager.getUsagePercentage(),
    remaining: UsageManager.getRemainingRequests(),
    lastResetDate: user.lastResetDate,
    subscriptionEnd: user.subscriptionEnd,
    features: features,
  });
});

// Get all tiers
app.get("/billing/tiers", (_req, res) => {
  res.json({ tiers: Object.values(TIERS) });
});

// Upgrade tier (mock subscription endpoint)
app.post("/billing/upgrade", (req, res) => {
  const { tier } = req.body;

  if (!tier || !TIERS[tier as keyof typeof TIERS]) {
    return res.status(400).json({ error: "Invalid tier" });
  }

  UsageManager.upgradeTier(tier);
  const user = UsageManager.getUser();
  const newTier = TIERS[user.tier];

  res.json({
    success: true,
    message: `Upgraded to ${tier} plan`,
    user: {
      tier: user.tier,
      requestsPerDay: newTier.requestsPerDay === 0 ? "Unlimited" : newTier.requestsPerDay,
      maxAgents: newTier.maxAgents === 0 ? "Unlimited" : newTier.maxAgents,
      requestsToday: user.requestsToday,
      subscriptionEnd: user.subscriptionEnd,
    }
  });
});

// Reset usage (for testing/daily billing)
app.post("/billing/reset", (_req, res) => {
  UsageManager.resetDailyUsage();
  res.json({ success: true, message: "Daily usage reset successfully" });
});

// ==================== WebSocket ====================

io.on("connection", (socket) => {
  console.log(`  [WS] Iris client connected: ${socket.id}`);

  // Send current agent state on connect
  socket.emit("agent_update", { agents });

  socket.on("ping", () => {
    socket.emit("pong", { timestamp: Date.now() });
  });

  socket.on("disconnect", () => {
    console.log(`  [WS] Iris client disconnected: ${socket.id}`);
  });
});

// ==================== Job Simulation ====================

function simulateJob(jobId: string) {
  const stages = [
    { progress: 20, stage: "scaffolding", msg: "Creating project structure..." },
    { progress: 40, stage: "building", msg: "Generating components..." },
    { progress: 60, stage: "building", msg: "Wiring up API routes..." },
    { progress: 80, stage: "testing", msg: "Running validation..." },
    { progress: 100, stage: "complete", msg: "Build complete!" },
  ];

  stages.forEach((s, i) => {
    setTimeout(() => {
      io.emit("job_progress", { jobId, progress: s.progress, stage: s.stage, message: s.msg });

      // Update agent visuals
      if (s.progress < 100) {
        agents[0] = { ...agents[0], progress: s.progress, currentTask: s.msg };
        if (s.progress > 30) {
          agents[1] = { ...agents[1], status: "working", progress: s.progress - 20, currentTask: "Building modules" };
        }
        if (s.progress > 50) {
          agents[2] = { ...agents[2], status: "working", progress: s.progress - 40, currentTask: "Running tests" };
        }
      } else {
        agents[0] = { ...agents[0], status: "success", progress: 100, currentTask: "Done", completedAt: new Date().toISOString() };
        agents[1] = { ...agents[1], status: "success", progress: 100, currentTask: "Done", completedAt: new Date().toISOString() };
        agents[2] = { ...agents[2], status: "success", progress: 100, currentTask: "Done", completedAt: new Date().toISOString() };

        io.emit("job_complete", {
          jobId,
          success: true,
          result: { artifacts: ["package.json", "src/", "tests/", "README.md"] },
        });
      }
      io.emit("agent_update", { agents });
    }, (i + 1) * 3000);
  });
}

// ==================== Boot ====================

httpServer.listen(PORT, () => {
  console.log(`⚡ Aegis Systems Online: [${mode} Mode]`);
  console.log(`  Port: ${PORT}`);
  console.log(`  WebSocket: Ready`);
  console.log(`  GitHub: ${Config.GITHUB_TOKEN ? "Connected" : "No Token"}`);
  console.log(`  Redis:  ${Config.REDIS_URL}`);
  console.log(`  Routes: /health, /handoff, /sessions, /agents/status, /jobs, /visualize`);
});
