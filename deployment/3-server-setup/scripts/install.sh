#!/bin/bash

# CollectionCRM 3-Server Installation Script
# Main orchestrator for deploying CollectionCRM across 3 servers

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
LOG_FILE="${BASE_DIR}/installation.log"

# Default values
DEFAULT_NETWORK_SUBNET="172.20.0.0/16"
DEFAULT_DB_SERVER="server1"
DEFAULT_CACHE_SERVER="server2"
DEFAULT_APP_SERVER="server3"

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

check_requirements() {
    info "Checking system requirements..."
    
    # Check if running as root
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root or with sudo"
    fi
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed. Please install Docker first."
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        error "Docker Compose is not installed. Please install Docker Compose first."
    fi
    
    # Check disk space (minimum 20GB free)
    available_space=$(df -BG "$BASE_DIR" | awk 'NR==2 {print $4}' | sed 's/G//')
    if [ "$available_space" -lt 20 ]; then
        error "Insufficient disk space. At least 20GB free space required."
    fi
    
    success "All requirements met"
}

load_configuration() {
    info "Loading configuration..."
    
    if [ -f "$CONFIG_FILE" ]; then
        source "$CONFIG_FILE"
        success "Configuration loaded from $CONFIG_FILE"
    else
        warning "No configuration file found. Using defaults."
        create_default_config
    fi
}

create_default_config() {
    info "Creating configuration file - you will need to provide server IP addresses"
    
    # Get current server IP
    CURRENT_IP=$(hostname -I | awk '{print $1}')
    
    # Prompt for server IPs
    echo ""
    info "Please provide the IP addresses for your 3 servers:"
    
    read -p "Server 1 (Database) IP address: " DB_SERVER_IP
    read -p "Server 2 (Cache/Message) IP address: " CACHE_SERVER_IP  
    read -p "Server 3 (Application) IP address: " APP_SERVER_IP
    
    echo ""
    info "Configure external access for the web application:"
    read -p "External IP/Domain for web access (e.g., 47.130.144.236 or app.example.com): " EXTERNAL_ACCESS_HOST
    read -p "External port for web access (default: 8089): " EXTERNAL_ACCESS_PORT
    EXTERNAL_ACCESS_PORT=${EXTERNAL_ACCESS_PORT:-8089}
    
    # Validate IPs
    validate_ip() {
        local ip=$1
        if [[ $ip =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]]; then
            return 0
        else
            return 1
        fi
    }
    
    if ! validate_ip "$DB_SERVER_IP" || ! validate_ip "$CACHE_SERVER_IP" || ! validate_ip "$APP_SERVER_IP"; then
        error "Invalid IP address format. Please provide valid IPv4 addresses."
    fi
    
    cat > "$CONFIG_FILE" << EOF
# CollectionCRM Deployment Configuration
# Generated on $(date)

# Network Configuration
NETWORK_SUBNET="${DEFAULT_NETWORK_SUBNET}"
NETWORK_NAME="collectioncrm-network"

# Server Roles
DB_SERVER="${DEFAULT_DB_SERVER}"
CACHE_SERVER="${DEFAULT_CACHE_SERVER}"
APP_SERVER="${DEFAULT_APP_SERVER}"

# Server IP Addresses (REQUIRED for 3-server setup)
DB_SERVER_IP="$DB_SERVER_IP"
CACHE_SERVER_IP="$CACHE_SERVER_IP"
APP_SERVER_IP="$APP_SERVER_IP"

# External Access Configuration
EXTERNAL_ACCESS_HOST="$EXTERNAL_ACCESS_HOST"
EXTERNAL_ACCESS_PORT="$EXTERNAL_ACCESS_PORT"

# Installation Mode
# Options: local (current server), server1, server2, server3, all
INSTALL_MODE="local"

# Database Configuration
POSTGRES_USER="collectioncrm"
POSTGRES_DB="collectioncrm"
# POSTGRES_PASSWORD will be generated if not set

# Redis Configuration
# REDIS_PASSWORD will be generated if not set

# MinIO Configuration
MINIO_ROOT_USER="minioadmin"
# MINIO_ROOT_PASSWORD will be generated if not set

# JWT Secret
# JWT_SECRET will be generated if not set

# Version
VERSION="latest"

# Timezone
TZ="Asia/Ho_Chi_Minh"
EOF
    
    info "Created configuration file at $CONFIG_FILE"
    info "Server IPs configured:"
    info "  Database Server (Server 1): $DB_SERVER_IP"
    info "  Cache Server (Server 2): $CACHE_SERVER_IP" 
    info "  Application Server (Server 3): $APP_SERVER_IP"
}

