import { Router } from 'express';
import db from '../db.js';

const router = Router();

/**
 * GET /api/stats
 * Returns dashboard statistics:
 * - Total counts by status (todo, process, memo)
 * - Breakdown by item type
 * - Books to read count
 * - Upcoming trips count
 */
router.get('/', async (_req, res, next) => {
  try {
    // Counts by status
    const statusResult = await db.execute(
      `SELECT status, COUNT(*) as count FROM items GROUP BY status`,
    );
    const statusCounts = statusResult.rows as unknown as { status: string; count: number }[];

    let totalTodo = 0;
    let totalProcess = 0;
    let totalMemo = 0;

    for (const row of statusCounts) {
      if (row.status === 'todo') totalTodo = row.count;
      else if (row.status === 'process') totalProcess = row.count;
      else if (row.status === 'memo') totalMemo = row.count;
    }

    // Counts by type
    const typeResult = await db.execute(
      `SELECT type, COUNT(*) as count FROM items GROUP BY type`,
    );
    const typeCounts = typeResult.rows as unknown as { type: string; count: number }[];

    const byType: Record<string, number> = {};
    for (const row of typeCounts) {
      byType[row.type] = row.count;
    }

    // Ensure all types are represented (even if 0)
    const allTypes = [
      'task',
      'task-it-infra',
      'reading-book',
      'reading-website',
      'buying',
      'trip',
    ];
    for (const t of allTypes) {
      if (!(t in byType)) {
        byType[t] = 0;
      }
    }

    // Books to read: count of reading-book items with status 'todo'
    const booksResult = await db.execute(
      `SELECT COUNT(*) as count FROM items WHERE type = 'reading-book' AND status = 'todo'`,
    );
    const booksToRead = (booksResult.rows[0] as unknown as { count: number }).count;

    // Upcoming trips: count of trip items with status 'todo'
    const tripsResult = await db.execute(
      `SELECT COUNT(*) as count FROM items WHERE type = 'trip' AND status = 'todo'`,
    );
    const upcomingTrips = (tripsResult.rows[0] as unknown as { count: number }).count;

    res.json({
      data: {
        totalTodo,
        totalProcess,
        totalMemo,
        byType,
        booksToRead,
        upcomingTrips,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
