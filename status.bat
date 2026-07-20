@echo off
echo.
echo ================================================
echo     ORACLE LEDGER - SYSTEM STATUS
echo ================================================
echo.

echo Docker Compose Service Status:
echo.

docker compose ps

echo.
echo ================================================
echo     Quick Commands
echo ================================================
echo.
echo   start.bat           ^(Start the system^)
echo   stop.bat            ^(Stop the system^)
echo   docker compose logs -f   ^(View live logs^)
echo.
pause