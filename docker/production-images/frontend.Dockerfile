# Multi-stage Dockerfile for Frontend - Production Build
FROM node:20-alpine AS base

# Install security updates
RUN apk update && apk upgrade && \
    rm -rf /var/cache/apk/*

WORKDIR /app

# Copy package files
COPY src/frontend/package*.json ./

# Stage 1: Dependencies
FROM base AS deps

# Install all dependencies (including dev dependencies for building)
RUN npm ci --no-audit --no-fund

# Stage 2: Build
FROM base AS build

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY src/frontend ./

# Build the application
RUN npm run build

# Stage 3: Production - Nginx server
FROM nginxinc/nginx-unprivileged:stable-alpine AS production

# Temporarily switch to root to install updates and copy files
USER root

# Install security updates and gettext for envsubst
RUN apk update && apk upgrade && \
    apk add --no-cache gettext && \
    rm -rf /var/cache/apk/*

# Copy built application with proper ownership
COPY --chown=nginx:nginx --from=build /app/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY --chown=nginx:nginx docker/config/nginx/frontend.conf /etc/nginx/conf.d/default.conf

# Set proper permissions
RUN find /usr/share/nginx/html -type d -print0 | xargs -0 chmod 755 && \
    find /usr/share/nginx/html -type f -print0 | xargs -0 chmod 644

# Create simple entrypoint script
RUN echo '#!/bin/sh' > /docker-entrypoint.sh && \
    echo '# Start nginx' >> /docker-entrypoint.sh && \
    echo 'exec nginx -g "daemon off;"' >> /docker-entrypoint.sh && \
    chmod +x /docker-entrypoint.sh

# Switch back to nginx user
USER nginx

# Expose port (unprivileged image uses 8080 by default)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Use custom entrypoint that handles environment substitution
ENTRYPOINT ["/docker-entrypoint.sh"]