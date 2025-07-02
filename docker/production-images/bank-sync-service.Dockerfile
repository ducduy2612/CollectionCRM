# Multi-stage Dockerfile for Bank Sync Service - Production Build
FROM node:20-alpine AS base

# Install security updates and dumb-init
RUN apk update && apk upgrade && \
    apk add --no-cache dumb-init && \
    rm -rf /var/cache/apk/*

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodeuser -u 1001

WORKDIR /app

# Stage 1: Build (with dev dependencies)
FROM base AS build

# Build common module first (following dev dockerfile pattern)
COPY src/common /app/common
WORKDIR /app/common
RUN npm install && npm run build

# Copy bank-sync-service and install dependencies AFTER common is built
COPY src/services/bank-sync-service /app/services/bank-sync-service
WORKDIR /app/services/bank-sync-service
RUN npm install

# Build Bank Sync Service
RUN npm run build

# Stage 2: Production
FROM base AS production

# Copy built bank-sync-service and common module (maintains symlink structure)
COPY --from=build /app/services/bank-sync-service ./services/bank-sync-service
COPY --from=build /app/common ./common

# Copy node_modules from build stage (includes working common module links)
COPY --from=build /app/services/bank-sync-service/node_modules ./services/bank-sync-service/node_modules

# Set working directory and change ownership
WORKDIR /app/services/bank-sync-service
RUN chown -R nodeuser:nodejs /app

# Switch to non-root user
USER nodeuser

# Expose port
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3002/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["npm", "start"]