# Use Node.js 18 Alpine as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy all files
COPY src/services/auth-service ./auth-service
COPY src/common ./common

# Install and link common module
WORKDIR /app/common
RUN npm install
RUN npm link

# Install Auth Service dependencies and link common module
WORKDIR /app/auth-service
RUN npm install
RUN npm link collection-crm-common

# Build the Auth Service
RUN npm run build

# Copy environment variables example file and rename to .env
COPY src/services/auth-service/.env.example ./auth-service/.env

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV REDIS_HOST=redis
ENV REDIS_PORT=6379
ENV DATABASE_URL=postgres://postgres:postgres@postgres:5432/collection_crm
ENV JWT_SECRET=your_jwt_secret_will_be_set_at_runtime
ENV JWT_EXPIRATION=86400
ENV PASSWORD_SALT_ROUNDS=10

# Expose the port the app runs on
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

# Command to run the application
CMD ["node", "dist/index.js"]