# Use Node.js 20.19.0 as base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Build common module
COPY src/common ./common
WORKDIR /app/common
RUN npm install && npm run build

# Install workflow-service
WORKDIR /app
COPY src/services/workflow-service ./services/workflow-service
WORKDIR /app/services/workflow-service

RUN npm install
# RUN npm run build

# Copy environment variables example file and rename to .env
COPY src/services/workflow-service/.env.example ./.env

# Expose the port the app runs on
EXPOSE 3003

# Command to run in development mode
CMD ["npm", "run", "dev"]