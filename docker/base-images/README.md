# Docker Base Images

This directory contains Dockerfiles for building the various services in the CollectionCRM system.

## API Gateway Dockerfile

The `api-gateway.Dockerfile` builds a containerized version of the API Gateway service. It uses a multi-stage build process:

1. **Build Stage**:
   - Uses Node.js 18 Alpine as the base image
   - Installs all dependencies (including dev dependencies)
   - Builds the TypeScript code into JavaScript

2. **Production Stage**:
   - Uses a fresh Node.js 18 Alpine image
   - Installs only production dependencies
   - Copies the built code from the build stage
   - Sets up environment variables
   - Configures health checks
   - Exposes port 3000

### Environment Variables

The following environment variables are set by default:

- `NODE_ENV=production`
- `PORT=3000`
- `REDIS_HOST=redis`
- `REDIS_PORT=6379`
- `AUTH_SERVICE_URL=http://auth-service:3000`
- `BANK_SERVICE_URL=http://bank-sync-service:3000`
- `PAYMENT_SERVICE_URL=http://payment-service:3000`
- `WORKFLOW_SERVICE_URL=http://workflow-service:3000`

These can be overridden when running the container.

### Health Check

The container includes a health check that pings the `/health` endpoint every 30 seconds to ensure the service is running properly.

## Node.js Base Dockerfile

The `node.Dockerfile` is a generic base image for Node.js microservices. It accepts a `SERVICE_DIR` build argument to specify which service to build.

## Frontend Dockerfile

The `frontend.Dockerfile` builds the frontend application and serves it using Nginx.