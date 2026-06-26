import express from 'express';
import cors from 'cors';
import { createClient } from '@libsql/client';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

// ── Database ─────────────────────────────────────────────────

const db = createClient({
  url: process.env.TURSO_DATABASE_URL || 'file:./data/second-brain.db',
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '1mb' }));

// ── Field definitions ────────────────────────────────────────

const TODO_FIELDS: Record<string, string[]> = {
  task: ['category', 'name', 'due_date', 'priority', 'problem'],
  'task-it-infra': ['category', 'name', 'due_date', 'priority'],
  'reading-book': ['source_type', 'title', 'author', 'url', 'priority'],
  'reading-website': ['source_type', 'title', 'author', 'url', 'priority'],
  buying: ['category', 'price', 'priority'],
  trip: ['destination', 'companions', 'trip_date', 'duration', 'priority'],
};

const PROCESS_MEMO_FIELDS: Record<string, string[]> = {
  task: ['experience', 'note', 'photo'],
  'task-it-infra': [
    'category', 'infra', 'item_name', 'kind', 'description',
    'url_ip', 'username', 'password', 'new_password', 'remark',
  ],
  'reading-book': ['book_name', 'website_name', 'event', 'knowledge', 'note', 'book_pdf', 'progress'],
  'reading-website': ['book_name', 'website_name', 'event', 'knowledge', 'note', 'book_pdf', 'progress'],
  buying: ['desired_usability', 'usable_where'],
  trip: ['photo_goals', 'experience', 'photo'],
};

const VALID_TYPES = ['task', 'task-it-infra', 'reading-book', 'reading-website', 'buying', 'trip'];
const VALID_STATUSES = ['todo', 'process', 'memo'];

function getDetailTable(type: string): string {
  switch (type) {
    case 'task': return 'tasks_ordinary';
    case 'task-it-infra': return 'tasks_it_infra';
    case 'reading-book':
    case 'reading-website': return 'readings';
    case 'buying': return 'purchases';
    case 'trip': return 'trips';
    default: throw new Error(`Unknown type: ${type}`);
  }
}

// ── Auth helpers ──────────────────────────────────────────────

const JWT_SECRET = process.env.JWT_SECRET || 'second-brain-dev-secret-change-in-production';
const JWT_EXPIRY = '7d';

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const computed = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(hash));
}

function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

// ── Lazy migrations ──────────────────────────────────────────

let migrationsDone = false;
async function ensureMigrations() {
  if (migrationsDone) return;
  const isLocal = !(process.env.TURSO_DATABASE_URL || '').startsWith('libsql://');
  if (isLocal) {
    await db.execute('PRAGMA journal_mode = WAL');
    await db.execute('PRAGMA foreign_keys = ON');
  }
  await db.batch([
    { sql: `CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, created_at TEXT DEFAULT (datetime('now')))`, args: [] },
    { sql: `CREATE TABLE IF NOT EXISTS categories (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, color TEXT, icon TEXT, created_at TEXT DEFAULT (datetime('now')))`, args: [] },
    { sql: `CREATE TABLE IF NOT EXISTS items (id TEXT PRIMARY KEY, type TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'todo', pinned INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')))`, args: [] },
    { sql: `CREATE TABLE IF NOT EXISTS tasks_ordinary (item_id TEXT PRIMARY KEY REFERENCES items(id) ON DELETE CASCADE, category TEXT, name TEXT, due_date TEXT, priority TEXT DEFAULT 'medium', problem TEXT, experience TEXT, note TEXT, photo TEXT)`, args: [] },
    { sql: `CREATE TABLE IF NOT EXISTS tasks_it_infra (item_id TEXT PRIMARY KEY REFERENCES items(id) ON DELETE CASCADE, category TEXT, name TEXT, due_date TEXT, priority TEXT DEFAULT 'medium', infra TEXT, item_name TEXT, kind TEXT, description TEXT, url_ip TEXT, username TEXT, password TEXT, new_password TEXT, remark TEXT)`, args: [] },
    { sql: `CREATE TABLE IF NOT EXISTS readings (item_id TEXT PRIMARY KEY REFERENCES items(id) ON DELETE CASCADE, source_type TEXT, title TEXT, author TEXT, url TEXT, priority TEXT DEFAULT 'medium', book_name TEXT, website_name TEXT, event TEXT, knowledge TEXT, note TEXT, book_pdf TEXT, progress INTEGER DEFAULT 0)`, args: [] },
    { sql: `CREATE TABLE IF NOT EXISTS purchases (item_id TEXT PRIMARY KEY REFERENCES items(id) ON DELETE CASCADE, category TEXT, price REAL, priority TEXT DEFAULT 'medium', desired_usability TEXT, usable_where TEXT)`, args: [] },
    { sql: `CREATE TABLE IF NOT EXISTS trips (item_id TEXT PRIMARY KEY REFERENCES items(id) ON DELETE CASCADE, destination TEXT, companions TEXT, trip_date TEXT, duration TEXT, priority TEXT DEFAULT 'medium', photo_goals TEXT, experience TEXT, photo TEXT)`, args: [] },
    { sql: `CREATE TABLE IF NOT EXISTS tags (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE)`, args: [] },
    { sql: `CREATE TABLE IF NOT EXISTS item_tags (item_id TEXT NOT NULL REFERENCES items(id) ON DELETE CASCADE, tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE, PRIMARY KEY (item_id, tag_id))`, args: [] },
  ]);
  migrationsDone = true;
}

