# Server

This directory contains the legacy monolithic backend (Ledger Core) that has been partially migrated into microservices.

## Contents

- `api.ts` — Main Express server with core ledger logic
- `db.ts` — Database connection using Drizzle ORM

## Status

This server is being gradually decomposed. New features should be added to the appropriate microservice instead of this monolith.