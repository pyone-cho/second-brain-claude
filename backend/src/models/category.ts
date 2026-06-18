import db from '../db.js';

export interface Category {
  id: number;
  name: string;
  color: string | null;
  icon: string | null;
  created_at: string;
}

export function getCategories(): Category[] {
  return db.prepare('SELECT * FROM categories ORDER BY name').all() as Category[];
}

export function getCategoryById(id: number): Category | null {
  const row = db.prepare('SELECT * FROM categories WHERE id = ?').get(id) as Category | undefined;
  return row || null;
}

export function createCategory(input: {
  name: string;
  color?: string;
  icon?: string;
}): Category {
  const result = db
    .prepare('INSERT INTO categories (name, color, icon) VALUES (?, ?, ?)')
    .run(input.name, input.color || null, input.icon || null);

  const category = db
    .prepare('SELECT * FROM categories WHERE id = ?')
    .get(result.lastInsertRowid) as Category;
  return category;
}

export function updateCategory(
  id: number,
  input: { name?: string; color?: string | null; icon?: string | null },
): Category | null {
  const existing = getCategoryById(id);
  if (!existing) return null;

  const updates: string[] = [];
  const values: unknown[] = [];

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

  db.prepare(`UPDATE categories SET ${updates.join(', ')} WHERE id = ?`).run(...values, id);

  return getCategoryById(id);
}

export function deleteCategory(id: number): boolean {
  const result = db.prepare('DELETE FROM categories WHERE id = ?').run(id);
  return result.changes > 0;
}
