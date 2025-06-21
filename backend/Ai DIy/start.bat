@echo off
echo 🚀 Starting AI DIY Project Generator Backend...
echo 📍 Backend URL: http://localhost:5000
echo 🔗 API Endpoints:
echo    - POST /api/generate-roadmap
echo    - POST /api/extract-video-id
echo    - POST /api/get-transcript
echo    - GET  /health
echo ==================================================

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed or not in PATH
    pause
    exit /b 1
)

REM Check if requirements are installed
echo 📦 Checking dependencies...
pip show flask >nul 2>&1
if errorlevel 1 (
    echo 📥 Installing dependencies...
    pip install -r requirements.txt
)

REM Start the Flask app
echo 🎯 Starting Flask server...
python start.py

pause 