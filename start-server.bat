@echo off
title AlfaDigi ERP - Server Starter
setLocal EnableDelayedExpansion
echo ============================================
echo    AlfaDigi ERP - Starting Live Server
echo ============================================
echo.

REM ---- Current LAN IP detect ----
set "LANIP=unknown"
for /f %%i in ('powershell -NoProfile -Command "(Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notmatch '^(127\.|169\.)' } | Select-Object -First 1).IPAddress"') do set "LANIP=%%i"

REM ---- 1. MongoDB start (agar chal nahi raha) ----
netstat -ano | findstr ":27017" | findstr "LISTENING" >nul 2>&1
if %errorlevel%==0 (
    echo [OK] MongoDB already running
) else (
    echo [..] Starting MongoDB...
    start "MongoDB" /min "C:\mongodb\mongodb-win32-x86_64-windows-8.0.4\bin\mongod.exe" --dbpath C:\data\db
    timeout /t 6 /nobreak >nul
)

REM ---- 2. ERP Server start (agar chal nahi raha) ----
netstat -ano | findstr ":5000" | findstr "LISTENING" >nul 2>&1
if %errorlevel%==0 (
    echo [OK] ERP Server already running
) else (
    echo [..] Starting ERP Server...
    cd /d A:\AlfaDigi-ERP\server
    start "AlfaDigi ERP Server" /min cmd /c "node dist/index.js > server.log 2> server.err.log"
    timeout /t 6 /nobreak >nul
)

echo.
echo ============================================
echo    Server LIVE hai:
echo    Laptop:  http://localhost:5000
echo    Network: http://!LANIP!:5000
echo ============================================
echo    NOTE: IP change hota rehta hai — ye URL
echo    har bar naya ho sakta hai.
echo ============================================
echo.
pause
