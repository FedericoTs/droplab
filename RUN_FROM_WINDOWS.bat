@echo off
REM Run Next.js dev server from Windows (fixes better-sqlite3 issue)

echo ===================================
echo Starting DropLab Platform
echo ===================================
echo.
echo Note: This runs from Windows to avoid WSL + better-sqlite3 issues
echo.

cd /d "%~dp0"

echo Checking Node.js installation...
node --version
echo.

echo Starting development server...
echo.

npm run dev

pause
