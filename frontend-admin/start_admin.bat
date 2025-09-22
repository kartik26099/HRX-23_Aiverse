@echo off
echo 🚀 Starting DoLab Admin Dashboard...
echo.

cd /d "%~dp0"

echo 🔧 Killing any existing processes on port 3010...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3010') do (
    echo Killing process %%a
    taskkill /f /pid %%a 2>nul
)

echo.
echo 📦 Installing dependencies...
npm install

echo.
echo 🔧 Starting admin dashboard on port 3010...
echo 📊 Admin Dashboard: http://localhost:3010
echo.

npm run dev

pause 