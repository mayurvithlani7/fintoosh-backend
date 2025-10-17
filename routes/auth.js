const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const OTPService = require('../utils/otpService');
const { auth } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

const router = express.Router();

/**
 * Rate limiter for login: max 5 attempts per 5min per IP
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts
  standardHeaders: true,
  legacyHeaders: false,
  handler: function (req, res) {
    return res.status(429).json({
      message: 'Too many login attempts. Please try again in 15 minutes.'
    });
  }
});

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role = 'parent', id, parentId: inputParentId, parentMobile, mobileNumber, referralCode } = req.body;
    console.log('Registration attempt:', { name, email, role, mobileNumber, parentMobile, parentId: inputParentId });

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { id }] });
    if (existingUser) {
      console.log('User already exists:', existingUser.email);
      return res.status(400).json({ message: 'User already exists' });
    }

    // Generate unique ID if not provided
    const userId = id || `user_${Date.now()}`;

    // NEW: Setup familyId for parent/child
    let familyId;
    let finalParentId = inputParentId; // Use a different variable for the final parentId
    if (role === 'parent') {
      // Use parent's mobile number as familyId (without country code)
      familyId = mobileNumber.replace(/^\+91/, '');
      // ENFORCE: Only one parent per familyId (shouldn't happen, but extra check)
      const existingParent = await User.findOne({ familyId, role: 'parent' });
      if (existingParent) {
        return res.status(400).json({ message: 'A parent is already registered for this family.' });
      }
    } else if (role === 'child' && (inputParentId || parentMobile)) {
      // Lookup parent to inherit familyId (match on id, email, or mobile)
      let parentQuery = { role: 'parent' };
      if (inputParentId) {
        parentQuery.$or = [ { id: inputParentId }, { email: inputParentId } ];
      } else if (parentMobile) {
        parentQuery.mobileNumber = parentMobile;
      }

      const parent = await User.findOne(parentQuery);
      if (!parent) {
        return res.status(400).json({ message: 'Invalid parentId/parentMobile. Parent user not found.' });
      }
      familyId = parent.familyId;
      // ENFORCE: Only one child per familyId
      const existingChild = await User.findOne({ familyId, role: 'child' });
      if (existingChild) {
        return res.status(400).json({ message: 'A child is already registered for this family.' });
      }
      // Set parentId for child
      finalParentId = parent.id;
    } else {
      return res.status(400).json({ message: 'FamilyId/parentId could not be determined for child.' });
    }

    // Create new user
    const userData = {
      id: userId,
      familyId,
      name,
      email,
      mobileNumber,
      password,
      role,
      parentId: finalParentId || null,
      referralCode: role === 'parent' ? referralCode : null
    };

    // Only set username/pin for children
    if (role === 'child') {
      userData.username = username || null;
      userData.pin = pin || null;
    }

    const user = new User(userData);

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role, familyId: user.familyId },
      process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
      { expiresIn: '7d' }
    );

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      user: userResponse,
      token,
      message: 'User registered successfully'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({ message: error.message });
  }
});

/**
 * Login user with account-specific brute force protection
 */
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    const MAX_ATTEMPTS = 5;
    const LOCKOUT_MINUTES = 5;

    console.log('=== LOGIN ATTEMPT ===');
    console.log('Email:', email);
    console.log('Password provided:', !!password);

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found for email:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log('User found:', user.name, user.role, user.status);

    // Check if account is deactivated
    if (user.status === 'deactivated') {
      return res.status(403).json({
        message: 'This account has been deactivated. Please contact support or reactivate your account.',
        requiresReactivation: true
      });
    }

    // Check lockout: If lockoutUntil is in the future, reject the login attempt
    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      const remainingMinutes = Math.ceil((user.lockoutUntil - new Date()) / (1000 * 60));
      return res.status(403).json({
        message: `Account is temporarily locked due to too many failed attempts. Try again in ${remainingMinutes} minute(s).`,
        lockoutRemaining: remainingMinutes
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      // Failed attempt: Increment loginAttempts
      user.loginAttempts += 1;

      // If it reaches MAX_ATTEMPTS, set lockoutUntil
      if (user.loginAttempts >= MAX_ATTEMPTS) {
        user.lockoutUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000);
        await user.save();
        const remainingMinutes = Math.ceil((user.lockoutUntil - new Date()) / (1000 * 60));
        return res.status(403).json({
          message: `Too many failed attempts. Account locked for ${LOCKOUT_MINUTES} minutes.`,
          lockoutRemaining: remainingMinutes
        });
      }

      await user.save();
      return res.status(401).json({
        message: 'Invalid credentials',
        attemptsRemaining: MAX_ATTEMPTS - user.loginAttempts
      });
    }

    // Successful attempt: Reset loginAttempts to 0 and set lockoutUntil to null
    user.loginAttempts = 0;
    user.lockoutUntil = null;
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role, familyId: user.familyId },
      process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
      { expiresIn: '7d' }
    );

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.loginAttempts;
    delete userResponse.lockoutUntil;

    console.log('=== LOGIN SUCCESSFUL ===');
    console.log('User:', userResponse.name, userResponse.role);
    console.log('Token generated:', !!token);
    console.log('Sending response...');

    res.json({
      user: userResponse,
      token,
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(400).json({ message: error.message });
  }
});

