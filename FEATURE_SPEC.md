# Second Brain - Feature Specification

## Overview

A personal knowledge management system for tracking tasks, reading, purchases, and travel plans through a lifecycle: **Todo → Process → Memo**.

## Tech Stack

- **Single Server Website** — frontend AND backend implemented
  - Frontend: React 18 + TypeScript + Vite + Tailwind CSS ✓
  - Backend: Node.js + Express + TypeScript + SQLite (better-sqlite3) ✓

---

## Data Models

### 1. Todo (Queue - items to process and delete)

| Type | Fields |
|------|--------|
| **Task (Ordinary)** | `category`, `name`, `due_date` |
| **Task (IT Infra)** | `category`, `name`, `due_date` |
| **To Read (Book)** | `title`, `author`, `priority` |
| **To Read (Website)** | `url`, `title`, `priority` |
| **To Buy** | `category`, `price`, `desired_usability` |
| **Trip Plan** | `destination`, `companions`, `date`, `duration`, `photo_goals` |

### 2. Process (Active - items being worked on, then move to memo)

| Type | Fields |
|------|--------|
| **Task (Ordinary)** | `category`, `problem`, `experience`, `note`, `photo` (crop 9:16) |
| **Task (IT Infra)** | `category`, `infra`, `item`, `kind`, `description`, `url_ip`, `username`, `password`, `new_password`, `remark` |
| **Reading (Book)** | `book_name`, `event`, `knowledge`, `note` (markdown), `book_pdf` |
| **Reading (Website)** | `website_name`, `event`, `knowledge`, `note` (markdown) |
| **Buying** | `category`, `price`, `usable_where` |
| **Trip Plan** | `destination`, `companions`, `date`, `duration`, `experience`, `photo` (crop 9:16) |

### 3. Memo (Archive - saved knowledge from todo and process)

| Type | Fields |
|------|--------|
| **Task (Ordinary)** | `category`, `problem`, `experience`, `note`, `photo` (crop 9:16) |
| **Task (IT Infra)** | `category`, `infra`, `item`, `kind`, `description`, `url_ip`, `username`, `password`, `new_password`, `remark` |
| **Readed (Book)** | `book_name`, `event`, `knowledge`, `note` (markdown), `book_pdf` |
| **Readed (Website)** | `website_name`, `event`, `knowledge`, `note` (markdown) |
| **Own** | `category`, `price`, `usable_where` |
| **Trip Plan** | `destination`, `companions`, `date`, `duration`, `experience`, `photo` (crop 9:16) |

---

## Task Category Types

### Ordinary
General tasks, personal errands, work tasks, etc.

### IT Infra
Infrastructure-related tasks with technical details:
- **Infra** - Infrastructure type (Server, Network, Cloud, etc.)
- **Item** - Specific item name
- **Kind** - Item kind/model
- **Description** - What was done
- **URL/IP** - Access address (clickable link if URL, plain text if IP address like 192.168.1.0/24)
- **Username** - Login username
- **Password** - Current password
- **New Password** - Updated password
- **Remark** - Additional notes

---

## Core Workflow

```
┌─────────┐      ┌─────────┐      ┌─────────┐
│  TODO   │ ───► │ PROCESS │ ───► │  MEMO   │
│ (Queue) │      │ (Active)│      │(Archive)│
└─────────┘      └─────────┘      └─────────┘
     │                │                │
     └── add items    └── complete     └── search &
         to queue         & review        retrieve
```

1. **Add to Todo**: User captures quick thoughts, tasks, or plans
2. **Move to Process**: User actively works on the item, adds notes/experience
3. **Archive to Memo**: Item is complete, knowledge is saved for future reference

---

## Suggested Additional Features

