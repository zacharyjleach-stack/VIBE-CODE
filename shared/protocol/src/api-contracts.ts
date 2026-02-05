/**
 * @fileoverview API Contract definitions
 * Defines the request/response shapes for Iris-Aegis communication
 */

import type { MissionBrief, Priority, VibeContext } from './mission-brief.js';
import type { SwarmState, SwarmStats } from './agent-status.js';

/**
 * Request payload sent from Iris to Aegis to initiate a mission
 * This is the "handoff" that starts the agent swarm
 */
export interface HandoffRequest {
  /** The vibe context from the user */
  vibeContext: VibeContext;
  /** Requested priority level */
  priority: Priority;
  /** Optional deadline for completion */
  deadline?: Date;
  /** Optional tags for organization */
  tags?: string[];
  /** Whether to run in dry-run mode (plan only, no execution) */
  dryRun?: boolean;
  /** Optional callback URL for completion notification */
  callbackUrl?: string;
  /** Client session ID for correlation */
  sessionId: string;
  /** Optional parent mission ID for sub-mission creation */
  parentMissionId?: string;
}

/**
 * Response from Aegis acknowledging the handoff
 * Confirms mission creation and provides tracking information
 */
export interface HandoffResponse {
  /** Whether the handoff was accepted */
  success: boolean;
  /** The created mission brief (if successful) */
  mission?: MissionBrief;
  /** Error message (if unsuccessful) */
  error?: string;
  /** Error code for programmatic handling */
  errorCode?: HandoffErrorCode;
  /** WebSocket URL for real-time updates */
  websocketUrl: string;
  /** Estimated completion time */
  estimatedCompletion?: Date;
  /** Number of agents assigned */
  assignedAgents: number;
}

/**
 * Error codes for handoff failures
 */
export enum HandoffErrorCode {
  /** Invalid request payload */
  InvalidRequest = 'INVALID_REQUEST',
  /** System is at capacity */
  CapacityExceeded = 'CAPACITY_EXCEEDED',
  /** Authentication failed */
  Unauthorized = 'UNAUTHORIZED',
  /** Rate limit exceeded */
  RateLimited = 'RATE_LIMITED',
  /** Internal server error */
  InternalError = 'INTERNAL_ERROR',
  /** Feature not available */
  FeatureDisabled = 'FEATURE_DISABLED'
}

/**
 * Real-time progress update sent via WebSocket
 * Iris subscribes to these for live dashboard updates
 */
export interface ProgressUpdate {
  /** Type discriminator for the update */
  type: 'progress';
  /** Mission ID this update relates to */
  missionId: string;
  /** Timestamp of the update */
  timestamp: Date;
  /** Current swarm state snapshot */
  swarmState: SwarmState;
  /** Specific agent that triggered the update (if applicable) */
  agentId?: string;
  /** Human-readable message about the progress */
  message: string;
  /** Files that have been created or modified */
  affectedFiles?: string[];
  /** Current phase of execution */
  phase: ExecutionPhase;
}

/**
 * Execution phases of a mission
 */
export enum ExecutionPhase {
  /** Analyzing requirements and planning */
  Planning = 'Planning',
  /** Setting up project structure */
  Scaffolding = 'Scaffolding',
  /** Generating code */
  Coding = 'Coding',
  /** Running tests */
  Testing = 'Testing',
  /** Reviewing and refining */
  Review = 'Review',
  /** Final integration and polish */
  Integration = 'Integration',
  /** Completing and cleaning up */
  Finalization = 'Finalization'
}

/**
 * Request to get current mission status
 */
export interface StatusRequest {
  /** Mission ID to query */
  missionId: string;
  /** Session ID for authentication */
  sessionId: string;
  /** Include full swarm details */
  includeSwarmDetails?: boolean;
}

/**
 * Response containing mission status
 */
export interface StatusResponse {
  /** The current mission brief */
  mission: MissionBrief;
  /** Current swarm state */
  swarmState: SwarmState;
  /** Swarm statistics */
  stats: SwarmStats;
  /** Recent log entries */
  recentLogs?: LogEntry[];
}

/**
 * Log entry from mission execution
 */
export interface LogEntry {
  /** Timestamp of the log */
  timestamp: Date;
  /** Log level */
  level: 'debug' | 'info' | 'warn' | 'error';
  /** Log message */
  message: string;
  /** Agent that generated the log */
  agentId?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Request to cancel a mission
 */
export interface CancelRequest {
  /** Mission ID to cancel */
  missionId: string;
  /** Session ID for authentication */
  sessionId: string;
  /** Reason for cancellation */
  reason?: string;
}

/**
 * Response to cancellation request
 */
export interface CancelResponse {
  /** Whether cancellation was successful */
  success: boolean;
  /** Updated mission brief */
  mission?: MissionBrief;
  /** Error message if unsuccessful */
  error?: string;
}

/**
 * Request to pause a mission
 */
export interface PauseRequest {
  /** Mission ID to pause */
  missionId: string;
  /** Session ID for authentication */
  sessionId: string;
}

/**
 * Response to pause request
 */
export interface PauseResponse {
  /** Whether pause was successful */
  success: boolean;
  /** Updated mission brief */
  mission?: MissionBrief;
  /** Error message if unsuccessful */
  error?: string;
}

/**
 * Request to resume a paused mission
 */
export interface ResumeRequest {
  /** Mission ID to resume */
  missionId: string;
  /** Session ID for authentication */
  sessionId: string;
}

/**
 * Response to resume request
 */
export interface ResumeResponse {
  /** Whether resume was successful */
  success: boolean;
  /** Updated mission brief */
  mission?: MissionBrief;
  /** Error message if unsuccessful */
  error?: string;
}

/**
 * Health check response
 */
export interface HealthCheckResponse {
  /** Overall service health */
  status: 'healthy' | 'degraded' | 'unhealthy';
  /** Service version */
  version: string;
  /** Current capacity */
  capacity: {
    /** Total available agent slots */
    totalSlots: number;
    /** Currently used slots */
    usedSlots: number;
    /** Queue length for pending missions */
    queueLength: number;
  };
  /** Timestamp of the check */
  timestamp: Date;
}
