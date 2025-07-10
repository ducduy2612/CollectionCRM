# Use Node.js 20 as base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Build common module
COPY src/common ./common
WORKDIR /app/common
RUN npm install && npm run build

# Install audit-service
WORKDIR /app
COPY src/services/audit-service ./services/audit-service
WORKDIR /app/services/audit-service

RUN npm install
# RUN npm run build

# Copy environment variables example file and rename to .env
COPY src/services/audit-service/.env.example ./.env

# Expose the port the app runs on
EXPOSE 3010

# Command to run in development mode
CMD ["npm", "run", "dev"]