app.use(async (_req, _res, next) => {
  await ensureMigrations();
  next();
});

// ── Helpers ──────────────────────────────────────────────────

function escapeLike(s: string): string {
  return s.replace(/[%_[]/g, (ch) => `[${ch}]`);
}

function flattenDetailColumns(row: Record<string, unknown>, type: string): Record<string, unknown> {
  const result: Record<string, unknown> = { ...row };
  const toDrop = new Set<string>();

  switch (type) {
    case 'task':
      result['category'] = row['t_category'];
      result['name'] = row['t_name'];
      result['due_date'] = row['t_due_date'];
      result['priority'] = row['t_priority'];
      toDrop.add('t_category'); toDrop.add('t_name'); toDrop.add('t_due_date'); toDrop.add('t_priority');
      break;
    case 'task-it-infra':
      result['category'] = row['ti_category'];
      result['name'] = row['ti_name'];
      result['due_date'] = row['ti_due_date'];
      result['priority'] = row['ti_priority'];
      toDrop.add('ti_category'); toDrop.add('ti_name'); toDrop.add('ti_due_date'); toDrop.add('ti_priority');
      break;
    case 'reading-book':
    case 'reading-website':
      result['priority'] = row['r_priority'];
      result['note'] = row['r_note'];
      toDrop.add('r_priority'); toDrop.add('r_note');
      break;
    case 'buying':
      result['category'] = row['p_category'];
      result['priority'] = row['p_priority'];
      toDrop.add('p_category'); toDrop.add('p_priority');
      break;
    case 'trip':
      result['priority'] = row['tr_priority'];
      result['experience'] = row['tr_experience'];
      result['photo'] = row['tr_photo'];
      toDrop.add('tr_priority'); toDrop.add('tr_experience'); toDrop.add('tr_photo');
      break;
  }

  for (const col of toDrop) delete result[col];
  return result;
}

const ITEMS_JOIN_SQL = `
  SELECT i.*,
    t.category AS t_category, t.name AS t_name, t.due_date AS t_due_date,
    t.priority AS t_priority, t.problem, t.experience, t.note, t.photo,
    ti.category AS ti_category, ti.name AS ti_name, ti.due_date AS ti_due_date,
    ti.priority AS ti_priority, ti.infra, ti.item_name, ti.kind,
    ti.description, ti.url_ip, ti.username, ti.password, ti.new_password, ti.remark,
    r.source_type, r.title, r.author, r.url, r.priority AS r_priority,
    r.book_name, r.website_name, r.event, r.knowledge, r.note AS r_note,
    r.book_pdf, r.progress,
    p.category AS p_category, p.price, p.priority AS p_priority,
    p.desired_usability, p.usable_where,
    tr.destination, tr.companions, tr.trip_date, tr.duration,
    tr.priority AS tr_priority,
    tr.photo_goals, tr.experience AS tr_experience, tr.photo AS tr_photo
  FROM items i
  LEFT JOIN tasks_ordinary t ON i.id = t.item_id
  LEFT JOIN tasks_it_infra ti ON i.id = ti.item_id
  LEFT JOIN readings r ON i.id = r.item_id
  LEFT JOIN purchases p ON i.id = p.item_id
  LEFT JOIN trips tr ON i.id = tr.item_id
`;

async function getTagsForItems(itemIds: string[]): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>();
  if (itemIds.length === 0) return map;
  const placeholders = itemIds.map(() => '?').join(',');
  const result = await db.execute({
    sql: `SELECT it.item_id, t.name FROM item_tags it JOIN tags t ON t.id = it.tag_id WHERE it.item_id IN (${placeholders}) ORDER BY t.name`,
    args: itemIds,
  });
  for (const row of result.rows as any[]) {
    const tags = map.get(row.item_id) || [];
    tags.push(row.name);
    map.set(row.item_id, tags);
  }
  return map;
}

