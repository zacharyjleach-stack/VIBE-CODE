/**
 * Status Routes - System Monitoring and Mission Status Endpoints
 *
 * Provides endpoints for monitoring system health, swarm state,
 * and individual mission status. Also handles mission cancellation.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import type { Logger } from 'pino';
import type Redis from 'ioredis';
import type {
  HealthCheckResponse,
  StatusResponse,
  CancelResponse,
} from '@iris-aegis/protocol';
import { MAX_SWARM_SIZE } from '@iris-aegis/protocol';
import type { SwarmManager } from '../core/SwarmManager.js';
import type { MissionOrchestrator } from '../services/MissionOrchestrator.js';
import type {
  SystemStatus,
  MissionState,
  WorkerSlotState,
  AgentInfo,
} from '../types/index.js';

// =============================================================================
// Types
// =============================================================================

interface StatusRouterDependencies {
  swarmManager: SwarmManager;
  missionOrchestrator: MissionOrchestrator;
  redis: Redis | null;
  logger: Logger;
}

interface SwarmStatusResponse {
  totalSlots: number;
  availableSlots: number;
  activeAgents: number;
  slots: SlotInfo[];
}

interface SlotInfo {
  index: number;
  status: string;
  agentId: string | null;
  taskId: string | null;
  taskTitle: string | null;
  progress: number;
  startTime: Date | null;
}

interface MissionsListResponse {
  missions: MissionSummary[];
  total: number;
  active: number;
  completed: number;
  failed: number;
}

interface MissionSummary {
  id: string;
  status: string;
  progress: number;
  agentCount: number;
  startTime: Date | null;
  title?: string;
}

interface MissionDetailResponse {
  mission: MissionState;
  agents: AgentInfo[];
  completedTasks: number;
  totalTasks: number;
  failedTasks: number;
  inProgressTasks: number;
}

// =============================================================================
// Validation Schemas
// =============================================================================

const MissionIdParamSchema = z.object({
  id: z.string().uuid('Mission ID must be a valid UUID'),
});

const CancelRequestBodySchema = z.object({
  reason: z.string().max(500).optional(),
  sessionId: z.string().uuid('Session ID must be a valid UUID').optional(),
});

// =============================================================================
// Middleware
// =============================================================================

/**
 * Validates mission ID parameter
 */
function validateMissionId(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  try {
    const result = MissionIdParamSchema.safeParse(req.params);

    if (!result.success) {
      const error = new MissionIdValidationError(
        result.error.issues[0]?.message || 'Invalid mission ID'
      );
      return next(error);
    }

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Validates cancel request body
 */
function validateCancelRequest(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  try {
    const result = CancelRequestBodySchema.safeParse(req.body);

    if (!result.success) {
      const error = new ValidationError(
        result.error.issues.map((i) => i.message).join('; ')
      );
      return next(error);
    }

    req.body = result.data;
    next();
  } catch (error) {
    next(error);
  }
}

// =============================================================================
// Error Classes
// =============================================================================

class MissionIdValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MissionIdValidationError';
  }
}

class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

class MissionNotFoundError extends Error {
  public readonly missionId: string;

  constructor(missionId: string) {
    super(`Mission not found: ${missionId}`);
    this.name = 'MissionNotFoundError';
    this.missionId = missionId;
  }
}

// =============================================================================
// Route Handlers
// =============================================================================

/**
 * GET /status
 * Returns overall system health and status
 */
