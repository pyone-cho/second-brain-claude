<!-- ch-5 personal-project report.
     Copy this file to:  ch-5/<your-github-username>/report.md  in your TEAM repo.
     Fill every section. Delete the <!-- hint --> comments as you go. -->

# ch-5 Personal Project — Report

## Project

- **GitHub username:** @pyone-cho
- **Repo URL:** https://github.com/pyone-cho/second-brain-claude
- **Live / download URL:** https://second-brain-claude.vercel.app/login


## AI Tools Used

### MCP Servers

- **context7-mcp** — Fetched live library docs for React, Express, Zustand, Tailwind, @libsql/client instead of relying on training data
- **codebase-memory-mcp** — Knowledge graph (1,170 nodes, 2,001 edges) for structural code queries, architecture overview, and dependency tracing in ~500 tokens
- **chrome-devtools-mcp** — Lighthouse audits, performance traces, and browser automation for frontend debugging
- **vercel** — Deployment management, build logs, environment variables, and production monitoring

### Skills

- **path:** .claude/skills/context7-mcp/SKILL.md
- **context7-mcp skill** — Auto-activated on library/framework questions to fetch current API docs with code examples
- **path:** .claude/skills/context-reduce/SKILL.md
- **context-reduce** — Compressed large sessions after 10+ file reads, created handoff summaries for new sessions
- **path** - .clude/skills/ui-ux-pro-max/SKILL.md
- **ui-ux-pro-max** — Generated design system (dark theme, Space Grotesk + DM Sans typography, color palette) for Marp slides

### Subagents

- **path:** .claude/agents/frontend-code-writer.md
- **what** — Built React components, pages, Zustand stores, and Tailwind styling across 6 pages and 7 component groups
- **path:** .claude/agents/backend-code-writer.md
- **what** — Created Express API endpoints, SQLite models, JWT auth middleware, and route handlers for 6 API groups
- **path:** .claude/agents/code-reviewer.md
- **what** — Audited code quality after significant changes, caught bugs and anti-patterns before deploy
- **path:** .claude/agents/frontend-blamer.md
- **what** — Identified React performance issues, unnecessary re-renders, and accessibility violations
- **path:** .claude/agents/backend-blamer.md
- **what** — Pinpointed slow queries, bad patterns, and error-prone code in Express/SQLite layer
**path:** .claude/agents/document-writer.md
- **what** — Generated README, API docs, tech-stack.md, and inline docstrings
- **path:** .claude/agents/ubuntu-sysadmin.md
- **what** — Server configuration, systemd services, and deployment troubleshooting

### Plugins

- **github** — PR management, issue tracking, and gh CLI operations
- **playwright** — E2E testing and browser automation for UI verification
- **figma** — Design-to-code workflows and Code Connect mappings
- **code-review** — Automated code review on pull requests
- **security-guidance** — Security best practices and vulnerability checks
- **skill-creator** — Created custom skills (context7-mcp, context-reduce)
- **commit-commands** — Git workflow and commit message conventions

### Other

- **Marp** — Markdown-based presentation framework for slides (tech-stack.md, pitch.md, product-intro.md)
- **Zustand persist** — Client-side state persistence for auth and app state
- **Turso** — Cloud-hosted SQLite (libSQL) for production database

## Trigger / Command

### Agents

#### frontend-code-writer
- **Trigger:** User asks to build, refactor, or enhance React components, layouts, or state management
- **Command:** `Agent tool → frontend-code-writer`

#### backend-code-writer
- **Trigger:** User asks to create API endpoints, server logic, database models, or middleware
- **Command:** `Agent tool → backend-code-writer`

#### frontend-blamer
- **Trigger:** User reports UI bugs, slow pages, performance issues, or accessibility violations
- **Command:** `Agent tool → frontend-blamer`

#### backend-blamer
- **Trigger:** User reports 500 errors, slow APIs, bad patterns, or backend quality issues
- **Command:** `Agent tool → backend-blamer`

#### code-reviewer
- **Trigger:** After writing 50+ lines of code, or user says "review this" or "check for issues"
- **Command:** `Agent tool → code-reviewer`

#### document-writer
- **Trigger:** After creating a new module, or user says "write docs" or "update README"
- **Command:** `Agent tool → document-writer`

#### ubuntu-sysadmin
- **Trigger:** User needs Ubuntu server config, systemd services, networking, or security hardening
- **Command:** `Agent tool → ubuntu-sysadmin`

### Skills

#### context7-mcp
- **Trigger:** User asks about a library, framework, API reference, or needs code examples
- **Command:** `/context7-mcp` or auto-triggered on library questions

#### context-reduce
- **Trigger:** Context grows large (10+ files read), or user says "compress context" or "reduce tokens"
- **Command:** `/context-reduce` or "compress context"

## Tech-Stack Slides

- **Slides path:** slides/tech-stack.md

## User Feedback (pick ONE — use just one template)

<!-- Copy ONE of these into your repo, fill it, and link it here:
       interview-template.md   — you talked to a real user
       feedback-template.md    — you collected written feedback
       issues-template.md      — you filed GitHub issues from feedback
     Then link the filled file below. -->

- **Feedback file path:** <!-- e.g. feedback/interview-notes.md -->
- **Open issues:** <!-- links to the GitHub issues you opened, if any -->
