import { createClient } from '@libsql/client';
import type { Client } from '@libsql/client';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { randomBytes, scryptSync, randomUUID } from 'node:crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, '..', 'data');
const LOCAL_DB_PATH = path.join(DATA_DIR, 'second-brain.db');

// Ensure data directory exists (for local development)
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// ---------------------------------------------------------------------------
// Create libsql client
// Production: uses TURSO_DATABASE_URL + TURSO_AUTH_TOKEN
// Local dev:  uses a local SQLite file
// ---------------------------------------------------------------------------

const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;

let client: Client;

if (TURSO_DATABASE_URL) {
  // Production: remote Turso database
  client = createClient({
    url: TURSO_DATABASE_URL,
    authToken: TURSO_AUTH_TOKEN,
  });
  console.log('[DB] Connected to remote Turso database.');
} else {
  // Local development: SQLite file
  client = createClient({
    url: `file:${LOCAL_DB_PATH}`,
  });
  console.log(`[DB] Using local SQLite file: ${LOCAL_DB_PATH}`);
}

// ---------------------------------------------------------------------------
// Run all migrations on startup.
// Uses IF NOT EXISTS so it is safe to run every time.
// ---------------------------------------------------------------------------

export async function runMigrations(): Promise<void> {
  // Enable foreign keys
  await client.execute('PRAGMA foreign_keys = ON');

  await client.batch(
    [
      `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
      )`,

      `CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        color TEXT,
        icon TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      )`,

      `CREATE TABLE IF NOT EXISTS items (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'todo',
        pinned INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )`,

      `CREATE TABLE IF NOT EXISTS tasks_ordinary (
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

      `CREATE TABLE IF NOT EXISTS tasks_it_infra (
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

      `CREATE TABLE IF NOT EXISTS readings (
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

      `CREATE TABLE IF NOT EXISTS purchases (
        item_id TEXT PRIMARY KEY REFERENCES items(id) ON DELETE CASCADE,
        category TEXT,
        price REAL,
        priority TEXT DEFAULT 'medium',
        desired_usability TEXT,
        usable_where TEXT
      )`,

      `CREATE TABLE IF NOT EXISTS trips (
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

      `CREATE TABLE IF NOT EXISTS tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE
      )`,

      `CREATE TABLE IF NOT EXISTS item_tags (
        item_id TEXT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
        tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
        PRIMARY KEY (item_id, tag_id)
      )`,

      `CREATE INDEX IF NOT EXISTS idx_items_status ON items(status)`,
      `CREATE INDEX IF NOT EXISTS idx_items_type ON items(type)`,
      `CREATE INDEX IF NOT EXISTS idx_items_pinned ON items(pinned)`,
      `CREATE INDEX IF NOT EXISTS idx_tasks_it_infra_infra ON tasks_it_infra(infra)`,
      `CREATE INDEX IF NOT EXISTS idx_tasks_it_infra_url_ip ON tasks_it_infra(url_ip)`,
    ],
    'write',
  );

  // ── Incremental migration: add user_id columns if missing ──────
  await migrateAddUserId();
}

/**
 * Add user_id columns to items and categories if they don't exist,
 * then assign any orphaned rows to a default admin user.
 */
async function migrateAddUserId(): Promise<void> {
  const result = await client.execute('PRAGMA table_info(items)');
  const hasUserId = result.rows.some((c) => c.name === 'user_id');

  if (!hasUserId) {
    console.log('[DB] Migrating: adding user_id column to items and categories...');

    await client.batch(
      [
        'ALTER TABLE items ADD COLUMN user_id TEXT',
        'ALTER TABLE categories ADD COLUMN user_id TEXT',
        'CREATE INDEX IF NOT EXISTS idx_items_user_id ON items(user_id)',
        'CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id)',
      ],
      'write',
    );

    // Create default admin user if needed
    const existingAdmin = await client.execute({
      sql: "SELECT id FROM users WHERE email = 'admin@localhost'",
      args: [],
    });

    let adminId: string;
    if (existingAdmin.rows.length > 0) {
      adminId = existingAdmin.rows[0].id as string;
    } else {
      adminId = randomUUID();
      const salt = randomBytes(32);
      const hash = scryptSync('admin123', salt, 64);
      const passwordHash = `${salt.toString('hex')}:${hash.toString('hex')}`;
      const now = new Date().toISOString();

      await client.execute({
        sql: 'INSERT INTO users (id, name, email, password_hash, created_at) VALUES (?, ?, ?, ?, ?)',
        args: [adminId, 'Admin', 'admin@localhost', passwordHash, now],
      });
      console.log('[DB] Created default admin user (admin@localhost / admin123)');
    }

    await client.execute({
      sql: 'UPDATE items SET user_id = ? WHERE user_id IS NULL',
      args: [adminId],
    });
    await client.execute({
      sql: 'UPDATE categories SET user_id = ? WHERE user_id IS NULL',
      args: [adminId],
    });

    console.log('[DB] Migration complete: all existing data assigned to admin user.');
  }
}

export default client;
