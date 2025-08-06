#!/bin/bash

# CollectionCRM Docker Image Loader Script
# Loads pre-built Docker images from tar.gz files

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_DIR="$(dirname "$SCRIPT_DIR")"
IMAGES_DIR="${BASE_DIR}/docker-images"
LOG_FILE="${BASE_DIR}/load-images.log"

# Functions
log() {
    echo -e "${2:-$NC}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    log "$1" "$RED"
    exit 1
}

success() {
    log "$1" "$GREEN"
}

info() {
    log "$1" "$BLUE"
}

warning() {
    log "$1" "$YELLOW"
}

# Load manifest file
MANIFEST_FILE="${IMAGES_DIR}/manifest.json"

# Parse manifest function
parse_manifest() {
    if [ ! -f "$MANIFEST_FILE" ]; then
        warning "Manifest file not found at $MANIFEST_FILE"
        return 1
    fi
    
    # Extract image mappings from manifest
    jq -r '.images.infrastructure[] | "\(.name):\(.file)"' "$MANIFEST_FILE" 2>/dev/null || {
        warning "Failed to parse manifest file"
        return 1
    }
}

# Image mappings for each server type (loaded from manifest)
declare -A SERVER1_IMAGES=(
    ["postgres"]="postgres_15-alpine.tar.gz"
    ["pgbouncer"]="edoburu_pgbouncer_latest.tar.gz"
    ["postgres-backup"]="prodrigestivill_postgres-backup-local_15.tar.gz"
)

declare -A SERVER2_IMAGES=(
    ["redis"]="redis_7-alpine.tar.gz"
    ["zookeeper"]="confluentinc_cp-zookeeper_7.5.0.tar.gz"
    ["kafka"]="confluentinc_cp-kafka_7.5.0.tar.gz"
)

declare -A SERVER3_IMAGES=(
    ["nginx"]="nginx_alpine.tar.gz"
    ["frontend"]="frontend-latest.tar.gz"
    ["api-gateway"]="api-gateway-latest.tar.gz"
    ["auth-service"]="auth-service-latest.tar.gz"
    ["bank-sync-service"]="bank-sync-service-latest.tar.gz"
    ["workflow-service"]="workflow-service-latest.tar.gz"
    ["campaign-engine"]="campaign-engine-latest.tar.gz"
    ["payment-service"]="payment-service-latest.tar.gz"
    ["audit-service"]="audit-service-latest.tar.gz"
    ["minio"]="minio_minio_latest.tar.gz"
)

check_images_directory() {
    if [ ! -d "$IMAGES_DIR" ]; then
        warning "Images directory not found at $IMAGES_DIR"
        warning "Skipping image loading - will pull from registry instead"
        exit 0
    fi
    
    local count=$(find "$IMAGES_DIR" -name "*.tar.gz" -type f | wc -l)
    if [ "$count" -eq 0 ]; then
        warning "No image files found in $IMAGES_DIR"
        warning "Skipping image loading - will pull from registry instead"
        exit 0
    fi
    
    info "Found $count image files in $IMAGES_DIR"
}

load_image() {
    local image_name="$1"
    local image_file="$2"
    local full_path="${IMAGES_DIR}/${image_file}"
    
    if [ ! -f "$full_path" ]; then
        warning "Image file not found: $image_file"
        return 1
    fi
    
    info "Loading $image_name from $image_file..."
    
    # Check file size
    local size=$(du -h "$full_path" | awk '{print $1}')
    info "Image size: $size"
    
    # Load the image
    if docker load -i "$full_path"; then
        success "Successfully loaded $image_name"
        return 0
    else
        error "Failed to load $image_name"
        return 1
    fi
}

load_server_images() {
    local server_type="$1"
    local loaded=0
    local failed=0
    local -A images_to_load
    
    case "$server_type" in
        server1)
            for key in "${!SERVER1_IMAGES[@]}"; do
                images_to_load["$key"]="${SERVER1_IMAGES[$key]}"
            done
            info "Loading Database Server images..."
            ;;
        server2)
            for key in "${!SERVER2_IMAGES[@]}"; do
                images_to_load["$key"]="${SERVER2_IMAGES[$key]}"
            done
            info "Loading Cache/Message Server images..."
            ;;
        server3)
            info "Loading Application Server images..."
            info "SERVER3_IMAGES has ${#SERVER3_IMAGES[@]} items"
            for key in "${!SERVER3_IMAGES[@]}"; do
                info "Adding: $key -> ${SERVER3_IMAGES[$key]}"
                images_to_load["$key"]="${SERVER3_IMAGES[$key]}"
            done
            ;;
        all)
            info "Loading all server images..."
            load_server_images "server1"
            load_server_images "server2"
            load_server_images "server3"
            return
            ;;
        *)
            error "Unknown server type: $server_type"
            ;;
    esac
    
    # Load images for the specified server
    info "Starting to load ${#images_to_load[@]} images..."
    for image_name in "${!images_to_load[@]}"; do
        info "Processing image: $image_name"
        if load_image "$image_name" "${images_to_load[$image_name]}"; then
            ((loaded++))
            info "Success count: $loaded"
        else
            ((failed++))
            info "Failed count: $failed"
        fi
        info "Continuing to next image..."
    done
    info "Loop completed"
    
    echo ""
    info "Loading complete for $server_type:"
    success "  Loaded: $loaded images"
    if [ "$failed" -gt 0 ]; then
        warning "  Failed: $failed images"
    fi
}

verify_loaded_images() {
    info "Verifying loaded images..."
    
    echo ""
    info "Current Docker images:"
    docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}" | grep -E "(collectioncrm|postgres|redis|kafka|zookeeper|nginx|minio|pgbouncer)" || true
    echo ""
}

prune_old_images() {
    read -p "Remove unused Docker images to free space? (y/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        info "Removing unused images..."
        docker image prune -f
        success "Cleanup completed"
    fi
}

main() {
    clear
    echo "======================================"
    echo "CollectionCRM Docker Image Loader"
    echo "======================================"
    echo ""
    
    # Initialize log
    echo "Image loading started at $(date)" > "$LOG_FILE"
    
    # Check if running as root
    if [[ $EUID -ne 0 ]]; then
        warning "Running without root privileges - may need sudo for docker commands"
    fi
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed"
    fi
    
    # Check jq for manifest parsing
    if ! command -v jq &> /dev/null; then
        warning "jq is not installed - using hardcoded filenames instead of manifest"
    fi
    
    # Check images directory
    check_images_directory
    
    # Determine which images to load
    local server_type="${1:-all}"
    
    if [ "$server_type" == "help" ] || [ "$server_type" == "--help" ]; then
        echo "Usage: $0 [server_type]"
        echo ""
        echo "Server types:"
        echo "  server1 - Load database server images"
        echo "  server2 - Load cache/message server images"
        echo "  server3 - Load application server images"
        echo "  all     - Load all images (default)"
        echo ""
        exit 0
    fi
    
    # Load images
    load_server_images "$server_type"
    
    # Verify loaded images
    verify_loaded_images
    
    # Offer to clean up
    prune_old_images
    
    echo ""
    success "======================================"
    success "Image loading completed!"
    success "======================================"
    info "Logs saved to: $LOG_FILE"
    echo ""
}

# Run main function
main "$@"