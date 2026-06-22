# Second Brain

**A personal knowledge management system**

Second Brain is a full-stack application for capturing, processing, and archiving everything that matters to you — tasks, reading, purchases, and travel plans. Items flow through a **Todo -> Process -> Memo** lifecycle: capture quick thoughts into the queue, work on them actively while adding notes and context, then archive completed knowledge for search and retrieval.

---

## Badges

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-06B6D4?logo=tailwindcss)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=nodedotjs)
![Express](https://img.shields.io/badge/Express-4-000000?logo=express)
![SQLite](https://img.shields.io/badge/SQLite-3-003B57?logo=sqlite)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## Table of Contents

- [Features](#features)
  - [Core Workflow](#core-workflow)
  - [Item Types](#item-types)
  - [Frontend Features](#frontend-features)
  - [Backend Features](#backend-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation & Running](#installation--running)
- [API Endpoints](#api-endpoints)
  - [Items](#items)
  - [Categories](#categories)
  - [IT Infra](#it-infra)
  - [Search & Stats](#search--stats)
  - [Health](#health)
  - [Error Handling](#error-handling)
- [Data Models](#data-models)
  - [Lifecycle Stages](#lifecycle-stages)
  - [Item Type Summary](#item-type-summary)
- [Phase Roadmap](#phase-roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## Features

### Core Workflow

Items progress through three lifecycle stages:

```
┌─────────┐      ┌─────────┐      ┌─────────┐
│  TODO   │ ---> │ PROCESS │ ---> │  MEMO   │
│ (Queue) │      │ (Active)│      │(Archive)│
└─────────┘      └─────────┘      └─────────┘
     │                │                │
     └── add items    └── complete     └── search &
         to queue         & review        retrieve
```

1. **Todo** — Capture quick thoughts, tasks, reading targets, purchases, or trip ideas.
2. **Process** — Actively work on the item. Add notes, experience details, knowledge gained, and photos.
3. **Memo** — Archive completed items. Search and retrieve saved knowledge forever.

### Item Types

The system supports six distinct item types, each with specialized fields at each lifecycle stage:

| Type | Todo (Queue) | Process (Active) | Memo (Archive) |
|------|-------------|------------------|----------------|
| **Task (Ordinary)** | `category`, `name`, `due_date` | Adds `problem`, `experience`, `note`, `photo` | Same as Process |
| **Task (IT Infra)** | `category`, `name`, `due_date` | Adds `infra`, `item`, `kind`, `description`, `url_ip`, `username`, `password`, `new_password`, `remark` | Same as Process |
| **Reading (Book)** | `title`, `author`, `priority` | Adds `event`, `knowledge`, `note` (markdown), `book_pdf` | Same as Process |
| **Reading (Website)** | `url`, `title`, `priority` | Adds `event`, `knowledge`, `note` (markdown) | Same as Process |
| **Buying / Own** | `category`, `price`, `desired_usability` | Adds `usable_where` | Same as Process |
| **Trip Plan** | `destination`, `companions`, `date`, `duration`, `photo_goals` | Adds `experience`, `photo` | Same as Process |

### Frontend Features

- **Design system** — Micro-interaction style with Plus Jakarta Sans font, Heroicons SVG icons, animated transitions
- Dark mode — light, dark, and system preference
- Tab-based navigation — Todo, Process, Memo with desktop nav and mobile bottom bar
- Dashboard — personalized greeting, stats cards with count-up animation, quick-add with SVG icons, recent activity with relative dates, breakdown by type, status bars with percentages
- Dynamic forms — fields adapt to item type (task, book, website, purchase, trip, IT infra)
- Card grid view — items grouped by type with color-coded categories, expandable detail rows
- Sortable Memo table — expandable detail rows with SVG column sort indicators
- Dedicated IT Infra table — columns for Item, Infra, Kind, URL/IP, Date (passwords hidden by default with show/hide toggle)
- Card Grid / Table view toggle on the Memo page with crossfade animation
- Full-text search with type, category, date range, and pinned filters
- Pin/favorite items with amber highlight
- URL/IP detection — URLs render as clickable links, IP addresses display as plain text
- Password show/hide toggle with copy-to-clipboard
- Lazy-loaded routes with Suspense loading spinners
- Confirm dialogs for destructive actions (delete)
- Loading skeletons, empty states, and error states for all components
- Responsive design (mobile-first) with iOS safe area support
- Touch-friendly action buttons (visible without hover on mobile)
- Focus rings and keyboard navigation throughout

### Backend Features

- RESTful API with consistent JSON responses
- SQLite database with 7 tables and performance indexes
- WAL mode enabled for concurrent read performance
- Full CRUD for items and categories
- IT Infra-specific endpoints with search by IP, item name, infra type, kind, and description
- Weighted full-text search across memo items with pagination support
- Stats aggregation endpoint (counts by status and type, books to read, upcoming trips)
- Transaction-based mutations — item create/update wraps items table + detail table + tags in a single transaction
- Input validation on all endpoints with descriptive 400 error responses
- CORS configurable via `CORS_ORIGIN` environment variable
- Request logging — `[timestamp] METHOD /path STATUS duration`
- Parameterized SQL queries throughout (no SQL injection)
- Global error handler with proper HTTP status codes
- Password encryption at rest using AES-256-GCM
- Password fields redacted from API responses
- LIKE injection prevention in search queries
- Request body size limit (1MB)
- Orphaned tag cleanup on item update

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend Framework** | React 18 with TypeScript 5 |
| **Build Tool** | Vite 5 |
| **CSS** | Tailwind CSS 3 |
| **Routing** | React Router 6 (lazy-loaded routes) |
| **State Management** | Zustand |
| **Markdown Rendering** | react-markdown |
| **Date Utilities** | date-fns |
| **Backend Runtime** | Node.js 18+ with Express 4 |
| **Database** | SQLite via better-sqlite3 |
| **Server Watcher** | tsx (TypeScript execution and watch mode) |
| **Backend Language** | TypeScript 5 |

---

## Project Structure

```
second-brain-claude/
├── README.md                         # This file
├── FEATURE_SPEC.md                   # Full feature specification
│
├── frontend/                         # React SPA
│   ├── index.html                    # Vite entry HTML
│   ├── package.json                  # Frontend dependencies & scripts
│   ├── vite.config.ts                # Vite configuration
│   ├── tsconfig.json                 # TypeScript config
│   ├── tsconfig.node.json            # TS config for Vite/Node
│   ├── tailwind.config.js            # Tailwind theme and content paths
│   ├── postcss.config.js             # PostCSS with Tailwind + Autoprefixer
│   └── src/
│       ├── main.tsx                  # React 18 createRoot entry point
│       ├── App.tsx                   # BrowserRouter + lazy-loaded routes
│       ├── index.css                 # Tailwind directives + custom styles
│       ├── types/
│       │   └── index.ts              # All TypeScript interfaces and types
│       ├── api/
│       │   ├── client.ts             # Real API client (Express backend)
│       │   └── mock.ts               # Re-exports from client.ts
│       ├── store/
│       │   ├── index.ts              # Zustand store (items, categories, queries)
│       │   └── authStore.ts          # Auth store with localStorage persistence
│       ├── hooks/
│       │   ├── useItems.ts           # CRUD, search, filtered queries, group-by-type
│       │   └── useTheme.ts           # Dark/light/system theme toggle
│       ├── components/
│       │   ├── ui/                   # Reusable primitives
│       │   │   ├── Badge.tsx         # Status/type/category badge (6 type colors, 5 priority levels)
│       │   │   ├── Button.tsx        # 5 variants, 4 sizes, loading spinner, type="button" default
│       │   │   ├── Card.tsx          # Card wrapper with shadow, hover, padding options
│       │   │   ├── ConfirmDialog.tsx # Destructive action confirmation (composes Modal + Button)
│       │   │   ├── EmptyState.tsx    # Empty list placeholder with icon, title, action (fade-in animated)
│       │   │   ├── ErrorBoundary.tsx # React error boundary with recovery button
│       │   │   ├── Input.tsx         # Label, error, hint, left/right icons, password toggle, disabled state
│       │   │   ├── Modal.tsx         # Accessible modal with focus trap, ESC close, scroll lock
│       │   │   ├── Select.tsx        # Dropdown with disabled state, SVG chevron, dark mode aware
│       │   │   ├── Textarea.tsx      # Multi-line text input with disabled state
│       │   │   └── Toggle.tsx        # Accessible switch with label, description, disabled state
│       │   ├── auth/
│       │   │   └── ProtectedRoute.tsx # Auth guard with hydration-aware loading state
│       │   ├── layout/
│       │   │   ├── Header.tsx        # Top bar: SVG logo, nav, New button, theme cycle, user menu
│       │   │   ├── TabBar.tsx        # Mobile bottom bar with SVG icons and iOS safe area padding
│       │   │   └── Layout.tsx        # Page wrapper (max-w-6xl) with mobile bottom padding
│       │   ├── items/
│       │   │   ├── ItemCard.tsx      # Expandable card with pin/edit/delete actions, fade-in expand
│       │   │   ├── ItemForm.tsx      # Dynamic form (fields change by type), photo upload, sticky actions
│       │   │   └── ItemList.tsx      # Grouped list with uppercase section headers by type
│       │   ├── tables/
│       │   │   ├── MemoTable.tsx     # Sortable table with SVG sort chevrons, expandable detail rows
│       │   │   └── ITInfraTable.tsx  # IT infra columns with password reveal/copy, detail panel
│       │   ├── search/
│       │   │   ├── SearchBar.tsx     # Full-text search with clear button and Escape key support
│       │   │   └── FilterPanel.tsx   # Type, category, date range, pinned filters with slide-in animation
│       │   └── dashboard/
│       │       ├── StatsCard.tsx     # Stat card with count-up animation, hover scale, 6 color themes
│       │       └── QuickAdd.tsx      # 3x2 grid by type with Heroicons SVG (no emojis)
│       ├── utils/
│       │   └── item.ts               # title, subtitle, PATCH body helpers
│       ├── constants.ts              # Type labels, display names
│       └── pages/                    # Lazy-loaded route pages
│           ├── DashboardPage.tsx     # Greeting, stats, recent activity, breakdown, quick-add, status bars
│           ├── LoginPage.tsx         # Split-panel login/register with validation and demo mode
│           ├── TodoPage.tsx          # Queue items, Start -> Process, delete
│           ├── ProcessPage.tsx       # Active items, Complete -> Memo, delete
│           ├── MemoPage.tsx          # Archive with cards/table toggle, search/filter, IT infra view
│           └── ItemFormPage.tsx      # Create/edit items with dynamic fields and photo upload
│
└── backend/                          # Express API server
    ├── package.json                  # Backend dependencies & scripts
    ├── tsconfig.json                 # TypeScript config
    ├── .gitignore                    # Ignores node_modules, dist, data/
    ├── data/                         # SQLite database files (gitignored)
    └── src/
        ├── index.ts                  # Express app entry, middleware, routes, listen :3001
        ├── db.ts                     # better-sqlite3 connection, WAL mode, migrations
        ├── routes/
        │   ├── items.ts              # CRUD + status change endpoints with validation
        │   ├── categories.ts         # Category CRUD endpoints
        │   ├── itInfra.ts            # IT infra listing + search endpoints
        │   ├── search.ts             # Full-text search with scoring and pagination
        │   └── stats.ts              # Aggregate statistics endpoint
        ├── models/
        │   ├── item.ts               # Multi-table JOINs, create/update/delete with transactions
        │   ├── category.ts           # Category CRUD operations
        │   └── search.ts             # Weighted search across text fields
        ├── utils/
        │   ├── crypto.ts             # AES-256-GCM encryption/decryption for passwords
        │   └── itemFields.ts         # Shared field definitions, tag fetching, column flattening
        └── middleware/
            ├── errorHandler.ts       # Global error handler + AppError class
            └── validate.ts           # Type, status, priority, infra, ID validators
```

---

## Getting Started

### Prerequisites

- **Node.js** 18 or higher
- **npm** 9 or higher

### Installation & Running

```bash
# Clone the repository
git clone <repo-url>
cd second-brain-claude

# --- Backend ---
cd backend
npm install

# Optional: set encryption key for password storage
# Without it, a random key is generated (passwords won't survive restart)
export ENCRYPTION_KEY="your-secret-key"

npm run dev
# Server starts on http://localhost:3001
# Watches for changes with tsx

# --- Frontend (open a new terminal) ---
cd frontend
npm install
npm run dev
# Dev server starts on http://localhost:5173
# Proxies API requests or falls back to mock API
```

The frontend uses a localStorage-backed mock API by default so you can explore the full UI without running the backend. To use the real backend API, configure the API base URL in the frontend.

### Build for Production

```bash
# Frontend
cd frontend
npm run build    # TypeScript check + Vite production build -> dist/
npm run preview  # Preview the production build locally

# Backend
cd backend
npm run build    # Compile TypeScript -> dist/
npm start        # Start the compiled server
```

---

## API Endpoints

All endpoints are prefixed with `/api`. Responses are JSON with proper `Content-Type` headers. CORS is configurable via `CORS_ORIGIN` environment variable (defaults to `http://localhost:5173`). Every request is logged with `[timestamp] METHOD /path STATUS duration`.

### Items

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/items` | List all items. Query: `?status=todo\|process\|memo&type=task\|reading\|buying\|trip` |
| `POST` | `/api/items` | Create an item + detail record + tags in a transaction |
| `GET` | `/api/items/:id` | Get a single item with all sub-objects |
| `PUT` | `/api/items/:id` | Partial update. Replaces tags if `tags` field is provided |
| `DELETE` | `/api/items/:id` | Delete an item and its associated detail record |
| `PATCH` | `/api/items/:id/status` | Move item between lifecycle stages. Body: `{ status: 'todo' \| 'process' \| 'memo' }` |

### Categories

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/categories` | List all categories |
| `POST` | `/api/categories` | Create a category. Body: `{ name, type, color?, icon? }` |
| `PUT` | `/api/categories/:id` | Update a category |
| `DELETE` | `/api/categories/:id` | Delete a category |

### IT Infra

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/it-infra` | List IT infra items. Query: `?infra=server\|network\|cloud` |
| `GET` | `/api/it-infra/search` | Search by IP, item name, infra, kind, or description. Query: `?q=<term>` (LIKE metacharacters escaped) |

### Search & Stats

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/search` | Weighted full-text search. Query: `?q=<keyword>&type=<filter>&status=<filter>&category=<id>&dateFrom=<ISO>&dateTo=<ISO>&pinned=<bool>&limit=<num>&offset=<num>` |
| `GET` | `/api/stats` | Aggregate statistics. Returns `{ totalTodo, totalProcess, totalMemo, byType, booksToRead, upcomingTrips }` |

### Health

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Server health check. Returns `{ status: "ok", timestamp: "<ISO 8601>" }` |

### Error Handling

All endpoints return errors in a consistent format:

```json
{
  "error": "Human-readable error message",
  "details": ["Optional array of validation error details"]
}
```

**HTTP status codes:**

| Code | Meaning |
|------|---------|
| `200` | Success |
| `201` | Created (POST success) |
| `400` | Bad request (invalid type, status, or missing required fields) |
| `404` | Not found (item or category does not exist) |
| `500` | Internal server error (caught by global error handler) |

---

## Data Models

### Lifecycle Stages

Each item progresses through three stages. Stage transitions add new fields while preserving existing ones:

```
TODO                          PROCESS                                MEMO
─────                         ───────                                ────
Core fields only              Core + experience details              Same as Process
(quick capture)               (add notes, knowledge, photos)         (archived for search)
```

An item in Todo contains minimal fields for fast capture. Moving to Process reveals additional fields for documenting problems, experience, and knowledge gained. Completing into Memo archives the item for full-text search and retrieval.

### Item Type Summary

| Type | Key Todo Fields | Key Process/Memo Fields |
|------|----------------|------------------------|
| **Task (Ordinary)** | `name`, `due_date` | `problem`, `experience`, `note`, `photo` |
| **Task (IT Infra)** | `name`, `due_date` | `infra`, `item`, `kind`, `description`, `url_ip`, `username`, `password`, `new_password`, `remark` |
| **Reading (Book)** | `title`, `author`, `priority` | `event`, `knowledge`, `note` (markdown), `book_pdf` |
| **Reading (Website)** | `url`, `title`, `priority` | `event`, `knowledge`, `note` (markdown) |
| **Buying / Own** | `category`, `price`, `desired_usability` | `usable_where` |
| **Trip Plan** | `destination`, `date`, `duration` | `experience`, `photo` |

All items share a common base: `id`, `type`, `status`, `category_id`, `priority`, `created_at`, `updated_at`, `completed_at`.

---

## Phase Roadmap

| Phase | Description | Status |
|-------|-------------|--------|
| **Phase 1** | Core MVP — CRUD, Todo->Process->Memo workflow, categories, SQLite, basic UI | Completed |
| **Phase 2** | Enhanced features — markdown, photo capture, search, IT infra validation | Completed |
| **Phase 3** | Advanced — reading progress, trip tools, statistics dashboard, export, encryption | Planned |
| **Phase 4** | Web frontend + backend — React SPA, Express API, all endpoints, mock API, dark mode, tables, search | Completed |
| **Phase 5** | Integration & deployment — wire frontend to backend, auth, cloud sync, production deploy, data export | Planned |
| **Phase 6** | Advanced frontend — Kanban view, markdown rendering, photo crop, swipe actions, drag & drop, biometric lock | Planned |

---

## Contributing

This project is structured as two independent packages (`frontend/` and `backend/`) that each have their own `package.json`, TypeScript config, and build pipeline.

When contributing:

1. The frontend can be developed independently using the mock API. No backend is required for UI work.
2. The backend can be tested directly with `curl` or a REST client like Thunder Client or Postman.
3. Database migrations are applied automatically on server start via the `db.ts` module.
4. All item mutations must run in transactions (items table + detail table + tags).
5. New API routes follow the pattern: validate inputs in `middleware/validate.ts`, query through `models/`, expose in `routes/`.
6. Frontend components follow the directory convention: reusable primitives go in `components/ui/`, domain components go in their respective folders (`items/`, `tables/`, `search/`, `dashboard/`).

---

## License

MIT

---

*Built with React, TypeScript, Express, and SQLite — a personal knowledge base you own.*
