import type { Request, Response, NextFunction } from 'express';

/**
 * Global error handling middleware.
 * Catches unhandled errors and returns a consistent JSON error response.
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  console.error('[ERROR]', err.message, err.stack);

  const statusCode = err instanceof AppError ? err.statusCode : 500;

  // Do not leak stack traces in production
  const message =
    process.env.NODE_ENV === 'production' && statusCode === 500
      ? 'Internal server error'
      : err.message;

  res.status(statusCode).json({ error: message });
}

/**
 * Custom application error with an HTTP status code.
 */
export class AppError extends Error {
  public statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
  }
}
