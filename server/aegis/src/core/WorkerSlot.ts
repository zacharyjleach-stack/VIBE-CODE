/**
 * WorkerSlot - Individual Worker Representation
 *
 * Represents a single worker slot that can execute tasks either through
 * simulated execution or real Docker container execution. Handles task
 * lifecycle, file system operations, and progress reporting.
 */

import { EventEmitter } from 'events';
import { promises as fs } from 'fs';
import path from 'path';
import type { Logger } from 'pino';
import type Docker from 'dockerode';
import type { Container } from 'dockerode';

import type {
  Task,
  WorkerSlotConfig,
  WorkerSlotState,
  WorkerSlotStatus,
  WorkerMetrics,
} from '../types/index.js';

// =============================================================================
// Types
// =============================================================================

interface WorkerSlotEvents {
  'task:started': (data: { agentId: string; taskId: string }) => void;
  'task:progress': (data: { agentId: string; taskId: string; progress: number }) => void;
  'task:completed': (data: { agentId: string; taskId: string; result: TaskResult }) => void;
  'task:failed': (data: { agentId: string; taskId: string; error: string }) => void;
  'log': (data: { agentId: string; level: string; message: string; data?: unknown }) => void;
}

interface TaskResult {
  success: boolean;
  filesCreated: string[];
  filesModified: string[];
  output: string;
  duration: number;
}

interface HealthCheckResult {
  healthy: boolean;
  reason?: string;
  metrics: WorkerMetrics;
}

// =============================================================================
// WorkerSlot Class
// =============================================================================

export class WorkerSlot extends EventEmitter {
  private readonly config: WorkerSlotConfig;
  private readonly logger: Logger;
  private readonly docker: Docker | null;
  private state: WorkerSlotState;
  private container: Container | null = null;
  private currentAgentId: string | null = null;
  private taskStartTime: number | null = null;
  private abortController: AbortController | null = null;

  constructor(config: WorkerSlotConfig, docker: Docker | null, logger: Logger) {
    super();
    this.config = config;
    this.docker = docker;
    this.logger = logger.child({ component: 'WorkerSlot', slotIndex: config.index });

    this.state = {
      id: config.id,
      status: 'available',
      currentTask: null,
      agentId: null,
      startTime: null,
      metrics: {
        tasksCompleted: 0,
        tasksFailed: 0,
        totalExecutionTimeMs: 0,
        averageExecutionTimeMs: 0,
        memoryUsageMB: 0,
        cpuUsagePercent: 0,
      },
    };
  }

  // ===========================================================================
  // Public API
  // ===========================================================================

  public getIndex(): number {
    return this.config.index;
  }

  public isAvailable(): boolean {
    return this.state.status === 'available';
  }

  public getState(): WorkerSlotState {
    return { ...this.state };
  }

  public getMetrics(): WorkerMetrics {
    return { ...this.state.metrics };
  }

  /**
   * Assigns a task to this worker slot
   */
  public async assignTask(
    agentId: string,
    task: Task,
    workspacePath: string
  ): Promise<void> {
    if (!this.isAvailable()) {
      throw new Error(`Worker slot ${this.config.index} is not available`);
    }

    this.state.status = 'busy';
    this.state.currentTask = task;
    this.state.agentId = agentId;
    this.state.startTime = new Date();
    this.currentAgentId = agentId;
    this.taskStartTime = Date.now();
    this.abortController = new AbortController();

    this.logger.info({ agentId, taskId: task.id }, 'Task assigned to worker');

    // Emit task started event
    this.emit('task:started', { agentId, taskId: task.id });

    try {
      // Execute the task
      const result = await this.executeTask(task, workspacePath);

      // Update metrics
      this.updateMetrics(true, Date.now() - this.taskStartTime);

      // Emit completion event
      this.emit('task:completed', {
        agentId,
        taskId: task.id,
        result,
      });

      this.logger.info({ agentId, taskId: task.id, duration: result.duration }, 'Task completed');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Update metrics
      this.updateMetrics(false, Date.now() - (this.taskStartTime || Date.now()));

      // Emit failure event
      this.emit('task:failed', {
        agentId,
        taskId: task.id,
        error: errorMessage,
      });

      this.logger.error({ error, agentId, taskId: task.id }, 'Task failed');
    } finally {
      this.reset();
    }
  }

  /**
   * Terminates the current task execution
   */
  public async terminate(): Promise<void> {
    if (this.abortController) {
      this.abortController.abort();
    }

    if (this.container) {
      try {
        await this.container.stop({ t: 5 });
        await this.container.remove();
      } catch (error) {
        this.logger.warn({ error }, 'Error stopping container');
      }
      this.container = null;
    }

    this.reset();
    this.logger.info('Worker slot terminated');
  }

  /**
   * Performs a health check on this worker slot
   */
  public async checkHealth(): Promise<HealthCheckResult> {
    const metrics = this.getMetrics();

    // Check if worker is stuck
    if (this.state.status === 'busy' && this.taskStartTime) {
      const runningTime = Date.now() - this.taskStartTime;
      if (runningTime > 600000) { // 10 minutes
        return {
          healthy: false,
          reason: 'Task running longer than expected',
          metrics,
        };
      }
    }

    // Check container health if using Docker
    if (this.container) {
      try {
        const info = await this.container.inspect();
        if (!info.State.Running) {
          return {
            healthy: false,
            reason: 'Container not running',
            metrics,
          };
        }
      } catch (error) {
        return {
          healthy: false,
          reason: 'Failed to inspect container',
          metrics,
        };
      }
    }

    return { healthy: true, metrics };
  }

  // ===========================================================================
  // Task Execution
  // ===========================================================================

  private async executeTask(task: Task, workspacePath: string): Promise<TaskResult> {
    if (this.config.useDocker && this.docker) {
      return this.executeInDocker(task, workspacePath);
    }
    return this.executeSimulated(task, workspacePath);
  }

