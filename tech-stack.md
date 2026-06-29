# Second Brain — Tech Stack

## Overview

Personal knowledge management app with a Capture → Process → Memo lifecycle for tasks, reading, purchases, and travel. Built as a TypeScript monorepo with a React SPA frontend and Express API backend.

**Live:** https://second-brain-claude.vercel.app/login

---

## Frontend

| Category | Technology | Version |
|----------|-----------|---------|
| Framework | React | ^18.3.1 |
| Language | TypeScript | ^5.4.5 |
| Build Tool | Vite | ^5.3.1 |
| Routing | react-router-dom | ^6.23.1 |
| State Management | Zustand | ^4.5.4 |
| Styling | Tailwind CSS | ^3.4.4 |
| PostCSS | postcss + autoprefixer | ^8.4.38 / ^10.4.19 |
| Date Utilities | date-fns | ^3.6.0 |
| Class Merging | clsx | ^2.1.1 |
| Fonts | Plus Jakarta Sans (primary), JetBrains Mono / Fira Code (mono) | @fontsource ^5.2.8 |
| Icons | Heroicons (inline SVG) | — |

### Frontend Architecture

- **Pages (6):** DashboardPage, LoginPage, ItemFormPage, MemoPage, ProcessPage, TodoPage
- **Component Groups:** auth, dashboard, items, layout, search, tables, ui (11 reusable components)
- **Stores (Zustand):** `store/index.ts` (app state), `store/authStore.ts` (auth state)
- **Hooks:** `useAuth`, `useItems`, `useTheme`
- **API Client:** `api/client.ts` (centralized fetch wrapper with auth headers)
- **Types:** 93 interfaces, 25 types across `types/index.ts` and `types/auth.ts`
- **Dark Mode:** class-based (`darkMode: 'class'` in Tailwind config)
- **Custom Theme:** brand (blue) and accent (fuchsia) color palettes, custom animations (slide, fade, scale, count-up, stagger)

### Dev Server

- Vite dev server on port `5173`
- Proxies `/api` requests to `http://localhost:3001` (backend)

---

## Backend

| Category | Technology | Version |
|----------|-----------|---------|
| Runtime | Node.js | — |
| Framework | Express | ^4.21.0 |
| Language | TypeScript | ^5.6.0 |
| Database Client | @libsql/client (Turso/SQLite) | ^0.17.4 |
| CORS | cors | ^2.8.5 |
| UUID Generation | uuid | ^10.0.0 |
| Dev Runner | tsx (watch mode) | ^4.19.0 |

### Backend Architecture

- **Entry Point:** `backend/src/index.ts` (dev), `api/index.ts` (production serverless)
- **Routes (6 groups):** auth, items, categories, itInfra, search, stats
- **Models:** item, category, search, user
- **Middleware:** auth (JWT validation), errorHandler, validate
- **Utils:** crypto (encryption), itemFields (field definitions per item type), jwt (token handling)
- **Database Migrations:** `src/db.ts` → `runMigrations()`
- **Seed:** `src/seed.ts`

### API Endpoints

| Group | Endpoints |
|-------|----------|
| Auth | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` |
| Items | `GET/POST /api/items`, `GET/PUT/DELETE /api/items/:id`, `PATCH /api/items/:id/status` |
| Categories | `GET/POST /api/categories`, `GET/PUT/DELETE /api/categories/:id` |
| IT Infra | `GET /api/it-infra`, `GET /api/it-infra/search` |
| Search | `GET /api/search` |
| Stats | `GET /api/stats` |
| Health | `GET /api/health` |

---

## Production Serverless (`api/index.ts`)

A single consolidated ~39KB file that bundles all routes, models, middleware, and auth for Vercel's serverless runtime. Uses:

- Express app wrapped for Vercel serverless
- `@libsql/client` connecting to Turso (cloud SQLite) via `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN`
- `jsonwebtoken` for JWT auth
- `crypto` (Node built-in) for password hashing (scrypt)

---

## Database

| Property | Value |
|----------|-------|
| Engine | SQLite (libSQL) |
| Local | `file:./data/second-brain.db` |
| Production | Turso (cloud-hosted SQLite) |
| Client | `@libsql/client` |

---

## Item Types & Lifecycle

Six item types, each flowing through three stages:

```
todo → process → memo
```

| Type | Key Fields |
|------|-----------|
| `task` | category, name, due_date, priority, problem → experience, note, photo |
| `task-it-infra` | category, name, due_date, priority → experience, note, photo |
| `reading-book` | source_type, title, author, url, priority → experience, note, photo |
| `reading-website` | source_type, title, author, url, priority → experience, note, photo |
| `buying` | category, price, priority → experience, note, photo |
| `trip` | destination, companions, trip_date, duration, priority → experience, note, photo |

---

## Deployment

### Primary: Vercel + Turso

- **Frontend:** Static build (`frontend/dist`) served by Vercel
- **Backend:** Serverless function (`api/index.ts`)
- **Config:** `vercel.json` routes `/api/*` to serverless, everything else to SPA
- **Build:** `cd frontend && npm run build` → output to `frontend/dist`

### Alternative: Docker

- `Deployment/docker-deployment/` — Docker Compose with Nginx reverse proxy
- `Deployment/Production/production-docker/` — Production Docker Compose
- Health check: `wget -qO- http://127.0.0.1:3001/api/health`

### Alternative: PM2 + Nginx

- `Deployment/production/ecosystem.config.cjs` — PM2 process manager config
- `Deployment/production/nginx.conf` — Nginx reverse proxy config

---

## Codebase Stats (from Knowledge Graph)

| Metric | Count |
|--------|-------|
| Total Nodes | 1,170 |
| Total Edges | 2,001 |
| Functions | 249 |
| Interfaces | 93 |
| Types | 25 |
| Routes | 43 |
| Classes | 4 |
| Files | 108 |
| Languages | TypeScript (76), Bash (4), YAML (3), JavaScript (2), HTML (1), CSS (1) |

### Architectural Clusters

| Cluster | Members | Cohesion | Top Nodes |
|---------|---------|----------|-----------|
| frontend (UI) | 27 | 0.94 | request, useItems, DashboardPage, deleteItem, createEmptyItem |
| frontend (tables) | 14 | 0.93 | MemoTable, getItemTitle, ItemCard, renderValue, SortHeader |
| frontend (forms) | 11 | 1.0 | ItemFormPage, mapItem, createItem, fetchItem, flattenItem |
| frontend (auth) | 12 | 0.92 | Header, useAuth, LoginPage, setTheme, useTheme |
| backend (models) | 19 | 0.93 | getItemById, encrypt, searchItems, getItems, createItem |
| backend (middleware) | 13 | 1.0 | AppError, authMiddleware, verifyToken, requireId, base64urlDecode |
| Deployment | 25 | 0.95 | log, main, ok, rollback, wait_for_health |
| api (serverless) | 4 | 1.0 | getItemById, flattenDetailColumns, getTagsForItems, buildFullItem |

### Hotspot Functions (by fan-in)

| Function | Fan-in | Location |
|----------|--------|----------|
| `log` (deploy) | 20 | Deployment/production/deploy.sh |
| `ok` (deploy) | 12 | Deployment/production/deploy.sh |
| `request` (API client) | 7 | frontend/src/api/client.ts |
| `encrypt` | 6 | backend/src/utils/crypto.ts |
| `getTagsForItems` | 5 | backend/src/utils/itemFields.ts |
| `getItemById` | 5 | backend/src/models/item.ts |
