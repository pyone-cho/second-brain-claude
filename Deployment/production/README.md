# Second Brain — Production Deployment (No Docker)

Deploy the full Second Brain application directly on a single server using Node.js, PM2, and Nginx.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Server                              │
│                                                             │
│   Client ──► Nginx (:80) ──┬──► Static files (frontend/dist)│
│                             │                               │
│                             └──► PM2 ──► Express (:3001)    │
│                                            │                │
│                                       SQLite DB             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

| Component | Role |
|-----------|------|
| **Nginx** | Reverse proxy, static file server, gzip, SSL termination |
| **PM2** | Process manager for Express backend (auto-restart, logs) |
| **Node.js 18** | Runtime for Express backend |
| **SQLite** | Embedded database (no separate DB server needed) |

## Prerequisites

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| OS | Ubuntu 20.04 / Debian 11 | Ubuntu 22.04+ |
| RAM | 512 MB | 1 GB |
| Disk | 5 GB | 10 GB |
| Node.js | 18.x | 18 LTS |
| Nginx | 1.18+ | 1.24+ |

## Quick Start

### 1. SSH into your server

```bash
ssh user@your-server-ip
```

### 2. Clone the repository

```bash
git clone https://github.com/your-org/second-brain-claude.git
cd second-brain-claude
```

### 3. First-time server setup

```bash
cd Deployment/production
chmod +x deploy.sh
./deploy.sh --setup
```

This installs Node.js, PM2, Nginx, and configures the firewall.

### 4. Configure environment

```bash
cp .env.example .env

# Generate encryption key
openssl rand -hex 32

# Edit .env with your values
nano .env
```

### 5. Deploy

```bash
./deploy.sh
```

The app will be available at `http://your-server-ip`.

## Commands

| Command | Description |
|---------|-------------|
| `./deploy.sh` | Deploy latest from current branch |
| `./deploy.sh --setup` | First-time server setup |
| `./deploy.sh --rollback` | Rollback to previous version |
| `./deploy.sh --status` | Show deployment status |
| `./deploy.sh --logs` | Tail backend logs |
| `./deploy.sh --restart` | Restart all services |

## Manual Commands

### PM2 (Backend)

```bash
# View running processes
pm2 list

# View logs
pm2 logs second-brain-backend

# Restart backend
pm2 restart second-brain-backend

# Stop backend
pm2 stop second-brain-backend

# Monitor CPU/Memory
pm2 monit
```

### Nginx

```bash
# Test configuration
sudo nginx -t

# Reload config (no downtime)
sudo systemctl reload nginx

# Restart nginx
sudo systemctl restart nginx

# View error logs
sudo tail -f /var/log/nginx/error.log

# View access logs
sudo tail -f /var/log/nginx/access.log
```

## Data & Backups

### Database Location

```
backend/data/second-brain.db
```

### Manual Backup

```bash
# Copy database
cp backend/data/second-brain.db backups/backup-$(date +%Y%m%d).db
```

### Restore Backup

```bash
# Stop backend
pm2 stop second-brain-backend

# Restore database
cp backups/backup-20260101.db backend/data/second-brain.db

# Start backend
pm2 start second-brain-backend
```

## SSL / HTTPS

### Option A: Caddy (Easiest, Auto-SSL)

```bash
# Install Caddy
sudo apt install -y caddy

# Edit Caddyfile
sudo nano /etc/caddy/Caddyfile
```

Add:

```
secondbrain.example.com {
    reverse_proxy localhost:80
}
```

```bash
sudo systemctl restart caddy
```

### Option B: Let's Encrypt with Certbot

```bash
# Install certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d secondbrain.example.com

# Auto-renewal is configured automatically
sudo certbot renew --dry-run
```

### Option C: Manual SSL

```bash
# Install certbot
sudo apt install -y certbot

# Get certificate (stop nginx temporarily)
sudo systemctl stop nginx
sudo certbot certonly --standalone -d secondbrain.example.com

# Update nginx.conf with SSL config
sudo nano /etc/nginx/sites-available/second-brain
```

Add SSL configuration:

```nginx
server {
    listen 443 ssl http2;
    server_name secondbrain.example.com;

    ssl_certificate /etc/letsencrypt/live/secondbrain.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/secondbrain.example.com/privkey.pem;

    # ... rest of config
}

server {
    listen 80;
    server_name secondbrain.example.com;
    return 301 https://$server_name$request_uri;
}
```

```bash
sudo systemctl start nginx
```

## Server Setup (Manual)

If you prefer to set up the server manually instead of using `--setup`:

### Install Node.js 18

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

### Install Build Tools

```bash
sudo apt install -y build-essential python3
```

### Install PM2

```bash
sudo npm install -g pm2
pm2 startup systemd
```

### Install Nginx

```bash
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

### Configure Firewall

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## Troubleshooting

### Backend won't start

```bash
# Check PM2 logs
pm2 logs second-brain-backend --lines 50

# Check if port is in use
sudo lsof -i :3001

# Restart
pm2 restart second-brain-backend
```

### 502 Bad Gateway

```bash
# Check if backend is running
pm2 list

# Check backend health
curl http://localhost:3001/api/health

# Check nginx error log
sudo tail -f /var/log/nginx/error.log
```

### Database locked

```bash
# Restart backend
pm2 restart second-brain-backend
```

### Port conflict

If port 80 is in use:

```bash
# Find what's using the port
sudo lsof -i :80

# Change FRONTEND_PORT in .env
nano .env
FRONTEND_PORT=8080

# Redeploy
./deploy.sh
```

### Out of disk space

```bash
# Check disk usage
df -h

# Clean npm cache
npm cache clean --force

# Remove old backups
ls -t backups/*.db | tail -n +11 | xargs rm

# Remove old logs
pm2 flush
```

### PM2 process not starting

```bash
# Delete and restart
pm2 delete second-brain-backend
./deploy.sh --restart
```

## Updating

The deploy script handles updates automatically:

```bash
./deploy.sh
```

This will:
1. Pull latest code from git
2. Back up the database
3. Build backend and frontend
4. Reload Nginx config
5. Restart backend via PM2
6. Verify health checks

## File Structure

```
Deployment/production/
├── deploy.sh              # Automated deployment script
├── ecosystem.config.cjs   # PM2 configuration
├── nginx.conf             # Nginx site configuration
├── .env.example           # Environment template
├── .env                   # Your environment (git-ignored)
├── backups/               # Database backups (auto-created)
├── logs/                  # Application logs (auto-created)
└── README.md              # This file
```

## Differences from Docker Deployment

| Aspect | Docker | No Docker |
|--------|--------|-----------|
| Isolation | Container-based | Direct on host |
| Resource usage | Higher (container overhead) | Lower |
| Setup complexity | Docker only | Node.js + PM2 + Nginx |
| Updates | Rebuild images | npm ci + restart |
| Logs | Docker logs | PM2 logs + Nginx logs |
| Database | Docker volume | Direct file access |

## Performance Tuning

### PM2 Cluster Mode

For multi-core servers, edit `ecosystem.config.cjs`:

```javascript
instances: "max",  // Use all CPU cores
exec_mode: "cluster",
```

### Nginx Caching

Add to `nginx.conf` for better performance:

```nginx
# Enable proxy caching
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=100m;

location /api/ {
    proxy_cache api_cache;
    proxy_cache_valid 200 5m;
    # ... rest of config
}
```

### SQLite Optimization

Add to backend environment in `ecosystem.config.cjs`:

```javascript
env: {
    NODE_ENV: "production",
    PORT: 3001,
    SQLITE_CACHE_SIZE: "-2000",  // 2MB cache
    SQLITE_JOURNAL_MODE: "wal",  // Write-ahead logging
}
```
