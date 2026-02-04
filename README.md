# Iris & Aegis Vibe Coding Platform

A dual-AI system for vibe-based collaborative coding. Iris provides the intelligent frontend interface while Aegis orchestrates backend AI agent swarms.

## Architecture Overview

```
+------------------+         +-------------------+         +------------------+
|                  |  HTTP   |                   |  Queue  |                  |
|      Iris        | ------> |      Aegis        | ------> |   Worker Pool    |
|   (Frontend)     | <------ |   (Orchestrator)  | <------ |   (AI Agents)    |
|                  |   WS    |                   |         |                  |
+------------------+         +-------------------+         +------------------+
        |                            |                            |
        |                            v                            |
        |                    +---------------+                    |
        |                    |    Redis      |                    |
        |                    | (Job Queue)   |                    |
        |                    +---------------+                    |
        |                                                         |
        +---------------------------------------------------------+
                            Shared Protocol Types
```

### Components

#### Iris (Frontend) - `/client/iris`
- **Technology**: Next.js 14 with React 18
- **Purpose**: User interface for vibe-based coding
- **Features**:
  - Real-time project visualization
  - Mermaid diagram rendering
  - Split-pane workspace layout
  - WebSocket connection for live updates
  - "Deploy" button for AI agent handoff

#### Aegis (Backend Orchestrator) - `/server/aegis`
- **Technology**: Node.js with TypeScript
- **Purpose**: AI agent orchestration and task management
- **Features**:
  - SwarmManager for multi-agent coordination
  - Job queue management via Redis
  - WebSocket server for real-time communication
  - Docker container orchestration for workers
  - RESTful API for Iris communication

#### Shared Protocol - `/shared/protocol`
- **Purpose**: Type definitions shared between Iris and Aegis
- **Contents**:
  - API request/response types
  - WebSocket message types
  - Job and task definitions
  - Agent state enums

### The Handoff Flow

The "Handoff Button" is the critical integration point between Iris and Aegis:

```
User clicks "Deploy" in Iris
         |
         v
POST /api/handoff (Iris -> Aegis)
         |
         v
Aegis SwarmManager creates job
         |
         v
Job queued in Redis
         |
         v
Workers pick up tasks
         |
         v
Real-time updates via WebSocket (Aegis -> Iris)
         |
         v
User sees progress in Iris UI
```

## Quick Start

### Prerequisites

- Node.js >= 18.0.0
- Docker and Docker Compose
- Git

### Using Docker (Recommended)

```bash
# Clone the repository
git clone <repository-url>
cd VIBE-CODE

# Copy environment template
cp .env.example .env

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

Access the application:
- **Iris Frontend**: http://localhost:3000
- **Aegis API**: http://localhost:8080
- **Redis**: localhost:6379

### Local Development

```bash
# Run the setup script
./scripts/setup.sh

# Start development servers
./scripts/dev.sh

# Or manually:
npm install
npm run dev
```

## Development Setup

### Project Structure

```
VIBE-CODE/
├── client/
│   └── iris/              # Next.js frontend
│       ├── src/
│       │   ├── app/       # App router pages
│       │   ├── components/# React components
│       │   ├── hooks/     # Custom hooks
│       │   ├── lib/       # Utilities
│       │   └── stores/    # Zustand stores
│       └── package.json
├── server/
│   └── aegis/             # Node.js backend
│       ├── src/
│       │   ├── api/       # Express routes
│       │   ├── services/  # Business logic
│       │   ├── swarm/     # SwarmManager
│       │   └── workers/   # Worker management
│       └── package.json
├── shared/
│   └── protocol/          # Shared types
│       └── src/
│           └── types/
├── nginx/                 # Production nginx config
├── scripts/               # Development scripts
├── docker-compose.yml     # Docker orchestration
└── package.json           # Root workspace config
```

### Environment Variables

See `.env.example` for all configuration options. Key variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_AEGIS_URL` | Aegis API URL for frontend | `http://localhost:8080` |
| `AEGIS_PORT` | Aegis server port | `8080` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `MAX_WORKER_SLOTS` | Max concurrent AI workers | `16` |
| `NODE_ENV` | Environment mode | `development` |

