/**
 * ProgressEmitter - Real-time WebSocket Communication
 *
 * Wraps Socket.IO server for progress updates, handling client subscriptions
 * to specific missions and emitting agent, mission, and task events in real-time.
 */

import type { Server as SocketIOServer, Socket } from 'socket.io';
import type { Logger } from 'pino';

import type {
  AgentStatusType,
  Task,
  SwarmEvent,
} from '../types/index.js';

// =============================================================================
// Event Type Definitions
// =============================================================================

/**
 * Agent event types emitted during agent lifecycle
 */
export type AgentEventType =
  | 'agent:spawned'
  | 'agent:status_changed'
  | 'agent:task_completed'
  | 'agent:task_failed'
  | 'agent:terminated';

/**
 * Mission event types emitted during mission execution
 */
export type MissionEventType =
  | 'mission:initialized'
  | 'mission:in_progress'
  | 'mission:completed'
  | 'mission:failed'
  | 'mission:cancelled';

/**
 * Task event types emitted during task execution
 */
export type TaskEventType =
  | 'task:started'
  | 'task:progress'
  | 'task:completed'
  | 'task:failed';

// =============================================================================
// Event Payload Interfaces
// =============================================================================

/**
 * Base event payload with common fields
 */
export interface BaseEventPayload {
  timestamp: Date;
  missionId: string;
}

/**
 * Payload for agent:spawned event
 */
export interface AgentSpawnedPayload extends BaseEventPayload {
  agentId: string;
  agentName: string;
  slotIndex: number;
  task: Task;
}

/**
 * Payload for agent:status_changed event
 */
export interface AgentStatusChangedPayload extends BaseEventPayload {
  agentId: string;
  previousStatus: AgentStatusType;
  newStatus: AgentStatusType;
  progress?: number;
}

/**
 * Payload for agent:task_completed event
 */
export interface AgentTaskCompletedPayload extends BaseEventPayload {
  agentId: string;
  taskId: string;
  result?: {
    filesCreated?: string[];
    filesModified?: string[];
    duration: number;
    output?: string;
  };
}

/**
 * Payload for agent:task_failed event
 */
export interface AgentTaskFailedPayload extends BaseEventPayload {
  agentId: string;
  taskId: string;
  error: {
    message: string;
    code?: string;
    stack?: string;
  };
  retryable: boolean;
}

/**
 * Payload for agent:terminated event
 */
export interface AgentTerminatedPayload extends BaseEventPayload {
  agentId: string;
  reason: 'completed' | 'failed' | 'cancelled' | 'timeout' | 'manual';
  finalStatus: AgentStatusType;
}

/**
 * Union type for all agent event payloads
 */
export type AgentEventPayload =
  | AgentSpawnedPayload
  | AgentStatusChangedPayload
  | AgentTaskCompletedPayload
  | AgentTaskFailedPayload
  | AgentTerminatedPayload;

/**
 * Payload for mission:initialized event
 */
export interface MissionInitializedPayload extends BaseEventPayload {
  title: string;
  description: string;
  totalTasks: number;
  estimatedDuration: number;
  maxAgents: number;
}

/**
 * Payload for mission:in_progress event
 */
export interface MissionInProgressPayload extends BaseEventPayload {
  progress: number;
  completedTasks: number;
  totalTasks: number;
  activeAgents: number;
  elapsedTime: number;
}

/**
 * Payload for mission:completed event
 */
export interface MissionCompletedPayload extends BaseEventPayload {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  duration: number;
  outputPath: string;
  summary: {
    filesCreated: number;
    filesModified: number;
    testsRun: number;
    testsPassed: number;
  };
}

/**
 * Payload for mission:failed event
 */
export interface MissionFailedPayload extends BaseEventPayload {
  error: {
    message: string;
    code?: string;
    recoverable: boolean;
  };
  completedTasks: number;
  failedTasks: number;
  duration: number;
}

