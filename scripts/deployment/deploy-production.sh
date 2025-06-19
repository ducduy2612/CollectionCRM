#!/bin/bash

# CollectionCRM Production Deployment Script
# Usage: ./deploy-production.sh [version] [--tier=db|cache|app|lb|all]

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
COMPOSE_BASE_DIR="$PROJECT_ROOT/docker/compose"
ENV_FILE="$PROJECT_ROOT/.env.production"
BACKUP_DIR="$PROJECT_ROOT/backups/production/$(date +%Y%m%d_%H%M%S)"
LOG_FILE="/var/log/collectioncrm/deploy-production.log"

# Default values
TIER="all"
VERSION="latest"
DRY_RUN=false
SKIP_BACKUP=false

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
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

info() {
    echo -e "${PURPLE}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --tier=*)
                TIER="${1#*=}"
                shift
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --skip-backup)
                SKIP_BACKUP=true
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
CollectionCRM Production Deployment Script

Usage: $0 [version] [options]

Arguments:
    version         Docker image version to deploy (default: latest)

Options:
    --tier=TIER     Deploy specific tier: db, cache, app, lb, or all (default: all)
    --dry-run       Show what would be done without executing
    --skip-backup   Skip backup creation (not recommended)
    --help, -h      Show this help message

Examples:
    $0 v1.2.3                    # Deploy version v1.2.3 to all tiers
    $0 v1.2.3 --tier=app         # Deploy only application tier
    $0 --dry-run                 # Show deployment plan without executing
    $0 v1.2.3 --skip-backup      # Deploy without creating backup

Tiers:
    db      - Database tier (PostgreSQL, backups, replication)
    cache   - Cache & messaging tier (Redis, Kafka, Zookeeper)
    app     - Application tier (microservices)
    lb      - Load balancer tier (Nginx, HAProxy, SSL)
    all     - All tiers (default)
EOF
}

# Pre-deployment checks
pre_checks() {
    log "Running pre-deployment checks for tier: $TIER"
    
    # Check if running as root
    if [[ $EUID -eq 0 ]]; then
        error "Do not run production deployments as root"
    fi
    
    # Check Docker and Docker Compose
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed or not in PATH"
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed or not in PATH"
    fi
    
    # Check if we're on a production server
    if [[ ! -f "/etc/collectioncrm/production.marker" ]]; then
        error "This doesn't appear to be a production server. Create /etc/collectioncrm/production.marker to proceed."
    fi
    
    # Check environment file
    if [[ ! -f "$ENV_FILE" ]]; then
        error "Production environment file not found: $ENV_FILE"
    fi
    
    # Check compose files based on tier
    case $TIER in
        db|all)
            if [[ ! -f "$COMPOSE_BASE_DIR/docker-compose.prod-db.yml" ]]; then
                error "Database compose file not found"
            fi
            ;;
        cache|all)
            if [[ ! -f "$COMPOSE_BASE_DIR/docker-compose.prod-cache.yml" ]]; then
                error "Cache compose file not found"
            fi
            ;;
        app|all)
            if [[ ! -f "$COMPOSE_BASE_DIR/docker-compose.prod-app.yml" ]]; then
                error "Application compose file not found"
            fi
            ;;
        lb|all)
            if [[ ! -f "$COMPOSE_BASE_DIR/docker-compose.prod-lb.yml" ]]; then
                error "Load balancer compose file not found"
            fi
            ;;
        *)
            error "Invalid tier: $TIER. Valid options: db, cache, app, lb, all"
            ;;
    esac
    
    # Check disk space (require at least 10GB free for production)
    available_space=$(df / | awk 'NR==2 {print $4}')
    required_space=10485760  # 10GB in KB
    if [[ $available_space -lt $required_space ]]; then
        error "Insufficient disk space. Required: 10GB, Available: $(($available_space / 1024 / 1024))GB"
    fi
    
    # Check if production confirmation is needed
    if [[ "$DRY_RUN" != "true" ]]; then
        echo -e "${RED}WARNING: This will deploy to PRODUCTION environment${NC}"
        echo -e "${RED}Tier: $TIER, Version: $VERSION${NC}"
        read -p "Are you sure you want to continue? (yes/no): " -r
        if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
            log "Deployment cancelled by user"
            exit 0
        fi
    fi
    
    success "Pre-deployment checks passed"
}

# Backup current deployment
backup_current() {
    if [[ "$SKIP_BACKUP" == "true" ]]; then
        warning "Skipping backup creation (--skip-backup flag)"
        return
    fi
    
    log "Creating backup of current deployment..."
    
    mkdir -p "$BACKUP_DIR"
    
    case $TIER in
        db|all)
            backup_database
            ;;
    esac
    
    # Backup environment files
    if [[ -f "$ENV_FILE" ]]; then
        cp "$ENV_FILE" "$BACKUP_DIR/"
        success "Environment file backed up"
    fi
    
    # Create deployment metadata
    cat > "$BACKUP_DIR/deployment_info.txt" << EOF
