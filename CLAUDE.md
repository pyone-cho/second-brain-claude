# Second Brain — Project Context

Personal knowledge management app. Capture → Process → Memo lifecycle for tasks, reading, purchases, and travel.

**Live:** https://second-brain-claude.vercel.app/login

## Architecture

- `frontend/` — React SPA (Vite, port 5173, proxies /api to localhost:3001)
- `backend/` — Modular Express dev server (src/index.ts, routes/, models/, middleware/)
- `api/index.ts` — Production serverless backend (39KB single file, all routes/models/auth consolidated for Vercel)
- `Deployment/` — Vercel+Turso, Docker, PM2+Nginx strategies

## Item Types & Lifecycle

Six types: `task`, `task-it-infra`, `reading-book`, `reading-website`, `buying`, `trip`

Three stages: `todo` → `process` → `memo`

## Key Conventions

- UI components use Tailwind utility classes, Plus Jakarta Sans font, Heroicons SVG
- State management via Zustand stores (frontend/src/store/)
- Auth: JWT tokens stored client-side, middleware validates on protected routes
- API routes: /api/auth/*, /api/items/*, /api/categories/*, /api/search/*, /api/stats/*
- Each item type has specialized fields defined in itemFields (backend) and types/index.ts (frontend)
- The 39KB api/index.ts is the production deployment file — keep in sync with backend/ changes

## Agents

Seven custom agents in `.claude/agents/`: backend-blamer, backend-code-writer, frontend-blamer, frontend-code-writer, code-reviewer, document-writer, ubuntu-sysadmin

## Skills

Three skills in `.claude/skills/`:

- **context7-mcp** — Fetches live library docs (React, Express, Zustand, Tailwind) instead of relying on training data
- **context-reduce** — Compresses context when sessions get large (10+ files read), creates handoff summaries
- **ui-ux-pro-max** — Design intelligence: 67 styles, 96 palettes, 57 font pairings, 25 charts, 13 stacks. Use `python3 .claude/skills/ui-ux-pro-max/scripts/search.py "query" --design-system` for design recommendations
