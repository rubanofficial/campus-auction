import { Router } from 'express';
import { createAuction, getAuctionById } from '../controllers/auction.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * POST /api/auctions
 * Create a new auction listing (requires active student session)
 */
router.post('/', requireAuth, createAuction);

/**
 * GET /api/auctions/:id
 * Retrieve details for a single auction by ID
 */
router.get('/:id', getAuctionById);

export default router;
