# Vercel + Turso Deployment

Deploy **Second Brain** to Vercel with Turso (hosted libSQL) as the production database.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Vercel                             │
│                                                         │
│  ┌──────────────┐    ┌──────────────────────────────┐   │
│  │   Frontend   │    │      API (Serverless)        │   │
│  │  Vite Build  │    │   Express in api/index.ts    │   │
│  │  Static HTML │    │   @libsql/client             │   │
│  │  CSS + JS    │    │                              │   │
│  └──────────────┘    └──────────────┬───────────────┘   │
│                                     │                   │
└─────────────────────────────────────┼───────────────────┘
                                      │
                                      ▼
                         ┌────────────────────────┐
                         │     Turso (libSQL)     │
                         │   Hosted SQLite DB     │
                         │   second-brain         │
                         └────────────────────────┘
```

**How it works:**

1. Frontend is a static Vite build served from Vercel's edge CDN
2. API runs as Vercel serverless functions (Express app)
3. API connects to Turso via `@libsql/client` using URL + auth token
4. Database migrations run automatically on first request
5. All `/api/*` routes go to the Express app; everything else serves `index.html`

## Quick Start (Automated)

```bash
./Deployment/vercel-turso/deploy.sh
```

The script will:
1. Check prerequisites (Node.js, npm, Vercel CLI, Turso CLI)
2. Create a Turso database (or use existing)
3. Generate an auth token
4. Test the frontend build
5. Link the Vercel project
6. Set environment variables (production + preview)
7. Deploy to production
8. Verify the health endpoint

## Quick Start (Manual)

### 1. Prerequisites

| Tool | Install |
|------|---------|
| **Node.js 18+** | https://nodejs.org |
| **Vercel CLI** | `npm install -g vercel` |
| **Turso CLI** | `curl -sSfL https://get.tur.so/install.sh \| bash` |

### 2. Create Turso Database

```bash
# Log in
turso auth login

# Create database
turso db create second-brain

# Get connection URL
turso db show second-brain --url
# → libsql://second-brain-<org>.turso.io

# Create auth token
turso db tokens create second-brain
# → eyJhbGciOi...
```

### 3. Deploy to Vercel

```bash
# From project root
vercel --prod
```

On first run, Vercel will:
- Ask you to link or create a project
- Detect the build settings from `vercel.json`
- Build the frontend and deploy

### 4. Set Environment Variables

In the Vercel dashboard (**Settings → Environment Variables**):

| Variable | Value |
|----------|-------|
| `TURSO_DATABASE_URL` | `libsql://second-brain-<org>.turso.io` |
| `TURSO_AUTH_TOKEN` | `<token from step 2>` |

Or via CLI:

```bash
echo "libsql://second-brain-<org>.turso.io" | vercel env add TURSO_DATABASE_URL production
echo "<token>" | vercel env add TURSO_AUTH_TOKEN production
```

### 5. Redeploy

```bash
vercel --prod
```

The env vars are now available to the serverless functions.

### 6. Verify

```bash
curl https://<your-project>.vercel.app/api/health
# → {"status":"ok","timestamp":"..."}
```

## Configuration

### vercel.json

```json
{
  "installCommand": "npm install && cd frontend && npm install",
  "buildCommand": "cd frontend && npm run build",
  "outputDirectory": "frontend/dist",
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api" },
    { "source": "/((?!api/).*)", "destination": "/index.html" }
  ]
}
```

- **installCommand** — Installs both root (API) and frontend dependencies
- **buildCommand** — Builds the Vite frontend
- **outputDirectory** — Where the static build lives
- **rewrites** — Routes `/api/*` to the serverless function, everything else to the SPA

### .vercelignore

Excludes `backend/` (local SQLite dev server) and other non-deployment files from the Vercel build.

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `TURSO_DATABASE_URL` | Turso database URL | Production | `file:./data/second-brain.db` (local SQLite) |
| `TURSO_AUTH_TOKEN` | Turso auth token | Production | — |
| `ENCRYPTION_KEY` | AES-256 key for password encryption | No | Random (passwords don't survive restart) |
| `CORS_ORIGIN` | Allowed CORS origin | No | `http://localhost:5173` |

When `TURSO_DATABASE_URL` is not set, the API falls back to a local SQLite file. This is the default for local development.

## Database

### Turso

Turso is a hosted database service built on libSQL (a fork of SQLite). It provides:

- Global edge replication
- Automatic backups
- Pay-per-query pricing
- SQLite compatibility

### Schema

The database has 7 tables, created automatically on first request:

```
items              — Core item records (id, type, status, pinned, timestamps)
tasks_ordinary     — Ordinary task details
tasks_it_infra     — IT infrastructure task details
readings           — Book/website reading details
purchases          — Purchase/buying details
trips              — Trip plan details
tags               — Tag names
item_tags          — Item-tag relationships (many-to-many)
```

### Migrations

Migrations run lazily on the first API request. The `ensureMigrations()` function in `api/index.ts` uses `CREATE TABLE IF NOT EXISTS`, so it's safe to run multiple times.

### Local Shell

```bash
# Interactive SQL shell
turso db shell second-brain

# Run a query
turso db shell second-brain "SELECT COUNT(*) FROM items"
```

## Troubleshooting

### Build fails with "services" framework error

If Vercel detects `backend/` as a service and sets the framework to "services":

1. The `.vercelignore` should exclude `backend/`
2. If it still fails, temporarily rename `backend/` before deploying:
   ```bash
   mv backend _backend_local
   vercel --prod --yes
   mv _backend_local backend
   ```

### API returns 500

Check that `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` are set in Vercel:
- Dashboard → Settings → Environment Variables
- Redeploy after adding/changing env vars

### Health check fails

The first request to a cold serverless function can take a few seconds. Wait and retry.

### Turso connection timeout

Check that the Turso database region is close to your Vercel deployment region. Default is `aws-eu-west-1`.

### Local development still works?

Yes. The local `backend/` uses SQLite via better-sqlite3. The Turso connection only activates when `TURSO_DATABASE_URL` is set. No changes needed for local dev.

## File Structure

```
Deployment/vercel-turso/
├── README.md          # This file
└── deploy.sh          # Automated deployment script

# Project root files relevant to Vercel:
vercel.json            # Vercel build + routing config
.vercelignore          # Files to exclude from deployment
package.json           # Root dependencies (express, cors, @libsql/client)
api/
└── index.ts           # Express app — all API routes (serverless function)
```

## Useful Commands

```bash
# Deploy
vercel --prod

# Check deployment status
vercel ls

# View logs
vercel logs

# Open project dashboard
vercel open

# Turso database shell
turso db shell second-brain

# Create a new Turso token
turso db tokens create second-brain

# List Turso databases
turso db list
```
