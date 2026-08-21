@echo off
title Smart Patient Monitor — Launcher
color 0A

REM ── Get the directory this .bat file lives in (works from any cloned path) ──
set "ROOT=%~dp0"
REM Remove trailing backslash
if "%ROOT:~-1%"=="\" set "ROOT=%ROOT:~0,-1%"

echo ============================================================
echo   Smart Patient Monitor — Starting All Services
echo ============================================================
echo.
echo   Repo root: %ROOT%
echo.

REM ── Start Flask Backend in a new window ──
echo [1/2] Starting Flask Backend...
start "Flask Backend" cmd /k "cd /d "%ROOT%\backend" && python app.py"

REM ── Wait 3 seconds for Flask to boot ──
timeout /t 3 /nobreak >nul

REM ── Start Simulator in a new window ──
echo [2/2] Starting Dummy Data Simulator...
start "Data Simulator" cmd /k "cd /d "%ROOT%\backend" && python simulator.py"

REM ── Open Dashboard in browser ──
echo.
echo [3/3] Opening Dashboard in browser...
timeout /t 2 /nobreak >nul
start "" "%ROOT%\dashboard\index.html"

echo.
echo ============================================================
echo   All services started!
echo   - Flask Backend  : http://localhost:5000
echo   - Dashboard      : %ROOT%\dashboard\index.html
echo   Close the Flask and Simulator windows to stop.
echo ============================================================
pause
