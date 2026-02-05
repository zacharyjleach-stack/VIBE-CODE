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
} from './mission-brief.js';

export type {
  // Interfaces
  TechStack,
  StylePreferences,
  VibeContext,
  MissionBrief,
  // Types
  CreateMissionBriefInput,
} from './mission-brief.js';

// ============================================================================
// Agent Status Types
// ============================================================================

export {
  // Enums
  AgentStatus,
  AgentRole,
  // Constants
  MAX_SWARM_SIZE,
} from './agent-status.js';

export type {
  // Interfaces
  AgentInfo,
  AgentSlot,
  SwarmState,
  SwarmStats,
  // Types
  AgentId,
} from './agent-status.js';

// ============================================================================
// API Contract Types
// ============================================================================

export {
  // Enums
  HandoffErrorCode,
  ExecutionPhase,
} from './api-contracts.js';

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
} from './api-contracts.js';

// ============================================================================
// Event Types
// ============================================================================

export {
  // Enums
  AgentErrorCode,
  // Type guards
  isAgentEvent,
  isMissionEvent,
} from './events.js';

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
} from './events.js';

// ============================================================================
// Re-export everything as namespaces for convenience
// ============================================================================

import * as MissionTypes from './mission-brief.js';
import * as AgentTypes from './agent-status.js';
import * as ApiTypes from './api-contracts.js';
import * as EventTypes from './events.js';

export { MissionTypes, AgentTypes, ApiTypes, EventTypes };
