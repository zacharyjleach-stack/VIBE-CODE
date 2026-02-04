/**
 * Aegis Backend Orchestrator - Main Entry Point
 *
 * Headless backend service that manages the agent swarm for the Vibe Coding Platform.
 * This service receives mission briefs from Iris and orchestrates multiple worker
 * agents to execute coding tasks in parallel.
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import { createServer, Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import pino from 'pino';
import Redis from 'ioredis';

import { SwarmManager } from './core/SwarmManager.js';
import { MissionOrchestrator } from './services/MissionOrchestrator.js';
import { FileSystemManager } from './services/FileSystemManager.js';
import { ProgressEmitter } from './websocket/ProgressEmitter.js';
import { createHandoffRouter } from './routes/handoff.js';
import { createStatusRouter } from './routes/status.js';
import type { AegisConfig } from './types/index.js';

// =============================================================================
// Configuration
// =============================================================================

const config: AegisConfig = {
  server: {
    port: parseInt(process.env.AEGIS_PORT || '3001', 10),
    host: process.env.AEGIS_HOST || '0.0.0.0',
    corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(','),
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0', 10),
  },
  docker: {
    enabled: process.env.DOCKER_ENABLED !== 'false',
    socketPath: process.env.DOCKER_SOCKET || '/var/run/docker.sock',
    workerImage: process.env.WORKER_IMAGE || 'aegis-worker:latest',
    network: process.env.DOCKER_NETWORK || 'aegis-network',
  },
  swarm: {
    maxWorkers: parseInt(process.env.MAX_WORKERS || '16', 10),
    taskTimeoutMs: parseInt(process.env.TASK_TIMEOUT_MS || '300000', 10),
    healthCheckIntervalMs: parseInt(process.env.HEALTH_CHECK_INTERVAL_MS || '5000', 10),
  },
  workspace: {
    rootPath: process.env.WORKSPACE_ROOT || '/tmp/aegis/workspaces',
    tempPath: process.env.TEMP_PATH || '/tmp/aegis/temp',
  },
  logging: {
    level: (process.env.LOG_LEVEL as AegisConfig['logging']['level']) || 'info',
    pretty: process.env.LOG_PRETTY !== 'false',
  },
};

// =============================================================================
// Logger Setup
// =============================================================================

const logger = pino({
  level: config.logging.level,
  transport: config.logging.pretty
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
        },
      }
    : undefined,
});

// =============================================================================
// Application Bootstrap
// =============================================================================

class AegisServer {
  private app: Express;
  private httpServer: HttpServer;
  private io: SocketIOServer;
  private redis: Redis | null = null;
  private swarmManager: SwarmManager;
  private missionOrchestrator: MissionOrchestrator;
  private fileSystemManager: FileSystemManager;
  private progressEmitter: ProgressEmitter;

  constructor() {
    this.app = express();
    this.httpServer = createServer(this.app);
    this.io = new SocketIOServer(this.httpServer, {
      cors: {
        origin: config.server.corsOrigins,
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    // Initialize core services
    this.fileSystemManager = new FileSystemManager(config.workspace, logger);
    this.swarmManager = new SwarmManager(config.swarm, config.docker, logger);
    this.progressEmitter = new ProgressEmitter(this.io, logger);
    this.missionOrchestrator = new MissionOrchestrator(
      this.swarmManager,
      this.fileSystemManager,
      this.progressEmitter,
      logger
    );

    // Wire up event listeners
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Forward swarm events to progress emitter
    this.swarmManager.on('agent:spawned', (event) => {
      this.progressEmitter.emitAgentEvent('agent:spawned', event);
    });

    this.swarmManager.on('agent:status_changed', (event) => {
      this.progressEmitter.emitAgentEvent('agent:status_changed', event);
    });

    this.swarmManager.on('agent:task_completed', (event) => {
      this.progressEmitter.emitAgentEvent('agent:task_completed', event);
    });

    this.swarmManager.on('agent:task_failed', (event) => {
      this.progressEmitter.emitAgentEvent('agent:task_failed', event);
    });

    this.swarmManager.on('agent:terminated', (event) => {
      this.progressEmitter.emitAgentEvent('agent:terminated', event);
    });
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: false, // Disable for API-only service
    }));

    // CORS
    this.app.use(cors({
      origin: config.server.corsOrigins,
      credentials: true,
    }));

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Request logging
    this.app.use((req: Request, _res: Response, next: NextFunction) => {
      logger.debug({ method: req.method, url: req.url }, 'Incoming request');
      next();
    });
  }

  private setupRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (_req: Request, res: Response) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
      });
    });

    // API routes
    this.app.use('/api', createHandoffRouter(this.missionOrchestrator, logger));
    this.app.use('/api', createStatusRouter(
      this.swarmManager,
      this.missionOrchestrator,
      this.redis,
      logger
    ));

    // 404 handler
    this.app.use((_req: Request, res: Response) => {
      res.status(404).json({
        error: 'Not Found',
        message: 'The requested endpoint does not exist',
      });
    });

    // Error handler
    this.app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
      logger.error({ err }, 'Unhandled error');
      res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'production'
          ? 'An unexpected error occurred'
          : err.message,
      });
    });
  }

  private async connectRedis(): Promise<void> {
    try {
      this.redis = new Redis({
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
        db: config.redis.db,
        retryStrategy: (times) => {
          if (times > 3) {
            logger.warn('Redis connection failed after 3 attempts, continuing without Redis');
            return null;
          }
          return Math.min(times * 100, 3000);
        },
      });

      this.redis.on('connect', () => {
        logger.info('Connected to Redis');
      });

      this.redis.on('error', (err) => {
        logger.error({ err }, 'Redis error');
      });

      // Test connection
      await this.redis.ping();
      logger.info({ host: config.redis.host, port: config.redis.port }, 'Redis connection established');
    } catch (error) {
      logger.warn({ error }, 'Failed to connect to Redis, continuing without it');
      this.redis = null;
    }
  }

  public async start(): Promise<void> {
    logger.info('Starting Aegis Backend Orchestrator...');

    // Initialize file system
    await this.fileSystemManager.initialize();

    // Connect to Redis (optional)
    await this.connectRedis();

    // Setup middleware and routes
    this.setupMiddleware();
    this.setupRoutes();

    // Initialize WebSocket handling
    this.progressEmitter.initialize();

    // Initialize swarm manager
    await this.swarmManager.initialize();

    // Start HTTP server
    return new Promise((resolve) => {
      this.httpServer.listen(config.server.port, config.server.host, () => {
        logger.info(
          { port: config.server.port, host: config.server.host },
          'Aegis server listening'
        );
        logger.info({
          maxWorkers: config.swarm.maxWorkers,
          dockerEnabled: config.docker.enabled,
          workspaceRoot: config.workspace.rootPath,
        }, 'Configuration loaded');
        resolve();
      });
    });
  }

  public async shutdown(): Promise<void> {
    logger.info('Shutting down Aegis server...');

    // Stop accepting new connections
    this.httpServer.close();

    // Gracefully terminate all agents
    await this.swarmManager.terminateAll();

    // Close Redis connection
    if (this.redis) {
      await this.redis.quit();
    }

    // Close WebSocket connections
    this.io.close();

    logger.info('Aegis server shutdown complete');
  }
}

// =============================================================================
// Main Execution
// =============================================================================

const server = new AegisServer();

// Graceful shutdown handlers
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received');
  await server.shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received');
  await server.shutdown();
  process.exit(0);
});

// Start the server
server.start().catch((error) => {
  logger.fatal({ error }, 'Failed to start Aegis server');
  process.exit(1);
});

export { AegisServer, config, logger };
