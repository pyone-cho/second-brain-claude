# ch-3 Personal Project — Report

github_username: pyone-cho
personal_repo_url: https://github.com/pyone-cho/second-brain-claude
project_summary: Second Brain (todo->process->memo)
slides_url: slides/pitch.md

## Methodology
The project was built incrementally using Claude Code as the primary development agent — starting with a full-stack foundation (React 18 + TypeScript + Vite + Express + SQLite), then layering on authentication via feature branches with pull requests. Each commit represents a working state: initial scaffold, auth system, MCP/skills/agents configuration. All code was generated, reviewed, and refined through iterative prompting with Claude Code rather than hand-written.

## Evidence — Claude Code usage

### MCP
- path: .mcp.json
- what: dart-mcp server — provides Dart/Flutter language support for package analysis, code generation, and development tooling within the Claude Code environment

### Skill
- path: .claude/skills/context7-mcp/SKILL.md
- what: context7-mcp skill — fetches up-to-date library and framework documentation via Context7 when working with libraries like React, Next.js, Prisma, Supabase, Express, Tailwind, etc.; resolves library IDs and queries current docs instead of relying on training data

### Agent
- path: .claude/agents/backend-code-writer.md
- what: Senior backend engineer (15+ years) that writes production-grade server-side code — API endpoints, database models and queries, auth middleware, background jobs, data processing pipelines, and service integrations. Follows security-by-default principles (parameterized queries, input validation, bcrypt/argon2 hashing) and REST API design best practices.

- path: .claude/agents/code-reviewer.md
- what: Principal engineer code reviewer (20+ years) that audits code through six lenses: correctness & logic, security (OWASP Top 10, injection, auth gaps), performance & resource management (N+1 queries, memory leaks), reliability & error handling, maintainability & design, and style & conventions. Outputs structured reviews with critical issues, warnings, suggestions, and praise.

- path: .claude/agents/document-writer.md
- what: Senior technical documentation specialist (10+ years) that writes and improves README files, API documentation, architecture docs, user guides, changelogs, and inline docstrings. Tailors documentation to audience, includes working code examples, and verifies behavior from actual implementation rather than assumptions.

- path: .claude/agents/frontend-code-writer.md
- what: Senior frontend architect & UI engineer (15+ years) that builds production-grade web applications with accessibility-first components (WCAG 2.1 AA), responsive mobile-first layouts, TypeScript type safety, and performance-minded patterns (React.memo, lazy loading, code splitting). Covers the full frontend spectrum from HTML semantics to modern build tooling.

- path: .claude/agents/ubuntu-sysadmin.md
- what: Senior Ubuntu Linux systems administrator (15+ years) for package management (apt/snap), systemd service management, user/permission administration, netplan networking, storage/filesystem management, security hardening (CIS benchmarks, AppArmor, fail2ban, SSH hardening), performance monitoring, log analysis with journalctl, and idempotent bash scripting.
