import { Router } from 'express';
import {
  registerStudent,
  loginStudent,
  getCurrentUser,
  logoutUser,
  getProtectedTest,
} from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * Public authentication endpoints
 */
router.post('/register', registerStudent);
router.post('/login', loginStudent);
router.get('/me', getCurrentUser);
router.post('/logout', logoutUser);

/**
 * Protected test endpoint (verifies session authentication middleware)
 */
router.get('/protected-test', requireAuth, getProtectedTest);

export default router;
