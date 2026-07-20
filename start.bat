@echo off
setlocal enabledelayedexpansion

echo.
echo ================================================
echo     ORACLE LEDGER - STARTING SYSTEM
echo ================================================
echo.

:: Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not running. Please start Docker Desktop first.
    pause
    exit /b 1
)

echo [OK] Docker is running
echo.

echo Starting all services...
docker compose up -d

echo.
echo Waiting for services to become healthy...
echo.

:: Simple wait (you can improve this later with health checks)
timeout /t 15 /nobreak >nul

echo.
echo ================================================
echo     ORACLE LEDGER IS RUNNING
echo ================================================
echo.
echo Service Status:
docker compose ps

echo.
echo Access the application at: http://localhost:5000
echo.
echo Useful commands:
echo   docker compose logs -f     ^(View live logs^)
echo   docker compose ps          ^(Check status^)
echo   docker compose down        ^(Stop system^)
echo   scripts\backup-db.bat      ^(Manual backup^)
echo.
echo All services will restart automatically on failure.
echo.
pause