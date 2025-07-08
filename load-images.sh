#!/bin/bash

# Load Docker images from tar.gz files

echo "Loading Docker images..."

IMAGES_DIR="/workspaces/CollectionCRM/deployment/package/docker-images"

# Load each image
for image in "$IMAGES_DIR"/*.tar.gz; do
    if [ -f "$image" ]; then
        echo "Loading $(basename "$image")..."
        docker load < "$image"
    fi
done

echo "All images loaded!"
echo ""
echo "Loaded images:"
docker images | grep collectioncrm