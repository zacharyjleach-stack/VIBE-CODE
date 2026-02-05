/**
 * Handoff Route - Mission Initialization Endpoint
 *
 * Handles the handoff from Iris frontend to Aegis backend.
 * Receives vibe context and initializes a new mission with the agent swarm.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import type { Logger } from 'pino';
import type {
  HandoffRequest,
  HandoffResponse,
  Priority,
} from '@iris-aegis/protocol';
import { HandoffErrorCode } from '@iris-aegis/protocol';
import type { MissionOrchestrator } from '../services/MissionOrchestrator.js';

// =============================================================================
// Validation Schemas
// =============================================================================

/**
 * Tech stack validation schema
 */
const TechStackSchema = z.object({
  frontend: z.string().min(1, 'Frontend framework is required'),
  backend: z.string().min(1, 'Backend framework is required'),
  database: z.string().min(1, 'Database is required'),
  additional: z.array(z.string()).optional(),
});

/**
 * Style preferences validation schema
 */
const StylePreferencesSchema = z.object({
  theme: z.string().min(1, 'Theme is required'),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  fontFamily: z.string().optional(),
  componentLibrary: z.string().optional(),
  darkMode: z.boolean().optional(),
  responsive: z.boolean().optional(),
  accessibilityLevel: z.string().optional(),
});

/**
 * Vibe context validation schema
 */
const VibeContextSchema = z.object({
  userIntent: z.string().min(10, 'User intent must be at least 10 characters'),
  techStack: TechStackSchema,
  constraints: z.array(z.string()).default([]),
  stylePreferences: StylePreferencesSchema,
  features: z.array(z.string()).optional(),
  references: z.array(z.string()).optional(),
  targetAudience: z.string().optional(),
});

/**
 * Priority validation
 */
const PrioritySchema = z.enum(['Low', 'Medium', 'High', 'Critical']);

/**
 * Complete handoff request validation schema
 */
const HandoffRequestSchema = z.object({
  vibeContext: VibeContextSchema,
  priority: PrioritySchema,
  deadline: z.string().datetime().optional().transform((val) => val ? new Date(val) : undefined),
  tags: z.array(z.string().max(50)).max(20).optional(),
  dryRun: z.boolean().optional().default(false),
  callbackUrl: z.string().url().optional(),
  sessionId: z.string().uuid('Session ID must be a valid UUID'),
  parentMissionId: z.string().uuid().optional(),
});

// =============================================================================
// Types
// =============================================================================

interface HandoffRouterDependencies {
  missionOrchestrator: MissionOrchestrator;
  logger: Logger;
}

interface ValidationError {
  field: string;
  message: string;
}

// =============================================================================
// Error Classes
// =============================================================================

class HandoffValidationError extends Error {
  public readonly errors: ValidationError[];
  public readonly code: HandoffErrorCode;

  constructor(errors: ValidationError[]) {
    super('Validation failed');
    this.name = 'HandoffValidationError';
    this.errors = errors;
    this.code = HandoffErrorCode.InvalidRequest;
  }
}

class CapacityExceededError extends Error {
  public readonly code: HandoffErrorCode;

  constructor(message: string) {
    super(message);
    this.name = 'CapacityExceededError';
    this.code = HandoffErrorCode.CapacityExceeded;
  }
}

// =============================================================================
// Middleware
// =============================================================================

/**
 * Validates the handoff request body
 */
function validateHandoffRequest(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  try {
    const result = HandoffRequestSchema.safeParse(req.body);

    if (!result.success) {
      const errors: ValidationError[] = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      throw new HandoffValidationError(errors);
    }

    // Attach validated data to request
    req.body = result.data;
    next();
  } catch (error) {
    next(error);
  }
}

// =============================================================================
// Route Handlers
// =============================================================================

/**
 * POST /handoff
 * Receives vibe context from Iris and initializes a new mission
 */
