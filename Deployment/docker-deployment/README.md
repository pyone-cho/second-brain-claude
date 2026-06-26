# Second Brain — Docker Deployment

This directory contains everything needed to run the Second Brain application in
production using Docker Compose.

## Architecture

```
Browser (localhost:80 or :443)
       |
       v
  [nginx container]  ← serves React static files, proxies /api → backend
       |
       v
  [Node.js container] ← Express API + SQLite (data on named volume)
```

- **Frontend**: Nginx serves the production-built React app (Vite) and proxies
  `/api/*` requests to the backend service.
- **Backend**: Express API server with SQLite database persisted on a named
  Docker volume.
- **Data**: The SQLite file is bind-mounted from `backend/data/second-brain.db`
  on the host, so it persists on the host filesystem.

## Prerequisites

- [Docker](https://docs.docker.com/engine/install/) 24.0+
- [Docker Compose](https://docs.docker.com/compose/install/) 2.0+

Verify your installation:

```bash
docker --version
docker compose version
```

## Quick Start

```bash
# From this directory
cd Deployment/docker-deployment

# Build images and start containers (detached)
docker compose up -d

# Check that both services are healthy
docker compose ps
```

The application will be available at **http://localhost** once both
containers show `healthy`.

## Access URLs

| Service  | URL                          |
|----------|------------------------------|
| Frontend | http://localhost              |
| API      | http://localhost/api/         |
| Health   | http://localhost/api/health   |

The API is only accessible through the nginx proxy; the backend container does
not expose port 3001 to the host.

## SSL / HTTPS

By default the deployment runs on HTTP only. To enable HTTPS with a
self-signed certificate (for development) or a real certificate (for
production), use the SSL override compose file.

### Option A — Self-signed certificate (development)

```bash
# 1. Generate self-signed certificates
./ssl/generate-self-signed.sh

# 2. Start with the SSL override
docker compose -f docker-compose.yml -f docker-compose.ssl.yml up -d
```

The app is now available at **https://localhost**. Browsers will show a
warning because the certificate is self-signed — click through to proceed.

To issue for a custom domain:

```bash
./ssl/generate-self-signed.sh myapp.local
```

### Option B — Trusted certificate (production / Let's Encrypt)

1. Obtain a certificate from a CA (e.g. [Let's Encrypt](https://letsencrypt.org/)
   with [certbot](https://certbot.eff.org/)).

2. Place the files:
   ```
   ssl/server.crt   ← full chain (cert + intermediates)
   ssl/server.key   ← private key
   ```

3. Start with the SSL override:
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.ssl.yml up -d
   ```

#### Let's Encrypt quick reference

```bash
# Install certbot (Ubuntu/Debian)
sudo apt install certbot

# Obtain a certificate (standalone mode — stop nginx first)
sudo certbot certonly --standalone -d yourdomain.com

# Copy/rename to the ssl directory
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ssl/server.crt
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem   ssl/server.key
sudo chown $(whoami) ssl/server.*

# Start with SSL
docker compose -f docker-compose.yml -f docker-compose.ssl.yml up -d
```

### Custom HTTPS port

Set `HTTPS_PORT` in your `.env` file to use a port other than 443:

```bash
HTTPS_PORT=8443
```

### Disabling HTTP redirect

When using the SSL override, all HTTP (port 80) requests are redirected to
HTTPS. To disable this behaviour, remove port 80 from `docker-compose.yml` or
create a custom nginx config without the redirect block.

## Environment Variables

Copy the example file and adjust as needed:

```bash
cp .env.example .env
```

Edit `.env` to change the host port or backend settings before running
`docker compose up`.

| Variable         | Default | Description                                      |
|------------------|---------|--------------------------------------------------|
| `PORT`           | `3001`  | Backend port inside the container                |
| `NODE_ENV`       | `production` | Node environment                            |
| `ENCRYPTION_KEY` | —       | **Required.** Secret key for data encryption     |
| `FRONTEND_PORT`  | `80`    | Host port for HTTP                               |
| `HTTPS_PORT`     | `443`   | Host port for HTTPS (SSL override only)          |

## Common Operations

### Stopping

```bash
docker compose down
```

This stops and removes containers but **preserves** the named volume (database
data is safe).

To also remove the database volume:

```bash
docker compose down -v
```

### Viewing Logs

```bash
# Follow all logs
docker compose logs -f

# Follow a specific service
docker compose logs -f backend
docker compose logs -f frontend
```

### Rebuilding After Code Changes

```bash
docker compose up -d --build
```

If only one service changed, rebuild just that one:

```bash
docker compose up -d --build backend
docker compose up -d --build frontend
```

### Checking Health Status

```bash
docker compose ps
```

Both services run internal health checks:
- **Backend**: polls `/api/health` every 30 seconds
- **Frontend**: polls `/` every 30 seconds

### Accessing the Backend Container

```bash
docker compose exec backend sh
```

## Data Persistence

The SQLite database is bind-mounted from `backend/data/second-brain.db` on the
host. The data file persists on the host filesystem and survives:

- `docker compose down`
- Container recreation
- Image rebuilds
- System reboots

### Backing Up the Database

Since the database is bind-mounted, you can copy it directly from the host:

```bash
# Create a backup directory
mkdir -p ./backup

# Copy the database file
cp ../../backend/data/second-brain.db ./backup/
```

For an automated approach with safety against writes during copy:

```bash
docker compose exec backend sh -c "sqlite3 /app/data/second-brain.db '.backup /tmp/backup.db'"
docker compose cp backend:/tmp/backup.db ./backup/second-brain.db
```

### Restoring a Backup

```bash
cp ./backup/second-brain.db ../../backend/data/second-brain.db
docker compose restart backend
```

## Troubleshooting

### Port 80 already in use

Change the port in `.env`:

```bash
FRONTEND_PORT=8080
```

Then run `docker compose up -d` again.

### Port 443 already in use

Change the HTTPS port in `.env`:

```bash
HTTPS_PORT=8443
```

Then restart with the SSL override.

### Backend fails to start

1. Check logs: `docker compose logs backend`
2. Common issues:
   - Missing native module dependencies (better-sqlite3 requires build tools
     in the build stage — this is handled by the Dockerfile)
   - Corrupt database file — back up and remove the volume: `docker compose down -v`

### Frontend gets 502 Bad Gateway for API calls

This means the frontend nginx cannot reach the backend. Check:

```bash
docker compose logs backend
docker compose exec frontend wget -qO- http://backend:3001/api/health
```

### SSL certificate errors

- **Browser shows "Not Secure"**: Expected for self-signed certificates. Click
  through the warning or use a trusted CA for production.
- **nginx fails to start with SSL**: Verify the certificate files exist:
  ```bash
  ls -la ssl/server.crt ssl/server.key
  ```
- **Certificate expired**: Regenerate self-signed certs or renew your CA cert.

### Rebuilding from scratch

```bash
docker compose down
docker compose build --no-cache
docker compose up -d
```

## Updating CORS for Custom Domains

If you deploy to a domain other than `localhost` (e.g., a public server), you
need to update the CORS origin in the backend source file
`backend/src/index.ts` and rebuild.

## File Overview

| File                      | Purpose                                      |
|---------------------------|----------------------------------------------|
| `docker-compose.yml`      | Service definitions, volumes, networks       |
| `docker-compose.ssl.yml`  | SSL override (HTTPS + HTTP→HTTPS redirect)   |
| `Dockerfile.backend`      | Multi-stage build for the Express API        |
| `Dockerfile.frontend`     | Multi-stage build for the React app          |
| `nginx.conf`              | Nginx config for HTTP only                   |
| `nginx-ssl.conf`          | Nginx config with SSL termination            |
| `ssl/generate-self-signed.sh` | Script to generate self-signed certs     |
| `.env.example`            | Template for environment variables           |
| `.dockerignore`           | Files excluded from Docker build context     |
