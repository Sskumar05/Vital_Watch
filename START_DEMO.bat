@echo off
title Smart Patient Monitor — Launcher
color 0A

echo ============================================================
echo   Smart Patient Monitor — Starting All Services
echo ============================================================
echo.

REM ── Start Flask Backend in a new window ──
echo [1/2] Starting Flask Backend...
start "Flask Backend" cmd /k "cd /d d:\MADHUSRI\backend && python app.py"

REM ── Wait 3 seconds for Flask to boot ──
timeout /t 3 /nobreak >nul

REM ── Start Simulator in a new window ──
echo [2/2] Starting Dummy Data Simulator...
start "Data Simulator" cmd /k "cd /d d:\MADHUSRI\backend && python simulator.py"

REM ── Open Dashboard in browser ──
echo.
echo [3/3] Opening Dashboard in browser...
timeout /t 2 /nobreak >nul
start "" "d:\MADHUSRI\dashboard\index.html"

echo.
echo ============================================================
echo   All services started!
echo   - Flask Backend  : http://localhost:5000
echo   - Dashboard      : d:\MADHUSRI\dashboard\index.html
echo   Close the Flask and Simulator windows to stop.
echo ============================================================
pause
