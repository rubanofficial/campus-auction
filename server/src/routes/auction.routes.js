import { Router } from 'express';
import {
  createAuction,
  getAuctionById,
  getAuctions,
} from '../controllers/auction.controller.js';
import { placeBid } from '../controllers/bid.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * GET /api/auctions
 * Browse, search, and filter active auctions
 */
router.get('/', getAuctions);

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

/**
 * POST /api/auctions/:id/bids
 * Place a bid on an active auction (requires active student session)
 */
router.post('/:id/bids', requireAuth, placeBid);

export default router;
