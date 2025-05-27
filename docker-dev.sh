#!/bin/bash

# Docker Development Environment Helper Script
# This script simplifies running the development environment

COMPOSE_FILE="docker/compose/docker-compose.dev.yml"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to display usage
usage() {
    echo "Usage: $0 [command] [options]"
    echo ""
    echo "Commands:"
    echo "  up        Start all services"
    echo "  down      Stop all services"
    echo "  frontend  Start only frontend service"
    echo "  logs      Show logs (use -f for follow)"
    echo "  exec      Execute command in frontend container"
    echo "  build     Rebuild containers"
    echo "  clean     Stop and remove all containers and volumes"
    echo ""
    echo "Examples:"
    echo "  $0 up                    # Start all services"
    echo "  $0 frontend              # Start only frontend"
    echo "  $0 logs -f frontend-dev  # Follow frontend logs"
    echo "  $0 exec npm install axios # Install package in frontend"
}

# Check if docker-compose is installed
if ! command -v docker compose &> /dev/null; then
    echo -e "${RED}Error: docker compose is not installed${NC}"
    exit 1
fi

# Main command handling
case "$1" in
    up)
        echo -e "${GREEN}Starting all development services...${NC}"
        docker compose -f $COMPOSE_FILE up "${@:2}"
        ;;
    down)
        echo -e "${YELLOW}Stopping all services...${NC}"
        docker compose -f $COMPOSE_FILE down "${@:2}"
        ;;
    frontend)
        echo -e "${GREEN}Starting frontend development service...${NC}"
        docker compose -f $COMPOSE_FILE up frontend-dev "${@:2}"
        ;;
    logs)
        docker compose -f $COMPOSE_FILE logs "${@:2}"
        ;;
    exec)
        docker compose -f $COMPOSE_FILE exec frontend-dev "${@:2}"
        ;;
    build)
        echo -e "${GREEN}Building containers...${NC}"
        docker compose -f $COMPOSE_FILE build "${@:2}"
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