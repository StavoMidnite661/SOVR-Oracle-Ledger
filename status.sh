#!/bin/bash

# ============================================
# Oracle Ledger - Status Script
# Shows the current state of all services
# ============================================

echo "╔════════════════════════════════════════════════════════════╗"
echo "║          ORACLE LEDGER - SYSTEM STATUS                     ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Docker Compose Service Status:${NC}"
echo ""

docker compose ps

echo ""
echo -e "${BLUE}Health Summary:${NC}"

# Count services
TOTAL=$(docker compose ps --services | wc -l)
RUNNING=$(docker compose ps | grep -c "Up")
HEALTHY=$(docker compose ps | grep -c "(healthy)")

echo -e "  Total services:     $TOTAL"
echo -e "  Currently running:  $RUNNING"
echo -e "  Healthy:            $HEALTHY"

echo ""

# Check if any services are down
if docker compose ps | grep -q "Exit"; then
    echo -e "${RED}⚠ Some services have exited unexpectedly.${NC}"
else
    echo -e "${GREEN}✓ All services appear to be running normally.${NC}"
fi

echo ""
echo -e "${YELLOW}Quick Commands:${NC}"
echo "  ./start.sh          → Start the system"
echo "  ./stop.sh           → Stop the system"
echo "  docker compose logs -f → View live logs"
echo ""