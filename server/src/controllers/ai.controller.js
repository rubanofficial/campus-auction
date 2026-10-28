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

    // 2. Extract structured criteria using Google Gemini (with resilient fallback parser)
    const criteria = await extractSearchCriteriaWithGemini(trimmedMessage);

    // 3. Build parameterized SQL query against Neon PostgreSQL
    // Strictly exclude draft, cancelled, not yet started, or already closed auctions
    const whereClauses = [
      "a.status = 'active'",
      'a.outcome IS NULL',
      'a.starts_at <= CURRENT_TIMESTAMP',
      'a.ends_at > CURRENT_TIMESTAMP',
    ];
    const params = [];

    // Filter by Budget constraint (Maximum Price)
    // Rule: Apply budget to the current bid price (or starting price if no bids exist)
    if (criteria.maxPrice !== null && criteria.maxPrice !== undefined) {
      params.push(criteria.maxPrice);
      whereClauses.push(
        `(CASE WHEN a.bid_count > 0 THEN a.current_price ELSE a.starting_price END) <= $${params.length}`
      );
    }

    // Filter by Minimum Price
    if (criteria.minPrice !== null && criteria.minPrice !== undefined) {
      params.push(criteria.minPrice);
      whereClauses.push(
        `(CASE WHEN a.bid_count > 0 THEN a.current_price ELSE a.starting_price END) >= $${params.length}`
      );
    }

    // Filter by Condition
    if (criteria.condition) {
      params.push(criteria.condition);
      whereClauses.push(`a.condition = $${params.length}`);
    }

    // Filter by Keyword and/or Category
    if (criteria.keyword) {
      const kw = criteria.keyword;
      params.push(`%${kw}%`);
      const kwIndex = params.length;

      // If category is a specific product category (not generic 'other'), match either category or keyword in title/desc
      if (criteria.category && criteria.category !== 'other') {
        params.push(criteria.category);
        const catIndex = params.length;
        whereClauses.push(
          `(a.category = $${catIndex} OR a.title ILIKE $${kwIndex} OR a.description ILIKE $${kwIndex})`
        );
      } else {
        whereClauses.push(
          `(a.title ILIKE $${kwIndex} OR a.description ILIKE $${kwIndex})`
        );
      }
    } else if (criteria.category) {
      params.push(criteria.category);
      whereClauses.push(`a.category = $${params.length}`);
    }

    // Determine safe ORDER BY clause from allowlist
    let orderClause = 'ORDER BY a.created_at DESC';
    if (criteria.sortBy === 'price_asc') {
      orderClause =
        'ORDER BY (CASE WHEN a.bid_count > 0 THEN a.current_price ELSE a.starting_price END) ASC, a.ends_at ASC';
    } else if (criteria.sortBy === 'price_desc') {
      orderClause =
        'ORDER BY (CASE WHEN a.bid_count > 0 THEN a.current_price ELSE a.starting_price END) DESC, a.ends_at ASC';
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
        (CASE WHEN a.bid_count > 0 THEN a.current_price ELSE a.starting_price END) AS effective_price,
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
      LIMIT 12;
    `;

    const result = await query(selectQuery, params);

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
        startingPrice: Number(row.starting_price),
        currentPrice: Number(row.current_price),
        effectivePrice: Number(row.effective_price),
        minBidIncrement: Number(row.min_bid_increment),
        bidCount: Number(row.bid_count),
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
      const keywordLabel = criteria.keyword ? `"${criteria.keyword}" ` : '';
      const categoryLabel = criteria.category && criteria.category !== 'other' ? `${criteria.category} ` : '';
      const targetLabel = keywordLabel || categoryLabel;
      const budgetNote = criteria.maxPrice ? ` within ₹${criteria.maxPrice.toLocaleString('en-IN')}` : '';
      const sortNote =
        criteria.sortBy === 'price_asc'
          ? ' sorted from lowest price'
          : criteria.closingSoon
          ? ' closing soonest'
          : '';
      summary = `Found ${count} active campus ${targetLabel}listing${count === 1 ? '' : 's'}${budgetNote}${sortNote}. Current bids and starting prices are shown below.`;
    } else {
      const criteriaList = [];
      if (criteria.keyword) criteriaList.push(`keyword "${criteria.keyword}"`);
      else if (criteria.category) criteriaList.push(`category "${criteria.category}"`);
      if (criteria.maxPrice) criteriaList.push(`under ₹${criteria.maxPrice.toLocaleString('en-IN')}`);

      const filterDesc = criteriaList.length > 0 ? ` matching ${criteriaList.join(', ')}` : '';
      summary = `No active campus auction listings found${filterDesc}. Check back soon or try adjusting your budget.`;
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
