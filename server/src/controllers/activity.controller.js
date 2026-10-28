import { query } from '../config/database.js';

const CATEGORY_DISPLAY_NAMES = {
  cycle: 'Cycles',
  calculator: 'Calculators',
  books: 'Books',
  electronics: 'Electronics',
  other: 'Other',
};

/**
 * Format relative time remaining for active auctions
 */
const formatTimeRemaining = (endsAt) => {
  if (!endsAt) return null;
  const diffMs = new Date(endsAt).getTime() - Date.now();
  if (diffMs <= 0) return null;

  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const totalHours = Math.floor(totalMinutes / 60);
  const days = Math.floor(totalHours / 24);
  const remainingHours = totalHours % 24;
  const remainingMinutes = totalMinutes % 60;

  if (days > 0) {
    return `Ends in ${days}d ${remainingHours}h`;
  }
  if (totalHours > 0) {
    return `Closes in ${totalHours}h ${remainingMinutes}m`;
  }
  return `Closing in ${remainingMinutes}m`;
};

/**
 * Format date for closed or completed auctions
 */
const formatDate = (date) => {
  if (!date) return null;
  return new Date(date).toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

/**
 * Get comprehensive activity dashboard for the authenticated student.
 * GET /api/activity
 */
export const getUserActivity = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();

    // 1. Query all listings created by the logged-in student
    const listingsPromise = query(
      `SELECT
         a.id,
         a.title,
         a.category,
         a.condition,
         a.description,
         a.starting_price,
         a.current_price,
         a.current_leader_id,
         a.bid_count,
         a.status,
         a.outcome,
         a.decision_at,
         a.starts_at,
         a.ends_at,
         a.images,
         a.created_at,
         a.updated_at,
         l.display_name AS leader_name
       FROM auctions a
       LEFT JOIN users l ON a.current_leader_id = l.id
       WHERE a.seller_id = $1
       ORDER BY a.created_at DESC`,
      [userId]
    );

    // 2. Query distinct auctions where the student has placed bids
    const bidsPromise = query(
      `SELECT
         a.id,
         a.title,
         a.category,
         a.condition,
         a.starting_price,
         a.current_price,
         a.current_leader_id,
         a.bid_count,
         a.status,
         a.outcome,
         a.starts_at,
         a.ends_at,
         a.images,
         ub.my_bid,
         ub.my_latest_bid_at,
         l.display_name AS leader_name
       FROM (
         SELECT
           auction_id,
           MAX(amount) AS my_bid,
           MAX(created_at) AS my_latest_bid_at
         FROM bids
         WHERE bidder_id = $1
         GROUP BY auction_id
       ) ub
       JOIN auctions a ON ub.auction_id = a.id
       LEFT JOIN users l ON a.current_leader_id = l.id
       ORDER BY ub.my_latest_bid_at DESC`,
      [userId]
    );

    // 3. Query auctions won by the student (closed auctions where student holds highest bid and outcome is accepted/sold/awaiting decision)
    const wonPromise = query(
      `SELECT
         a.id,
         a.title,
         a.category,
         a.condition,
         a.starting_price,
         a.current_price AS winning_bid,
         a.bid_count,
         a.status,
         a.outcome,
         a.starts_at,
         a.ends_at,
         a.images,
         a.created_at,
         u.display_name AS seller_name
       FROM auctions a
       JOIN users u ON a.seller_id = u.id
       WHERE a.current_leader_id = $1
         AND (a.status = 'ended' OR (a.status = 'active' AND a.ends_at <= CURRENT_TIMESTAMP))
         AND (a.outcome IS NULL OR a.outcome = 'sold' OR a.outcome = 'accepted')
       ORDER BY a.ends_at DESC`,
      [userId]
    );

    // 4. Query completed sales created by the student (only genuinely completed handover)
    const salesPromise = query(
      `SELECT
         a.id,
         a.title,
         a.category,
         a.condition,
         a.starting_price,
         a.current_price AS final_price,
         a.bid_count,
         a.status,
         a.outcome,
         a.starts_at,
         a.ends_at,
         a.images,
         a.updated_at AS completed_at,
         u.display_name AS buyer_name
       FROM auctions a
       LEFT JOIN users u ON a.current_leader_id = u.id
       WHERE a.seller_id = $1
         AND a.outcome = 'sold'
       ORDER BY a.updated_at DESC`,
      [userId]
    );

    const [listingsResult, bidsResult, wonResult, salesResult] = await Promise.all([
      listingsPromise,
      bidsPromise,
      wonPromise,
      salesPromise,
    ]);

    // Format Listings
    let activeListingsCount = 0;
    const formattedListings = listingsResult.rows.map((row) => {
      const endsAtDate = new Date(row.ends_at);
      const isTimeEnded = endsAtDate <= now;
      const isCurrentlyActive = row.status === 'active' && !isTimeEnded;
      const hasEnded = isTimeEnded || row.status === 'ended';
      const canDecide = hasEnded && Number(row.bid_count) > 0 && Boolean(row.current_leader_id) && row.outcome === null;

      if (isCurrentlyActive) {
        activeListingsCount++;
      }

      let displayStatus = 'Active';
      if (row.status === 'cancelled') {
        displayStatus = 'Cancelled';
      } else if (isCurrentlyActive) {
        displayStatus = 'Active';
      } else if (row.outcome === 'accepted') {
        displayStatus = 'Reserved';
      } else if (row.outcome === 'rejected') {
        displayStatus = 'Rejected';
      } else if (row.outcome === 'sold') {
        displayStatus = 'Sold';
      } else if (row.outcome === 'unsold') {
        displayStatus = 'Unsold';
      } else if (canDecide) {
        displayStatus = 'Awaiting Seller Decision';
      } else if (hasEnded) {
        displayStatus = Number(row.bid_count) > 0 ? 'Awaiting Seller Decision' : 'Unsold';
      }

      const images = Array.isArray(row.images) ? row.images : [];
      const imageUrl = images.length > 0 ? images[0] : '';

      return {
        id: row.id,
        title: row.title,
        category: CATEGORY_DISPLAY_NAMES[row.category?.toLowerCase()] || row.category || 'Other',
        currentPrice: Number(row.current_price),
        startingPrice: Number(row.starting_price),
        totalBids: Number(row.bid_count),
        leaderName: row.leader_name || null,
        currentLeaderId: row.current_leader_id || null,
        outcome: row.outcome || null,
        decisionAt: row.decision_at || null,
        canDecide,
        closingLabel: isCurrentlyActive ? formatTimeRemaining(row.ends_at) : null,
        closedAt: hasEnded ? `Closed on ${formatDate(row.ends_at)}` : null,
        status: displayStatus,
        imageUrl,
        pickupSpot: 'Campus Pickup',
        actionText: canDecide ? 'Review Decision' : 'View Auction',
        actionHref: `/auctions/${row.id}`,
      };
    });

    // Format Bids
    let activeBidsCount = 0;
    const formattedBids = bidsResult.rows.map((row) => {
      const endsAtDate = new Date(row.ends_at);
      const isTimeEnded = endsAtDate <= now;
      const isCurrentlyActive = row.status === 'active' && !isTimeEnded;
      const hasEnded = isTimeEnded || row.status === 'ended';
      const isLeading = row.current_leader_id === userId;

      if (isCurrentlyActive) {
        activeBidsCount++;
      }

      let displayStatus = 'Outbid';
      if (isCurrentlyActive) {
        displayStatus = isLeading ? 'Leading' : 'Outbid';
      } else if (hasEnded) {
        if (isLeading) {
          if (row.outcome === 'accepted') {
            displayStatus = 'Won';
          } else if (row.outcome === 'sold') {
            displayStatus = 'Won';
          } else if (row.outcome === 'rejected') {
            displayStatus = 'Declined';
          } else {
            displayStatus = 'Awaiting Decision';
          }
        } else {
          displayStatus = 'Outbid';
        }
      }

      const images = Array.isArray(row.images) ? row.images : [];
      const imageUrl = images.length > 0 ? images[0] : '';

      return {
        id: row.id,
        title: row.title,
        category: CATEGORY_DISPLAY_NAMES[row.category?.toLowerCase()] || row.category || 'Other',
        myBid: Number(row.my_bid),
        currentPrice: Number(row.current_price),
        totalBids: Number(row.bid_count),
        closingLabel: isCurrentlyActive ? formatTimeRemaining(row.ends_at) : null,
        closedAt: hasEnded ? `Closed on ${formatDate(row.ends_at)}` : null,
        status: displayStatus,
        imageUrl,
        pickupSpot: 'Campus Pickup',
        actionText: isCurrentlyActive && !isLeading ? 'Increase Bid' : 'View Auction',
        actionHref: `/auctions/${row.id}`,
      };
    });

    // Format Won Auctions
    let auctionsWonCount = 0;
    const formattedWon = wonResult.rows.map((row) => {
      const isHandoverCompleted = row.outcome === 'sold';
      const isAccepted = row.outcome === 'accepted';
      const isAwaitingDecision = row.outcome === null;

      if (isAccepted) {
        auctionsWonCount++;
      }

      let displayStatus = 'Reserved';
      if (isHandoverCompleted) {
        displayStatus = 'Completed';
      } else if (isAccepted) {
        displayStatus = 'Reserved';
      } else if (isAwaitingDecision) {
        displayStatus = 'Awaiting Seller Decision';
      }

      const images = Array.isArray(row.images) ? row.images : [];
      const imageUrl = images.length > 0 ? images[0] : '';

      return {
        id: row.id,
        title: row.title,
        category: CATEGORY_DISPLAY_NAMES[row.category?.toLowerCase()] || row.category || 'Other',
        winningBid: Number(row.winning_bid),
        closedAt: `Closed on ${formatDate(row.ends_at)}`,
        status: displayStatus,
        imageUrl,
        pickupSpot: row.seller_name ? `Contact Seller: ${row.seller_name}` : 'Campus Handover',
        actionText: 'View Auction',
        actionHref: `/auctions/${row.id}`,
      };
    });

    // Format Completed Sales (Genuinely completed handover only)
    const formattedSales = salesResult.rows.map((row) => {
      const images = Array.isArray(row.images) ? row.images : [];
      const imageUrl = images.length > 0 ? images[0] : '';

      return {
        id: row.id,
        title: row.title,
        category: CATEGORY_DISPLAY_NAMES[row.category?.toLowerCase()] || row.category || 'Other',
        finalPrice: Number(row.final_price),
        completedAt: `Completed on ${formatDate(row.completed_at)}`,
        buyerNote: row.buyer_name ? `Handed over to ${row.buyer_name}` : 'Completed handover',
        status: 'Sold',
        imageUrl,
        pickupSpot: 'Campus Handover',
        actionText: 'View Record',
        actionHref: `/auctions/${row.id}`,
      };
    });

    return res.status(200).json({
      summary: {
        activeListings: activeListingsCount,
        activeBids: activeBidsCount,
        auctionsWon: auctionsWonCount,
        completedSales: formattedSales.length,
      },
      listings: formattedListings,
      bids: formattedBids,
      won: formattedWon,
      sales: formattedSales,
    });
  } catch (error) {
    console.error(`[Activity Controller] Error retrieving activity: ${error.message}`);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve your activity data. Please try again.',
    });
  }
};
