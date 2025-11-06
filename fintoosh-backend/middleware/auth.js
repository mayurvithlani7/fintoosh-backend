const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      console.log("[auth middleware] missing token");
      return res.status(401).json({ message: 'No authentication token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      console.log("[auth middleware] user not found for id", decoded.userId);
      return res.status(401).json({ message: 'User not found' });
    }

    // Check if account is deactivated
    if (user.status === 'deactivated') {
      console.log("[auth middleware] deactivated user attempted access", user.email);
      return res.status(403).json({
        message: 'This account has been deactivated. Please contact support or reactivate your account.',
        requiresReactivation: true
      });
    }

    req.user = user;
    req.token = token;
    // DEBUG: log user info on every request
    console.log("[auth middleware]", { id: user.id, email: user.email, role: user.role });
    next();
  } catch (error) {
    console.log("[auth middleware] error:", error);
    res.status(401).json({ message: 'Invalid authentication token' });
  }
};

const requireParent = (req, res, next) => {
  // Log every attempt for debugging parent access issues
  console.log("[requireParent middleware] req.user:", req.user && { id: req.user.id, email: req.user.email, role: req.user.role });
  if (!req.user || req.user.role !== 'parent') {
    return res.status(403).json({ message: 'Parent access required' });
  }
  next();
};

const requireChild = (req, res, next) => {
  if (req.user.role !== 'child') {
    return res.status(403).json({ message: 'Child access required' });
  }
  next();
};

/**
 * Middleware to ensure children can only access their own data,
 * while parents can access any child's data in their family.
 * @param {string} targetIdParam - The parameter name containing the target user ID (e.g., 'childId', 'userId')
 */
const requireSelfOrParent = (targetIdParam) => {
  return async (req, res, next) => {
    const targetId = req.params[targetIdParam];

    if (req.user.role === 'parent') {
      // Parents can access any child's data in their family
      // The actual family check will be done in the route handler
      return next();
    }

    if (req.user.role === 'child') {
      // Children can only access their own data
      if (req.user.id !== targetId) {
        console.log('[requireSelfOrParent] Child cross-access blocked:', {
          requesterId: req.user.id,
          targetId: targetId,
          endpoint: req.originalUrl
        });
        return res.status(403).json({
          message: 'Children can only access their own data'
        });
      }
      return next();
    }

    // Invalid role
    return res.status(403).json({ message: 'Invalid user role' });
  };
};

module.exports = { auth, requireParent, requireChild, requireSelfOrParent };
