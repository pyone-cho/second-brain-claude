import express from 'express';
import cors from 'cors';
import { runMigrations } from './db.js';
import { errorHandler, AppError } from './middleware/errorHandler.js';
import { authMiddleware } from './middleware/auth.js';
import authRouter from './routes/auth.js';
import itemsRouter from './routes/items.js';
import categoriesRouter from './routes/categories.js';
import itInfraRouter from './routes/itInfra.js';
import searchRouter from './routes/search.js';
import statsRouter from './routes/stats.js';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

// CORS — configurable via CORS_ORIGIN env var (comma-separated for multiple origins)
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';
app.use(
  cors({
    origin: CORS_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

// Parse JSON request bodies (limit to 1MB)
app.use(express.json({ limit: '1mb' }));

// Request logger
app.use((req, res, next) => {
  const start = Date.now();
  const { method, path } = req;

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${method} ${path} ${res.statusCode} ${duration}ms`);
  });

  next();
});

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

// Public routes (no auth required)
app.use('/api/auth', authRouter);

// Protected routes (require valid JWT)
app.use('/api/items', authMiddleware, itemsRouter);
app.use('/api/categories', authMiddleware, categoriesRouter);
app.use('/api/it-infra', authMiddleware, itInfraRouter);
app.use('/api/search', authMiddleware, searchRouter);
app.use('/api/stats', authMiddleware, statsRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------

app.use((_req, _res, next) => {
  next(new AppError(404, 'Route not found'));
});

app.use(errorHandler);

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------

async function main() {
  await runMigrations();
  console.log('[DB] Migrations complete.');

  app.listen(PORT, () => {
    console.log(`[Server] Second Brain API running on http://localhost:${PORT}`);
    console.log(`[Server] CORS enabled for ${CORS_ORIGIN}`);
  });
}

main().catch((err) => {
  console.error('[Server] Failed to start:', err);
  process.exit(1);
});

export default app;
