# Use Node.js 20.19.0 as base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Build common module
COPY src/common ./common
WORKDIR /app/common
RUN npm install && npm run build

# Install campaign-engine
WORKDIR /app
COPY src/services/campaign-engine ./services/campaign-engine
WORKDIR /app/services/campaign-engine

RUN npm install
# RUN npm run build

# Copy environment variables file
COPY src/services/campaign-engine/.env.example ./.env

# Expose the port the app runs on
EXPOSE 3004

# Command to run in development mode
CMD ["npm", "run", "dev"]