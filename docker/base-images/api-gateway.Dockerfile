# Use Node.js 20.19.0 as base image
FROM node:20-alpine

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


# Copy environment variables example file and rename to .env
COPY src/services/api-gateway/.env.example ./services/api-gateway/.env

# Load environment from .env file

# Expose the port the app runs on
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

# Command to run the application
CMD ["npm", "run", "dev"]
