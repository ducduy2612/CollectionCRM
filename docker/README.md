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