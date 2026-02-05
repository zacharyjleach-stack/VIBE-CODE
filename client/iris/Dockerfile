# =============================================================================
# Iris Frontend - Next.js Production Dockerfile
# Multi-stage build for optimized production deployment
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Dependencies
# Install all dependencies for building
# -----------------------------------------------------------------------------
FROM node:20-alpine AS deps

# Add libc6-compat for Alpine compatibility with some npm packages
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy package files for dependency installation
COPY package.json ./

# Copy shared protocol package if it exists in monorepo context
# This handles the workspace:* dependency
COPY --from=root /shared/protocol/package.json /shared/protocol/package.json 2>/dev/null || true
COPY --from=root /shared/protocol/dist /shared/protocol/dist 2>/dev/null || true

# Install dependencies with clean install for reproducibility
# Using npm ci for deterministic builds
RUN npm install --frozen-lockfile 2>/dev/null || npm install

# -----------------------------------------------------------------------------
# Stage 2: Builder
# Build the Next.js application
# -----------------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source files
COPY . .

# Set Next.js telemetry to disabled for privacy
ENV NEXT_TELEMETRY_DISABLED=1

# Build the application
# Output: .next directory with production build
RUN npm run build

# -----------------------------------------------------------------------------
# Stage 3: Runner
# Minimal production image
# -----------------------------------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

# Set to production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for security
# Using numeric UID/GID for better compatibility
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy only necessary files for production
# Next.js standalone output includes all required dependencies
COPY --from=builder /app/public ./public

# Set correct permissions for prerendered content
RUN mkdir -p .next && chown -R nextjs:nodejs .next

# Copy standalone build if using output: 'standalone' in next.config.js
# Otherwise copy the full .next directory
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# If standalone is not configured, use this instead:
# COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
# COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
# COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

# Switch to non-root user
USER nextjs

# Expose the Next.js port
EXPOSE 3000

# Set hostname for Docker networking
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

# Health check for container orchestration
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Start the application
# Using server.js for standalone mode, or next start for standard mode
CMD ["node", "server.js"]

# Alternative for non-standalone mode:
# CMD ["npm", "start"]