async function handleHandoff(
  req: Request,
  res: Response<HandoffResponse>,
  next: NextFunction,
  { missionOrchestrator, logger }: HandoffRouterDependencies
): Promise<void> {
  const requestLogger = logger.child({
    handler: 'handoff',
    sessionId: req.body.sessionId,
  });

  try {
    const handoffRequest = req.body as HandoffRequest;

    requestLogger.info(
      {
        priority: handoffRequest.priority,
        dryRun: handoffRequest.dryRun,
        hasTags: Boolean(handoffRequest.tags?.length),
        hasDeadline: Boolean(handoffRequest.deadline),
        hasCallback: Boolean(handoffRequest.callbackUrl),
      },
      'Processing handoff request'
    );

    // Initialize the mission through the orchestrator
    const missionResult = await missionOrchestrator.initializeMission(handoffRequest);

    if (!missionResult.success) {
      requestLogger.warn(
        { error: missionResult.error, errorCode: missionResult.errorCode },
        'Mission initialization failed'
      );

      const response: HandoffResponse = {
        success: false,
        error: missionResult.error,
        errorCode: missionResult.errorCode,
        websocketUrl: '',
        assignedAgents: 0,
      };

      res.status(getStatusCodeForError(missionResult.errorCode)).json(response);
      return;
    }

    requestLogger.info(
      {
        missionId: missionResult.mission?.id,
        assignedAgents: missionResult.assignedAgents,
      },
      'Mission initialized successfully'
    );

    const response: HandoffResponse = {
      success: true,
      mission: missionResult.mission,
      websocketUrl: missionResult.websocketUrl,
      estimatedCompletion: missionResult.estimatedCompletion,
      assignedAgents: missionResult.assignedAgents,
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Maps error codes to HTTP status codes
 */
function getStatusCodeForError(errorCode?: HandoffErrorCode): number {
  switch (errorCode) {
    case HandoffErrorCode.InvalidRequest:
      return 400;
    case HandoffErrorCode.Unauthorized:
      return 401;
    case HandoffErrorCode.RateLimited:
      return 429;
    case HandoffErrorCode.CapacityExceeded:
      return 503;
    case HandoffErrorCode.FeatureDisabled:
      return 501;
    case HandoffErrorCode.InternalError:
    default:
      return 500;
  }
}

/**
 * Formats Zod validation errors for response
 */
function formatValidationErrors(errors: ValidationError[]): string {
  return errors.map((e) => `${e.field}: ${e.message}`).join('; ');
}

// =============================================================================
// Error Handler
// =============================================================================

/**
 * Handoff-specific error handler
 */
function handoffErrorHandler(
  err: Error,
  _req: Request,
  res: Response<HandoffResponse>,
  next: NextFunction,
  logger: Logger
): void {
  if (res.headersSent) {
    return next(err);
  }

  const errorLogger = logger.child({ handler: 'handoff', errorType: err.name });

  if (err instanceof HandoffValidationError) {
    errorLogger.warn({ errors: err.errors }, 'Validation error');

    res.status(400).json({
      success: false,
      error: formatValidationErrors(err.errors),
      errorCode: HandoffErrorCode.InvalidRequest,
      websocketUrl: '',
      assignedAgents: 0,
    });
    return;
  }

  if (err instanceof CapacityExceededError) {
    errorLogger.warn({ message: err.message }, 'Capacity exceeded');

    res.status(503).json({
      success: false,
      error: err.message,
      errorCode: HandoffErrorCode.CapacityExceeded,
      websocketUrl: '',
      assignedAgents: 0,
    });
    return;
  }

  // Log unexpected errors
  errorLogger.error({ err }, 'Unexpected error in handoff handler');

  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred'
      : err.message,
    errorCode: HandoffErrorCode.InternalError,
    websocketUrl: '',
    assignedAgents: 0,
  });
}

// =============================================================================
// Router Factory
// =============================================================================

/**
 * Creates the handoff router with all necessary dependencies
 *
 * @param missionOrchestrator - The mission orchestrator service
 * @param logger - Pino logger instance
 * @returns Configured Express Router
 *
 * @example
 * ```typescript
 * const router = createHandoffRouter(missionOrchestrator, logger);
 * app.use('/api', router);
 * ```
 */
export function createHandoffRouter(
  missionOrchestrator: MissionOrchestrator,
  logger: Logger
): Router {
  const router = Router();
  const routeLogger = logger.child({ router: 'handoff' });

  const dependencies: HandoffRouterDependencies = {
    missionOrchestrator,
    logger: routeLogger,
  };

  // POST /handoff - Initialize a new mission
  router.post(
    '/handoff',
    validateHandoffRequest,
    (req: Request, res: Response<HandoffResponse>, next: NextFunction) => {
      handleHandoff(req, res, next, dependencies).catch(next);
    }
  );

  // Route-specific error handler
  router.use(
    (err: Error, req: Request, res: Response<HandoffResponse>, next: NextFunction) => {
      handoffErrorHandler(err, req, res, next, routeLogger);
    }
  );

  routeLogger.debug('Handoff router initialized');

  return router;
}

export default createHandoffRouter;
