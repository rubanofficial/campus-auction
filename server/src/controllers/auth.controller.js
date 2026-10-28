import bcrypt from 'bcryptjs';
import { query } from '../config/database.js';

/**
 * Handle student registration
 * POST /api/auth/register
 */
export const registerStudent = async (req, res) => {
  try {
    const { displayName, email, password, confirmPassword } = req.body;

    // 1. Validate presence of all required fields
    if (!displayName || !email || !password || !confirmPassword) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'All fields (displayName, email, password, confirmPassword) are required.',
      });
    }

    // 2. Validate display name
    const trimmedDisplayName = displayName.trim();
    if (trimmedDisplayName.length < 2 || trimmedDisplayName.length > 50) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Display name must be between 2 and 50 characters long.',
      });
    }

    // 3. Validate email format & normalize
    const normalizedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Please provide a valid college or university email address.',
      });
    }

    // 4. Validate password length (minimum 6 characters)
    if (password.length < 6) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Password must be at least 6 characters long.',
      });
    }

    // 5. Validate password confirmation
    if (password !== confirmPassword) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Password and password confirmation do not match.',
      });
    }

    // 6. Check for duplicate email registration
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'An account with this email address already exists.',
      });
    }

    // 7. Securely hash password using bcrypt
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 8. Create and persist user with strictly forced student role in PostgreSQL
    const insertResult = await query(
      `INSERT INTO users (display_name, email, password_hash, role, is_active)
       VALUES ($1, $2, $3, 'student', true)
       RETURNING id, display_name, email, role, created_at`,
      [trimmedDisplayName, normalizedEmail, passwordHash]
    );

    const newUser = insertResult.rows[0];

    // 9. Return safe JSON response (never returning password or passwordHash)
    return res.status(201).json({
      message: 'Student account registered successfully.',
      user: {
        id: newUser.id,
        displayName: newUser.display_name,
        email: newUser.email,
        role: newUser.role,
        createdAt: newUser.created_at,
      },
    });
  } catch (error) {
    // Handle PostgreSQL unique constraint violation (code 23505)
    if (error.code === '23505') {
      return res.status(409).json({
        error: 'Conflict',
        message: 'An account with this email address already exists.',
      });
    }

    // Handle PostgreSQL check constraint violations (code 23514)
    if (error.code === '23514') {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Registration details do not meet requirements. Please provide a valid student email address and name.',
      });
    }

    console.error(`[Auth] Registration error: ${error.message}`);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred while creating your account. Please try again later.',
    });
  }
};

/**
 * Handle student login
 * POST /api/auth/login
 */
export const loginStudent = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validate presence of credentials
    if (!email || !password) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Email and password are required.',
      });
    }

    // 2. Normalize email
    const normalizedEmail = email.trim().toLowerCase();

    // 3. Find user in Neon PostgreSQL
    const result = await query(
      'SELECT id, display_name, email, password_hash, role, is_active, created_at FROM users WHERE email = $1',
      [normalizedEmail]
    );
    const user = result.rows[0];

    // 4. Reject unknown email with generic error (avoids email enumeration)
    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password.',
      });
    }

    // 5. Compare submitted password with bcrypt hash
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password.',
      });
    }

    // 6. Check if account is active
    if (!user.is_active) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'This account has been deactivated. Please contact campus support.',
      });
    }

    // 7. Establish session and persist identification data
    const establishSession = () => {
      req.session.userId = user.id;
      req.session.userRole = user.role;

      req.session.save((saveErr) => {
        if (saveErr) {
          console.error(`[Auth] Session save error: ${saveErr.message}`);
          return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to save session. Please try again.',
          });
        }

        // Return safe user information without secrets
        return res.status(200).json({
          message: 'Signed in successfully.',
          user: {
            id: user.id,
            displayName: user.display_name,
            email: user.email,
            role: user.role,
            createdAt: user.created_at,
          },
        });
      });
    };

    if (typeof req.session?.regenerate === 'function') {
      req.session.regenerate((err) => {
        if (err) {
          console.warn(`[Auth] Session regeneration warning (${err.message}), proceeding with session update...`);
        }
        establishSession();
      });
    } else {
      establishSession();
    }
  } catch (error) {
    console.error(`[Auth] Login error: ${error.message}`);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred during login. Please try again later.',
    });
  }
};

/**
 * Get current authenticated user
 * GET /api/auth/me
 */
export const getCurrentUser = async (req, res) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(200).json({
        user: null,
      });
    }

    const result = await query(
      'SELECT id, display_name, email, role, is_active, created_at FROM users WHERE id = $1',
      [req.session.userId]
    );
    const user = result.rows[0];

    if (!user) {
      req.session.destroy(() => {});
      return res.status(200).json({
        user: null,
        message: 'User session invalid. Please sign in again.',
      });
    }

    if (!user.is_active) {
      req.session.destroy(() => {});
      return res.status(403).json({
        error: 'Forbidden',
        message: 'This account has been deactivated. Please contact campus support.',
      });
    }

    return res.status(200).json({
      user: {
        id: user.id,
        displayName: user.display_name,
        email: user.email,
        role: user.role,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    console.error(`[Auth] Me endpoint error: ${error.message}`);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve user session.',
    });
  }
};

/**
 * Log out and destroy session
 * POST /api/auth/logout
 */
export const logoutUser = async (req, res) => {
  try {
    if (!req.session) {
      return res.status(200).json({
        message: 'Logged out successfully.',
      });
    }

    const isProduction = process.env.NODE_ENV === 'production';

    req.session.destroy((err) => {
      if (err) {
        console.error(`[Auth] Logout destroy error: ${err.message}`);
        return res.status(500).json({
          error: 'Internal Server Error',
          message: 'Could not log out. Please try again.',
        });
      }

      res.clearCookie('campus_auction_sid', {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
      });

      return res.status(200).json({
        message: 'Logged out successfully.',
      });
    });
  } catch (error) {
    console.error(`[Auth] Logout error: ${error.message}`);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred during logout.',
    });
  }
};

/**
 * Protected test endpoint
 * GET /api/auth/protected-test
 */
export const getProtectedTest = async (req, res) => {
  return res.status(200).json({
    message: 'Access granted to protected endpoint.',
    user: {
      id: req.user.id,
      displayName: req.user.displayName,
      email: req.user.email,
      role: req.user.role,
    },
  });
};
