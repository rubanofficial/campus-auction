import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure server/.env is loaded reliably
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const GEMINI_API_KEY = (process.env.GEMINI_API_KEY || process.env['GEMINI_API_KEY '])?.trim();

const ALLOWED_CATEGORIES = ['cycle', 'calculator', 'books', 'electronics', 'other'];
const ALLOWED_CONDITIONS = ['like_new', 'good', 'fair'];
const ALLOWED_SORT = ['price_asc', 'price_desc', 'closing_soon', 'newest'];

const GENERIC_PRODUCT_WORDS = new Set([
  'item',
  'items',
  'product',
  'products',
  'available',
  'available items',
  'available products',
  'listing',
  'listings',
  'thing',
  'things',
  'stuff',
]);

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

  // 1. Keyword cleaning and extraction
  if (typeof raw.keyword === 'string' && raw.keyword.trim().length > 0) {
    let trimmed = raw.keyword
      .trim()
      .toLowerCase()
      // Remove carrier / request phrases if model included them
      .replace(/\b(?:i need|i want|give me|find me|find|show me|show|search for|search|get me|looking for|look for|which|please|can you find|can you give me|bring me)\b/gi, '')
      // Remove pricing remnants
      .replace(/\b(?:under|below|less than|within|above|over|more than|for|at|around|budget)\s*(?:₹|rs\.?|inr)?\s*\d+\b/gi, '')
      // Remove leading/trailing prepositions & articles
      .replace(/^(?:a|an|the|for|in|with|of|to|under|at)\s+/gi, '')
      .replace(/\s+(?:for|in|with|of|to|under|at)$/gi, '')
      .replace(/[^a-z0-9\s-]/gi, ' ')
      .trim();

    // Check if what remains is a generic word like "items" or "products"
    if (trimmed.length >= 2 && trimmed.length <= 80 && !GENERIC_PRODUCT_WORDS.has(trimmed)) {
      // Normalize common plurals to base noun
      if (trimmed === 'bicycles' || trimmed === 'cycles' || trimmed === 'bikes') trimmed = 'bicycle';
      else if (trimmed === 'calculators') trimmed = 'calculator';
      else if (trimmed === 'textbooks') trimmed = 'textbook';
      else if (trimmed === 'books') trimmed = 'book';
      else if (trimmed === 'watches') trimmed = 'watch';
      normalized.keyword = trimmed;
    }
  }

  // 2. Category normalization
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
 * Fallback heuristic query parser if Gemini API is unreachable or rate-limited.
 * Correctly extracts product keywords without carrier phrases.
 */
