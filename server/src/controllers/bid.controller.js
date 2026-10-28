import { getPool } from '../config/database.js';

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

    // 10. Insert bid record into bids table
    const insertBidQuery = `
      INSERT INTO bids (
        auction_id,
        bidder_id,
        amount
      ) VALUES ($1, $2, $3)
      RETURNING id, auction_id, bidder_id, amount, created_at;
    `;

    const bidResult = await client.query(insertBidQuery, [
      id,
      bidderId,
      parsedAmount,
    ]);
    const createdBid = bidResult.rows[0];

    // 11. Update auction current_price, current_leader_id, bid_count, and updated_at
    const updateAuctionQuery = `
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

    const updateResult = await client.query(updateAuctionQuery, [
      parsedAmount,
      bidderId,
      id,
    ]);
    const updatedAuction = updateResult.rows[0];

    // 12. Commit transaction
    await client.query('COMMIT');

    return res.status(201).json({
      message: 'Bid placed successfully.',
      bid: {
        id: createdBid.id,
        auctionId: createdBid.auction_id,
        bidderId: createdBid.bidder_id,
        bidderName: bidderName,
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
    });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error(`[Bidding Controller] Error placing bid: ${error.message}`);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred while placing your bid. Please try again.',
    });
  } finally {
    client.release();
  }
};

