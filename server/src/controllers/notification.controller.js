import { query } from '../config/database.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Format a database notification row to a safe API response object
 */
export const formatNotification = (row) => ({
  id: row.id,
  userId: row.user_id,
  auctionId: row.auction_id,
  type: row.type,
  title: row.title,
  message: row.message,
  isRead: row.is_read,
  createdAt: row.created_at,
  // Snake_case aliases for convenience
  user_id: row.user_id,
  auction_id: row.auction_id,
  is_read: row.is_read,
  created_at: row.created_at,
});

/**
 * Bulk generate in-app notifications for all registered, active users (excluding seller)
 * when a new active auction is successfully published.
 * Uses a single atomic INSERT ... SELECT query with ON CONFLICT DO NOTHING.
 *
 * @param {Object} params
 * @param {string} params.auctionId - UUID of the newly published auction
 * @param {string} params.title - Title of the auction
 * @param {string} params.sellerId - UUID of the seller (excluded from recipients)
 * @param {number} [params.startingPrice] - Starting price of the auction
 */
export const createNewAuctionNotifications = async ({
  auctionId,
  title,
  sellerId,
  startingPrice,
}) => {
  if (!auctionId || !title || !sellerId) {
    return { count: 0 };
  }

  const notificationTitle = `New Auction: ${title.length > 50 ? title.slice(0, 47) + '...' : title}`;
  const priceDisplay = startingPrice !== undefined && startingPrice !== null
    ? ` starting at ₹${Number(startingPrice).toLocaleString('en-IN')}`
    : '';
  const notificationMessage = `A new campus listing "${title}" was just published${priceDisplay}. Tap to view the details and place the first bid!`;

  const insertQuery = `
    INSERT INTO notifications (
      user_id,
      auction_id,
      type,
      title,
      message
    )
    SELECT
      u.id,
      $1,
      'new_auction',
      $2,
      $3
    FROM users u
    WHERE u.is_active = true
      AND u.id != $4
    ON CONFLICT (user_id, auction_id, type) DO NOTHING;
  `;

  const result = await query(insertQuery, [
    auctionId,
    notificationTitle,
    notificationMessage,
    sellerId,
  ]);

  return { count: result.rowCount || 0 };
};

/**
 * Retrieve notifications for the authenticated user, ordered newest-first.
 * GET /api/notifications
 */
export const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Query all notifications for the authenticated user in newest-first order
    const notificationsQuery = `
      SELECT
        id,
        user_id,
        auction_id,
        type,
        title,
        message,
        is_read,
        created_at
      FROM notifications
      WHERE user_id = $1
      ORDER BY created_at DESC;
    `;

    const result = await query(notificationsQuery, [userId]);
    const notifications = result.rows.map(formatNotification);
    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return res.status(200).json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error(`[Notifications Controller] Error fetching notifications: ${error.message}`);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve notifications. Please try again.',
    });
  }
};

/**
 * Mark a single notification belonging to the authenticated user as read.
 * PATCH /api/notifications/:id/read
 */
export const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // 1. Validate UUID format
    if (!id || !UUID_REGEX.test(id)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid notification ID format. Expected a valid UUID.',
      });
    }

    // 2. Update notification scoped strictly to the authenticated user
    const updateQuery = `
      UPDATE notifications
      SET is_read = true
      WHERE id = $1 AND user_id = $2
      RETURNING
        id,
        user_id,
        auction_id,
        type,
        title,
        message,
        is_read,
        created_at;
    `;

    const result = await query(updateQuery, [id, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Notification not found or access denied.',
      });
    }

    const updatedNotification = formatNotification(result.rows[0]);

    return res.status(200).json({
      message: 'Notification marked as read.',
      notification: updatedNotification,
    });
  } catch (error) {
    console.error(`[Notifications Controller] Error marking notification as read: ${error.message}`);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update notification. Please try again.',
    });
  }
};

/**
 * Mark all notifications belonging to the authenticated user as read.
 * PATCH /api/notifications/read-all
 */
export const markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    const updateQuery = `
      UPDATE notifications
      SET is_read = true
      WHERE user_id = $1 AND is_read = false
      RETURNING id;
    `;

    const result = await query(updateQuery, [userId]);

    return res.status(200).json({
      message: 'All notifications marked as read.',
      updatedCount: result.rowCount || 0,
    });
  } catch (error) {
    console.error(`[Notifications Controller] Error marking all notifications as read: ${error.message}`);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to mark notifications as read. Please try again.',
    });
  }
};

