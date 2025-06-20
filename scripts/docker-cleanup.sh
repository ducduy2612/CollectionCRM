#!/bin/bash

# Docker Environment Cleanup Script
# This script completely removes all Docker resources to provide a fresh start
# Usage: ./docker-cleanup.sh [--remote user@host] [--force]

set -e

REMOTE_HOST=""
FORCE_MODE=false
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to execute command locally or remotely
execute_cmd() {
    local cmd="$1"
    if [[ -n "$REMOTE_HOST" ]]; then
        ssh "$REMOTE_HOST" "$cmd"
    else
        eval "$cmd"
    fi
}

# Function to check if Docker is running
check_docker() {
    print_info "Checking Docker status..."
    if ! execute_cmd "docker info >/dev/null 2>&1"; then
        print_error "Docker is not running or not accessible"
        exit 1
    fi
    print_success "Docker is running"
}

# Function to show current Docker resource usage
show_current_usage() {
    print_info "Current Docker resource usage:"
    execute_cmd "docker system df"
    echo
}

# Function to confirm cleanup
confirm_cleanup() {
    if [[ "$FORCE_MODE" == true ]]; then
        return 0
    fi

    local target="locally"
    if [[ -n "$REMOTE_HOST" ]]; then
        target="on $REMOTE_HOST"
    fi

    echo
    print_warning "This will completely remove ALL Docker resources $target:"
    echo "  • All running containers will be stopped"
    echo "  • All containers will be removed"
    echo "  • All images will be removed"
    echo "  • All volumes will be removed"
    echo "  • All custom networks will be removed"
    echo "  • All build cache will be cleared"
    echo
    read -p "Are you sure you want to continue? (yes/no): " -r
    echo
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        print_info "Cleanup cancelled"
        exit 0
    fi
}

# Function to stop all containers
stop_containers() {
    print_info "Stopping all running containers..."
    local containers
    containers=$(execute_cmd "docker ps -q")
    if [[ -n "$containers" ]]; then
        execute_cmd "docker stop \$(docker ps -q) 2>/dev/null || echo 'No containers to stop'"
        print_success "All containers stopped"
    else
        print_info "No running containers found"
    fi
}

# Function to remove all containers
remove_containers() {
    print_info "Removing all containers..."
    local containers
    containers=$(execute_cmd "docker ps -aq")
    if [[ -n "$containers" ]]; then
        execute_cmd "docker rm \$(docker ps -aq) 2>/dev/null || echo 'No containers to remove'"
        print_success "All containers removed"
    else
        print_info "No containers to remove"
    fi
}

# Function to remove all images
remove_images() {
    print_info "Removing all images..."
    local images
    images=$(execute_cmd "docker images -aq")
    if [[ -n "$images" ]]; then
        execute_cmd "docker rmi \$(docker images -aq) -f 2>/dev/null || echo 'No images to remove'"
        print_success "All images removed"
    else
        print_info "No images to remove"
    fi
}

# Function to remove all volumes
remove_volumes() {
    print_info "Removing all volumes..."
    
    # First remove unused volumes
    execute_cmd "docker volume prune -f"
    
    # Then remove any remaining named volumes
    local volumes
    volumes=$(execute_cmd "docker volume ls -q")
    if [[ -n "$volumes" ]]; then
        execute_cmd "docker volume rm \$(docker volume ls -q) -f 2>/dev/null || echo 'No volumes to remove'"
        print_success "All volumes removed"
    else
        print_info "No volumes to remove"
    fi
}

# Function to remove all networks
remove_networks() {
    print_info "Removing all custom networks..."
    execute_cmd "docker network prune -f"
    print_success "All custom networks removed"
}

# Function to clean build cache
clean_build_cache() {
    print_info "Cleaning build cache and system..."
    execute_cmd "docker system prune -af"
    print_success "Build cache cleaned"
}

# Function to verify cleanup
verify_cleanup() {
    print_info "Verifying cleanup completion..."
    echo
    execute_cmd "docker system df"
    echo
    
    local containers images volumes
    containers=$(execute_cmd "docker ps -aq | wc -l")
    images=$(execute_cmd "docker images -aq | wc -l")
    volumes=$(execute_cmd "docker volume ls -q | wc -l")
    
    if [[ "$containers" -eq 0 && "$images" -eq 0 && "$volumes" -eq 0 ]]; then
        print_success "✨ Docker environment successfully cleaned! All resources removed."
    else
        print_warning "Some resources may still remain. Please check manually."
    fi
}

# Function to show usage
show_usage() {
    echo "Docker Environment Cleanup Script"
    echo
    echo "Usage: $0 [OPTIONS]"
    echo
    echo "Options:"
    echo "  --remote USER@HOST    Execute cleanup on remote host via SSH"
    echo "  --force              Skip confirmation prompt"
    echo "  --help               Show this help message"
    echo
    echo "Examples:"
    echo "  $0                                    # Clean local Docker environment"
    echo "  $0 --force                           # Clean local environment without confirmation"
    echo "  $0 --remote root@103.109.37.62       # Clean remote Docker environment"
    echo "  $0 --remote user@server --force      # Clean remote environment without confirmation"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --remote)
            REMOTE_HOST="$2"
            shift 2
            ;;
        --force)
            FORCE_MODE=true
            shift
            ;;
        --help)
            show_usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Main execution
main() {
    echo "🐳 Docker Environment Cleanup Script"
    echo "===================================="
    echo
    
    if [[ -n "$REMOTE_HOST" ]]; then
        print_info "Target: Remote host ($REMOTE_HOST)"
    else
        print_info "Target: Local machine"
    fi
    echo
    
    check_docker
    show_current_usage
    confirm_cleanup
    
    print_info "Starting cleanup process..."
    echo
    
    stop_containers
    remove_containers
    remove_images
    remove_volumes
    remove_networks
    clean_build_cache
    
    echo
    verify_cleanup
    echo
    print_success "🎉 Cleanup completed successfully!"
}

# Run main function
main "$@"