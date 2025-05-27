# Use Node.js 20.19.0 as base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Build common module
COPY src/common ./common
WORKDIR /app/common
RUN npm install && npm run build

# Install bank-sync-service
WORKDIR /app
COPY src/services/bank-sync-service ./services/bank-sync-service
WORKDIR /app/services/bank-sync-service

RUN npm install
# RUN npm run build

# Copy environment variables example file and rename to .env
COPY src/services/bank-sync-service/.env.example ./services/bank-sync-service/.env

# Expose the port the app runs on
EXPOSE 3002

# Command to run in development mode
# CMD ["node", "dist/index.js"]
CMD ["npm", "run", "dev"]