Deployment Date: $(date)
Tier: $TIER
Version: $VERSION
Git Commit: $(git rev-parse HEAD 2>/dev/null || echo "Unknown")
Git Branch: $(git branch --show-current 2>/dev/null || echo "Unknown")
Server: $(hostname)
User: $(whoami)
Docker Version: $(docker --version)
Docker Compose Version: $(docker-compose --version)
EOF
    
    success "Backup created at: $BACKUP_DIR"
}

backup_database() {
    log "Backing up production database..."
    
    # Use external database connection for production
    local db_host=${DB_HOST:-localhost}
    local db_port=${DB_PORT:-5432}
    local db_name=${DB_NAME:-collectioncrm_production}
    local db_user=${DB_USER:-collectioncrm}
    
    if PGPASSWORD="$DB_PASSWORD" pg_dump -h "$db_host" -p "$db_port" -U "$db_user" "$db_name" > "$BACKUP_DIR/database_backup.sql"; then
        success "Database backup created"
    else
        error "Database backup failed"
    fi
}

# Deploy specific tier
deploy_tier() {
    local tier="$1"
    local compose_file="$COMPOSE_BASE_DIR/docker-compose.prod-$tier.yml"
    
    log "Deploying $tier tier..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        info "DRY RUN: Would deploy $tier tier with compose file: $compose_file"
        return
    fi
    
    cd "$PROJECT_ROOT"
    export APP_VERSION="$VERSION"
    
    # Deploy with specific strategy per tier
    case $tier in
        db)
            deploy_database_tier "$compose_file"
            ;;
        cache)
            deploy_cache_tier "$compose_file"
            ;;
        app)
            deploy_application_tier "$compose_file"
            ;;
        lb)
            deploy_loadbalancer_tier "$compose_file"
            ;;
    esac
    
    success "$tier tier deployed successfully"
}

deploy_database_tier() {
    local compose_file="$1"
    
    log "Deploying database tier with zero-downtime strategy..."
    
    # Start replica first if not running
    if ! docker-compose -f "$compose_file" ps postgres-replica | grep -q "Up"; then
        log "Starting database replica..."
        docker-compose -f "$compose_file" up -d postgres-replica
        sleep 30
    fi
    
    # Update primary database
    log "Updating primary database..."
    docker-compose -f "$compose_file" up -d postgres-primary pgbouncer postgres-backup
    
    # Wait for services to be healthy
    wait_for_health "$compose_file" "postgres-primary"
    wait_for_health "$compose_file" "pgbouncer"
}

deploy_cache_tier() {
    local compose_file="$1"
    
    log "Deploying cache tier with rolling update..."
    
    # Update Redis replica first
    log "Updating Redis replica..."
    docker-compose -f "$compose_file" up -d redis-replica
    sleep 10
    
    # Update Redis primary
    log "Updating Redis primary..."
    docker-compose -f "$compose_file" up -d redis-primary redis-sentinel
    
    # Update Kafka cluster
    log "Updating Kafka cluster..."
    docker-compose -f "$compose_file" up -d zookeeper-1 zookeeper-2 zookeeper-3
    sleep 30
    docker-compose -f "$compose_file" up -d kafka-1 kafka-2 kafka-3
    
    # Wait for services to be healthy
    wait_for_health "$compose_file" "redis-primary"
    wait_for_health "$compose_file" "kafka-1"
}

deploy_application_tier() {
    local compose_file="$1"
    
    log "Deploying application tier with rolling update..."
    
    # Deploy services one by one to ensure zero downtime
    local services=("auth-service" "bank-sync-service" "workflow-service" "campaign-engine" "payment-service" "api-gateway")
    
    for service in "${services[@]}"; do
        log "Updating $service..."
        docker-compose -f "$compose_file" up -d "$service"
        wait_for_health "$compose_file" "$service"
        sleep 10
    done
}

deploy_loadbalancer_tier() {
    local compose_file="$1"
    
    log "Deploying load balancer tier..."
    
    # Update static file server first
    docker-compose -f "$compose_file" up -d frontend-static
    
    # Update load balancer
    docker-compose -f "$compose_file" up -d nginx-lb
    
    # Update monitoring services
    docker-compose -f "$compose_file" up -d fluentd nginx-exporter health-checker
    
    # Update SSL certificates
    docker-compose -f "$compose_file" up -d certbot
    
    wait_for_health "$compose_file" "nginx-lb"
}