async function handleSystemStatus(
  _req: Request,
  res: Response<SystemStatus>,
  next: NextFunction,
  { swarmManager, missionOrchestrator, redis, logger }: StatusRouterDependencies
): Promise<void> {
  const requestLogger = logger.child({ handler: 'systemStatus' });

  try {
    requestLogger.debug('Fetching system status');

    // Check Redis connectivity
    let redisStatus = { connected: false, latencyMs: 0 };
    if (redis) {
      try {
        const startTime = Date.now();
        await redis.ping();
        redisStatus = {
          connected: true,
          latencyMs: Date.now() - startTime,
        };
      } catch (err) {
        requestLogger.warn({ err }, 'Redis health check failed');
        redisStatus = { connected: false, latencyMs: 0 };
      }
    }

    // Get swarm and mission stats
    const activeAgents = swarmManager.getActiveAgentCount();
    const availableSlots = swarmManager.getAvailableSlotCount();
    const missionStats = await missionOrchestrator.getStats();

    const status: SystemStatus = {
      healthy: redisStatus.connected || redis === null,
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      activeWorkers: activeAgents,
      totalWorkers: MAX_SWARM_SIZE,
      activeMissions: missionStats.activeMissions,
      redis: redisStatus,
      docker: {
        available: true, // Simplified; could be enhanced with actual Docker check
        runningContainers: activeAgents,
      },
      metrics: {
        totalMissionsCompleted: missionStats.completedMissions,
        totalTasksProcessed: missionStats.totalTasksProcessed,
        averageMissionDuration: missionStats.averageMissionDuration,
      },
    };

    requestLogger.debug({ healthy: status.healthy, activeWorkers: status.activeWorkers }, 'System status retrieved');

    res.json(status);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /status/swarm
 * Returns the current state of all 16 worker slots
 */
async function handleSwarmStatus(
  _req: Request,
  res: Response<SwarmStatusResponse>,
  next: NextFunction,
  { swarmManager, logger }: StatusRouterDependencies
): Promise<void> {
  const requestLogger = logger.child({ handler: 'swarmStatus' });

  try {
    requestLogger.debug('Fetching swarm status');

    const agents = swarmManager.getAllAgents();
    const availableSlots = swarmManager.getAvailableSlotCount();
    const activeAgentCount = swarmManager.getActiveAgentCount();

    // Build slot information for all 16 slots
    const slots: SlotInfo[] = [];
    const agentsBySlot = new Map<number, AgentInfo>();

    // Index agents by slot
    for (const agent of agents) {
      agentsBySlot.set(agent.slotIndex, agent);
    }

    // Create slot info for all 16 slots
    for (let i = 0; i < MAX_SWARM_SIZE; i++) {
      const agent = agentsBySlot.get(i);

      if (agent) {
        slots.push({
          index: i,
          status: agent.status,
          agentId: agent.id,
          taskId: agent.currentTask?.id || null,
          taskTitle: agent.currentTask?.title || null,
          progress: agent.progress,
          startTime: agent.createdAt,
        });
      } else {
        slots.push({
          index: i,
          status: 'available',
          agentId: null,
          taskId: null,
          taskTitle: null,
          progress: 0,
          startTime: null,
        });
      }
    }

    const response: SwarmStatusResponse = {
      totalSlots: MAX_SWARM_SIZE,
      availableSlots,
      activeAgents: activeAgentCount,
      slots,
    };

    requestLogger.debug(
      { availableSlots, activeAgents: activeAgentCount },
      'Swarm status retrieved'
    );

    res.json(response);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /status/missions
 * Returns a list of all active missions
 */
async function handleMissionsList(
  _req: Request,
  res: Response<MissionsListResponse>,
  next: NextFunction,
  { missionOrchestrator, logger }: StatusRouterDependencies
): Promise<void> {
  const requestLogger = logger.child({ handler: 'missionsList' });

  try {
    requestLogger.debug('Fetching missions list');

    const missions = await missionOrchestrator.getAllMissions();

    const summaries: MissionSummary[] = missions.map((mission) => ({
      id: mission.id,
      status: mission.status,
      progress: mission.progress,
      agentCount: mission.agents.size,
      startTime: mission.startTime,
      title: mission.brief.title,
    }));

    // Count by status
    const statusCounts = {
      active: 0,
      completed: 0,
      failed: 0,
    };

    for (const mission of missions) {
      if (mission.status === 'completed') {
        statusCounts.completed++;
      } else if (mission.status === 'failed' || mission.status === 'cancelled') {
        statusCounts.failed++;
      } else {
        statusCounts.active++;
      }
    }

    const response: MissionsListResponse = {
      missions: summaries,
      total: missions.length,
      active: statusCounts.active,
      completed: statusCounts.completed,
      failed: statusCounts.failed,
    };

    requestLogger.debug(
      { total: missions.length, active: statusCounts.active },
      'Missions list retrieved'
    );

    res.json(response);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /status/missions/:id
 * Returns detailed status for a specific mission
 */
async function handleMissionDetail(
  req: Request,
  res: Response<MissionDetailResponse>,
  next: NextFunction,
  { missionOrchestrator, swarmManager, logger }: StatusRouterDependencies
): Promise<void> {
  const { id: missionId } = req.params;
  const requestLogger = logger.child({ handler: 'missionDetail', missionId });

  try {
    requestLogger.debug('Fetching mission details');

    const mission = await missionOrchestrator.getMission(missionId);

    if (!mission) {
      throw new MissionNotFoundError(missionId);
    }

    // Get agents for this mission
    const agents = swarmManager.getAllAgents(missionId);

    const response: MissionDetailResponse = {
      mission,
      agents,
      completedTasks: mission.completedTasks.length,
      totalTasks: mission.brief.tasks.length,
      failedTasks: mission.failedTasks.length,
      inProgressTasks: mission.inProgressTasks.length,
    };

    requestLogger.debug(
      {
        status: mission.status,
        progress: mission.progress,
        agentCount: agents.length,
      },
      'Mission details retrieved'
    );

    res.json(response);
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /missions/:id
 * Cancels an active mission
 */
async function handleMissionCancel(
  req: Request,
  res: Response<CancelResponse>,
  next: NextFunction,
  { missionOrchestrator, logger }: StatusRouterDependencies
): Promise<void> {
  const { id: missionId } = req.params;
  const { reason, sessionId } = req.body;
  const requestLogger = logger.child({
    handler: 'missionCancel',
    missionId,
    sessionId,
  });

  try {
    requestLogger.info({ reason }, 'Processing mission cancellation request');

    const mission = await missionOrchestrator.getMission(missionId);

    if (!mission) {
      throw new MissionNotFoundError(missionId);
    }

    // Check if mission can be cancelled
    if (mission.status === 'completed') {
      requestLogger.warn('Cannot cancel completed mission');
      res.status(400).json({
        success: false,
        error: 'Cannot cancel a completed mission',
      });
      return;
    }

    if (mission.status === 'cancelled') {
      requestLogger.warn('Mission already cancelled');
      res.status(400).json({
        success: false,
        error: 'Mission is already cancelled',
      });
      return;
    }

    // Perform cancellation
    const result = await missionOrchestrator.cancelMission(missionId, reason);

    if (!result.success) {
      requestLogger.warn({ error: result.error }, 'Mission cancellation failed');
      res.status(500).json({
        success: false,
        error: result.error,
      });
      return;
    }

    requestLogger.info('Mission cancelled successfully');

    res.json({
      success: true,
      mission: result.mission,
    });
  } catch (error) {
    next(error);
  }
}

// =============================================================================
// Error Handler
// =============================================================================

/**
 * Status routes error handler
 */
function statusErrorHandler(
  err: Error,
  _req: Request,
  res: Response,
  next: NextFunction,
  logger: Logger
): void {
  if (res.headersSent) {
    return next(err);
  }

  const errorLogger = logger.child({ errorType: err.name });

  if (err instanceof MissionIdValidationError || err instanceof ValidationError) {
    errorLogger.warn({ message: err.message }, 'Validation error');
    res.status(400).json({
      error: 'Bad Request',
      message: err.message,
    });
    return;
  }

  if (err instanceof MissionNotFoundError) {
    errorLogger.warn({ missionId: err.missionId }, 'Mission not found');
    res.status(404).json({
      error: 'Not Found',
      message: err.message,
    });
    return;
  }

  // Log unexpected errors
  errorLogger.error({ err }, 'Unexpected error in status handler');

  res.status(500).json({
    error: 'Internal Server Error',
    message:
      process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred'
        : err.message,
  });
}

// =============================================================================
// Router Factory
// =============================================================================

/**
 * Creates the status router with all necessary dependencies
 *
 * @param swarmManager - The swarm manager instance
 * @param missionOrchestrator - The mission orchestrator service
 * @param redis - Redis client (or null if not available)
 * @param logger - Pino logger instance
 * @returns Configured Express Router
 *
 * @example
 * ```typescript
 * const router = createStatusRouter(swarmManager, missionOrchestrator, redis, logger);
 * app.use('/api', router);
 * ```
 */
export function createStatusRouter(
  swarmManager: SwarmManager,
  missionOrchestrator: MissionOrchestrator,
  redis: Redis | null,
  logger: Logger
): Router {
  const router = Router();
  const routeLogger = logger.child({ router: 'status' });

  const dependencies: StatusRouterDependencies = {
    swarmManager,
    missionOrchestrator,
    redis,
    logger: routeLogger,
  };

  // GET /status - Overall system status
  router.get('/status', (req: Request, res: Response, next: NextFunction) => {
    handleSystemStatus(req, res, next, dependencies).catch(next);
  });

  // GET /status/swarm - Swarm manager state (all 16 worker slots)
  router.get('/status/swarm', (req: Request, res: Response, next: NextFunction) => {
    handleSwarmStatus(req, res, next, dependencies).catch(next);
  });

  // GET /status/missions - List active missions
  router.get('/status/missions', (req: Request, res: Response, next: NextFunction) => {
    handleMissionsList(req, res, next, dependencies).catch(next);
  });

  // GET /status/missions/:id - Get specific mission details
  router.get(
    '/status/missions/:id',
    validateMissionId,
    (req: Request, res: Response, next: NextFunction) => {
      handleMissionDetail(req, res, next, dependencies).catch(next);
    }
  );

  // DELETE /missions/:id - Cancel a mission
  router.delete(
    '/missions/:id',
    validateMissionId,
    validateCancelRequest,
    (req: Request, res: Response, next: NextFunction) => {
      handleMissionCancel(req, res, next, dependencies).catch(next);
    }
  );

  // Route-specific error handler
  router.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    statusErrorHandler(err, req, res, next, routeLogger);
  });

  routeLogger.debug('Status router initialized');

  return router;
}

export default createStatusRouter;
