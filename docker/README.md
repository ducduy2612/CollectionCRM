# Docker Directory

This directory contains all Docker-related files for containerizing the Collection CRM system.

## Structure

- `base-images/`: Base Docker images for different services
  - Node.js base image for microservices
  - Frontend production image (`frontend.Dockerfile`)
  - Frontend development image (`frontend-dev.Dockerfile`)
  - API Gateway image
  - Auth Service image
  - Bank Sync Service image
- `compose/`: Docker Compose configurations
  - Main docker-compose.yml file
  - Development configuration (`docker-compose.dev.yml`)
  - Production configurations
- `ghcr/`: GitHub Container Registry configuration and scripts
  - Documentation for using GHCR
  - Helper scripts for pushing images to GHCR
  - Scripts for running the application with GHCR images

## Container Registry

The CollectionCRM project uses GitHub Container Registry (GHCR) for storing and distributing Docker images. This provides several benefits:

1. Integration with GitHub repositories and GitHub Actions
2. Private and public image hosting
3. Fine-grained access control
4. Vulnerability scanning

For detailed instructions on using GHCR with this project, see the [GHCR README](./ghcr/README.md).

### Quick Start with GHCR

To push images to GHCR:
```bash
# Login to GHCR
docker login ghcr.io -u YOUR_GITHUB_USERNAME -p YOUR_PERSONAL_ACCESS_TOKEN

# Push images using the helper script
./ghcr/push-to-ghcr.sh YOUR_GITHUB_ORG
```

To run the application using GHCR images:
```bash
./ghcr/run-with-ghcr.sh YOUR_GITHUB_ORG
```

## Development Environment

### Frontend Development

The project includes a dedicated Docker setup for frontend development with hot-reloading:

```bash
# Using the convenience script from project root
./docker-dev.sh up          # Start all services
./docker-dev.sh frontend    # Start only frontend
./docker-dev.sh down        # Stop services

# Or using docker-compose directly
docker-compose -f docker/compose/docker-compose.dev.yml up frontend-dev
```

The frontend development environment features:
- Node.js 20 LTS with Vite dev server
- Hot-reloading for React components
- Volume mounts for source code
- Optimized node_modules handling
- Non-root user for security

For detailed frontend Docker documentation, see [Frontend Docker README](../src/frontend/README.Docker.md).