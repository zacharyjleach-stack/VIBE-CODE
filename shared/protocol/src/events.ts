/**
 * @fileoverview Event types for real-time communication
 * Defines the WebSocket event system for Iris-Aegis communication
 */

import type { AgentInfo, AgentStatus, SwarmState } from './agent-status';
import type { MissionBrief, MissionStatus } from './mission-brief';
import type { ExecutionPhase } from './api-contracts';

/**
 * Base interface for all swarm events
 * Provides common fields for event identification and routing
 */
export interface BaseSwarmEvent {
  /** Unique event ID */
  eventId: string;
  /** Mission this event belongs to */
  missionId: string;
  /** Timestamp when event occurred */
  timestamp: Date;
  /** Sequence number for ordering */
  sequence: number;
}

/**
 * Event fired when a new agent is spawned in the swarm
 */
export interface AgentSpawnedEvent extends BaseSwarmEvent {
  type: 'agent:spawned';
  /** The newly spawned agent's information */
  agent: AgentInfo;
  /** Slot number assigned to the agent */
  slotNumber: number;
  /** Initial task assigned (if any) */
  initialTask?: string;
}

/**
 * Event fired when an agent reports progress
 */
export interface AgentProgressEvent extends BaseSwarmEvent {
  type: 'agent:progress';
  /** ID of the agent reporting progress */
  agentId: string;
  /** Previous progress value */
  previousProgress: number;
  /** Current progress value (0-100) */
  currentProgress: number;
  /** Current status of the agent */
  status: AgentStatus;
  /** Description of current work */
  currentTask: string;
  /** Files being worked on */
  activeFiles?: string[];
  /** Human-readable progress message */
  message: string;
}

/**
 * Event fired when an agent completes its task
 */
export interface AgentCompletedEvent extends BaseSwarmEvent {
  type: 'agent:completed';
  /** ID of the completed agent */
  agentId: string;
  /** Summary of work completed */
  summary: string;
  /** Files created or modified */
  outputFiles: string[];
  /** Time taken in milliseconds */
  durationMs: number;
  /** Number of tasks completed */
  tasksCompleted: number;
  /** Whether agent is returning to idle or being released */
  nextAction: 'idle' | 'reassign' | 'release';
}

/**
 * Event fired when an agent encounters an error
 */
export interface AgentErrorEvent extends BaseSwarmEvent {
  type: 'agent:error';
  /** ID of the agent that errored */
  agentId: string;
  /** Error message */
  error: string;
  /** Error stack trace (if available) */
  stackTrace?: string;
  /** Error code for categorization */
  errorCode: AgentErrorCode;
  /** Whether the error is recoverable */
  recoverable: boolean;
  /** Task that was being performed when error occurred */
  failedTask: string;
  /** Retry attempt number */
  retryAttempt?: number;
}

/**
 * Error codes for agent failures
 */
export enum AgentErrorCode {
  /** Code generation failed */
  CodeGenerationFailed = 'CODE_GENERATION_FAILED',
  /** Test execution failed */
  TestFailed = 'TEST_FAILED',
  /** File system operation failed */
  FileSystemError = 'FILE_SYSTEM_ERROR',
  /** Dependency installation failed */
  DependencyError = 'DEPENDENCY_ERROR',
  /** Timeout exceeded */
  Timeout = 'TIMEOUT',
  /** Resource limit exceeded */
  ResourceLimit = 'RESOURCE_LIMIT',
  /** External service failed */
  ExternalServiceError = 'EXTERNAL_SERVICE_ERROR',
  /** Unknown error */
  Unknown = 'UNKNOWN'
}

/**
 * Event fired when an agent changes status
 */
export interface AgentStatusChangedEvent extends BaseSwarmEvent {
  type: 'agent:status_changed';
  /** ID of the agent */
  agentId: string;
  /** Previous status */
  previousStatus: AgentStatus;
  /** New status */
  newStatus: AgentStatus;
  /** Reason for the change */
  reason?: string;
}

/**
 * Event fired when an agent is assigned a new task
 */
export interface AgentTaskAssignedEvent extends BaseSwarmEvent {
  type: 'agent:task_assigned';
  /** ID of the agent */
  agentId: string;
  /** Task description */
  task: string;
  /** Task priority */
  priority: number;
  /** Estimated duration in milliseconds */
  estimatedDurationMs?: number;
  /** Dependencies on other tasks */
  dependencies?: string[];
}

/**
 * Event fired when the mission status changes
 */
export interface MissionStatusChangedEvent extends BaseSwarmEvent {
  type: 'mission:status_changed';
  /** Previous mission status */
  previousStatus: MissionStatus;
  /** New mission status */
  newStatus: MissionStatus;
  /** Reason for the change */
  reason?: string;
  /** Updated mission brief */
  mission: MissionBrief;
}

/**
 * Event fired when execution phase changes
 */