export const fallbackExtractCriteria = (message) => {
  const lower = message.toLowerCase().trim();
  const raw = {
    keyword: null,
    category: null,
    condition: null,
    minPrice: null,
    maxPrice: null,
    closingSoon: false,
    sortBy: 'newest',
  };

  // 1. Check closing soon
  if (/\b(?:closing soon|ending soon|closing|ends soon)\b/i.test(lower)) {
    raw.closingSoon = true;
    raw.sortBy = 'closing_soon';
  }

  // 2. Check cheapest / lowest price
  if (/\b(?:cheapest|lowest price|most affordable|cheap)\b/i.test(lower)) {
    raw.sortBy = 'price_asc';
  }

  // 3. Check condition
  if (/\b(?:like new|brand new|mint condition)\b/i.test(lower)) {
    raw.condition = 'like_new';
  } else if (/\b(?:good condition|in good condition|good)\b/i.test(lower)) {
    raw.condition = 'good';
  } else if (/\b(?:fair condition|fair)\b/i.test(lower)) {
    raw.condition = 'fair';
  }

  // 4. Check price constraints
  // Max price (under / below / less than / within / max / <= X)
  const underMatch = lower.match(/\b(?:under|below|less than|within|max(?:imum)?|<=?|at most|budget(?:\s*of)?)\s*(?:₹|rs\.?|inr)?\s*(\d+)/i);
  if (underMatch) {
    raw.maxPrice = parseInt(underMatch[1], 10);
  }

  // Min price (above / over / more than / min / >= X)
  const aboveMatch = lower.match(/\b(?:above|over|more than|minimum|min|>=?|at least)\s*(?:₹|rs\.?|inr)?\s*(\d+)/i);
  if (aboveMatch) {
    raw.minPrice = parseInt(aboveMatch[1], 10);
  }

  // Fallback price: "for 7000" or "at 7000" if no other price matched
  if (!raw.maxPrice && !raw.minPrice) {
    const forMatch = lower.match(/\b(?:for|around)\s*(?:₹|rs\.?|inr)?\s*(\d+)/i);
    if (forMatch) {
      raw.maxPrice = parseInt(forMatch[1], 10);
    }
  }

  // 5. Check Category
  if (/\b(?:calculators?|calc|casio)\b/i.test(lower)) {
    raw.category = 'calculator';
  } else if (/\b(?:bicycles?|cycles?|bikes?)\b/i.test(lower)) {
    raw.category = 'cycle';
  } else if (/\b(?:textbooks?|books?|notes?|novels?)\b/i.test(lower)) {
    raw.category = 'books';
  } else if (/\b(?:electronics?|laptops?|headphones?|earphones?|chargers?|gadgets?)\b/i.test(lower)) {
    raw.category = 'electronics';
  }

  // 6. Clean and extract keyword
  let clean = lower
    // Remove carrier / request phrases
    .replace(/\b(?:i need|i want|give me|find me|find|show me|show|search for|search|get me|looking for|look for|which|please|can you find|can you give me|bring me)\b/gi, '')
    // Remove price expressions
    .replace(/\b(?:under|below|less than|within|above|over|more than|for|at|around|budget)\s*(?:₹|rs\.?|inr)?\s*\d+\b/gi, '')
    // Remove condition phrases
    .replace(/\b(?:in good condition|good condition|like new|brand new|fair condition|condition)\b/gi, '')
    // Remove timing & sort phrases
    .replace(/\b(?:closing soon|ending soon|closing|soon|cheapest|cheap|lowest price|affordable|best price)\b/gi, '')
    // Remove generic fill words
    .replace(/\b(?:a|an|the|some|any|available|items?|products?|listings?|things?|stuff)\b/gi, '')
    .replace(/[^a-z0-9\s]/gi, ' ')
    .trim();

  // Strip leading/trailing prepositions if any remain
  clean = clean.replace(/^(?:for|in|with|of|to|under|at)\s+/i, '').replace(/\s+(?:for|in|with|of|to|under|at)$/i, '').trim();

  if (clean.length > 0 && !GENERIC_PRODUCT_WORDS.has(clean)) {
    raw.keyword = clean;
  }

  return normalizeCriteria(raw);
};

/**
 * Call Google Gemini to parse natural-language search request into structured criteria.
 * Falls back gracefully to heuristic query parser on API disruption.
 *
 * @param {string} userMessage - Natural-language search string from user
 * @returns {Promise<Object>} Normalized search criteria
 */
export const extractSearchCriteriaWithGemini = async (userMessage) => {
  if (!GEMINI_API_KEY) {
    console.warn('[AI Service] GEMINI_API_KEY is not defined. Using regex fallback parser.');
    return fallbackExtractCriteria(userMessage);
  }

  const systemInstruction = `You are a product search parser for Campus Auction, a student marketplace.
Extract structured search criteria from the user's natural language request.
Output ONLY valid JSON matching this schema:
{
  "keyword": "concise product keyword or null (e.g. 'watch', 'calculator', 'bicycle', 'textbook')",
  "category": "one of: 'cycle', 'calculator', 'books', 'electronics', 'other' or null",
  "condition": "one of: 'like_new', 'good', 'fair' or null",
  "minPrice": integer number in rupees or null,
  "maxPrice": integer number in rupees or null,
  "closingSoon": boolean,
  "sortBy": "one of: 'price_asc', 'price_desc', 'closing_soon', 'newest' or null"
}
Strict Rules:
- For 'i need a watch for under 7000', keyword MUST be 'watch' (NEVER 'i need a watch for'), maxPrice is 7000.
- For 'give me a calculator under 1500', keyword is 'calculator', category is 'calculator', maxPrice is 1500.
- For 'find bicycles closing soon', keyword is 'bicycle', category is 'cycle', closingSoon is true, sortBy is 'closing_soon'.
- For 'show textbooks below 500', keyword is 'textbook', category is 'books', maxPrice is 500.
- For 'find the cheapest available items', keyword is null, category is null, sortBy is 'price_asc'.
- NEVER include carrier phrases ('i need', 'give me', 'find', 'show', 'for', 'a', 'an') inside keyword.
- If user searches for generic items/products without a specific product, keyword MUST be null.
Do NOT include explanations. Respond strictly with the JSON object.`;

  // Tested working models in order of latency and availability
  const models = ['gemini-flash-lite-latest', 'gemini-flash-latest', 'gemini-2.5-flash'];

  for (const model of models) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

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

  // Graceful fallback to heuristic query parser if models failed or timed out
  console.warn('[AI Service] Falling back to heuristic query parser.');
  return fallbackExtractCriteria(userMessage);
};