/**
 * Payload for mission:cancelled event
 */
export interface MissionCancelledPayload extends BaseEventPayload {
  reason: string;
  cancelledBy: 'user' | 'system' | 'timeout';
  completedTasks: number;
  pendingTasks: number;
}

/**
 * Union type for all mission event payloads
 */
export type MissionEventPayload =
  | MissionInitializedPayload
  | MissionInProgressPayload
  | MissionCompletedPayload
  | MissionFailedPayload
  | MissionCancelledPayload;

/**
 * Payload for task:started event
 */
export interface TaskStartedPayload extends BaseEventPayload {
  taskId: string;
  title: string;
  description: string;
  agentId: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

/**
 * Payload for task:progress event
 */
export interface TaskProgressPayload extends BaseEventPayload {
  taskId: string;
  agentId: string;
  progress: number;
  currentStep?: string;
  logs?: string[];
}

/**
 * Payload for task:completed event
 */
export interface TaskCompletedPayload extends BaseEventPayload {
  taskId: string;
  agentId: string;
  duration: number;
  result: {
    filesCreated?: string[];
    filesModified?: string[];
    output?: string;
  };
}

/**
 * Payload for task:failed event
 */
export interface TaskFailedPayload extends BaseEventPayload {
  taskId: string;
  agentId: string;
  error: {
    message: string;
    code?: string;
    stack?: string;
  };
  duration: number;
  retryCount: number;
  willRetry: boolean;
}

/**
 * Union type for all task event payloads
 */
export type TaskEventPayload =
  | TaskStartedPayload
  | TaskProgressPayload
  | TaskCompletedPayload
  | TaskFailedPayload;

// =============================================================================
// Client-to-Server Events
// =============================================================================

/**
 * Events sent from clients to the server
 */
export interface ClientToServerEvents {
  'subscribe:mission': (missionId: string, callback?: (success: boolean) => void) => void;
  'unsubscribe:mission': (missionId: string, callback?: (success: boolean) => void) => void;
  'subscribe:all': (callback?: (success: boolean) => void) => void;
  'unsubscribe:all': (callback?: (success: boolean) => void) => void;
  'ping': (callback: (pong: string) => void) => void;
}

/**
 * Events sent from server to clients
 */
export interface ServerToClientEvents {
  // Agent events
  'agent:spawned': (payload: AgentSpawnedPayload) => void;
  'agent:status_changed': (payload: AgentStatusChangedPayload) => void;
  'agent:task_completed': (payload: AgentTaskCompletedPayload) => void;
  'agent:task_failed': (payload: AgentTaskFailedPayload) => void;
  'agent:terminated': (payload: AgentTerminatedPayload) => void;

  // Mission events
  'mission:initialized': (payload: MissionInitializedPayload) => void;
  'mission:in_progress': (payload: MissionInProgressPayload) => void;
  'mission:completed': (payload: MissionCompletedPayload) => void;
  'mission:failed': (payload: MissionFailedPayload) => void;
  'mission:cancelled': (payload: MissionCancelledPayload) => void;

  // Task events
  'task:started': (payload: TaskStartedPayload) => void;
  'task:progress': (payload: TaskProgressPayload) => void;
  'task:completed': (payload: TaskCompletedPayload) => void;
  'task:failed': (payload: TaskFailedPayload) => void;

  // Connection events
  'connected': (data: { socketId: string; serverTime: Date }) => void;
  'error': (error: { message: string; code?: string }) => void;
}

/**
 * Inter-server events (for Socket.IO adapter)
 */
export interface InterServerEvents {
  ping: () => void;
}

/**
 * Socket data attached to each connection
 */
export interface SocketData {
  userId?: string;
  subscribedMissions: Set<string>;
  connectedAt: Date;
  isAdmin: boolean;
}

// =============================================================================
// ProgressEmitter Class
// =============================================================================

/**
 * ProgressEmitter manages real-time WebSocket communication for the Aegis backend.
 * It handles client subscriptions to missions and emits events for agent, mission,
 * and task lifecycle changes.
 */
export class ProgressEmitter {
  private readonly io: SocketIOServer<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >;
  private readonly logger: Logger;
  private readonly missionRooms: Map<string, Set<string>>;
  private readonly socketMissions: Map<string, Set<string>>;
  private initialized: boolean = false;
  private readonly GLOBAL_ROOM = 'global:all-missions';

