import type { InArgs } from '@libsql/client';
import client from '../db.js';

export interface Category {
  id: number;
  name: string;
  color: string | null;
  icon: string | null;
  created_at: string;
}

export async function getCategories(userId: string): Promise<Category[]> {
  const result = await client.execute({
    sql: 'SELECT * FROM categories WHERE user_id = ? ORDER BY name',
    args: [userId],
  });
  return result.rows as unknown as Category[];
}

export async function getCategoryById(id: number, userId: string): Promise<Category | null> {
  const result = await client.execute({
    sql: 'SELECT * FROM categories WHERE id = ? AND user_id = ?',
    args: [id, userId],
  });
  if (result.rows.length === 0) return null;
  return result.rows[0] as unknown as Category;
}

export async function createCategory(input: {
  name: string;
  color?: string;
  icon?: string;
}, userId: string): Promise<Category> {
  const result = await client.execute({
    sql: 'INSERT INTO categories (name, color, icon, user_id) VALUES (?, ?, ?, ?)',
    args: [input.name, input.color || null, input.icon || null, userId],
  });

  const category = await client.execute({
    sql: 'SELECT * FROM categories WHERE id = ? AND user_id = ?',
    args: [Number(result.lastInsertRowid), userId],
  });
  return category.rows[0] as unknown as Category;
}

export async function updateCategory(
  id: number,
  input: { name?: string; color?: string | null; icon?: string | null },
  userId: string,
): Promise<Category | null> {
  const existing = await getCategoryById(id, userId);
  if (!existing) return null;

  const updates: string[] = [];
  const values: (string | number | null)[] = [];

  if (input.name !== undefined) {
    updates.push('name = ?');
    values.push(input.name);
  }
  if (input.color !== undefined) {
    updates.push('color = ?');
    values.push(input.color);
  }
  if (input.icon !== undefined) {
    updates.push('icon = ?');
    values.push(input.icon);
  }

  if (updates.length === 0) return existing;

  await client.execute({
    sql: `UPDATE categories SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
    args: [...values, id, userId],
  });

  return getCategoryById(id, userId);
}

export async function deleteCategory(id: number, userId: string): Promise<boolean> {
  const result = await client.execute({
    sql: 'DELETE FROM categories WHERE id = ? AND user_id = ?',
    args: [id, userId],
  });
  return result.rowsAffected > 0;
}

/**
 * Create default categories for a new user.
 */
export async function seedDefaultCategories(userId: string): Promise<void> {
  const defaults = [
    { name: 'Work', color: '#3b82f6', icon: 'briefcase' },
    { name: 'Personal', color: '#10b981', icon: 'user' },
    { name: 'Learning', color: '#f59e0b', icon: 'book-open' },
    { name: 'Health', color: '#ef4444', icon: 'heart' },
    { name: 'Finance', color: '#8b5cf6', icon: 'dollar-sign' },
    { name: 'Home', color: '#ec4899', icon: 'home' },
    { name: 'Travel', color: '#06b6d4', icon: 'map' },
  ];

  const stmts = defaults.map((cat) => ({
    sql: 'INSERT INTO categories (name, color, icon, user_id) VALUES (?, ?, ?, ?)',
    args: [cat.name, cat.color, cat.icon, userId] as InArgs,
  }));

  await client.batch(stmts, 'write');
}
