#!/bin/bash

# Deployment script for LaTeX Code Generator
# This script pulls latest changes, rebuilds services, and restarts containers

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="docker-compose.yml"

# Services to rebuild (can be customized via command line argument)
REBUILD_SERVICES="${1:-backend frontend latex-compiler python-preprocess}"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  LaTeX Code Generator Deployment${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to print status
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "$COMPOSE_FILE" ]; then
    print_error "docker-compose.yml not found. Are you in the project root?"
    exit 1
fi

cd "$PROJECT_DIR"

# Step 1: Git pull
echo -e "${BLUE}[1/4]${NC} Pulling latest changes from Git..."
if git pull; then
    print_status "Git pull successful"
else
    print_warning "Git pull failed or no changes"
fi
echo ""

# Step 2: Check for .env file
echo -e "${BLUE}[2/4]${NC} Checking environment configuration..."
if [ ! -f ".env" ]; then
    print_warning ".env file not found. Make sure environment variables are set in docker-compose.yml or .env"
else
    print_status ".env file found"
fi
echo ""

# Step 3: Rebuild services
echo -e "${BLUE}[3/4]${NC} Rebuilding services..."
print_info "Services to rebuild: $REBUILD_SERVICES"

for service in $REBUILD_SERVICES; do
    echo -e "${BLUE}  →${NC} Rebuilding $service..."
    if docker-compose build --no-cache "$service"; then
        print_status "$service rebuilt successfully"
    else
        print_error "Failed to rebuild $service"
        exit 1
    fi
done
echo ""

# Step 4: Start/restart services
echo -e "${BLUE}[4/4]${NC} Starting/restarting services..."
if docker-compose up -d; then
    print_status "Services started/restarted"
else
    print_error "Failed to start services"
    exit 1
fi
echo ""

# Wait for services to be healthy
echo -e "${BLUE}[Health Check]${NC} Waiting for services to be ready..."
sleep 5

# Check service status
echo ""
echo -e "${BLUE}Service Status:${NC}"
docker-compose ps

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Deployment completed successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Useful commands:${NC}"
echo "  View logs:        docker-compose logs -f [service-name]"
echo "  Check status:     docker-compose ps"
echo "  Stop services:    docker-compose down"
echo "  Restart service:  docker-compose restart [service-name]"
echo ""