// Get current user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('goals')
      .populate('chores')
      .populate('rewards')
      .populate('transactions');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userResponse = user.toObject();
    delete userResponse.password;

    res.json(userResponse);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const allowedUpdates = ['name', 'avatar', 'parentPin'];
    const updates = {};

    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { ...updates, updatedAt: new Date() },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userResponse = user.toObject();
    delete userResponse.password;

    res.json(userResponse);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

/**
 * Mark the tutorial/completion flag for this user (to suppress onboarding popups).
 */
router.put('/tutorial-completed', auth, async (req, res) => {
  try {
    req.user.tutorialCompleted = true;
    req.user.updatedAt = new Date();
    await req.user.save();
    res.json({ message: 'Tutorial marked as completed', tutorialCompleted: true });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

/**
 * Mark the feedback consent/prompt as completed so it never shows again.
 */
router.put('/feedback-prompt', auth, async (req, res) => {
  try {
    req.user.feedbackPromptCompleted = true;
    req.user.updatedAt = new Date();
    await req.user.save();
    res.json({ message: 'Feedback prompt marked as completed', feedbackPromptCompleted: true });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Change password
router.put('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Verify current password
    const isCurrentPasswordValid = await req.user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Update password
    req.user.password = newPassword;
    await req.user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

/**
 * Send OTP to user's mobile number
 */
router.post('/send-otp', async (req, res) => {
  try {
    const { mobileNumber, userId } = req.body;

    if (!mobileNumber) {
      return res.status(400).json({ message: 'Mobile number is required' });
    }

    // Find user by mobile number
    const user = await User.findOne({ mobileNumber });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // For reactivation, use more lenient rate limiting (allow every 30 seconds instead of 60)
    const now = new Date();
    const thirtySecondsAgo = new Date(now.getTime() - 30 * 1000);

    if (user.otpExpiresAt && user.otpExpiresAt > thirtySecondsAgo) {
      return res.status(429).json({ message: 'Please wait 30 seconds before requesting another reactivation OTP' });
    }

    // Generate and store OTP
    const otp = OTPService.generateOTP();
    const stored = await OTPService.storeOTP(user._id, otp);

    if (!stored) {
      return res.status(500).json({ message: 'Failed to store OTP' });
    }

    // Send OTP via SMS (disabled in development)
    const sent = await OTPService.sendOTP(mobileNumber, otp);

    if (!sent) {
      return res.status(500).json({ message: 'Failed to send OTP' });
    }

    res.json({
      message: 'OTP sent successfully',
      otp: process.env.NODE_ENV === 'development' ? otp : undefined // Only show OTP in development
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ message: 'Failed to send OTP' });
  }
});

/**
 * Verify OTP
 */
router.post('/verify-otp', async (req, res) => {
  try {
    const { mobileNumber, otp } = req.body;

    if (!mobileNumber || !otp) {
      return res.status(400).json({ message: 'Mobile number and OTP are required' });
    }

    // Find user by mobile number
    const user = await User.findOne({ mobileNumber });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify OTP
    const isValid = await OTPService.verifyOTP(user._id, otp);

    if (!isValid) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    res.json({ message: 'OTP verified successfully' });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'Failed to verify OTP' });
  }
});

/**
 * Create child account (Parent-gated)
 * Requires authentication, only parents can create children
 */
router.post('/create-child', auth, async (req, res) => {
  try {
    const { name, username, pin } = req.body;

    // Only parents can create children
    if (req.user.role !== 'parent') {
      return res.status(403).json({ message: 'Only parents can create child accounts' });
    }

    // Validate required fields
    if (!name || !username || !pin) {
      return res.status(400).json({ message: 'Name, username, and PIN are required' });
    }

    // Validate PIN length (4-6 digits)
    if (!/^\d{4,6}$/.test(pin)) {
      return res.status(400).json({ message: 'PIN must be 4-6 digits' });
    }

    // Check if username is unique
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already taken' });
    }

    // Check if parent already has a child (enforce one child per parent for now)
    const existingChild = await User.findOne({ parentId: req.user.id, role: 'child' });
    if (existingChild) {
      return res.status(400).json({ message: 'A child account already exists for this parent' });
    }

    // Create child user
    const childUser = new User({
      id: `child_${Date.now()}`,
      familyId: req.user.familyId,
      name,
      email: `${username}@child.local`, // Dummy email for child
      mobileNumber: req.user.mobileNumber, // Use parent's mobile for child
      password: pin, // PIN as password for simplicity
      role: 'child',
      parentId: req.user.id,
      username,
      pin,
      isFirstTimeUser: true
    });

    await childUser.save();

    // Return child info (without sensitive data)
    const childResponse = childUser.toObject();
    delete childResponse.password;
    delete childResponse.pin;

    res.status(201).json({
      child: childResponse,
      message: 'Child account created successfully'
    });
  } catch (error) {
    console.error('Create child error:', error);
    res.status(400).json({ message: error.message });
  }
});

/**
 * Child login with username and PIN (with brute force protection)
 */
router.post('/child-login', async (req, res) => {
  try {
    const { username, pin } = req.body;
    const MAX_ATTEMPTS = 5;
    const LOCKOUT_MINUTES = 5;

    if (!username || !pin) {
      return res.status(400).json({ message: 'Username and PIN are required' });
    }

    // Find child by username
    const user = await User.findOne({ username, role: 'child' });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if account is deactivated
    if (user.status === 'deactivated') {
      return res.status(403).json({
        message: 'This account has been deactivated. Please contact support or reactivate your account.',
        requiresReactivation: true
      });
    }

    // Check lockout: If lockoutUntil is in the future, reject the login attempt
    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      const remainingMinutes = Math.ceil((user.lockoutUntil - new Date()) / (1000 * 60));
      return res.status(403).json({
        message: `Account is temporarily locked due to too many failed attempts. Try again in ${remainingMinutes} minute(s).`,
        lockoutRemaining: remainingMinutes
      });
    }

    // Check PIN
    if (user.pin !== pin) {
      // Failed attempt: Increment loginAttempts
      user.loginAttempts += 1;

      // If it reaches MAX_ATTEMPTS, set lockoutUntil
      if (user.loginAttempts >= MAX_ATTEMPTS) {
        user.lockoutUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000);
        await user.save();
        const remainingMinutes = Math.ceil((user.lockoutUntil - new Date()) / (1000 * 60));
        return res.status(403).json({
          message: `Too many failed attempts. Account locked for ${LOCKOUT_MINUTES} minutes.`,
          lockoutRemaining: remainingMinutes
        });
      }

      await user.save();
      return res.status(401).json({
        message: 'Invalid credentials',
        attemptsRemaining: MAX_ATTEMPTS - user.loginAttempts
      });
    }

    // Successful attempt: Reset loginAttempts to 0 and set lockoutUntil to null
    user.loginAttempts = 0;
    user.lockoutUntil = null;
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role, familyId: user.familyId },
      process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
      { expiresIn: '7d' }
    );

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.pin;
    delete userResponse.loginAttempts;
    delete userResponse.lockoutUntil;

    res.json({
      user: userResponse,
      token,
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Child login error:', error);
    res.status(400).json({ message: error.message });
  }
});

/**
 * Request OTP for parent password reset
 */
router.post('/request-parent-otp', async (req, res) => {
  try {
    const { identifier } = req.body;

    if (!identifier) {
      return res.status(400).json({ message: 'Identifier (email or mobile) is required' });
    }

    // Find parent user by email or mobile
    const user = await User.findOne({
      $or: [{ email: identifier }, { mobileNumber: identifier }],
      role: 'parent'
    });

    if (!user) {
      return res.status(404).json({ message: 'Parent user not found' });
    }

    // For reactivation, use more lenient rate limiting (allow every 30 seconds instead of 60)
    const now = new Date();
    const thirtySecondsAgo = new Date(now.getTime() - 30 * 1000);

    if (user.otpExpiresAt && user.otpExpiresAt > thirtySecondsAgo) {
      return res.status(429).json({ message: 'Please wait 30 seconds before requesting another reactivation OTP' });
    }

    // Generate and store OTP
    const otp = OTPService.generateOTP();
    const stored = await OTPService.storeOTP(user._id, otp);

    if (!stored) {
      return res.status(500).json({ message: 'Failed to store OTP' });
    }

    // Send OTP via SMS or email based on identifier type
    let sent = false;
    if (identifier.includes('@')) {
      // Email OTP (for now, just log it since email service not configured)
      console.log(`Password reset OTP ${otp} would be sent to email ${identifier}`);
      sent = true; // Assume sent for development
    } else {
      // SMS OTP
      sent = await OTPService.sendOTP(identifier, otp);
    }

    if (!sent) {
      return res.status(500).json({ message: 'Failed to send OTP' });
    }

    res.json({
      message: 'OTP sent successfully',
      userId: user._id // Return user ID for verification step
    });
  } catch (error) {
    console.error('Request parent OTP error:', error);
    res.status(500).json({ message: 'Failed to send OTP' });
  }
});

/**
 * Verify OTP for parent password reset
 */
router.post('/verify-parent-otp', async (req, res) => {
  try {
    const { identifier, otp } = req.body;

    if (!identifier || !otp) {
      return res.status(400).json({ message: 'Identifier and OTP are required' });
    }

    // Find parent user by email or mobile
    const user = await User.findOne({
      $or: [{ email: identifier }, { mobileNumber: identifier }],
      role: 'parent'
    });

    if (!user) {
      return res.status(404).json({ message: 'Parent user not found' });
    }

    // Verify OTP
    const isValid = await OTPService.verifyOTP(user._id, otp);

    if (!isValid) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    res.json({ message: 'OTP verified successfully' });
  } catch (error) {
    console.error('Verify parent OTP error:', error);
    res.status(500).json({ message: 'Failed to verify OTP' });
  }
});

/**
 * Reset parent password with OTP verification
 */
router.post('/reset-parent-password', async (req, res) => {
  try {
    const { identifier, otp, newPassword } = req.body;

    if (!identifier || !otp || !newPassword) {
      return res.status(400).json({ message: 'Identifier, OTP, and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Find parent user by email or mobile
    const user = await User.findOne({
      $or: [{ email: identifier }, { mobileNumber: identifier }],
      role: 'parent'
    });

    if (!user) {
      return res.status(404).json({ message: 'Parent user not found' });
    }

    // Check if OTP was recently verified (within last 30 minutes)
    // The OTP has already been verified and cleared, so we just check the verification status and timestamp
    const now = new Date();
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);

    if (!user.otpVerified || !user.updatedAt || user.updatedAt < thirtyMinutesAgo) {
      return res.status(400).json({ message: 'OTP verification expired. Please request a new OTP.' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Clear OTP data
    await OTPService.clearOTP(user._id);

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset parent password error:', error);
    res.status(500).json({ message: 'Failed to reset password' });
  }
});

/**
 * Reset child PIN (Parent-controlled)
 * Requires parent authentication and password verification
 */
router.post('/reset-child-pin', auth, async (req, res) => {
  try {
    const { childId, newPin, parentPassword } = req.body;

    // Only parents can reset child PINs
    if (req.user.role !== 'parent') {
      return res.status(403).json({ message: 'Only parents can reset child PINs' });
    }

    // Verify parent password
    const isParentPasswordValid = await req.user.comparePassword(parentPassword);
    if (!isParentPasswordValid) {
      return res.status(401).json({ message: 'Invalid parent password' });
    }

    // Validate new PIN
    if (!newPin || !/^\d{4,6}$/.test(newPin)) {
      return res.status(400).json({ message: 'PIN must be 4-6 digits' });
    }

    // Find the child
    const child = await User.findOne({ _id: childId, parentId: req.user.id, role: 'child' });
    if (!child) {
      return res.status(404).json({ message: 'Child not found or access denied' });
    }

    // Update child's PIN
    child.pin = newPin;
    await child.save();

    res.json({ message: 'Child PIN reset successfully' });
  } catch (error) {
    console.error('Reset child PIN error:', error);
    res.status(500).json({ message: 'Failed to reset child PIN' });
  }
});

/**
 * Deactivate Family Account (Parent-controlled)
 * Requires parent authentication and password verification
 * Sets status to 'deactivated' for all family members
 */
router.post('/deactivate-account', auth, async (req, res) => {
  try {
    const { password } = req.body;

    // Only parents can deactivate accounts
    if (req.user.role !== 'parent') {
      return res.status(403).json({ message: 'Only parents can deactivate family accounts' });
    }

    // Verify parent password
    const isPasswordValid = await req.user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    // Deactivate all family members (parent and children)
    await User.updateMany(
      { familyId: req.user.familyId },
      { $set: { status: 'deactivated', deactivatedAt: new Date() } }
    );

    res.json({ message: 'Family account deactivated successfully' });
  } catch (error) {
    console.error('Deactivate account error:', error);
    res.status(500).json({ message: 'Failed to deactivate account' });
  }
});

/**
 * Request Account Reactivation OTP (For deactivated accounts)
 * Sends OTP to parent's mobile number for account reactivation
 */
router.post('/request-reactivation-otp', async (req, res) => {
  try {
    const { identifier } = req.body;

    if (!identifier) {
      return res.status(400).json({ message: 'Mobile number is required' });
    }

    // Validate mobile number format
    const mobileRegex = /^\+91\d{10}$/;
    if (!mobileRegex.test(identifier)) {
      return res.status(400).json({ message: 'Please enter a valid 10-digit mobile number' });
    }

    // Find deactivated user by mobile number
    const user = await User.findOne({
      mobileNumber: identifier,
      status: 'deactivated',
      role: 'parent'
    });

    if (!user) {
      return res.status(404).json({ message: 'No deactivated parent account found with this mobile number' });
    }

    // For reactivation, use more lenient rate limiting (allow every 30 seconds instead of 60)
    const now = new Date();
    const thirtySecondsAgo = new Date(now.getTime() - 30 * 1000);

    if (user.otpExpiresAt && user.otpExpiresAt > thirtySecondsAgo) {
      return res.status(429).json({ message: 'Please wait 30 seconds before requesting another reactivation OTP' });
    }

    // Generate and store OTP
    const otp = OTPService.generateOTP();
    const stored = await OTPService.storeOTP(user._id, otp);

    if (!stored) {
      return res.status(500).json({ message: 'Failed to store OTP' });
    }

    // Send OTP via SMS (disabled in development)
    const sent = process.env.NODE_ENV === 'production' ?
      await OTPService.sendOTP(user.mobileNumber, otp) : true;

    if (!sent) {
      return res.status(500).json({ message: 'Failed to send OTP' });
    }

    res.json({
      message: 'Reactivation OTP sent successfully',
      userId: user._id,
      otp: process.env.NODE_ENV === 'development' ? otp : undefined // Only show OTP in development
    });
  } catch (error) {
    console.error('Request reactivation OTP error:', error);
    res.status(500).json({ message: 'Failed to send reactivation OTP' });
  }
});

/**
 * Reactivate Family Account (OTP-verified)
 * Requires valid OTP and reactivates all family members
 */
router.post('/reactivate-account', async (req, res) => {
  try {
    const { identifier, otp } = req.body;

    if (!identifier || !otp) {
      return res.status(400).json({ message: 'Mobile number and OTP are required' });
    }

    // Validate mobile number format
    const mobileRegex = /^\+91\d{10}$/;
    if (!mobileRegex.test(identifier)) {
      return res.status(400).json({ message: 'Please enter a valid 10-digit mobile number' });
    }

    // Find deactivated parent user by mobile number
    const user = await User.findOne({
      mobileNumber: identifier,
      status: 'deactivated',
      role: 'parent'
    });

    if (!user) {
      return res.status(404).json({ message: 'No deactivated parent account found with this mobile number' });
    }

    // Verify OTP
    const isValid = await OTPService.verifyOTP(user._id, otp);

    if (!isValid) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Reactivate all family members (parent and children)
    await User.updateMany(
      { familyId: user.familyId },
      {
        $set: { status: 'active' },
        $unset: { deactivatedAt: 1 }
      }
    );

    // Clear OTP data
    await OTPService.clearOTP(user._id);

    res.json({ message: 'Family account reactivated successfully' });
  } catch (error) {
    console.error('Reactivate account error:', error);
    res.status(500).json({ message: 'Failed to reactivate account' });
  }
});

/**
 * Permanently Delete Family Account (GDPR Compliant)
 * Requires parent authentication and password verification
 * Permanently removes ALL family data from the database
 */
router.delete('/delete-family-account', auth, async (req, res) => {
  try {
    const { password } = req.body;

    // Only parents can delete accounts
    if (req.user.role !== 'parent') {
      return res.status(403).json({ message: 'Only parents can delete family accounts' });
    }

    // Verify parent password
    const isPasswordValid = await req.user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    const familyId = req.user.familyId;

    // Get all family member IDs before deletion (for logging)
    const familyMembers = await User.find({ familyId }, '_id name email role');
    const familyMemberIds = familyMembers.map(member => member._id);

    console.log(`[ACCOUNT DELETION] Deleting family account for familyId: ${familyId}`);
    console.log(`[ACCOUNT DELETION] Family members:`, familyMembers.map(m => `${m.name} (${m.role})`));

    // Delete all related data in the correct order to avoid foreign key issues

    // 1. Delete transactions (references goals, rewards, chores)
    const Transaction = require('../models/Transaction');
    await Transaction.deleteMany({ userId: { $in: familyMemberIds } });

    // 2. Delete goals (referenced by transactions)
    const Goal = require('../models/Goal');
    await Goal.deleteMany({ userId: { $in: familyMemberIds } });

    // 3. Delete chores (referenced by transactions)
    const Chore = require('../models/Chore');
    await Chore.deleteMany({ userId: { $in: familyMemberIds } });

    // 4. Delete rewards (referenced by transactions)
    const Reward = require('../models/Reward');
    await Reward.deleteMany({ userId: { $in: familyMemberIds } });

    // 5. Delete achievement data (referenced by users)
    const Achievement = require('../models/Achievement');
    await Achievement.deleteMany({ userId: { $in: familyMemberIds } });

    // 6. Delete approval requests
    const ApprovalRequest = require('../models/ApprovalRequest');
    await ApprovalRequest.deleteMany({
      $or: [
        { requesterId: { $in: familyMemberIds } },
        { approverId: { $in: familyMemberIds } }
      ]
    });

    // 7. Delete family discussions
    const FamilyDiscussion = require('../models/FamilyDiscussion');
    await FamilyDiscussion.deleteMany({ familyId });

    // 8. Delete dream boards
    const DreamBoard = require('../models/DreamBoard');
    await DreamBoard.deleteMany({ userId: { $in: familyMemberIds } });

    // 9. Delete notifications
    const Notification = require('../models/Notification');
    await Notification.deleteMany({ userId: { $in: familyMemberIds } });

    // 10. Delete parent milestones
    const ParentMilestone = require('../models/ParentMilestone');
    await ParentMilestone.deleteMany({ userId: { $in: familyMemberIds } });

    // 11. Delete family timeline
    const FamilyTimeline = require('../models/FamilyTimeline');
    await FamilyTimeline.deleteMany({ familyId });

    // 12. Finally, delete all user accounts
    const deleteResult = await User.deleteMany({ familyId });

    console.log(`[ACCOUNT DELETION] Successfully deleted ${deleteResult.deletedCount} user accounts`);
    console.log(`[ACCOUNT DELETION] All associated data permanently removed`);

    res.json({
      message: 'Family account permanently deleted. All data has been removed.',
      deletedMembers: familyMembers.length,
      familyId: familyId
    });

  } catch (error) {
    console.error('Delete family account error:', error);
    res.status(500).json({ message: 'Failed to delete family account' });
  }
});

module.exports = router;
