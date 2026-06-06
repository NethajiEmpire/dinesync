@echo off
echo ==========================================
echo   RestoPOS Backend Starting...
echo ==========================================
cd /d "%~dp0backend"
if not exist "node_modules" (
  echo Installing dependencies...
  npm install
)
echo.
echo Backend running at: http://localhost:3001
echo Press Ctrl+C to stop
echo.
node server.js
pause
