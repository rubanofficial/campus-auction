import { getPool, query } from '../config/database.js';
import { broadcastBidUpdate } from '../config/socket.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_POSTGRES_INTEGER = 2147483647;

/**
 * Place a single accepted bid record inside an active transaction,
 * updating the locked auction record and returning safe bid/auction details.
 *
 * @param {import('pg').PoolClient} client - Database client in active transaction
 * @param {Object} auction - Locked in-memory auction record
 * @param {string} bidderId - UUID of bidder
 * @param {string} bidderName - Display name of bidder
 * @param {number} amount - Integer bid amount in whole rupees
 */
export const placeInternalBid = async (
  client,
  auction,
  bidderId,
  bidderName,
  amount
) => {
  // 1. Insert bid row
  const insertQuery = `
    INSERT INTO bids (auction_id, bidder_id, amount)
    VALUES ($1, $2, $3)
    RETURNING id, auction_id, bidder_id, amount, created_at;
  `;
  const bidResult = await client.query(insertQuery, [auction.id, bidderId, amount]);
  const createdBid = bidResult.rows[0];

  // 2. Atomically update auction current_price, current_leader_id, bid_count
  const updateQuery = `
    UPDATE auctions
    SET
      current_price = $1,
      current_leader_id = $2,
      bid_count = bid_count + 1,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $3
    RETURNING
      id,
      title,
      starting_price,
      min_bid_increment,
      current_price,
      current_leader_id,
      bid_count,
      starts_at,
      ends_at,
      status,
      updated_at;
  `;
  const updateResult = await client.query(updateQuery, [amount, bidderId, auction.id]);
  const updatedAuction = updateResult.rows[0];

  // 3. Mutate in-memory auction representation for loop consistency
  auction.current_price = updatedAuction.current_price;
  auction.current_leader_id = updatedAuction.current_leader_id;
  auction.bid_count = updatedAuction.bid_count;
  auction.updated_at = updatedAuction.updated_at;

  return {
    bid: {
      id: createdBid.id,
      auctionId: createdBid.auction_id,
      bidderId: createdBid.bidder_id,
      bidderName,
      amount: createdBid.amount,
      createdAt: createdBid.created_at,
    },
    auction: {
      id: updatedAuction.id,
      currentPrice: updatedAuction.current_price,
      currentLeaderId: updatedAuction.current_leader_id,
      currentLeaderName: bidderName,
      bidCount: updatedAuction.bid_count,
      updatedAt: updatedAuction.updated_at,
    },
  };
};

/**
 * Concurrency-safe automatic bidding resolution engine.
 * Runs inside an ongoing transaction with the auction row locked.
 * Evaluates competing active auto-bids and places minimum valid increments
 * until no competitor can beat the current leader or limits are exhausted.
 *
 * Deterministic tie-breaker:
 * When competing auto-bids are eligible, the configuration created earlier (ab.created_at ASC)
 * takes precedence.
 *
 * @param {import('pg').PoolClient} client - Locked database client
 * @param {Object} auction - Locked auction record
 * @param {Array} placedBids - Accumulator array of bids placed in this transaction
 */
export const processAutoBids = async (client, auction, placedBids = []) => {
  const MAX_ROUNDS = 50;
  let rounds = 0;

  while (rounds < MAX_ROUNDS) {
    rounds++;

    // Calculate minimum required response bid
    const minRequiredBid =
      auction.bid_count === 0
        ? auction.starting_price
        : auction.current_price + auction.min_bid_increment;

    // Find the next eligible auto-bidder:
    // - Must be active and for this auction
    // - Must NOT be the current leader
    // - Must NOT be the seller
    // - Must have max_amount >= minRequiredBid
    // - Tie-breaker: earliest configuration timestamp (created_at ASC)
    const eligibleQuery = `
      SELECT
        ab.id,
        ab.user_id,
        ab.max_amount,
        ab.created_at,
        u.display_name
      FROM auto_bids ab
      JOIN users u ON ab.user_id = u.id
      WHERE ab.auction_id = $1
        AND ab.is_active = true
        AND ab.user_id != $2
        AND ab.user_id != $3
        AND ab.max_amount >= $4
        AND u.is_active = true
      ORDER BY ab.created_at ASC
      LIMIT 1;
    `;

    const leaderId = auction.current_leader_id || '00000000-0000-0000-0000-000000000000';
    const eligibleResult = await client.query(eligibleQuery, [
      auction.id,
      leaderId,
      auction.seller_id,
      minRequiredBid,
    ]);

    if (eligibleResult.rows.length === 0) {
      // No competitor has an active auto-bid willing to place the next required bid
      break;
    }

    const nextAutoBid = eligibleResult.rows[0];

    // Place the minimum necessary bid on behalf of this student
    const bidRecord = await placeInternalBid(
      client,
      auction,
      nextAutoBid.user_id,
      nextAutoBid.display_name,
      minRequiredBid
    );

    placedBids.push(bidRecord);
  }

  return placedBids;
};