generate_passwords() {
    info "Generating secure passwords..."
    
    # Function to generate secure password
    gen_pass() {
        openssl rand -base64 32 | tr -d "=+/" | cut -c1-25
    }
    
    # Generate passwords if not set
    if [ -z "$POSTGRES_PASSWORD" ]; then
        POSTGRES_PASSWORD=$(gen_pass)
        echo "POSTGRES_PASSWORD=\"$POSTGRES_PASSWORD\"" >> "$CONFIG_FILE"
        info "Generated PostgreSQL password"
    fi
    
    if [ -z "$REDIS_PASSWORD" ]; then
        REDIS_PASSWORD=$(gen_pass)
        echo "REDIS_PASSWORD=\"$REDIS_PASSWORD\"" >> "$CONFIG_FILE"
        info "Generated Redis password"
    fi
    
    if [ -z "$MINIO_ROOT_PASSWORD" ]; then
        MINIO_ROOT_PASSWORD=$(gen_pass)
        echo "MINIO_ROOT_PASSWORD=\"$MINIO_ROOT_PASSWORD\"" >> "$CONFIG_FILE"
        info "Generated MinIO password"
    fi
    
    if [ -z "$JWT_SECRET" ]; then
        JWT_SECRET=$(gen_pass)$(gen_pass)  # 50 characters
        echo "JWT_SECRET=\"$JWT_SECRET\"" >> "$CONFIG_FILE"
        info "Generated JWT secret"
    fi
    
    success "All passwords generated and saved to configuration"
}

select_installation_mode() {
    if [ -z "$1" ]; then
        echo ""
        info "Select installation mode:"
        echo "  1) Local - Install component for current server"
        echo "  2) Server 1 - Database server components"
        echo "  3) Server 2 - Cache/Message server components"
        echo "  4) Server 3 - Application server components"
        echo "  5) All - Install all components (single server mode)"
        echo ""
        read -p "Enter your choice (1-5): " choice
        
        case $choice in
            1) INSTALL_MODE="local" ;;
            2) INSTALL_MODE="server1" ;;
            3) INSTALL_MODE="server2" ;;
            4) INSTALL_MODE="server3" ;;
            5) INSTALL_MODE="all" ;;
            *) error "Invalid choice" ;;
        esac
    else
        INSTALL_MODE="$1"
    fi
    
    info "Installation mode: $INSTALL_MODE"
}

detect_server_role() {
    # Try to detect server role based on hostname or IP
    HOSTNAME=$(hostname)
    IP_ADDR=$(hostname -I | awk '{print $1}')
    
    case "$HOSTNAME" in
        *db*|*database*|*server1*) 
            info "Detected database server based on hostname"
            INSTALL_MODE="server1"
            ;;
        *cache*|*redis*|*kafka*|*server2*) 
            info "Detected cache server based on hostname"
            INSTALL_MODE="server2"
            ;;
        *app*|*web*|*server3*) 
            info "Detected application server based on hostname"
            INSTALL_MODE="server3"
            ;;
        *)
            warning "Could not detect server role from hostname"
            ;;
    esac
}

create_directories() {
    info "Creating required directories..."
    
    # Base directories
    mkdir -p /var/lib/collectioncrm/{postgres-data,redis-data,kafka-data,zookeeper-data,zookeeper-logs,minio-data}
    mkdir -p "$BASE_DIR"/{backups,env,logs}
    
    # Set permissions
    chmod 755 /var/lib/collectioncrm
    
    success "Directories created"
}

