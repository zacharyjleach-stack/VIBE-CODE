// ============================================================
// AEGIS - Core Type Definitions
// ============================================================

export type AgentType = 'cursor' | 'claude' | 'gemini' | 'unknown';
export type TierType = 'free' | 'pro';
export type EventType = 'file_change' | 'agent_sync' | 'vibe_check' | 'logic_guard';

export interface AegisState {
  version: string;
  projectName: string;
  projectPath: string;
  currentObjective: string;
  lastUpdated: string;
  activeAgents: AgentType[];
  completedTasks: Task[];
  pendingTasks: Task[];
  sharedContext: SharedContext;
  guards: GuardState;
}

export interface Task {
  id: string;
  description: string;
  assignedAgent?: AgentType;
  completedAt?: string;
  files?: string[];
}

export interface SharedContext {
  techStack: string[];
  conventions: string[];
  recentChanges: RecentChange[];
  criticalFiles: string[];
  doNotTouch: string[];
}

export interface RecentChange {
  file: string;
  agent: AgentType;
  summary: string;
  timestamp: string;
}

export interface GuardState {
  lastVibeCheck?: string;
  vibeCheckResult?: 'pass' | 'fail' | 'warning';
  logicCollisions: LogicCollision[];
}

export interface LogicCollision {
  file: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  detectedAt: string;
}

export interface DetectedAgent {
  type: AgentType;
  configPath: string;
  exists: boolean;
}

export interface AgentInstructions {
  cursor?: string;   // .cursorrules content
  claude?: string;   // CLAUDE.md content
  gemini?: string;   // .gemini/config content
}

export interface DiffAnalysis {
  summary: string;
  affectedComponents: string[];
  crossAgentInstructions: string;
  riskLevel: 'low' | 'medium' | 'high';
  suggestedNextSteps: string[];
}

export interface VibeCheckResult {
  passed: boolean;
  screenshotPath: string;
  vibeScore: number; // 0-100
  feedback: string;
  suggestions: string[];
}

export interface AegisConfig {
  projectId: string;
  projectName: string;
  openaiApiKey?: string;
  stripeSecretKey?: string;
  tier: TierType;
  watchPaths: string[];
  ignorePaths: string[];
  relay: {
    port: number;
    enabled: boolean;
  };
  vibe: {
    prdPath?: string;
    screenshotDir: string;
  };
}

export interface RelayMessage {
  type: 'state_update' | 'agent_sync' | 'vibe_alert' | 'logic_collision';
  agent: AgentType;
  payload: unknown;
  timestamp: string;
}
