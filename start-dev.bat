@echo off
echo =========================================
echo   Starting DuitTrack Development Server
echo =========================================
echo.
echo Killing any existing Node processes...
taskkill /F /IM node.exe 2>nul
echo.
echo Starting Vite dev server on port 3000...
echo.
echo Once started, open your browser at:
echo   http://localhost:3000
echo.
echo Press Ctrl+C to stop the server
echo =========================================
echo.
npm run dev -- --port 3000 --host
