# Development Dockerfile for React + Vite frontend
FROM node:20-alpine

# Install additional tools for better development experience
RUN apk add --no-cache git

# Set working directory
WORKDIR /app

# Copy package files with proper ownership
COPY src/frontend/ ./

# Install dependencies
RUN npm install

# Expose Vite development server port
EXPOSE 5173

# Start development server with hot-reloading enabled
CMD ["npm", "run", "dev"]