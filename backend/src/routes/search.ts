import { Router } from 'express';
import { AppError } from '../middleware/errorHandler.js';
import { searchItems } from '../models/search.js';

const router = Router();

/**
 * GET /api/search?q=keyword&type=&status=&category=&dateFrom=&dateTo=&pinned=
 *
 * Full-text search across all memo items.
 * Searches in title/name, description, notes, experience, knowledge fields.
 * Optionally filter by type, status, category, date range, pinned status.
 * Returns array of matching items with a `matchScore` computed field.
 */
router.get('/', (req, res, next) => {
  try {
    const q = req.query.q as string | undefined;
    if (!q || q.trim() === '') {
      throw new AppError(400, 'Missing required query parameter: q');
    }

    const results = searchItems({
      q,
      type: req.query.type as string | undefined,
      status: req.query.status as string | undefined,
      category: req.query.category as string | undefined,
      dateFrom: req.query.dateFrom as string | undefined,
      dateTo: req.query.dateTo as string | undefined,
      pinned: req.query.pinned as string | undefined,
    });

    res.json({ data: results });
  } catch (err) {
    next(err);
  }
});

export default router;