function buildFullItem(row: Record<string, unknown>, tags: string[]): Record<string, unknown> {
  const type = row.type as string;
  const todoFields = TODO_FIELDS[type] || [];
  const memoFields = PROCESS_MEMO_FIELDS[type] || [];

  const todo: Record<string, unknown> = {};
  for (const f of todoFields) {
    if (row[f] !== null && row[f] !== undefined) todo[f] = row[f];
  }

  const processMemo: Record<string, unknown> = {};
  for (const f of memoFields) {
    if (f === 'password' || f === 'new_password') continue; // redact
    if (row[f] !== null && row[f] !== undefined) processMemo[f] = row[f];
  }

  return {
    id: row.id,
    type,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    pinned: !!(row.pinned as number),
    tags,
    todo,
    processMemo,
  };
}

async function getItemById(id: string): Promise<Record<string, unknown> | null> {
  const result = await db.execute({
    sql: `${ITEMS_JOIN_SQL} WHERE i.id = ?`,
    args: [id],
  });
  if (result.rows.length === 0) return null;
  const row = result.rows[0] as Record<string, unknown>;
  const flat = flattenDetailColumns(row, row.type as string);
  const tagsMap = await getTagsForItems([id]);
  return buildFullItem(flat, tagsMap.get(id) || []);
}

// ── Health ───────────────────────────────────────────────────

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Auth middleware ────────────────────────────────────────────

// Extend Express Request to carry authenticated user id
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

