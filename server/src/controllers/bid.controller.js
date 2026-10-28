import { getPool, query } from '../config/database.js';
import { broadcastBidUpdate } from '../config/socket.js';
import { placeInternalBid, processAutoBids } from './autoBid.controller.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_POSTGRES_INTEGER = 2147483647;

/**
 * Place a bid on an active auction
 * POST /api/auctions/:id/bids
 */
export const placeBid = async (req, res) => {
  const { id } = req.params;
  const { amount } = req.body;
  const bidderId = req.user.id;
  const bidderName = req.user.displayName;

  // 1. Validate Auction ID
  if (!id || !UUID_REGEX.test(id)) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Invalid auction ID format. Expected a valid UUID.',
    });
  }

  // 2. Validate Bid Amount
  if (amount === undefined || amount === null) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Bid amount is required.',
    });
  }

  const parsedAmount = typeof amount === 'number' ? amount : Number(amount);

  if (
    typeof amount !== 'number' &&
    typeof amount !== 'string' ||
    !Number.isInteger(parsedAmount) ||
    parsedAmount <= 0
  ) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Bid amount must be a positive integer in whole rupees.',
    });
  }

  if (parsedAmount > MAX_POSTGRES_INTEGER) {
    return res.status(400).json({
      error: 'Validation Error',
      message: `Bid amount cannot exceed ₹${MAX_POSTGRES_INTEGER.toLocaleString('en-IN')}.`,
    });
  }

  const pool = getPool();
  const client = await pool.connect();

  try {
    // 3. Begin Transaction
    await client.query('BEGIN');

    // 4. Lock and retrieve auction row using SELECT ... FOR UPDATE
    const selectQuery = `
      SELECT
        id,
        seller_id,
        title,
        starting_price,
        min_bid_increment,
        current_price,
        current_leader_id,
        bid_count,
        starts_at,
        ends_at,
        status,
        outcome
      FROM auctions
      WHERE id = $1
      FOR UPDATE;
    `;

    const auctionResult = await client.query(selectQuery, [id]);

    // 5. Check if auction exists
    if (auctionResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        error: 'Not Found',
        message: 'Auction not found.',
      });
    }

    const auction = auctionResult.rows[0];

    // 6. Reject bids from the auction's seller
    if (auction.seller_id === bidderId) {
      await client.query('ROLLBACK');
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You cannot place a bid on your own auction listing.',
      });
    }

    // 7. Reject bids on inactive auctions or auctions with settled outcomes
    if (auction.status !== 'active') {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: 'Bad Request',
        message: `Auction is not open for bidding. Current status: ${auction.status}.`,
      });
    }

    if (auction.outcome !== null) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: 'Bad Request',
        message: `Auction has already closed with outcome: ${auction.outcome}.`,
      });
    }

    // 8. Check auction time window
    const now = new Date();
    const startsAt = new Date(auction.starts_at);
    const endsAt = new Date(auction.ends_at);

    if (now < startsAt) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Auction has not started yet.',
      });
    }

    if (now >= endsAt) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Auction has already ended and is closed for bidding.',
      });
    }

    // 9. Enforce minimum bid rules
    // First bid must be at least the starting price; subsequent bids must be >= current_price + min_bid_increment
    if (auction.bid_count === 0) {
      if (parsedAmount < auction.starting_price) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          error: 'Bad Request',
          message: `The first bid must be at least the starting price of ₹${auction.starting_price}.`,
        });
      }
    } else {
      const minRequiredBid = auction.current_price + auction.min_bid_increment;
      if (parsedAmount < minRequiredBid) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          error: 'Bad Request',
          message: `Bid must be at least ₹${minRequiredBid} (current price ₹${auction.current_price} + minimum increment ₹${auction.min_bid_increment}).`,
        });
      }
    }

    // 10. Insert bid record and update auction atomically via shared internal helper
    const initialBidRecord = await placeInternalBid(
      client,
      auction,
      bidderId,
      bidderName,
      parsedAmount
    );

    const placedBids = [initialBidRecord];

    // 11. Evaluate active competing auto-bids on this auction
    await processAutoBids(client, auction, placedBids);

    // 12. Commit transaction
    await client.query('COMMIT');

    // 13. Broadcast all accepted bid updates to viewers in this auction room after COMMIT
    for (const item of placedBids) {
      broadcastBidUpdate(id, item);
    }

    const winningBidRecord = placedBids[placedBids.length - 1];
    const isStillLeader = auction.current_leader_id === bidderId;
    const finalLeaderName = winningBidRecord?.bid?.bidderName || bidderName;
    const anyExtended = placedBids.some((b) => b.wasExtended);

    return res.status(201).json({
      message: isStillLeader
        ? `Your bid of ₹${parsedAmount.toLocaleString('en-IN')} was placed successfully! You are now the leading bidder.${anyExtended ? ' Auction extended by 60 seconds due to last-minute bidding.' : ''}`
      : `Your bid of ₹${parsedAmount.toLocaleString('en-IN')} was placed, but ${finalLeaderName} automatically counter-bid ₹${auction.current_price.toLocaleString('en-IN')} to regain the lead.${anyExtended ? ' Auction extended by 60 seconds due to last-minute bidding.' : ''}`,
      bid: winningBidRecord?.bid || placedBids[0].bid,
      userBid: placedBids[0].bid,
      isLeader: isStillLeader,
      wasExtended: anyExtended,
      endsAt: auction.ends_at,
      ends_at: auction.ends_at,
      auction: {
      id: auction.id,
      currentPrice: auction.current_price,
      current_price: auction.current_price,
      currentLeaderId: auction.current_leader_id,
      current_leader_id: auction.current_leader_id,
      currentLeaderName: finalLeaderName,
      current_leader_name: finalLeaderName,
      bidCount: auction.bid_count,
      bid_count: auction.bid_count,
      endsAt: auction.ends_at,
      ends_at: auction.ends_at,
      updatedAt: auction.updated_at,
      updated_at: auction.updated_at,
    },
      counterBidsPlaced: placedBids.length - 1,
    });
} catch (error) {
  await client.query('ROLLBACK').catch(() => { });
  console.error(`[Bidding Controller] Error placing bid: ${error.message}`);
  return res.status(500).json({
    error: 'Internal Server Error',
    message: 'An unexpected error occurred while placing your bid. Please try again.',
  });
} finally {
  client.release();
}
};

