import { getPool } from '../config/database.js';
import { broadcastAuctionDecision } from '../config/socket.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Shared internal helper to process seller decision (accept or reject) on an ended auction
 * with concurrency protection via row locking in a single database transaction.
 */
const processSellerDecision = async (req, res, decision) => {
  const { id } = req.params;
  const sellerId = req.user?.id;

  // 1. Validate Auction ID
  if (!id || !UUID_REGEX.test(id)) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Invalid auction ID format. Expected a valid UUID.',
    });
  }

  // 2. Validate Seller Authentication
  if (!sellerId) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required. Please sign in.',
    });
  }

  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 3. Lock and retrieve auction row using SELECT ... FOR UPDATE
    const selectQuery = `
      SELECT
        a.id,
        a.seller_id,
        a.title,
        a.starting_price,
        a.current_price,
        a.current_leader_id,
        a.bid_count,
        a.starts_at,
        a.ends_at,
        a.status,
        a.outcome,
        a.decision_at,
        u.display_name AS seller_name,
        l.display_name AS leader_name
      FROM auctions a
      JOIN users u ON a.seller_id = u.id
      LEFT JOIN users l ON a.current_leader_id = l.id
      WHERE a.id = $1
      FOR UPDATE OF a;
    `;

    const auctionResult = await client.query(selectQuery, [id]);

    // 4. Verify auction existence
    if (auctionResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        error: 'Not Found',
        message: 'Auction not found.',
      });
    }

    const auction = auctionResult.rows[0];

    // 5. Verify seller ownership
    if (auction.seller_id !== sellerId) {
      await client.query('ROLLBACK');
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Only the auction seller can accept or reject the winning bid.',
      });
    }

    // 6. Check if auction was cancelled
    if (auction.status === 'cancelled') {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: 'Bad Request',
        message: 'This auction was cancelled and cannot be decided.',
      });
    }

    // 7. Verify auction closing time has passed
    const now = new Date();
    const endsAt = new Date(auction.ends_at);
    const isEnded = auction.status === 'ended' || endsAt <= now;

    if (!isEnded) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: 'Bad Request',
        message: `Cannot accept or reject bids while the auction is still active. Bidding closes at ${endsAt.toLocaleString('en-IN')}.`,
      });
    }

    // 8. Verify auction has valid bids
    if (auction.bid_count === 0 || !auction.current_leader_id) {
      // Mark as ended with outcome 'unsold'
      await client.query(
        `UPDATE auctions
         SET status = 'ended', outcome = 'unsold', updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [id]
      );
      await client.query('COMMIT');
      return res.status(400).json({
        error: 'Bad Request',
        message: 'No valid bids were placed on this auction. The auction has been marked as unsold.',
      });
    }

    // 9. Prevent duplicate decisions
    if (auction.outcome !== null) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        error: 'Conflict',
        message: `This auction winning bid has already been decided with outcome: ${auction.outcome}.`,
      });
    }

    // 10. Update auction status and outcome
    const targetOutcome = decision === 'accept' ? 'accepted' : 'rejected';
    const updateResult = await client.query(
      `UPDATE auctions
       SET
         status = 'ended',
         outcome = $1,
         decision_at = CURRENT_TIMESTAMP,
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, title, current_price, current_leader_id, status, outcome, decision_at;`,
      [targetOutcome, id]
    );

    const updatedAuction = updateResult.rows[0];

    // 11. Create persistent in-app notification for the winning bidder
    const notificationType = decision === 'accept' ? 'bid_accepted' : 'bid_rejected';
    const notificationTitle =
      decision === 'accept'
        ? `Winning Bid Accepted: ${auction.title}`
        : `Winning Bid Declined: ${auction.title}`;
    const notificationMessage =
      decision === 'accept'
        ? `Congratulations! Your winning bid of ₹${Number(auction.current_price).toLocaleString('en-IN')} for "${auction.title}" was accepted by the seller. The item is now reserved awaiting physical handover.`
        : `Your winning bid of ₹${Number(auction.current_price).toLocaleString('en-IN')} for "${auction.title}" was not accepted by the seller.`;

    await client.query(
      `INSERT INTO notifications (user_id, auction_id, type, title, message)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, auction_id, type)
       DO UPDATE SET
         message = EXCLUDED.message,
         title = EXCLUDED.title,
         is_read = false,
         created_at = CURRENT_TIMESTAMP;`,
      [
        auction.current_leader_id,
        id,
        notificationType,
        notificationTitle,
        notificationMessage,
      ]
    );

    await client.query('COMMIT');

    // 12. Broadcast decision event to viewers in real time
    broadcastAuctionDecision(id, {
      auctionId: id,
      outcome: targetOutcome,
      status: 'ended',
      currentPrice: auction.current_price,
      leaderName: auction.leader_name,
    });

    const responseMessage =
      decision === 'accept'
        ? 'Winning bid accepted successfully. The item is now reserved awaiting physical handover.'
        : 'Winning bid was rejected. The auction is now closed without a sale.';

    return res.status(200).json({
      message: responseMessage,
      auction: {
        id: updatedAuction.id,
        title: updatedAuction.title,
        status: updatedAuction.status,
        outcome: updatedAuction.outcome,
        decisionAt: updatedAuction.decision_at,
        decision_at: updatedAuction.decision_at,
        currentPrice: Number(updatedAuction.current_price),
        current_price: Number(updatedAuction.current_price),
        currentLeaderId: updatedAuction.current_leader_id,
        current_leader_id: updatedAuction.current_leader_id,
        currentLeaderName: auction.leader_name,
        current_leader_name: auction.leader_name,
        bidCount: auction.bid_count,
        bid_count: auction.bid_count,
      },
    });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error(`[Decision Controller] Error processing ${decision}: ${error.message}`);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: `Failed to ${decision} winning bid. Please try again.`,
    });
  } finally {
    client.release();
  }
};

/**
 * Seller accepts winning bid on an ended auction.
 * POST /api/auctions/:id/accept
 */
export const acceptWinningBid = async (req, res) => {
  return processSellerDecision(req, res, 'accept');
};

/**
 * Seller rejects winning bid on an ended auction.
 * POST /api/auctions/:id/reject
 */
export const rejectWinningBid = async (req, res) => {
  return processSellerDecision(req, res, 'reject');
};

/**
 * Flexible endpoint supporting decision parameter in body: { decision: 'accept' | 'reject' }
 * POST /api/auctions/:id/decision
 */
export const decideWinningBid = async (req, res) => {
  const { decision } = req.body;
  if (!decision || (decision !== 'accept' && decision !== 'reject')) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Decision must be either "accept" or "reject".',
    });
  }
  return processSellerDecision(req, res, decision);
};

