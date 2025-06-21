#!/bin/bash

# CollectionCRM Staging Deployment Script
# Usage: ./deploy-staging.sh [version]

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
COMPOSE_FILE="$PROJECT_ROOT/docker/compose/docker-compose.staging.yml"
ENV_FILE="$PROJECT_ROOT/.env.staging"
BACKUP_DIR="$PROJECT_ROOT/backups/$(date +%Y%m%d_%H%M%S)"
LOG_FILE="$PROJECT_ROOT/logs/deploy-staging.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

# Pre-deployment checks
pre_checks() {
    log "Running pre-deployment checks..."
    
    # Check if running as root or with sudo
    if [[ $EUID -eq 0 ]]; then
        warning "Running as root. Consider using a dedicated user for deployments."
    fi
    
    # Check Docker and Docker Compose
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed or not in PATH"
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed or not in PATH"
    fi
    
    # Check if compose file exists
    if [[ ! -f "$COMPOSE_FILE" ]]; then
        error "Compose file not found: $COMPOSE_FILE"
    fi
    
    # Check environment file
    if [[ ! -f "$ENV_FILE" ]]; then
        warning "Environment file not found: $ENV_FILE"
        warning "Make sure to create $ENV_FILE with staging configuration"
    fi
    
    # Check disk space (require at least 5GB free)
    available_space=$(df / | awk 'NR==2 {print $4}')
    required_space=5242880  # 5GB in KB
    if [[ $available_space -lt $required_space ]]; then
        error "Insufficient disk space. Required: 5GB, Available: $(($available_space / 1024 / 1024))GB"
    fi
    
    success "Pre-deployment checks passed"
}

# Backup current deployment
backup_current() {
    log "Creating backup of current deployment..."
    
    mkdir -p "$BACKUP_DIR"
    
    # Backup database
    if docker-compose -f "$COMPOSE_FILE" exec -T postgres pg_dump -U collectioncrm collectioncrm_staging > "$BACKUP_DIR/database_backup.sql" 2>/dev/null; then
        success "Database backup created"
    else
        warning "Database backup failed or database not running"
    fi
    
    # Backup environment files
    if [[ -f "$ENV_FILE" ]]; then
        cp "$ENV_FILE" "$BACKUP_DIR/"
        success "Docker compose environment file backed up"
    fi
    
    # Backup all service .env.staging files
    log "Backing up service environment files..."
    mkdir -p "$BACKUP_DIR/service-envs"
    
    # List of services with .env.staging files
    services=("api-gateway" "auth-service" "bank-sync-service" "workflow-service" "payment-service" "campaign-engine")
    
    for service in "${services[@]}"; do
        env_file="$PROJECT_ROOT/src/services/$service/.env.staging"
        if [[ -f "$env_file" ]]; then
            cp "$env_file" "$BACKUP_DIR/service-envs/$service.env.staging"
            log "  - Backed up $service/.env.staging"
        fi
    done
    
    # Backup frontend .env.staging if exists
    if [[ -f "$PROJECT_ROOT/src/frontend/.env.staging" ]]; then
        cp "$PROJECT_ROOT/src/frontend/.env.staging" "$BACKUP_DIR/service-envs/frontend.env.staging"
        log "  - Backed up frontend/.env.staging"
    fi
    
    success "All environment files backed up"
    
    # Backup docker-compose file
    cp "$COMPOSE_FILE" "$BACKUP_DIR/"
    
    # Create deployment metadata
    cat > "$BACKUP_DIR/deployment_info.txt" << EOF
Deployment Date: $(date)
Git Commit: $(git rev-parse HEAD 2>/dev/null || echo "Unknown")
Git Branch: $(git branch --show-current 2>/dev/null || echo "Unknown")
Docker Images:
$(docker-compose -f "$COMPOSE_FILE" images 2>/dev/null || echo "No running services")
EOF
    
    success "Backup created at: $BACKUP_DIR"
}

# Build and pull images
build_images() {
    local version=${1:-latest}
    log "Building/pulling images for version: $version"
    
    cd "$PROJECT_ROOT"
    
    # Set version in environment
    export APP_VERSION="$version"
    
    # Build images
    if ! docker-compose -f "$COMPOSE_FILE" build --no-cache; then
        error "Failed to build images"
    fi
    
    success "Images built successfully"
}

# Database migration
run_migrations() {
    log "Running database migrations..."
    
    # Wait for database to be ready
    local max_attempts=30
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        if docker-compose -f "$COMPOSE_FILE" exec -T postgres pg_isready -U collectioncrm -d collectioncrm_staging > /dev/null 2>&1; then
            break
        fi
        log "Waiting for database... (attempt $attempt/$max_attempts)"
        sleep 10
        ((attempt++))
    done
    
    if [[ $attempt -gt $max_attempts ]]; then
        error "Database not ready after $max_attempts attempts"
    fi
    
    # Run migrations (assuming a migration service)
    if docker-compose -f "$COMPOSE_FILE" run --rm --no-deps api-gateway npm run migrate; then
        success "Database migrations completed"
    else
        error "Database migrations failed"
    fi
}