/**
 * Retrieve bid history for a specific auction
 * GET /api/auctions/:id/bids
 */
export const getAuctionBids = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Validate Auction ID format (UUID)
    if (!id || !UUID_REGEX.test(id)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid auction ID format. Expected a valid UUID.',
      });
    }

    // 2. Query auction summary with leader display name via LEFT JOIN
    const auctionQuery = `
      SELECT
        a.id,
        a.title,
        a.starting_price,
        a.min_bid_increment,
        a.current_price,
        a.bid_count,
        a.status,
        a.current_leader_id,
        l.display_name AS current_leader_name
      FROM auctions a
      LEFT JOIN users l ON a.current_leader_id = l.id
      WHERE a.id = $1;
    `;

    const auctionResult = await query(auctionQuery, [id]);

    // 3. Return 404 if auction not found
    if (auctionResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Auction not found.',
      });
    }

    const auction = auctionResult.rows[0];

    // 4. Query bids belonging only to this auction with bidder display name
    // Ordered newest-first using created_at DESC and stable tie-breaker id DESC
    const bidsQuery = `
      SELECT
        b.id,
        b.auction_id,
        b.bidder_id,
        b.amount,
        b.created_at,
        u.display_name AS bidder_name
      FROM bids b
      JOIN users u ON b.bidder_id = u.id
      WHERE b.auction_id = $1
      ORDER BY b.created_at DESC, b.id DESC;
    `;

    const bidsResult = await query(bidsQuery, [id]);

    const formattedBids = bidsResult.rows.map((row) => ({
      id: row.id,
      auctionId: row.auction_id,
      bidderId: row.bidder_id,
      bidderName: row.bidder_name,
      amount: row.amount,
      createdAt: row.created_at,
      // Snake_case convenience
      auction_id: row.auction_id,
      bidder_id: row.bidder_id,
      bidder_name: row.bidder_name,
      created_at: row.created_at,
    }));

    return res.status(200).json({
      auction: {
        id: auction.id,
        title: auction.title,
        startingPrice: auction.starting_price,
        minBidIncrement: auction.min_bid_increment,
        currentPrice: auction.current_price,
        bidCount: auction.bid_count,
        currentLeaderId: auction.current_leader_id || null,
        currentLeaderName: auction.current_leader_name || null,
        status: auction.status,
        // Snake_case convenience
        starting_price: auction.starting_price,
        min_bid_increment: auction.min_bid_increment,
        current_price: auction.current_price,
        bid_count: auction.bid_count,
        current_leader_id: auction.current_leader_id || null,
        current_leader_name: auction.current_leader_name || null,
      },
      bids: formattedBids,
    });
  } catch (error) {
    console.error(`[Bidding Controller] Error retrieving bid history: ${error.message}`);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred while retrieving bid history. Please try again.',
    });
  }
};


