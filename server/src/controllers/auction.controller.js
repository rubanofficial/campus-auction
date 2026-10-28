import { query } from '../config/database.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const CATEGORY_MAP = {
  cycle: 'cycle',
  cycles: 'cycle',
  calculator: 'calculator',
  calculators: 'calculator',
  books: 'books',
  book: 'books',
  electronics: 'electronics',
  electronic: 'electronics',
  other: 'other',
};

const VALID_CONDITIONS = ['like_new', 'good', 'fair'];

/**
 * Format database auction row to API response object
 */
const formatAuction = (row, sellerName = null, leaderName = null) => {
  return {
    id: row.id,
    sellerId: row.seller_id,
    sellerName: sellerName || row.seller_name || null,
    title: row.title,
    category: row.category,
    description: row.description,
    condition: row.condition,
    images: Array.isArray(row.images) ? row.images : [],
    startingPrice: row.starting_price,
    minBidIncrement: row.min_bid_increment,
    currentPrice: row.current_price,
    currentLeaderId: row.current_leader_id,
    currentLeaderName: leaderName || row.current_leader_name || null,
    bidCount: row.bid_count,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    status: row.status,
    outcome: row.outcome,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    // Provide snake_case fields as well for consistency
    seller_id: row.seller_id,
    starting_price: row.starting_price,
    min_bid_increment: row.min_bid_increment,
    current_price: row.current_price,
    current_leader_id: row.current_leader_id,
    bid_count: row.bid_count,
    starts_at: row.starts_at,
    ends_at: row.ends_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
};

/**
 * Create a new auction listing
 * POST /api/auctions
 * Requires authentication
 */
export const createAuction = async (req, res) => {
  try {
    // 1. Enforce server-side seller identification from authenticated session
    const sellerId = req.user?.id;
    if (!sellerId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required. Please sign in.',
      });
    }

    const {
      title,
      category,
      description,
      condition,
      images,
      startingPrice,
      starting_price,
      minBidIncrement,
      min_bid_increment,
      minIncrement,
      startsAt,
      starts_at,
      endsAt,
      ends_at,
      closingDate,
      closingTime,
    } = req.body;

    // 2. Validate Title
    if (!title || typeof title !== 'string') {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Title is required.',
      });
    }
    const trimmedTitle = title.trim();
    if (trimmedTitle.length < 3 || trimmedTitle.length > 120) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Title must be between 3 and 120 characters long.',
      });
    }

    // 3. Validate Category
    if (!category || typeof category !== 'string') {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Category is required.',
      });
    }
    const resolvedCategory = CATEGORY_MAP[category.trim().toLowerCase()];
    if (!resolvedCategory) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Category must be one of: cycle, calculator, books, electronics, other.',
      });
    }

    // 4. Validate Description
    if (!description || typeof description !== 'string') {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Description is required.',
      });
    }
    const trimmedDescription = description.trim();
    if (trimmedDescription.length < 5) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Description must be at least 5 characters long.',
      });
    }

    // 5. Validate Condition
    if (!condition || typeof condition !== 'string') {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Condition is required.',
      });
    }
    const normalizedCondition = condition.trim().toLowerCase().replace(/[\s-]+/g, '_');
    if (!VALID_CONDITIONS.includes(normalizedCondition)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Condition must be one of: like_new, good, fair.',
      });
    }

    // 6. Validate Images Array
    let resolvedImages = [];
    if (images !== undefined && images !== null) {
      if (!Array.isArray(images)) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Images must be an array of image URL strings.',
        });
      }
      if (!images.every((img) => typeof img === 'string')) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'All image entries must be valid strings.',
        });
      }
      resolvedImages = images;
    }

    // 7. Validate Starting Price (positive integer in whole rupees)
    const rawStartingPrice = startingPrice !== undefined ? startingPrice : starting_price;
    const parsedStartingPrice = Number(rawStartingPrice);
    if (
      rawStartingPrice === undefined ||
      rawStartingPrice === null ||
      !Number.isInteger(parsedStartingPrice) ||
      parsedStartingPrice <= 0
    ) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Starting price must be a positive integer in whole rupees.',
      });
    }

    // 8. Validate Minimum Bid Increment (positive integer in whole rupees)
    const rawMinIncrement =
      minBidIncrement !== undefined
        ? minBidIncrement
        : min_bid_increment !== undefined
        ? min_bid_increment
        : minIncrement;
    const parsedMinIncrement = rawMinIncrement !== undefined ? Number(rawMinIncrement) : 50;
    if (!Number.isInteger(parsedMinIncrement) || parsedMinIncrement <= 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Minimum bid increment must be a positive integer in whole rupees.',
      });
    }

    // 9. Validate Start Time (starts_at)
    const rawStartsAt = startsAt || starts_at;
    let parsedStartsAt = rawStartsAt ? new Date(rawStartsAt) : new Date();
    if (isNaN(parsedStartsAt.getTime())) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid starts_at timestamp format.',
      });
    }

    // 10. Validate End Time (ends_at)
    let rawEndsAt = endsAt || ends_at;
    if (!rawEndsAt && closingDate) {
      rawEndsAt = closingTime ? `${closingDate}T${closingTime}:00` : `${closingDate}T23:59:59`;
    }
    if (!rawEndsAt) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Closing time (ends_at) is required.',
      });
    }
    const parsedEndsAt = new Date(rawEndsAt);
    if (isNaN(parsedEndsAt.getTime())) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid ends_at timestamp format.',
      });
    }

    if (parsedEndsAt.getTime() <= parsedStartsAt.getTime()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Closing time (ends_at) must be later than the start time.',
      });
    }

    // 11. Execute parameterized SQL query to insert auction
    // Disallows client-supplied current_price, current_leader_id, bid_count, status, outcome
    const insertQuery = `
      INSERT INTO auctions (
        seller_id,
        title,
        category,
        description,
        condition,
        images,
        starting_price,
        min_bid_increment,
        current_price,
        current_leader_id,
        bid_count,
        starts_at,
        ends_at,
        status,
        outcome
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $7, NULL,
        0, $9, $10, 'active', NULL
      )
      RETURNING
        id,
        seller_id,
        title,
        category,
        description,
        condition,
        images,
        starting_price,
        min_bid_increment,
        current_price,
        current_leader_id,
        bid_count,
        starts_at,
        ends_at,
        status,
        outcome,
        created_at,
        updated_at;
    `;

    const values = [
      sellerId,
      trimmedTitle,
      resolvedCategory,
      trimmedDescription,
      normalizedCondition,
      JSON.stringify(resolvedImages),
      parsedStartingPrice,
      parsedMinIncrement,
      parsedStartsAt.toISOString(),
      parsedEndsAt.toISOString(),
    ];

    const result = await query(insertQuery, values);
    const createdAuction = result.rows[0];

    return res.status(201).json({
      message: 'Auction created successfully.',
      auction: formatAuction(createdAuction, req.user.displayName),
    });
  } catch (error) {
    console.error(`[Auction] Create auction error: ${error.message}`);

    // Handle check constraint failures from Postgres
    if (error.code === '23514') {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Submitted auction data violates database integrity rules.',
      });
    }

    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred while creating the auction. Please try again.',
    });
  }
};