# Wait for service health
wait_for_health() {
    local compose_file="$1"
    local service="$2"
    local max_attempts=60
    local attempt=1
    
    log "Waiting for $service to be healthy..."
    
    while [[ $attempt -le $max_attempts ]]; do
        if docker-compose -f "$compose_file" ps "$service" | grep -q "healthy"; then
            success "$service is healthy"
            return 0
        fi
        
        if [[ $((attempt % 10)) -eq 0 ]]; then
            log "Still waiting for $service... (attempt $attempt/$max_attempts)"
        fi
        
        sleep 5
        ((attempt++))
    done
    
    error "$service did not become healthy within expected time"
}

# Run database migrations
run_migrations() {
    if [[ "$TIER" != "app" && "$TIER" != "all" ]]; then
        return
    fi
    
    log "Running database migrations..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        info "DRY RUN: Would run database migrations"
        return
    fi
    
    # Run migrations using the API gateway service
    local compose_file="$COMPOSE_BASE_DIR/docker-compose.prod-app.yml"
    
    if docker-compose -f "$compose_file" exec -T api-gateway npm run migrate:production; then
        success "Database migrations completed"
    else
        error "Database migrations failed"
    fi
}

# Comprehensive health checks
health_checks() {
    log "Running comprehensive health checks..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        info "DRY RUN: Would run health checks"
        return
    fi
    
    case $TIER in
        db|all)
            check_database_health
            ;;
        cache|all)
            check_cache_health
            ;;
        app|all)
            check_application_health
            ;;
        lb|all)
            check_loadbalancer_health
            ;;
    esac
    
    success "All health checks passed"
}

check_database_health() {
    log "Checking database health..."
    
    # Check if database is accepting connections
    if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
        success "Database is accepting connections"
    else
        error "Database connection failed"
    fi
}

check_cache_health() {
    log "Checking cache health..."
    
    # Check Redis
    if redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" -a "$REDIS_PASSWORD" ping > /dev/null 2>&1; then
        success "Redis is responding"
    else
        error "Redis connection failed"
    fi
}

check_application_health() {
    log "Checking application health..."
    
    local api_base="${API_BASE_URL:-https://collectioncrm.local/api}"
    local services=("health" "auth/status")
    
    for endpoint in "${services[@]}"; do
        if curl -f -s "$api_base/$endpoint" > /dev/null; then
            success "$endpoint endpoint is responding"
        else
            error "$endpoint endpoint is not responding"
        fi
    done
}

check_loadbalancer_health() {
    log "Checking load balancer health..."
    
    local lb_url="${LB_URL:-https://collectioncrm.local}"
    
    if curl -f -s "$lb_url/health" > /dev/null; then
        success "Load balancer is responding"
    else
        error "Load balancer is not responding"
    fi
}

# Send notifications
send_notification() {
    local status="$1"
    local message="$2"
    
    # Implement your notification system here
    # Examples: Slack, Discord, email, SMS, etc.
    
    log "Notification: $status - $message"
    
    # Example Slack notification (uncomment and configure)
    # if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
    #     curl -X POST -H 'Content-type: application/json' \
    #         --data "{\"text\":\"Production Deployment $status: $message\", \"channel\":\"#deployments\"}" \
    #         "$SLACK_WEBHOOK_URL"
    # fi
}

# Main deployment function
main() {
    parse_args "$@"
    
    log "Starting production deployment"
    log "Tier: $TIER, Version: $VERSION, Dry Run: $DRY_RUN"
    
    # Create log directory
    mkdir -p "$(dirname "$LOG_FILE")"
    
    # Load environment variables
    if [[ -f "$ENV_FILE" ]]; then
        source "$ENV_FILE"
    fi
    
    # Trap for cleanup on failure
    trap 'error "Deployment failed. Check logs and consider rollback."' ERR
    
    # Run deployment steps
    pre_checks
    backup_current
    
    # Deploy specific tier or all tiers
    if [[ "$TIER" == "all" ]]; then
        deploy_tier "db"
        deploy_tier "cache"
        deploy_tier "app"
        deploy_tier "lb"
    else
        deploy_tier "$TIER"
    fi
    
    run_migrations
    health_checks
    
    # Remove error trap on success
    trap - ERR
    
    success "Production deployment completed successfully!"
    send_notification "SUCCESS" "Production deployment completed for tier: $TIER, version: $VERSION"
    
    log "Deployment summary:"
    log "- Tier: $TIER"
    log "- Version: $VERSION"
    log "- Backup location: $BACKUP_DIR"
    log "- Log file: $LOG_FILE"
    log "- Application URL: https://collectioncrm.local"
}

# Script entry point
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi