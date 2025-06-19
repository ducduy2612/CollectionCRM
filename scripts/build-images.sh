#!/bin/bash

# CollectionCRM Image Build Script
# Usage: ./build-images.sh [version] [--service=service-name] [--environment=staging|production]

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Default values
VERSION="latest"
SERVICE=""
ENVIRONMENT="production"
PUSH_IMAGES=false
NO_CACHE=false

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --service=*)
                SERVICE="${1#*=}"
                shift
                ;;
            --environment=*)
                ENVIRONMENT="${1#*=}"
                shift
                ;;
            --push)
                PUSH_IMAGES=true
                shift
                ;;
            --no-cache)
                NO_CACHE=true
                shift
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            *)
                VERSION="$1"
                shift
                ;;
        esac
    done
}

show_help() {
    cat << EOF
CollectionCRM Image Build Script

Usage: $0 [version] [options]

Arguments:
    version         Docker image version tag (default: latest)

Options:
    --service=NAME  Build specific service only (api-gateway, auth-service, bank-sync-service, workflow-service, frontend)
    --environment=ENV  Target environment: staging or production (default: production)
    --push          Push images to registry after building
    --no-cache      Build without using cache
    --help, -h      Show this help message

Examples:
    $0 v1.2.3                           # Build all services with version v1.2.3
    $0 v1.2.3 --service=api-gateway     # Build only API Gateway
    $0 latest --environment=staging     # Build for staging environment
    $0 v1.2.3 --push                    # Build and push to registry
    $0 --no-cache                       # Build without cache

EOF
}

# Build single service
build_service() {
    local service="$1"
    local dockerfile_path="docker/production-images/${service}.Dockerfile"
    local image_name="collectioncrm/${service}"
    local image_tag="${image_name}:${VERSION}"
    
    if [[ ! -f "$PROJECT_ROOT/$dockerfile_path" ]]; then
        warning "Dockerfile not found: $dockerfile_path"
        return 1
    fi
    
    log "Building $service..."
    
    # Build command
    local build_cmd="docker build"
    
    if [[ "$NO_CACHE" == "true" ]]; then
        build_cmd="$build_cmd --no-cache"
    fi
    
    build_cmd="$build_cmd -f $dockerfile_path -t $image_tag $PROJECT_ROOT"
    
    if [[ "$ENVIRONMENT" == "staging" ]]; then
        build_cmd="$build_cmd -t ${image_name}:staging"
    fi
    
    log "Running: $build_cmd"
    
    if eval "$build_cmd"; then
        success "Built $image_tag"
        
        # Push if requested
        if [[ "$PUSH_IMAGES" == "true" ]]; then
            log "Pushing $image_tag..."
            docker push "$image_tag"
            
            if [[ "$ENVIRONMENT" == "staging" ]]; then
                docker push "${image_name}:staging"
            fi
            
            success "Pushed $image_tag"
        fi
        
        return 0
    else
        warning "Failed to build $service"
        return 1
    fi
}

# Build all services
build_all_services() {
    local services=("api-gateway" "auth-service" "bank-sync-service" "workflow-service" "frontend")
    local failed_services=()
    
    log "Building all services for $ENVIRONMENT environment with version: $VERSION"
    
    for service in "${services[@]}"; do
        if ! build_service "$service"; then
            failed_services+=("$service")
        fi
    done
    
    if [[ ${#failed_services[@]} -eq 0 ]]; then
        success "All services built successfully!"
    else
        warning "Failed to build: ${failed_services[*]}"
        return 1
    fi
}

# Show build summary
show_summary() {
    log "Build Summary:"
    log "- Environment: $ENVIRONMENT"
    log "- Version: $VERSION"
    log "- Services: $(if [[ -n "$SERVICE" ]]; then echo "$SERVICE"; else echo "all"; fi)"
    log "- Push images: $PUSH_IMAGES"
    log "- No cache: $NO_CACHE"
    echo
    
    # Show built images
    log "Built images:"
    if [[ -n "$SERVICE" ]]; then
        docker images "collectioncrm/$SERVICE" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"
    else
        docker images "collectioncrm/*" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"
    fi
}

# Main function
main() {
    parse_args "$@"
    
    cd "$PROJECT_ROOT"
    
    log "Starting image build process..."
    
    if [[ -n "$SERVICE" ]]; then
        build_service "$SERVICE"
    else
        build_all_services
    fi
    
    show_summary
    
    success "Build process completed!"
}

# Script entry point
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi