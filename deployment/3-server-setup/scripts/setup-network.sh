#!/bin/bash

# CollectionCRM Multi-Server Network Setup Script
# Configures each server's local Docker networks and validates cross-server connectivity
# IMPORTANT: This script does NOT create cross-server Docker networks (which is impossible)
# Instead, it sets up local networks on each server and validates actual server-to-server connectivity

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

# Default network configuration for local Docker networks
DEFAULT_NETWORK_NAME="collectioncrm-network"
DEFAULT_NETWORK_SUBNET="172.20.0.0/16"
DEFAULT_NETWORK_GATEWAY="172.20.0.1"

# Server configuration - these MUST be set to actual server IPs
# Use the same variable names as install.sh for consistency
DB_SERVER_IP="${DB_SERVER_IP:-}"    # Database server IP (Server 1)
CACHE_SERVER_IP="${CACHE_SERVER_IP:-}"  # Cache server IP (Server 2)
APP_SERVER_IP="${APP_SERVER_IP:-}"      # Application server IP (Server 3)

# Also support the old variable names for backward compatibility
SERVER1_IP="${SERVER1_IP:-$DB_SERVER_IP}"
SERVER2_IP="${SERVER2_IP:-$CACHE_SERVER_IP}"
SERVER3_IP="${SERVER3_IP:-$APP_SERVER_IP}"

# Current server role detection
CURRENT_SERVER_ROLE="${SERVER_ROLE:-auto}"

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

# Load configuration and validate server IPs
load_config() {
    if [ -f "$CONFIG_FILE" ]; then
        source "$CONFIG_FILE"
    fi
    
    # Use defaults if not set
    NETWORK_NAME="${NETWORK_NAME:-$DEFAULT_NETWORK_NAME}"
    NETWORK_SUBNET="${NETWORK_SUBNET:-$DEFAULT_NETWORK_SUBNET}"
    NETWORK_GATEWAY="${NETWORK_GATEWAY:-$DEFAULT_NETWORK_GATEWAY}"
    
    # Load server IPs from deployment.conf if available
    if [ -n "$DB_SERVER_IP" ]; then
        SERVER1_IP="$DB_SERVER_IP"
    fi
    if [ -n "$CACHE_SERVER_IP" ]; then
        SERVER2_IP="$CACHE_SERVER_IP"
    fi
    if [ -n "$APP_SERVER_IP" ]; then
        SERVER3_IP="$APP_SERVER_IP"
    fi
    
    # Validate server IPs are set (either from config file or environment)
    if [ -z "$SERVER1_IP" ] || [ -z "$SERVER2_IP" ] || [ -z "$SERVER3_IP" ]; then
        error "Server IPs must be configured in deployment.conf or set as environment variables (DB_SERVER_IP, CACHE_SERVER_IP, APP_SERVER_IP)."
    fi
    
    # Detect current server role if not explicitly set
    if [ "$CURRENT_SERVER_ROLE" = "auto" ]; then
        detect_server_role
    fi
}

# Detect which server we're running on
detect_server_role() {
    local current_ip=$(hostname -I | awk '{print $1}')
    
    # Use the primary variable names for comparison
    local db_ip="${DB_SERVER_IP:-$SERVER1_IP}"
    local cache_ip="${CACHE_SERVER_IP:-$SERVER2_IP}"
    local app_ip="${APP_SERVER_IP:-$SERVER3_IP}"
    
    if [ "$current_ip" = "$db_ip" ]; then
        CURRENT_SERVER_ROLE="server1"
        NETWORK_NAME="collectioncrm-server1-network"
    elif [ "$current_ip" = "$cache_ip" ]; then
        CURRENT_SERVER_ROLE="server2"
        NETWORK_NAME="collectioncrm-server2-network"
    elif [ "$current_ip" = "$app_ip" ]; then
        CURRENT_SERVER_ROLE="server3"
        NETWORK_NAME="collectioncrm-server3-network"
    else
        warning "Could not auto-detect server role. Current IP: $current_ip"
        warning "Expected IPs: DB=$db_ip, Cache=$cache_ip, App=$app_ip"
        warning "Please set SERVER_ROLE environment variable (server1, server2, or server3)"
        CURRENT_SERVER_ROLE="unknown"
    fi
    
    info "Detected server role: $CURRENT_SERVER_ROLE"
}

check_docker() {
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed"
    fi
    
    if ! docker info &> /dev/null; then
        error "Docker daemon is not running or you don't have permission"
    fi
}

