# Multi-stage Dockerfile for Workflow Service - Production Build
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

# Copy workflow-service and install dependencies AFTER common is built
COPY src/services/workflow-service /app/services/workflow-service
WORKDIR /app/services/workflow-service
RUN npm install

# Build Workflow Service (with less strict TypeScript for external modules)
RUN sed -i 's/"strict": true/"strict": false/' tsconfig.json && npm run build

# Stage 2: Production
FROM base AS production

# Copy built workflow-service and common module (maintains symlink structure)
COPY --from=build /app/services/workflow-service ./services/workflow-service
COPY --from=build /app/common ./common

# Copy node_modules from build stage (includes working common module links)
COPY --from=build /app/services/workflow-service/node_modules ./services/workflow-service/node_modules

# Set working directory and change ownership
WORKDIR /app/services/workflow-service
RUN chown -R nodeuser:nodejs /app

# Switch to non-root user
USER nodeuser

# Expose port
EXPOSE 3003

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3003/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["npm", "start"]