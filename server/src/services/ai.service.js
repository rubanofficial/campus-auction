import dotenv from 'dotenv';
dotenv.config();

const GEMINI_API_KEY = (process.env.GEMINI_API_KEY || process.env['GEMINI_API_KEY '])?.trim();

const ALLOWED_CATEGORIES = ['cycle', 'calculator', 'books', 'electronics', 'other'];
const ALLOWED_CONDITIONS = ['like_new', 'good', 'fair'];
const ALLOWED_SORT = ['price_asc', 'price_desc', 'closing_soon', 'newest'];

/**
 * Normalizes and validates the raw criteria object from Gemini or fallback parser
 */
export const normalizeCriteria = (raw = {}) => {
  const normalized = {
    keyword: null,
    category: null,
    condition: null,
    minPrice: null,
    maxPrice: null,
    closingSoon: false,
    sortBy: 'newest',
  };

  // 1. Keyword
  if (typeof raw.keyword === 'string' && raw.keyword.trim().length > 0) {
    let trimmed = raw.keyword
      .trim()
      .replace(/^(?:a|an|the|show|find|give me|get me|search for|list)\s+/i, '')
      .trim();
    if (trimmed.length > 0 && trimmed.length <= 80) {
      normalized.keyword = trimmed;
    }
  }

  // 2. Category
  if (typeof raw.category === 'string') {
    const cat = raw.category.toLowerCase().trim();
    if (ALLOWED_CATEGORIES.includes(cat)) {
      normalized.category = cat;
    } else if (cat.includes('cycle') || cat.includes('bike')) {
      normalized.category = 'cycle';
    } else if (cat.includes('calc')) {
      normalized.category = 'calculator';
    } else if (cat.includes('book') || cat.includes('text')) {
      normalized.category = 'books';
    } else if (cat.includes('elect') || cat.includes('tech') || cat.includes('laptop') || cat.includes('headphone')) {
      normalized.category = 'electronics';
    }
  }

  // If keyword simply duplicates category name, clear keyword to allow category search
  if (normalized.keyword && normalized.category) {
    const kw = normalized.keyword.toLowerCase();
    if (
      kw === normalized.category ||
      kw === normalized.category + 's' ||
      kw === 'bicycle' ||
      kw === 'bicycles' ||
      kw === 'textbook' ||
      kw === 'textbooks' ||
      kw === 'electronic' ||
      kw === 'electronics'
    ) {
      normalized.keyword = null;
    }
  }

  // 3. Condition
  if (typeof raw.condition === 'string') {
    const cond = raw.condition.toLowerCase().replace(/\s+/g, '_').trim();
    if (ALLOWED_CONDITIONS.includes(cond)) {
      normalized.condition = cond;
    }
  }

  // 4. Min Price
  if (raw.minPrice !== null && raw.minPrice !== undefined) {
    const parsedMin = parseInt(raw.minPrice, 10);
    if (!isNaN(parsedMin) && parsedMin >= 0 && parsedMin < 1000000) {
      normalized.minPrice = parsedMin;
    }
  }

  // 5. Max Price
  if (raw.maxPrice !== null && raw.maxPrice !== undefined) {
    const parsedMax = parseInt(raw.maxPrice, 10);
    if (!isNaN(parsedMax) && parsedMax > 0 && parsedMax < 10000000) {
      normalized.maxPrice = parsedMax;
    }
  }

  // Ensure minPrice <= maxPrice if both exist
  if (normalized.minPrice !== null && normalized.maxPrice !== null && normalized.minPrice > normalized.maxPrice) {
    const temp = normalized.minPrice;
    normalized.minPrice = normalized.maxPrice;
    normalized.maxPrice = temp;
  }

  // 6. Closing Soon
  if (raw.closingSoon === true || raw.closingSoon === 'true') {
    normalized.closingSoon = true;
    normalized.sortBy = 'closing_soon';
  }

  // 7. Sort By
  if (typeof raw.sortBy === 'string') {
    const sort = raw.sortBy.toLowerCase().trim();
    if (ALLOWED_SORT.includes(sort)) {
      normalized.sortBy = sort;
    }
  }

  // If user searched for cheapest / lowest price, default to price_asc
  if (raw.cheapest === true || raw.sortBy === 'price_asc') {
    normalized.sortBy = 'price_asc';
  }

  return normalized;
};

/**
 * Fallback heuristic parser if Gemini API is unreachable or responds with invalid data
 */
