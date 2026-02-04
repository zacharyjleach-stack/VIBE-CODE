# =============================================================================
# Aegis Backend - Node.js Production Dockerfile
# Multi-stage build for optimized production deployment
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Dependencies
# Install production and build dependencies
# -----------------------------------------------------------------------------
FROM node:20-alpine AS deps

# Add build essentials for native modules
RUN apk add --no-cache libc6-compat python3 make g++

WORKDIR /app

# Copy package files
COPY package.json ./

# Install all dependencies (including dev for TypeScript compilation)
RUN npm install --frozen-lockfile 2>/dev/null || npm install

# -----------------------------------------------------------------------------
# Stage 2: Builder
# Compile TypeScript to JavaScript
# -----------------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy source code and config
COPY . .

# Copy shared protocol types if available
# Handles workspace:* dependency in monorepo
ARG SHARED_PROTOCOL_PATH=../../shared/protocol
COPY ${SHARED_PROTOCOL_PATH}/dist ../shared/protocol/dist 2>/dev/null || true
COPY ${SHARED_PROTOCOL_PATH}/package.json ../shared/protocol/package.json 2>/dev/null || true

# Build TypeScript
RUN npm run build

# Prune dev dependencies for production
RUN npm prune --production

# -----------------------------------------------------------------------------
# Stage 3: Runner
# Minimal production image
# -----------------------------------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Install runtime dependencies only
# dumb-init for proper signal handling in containers
RUN apk add --no-cache dumb-init

# Create non-root user for security
RUN addgroup --system --gid 1001 aegis && \
    adduser --system --uid 1001 aegis

# Create necessary directories with proper ownership
RUN mkdir -p /app/logs /app/tmp && \
    chown -R aegis:aegis /app

# Copy built application from builder
COPY --from=builder --chown=aegis:aegis /app/dist ./dist
COPY --from=builder --chown=aegis:aegis /app/node_modules ./node_modules
COPY --from=builder --chown=aegis:aegis /app/package.json ./package.json

# Copy shared protocol if it was included
COPY --from=builder --chown=aegis:aegis /app/../shared/protocol ../shared/protocol 2>/dev/null || true

# Switch to non-root user
USER aegis

# Expose the API port
EXPOSE 8080

# Environment variables for configuration
ENV PORT=8080
ENV HOST="0.0.0.0"
ENV LOG_LEVEL="info"

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Use dumb-init as PID 1 for proper signal handling
# This ensures graceful shutdown of Node.js process
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/index.js"]
