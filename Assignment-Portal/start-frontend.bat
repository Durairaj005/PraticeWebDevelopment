@echo off
echo ========================================
echo Starting Frontend Server...
echo ========================================
powershell -Command "Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process -Force; $env:Path += ';E:\nodejs'; cd '%~dp0frontend'; npm run dev"
pause
