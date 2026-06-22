import db from '../db.js';
import type { ItemType } from '../middleware/validate.js';

// ---------------------------------------------------------------------------
// Field definitions: which flat table columns go into `todo` vs `processMemo`
// ---------------------------------------------------------------------------

export const TODO_FIELDS: Record<string, string[]> = {
  task: ['category', 'name', 'due_date', 'priority', 'problem'],
  'task-it-infra': ['category', 'name', 'due_date', 'priority'],
  'reading-book': ['source_type', 'title', 'author', 'url', 'priority'],
  'reading-website': ['source_type', 'title', 'author', 'url', 'priority'],
  buying: ['category', 'price', 'priority'],
  trip: ['destination', 'companions', 'trip_date', 'duration', 'priority'],
};

export const PROCESS_MEMO_FIELDS: Record<string, string[]> = {
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

// ---------------------------------------------------------------------------
// Field list lookups (used by search model)
// ---------------------------------------------------------------------------

export function getTodoFields(type: string): string[] {
  return TODO_FIELDS[type] || [];
}

export function getProcessMemoFields(type: string): string[] {
  return PROCESS_MEMO_FIELDS[type] || [];
}

// ---------------------------------------------------------------------------
// Flatten aliased columns for a given item type
// ---------------------------------------------------------------------------

/**
 * Given a row from the LEFT JOIN query (with aliased columns like t_name,
 * ti_name, etc.), pick the correct alias for the item's type and rename it
 * to the canonical field name.
 */
export function flattenDetailColumns(
  row: Record<string, unknown>,
  type: string,
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...row };
  const toDrop = new Set<string>();

  switch (type) {
    case 'task':
      result['category'] = row['t_category'];
      result['name'] = row['t_name'];
      result['due_date'] = row['t_due_date'];
      result['priority'] = row['t_priority'];
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

  for (const col of toDrop) {
    delete result[col];
  }

  return result;
}

// ---------------------------------------------------------------------------
// Tag fetching
// ---------------------------------------------------------------------------

/**
 * Fetch tags for a batch of item IDs. Returns a map of itemId -> tag names.
 */
export function getTagsForItems(itemIds: string[]): Map<string, string[]> {
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
