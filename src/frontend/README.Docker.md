# Docker Development Setup for React Frontend

This document describes the Docker development setup for the CollectionCRM React frontend application.

## Overview

The frontend development environment uses Docker to provide a consistent development experience with hot-reloading support via Vite.

## Files Created

1. **`docker/base-images/frontend-dev.Dockerfile`** - Development-specific Dockerfile with:
   - Node.js 20 LTS base image
   - Non-root user for security
   - Development dependencies installation
   - Vite dev server configuration with hot-reloading

2. **`docker/compose/docker-compose.dev.yml`** - Docker Compose configuration with:
   - Frontend development service
   - Volume mounts for source code hot-reloading
   - Named volume for node_modules (performance optimization)
   - Environment variable support
   - Network configuration for service communication

3. **`.dockerignore`** - Optimizes Docker build context by excluding unnecessary files

## Usage

### Starting the Development Environment

From the project root directory:

```bash
# Start all services (frontend, API gateway, auth service, etc.)
docker-compose -f docker/compose/docker-compose.dev.yml up

# Start only the frontend service
docker-compose -f docker/compose/docker-compose.dev.yml up frontend-dev

# Start in detached mode (background)
docker-compose -f docker/compose/docker-compose.dev.yml up -d
```

### Accessing the Application

- Frontend: http://localhost:5173
- API Gateway: http://localhost:3000
- Auth Service: http://localhost:3001
- Bank Sync Service: http://localhost:3002

### Environment Variables

The frontend service supports the following environment variables:

- `NODE_ENV` - Set to 'development' for development mode
- `VITE_API_URL` - API Gateway URL (default: http://localhost:3000)
- Additional Vite environment variables can be added as needed

### Hot-Reloading

The development setup includes hot-reloading support:

- Source code is mounted as a volume
- Vite dev server watches for file changes
- Changes are automatically reflected in the browser
- `CHOKIDAR_USEPOLLING` is enabled for Docker compatibility

### Managing Dependencies

When adding new dependencies:

```bash
# Option 1: Run npm inside the container
docker-compose -f docker/compose/docker-compose.dev.yml exec frontend-dev npm install <package-name>

# Option 2: Rebuild the container after updating package.json
docker-compose -f docker/compose/docker-compose.dev.yml down
docker-compose -f docker/compose/docker-compose.dev.yml build frontend-dev
docker-compose -f docker/compose/docker-compose.dev.yml up frontend-dev
```

### Troubleshooting

1. **Port conflicts**: If port 5173 is already in use, modify the port mapping in docker-compose.yml
2. **Permission issues**: The Dockerfile uses a non-root user. If you encounter permission issues, check file ownership
3. **Hot-reload not working**: Ensure `CHOKIDAR_USEPOLLING=true` is set in the environment
4. **Slow performance**: The named volume for node_modules improves performance compared to bind mounts

### Stopping the Environment

```bash
# Stop all services
docker-compose -f docker/compose/docker-compose.dev.yml down

# Stop and remove volumes (careful - this removes data)
docker-compose -f docker/compose/docker-compose.dev.yml down -v
```

## Production Build

For production builds, use the production Dockerfile located at `docker/base-images/frontend.Dockerfile`.