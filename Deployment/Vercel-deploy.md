# Deploying to Vercel — Step-by-Step Guide

> A complete guide to deploying the **Second Brain** app (Vite + React frontend, Express backend) to Vercel.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Install the Vercel CLI](#2-install-the-vercel-cli)
3. [Login to Vercel](#3-login-to-vercel)
4. [Project Setup](#4-project-setup)
5. [Configure Environment Variables](#5-configure-environment-variables)
6. [Preview Deployment](#6-preview-deployment)
7. [Production Deployment](#7-production-deployment)
8. [Custom Domain Setup](#8-custom-domain-setup)
9. [CI/CD with Git Integration](#9-cicd-with-git-integration)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Prerequisites

| Requirement | Details |
|---|---|
| **Node.js** | v18+ recommended |
| **Vercel Account** | Sign up free at [vercel.com](https://vercel.com) |
| **Git Repository** | Your project pushed to GitHub, GitLab, or Bitbucket |
| **Project builds locally** | Run `npm run build` in `frontend/` to confirm |

---

## 2. Install the Vercel CLI

```bash
# Install globally
npm install -g vercel

# Or use without installing
npx vercel
```

Verify the installation:

```bash
vercel --version
```

---

## 3. Login to Vercel

```bash
vercel login
```

This opens a browser for authentication. After logging in, confirm with:

```bash
vercel whoami
```

---

## 4. Project Setup

### 4.1 Link Your Local Project

Navigate to your project root and link it to Vercel:

```bash
cd /path/to/second-brain-claude
vercel link
```

You'll be prompted to:

- **Select a scope** — your personal account or a team
- **Link to an existing project?** — select `N` for a new project
- **Project name** — accept the default or type a custom name (e.g., `second-brain`)
- **Directory where code is located** — if your frontend is in a subdirectory (e.g., `frontend/`), specify it here

### 4.2 Framework Detection

Since this project uses **Vite**, Vercel auto-detects it. The default settings are:

| Setting | Value |
|---|---|
| **Framework Preset** | Vite |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

If your frontend lives in a subdirectory, Vercel will ask during `vercel link`. You can also configure this later in **Project Settings → General** on the Vercel dashboard.

### 4.3 Project Structure for Monorepo

If deploying the frontend from a subdirectory like `frontend/`:

```
second-brain-claude/
├── frontend/          ← Deploy this directory
│   ├── package.json
│   ├── vite.config.ts
│   ├── src/
│   └── dist/          ← Build output
├── backend/           ← Deploy separately or use a different service
└── Deployment/
```

When linking, specify `frontend` as the root directory.

---

## 5. Configure Environment Variables

### 5.1 Add Variables via CLI

```bash
# Add a single variable (interactive — prompts for value and environment)
vercel env add VARIABLE_NAME

# Example: add a backend API URL
vercel env add VITE_API_URL
```

When prompted, select which environments to apply it to:

- **Production** — live site
- **Preview** — preview deployments
- **Development** — local dev (pulled via `vercel env pull`)

### 5.2 Add Variables via Dashboard

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your project
3. Navigate to **Settings → Environment Variables**
4. Add key-value pairs for each environment

### 5.3 Pull Variables for Local Development

Download environment variables to a local `.env` file:

```bash
# Pull development environment variables
vercel env pull

# Pull production variables (for verification)
vercel env pull --environment=production

# Pull preview variables for a specific branch
vercel env pull --environment=preview --git-branch=feature-branch
```

This creates a `.env` file in your project root. **Add `.env` to `.gitignore`** to avoid committing secrets.

### 5.4 Common Environment Variables for This Project

| Variable | Description | Example |
|---|---|---|
| `VITE_API_URL` | Backend API endpoint | `https://api.second-brain.com` |
| `ENCRYPTION_KEY` | Secret key for encryption | `your-secret-key-here` |

> **Note:** Vite only exposes variables prefixed with `VITE_` to the client bundle. Server-side variables (like `ENCRYPTION_KEY`) do **not** need the prefix.

---

## 6. Preview Deployment

Preview deployments let you test changes before going live.

```bash
# Deploy a preview
vercel deploy
```

This returns a preview URL like: `https://second-brain-abc123-team.vercel.app`

### Verify the Preview

```bash
# Check if the site responds
vercel curl / --deployment <preview-url>

# Check for errors in logs
vercel logs --deployment <preview-deployment-id> --level error
```

> Every `git push` to a non-production branch automatically creates a preview deployment when Git integration is enabled.

---

## 7. Production Deployment

### 7.1 Deploy to Production

```bash
vercel deploy --prod
```

This builds and deploys to your production domain (e.g., `https://second-brain.vercel.app`).

### 7.2 Verify Production

```bash
# Confirm the site is live
vercel curl / --deployment <production-url>

# Check recent error logs
vercel logs --environment production --level error --since 5m
```

### 7.3 One-Command Full Workflow

```bash
# Link → Pull envs → Deploy preview → Verify → Deploy production
vercel link
vercel env pull .env.local
vercel deploy
# ... verify preview ...
vercel deploy --prod
```

---

## 8. Custom Domain Setup

### 8.1 Add a Domain

```bash
# Add your custom domain
vercel domains add yourdomain.com
```

### 8.2 Configure DNS

Check what DNS records Vercel needs:

```bash
vercel domains inspect yourdomain.com
```

**Option A — Apex domain (root):**

| Type | Name | Value |
|---|---|---|
| A | `@` | `76.76.21.21` |

**Option B — Subdomain (e.g., `www`):**

| Type | Name | Value |
|---|---|---|
| CNAME | `www` | `cname.vercel-dns-0.com` |

Or use Vercel CLI to add DNS records directly:

```bash
# Apex domain
vercel dns add yourdomain.com '@' A 76.76.21.21

# Subdomain
vercel dns add yourdomain.com www CNAME cname.vercel-dns-0.com
```

### 8.3 Verify DNS & SSL

```bash
# Verify DNS configuration
vercel domains inspect yourdomain.com

# Check SSL certificate
vercel certs ls
```

> **Note:** DNS propagation can take a few minutes. If the domain isn't verified immediately, wait and retry.

### 8.4 Redirect www to Apex (or vice versa)

In the Vercel dashboard under **Settings → Domains**, you can configure redirects between `www` and root domains.

---

## 9. CI/CD with Git Integration

### 9.1 Connect Your Git Repository

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click **Add New → Project**
3. Import your Git repository (GitHub, GitLab, or Bitbucket)
4. Configure build settings and environment variables
5. Click **Deploy**

### 9.2 Automatic Deployments

Once connected, Vercel automatically:

| Trigger | Deployment Type |
|---|---|
| Push to `main` branch | **Production** deployment |
| Push to any other branch | **Preview** deployment |
| Pull request opened/updated | **Preview** deployment with PR comment |

### 9.3 Branch-Specific Domains

Assign custom domains to specific branches:

```
main       → yourdomain.com
staging    → staging.yourdomain.com
dev        → dev.yourdomain.com
```

Configure this in **Settings → Domains → Git Branch** on the dashboard.

---

## 10. Troubleshooting

### Build Fails

```bash
# Run build locally first to catch errors
cd frontend
npm run build

# Check Vercel build logs
vercel logs --deployment <deployment-id> --level error
```

### Environment Variables Not Working

- Client-side variables **must** be prefixed with `VITE_`
- After adding/changing env vars, redeploy: `vercel deploy --prod`
- Pull and verify locally: `vercel env pull`

### Domain Not Resolving

```bash
# Verify DNS records
vercel domains inspect yourdomain.com

# DNS can take up to 48 hours to propagate (usually minutes)
# Verify SSL
vercel certs ls
```

### Preview Deployments Not Triggering

- Ensure the Git repository is connected in Vercel dashboard
- Check that the project root directory is set correctly
- Verify the build command succeeds locally

### API / Backend Issues

Since this project has a separate Express backend, the backend needs its own hosting. Options:

| Option | Description |
|---|---|
| **Vercel Serverless Functions** | Convert Express routes to `/api/*.ts` files |
| **Separate hosting** | Deploy backend on Railway, Render, Fly.io, or a VPS |
| **Vercel Edge Functions** | For lightweight API logic |

If hosting the backend separately, set `VITE_API_URL` to point to the backend's public URL.

---

## Quick Reference — Essential Commands

```bash
# Setup
vercel login                          # Authenticate
vercel link                           # Link local project to Vercel
vercel env pull                       # Download env vars locally

# Deploy
vercel deploy                         # Preview deployment
vercel deploy --prod                  # Production deployment

# Domains
vercel domains add example.com        # Add custom domain
vercel domains inspect example.com    # Check DNS config

# Logs & Debug
vercel logs --level error             # View error logs
vercel curl /                         # Test production response
vercel whoami                         # Check logged-in user
```

---

## Resources

- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [Deploy from CLI Guide](https://vercel.com/docs/projects/deploy-from-cli)
- [Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [Custom Domains](https://vercel.com/docs/domains)
- [Vite on Vercel](https://vercel.com/docs/frameworks/vite)
