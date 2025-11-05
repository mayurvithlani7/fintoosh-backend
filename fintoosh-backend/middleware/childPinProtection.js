/**
 * Child PIN Brute Force Protection Middleware
 * Protects child accounts from PIN guessing attacks
 */

const User = require('../models/User');

/**
 * Middleware to check and enforce child PIN brute force protection
 * Must be used before the actual login logic
 */
const childPinBruteForceProtection = async (req, res, next) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ message: 'Username is required' });
    }

    // Find child user by username
    const user = await User.findOne({ username, role: 'child' });
    if (!user) {
      // Don't reveal that username doesn't exist for security
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if account is PIN-locked
    if (user.pinLockoutUntil && user.pinLockoutUntil > new Date()) {
      const remainingMinutes = Math.ceil((user.pinLockoutUntil - new Date()) / (1000 * 60));
      console.warn(`[PIN SECURITY] Child account ${username} is PIN-locked. Remaining: ${remainingMinutes} minutes`);
      return res.status(403).json({
        message: `Account is temporarily locked due to too many failed PIN attempts. Try again in ${remainingMinutes} minute(s).`,
        lockoutRemaining: remainingMinutes,
        isLocked: true
      });
    }

    // Check if account is deactivated
    if (user.status === 'deactivated') {
      return res.status(403).json({
        message: 'This account has been deactivated. Please contact support.',
        requiresReactivation: true
      });
    }

    // Attach user to request for login handler
    req.targetUser = user;
    next();

  } catch (error) {
    console.error('[PIN SECURITY] Error in PIN protection middleware:', error);
    res.status(500).json({ message: 'Authentication service temporarily unavailable' });
  }
};

/**
 * Process failed PIN attempt and handle lockout logic
 * @param {Object} user - User document
 * @returns {Object} - Result with lockout status
 */
const handleFailedPinAttempt = async (user) => {
  const MAX_PIN_ATTEMPTS = 3;
  const LOCKOUT_MINUTES = 15;

  try {
    // Increment failed attempts
    user.pinAttempts = (user.pinAttempts || 0) + 1;

    let isLocked = false;
    let lockoutMinutes = 0;

    // Check if max attempts reached
    if (user.pinAttempts >= MAX_PIN_ATTEMPTS) {
      // Lock the account
      user.pinLockoutUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000);
      isLocked = true;
      lockoutMinutes = LOCKOUT_MINUTES;

      console.warn(`[PIN SECURITY] Child account ${user.username} PIN-locked for ${LOCKOUT_MINUTES} minutes after ${user.pinAttempts} failed attempts`);
    }

    await user.save();

    return {
      attemptsRemaining: Math.max(0, MAX_PIN_ATTEMPTS - user.pinAttempts),
      isLocked,
      lockoutMinutes
    };

  } catch (error) {
    console.error('[PIN SECURITY] Error handling failed PIN attempt:', error);
    throw error;
  }
};

/**
 * Reset PIN attempt counters on successful login
 * @param {Object} user - User document
 */
const resetPinAttempts = async (user) => {
  try {
    user.pinAttempts = 0;
    user.pinLockoutUntil = null;
    await user.save();
    console.log(`[PIN SECURITY] Reset PIN attempts for child account ${user.username}`);
  } catch (error) {
    console.error('[PIN SECURITY] Error resetting PIN attempts:', error);
    // Don't throw - success should still proceed
  }
};

module.exports = {
  childPinBruteForceProtection,
  handleFailedPinAttempt,
  resetPinAttempts
};