  /**
   * Executes task in a Docker container
   */
  private async executeInDocker(task: Task, workspacePath: string): Promise<TaskResult> {
    const startTime = Date.now();

    this.emitLog('info', `Starting Docker execution for task: ${task.title}`);

    try {
      // Create container
      this.container = await this.docker!.createContainer({
        Image: this.config.dockerImage,
        Cmd: ['node', '/app/worker.js'],
        Env: [
          `TASK_ID=${task.id}`,
          `TASK_TITLE=${task.title}`,
          `TASK_DESCRIPTION=${task.description}`,
          `WORKSPACE_PATH=/workspace`,
        ],
        HostConfig: {
          Binds: [`${workspacePath}:/workspace:rw`],
          Memory: this.config.maxMemoryMB * 1024 * 1024,
          CpuPercent: this.config.maxCpuPercent,
          AutoRemove: true,
        },
        WorkingDir: '/workspace',
      });

      // Start container
      await this.container.start();

      // Wait for completion with progress updates
      const result = await this.waitForContainer(task.id);

      return {
        success: result.exitCode === 0,
        filesCreated: result.filesCreated,
        filesModified: result.filesModified,
        output: result.output,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      this.emitLog('error', `Docker execution failed: ${error}`);
      throw error;
    } finally {
      this.container = null;
    }
  }

  private async waitForContainer(
    taskId: string
  ): Promise<{ exitCode: number; output: string; filesCreated: string[]; filesModified: string[] }> {
    if (!this.container) {
      throw new Error('No container to wait for');
    }

    // Attach to container logs for progress
    const stream = await this.container.logs({
      follow: true,
      stdout: true,
      stderr: true,
    });

    let output = '';
    let progress = 0;

    stream.on('data', (chunk: Buffer) => {
      const line = chunk.toString();
      output += line;

      // Parse progress updates from output
      const progressMatch = line.match(/\[PROGRESS:(\d+)\]/);
      if (progressMatch) {
        progress = parseInt(progressMatch[1], 10);
        this.emit('task:progress', {
          agentId: this.currentAgentId!,
          taskId,
          progress,
        });
      }

      this.emitLog('debug', line.trim());
    });

    // Wait for container to exit
    const exitInfo = await this.container.wait();

    return {
      exitCode: exitInfo.StatusCode,
      output,
      filesCreated: [], // Would be parsed from container output in real implementation
      filesModified: [],
    };
  }

  /**
   * Executes task with simulated execution (no Docker)
   */
  private async executeSimulated(task: Task, workspacePath: string): Promise<TaskResult> {
    const startTime = Date.now();
    const filesCreated: string[] = [];
    const filesModified: string[] = [];
    let output = '';

    this.emitLog('info', `Starting simulated execution for task: ${task.title}`);

    try {
      // Ensure workspace exists
      await fs.mkdir(workspacePath, { recursive: true });

      // Simulate task execution phases
      const phases = [
        { name: 'Analyzing requirements', progress: 10, duration: 500 },
        { name: 'Planning implementation', progress: 20, duration: 300 },
        { name: 'Writing code', progress: 50, duration: 1000 },
        { name: 'Creating files', progress: 70, duration: 500 },
        { name: 'Running validation', progress: 90, duration: 300 },
        { name: 'Finalizing', progress: 100, duration: 200 },
      ];

      for (const phase of phases) {
        // Check for abort
        if (this.abortController?.signal.aborted) {
          throw new Error('Task aborted');
        }

        this.emitLog('info', phase.name);
        this.emit('task:progress', {
          agentId: this.currentAgentId!,
          taskId: task.id,
          progress: phase.progress,
        });

        await this.sleep(phase.duration);
        output += `[${phase.progress}%] ${phase.name}\n`;
      }

      // Create a sample output file to demonstrate file system manipulation
      const outputFile = path.join(workspacePath, `task-${task.id}-output.json`);
      await fs.writeFile(
        outputFile,
        JSON.stringify({
          taskId: task.id,
          title: task.title,
          completedAt: new Date().toISOString(),
          status: 'completed',
        }, null, 2)
      );
      filesCreated.push(outputFile);

      this.emitLog('info', `Task completed successfully`);

      return {
        success: true,
        filesCreated,
        filesModified,
        output,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      this.emitLog('error', `Simulated execution failed: ${error}`);
      throw error;
    }
  }

  // ===========================================================================
  // Internal Helpers
  // ===========================================================================

  private reset(): void {
    this.state.status = 'available';
    this.state.currentTask = null;
    this.state.agentId = null;
    this.state.startTime = null;
    this.currentAgentId = null;
    this.taskStartTime = null;
    this.abortController = null;
  }

  private updateMetrics(success: boolean, durationMs: number): void {
    if (success) {
      this.state.metrics.tasksCompleted++;
    } else {
      this.state.metrics.tasksFailed++;
    }

    this.state.metrics.totalExecutionTimeMs += durationMs;
    this.state.metrics.averageExecutionTimeMs =
      this.state.metrics.totalExecutionTimeMs /
      (this.state.metrics.tasksCompleted + this.state.metrics.tasksFailed);
  }

  private emitLog(level: string, message: string, data?: unknown): void {
    if (this.currentAgentId) {
      this.emit('log', {
        agentId: this.currentAgentId,
        level,
        message,
        data,
      });
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(resolve, ms);

      if (this.abortController) {
        this.abortController.signal.addEventListener('abort', () => {
          clearTimeout(timeout);
          reject(new Error('Aborted'));
        });
      }
    });
  }

  // ===========================================================================
  // Typed Event Emitter Methods
  // ===========================================================================

  public override on<K extends keyof WorkerSlotEvents>(
    event: K,
    listener: WorkerSlotEvents[K]
  ): this {
    return super.on(event, listener);
  }

  public override emit<K extends keyof WorkerSlotEvents>(
    event: K,
    ...args: Parameters<WorkerSlotEvents[K]>
  ): boolean {
    return super.emit(event, ...args);
  }
}
