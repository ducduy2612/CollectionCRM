#!/bin/bash

# Build Script for All CollectionCRM Docker Images
# This script builds generic production images without any environment-specific configuration
# All configuration is injected at runtime through environment variables

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
OUTPUT_DIR="$SCRIPT_DIR/../package/docker-images"
VERSION="${VERSION:-latest}"
BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
BUILD_NUMBER="${BUILD_NUMBER:-$(date +%Y%m%d%H%M%S)}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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
    "audit-service"
)

# Infrastructure images from Docker Hub
INFRA_IMAGES=(
    "postgres:15-alpine"
    "redis:7-alpine"
    "nginx:alpine"
    "confluentinc/cp-zookeeper:7.5.0"
    "confluentinc/cp-kafka:7.5.0"
    "prodrigestivill/postgres-backup-local:15"
    "edoburu/pgbouncer:latest"
    "provectuslabs/kafka-ui:latest"
    "minio/minio:latest"
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

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed"
        exit 1
    fi
    
    # Check Docker daemon
    if ! docker info &> /dev/null; then
        error "Docker daemon is not running"
        exit 1
    fi
    
    # Check disk space (need at least 10GB)
    available_space=$(df -BG "$PROJECT_ROOT" 2>/dev/null | awk 'NR==2 {print $4}' | sed 's/G//')
    if [ -z "$available_space" ] || [ "$available_space" -lt 10 ]; then
        warning "Low disk space. At least 10GB recommended."
    fi
}

