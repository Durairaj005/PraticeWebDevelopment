@echo off
title Assignment Portal - Starting...
color 0A

echo.
echo ========================================
echo   ASSIGNMENT SUBMISSION PORTAL
echo ========================================
echo.
echo Starting Backend and Frontend servers...
echo.
echo [1/2] Starting Backend (FastAPI)...
start "Backend Server" cmd /k "cd /d %~dp0backend && python main.py"

timeout /t 3 /nobreak >nul

echo [2/2] Starting Frontend (React + Vite)...
start "Frontend Server" powershell -Command "Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process -Force; $env:Path += ';E:\nodejs'; cd '%~dp0frontend'; npm run dev; Read-Host 'Press Enter to exit'"

timeout /t 2 /nobreak >nul

echo.
echo ========================================
echo   SERVERS STARTED!
echo ========================================
echo.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:3001
echo API Docs: http://localhost:8000/docs
echo.
echo Opening browser...
timeout /t 3 /nobreak >nul
start http://localhost:3001

echo.
echo Both servers are running in separate windows.
echo Close those windows to stop the servers.
echo.
pause
