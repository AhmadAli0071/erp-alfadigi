# AlfaDigi ERP — VPS Deployment Guide (Roman Urdu)

## Step 0: VPS Kharido
- Provider: Hostinger / Contabo / DigitalOcean
- Plan: 2 vCPU, 4GB RAM, 40GB SSD
- OS: **Ubuntu 24.04** (ya 22.04)
- Milne ke baad email se **IP + root password** milega

## Step 1: VPS Se Connect (apne laptop se)
```bash
ssh root@VPS_KA_IP
```

## Step 2: One-Time Setup (15-20 min)
```bash
# Ye repo ka deploy folder VPS pe le jao (git clone ya scp)
sudo bash vps-setup.sh
```
Ye khud install karega: Node 20, MongoDB 8 (localhost-only), PM2, Nginx, Certbot, Firewall, 2GB Swap

## Step 3: Code VPS Pe Lao
GitHub repo private hai — **Personal Access Token** banao:
- GitHub → Settings → Developer settings → Personal access tokens → Generate (repo scope)

Phir VPS pe:
```bash
cd /var/www
git clone https://TOKEN@github.com/AhmadAli0071/erp-alfadigi.git alfadigi
```

## Step 4: Secrets Set Karo
```bash
cp deploy/env.example server/.env
nano server/.env
# JWT_SECRET mein naya strong secret daalo:
# node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## Step 5: Deploy
```bash
sudo bash deploy-app.sh
```
Ab app chal rahi hai: PM2 (auto-restart) + Nginx (port 80)

## Step 6: Domain + SSL
1. Domain provider (jaise Namecheap) pe **A record** banao:
   - `erp.yourdomain.com` → VPS KA IP
2. Nginx config mein domain daalo:
   ```bash
   nano /etc/nginx/sites-available/alfadigi
   # server_name erp.yourdomain.com
   nginx -t && systemctl reload nginx
   ```
3. Free SSL (Let's Encrypt):
   ```bash
   sudo certbot --nginx -d erp.yourdomain.com
   ```
   ✅ Ab `https://erp.yourdomain.com` live hai — auto-renew bhi ho jata hai

## Step 7: Pehla SuperAdmin Banao
```bash
cd /var/www/alfadigi/server
npm run seed        # fresh DB pe default accounts bana deta hai
```

## Rozana Ka Kaam (updates)
Laptop pe code change karke:
```bash
git add . && git commit -m "update" && git push
```
VPS pe:
```bash
cd /var/www/alfadigi && sudo bash deploy-app.sh
```

## Useful Commands (VPS pe)
| Kaam | Command |
|---|---|
| App status | `pm2 status` |
| Live logs | `pm2 logs alfadigi-erp` |
| Restart | `pm2 restart alfadigi-erp` |
| MongoDB status | `systemctl status mongod` |
| Nginx restart | `systemctl restart nginx` |
| Reboot ke baad | Sab auto-start (pm2 startup + systemd enabled) |

## Security (jo setup khud karta hai)
- MongoDB sirf `127.0.0.1` pe bind — bahar se koi access nahi
- Firewall: sirf SSH(22), HTTP(80), HTTPS(443) open
- SSL: HTTPS force (certbot)
- Naya JWT_SECRET (laptop wala reuse na karo)

## Data Migration (laptop → VPS) — OPTIONAL
Agar laptop ka existing data VPS pe chahiye:
```bash
# LAPTOP pe (PowerShell):
mongodump --db erp_alfadigi --out C:\temp\dbdump

# VPS pe dump folder upload karke:
mongorestore --db erp_alfadigi /path/to/dbdump/erp_alfadigi
```
