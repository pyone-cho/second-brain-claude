import db from '../db.js';
import type { ItemType, ItemStatus } from '../middleware/validate.js';
import {
  getTodoFields,
  getProcessMemoFields,
  flattenDetailColumns,
  getTagsForItems,
} from '../utils/itemFields.js';

/**
 * Escape SQL LIKE metacharacters to prevent injection and unintended wildcards.
 */
function escapeLike(s: string): string {
  return s.replace(/[%_[]/g, (ch) => `[${ch}]`);
}

export interface SearchResult {
  id: string;
  type: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  pinned: boolean;
  tags: string[];
  todo: Record<string, unknown>;
  processMemo: Record<string, unknown>;
  matchScore: number;
}

export interface SearchResponse {
  data: SearchResult[];
  total: number;
  hasMore: boolean;
}

export async function searchItems(params: {
  q: string;
  type?: string;
  status?: string;
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  pinned?: string;
  limit?: number;
  offset?: number;
}): Promise<SearchResponse> {
  const keyword = params.q.trim();
  if (!keyword) return { data: [], total: 0, hasMore: false };

  const limit = Math.min(Math.max(params.limit || 50, 1), 200);
  const offset = Math.max(params.offset || 0, 0);

  // Split into individual search terms for AND matching
  const terms = keyword.split(/\s+/).filter((t) => t.length > 0);

  // We search across multiple tables and UNION the results, then compute a
  // match score based on which fields matched and how many terms matched.
  const conditions: string[] = [];
  const values: unknown[] = [];

  // Base filters derived from the user's query params
  // We always search only memo items (items that have been processed/read/etc.)
  // UNLESS an explicit status filter is provided
  if (params.status) {
    conditions.push('i.status = ?');
    values.push(params.status);
  } else {
    // Default: search memo items
    conditions.push("i.status = 'memo'");
  }

  if (params.type) {
    conditions.push('i.type = ?');
    values.push(params.type);
  }
  if (params.dateFrom) {
    conditions.push('i.created_at >= ?');
    values.push(params.dateFrom);
  }
  if (params.dateTo) {
    conditions.push('i.created_at <= ?');
    values.push(params.dateTo);
  }
  if (params.pinned !== undefined) {
    conditions.push('i.pinned = ?');
    values.push(params.pinned === 'true' ? 1 : 0);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Build LIKE patterns for each search term
  // We search across: items.id, and detail-table text columns
  const searchClauses: string[] = [];
  const searchValues: unknown[] = [];

  for (const term of terms) {
    const pattern = `%${escapeLike(term)}%`;

    // Search in item id
    searchClauses.push('i.id LIKE ?');
    searchValues.push(pattern);

    // Search in tasks_ordinary
    searchClauses.push('t.name LIKE ?');
    searchValues.push(pattern);
    searchClauses.push('t.problem LIKE ?');
    searchValues.push(pattern);
    searchClauses.push('t.experience LIKE ?');
    searchValues.push(pattern);
    searchClauses.push('t.note LIKE ?');
    searchValues.push(pattern);
    searchClauses.push('t.category LIKE ?');
    searchValues.push(pattern);

    // Search in tasks_it_infra
    searchClauses.push('ti.name LIKE ?');
    searchValues.push(pattern);
    searchClauses.push('ti.item_name LIKE ?');
    searchValues.push(pattern);
    searchClauses.push('ti.infra LIKE ?');
    searchValues.push(pattern);
    searchClauses.push('ti.kind LIKE ?');
    searchValues.push(pattern);
    searchClauses.push('ti.description LIKE ?');
    searchValues.push(pattern);
    searchClauses.push('ti.url_ip LIKE ?');
    searchValues.push(pattern);
    searchClauses.push('ti.remark LIKE ?');
    searchValues.push(pattern);

    // Search in readings
    searchClauses.push('r.title LIKE ?');
    searchValues.push(pattern);
    searchClauses.push('r.author LIKE ?');
    searchValues.push(pattern);
    searchClauses.push('r.book_name LIKE ?');
    searchValues.push(pattern);
    searchClauses.push('r.website_name LIKE ?');
    searchValues.push(pattern);
    searchClauses.push('r.event LIKE ?');
    searchValues.push(pattern);
    searchClauses.push('r.knowledge LIKE ?');
    searchValues.push(pattern);
    searchClauses.push('r.note LIKE ?');
    searchValues.push(pattern);

    // Search in purchases
    searchClauses.push('p.category LIKE ?');
    searchValues.push(pattern);
    searchClauses.push('p.desired_usability LIKE ?');
    searchValues.push(pattern);
    searchClauses.push('p.usable_where LIKE ?');
    searchValues.push(pattern);

    // Search in trips
    searchClauses.push('tr.destination LIKE ?');
    searchValues.push(pattern);
    searchClauses.push('tr.companions LIKE ?');
    searchValues.push(pattern);
    searchClauses.push('tr.experience LIKE ?');
    searchValues.push(pattern);
    searchClauses.push('tr.photo_goals LIKE ?');
    searchValues.push(pattern);
  }

  const searchWhere =
    searchClauses.length > 0 ? `(${searchClauses.join(' OR ')})` : '1=1';

  // Category filter: items that are tasks and have a matching category
  if (params.category) {
    const catPattern = `%${params.category}%`;
    conditions.push(
      `(t.category LIKE ? OR ti.category LIKE ? OR p.category LIKE ?)`,
    );
    values.push(catPattern, catPattern, catPattern);
  }

  const finalWhere =
    conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : 'WHERE 1=1';

  // Count total matching items (before pagination)
  const countSql = `
    SELECT COUNT(*) as total
    FROM items i
    LEFT JOIN tasks_ordinary t ON i.id = t.item_id
    LEFT JOIN tasks_it_infra ti ON i.id = ti.item_id
    LEFT JOIN readings r ON i.id = r.item_id
    LEFT JOIN purchases p ON i.id = p.item_id
    LEFT JOIN trips tr ON i.id = tr.item_id
    ${finalWhere} AND ${searchWhere}
  `;

  const allValues = [...values, ...searchValues];
  const countResult = await db.execute({ sql: countSql, args: allValues as any[] });
  const total = (countResult.rows[0] as unknown as { total: number }).total;

  const sql = `
    SELECT i.id, i.type, i.status, i.created_at, i.updated_at, i.pinned,
      t.category AS t_category, t.name AS t_name, t.due_date AS t_due_date,
      t.priority AS t_priority, t.problem, t.experience, t.note, t.photo,
      ti.category AS ti_category, ti.name AS ti_name, ti.due_date AS ti_due_date,
      ti.priority AS ti_priority, ti.infra, ti.item_name, ti.kind,
      ti.description, ti.url_ip, ti.username, ti.remark,
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
    ${finalWhere} AND ${searchWhere}
    ORDER BY i.updated_at DESC
    LIMIT ? OFFSET ?
  `;

  const rowsResult = await db.execute({ sql, args: [...allValues, limit, offset] as any[] });
  const rows = rowsResult.rows as unknown as Record<string, unknown>[];

  // Get tags for all matching items
  const itemIds = rows.map((r) => r.id as string);
  const tagsMap = new Map<string, string[]>();
  if (itemIds.length > 0) {
    const tagRowsMap = await getTagsForItems(itemIds);
    for (const [itemId, tags] of tagRowsMap) {
      tagsMap.set(itemId, tags);
    }
  }

  // Compute match scores
  const results: SearchResult[] = [];

  for (const row of rows) {
    const type = row.type as string;
    const flat = flattenDetailColumns(row, type);
    const score = computeMatchScore(flat, terms);

    // Build todo and processMemo (simplified — reuse the field lists from item model)
    const todo: Record<string, unknown> = {};
    const processMemo: Record<string, unknown> = {};

    const todoFields = getTodoFields(type);
    const memoFields = getProcessMemoFields(type);

    for (const f of todoFields) {
      if (flat[f] !== null && flat[f] !== undefined) {
        todo[f] = flat[f];
      }
    }
    for (const f of memoFields) {
      if (flat[f] !== null && flat[f] !== undefined) {
        processMemo[f] = flat[f];
      }
    }

    results.push({
      id: flat.id as string,
      type: flat.type as string,
      status: flat.status as string,
      createdAt: flat.created_at as string,
      updatedAt: flat.updated_at as string,
      pinned: !!(flat.pinned as number),
      tags: tagsMap.get(flat.id as string) || [],
      todo,
      processMemo,
      matchScore: score,
    });
  }

  // Sort by matchScore descending
  results.sort((a, b) => b.matchScore - a.matchScore);

  return {
    data: results,
    total,
    hasMore: offset + limit < total,
  };
}

/**
 * Compute a match score by counting how many search terms appear in the
 * item's text fields.  Each term contributes up to 2 points depending on
 * how many fields it appears in.
 */
function computeMatchScore(flat: Record<string, unknown>, terms: string[]): number {
  let score = 0;

  // Fields that are more important get higher weight
  const highWeightFields = ['name', 'title', 'item_name', 'destination'];
  const mediumWeightFields = [
    'description', 'problem', 'experience', 'knowledge', 'note',
    'url_ip', 'infra', 'kind', 'category', 'author', 'book_name',
    'website_name',
  ];

  for (const term of terms) {
    const lowerTerm = term.toLowerCase();
    let termScore = 0;

    // Check high-weight fields (2 points each)
    for (const field of highWeightFields) {
      const value = flat[field];
      if (typeof value === 'string' && value.toLowerCase().includes(lowerTerm)) {
        termScore += 2;
      }
    }

    // Check medium-weight fields (1 point each)
    for (const field of mediumWeightFields) {
      const value = flat[field];
      if (typeof value === 'string' && value.toLowerCase().includes(lowerTerm)) {
        termScore += 1;
      }
    }

    // Check ID field
    if (typeof flat['id'] === 'string' && flat['id'].toLowerCase().includes(lowerTerm)) {
      termScore += 1;
    }

    score += termScore;
  }

  return score;
}
