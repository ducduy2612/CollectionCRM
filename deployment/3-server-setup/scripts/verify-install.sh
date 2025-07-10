#!/bin/bash

# CollectionCRM Installation Verification Script
# Performs health checks and verification for deployed services

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
VERIFICATION_LOG="${BASE_DIR}/verification.log"

# Test results
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_WARNED=0

# Functions
log() {
    echo -e "${2:-$NC}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$VERIFICATION_LOG"
}

error() {
    log "$1" "$RED"
    ((TESTS_FAILED++))
}

success() {
    log "$1" "$GREEN"
    ((TESTS_PASSED++))
}

info() {
    log "$1" "$BLUE"
}

warning() {
    log "$1" "$YELLOW"
    ((TESTS_WARNED++))
}

# Load configuration
load_config() {
    if [ -f "$CONFIG_FILE" ]; then
        source "$CONFIG_FILE"
    else
        warning "Configuration file not found, using defaults"
    fi
}

# Service health check mappings
declare -A SERVER1_SERVICES=(
    ["postgres"]="172.20.1.10:5432"
    ["pgbouncer"]="172.20.1.11:6432"
)

declare -A SERVER2_SERVICES=(
    ["redis"]="172.20.2.10:6379"
    ["zookeeper"]="172.20.2.11:2181"
    ["kafka"]="172.20.2.12:9092"
)

declare -A SERVER3_SERVICES=(
    ["nginx"]="172.20.3.10:80"
    ["frontend"]="172.20.3.11:8080"
    ["api-gateway"]="172.20.3.12:3000"
    ["auth-service"]="172.20.3.13:3001"
    ["bank-sync-service"]="172.20.3.14:3002"
    ["workflow-service"]="172.20.3.15:3003"
    ["campaign-engine"]="172.20.3.16:3004"
    ["payment-service"]="172.20.3.17:3005"
    ["minio"]="172.20.3.18:9000"
)

check_docker() {
    info "Checking Docker status..."
    
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed"
        return 1
    fi
    
    if ! docker info &> /dev/null; then
        error "Docker daemon is not running"
        return 1
    fi
    
    success "Docker is running"
    
    # Check Docker Compose
    if command -v docker-compose &> /dev/null; then
        success "Docker Compose v1 is available"
    elif docker compose version &> /dev/null; then
        success "Docker Compose v2 is available"
    else
        error "Docker Compose is not available"
    fi
}

check_network() {
    info "Checking Docker network..."
    
    local network_name="${NETWORK_NAME:-collectioncrm-network}"
    
    if docker network ls --format '{{.Name}}' | grep -q "^${network_name}$"; then
        success "Network '$network_name' exists"
        
        # Get network details
        local subnet=$(docker network inspect "$network_name" --format '{{range .IPAM.Config}}{{.Subnet}}{{end}}')
        info "  Subnet: $subnet"
    else
        error "Network '$network_name' does not exist"
    fi
}

check_container() {
    local container_name="$1"
    local expected_ip="$2"
    
    info "Checking container: $container_name"
    
    # Check if container exists
    if ! docker ps -a --format '{{.Names}}' | grep -q "^collectioncrm-${container_name}$"; then
        error "  Container 'collectioncrm-$container_name' does not exist"
        return 1
    fi
    
    # Check if container is running
    local status=$(docker inspect -f '{{.State.Status}}' "collectioncrm-$container_name" 2>/dev/null || echo "unknown")
    
    if [ "$status" != "running" ]; then
        error "  Container is not running (status: $status)"
        return 1
    fi
    
    success "  Container is running"
    
    # Check health status if available
    local health=$(docker inspect -f '{{.State.Health.Status}}' "collectioncrm-$container_name" 2>/dev/null || echo "none")
    
    if [ "$health" != "none" ]; then
        if [ "$health" == "healthy" ]; then
            success "  Health check: healthy"
        else
            warning "  Health check: $health"
        fi
    fi
    
    # Check IP address
    local actual_ip=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' "collectioncrm-$container_name" 2>/dev/null || echo "none")
    
    if [ "$actual_ip" != "none" ] && [ -n "$expected_ip" ]; then
        local expected_ip_only=$(echo "$expected_ip" | cut -d: -f1)
        if [ "$actual_ip" == "$expected_ip_only" ]; then
            success "  IP address matches: $actual_ip"
        else
            warning "  IP address mismatch - expected: $expected_ip_only, actual: $actual_ip"
        fi
    fi
}

check_port() {
    local service_name="$1"
    local host_port="$2"
    local host=$(echo "$host_port" | cut -d: -f1)
    local port=$(echo "$host_port" | cut -d: -f2)
    
    info "Checking port connectivity for $service_name ($host:$port)..."
    
    # Try to connect to the port
    if timeout 5 bash -c "echo >/dev/tcp/$host/$port" 2>/dev/null; then
        success "  Port $port is open"
        return 0
    else
        error "  Cannot connect to port $port"
        return 1
    fi
}

