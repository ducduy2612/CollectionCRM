#!/bin/bash

# CollectionCRM Rollback Script
# Usage: ./rollback.sh [environment] [backup_path]

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
LOG_FILE="/var/log/collectioncrm/rollback.log"

# Default values
ENVIRONMENT=""
BACKUP_PATH=""
DRY_RUN=false
FORCE=false

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
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --force)
                FORCE=true
                shift
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            staging|production)
                ENVIRONMENT="$1"
                shift
                ;;
            *)
                BACKUP_PATH="$1"
                shift
                ;;
        esac
    done
    
    if [[ -z "$ENVIRONMENT" ]]; then
        error "Environment not specified. Use 'staging' or 'production'"
    fi
}

show_help() {
    cat << EOF
CollectionCRM Rollback Script

Usage: $0 [environment] [backup_path] [options]

Arguments:
    environment     Target environment: staging or production
    backup_path     Path to backup directory (optional - will show available backups)

Options:
    --dry-run       Show what would be done without executing
    --force         Skip confirmation prompts
    --help, -h      Show this help message

Examples:
    $0 staging                                          # List available staging backups
    $0 staging /path/to/backup/20240101_120000          # Rollback staging to specific backup
    $0 production --dry-run                             # Show production rollback plan
    $0 staging /path/to/backup/20240101_120000 --force  # Force rollback without confirmation

EOF
}

