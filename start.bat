@echo off
cls
echo Starting BetterMao IM...
echo ========================

:: Check Node.js version
echo Checking Node.js version...
node -v

:: Create logs directory
mkdir logs 2>nul

:: Start backend server
echo Starting backend server...
start "Backend Server" cmd /c "node app.js > logs\backend.log 2>&1"

:: Wait for backend to start
echo Waiting for backend (3 seconds)...
timeout /t 3 >nul

:: Start frontend server
echo Starting frontend server...
start "Frontend Server" cmd /c "cd ui && npm install && npm run dev"

:: Wait for frontend to start
echo Waiting for frontend (10 seconds)...
timeout /t 10 >nul

:: Open browser
echo Opening browser...
start http://localhost:5173

echo ========================
echo BetterMao IM started!
echo ========================
echo Backend: http://localhost:3000
echo Frontend: http://localhost:5173
echo 
echo Press any key to close this window...
pause
