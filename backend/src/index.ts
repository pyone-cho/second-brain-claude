import express from 'express';
import cors from 'cors';
import { runMigrations } from './db.js';
import { errorHandler, AppError } from './middleware/errorHandler.js';
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

  // Hook into response finish to log duration
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${method} ${path} ${res.statusCode} ${duration}ms`);
  });

  next();
});

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

app.use('/api/items', itemsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/it-infra', itInfraRouter);
app.use('/api/search', searchRouter);
app.use('/api/stats', statsRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------

// Catch-all for unmatched routes
app.use((_req, _res, next) => {
  next(new AppError(404, 'Route not found'));
});

// Global error handler (must be last middleware)
app.use(errorHandler);

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------

// Run migrations before starting
runMigrations();
console.log('[DB] Migrations complete.');

app.listen(PORT, () => {
  console.log(`[Server] Second Brain API running on http://localhost:${PORT}`);
  console.log(`[Server] CORS enabled for ${CORS_ORIGIN}`);
});

export default app;
