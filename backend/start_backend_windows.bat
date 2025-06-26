@echo off
echo ========================================
echo    AI Platform Backend Services
echo ========================================
echo.
echo Starting all backend services...
echo.
echo IMPORTANT: Keep this window open!
echo If you close it, all services will stop.
echo.
echo Press Ctrl+C to stop all services
echo.

cd /d "%~dp0"
python start_services.py start-all

echo.
echo Backend services stopped.
pause 