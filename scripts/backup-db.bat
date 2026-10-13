@echo off
set TIMESTAMP=%date:~10,4%%date:~4,2%%date:~7,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%
set BACKUP_DIR=backups
if not exist %BACKUP_DIR% mkdir %BACKUP_DIR%
set BACKUP_FILE=%BACKUP_DIR%\oracle_ledger_backup_%TIMESTAMP%.sql
echo Creating database backup...
docker compose exec -T db pg_dump -U postgres -d ORACLE-LEDGER > %BACKUP_FILE%
echo Backup created: %BACKUP_FILE%
