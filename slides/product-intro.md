# Second Brain — Product Intro

> A short slide deck for presenting the product. 4–6 slides, presenter-friendly.

---

## Slide 1 — Title

# Second Brain 🧠

**A personal knowledge management system**

Capture everything. Process with focus. Archive forever.

🔗 **second-brain-claude.vercel.app**

---

## Slide 2 — The Problem

> _People capture ideas everywhere but lose them everywhere._

| Pain Point | Result |
|---|---|
| Tasks in notes, reminders, random apps | Nothing gets done |
| Bookmarks pile up unread | Zero retention |
| Credentials & infra scattered | Downtime & frustration |
| Trip ideas forgotten | No planning happens |

**Second Brain** gives you **one place** for all of it — with a structured workflow that actually works.

---

## Slide 3 — The Workflow

```
┌─────────┐      ┌─────────┐      ┌─────────┐
│  TODO   │ ──►  │ PROCESS │ ──►  │  MEMO   │
│ Capture │      │  Do it  │      │ Archive │
└─────────┘      └─────────┘      └─────────┘
```

1. **Todo** — Quick capture. Just dump it in.
2. **Process** — Add notes, credentials, experience while working.
3. **Memo** — Archive forever. Full-text search. Never lose knowledge again.

_(Applicable to ALL item types: tasks, reading, purchases, IT infra, trips)_

---

## Slide 4 — What You Can Track (6 Types)

| Type | Example |
|---|---|
| 📋 **Ordinary Task** | "Fix the garden fence" |
| 🖥️ **IT Infra** | Server configs, IPs, passwords |
| 📚 **Reading** | Books & websites with progress |
| 🛒 **Buying** | Wishlist → Own with prices |
| ✈️ **Trip** | Destinations, companions, photos |

Every type has **custom fields** at each lifecycle stage.

---

## Slide 5 — Key Features

| Feature | Detail |
|---|---|
| 🔐 **Auth** | Login / Register with password strength |
| 🌗 **Dark mode** | Light, dark, system preference |
| 📊 **Dashboard** | Stats, recent activity, quick-add |
| 🔍 **Full-text search** | Across all memo items with filters |
| 📌 **Pin / Favorite** | Highlight important items |
| 🔒 **Encrypted passwords** | AES-256-GCM for IT infra credentials |
| 📱 **Responsive** | Mobile-first with iOS safe area support |
| 🗂️ **Card grid + table views** | Toggle between views |
| 🏷️ **Tags & categories** | Organize everything |

---

## Slide 6 — Tech & Deployment

| Layer | Tech |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Backend | Node.js, Express, TypeScript |
| Database (local) | SQLite (better-sqlite3) |
| Database (prod) | **Turso** — hosted libSQL |
| Hosting | **Vercel** — serverless + edge CDN |

✅ **Live on Vercel** with Turso database  
✅ **Free to deploy** your own  
✅ **Open source** — MIT license

---

## ✋ Thank You

**Try it now:**  
🔗 [second-brain-claude.vercel.app](https://second-brain-claude.vercel.app)

**GitHub:**  
🐙 [github.com/pyone-cho/second-brain-claude](https://github.com/pyone-cho/second-brain-claude)

---

> _Built with React, TypeScript, Express, SQLite & Turso — a personal knowledge base you own._
