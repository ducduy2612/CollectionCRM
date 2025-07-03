#!/bin/bash

# Docker Development Environment Helper Script
# This script simplifies running the development environment

COMPOSE_FILE="docker/compose/docker-compose.dev.yml"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Available services
SERVICES=("frontend-dev" "api-gateway" "auth-service" "bank-sync-service" "workflow-service" "campaign-engine" "payment-service" "postgres" "redis" "kafka" "kafka-ui" "minio")

# Function to display usage
usage() {
    echo "Usage: $0 [command] [options]"
    echo ""
    echo "Commands:"
    echo "  up [service...]       Start all services or specific services (background)"
    echo "  down [service...]     Stop all services or specific services"
    echo "  start <service>       Start a specific service (background)"
    echo "  stop <service>        Stop a specific service"
    echo "  restart <service>     Restart a specific service"
    echo "  frontend              Start only frontend service (background)"
    echo "  logs [service]        Show logs (use -f for follow)"
    echo "  exec <service>        Execute command in specific container"
    echo "  build [service...]    Rebuild containers"
    echo "  clean                 Stop and remove all containers and volumes"
    echo "  status                Show status of all services"
    echo "  services              List available services"
    echo ""
    echo "Available Services:"
    printf "  %s\n" "${SERVICES[@]}"
    echo ""
    echo "Examples:"
    echo "  $0 up                           # Start all services (background)"
    echo "  $0 up frontend-dev api-gateway  # Start only frontend and API gateway (background)"
    echo "  $0 start workflow-service       # Start workflow service (background)"
    echo "  $0 stop postgres redis          # Stop postgres and redis"
    echo "  $0 restart api-gateway          # Restart API gateway"
    echo "  $0 logs -f frontend-dev         # Follow frontend logs"
    echo "  $0 exec frontend-dev npm test   # Run tests in frontend container"
    echo "  $0 status                       # Show service status"
}

# Function to validate service names
validate_services() {
    local invalid_services=()
    for service in "$@"; do
        if [[ ! " ${SERVICES[@]} " =~ " ${service} " ]]; then
            invalid_services+=("$service")
        fi
    done
    
    if [ ${#invalid_services[@]} -ne 0 ]; then
        echo -e "${RED}Error: Invalid service(s): ${invalid_services[*]}${NC}"
        echo -e "${YELLOW}Available services: ${SERVICES[*]}${NC}"
        return 1
    fi
    return 0
}

# Check if docker-compose is installed
if ! command -v docker compose &> /dev/null; then
    echo -e "${RED}Error: docker compose is not installed${NC}"
    exit 1
fi

# Main command handling
case "$1" in
    up)
        if [ $# -eq 1 ]; then
            echo -e "${GREEN}Starting all development services in background...${NC}"
            docker compose -f $COMPOSE_FILE up -d
        else
            services=("${@:2}")
            if validate_services "${services[@]}"; then
                echo -e "${GREEN}Starting services in background: ${services[*]}${NC}"
                docker compose -f $COMPOSE_FILE up -d "${services[@]}"
            else
                exit 1
            fi
        fi
        ;;
    down)
        if [ $# -eq 1 ]; then
            echo -e "${YELLOW}Stopping all services...${NC}"
            docker compose -f $COMPOSE_FILE down
        else
            services=("${@:2}")
            if validate_services "${services[@]}"; then
                echo -e "${YELLOW}Stopping services: ${services[*]}${NC}"
                docker compose -f $COMPOSE_FILE stop "${services[@]}"
            else
                exit 1
            fi
        fi
        ;;
    start)
        if [ $# -lt 2 ]; then
            echo -e "${RED}Error: Please specify a service to start${NC}"
            echo "Usage: $0 start <service>"
            exit 1
        fi
        service="$2"
        if validate_services "$service"; then
            echo -e "${GREEN}Starting service in background: $service${NC}"
            docker compose -f $COMPOSE_FILE start "$service"
        else
            exit 1
        fi
        ;;
    stop)
        if [ $# -lt 2 ]; then
            echo -e "${RED}Error: Please specify service(s) to stop${NC}"
            echo "Usage: $0 stop <service> [service...]"
            exit 1
        fi
        services=("${@:2}")
        if validate_services "${services[@]}"; then
            echo -e "${YELLOW}Stopping services: ${services[*]}${NC}"
            docker compose -f $COMPOSE_FILE stop "${services[@]}"
        else
            exit 1
        fi
        ;;
    restart)
        if [ $# -lt 2 ]; then
            echo -e "${RED}Error: Please specify a service to restart${NC}"
            echo "Usage: $0 restart <service>"
            exit 1
        fi
        service="$2"
        if validate_services "$service"; then
            echo -e "${YELLOW}Restarting service: $service${NC}"
            docker compose -f $COMPOSE_FILE restart "$service"
        else
            exit 1
        fi
        ;;
    frontend)
        echo -e "${GREEN}Starting frontend development service in background...${NC}"
        docker compose -f $COMPOSE_FILE up -d frontend-dev "${@:2}"
        ;;
    logs)
        if [ $# -eq 1 ]; then
            docker compose -f $COMPOSE_FILE logs
        else
            service="${@:2}"
            docker compose -f $COMPOSE_FILE logs $service
        fi
        ;;
    exec)
        if [ $# -lt 2 ]; then
            echo -e "${RED}Error: Please specify a service${NC}"
            echo "Usage: $0 exec <service> [command...]"
            exit 1
        fi
        service="$2"
        if validate_services "$service"; then
            docker compose -f $COMPOSE_FILE exec "$service" "${@:3}"
        else
            exit 1
        fi
        ;;
    build)
        if [ $# -eq 1 ]; then
            echo -e "${GREEN}Building all containers...${NC}"
            docker compose -f $COMPOSE_FILE build
        else
            services=("${@:2}")
            if validate_services "${services[@]}"; then
                echo -e "${GREEN}Building services: ${services[*]}${NC}"
                docker compose -f $COMPOSE_FILE build "${services[@]}"
            else
                exit 1
            fi
        fi
        ;;
    status)
        echo -e "${GREEN}Service Status:${NC}"
        docker compose -f $COMPOSE_FILE ps
        ;;
    services)
        echo -e "${GREEN}Available Services:${NC}"
        printf "  %s\n" "${SERVICES[@]}"
        ;;
    clean)
        echo -e "${RED}Warning: This will remove all containers and volumes!${NC}"
        read -p "Are you sure? (y/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            docker compose -f $COMPOSE_FILE down -v
            echo -e "${GREEN}Cleanup complete${NC}"
        else
            echo -e "${YELLOW}Cleanup cancelled${NC}"
        fi
        ;;
    *)
        usage
        exit 1
        ;;
esac