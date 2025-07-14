# Multi-stage Dockerfile for Audit Service - Production Build
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

# Copy audit-service and install dependencies AFTER common is built
COPY src/services/audit-service /app/services/audit-service
WORKDIR /app/services/audit-service
RUN npm install

# Build Audit Service
RUN npm run build

# Stage 2: Production
FROM base AS production

# Copy built audit-service and common module (maintains symlink structure)
COPY --from=build /app/services/audit-service ./services/audit-service
COPY --from=build /app/common ./common

# Copy node_modules from build stage (includes working common module links)
COPY --from=build /app/services/audit-service/node_modules ./services/audit-service/node_modules

# Set working directory and change ownership
WORKDIR /app/services/audit-service
RUN chown -R nodeuser:nodejs /app

# Switch to non-root user
USER nodeuser

# Expose port
EXPOSE 3010

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3010/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["npm", "start"]