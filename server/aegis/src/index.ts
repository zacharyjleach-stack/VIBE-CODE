/**
 * Aegis Backend - Simplified Entry Point
 * Minimal working server for Railway deployment
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

const app = express();
const httpServer = createServer(app);
const PORT = parseInt(process.env.PORT || '3001', 10);

// Socket.IO setup
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'aegis',
  });
});

// Basic status endpoint
app.get('/api/status', (_req: Request, res: Response) => {
  res.json({
    status: 'online',
    agents: 16,
    activeJobs: 0,
    version: '1.0.0',
  });
});

// Handoff endpoint (receives vibe context from Iris)
app.post('/api/handoff', (req: Request, res: Response) => {
  const { vibeContext } = req.body;

  console.log('Received handoff:', vibeContext);

  // Generate a job ID
  const jobId = `job_${Date.now()}`;

  // Emit to connected clients
  io.emit('job:started', { jobId, vibeContext });

  res.json({
    success: true,
    jobId,
    message: 'Mission accepted. Aegis swarm activated.',
    estimatedTime: '2-5 minutes',
  });
});

// Get job status
app.get('/api/jobs/:jobId', (req: Request, res: Response) => {
  const { jobId } = req.params;

  res.json({
    jobId,
    status: 'processing',
    progress: 45,
    agents: [
      { id: 1, status: 'coding', task: 'Setting up project structure' },
      { id: 2, status: 'coding', task: 'Creating components' },
      { id: 3, status: 'idle' },
      { id: 4, status: 'idle' },
    ],
  });
});

// WebSocket connections
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.emit('welcome', { message: 'Connected to Aegis' });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Start server
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🛡️ Aegis server running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`   Status: http://localhost:${PORT}/api/status`);
});
