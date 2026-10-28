import { Router } from 'express';
import { getDatabaseStatus } from '../config/database.js';

const router = Router();

/**
 * GET /api/health
 * Returns API health status, timestamp, and active database connection state.
 * Responds with HTTP 200 if database is connected, or HTTP 503 if unavailable.
 */
router.get('/', (req, res) => {
  const dbStatus = getDatabaseStatus();
  const isDbHealthy = dbStatus.readyState === 1;

  const responsePayload = {
    status: isDbHealthy ? 'ok' : 'error',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    database: dbStatus,
  };

  const statusCode = isDbHealthy ? 200 : 503;
  res.status(statusCode).json(responsePayload);
});

export default router;
