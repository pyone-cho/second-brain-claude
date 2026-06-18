import { Router } from 'express';
import { AppError } from '../middleware/errorHandler.js';
import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../models/category.js';
import { requireId } from '../middleware/validate.js';

const router = Router();

/**
 * GET /api/categories
 * Returns all categories ordered by name.
 */
router.get('/', (_req, res, next) => {
  try {
    const categories = getCategories();
    res.json({ data: categories });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/categories/:id
 * Returns a single category.
 */
router.get('/:id', (req, res, next) => {
  try {
    const id = requireId(req, 'id');
    const category = getCategoryById(id);
    if (!category) {
      throw new AppError(404, 'Category not found');
    }
    res.json({ data: category });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/categories
 * Creates a new category.  Body: { name, color?, icon? }
 */
router.post('/', (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name || typeof name !== 'string' || name.trim() === '') {
      throw new AppError(400, 'Missing required field: name');
    }

    const category = createCategory({
      name: name.trim(),
      color: req.body.color,
      icon: req.body.icon,
    });

    res.status(201).json({ data: category });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/categories/:id
 * Updates a category.  Body: { name?, color?, icon? }
 */
router.put('/:id', (req, res, next) => {
  try {
    const id = requireId(req, 'id');

    // Validate name if provided
    if (req.body.name !== undefined && (typeof req.body.name !== 'string' || req.body.name.trim() === '')) {
      throw new AppError(400, 'Invalid name: must be a non-empty string');
    }

    const category = updateCategory(id, {
      name: req.body.name?.trim(),
      color: req.body.color,
      icon: req.body.icon,
    });

    if (!category) {
      throw new AppError(404, 'Category not found');
    }

    res.json({ data: category });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/categories/:id
 * Deletes a category.
 */
router.delete('/:id', (req, res, next) => {
  try {
    const id = requireId(req, 'id');
    const deleted = deleteCategory(id);
    if (!deleted) {
      throw new AppError(404, 'Category not found');
    }
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
