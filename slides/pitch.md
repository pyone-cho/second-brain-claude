---
marp: true
paginate: true
transition: fade
# PechaKucha: 6 slides, 20s auto-advance. Do not change the count.
auto-advance: 20
---

<!-- slide 1 -->
# Who's my person?
<!-- 20s -->

**Knowledge workers & IT professionals** who juggle tasks, reading lists, purchases, and trip plans across sticky notes, browser tabs, and scattered apps — with **no single system** to move things from "I should do this" → "I'm doing it" → "done and saved."

---

<!-- slide 2 -->
# Their problem
<!-- 20s -->

- 📋 Tasks, books, articles, shopping, trips — all tracked in **different places**
- 🔑 IT infra credentials (IPs, passwords, configs) stored in **plain text files**
- 🧠 Knowledge from completed tasks and readings is **lost**, not searchable
- 🔄 No simple **Todo → Doing → Done** lifecycle with knowledge capture

---

<!-- slide 3 -->
# What I built
<!-- 20s -->

**Second Brain** — a personal knowledge management system with 3 lifecycles:

| Stage | Purpose |
|-------|---------|
| **Todo** | Quick-capture queue (tasks, books, URLs, shopping, trips) |
| **Process** | Active work with rich notes, photos, IT infra details |
| **Memo** | Archived knowledge — full-text searchable forever |

6 item types × custom categories × dark mode × mobile-first

---

<!-- slide 4 -->
# How I built it
<!-- 20s -->

- **MCP:** context7-mcp for real-time library docs (React, Express, SQLite)
- **Skill:** context7-mcp skill — fetches current API docs on demand
- **Agent:** code-reviewer, backend-code-writer, frontend-code-writer
- **Stack:** React 18 + TypeScript + Vite + Tailwind + Express + SQLite
- **Auth:** Login/register with password strength, route guards, Zustand
- **API:** Full CRUD, search, stats, IT infra endpoints — all validated

---

<!-- slide 5 -->
# Why it matters
<!-- 20s -->

- 🔍 **Never lose knowledge again** — every completed task/reading is searchable
- 🔐 **IT infra in one place** — URLs auto-linked, passwords copyable, IPs validated
- 📱 **Works everywhere** — responsive, dark mode, offline-ready (localStorage mock API)
- 🏷️ **Your system, your way** — custom categories, tags, priorities, pin favorites
- 🚀 **Open source** — self-hostable, SQLite backend, zero vendor lock-in

---

<!-- slide 6 -->
# Done checklist
<!-- 20s -->

- [x] repo public
- [x] MCP + skill + agent used
- [x] report.md in team repo
- [x] Frontend: 6 item types, lifecycle, auth, dark mode, search, tables
- [x] Backend: Express + SQLite, full CRUD, search, stats, IT infra
