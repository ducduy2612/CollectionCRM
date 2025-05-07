#!/bin/bash

# Script to run CollectionCRM with images from GitHub Container Registry (GHCR)

# Check if GitHub organization name is provided
if [ "$#" -lt 1 ]; then
    echo "Usage: $0 <github-org-name>"
    echo "Example: $0 your-org-name"
    
    # Prompt for organization name
    read -p "Enter your GitHub organization name: " GITHUB_ORG
    
    if [ -z "$GITHUB_ORG" ]; then
        echo "Error: GitHub organization name is required."
        exit 1
    fi
else
    GITHUB_ORG=$1
fi

# Check if user is logged in to GHCR
if ! docker info | grep -q "ghcr.io"; then
    echo "Warning: You are not logged in to GHCR."
    echo "You may need to login using: docker login ghcr.io -u USERNAME -p YOUR_PAT"
    
    # Ask if user wants to continue
    read -p "Continue anyway? (y/n): " CONTINUE
    if [ "$CONTINUE" != "y" ] && [ "$CONTINUE" != "Y" ]; then
        exit 1
    fi
fi

# Export the GitHub organization as an environment variable
export GITHUB_ORG=$GITHUB_ORG

echo "Starting CollectionCRM with images from ghcr.io/$GITHUB_ORG/collectioncrm/*"

# Run docker-compose with the GHCR configuration
docker-compose -f docker/compose/docker-compose-ghcr.yml up -d

echo "CollectionCRM services started successfully!"
echo "You can access the services at:"
echo "- Frontend: http://localhost:8080"
echo "- API Gateway: http://localhost:3000"
echo "- Kibana: http://localhost:5601"
echo "- Kafka UI: http://localhost:8090"
echo "- Prometheus: http://localhost:9090"
echo "- Grafana: http://localhost:3001"