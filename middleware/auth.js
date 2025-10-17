const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      console.log("[auth middleware] missing token");
      return res.status(401).json({ message: 'No authentication token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production');
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
  if (req.user.role !== 'parent') {
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

module.exports = { auth, requireParent, requireChild };
