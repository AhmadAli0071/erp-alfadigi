@echo off
title AlfaDigi ERP Server
echo ================================================
echo   AlfaDigi ERP - Starting services...
echo ================================================

REM --- 1. MongoDB (agar chal nahi raha) ---
tasklist /FI "IMAGENAME eq mongod.exe" 2>nul | find /I "mongod.exe" >nul
if errorlevel 1 (
  echo Starting MongoDB...
  start "" /min "C:\mongodb\mongodb-win32-x86_64-windows-8.0.4\bin\mongod.exe" --dbpath C:\data\db
  timeout /t 4 /nobreak >nul
) else (
  echo MongoDB already running.
)

REM --- 2. ERP Server (agar chal nahi raha) ---
netstat -ano | find ":5000" | find "LISTENING" >nul
if errorlevel 1 (
  echo Starting AlfaDigi ERP server on port 5000...
  cd /d A:\AlfaDigi-ERP\server
  start "AlfaDigi-ERP" /min cmd /c "npx tsx src/index.ts"
  echo Server started.
) else (
  echo ERP server already running.
)

echo ================================================
echo   Company employees: http://192.168.100.30:5000
echo ================================================
timeout /t 5
