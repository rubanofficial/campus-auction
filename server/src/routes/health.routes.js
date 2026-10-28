import { Router } from 'express';
import { getDatabaseStatus } from '../config/database.js';

const router = Router();

/**
 * GET /api/health
 * Returns API health status, timestamp, and active PostgreSQL database connection state.
 * Responds with HTTP 200 if database is connected, or HTTP 503 if unavailable.
 */
router.get('/', async (req, res) => {
  try {
    const dbStatus = await getDatabaseStatus();
    const isDbHealthy = dbStatus.connected === true;

    const responsePayload = {
      status: isDbHealthy ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      database: dbStatus,
    };

    const statusCode = isDbHealthy ? 200 : 503;
    res.status(statusCode).json(responsePayload);
  } catch (error) {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      database: {
        status: 'error',
        connected: false,
        error: error.message,
      },
    });
  }
});

export default router;
