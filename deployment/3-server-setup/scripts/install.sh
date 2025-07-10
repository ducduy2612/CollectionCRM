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
    
    info "Created default configuration file at $CONFIG_FILE"
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
    
    # Setup network first
    "$SCRIPT_DIR/setup-network.sh"
    
    # Load Docker images if available
    if [ -f "$SCRIPT_DIR/load-images.sh" ]; then
        "$SCRIPT_DIR/load-images.sh" "$server_type"
    fi
    
    # Create environment file
    create_env_file "$server_type"
    
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