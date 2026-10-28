import { query } from '../config/database.js';
import { createNewAuctionNotifications } from './notification.controller.js';

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

    // Trigger persistent in-app notifications for all registered, active students (excluding seller)
    // Only generate notifications when listing is active and published
    if (createdAuction && createdAuction.status === 'active') {
      try {
        await createNewAuctionNotifications({
          auctionId: createdAuction.id,
          title: createdAuction.title,
          sellerId: createdAuction.seller_id,
          startingPrice: createdAuction.starting_price,
        });
      } catch (notificationError) {
        console.error(
          `[Notification] Failed to create notifications for auction ${createdAuction.id}:`,
          notificationError.message
        );
        // Do not fail auction creation if notification creation encounters an issue
      }
    }

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

const SORT_OPTIONS = {
  newest: 'a.created_at DESC, a.id DESC',
  closingsoon: 'a.ends_at ASC, a.id ASC',
  closing_soon: 'a.ends_at ASC, a.id ASC',
  pricelowtohigh: 'a.starting_price ASC, a.id ASC',
  price_asc: 'a.starting_price ASC, a.id ASC',
  pricehightolow: 'a.starting_price DESC, a.id DESC',
  price_desc: 'a.starting_price DESC, a.id DESC',
};

/**
 * Browse, search, and filter eligible active auctions
 * GET /api/auctions
 */
export const getAuctions = async (req, res) => {
  try {
    // 1. Pagination Validation
    let page = 1;
    if (req.query.page !== undefined && req.query.page !== '') {
      const parsedPage = Number(req.query.page);
      if (!Number.isInteger(parsedPage) || parsedPage < 1) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Page parameter must be a positive integer greater than or equal to 1.',
        });
      }
      page = parsedPage;
    }

    let limit = 12;
    if (req.query.limit !== undefined && req.query.limit !== '') {
      const parsedLimit = Number(req.query.limit);
      if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 50) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Limit parameter must be an integer between 1 and 50.',
        });
      }
      limit = parsedLimit;
    }

    // 2. Category Filter Validation
    let categoryFilter = null;
    if (req.query.category !== undefined && req.query.category !== '') {
      const rawCategory = String(req.query.category).trim().toLowerCase();
      if (rawCategory !== 'all') {
        categoryFilter = CATEGORY_MAP[rawCategory];
        if (!categoryFilter) {
          return res.status(400).json({
            error: 'Validation Error',
            message: 'Invalid category. Allowed values: cycle, calculator, books, electronics, other.',
          });
        }
      }
    }

    // 3. Condition Filter Validation
    let conditionFilter = null;
    if (req.query.condition !== undefined && req.query.condition !== '') {
      const rawCondition = String(req.query.condition).trim().toLowerCase().replace(/[\s-]+/g, '_');
      if (rawCondition !== 'all') {
        if (!VALID_CONDITIONS.includes(rawCondition)) {
          return res.status(400).json({
            error: 'Validation Error',
            message: 'Invalid condition. Allowed values: like_new, good, fair.',
          });
        }
        conditionFilter = rawCondition;
      }
    }

    // 4. Price Filter Validation (minPrice and maxPrice)
    let minPrice = null;
    const rawMinPrice = req.query.minPrice !== undefined ? req.query.minPrice : req.query.min_price;
    if (rawMinPrice !== undefined && rawMinPrice !== '') {
      const parsedMin = Number(rawMinPrice);
      if (isNaN(parsedMin) || parsedMin < 0) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'minPrice must be a non-negative number.',
        });
      }
      minPrice = Math.floor(parsedMin);
    }

    let maxPrice = null;
    const rawMaxPrice = req.query.maxPrice !== undefined ? req.query.maxPrice : req.query.max_price;
    if (rawMaxPrice !== undefined && rawMaxPrice !== '') {
      const parsedMax = Number(rawMaxPrice);
      if (isNaN(parsedMax) || parsedMax < 0) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'maxPrice must be a non-negative number.',
        });
      }
      maxPrice = Math.floor(parsedMax);
    }

    if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'minPrice cannot be greater than maxPrice.',
      });
    }

    // 5. Sort Allowlist Validation
    let sortClause = SORT_OPTIONS.newest; // Default ordering
    if (req.query.sort !== undefined && req.query.sort !== '') {
      const sortKey = String(req.query.sort).trim().toLowerCase();
      if (SORT_OPTIONS[sortKey]) {
        sortClause = SORT_OPTIONS[sortKey];
      } else {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid sort option. Supported options: newest, closingSoon, priceLowToHigh, priceHighToLow.',
        });
      }
    }

    // 6. Search Filter
    let searchPattern = null;
    if (req.query.search !== undefined && req.query.search !== '') {
      const trimmedSearch = String(req.query.search).trim();
      if (trimmedSearch.length > 0) {
        // Escape special ILIKE wildcard characters (%, _) to prevent wildcard injection
        const escapedSearch = trimmedSearch.replace(/[%_\\]/g, '\\$&');
        searchPattern = `%${escapedSearch}%`;
      }
    }

    // 7. Marketplace Eligibility & Dynamic Where Clauses
    // Only return auctions that are active, have already started, and have not yet ended
    const whereClauses = [
      `a.status = 'active'`,
      `a.starts_at <= CURRENT_TIMESTAMP`,
      `a.ends_at > CURRENT_TIMESTAMP`,
    ];
    const params = [];

    if (categoryFilter) {
      params.push(categoryFilter);
      whereClauses.push(`a.category = $${params.length}`);
    }

    if (conditionFilter) {
      params.push(conditionFilter);
      whereClauses.push(`a.condition = $${params.length}`);
    }

    if (minPrice !== null) {
      params.push(minPrice);
      whereClauses.push(`a.starting_price >= $${params.length}`);
    }

    if (maxPrice !== null) {
      params.push(maxPrice);
      whereClauses.push(`a.starting_price <= $${params.length}`);
    }

    if (searchPattern) {
      params.push(searchPattern);
      whereClauses.push(`(a.title ILIKE $${params.length} ESCAPE '\\' OR a.description ILIKE $${params.length} ESCAPE '\\')`);
    }

    const whereSql = whereClauses.join(' AND ');

    // 8. Count Query
    const countSql = `
      SELECT COUNT(*)::int AS total
      FROM auctions a
      WHERE ${whereSql};
    `;
    const countResult = await query(countSql, params);
    const totalResults = countResult.rows[0]?.total || 0;
    const totalPages = Math.ceil(totalResults / limit) || 1;

    // 9. Results Query
    const offset = (page - 1) * limit;
    const resultsParams = [...params, limit, offset];
    const limitIdx = resultsParams.length - 1;
    const offsetIdx = resultsParams.length;

    const selectSql = `
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
      WHERE ${whereSql}
      ORDER BY ${sortClause}
      LIMIT $${limitIdx} OFFSET $${offsetIdx};
    `;

    const results = await query(selectSql, resultsParams);
    const auctions = results.rows.map((row) => formatAuction(row));

    // 10. Return Response with Pagination Metadata
    return res.status(200).json({
      auctions,
      pagination: {
        page,
        limit,
        totalResults,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error(`[Auction] Browse auctions error: ${error.message}`);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve auctions. Please try again.',
    });
  }
};
