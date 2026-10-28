import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { searchAuctionsWithAi } from '../controllers/ai.controller.js';

const router = Router();

// Require student authentication to access AI assistant features
router.use(requireAuth);

// POST /api/ai/search — Natural language product search
router.post('/search', searchAuctionsWithAi);

export default router;

