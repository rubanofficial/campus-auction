import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../controllers/notification.controller.js';

const router = Router();

// Require authentication for all notification routes
router.use(requireAuth);

// GET /api/notifications — Retrieve notifications for current authenticated user
router.get('/', getUserNotifications);

// PATCH /api/notifications/read-all — Mark all notifications as read for current user
// (Defined before /:id/read to prevent route shadowing)
router.patch('/read-all', markAllNotificationsAsRead);

// PATCH /api/notifications/:id/read — Mark a specific notification as read
router.patch('/:id/read', markNotificationAsRead);

export default router;

