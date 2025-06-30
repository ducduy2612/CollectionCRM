#!/bin/bash

# Build Script for Production Docker Images
# This script builds all production images without exposing source code

set -e

# Configuration
REGISTRY="${DOCKER_REGISTRY:-docker.io}"
ORG_NAME="${DOCKER_ORG:-collectioncrm}"
VERSION="${VERSION:-latest}"
BUILD_NUMBER="${BUILD_NUMBER:-$(date +%Y%m%d%H%M%S)}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Services to build
SERVICES=(
    "frontend"
    "api-gateway"
    "auth-service"
    "bank-sync-service"
    "workflow-service"
    "campaign-engine"
    "payment-service"
)

# Function to print colored output
log() {
    echo -e "${GREEN}[BUILD]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Function to build a single service
build_service() {
    local service=$1
    local dockerfile="docker/production-images/${service}.Dockerfile"
    
    if [ ! -f "$dockerfile" ]; then
        error "Dockerfile not found for service: $service"
        return 1
    fi
    
    log "Building $service..."
    
    # Build with multiple tags
    docker build \
        -f "$dockerfile" \
        -t "${REGISTRY}/${ORG_NAME}/${service}:${VERSION}" \
        -t "${REGISTRY}/${ORG_NAME}/${service}:${BUILD_NUMBER}" \
        -t "${REGISTRY}/${ORG_NAME}/${service}:latest" \
        --build-arg BUILD_NUMBER="${BUILD_NUMBER}" \
        --build-arg VERSION="${VERSION}" \
        --platform linux/amd64 \
        .
    
    if [ $? -eq 0 ]; then
        log "Successfully built $service"
    else
        error "Failed to build $service"
        return 1
    fi
}

# Function to save images to tar files
save_images() {
    local output_dir="dist/docker-images"
    mkdir -p "$output_dir"
    
    log "Saving Docker images to tar files..."
    
    for service in "${SERVICES[@]}"; do
        log "Saving $service image..."
        docker save \
            "${REGISTRY}/${ORG_NAME}/${service}:${VERSION}" \
            -o "${output_dir}/${service}-${VERSION}.tar"
        
        # Compress the tar file
        gzip -9 "${output_dir}/${service}-${VERSION}.tar"
        log "Saved ${service}-${VERSION}.tar.gz"
    done
}

# Function to push images to registry
push_images() {
    log "Pushing images to registry..."
    
    for service in "${SERVICES[@]}"; do
        log "Pushing $service..."
        docker push "${REGISTRY}/${ORG_NAME}/${service}:${VERSION}"
        docker push "${REGISTRY}/${ORG_NAME}/${service}:${BUILD_NUMBER}"
        docker push "${REGISTRY}/${ORG_NAME}/${service}:latest"
    done
}

# Main build process
main() {
    log "Starting production build process..."
    log "Version: ${VERSION}"
    log "Build Number: ${BUILD_NUMBER}"
    log "Registry: ${REGISTRY}/${ORG_NAME}"
    
    # Build all services
    for service in "${SERVICES[@]}"; do
        build_service "$service" || exit 1
    done
    
    log "All services built successfully!"
    
    # Ask if user wants to save images
    read -p "Save images to tar files? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        save_images
    fi
    
    # Ask if user wants to push to registry
    read -p "Push images to registry? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        push_images
    fi
    
    log "Build process completed!"
}

# Run main function
main