# List available backups
list_backups() {
    local backup_base_dir="$PROJECT_ROOT/backups"
    local env_backup_dir="$backup_base_dir"
    
    if [[ "$ENVIRONMENT" == "production" ]]; then
        env_backup_dir="$backup_base_dir/production"
    fi
    
    log "Available backups for $ENVIRONMENT:"
    
    if [[ ! -d "$env_backup_dir" ]]; then
        warning "No backup directory found: $env_backup_dir"
        return
    fi
    
    local backups=($(find "$env_backup_dir" -maxdepth 1 -type d -name "2*" | sort -r))
    
    if [[ ${#backups[@]} -eq 0 ]]; then
        warning "No backups found in $env_backup_dir"
        return
    fi
    
    echo "Available backups:"
    for i in "${!backups[@]}"; do
        local backup_dir="${backups[$i]}"
        local backup_name=$(basename "$backup_dir")
        local backup_date=$(echo "$backup_name" | sed 's/_/ /' | sed 's/\([0-9]\{4\}\)\([0-9]\{2\}\)\([0-9]\{2\}\)/\1-\2-\3/')
        
        echo "  $((i+1)). $backup_name ($backup_date)"
        
        if [[ -f "$backup_dir/deployment_info.txt" ]]; then
            local version=$(grep "Version:" "$backup_dir/deployment_info.txt" 2>/dev/null | cut -d: -f2 | xargs || echo "Unknown")
            local git_commit=$(grep "Git Commit:" "$backup_dir/deployment_info.txt" 2>/dev/null | cut -d: -f2 | xargs | cut -c1-8 || echo "Unknown")
            echo "     Version: $version, Git: $git_commit"
        fi
        echo
    done
    
    if [[ "$DRY_RUN" != "true" && "$FORCE" != "true" ]]; then
        read -p "Select backup number (1-${#backups[@]}) or press Enter to cancel: " -r
        if [[ -n $REPLY && $REPLY =~ ^[0-9]+$ && $REPLY -ge 1 && $REPLY -le ${#backups[@]} ]]; then
            BACKUP_PATH="${backups[$((REPLY-1))]}"
        else
            log "Rollback cancelled"
            exit 0
        fi
    fi
}

# Validate backup
validate_backup() {
    local backup_dir="$1"
    
    log "Validating backup: $backup_dir"
    
    if [[ ! -d "$backup_dir" ]]; then
        error "Backup directory not found: $backup_dir"
    fi
    
    # Check for required backup files
    local required_files=("deployment_info.txt")
    local missing_files=()
    
    for file in "${required_files[@]}"; do
        if [[ ! -f "$backup_dir/$file" ]]; then
            missing_files+=("$file")
        fi
    done
    
    if [[ ${#missing_files[@]} -gt 0 ]]; then
        error "Missing backup files: ${missing_files[*]}"
    fi
    
    # Check database backup
    if [[ -f "$backup_dir/database_backup.sql" ]]; then
        local backup_size=$(stat -f%z "$backup_dir/database_backup.sql" 2>/dev/null || stat -c%s "$backup_dir/database_backup.sql" 2>/dev/null || echo "0")
        if [[ $backup_size -gt 0 ]]; then
            success "Database backup found ($(($backup_size / 1024 / 1024))MB)"
        else
            warning "Database backup file is empty"
        fi
    else
        warning "No database backup found"
    fi
    
    # Show backup information
    if [[ -f "$backup_dir/deployment_info.txt" ]]; then
        log "Backup information:"
        cat "$backup_dir/deployment_info.txt" | while read line; do
            log "  $line"
        done
    fi
    
    success "Backup validation completed"
}

# Pre-rollback checks
pre_rollback_checks() {
    log "Running pre-rollback checks..."
    
    # Check if running as appropriate user
    if [[ "$ENVIRONMENT" == "production" && $EUID -eq 0 ]]; then
        error "Do not run production rollbacks as root"
    fi
    
    # Check Docker and Docker Compose
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed or not in PATH"
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed or not in PATH"
    fi
    
    # Check if services are running
    local compose_file
    if [[ "$ENVIRONMENT" == "staging" ]]; then
        compose_file="$PROJECT_ROOT/docker/compose/docker-compose.staging.yml"
    else
        compose_file="$PROJECT_ROOT/docker/compose/docker-compose.prod-app.yml"
    fi
    
    if [[ -f "$compose_file" ]]; then
        local running_services=$(docker-compose -f "$compose_file" ps --services --filter "status=running" | wc -l)
        log "Currently running services: $running_services"
    fi
    
    # Final confirmation
    if [[ "$DRY_RUN" != "true" && "$FORCE" != "true" ]]; then
        echo -e "${RED}WARNING: This will rollback $ENVIRONMENT environment${NC}"
        echo -e "${RED}Backup: $(basename "$BACKUP_PATH")${NC}"
        read -p "Are you sure you want to continue? (yes/no): " -r
        if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
            log "Rollback cancelled by user"
            exit 0
        fi
    fi
    
    success "Pre-rollback checks passed"
}

# Stop current services
stop_services() {
    log "Stopping current services..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        info "DRY RUN: Would stop all services"
        return
    fi
    
    local compose_files=()
    
    if [[ "$ENVIRONMENT" == "staging" ]]; then
        compose_files+=("$PROJECT_ROOT/docker/compose/docker-compose.staging.yml")
    else
        compose_files+=(
            "$PROJECT_ROOT/docker/compose/docker-compose.prod-lb.yml"
            "$PROJECT_ROOT/docker/compose/docker-compose.prod-app.yml"
            "$PROJECT_ROOT/docker/compose/docker-compose.prod-cache.yml"
            "$PROJECT_ROOT/docker/compose/docker-compose.prod-db.yml"
        )
    fi
    
    for compose_file in "${compose_files[@]}"; do
        if [[ -f "$compose_file" ]]; then
            log "Stopping services from $(basename "$compose_file")"
            docker-compose -f "$compose_file" down --remove-orphans || warning "Failed to stop some services"
        fi
    done
    
    success "Services stopped"
}

# Restore database
restore_database() {
    local backup_dir="$1"
    local db_backup_file="$backup_dir/database_backup.sql"
    
    if [[ ! -f "$db_backup_file" ]]; then
        warning "No database backup to restore"
        return
    fi
    
    log "Restoring database from backup..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        info "DRY RUN: Would restore database from $db_backup_file"
        return
    fi
    
    # Start database service
    local db_compose_file
    if [[ "$ENVIRONMENT" == "staging" ]]; then
        db_compose_file="$PROJECT_ROOT/docker/compose/docker-compose.staging.yml"
        docker-compose -f "$db_compose_file" up -d postgres
        sleep 30
        
        # Restore database
        if docker-compose -f "$db_compose_file" exec -T postgres psql -U collectioncrm -d collectioncrm_staging < "$db_backup_file"; then
            success "Database restored successfully"
        else
            error "Database restoration failed"
        fi
    else
        # For production, use external database connection
        local db_host=${DB_HOST:-localhost}
        local db_port=${DB_PORT:-5432}
        local db_name=${DB_NAME:-collectioncrm_production}
        local db_user=${DB_USER:-collectioncrm}
        
        if PGPASSWORD="$DB_PASSWORD" psql -h "$db_host" -p "$db_port" -U "$db_user" -d "$db_name" < "$db_backup_file"; then
            success "Database restored successfully"
        else
            error "Database restoration failed"
        fi
    fi
}

# Restore configuration files
restore_configuration() {
    local backup_dir="$1"
    
    log "Restoring configuration files..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        info "DRY RUN: Would restore configuration files"
        return
    fi
    
    # Restore environment file
    local env_file_name
    if [[ "$ENVIRONMENT" == "staging" ]]; then
        env_file_name=".env.staging"
    else
        env_file_name=".env.production"
    fi
    
    if [[ -f "$backup_dir/$env_file_name" ]]; then
        cp "$backup_dir/$env_file_name" "$PROJECT_ROOT/$env_file_name"
        success "Environment file restored"
    else
        warning "No environment file backup found"
    fi
    
    # Restore docker-compose files if backed up
    local compose_files=(
        "docker-compose.staging.yml"
        "docker-compose.prod-db.yml"
        "docker-compose.prod-cache.yml"
        "docker-compose.prod-app.yml"
        "docker-compose.prod-lb.yml"
    )
    
    for compose_file in "${compose_files[@]}"; do
        if [[ -f "$backup_dir/$compose_file" ]]; then
            cp "$backup_dir/$compose_file" "$PROJECT_ROOT/docker/compose/$compose_file"
            log "Restored $compose_file"
        fi
    done
    
    success "Configuration files restored"
}

# Start services
start_services() {
    log "Starting services with restored configuration..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        info "DRY RUN: Would start all services"
        return
    fi
    
    local compose_files=()
    
    if [[ "$ENVIRONMENT" == "staging" ]]; then
        compose_files+=("$PROJECT_ROOT/docker/compose/docker-compose.staging.yml")
    else
        # Start production services in order
        compose_files+=(
            "$PROJECT_ROOT/docker/compose/docker-compose.prod-db.yml"
            "$PROJECT_ROOT/docker/compose/docker-compose.prod-cache.yml"
            "$PROJECT_ROOT/docker/compose/docker-compose.prod-app.yml"
            "$PROJECT_ROOT/docker/compose/docker-compose.prod-lb.yml"
        )
    fi
    
    for compose_file in "${compose_files[@]}"; do
        if [[ -f "$compose_file" ]]; then
            log "Starting services from $(basename "$compose_file")"
            docker-compose -f "$compose_file" up -d
            sleep 10
        fi
    done
    
    success "Services started"
}

# Verify rollback
verify_rollback() {
    log "Verifying rollback..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        info "DRY RUN: Would verify rollback"
        return
    fi
    
    # Wait for services to be ready
    sleep 30
    
    # Check service health
    local api_base
    if [[ "$ENVIRONMENT" == "staging" ]]; then
        api_base="https://staging.collectioncrm.local/api"
    else
        api_base="https://collectioncrm.local/api"
    fi
    
    local max_attempts=10
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        if curl -f -s "$api_base/health" > /dev/null; then
            success "Service health check passed"
            break
        fi
        
        log "Waiting for services to be ready... (attempt $attempt/$max_attempts)"
        sleep 30
        ((attempt++))
    done
    
    if [[ $attempt -gt $max_attempts ]]; then
        error "Services did not become healthy after rollback"
    fi
    
    success "Rollback verification completed"
}

# Send notification
send_notification() {
    local status="$1"
    local message="$2"
    
    log "Notification: $status - $message"
    
    # Example Slack notification (uncomment and configure)
    # if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
    #     curl -X POST -H 'Content-type: application/json' \
    #         --data "{\"text\":\"Rollback $status: $message\", \"channel\":\"#deployments\"}" \
    #         "$SLACK_WEBHOOK_URL"
    # fi
}

# Main rollback function
main() {
    parse_args "$@"
    
    log "Starting rollback for $ENVIRONMENT environment"
    
    # Create log directory
    mkdir -p "$(dirname "$LOG_FILE")"
    
    if [[ -z "$BACKUP_PATH" ]]; then
        list_backups
        if [[ -z "$BACKUP_PATH" ]]; then
            exit 0
        fi
    fi
    
    # Load environment variables
    local env_file="$PROJECT_ROOT/.env.$ENVIRONMENT"
    if [[ -f "$env_file" ]]; then
        source "$env_file"
    fi
    
    validate_backup "$BACKUP_PATH"
    pre_rollback_checks
    
    # Trap for cleanup on failure
    trap 'error "Rollback failed. Manual intervention may be required."' ERR
    
    stop_services
    restore_database "$BACKUP_PATH"
    restore_configuration "$BACKUP_PATH"
    start_services
    verify_rollback
    
    # Remove error trap on success
    trap - ERR
    
    success "Rollback completed successfully!"
    send_notification "SUCCESS" "Rollback completed for $ENVIRONMENT to backup $(basename "$BACKUP_PATH")"
    
    log "Rollback summary:"
    log "- Environment: $ENVIRONMENT"
    log "- Backup used: $BACKUP_PATH"
    log "- Log file: $LOG_FILE"
}

# Script entry point
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi