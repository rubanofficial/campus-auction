import { Router } from 'express';
import {
  createAuction,
  getAuctionById,
  getAuctions,
} from '../controllers/auction.controller.js';
import { placeBid, getAuctionBids } from '../controllers/bid.controller.js';
import {
  setupOrUpdateAutoBid,
  getAutoBidStatus,
  cancelAutoBid,
} from '../controllers/autoBid.controller.js';
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
 * GET /api/auctions/:id/bids
 * Retrieve bid history for a single auction
 */
router.get('/:id/bids', getAuctionBids);

/**
 * POST /api/auctions/:id/bids
 * Place a bid on an active auction (requires active student session)
 */
router.post('/:id/bids', requireAuth, placeBid);

/**
 * POST /api/auctions/:id/auto-bid
 * Activate or update automated proxy bidding with a maximum amount
 */
router.post('/:id/auto-bid', requireAuth, setupOrUpdateAutoBid);

/**
 * GET /api/auctions/:id/auto-bid
 * Retrieve current user's auto-bid configuration for this auction
 */
router.get('/:id/auto-bid', requireAuth, getAutoBidStatus);

/**
 * DELETE /api/auctions/:id/auto-bid
 * Deactivate automated proxy bidding for this auction
 */
router.delete('/:id/auto-bid', requireAuth, cancelAutoBid);

export default router;
