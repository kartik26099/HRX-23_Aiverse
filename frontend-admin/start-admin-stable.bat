@echo off
echo 🚀 Starting DoLab Admin Dashboard
echo =================================

REM Check if port 3003 is in use
netstat -ano | findstr :3003 >nul
if %errorlevel% equ 0 (
    echo ⚠️  Port 3003 is in use. Attempting to kill existing process...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3003') do (
        taskkill /PID %%a /F >nul 2>&1
        echo 🔪 Killed process %%a on port 3003
    )
    timeout /t 2 /nobreak >nul
)

REM Check if port is now available
netstat -ano | findstr :3003 >nul
if %errorlevel% equ 0 (
    echo ❌ Port 3003 is still in use. Please manually kill the process.
    pause
    exit /b 1
)

echo ✅ Port 3003 is available
echo 📁 Starting Next.js development server...

REM Start the development server
npm run dev

pause 