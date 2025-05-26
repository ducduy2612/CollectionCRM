# Development Dockerfile for React + Vite frontend
FROM node:20-alpine

# Install additional tools for better development experience
RUN apk add --no-cache git

# Set working directory
WORKDIR /app

# Copy package files with proper ownership
COPY package*.json ./

# Install dependencies
RUN npm ci

# Expose Vite development server port
EXPOSE 5173

# Start development server with hot-reloading enabled
# Host 0.0.0.0 is required for Docker container access
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]