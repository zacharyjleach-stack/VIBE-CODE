/**
 * SwarmManager - Core Agent Swarm Orchestration
 *
 * Manages a pool of 16 concurrent worker slots for parallel task execution.
 * Handles agent lifecycle management, event emission, and resource allocation.
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import type { Logger } from 'pino';
import Docker from 'dockerode';

import { WorkerSlot } from './WorkerSlot.js';
import type {
  AgentInfo,
  AgentStatusType,
  AgentStatus,
  Task,
  WorkerSlotConfig,
  SwarmEvent,
  AgentSpawnedEvent,
  AgentStatusChangedEvent,
} from '../types/index.js';

// =============================================================================
// Types
// =============================================================================

interface SwarmConfig {
  maxWorkers: number;
  taskTimeoutMs: number;
  healthCheckIntervalMs: number;
}

interface DockerConfig {
  enabled: boolean;
  socketPath: string;
  workerImage: string;
  network: string;
}

interface SwarmManagerEvents {
  'agent:spawned': (event: AgentSpawnedEvent) => void;
  'agent:status_changed': (event: AgentStatusChangedEvent) => void;
  'agent:task_started': (event: SwarmEvent) => void;
  'agent:task_completed': (event: SwarmEvent) => void;
  'agent:task_failed': (event: SwarmEvent) => void;
  'agent:terminated': (event: SwarmEvent) => void;
  'agent:log': (event: SwarmEvent) => void;
}

// =============================================================================
// SwarmManager Class
// =============================================================================

export class SwarmManager extends EventEmitter {
  private readonly config: SwarmConfig;
  private readonly dockerConfig: DockerConfig;
  private readonly logger: Logger;
  private readonly workers: Map<number, WorkerSlot>;
  private readonly agents: Map<string, AgentInfo>;
  private docker: Docker | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private initialized: boolean = false;

  constructor(config: SwarmConfig, dockerConfig: DockerConfig, logger: Logger) {
    super();
    this.config = config;
    this.dockerConfig = dockerConfig;
    this.logger = logger.child({ component: 'SwarmManager' });
    this.workers = new Map();
    this.agents = new Map();
  }

  // ===========================================================================
  // Initialization
  // ===========================================================================

  public async initialize(): Promise<void> {
    if (this.initialized) {
      this.logger.warn('SwarmManager already initialized');
      return;
    }

    this.logger.info({ maxWorkers: this.config.maxWorkers }, 'Initializing SwarmManager');

    // Initialize Docker client if enabled
    if (this.dockerConfig.enabled) {
      try {
        this.docker = new Docker({ socketPath: this.dockerConfig.socketPath });
        const version = await this.docker.version();
        this.logger.info({ dockerVersion: version.Version }, 'Docker connection established');
      } catch (error) {
        this.logger.warn({ error }, 'Docker not available, falling back to simulated execution');
        this.docker = null;
      }
    }

    // Initialize worker slots
    for (let i = 0; i < this.config.maxWorkers; i++) {
      const slotConfig: WorkerSlotConfig = {
        id: `worker-${i}`,
        index: i,
        maxMemoryMB: 512,
        maxCpuPercent: 25,
        workspaceRoot: `/tmp/aegis/workspaces/worker-${i}`,
        useDocker: this.docker !== null,
        dockerImage: this.dockerConfig.workerImage,
      };

      const worker = new WorkerSlot(slotConfig, this.docker, this.logger);
      this.setupWorkerListeners(worker);
      this.workers.set(i, worker);
    }

    // Start health check interval
    this.healthCheckInterval = setInterval(
      () => this.performHealthCheck(),
      this.config.healthCheckIntervalMs
    );

    this.initialized = true;
    this.logger.info('SwarmManager initialization complete');
  }

  private setupWorkerListeners(worker: WorkerSlot): void {
    worker.on('task:started', (data) => {
      const agent = this.agents.get(data.agentId);
      if (agent) {
        this.updateAgentStatus(agent.id, 'coding');
        this.emitEvent('agent:task_started', agent.missionId, {
          agentId: agent.id,
          taskId: data.taskId,
        });
      }
    });

    worker.on('task:progress', (data) => {
      const agent = this.agents.get(data.agentId);
      if (agent) {
        agent.progress = data.progress;
        agent.updatedAt = new Date();
      }
    });

    worker.on('task:completed', (data) => {
      const agent = this.agents.get(data.agentId);
      if (agent) {
        this.updateAgentStatus(agent.id, 'complete');
        this.emitEvent('agent:task_completed', agent.missionId, {
          agentId: agent.id,
          taskId: data.taskId,
          result: data.result,
        });
      }
    });

    worker.on('task:failed', (data) => {
      const agent = this.agents.get(data.agentId);
      if (agent) {
        this.updateAgentStatus(agent.id, 'error');
        this.emitEvent('agent:task_failed', agent.missionId, {
          agentId: agent.id,
          taskId: data.taskId,
          error: data.error,
        });
      }
    });

    worker.on('log', (data) => {
      const agent = this.agents.get(data.agentId);
      if (agent) {
        agent.logs.push({
          timestamp: new Date(),
          level: data.level,
          message: data.message,
          data: data.data,
        });
        this.emitEvent('agent:log', agent.missionId, data);
      }
    });
  }

  // ===========================================================================
  // Agent Management
  // ===========================================================================

  /**
   * Spawns a new agent to execute a task
   */
  public async spawnAgent(
    task: Task,
    missionId: string,
    workspacePath: string
  ): Promise<AgentInfo | null> {
    const availableSlot = this.findAvailableSlot();

    if (!availableSlot) {
      this.logger.warn('No available worker slots');
      return null;
    }

    const agentId = uuidv4();
    const agentName = `Agent-${availableSlot.getIndex()}-${task.title.slice(0, 20)}`;

    const agent: AgentInfo = {
      id: agentId,
      name: agentName,
      slotIndex: availableSlot.getIndex(),
      status: 'initializing',
      currentTask: task,
      missionId,
      createdAt: new Date(),
      updatedAt: new Date(),
      progress: 0,
      logs: [],
    };

    this.agents.set(agentId, agent);

    // Emit spawned event
    this.emitEvent('agent:spawned', missionId, {
      agentId,
      slotIndex: availableSlot.getIndex(),
      task,
    });

    this.logger.info(
      { agentId, slotIndex: availableSlot.getIndex(), taskId: task.id },
      'Agent spawned'
    );

    // Start task execution
    try {
      await availableSlot.assignTask(agentId, task, workspacePath);
      return agent;
    } catch (error) {
      this.logger.error({ error, agentId }, 'Failed to assign task to agent');
      this.agents.delete(agentId);
      return null;
    }
  }

  /**
   * Terminates a specific agent
   */
  public async terminateAgent(agentId: string): Promise<boolean> {
    const agent = this.agents.get(agentId);

    if (!agent) {
      this.logger.warn({ agentId }, 'Agent not found for termination');
      return false;
    }

    const worker = this.workers.get(agent.slotIndex);

    if (worker) {
      await worker.terminate();
    }

    this.updateAgentStatus(agentId, 'terminated');
    this.emitEvent('agent:terminated', agent.missionId, { agentId });

    this.logger.info({ agentId }, 'Agent terminated');
    return true;
  }

  /**
   * Terminates all active agents
   */
  public async terminateAll(): Promise<void> {
    this.logger.info('Terminating all agents');

    const terminationPromises = Array.from(this.agents.keys()).map((agentId) =>
      this.terminateAgent(agentId)
    );

    await Promise.all(terminationPromises);

    this.logger.info('All agents terminated');
  }

  /**
   * Gets the status of a specific agent
   */
  public getAgentStatus(agentId: string): AgentInfo | null {
    return this.agents.get(agentId) || null;
  }

  /**
   * Gets all agents, optionally filtered by mission
   */
  public getAllAgents(missionId?: string): AgentInfo[] {
    const agents = Array.from(this.agents.values());

    if (missionId) {
      return agents.filter((agent) => agent.missionId === missionId);
    }

    return agents;
  }

  /**
   * Gets agents grouped by status
   */
  public getAgentsByStatus(): Record<AgentStatusType, AgentInfo[]> {
    const grouped: Record<AgentStatusType, AgentInfo[]> = {
      idle: [],
      initializing: [],
      coding: [],
      testing: [],
      complete: [],
      error: [],
      terminated: [],
    };

    for (const agent of this.agents.values()) {
      grouped[agent.status].push(agent);
    }

    return grouped;
  }

  /**
   * Gets the count of active (non-idle, non-terminated, non-complete) agents
   */
  public getActiveAgentCount(): number {
    let count = 0;
    for (const agent of this.agents.values()) {
      if (!['idle', 'terminated', 'complete', 'error'].includes(agent.status)) {
        count++;
      }
    }
    return count;
  }

  /**
   * Gets number of available worker slots
   */
  public getAvailableSlotCount(): number {
    let count = 0;
    for (const worker of this.workers.values()) {
      if (worker.isAvailable()) {
        count++;
      }
    }
    return count;
  }

  // ===========================================================================
  // Internal Helpers
  // ===========================================================================

  private findAvailableSlot(): WorkerSlot | null {
    for (const worker of this.workers.values()) {
      if (worker.isAvailable()) {
        return worker;
      }
    }
    return null;
  }

  private updateAgentStatus(agentId: string, newStatus: AgentStatusType): void {
    const agent = this.agents.get(agentId);

    if (!agent) {
      return;
    }

    const previousStatus = agent.status;
    agent.status = newStatus;
    agent.updatedAt = new Date();

    this.emitEvent('agent:status_changed', agent.missionId, {
      agentId,
      previousStatus,
      newStatus,
    });

    this.logger.debug(
      { agentId, previousStatus, newStatus },
      'Agent status changed'
    );
  }

  private emitEvent(type: string, missionId: string, payload: unknown): void {
    const event: SwarmEvent = {
      type: type as SwarmEvent['type'],
      timestamp: new Date(),
      missionId,
      payload,
    };

    this.emit(type, event);
  }

  private async performHealthCheck(): Promise<void> {
    for (const worker of this.workers.values()) {
      const health = await worker.checkHealth();

      if (!health.healthy) {
        this.logger.warn(
          { slotIndex: worker.getIndex(), reason: health.reason },
          'Worker unhealthy'
        );
      }
    }
  }

  // ===========================================================================
  // Cleanup
  // ===========================================================================

  public async shutdown(): Promise<void> {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    await this.terminateAll();

    this.workers.clear();
    this.agents.clear();
    this.initialized = false;

    this.logger.info('SwarmManager shutdown complete');
  }

  // ===========================================================================
  // Typed Event Emitter Methods
  // ===========================================================================

  public override on<K extends keyof SwarmManagerEvents>(
    event: K,
    listener: SwarmManagerEvents[K]
  ): this {
    return super.on(event, listener);
  }

  public override emit<K extends keyof SwarmManagerEvents>(
    event: K,
    ...args: Parameters<SwarmManagerEvents[K]>
  ): boolean {
    return super.emit(event, ...args);
  }
}