check_existing_network() {
    info "Checking for existing network..."
    
    if docker network ls --format '{{.Name}}' | grep -q "^${NETWORK_NAME}$"; then
        info "Network '$NETWORK_NAME' already exists"
        
        # Get network details
        local subnet=$(docker network inspect "$NETWORK_NAME" --format '{{range .IPAM.Config}}{{.Subnet}}{{end}}')
        local gateway=$(docker network inspect "$NETWORK_NAME" --format '{{range .IPAM.Config}}{{.Gateway}}{{end}}')
        
        info "Existing network configuration:"
        info "  Subnet: $subnet"
        info "  Gateway: $gateway"
        
        # Check if configuration matches
        if [ "$subnet" != "$NETWORK_SUBNET" ]; then
            warning "Existing network subnet ($subnet) doesn't match configuration ($NETWORK_SUBNET)"
            
            read -p "Remove existing network and recreate? (y/N): " -n 1 -r
            echo ""
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                remove_network
                return 1
            else
                warning "Using existing network with different configuration"
                return 0
            fi
        fi
        
        success "Existing network configuration matches"
        return 0
    else
        info "Network '$NETWORK_NAME' does not exist"
        return 1
    fi
}

remove_network() {
    warning "Removing existing network..."
    
    # Check if any containers are using the network
    local containers=$(docker network inspect "$NETWORK_NAME" --format '{{range .Containers}}{{.Name}} {{end}}' 2>/dev/null || true)
    
    if [ -n "$containers" ]; then
        error "Cannot remove network. The following containers are still connected: $containers"
    fi
    
    if docker network rm "$NETWORK_NAME"; then
        success "Network removed successfully"
    else
        error "Failed to remove network"
    fi
}

create_network() {
    info "Creating Docker network..."
    info "  Name: $NETWORK_NAME"
    info "  Subnet: $NETWORK_SUBNET"
    info "  Gateway: $NETWORK_GATEWAY"
    
    if docker network create \
        --driver bridge \
        --subnet="$NETWORK_SUBNET" \
        --gateway="$NETWORK_GATEWAY" \
        "$NETWORK_NAME"; then
        success "Network created successfully"
    else
        error "Failed to create network"
    fi
}

# Verify local Docker network and cross-server connectivity
verify_network() {
    info "Verifying local Docker network configuration..."
    
    # Get network ID
    local network_id=$(docker network ls --filter "name=^${NETWORK_NAME}$" --format "{{.ID}}")
    
    if [ -z "$network_id" ]; then
        error "Network verification failed - network not found"
    fi
    
    # Get detailed information
    local details=$(docker network inspect "$NETWORK_NAME")
    
    # Extract key information
    local driver=$(echo "$details" | grep -m1 '"Driver":' | awk -F'"' '{print $4}')
    local subnet=$(echo "$details" | grep -m1 '"Subnet":' | awk -F'"' '{print $4}')
    local gateway=$(echo "$details" | grep -m1 '"Gateway":' | awk -F'"' '{print $4}')
    
    info "Local network details:"
    info "  ID: $network_id"
    info "  Driver: $driver"
    info "  Subnet: $subnet"
    info "  Gateway: $gateway"
    
    success "Local network verification completed"
    
    # Test cross-server connectivity
    test_cross_server_connectivity
}

# Test connectivity to other servers
test_cross_server_connectivity() {
    info "Testing cross-server connectivity..."
    
    # Use consistent variable names
    local db_ip="${DB_SERVER_IP:-$SERVER1_IP}"
    local cache_ip="${CACHE_SERVER_IP:-$SERVER2_IP}"
    local app_ip="${APP_SERVER_IP:-$SERVER3_IP}"
    local servers=("$db_ip:Database" "$cache_ip:Cache" "$app_ip:Application")
    local current_ip=$(hostname -I | awk '{print $1}')
    
    for server_info in "${servers[@]}"; do
        local server_ip=$(echo "$server_info" | cut -d: -f1)
        local server_name=$(echo "$server_info" | cut -d: -f2)
        
        # Skip testing connectivity to ourselves
        if [ "$server_ip" = "$current_ip" ]; then
            info "  $server_name Server ($server_ip): Current server - skipping"
            continue
        fi
        
        if command -v ping &> /dev/null; then
            if ping -c 2 -W 3 "$server_ip" &> /dev/null; then
                success "  $server_name Server ($server_ip): Reachable"
            else
                warning "  $server_name Server ($server_ip): Not reachable"
            fi
        else
            info "  $server_name Server ($server_ip): Cannot test (ping not available)"
        fi
    done
    
    # Test specific service ports if this is the application server
    if [ "$CURRENT_SERVER_ROLE" = "server3" ]; then
        test_service_ports
    fi
}

# Test connectivity to specific service ports
test_service_ports() {
    info "Testing service port connectivity..."
    
    # Use consistent variable names
    local db_ip="${DB_SERVER_IP:-$SERVER1_IP}"
    local cache_ip="${CACHE_SERVER_IP:-$SERVER2_IP}"
    
    # Database server ports
    test_port "$db_ip" 5432 "PostgreSQL"
    test_port "$db_ip" 6432 "PgBouncer"
    
    # Cache server ports
    test_port "$cache_ip" 6379 "Redis"
    test_port "$cache_ip" 9092 "Kafka"
    test_port "$cache_ip" 2181 "Zookeeper"
}

