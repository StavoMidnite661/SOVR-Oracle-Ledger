# Database

This folder contains the initial database setup script for Oracle Ledger.

## Contents

- `init.sql` — Automatic database initialization script

## Purpose

The `init.sql` script runs automatically when the PostgreSQL container starts for the first time. It creates:

- `system_logs` table (for general logging)
- `audit_trails` table (for compliance events)
- `pci_audit_log` table (for sensitive access logging)
- Necessary indexes for performance

## Important Notes

- This script only runs on **first container startup**
- Existing data is never overwritten
- The main schema is managed by Drizzle ORM (`shared/schema.ts`)

## Manual Execution

If needed, you can run the script manually:

```bash
docker compose exec db psql -U postgres -d ORACLE_LEDGER -f /docker-entrypoint-initdb.d/init.sql
```