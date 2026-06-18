# Second Brain — Docker Deployment

This directory contains everything needed to run the Second Brain application in
production using Docker Compose.

## Architecture

```
Browser (localhost:8080)
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
- **Data**: The SQLite file lives on a named volume (`db-data`) and survives
  container restarts, recreations, and upgrades.

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

The application will be available at **http://localhost:8080** once both
containers show `healthy`.

## Access URLs

| Service  | URL                        |
|----------|----------------------------|
| Frontend | http://localhost:8080      |
| API      | http://localhost:8080/api/ |
| Health   | http://localhost:8080/api/health |

The API is only accessible through the nginx proxy; the backend container does
not expose port 3001 to the host.

## Environment Variables

Copy the example file and adjust as needed:

```bash
cp .env.example .env
```

Edit `.env` to change the host port or backend settings before running
`docker compose up`.

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

The SQLite database is stored on a named volume (`db-data`). This volume
survives:

- `docker compose down` (unless `-v` is used)
- Container recreation
- Image rebuilds
- System reboots

To see where Docker stores the volume data:

```bash
docker volume inspect second-brain-db-data
```

### Backing Up the Database

```bash
# Create a backup directory
mkdir -p ./backup

# Copy the database file from the backend container
docker compose cp backend:/app/data/second-brain.db ./backup/
```

For an automated approach with safety against writes during copy:

```bash
docker compose exec backend sh -c "sqlite3 /app/data/second-brain.db '.backup /tmp/backup.db'"
docker compose cp backend:/tmp/backup.db ./backup/second-brain.db
```

### Restoring a Backup

```bash
docker compose cp ./backup/second-brain.db backend:/app/data/second-brain.db
docker compose restart backend
```

## Troubleshooting

### Port 8080 already in use

Change the port in `.env`:

```
FRONTEND_PORT=3000
```

Then run `docker compose up -d` again.

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

| File                 | Purpose                                  |
|----------------------|------------------------------------------|
| `docker-compose.yml` | Service definitions, volumes, networks   |
| `Dockerfile.backend` | Multi-stage build for the Express API    |
| `Dockerfile.frontend`| Multi-stage build for the React app      |
| `nginx.conf`         | Nginx config (proxy, SPA fallback, gzip) |
| `.env.example`       | Template for environment variables       |
| `.dockerignore`      | Files excluded from Docker build context |
