#!/bin/bash
# ============================================================
#  AlfaDigi ERP — Deploy / Update (har naye version pe chalao)
#  Run:  sudo bash deploy-app.sh
#  Code pehle GitHub pe push hona chahiye.
# ============================================================
set -e

APP_DIR=/var/www/alfadigi
cd "$APP_DIR"

echo "============================================"
echo "  AlfaDigi ERP — Deploy"
echo "============================================"

# ---------- 1. Latest code ----------
echo "[1/5] Latest code pull..."
if [ -d .git ]; then
  git pull origin main || git pull origin master
else
  echo "ERROR: $APP_DIR .git nahi hai — pehle repo clone karo:"
  echo "  git clone https://<TOKEN>@github.com/AhmadAli0071/erp-alfadigi.git $APP_DIR"
  exit 1
fi

# ---------- 2. ENV check ----------
echo "[2/5] ENV check..."
if [ ! -f server/.env ]; then
  echo "WARNING: server/.env nahi mila — bana raha hoon template se."
  cp deploy/env.example server/.env
  echo ">>> ZAROORI: nano $APP_DIR/server/.env — JWT_SECRET aur values set karo, phir dobara chalao."
  exit 1
fi
grep -q "JWT_SECRET" server/.env || { echo "ERROR: JWT_SECRET missing in server/.env"; exit 1; }

# ---------- 3. Server build ----------
echo "[3/5] Server build..."
cd "$APP_DIR/server"
npm ci
npm run build
mkdir -p logs

# ---------- 4. Client build ----------
echo "[4/5] Client build..."
cd "$APP_DIR/client"
npm ci
npm run build

# ---------- 5. PM2 reload ----------
echo "[5/5] PM2 reload..."
cd "$APP_DIR"
if pm2 describe alfadigi-erp > /dev/null 2>&1; then
  pm2 reload ecosystem.config.js
else
  pm2 start ecosystem.config.js
  pm2 save
  pm2 startup systemd -u root --hp /root | tail -1 | bash || true
fi
pm2 status

echo ""
echo "============================================"
echo "  Deploy COMPLETE — http://$(hostname -I | awk '{print $1}')"
echo "  Logs: pm2 logs alfadigi-erp"
echo "============================================"
