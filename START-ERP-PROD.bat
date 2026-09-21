@echo off
title AlfaDigi ERP - Production Start
echo ============================================
echo    AlfaDigi ERP - Production (nginx + PM2)
echo ============================================

REM --- MongoDB service (Automatic, but ensure running) ---
net start MongoDB >nul 2>&1

REM --- Backend via PM2 ---
where pm2 >nul 2>&1
if %errorlevel%==0 (
  pm2 resurrect >nul 2>&1
  pm2 list
) else (
  echo [WARN] pm2 not on PATH for this shell.
)

REM --- nginx ---
tasklist /FI "IMAGENAME eq nginx.exe" 2>nul | find /I "nginx.exe" >nul
if errorlevel 1 (
  echo Starting nginx...
  start "" /min C:\nginx\nginx.exe
) else (
  echo nginx already running.
)

echo.
echo ============================================
echo    LIVE: http://localhost  (this PC)
echo    LAN : check ipconfig - http://YOUR-IP/
echo    Health: http://localhost/api/health
echo ============================================
timeout /t 5
