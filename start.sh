#!/bin/bash

# ============================================
# Oracle Ledger - Smart Startup Script
# Starts all services and waits for them to be healthy
# ============================================

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║          ORACLE LEDGER - STARTING SYSTEM                   ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if Docker is installed and running
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker Desktop first.${NC}"
    exit 1
fi

if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker Desktop.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker is running${NC}"

# Start all services
echo -e "${BLUE}Starting all services...${NC}"
docker compose up -d

echo ""
echo -e "${YELLOW}Waiting for services to become healthy...${NC}"

# Function to wait for a service to be healthy
wait_for_service() {
    local service=$1
    local max_attempts=30
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if docker compose ps $service | grep -q "(healthy)"; then
            echo -e "${GREEN}✓ $service is healthy${NC}"
            return 0
        fi
        
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo -e "\n${YELLOW}⚠ $service did not become healthy in time (may still be starting)${NC}"
    return 1
}

# Wait for critical services
echo ""
wait_for_service "db"
wait_for_service "ledger-core"
wait_for_service "gateway"

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║           ORACLE LEDGER IS RUNNING                         ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Show service status
echo -e "${BLUE}Service Status:${NC}"
docker compose ps

echo ""
echo -e "${GREEN}🌐 Access the application at: ${BLUE}http://localhost:5000${NC}"
echo ""
echo -e "${YELLOW}Useful commands:${NC}"
echo "  docker compose logs -f          # View live logs"
echo "  docker compose ps               # Check status"
echo "  docker compose down             # Stop system (data preserved)"
echo "  ./scripts/backup-db.sh          # Manual backup"
echo ""
echo -e "${GREEN}All services are now running with automatic restart enabled.${NC}"