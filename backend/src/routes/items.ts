import { Router } from 'express';
import { AppError } from '../middleware/errorHandler.js';
import {
  getItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  updateItemStatus,
  reorderItems,
} from '../models/item.js';
import { validateStatus, validateType } from '../middleware/validate.js';

const router = Router();

/**
 * GET /api/items?status=&type=
 * Returns all items with optional status and type filters.
 */
router.get('/', async (req, res, next) => {
  try {
    const status = req.query.status as string | undefined;
    const type = req.query.type as string | undefined;

    if (status) validateStatus(status);
    if (type) validateType(type);

    const items = await getItems({ status, type }, req.userId!);
    res.json({ data: items });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/items/:id
 * Returns a single item by its UUID.
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || id.trim() === '') {
      throw new AppError(400, 'Missing item ID');
    }

    const item = await getItemById(id, req.userId!);
    if (!item) {
      throw new AppError(404, 'Item not found');
    }

    res.json({ data: item });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/items
 * Creates a new item.  Body contains flat type-specific fields.
 * Required: type
 * Optional: status, pinned, tags, and type-specific detail fields
 */
router.post('/', async (req, res, next) => {
  try {
    const { type } = req.body;
    if (!type) {
      throw new AppError(400, 'Missing required field: type');
    }
    validateType(type);

    const item = await createItem(req.body, req.userId!);
    res.status(201).json({ data: item });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/items/:id
 * Full or partial update of an item.  Updates updated_at automatically.
 */
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || id.trim() === '') {
      throw new AppError(400, 'Missing item ID');
    }

    if (req.body.status !== undefined) {
      validateStatus(req.body.status);
    }

    try {
      const item = await updateItem(id, req.body, req.userId!);
      res.json({ data: item });
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'NOT_FOUND') {
        throw new AppError(404, 'Item not found');
      }
      throw err;
    }
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/items/:id
 * Deletes an item and all related rows (CASCADE).
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || id.trim() === '') {
      throw new AppError(400, 'Missing item ID');
    }

    const deleted = await deleteItem(id, req.userId!);
    if (!deleted) {
      throw new AppError(404, 'Item not found');
    }

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/items/reorder
 * Batch update sort_order for multiple items.
 */
router.patch('/reorder', async (req, res, next) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      throw new AppError(400, 'Missing or empty items array');
    }

    for (const item of items) {
      if (!item.id || typeof item.sortOrder !== 'number') {
        throw new AppError(400, 'Each item must have id and sortOrder');
      }
    }

    await reorderItems(req.userId!, items);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/items/:id/status
 * Moves an item between lifecycle stages (todo, process, memo).
 */
router.patch('/:id/status', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || id.trim() === '') {
      throw new AppError(400, 'Missing item ID');
    }

    const { status } = req.body;
    if (!status) {
      throw new AppError(400, 'Missing required field: status');
    }

    const validStatus = validateStatus(status);

    try {
      const item = await updateItemStatus(id, validStatus, req.userId!);
      res.json({ data: item });
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'NOT_FOUND') {
        throw new AppError(404, 'Item not found');
      }
      throw err;
    }
  } catch (err) {
    next(err);
  }
});

export default router;
