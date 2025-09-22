@echo off
echo 🚀 Starting Community Sentiment Analyzer...
echo.

cd /d "%~dp0"

echo 📋 Checking Python environment...
python --version
if %errorlevel% neq 0 (
    echo ❌ Python not found! Please install Python 3.8+
    pause
    exit /b 1
)

echo.
echo 📦 Installing dependencies...
pip install flask flask-cors python-dotenv supabase requests

echo.
echo 🔧 Starting server on port 5001...
echo 📊 Health Check: http://localhost:5001/api/health
echo 🔍 Sentiment Analysis: http://localhost:5001/api/sentiment-analysis
echo.

python app.py

pause 