export interface PhaseChangedEvent extends BaseSwarmEvent {
  type: 'mission:phase_changed';
  /** Previous phase */
  previousPhase: ExecutionPhase;
  /** New phase */
  newPhase: ExecutionPhase;
  /** Phase progress percentage */
  phaseProgress: number;
  /** Summary of previous phase results */
  previousPhaseSummary?: string;
}

/**
 * Event fired periodically with overall swarm state
 */
export interface SwarmHeartbeatEvent extends BaseSwarmEvent {
  type: 'swarm:heartbeat';
  /** Current swarm state snapshot */
  swarmState: SwarmState;
  /** Overall health status */
  health: 'healthy' | 'degraded' | 'critical';
  /** CPU/memory utilization */
  utilization: {
    cpu: number;
    memory: number;
  };
}

/**
 * Event fired when a file is created or modified
 */
export interface FileChangedEvent extends BaseSwarmEvent {
  type: 'file:changed';
  /** Agent that made the change */
  agentId: string;
  /** File path relative to project root */
  filePath: string;
  /** Type of change */
  changeType: 'created' | 'modified' | 'deleted';
  /** Number of lines added */
  linesAdded?: number;
  /** Number of lines removed */
  linesRemoved?: number;
}

/**
 * Event fired when tests are run
 */
export interface TestResultEvent extends BaseSwarmEvent {
  type: 'test:result';
  /** Agent that ran the tests */
  agentId: string;
  /** Total tests run */
  totalTests: number;
  /** Tests passed */
  passed: number;
  /** Tests failed */
  failed: number;
  /** Tests skipped */
  skipped: number;
  /** Test duration in milliseconds */
  durationMs: number;
  /** Coverage percentage (if available) */
  coverage?: number;
  /** Failed test details */
  failedTests?: Array<{
    name: string;
    error: string;
  }>;
}

/**
 * Event fired for log messages from agents
 */
export interface LogEvent extends BaseSwarmEvent {
  type: 'log';
  /** Log level */
  level: 'debug' | 'info' | 'warn' | 'error';
  /** Log message */
  message: string;
  /** Source agent (if applicable) */
  agentId?: string;
  /** Additional context */
  context?: Record<string, unknown>;
}

/**
 * Union type of all possible swarm events
 * Use this for type-safe event handling
 */
export type SwarmEvent =
  | AgentSpawnedEvent
  | AgentProgressEvent
  | AgentCompletedEvent
  | AgentErrorEvent
  | AgentStatusChangedEvent
  | AgentTaskAssignedEvent
  | MissionStatusChangedEvent
  | PhaseChangedEvent
  | SwarmHeartbeatEvent
  | FileChangedEvent
  | TestResultEvent
  | LogEvent;

/**
 * Type guard to check if an event is an agent event
 */
export function isAgentEvent(event: SwarmEvent): event is
  | AgentSpawnedEvent
  | AgentProgressEvent
  | AgentCompletedEvent
  | AgentErrorEvent
  | AgentStatusChangedEvent
  | AgentTaskAssignedEvent {
  return event.type.startsWith('agent:');
}

/**
 * Type guard to check if an event is a mission event
 */
export function isMissionEvent(event: SwarmEvent): event is
  | MissionStatusChangedEvent
  | PhaseChangedEvent {
  return event.type.startsWith('mission:');
}

/**
 * Map of event types to their corresponding interfaces
 * Useful for creating type-safe event handlers
 */
export interface SwarmEventMap {
  'agent:spawned': AgentSpawnedEvent;
  'agent:progress': AgentProgressEvent;
  'agent:completed': AgentCompletedEvent;
  'agent:error': AgentErrorEvent;
  'agent:status_changed': AgentStatusChangedEvent;
  'agent:task_assigned': AgentTaskAssignedEvent;
  'mission:status_changed': MissionStatusChangedEvent;
  'mission:phase_changed': PhaseChangedEvent;
  'swarm:heartbeat': SwarmHeartbeatEvent;
  'file:changed': FileChangedEvent;
  'test:result': TestResultEvent;
  'log': LogEvent;
}

/**
 * Type for event handler functions
 */
export type SwarmEventHandler<T extends SwarmEvent = SwarmEvent> = (event: T) => void | Promise<void>;

/**
 * Interface for subscribing to swarm events
 */
export interface SwarmEventSubscriber {
  /** Subscribe to a specific event type */
  on<K extends keyof SwarmEventMap>(eventType: K, handler: SwarmEventHandler<SwarmEventMap[K]>): void;
  /** Subscribe to all events */
  onAny(handler: SwarmEventHandler): void;
  /** Unsubscribe from a specific event type */
  off<K extends keyof SwarmEventMap>(eventType: K, handler: SwarmEventHandler<SwarmEventMap[K]>): void;
  /** Unsubscribe from all events */
  offAll(): void;
}