export const fallbackExtractCriteria = (message) => {
  const lower = message.toLowerCase();
  const criteria = {};

  // Check category
  if (lower.includes('calc')) criteria.category = 'calculator';
  else if (lower.includes('cycle') || lower.includes('bike') || lower.includes('bicycle')) criteria.category = 'cycle';
  else if (lower.includes('book') || lower.includes('textbook') || lower.includes('notes')) criteria.category = 'books';
  else if (lower.includes('laptop') || lower.includes('headphone') || lower.includes('electronic') || lower.includes('gadget')) criteria.category = 'electronics';

  // Check price (under / below / less than / <= X)
  const underMatch = lower.match(/(?:under|below|less than|within|max|<=?)\s*(?:₹|rs\.?|inr)?\s*(\d+)/i);
  if (underMatch) {
    criteria.maxPrice = parseInt(underMatch[1], 10);
  }

  // Check price (above / more than / >= X)
  const aboveMatch = lower.match(/(?:above|over|more than|minimum|min|>=?)\s*(?:₹|rs\.?|inr)?\s*(\d+)/i);
  if (aboveMatch) {
    criteria.minPrice = parseInt(aboveMatch[1], 10);
  }

  // Check condition
  if (lower.includes('like new') || lower.includes('brand new')) criteria.condition = 'like_new';
  else if (lower.includes('good condition') || lower.includes('good')) criteria.condition = 'good';
  else if (lower.includes('fair')) criteria.condition = 'fair';

  // Check closing soon
  if (lower.includes('closing soon') || lower.includes('ending soon') || lower.includes('soon')) {
    criteria.closingSoon = true;
    criteria.sortBy = 'closing_soon';
  }

  // Check cheapest
  if (lower.includes('cheapest') || lower.includes('lowest price') || lower.includes('affordable')) {
    criteria.sortBy = 'price_asc';
  }

  // Clean keyword: remove common stop phrases
  let cleanKw = lower
    .replace(/(?:give me|find|show me|search for|get me|looking for|which|i want|please)\s+/gi, '')
    .replace(/(?:under|below|less than|above|over)\s*(?:₹|rs\.?|inr)?\s*\d+/gi, '')
    .replace(/(?:in good condition|like new|fair condition|closing soon|cheapest)/gi, '')
    .replace(/[^a-z0-9\s]/gi, ' ')
    .trim();

  if (cleanKw.length >= 3 && cleanKw.length <= 40) {
    criteria.keyword = cleanKw;
  }

  return normalizeCriteria(criteria);
};

/**
 * Call Google Gemini to parse natural-language search request into structured criteria
 * @param {string} userMessage - Natural-language search string from user
 * @returns {Promise<Object>} Normalized search criteria
 */
export const extractSearchCriteriaWithGemini = async (userMessage) => {
  if (!GEMINI_API_KEY) {
    console.warn('[AI Service] GEMINI_API_KEY is not defined. Using regex fallback parser.');
    return fallbackExtractCriteria(userMessage);
  }

  const systemInstruction = `
You are a product search parser for Campus Auction, a student marketplace.
Extract structured search criteria from the user's natural language request.
Output ONLY valid JSON matching this schema:
{
  "keyword": "concise product keyword or null (e.g. 'calculator', 'Hero Sprint', 'chemistry textbook')",
  "category": "one of: 'cycle', 'calculator', 'books', 'electronics', 'other' or null",
  "condition": "one of: 'like_new', 'good', 'fair' or null",
  "minPrice": "integer number in rupees or null",
  "maxPrice": "integer number in rupees or null (e.g. for 'under 400', maxPrice is 400)",
  "closingSoon": "boolean true if user asked for auctions closing soon / ending soon, else false",
  "sortBy": "one of: 'price_asc', 'price_desc', 'closing_soon', 'newest' or null"
}
Examples:
- "Give me a calculator under 400" -> {"keyword": "calculator", "category": "calculator", "condition": null, "minPrice": null, "maxPrice": 400, "closingSoon": false, "sortBy": "price_asc"}
- "Find textbooks below ₹300" -> {"keyword": "textbook", "category": "books", "condition": null, "minPrice": null, "maxPrice": 300, "closingSoon": false, "sortBy": "price_asc"}
- "Show electronics in good condition under ₹2000" -> {"keyword": null, "category": "electronics", "condition": "good", "minPrice": null, "maxPrice": 2000, "closingSoon": false, "sortBy": "newest"}
- "Which bicycles are closing soon?" -> {"keyword": "bicycle", "category": "cycle", "condition": null, "minPrice": null, "maxPrice": null, "closingSoon": true, "sortBy": "closing_soon"}
- "Find the cheapest available calculator" -> {"keyword": "calculator", "category": "calculator", "condition": null, "minPrice": null, "maxPrice": null, "closingSoon": false, "sortBy": "price_asc"}
Do NOT include explanations. Respond strictly with the JSON object.
`;

  const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];

  for (const model of models) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000); // 7s timeout

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `${systemInstruction}\nUser prompt: "${userMessage.slice(0, 300)}"`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 256,
            responseMimeType: 'application/json',
          },
        }),
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(`[AI Service] Model ${model} returned HTTP ${response.status}`);
        continue;
      }

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (rawText) {
        const parsed = JSON.parse(rawText);
        return normalizeCriteria(parsed);
      }
    } catch (err) {
      console.warn(`[AI Service] Model ${model} attempt failed: ${err.message}`);
    }
  }

  // Graceful fallback to regex parsing if AI models timed out or failed
  console.warn('[AI Service] Falling back to heuristic query parser.');
  return fallbackExtractCriteria(userMessage);
};
