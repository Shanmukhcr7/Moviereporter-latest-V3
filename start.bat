@echo off
:: Set Bun path
set PATH=%USERPROFILE%\.bun\bin;%PATH%

:: Kill any existing Node.js processes on port 3000
echo Killing any existing dev servers...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do (
    taskkill /PID %%a /F >nul 2>&1
)

:: Start Bun dev server
echo Starting Bun dev server...
bun run dev
