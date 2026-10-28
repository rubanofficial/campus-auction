import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { getUserActivity } from '../controllers/activity.controller.js';

const router = Router();

/**
 * GET /api/activity
 * Retrieve the authenticated user's activity dashboard (listings, bids, won, sales, and summary counts)
 */
router.get('/', requireAuth, getUserActivity);

export default router;

