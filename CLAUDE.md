# Second Brain — Project Context

Personal knowledge management app. Capture → Process → Memo lifecycle for tasks, reading, purchases, and travel.

**Live:** https://second-brain-claude.vercel.app/login

## Tech Stack

| Layer | Stack |
|-------|-------|
| Frontend | React 18, TypeScript, Vite 5, Tailwind CSS 3, Zustand, react-router-dom v6 |
| Backend | Node.js, Express 4, TypeScript |
| Database | SQLite (local via @libsql/client), Turso (prod) |
| Auth | JWT (jsonwebtoken) + scrypt password hashing |
| Deploy | Vercel (serverless API + static frontend) |

## Architecture

- `frontend/` — React SPA (Vite, port 5173, proxies /api to localhost:3001)
- `backend/` — Modular Express dev server (src/index.ts, routes/, models/, middleware/)
- `api/index.ts` — Production serverless backend (39KB single file, all routes/models/auth consolidated for Vercel)
- `Deployment/` — Vercel+Turso, Docker, PM2+Nginx strategies
- `.claude/` — Agents (7), skills (context7-mcp, context-reduce), settings

## Directory Structure

```
frontend/src/
  pages/        DashboardPage, LoginPage, ItemFormPage, MemoPage, ProcessPage, TodoPage
  components/   auth/, dashboard/, items/, layout/, search/, tables/, ui/ (11 components)
  api/          client.ts, mock.ts
  store/        index.ts (Zustand), authStore.ts
  hooks/        useAuth, useItems, useTheme
  types/        index.ts, auth.ts

backend/src/
  routes/       auth, items, categories, itInfra, search, stats
  models/       item (17KB), category, search, user
  middleware/    auth, errorHandler, validate
  utils/        crypto, itemFields, jwt
```

## Item Types & Lifecycle

Six types: `task`, `task-it-infra`, `reading-book`, `reading-website`, `buying`, `trip`

Three stages: `todo` → `process` → `memo`

## Common Commands

```bash
# Frontend dev
cd frontend && npm run dev          # Vite dev server on :5173

# Backend dev
cd backend && npm run dev           # Express dev server on :3001 (tsx watch)
cd backend && npm run seed          # Seed database

# Build
cd frontend && npm run build        # Production frontend build
cd backend && npm run build         # TypeScript compile

# Production (serverless)
# api/index.ts is the Vercel serverless entry point — no build step needed
```

## Key Conventions

- UI components use Tailwind utility classes, Plus Jakarta Sans font, Heroicons SVG
- State management via Zustand stores (frontend/src/store/)
- Auth: JWT tokens stored client-side, middleware validates on protected routes
- API routes: /api/auth/*, /api/items/*, /api/categories/*, /api/search/*, /api/stats/*
- Each item type has specialized fields defined in itemFields (backend) and types/index.ts (frontend)
- The 39KB api/index.ts is the production deployment file — keep in sync with backend/ changes

## Agents

Seven custom agents in `.claude/agents/`: backend-blamer, backend-code-writer, frontend-blamer, frontend-code-writer, code-reviewer, document-writer, ubuntu-sysadmin
