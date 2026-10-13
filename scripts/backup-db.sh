#!/bin/bash
# ============================================
# Oracle Ledger - Automated Database Backup Script
# Retains backups for 30 days
# ============================================

set -e

BACKUP_DIR="$(pwd)/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/oracle_ledger_backup_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "Creating database backup..."
docker compose exec -T db pg_dump -U postgres -d ORACLE-LEDGER | gzip > "$BACKUP_FILE"

echo "Backup created successfully: $BACKUP_FILE"

# Clean up backups older than 30 days
echo "Cleaning up backups older than 30 days..."
find "$BACKUP_DIR" -name "oracle_ledger_backup_*.sql.gz" -type f -mtime +30 -delete

echo "Backup complete."
