#!/bin/bash

# CollectionCRM VirtualBox Setup Script
# Generates configuration and sets up directories without Docker external networks

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_DIR="$(dirname "$SCRIPT_DIR")"
CONFIG_FILE="${BASE_DIR}/deployment.conf"

# Functions
log() {
    echo -e "${2:-$NC}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
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

generate_passwords() {
    info "Generating secure passwords..."
    
    # Function to generate secure password
    gen_pass() {
        openssl rand -base64 32 | tr -d "=+/" | cut -c1-25
    }
    
    # Generate JWT secret (longer)
    gen_jwt() {
        openssl rand -base64 64 | tr -d "=+/" | cut -c1-50
    }
    
    # Generate passwords first
    local postgres_pass=$(gen_pass)
    local redis_pass=$(gen_pass)
    local minio_pass=$(gen_pass)
    local jwt_secret=$(gen_jwt)
    
    # Create configuration file
    cat > "$CONFIG_FILE" << EOF
# CollectionCRM VirtualBox Configuration
# Generated on $(date)

# Database Configuration
POSTGRES_USER="collectioncrm"
POSTGRES_PASSWORD="$postgres_pass"
POSTGRES_DB="collectioncrm"
DB_USERNAME="collectioncrm"
DB_PASSWORD="$postgres_pass"
DB_DATABASE="collectioncrm"

# Redis Configuration
REDIS_PASSWORD="$redis_pass"

# MinIO Configuration
MINIO_ROOT_USER="minioadmin"
MINIO_ROOT_PASSWORD="$minio_pass"

# JWT Secret
JWT_SECRET="$jwt_secret"

# Version
VERSION="latest"

# Timezone
TZ="Asia/Ho_Chi_Minh"

# VirtualBox specific
VBOX_MODE="true"
EOF
    
    chmod 600 "$CONFIG_FILE"
    success "Configuration file created: $CONFIG_FILE"
}

create_directories() {
    info "Creating required directories..."
    
    # Base directories
    mkdir -p /var/lib/collectioncrm/{postgres-data,redis-data,kafka-data,zookeeper-data,zookeeper-logs,minio-data}
    mkdir -p "$BASE_DIR"/{backups,env,logs}
    
    # Set permissions
    chmod 755 /var/lib/collectioncrm
    chown -R $USER:$USER /var/lib/collectioncrm 2>/dev/null || true
    
    success "Directories created"
}

create_env_file() {
    local server_type="$1"
    local env_file="$BASE_DIR/.env"
    
    info "Creating environment file for $server_type..."
    
    # Load configuration variables
    if [ ! -f "$CONFIG_FILE" ]; then
        error "Configuration file not found: $CONFIG_FILE"
    fi
    
    source "$CONFIG_FILE"
    
    # Common environment variables
    cat > "$env_file" << EOF
# CollectionCRM VirtualBox Environment Configuration
# Server: $server_type
# Generated: $(date)

# Database
POSTGRES_USER=$POSTGRES_USER
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
POSTGRES_DB=$POSTGRES_DB
DB_USERNAME=$DB_USERNAME
DB_PASSWORD=$DB_PASSWORD
DB_DATABASE=$DB_DATABASE

# Redis
REDIS_PASSWORD=$REDIS_PASSWORD

# MinIO
MINIO_ROOT_USER=$MINIO_ROOT_USER
MINIO_ROOT_PASSWORD=$MINIO_ROOT_PASSWORD

# JWT
JWT_SECRET=$JWT_SECRET

# Version
VERSION=$VERSION

# Timezone
TZ=$TZ
EOF
    
    chmod 600 "$env_file"
    success "Environment file created"
}

create_service_env_files() {
    local server_type="$1"
    
    info "Creating service-specific environment files for $server_type..."
    
    # Load configuration variables
    if [ ! -f "$CONFIG_FILE" ]; then
        error "Configuration file not found: $CONFIG_FILE"
    fi
    
    source "$CONFIG_FILE"
    
    # Create env directory
    mkdir -p "$BASE_DIR/env"
    
    case "$server_type" in
        server3)
            # API Gateway env file
            cat > "$BASE_DIR/env/api-gateway.env" << EOF
# API Gateway Configuration - VirtualBox Environment
PORT=3000
NODE_ENV=production
LOG_LEVEL=info

# Redis Configuration (VirtualBox VM IP)
REDIS_HOST=192.168.100.20
REDIS_PORT=6379
REDIS_PASSWORD=$REDIS_PASSWORD

# Rate Limiting
RATE_LIMIT_MAX_REQUESTS=5000
RATE_LIMIT_WINDOW_MS=900000

# Service URLs (internal Docker network)
AUTH_SERVICE_URL=http://auth-service:3001
BANK_SERVICE_URL=http://bank-sync-service:3002
WORKFLOW_SERVICE_URL=http://workflow-service:3003
CAMPAIGN_SERVICE_URL=http://campaign-engine:3004
PAYMENT_SERVICE_URL=http://payment-service:3005

# Service Timeouts (ms)
AUTH_SERVICE_TIMEOUT=30000
BANK_SERVICE_TIMEOUT=45000
PAYMENT_SERVICE_TIMEOUT=30000
WORKFLOW_SERVICE_TIMEOUT=45000

# CORS Configuration - VirtualBox testing
ALLOWED_ORIGINS=http://localhost,http://192.168.100.30,http://localhost:8080

# Security
TRUST_PROXY=true

# License Configuration (demo/testing)
LICENSE_KEY=demo-license-for-testing
EOF

            # Auth Service env file
            cat > "$BASE_DIR/env/auth-service.env" << EOF
# Auth Service Configuration - VirtualBox Environment
PORT=3001
NODE_ENV=production

# Database configuration (VirtualBox VM IP)
DB_HOST=192.168.100.10
DB_PORT=6432
DB_DATABASE=$POSTGRES_DB
DB_USERNAME=$POSTGRES_USER
DB_PASSWORD=$POSTGRES_PASSWORD
DB_SSL=false
DB_SSL_REJECT_UNAUTHORIZED=false
DB_POOL_MIN=5
DB_POOL_MAX=25
DB_POOL_IDLE_TIMEOUT=30000
DB_POOL_ACQUIRE_TIMEOUT=60000

# Redis configuration (VirtualBox VM IP)
REDIS_HOST=192.168.100.20
REDIS_PORT=6379
REDIS_PASSWORD=$REDIS_PASSWORD

# Auth configuration
JWT_SECRET=$JWT_SECRET
JWT_EXPIRATION=24h
SESSION_TTL=604800

# Kafka configuration (VirtualBox VM IP)
KAFKA_BROKERS=192.168.100.20:19092
KAFKA_CLIENT_ID=auth-service-vbox
KAFKA_RETRY_ATTEMPTS=5
KAFKA_RETRY_INITIAL_TIME=3000
KAFKA_GROUP_ID=auth-service-vbox

# Logging configuration
LOG_LEVEL=info
LOG_FORMAT=json
LOG_TIMESTAMP=true
EOF

            # Bank Sync Service env file
            cat > "$BASE_DIR/env/bank-sync-service.env" << EOF
# Bank Sync Service Configuration - VirtualBox Environment
PORT=3002
NODE_ENV=production

# Database configuration
DB_HOST=192.168.100.10
DB_PORT=6432
DB_DATABASE=$POSTGRES_DB
DB_USERNAME=$POSTGRES_USER
DB_PASSWORD=$POSTGRES_PASSWORD
DB_SSL=false

# Redis configuration
REDIS_HOST=192.168.100.20
REDIS_PORT=6379
REDIS_PASSWORD=$REDIS_PASSWORD

# Kafka configuration
KAFKA_BROKERS=192.168.100.20:19092
KAFKA_CLIENT_ID=bank-sync-service-vbox
KAFKA_GROUP_ID=bank-sync-service-vbox

# Logging
LOG_LEVEL=info
EOF

            # Workflow Service env file
            cat > "$BASE_DIR/env/workflow-service.env" << EOF
# Workflow Service Configuration - VirtualBox Environment
PORT=3003
NODE_ENV=production

# Database configuration
DB_HOST=192.168.100.10
DB_PORT=6432
DB_DATABASE=$POSTGRES_DB
DB_USERNAME=$POSTGRES_USER
DB_PASSWORD=$POSTGRES_PASSWORD
DB_SSL=false

# Redis configuration
REDIS_HOST=192.168.100.20
REDIS_PORT=6379
REDIS_PASSWORD=$REDIS_PASSWORD

# Kafka configuration
KAFKA_BROKERS=192.168.100.20:19092
KAFKA_CLIENT_ID=workflow-service-vbox
KAFKA_GROUP_ID=workflow-service-vbox

# MinIO configuration (local container)
MINIO_ENDPOINT=http://minio:9000
MINIO_ACCESS_KEY=$MINIO_ROOT_USER
MINIO_SECRET_KEY=$MINIO_ROOT_PASSWORD
MINIO_BUCKET=workflow-attachments

# Logging
LOG_LEVEL=info
EOF

            # Campaign Engine env file
            cat > "$BASE_DIR/env/campaign-engine.env" << EOF
# Campaign Engine Configuration - VirtualBox Environment
PORT=3004
NODE_ENV=production

# Database configuration
DB_HOST=192.168.100.10
DB_PORT=6432
DB_DATABASE=$POSTGRES_DB
DB_USERNAME=$POSTGRES_USER
DB_PASSWORD=$POSTGRES_PASSWORD
DB_SSL=false

# Redis configuration
REDIS_HOST=192.168.100.20
REDIS_PORT=6379
REDIS_PASSWORD=$REDIS_PASSWORD

# Kafka configuration
KAFKA_BROKERS=192.168.100.20:19092
KAFKA_CLIENT_ID=campaign-engine-vbox
KAFKA_GROUP_ID=campaign-engine-vbox

# Logging
LOG_LEVEL=info
EOF

            # Payment Service env file
            cat > "$BASE_DIR/env/payment-service.env" << EOF
# Payment Service Configuration - VirtualBox Environment
PORT=3005
NODE_ENV=production

# Database configuration
DB_HOST=192.168.100.10
DB_PORT=6432
DB_DATABASE=$POSTGRES_DB
DB_USERNAME=$POSTGRES_USER
DB_PASSWORD=$POSTGRES_PASSWORD
DB_SSL=false

# Redis configuration
REDIS_HOST=192.168.100.20
REDIS_PORT=6379
REDIS_PASSWORD=$REDIS_PASSWORD

# Kafka configuration
KAFKA_BROKERS=192.168.100.20:19092
KAFKA_CLIENT_ID=payment-service-vbox
KAFKA_GROUP_ID=payment-service-vbox

# Logging
LOG_LEVEL=info
EOF

            chmod 600 "$BASE_DIR/env"/*.env
            success "Service environment files created for $server_type"
            ;;
        *)
            info "No service environment files needed for $server_type"
            ;;
    esac
}

load_images() {
    local server_type="$1"
    
    if [ -f "$SCRIPT_DIR/load-images.sh" ]; then
        info "Loading Docker images..."
        "$SCRIPT_DIR/load-images.sh" "$server_type" || warning "Image loading failed or skipped"
    else
        info "No image loader found, will pull from registry"
    fi
}

deploy_vbox_server() {
    local server_type="$1"
    local compose_file=""
    
    case "$server_type" in
        server1)
            compose_file="docker-compose.vbox-server1-database.yml"
            info "Deploying VirtualBox Database Server..."
            ;;
        server2)
            compose_file="docker-compose.vbox-server2-cache.yml"
            info "Deploying VirtualBox Cache/Message Server..."
            ;;
        server3)
            compose_file="docker-compose.vbox-server3-application.yml"
            info "Deploying VirtualBox Application Server..."
            ;;
        *)
            error "Unknown server type: $server_type"
            ;;
    esac
    
    # Load Docker images if available
    load_images "$server_type"
    
    # Create environment file
    create_env_file "$server_type"
    
    # Create service-specific environment files
    create_service_env_files "$server_type"
    
    # Start services
    cd "$BASE_DIR"
    info "Starting services with $compose_file..."
    
    if command -v docker-compose &> /dev/null; then
        docker-compose -f "$compose_file" up -d
    else
        docker compose -f "$compose_file" up -d
    fi
    
    success "$server_type deployment completed"
}

main() {
    clear
    echo "======================================"
    echo "CollectionCRM VirtualBox Setup"
    echo "======================================"
    echo ""
    
    # Check if running as root
    if [[ $EUID -ne 0 ]]; then
        warning "Running without root privileges - may need sudo for some operations"
    fi
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed"
    fi
    
    local server_type="${1:-config-only}"
    
    if [ "$server_type" == "help" ] || [ "$server_type" == "--help" ]; then
        echo "Usage: $0 [server_type]"
        echo ""
        echo "Server types:"
        echo "  config-only - Generate configuration only (default)"
        echo "  server1     - Deploy database server"
        echo "  server2     - Deploy cache/message server"
        echo "  server3     - Deploy application server"
        echo ""
        exit 0
    fi
    
    # Create required directories
    create_directories
    
    # Generate configuration if it doesn't exist
    if [ ! -f "$CONFIG_FILE" ]; then
        generate_passwords
    else
        info "Using existing configuration: $CONFIG_FILE"
    fi
    
    # Deploy server if specified
    if [ "$server_type" != "config-only" ]; then
        deploy_vbox_server "$server_type"
        
        # Wait for services to start
        sleep 10
        
        # Basic verification
        info "Checking container status..."
        docker ps --format "table {{.Names}}\t{{.Status}}" | grep collectioncrm || true
    fi
    
    echo ""
    success "======================================"
    success "VirtualBox setup completed!"
    success "======================================"
    echo ""
    
    if [ "$server_type" == "config-only" ]; then
        info "Configuration generated. Copy to other VMs:"
        info "  scp $CONFIG_FILE user@other-vm:/opt/collectioncrm/"
        echo ""
        info "Then run on each VM:"
        info "  sudo ./scripts/vbox-setup.sh server1  # Database VM"
        info "  sudo ./scripts/vbox-setup.sh server2  # Cache VM"
        info "  sudo ./scripts/vbox-setup.sh server3  # Application VM"
    elif [ "$server_type" == "server3" ]; then
        info "Application server deployed!"
        info "Access CollectionCRM at: http://192.168.100.30"
    fi
    
    echo ""
    warning "IMPORTANT: Save the configuration file!"
    warning "Location: $CONFIG_FILE"
    echo ""
}

# Run main function
main "$@"