# Second Brain — Single Server Production Deployment

Deploy the full Second Brain application (backend + frontend) on a single server using Docker Compose.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Server                             │
│                                                         │
│   ┌─────────────┐         ┌─────────────┐              │
│   │   Frontend   │ ──────► │   Backend   │              │
│   │   (Nginx)    │ :80     │  (Express)  │ :3001        │
│   └─────────────┘         └─────────────┘              │
│         │                        │                     │
│         │                   ┌────┴────┐                │
│         │                   │ SQLite  │                │
│         │                   │   DB    │                │
│         │                   └─────────┘                │
│                                                         │
│   Port 80 ← Public access                              │
└─────────────────────────────────────────────────────────┘
```

## Prerequisites

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| OS | Ubuntu 20.04 / Debian 11 | Ubuntu 22.04+ |
| RAM | 1 GB | 2 GB |
| Disk | 10 GB | 20 GB |
| Docker | 20.10 | 24.0+ |
| Docker Compose | v2.0 | v2.20+ |

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

### 3. Configure environment

```bash
cd Deployment/Production
cp .env.example .env

# Generate encryption key
openssl rand -hex 32

# Edit .env with your values
nano .env
```

### 4. Deploy

```bash
chmod +x deploy.sh
./deploy.sh
```

The app will be available at `http://your-server-ip` (port 80).

## Commands

| Command | Description |
|---------|-------------|
| `./deploy.sh` | Deploy latest from current branch |
| `./deploy.sh --rollback` | Rollback to previous version |
| `./deploy.sh --status` | Show deployment status |
| `./deploy.sh --logs` | Tail container logs |

## Manual Deployment

If you prefer to run commands manually:

```bash
# Build images
docker compose -f docker-compose.prod.yml --env-file .env build --no-cache

# Stop old containers
docker compose -f docker-compose.prod.yml --env-file .env down

# Start new containers
docker compose -f docker-compose.prod.yml --env-file .env up -d

# Check status
docker compose -f docker-compose.prod.yml --env-file .env ps

# View logs
docker compose -f docker-compose.prod.yml --env-file .env logs -f
```

## Server Setup (First Time)

### Install Docker

```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh

# Add user to docker group (log out and back in after)
sudo usermod -aG docker $USER

# Verify
docker --version
docker compose version
```

### Firewall (optional)

```bash
# Allow SSH and HTTP
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## Data & Backups

### Database Location

The SQLite database is stored in a Docker volume named `second-brain-data`.

```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect second-brain-data
```

### Manual Backup

```bash
# Copy database from container
docker cp second-brain-backend-prod:/app/data/second-brain.db ./backup-$(date +%Y%m%d).db

# Or from the volume directly
docker run --rm -v second-brain-data:/data -v $(pwd):/backup alpine \
    cp /data/second-brain.db /backup/backup-$(date +%Y%m%d).db
```

### Restore Backup

```bash
# Stop containers
docker compose -f docker-compose.prod.yml down

# Restore database
docker run --rm -v second-brain-data:/data -v $(pwd):/backup alpine \
    cp /backup/backup-20260101.db /data/second-brain.db

# Start containers
docker compose -f docker-compose.prod.yml up -d
```

## SSL / HTTPS

For HTTPS, use a reverse proxy like Caddy or Nginx in front of the application.

### Option A: Caddy (recommended, auto-SSL)

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
# Restart Caddy
sudo systemctl restart caddy
```

### Option B: Let's Encrypt with Certbot

```bash
# Install certbot
sudo apt install -y certbot

# Get certificate (temporarily stop nginx)
docker compose -f docker-compose.prod.yml stop frontend
sudo certbot certonly --standalone -d secondbrain.example.com

# Add SSL to nginx.conf and restart
docker compose -f docker-compose.prod.yml start frontend
```

## Troubleshooting

### Container won't start

```bash
# Check logs
docker compose -f docker-compose.prod.yml logs backend
docker compose -f docker-compose.prod.yml logs frontend

# Check container status
docker ps -a
```

### Database locked

```bash
# Restart backend
docker compose -f docker-compose.prod.yml restart backend
```

### Port conflict

If port 80 is in use, change `FRONTEND_PORT` in `.env`:

```bash
FRONTEND_PORT=8080
```

Then redeploy:

```bash
./deploy.sh
```

### Out of disk space

```bash
# Clean Docker resources
docker system prune -a --volumes

# Check disk usage
df -h
docker system df
```

## Updating

The deploy script handles updates automatically:

```bash
./deploy.sh
```

This will:
1. Pull latest code from git
2. Back up the database
3. Build new Docker images
4. Replace running containers
5. Verify health checks

## File Structure

```
Deployment/Production/
├── deploy.sh              # Automated deployment script
├── docker-compose.prod.yml # Production Docker Compose config
├── .env.example           # Environment template
├── .env                   # Your environment (git-ignored)
├── backups/               # Database backups (auto-created)
└── README.md              # This file
```

## Differences from Development

| Aspect | Development | Production |
|--------|-------------|------------|
| Frontend port | 5173 (Vite) | 80 (Nginx) |
| Backend port | 3001 (direct) | 3001 (internal) |
| Hot reload | Yes | No |
| Database | Local file | Docker volume |
| Logs | stdout | JSON files (rotated) |
| SSL | No | Optional (reverse proxy) |
