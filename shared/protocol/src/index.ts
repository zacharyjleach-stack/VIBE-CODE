/**
 * @fileoverview Main export file for @iris-aegis/protocol
 *
 * This package provides the shared TypeScript interfaces and types
 * used for communication between Iris (frontend) and Aegis (backend).
 *
 * @packageDocumentation
 */

// ============================================================================
// Mission Brief Types
// ============================================================================

export {
  // Enums
  MissionStatus,
  Priority,
} from './mission-brief';

export type {
  // Interfaces
  TechStack,
  StylePreferences,
  VibeContext,
  MissionBrief,
  // Types
  CreateMissionBriefInput,
} from './mission-brief';

// ============================================================================
// Agent Status Types
// ============================================================================

export {
  // Enums
  AgentStatus,
  AgentRole,
  // Constants
  MAX_SWARM_SIZE,
} from './agent-status';

export type {
  // Interfaces
  AgentInfo,
  AgentSlot,
  SwarmState,
  SwarmStats,
  // Types
  AgentId,
} from './agent-status';

// ============================================================================
// API Contract Types
// ============================================================================

export {
  // Enums
  HandoffErrorCode,
  ExecutionPhase,
} from './api-contracts';

export type {
  // Request/Response interfaces
  HandoffRequest,
  HandoffResponse,
  ProgressUpdate,
  StatusRequest,
  StatusResponse,
  LogEntry,
  CancelRequest,
  CancelResponse,
  PauseRequest,
  PauseResponse,
  ResumeRequest,
  ResumeResponse,
  HealthCheckResponse,
} from './api-contracts';

// ============================================================================
// Event Types
// ============================================================================

export {
  // Enums
  AgentErrorCode,
  // Type guards
  isAgentEvent,
  isMissionEvent,
} from './events';

export type {
  // Base interface
  BaseSwarmEvent,
  // Agent events
  AgentSpawnedEvent,
  AgentProgressEvent,
  AgentCompletedEvent,
  AgentErrorEvent,
  AgentStatusChangedEvent,
  AgentTaskAssignedEvent,
  // Mission events
  MissionStatusChangedEvent,
  PhaseChangedEvent,
  // Swarm events
  SwarmHeartbeatEvent,
  // File events
  FileChangedEvent,
  // Test events
  TestResultEvent,
  // Log events
  LogEvent,
  // Union type
  SwarmEvent,
  // Type maps
  SwarmEventMap,
  SwarmEventHandler,
  SwarmEventSubscriber,
} from './events';

// ============================================================================
// Re-export everything as namespaces for convenience
// ============================================================================

import * as MissionTypes from './mission-brief';
import * as AgentTypes from './agent-status';
import * as ApiTypes from './api-contracts';
import * as EventTypes from './events';

export { MissionTypes, AgentTypes, ApiTypes, EventTypes };
