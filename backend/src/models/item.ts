import { v4 as uuidv4 } from 'uuid';
import type { InArgs } from '@libsql/client';
import client from '../db.js';
import type { ItemType, ItemStatus, Priority } from '../middleware/validate.js';
import { encrypt, isEncrypted } from '../utils/crypto.js';
import {
  TODO_FIELDS,
  PROCESS_MEMO_FIELDS,
  flattenDetailColumns,
  getTagsForItems,
} from '../utils/itemFields.js';

// ---------------------------------------------------------------------------
// TypeScript interfaces matching the frontend shapes
// ---------------------------------------------------------------------------

export interface BaseItem {
  id: string;
  type: ItemType;
  status: ItemStatus;
  createdAt: string;
  updatedAt: string;
  pinned: boolean;
  tags: string[];
}

export interface TaskTodo {
  category?: string;
  name?: string;
  due_date?: string;
  priority?: string;
  problem?: string;
}

export interface TaskProcessMemo {
  experience?: string;
  note?: string;
  photo?: string;
}

export interface ItInfraTodo {
  category?: string;
  name?: string;
  due_date?: string;
  priority?: string;
}

export interface ItInfraProcessMemo {
  category?: string;
  infra?: string;
  item_name?: string;
  kind?: string;
  description?: string;
  url_ip?: string;
  username?: string;
  password?: string;
  new_password?: string;
  remark?: string;
}

export interface ReadingTodo {
  source_type?: string;
  title?: string;
  author?: string;
  url?: string;
  priority?: string;
}

export interface ReadingProcessMemo {
  book_name?: string;
  website_name?: string;
  event?: string;
  knowledge?: string;
  note?: string;
  book_pdf?: string;
  progress?: number;
}

export interface PurchaseTodo {
  category?: string;
  price?: number;
  priority?: string;
}

export interface PurchaseProcessMemo {
  desired_usability?: string;
  usable_where?: string;
}

export interface TripTodo {
  destination?: string;
  companions?: string;
  trip_date?: string;
  duration?: string;
  priority?: string;
}

export interface TripProcessMemo {
  photo_goals?: string;
  experience?: string;
  photo?: string;
}

export type ItemTodo =
  | TaskTodo
  | ItInfraTodo
  | ReadingTodo
  | PurchaseTodo
  | TripTodo;

export type ItemProcessMemo =
  | TaskProcessMemo
  | ItInfraProcessMemo
  | ReadingProcessMemo
  | PurchaseProcessMemo
  | TripProcessMemo;

export interface FullItem extends BaseItem {
  todo: ItemTodo;
  processMemo: ItemProcessMemo;
}

// ---------------------------------------------------------------------------
// Password encryption helpers
// ---------------------------------------------------------------------------

const ENCRYPTED_FIELDS = ['password', 'new_password'];

/**
 * Encrypt password fields in a detail-values object before writing to DB.
 * Skips fields that are already encrypted.
 */
