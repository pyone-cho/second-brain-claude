---
marp: true
paginate: true
transition: fade
size: 16:9
style: |
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Space+Grotesk:wght@400;500;600;700&display=swap');

  :root {
    --bg: #0F172A;
    --bg-card: #1E293B;
    --bg-code: #0D1117;
    --text: #F8FAFC;
    --text-muted: #CBD5E1;
    --accent: #22C55E;
    --accent-dim: #16A34A;
    --border: #334155;
    --cyan: #22D3EE;
    --pink: #F472B6;
    --yellow: #FACC15;
    --orange: #FB923C;
    --blue: #60A5FA;
    --red: #F87171;
  }

  section {
    background: var(--bg);
    color: var(--text);
    font-family: 'DM Sans', system-ui, sans-serif;
    line-height: 1.1;
    padding: 2.5rem 3.5rem;
  }

  section::after {
    color: #64748B;
    font-size: 0.7rem;
  }

  h1, h2, h3 {
    font-family: 'Space Grotesk', system-ui, sans-serif;
    color: var(--text);
    letter-spacing: -0.02em;
  }

  h1 {
    font-size: 2.6rem;
    font-weight: 700;
    margin: 0 0 0.4rem;
  }

  h2 {
    font-size: 1.6rem;
    font-weight: 600;
    margin: 0 0 0.6rem;
    padding-bottom: 0.3rem;
    border-bottom: 2px solid var(--accent);
    display: inline-block;
  }

  h3 {
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--accent);
    margin: 0.6rem 0 0.3rem;
  }

  p, li {
    margin: 0.15em 0;
    color: var(--text);
  }

  strong {
    color: var(--accent);
    font-weight: 600;
  }

  em {
    color: #CBD5E1;
    font-style: italic;
  }

  a {
    color: var(--cyan);
    text-decoration: none;
    border-bottom: 1px solid var(--cyan);
  }

  blockquote {
    background: var(--bg-card);
    border-left: 4px solid var(--accent);
    padding: 0.6rem 1rem;
    margin: 0.5rem 0;
    border-radius: 0 0.5rem 0.5rem 0;
    font-size: 0.9rem;
    color: #CBD5E1;
  }

  table {
    width: 100%;
    margin: 0.5rem 0;
    font-size: 0.82em;
    border-collapse: collapse;
  }

  thead {
    background: #1E293B;
  }

  th {
    color: #F87171;
    font-weight: 600;
    text-align: left;
    padding: 0.4rem 0.7rem;
    border-bottom: 2px solid var(--accent);
    font-family: 'Space Grotesk', system-ui, sans-serif;
    font-size: 0.85em;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  table {
    background: #F8FAFC;
    border-radius: 0.5rem;
    overflow: hidden;
  }

  td {
    padding: 0.35rem 0.7rem;
    border-bottom: 1px solid #E2E8F0;
    color: #0F172A;
  }

  td strong {
    color: #0F172A;
    font-weight: 700;
  }

  td code {
    color: #0369A1;
    background: #E0F2FE;
  }

  tr:last-child td {
    border-bottom: none;
  }

  tr:hover td {
    background: #F1F5F9;
  }

  code {
    background: var(--bg-code);
    color: var(--cyan);
    padding: 0.1em 0.4em;
    border-radius: 0.25rem;
    font-size: 0.85em;
    font-family: 'Fira Code', 'JetBrains Mono', monospace;
  }

  pre {
    background: var(--bg-code) !important;
    border: 1px solid var(--border);
    border-radius: 0.5rem;
    padding: 0.6rem 1rem;
    margin: 0.4rem 0;
    font-size: 0.72em;
    line-height: 1.4;
  }

  pre code {
    background: none;
    padding: 0;
    color: var(--text);
  }

  ul, ol {
    margin: 0.2em 0;
    padding-left: 1.2em;
  }

  li::marker {
    color: var(--accent);
  }

  hr {
    border: none;
    border-top: 1px solid var(--border);
    margin: 0.6rem 0;
  }

  section.lead h1 {
    font-size: 3rem;
    text-align: center;
  }

  section.lead p {
    text-align: center;
    color: #CBD5E1;
    font-size: 1.1rem;
  }

  section.lead {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }

  .columns {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
  }
---

<!-- _class: lead -->

# Second Brain — Tech Stack

**How it's built · How it's developed · How it's deployed**

second-brain-claude.vercel.app

---

## Tech Stack — Frontend

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | **React** | 18.3 |
| Language | **TypeScript** | 5.4 |
| Build | **Vite** | 5.3 |
| Routing | **react-router-dom** | 6.23 |
| State | **Zustand** | 4.5 |
| Styling | **Tailwind CSS** | 3.4 |
| Utilities | date-fns, clsx | — |
| Icons | Heroicons (inline SVG) | — |

6 pages · 7 component groups · 93 interfaces · dark mode

---

## Tech Stack — Backend & Database

| Layer | Technology | Version |
|-------|-----------|---------|
| Runtime | **Node.js** | — |
| Framework | **Express** | 4.21 |
| Language | **TypeScript** | 5.6 |
| Database | **SQLite** (libSQL) / **Turso** (prod) | — |
| Client | **@libsql/client** | 0.17 |
| Auth | JWT + scrypt | — |

### Production: `api/index.ts`

Single **~39KB consolidated file** — all routes, models, middleware, auth for Vercel serverless.

---

## Agents — 7 Custom

| Agent | Purpose |
|-------|---------|
| **frontend-code-writer** | Write/refactor React components, layouts, state |
| **backend-code-writer** | API endpoints, models, middleware, DB logic |
| **frontend-blamer** | Review frontend for bugs, perf, a11y issues |
| **backend-blamer** | Pinpoint backend bugs, slow queries, bad patterns |
| **code-reviewer** | Audit code quality after significant changes |
| **document-writer** | Generate/update docs, READMEs, docstrings |
| **ubuntu-sysadmin** | Server config, systemd, networking, hardening |

All inherit session model. Triggered via `Agent` tool or proactively after code changes.

---

## Skills — 2

### context7-mcp

Fetches **live library docs** instead of relying on training data.

```
User: "How do I set up Zustand persist?"
  → resolve-library-id("zustand")
  → query-docs("/pmndrs/zustand", "persist setup")
  → Returns current API with code examples
```

**When:** library questions, API references, framework setup, code examples

### context-reduce

Compresses context when sessions get large.

```
User: "compress context"
  → Summarizes files read, keeps conclusions
  → Creates handoff summary for new session
```

**When:** 10+ files read, "reduce tokens", "summarize session"

---

## Methodology — Product

### Capture → Process → Memo

```
┌─────────┐      ┌─────────┐      ┌─────────┐
│  TODO   │ ──►  │ PROCESS │ ──►  │  MEMO   │
│ Capture │      │  Work   │      │ Archive │
└─────────┘      └─────────┘      └─────────┘
```

| Type | Example |
|------|---------|
| **Task** | "Fix garden fence" → notes → archived |
| **IT Infra** | Server IP/password → config experience → searchable |
| **Reading** | Book/URL → key takeaways → knowledge base |
| **Buying** | Wishlist + price → review → purchase history |
| **Trip** | Destination + dates → photos → trip memoir |

---

## Methodology — Development

### How Claude Code builds this project

1. **Explore** — LSP, grep, codebase-memory graph (not full file reads)
2. **Plan** — `EnterPlanMode` for multi-file changes
3. **Build** — Agents write code (frontend/backend split)
4. **Review** — `code-reviewer` agent runs after significant changes
5. **Document** — `document-writer` agent updates docs
6. **Deploy** — `vercel` CLI or `git push` to Vercel

### Context Management

- `context-reduce` skill compresses large sessions
- Grep + offset/limit over full file reads
- Codebase-memory graph: **1,170 nodes, 2,001 edges** — structural queries in ~500 tokens

---

## Triggers — When Agents Activate

| Trigger | Agent |
|---------|-------|
| "Write a React component" | **frontend-code-writer** |
| "Create an API endpoint" | **backend-code-writer** |
| "Review this code" / after 50+ lines | **code-reviewer** |
| "The dashboard is slow" | **frontend-blamer** |
| "500 errors in production" | **backend-blamer** |
| "Write a README" / after new module | **document-writer** |
| "Configure systemd on Ubuntu" | **ubuntu-sysadmin** |

| Trigger | Skill |
|---------|-------|
| "How do I configure X library?" | **context7-mcp** |
| "Compress context" / 10+ files read | **context-reduce** |

---

## Commands — Development & Build

### Development

```bash
cd frontend && npm run dev          # Vite on :5173
cd backend && npm run dev           # Express on :3001 (tsx watch)
cd backend && npm run seed          # Seed database
```

### Build

```bash
cd frontend && npm run build        # → frontend/dist/
cd backend && npm run build         # TypeScript compile
```

---

## Commands — Deploy & Database

### Deploy

```bash
vercel                              # Deploy to Vercel
vercel env pull                     # Pull env vars (.env.local)
```

### Database (Turso)

```bash
turso db shell second-brain         # Interactive SQL
turso db tokens create second-brain # Generate auth token
```

---

## Plugins & Integrations

| Plugin | Purpose |
|--------|---------|
| **github** | PRs, issues, gh CLI |
| **vercel** | Deploy, logs, toolbar |
| **playwright** | E2E testing, browser automation |
| **figma** | Design-to-code, Code Connect |
| **chrome-devtools** | Lighthouse, performance traces |
| **code-review** | Automated review |
| **skill-creator** | Create new skills |
| **security-guidance** | Security best practices |
| **commit-commands** | Git workflow |

### MCP Servers

- **codebase-memory** — Knowledge graph (1,170 nodes, 2,001 edges)
- **context7** — Live library documentation

---

<!-- _class: lead -->

# Thank You

**second-brain-claude.vercel.app**

React 18 · TypeScript · Vite · Tailwind · Zustand · Express · SQLite · Turso · Vercel

7 agents · 2 skills · 9 plugins · codebase-memory graph

_Capture · Process · Memo — A personal knowledge base you own_