check_service_endpoint() {
    local service_name="$1"
    local endpoint="$2"
    
    info "Checking $service_name endpoint..."
    
    case "$service_name" in
        nginx|frontend)
            if curl -s -f "http://$endpoint/health" > /dev/null 2>&1; then
                success "  HTTP health check passed"
            else
                warning "  HTTP health check failed (service may still be starting)"
            fi
            ;;
        api-gateway|auth-service|bank-sync-service|workflow-service|campaign-engine|payment-service)
            if curl -s -f "http://$endpoint/health" > /dev/null 2>&1; then
                success "  Service health endpoint responsive"
            else
                warning "  Service health endpoint not responsive (may still be starting)"
            fi
            ;;
        postgres)
            if PGPASSWORD="${POSTGRES_PASSWORD}" psql -h "${endpoint%:*}" -p "${endpoint#*:}" -U "${POSTGRES_USER:-collectioncrm}" -c "SELECT 1" &> /dev/null; then
                success "  PostgreSQL connection successful"
            else
                warning "  PostgreSQL connection failed (check credentials)"
            fi
            ;;
        redis)
            if redis-cli -h "${endpoint%:*}" -p "${endpoint#*:}" -a "${REDIS_PASSWORD}" ping &> /dev/null; then
                success "  Redis connection successful"
            else
                warning "  Redis connection failed (check password)"
            fi
            ;;
        kafka)
            # Basic port check is sufficient for Kafka
            success "  Kafka port check passed"
            ;;
        minio)
            if curl -s -f "http://$endpoint/minio/health/live" > /dev/null 2>&1; then
                success "  MinIO health check passed"
            else
                warning "  MinIO health check failed"
            fi
            ;;
    esac
}

verify_server_services() {
    local server_type="$1"
    local -n services_array
    
    echo ""
    case "$server_type" in
        server1)
            services_array=SERVER1_SERVICES
            info "Verifying Database Server services..."
            ;;
        server2)
            services_array=SERVER2_SERVICES
            info "Verifying Cache/Message Server services..."
            ;;
        server3)
            services_array=SERVER3_SERVICES
            info "Verifying Application Server services..."
            ;;
        all)
            info "Verifying all server services..."
            verify_server_services "server1"
            verify_server_services "server2"
            verify_server_services "server3"
            return
            ;;
        *)
            error "Unknown server type: $server_type"
            return
            ;;
    esac
    
    echo ""
    for service in "${!services_array[@]}"; do
        local endpoint="${services_array[$service]}"
        
        # Check container
        check_container "$service" "$endpoint"
        
        # Check port connectivity
        check_port "$service" "$endpoint"
        
        # Check service endpoint
        check_service_endpoint "$service" "$endpoint"
        
        echo ""
    done
}

check_logs() {
    info "Checking for errors in container logs..."
    
    local containers=$(docker ps --format '{{.Names}}' | grep '^collectioncrm-' || true)
    local error_count=0
    
    for container in $containers; do
        local errors=$(docker logs "$container" 2>&1 | grep -iE '(error|fatal|panic|failed)' | grep -v 'Error: 0' | tail -5 || true)
        
        if [ -n "$errors" ]; then
            warning "Recent errors in $container:"
            echo "$errors" | sed 's/^/    /'
            ((error_count++))
        fi
    done
    
    if [ "$error_count" -eq 0 ]; then
        success "No critical errors found in logs"
    else
        warning "Found errors in $error_count containers"
    fi
}

check_disk_space() {
    info "Checking disk space..."
    
    local usage=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
    local available=$(df -BG / | awk 'NR==2 {print $4}' | sed 's/G//')
    
    info "  Disk usage: $usage%"
    info "  Available space: ${available}GB"
    
    if [ "$usage" -gt 90 ]; then
        error "Disk usage is critically high (>90%)"
    elif [ "$usage" -gt 80 ]; then
        warning "Disk usage is high (>80%)"
    else
        success "Disk usage is acceptable"
    fi
}

check_memory() {
    info "Checking memory usage..."
    
    local total=$(free -m | awk 'NR==2 {print $2}')
    local used=$(free -m | awk 'NR==2 {print $3}')
    local usage=$((used * 100 / total))
    
    info "  Memory usage: $usage% ($used MB / $total MB)"
    
    if [ "$usage" -gt 90 ]; then
        error "Memory usage is critically high (>90%)"
    elif [ "$usage" -gt 80 ]; then
        warning "Memory usage is high (>80%)"
    else
        success "Memory usage is acceptable"
    fi
}

generate_report() {
    echo ""
    echo "======================================"
    echo "Verification Summary"
    echo "======================================"
    echo ""
    
    local total_tests=$((TESTS_PASSED + TESTS_FAILED + TESTS_WARNED))
    
    success "Tests passed: $TESTS_PASSED"
    if [ "$TESTS_WARNED" -gt 0 ]; then
        warning "Tests with warnings: $TESTS_WARNED"
    fi
    if [ "$TESTS_FAILED" -gt 0 ]; then
        error "Tests failed: $TESTS_FAILED"
    fi
    
    echo ""
    info "Total tests: $total_tests"
    
    # Calculate success rate
    if [ "$total_tests" -gt 0 ]; then
        local success_rate=$((TESTS_PASSED * 100 / total_tests))
        info "Success rate: $success_rate%"
    fi
    
    echo ""
    if [ "$TESTS_FAILED" -eq 0 ]; then
        success "Installation verification PASSED"
        
        if [ "$1" == "server3" ] || [ "$1" == "all" ]; then
            echo ""
            info "CollectionCRM is ready to use!"
            info "Access the application at: http://$(hostname -I | awk '{print $1}')"
        fi
    else
        error "Installation verification FAILED"
        info "Check the logs for more details: $VERIFICATION_LOG"
    fi
}

main() {
    clear
    echo "======================================"
    echo "CollectionCRM Installation Verification"
    echo "======================================"
    
    # Initialize log
    echo "Verification started at $(date)" > "$VERIFICATION_LOG"
    
    # Load configuration
    load_config
    
    # Determine which server to verify
    local server_type="${1:-all}"
    
    # Basic system checks
    check_docker
    check_network
    check_disk_space
    check_memory
    
    # Service-specific checks
    verify_server_services "$server_type"
    
    # Check logs for errors
    check_logs
    
    # Generate report
    generate_report "$server_type"
    
    echo ""
    info "Detailed logs saved to: $VERIFICATION_LOG"
    echo ""
}

# Run main function
main "$@"