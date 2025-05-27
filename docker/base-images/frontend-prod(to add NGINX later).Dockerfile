# Build stage
FROM node:18-alpine as build

# Set working directory
WORKDIR /app

# Copy package files
COPY src/frontend/package*.json ./
RUN npm ci

# Copy environment variables example file and rename to .env
COPY src/frontend/.env.example ./.env

# Copy source code
COPY src/frontend/ .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets from the build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]