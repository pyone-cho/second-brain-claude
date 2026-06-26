import { Router } from 'express';
import client from '../db.js';

const router = Router();

/**
 * GET /api/stats
 * Returns dashboard statistics:
 * - Total counts by status (todo, process, memo)
 * - Breakdown by item type
 * - Books to read count
 * - Upcoming trips count
 */
router.get('/', async (req, res, next) => {
  try {
    const userId = req.userId!;

    // Counts by status
    const statusResult = await client.execute({
      sql: `SELECT status, COUNT(*) as count FROM items WHERE user_id = ? GROUP BY status`,
      args: [userId],
    });

    let totalTodo = 0;
    let totalProcess = 0;
    let totalMemo = 0;

    for (const row of statusResult.rows) {
      if (row.status === 'todo') totalTodo = row.count as number;
      else if (row.status === 'process') totalProcess = row.count as number;
      else if (row.status === 'memo') totalMemo = row.count as number;
    }

    // Counts by type
    const typeResult = await client.execute({
      sql: `SELECT type, COUNT(*) as count FROM items WHERE user_id = ? GROUP BY type`,
      args: [userId],
    });

    const byType: Record<string, number> = {};
    for (const row of typeResult.rows) {
      byType[row.type as string] = row.count as number;
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
    const booksResult = await client.execute({
      sql: `SELECT COUNT(*) as count FROM items WHERE type = 'reading-book' AND status = 'todo' AND user_id = ?`,
      args: [userId],
    });
    const booksToRead = (booksResult.rows[0].count as number) || 0;

    // Upcoming trips: count of trip items with status 'todo'
    const tripsResult = await client.execute({
      sql: `SELECT COUNT(*) as count FROM items WHERE type = 'trip' AND status = 'todo' AND user_id = ?`,
      args: [userId],
    });
    const upcomingTrips = (tripsResult.rows[0].count as number) || 0;

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
