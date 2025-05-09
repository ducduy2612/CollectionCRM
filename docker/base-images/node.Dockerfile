# Use Node.js 18 Alpine as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Set build arguments
ARG SERVICE_DIR

# Copy package files first for better caching
COPY ${SERVICE_DIR}/package.json ./
COPY ${SERVICE_DIR}/package-lock.json ./

# Copy common module
COPY common ./common/

# Copy source code
COPY ${SERVICE_DIR}/src ./src
COPY ${SERVICE_DIR}/tsconfig.json ./

# Install dependencies and build
RUN npm install && \
    cd common && npm install && cd .. && \
    npm run build

# Copy environment variables example file
COPY ${SERVICE_DIR}/.env.example ./.env

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD ["node", "dist/index.js"]

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD ["node", "dist/index.js"]