install_server() {
    local server_type="$1"
    local compose_file=""
    
    case "$server_type" in
        server1)
            compose_file="docker-compose.server1-database.yml"
            info "Installing Database Server components..."
            ;;
        server2)
            compose_file="docker-compose.server2-cache.yml"
            info "Installing Cache/Message Server components..."
            ;;
        server3)
            compose_file="docker-compose.server3-application.yml"
            info "Installing Application Server components..."
            ;;
        all)
            info "Installing all components on single server..."
            install_server "server1"
            install_server "server2"
            install_server "server3"
            return
            ;;
        *)
            error "Unknown server type: $server_type"
            ;;
    esac
    
    # Export server IPs for setup-network.sh
    export DB_SERVER_IP="$DB_SERVER_IP"
    export CACHE_SERVER_IP="$CACHE_SERVER_IP" 
    export APP_SERVER_IP="$APP_SERVER_IP"
    export SERVER1_IP="$DB_SERVER_IP"
    export SERVER2_IP="$CACHE_SERVER_IP"
    export SERVER3_IP="$APP_SERVER_IP"
    
    # Setup network first
    "$SCRIPT_DIR/setup-network.sh"
    
    # Load Docker images if available
    load_images "$server_type"
    
    # Create environment file
    create_env_file "$server_type"
    
    # Create service-specific environment files
    create_service_env_files "$server_type"
    
    # Export server IPs for Docker Compose
    export SERVER1_IP="$DB_SERVER_IP"
    export SERVER2_IP="$CACHE_SERVER_IP"
    export SERVER3_IP="$APP_SERVER_IP"
    
    info "Starting services with server IPs:"
    info "  SERVER1_IP=$SERVER1_IP"
    info "  SERVER2_IP=$SERVER2_IP"
    info "  SERVER3_IP=$SERVER3_IP"
    
    # Start services
    cd "$BASE_DIR"
    if command -v docker-compose &> /dev/null; then
        docker-compose -f "$compose_file" up -d
    else
        docker compose -f "$compose_file" up -d
    fi
    
    success "$server_type installation completed"
}

create_env_file() {
    local server_type="$1"
    local env_file="$BASE_DIR/.env"
    
    info "Creating environment file for $server_type..."
    
    # Common environment variables
    cat > "$env_file" << EOF
# CollectionCRM Environment Configuration
# Server: $server_type
# Generated: $(date)

# Database
POSTGRES_USER=$POSTGRES_USER
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
POSTGRES_DB=$POSTGRES_DB
DB_USERNAME=$POSTGRES_USER
DB_PASSWORD=$POSTGRES_PASSWORD
DB_DATABASE=$POSTGRES_DB

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

# Export server IPs for Docker Compose
SERVER1_IP=$DB_SERVER_IP
SERVER2_IP=$CACHE_SERVER_IP  
SERVER3_IP=$APP_SERVER_IP
EOF
    
    # Server-specific additions
    case "$server_type" in
        server1)
            echo "" >> "$env_file"
            echo "# Database Server Specific" >> "$env_file"
            echo "PGBOUNCER_MAX_CLIENT_CONN=5000" >> "$env_file"
            echo "PGBOUNCER_DEFAULT_POOL_SIZE=50" >> "$env_file"
            ;;
        server2)
            echo "" >> "$env_file"
            echo "# Cache Server Specific" >> "$env_file"
            echo "REDIS_MAXMEMORY=3gb" >> "$env_file"
            echo "KAFKA_BROKER_ID=1" >> "$env_file"
            ;;
        server3)
            echo "" >> "$env_file"
            echo "# Application Server Specific" >> "$env_file"
            echo "NODE_ENV=production" >> "$env_file"
            echo "VITE_API_BASE_URL=/api" >> "$env_file"
            ;;
    esac
    
    chmod 600 "$env_file"
    success "Environment file created"
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
    
    # Validate server IPs are configured
    if [ -z "$DB_SERVER_IP" ] || [ -z "$CACHE_SERVER_IP" ] || [ -z "$APP_SERVER_IP" ]; then
        error "Server IP addresses not configured in $CONFIG_FILE. Please run configuration setup first."
    fi
    
    info "Using server IPs:"
    info "  Database Server: $DB_SERVER_IP"
    info "  Cache Server: $CACHE_SERVER_IP"
    info "  Application Server: $APP_SERVER_IP"
    
    case "$server_type" in
        server3)
            # API Gateway env file
            cat > "$BASE_DIR/env/api-gateway.env" << EOF
# API Gateway Configuration - Production Environment
PORT=3000
NODE_ENV=production
LOG_LEVEL=info

# Redis Configuration (Docker network IP)
REDIS_HOST=$CACHE_SERVER_IP
REDIS_PORT=6379
REDIS_PASSWORD=$REDIS_PASSWORD

# Rate Limiting
RATE_LIMIT_MAX_REQUESTS=10000
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

# CORS Configuration
ALLOWED_ORIGINS=http://localhost,https://${APP_DOMAIN:-app.collectioncrm.com},http://$EXTERNAL_ACCESS_HOST:$EXTERNAL_ACCESS_PORT

# Security
TRUST_PROXY=true

# License Configuration
LICENSE_KEY=${LICENSE_KEY:-demo-license}
EOF

            # Auth Service env file
            cat > "$BASE_DIR/env/auth-service.env" << EOF
# Auth Service Configuration - Production Environment
PORT=3001
NODE_ENV=production

