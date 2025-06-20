# GitHub Container Registry Setup

This guide explains how to use GitHub Container Registry (ghcr.io) for the CollectionCRM project.

## Overview

GitHub Container Registry (ghcr.io) is a free Docker registry provided by GitHub that integrates seamlessly with GitHub Actions. All images are stored under your GitHub organization/user namespace.

## Repository Setup

### 1. Enable GitHub Packages

1. Go to your repository settings
2. Navigate to "Actions" → "General"
3. Under "Workflow permissions", select "Read and write permissions"
4. Check "Allow GitHub Actions to create and approve pull requests"
5. Save changes

### 2. Configure Package Visibility

1. Go to your GitHub profile/organization → "Packages"
2. Find each package after first build
3. Click on package → "Package settings"
4. Set visibility (public for free unlimited storage, private counts against storage quota)

## Usage

### Building Images Locally

```bash
# Build an image locally with proper tag
docker build -t ghcr.io/YOUR_GITHUB_USERNAME/collectioncrm-frontend:latest \
  -f docker/production-images/frontend.Dockerfile .
```

### Pulling Images

Images are publicly accessible (if set to public):

```bash
# No authentication needed for public images
docker pull ghcr.io/YOUR_GITHUB_USERNAME/collectioncrm-frontend:latest
```

For private images, authenticate first:

```bash
# Login to GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin

# Pull private image
docker pull ghcr.io/YOUR_GITHUB_USERNAME/collectioncrm-frontend:latest
```

### Running with Docker Compose

```bash
# Set environment variables
export GITHUB_REPOSITORY_OWNER=YOUR_GITHUB_USERNAME
export IMAGE_TAG=latest  # or specific tag like 'staging', 'main-abc123'

# Run staging environment
docker-compose -f docker/compose/docker-compose.staging.yml up -d
```

## GitHub Actions Workflow

The workflow automatically builds and pushes images on:
- Push to `main` or `staging` branches
- Pull requests (builds only, no push)
- Manual trigger with custom tag

### Image Tags

The workflow creates multiple tags for each image:
- `latest` - Latest from main branch
- `main` - Latest from main branch
- `staging` - Latest from staging branch
- `main-SHA` - Specific commit on main
- `staging-SHA` - Specific commit on staging
- `pr-NUMBER` - Pull request builds
- Custom tags via manual trigger

### Supported Platforms

All images are multi-platform:
- `linux/amd64` (x86_64)
- `linux/arm64` (ARM64/Apple Silicon)

## CI/CD Integration

### Automatic Deployments

1. Push to `main` → Images tagged as `latest` and `main`
2. Push to `staging` → Images tagged as `staging`
3. Create tag `v1.0.0` → Images tagged as `1.0.0`, `1.0`, and `latest`

### Manual Deployment

```bash
# Deploy specific version
export IMAGE_TAG=main-abc123
docker-compose -f docker/compose/docker-compose.staging.yml up -d

# Deploy latest
export IMAGE_TAG=latest
docker-compose -f docker/compose/docker-compose.staging.yml up -d
```

## Security

### Repository Secrets

No additional secrets needed! GitHub Actions automatically provides:
- `GITHUB_TOKEN` - Automatic authentication for ghcr.io
- `github.repository_owner` - Your GitHub username/org

### Access Control

- Public images: Anyone can pull
- Private images: Requires GitHub authentication
- Push access: Limited to GitHub Actions and authorized users

## Troubleshooting

### Build Failures

1. Check GitHub Actions logs
2. Ensure Dockerfiles have correct paths
3. Verify base images are accessible

### Authentication Issues

```bash
# Revoke old tokens
docker logout ghcr.io

# Create new personal access token with 'write:packages' scope
# https://github.com/settings/tokens

# Login with new token
echo $NEW_TOKEN | docker login ghcr.io -u YOUR_USERNAME --password-stdin
```

### Storage Limits

- Public images: Unlimited free storage
- Private images: Count against GitHub storage quota
  - Free accounts: 500MB
  - Pro accounts: 2GB
  - Enterprise: 50GB

## Best Practices

1. **Use specific tags in production**
   ```bash
   export IMAGE_TAG=main-$(git rev-parse --short HEAD)
   ```

2. **Regular cleanup of old images**
   - Go to package settings
   - Enable "Delete untagged versions"
   - Set retention policies

3. **Monitor image sizes**
   - Use multi-stage builds
   - Minimize layers
   - Use alpine base images where possible

4. **Security scanning**
   - GitHub automatically scans public images
   - Enable Dependabot for base image updates