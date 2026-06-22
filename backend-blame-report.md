# BLAME REPORT: Second Brain Backend

**Date:** 2026-06-22
**Analyzer:** backend-blamer agent

---

## Issue 1: Plaintext Passwords Stored and Returned in API Responses

**Severity:** Critical
**Location:** `backend/src/db.ts:59-74`, `backend/src/models/item.ts`, `backend/src/routes/itInfra.ts:96-122`
**Category:** Security

**The Problem:**
The `tasks_it_infra` table stores `password` and `new_password` as plaintext TEXT columns. These passwords are returned unredacted in every API response that touches IT infrastructure items -- the items list endpoint, the IT infra search endpoint, and any single-item GET. There is no hashing, no encryption at rest, and no field-level redaction. Anyone who can call the API can exfiltrate every stored credential.

**Evidence:**
`db.ts` line 71-72:
```sql
password TEXT,
new_password TEXT
```

`routes/itInfra.ts` lines 118-119 pass them straight through:
```typescript
password: row.password || undefined,
new_password: row.new_password || undefined,
```

**The Fix:**
1. Encrypt passwords at rest using a proper encryption library (e.g., `crypto.createCipheriv` with AES-256-GCM).
2. Never return raw passwords in API responses. Either omit the fields entirely or return masked values like `********`.
3. If passwords must be retrievable (e.g., a credential manager), add an explicit auth-gated endpoint that returns them only on demand, not in bulk list/search responses.

---

## Issue 2: `errorHandler` Ignores `AppError.statusCode` -- All Errors Return 500

**Severity:** Critical
**Location:** `backend/src/middleware/errorHandler.ts:7-20`
**Category:** Code Quality / API Design

**The Problem:**
The `AppError` class carries a `statusCode` property, but the global `errorHandler` hardcodes `res.status(500)`. Every `AppError(400, ...)` and `AppError(404, ...)` thrown throughout the application is silently coerced to a 500 Internal Server Error. Clients cannot distinguish validation errors from actual server failures. This breaks any frontend logic that branches on HTTP status codes.

**Evidence:**
```typescript
res.status(500).json({ error: message });
```

**The Fix:**
```typescript
const statusCode = err instanceof AppError ? err.statusCode : 500;
res.status(statusCode).json({ error: message });
```

---

## Issue 3: SQL Injection via Table Name Interpolation

**Severity:** High
**Location:** `backend/src/models/item.ts:454-457`, `backend/src/models/item.ts:556-559`
**Category:** Security / Database

**The Problem:**
The `createItem` and `updateItem` functions interpolate the table name directly into SQL strings using `getDetailTable(input.type)`. While the `type` value is validated against an allowlist at the route layer (`validateType`), the model functions themselves do not enforce this invariant. If called from a different code path that skips route-level validation, the table name is unvalidated user input injected into a SQL string.

**Evidence:**
```typescript
const insertDetail = db.prepare(
  `INSERT INTO ${detailTable} (${detailColumns.join(', ')})
   VALUES (${detailPlaceholders.join(', ')})`,
);
```

**The Fix:**
Add a guard inside `getDetailTable` that throws if the type does not match the known allowlist:
```typescript
function getDetailTable(type: ItemType): string {
  const map: Record<ItemType, string> = { ... };
  const table = map[type];
  if (!table) throw new Error(`Unknown item type: ${type}`);
  return table;
}
```

---

## Issue 4: Hardcoded CORS Origin -- Breaks Production

**Severity:** High
**Location:** `backend/src/index.ts:21`
**Category:** API Design / Deployment

**The Problem:**
CORS is hardcoded to `http://localhost:5173`. In any deployed environment (staging, production, Docker), the frontend will be on a different origin and all cross-origin requests will be blocked. There is no environment variable fallback.

**The Fix:**
```typescript
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';
app.use(cors({ origin: CORS_ORIGIN, ... }));
```

---

## Issue 5: Search Query is Unsanitized -- LIKE Injection

**Severity:** High
**Location:** `backend/src/models/search.ts:75`, `backend/src/routes/itInfra.ts:50`
**Category:** Security / Database

**The Problem:**
User-supplied search terms are inserted directly into SQL `LIKE` patterns as `%${term}%` without escaping SQL LIKE metacharacters (`%`, `_`, `[`). A user searching for `%` or `_` will get wildcard matching behavior they did not intend. `%` in the search term can match everything, which is a denial-of-service vector on large datasets.

**The Fix:**
```typescript
function escapeLike(s: string): string {
  return s.replace(/[%_[]/g, (ch) => `[${ch}]`);
}
const pattern = `%${escapeLike(term)}%`;
```

---

## Issue 6: Massive N+1 and Performance Problem in Search

**Severity:** High
**Location:** `backend/src/models/search.ts:70-145`
**Category:** Performance / Database

**The Problem:**
The search function builds a query with `LIKE '%term%'` across ~25 columns per search term, joined by `OR`. This forces a full table scan on every search because leading-wildcard LIKE patterns cannot use indexes. With multiple search terms, the number of OR clauses multiplies. For N terms, you get N * 25 OR conditions. The same table is LEFT JOINed 5 times, meaning SQLite must evaluate all LIKE conditions against the cross-join result.

**The Fix:**
1. Use SQLite's FTS5 (Full-Text Search) extension, which is purpose-built for this.
2. If FTS5 is not viable, move text search into application code after fetching candidate rows.
3. Add pagination -- the query has `LIMIT 200` but no `OFFSET`.

---

## Issue 7: Duplicated Code -- `flattenDetailColumns` / `flattenForSearch` / Tag Fetching

