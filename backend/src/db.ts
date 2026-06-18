import Database, { type Database as DatabaseType } from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'second-brain.db');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const db: DatabaseType = new Database(DB_PATH);

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');
// Enable foreign keys
db.pragma('foreign_keys = ON');

/**
 * Run all migrations on startup.
 * Uses IF NOT EXISTS so it is safe to run every time.
 */
export function runMigrations(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      color TEXT,
      icon TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'todo',
      pinned INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tasks_ordinary (
      item_id TEXT PRIMARY KEY REFERENCES items(id) ON DELETE CASCADE,
      category TEXT,
      name TEXT,
      due_date TEXT,
      priority TEXT DEFAULT 'medium',
      problem TEXT,
      experience TEXT,
      note TEXT,
      photo TEXT
    );

    CREATE TABLE IF NOT EXISTS tasks_it_infra (
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
    );

    CREATE TABLE IF NOT EXISTS readings (
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
    );

    CREATE TABLE IF NOT EXISTS purchases (
      item_id TEXT PRIMARY KEY REFERENCES items(id) ON DELETE CASCADE,
      category TEXT,
      price REAL,
      priority TEXT DEFAULT 'medium',
      desired_usability TEXT,
      usable_where TEXT
    );

    CREATE TABLE IF NOT EXISTS trips (
      item_id TEXT PRIMARY KEY REFERENCES items(id) ON DELETE CASCADE,
      destination TEXT,
      companions TEXT,
      trip_date TEXT,
      duration TEXT,
      priority TEXT DEFAULT 'medium',
      photo_goals TEXT,
      experience TEXT,
      photo TEXT
    );

    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS item_tags (
      item_id TEXT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
      tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
      PRIMARY KEY (item_id, tag_id)
    );

    -- Indexes for common query patterns
    CREATE INDEX IF NOT EXISTS idx_items_status ON items(status);
    CREATE INDEX IF NOT EXISTS idx_items_type ON items(type);
    CREATE INDEX IF NOT EXISTS idx_items_pinned ON items(pinned);
    CREATE INDEX IF NOT EXISTS idx_tasks_it_infra_infra ON tasks_it_infra(infra);
    CREATE INDEX IF NOT EXISTS idx_tasks_it_infra_url_ip ON tasks_it_infra(url_ip);
  `);
}

export default db;
