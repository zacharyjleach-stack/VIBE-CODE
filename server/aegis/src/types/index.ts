/**
 * Aegis Backend Orchestrator - Type Definitions
 *
 * These types define the internal structures used by Aegis for managing
 * the agent swarm and mission execution.
 */

import { z } from 'zod';

// =============================================================================
// Agent Lifecycle States
// =============================================================================

export const AgentStatus = {
  IDLE: 'idle',
  INITIALIZING: 'initializing',
  CODING: 'coding',
  TESTING: 'testing',
  COMPLETE: 'complete',
  ERROR: 'error',
  TERMINATED: 'terminated',
} as const;

export type AgentStatusType = typeof AgentStatus[keyof typeof AgentStatus];

// =============================================================================
// Mission Brief Schema (Zod validation)
// =============================================================================

export const TaskSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  description: z.string(),
  priority: z.enum(['critical', 'high', 'medium', 'low']),
  dependencies: z.array(z.string().uuid()).default([]),
  estimatedDuration: z.number().positive().optional(),
  assignedAgent: z.string().uuid().optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'failed']).default('pending'),
  tags: z.array(z.string()).default([]),
});

export type Task = z.infer<typeof TaskSchema>;

export const FileSpecSchema = z.object({
  path: z.string(),
  type: z.enum(['create', 'modify', 'delete']),
  content: z.string().optional(),
  template: z.string().optional(),
});

export type FileSpec = z.infer<typeof FileSpecSchema>;

export const TechStackSchema = z.object({
  language: z.string(),
  framework: z.string().optional(),
  buildTool: z.string().optional(),
  testFramework: z.string().optional(),
  additionalTools: z.array(z.string()).default([]),
});

export type TechStack = z.infer<typeof TechStackSchema>;

export const MissionBriefSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().min(10),
  vibeLevel: z.number().min(1).max(10),
  projectType: z.enum([
    'web-app',
    'api',
    'cli',
    'library',
    'mobile-app',
    'desktop-app',
    'full-stack',
    'microservice',
  ]),
  techStack: TechStackSchema,
  tasks: z.array(TaskSchema).min(1),
  files: z.array(FileSpecSchema).default([]),
  constraints: z.object({
    maxAgents: z.number().min(1).max(16).default(16),
    timeoutMinutes: z.number().min(1).max(120).default(30),
    testRequired: z.boolean().default(true),
    lintRequired: z.boolean().default(true),
  }).default({}),
  metadata: z.object({
    createdAt: z.string().datetime(),
    createdBy: z.string(),
    sessionId: z.string().uuid(),
    version: z.string().default('1.0.0'),
  }),
});

export type MissionBrief = z.infer<typeof MissionBriefSchema>;

// =============================================================================
// Worker Slot Types
// =============================================================================

export const WorkerSlotStatus = {
  AVAILABLE: 'available',
  BUSY: 'busy',
  OFFLINE: 'offline',
  ERROR: 'error',
} as const;

export type WorkerSlotStatusType = typeof WorkerSlotStatus[keyof typeof WorkerSlotStatus];

export interface WorkerSlotConfig {
  id: string;
  index: number;
  maxMemoryMB: number;
  maxCpuPercent: number;
  workspaceRoot: string;
  useDocker: boolean;
  dockerImage?: string;
}

export interface WorkerSlotState {
  id: string;
  status: WorkerSlotStatusType;
  currentTask: Task | null;
  agentId: string | null;
  startTime: Date | null;
  metrics: WorkerMetrics;
}

export interface WorkerMetrics {
  tasksCompleted: number;
  tasksFailed: number;
  totalExecutionTimeMs: number;
  averageExecutionTimeMs: number;
  memoryUsageMB: number;
  cpuUsagePercent: number;
}

// =============================================================================
// Agent Types
// =============================================================================

export interface AgentInfo {
  id: string;
  name: string;
  slotIndex: number;
  status: AgentStatusType;
  currentTask: Task | null;
  missionId: string;
  createdAt: Date;
  updatedAt: Date;
  progress: number; // 0-100
  logs: AgentLog[];
}

export interface AgentLog {
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  data?: Record<string, unknown>;
}

// =============================================================================
// Mission Types
// =============================================================================

export const MissionStatus = {
  PENDING: 'pending',
  INITIALIZING: 'initializing',
  IN_PROGRESS: 'in_progress',
  TESTING: 'testing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const;

export type MissionStatusType = typeof MissionStatus[keyof typeof MissionStatus];

export interface MissionState {
  id: string;
  brief: MissionBrief;
  status: MissionStatusType;
  agents: Map<string, AgentInfo>;
  completedTasks: Task[];
  failedTasks: Task[];
  pendingTasks: Task[];
  inProgressTasks: Task[];
  startTime: Date | null;
  endTime: Date | null;
  progress: number; // 0-100
  outputPath: string;
  wsChannel: string;
}

// =============================================================================
// Event Types
// =============================================================================

export interface SwarmEvent {
  type: SwarmEventType;
  timestamp: Date;
  missionId: string;
  payload: unknown;
}

export type SwarmEventType =
  | 'agent:spawned'
  | 'agent:status_changed'
  | 'agent:task_started'
  | 'agent:task_completed'
  | 'agent:task_failed'
  | 'agent:terminated'
  | 'agent:log'
  | 'mission:started'
  | 'mission:progress'
  | 'mission:completed'
  | 'mission:failed'
  | 'file:created'
  | 'file:modified'
  | 'file:deleted'
  | 'test:started'
  | 'test:passed'
  | 'test:failed';

export interface AgentSpawnedEvent extends SwarmEvent {
  type: 'agent:spawned';
  payload: {
    agentId: string;
    slotIndex: number;
    task: Task;
  };
}

export interface AgentStatusChangedEvent extends SwarmEvent {
  type: 'agent:status_changed';
  payload: {
    agentId: string;
    previousStatus: AgentStatusType;
    newStatus: AgentStatusType;
  };
}

export interface MissionProgressEvent extends SwarmEvent {
  type: 'mission:progress';
  payload: {
    progress: number;
    completedTasks: number;
    totalTasks: number;
    activeAgents: number;
  };
}

// =============================================================================
// API Response Types
// =============================================================================

export interface HandoffResponse {
  success: boolean;
  missionId: string;
  wsChannel: string;
  estimatedDuration: number;
  agentCount: number;
}

export interface SystemStatus {
  healthy: boolean;
  version: string;
  uptime: number;
  activeWorkers: number;
  totalWorkers: number;
  activeMissions: number;
  redis: {
    connected: boolean;
    latencyMs: number;
  };
  docker: {
    available: boolean;
    runningContainers: number;
  };
  metrics: {
    totalMissionsCompleted: number;
    totalTasksProcessed: number;
    averageMissionDuration: number;
  };
}

export interface AgentListResponse {
  agents: AgentInfo[];
  total: number;
  byStatus: Record<AgentStatusType, number>;
}

export interface MissionStatusResponse {
  mission: MissionState;
  agents: AgentInfo[];
  timeline: SwarmEvent[];
}

// =============================================================================
// Configuration Types
// =============================================================================

export interface AegisConfig {
  server: {
    port: number;
    host: string;
    corsOrigins: string[];
  };
  redis: {
    host: string;
    port: number;
    password?: string;
    db: number;
  };
  docker: {
    enabled: boolean;
    socketPath: string;
    workerImage: string;
    network: string;
  };
  swarm: {
    maxWorkers: number;
    taskTimeoutMs: number;
    healthCheckIntervalMs: number;
  };
  workspace: {
    rootPath: string;
    tempPath: string;
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    pretty: boolean;
  };
}
