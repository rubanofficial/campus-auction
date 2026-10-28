import { query } from '../config/database.js';

/**
 * Reusable authentication middleware
 * Checks if a valid session exists and verifies that the user still exists and is active in PostgreSQL.
 */
export const requireAuth = async (req, res, next) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required. Please sign in.',
      });
    }

    const result = await query(
      'SELECT id, display_name, email, role, is_active, created_at FROM users WHERE id = $1',
      [req.session.userId]
    );
    const user = result.rows[0];

    if (!user) {
      // User record was deleted from database
      req.session.destroy(() => {});
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User account no longer exists. Please sign in again.',
      });
    }

    if (!user.is_active) {
      req.session.destroy(() => {});
      return res.status(403).json({
        error: 'Forbidden',
        message: 'This account has been deactivated. Please contact campus support.',
      });
    }

    // Attach user to request object (excluding passwordHash)
    req.user = {
      id: user.id,
      displayName: user.display_name,
      email: user.email,
      role: user.role,
      isActive: user.is_active,
      createdAt: user.created_at,
    };
    next();
  } catch (error) {
    console.error(`[Auth Middleware] Verification error: ${error.message}`);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to verify authentication session.',
    });
  }
};