/**
 * Retrieve details for one auction by ID
 * GET /api/auctions/:id
 */
export const getAuctionById = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Validate ID format (UUID)
    if (!id || !UUID_REGEX.test(id)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid auction ID format. Expected a valid UUID.',
      });
    }

    // 2. Query auction details with seller and leader display names
    const selectQuery = `
      SELECT
        a.id,
        a.seller_id,
        u.display_name AS seller_name,
        a.title,
        a.category,
        a.description,
        a.condition,
        a.images,
        a.starting_price,
        a.min_bid_increment,
        a.current_price,
        a.current_leader_id,
        l.display_name AS current_leader_name,
        a.bid_count,
        a.starts_at,
        a.ends_at,
        a.status,
        a.outcome,
        a.created_at,
        a.updated_at
      FROM auctions a
      JOIN users u ON a.seller_id = u.id
      LEFT JOIN users l ON a.current_leader_id = l.id
      WHERE a.id = $1;
    `;

    const result = await query(selectQuery, [id]);

    // 3. Return 404 if auction not found
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Auction not found.',
      });
    }

    const auctionRow = result.rows[0];

    // 4. Return safe auction details
    return res.status(200).json({
      auction: formatAuction(auctionRow),
    });
  } catch (error) {
    console.error(`[Auction] Get auction error: ${error.message}`);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve auction details. Please try again.',
    });
  }
};
