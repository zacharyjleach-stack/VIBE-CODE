/**
 * @fileoverview Agent Status types and interfaces
 * Defines the status tracking system for the 16-agent swarm
 */

/**
 * Possible states for an individual agent
 * Represents the current activity of a worker agent
 */
export enum AgentStatus {
  /** Agent is not currently assigned to any task */
  Idle = 'Idle',
  /** Agent is starting up and loading context */
  Initializing = 'Initializing',
  /** Agent is actively writing code */
  Coding = 'Coding',
  /** Agent is running tests on generated code */
  Testing = 'Testing',
  /** Agent is reviewing code (own or others) */
  Reviewing = 'Reviewing',
  /** Agent has finished its current task */
  Complete = 'Complete',
  /** Agent encountered an error */
  Error = 'Error'
}

/**
 * Agent specialization types
 * Defines the role each agent plays in the swarm
 */
export enum AgentRole {
  /** Orchestrates the overall mission */
  Orchestrator = 'Orchestrator',
  /** Handles frontend development */
  Frontend = 'Frontend',
  /** Handles backend development */
  Backend = 'Backend',
  /** Manages database operations */
  Database = 'Database',
  /** Writes and manages tests */
  Testing = 'Testing',
  /** Handles DevOps and deployment */
  DevOps = 'DevOps',
  /** Reviews code quality */
  CodeReview = 'CodeReview',
  /** Manages documentation */
  Documentation = 'Documentation',
  /** Handles security concerns */
  Security = 'Security',
  /** Optimizes performance */
  Performance = 'Performance',
  /** General purpose worker */
  General = 'General'
}

/**
 * Information about a single agent in the swarm
 * Tracks identity, status, and current work
 */
export interface AgentInfo {
  /** Unique identifier for the agent (e.g., 'agent-01') */
  id: string;
  /** Human-readable name for the agent */
  name: string;
  /** Current operational status */
  status: AgentStatus;
  /** Description of the current task being performed */
  currentTask: string | null;
  /** Progress percentage (0-100) for current task */
  progress: number;
  /** Timestamp of the last status update */
  lastUpdate: Date;
  /** Agent's specialized role */
  role: AgentRole;
  /** Number of tasks completed in current mission */
  tasksCompleted?: number;
  /** Error message if status is Error */
  errorMessage?: string;
  /** Files currently being worked on */
  activeFiles?: string[];
}

/**
 * A single slot in the agent swarm
 * Represents one of the 16 available worker positions
 */
export interface AgentSlot {
  /** Slot number (0-15) */
  slotNumber: number;
  /** Agent assigned to this slot, or null if empty */
  agent: AgentInfo | null;
  /** Whether this slot is currently reserved for assignment */
  reserved: boolean;
}

/**
 * Complete state of the 16-agent swarm
 * Provides a snapshot of all workers and overall progress
 */
export interface SwarmState {
  /** Unique identifier for this swarm instance */
  swarmId: string;
  /** ID of the mission this swarm is working on */
  missionId: string;
  /** Array of 16 agent slots */
  slots: AgentSlot[];
  /** Overall progress of the mission (0-100) */
  overallProgress: number;
  /** Number of agents currently active */
  activeAgentCount: number;
  /** Timestamp when the swarm was initialized */
  startedAt: Date;
  /** Estimated completion time */
  estimatedCompletion?: Date;
  /** Current phase of the mission */
  currentPhase: string;
  /** Total number of tasks in the mission */
  totalTasks: number;
  /** Number of tasks completed */
  completedTasks: number;
}

/**
 * Summary statistics for the swarm
 * Used for dashboard displays and monitoring
 */
export interface SwarmStats {
  /** Agents in each status */
  statusCounts: Record<AgentStatus, number>;
  /** Agents in each role */
  roleCounts: Record<AgentRole, number>;
  /** Average progress across all agents */
  averageProgress: number;
  /** Total errors encountered */
  errorCount: number;
  /** Uptime in milliseconds */
  uptimeMs: number;
}

/**
 * Maximum number of agents in a swarm
 */
export const MAX_SWARM_SIZE = 16;

/**
 * Helper type for agent ID format validation
 */
export type AgentId = `agent-${string}`;
