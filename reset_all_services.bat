@echo off
echo 🚀 DoLab Services Reset Script
echo =============================

echo.
echo 🔪 Killing all Node.js processes...
taskkill /f /im node.exe >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Killed Node.js processes
) else (
    echo ℹ️  No Node.js processes found
)

echo.
echo 🔪 Killing all Python processes...
taskkill /f /im python.exe >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Killed Python processes
) else (
    echo ℹ️  No Python processes found
)

echo.
echo 🔪 Killing processes on specific ports...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3003') do (
    taskkill /PID %%a /F >nul 2>&1
    echo 🔪 Killed process %%a on port 3003
)

for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5001') do (
    taskkill /PID %%a /F >nul 2>&1
    echo 🔪 Killed process %%a on port 5001
)

for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3010') do (
    taskkill /PID %%a /F >nul 2>&1
    echo 🔪 Killed process %%a on port 3010
)

echo.
echo ⏳ Waiting for processes to fully terminate...
timeout /t 3 /nobreak >nul

echo.
echo 🧹 Cleaning Next.js cache...
if exist "frontend-admin\.next" (
    rmdir /s /q "frontend-admin\.next" >nul 2>&1
    echo ✅ Cleaned frontend-admin cache
)

if exist "frontend\.next" (
    rmdir /s /q "frontend\.next" >nul 2>&1
    echo ✅ Cleaned frontend cache
)

echo.
echo ✅ Reset completed! You can now start services fresh.
echo.
echo 📋 Next steps:
echo    1. Start backend: cd backend && python start_sentiment_stable.py
echo    2. Start frontend-admin: cd frontend-admin && npm run dev
echo.
pause 