# Test connectivity to a specific port
test_port() {
    local host="$1"
    local port="$2"
    local service="$3"
    
    if command -v nc &> /dev/null; then
        if nc -z -w3 "$host" "$port" &> /dev/null; then
            success "    $service ($host:$port): Connected"
        else
            warning "    $service ($host:$port): Connection failed"
        fi
    elif command -v telnet &> /dev/null; then
        if timeout 3 telnet "$host" "$port" &> /dev/null; then
            success "    $service ($host:$port): Connected"
        else
            warning "    $service ($host:$port): Connection failed"
        fi
    else
        info "    $service ($host:$port): Cannot test (nc/telnet not available)"
    fi
}

configure_firewall() {
    info "Checking firewall configuration..."
    
    # Check if firewall is active
    if command -v ufw &> /dev/null; then
        if ufw status | grep -q "Status: active"; then
            warning "UFW firewall is active"
            info "You may need to allow Docker communication:"
            info "  sudo ufw allow from $NETWORK_SUBNET"
            echo ""
        fi
    fi
    
    if command -v firewall-cmd &> /dev/null; then
        if firewall-cmd --state &> /dev/null; then
            warning "Firewalld is active"
            info "You may need to allow Docker communication:"
            info "  sudo firewall-cmd --permanent --zone=trusted --add-source=$NETWORK_SUBNET"
            info "  sudo firewall-cmd --reload"
            echo ""
        fi
    fi
    
    # Check iptables rules
    if command -v iptables &> /dev/null; then
        info "Docker should manage iptables rules automatically"
        info "Current Docker-related rules:"
        iptables -L -n | grep -i docker | head -5 || true
        echo ""
    fi
}

display_usage_info() {
    echo ""
    info "Multi-Server Network Configuration:"
    info "===================================="
    info "Current Server Role: $CURRENT_SERVER_ROLE"
    info "Local Network Name: $NETWORK_NAME"
    info "Local Network Subnet: $NETWORK_SUBNET"
    echo ""
    info "Server Configuration:"
    info "  Database Server (Server 1): ${DB_SERVER_IP:-$SERVER1_IP}"
    info "    - PostgreSQL: ${DB_SERVER_IP:-$SERVER1_IP}:5432"
    info "    - PgBouncer: ${DB_SERVER_IP:-$SERVER1_IP}:6432"
    echo ""
    info "  Cache Server (Server 2): ${CACHE_SERVER_IP:-$SERVER2_IP}"
    info "    - Redis: ${CACHE_SERVER_IP:-$SERVER2_IP}:6379"
    info "    - Zookeeper: ${CACHE_SERVER_IP:-$SERVER2_IP}:2181"
    info "    - Kafka: ${CACHE_SERVER_IP:-$SERVER2_IP}:9092"
    echo ""
    info "  Application Server (Server 3): ${APP_SERVER_IP:-$SERVER3_IP}"
    info "    - Nginx: ${APP_SERVER_IP:-$SERVER3_IP}:80, ${APP_SERVER_IP:-$SERVER3_IP}:443"
    info "    - All microservices accessible through Nginx reverse proxy"
    echo ""
    info "IMPORTANT: Cross-server communication uses actual server IPs, not Docker network IPs!"
    echo ""
}

main() {
    clear
    echo "======================================"
    echo "CollectionCRM Network Setup"
    echo "======================================"
    echo ""
    
    # Display server configuration
    info "Server Configuration:"
    info "  DB_SERVER_IP (Database/Server1): ${DB_SERVER_IP:-${SERVER1_IP:-NOT_SET}}"
    info "  CACHE_SERVER_IP (Cache/Server2): ${CACHE_SERVER_IP:-${SERVER2_IP:-NOT_SET}}"
    info "  APP_SERVER_IP (Application/Server3): ${APP_SERVER_IP:-${SERVER3_IP:-NOT_SET}}"
    info "  Current Server Role: $CURRENT_SERVER_ROLE"
    echo ""
    
    # Check if running as root
    if [[ $EUID -ne 0 ]]; then
        warning "Running without root privileges - may need sudo for some operations"
    fi
    
    # Load configuration
    load_config
    
    # Check Docker
    check_docker
    
    # Check for existing network
    if ! check_existing_network; then
        # Create network if it doesn't exist
        create_network
    fi
    
    # Verify network
    verify_network
    
    # Configure firewall if needed
    configure_firewall
    
    # Display usage information
    display_usage_info
    
    echo ""
    success "======================================"
    success "Network setup completed!"
    success "======================================"
    echo ""
}

# Run main function
main "$@"