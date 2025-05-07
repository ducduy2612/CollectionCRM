# GitHub Container Registry (GHCR) for CollectionCRM

This document provides instructions for using GitHub Container Registry (GHCR) as the Docker registry for the CollectionCRM project.

## Overview

GitHub Container Registry (GHCR) is a container registry service provided by GitHub that allows you to host and manage Docker container images. It's integrated with GitHub, making it easy to use with your GitHub repositories and GitHub Actions workflows.

## Authentication

### Personal Access Token (PAT)

To authenticate with GHCR, you need a GitHub Personal Access Token (PAT) with the appropriate permissions:

1. Go to your GitHub account settings
2. Select "Developer settings" > "Personal access tokens" > "Tokens (classic)"
3. Click "Generate new token"
4. Give your token a descriptive name
5. Select the following scopes:
   - `read:packages` (to download container images)
   - `write:packages` (to upload container images)
   - `delete:packages` (to delete container images)
6. Click "Generate token"
7. Copy the token and store it securely

### Login to GHCR

Use your GitHub username and PAT to log in to GHCR:

```bash
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin
```

Replace:
- `$GITHUB_TOKEN` with your PAT
- `USERNAME` with your GitHub username

Alternatively, you can use:

```bash
docker login ghcr.io -u USERNAME -p YOUR_PAT
```

## Pushing Images to GHCR

### 1. Tag your images with the GHCR format

```bash
docker tag LOCAL_IMAGE_NAME:TAG ghcr.io/OWNER/IMAGE_NAME:TAG
```

Replace:
- `LOCAL_IMAGE_NAME:TAG` with your local image name and tag
- `OWNER` with your GitHub username or organization name
- `IMAGE_NAME` with your desired image name
- `TAG` with your desired tag

### 2. Push the tagged image to GHCR

```bash
docker push ghcr.io/OWNER/IMAGE_NAME:TAG
```

## Pulling Images from GHCR

To pull an image from GHCR:

```bash
docker pull ghcr.io/OWNER/IMAGE_NAME:TAG
```

## Using GHCR with CollectionCRM

### Image Naming Convention

For CollectionCRM services, use the following naming convention:

```
ghcr.io/YOUR_ORG/collectioncrm/SERVICE_NAME:TAG
```

For example:
- `ghcr.io/your-org/collectioncrm/api-gateway:latest`
- `ghcr.io/your-org/collectioncrm/auth-service:v1.0.0`

### Updating Docker Compose Files

To use GHCR images in your Docker Compose files, update the image references:

```yaml
services:
  api-gateway:
    image: ghcr.io/your-org/collectioncrm/api-gateway:latest
    # ... other configuration
```

## Helper Script for Pushing Images

Create a file named `push-to-ghcr.sh` in the `docker/ghcr` directory:

```bash
#!/bin/bash

# Check if GitHub organization name is provided
if [ "$#" -lt 1 ]; then
    echo "Usage: $0 <github-org-name> [service-name]"
    echo "Example: $0 your-org-name api-gateway"
    exit 1
fi

GITHUB_ORG=$1
SERVICE_NAME=$2

# If service name is provided, push only that service
if [ ! -z "$SERVICE_NAME" ]; then
    echo "Pushing $SERVICE_NAME to GHCR..."
    docker tag collectioncrm_$SERVICE_NAME:latest ghcr.io/$GITHUB_ORG/collectioncrm/$SERVICE_NAME:latest
    docker push ghcr.io/$GITHUB_ORG/collectioncrm/$SERVICE_NAME:latest
    exit 0
fi

# Push all services
SERVICES=("api-gateway" "auth-service" "bank-sync-service" "payment-service" "workflow-service" "frontend")

for SERVICE in "${SERVICES[@]}"; do
    echo "Pushing $SERVICE to GHCR..."
    docker tag collectioncrm_$SERVICE:latest ghcr.io/$GITHUB_ORG/collectioncrm/$SERVICE:latest
    docker push ghcr.io/$GITHUB_ORG/collectioncrm/$SERVICE:latest
done

echo "All services pushed to GHCR successfully!"
```

Make the script executable:

```bash
chmod +x docker/ghcr/push-to-ghcr.sh
```

## Image Visibility

By default, packages published to GHCR are private. To make them public:

1. Go to the package on GitHub
2. Click "Package settings"
3. Under "Danger Zone", change the visibility to "Public"

## Best Practices

1. **Use Semantic Versioning**: Tag your images with semantic version numbers (e.g., v1.0.0) for production releases.

2. **Use the 'latest' Tag Sparingly**: The 'latest' tag should point to the most recent stable version, not necessarily the most recent build.

3. **Use GitHub Actions for CI/CD**: Set up GitHub Actions workflows to automatically build and push images to GHCR when changes are pushed to specific branches.

4. **Image Scanning**: Enable Dependabot alerts for your container images to receive notifications about vulnerabilities.

5. **Clean Up Old Images**: Regularly delete old and unused images to save storage space.

## Example GitHub Actions Workflow

Here's an example GitHub Actions workflow that builds and pushes a Docker image to GHCR:

```yaml
name: Build and Push Docker Image

on:
  push:
    branches: [ main ]
    paths:
      - 'src/services/api-gateway/**'
      - 'docker/base-images/node.Dockerfile'

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Log in to GitHub Container Registry
        uses: docker/login-action@v2
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push Docker image
        uses: docker/build-push-action@v4
        with:
          context: ./src/services/api-gateway
          file: ./docker/base-images/node.Dockerfile
          push: true
          tags: |
            ghcr.io/${{ github.repository_owner }}/collectioncrm/api-gateway:latest
            ghcr.io/${{ github.repository_owner }}/collectioncrm/api-gateway:${{ github.sha }}
```

## Troubleshooting

### Authentication Issues

If you encounter authentication issues:

1. Ensure your PAT has the correct permissions
2. Verify that your PAT hasn't expired
3. Try logging out and logging back in:
   ```bash
   docker logout ghcr.io
   docker login ghcr.io -u USERNAME -p YOUR_PAT
   ```

### Rate Limiting

GitHub enforces rate limits on container registry operations. If you hit rate limits, consider:

1. Using a PAT with higher rate limits
2. Implementing caching strategies
3. Optimizing your workflows to reduce the number of pull operations