import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.js';
import { AppError } from './errorHandler.js';

// ---------------------------------------------------------------------------
// Extend Express Request to include userId
// ---------------------------------------------------------------------------

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

// ---------------------------------------------------------------------------
// JWT secret — must match the one used in auth routes
// ---------------------------------------------------------------------------

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (secret) return secret;

  if (process.env.NODE_ENV !== 'production') {
    return 'dev-jwt-secret-change-in-production';
  }

  throw new Error('JWT_SECRET environment variable is required in production');
}

// ---------------------------------------------------------------------------
// Auth middleware — validates Bearer token and sets req.userId
// ---------------------------------------------------------------------------

export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(401, 'Authentication required');
    }

    const token = authHeader.slice(7);
    const secret = getJwtSecret();
    const payload = verifyToken(token, secret);

    if (!payload || !payload.sub) {
      throw new AppError(401, 'Invalid or expired token');
    }

    req.userId = payload.sub;
    next();
  } catch (err) {
    next(err);
  }
}