/**
 * Configure or update Auto Bid for the authenticated student on an auction.
 * POST /api/auctions/:id/auto-bid
 */
export const setupOrUpdateAutoBid = async (req, res) => {
  const { id } = req.params;
  const { maxAmount } = req.body;
  const userId = req.user.id;
  const userDisplayName = req.user.displayName;

  // 1. Validate Auction ID format
  if (!id || !UUID_REGEX.test(id)) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Invalid auction ID format. Expected a valid UUID.',
    });
  }

  // 2. Validate Maximum Amount
  if (maxAmount === undefined || maxAmount === null) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Maximum bid amount is required.',
    });
  }

  const parsedMax = typeof maxAmount === 'number' ? maxAmount : Number(maxAmount);

  if (
    (typeof maxAmount !== 'number' && typeof maxAmount !== 'string') ||
    !Number.isInteger(parsedMax) ||
    parsedMax <= 0
  ) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Maximum bid amount must be a positive integer in whole rupees.',
    });
  }

  if (parsedMax > MAX_POSTGRES_INTEGER) {
    return res.status(400).json({
      error: 'Validation Error',
      message: `Maximum bid amount cannot exceed ₹${MAX_POSTGRES_INTEGER.toLocaleString('en-IN')}.`,
    });
  }

  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 3. Lock auction row with SELECT ... FOR UPDATE
    const auctionQuery = `
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
    const auctionResult = await client.query(auctionQuery, [id]);

    if (auctionResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        error: 'Not Found',
        message: 'Auction not found.',
      });
    }

    const auction = auctionResult.rows[0];

    // 4. Reject seller configuration
    if (auction.seller_id === userId) {
      await client.query('ROLLBACK');
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Sellers are not permitted to set up Auto Bid on their own listings.',
      });
    }

    // 5. Reject inactive or closed auctions
    if (auction.status !== 'active' || auction.outcome !== null) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: 'Bad Request',
        message: 'This auction is not open for bidding.',
      });
    }

    // 6. Check time window
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
        message: 'Auction has already ended.',
      });
    }

    // 7. Calculate minimum required bid
    const minRequiredBid =
      auction.bid_count === 0
        ? auction.starting_price
        : auction.current_price + auction.min_bid_increment;

    const isCurrentLeader = auction.current_leader_id === userId;

    // If not current leader, max amount must be at least the next required minimum bid
    if (!isCurrentLeader && parsedMax < minRequiredBid) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: 'Bad Request',
        message: `Maximum bid amount must be at least ₹${minRequiredBid.toLocaleString('en-IN')} to participate.`,
      });
    }

    // If already current leader, max amount cannot be lower than the current price
    if (isCurrentLeader && parsedMax < auction.current_price) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: 'Bad Request',
        message: `Maximum bid amount cannot be less than your current leading bid of ₹${auction.current_price.toLocaleString('en-IN')}.`,
      });
    }

    // 8. Upsert auto_bids record for this student and auction
    const upsertQuery = `
      INSERT INTO auto_bids (auction_id, user_id, max_amount, is_active)
      VALUES ($1, $2, $3, true)
      ON CONFLICT (auction_id, user_id)
      DO UPDATE SET
        max_amount = EXCLUDED.max_amount,
        is_active = true,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id, auction_id, user_id, max_amount, is_active, created_at, updated_at;
    `;

    const upsertResult = await client.query(upsertQuery, [id, userId, parsedMax]);
    const autoBidRecord = upsertResult.rows[0];

    // 9. If user is not currently leading, place the minimum required bid to take the lead
    const placedBids = [];

    if (auction.current_leader_id !== userId) {
      const initialBid = await placeInternalBid(
        client,
        auction,
        userId,
        userDisplayName,
        minRequiredBid
      );
      placedBids.push(initialBid);
    }

    // 10. Run competing auto-bid resolution loop inside transaction
    await processAutoBids(client, auction, placedBids);

    // 11. Commit transaction
    await client.query('COMMIT');

    // 12. Broadcast all placed bids via Socket.IO after commit
    for (const item of placedBids) {
      broadcastBidUpdate(id, item);
    }

    const winningBidRecord = placedBids[placedBids.length - 1];
    const isLeading = auction.current_leader_id === userId;
    const finalLeaderName = winningBidRecord?.bid?.bidderName || userDisplayName;

    return res.status(200).json({
      message: isLeading
        ? 'Auto Bid activated successfully. You are now the leading bidder.'
        : `Auto Bid activated, but ${finalLeaderName} currently holds the lead at ₹${auction.current_price.toLocaleString('en-IN')}.`,
      autoBid: {
        id: autoBidRecord.id,
        auctionId: autoBidRecord.auction_id,
        maxAmount: autoBidRecord.max_amount,
        isActive: autoBidRecord.is_active,
        createdAt: autoBidRecord.created_at,
        updatedAt: autoBidRecord.updated_at,
      },
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
        updatedAt: auction.updated_at,
        updated_at: auction.updated_at,
      },
      bidsPlacedCount: placedBids.length,
      currentPrice: auction.current_price,
      isLeading,
    });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error(`[AutoBid Controller] Error activating auto-bid: ${error.message}`);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred while setting up Auto Bid.',
    });
  } finally {
    client.release();
  }
};

/**
 * Get current user's Auto Bid configuration for an auction.
 * GET /api/auctions/:id/auto-bid
 */
export const getAutoBidStatus = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  if (!id || !UUID_REGEX.test(id)) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Invalid auction ID format. Expected a valid UUID.',
    });
  }

  try {
    const result = await query(
      `SELECT id, auction_id, user_id, max_amount, is_active, created_at, updated_at
       FROM auto_bids
       WHERE auction_id = $1 AND user_id = $2`,
      [id, userId]
    );

    const autoBid = result.rows[0];

    if (!autoBid || !autoBid.is_active) {
      return res.status(200).json({
        configured: false,
        autoBid: null,
      });
    }

    return res.status(200).json({
      configured: true,
      autoBid: {
        id: autoBid.id,
        auctionId: autoBid.auction_id,
        maxAmount: autoBid.max_amount,
        isActive: autoBid.is_active,
        createdAt: autoBid.created_at,
        updatedAt: autoBid.updated_at,
      },
    });
  } catch (error) {
    console.error(`[AutoBid Controller] Error getting status: ${error.message}`);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve auto-bid status.',
    });
  }
};

/**
 * Deactivate Auto Bid for the authenticated student on an auction.
 * DELETE /api/auctions/:id/auto-bid
 */
export const cancelAutoBid = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  if (!id || !UUID_REGEX.test(id)) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Invalid auction ID format. Expected a valid UUID.',
    });
  }

  try {
    const result = await query(
      `UPDATE auto_bids
       SET is_active = false, updated_at = CURRENT_TIMESTAMP
       WHERE auction_id = $1 AND user_id = $2 AND is_active = true
       RETURNING id, auction_id, is_active, updated_at`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(200).json({
        message: 'No active Auto Bid found to deactivate.',
        configured: false,
      });
    }

    return res.status(200).json({
      message: 'Auto Bid deactivated successfully.',
      configured: false,
    });
  } catch (error) {
    console.error(`[AutoBid Controller] Error cancelling auto-bid: ${error.message}`);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to deactivate Auto Bid.',
    });
  }
};

