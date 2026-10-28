import bcrypt from 'bcryptjs';
import User from '../models/User.js';

/**
 * Handle student registration
 * POST /api/auth/register
 */
export const registerStudent = async (req, res, next) => {
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
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'An account with this email address already exists.',
      });
    }

    // 7. Securely hash password using bcrypt
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 8. Create and persist user with strictly forced student role
    const newUser = await User.create({
      displayName: trimmedDisplayName,
      email: normalizedEmail,
      passwordHash,
      role: 'student', // Enforce student role regardless of request body
      isActive: true,
    });

    // 9. Return safe JSON response (never returning password or passwordHash)
    return res.status(201).json({
      message: 'Student account registered successfully.',
      user: {
        id: newUser._id,
        displayName: newUser.displayName,
        email: newUser.email,
        role: newUser.role,
        createdAt: newUser.createdAt,
      },
    });
  } catch (error) {
    // Handle MongoDB unique constraint race condition
    if (error.code === 11000) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'An account with this email address already exists.',
      });
    }

    console.error(`[Auth] Registration error: ${error.message}`);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred while creating your account. Please try again later.',
    });
  }
};
