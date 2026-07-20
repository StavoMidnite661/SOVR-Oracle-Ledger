#!/bin/bash

# ============================================
# Oracle Ledger - Stop Script
# Gracefully stops all services (data is preserved)
# ============================================

echo "╔════════════════════════════════════════════════════════════╗"
echo "║          ORACLE LEDGER - STOPPING SYSTEM                   ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}Stopping all Oracle Ledger services...${NC}"
echo ""

docker compose down

echo ""
echo -e "${GREEN}✓ All services have been stopped.${NC}"
echo ""
echo -e "${GREEN}Data has been preserved.${NC}"
echo -e "To start the system again, run: ${BLUE}./start.sh${NC}"
echo ""