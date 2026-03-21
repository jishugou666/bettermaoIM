@echo off
echo ==========================================
echo       Starting BetterMao System
echo ==========================================

echo [1/3] Starting Backend Server...
start "BetterMao Server" cmd /k "cd server && npm run dev"

echo [2/3] Starting Frontend Client...
start "BetterMao Client" cmd /k "cd client && npm run dev"

echo [3/3] Opening Browser...
echo Waiting for services to initialize (5 seconds)...
timeout /t 5 >nul
start http://localhost:5173

echo ==========================================
echo       System Started Successfully!
echo ==========================================
echo You can close this window, but keep the other two windows open.
pause