**Severity:** Medium
**Location:** `backend/src/models/item.ts:299-357`, `backend/src/models/search.ts:294-327`, tag-fetching in `item.ts:172-193`, `search.ts:191-207`, `itInfra.ts:76-93`
**Category:** Code Quality

**The Problem:**
The column-flattening logic is copy-pasted between `item.ts` and `search.ts` with slight variations. The tag-fetching logic is copy-pasted in three separate locations. The field list definitions are also duplicated. Any time a new item type or field is added, every copy must be updated in sync.

**The Fix:**
Extract shared logic into a single utility module (e.g., `src/utils/itemFields.ts`) and import it from all consumers.

---

## Issue 8: No Input Length Validation -- Oversized Payloads Accepted

**Severity:** Medium
**Location:** `backend/src/index.ts:28`, all route handlers
**Category:** Security / API Design

**The Problem:**
`express.json()` is used with no `limit` option (defaults to 100KB). There is zero validation on the length of individual string fields. A user can submit an arbitrarily long `name`, `description`, `note`, `password`, etc.

**The Fix:**
```typescript
app.use(express.json({ limit: '1mb' }));
```
Add maximum length validation in the model/route layer for text fields.

---

## Issue 9: `requireParam` Type Coercion Issue with `req[source]`

**Severity:** Medium
**Location:** `backend/src/middleware/validate.ts:30`
**Category:** Code Quality

**The Problem:**
`req[source]?.[param]` works for `body` and `params`, but `req.query` is of type `qs.ParsedQs`, where values can be `string | ParsedQs | (string | ParsedQs)[]`. Array query parameters silently become comma-joined strings instead of throwing validation errors.

**The Fix:**
Add an explicit check for array values in query parameters and reject them.

---

## Issue 10: Orphaned Tags Never Cleaned Up

**Severity:** Medium
**Location:** `backend/src/models/item.ts:562-579`
**Category:** Database / Code Quality

**The Problem:**
When tags are replaced during an item update, the old `item_tags` entries are deleted, but the `tags` table rows themselves are never cleaned up. Over time, the `tags` table accumulates orphaned entries.

**The Fix:**
```typescript
db.prepare(`
  DELETE FROM tags WHERE id NOT IN (SELECT DISTINCT tag_id FROM item_tags)
`).run();
```

---

## Issue 11: No Rate Limiting on Any Endpoint

**Severity:** Medium
**Location:** `backend/src/index.ts`
**Category:** Security

**The Problem:**
There is no rate limiting middleware. The search endpoints perform expensive LIKE queries. Without rate limiting, a client can flood the server with search requests, causing CPU exhaustion on the SQLite database.

**The Fix:**
```typescript
import rateLimit from 'express-rate-limit';
app.use('/api/search', rateLimit({ windowMs: 60000, max: 30 }));
```

---

## Issue 12: No Request Body Size Limit for Non-JSON Content Types

**Severity:** Low
**Location:** `backend/src/index.ts`
**Category:** Security

**The Problem:**
Only `express.json()` is configured. There is no explicit rejection of other content types, meaning a large `text/plain` or `multipart/form-data` body could still be received and buffered.

**The Fix:**
Explicitly reject other content types, or set the `type` option on `express.json()`.

---

## Issue 13: `stats.ts` Uses Raw `db` Import Instead of Model Layer

**Severity:** Low
**Location:** `backend/src/routes/stats.ts`
**Category:** Code Quality

**The Problem:**
The stats route directly imports `db` and runs raw SQL, bypassing the model layer entirely. This breaks the architectural separation between routes and data access.

**The Fix:**
Move the stats queries into a `src/models/stats.ts` module and have the route call model functions.

---

## Issue 14: `itInfra.ts` Duplicates SQL Queries Instead of Reusing Model Layer

**Severity:** Low
**Location:** `backend/src/routes/itInfra.ts:43-128`
**Category:** Code Quality

**The Problem:**
The IT infra search endpoint bypasses the model layer entirely, running its own raw SQL and manually constructing the response shape. It duplicates tag-fetching logic and uses `as FullItem[]` type assertions that don't conform to the actual interface.

**The Fix:**
Use the existing `searchItems` function from the search model, or create a dedicated `searchItInfra` function in the model layer.

---

## Issue 15: `.gitignore` Pattern `data/*.db` Misses `.db-shm`

**Severity:** Low
**Location:** `backend/.gitignore`
**Category:** Code Quality

**The Problem:**
The backend `.gitignore` lists `data/*.db-journal` but not `data/*.db-shm`. The `.db-shm` file is only ignored because the root `.gitignore` has a global `*.db-shm` pattern. This is fragile.

**The Fix:**
Add `data/*.db-shm` to the backend `.gitignore`.

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 2 |
| High | 4 |
| Medium | 5 |
| Low | 4 |
| **Total** | **15** |

### Top 3 Items Requiring Immediate Attention

1. **Plaintext password storage and exposure in API responses** (`Critical`) -- Credentials for IT infrastructure are stored unencrypted and returned in every list/search response. Data breach waiting to happen.

2. **All errors return HTTP 500** (`Critical`) -- The `errorHandler` ignores `AppError.statusCode`, making the API unusable for clients that branch on HTTP status codes.

3. **No CORS configuration for production** (`High`) -- Hardcoded to `localhost:5173`, the API will reject all browser requests in any deployed environment.

### Overall Assessment

The codebase has a reasonable architecture -- the separation into routes/models/middleware is sound, the use of `better-sqlite3` with transactions and WAL mode is appropriate, and the validation middleware (`validate.ts`) is well-designed with proper allowlist validation.

However, the codebase has two critical security issues and several high-severity problems that should be addressed before any deployment beyond local development. The pervasive code duplication between `item.ts`, `search.ts`, and `itInfra.ts` is a maintainability hazard that will compound as the project grows.
