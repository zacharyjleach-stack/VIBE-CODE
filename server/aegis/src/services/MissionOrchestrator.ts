/**
 * MissionOrchestrator - Mission Execution Coordination Service
 *
 * Coordinates the execution of missions by decomposing them into tasks,
 * distributing work to swarm workers, tracking dependencies, and emitting
 * progress events throughout the mission lifecycle.
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import type { Logger } from 'pino';

import type { SwarmManager } from '../core/SwarmManager.js';
import type { FileSystemManager } from './FileSystemManager.js';
import type { ProgressEmitter } from '../websocket/ProgressEmitter.js';
import type {
  MissionBrief,
  MissionState,
  MissionStatusType,
  Task,
  AgentInfo,
  SwarmEvent,
  MissionProgressEvent,
} from '../types/index.js';
import {
  MissionStatus,
  TaskSchema,
} from '../types/index.js';

import type {
  HandoffRequest,
  ExecutionPhase,
} from '@iris-aegis/protocol';

// =============================================================================
// Types
// =============================================================================

/**
 * Task types for mission decomposition
 */
export type TaskType = 'scaffold' | 'implement' | 'test' | 'review' | 'document';

/**
 * Decomposed task with additional metadata
 * Extends the base Task type with orchestration-specific fields
 */
export interface DecomposedTask {
  // Base task properties
  id: string;
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  dependencies: string[];
  estimatedDuration?: number;
  assignedAgent?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  tags: string[];
  // Orchestration-specific properties
  taskType: TaskType;
  phase: ExecutionPhase;
  retryCount: number;
  maxRetries: number;
}

/**
 * Mission initialization request
 */
export interface MissionInitRequest {
  brief: MissionBrief;
  sessionId: string;
  callbackUrl?: string;
  dryRun?: boolean;
}

/**
 * Mission initialization result
 */
export interface MissionInitResult {
  success: boolean;
  missionId: string;
  wsChannel: string;
  estimatedDuration: number;
  totalTasks: number;
  error?: string;
}

/**
 * Task dependency graph node
 */
interface TaskNode {
  task: DecomposedTask;
  dependencies: Set<string>;
  dependents: Set<string>;
  completed: boolean;
}

/**
 * Mission orchestrator events
 */
interface MissionOrchestratorEvents {
  'mission:initialized': (event: SwarmEvent) => void;
  'mission:started': (event: SwarmEvent) => void;
  'mission:progress': (event: MissionProgressEvent) => void;
  'mission:phase_changed': (event: SwarmEvent) => void;
  'mission:completed': (event: SwarmEvent) => void;
  'mission:failed': (event: SwarmEvent) => void;
  'mission:cancelled': (event: SwarmEvent) => void;
  'task:ready': (event: SwarmEvent) => void;
  'task:completed': (event: SwarmEvent) => void;
  'task:failed': (event: SwarmEvent) => void;
}

// =============================================================================
// MissionOrchestrator Class
// =============================================================================

export class MissionOrchestrator extends EventEmitter {
  private readonly logger: Logger;
  private readonly swarmManager: SwarmManager;
  private readonly fileSystemManager: FileSystemManager;
  private readonly progressEmitter: ProgressEmitter;
  private readonly missions: Map<string, MissionState>;
  private readonly taskGraphs: Map<string, Map<string, TaskNode>>;
  private readonly processingLoops: Map<string, NodeJS.Timeout>;

  constructor(
    swarmManager: SwarmManager,
    fileSystemManager: FileSystemManager,
    progressEmitter: ProgressEmitter,
    logger: Logger
  ) {
    super();
    this.swarmManager = swarmManager;
    this.fileSystemManager = fileSystemManager;
    this.progressEmitter = progressEmitter;
    this.logger = logger.child({ component: 'MissionOrchestrator' });
    this.missions = new Map();
    this.taskGraphs = new Map();
    this.processingLoops = new Map();
  }

  // ===========================================================================
  // Public API
  // ===========================================================================

