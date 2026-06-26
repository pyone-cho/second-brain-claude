import { Router } from 'express';
import { AppError } from '../middleware/errorHandler.js';
import { authMiddleware, getJwtSecret } from '../middleware/auth.js';
import { createUser, getUserByEmail, getUserById, verifyPassword } from '../models/user.js';
import { signToken } from '../utils/jwt.js';
import { seedDefaultCategories } from '../models/category.js';

const router = Router();

/**
 * POST /api/auth/register
 * Body: { name, email, password }
 * Returns: { data: { user, token } }
 */
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      throw new AppError(400, 'Name is required');
    }
    if (!email || typeof email !== 'string' || email.trim() === '') {
      throw new AppError(400, 'Email is required');
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      throw new AppError(400, 'Password must be at least 6 characters');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      throw new AppError(400, 'Please enter a valid email address');
    }

    let user;
    try {
      user = await createUser(name.trim(), email.trim().toLowerCase(), password);
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'EMAIL_EXISTS') {
        throw new AppError(409, 'An account with this email already exists');
      }
      throw err;
    }

    // Seed default categories for the new user
    await seedDefaultCategories(user.id);

    const secret = getJwtSecret();
    const token = signToken({ sub: user.id }, secret);

    res.status(201).json({
      data: {
        user: { id: user.id, name: user.name, email: user.email },
        token,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/login
 * Body: { email, password }
 * Returns: { data: { user, token } }
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || typeof email !== 'string' || email.trim() === '') {
      throw new AppError(400, 'Email is required');
    }
    if (!password || typeof password !== 'string' || password === '') {
      throw new AppError(400, 'Password is required');
    }

    const user = await getUserByEmail(email.trim().toLowerCase());
    if (!user) {
      throw new AppError(401, 'Invalid email or password');
    }

    const valid = verifyPassword(password, user.password_hash);
    if (!valid) {
      throw new AppError(401, 'Invalid email or password');
    }

    const secret = getJwtSecret();
    const token = signToken({ sub: user.id }, secret);

    res.json({
      data: {
        user: { id: user.id, name: user.name, email: user.email },
        token,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/auth/me
 * Returns the current user's info (requires auth).
 */
router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const user = await getUserById(req.userId!);
    if (!user) {
      throw new AppError(404, 'User not found');
    }
    res.json({ data: { user } });
  } catch (err) {
    next(err);
  }
});

export default router;
