@echo off
echo ==========================================
echo   RestoPOS Frontend Starting...
echo ==========================================
cd /d "%~dp0frontend"
if not exist "node_modules" (
  echo Installing dependencies...
  npm install
)
echo.
echo Frontend running at: http://localhost:5173
echo Press Ctrl+C to stop
echo.
npm run dev
pause