# Database configuration (Docker network IP)
DB_HOST=$DB_SERVER_IP
DB_PORT=6432
DB_DATABASE=$POSTGRES_DB
DB_USERNAME=$POSTGRES_USER
DB_PASSWORD=$POSTGRES_PASSWORD
DB_SSL=false
DB_SSL_REJECT_UNAUTHORIZED=false
DB_POOL_MIN=10
DB_POOL_MAX=50
DB_POOL_IDLE_TIMEOUT=30000
DB_POOL_ACQUIRE_TIMEOUT=60000

# Redis configuration (Docker network IP)
REDIS_HOST=$CACHE_SERVER_IP
REDIS_PORT=6379
REDIS_PASSWORD=$REDIS_PASSWORD

# Auth configuration
JWT_SECRET=$JWT_SECRET
JWT_EXPIRATION=24h
SESSION_TTL=604800

# Kafka configuration (Docker network IP)
KAFKA_BROKERS=$CACHE_SERVER_IP:9092
KAFKA_CLIENT_ID=auth-service-prod
KAFKA_RETRY_ATTEMPTS=5
KAFKA_RETRY_INITIAL_TIME=3000
KAFKA_GROUP_ID=auth-service-prod

# Logging configuration
LOG_LEVEL=info
LOG_FORMAT=json
LOG_TIMESTAMP=true
EOF

            # Bank Sync Service env file
            cat > "$BASE_DIR/env/bank-sync-service.env" << EOF
# Bank Sync Service Configuration - Production Environment
PORT=3002
NODE_ENV=production

# Database configuration
DB_HOST=$DB_SERVER_IP
DB_PORT=6432
DB_DATABASE=$POSTGRES_DB
DB_USERNAME=$POSTGRES_USER
DB_PASSWORD=$POSTGRES_PASSWORD
DB_SSL=false

# Redis configuration
REDIS_HOST=$CACHE_SERVER_IP
REDIS_PORT=6379
REDIS_PASSWORD=$REDIS_PASSWORD

# Kafka configuration
KAFKA_BROKERS=$CACHE_SERVER_IP:9092
KAFKA_CLIENT_ID=bank-sync-service-prod
KAFKA_GROUP_ID=bank-sync-service-prod

# Logging
LOG_LEVEL=info
EOF

            # Workflow Service env file
            cat > "$BASE_DIR/env/workflow-service.env" << EOF
# Workflow Service Configuration - Production Environment
PORT=3003
NODE_ENV=production

# Database configuration
DB_HOST=$DB_SERVER_IP
DB_PORT=6432
DB_DATABASE=$POSTGRES_DB
DB_USERNAME=$POSTGRES_USER
DB_PASSWORD=$POSTGRES_PASSWORD
DB_SSL=false
DB_SSL_REJECT_UNAUTHORIZED=false
DB_POOL_MIN=25
DB_POOL_MAX=200
DB_POOL_IDLE_TIMEOUT=30000
DB_POOL_ACQUIRE_TIMEOUT=60000
DB_POOL_CREATE_TIMEOUT=30000
DB_POOL_DESTROY_TIMEOUT=5000
DB_POOL_REAP_INTERVAL=1000
DB_POOL_CREATE_RETRY_INTERVAL=100
DB_STATEMENT_TIMEOUT=120000

# API configuration
API_PREFIX=/api/v1/workflow
API_VERSION=v1

# Logging configuration
LOG_LEVEL=info
LOG_FORMAT=json
LOG_TIMESTAMP=true

# Kafka configuration
KAFKA_BROKERS=$CACHE_SERVER_IP:9092
KAFKA_CLIENT_ID=workflow-service-prod
KAFKA_GROUP_ID=workflow-service-prod
KAFKA_RETRY_ATTEMPTS=5
KAFKA_RETRY_INITIAL_TIME=3000
KAFKA_AUTO_COMMIT_INTERVAL=5000

# MinIO Configuration
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=$MINIO_ROOT_USER
MINIO_SECRET_KEY=$MINIO_ROOT_PASSWORD
MINIO_REGION=us-east-1

# Document Storage
DOCUMENTS_BUCKET=collection-documents
TEMP_BUCKET=collection-temp
MAX_FILE_SIZE=52428800
ALLOWED_MIME_TYPES=application/pdf,image/jpeg,image/jpg,image/png,image/gif,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
EOF

            # Campaign Engine env file
            cat > "$BASE_DIR/env/campaign-engine.env" << EOF
# Campaign Engine Configuration - Production Environment
PORT=3004
NODE_ENV=production

