import db from '../db.js';

export interface Category {
  id: number;
  name: string;
  color: string | null;
  icon: string | null;
  created_at: string;
}

export async function getCategories(): Promise<Category[]> {
  const result = await db.execute('SELECT * FROM categories ORDER BY name');
  return result.rows as unknown as Category[];
}

export async function getCategoryById(id: number): Promise<Category | null> {
  const result = await db.execute({
    sql: 'SELECT * FROM categories WHERE id = ?',
    args: [id],
  });
  return (result.rows[0] as unknown as Category) || null;
}

export async function createCategory(input: {
  name: string;
  color?: string;
  icon?: string;
}): Promise<Category> {
  const result = await db.execute({
    sql: 'INSERT INTO categories (name, color, icon) VALUES (?, ?, ?)',
    args: [input.name, input.color || null, input.icon || null],
  });

  const category = await getCategoryById(Number(result.lastInsertRowid));
  if (!category) throw new Error('Failed to create category');
  return category;
}

export async function updateCategory(
  id: number,
  input: { name?: string; color?: string | null; icon?: string | null },
): Promise<Category | null> {
  const existing = await getCategoryById(id);
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

  await db.execute({
    sql: `UPDATE categories SET ${updates.join(', ')} WHERE id = ?`,
    args: [...values, id] as any[],
  });

  return getCategoryById(id);
}

export async function deleteCategory(id: number): Promise<boolean> {
  const result = await db.execute({
    sql: 'DELETE FROM categories WHERE id = ?',
    args: [id],
  });
  return result.rowsAffected > 0;
}
