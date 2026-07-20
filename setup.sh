#!/bin/bash
# ============================================
# Oracle Ledger - One-Command Setup Script
# Run this to get everything running reliably
# ============================================

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║     SOVR ORACLE LEDGER - PRODUCTION SETUP SCRIPT           ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed. Please install Docker Desktop first.${NC}"
    exit 1
fi

if ! command -v docker compose &> /dev/null; then
    echo -e "${RED}Docker Compose is not available. Please update Docker.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker and Docker Compose detected${NC}"

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating .env file from template...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✓ .env file created${NC}"
    echo -e "${YELLOW}⚠️  IMPORTANT: Edit .env with your real credentials before continuing!${NC}"
    echo ""
    read -p "Press Enter after you have edited .env, or Ctrl+C to exit..."
else
    echo -e "${GREEN}✓ .env file already exists${NC}"
fi

# Make backup script executable
chmod +x scripts/backup-db.sh 2>/dev/null || true

echo ""
echo -e "${BLUE}Starting Oracle Ledger (with persistence)...${NC}"

# Start the system
docker compose up --build -d

echo ""
echo -e "${GREEN}Waiting for services to become healthy...${NC}"
sleep 15

# Check status
echo ""
echo -e "${BLUE}Service Status:${NC}"
docker compose ps

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║           SETUP COMPLETE - SYSTEM IS RUNNING               ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "Access the application at: ${BLUE}http://localhost:5000${NC} (or via Vite)"
echo ""
echo -e "${YELLOW}Useful commands:${NC}"
echo "  docker compose logs -f          # View live logs"
echo "  docker compose ps               # Check status"
echo "  docker compose down             # Stop (data preserved)"
echo "  ./scripts/backup-db.sh          # Manual backup"
echo ""
echo -e "${GREEN}Your data will now persist through restarts!${NC}"
echo ""

# Offer to set up cron
read -p "Would you like to set up daily automatic backups via cron? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    CRON_CMD="0 2 * * * cd $(pwd) && ./scripts/backup-db.sh >> $(pwd)/backups/cron.log 2>&1"
    
    # Check if cron job already exists
    if crontab -l 2>/dev/null | grep -q "backup-db.sh"; then
        echo -e "${YELLOW}Cron job already exists.${NC}"
    else
        (crontab -l 2>/dev/null; echo "$CRON_CMD") | crontab -
        echo -e "${GREEN}✓ Daily backup scheduled for 2:00 AM${NC}"
        echo "  Backups will be stored in ./backups/"
    fi
fi

echo ""
echo -e "${GREEN}Setup finished. You can now use Oracle Ledger reliably.${NC}"