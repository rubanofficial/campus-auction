import { Router } from 'express';
import { registerStudent } from '../controllers/auth.controller.js';

const router = Router();

/**
 * POST /api/auth/register
 * Register a new student account
 */
router.post('/register', registerStudent);

export default router;
