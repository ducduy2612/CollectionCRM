# Docker Base Images

This directory contains Dockerfiles for building the various services in the CollectionCRM system.

1. **Build Stage**:
   - Uses Node.js 20 Alpine as the base image
   - Installs all dependencies (including dev dependencies)
   - Builds the TypeScript code into JavaScript

2. **Production Stage**:
   - Uses a fresh Node.js 20 Alpine image
   - Installs only production dependencies
   - Copies the built code from the build stage
   - Sets up environment variables
   - Configures health checks
   - Exposes port 3000

### Environment Variables

Environment variables are loaded from `.env` files, which are copied from `.env.example` files during the Docker build process. This standardized approach ensures:

1. **Consistency**: All services use the same method for environment configuration
2. **Flexibility**: Environment variables can be easily customized by modifying the `.env.example` files
3. **Security**: Sensitive values can be overridden at runtime without modifying the Dockerfiles

In the docker-compose files, we:
- Use `env_file` to load the base environment from the `.env` files
- Override specific variables as needed for the Docker environment

This approach allows for easy configuration management across different environments (development, staging, production).

### Health Check

The api-gateway container includes a health check that pings the `/health` endpoint every 30 seconds to ensure the service is running properly. Health check configurations can be customized through environment variables if needed.