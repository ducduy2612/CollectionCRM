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

# Create .env with PLACEHOLDER for runtime substitution
# Only include the environment variable that's actually used
RUN echo 'VITE_API_BASE_URL=__API_BASE_URL__' > .env

# Build the application with placeholder value
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

# Create entrypoint script for runtime environment variable substitution
RUN echo '#!/bin/sh' > /docker-entrypoint.sh && \
    echo 'echo "Substituting environment variables in frontend..."' >> /docker-entrypoint.sh && \
    echo '# Set default values if not provided' >> /docker-entrypoint.sh && \
    echo 'API_BASE_URL=${VITE_API_BASE_URL:-/api}' >> /docker-entrypoint.sh && \
    echo 'echo "Using API_BASE_URL: $API_BASE_URL"' >> /docker-entrypoint.sh && \
    echo '# Replace placeholder in JavaScript files' >> /docker-entrypoint.sh && \
    echo 'find /usr/share/nginx/html -name "*.js" -type f -exec sed -i "s|__API_BASE_URL__|$API_BASE_URL|g" {} \\;' >> /docker-entrypoint.sh && \
    echo 'echo "Environment substitution completed"' >> /docker-entrypoint.sh && \
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