#!/bin/bash
# ============================================================
#  AlfaDigi ERP — Ubuntu VPS One-Time Setup
#  Run:  sudo bash vps-setup.sh
#  Fresh Ubuntu 22.04 / 24.04 ke liye — Node 20 + MongoDB 8 +
#  PM2 + Nginx + Certbot + Firewall + Swap
# ============================================================
set -e

if [ "$EUID" -ne 0 ]; then echo "ERROR: sudo/root ke sath chalao: sudo bash vps-setup.sh"; exit 1; fi

APP_DIR=/var/www/alfadigi

echo "============================================"
echo "  AlfaDigi ERP — VPS Setup Shuru"
echo "============================================"

# ---------- 1. System update ----------
echo "[1/9] System update..."
apt update -y && apt upgrade -y

# ---------- 2. Swap (chhoti RAM ke liye zaroori) ----------
echo "[2/9] Swap check..."
if [ ! -f /swapfile ]; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
  echo "vm.swappiness=10" >> /etc/sysctl.conf
  sysctl -p
  echo "2GB swap added"
else
  echo "Swap already exists"
fi

# ---------- 3. Node.js 20 LTS ----------
echo "[3/9] Node.js 20 LTS..."
if ! command -v node &>/dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt install -y nodejs build-essential
fi
node -v

# ---------- 4. MongoDB 8.0 ----------
echo "[4/9] MongoDB 8.0..."
if ! command -v mongod &>/dev/null; then
  curl -fsSL https://www.mongodb.org/static/pgp/server-8.0.asc | gpg -o /usr/share/keyrings/mongodb-server-8.0.gpg --dearmor
  echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/8.0 multiverse" > /etc/apt/sources.list.d/mongodb-org-8.0.list
  apt update -y
  apt install -y mongodb-org
fi
# Security: MongoDB sirf localhost pe — bahar se koi access na ho
MONGO_CONF=/etc/mongod.conf
if grep -q "bindIp:" "$MONGO_CONF"; then
  sed -i "s/bindIp: .*/bindIp: 127.0.0.1/" "$MONGO_CONF"
fi
systemctl enable --now mongod
systemctl status mongod --no-pager | head -3

# ---------- 5. PM2 ----------
echo "[5/9] PM2..."
npm install -g pm2
pm2 -v

# ---------- 6. Nginx + Certbot ----------
echo "[6/9] Nginx + Certbot..."
apt install -y nginx certbot python3-certbot-nginx
systemctl enable --now nginx

# ---------- 7. Firewall ----------
echo "[7/9] Firewall (UFW)..."
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
ufw status

# ---------- 8. App directory ----------
echo "[8/9] App directory..."
mkdir -p "$APP_DIR"

# ---------- 9. PM2 reboot persistence (baad me deploy ke baad finalize hoga) ----------
echo "[9/9] Done!"
echo ""
echo "============================================"
echo "  Setup COMPLETE — agla step:"
echo "  1) Is repo ko $APP_DIR mein clone/paste karo"
echo "  2) sudo bash deploy-app.sh chalao"
echo "  3) Domain ka DNS A record VPS IP pe point karo"
echo "  4) SSL: sudo certbot --nginx -d YOUR_DOMAIN"
echo "============================================"
