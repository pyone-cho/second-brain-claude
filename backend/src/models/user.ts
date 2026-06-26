import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { v4 as uuidv4 } from 'uuid';
import client from '../db.js';

// ---------------------------------------------------------------------------
// User model with secure password hashing (scrypt)
// ---------------------------------------------------------------------------

export interface User {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

const SALT_LENGTH = 32;
const KEY_LENGTH = 64;

/**
 * Hash a password using scrypt with a random salt.
 * Returns salt:hash as a hex string.
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(SALT_LENGTH);
  const hash = scryptSync(password, salt, KEY_LENGTH);
  return `${salt.toString('hex')}:${hash.toString('hex')}`;
}

/**
 * Verify a plaintext password against a stored hash.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [saltHex, hashHex] = storedHash.split(':');
    if (!saltHex || !hashHex) return false;

    const salt = Buffer.from(saltHex, 'hex');
    const expectedHash = Buffer.from(hashHex, 'hex');
    const actualHash = scryptSync(password, salt, KEY_LENGTH);

    return timingSafeEqual(actualHash, expectedHash);
  } catch {
    return false;
  }
}

/**
 * Create a new user. Throws if email already exists.
 */
export async function createUser(name: string, email: string, password: string): Promise<User> {
  const id = uuidv4();
  const passwordHash = hashPassword(password);
  const now = new Date().toISOString();

  try {
    await client.execute({
      sql: `INSERT INTO users (id, name, email, password_hash, created_at)
            VALUES (?, ?, ?, ?, ?)`,
      args: [id, name, email, passwordHash, now],
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('UNIQUE constraint')) {
      throw new Error('EMAIL_EXISTS');
    }
    throw err;
  }

  return { id, name, email, created_at: now };
}

/**
 * Find a user by email. Returns null if not found.
 */
export async function getUserByEmail(email: string): Promise<(User & { password_hash: string }) | null> {
  const result = await client.execute({
    sql: 'SELECT id, name, email, password_hash, created_at FROM users WHERE email = ?',
    args: [email],
  });
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return {
    id: row.id as string,
    name: row.name as string,
    email: row.email as string,
    password_hash: row.password_hash as string,
    created_at: row.created_at as string,
  };
}

/**
 * Find a user by ID. Returns null if not found.
 */
export async function getUserById(id: string): Promise<User | null> {
  const result = await client.execute({
    sql: 'SELECT id, name, email, created_at FROM users WHERE id = ?',
    args: [id],
  });
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return {
    id: row.id as string,
    name: row.name as string,
    email: row.email as string,
    created_at: row.created_at as string,
  };
}

/**
 * Get or create the default admin user for data migration.
 * Used when existing items have no user_id.
 */
export async function ensureDefaultAdmin(): Promise<string> {
  const existing = await client.execute({
    sql: "SELECT id FROM users WHERE email = 'admin@localhost'",
    args: [],
  });

  if (existing.rows.length > 0) return existing.rows[0].id as string;

  const id = uuidv4();
  const passwordHash = hashPassword('admin123');
  const now = new Date().toISOString();

  await client.execute({
    sql: `INSERT INTO users (id, name, email, password_hash, created_at)
          VALUES (?, ?, ?, ?, ?)`,
    args: [id, 'Admin', 'admin@localhost', passwordHash, now],
  });

  console.log('[DB] Created default admin user (admin@localhost / admin123)');
  return id;
}
