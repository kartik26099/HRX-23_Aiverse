@echo off
echo 🤖 Starting AI Platform Backend Services (excluding ai_placement)...
echo.

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed or not in PATH
    echo Please install Python and try again
    pause
    exit /b 1
)

REM Check if we're in the backend directory
if not exist "start_services.py" (
    echo ❌ Please run this script from the backend directory
    echo Current directory: %CD%
    pause
    exit /b 1
)

echo 🚀 Starting all backend services except ai_placement...
echo.
echo Services that will be started:
echo   - AI Advisor (Port 5274)
echo   - Faculty (Port 5000)
echo   - AI Research Helper (Port 5005)
echo   - AI Library (Port 4001)
echo   - DIY Project Evaluator (Port 8000)
echo   - AI Course (Port 5002)
echo   - DIY Scheduler (Port 5003)
echo   - AI DIY (Port 5004)
echo.
echo Press Ctrl+C to stop all services
echo.

REM Start all services except ai_placement
python start_services.py start-all

echo.
echo 🛑 All services stopped
pause 