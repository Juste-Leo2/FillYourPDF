@echo off
title FillYourPDF - Launcher
echo Checking Node.js installation...

node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Node.js is not installed on your computer.
    echo Node.js is required to run FillYourPDF locally.
    echo.
    echo Press any key to open the Node.js download page...
    pause >nul
    start https://nodejs.org/
    exit /b
)

echo Node.js is installed! Launching the local interface...
node create-fill.js --ui
pause
