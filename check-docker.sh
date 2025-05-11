#!/bin/bash

# Colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Checking Docker and Docker Compose installation...${NC}"

# Check if Docker is installed
if command -v docker &> /dev/null; then
    echo -e "${GREEN}Docker is installed.${NC}"
    docker --version
else
    echo -e "${RED}Docker is not installed. Please install Docker first.${NC}"
    echo -e "Visit https://docs.docker.com/get-docker/ for installation instructions."
    exit 1
fi

# Check if Docker Compose is installed
if command -v docker-compose &> /dev/null; then
    echo -e "${GREEN}Docker Compose is installed.${NC}"
    docker-compose --version
else
    echo -e "${RED}Docker Compose is not installed. Please install Docker Compose first.${NC}"
    echo -e "Visit https://docs.docker.com/compose/install/ for installation instructions."
    exit 1
fi

# Check if Docker daemon is running
if docker info &> /dev/null; then
    echo -e "${GREEN}Docker daemon is running.${NC}"
else
    echo -e "${RED}Docker daemon is not running. Please start Docker first.${NC}"
    exit 1
fi

echo -e "${GREEN}All requirements are met. You can now run the application using Docker Compose.${NC}"
echo -e "Run ${YELLOW}./docker-commands.sh start${NC} to start the application." 