# Deploy services
deploy_services() {
    log "Deploying services..."
    
    cd "$PROJECT_ROOT"
    
    # Start infrastructure services first
    log "Starting infrastructure services..."
    if ! docker-compose -f "$COMPOSE_FILE" up -d postgres redis zookeeper kafka; then
        error "Failed to start infrastructure services"
    fi
    
    # Wait for infrastructure to be ready
    sleep 30
    
    # Start application services
    log "Starting application services..."
    if ! docker-compose -f "$COMPOSE_FILE" up -d; then
        error "Failed to start application services"
    fi
    
    success "Services deployed successfully"
}

# Health checks
health_checks() {
    log "Running health checks..."
    
    local services=("api-gateway" "auth-service" "bank-sync-service" "workflow-service")
    local max_attempts=30
    local failed_services=()
    
    for service in "${services[@]}"; do
        local attempt=1
        local healthy=false
        
        log "Checking health of $service..."
        
        while [[ $attempt -le $max_attempts ]]; do
            if docker-compose -f "$COMPOSE_FILE" exec -T "$service" wget --no-verbose --tries=1 --spider http://localhost:3000/health > /dev/null 2>&1; then
                healthy=true
                break
            fi
            sleep 10
            ((attempt++))
        done
        
        if [[ "$healthy" == "true" ]]; then
            success "$service is healthy"
        else
            error "$service health check failed"
            failed_services+=("$service")
        fi
    done
    
    if [[ ${#failed_services[@]} -gt 0 ]]; then
        error "Health checks failed for: ${failed_services[*]}"
    fi
    
    success "All health checks passed"
}

# Cleanup old images and containers
cleanup() {
    log "Cleaning up old images and containers..."
    
    # Remove unused containers
    docker container prune -f > /dev/null 2>&1 || true
    
    # Remove unused images (keep images from last 3 days)
    docker image prune -f --filter "until=72h" > /dev/null 2>&1 || true
    
    # Remove unused volumes (be careful with this)
    # docker volume prune -f > /dev/null 2>&1 || true
    
    success "Cleanup completed"
}

# Smoke tests
smoke_tests() {
    log "Running smoke tests..."
    
    # Test API endpoints
    local api_base="https://staging.collectioncrm.local/api"
    
    # Test health endpoint
    if curl -f -s "$api_base/health" > /dev/null; then
        success "API health endpoint responsive"
    else
        error "API health endpoint not responsive"
    fi
    
    # Test auth endpoint
    if curl -f -s "$api_base/auth/status" > /dev/null; then
        success "Auth service responsive"
    else
        warning "Auth service may not be responsive"
    fi
    
    success "Smoke tests completed"
}

# Send notification
send_notification() {
    local status="$1"
    local message="$2"
    
    # Example: Send Slack notification
    # curl -X POST -H 'Content-type: application/json' \
    #     --data "{\"text\":\"Staging Deployment $status: $message\"}" \
    #     "$SLACK_WEBHOOK_URL"
    
    log "Notification: $status - $message"
}

# Rollback function
rollback() {
    local backup_dir="$1"
    
    error "Deployment failed. Initiating rollback..."
    
    if [[ -d "$backup_dir" ]]; then
        log "Rolling back to previous version..."
        
        # Stop current services
        docker-compose -f "$COMPOSE_FILE" down
        
        # Restore database backup
        if [[ -f "$backup_dir/database_backup.sql" ]]; then
            docker-compose -f "$COMPOSE_FILE" up -d postgres
            sleep 30
            docker-compose -f "$COMPOSE_FILE" exec -T postgres psql -U collectioncrm -d collectioncrm_staging < "$backup_dir/database_backup.sql"
        fi
        
        # Restore environment file
        if [[ -f "$backup_dir/.env.staging" ]]; then
            cp "$backup_dir/.env.staging" "$ENV_FILE"
        fi
        
        # Start services with previous configuration
        docker-compose -f "$COMPOSE_FILE" up -d
        
        warning "Rollback completed. Please check the logs and fix issues before next deployment."
    else
        error "Backup directory not found. Manual intervention required."
    fi
}

# Main deployment function
main() {
    local version=${1:-latest}
    
    log "Starting staging deployment for version: $version"
    
    # Trap for cleanup on failure
    trap 'rollback "$BACKUP_DIR"' ERR
    
    # Create log directory
    mkdir -p "$(dirname "$LOG_FILE")"
    
    # Run deployment steps
    pre_checks
    backup_current
    build_images "$version"
    deploy_services
    run_migrations
    health_checks
    smoke_tests
    cleanup
    
    # Remove error trap on success
    trap - ERR
    
    success "Staging deployment completed successfully!"
    send_notification "SUCCESS" "Staging deployment completed for version $version"
    
    log "Deployment summary:"
    log "- Version: $version"
    log "- Backup location: $BACKUP_DIR"
    log "- Log file: $LOG_FILE"
    log "- Application URL: https://staging.collectioncrm.local"
}

# Script entry point
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi