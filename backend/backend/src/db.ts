import { createClient, type Client } from '@libsql/client';

const db: Client = createClient({
  url: process.env.TURSO_DATABASE_URL || 'file:./data/second-brain.db',
  authToken: process.env.TURSO_AUTH_TOKEN,
});

/**
 * Run all migrations on startup.
 * Uses IF NOT EXISTS so it is safe to run every time.
 */
export async function runMigrations(): Promise<void> {
  // PRAGMAs are only supported on local file: databases, not Turso/libSQL remote
  const isLocal = !(process.env.TURSO_DATABASE_URL || '').startsWith('libsql://');
  if (isLocal) {
    await db.execute(`PRAGMA journal_mode = WAL`);
    await db.execute(`PRAGMA foreign_keys = ON`);
  }

  await db.batch([
    {
      sql: `CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        color TEXT,
        icon TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      )`,
      args: [],
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS items (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'todo',
        pinned INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )`,
      args: [],
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS tasks_ordinary (
        item_id TEXT PRIMARY KEY REFERENCES items(id) ON DELETE CASCADE,
        category TEXT,
        name TEXT,
        due_date TEXT,
        priority TEXT DEFAULT 'medium',
        problem TEXT,
        experience TEXT,
        note TEXT,
        photo TEXT
      )`,
      args: [],
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS tasks_it_infra (
        item_id TEXT PRIMARY KEY REFERENCES items(id) ON DELETE CASCADE,
        category TEXT,
        name TEXT,
        due_date TEXT,
        priority TEXT DEFAULT 'medium',
        infra TEXT,
        item_name TEXT,
        kind TEXT,
        description TEXT,
        url_ip TEXT,
        username TEXT,
        password TEXT,
        new_password TEXT,
        remark TEXT
      )`,
      args: [],
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS readings (
        item_id TEXT PRIMARY KEY REFERENCES items(id) ON DELETE CASCADE,
        source_type TEXT,
        title TEXT,
        author TEXT,
        url TEXT,
        priority TEXT DEFAULT 'medium',
        book_name TEXT,
        website_name TEXT,
        event TEXT,
        knowledge TEXT,
        note TEXT,
        book_pdf TEXT,
        progress INTEGER DEFAULT 0
      )`,
      args: [],
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS purchases (
        item_id TEXT PRIMARY KEY REFERENCES items(id) ON DELETE CASCADE,
        category TEXT,
        price REAL,
        priority TEXT DEFAULT 'medium',
        desired_usability TEXT,
        usable_where TEXT
      )`,
      args: [],
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS trips (
        item_id TEXT PRIMARY KEY REFERENCES items(id) ON DELETE CASCADE,
        destination TEXT,
        companions TEXT,
        trip_date TEXT,
        duration TEXT,
        priority TEXT DEFAULT 'medium',
        photo_goals TEXT,
        experience TEXT,
        photo TEXT
      )`,
      args: [],
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE
      )`,
      args: [],
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS item_tags (
        item_id TEXT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
        tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
        PRIMARY KEY (item_id, tag_id)
      )`,
      args: [],
    },
    {
      sql: `CREATE INDEX IF NOT EXISTS idx_items_status ON items(status)`,
      args: [],
    },
    {
      sql: `CREATE INDEX IF NOT EXISTS idx_items_type ON items(type)`,
      args: [],
    },
    {
      sql: `CREATE INDEX IF NOT EXISTS idx_items_pinned ON items(pinned)`,
      args: [],
    },
    {
      sql: `CREATE INDEX IF NOT EXISTS idx_tasks_it_infra_infra ON tasks_it_infra(infra)`,
      args: [],
    },
    {
      sql: `CREATE INDEX IF NOT EXISTS idx_tasks_it_infra_url_ip ON tasks_it_infra(url_ip)`,
      args: [],
    },
  ]);
}

export default db;