# Create output directory
setup_directories() {
    log "Setting up directories..."
    mkdir -p "$OUTPUT_DIR"
    
    # Clean images based on what we're building
    if [ -d "$OUTPUT_DIR" ]; then
        if [ $# -eq 0 ]; then
            # Building all - clean everything
            if [ "$(ls -A "$OUTPUT_DIR" 2>/dev/null)" ]; then
                warning "Cleaning all old images in $OUTPUT_DIR"
                rm -f "$OUTPUT_DIR"/*.tar.gz
            fi
        elif [ $# -eq 1 ]; then
            # Building specific target - clean only that target's files
            local target="$1"
            
            # For services, clean service-specific files
            if [[ " ${SERVICES[@]} " =~ " ${target} " ]]; then
                warning "Cleaning old images for service: $target"
                rm -f "$OUTPUT_DIR/${target}-"*.tar.gz
            # For infra images, clean that specific image file
            elif [[ " ${INFRA_IMAGES[@]} " =~ " ${target} " ]]; then
                local filename=$(echo "$target" | sed 's/[:/]/_/g').tar.gz
                warning "Cleaning old image: $filename"
                rm -f "$OUTPUT_DIR/$filename"
            fi
        fi
    fi
}

# Create a generic production Dockerfile if missing
create_generic_dockerfile() {
    local service=$1
    local dockerfile="$PROJECT_ROOT/docker/production-images/${service}.Dockerfile"
    
    mkdir -p "$(dirname "$dockerfile")"
    
    # For frontend, we need a special handling
    if [ "$service" == "frontend" ]; then
        create_frontend_dockerfile
        return
    fi
    
    cat > "$dockerfile" << 'EOF'
# Multi-stage Dockerfile for Production Build
# Generic image - all configuration via environment variables at runtime
FROM node:20-alpine AS base

# Install security updates
RUN apk update && apk upgrade && \
    apk add --no-cache dumb-init && \
    rm -rf /var/cache/apk/*

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodeuser -u 1001

WORKDIR /app

# Stage 1: Dependencies
FROM base AS deps

# Copy package files only
COPY src/services/SERVICE_NAME/package*.json ./services/SERVICE_NAME/

# Check if common module exists and copy if needed
COPY src/common/package*.json ./common/ 2>/dev/null || true

# Install production dependencies
WORKDIR /app/services/SERVICE_NAME
RUN npm ci --only=production --no-audit --no-fund

# Stage 2: Build
FROM base AS build

# Copy all source files
COPY src/common ./common
COPY src/services/SERVICE_NAME ./services/SERVICE_NAME

# Install all dependencies (including dev) for building
WORKDIR /app/common
RUN if [ -f "package.json" ]; then npm install && npm run build; fi

WORKDIR /app/services/SERVICE_NAME
RUN npm install && npm run build

# Stage 3: Production
FROM base AS production

# Copy built application
COPY --from=build /app/common ./common
COPY --from=build /app/services/SERVICE_NAME/dist ./services/SERVICE_NAME/dist
COPY --from=build /app/services/SERVICE_NAME/package*.json ./services/SERVICE_NAME/

# Copy production dependencies
COPY --from=deps /app/services/SERVICE_NAME/node_modules ./services/SERVICE_NAME/node_modules

# Set ownership
RUN chown -R nodeuser:nodejs /app

WORKDIR /app/services/SERVICE_NAME

# Switch to non-root user
USER nodeuser

# Use dumb-init as entrypoint
ENTRYPOINT ["dumb-init", "--"]

# Default port (can be overridden by PORT env var)
EXPOSE 3000

# Health check endpoint (services should implement /health)
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT:-3000}/health || exit 1

# Start the application
CMD ["node", "dist/index.js"]
EOF
    
    # Replace SERVICE_NAME with actual service name
    sed -i "s/SERVICE_NAME/${service}/g" "$dockerfile"
}

# Create frontend Dockerfile (special case - static files)
create_frontend_dockerfile() {
    local dockerfile="$PROJECT_ROOT/docker/production-images/frontend.Dockerfile"
    
    cat > "$dockerfile" << 'EOF'
# Multi-stage Dockerfile for Frontend - Production Build
# Generic image - configuration injected via environment substitution at runtime
FROM node:20-alpine AS base

RUN apk update && apk upgrade && \
    rm -rf /var/cache/apk/*

WORKDIR /app

# Stage 1: Dependencies
FROM base AS deps

COPY src/frontend/package*.json ./
RUN npm ci --no-audit --no-fund

# Stage 2: Build
FROM base AS build

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY src/frontend ./

# Create a generic .env file for build with placeholders
# These will be replaced at runtime
RUN echo 'VITE_API_URL=${API_URL}' > .env && \
    echo 'VITE_APP_NAME=CollectionCRM' >> .env && \
    echo 'VITE_APP_VERSION=${VERSION}' >> .env

# Build the application
RUN npm run build

# Stage 3: Production - Nginx server
FROM nginx:alpine AS production

# Install envsubst for runtime config injection
RUN apk add --no-cache gettext

# Copy built application
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration template
COPY deployment/package/config/nginx/frontend.conf.template /etc/nginx/templates/default.conf.template

# Create entrypoint script for runtime config injection
RUN echo '#!/bin/sh' > /docker-entrypoint.sh && \
    echo 'echo "Injecting runtime configuration..."' >> /docker-entrypoint.sh && \
    echo 'find /usr/share/nginx/html -name "*.js" -o -name "*.html" | while read file; do' >> /docker-entrypoint.sh && \
    echo '  sed -i "s|\${API_URL}|$API_URL|g" "$file"' >> /docker-entrypoint.sh && \
    echo '  sed -i "s|\${VERSION}|$VERSION|g" "$file"' >> /docker-entrypoint.sh && \
    echo 'done' >> /docker-entrypoint.sh && \
    echo 'envsubst < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf' >> /docker-entrypoint.sh && \
    echo 'exec nginx -g "daemon off;"' >> /docker-entrypoint.sh && \
    chmod +x /docker-entrypoint.sh

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1

ENTRYPOINT ["/docker-entrypoint.sh"]
EOF
}

# Build a single service
build_service() {
    local service=$1
    local dockerfile="$PROJECT_ROOT/docker/production-images/${service}.Dockerfile"
    
    # Check if production dockerfile exists, if not create a generic one
    if [ ! -f "$dockerfile" ]; then
        warning "Creating generic production Dockerfile for $service"
        create_generic_dockerfile "$service"
    fi
    
    log "Building $service..."
    
    # Build with minimal build arguments
    cd "$PROJECT_ROOT"
    
    # Build arguments that don't affect runtime
    docker build \
        -f "$dockerfile" \
        -t "collectioncrm/${service}:${VERSION}" \
        -t "collectioncrm/${service}:${BUILD_NUMBER}" \
        -t "collectioncrm/${service}:latest" \
        --build-arg BUILD_DATE="${BUILD_DATE}" \
        --build-arg BUILD_NUMBER="${BUILD_NUMBER}" \
        --build-arg VERSION="${VERSION}" \
        --platform linux/amd64 \
        --no-cache \
        .
    
    if [ $? -eq 0 ]; then
        log "Successfully built $service"
        return 0
    else
        error "Failed to build $service"
        return 1
    fi
}

# Save Docker image to tar.gz
save_image() {
    local image=$1
    local filename=$2
    
    log "Saving $image to $filename..."
    
    docker save "$image" | gzip -9 > "$OUTPUT_DIR/$filename"
    
    if [ $? -eq 0 ]; then
        local size=$(du -h "$OUTPUT_DIR/$filename" | cut -f1)
        log "Saved $filename (size: $size)"
        return 0
    else
        error "Failed to save $image"
        return 1
    fi
}

# Pull and save infrastructure images
save_infra_images() {
    log "Pulling and saving infrastructure images..."
    
    for image in "${INFRA_IMAGES[@]}"; do
        info "Pulling $image..."
        docker pull "$image"
        
        # Create filename from image name
        filename=$(echo "$image" | sed 's/[:/]/_/g').tar.gz
        save_image "$image" "$filename"
    done
}

# Generate image manifest
generate_manifest() {
    log "Generating image manifest..."
    
    cat > "$OUTPUT_DIR/manifest.json" << EOF
{
  "version": "${VERSION}",
  "build_date": "${BUILD_DATE}",
  "build_number": "${BUILD_NUMBER}",
  "images": {
    "application": [
EOF
    
    # Add application images
    first=true
    for service in "${SERVICES[@]}"; do
        if [ "$first" = true ]; then
            first=false
        else
            echo "," >> "$OUTPUT_DIR/manifest.json"
        fi
        echo -n "      {
        \"name\": \"${service}\",
        \"image\": \"collectioncrm/${service}:${VERSION}\",
        \"file\": \"${service}-${VERSION}.tar.gz\",
        \"requires_env\": true
      }" >> "$OUTPUT_DIR/manifest.json"
    done
    
    cat >> "$OUTPUT_DIR/manifest.json" << EOF

    ],
    "infrastructure": [
EOF
    
    # Add infrastructure images
    first=true
    for image in "${INFRA_IMAGES[@]}"; do
        if [ "$first" = true ]; then
            first=false
        else
            echo "," >> "$OUTPUT_DIR/manifest.json"
        fi
        filename=$(echo "$image" | sed 's/[:/]/_/g').tar.gz
        echo -n "      {
        \"name\": \"$(echo "$image" | cut -d: -f1 | rev | cut -d/ -f1 | rev)\",
        \"image\": \"${image}\",
        \"file\": \"${filename}\"
      }" >> "$OUTPUT_DIR/manifest.json"
    done
    
    cat >> "$OUTPUT_DIR/manifest.json" << EOF

    ]
  },
  "configuration": {
    "note": "All application configuration is injected via environment variables at runtime",
    "required_env_files": [
      ".env"
    ]
  }
}
EOF
}

# Generate checksums
generate_checksums() {
    log "Generating checksums..."
    
    cd "$OUTPUT_DIR"
    sha256sum *.tar.gz > checksums.sha256
    
    log "Checksums saved to checksums.sha256"
}

# Main build process
main() {
    # Check if specific service or infra image was requested
    if [ $# -gt 0 ]; then
        REQUESTED_TARGET="$1"
        
        # Check if it's a service
        if [[ " ${SERVICES[@]} " =~ " ${REQUESTED_TARGET} " ]]; then
            log "Building only service: ${REQUESTED_TARGET}"
            SERVICES=("${REQUESTED_TARGET}")
            INFRA_IMAGES=()  # Skip infrastructure images
        # Check if it's an infra image
        elif [[ " ${INFRA_IMAGES[@]} " =~ " ${REQUESTED_TARGET} " ]]; then
            log "Building only infrastructure image: ${REQUESTED_TARGET}"
            SERVICES=()  # Skip application services
            INFRA_IMAGES=("${REQUESTED_TARGET}")
        else
            error "Unknown target: ${REQUESTED_TARGET}"
            error "Available services: ${SERVICES[*]}"
            error "Available infra images: ${INFRA_IMAGES[*]}"
            exit 1
        fi
    fi
    
    log "Starting CollectionCRM build process..."
    log "Version: ${VERSION}"
    log "Build Number: ${BUILD_NUMBER}"
    log "Build Date: ${BUILD_DATE}"
    echo
    warning "Building GENERIC images - all configuration via environment variables"
    echo
    
    # Check prerequisites
    check_prerequisites
    
    # Setup directories
    setup_directories "$@"
    
    # Build all application services
    if [ ${#SERVICES[@]} -gt 0 ]; then
        build_failed=false
        for service in "${SERVICES[@]}"; do
            if ! build_service "$service"; then
                build_failed=true
                break
            fi
        done
        
        if [ "$build_failed" = true ]; then
            error "Build failed. Aborting."
            exit 1
        fi
        
        log "All services built successfully!"
        
        # Save application images
        log "Saving application images..."
        for service in "${SERVICES[@]}"; do
            save_image "collectioncrm/${service}:${VERSION}" "${service}-${VERSION}.tar.gz"
        done
    fi
    
    # Save infrastructure images
    if [ ${#INFRA_IMAGES[@]} -gt 0 ]; then
        save_infra_images
    fi
    
    # Generate manifest
    generate_manifest
    
    # Generate checksums
    generate_checksums
    
    # Summary
    echo
    log "Build complete! Images saved to: $OUTPUT_DIR"
    log "Total size: $(du -sh "$OUTPUT_DIR" | cut -f1)"
    echo
    info "Images are built generically without embedded configuration"
    info "All configuration must be provided via environment variables at runtime"
    echo
    info "Next steps:"
    info "1. Review the built images in $OUTPUT_DIR"
    info "2. Run ./package-release.sh to create the deployment package"
}

# Run main function
main "$@"