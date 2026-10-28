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
         a.bid_count,
         a.status,
         a.outcome,
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

    // 3. Query auctions won by the student (closed auctions where student holds highest bid)
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
         AND (a.outcome IS NULL OR a.outcome = 'sold' OR a.outcome = 'pending')
       ORDER BY a.ends_at DESC`,
      [userId]
    );

    // 4. Query completed sales created by the student
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

      if (isCurrentlyActive) {
        activeListingsCount++;
      }

      let displayStatus = 'Active';
      if (row.status === 'active') {
        if (isTimeEnded) {
          displayStatus = row.bid_count > 0 ? 'Awaiting Seller Approval' : 'Unsold';
        } else {
          displayStatus = 'Active';
        }
      } else if (row.status === 'ended') {
        displayStatus = row.outcome === 'sold' ? 'Sold' : 'Unsold';
      } else if (row.status === 'cancelled') {
        displayStatus = 'Cancelled';
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
        closingLabel: isCurrentlyActive ? formatTimeRemaining(row.ends_at) : null,
        closedAt: isTimeEnded ? `Closed on ${formatDate(row.ends_at)}` : null,
        status: displayStatus,
        imageUrl,
        pickupSpot: 'Campus Pickup',
        actionText: 'View Auction',
        actionHref: `/auctions/${row.id}`,
      };
    });

    // Format Bids
    let activeBidsCount = 0;
    const formattedBids = bidsResult.rows.map((row) => {
      const endsAtDate = new Date(row.ends_at);
      const isTimeEnded = endsAtDate <= now;
      const isCurrentlyActive = row.status === 'active' && !isTimeEnded;
      const isLeading = row.current_leader_id === userId;

      if (isCurrentlyActive) {
        activeBidsCount++;
      }

      let displayStatus = 'Outbid';
      if (isCurrentlyActive) {
        displayStatus = isLeading ? 'Leading' : 'Outbid';
      } else {
        displayStatus = isLeading ? 'Won' : 'Outbid';
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
        closedAt: isTimeEnded ? `Closed on ${formatDate(row.ends_at)}` : null,
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
      // Won awaiting pickup/handover vs genuinely completed
      const isHandoverCompleted = row.outcome === 'sold';
      if (!isHandoverCompleted) {
        auctionsWonCount++;
      }

      const displayStatus = isHandoverCompleted ? 'Completed' : 'Reserved';
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

    // Format Completed Sales
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