  constructor(
    io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
    logger: Logger
  ) {
    this.io = io;
    this.logger = logger.child({ component: 'ProgressEmitter' });
    this.missionRooms = new Map();
    this.socketMissions = new Map();
  }

  // ===========================================================================
  // Initialization
  // ===========================================================================

  /**
   * Initialize the WebSocket server and set up event handlers
   */
  public initialize(): void {
    if (this.initialized) {
      this.logger.warn('ProgressEmitter already initialized');
      return;
    }

    this.logger.info('Initializing ProgressEmitter WebSocket handlers');

    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });

    this.initialized = true;
    this.logger.info('ProgressEmitter initialization complete');
  }

  /**
   * Handle new socket connection
   */
  private handleConnection(
    socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
  ): void {
    const socketId = socket.id;

    // Initialize socket data
    socket.data.subscribedMissions = new Set();
    socket.data.connectedAt = new Date();
    socket.data.isAdmin = false;

    this.socketMissions.set(socketId, new Set());

    this.logger.info({ socketId }, 'Client connected');

    // Send connection confirmation
    socket.emit('connected', {
      socketId,
      serverTime: new Date(),
    });

    // Set up event handlers
    this.setupSocketHandlers(socket);

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      this.handleDisconnect(socket, reason);
    });
  }

  /**
   * Set up handlers for client-to-server events
   */
  private setupSocketHandlers(
    socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
  ): void {
    const socketId = socket.id;

    // Handle mission subscription
    socket.on('subscribe:mission', (missionId, callback) => {
      this.subscribeMission(socket, missionId);
      this.logger.debug({ socketId, missionId }, 'Client subscribed to mission');
      callback?.(true);
    });

    // Handle mission unsubscription
    socket.on('unsubscribe:mission', (missionId, callback) => {
      this.unsubscribeMission(socket, missionId);
      this.logger.debug({ socketId, missionId }, 'Client unsubscribed from mission');
      callback?.(true);
    });

    // Handle subscribe to all missions (admin feature)
    socket.on('subscribe:all', (callback) => {
      socket.join(this.GLOBAL_ROOM);
      socket.data.isAdmin = true;
      this.logger.info({ socketId }, 'Client subscribed to all missions');
      callback?.(true);
    });

    // Handle unsubscribe from all missions
    socket.on('unsubscribe:all', (callback) => {
      socket.leave(this.GLOBAL_ROOM);
      socket.data.isAdmin = false;
      this.logger.debug({ socketId }, 'Client unsubscribed from all missions');
      callback?.(true);
    });

    // Handle ping for connection health check
    socket.on('ping', (callback) => {
      callback('pong');
    });
  }

  /**
   * Subscribe a socket to a mission room
   */
  private subscribeMission(
    socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
    missionId: string
  ): void {
    const roomName = this.getMissionRoom(missionId);
    socket.join(roomName);

    // Track subscription
    socket.data.subscribedMissions.add(missionId);

    const socketMissions = this.socketMissions.get(socket.id);
    if (socketMissions) {
      socketMissions.add(missionId);
    }

    // Track room membership
    if (!this.missionRooms.has(missionId)) {
      this.missionRooms.set(missionId, new Set());
    }
    this.missionRooms.get(missionId)!.add(socket.id);
  }

  /**
   * Unsubscribe a socket from a mission room
   */
  private unsubscribeMission(
    socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
    missionId: string
  ): void {
    const roomName = this.getMissionRoom(missionId);
    socket.leave(roomName);

    // Remove tracking
    socket.data.subscribedMissions.delete(missionId);

    const socketMissions = this.socketMissions.get(socket.id);
    if (socketMissions) {
      socketMissions.delete(missionId);
    }

    // Update room membership
    const room = this.missionRooms.get(missionId);
    if (room) {
      room.delete(socket.id);
      if (room.size === 0) {
        this.missionRooms.delete(missionId);
      }
    }
  }

  /**
   * Handle socket disconnection
   */
  private handleDisconnect(
    socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
    reason: string
  ): void {
    const socketId = socket.id;

    this.logger.info({ socketId, reason }, 'Client disconnected');

    // Clean up mission subscriptions
    const missions = this.socketMissions.get(socketId);
    if (missions) {
      for (const missionId of missions) {
        const room = this.missionRooms.get(missionId);
        if (room) {
          room.delete(socketId);
          if (room.size === 0) {
            this.missionRooms.delete(missionId);
          }
        }
      }
      this.socketMissions.delete(socketId);
    }
  }

  // ===========================================================================
  // Event Emission Methods
  // ===========================================================================

  /**
   * Emit an agent event to subscribed clients
   */
  public emitAgentEvent(type: AgentEventType, data: SwarmEvent | AgentEventPayload): void {
    const payload = this.normalizePayload(data);
    const missionId = payload.missionId;

    if (!missionId) {
      this.logger.warn({ type }, 'Agent event missing missionId');
      return;
    }

    const roomName = this.getMissionRoom(missionId);

    // Emit to mission subscribers
    this.io.to(roomName).emit(type, payload as never);

    // Emit to global subscribers (admins)
    this.io.to(this.GLOBAL_ROOM).emit(type, payload as never);

    this.logger.debug(
      { type, missionId, subscriberCount: this.getSubscriberCount(missionId) },
      'Agent event emitted'
    );
  }

  /**
   * Emit a mission event to subscribed clients
   */
  public emitMissionEvent(type: MissionEventType, data: MissionEventPayload): void {
    const missionId = data.missionId;

    if (!missionId) {
      this.logger.warn({ type }, 'Mission event missing missionId');
      return;
    }

    const payload: MissionEventPayload = {
      ...data,
      timestamp: data.timestamp || new Date(),
    };

    const roomName = this.getMissionRoom(missionId);

    // Emit to mission subscribers
    this.io.to(roomName).emit(type, payload as never);

    // Emit to global subscribers (admins)
    this.io.to(this.GLOBAL_ROOM).emit(type, payload as never);

    this.logger.debug(
      { type, missionId, subscriberCount: this.getSubscriberCount(missionId) },
      'Mission event emitted'
    );
  }

  /**
   * Emit a task event to subscribed clients
   */
  public emitTaskEvent(type: TaskEventType, data: TaskEventPayload): void {
    const missionId = data.missionId;

    if (!missionId) {
      this.logger.warn({ type }, 'Task event missing missionId');
      return;
    }

    const payload: TaskEventPayload = {
      ...data,
      timestamp: data.timestamp || new Date(),
    };

    const roomName = this.getMissionRoom(missionId);

    // Emit to mission subscribers
    this.io.to(roomName).emit(type, payload as never);

    // Emit to global subscribers (admins)
    this.io.to(this.GLOBAL_ROOM).emit(type, payload as never);

    this.logger.debug(
      { type, missionId, taskId: data.taskId, subscriberCount: this.getSubscriberCount(missionId) },
      'Task event emitted'
    );
  }

  // ===========================================================================
  // Convenience Methods
  // ===========================================================================

  /**
   * Emit agent spawned event
   */
  public emitAgentSpawned(
    missionId: string,
    agentId: string,
    agentName: string,
    slotIndex: number,
    task: Task
  ): void {
    const payload: AgentSpawnedPayload = {
      timestamp: new Date(),
      missionId,
      agentId,
      agentName,
      slotIndex,
      task,
    };
    this.emitAgentEvent('agent:spawned', payload);
  }

  /**
   * Emit agent status changed event
   */
  public emitAgentStatusChanged(
    missionId: string,
    agentId: string,
    previousStatus: AgentStatusType,
    newStatus: AgentStatusType,
    progress?: number
  ): void {
    const payload: AgentStatusChangedPayload = {
      timestamp: new Date(),
      missionId,
      agentId,
      previousStatus,
      newStatus,
      progress,
    };
    this.emitAgentEvent('agent:status_changed', payload);
  }

  /**
   * Emit mission initialized event
   */
  public emitMissionInitialized(
    missionId: string,
    title: string,
    description: string,
    totalTasks: number,
    estimatedDuration: number,
    maxAgents: number
  ): void {
    const payload: MissionInitializedPayload = {
      timestamp: new Date(),
      missionId,
      title,
      description,
      totalTasks,
      estimatedDuration,
      maxAgents,
    };
    this.emitMissionEvent('mission:initialized', payload);
  }

  /**
   * Emit mission progress update
   */
  public emitMissionProgress(
    missionId: string,
    progress: number,
    completedTasks: number,
    totalTasks: number,
    activeAgents: number,
    elapsedTime: number
  ): void {
    const payload: MissionInProgressPayload = {
      timestamp: new Date(),
      missionId,
      progress,
      completedTasks,
      totalTasks,
      activeAgents,
      elapsedTime,
    };
    this.emitMissionEvent('mission:in_progress', payload);
  }

  /**
   * Emit mission completed event
   */
  public emitMissionCompleted(
    missionId: string,
    stats: {
      totalTasks: number;
      completedTasks: number;
      failedTasks: number;
      duration: number;
      outputPath: string;
      filesCreated: number;
      filesModified: number;
      testsRun: number;
      testsPassed: number;
    }
  ): void {
    const payload: MissionCompletedPayload = {
      timestamp: new Date(),
      missionId,
      totalTasks: stats.totalTasks,
      completedTasks: stats.completedTasks,
      failedTasks: stats.failedTasks,
      duration: stats.duration,
      outputPath: stats.outputPath,
      summary: {
        filesCreated: stats.filesCreated,
        filesModified: stats.filesModified,
        testsRun: stats.testsRun,
        testsPassed: stats.testsPassed,
      },
    };
    this.emitMissionEvent('mission:completed', payload);
  }

  /**
   * Emit mission failed event
   */
  public emitMissionFailed(
    missionId: string,
    error: { message: string; code?: string; recoverable: boolean },
    completedTasks: number,
    failedTasks: number,
    duration: number
  ): void {
    const payload: MissionFailedPayload = {
      timestamp: new Date(),
      missionId,
      error,
      completedTasks,
      failedTasks,
      duration,
    };
    this.emitMissionEvent('mission:failed', payload);
  }

  /**
   * Emit mission cancelled event
   */
  public emitMissionCancelled(
    missionId: string,
    reason: string,
    cancelledBy: 'user' | 'system' | 'timeout',
    completedTasks: number,
    pendingTasks: number
  ): void {
    const payload: MissionCancelledPayload = {
      timestamp: new Date(),
      missionId,
      reason,
      cancelledBy,
      completedTasks,
      pendingTasks,
    };
    this.emitMissionEvent('mission:cancelled', payload);
  }

  /**
   * Emit task started event
   */
  public emitTaskStarted(
    missionId: string,
    task: Task,
    agentId: string
  ): void {
    const payload: TaskStartedPayload = {
      timestamp: new Date(),
      missionId,
      taskId: task.id,
      title: task.title,
      description: task.description,
      agentId,
      priority: task.priority,
    };
    this.emitTaskEvent('task:started', payload);
  }

  /**
   * Emit task progress event
   */
  public emitTaskProgress(
    missionId: string,
    taskId: string,
    agentId: string,
    progress: number,
    currentStep?: string,
    logs?: string[]
  ): void {
    const payload: TaskProgressPayload = {
      timestamp: new Date(),
      missionId,
      taskId,
      agentId,
      progress,
      currentStep,
      logs,
    };
    this.emitTaskEvent('task:progress', payload);
  }

  /**
   * Emit task completed event
   */
  public emitTaskCompleted(
    missionId: string,
    taskId: string,
    agentId: string,
    duration: number,
    result: { filesCreated?: string[]; filesModified?: string[]; output?: string }
  ): void {
    const payload: TaskCompletedPayload = {
      timestamp: new Date(),
      missionId,
      taskId,
      agentId,
      duration,
      result,
    };
    this.emitTaskEvent('task:completed', payload);
  }

  /**
   * Emit task failed event
   */
  public emitTaskFailed(
    missionId: string,
    taskId: string,
    agentId: string,
    error: { message: string; code?: string; stack?: string },
    duration: number,
    retryCount: number,
    willRetry: boolean
  ): void {
    const payload: TaskFailedPayload = {
      timestamp: new Date(),
      missionId,
      taskId,
      agentId,
      error,
      duration,
      retryCount,
      willRetry,
    };
    this.emitTaskEvent('task:failed', payload);
  }

  // ===========================================================================
  // Utility Methods
  // ===========================================================================

  /**
   * Get the Socket.IO room name for a mission
   */
  private getMissionRoom(missionId: string): string {
    return `mission:${missionId}`;
  }

  /**
   * Normalize event payload from SwarmEvent or raw payload
   */
  private normalizePayload(data: SwarmEvent | AgentEventPayload): AgentEventPayload {
    if ('type' in data && 'payload' in data) {
      // It's a SwarmEvent
      const swarmEvent = data as SwarmEvent;
      return {
        timestamp: swarmEvent.timestamp,
        missionId: swarmEvent.missionId,
        ...(swarmEvent.payload as Record<string, unknown>),
      } as AgentEventPayload;
    }
    return data as AgentEventPayload;
  }

  /**
   * Get number of subscribers for a mission
   */
  public getSubscriberCount(missionId: string): number {
    const room = this.missionRooms.get(missionId);
    return room ? room.size : 0;
  }

  /**
   * Get all active mission room IDs
   */
  public getActiveMissionRooms(): string[] {
    return Array.from(this.missionRooms.keys());
  }

  /**
   * Get total connected clients
   */
  public async getConnectedClientCount(): Promise<number> {
    const sockets = await this.io.fetchSockets();
    return sockets.length;
  }

  /**
   * Broadcast a message to all connected clients
   */
  public broadcastError(message: string, code?: string): void {
    this.io.emit('error', { message, code });
    this.logger.warn({ message, code }, 'Broadcast error sent');
  }

  /**
   * Clean up resources for a completed/cancelled mission
   */
  public cleanupMission(missionId: string): void {
    const room = this.missionRooms.get(missionId);

    if (room) {
      this.logger.info(
        { missionId, subscriberCount: room.size },
        'Cleaning up mission room'
      );

      // Remove mission from all sockets' subscription tracking
      for (const socketId of room) {
        const socketMissions = this.socketMissions.get(socketId);
        if (socketMissions) {
          socketMissions.delete(missionId);
        }
      }

      this.missionRooms.delete(missionId);
    }
  }

  /**
   * Check if the emitter is initialized
   */
  public isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Shutdown the progress emitter
   */
  public async shutdown(): Promise<void> {
    this.logger.info('Shutting down ProgressEmitter');

    // Clear all tracking data
    this.missionRooms.clear();
    this.socketMissions.clear();

    // Close all socket connections
    const sockets = await this.io.fetchSockets();
    for (const socket of sockets) {
      socket.disconnect(true);
    }

    this.initialized = false;
    this.logger.info('ProgressEmitter shutdown complete');
  }
}

export default ProgressEmitter;
