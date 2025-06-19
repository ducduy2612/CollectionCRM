# Docker Directory

This directory contains all Docker-related files for containerizing the Collection CRM system.

## Structure

- `base-images/`: Base Docker images for different services for development purpose only:
  - Frontend development image (`frontend-dev.Dockerfile`)
  - API Gateway image (`api-gateway.Dockerfile`)
  - Auth Service image (`auth-service.Dockerfile`)
  - Bank Sync Service image (`bank-sync-service.Dockerfile`)
- `compose/`: Docker Compose configurations
  - Development configuration (`docker-compose.dev.yml`)
  - Production configurations (to be added)

## Development Environment

### Development with hot-reloading

The project includes a dedicated Docker setup for development with hot-reloading:

```bash
# Using the convenience script from project root
./docker-dev.sh up          # Start all services
./docker-dev.sh frontend    # Start only frontend
./docker-dev.sh down        # Stop services

# Or using docker compose directly
docker compose -f docker/compose/docker-compose.dev.yml up frontend-dev
```

The development environment features:
- Node.js 20 Alpine 
- Hot-reloading for React components
- Volume mounts for source code