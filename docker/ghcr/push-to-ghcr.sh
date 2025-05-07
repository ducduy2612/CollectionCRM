#!/bin/bash

# Script to push CollectionCRM Docker images to GitHub Container Registry (GHCR)

# Check if GitHub organization name is provided
if [ "$#" -lt 1 ]; then
    echo "Usage: $0 <github-org-name> [service-name]"
    echo "Example: $0 your-org-name api-gateway"
    exit 1
fi

GITHUB_ORG=$1
SERVICE_NAME=$2

# Check if user is logged in to GHCR
if ! docker info | grep -q "ghcr.io"; then
    echo "Error: You are not logged in to GHCR."
    echo "Please login using: docker login ghcr.io -u USERNAME -p YOUR_PAT"
    exit 1
fi

# If service name is provided, push only that service
if [ ! -z "$SERVICE_NAME" ]; then
    echo "Pushing $SERVICE_NAME to GHCR..."
    
    # Check if the image exists locally
    if ! docker image inspect collectioncrm_$SERVICE_NAME:latest &> /dev/null; then
        echo "Error: Image collectioncrm_$SERVICE_NAME:latest not found locally."
        echo "Please build the image first using: docker-compose build $SERVICE_NAME"
        exit 1
    fi
    
    docker tag collectioncrm_$SERVICE_NAME:latest ghcr.io/$GITHUB_ORG/collectioncrm/$SERVICE_NAME:latest
    docker push ghcr.io/$GITHUB_ORG/collectioncrm/$SERVICE_NAME:latest
    
    echo "Successfully pushed $SERVICE_NAME to GHCR."
    exit 0
fi

# Push all services
SERVICES=("api-gateway" "auth-service" "bank-sync-service" "payment-service" "workflow-service" "frontend")

echo "Pushing all CollectionCRM services to GHCR..."

for SERVICE in "${SERVICES[@]}"; do
    echo "Processing $SERVICE..."
    
    # Check if the image exists locally
    if ! docker image inspect collectioncrm_$SERVICE:latest &> /dev/null; then
        echo "Warning: Image collectioncrm_$SERVICE:latest not found locally. Skipping."
        continue
    fi
    
    echo "Tagging and pushing $SERVICE..."
    docker tag collectioncrm_$SERVICE:latest ghcr.io/$GITHUB_ORG/collectioncrm/$SERVICE:latest
    docker push ghcr.io/$GITHUB_ORG/collectioncrm/$SERVICE:latest
    echo "$SERVICE pushed successfully."
done

echo "All available services pushed to GHCR successfully!"