  /**
   * Initializes a new mission from a handoff request
   */
  public async initializeMission(request: MissionInitRequest): Promise<MissionInitResult> {
    const missionId = request.brief.id || uuidv4();
    const wsChannel = `mission:${missionId}`;

    this.logger.info({ missionId, title: request.brief.title }, 'Initializing mission');

    try {
      // Validate mission brief
      this.validateMissionBrief(request.brief);

      // Create workspace for this mission
      const workspacePath = await this.fileSystemManager.createWorkspace(missionId);

      // Decompose mission into tasks
      const decomposedTasks = this.decomposeMission(request.brief);

      // Build dependency graph
      const taskGraph = this.buildTaskGraph(decomposedTasks);
      this.taskGraphs.set(missionId, taskGraph);

      // Create mission state
      const missionState: MissionState = {
        id: missionId,
        brief: request.brief,
        status: MissionStatus.PENDING,
        agents: new Map(),
        completedTasks: [],
        failedTasks: [],
        pendingTasks: decomposedTasks,
        inProgressTasks: [],
        startTime: null,
        endTime: null,
        progress: 0,
        outputPath: workspacePath,
        wsChannel,
      };

      this.missions.set(missionId, missionState);

      // Emit initialization event
      this.emitMissionEvent('mission:initialized', missionId, {
        missionId,
        totalTasks: decomposedTasks.length,
        wsChannel,
      });

      this.logger.info(
        { missionId, totalTasks: decomposedTasks.length, workspacePath },
        'Mission initialized successfully'
      );

      // Start mission execution if not dry run
      if (!request.dryRun) {
        // Use setImmediate to allow the response to be sent first
        setImmediate(() => this.startMission(missionId));
      }

      return {
        success: true,
        missionId,
        wsChannel,
        estimatedDuration: this.estimateDuration(decomposedTasks),
        totalTasks: decomposedTasks.length,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error({ error, missionId }, 'Failed to initialize mission');

      return {
        success: false,
        missionId,
        wsChannel,
        estimatedDuration: 0,
        totalTasks: 0,
        error: errorMessage,
      };
    }
  }

  /**
   * Gets a mission by ID
   */
  public getMission(missionId: string): MissionState | null {
    const mission = this.missions.get(missionId);
    if (!mission) {
      this.logger.debug({ missionId }, 'Mission not found');
      return null;
    }
    return mission;
  }

  /**
   * Cancels a running mission
   */
  public async cancelMission(missionId: string, reason?: string): Promise<boolean> {
    const mission = this.missions.get(missionId);

    if (!mission) {
      this.logger.warn({ missionId }, 'Cannot cancel: mission not found');
      return false;
    }

    if (mission.status === MissionStatus.COMPLETED || mission.status === MissionStatus.CANCELLED) {
      this.logger.warn({ missionId, status: mission.status }, 'Cannot cancel: mission already finished');
      return false;
    }

    this.logger.info({ missionId, reason }, 'Cancelling mission');

    try {
      // Stop the processing loop
      this.stopProcessingLoop(missionId);

      // Terminate all agents working on this mission
      const missionAgents = this.swarmManager.getAllAgents(missionId);
      for (const agent of missionAgents) {
        await this.swarmManager.terminateAgent(agent.id);
      }

      // Update mission status
      this.updateMissionStatus(missionId, MissionStatus.CANCELLED);
      mission.endTime = new Date();

      // Clean up workspace
      await this.fileSystemManager.deleteWorkspace(missionId);

      // Emit cancellation event
      this.emitMissionEvent('mission:cancelled', missionId, {
        missionId,
        reason: reason || 'User requested cancellation',
        completedTasks: mission.completedTasks.length,
        totalTasks: mission.brief.tasks.length,
      });

      this.logger.info({ missionId }, 'Mission cancelled successfully');
      return true;
    } catch (error) {
      this.logger.error({ error, missionId }, 'Error cancelling mission');
      return false;
    }
  }

  /**
   * Gets all active missions
   */
  public getActiveMissions(): MissionState[] {
    const activeMissions: MissionState[] = [];

    for (const mission of this.missions.values()) {
      if (
        mission.status === MissionStatus.PENDING ||
        mission.status === MissionStatus.INITIALIZING ||
        mission.status === MissionStatus.IN_PROGRESS ||
        mission.status === MissionStatus.TESTING
      ) {
        activeMissions.push(mission);
      }
    }

    return activeMissions;
  }

  /**
   * Gets mission statistics
   */
  public getMissionStats(): {
    total: number;
    active: number;
    completed: number;
    failed: number;
    cancelled: number;
  } {
    let active = 0;
    let completed = 0;
    let failed = 0;
    let cancelled = 0;

    for (const mission of this.missions.values()) {
      switch (mission.status) {
        case MissionStatus.PENDING:
        case MissionStatus.INITIALIZING:
        case MissionStatus.IN_PROGRESS:
        case MissionStatus.TESTING:
          active++;
          break;
        case MissionStatus.COMPLETED:
          completed++;
          break;
        case MissionStatus.FAILED:
          failed++;
          break;
        case MissionStatus.CANCELLED:
          cancelled++;
          break;
      }
    }

    return {
      total: this.missions.size,
      active,
      completed,
      failed,
      cancelled,
    };
  }

  // ===========================================================================
  // Mission Execution
  // ===========================================================================

  /**
   * Starts mission execution
   */
  private async startMission(missionId: string): Promise<void> {
    const mission = this.missions.get(missionId);

    if (!mission) {
      this.logger.error({ missionId }, 'Cannot start: mission not found');
      return;
    }

    this.logger.info({ missionId }, 'Starting mission execution');

    mission.startTime = new Date();
    this.updateMissionStatus(missionId, MissionStatus.IN_PROGRESS);

    // Emit start event
    this.emitMissionEvent('mission:started', missionId, {
      missionId,
      startTime: mission.startTime,
      totalTasks: mission.pendingTasks.length,
    });

    // Start the task processing loop
    this.startProcessingLoop(missionId);
  }

  /**
   * Starts the task processing loop for a mission
   */
  private startProcessingLoop(missionId: string): void {
    const processInterval = setInterval(async () => {
      await this.processReadyTasks(missionId);
    }, 1000); // Check every second

    this.processingLoops.set(missionId, processInterval);
  }

  /**
   * Stops the task processing loop for a mission
   */
  private stopProcessingLoop(missionId: string): void {
    const interval = this.processingLoops.get(missionId);
    if (interval) {
      clearInterval(interval);
      this.processingLoops.delete(missionId);
    }
  }

  /**
   * Processes tasks that are ready to execute
   */
  private async processReadyTasks(missionId: string): Promise<void> {
    const mission = this.missions.get(missionId);
    const taskGraph = this.taskGraphs.get(missionId);

    if (!mission || !taskGraph) {
      return;
    }

    // Check if mission is still active
    if (
      mission.status !== MissionStatus.IN_PROGRESS &&
      mission.status !== MissionStatus.TESTING
    ) {
      this.stopProcessingLoop(missionId);
      return;
    }

    // Find ready tasks (all dependencies completed)
    const readyTasks = this.getReadyTasks(missionId);

    // Get available worker count
    const availableSlots = this.swarmManager.getAvailableSlotCount();

    // Assign tasks to available workers
    const tasksToAssign = readyTasks.slice(0, availableSlots);

    for (const task of tasksToAssign) {
      await this.assignTask(missionId, task);
    }

    // Update progress
    this.updateMissionProgress(missionId);

    // Check if mission is complete
    if (mission.pendingTasks.length === 0 && mission.inProgressTasks.length === 0) {
      this.completeMission(missionId);
    }
  }

  /**
   * Gets tasks that are ready to execute (all dependencies satisfied)
   */
  private getReadyTasks(missionId: string): DecomposedTask[] {
    const mission = this.missions.get(missionId);
    const taskGraph = this.taskGraphs.get(missionId);

    if (!mission || !taskGraph) {
      return [];
    }

    const readyTasks: DecomposedTask[] = [];

    for (const task of mission.pendingTasks) {
      const node = taskGraph.get(task.id);
      if (!node) continue;

      // Check if all dependencies are completed
      let allDependenciesComplete = true;
      for (const depId of node.dependencies) {
        const depNode = taskGraph.get(depId);
        if (depNode && !depNode.completed) {
          allDependenciesComplete = false;
          break;
        }
      }

      if (allDependenciesComplete) {
        readyTasks.push(task as DecomposedTask);
      }
    }

    return readyTasks;
  }

  /**
   * Assigns a task to a swarm worker
   */
  private async assignTask(missionId: string, task: DecomposedTask): Promise<void> {
    const mission = this.missions.get(missionId);

    if (!mission) {
      return;
    }

    this.logger.debug({ missionId, taskId: task.id, taskType: task.taskType }, 'Assigning task');

    try {
      // Move task from pending to in-progress
      mission.pendingTasks = mission.pendingTasks.filter((t) => t.id !== task.id);
      mission.inProgressTasks.push(task);

      // Spawn agent for this task
      const agent = await this.swarmManager.spawnAgent(
        task,
        missionId,
        mission.outputPath
      );

      if (agent) {
        mission.agents.set(agent.id, agent);

        // Set up completion handler
        this.setupTaskCompletionHandler(missionId, task.id, agent.id);

        this.emitMissionEvent('task:ready', missionId, {
          taskId: task.id,
          taskType: task.taskType,
          agentId: agent.id,
        });
      } else {
        // No worker available, put task back in pending
        mission.inProgressTasks = mission.inProgressTasks.filter((t) => t.id !== task.id);
        mission.pendingTasks.push(task);
        this.logger.warn({ missionId, taskId: task.id }, 'No worker available for task');
      }
    } catch (error) {
      this.logger.error({ error, missionId, taskId: task.id }, 'Failed to assign task');

      // Move task back to pending for retry
      mission.inProgressTasks = mission.inProgressTasks.filter((t) => t.id !== task.id);
      mission.pendingTasks.push(task);
    }
  }

  /**
   * Sets up completion handler for a task
   */
  private setupTaskCompletionHandler(
    missionId: string,
    taskId: string,
    agentId: string
  ): void {
    const handleCompletion = (event: SwarmEvent) => {
      const payload = event.payload as { agentId: string; taskId: string; result?: unknown };

      if (event.missionId === missionId && payload.agentId === agentId) {
        this.onTaskCompleted(missionId, taskId, payload.result);
        this.swarmManager.off('agent:task_completed', handleCompletion);
        this.swarmManager.off('agent:task_failed', handleFailure);
      }
    };

    const handleFailure = (event: SwarmEvent) => {
      const payload = event.payload as { agentId: string; taskId: string; error?: string };

      if (event.missionId === missionId && payload.agentId === agentId) {
        this.onTaskFailed(missionId, taskId, payload.error || 'Unknown error');
        this.swarmManager.off('agent:task_completed', handleCompletion);
        this.swarmManager.off('agent:task_failed', handleFailure);
      }
    };

    this.swarmManager.on('agent:task_completed', handleCompletion);
    this.swarmManager.on('agent:task_failed', handleFailure);
  }

  /**
   * Handles task completion
   */
  private onTaskCompleted(missionId: string, taskId: string, result?: unknown): void {
    const mission = this.missions.get(missionId);
    const taskGraph = this.taskGraphs.get(missionId);

    if (!mission || !taskGraph) {
      return;
    }

    const task = mission.inProgressTasks.find((t) => t.id === taskId);
    if (!task) {
      return;
    }

    this.logger.info({ missionId, taskId }, 'Task completed');

    // Move task from in-progress to completed
    mission.inProgressTasks = mission.inProgressTasks.filter((t) => t.id !== taskId);
    mission.completedTasks.push(task);

    // Mark as completed in task graph
    const node = taskGraph.get(taskId);
    if (node) {
      node.completed = true;
    }

    // Emit completion event
    this.emitMissionEvent('task:completed', missionId, {
      taskId,
      taskType: (task as DecomposedTask).taskType,
      result,
    });

    // Update progress
    this.updateMissionProgress(missionId);
  }

  /**
   * Handles task failure
   */
  private onTaskFailed(missionId: string, taskId: string, error: string): void {
    const mission = this.missions.get(missionId);

    if (!mission) {
      return;
    }

    const task = mission.inProgressTasks.find((t) => t.id === taskId) as DecomposedTask | undefined;
    if (!task) {
      return;
    }

    this.logger.warn({ missionId, taskId, error, retryCount: task.retryCount }, 'Task failed');

    // Move task from in-progress
    mission.inProgressTasks = mission.inProgressTasks.filter((t) => t.id !== taskId);

    // Check if we should retry
    if (task.retryCount < task.maxRetries) {
      task.retryCount++;
      mission.pendingTasks.push(task);
      this.logger.info({ missionId, taskId, retryCount: task.retryCount }, 'Retrying task');
    } else {
      mission.failedTasks.push(task);

      // Emit failure event
      this.emitMissionEvent('task:failed', missionId, {
        taskId,
        taskType: task.taskType,
        error,
        retryCount: task.retryCount,
      });

      // Check if this is a critical failure
      if (task.priority === 'critical') {
        this.failMission(missionId, `Critical task failed: ${error}`);
      }
    }
  }

  /**
   * Completes a mission
   */
  private completeMission(missionId: string): void {
    const mission = this.missions.get(missionId);

    if (!mission) {
      return;
    }

    this.stopProcessingLoop(missionId);

    // Check if there are failed tasks
    if (mission.failedTasks.length > 0) {
      this.failMission(missionId, `${mission.failedTasks.length} tasks failed`);
      return;
    }

    mission.endTime = new Date();
    this.updateMissionStatus(missionId, MissionStatus.COMPLETED);

    const duration = mission.endTime.getTime() - (mission.startTime?.getTime() || 0);

    this.logger.info(
      { missionId, durationMs: duration, completedTasks: mission.completedTasks.length },
      'Mission completed successfully'
    );

    // Emit completion event
    this.emitMissionEvent('mission:completed', missionId, {
      missionId,
      duration,
      completedTasks: mission.completedTasks.length,
      outputPath: mission.outputPath,
    });
  }

  /**
   * Fails a mission
   */
  private failMission(missionId: string, reason: string): void {
    const mission = this.missions.get(missionId);

    if (!mission) {
      return;
    }

    this.stopProcessingLoop(missionId);

    mission.endTime = new Date();
    this.updateMissionStatus(missionId, MissionStatus.FAILED);

    this.logger.error({ missionId, reason }, 'Mission failed');

    // Terminate any remaining agents
    const missionAgents = this.swarmManager.getAllAgents(missionId);
    for (const agent of missionAgents) {
      this.swarmManager.terminateAgent(agent.id).catch((err) => {
        this.logger.warn({ err, agentId: agent.id }, 'Failed to terminate agent');
      });
    }

    // Emit failure event
    this.emitMissionEvent('mission:failed', missionId, {
      missionId,
      reason,
      completedTasks: mission.completedTasks.length,
      failedTasks: mission.failedTasks.length,
    });
  }

  // ===========================================================================
  // Mission Decomposition
  // ===========================================================================

  /**
   * Decomposes a mission into executable tasks
   */
  private decomposeMission(brief: MissionBrief): DecomposedTask[] {
    const tasks: DecomposedTask[] = [];

    // Phase 1: Scaffolding tasks
    const scaffoldTask = this.createTask(
      'scaffold',
      'Scaffold Project Structure',
      `Set up the project structure for ${brief.techStack.language} ${brief.techStack.framework || ''} project`,
      'critical',
      [],
      'Scaffolding' as ExecutionPhase
    );
    tasks.push(scaffoldTask);

    // Phase 2: Implementation tasks (from mission brief)
    for (const task of brief.tasks) {
      const implementTask: DecomposedTask = {
        ...task,
        taskType: 'implement',
        phase: 'Coding' as ExecutionPhase,
        retryCount: 0,
        maxRetries: 3,
        dependencies: task.dependencies.length > 0 ? task.dependencies : [scaffoldTask.id],
      };
      tasks.push(implementTask);
    }

    // Get implementation task IDs for dependency chaining
    const implementTaskIds = tasks
      .filter((t) => t.taskType === 'implement')
      .map((t) => t.id);

    // Phase 3: Testing task
    if (brief.constraints.testRequired) {
      const testTask = this.createTask(
        'test',
        'Run Tests',
        'Execute test suite and verify all tests pass',
        'high',
        implementTaskIds,
        'Testing' as ExecutionPhase
      );
      tasks.push(testTask);
    }

    // Phase 4: Review task
    const reviewDeps = brief.constraints.testRequired
      ? tasks.filter((t) => t.taskType === 'test').map((t) => t.id)
      : implementTaskIds;

    const reviewTask = this.createTask(
      'review',
      'Code Review',
      'Review code quality, patterns, and best practices',
      'medium',
      reviewDeps,
      'Review' as ExecutionPhase
    );
    tasks.push(reviewTask);

    // Phase 5: Documentation task
    const documentTask = this.createTask(
      'document',
      'Generate Documentation',
      'Generate project documentation and README',
      'low',
      [reviewTask.id],
      'Finalization' as ExecutionPhase
    );
    tasks.push(documentTask);

    this.logger.debug({ missionId: brief.id, taskCount: tasks.length }, 'Mission decomposed');

    return tasks;
  }

  /**
   * Creates a decomposed task
   */
  private createTask(
    taskType: TaskType,
    title: string,
    description: string,
    priority: 'critical' | 'high' | 'medium' | 'low',
    dependencies: string[],
    phase: ExecutionPhase
  ): DecomposedTask {
    return {
      id: uuidv4(),
      title,
      description,
      priority,
      dependencies,
      status: 'pending',
      tags: [taskType],
      taskType,
      phase,
      retryCount: 0,
      maxRetries: taskType === 'scaffold' ? 1 : 3,
    };
  }

  /**
   * Builds a task dependency graph
   */
  private buildTaskGraph(tasks: DecomposedTask[]): Map<string, TaskNode> {
    const graph = new Map<string, TaskNode>();

    // Create nodes
    for (const task of tasks) {
      graph.set(task.id, {
        task,
        dependencies: new Set(task.dependencies),
        dependents: new Set(),
        completed: false,
      });
    }

    // Build dependent relationships
    for (const task of tasks) {
      for (const depId of task.dependencies) {
        const depNode = graph.get(depId);
        if (depNode) {
          depNode.dependents.add(task.id);
        }
      }
    }

    return graph;
  }

  // ===========================================================================
  // Helpers
  // ===========================================================================

  /**
   * Validates a mission brief
   */
  private validateMissionBrief(brief: MissionBrief): void {
    if (!brief.id) {
      throw new Error('Mission brief must have an ID');
    }

    if (!brief.title || brief.title.length === 0) {
      throw new Error('Mission brief must have a title');
    }

    if (!brief.tasks || brief.tasks.length === 0) {
      throw new Error('Mission brief must have at least one task');
    }

    // Validate each task
    for (const task of brief.tasks) {
      try {
        TaskSchema.parse(task);
      } catch (error) {
        throw new Error(`Invalid task in mission brief: ${error}`);
      }
    }
  }

  /**
   * Estimates mission duration based on tasks
   */
  private estimateDuration(tasks: DecomposedTask[]): number {
    let totalEstimate = 0;

    for (const task of tasks) {
      // Base estimate by task type (in milliseconds)
      const baseEstimates: Record<TaskType, number> = {
        scaffold: 30000, // 30 seconds
        implement: 60000, // 1 minute per implementation task
        test: 45000, // 45 seconds
        review: 30000, // 30 seconds
        document: 20000, // 20 seconds
      };

      totalEstimate += task.estimatedDuration || baseEstimates[task.taskType] || 60000;
    }

    // Add 20% buffer
    return Math.ceil(totalEstimate * 1.2);
  }

  /**
   * Updates mission status
   */
  private updateMissionStatus(missionId: string, status: MissionStatusType): void {
    const mission = this.missions.get(missionId);

    if (!mission) {
      return;
    }

    const previousStatus = mission.status;
    mission.status = status;

    this.logger.debug({ missionId, previousStatus, newStatus: status }, 'Mission status updated');

    // Notify progress emitter based on status type
    if (status === MissionStatus.IN_PROGRESS) {
      const mission = this.missions.get(missionId);
      if (mission) {
        const elapsedTime = mission.startTime
          ? Date.now() - mission.startTime.getTime()
          : 0;
        const totalTasks = mission.completedTasks.length +
                          mission.inProgressTasks.length +
                          mission.pendingTasks.length +
                          mission.failedTasks.length;
        this.progressEmitter.emitMissionProgress(
          missionId,
          mission.progress,
          mission.completedTasks.length,
          totalTasks,
          mission.inProgressTasks.length,
          elapsedTime
        );
      }
    }
  }

  /**
   * Updates mission progress
   */
  private updateMissionProgress(missionId: string): void {
    const mission = this.missions.get(missionId);

    if (!mission) {
      return;
    }

    const totalTasks = mission.completedTasks.length +
                       mission.inProgressTasks.length +
                       mission.pendingTasks.length +
                       mission.failedTasks.length;

    if (totalTasks === 0) {
      mission.progress = 0;
      return;
    }

    mission.progress = Math.round((mission.completedTasks.length / totalTasks) * 100);

    // Emit progress event
    const progressEvent: MissionProgressEvent = {
      type: 'mission:progress',
      timestamp: new Date(),
      missionId,
      payload: {
        progress: mission.progress,
        completedTasks: mission.completedTasks.length,
        totalTasks,
        activeAgents: mission.inProgressTasks.length,
      },
    };

    this.emit('mission:progress', progressEvent);

    // Calculate elapsed time
    const elapsedTime = mission.startTime
      ? Date.now() - mission.startTime.getTime()
      : 0;

    this.progressEmitter.emitMissionProgress(
      missionId,
      mission.progress,
      mission.completedTasks.length,
      totalTasks,
      mission.inProgressTasks.length,
      elapsedTime
    );
  }

  /**
   * Emits a mission event
   */
  private emitMissionEvent(type: string, missionId: string, payload: unknown): void {
    const event: SwarmEvent = {
      type: type as SwarmEvent['type'],
      timestamp: new Date(),
      missionId,
      payload,
    };

    this.emit(type, event);
  }

  // ===========================================================================
  // Cleanup
  // ===========================================================================

  /**
   * Shuts down the orchestrator
   */
  public async shutdown(): Promise<void> {
    this.logger.info('Shutting down MissionOrchestrator');

    // Stop all processing loops
    for (const [missionId, interval] of this.processingLoops) {
      clearInterval(interval);
      this.processingLoops.delete(missionId);
    }

    // Cancel all active missions
    for (const mission of this.getActiveMissions()) {
      await this.cancelMission(mission.id, 'System shutdown');
    }

    this.missions.clear();
    this.taskGraphs.clear();

    this.logger.info('MissionOrchestrator shutdown complete');
  }

  // ===========================================================================
  // Typed Event Emitter Methods
  // ===========================================================================

  public override on<K extends keyof MissionOrchestratorEvents>(
    event: K,
    listener: MissionOrchestratorEvents[K]
  ): this {
    return super.on(event, listener);
  }

  public override emit<K extends keyof MissionOrchestratorEvents>(
    event: K,
    ...args: Parameters<MissionOrchestratorEvents[K]>
  ): boolean {
    return super.emit(event, ...args);
  }
}