### Category System
- **Custom categories** with color coding
- **Tags** for cross-cutting concerns (e.g., #urgent, #waiting, #recurring)
- **Priority levels** (Low, Medium, High, Urgent) for todo items
- **IT Infra subcategories** - Server, Network, Cloud, Database, Application

### Smart Features
- **Recurring tasks** - Auto-generate todo items on schedule
- **Reminders & notifications** - Push alerts for due dates
- **Quick capture** - Widget or shortcut to add items instantly
- **Voice input** - Add items via speech-to-text
- **Recurring IT tasks** - Auto-remind for password rotations, backups

### Enhanced Reading
- **Reading progress tracking** - Page/percentage completion
- **Highlights & annotations** - Save key quotes from books
- **Reading stats** - Books read per month, average reading time
- **Book cover images** - Visual library

### Enhanced Trip Planning
- **Packing list** - Auto-suggest items based on destination/weather
- **Budget tracking** - Track expenses during trip
- **Photo gallery** - Organize trip photos by date/location
- **Itinerary builder** - Day-by-day schedule

### IT Infra Enhancements
- **Password generator** - Create strong passwords
- **Password strength indicator** - Visual feedback
- **Encrypted storage** - AES-256 for sensitive fields
- **IP/URL validation** - Auto-validate format
- **URL/IP link detection** - URLs are clickable links, IP addresses display as text
- **Copy to clipboard** - Quick copy credentials
- **SSH/Telnet shortcuts** - Direct connection from app
- **Service health check** - Ping/test endpoints

### Search & Retrieval
- **Full-text search** - Search across all memo items
- **Filter by type/category/date** - Quick filtering
- **Favorites/Pinned** - Pin important memo items
- **Export** - Export memo as PDF/Markdown
- **IT-specific search** - Search by IP, infra, or item name
- **Table view** - Sortable table with type, title, category, dates, and expandable detail rows
- **IT Infra table view** - Dedicated table for IT Infra items with columns: Name, Infra, Item, Kind, Description, URL/IP, Username, Password, New Password, Finish Date

### Productivity
- **Dashboard** - Overview of pending tasks, reading list, upcoming trips
- **Statistics** - Productivity metrics, reading habits
- **Streaks** - Track consistent task completion
- **Templates** - Pre-defined templates for common item types
- **Kanban view** - Visual task board

### Data Management
- **Backup/Restore** - Cloud backup support
- **Import/Export** - CSV/JSON support
- **Offline mode** - Full functionality without internet
- **Sync** - Multi-device sync (future)
- **Encrypted export** - For IT Infra data

### UI/UX
- **Dark mode** - Theme support
- **Swipe actions** - Swipe to complete/delete/move
- **Drag & drop** - Reorder items manually
- **Widgets** - Home screen widgets for quick access
- **Biometric lock** - App security
- **Tab-based navigation** - Quick switch between Todo/Process/Memo
- **Table view** - Sortable table view for Memo with expandable rows showing details
- **Grid/Table toggle** - Switch between card grid and table views
- **IT Infra table** - Dedicated columns for Name, Infra, Item, Kind, Description, URL/IP, Username, Password, New Password, Finish Date

---

## Database Schema (Suggested)

```sql
-- Core tables
CREATE TABLE categories (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- ordinary, it_infra
    color TEXT,
    icon TEXT
);

CREATE TABLE items (
    id INTEGER PRIMARY KEY,
    type TEXT NOT NULL, -- task, reading_book, reading_website, buying, trip
    status TEXT NOT NULL, -- todo, process, memo
    category_id INTEGER,
    priority INTEGER,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    completed_at TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Task tables
CREATE TABLE tasks_ordinary (
    item_id INTEGER PRIMARY KEY,
    name TEXT,
    due_date DATE,
    problem TEXT,
    experience TEXT,
    note TEXT,
    photo_path TEXT,
    FOREIGN KEY (item_id) REFERENCES items(id)
);

CREATE TABLE tasks_it_infra (
    item_id INTEGER PRIMARY KEY,
    name TEXT,
    due_date DATE,
    infra TEXT,
    item_name TEXT,
    kind TEXT,
    description TEXT,
    url_ip TEXT,
    username TEXT,
    password TEXT,
    new_password TEXT,
    remark TEXT,
    FOREIGN KEY (item_id) REFERENCES items(id)
);

-- Reading tables
CREATE TABLE readings (
    item_id INTEGER PRIMARY KEY,
    source_type TEXT, -- book, website
    title TEXT,
    author TEXT,
    url TEXT,
    event TEXT,
    knowledge TEXT,
    note TEXT, -- markdown
    pdf_path TEXT,
    progress INTEGER, -- percentage
    FOREIGN KEY (item_id) REFERENCES items(id)
);

-- Purchase table
CREATE TABLE purchases (
    item_id INTEGER PRIMARY KEY,
    category TEXT,
    price REAL,
    usable_where TEXT,
    FOREIGN KEY (item_id) REFERENCES items(id)
);

-- Trip table
CREATE TABLE trips (
    item_id INTEGER PRIMARY KEY,
    destination TEXT,
    companions TEXT,
    trip_date DATE,
    duration INTEGER, -- days
    experience TEXT,
    photo_path TEXT,
    photo_goals TEXT,
    FOREIGN KEY (item_id) REFERENCES items(id)
);

-- Tags system
CREATE TABLE tags (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL
);

CREATE TABLE item_tags (
    item_id INTEGER,
    tag_id INTEGER,
    PRIMARY KEY (item_id, tag_id)
);
```

---

## API Endpoints

Base path: `/api`

All responses are JSON with proper `Content-Type: application/json` headers. CORS is enabled for `http://localhost:5173` (the Vite dev server). Every request is logged with `[timestamp] METHOD /path STATUS duration` format. All database queries use parameterized SQL (no SQL injection). Item mutations run inside transactions (items table + detail table + tags). Invalid types or statuses return `400` with allowed values. Non-existent resources return `404`. The server runs on `PORT` env var or default `3001`.

### Items

| Method | Path | Description | Request Body / Query | Response |
|--------|------|-------------|---------------------|----------|
| `GET` | `/api/items` | List items with optional filters | `?status=todo\|process\|memo&type=task\|reading\|buying\|trip` | `FullItem[]` — each includes its `todo` and `processMemo` sub-objects |
| `POST` | `/api/items` | Create a new item + detail record + tags in a transaction | `{ type, status, category_id?, priority?, tags?: string[], ...typeSpecificFields }` | `FullItem` |
| `GET` | `/api/items/:id` | Get a single item by ID | — | `FullItem` with `todo` and `processMemo` sub-objects |
| `PUT` | `/api/items/:id` | Partial update; replaces tags if `tags` field is provided | `{ ...partialFields, tags?: string[] }` | Updated `FullItem` |
| `DELETE` | `/api/items/:id` | Delete an item and its associated detail record | — | `{ success: true }` |
| `PATCH` | `/api/items/:id/status` | Move item between lifecycle stages | `{ status: 'todo' \| 'process' \| 'memo' }` | Updated `FullItem` with new status |

### Categories

| Method | Path | Description | Request Body | Response |
|--------|------|-------------|-------------|----------|
| `GET` | `/api/categories` | List all categories | — | `Category[]` |
| `POST` | `/api/categories` | Create a new category | `{ name, type, color?, icon? }` | `Category` |
| `PUT` | `/api/categories/:id` | Update a category | `{ name?, type?, color?, icon? }` | Updated `Category` |
| `DELETE` | `/api/categories/:id` | Delete a category | — | `{ success: true }` |

### IT Infra

| Method | Path | Description | Query | Response |
|--------|------|-------------|-------|----------|
| `GET` | `/api/it-infra` | List IT infra items filtered by infra type | `?infra=server\|network\|cloud` | IT infra `FullItem[]` |
| `GET` | `/api/it-infra/search` | Search IT infra items by IP, item name, infra, kind, or description | `?q=<search_term>` | IT infra `FullItem[]` matching the search term |

### Search & Stats

| Method | Path | Description | Query | Response |
|--------|------|-------------|-------|----------|
| `GET` | `/api/search` | Weighted full-text search across memo items | `?q=<keyword>&type=<filter>&status=<filter>&category=<id>&dateFrom=<ISO>&dateTo=<ISO>&pinned=<bool>` | Scored `FullItem[]` ordered by relevance |
| `GET` | `/api/stats` | Aggregate statistics for the dashboard | — | `{ totalTodo, totalProcess, totalMemo, byType: { ... }, booksToRead, upcomingTrips }` |

### Health

| Method | Path | Description | Response |
|--------|------|-------------|----------|
| `GET` | `/api/health` | Server health check | `{ status: "ok", timestamp: "<ISO 8601>" }` |

### Error Responses

All endpoints return errors in a consistent format:

```json
{
  "error": "Human-readable error message",
  "details": ["Optional array of validation error details"]
}
```

**HTTP status codes used:**
- `200` — Success
- `201` — Created (POST success)
- `400` — Bad request (invalid type, status, or missing required fields)
- `404` — Not found (item or category does not exist)
- `500` — Internal server error (unexpected failure, caught by global error handler)

---

## Web Frontend Architecture (Implemented)

```
frontend/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tsconfig.node.json
├── tailwind.config.js
├── postcss.config.js
├── src/
│   ├── main.tsx                    # React 18 createRoot entry
│   ├── App.tsx                     # BrowserRouter + lazy-loaded routes
│   ├── index.css                   # Tailwind directives + custom styles
│   ├── types/index.ts              # All TypeScript interfaces & types
│   ├── api/mock.ts                 # localStorage-backed mock API
│   ├── store/index.ts              # Zustand state management
│   ├── hooks/
│   │   ├── useItems.ts             # CRUD, search, group-by-type
│   │   ├── useCategories.ts        # Category management
│   │   └── useTheme.ts             # Dark/light/system theme
│   ├── components/
│   │   ├── ui/                     # Button, Input, Badge, Modal, Select,
│   │   │                           # Textarea, Toggle, Card, EmptyState,
│   │   │                           # ConfirmDialog
│   │   ├── layout/                 # Header (theme toggle, nav), TabBar (mobile),
│   │   │                           # Layout wrapper
│   │   ├── items/                  # ItemCard (expandable, type-aware),
│   │   │                           # ItemForm (dynamic fields per type),
│   │   │                           # ItemList (grouped by type)
│   │   ├── tables/                 # MemoTable (sortable, expandable rows),
│   │   │                           # ITInfraTable (dedicated infra columns)
│   │   ├── search/                 # SearchBar, FilterPanel (type/category/date/pinned)
│   │   └── dashboard/              # StatsCard (6 color themes), QuickAdd (type grid)
│   └── pages/                      # Lazy-loaded page components:
│       ├── DashboardPage.tsx       # Stats overview, recent activity, quick-add
│       ├── TodoPage.tsx            # Grouped items, Start → Process, delete
│       ├── ProcessPage.tsx         # Active items, Complete → Memo
│       ├── MemoPage.tsx            # Archive with cards/table toggle,
│       │                           # IT Infra view, search + filters
│       └── ItemFormPage.tsx        # Create/edit items, dynamic type fields
```

### Frontend Features Implemented

- [x] React 18 + TypeScript + Vite + Tailwind CSS
- [x] Todo → Process → Memo lifecycle with status transitions
- [x] All 6 item types with dynamic create/edit forms
- [x] Tab-based navigation (mobile bottom bar, desktop top nav)
- [x] Dashboard with stats cards and quick-add widget
- [x] Dark mode (light / dark / system preference)
- [x] Card grid view with grouped-by-type layout
- [x] Sortable Memo table with expandable detail rows
- [x] Dedicated IT Infra table (Item, Infra, Kind, URL/IP, Date columns)
- [x] Card Grid / Table view toggle on Memo page
- [x] Search with type, category, date range, and pinned filters
- [x] Pin/favorite items (amber highlight)
- [x] URL/IP detection — URLs render as clickable links, IPs as plain text
- [x] Password show/hide toggle + copy-to-clipboard
- [x] Lazy-loaded routes with Suspense loading spinners
- [x] Confirm dialogs for destructive actions (delete)
- [x] Loading, empty, and error states in all components
- [x] Responsive design (mobile-first)
- [x] Mock API via localStorage (fully functional without backend)
- [x] Production build verified clean

### Not Yet Implemented (Frontend)

- [ ] Markdown rendering for book/website notes (plain text displayed)
- [ ] Photo capture with 9:16 crop (photo upload area present, crop not enforced)
- [ ] Swipe actions on list items
- [ ] Kanban view
- [ ] Drag & drop reordering
- [ ] Backend API integration (mock only)
- [ ] Reading progress tracking
- [ ] Export to PDF/Markdown

---

## Backend Architecture (Implemented)

```
backend/
├── package.json
├── tsconfig.json
├── .gitignore
├── data/                        # SQLite DB files (gitignored)
├── src/
│   ├── index.ts                 # Express app entry, middleware, route mounting, server start on :3001
│   ├── db.ts                    # better-sqlite3 connection, WAL mode, migrations with indexes
│   ├── routes/
│   │   ├── items.ts             # CRUD + status change endpoints with validation
│   │   ├── categories.ts        # Category CRUD
│   │   ├── itInfra.ts           # IT infra listing + search
│   │   ├── search.ts            # Full-text search across memo items with scoring
│   │   └── stats.ts             # Aggregate statistics
│   ├── models/
│   │   ├── item.ts              # Multi-table JOIN queries, create/update/delete with transactions
│   │   ├── category.ts          # Category CRUD operations
│   │   └── search.ts            # Weighted search across text fields
│   └── middleware/
│       ├── errorHandler.ts      # Global error handler + AppError class
│       └── validate.ts          # Type/status/priority/infra/ID validators
```

### Backend Features Implemented

- [x] Node.js + Express + TypeScript + SQLite (better-sqlite3)
- [x] SQLite database with 7 tables + indexes (items, tasks_ordinary, tasks_it_infra, readings, purchases, trips, item_detail)
- [x] WAL mode enabled for concurrent read performance
- [x] Full CRUD endpoints for items and categories
- [x] IT infra specific endpoints with search by IP, item name, infra, kind, description
- [x] Full-text weighted search across memo items (type, status, category, date range, pinned filters)
- [x] Stats aggregation endpoint (counts by status, counts by type, books to read, upcoming trips)
- [x] Transaction-based mutations — item create/update wraps items table + detail table + tags in a single transaction
- [x] Input validation on all endpoints — invalid types/statuses return 400 with allowed values
- [x] CORS enabled for Vite dev server (http://localhost:5173)
- [x] Request logging with timestamp, method, path, status code, and duration
- [x] Global error handler with consistent JSON error response format
- [x] Parameterized SQL queries throughout (no SQL injection)

---

## Phase Implementation Plan

### Phase 1: Core (MVP)
- [ ] Basic CRUD for all item types
- [ ] Todo → Process → Memo workflow
- [ ] Category system (Ordinary + IT Infra)
- [ ] Local SQLite database
- [ ] Basic UI with tab navigation

### Phase 2: Enhanced Features
- [ ] Markdown support for notes
- [ ] Photo capture with 9:16 crop
- [ ] Search and filter
- [ ] Notifications
- [ ] IT Infra form with validation

### Phase 3: Advanced
- [ ] Reading progress tracking
- [ ] Trip planning tools
- [ ] Statistics dashboard
- [ ] Data export
- [ ] Password encryption

### Phase 4: Web Frontend — Completed (2026-06-19)
- [x] React 18 + TypeScript + Vite + Tailwind CSS
- [x] Dashboard with stats and quick-add
- [x] Tab-based navigation (Todo / Process / Memo)
- [x] Dynamic forms for all 6 item types
- [x] Sortable Memo table with expandable rows
- [x] IT Infra table with dedicated columns (Name, Infra, Item, Kind, Description, URL/IP, Username, Password, New Password, Finish Date)
- [x] Card Grid / Table view toggle
- [x] Search with type, category, date, and pinned filters
- [x] Pin/favorite items
- [x] URL/IP link detection (URLs as clickable links, IP addresses as text)
- [x] Password show/hide + copy-to-clipboard
- [x] Dark mode (light / dark / system)
- [x] Confirm dialogs for destructive actions
- [x] Mock API via localStorage (fully functional without backend)
- [x] Backend API server (Node.js + Express + TypeScript)
- [x] SQLite database with all 7 tables + indexes
- [x] All CRUD endpoints for items and categories
- [x] IT infra specific endpoints with search
- [x] Full-text search across memo items
- [x] Stats aggregation endpoint
- [x] Transaction-based mutations (items + detail + tags)
- [x] Input validation on all endpoints
- [x] CORS for Vite dev server
- [x] Request logging

### Phase 5: Integration & Deployment
- [ ] Wire frontend to real backend (replace mock API)
- [ ] Authentication / user accounts
- [ ] Cloud sync / multi-device support
- [ ] Production deployment
- [ ] Data export (PDF / Markdown / CSV / JSON)

### Phase 6: Advanced Frontend
- [ ] Kanban view
- [ ] Markdown rendering for notes
- [ ] Photo capture with 9:16 crop enforcement
- [ ] Swipe actions on list items
- [ ] Drag & drop reordering
- [ ] Reading progress tracking
- [ ] Biometric lock
