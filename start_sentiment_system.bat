@echo off
echo 🚀 Starting Community Sentiment Analysis System
echo ================================================

echo.
echo 📊 Starting Backend (Port 5001)...
cd backend\community_sentiment_analyzer
start "Sentiment Backend" cmd /k "python app.py"

echo.
echo ⏳ Waiting for backend to start...
timeout /t 3 /nobreak > nul

echo.
echo 🌐 Starting Frontend (Port 3002)...
cd ..\..\frontend-admin
start "Sentiment Frontend" cmd /k "npm run dev"

echo.
echo ⏳ Waiting for frontend to start...
timeout /t 5 /nobreak > nul

echo.
echo 🧪 Running API tests...
cd ..\..
python test_sentiment_api.py

echo.
echo ✅ System startup complete!
echo.
echo 📊 Dashboard: http://localhost:3002
echo 🔍 Health Check: http://localhost:5001/api/health
echo.
echo Press any key to exit...
pause > nul 