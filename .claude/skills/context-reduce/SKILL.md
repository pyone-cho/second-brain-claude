---
name: context-reduce
description: Activate when context is getting large, when the user says "compress context", "summarize session", "reduce tokens", "compact context", "context too long", or when you notice you've read many files and context is growing unwieldy.
---

# Context Reduce

Manage and compress Claude Code context to keep sessions fast and cost-efficient.

## When to Use

- User says: "compress context", "reduce tokens", "summarize session", "compact", "context too long"
- You've read 10+ files and context is growing large
- User starts a new major task and wants a clean slate
- Before handing off work to a new session

## Strategies

### 1. Smart File Reading (Prevention)

Before reading a file, check if you really need the full content:

- **Use Grep first** to find the exact lines you need, then Read with offset/limit
- **Use LSP** (goToDefinition, findReferences) instead of reading entire files to trace code
- **Use `limit` parameter** on Read to get only the first N lines
- **Use `offset` parameter** to skip to a specific section
- **Read headers/types only** — for TypeScript files, the type definitions and exports are often enough

Example: Instead of reading a 500-line file, grep for the function name, then read 30 lines around it.

### 2. File Summarization

When you've read a large file and need to remember it but free context:

Create a compact summary with only:
- **Exports**: what functions/classes/types this file exports
- **Key interfaces**: the shapes other code depends on
- **Important constants**: config values, magic strings
- **Dependencies**: what it imports that matters

Skip: internal implementation details, comments, boilerplate, error handling patterns.

Format:
```
## file.ts (summarized)
- Exports: createUser, deleteUser, updateUser
- Types: User { id, name, email, role }
- Depends on: db.ts, jwt.ts
- Notes: deleteUser is soft-delete
```

### 3. Session Compactor

When context is too large and you need to continue working, create a handoff summary:

```markdown
## Session Context (compacted)

### What was done
- [List completed tasks with file paths]

### What's pending
- [List remaining work]

### Key decisions made
- [Architecture choices, approach decisions]

### Current file state
- [Files modified, their current status]

### Important context
- [Non-obvious facts needed to continue]

### Next step
- [The immediate next action]
```

Tell the user: "Context is getting large. I've created a compact summary above. You can start a new session and paste this summary to continue where we left off."

### 4. Project Context Map

When starting a task that touches many files, generate a compact map:

```markdown
## Context Map for [task]

### Files involved
- `path/to/file.ts` — what it does (one line)
- `path/to/other.ts` — what it does (one line)

### Key types/interfaces
- TypeName — fields that matter

### Entry points
- Where to start reading

### Gotchas
- Non-obvious constraints or patterns
```

### 5. Conversation Compression

When the conversation has many tool results that are no longer needed:

- Summarize what was learned from each tool call in one line
- Discard the raw tool output from your working memory
- Keep only the conclusions, not the evidence

## Rules

1. **Never re-read a file you already have in context** — reference it by path and what you learned
2. **Prefer grep + offset/limit over full file reads** — always
3. **Summarize after every 5+ file reads** — create a compact reference and stop quoting raw content
4. **When creating handoff summaries, be specific** — vague summaries like "worked on the backend" are useless; include file paths, function names, and what changed
5. **Don't summarize CLAUDE.md** — it's already compact and auto-loaded
