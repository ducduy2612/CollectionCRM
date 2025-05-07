# Base Node.js image for microservices
# Updated: May 2025
# Purpose: Provides a secure, optimized base image for Node.js microservices

# --- Build Stage ---
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache --virtual .build-deps python3 make g++

# Copy package files for dependency installation
COPY package*.json ./

# Install dependencies with clean cache and production only
RUN npm ci --only=production && \
    npm cache clean --force

# Copy source code
COPY --chown=node:node . .

# Build TypeScript code
RUN npm run build

# --- Production Stage ---
FROM node:20-alpine

# Add labels for better maintainability
LABEL maintainer="CollectionCRM Team"
LABEL description="Base image for Node.js microservices"
LABEL version="2.0"

# Install production dependencies
RUN apk add --no-cache \
    curl \
    bash \
    ca-certificates \
    tzdata \
    dumb-init

# Create non-root user if it doesn't already exist
RUN addgroup -g 1001 -S nodejs && \
    adduser -S -u 1001 -G nodejs node || true

# Set working directory
WORKDIR /app

# Copy built artifacts from builder stage
COPY --from=builder --chown=node:node /app/package*.json ./
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/dist ./dist

# Set proper ownership
RUN chown -R node:node /app

# Expose default port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=2048"
ENV NPM_CONFIG_LOGLEVEL=warn

# Use dumb-init as PID 1 to handle signals properly
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Switch to non-root user
USER node

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start the application
CMD ["node", "dist/index.js"]