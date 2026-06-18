import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';
import type { ItemType, ItemStatus, Priority } from '../middleware/validate.js';

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
// Mapping: which flat table columns go into `todo` vs `processMemo`
// ---------------------------------------------------------------------------

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
    'category',
    'infra',
    'item_name',
    'kind',
    'description',
    'url_ip',
    'username',
    'password',
    'new_password',
    'remark',
  ],
  'reading-book': ['book_name', 'website_name', 'event', 'knowledge', 'note', 'book_pdf', 'progress'],
  'reading-website': ['book_name', 'website_name', 'event', 'knowledge', 'note', 'book_pdf', 'progress'],
  buying: ['desired_usability', 'usable_where'],
  trip: ['photo_goals', 'experience', 'photo'],
};

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
// Helpers: fetch tags for a batch of items
// ---------------------------------------------------------------------------

function getTagsForItems(itemIds: string[]): Map<string, string[]> {
  if (itemIds.length === 0) return new Map();

  const placeholders = itemIds.map(() => '?').join(',');
  const rows = db
    .prepare(
      `SELECT it.item_id, t.name
       FROM item_tags it
       JOIN tags t ON t.id = it.tag_id
       WHERE it.item_id IN (${placeholders})
       ORDER BY t.name`,
    )
    .all(...itemIds) as { item_id: string; name: string }[];

  const map = new Map<string, string[]>();
  for (const row of rows) {
    const tags = map.get(row.item_id) || [];
    tags.push(row.name);
    map.set(row.item_id, tags);
  }
  return map;
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
// Query items with optional filters
// ---------------------------------------------------------------------------

export function getItems(params: {
  status?: string;
  type?: string;
}): FullItem[] {
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (params.status) {
    conditions.push('i.status = ?');
    values.push(params.status);
  }
  if (params.type) {
    conditions.push('i.type = ?');
    values.push(params.type);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Single query joining all detail tables.
  // Each item only has data in ONE detail table, so no duplication.
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
    ORDER BY i.pinned DESC, i.created_at DESC
  `;

  const rows = db.prepare(sql).all(...values) as Record<string, unknown>[];

  if (rows.length === 0) return [];

  // Collapse conflicting column names into a single row shape per item
  const flattened = rows.map((row) => flattenDetailColumns(row));
  const itemIds = flattened.map((r) => r.id as string);
  const tagsMap = getTagsForItems(itemIds);

  return flattened.map((row) => buildFullItem(row, tagsMap.get(row.id as string) || []));
}

/**
 * The LEFT JOIN across 5 tables creates ambiguous column names (e.g. `name`
 * appears in tasks_ordinary, tasks_it_infra, etc.).  We alias them above (t_name,
 * ti_name, etc.).  This function picks the correct alias for the item's type
 * and renames it to the canonical field name so buildFullItem works
 * uniformly.
 */
function flattenDetailColumns(row: Record<string, unknown>): Record<string, unknown> {
  const type = row.type as ItemType;
  const result: Record<string, unknown> = { ...row };

  // Remove all aliased columns, keeping only the ones for this type
  const toDrop = new Set<string>();

  switch (type) {
    case 'task':
      result['category'] = row['t_category'];
      result['name'] = row['t_name'];
      result['due_date'] = row['t_due_date'];
      result['priority'] = row['t_priority'];
      // Only drop aliased columns (native columns like problem/experience/note/photo are fine)
      toDrop.add('t_category');
      toDrop.add('t_name');
      toDrop.add('t_due_date');
      toDrop.add('t_priority');
      break;
    case 'task-it-infra':
      result['category'] = row['ti_category'];
      result['name'] = row['ti_name'];
      result['due_date'] = row['ti_due_date'];
      result['priority'] = row['ti_priority'];
      toDrop.add('ti_category');
      toDrop.add('ti_name');
      toDrop.add('ti_due_date');
      toDrop.add('ti_priority');
      break;
    case 'reading-book':
    case 'reading-website':
      result['priority'] = row['r_priority'];
      result['note'] = row['r_note'];
      toDrop.add('r_priority');
      toDrop.add('r_note');
      break;
    case 'buying':
      result['category'] = row['p_category'];
      result['priority'] = row['p_priority'];
      toDrop.add('p_category');
      toDrop.add('p_priority');
      break;
    case 'trip':
      result['priority'] = row['tr_priority'];
      result['experience'] = row['tr_experience'];
      result['photo'] = row['tr_photo'];
      toDrop.add('tr_priority');
      toDrop.add('tr_experience');
      toDrop.add('tr_photo');
      break;
  }

  // Remove the aliased columns we just processed so they don't leak
  for (const col of toDrop) {
    delete result[col];
  }

  return result;
}

// ---------------------------------------------------------------------------
// Get a single item by ID
// ---------------------------------------------------------------------------

export function getItemById(id: string): FullItem | null {
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
    WHERE i.id = ?
  `;

  const row = db.prepare(sql).get(id) as Record<string, unknown> | undefined;
  if (!row) return null;

  const flat = flattenDetailColumns(row);
  const tagsMap = getTagsForItems([id]);
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
  // Type-specific flat fields
  [key: string]: unknown;
}

export function createItem(input: CreateItemInput): FullItem {
  const id = uuidv4();
  const status: ItemStatus = input.status || 'todo';
  const pinned = input.pinned ? 1 : 0;
  const now = new Date().toISOString();

  const insertItem = db.prepare(
    `INSERT INTO items (id, type, status, pinned, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  );

  const detailTable = getDetailTable(input.type);

  // Collect type-specific fields for the detail table
  const todoFields = TODO_FIELDS[input.type] || [];
  const memoFields = PROCESS_MEMO_FIELDS[input.type] || [];
  const allDetailFields = [...todoFields, ...memoFields];

  const detailColumns: string[] = ['item_id'];
  const detailPlaceholders: string[] = ['?'];
  const detailValues: unknown[] = [id];

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
    // Skip source_type if we already handled it above
    if (field === 'source_type' && (input.type === 'reading-book' || input.type === 'reading-website')) {
      continue;
    }
    if (input[field] !== undefined && input[field] !== null) {
      detailColumns.push(field);
      detailPlaceholders.push('?');
      detailValues.push(input[field]);
    }
  }

  const insertDetail = db.prepare(
    `INSERT INTO ${detailTable} (${detailColumns.join(', ')})
     VALUES (${detailPlaceholders.join(', ')})`,
  );

  // Prepare tag-related statements (to be used inside the transaction)
  const tagNames: string[] = (input.tags || []).map((t: string) => t.trim()).filter((t: string) => t.length > 0);
  const insertTag = db.prepare('INSERT OR IGNORE INTO tags (name) VALUES (?)');
  const getTagId = db.prepare('SELECT id FROM tags WHERE name = ?');
  const insertItemTag = db.prepare(
    'INSERT OR IGNORE INTO item_tags (item_id, tag_id) VALUES (?, ?)',
  );

  // Execute everything in a single transaction
  const doInsert = db.transaction(() => {
    // 1. Insert the item record
    insertItem.run(id, input.type, status, pinned, now, now);

    // 2. Insert the type-specific detail record
    insertDetail.run(...detailValues);

    // 3. Insert tags and item_tags (now that the item exists)
    for (const tagName of tagNames) {
      insertTag.run(tagName);
      const tag = getTagId.get(tagName) as { id: number } | undefined;
      if (tag) {
        insertItemTag.run(id, tag.id);
      }
    }
  });

  doInsert();

  // Return the full item
  const item = getItemById(id);
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

export function updateItem(id: string, input: UpdateItemInput): FullItem {
  const existing = getItemById(id);
  if (!existing) {
    throw new Error('NOT_FOUND');
  }

  const now = new Date().toISOString();

  // Update items table
  const itemUpdates: string[] = ['updated_at = ?'];
  const itemValues: unknown[] = [now];

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
  const detailValues: unknown[] = [];

  for (const field of allDetailFields) {
    if (input[field] !== undefined) {
      detailUpdates.push(`${field} = ?`);
      detailValues.push(input[field]);
    }
  }

  // Update tags if provided
  const tagNames: string[] | undefined = input.tags;
  const updateTags =
    tagNames !== undefined && Array.isArray(tagNames);

  const doUpdate = db.transaction(() => {
    // Update items table
    db.prepare(
      `UPDATE items SET ${itemUpdates.join(', ')} WHERE id = ?`,
    ).run(...itemValues, id);

    // Update detail table if there are changes
    if (detailUpdates.length > 0) {
      db.prepare(
        `UPDATE ${detailTable} SET ${detailUpdates.join(', ')} WHERE item_id = ?`,
      ).run(...detailValues, id);
    }

    // Replace tags if provided
    if (updateTags) {
      db.prepare('DELETE FROM item_tags WHERE item_id = ?').run(id);

      if (tagNames.length > 0) {
        const insertTag = db.prepare('INSERT OR IGNORE INTO tags (name) VALUES (?)');
        const getTagId = db.prepare('SELECT id FROM tags WHERE name = ?');
        const insertItemTag = db.prepare(
          'INSERT OR IGNORE INTO item_tags (item_id, tag_id) VALUES (?, ?)',
        );

        for (const tagName of tagNames) {
          const trimmed = tagName.trim();
          if (!trimmed) continue;
          insertTag.run(trimmed);
          const tag = getTagId.get(trimmed) as { id: number };
          if (tag) {
            insertItemTag.run(id, tag.id);
          }
        }
      }
    }
  });

  doUpdate();

  const updated = getItemById(id);
  if (!updated) {
    throw new Error('Failed to update item');
  }
  return updated;
}

// ---------------------------------------------------------------------------
// Delete an item
// ---------------------------------------------------------------------------

export function deleteItem(id: string): boolean {
  const result = db.prepare('DELETE FROM items WHERE id = ?').run(id);
  return result.changes > 0;
}

// ---------------------------------------------------------------------------
// Update only the status
// ---------------------------------------------------------------------------

export function updateItemStatus(id: string, newStatus: ItemStatus): FullItem {
  const existing = getItemById(id);
  if (!existing) {
    throw new Error('NOT_FOUND');
  }

  const now = new Date().toISOString();
  db.prepare('UPDATE items SET status = ?, updated_at = ? WHERE id = ?').run(newStatus, now, id);

  const updated = getItemById(id);
  if (!updated) {
    throw new Error('Failed to update item status');
  }
  return updated;
}
