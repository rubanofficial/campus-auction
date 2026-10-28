import { query } from '../config/database.js';
import { extractSearchCriteriaWithGemini } from '../services/ai.service.js';

/**
 * Handle AI Natural-Language Product Search
 * POST /api/ai/search
 * Request body: { "message": "Give me a calculator under 400" }
 */
export const searchAuctionsWithAi = async (req, res) => {
  try {
    const { message } = req.body;

    // 1. Validate user input
    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'A search message string is required.',
      });
    }

    const trimmedMessage = message.trim();

    if (trimmedMessage.length === 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Search query cannot be empty.',
      });
    }

    if (trimmedMessage.length > 300) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Search query is too long. Please limit your request to 300 characters.',
      });
    }

    // 2. Extract structured criteria using Google Gemini (with fallback)
    const criteria = await extractSearchCriteriaWithGemini(trimmedMessage);

    // 3. Build parameterized SQL query against Neon PostgreSQL
    // Exclude draft, cancelled, not yet started, or already closed auctions
    const whereClauses = [
      "a.status = 'active'",
      'a.outcome IS NULL',
      'a.starts_at <= CURRENT_TIMESTAMP',
      'a.ends_at > CURRENT_TIMESTAMP',
    ];
    const params = [];

    // Filter by Category
    if (criteria.category) {
      params.push(criteria.category);
      whereClauses.push(`a.category = $${params.length}`);
    }

    // Filter by Condition
    if (criteria.condition) {
      params.push(criteria.condition);
      whereClauses.push(`a.condition = $${params.length}`);
    }

    // Filter by Budget constraint (Maximum Price)
    // For auctions, current_price is the authoritative live leading bid
    if (criteria.maxPrice !== null && criteria.maxPrice !== undefined) {
      params.push(criteria.maxPrice);
      whereClauses.push(`a.current_price <= $${params.length}`);
    }

    // Filter by Minimum Price
    if (criteria.minPrice !== null && criteria.minPrice !== undefined) {
      params.push(criteria.minPrice);
      whereClauses.push(`a.current_price >= $${params.length}`);
    }

    // Match keywords against title or description using case-insensitive ILIKE
    if (criteria.keyword) {
      params.push(`%${criteria.keyword}%`);
      whereClauses.push(`(a.title ILIKE $${params.length} OR a.description ILIKE $${params.length})`);
    }

    // Determine safe ORDER BY clause from allowlist
    let orderClause = 'ORDER BY a.created_at DESC';
    if (criteria.sortBy === 'price_asc') {
      orderClause = 'ORDER BY a.current_price ASC, a.ends_at ASC';
    } else if (criteria.sortBy === 'price_desc') {
      orderClause = 'ORDER BY a.current_price DESC, a.ends_at ASC';
    } else if (criteria.sortBy === 'closing_soon' || criteria.closingSoon) {
      orderClause = 'ORDER BY a.ends_at ASC';
    }

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
        a.bid_count,
        a.starts_at,
        a.ends_at,
        a.status,
        a.created_at
      FROM auctions a
      JOIN users u ON a.seller_id = u.id
      WHERE ${whereClauses.join(' AND ')}
      ${orderClause}
      LIMIT 10;
    `;

    let result = await query(selectQuery, params);

    // If no results matched with a specific keyword filter, try searching without the keyword
    // if category and price were specified (e.g. user said "Give me a calculator under 400", but title was "Casio FX991")
    if (result.rows.length === 0 && criteria.keyword && (criteria.category || criteria.maxPrice)) {
      const relaxedWhere = [
        "a.status = 'active'",
        'a.outcome IS NULL',
        'a.starts_at <= CURRENT_TIMESTAMP',
        'a.ends_at > CURRENT_TIMESTAMP',
      ];
      const relaxedParams = [];

      if (criteria.category) {
        relaxedParams.push(criteria.category);
        relaxedWhere.push(`a.category = $${relaxedParams.length}`);
      }
      if (criteria.condition) {
        relaxedParams.push(criteria.condition);
        relaxedWhere.push(`a.condition = $${relaxedParams.length}`);
      }
      if (criteria.maxPrice !== null && criteria.maxPrice !== undefined) {
        relaxedParams.push(criteria.maxPrice);
        relaxedWhere.push(`a.current_price <= $${relaxedParams.length}`);
      }
      if (criteria.minPrice !== null && criteria.minPrice !== undefined) {
        relaxedParams.push(criteria.minPrice);
        relaxedWhere.push(`a.current_price >= $${relaxedParams.length}`);
      }

      const relaxedSql = `
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
          a.bid_count,
          a.starts_at,
          a.ends_at,
          a.status,
          a.created_at
        FROM auctions a
        JOIN users u ON a.seller_id = u.id
        WHERE ${relaxedWhere.join(' AND ')}
        ${orderClause}
        LIMIT 10;
      `;
      const relaxedResult = await query(relaxedSql, relaxedParams);
      if (relaxedResult.rows.length > 0) {
        result = relaxedResult;
      }
    }

    // 4. Format listings for frontend
    const listings = result.rows.map((row) => {
      let resolvedImages = [];
      try {
        resolvedImages = typeof row.images === 'string' ? JSON.parse(row.images) : (row.images || []);
      } catch {
        resolvedImages = [];
      }

      return {
        id: row.id,
        sellerId: row.seller_id,
        sellerName: row.seller_name || 'Verified Student',
        title: row.title,
        category: row.category,
        description: row.description,
        condition: row.condition,
        coverImage: Array.isArray(resolvedImages) && resolvedImages.length > 0 ? resolvedImages[0] : null,
        images: resolvedImages,
        startingPrice: row.starting_price,
        currentPrice: row.current_price,
        minBidIncrement: row.min_bid_increment,
        bidCount: row.bid_count,
        startsAt: row.starts_at,
        endsAt: row.ends_at,
        status: row.status,
        createdAt: row.created_at,
      };
    });

    // 5. Generate concise, natural summary
    let summary = '';
    const count = listings.length;

    if (count > 0) {
      const categoryLabel = criteria.category ? `${criteria.category} ` : '';
      const budgetNote = criteria.maxPrice ? ` within ₹${criteria.maxPrice.toLocaleString('en-IN')}` : '';
      const sortNote = criteria.sortBy === 'price_asc' ? ' starting with the lowest bid' : criteria.closingSoon ? ' closing soonest' : '';
      summary = `Found ${count} active campus ${categoryLabel}listing${count === 1 ? '' : 's'}${budgetNote}${sortNote}. Current bids are shown below.`;
    } else {
      const criteriaList = [];
      if (criteria.category) criteriaList.push(`category "${criteria.category}"`);
      if (criteria.maxPrice) criteriaList.push(`under ₹${criteria.maxPrice}`);
      if (criteria.keyword) criteriaList.push(`matching "${criteria.keyword}"`);

      const filterDesc = criteriaList.length > 0 ? ` for ${criteriaList.join(', ')}` : '';
      summary = `No active campus auction listings found${filterDesc}. Check back soon or try searching with a higher budget or different keywords.`;
    }

    return res.status(200).json({
      summary,
      query: trimmedMessage,
      criteria,
      results: listings,
      total: count,
    });
  } catch (error) {
    console.error(`[AI Controller] Natural language search error: ${error.message}`);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to process AI product search. Please try again.',
    });
  }
};

