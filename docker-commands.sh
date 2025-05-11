#!/bin/bash

# Colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to display help
show_help() {
    echo -e "${YELLOW}Food Delivery Application - Docker Commands${NC}"
    echo ""
    echo "Usage: ./docker-commands.sh [command]"
    echo ""
    echo "Commands:"
    echo "  start       - Build and start all services"
    echo "  stop        - Stop all services"
    echo "  restart     - Restart all services"
    echo "  logs        - View logs for all services"
    echo "  logs [service] - View logs for a specific service"
    echo "  rebuild     - Rebuild all services"
    echo "  rebuild [service] - Rebuild a specific service"
    echo "  clean       - Stop all services and remove volumes"
    echo "  status      - Show status of all services"
    echo "  help        - Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./docker-commands.sh start"
    echo "  ./docker-commands.sh logs api-gateway"
    echo "  ./docker-commands.sh rebuild frontend"
}

# Function to start all services
start_services() {
    echo -e "${GREEN}Starting all services...${NC}"
    docker-compose up -d
    echo -e "${GREEN}Services started. Access the application at http://localhost${NC}"
}

# Function to stop all services
stop_services() {
    echo -e "${YELLOW}Stopping all services...${NC}"
    docker-compose down
    echo -e "${GREEN}Services stopped.${NC}"
}

# Function to restart all services
restart_services() {
    echo -e "${YELLOW}Restarting all services...${NC}"
    docker-compose restart
    echo -e "${GREEN}Services restarted.${NC}"
}

# Function to view logs
view_logs() {
    if [ -z "$1" ]; then
        echo -e "${GREEN}Viewing logs for all services...${NC}"
        docker-compose logs -f
    else
        echo -e "${GREEN}Viewing logs for $1...${NC}"
        docker-compose logs -f $1
    fi
}

# Function to rebuild services
rebuild_services() {
    if [ -z "$1" ]; then
        echo -e "${YELLOW}Rebuilding all services...${NC}"
        docker-compose build
        docker-compose up -d
    else
        echo -e "${YELLOW}Rebuilding $1...${NC}"
        docker-compose build $1
        docker-compose up -d $1
    fi
    echo -e "${GREEN}Rebuild completed.${NC}"
}

# Function to clean up
clean_up() {
    echo -e "${RED}Stopping all services and removing volumes...${NC}"
    docker-compose down -v
    echo -e "${GREEN}Clean up completed.${NC}"
}

# Function to show status
show_status() {
    echo -e "${GREEN}Service status:${NC}"
    docker-compose ps
}

# Main script logic
case "$1" in
    start)
        start_services
        ;;
    stop)
        stop_services
        ;;
    restart)
        restart_services
        ;;
    logs)
        view_logs $2
        ;;
    rebuild)
        rebuild_services $2
        ;;
    clean)
        clean_up
        ;;
    status)
        show_status
        ;;
    help|*)
        show_help
        ;;
esac 