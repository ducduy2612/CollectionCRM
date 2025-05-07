# Docker Directory

This directory contains all Docker-related files for containerizing the Collection CRM system.

## Structure

- `base-images/`: Base Docker images for different services
  - Node.js base image for microservices
  - Frontend development image
  - Database images (PostgreSQL)
  - Search engine image (Elasticsearch)
  - Message broker image (Kafka)
  - Caching image (Redis)
- `compose/`: Docker Compose configurations
  - Main docker-compose.yml file
  - Development vs. production configurations
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