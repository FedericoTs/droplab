@echo off
REM Run Next.js dev server from Windows (fixes better-sqlite3 and lightningcss issues)

echo ===================================
echo Starting DropLab Platform
echo ===================================
echo.
echo Note: This runs from Windows to avoid WSL + Native Module issues
echo.

cd /d "%~dp0"

echo Killing any existing Node.js processes...
taskkill /F /IM node.exe 2>nul
if errorlevel 1 (
    echo No existing Node.js processes found.
) else (
    echo Existing Node.js processes terminated.
)
echo.

echo Checking Node.js installation...
node --version
if errorlevel 1 (
    echo ERROR: Node.js not found! Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)
echo.

echo Current directory: %CD%
echo.

echo Starting development server...
echo After server starts, open: http://localhost:3000/campaigns/matrix
echo.
echo Press Ctrl+C to stop the server
echo.

npm run dev

pause