function authenticate(req: express.Request, res: express.Response, next: express.NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  try {
    const token = header.slice(7);
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string };
    req.userId = payload.sub;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// ── Auth routes ────────────────────────────────────────────────

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body || {};

    // Validate
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Email is required' });
    }
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check uniqueness
    const existing = await db.execute({
      sql: 'SELECT id FROM users WHERE email = ?',
      args: [email.toLowerCase().trim()],
    });
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const id = crypto.randomUUID();
    const passwordHash = hashPassword(password);

    await db.execute({
      sql: 'INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)',
      args: [id, name.trim(), email.toLowerCase().trim(), passwordHash],
    });

    const token = signToken(id);
    res.status(201).json({
      data: {
        user: { id, name: name.trim(), email: email.toLowerCase().trim() },
        token,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find user
    const result = await db.execute({
      sql: 'SELECT id, name, email, password_hash FROM users WHERE email = ?',
      args: [normalizedEmail],
    });

    if (result.rows.length === 0) {
      // Auto-register for demo-friendly experience
      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
      }
      const id = crypto.randomUUID();
      const passwordHash = hashPassword(password);
      // Generate a name from the email
      const name = normalizedEmail.split('@')[0];

      await db.execute({
        sql: 'INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)',
        args: [id, name, normalizedEmail, passwordHash],
      });

      const token = signToken(id);
      return res.json({
        data: {
          user: { id, name, email: normalizedEmail },
          token,
        },
      });
    }

    const user = result.rows[0] as Record<string, any>;
    if (!verifyPassword(password, user.password_hash as string)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = signToken(user.id as string);
    res.json({
      data: {
        user: { id: user.id, name: user.name, email: user.email },
        token,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Items ────────────────────────────────────────────────────

app.get('/api/items', async (req, res) => {
  try {
    const status = req.query.status as string;
    const type = req.query.type as string;
    const conditions: string[] = [];
    const values: any[] = [];
    if (status) { conditions.push('i.status = ?'); values.push(status); }
    if (type) { conditions.push('i.type = ?'); values.push(type); }
    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await db.execute({ sql: `${ITEMS_JOIN_SQL} ${where} ORDER BY i.pinned DESC, i.created_at DESC`, args: values });
    if (result.rows.length === 0) return res.json({ data: [] });

    const itemIds = result.rows.map((r: any) => r.id);
    const tagsMap = await getTagsForItems(itemIds);
    const items = result.rows.map((row: any) => {
      const flat = flattenDetailColumns(row, row.type);
      return buildFullItem(flat, tagsMap.get(row.id) || []);
    });
    res.json({ data: items });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/items/:id', async (req, res) => {
  try {
    const item = await getItemById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json({ data: item });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/items', async (req, res) => {
  try {
    const { type, status, pinned, tags, ...rest } = req.body;
    if (!type || !VALID_TYPES.includes(type)) {
      return res.status(400).json({ error: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}` });
    }
    const itemStatus = status || 'todo';
    if (!VALID_STATUSES.includes(itemStatus)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` });
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const pinnedVal = pinned ? 1 : 0;

    const detailTable = getDetailTable(type);
    const todoFields = TODO_FIELDS[type] || [];
    const memoFields = PROCESS_MEMO_FIELDS[type] || [];

    const detailCols = ['item_id'];
    const detailPlaceholders = ['?'];
    const detailValues: any[] = [id];

    if (type === 'reading-book') {
      detailCols.push('source_type'); detailPlaceholders.push('?'); detailValues.push('book');
    } else if (type === 'reading-website') {
      detailCols.push('source_type'); detailPlaceholders.push('?'); detailValues.push('website');
    }

    for (const field of [...todoFields, ...memoFields]) {
      if (field === 'source_type' && (type === 'reading-book' || type === 'reading-website')) continue;
      if (rest[field] !== undefined && rest[field] !== null) {
        detailCols.push(field);
        detailPlaceholders.push('?');
        detailValues.push(rest[field]);
      }
    }

    const statements = [
      { sql: `INSERT INTO items (id, type, status, pinned, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`, args: [id, type, itemStatus, pinnedVal, now, now] },
      { sql: `INSERT INTO ${detailTable} (${detailCols.join(', ')}) VALUES (${detailPlaceholders.join(', ')})`, args: detailValues },
    ];

    const tagNames: string[] = (tags || []).map((t: string) => t.trim()).filter((t: string) => t.length > 0);
    for (const tagName of tagNames) {
      statements.push({ sql: 'INSERT OR IGNORE INTO tags (name) VALUES (?)', args: [tagName] });
    }

    await db.batch(statements);

    // Link tags
    if (tagNames.length > 0) {
      for (const tagName of tagNames) {
        const tagResult = await db.execute({ sql: 'SELECT id FROM tags WHERE name = ?', args: [tagName] });
        if (tagResult.rows.length > 0) {
          await db.execute({ sql: 'INSERT OR IGNORE INTO item_tags (item_id, tag_id) VALUES (?, ?)', args: [id, (tagResult.rows[0] as any).id] });
        }
      }
    }

    const item = await getItemById(id);
    res.status(201).json({ data: item });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await getItemById(id);
    if (!existing) return res.status(404).json({ error: 'Item not found' });

    const { status, pinned, tags, ...rest } = req.body;
    const now = new Date().toISOString();

    const itemUpdates: string[] = ['updated_at = ?'];
    const itemValues: any[] = [now];
    if (status !== undefined) { itemUpdates.push('status = ?'); itemValues.push(status); }
    if (pinned !== undefined) { itemUpdates.push('pinned = ?'); itemValues.push(pinned ? 1 : 0); }

    const detailTable = getDetailTable(existing.type as string);
    const todoFields = TODO_FIELDS[existing.type as string] || [];
    const memoFields = PROCESS_MEMO_FIELDS[existing.type as string] || [];
    const detailUpdates: string[] = [];
    const detailValues: any[] = [];
    for (const field of [...todoFields, ...memoFields]) {
      if (rest[field] !== undefined) {
        detailUpdates.push(`${field} = ?`);
        detailValues.push(rest[field]);
      }
    }

    const statements: any[] = [
      { sql: `UPDATE items SET ${itemUpdates.join(', ')} WHERE id = ?`, args: [...itemValues, id] },
    ];
    if (detailUpdates.length > 0) {
      statements.push({ sql: `UPDATE ${detailTable} SET ${detailUpdates.join(', ')} WHERE item_id = ?`, args: [...detailValues, id] });
    }

    await db.batch(statements);

    // Replace tags if provided
    if (Array.isArray(tags)) {
      await db.execute({ sql: 'DELETE FROM item_tags WHERE item_id = ?', args: [id] });
      for (const tagName of tags) {
        const trimmed = tagName.trim();
        if (!trimmed) continue;
        await db.execute({ sql: 'INSERT OR IGNORE INTO tags (name) VALUES (?)', args: [trimmed] });
        const tagResult = await db.execute({ sql: 'SELECT id FROM tags WHERE name = ?', args: [trimmed] });
        if (tagResult.rows.length > 0) {
          await db.execute({ sql: 'INSERT OR IGNORE INTO item_tags (item_id, tag_id) VALUES (?, ?)', args: [id, (tagResult.rows[0] as any).id] });
        }
      }
      await db.execute('DELETE FROM tags WHERE id NOT IN (SELECT DISTINCT tag_id FROM item_tags)');
    }

    const updated = await getItemById(id);
    res.json({ data: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.execute({ sql: 'DELETE FROM items WHERE id = ?', args: [id] });
    if (result.rowsAffected === 0) return res.status(404).json({ error: 'Item not found' });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/items/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status || !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` });
    }
    const existing = await getItemById(id);
    if (!existing) return res.status(404).json({ error: 'Item not found' });

    const now = new Date().toISOString();
    await db.execute({ sql: 'UPDATE items SET status = ?, updated_at = ? WHERE id = ?', args: [status, now, id] });
    const updated = await getItemById(id);
    res.json({ data: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Stats ────────────────────────────────────────────────────

app.get('/api/stats', async (_req, res) => {
  try {
    const statusResult = await db.execute('SELECT status, COUNT(*) as count FROM items GROUP BY status');
    const typeResult = await db.execute('SELECT type, COUNT(*) as count FROM items GROUP BY type');

    let totalTodo = 0, totalProcess = 0, totalMemo = 0;
    for (const row of statusResult.rows as any[]) {
      if (row.status === 'todo') totalTodo = row.count;
      else if (row.status === 'process') totalProcess = row.count;
      else if (row.status === 'memo') totalMemo = row.count;
    }

    const byType: Record<string, number> = {};
    for (const row of typeResult.rows as any[]) byType[row.type] = row.count;
    for (const t of VALID_TYPES) { if (!(t in byType)) byType[t] = 0; }

    const booksResult = await db.execute("SELECT COUNT(*) as count FROM items WHERE type = 'reading-book' AND status = 'todo'");
    const tripsResult = await db.execute("SELECT COUNT(*) as count FROM items WHERE type = 'trip' AND status = 'todo'");

    res.json({
      data: {
        totalTodo, totalProcess, totalMemo, byType,
        booksToRead: (booksResult.rows[0] as any).count,
        upcomingTrips: (tripsResult.rows[0] as any).count,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Categories ───────────────────────────────────────────────

app.get('/api/categories', async (_req, res) => {
  try {
    const result = await db.execute('SELECT * FROM categories ORDER BY name');
    res.json({ data: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/categories/:id', async (req, res) => {
  try {
    const result = await db.execute({ sql: 'SELECT * FROM categories WHERE id = ?', args: [req.params.id] });
    if (result.rows.length === 0) return res.status(404).json({ error: 'Category not found' });
    res.json({ data: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/categories', async (req, res) => {
  try {
    const { name, color, icon } = req.body;
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'Missing required field: name' });
    }
    const result = await db.execute({
      sql: 'INSERT INTO categories (name, color, icon) VALUES (?, ?, ?)',
      args: [name.trim(), color || null, icon || null],
    });
    const cat = await db.execute({ sql: 'SELECT * FROM categories WHERE id = ?', args: [result.lastInsertRowid] });
    res.status(201).json({ data: cat.rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, color, icon } = req.body;
    if (name !== undefined && (typeof name !== 'string' || name.trim() === '')) {
      return res.status(400).json({ error: 'Invalid name: must be a non-empty string' });
    }
    const existing = await db.execute({ sql: 'SELECT * FROM categories WHERE id = ?', args: [id] });
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Category not found' });

    const updates: string[] = [];
    const values: any[] = [];
    if (name !== undefined) { updates.push('name = ?'); values.push(name.trim()); }
    if (color !== undefined) { updates.push('color = ?'); values.push(color); }
    if (icon !== undefined) { updates.push('icon = ?'); values.push(icon); }

    if (updates.length > 0) {
      await db.execute({ sql: `UPDATE categories SET ${updates.join(', ')} WHERE id = ?`, args: [...values, id] });
    }
    const updated = await db.execute({ sql: 'SELECT * FROM categories WHERE id = ?', args: [id] });
    res.json({ data: updated.rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/categories/:id', async (req, res) => {
  try {
    const result = await db.execute({ sql: 'DELETE FROM categories WHERE id = ?', args: [req.params.id] });
    if (result.rowsAffected === 0) return res.status(404).json({ error: 'Category not found' });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Search ───────────────────────────────────────────────────

app.get('/api/search', async (req, res) => {
  try {
    const q = req.query.q as string;
    if (!q || q.trim() === '') return res.status(400).json({ error: 'Missing required query parameter: q' });

    const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 50, 1), 200);
    const offset = Math.max(parseInt(req.query.offset as string) || 0, 0);
    const terms = q.trim().split(/\s+/).filter(t => t.length > 0);

    const conditions: string[] = [];
    const values: any[] = [];

    if (req.query.status) { conditions.push('i.status = ?'); values.push(req.query.status); }
    else { conditions.push("i.status = 'memo'"); }
    if (req.query.type) { conditions.push('i.type = ?'); values.push(req.query.type); }
    if (req.query.dateFrom) { conditions.push('i.created_at >= ?'); values.push(req.query.dateFrom); }
    if (req.query.dateTo) { conditions.push('i.created_at <= ?'); values.push(req.query.dateTo); }
    if (req.query.pinned !== undefined) { conditions.push('i.pinned = ?'); values.push(req.query.pinned === 'true' ? 1 : 0); }

    const searchClauses: string[] = [];
    const searchValues: any[] = [];
    for (const term of terms) {
      const pattern = `%${escapeLike(term)}%`;
      for (const col of [
        't.name', 't.problem', 't.experience', 't.note', 't.category',
        'ti.name', 'ti.item_name', 'ti.infra', 'ti.kind', 'ti.description', 'ti.url_ip', 'ti.remark',
        'r.title', 'r.author', 'r.book_name', 'r.website_name', 'r.event', 'r.knowledge', 'r.note',
        'p.category', 'p.desired_usability', 'p.usable_where',
        'tr.destination', 'tr.companions', 'tr.experience', 'tr.photo_goals',
      ]) {
        searchClauses.push(`${col} LIKE ?`);
        searchValues.push(pattern);
      }
    }

    const searchWhere = searchClauses.length > 0 ? `(${searchClauses.join(' OR ')})` : '1=1';
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await db.execute({
      sql: `SELECT COUNT(*) as total FROM items i LEFT JOIN tasks_ordinary t ON i.id = t.item_id LEFT JOIN tasks_it_infra ti ON i.id = ti.item_id LEFT JOIN readings r ON i.id = r.item_id LEFT JOIN purchases p ON i.id = p.item_id LEFT JOIN trips tr ON i.id = tr.item_id ${whereClause} AND ${searchWhere}`,
      args: [...values, ...searchValues],
    });
    const total = (countResult.rows[0] as any).total;

    const result = await db.execute({
      sql: `SELECT i.id, i.type, i.status, i.created_at, i.updated_at, i.pinned,
        t.category AS t_category, t.name AS t_name, t.due_date AS t_due_date,
        t.priority AS t_priority, t.problem, t.experience, t.note, t.photo,
        ti.category AS ti_category, ti.name AS ti_name, ti.due_date AS ti_due_date,
        ti.priority AS ti_priority, ti.infra, ti.item_name, ti.kind,
        ti.description, ti.url_ip, ti.username, ti.remark,
        r.source_type, r.title, r.author, r.url, r.priority AS r_priority,
        r.book_name, r.website_name, r.event, r.knowledge, r.note AS r_note,
        r.book_pdf, r.progress,
        p.category AS p_category, p.price, p.priority AS p_priority,
        p.desired_usability, p.usable_where,
        tr.destination, tr.companions, tr.trip_date, tr.duration,
        tr.priority AS tr_priority,
        tr.photo_goals, tr.experience AS tr_experience, tr.photo AS tr_photo
      FROM items i
      LEFT JOIN tasks_ordinary t ON i.id = t.item_id
      LEFT JOIN tasks_it_infra ti ON i.id = ti.item_id
      LEFT JOIN readings r ON i.id = r.item_id
      LEFT JOIN purchases p ON i.id = p.item_id
      LEFT JOIN trips tr ON i.id = tr.item_id
      ${whereClause} AND ${searchWhere}
      ORDER BY i.updated_at DESC LIMIT ? OFFSET ?`,
      args: [...values, ...searchValues, limit, offset],
    });

    const itemIds = result.rows.map((r: any) => r.id);
    const tagsMap = await getTagsForItems(itemIds);

    const highWeightFields = ['name', 'title', 'item_name', 'destination'];
    const mediumWeightFields = ['description', 'problem', 'experience', 'knowledge', 'note', 'url_ip', 'infra', 'kind', 'category', 'author', 'book_name', 'website_name'];

    const data = result.rows.map((row: any) => {
      const flat = flattenDetailColumns(row, row.type);
      let score = 0;
      for (const term of terms) {
        const lower = term.toLowerCase();
        for (const f of highWeightFields) { if (typeof flat[f] === 'string' && flat[f].toLowerCase().includes(lower)) score += 2; }
        for (const f of mediumWeightFields) { if (typeof flat[f] === 'string' && flat[f].toLowerCase().includes(lower)) score += 1; }
      }
      return { ...buildFullItem(flat, tagsMap.get(row.id) || []), matchScore: score };
    });

    data.sort((a: any, b: any) => b.matchScore - a.matchScore);
    res.json({ data, total, hasMore: offset + limit < total });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── IT Infra ─────────────────────────────────────────────────

app.get('/api/it-infra', async (req, res) => {
  try {
    const infra = req.query.infra as string;
    const conditions = ["i.type = 'task-it-infra'"];
    const values: any[] = [];
    if (infra) { conditions.push('ti.infra = ?'); values.push(infra); }

    const result = await db.execute({
      sql: `${ITEMS_JOIN_SQL} WHERE ${conditions.join(' AND ')} ORDER BY i.updated_at DESC`,
      args: values,
    });

    const itemIds = result.rows.map((r: any) => r.id);
    const tagsMap = await getTagsForItems(itemIds);
    const items = result.rows.map((row: any) => {
      const flat = flattenDetailColumns(row, row.type);
      const item = buildFullItem(flat, tagsMap.get(row.id) || []);
      delete (item.processMemo as any).password;
      delete (item.processMemo as any).new_password;
      return item;
    });
    res.json({ data: items });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/it-infra/search', async (req, res) => {
  try {
    const q = req.query.q as string;
    if (!q || q.trim() === '') return res.status(400).json({ error: 'Missing required query parameter: q' });

    const pattern = `%${escapeLike(q.trim())}%`;
    const result = await db.execute({
      sql: `SELECT i.*, ti.category, ti.name, ti.due_date, ti.priority, ti.infra,
        ti.item_name, ti.kind, ti.description, ti.url_ip, ti.username, ti.remark
      FROM items i JOIN tasks_it_infra ti ON i.id = ti.item_id
      WHERE ti.url_ip LIKE ? OR ti.item_name LIKE ? OR ti.infra LIKE ?
         OR ti.kind LIKE ? OR ti.description LIKE ? OR ti.name LIKE ?
         OR ti.remark LIKE ? OR ti.category LIKE ?
      ORDER BY i.updated_at DESC LIMIT 100`,
      args: [pattern, pattern, pattern, pattern, pattern, pattern, pattern, pattern],
    });

    const itemIds = result.rows.map((r: any) => r.id);
    const tagsMap = await getTagsForItems(itemIds);
    const items = result.rows.map((row: any) => ({
      id: row.id, type: row.type, status: row.status,
      createdAt: row.created_at, updatedAt: row.updated_at,
      pinned: !!(row.pinned as number),
      tags: tagsMap.get(row.id) || [],
      todo: { category: row.category, name: row.name, due_date: row.due_date, priority: row.priority },
      processMemo: { category: row.category, infra: row.infra, item_name: row.item_name, kind: row.kind, description: row.description, url_ip: row.url_ip, username: row.username, remark: row.remark },
    }));
    res.json({ data: items });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── 404 catch-all ────────────────────────────────────────────

app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

export default app;