# Database configuration
DB_HOST=$DB_SERVER_IP
DB_PORT=6432
DB_DATABASE=$POSTGRES_DB
DB_USERNAME=$POSTGRES_USER
DB_PASSWORD=$POSTGRES_PASSWORD
DB_SSL=false

# Redis configuration
REDIS_HOST=$CACHE_SERVER_IP
REDIS_PORT=6379
REDIS_PASSWORD=$REDIS_PASSWORD

# Kafka configuration
KAFKA_BROKERS=$CACHE_SERVER_IP:9092
KAFKA_CLIENT_ID=campaign-engine-prod
KAFKA_GROUP_ID=campaign-engine-prod

# Logging
LOG_LEVEL=info
EOF

            # Payment Service env file
            cat > "$BASE_DIR/env/payment-service.env" << EOF
# Payment Service Configuration - Production Environment
PORT=3005
NODE_ENV=production

# Database configuration
DB_HOST=$DB_SERVER_IP
DB_PORT=6432
DB_DATABASE=$POSTGRES_DB
DB_USERNAME=$POSTGRES_USER
DB_PASSWORD=$POSTGRES_PASSWORD
DB_SSL=false

# Redis configuration
REDIS_HOST=$CACHE_SERVER_IP
REDIS_PORT=6379
REDIS_PASSWORD=$REDIS_PASSWORD

# Kafka configuration
KAFKA_BROKERS=$CACHE_SERVER_IP:9092
KAFKA_CLIENT_ID=payment-service-prod
KAFKA_GROUP_ID=payment-service-prod

# Logging
LOG_LEVEL=info
EOF

            # Audit Service env file
            cat > "$BASE_DIR/env/audit-service.env" << EOF
# Audit Service Configuration - Production Environment
PORT=3010
NODE_ENV=production

# Database configuration
DB_HOST=$DB_SERVER_IP
DB_PORT=6432
DB_DATABASE=$POSTGRES_DB
DB_USERNAME=$POSTGRES_USER
DB_PASSWORD=$POSTGRES_PASSWORD
DB_SSL=false

# Database Pool Configuration
DB_POOL_MAX=20
DB_POOL_MIN=5
DB_POOL_IDLE_TIMEOUT=30000
DB_POOL_ACQUIRE_TIMEOUT=60000

# API Configuration
API_PREFIX=/api/v1/audit

# Kafka configuration
KAFKA_BROKERS=$CACHE_SERVER_IP:9092
KAFKA_CLIENT_ID=audit-service-prod
KAFKA_GROUP_ID=audit-service-prod
KAFKA_RETRY_ATTEMPTS=8
KAFKA_RETRY_INITIAL_TIME=5000

# Audit Service Configuration
AUDIT_RETENTION_DAYS=365
AUDIT_BATCH_SIZE=1000

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

main() {
    clear
    echo "======================================"
    echo "CollectionCRM 3-Server Installation"
    echo "======================================"
    echo ""
    
    # Initialize log
    echo "Installation started at $(date)" > "$LOG_FILE"
    
    # Check requirements
    check_requirements
    
    # Load configuration
    load_configuration
    
    # Generate passwords if needed
    generate_passwords
    
    # Select or detect installation mode
    if [ "$INSTALL_MODE" == "local" ]; then
        detect_server_role
    fi
    
    if [ -z "$1" ]; then
        select_installation_mode
    else
        INSTALL_MODE="$1"
    fi
    
    # Create required directories
    create_directories
    
    # Perform installation based on mode
    install_server "$INSTALL_MODE"
    
    # Verify installation
    if [ -f "$SCRIPT_DIR/verify-install.sh" ]; then
        sleep 10  # Wait for services to start
        "$SCRIPT_DIR/verify-install.sh" "$INSTALL_MODE"
    fi
    
    # Display summary
    echo ""
    success "======================================"
    success "Installation completed successfully!"
    success "======================================"
    echo ""
    info "Configuration saved to: $CONFIG_FILE"
    info "Logs saved to: $LOG_FILE"
    echo ""
    
    if [ "$INSTALL_MODE" == "server3" ] || [ "$INSTALL_MODE" == "all" ]; then
        info "You can access CollectionCRM at:"
        info "  http://$(hostname -I | awk '{print $1}')"
        info "  http://localhost (if on local machine)"
        echo ""
    fi
    
    warning "IMPORTANT: Save the configuration file with passwords!"
    warning "Location: $CONFIG_FILE"
    echo ""
}

# Run main function
main "$@"