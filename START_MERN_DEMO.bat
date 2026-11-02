@echo off
title Smart Patient Monitor — MERN Stack Launcher
color 0B

REM ── Get repo root ──
set "ROOT=%~dp0"
if "%ROOT:~-1%"=="\" set "ROOT=%ROOT:~0,-1%"

echo ============================================================
echo   Smart Patient Monitor (MERN Stack) — Starting All Services
echo ============================================================
echo.
echo   Root Directory: %ROOT%
echo.

REM ── Check backend node_modules ──
if not exist "%ROOT%\backend\node_modules\" (
    echo [!] Backend dependencies not installed. Installing...
    cd /d "%ROOT%\backend"
    call npm install
)

REM ── Check frontend node_modules ──
if not exist "%ROOT%\frontend\node_modules\" (
    echo [!] Frontend dependencies not installed. Installing...
    cd /d "%ROOT%\frontend"
    call npm install
)

REM ── Start Express Backend ──
echo [1/3] Starting Express Backend (Port 5000)...
start "Express Backend" cmd /k "cd /d "%ROOT%\backend" && npm start"

REM ── Wait 3 seconds ──
timeout /t 3 /nobreak >nul

REM ── Start Data Simulator ──
echo [2/3] Starting Telemetry Data Simulator...
start "Telemetry Simulator" cmd /k "cd /d "%ROOT%\backend" && npm run simulator"

REM ── Start React Frontend ──
echo [3/3] Starting React Dashboard (Vite)...
start "React Dashboard" cmd /k "cd /d "%ROOT%\frontend" && npm run dev -- --open"

echo.
echo ============================================================
echo   All MERN Stack services started!
echo   - Backend (Express) : http://localhost:5000
echo   - Frontend (React)   : http://localhost:3000
echo   - Telemetry Stream  : Active (Posting vitals every 2s)
echo.
echo   Close the server windows to stop.
echo ============================================================
pause