function encryptPasswordFields(values: Record<string, unknown>): Record<string, unknown> {
  const result = { ...values };
  for (const field of ENCRYPTED_FIELDS) {
    if (typeof result[field] === 'string' && result[field] && !isEncrypted(result[field] as string)) {
      result[field] = encrypt(result[field] as string);
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// Table name lookup
// ---------------------------------------------------------------------------

function getDetailTable(type: ItemType): string {
  switch (type) {
    case 'task':
      return 'tasks_ordinary';
    case 'task-it-infra':
      return 'tasks_it_infra';
    case 'reading-book':
    case 'reading-website':
      return 'readings';
    case 'buying':
      return 'purchases';
    case 'trip':
      return 'trips';
  }
}

// ---------------------------------------------------------------------------
// Build a FullItem from a row (result of LEFT JOIN across detail tables)
// ---------------------------------------------------------------------------

function buildFullItem(row: Record<string, unknown>, tags: string[]): FullItem {
  const type = row.type as ItemType;
  const todoFields = TODO_FIELDS[type] || [];
  const memoFields = PROCESS_MEMO_FIELDS[type] || [];

  const todo: Record<string, unknown> = {};
  for (const f of todoFields) {
    if (row[f] !== null && row[f] !== undefined) {
      todo[f] = row[f];
    }
  }

  const processMemo: Record<string, unknown> = {};
  for (const f of memoFields) {
    if (row[f] !== null && row[f] !== undefined) {
      // Redact password fields from API responses
      if (ENCRYPTED_FIELDS.includes(f)) {
        continue;
      }
      processMemo[f] = row[f];
    }
  }

  return {
    id: row.id as string,
    type,
    status: row.status as ItemStatus,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    pinned: !!(row.pinned as number),
    tags,
    todo: todo as ItemTodo,
    processMemo: processMemo as ItemProcessMemo,
  };
}

// ---------------------------------------------------------------------------
// Helper: convert libsql row to a plain Record
// ---------------------------------------------------------------------------

function rowToRecord(row: Record<string, unknown>): Record<string, unknown> {
  return { ...row };
}

// ---------------------------------------------------------------------------
// Query items with optional filters
// ---------------------------------------------------------------------------

export async function getItems(params: {
  status?: string;
  type?: string;
}, userId: string): Promise<FullItem[]> {
  const conditions: string[] = ['i.user_id = ?'];
  const values: (string | number | null)[] = [userId];

  if (params.status) {
    conditions.push('i.status = ?');
    values.push(params.status);
  }
  if (params.type) {
    conditions.push('i.type = ?');
    values.push(params.type);
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;

  const sql = `
    SELECT i.*,
      t.category         AS t_category, t.name AS t_name, t.due_date AS t_due_date,
      t.priority         AS t_priority, t.problem, t.experience, t.note, t.photo,
      ti.category        AS ti_category, ti.name AS ti_name, ti.due_date AS ti_due_date,
      ti.priority        AS ti_priority, ti.infra, ti.item_name, ti.kind,
      ti.description, ti.url_ip, ti.username, ti.password, ti.new_password, ti.remark,
      r.source_type, r.title, r.author, r.url, r.priority AS r_priority,
      r.book_name, r.website_name, r.event, r.knowledge, r.note AS r_note,
      r.book_pdf, r.progress,
      p.category         AS p_category, p.price, p.priority AS p_priority,
      p.desired_usability, p.usable_where,
      tr.destination, tr.companions, tr.trip_date, tr.duration,
      tr.priority        AS tr_priority,
      tr.photo_goals, tr.experience AS tr_experience, tr.photo AS tr_photo
    FROM items i
    LEFT JOIN tasks_ordinary t ON i.id = t.item_id
    LEFT JOIN tasks_it_infra ti ON i.id = ti.item_id
    LEFT JOIN readings r ON i.id = r.item_id
    LEFT JOIN purchases p ON i.id = p.item_id
    LEFT JOIN trips tr ON i.id = tr.item_id
    ${whereClause}
    ORDER BY i.pinned DESC, i.sort_order ASC, i.created_at DESC
  `;

  const result = await client.execute({ sql, args: values });
  const rows = result.rows;

  if (rows.length === 0) return [];

  const flattened = rows.map((row) => flattenDetailColumns(rowToRecord(row), row.type as string));
  const itemIds = flattened.map((r) => r.id as string);
  const tagsMap = await getTagsForItems(itemIds);

  return flattened.map((row) => buildFullItem(row, tagsMap.get(row.id as string) || []));
}

// ---------------------------------------------------------------------------
// Get a single item by ID
// ---------------------------------------------------------------------------

export async function getItemById(id: string, userId: string): Promise<FullItem | null> {
  const sql = `
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
    WHERE i.id = ? AND i.user_id = ?
  `;

  const result = await client.execute({ sql, args: [id, userId] });
  if (result.rows.length === 0) return null;

  const row = rowToRecord(result.rows[0]);
  const flat = flattenDetailColumns(row, row.type as string);
  const tagsMap = await getTagsForItems([id]);
  return buildFullItem(flat, tagsMap.get(id) || []);
}

// ---------------------------------------------------------------------------
// Create a new item
// ---------------------------------------------------------------------------

export interface CreateItemInput {
  type: ItemType;
  status?: ItemStatus;
  pinned?: boolean;
  tags?: string[];
  [key: string]: unknown;
}

export async function createItem(input: CreateItemInput, userId: string): Promise<FullItem> {
  const id = uuidv4();
  const status: ItemStatus = input.status || 'todo';
  const pinned = input.pinned ? 1 : 0;
  const now = new Date().toISOString();

  const detailTable = getDetailTable(input.type);

  // Collect type-specific fields for the detail table
  const todoFields = TODO_FIELDS[input.type] || [];
  const memoFields = PROCESS_MEMO_FIELDS[input.type] || [];
  const allDetailFields = [...todoFields, ...memoFields];

  const detailColumns: string[] = ['item_id'];
  const detailPlaceholders: string[] = ['?'];
  const detailValues: (string | number | null)[] = [id];

  // For reading-book and reading-website, auto-set source_type
  if (input.type === 'reading-book') {
    detailColumns.push('source_type');
    detailPlaceholders.push('?');
    detailValues.push('book');
  } else if (input.type === 'reading-website') {
    detailColumns.push('source_type');
    detailPlaceholders.push('?');
    detailValues.push('website');
  }

  for (const field of allDetailFields) {
    if (field === 'source_type' && (input.type === 'reading-book' || input.type === 'reading-website')) {
      continue;
    }
    if (input[field] !== undefined && input[field] !== null) {
      detailColumns.push(field);
      detailPlaceholders.push('?');
      const value = ENCRYPTED_FIELDS.includes(field) && typeof input[field] === 'string'
        ? encrypt(input[field] as string)
        : input[field];
      detailValues.push(value as string | number | null);
    }
  }

  // Prepare tags
  const tagNames: string[] = (input.tags || []).map((t: string) => t.trim()).filter((t: string) => t.length > 0);

  // Build batch statements
  const batch: Array<{ sql: string; args: InArgs }> = [];

  // 1. Insert the item record
  batch.push({
    sql: `INSERT INTO items (id, type, status, pinned, user_id, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [id, input.type, status, pinned, userId, now, now],
  });

  // 2. Insert the type-specific detail record
  batch.push({
    sql: `INSERT INTO ${detailTable} (${detailColumns.join(', ')})
          VALUES (${detailPlaceholders.join(', ')})`,
    args: detailValues,
  });

  // 3. Insert tags (INSERT OR IGNORE to avoid duplicates)
  for (const tagName of tagNames) {
    batch.push({
      sql: 'INSERT OR IGNORE INTO tags (name) VALUES (?)',
      args: [tagName],
    });
  }

  // Execute the batch
  await client.batch(batch, 'write');

  // 4. Link tags to item (need to look up tag IDs first)
  if (tagNames.length > 0) {
    const linkBatch: Array<{ sql: string; args: InArgs }> = [];
    for (const tagName of tagNames) {
      const tagResult = await client.execute({
        sql: 'SELECT id FROM tags WHERE name = ?',
        args: [tagName],
      });
      if (tagResult.rows.length > 0) {
        linkBatch.push({
          sql: 'INSERT OR IGNORE INTO item_tags (item_id, tag_id) VALUES (?, ?)',
          args: [id, tagResult.rows[0].id],
        });
      }
    }
    if (linkBatch.length > 0) {
      await client.batch(linkBatch, 'write');
    }
  }

  // Return the full item
  const item = await getItemById(id, userId);
  if (!item) {
    throw new Error('Failed to create item');
  }
  return item;
}

// ---------------------------------------------------------------------------
// Update an item
// ---------------------------------------------------------------------------

export interface UpdateItemInput {
  status?: ItemStatus;
  pinned?: boolean;
  tags?: string[];
  [key: string]: unknown;
}

export async function updateItem(id: string, input: UpdateItemInput, userId: string): Promise<FullItem> {
  const existing = await getItemById(id, userId);
  if (!existing) {
    throw new Error('NOT_FOUND');
  }

  const now = new Date().toISOString();

  // Update items table
  const itemUpdates: string[] = ['updated_at = ?'];
  const itemValues: (string | number | null)[] = [now];

  if (input.status !== undefined) {
    itemUpdates.push('status = ?');
    itemValues.push(input.status);
  }
  if (input.pinned !== undefined) {
    itemUpdates.push('pinned = ?');
    itemValues.push(input.pinned ? 1 : 0);
  }

  // Update detail table
  const detailTable = getDetailTable(existing.type);
  const todoFields = TODO_FIELDS[existing.type] || [];
  const memoFields = PROCESS_MEMO_FIELDS[existing.type] || [];
  const allDetailFields = [...todoFields, ...memoFields];

  const detailUpdates: string[] = [];
  const detailValues: (string | number | null)[] = [];

  for (const field of allDetailFields) {
    if (input[field] !== undefined) {
      detailUpdates.push(`${field} = ?`);
      const value = ENCRYPTED_FIELDS.includes(field) && typeof input[field] === 'string'
        ? encrypt(input[field] as string)
        : input[field];
      detailValues.push(value as string | number | null);
    }
  }

  // Build batch for item + detail updates
  const batch: Array<{ sql: string; args: InArgs }> = [];

  // Update items table
  batch.push({
    sql: `UPDATE items SET ${itemUpdates.join(', ')} WHERE id = ?`,
    args: [...itemValues, id],
  });

  // Update detail table if there are changes
  if (detailUpdates.length > 0) {
    batch.push({
      sql: `UPDATE ${detailTable} SET ${detailUpdates.join(', ')} WHERE item_id = ?`,
      args: [...detailValues, id],
    });
  }

  await client.batch(batch, 'write');

  // Update tags if provided
  const tagNames: string[] | undefined = input.tags;
  if (tagNames !== undefined && Array.isArray(tagNames)) {
    // Delete existing item_tags
    await client.execute({
      sql: 'DELETE FROM item_tags WHERE item_id = ?',
      args: [id],
    });

    if (tagNames.length > 0) {
      // Insert new tags
      const insertBatch: Array<{ sql: string; args: InArgs }> = [];
      for (const tagName of tagNames) {
        const trimmed = tagName.trim();
        if (!trimmed) continue;
        insertBatch.push({
          sql: 'INSERT OR IGNORE INTO tags (name) VALUES (?)',
          args: [trimmed],
        });
      }
      await client.batch(insertBatch, 'write');

      // Link tags to item
      const linkBatch: Array<{ sql: string; args: InArgs }> = [];
      for (const tagName of tagNames) {
        const trimmed = tagName.trim();
        if (!trimmed) continue;
        const tagResult = await client.execute({
          sql: 'SELECT id FROM tags WHERE name = ?',
          args: [trimmed],
        });
        if (tagResult.rows.length > 0) {
          linkBatch.push({
            sql: 'INSERT OR IGNORE INTO item_tags (item_id, tag_id) VALUES (?, ?)',
            args: [id, tagResult.rows[0].id],
          });
        }
      }
      if (linkBatch.length > 0) {
        await client.batch(linkBatch, 'write');
      }
    }

    // Clean up orphaned tags
    await client.execute('DELETE FROM tags WHERE id NOT IN (SELECT DISTINCT tag_id FROM item_tags)');
  }

  const updated = await getItemById(id, userId);
  if (!updated) {
    throw new Error('Failed to update item');
  }
  return updated;
}

// ---------------------------------------------------------------------------
// Delete an item
// ---------------------------------------------------------------------------

export async function deleteItem(id: string, userId: string): Promise<boolean> {
  const result = await client.execute({
    sql: 'DELETE FROM items WHERE id = ? AND user_id = ?',
    args: [id, userId],
  });
  return result.rowsAffected > 0;
}

// ---------------------------------------------------------------------------
// Update only the status
// ---------------------------------------------------------------------------

export async function updateItemStatus(id: string, newStatus: ItemStatus, userId: string): Promise<FullItem> {
  const existing = await getItemById(id, userId);
  if (!existing) {
    throw new Error('NOT_FOUND');
  }

  const now = new Date().toISOString();
  await client.execute({
    sql: 'UPDATE items SET status = ?, updated_at = ? WHERE id = ? AND user_id = ?',
    args: [newStatus, now, id, userId],
  });

  const updated = await getItemById(id, userId);
  if (!updated) {
    throw new Error('Failed to update item status');
  }
  return updated;
}

// ---------------------------------------------------------------------------
// Reorder items (batch update sort_order)
// ---------------------------------------------------------------------------

export async function reorderItems(
  userId: string,
  items: { id: string; sortOrder: number }[]
): Promise<void> {
  const statements = items.map((item) => ({
    sql: 'UPDATE items SET sort_order = ? WHERE id = ? AND user_id = ?',
    args: [item.sortOrder, item.id, userId],
  }));
  await client.batch(statements, 'write');
}
