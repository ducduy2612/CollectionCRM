# Use Node.js 18 Alpine as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Build common module
COPY src/common ./common
WORKDIR /app/common
RUN npm install && npm run build

# Install API Gateway dependencies and link common module
WORKDIR /app
COPY src/services/api-gateway ./services/api-gateway
WORKDIR /app/services/api-gateway

RUN npm install

# Build the API Gateway
RUN npm run build

# Copy environment variables example file and rename to .env
COPY src/services/api-gateway/.env.example ./services/api-gateway/.env

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV REDIS_HOST=redis
ENV REDIS_PORT=6379
ENV AUTH_SERVICE_URL=http://auth-service:3000
ENV BANK_SERVICE_URL=http://bank-sync-service:3000
ENV PAYMENT_SERVICE_URL=http://payment-service:3000
ENV WORKFLOW_SERVICE_URL=http://workflow-service:3000

# Expose the port the app runs on
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

# Command to run the application
CMD ["node", "dist/index.js"]
