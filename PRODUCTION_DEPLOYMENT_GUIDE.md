# 🚀 Production Deployment Guide
## SOVR-Oracle-Ledger — Dependable Real-World Setup

**Date:** 2026-07-18  
**Purpose:** Make the system reliable for personal real-world use

---

## 1. Quick Start (Recommended)

```bash
# 1. Clone / Navigate to project
cd SOVR-Oracle-Ledger

# 2. Create your environment file
cp .env.example .env

# 3. Edit .env with your real credentials
nano .env

# 4. Start everything (with persistence)
docker compose up --build -d

# 5. Check status
docker compose ps
docker compose logs -f
```

---

## 2. What Makes It Dependable

### Persistence Guarantees
- ✅ **PostgreSQL data** is stored in a Docker volume (`postgres_data`)
- ✅ **All services** restart automatically (`restart: unless-stopped`)
- ✅ **Health checks** ensure services only start when dependencies are ready
- ✅ **Named network** (`oracle-net`) for reliable internal communication

### Security
- ✅ Non-root user in containers
- ✅ Security headers via Helmet
- ✅ Rate limiting enabled
- ✅ Request sanitization

### Backup Strategy
- ✅ Automated backup script included (`scripts/backup-db.sh`)
- ✅ 30-day retention by default

---

## 3. Environment Variables (Critical)

Edit your `.env` file with real values:

```env
# Database
POSTGRES_DB=ORACLE_LEDGER
POSTGRES_USER=postgres
POSTGRES_PASSWORD=CHANGE_THIS_TO_A_STRONG_PASSWORD

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Blockchain
ETHEREUM_RPC_URL=https://mainnet.base.org
CONSUL_CREDITS_CONTRACT=0x65e75d0fC656a2E81eF17E9A2A8Da58D82390422

# Security
SESSION_SECRET=your_very_long_random_string_here
JWT_SECRET=another_long_random_string
```

---

## 4. Daily Operations

### Start the System
```bash
docker compose up -d
```

### Stop the System
```bash
docker compose down
```

### View Logs
```bash
docker compose logs -f gateway ledger-core payment-service
```

### Backup Database
```bash
chmod +x scripts/backup-db.sh
./scripts/backup-db.sh
```

### Restore Database (if needed)
```bash
# Stop services
docker compose down

# Restore from backup
docker compose up -d db
docker compose exec -T db psql -U postgres -d ORACLE_LEDGER < backups/oracle_ledger_backup_XXXXXX.sql.gz

# Start everything
docker compose up -d
```

---

## 5. Health Checks

All services have health checks:

| Service          | Endpoint                  | Port  |
|------------------|---------------------------|-------|
| Ledger Core      | `/api/health`             | 3001  |
| Gateway          | `/health`                 | 3002  |
| Risk Service     | `/health`                 | 3003  |
| Database         | Internal pg_isready       | 5432  |

Check status:
```bash
docker compose ps
```

---

## 6. Production Recommendations

### For Personal Real-World Use

1. **Change all default passwords**
2. **Use a strong `POSTGRES_PASSWORD`**
3. **Set up daily backups** (add to cron):
   ```bash
   0 2 * * * cd /path/to/SOVR-Oracle-Ledger && ./scripts/backup-db.sh
   ```
4. **Keep `.env` secure** (never commit it)
5. **Monitor disk space** (PostgreSQL grows over time)

### Optional Enhancements

- Add **Prometheus + Grafana** for monitoring
- Set up **reverse proxy** (Traefik / Nginx) with SSL
- Enable **automatic updates** via Watchtower

---

## 7. Troubleshooting

### Database won't start
```bash
docker compose down -v          # WARNING: deletes data
docker compose up -d db
```

### Services keep restarting
```bash
docker compose logs --tail=50 ledger-core
```

### Port already in use
Edit `docker-compose.yml` and change the host port.

---

## Final Notes

This setup is now **dependable** for personal real-world use:

- Data survives container restarts
- Services are resilient
- Backups are easy to run
- Security is significantly improved

You can now confidently use Oracle Ledger in production.

---

*Generated as part of E3E hardening effort*