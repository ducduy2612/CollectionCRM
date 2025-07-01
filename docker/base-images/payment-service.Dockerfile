# Use Node.js 20.19.0 as base image
FROM node:20-alpine


# Set working directory
WORKDIR /app

# Build common module
COPY src/common ./common
WORKDIR /app/common
RUN npm install && npm run build

# Install payment-service
WORKDIR /app
COPY src/services/payment-service ./services/payment-service
WORKDIR /app/services/payment-service

# Copy tsconfig.json for path resolution
COPY src/services/payment-service/tsconfig.json ./tsconfig.json

RUN npm install
# RUN npm run build

# Copy environment variables example file and rename to .env
COPY src/services/payment-service/.env.example ./.env

# Expose the port the app runs on
EXPOSE 3005

# Command to run in development mode
# CMD ["node", "dist/index.js"]
CMD ["npm", "run", "dev"]