### Running Tests

```bash
# Run all tests
npm test

# Run tests for specific workspace
npm run test --workspace=client/iris
npm run test --workspace=server/aegis

# Run with coverage
npm run test -- --coverage
```

### Linting and Type Checking

```bash
# Lint all workspaces
npm run lint

# Type check
npm run build:protocol  # Build shared types first
npm run type-check --workspaces --if-present
```

## API Documentation

### REST Endpoints (Aegis)

#### Health Check
```
GET /api/health
Response: { "status": "ok", "version": "1.0.0" }
```

#### Handoff (Start AI Processing)
```
POST /api/handoff
Content-Type: application/json

Request:
{
  "projectId": "string",
  "prompt": "string",
  "context": {
    "files": [...],
    "settings": {...}
  }
}

Response:
{
  "jobId": "string",
  "status": "queued",
  "estimatedTime": number
}
```

#### Job Status
```
GET /api/jobs/:jobId
Response:
{
  "jobId": "string",
  "status": "queued" | "processing" | "completed" | "failed",
  "progress": number,
  "result": {...} | null,
  "error": string | null
}
```

#### Cancel Job
```
DELETE /api/jobs/:jobId
Response:
{
  "success": boolean,
  "message": "string"
}
```

### WebSocket Events

Connect to: `ws://localhost:8080/ws`

#### Client -> Server

```typescript
// Subscribe to job updates
{ "type": "subscribe", "jobId": "string" }

// Unsubscribe from job updates
{ "type": "unsubscribe", "jobId": "string" }
```

#### Server -> Client

```typescript
// Job progress update
{
  "type": "job:progress",
  "jobId": "string",
  "progress": number,
  "message": "string"
}

// Job completed
{
  "type": "job:completed",
  "jobId": "string",
  "result": {...}
}

// Job failed
{
  "type": "job:failed",
  "jobId": "string",
  "error": "string"
}

// Agent status update
{
  "type": "agent:status",
  "agentId": "string",
  "status": "idle" | "working" | "completed" | "error",
  "currentTask": "string" | null
}
```

## Production Deployment

### Using Nginx Reverse Proxy

The included `nginx/nginx.conf` provides:
- Routing `/api/*` requests to Aegis
- Routing all other requests to Iris
- WebSocket proxy support
- SSL/TLS configuration (add your certificates)

```bash
# Build production images
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

# Start production stack
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Environment Considerations

1. **Security**: Update `JWT_SECRET` and other secrets
2. **CORS**: Configure `CORS_ORIGINS` for your domain
3. **SSL**: Add SSL certificates for HTTPS
4. **Scaling**: Adjust `MAX_WORKER_SLOTS` based on resources

## CORS Configuration

Aegis is configured to accept requests from Iris. In development:

```javascript
// Aegis CORS configuration
{
  origin: ['http://localhost:3000', 'http://iris:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}
```

For production, update `CORS_ORIGINS` in your environment.

## Troubleshooting

### Common Issues

**Docker containers won't start**
```bash
# Check Docker is running
docker info

# View container logs
docker-compose logs -f aegis

# Rebuild containers
docker-compose build --no-cache
```

**Redis connection errors**
```bash
# Check Redis is accessible
docker-compose exec redis redis-cli ping

# View Redis logs
docker-compose logs redis
```

**WebSocket connection issues**
- Ensure `NEXT_PUBLIC_AEGIS_URL` is correctly set
- Check firewall rules for port 8080
- Verify nginx WebSocket proxy configuration

**Type errors in shared protocol**
```bash
# Rebuild shared types
npm run build:protocol
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests and linting: `npm test && npm run lint`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

## License

MIT License - see LICENSE file for details.

---

Built with the dual-AI architecture: **Iris** illuminates the path, **Aegis** shields the process.
