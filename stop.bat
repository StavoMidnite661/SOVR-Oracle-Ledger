@echo off
echo.
echo ================================================
echo     ORACLE LEDGER - STOPPING SYSTEM
echo ================================================
echo.

echo Stopping all services...
docker compose down

echo.
echo ================================================
echo     SYSTEM STOPPED
echo ================================================
echo.
echo All services have been stopped.
echo Data has been preserved.
echo.
echo To start the system again, run: start.bat
echo.
pause