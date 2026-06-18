import { Router } from 'express';
import { AppError } from '../middleware/errorHandler.js';
import { getItems } from '../models/item.js';
import { validateInfraType } from '../middleware/validate.js';
import db from '../db.js';
import type { FullItem } from '../models/item.js';

const router = Router();

/**
 * GET /api/it-infra?infra=server|network|cloud
 * Returns only items of type `task-it-infra`, optionally filtered by infra type.
 */
router.get('/', (req, res, next) => {
  try {
    const infra = req.query.infra as string | undefined;

    if (infra) {
      validateInfraType(infra);
    }

    // Get all task-it-infra items
    let items = getItems({ type: 'task-it-infra' });

    // Filter by infra type if requested
    if (infra) {
      items = items.filter(
        (item) => (item.processMemo as Record<string, unknown>).infra === infra,
      );
    }

    res.json({ data: items });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/it-infra/search?q=xxx
 * Search IT infra items by IP address, item name, infra type, kind, or description.
 * Searches across url_ip, item_name, infra, kind, description columns.
 */
router.get('/search', (req, res, next) => {
  try {
    const q = req.query.q as string | undefined;
    if (!q || q.trim() === '') {
      throw new AppError(400, 'Missing required query parameter: q');
    }

    const pattern = `%${q.trim()}%`;

    const sql = `
      SELECT i.*,
        ti.category, ti.name, ti.due_date, ti.priority, ti.infra,
        ti.item_name, ti.kind, ti.description, ti.url_ip,
        ti.username, ti.password, ti.new_password, ti.remark
      FROM items i
      JOIN tasks_it_infra ti ON i.id = ti.item_id
      WHERE ti.url_ip LIKE ?
         OR ti.item_name LIKE ?
         OR ti.infra LIKE ?
         OR ti.kind LIKE ?
         OR ti.description LIKE ?
         OR ti.name LIKE ?
         OR ti.remark LIKE ?
         OR ti.category LIKE ?
      ORDER BY i.updated_at DESC
      LIMIT 100
    `;

    const rows = db.prepare(sql).all(
      pattern, pattern, pattern, pattern, pattern, pattern, pattern, pattern,
    ) as Record<string, unknown>[];

    // Fetch tags for these items
    const itemIds = rows.map((r) => r.id as string);
    const tagsMap = new Map<string, string[]>();
    if (itemIds.length > 0) {
      const placeholders = itemIds.map(() => '?').join(',');
      const tagRows = db
        .prepare(
          `SELECT it.item_id, t.name
           FROM item_tags it
           JOIN tags t ON t.id = it.tag_id
           WHERE it.item_id IN (${placeholders})
           ORDER BY t.name`,
        )
        .all(...itemIds) as { item_id: string; name: string }[];
      for (const tr of tagRows) {
        const tags = tagsMap.get(tr.item_id) || [];
        tags.push(tr.name);
        tagsMap.set(tr.item_id, tags);
      }
    }

    const items = rows.map((row) => ({
      id: row.id,
      type: row.type,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      pinned: !!(row.pinned as number),
      tags: tagsMap.get(row.id as string) || [],
      todo: {
        category: row.category || undefined,
        name: row.name || undefined,
        due_date: row.due_date || undefined,
        priority: row.priority || undefined,
      },
      processMemo: {
        category: row.category || undefined,
        infra: row.infra || undefined,
        item_name: row.item_name || undefined,
        kind: row.kind || undefined,
        description: row.description || undefined,
        url_ip: row.url_ip || undefined,
        username: row.username || undefined,
        password: row.password || undefined,
        new_password: row.new_password || undefined,
        remark: row.remark || undefined,
      },
    })) as FullItem[];

    res.json({ data: items });
  } catch (err) {
    next(err);
  }
});

export default router;
