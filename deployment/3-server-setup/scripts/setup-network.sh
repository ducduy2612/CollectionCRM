#!/bin/bash

# CollectionCRM Docker Network Setup Script
# Creates and configures the external Docker network for cross-server communication

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

# Default network configuration
DEFAULT_NETWORK_NAME="collectioncrm-network"
DEFAULT_NETWORK_SUBNET="172.20.0.0/16"
DEFAULT_NETWORK_GATEWAY="172.20.0.1"

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

# Load configuration
load_config() {
    if [ -f "$CONFIG_FILE" ]; then
        source "$CONFIG_FILE"
    fi
    
    # Use defaults if not set
    NETWORK_NAME="${NETWORK_NAME:-$DEFAULT_NETWORK_NAME}"
    NETWORK_SUBNET="${NETWORK_SUBNET:-$DEFAULT_NETWORK_SUBNET}"
    NETWORK_GATEWAY="${NETWORK_GATEWAY:-$DEFAULT_NETWORK_GATEWAY}"
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
        --opt com.docker.network.bridge.name=br-collectioncrm \
        --opt com.docker.network.bridge.enable_icc=true \
        --opt com.docker.network.bridge.enable_ip_masquerade=true \
        --opt com.docker.network.driver.mtu=1500 \
        "$NETWORK_NAME"; then
        success "Network created successfully"
    else
        error "Failed to create network"
    fi
}

verify_network() {
    info "Verifying network configuration..."
    
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
    
    info "Network details:"
    info "  ID: $network_id"
    info "  Driver: $driver"
    info "  Subnet: $subnet"
    info "  Gateway: $gateway"
    
    # Test network connectivity (if possible)
    if command -v ping &> /dev/null; then
        info "Testing gateway connectivity..."
        if ping -c 1 -W 2 "$NETWORK_GATEWAY" &> /dev/null; then
            success "Gateway is reachable"
        else
            warning "Gateway is not reachable (this is normal if no containers are running)"
        fi
    fi
    
    success "Network verification completed"
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
    info "Network Usage Information:"
    info "================================"
    info "Network Name: $NETWORK_NAME"
    info "Subnet: $NETWORK_SUBNET"
    echo ""
    info "IP Address Allocation:"
    info "  Database Server (Server 1):"
    info "    - PostgreSQL: 172.20.1.10"
    info "    - PgBouncer: 172.20.1.11"
    info "    - Backup: 172.20.1.12"
    echo ""
    info "  Cache Server (Server 2):"
    info "    - Redis: 172.20.2.10"
    info "    - Zookeeper: 172.20.2.11"
    info "    - Kafka: 172.20.2.12"
    echo ""
    info "  Application Server (Server 3):"
    info "    - Nginx: 172.20.3.10"
    info "    - Frontend: 172.20.3.11"
    info "    - API Gateway: 172.20.3.12"
    info "    - Auth Service: 172.20.3.13"
    info "    - Bank Sync: 172.20.3.14"
    info "    - Workflow: 172.20.3.15"
    info "    - Campaign: 172.20.3.16"
    info "    - Payment: 172.20.3.17"
    info "    - MinIO: 172.20.3.18"
    echo ""
}

main() {
    clear
    echo "======================================"
    echo "CollectionCRM Network Setup"
    echo "======================================"
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