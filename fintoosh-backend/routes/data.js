const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

const User = require('../models/User');
const Goal = require('../models/Goal');
const Chore = require('../models/Chore');
const ChoreTemplate = require('../models/ChoreTemplate');
const Transaction = require('../models/Transaction');
const Reward = require('../models/Reward');
const Achievement = require('../models/Achievement');
const ApprovalRequest = require('../models/ApprovalRequest');
const ParentMilestone = require('../models/ParentMilestone');
const FamilyDiscussion = require('../models/FamilyDiscussion');
const FamilyTimeline = require('../models/FamilyTimeline');
const DreamBoard = require('../models/DreamBoard');
const RealAllowance = require('../models/RealAllowance');
const Notification = require('../models/Notification');
const { calculateNextDueDate } = require('../scripts/recurringTasksJob');
const { auth, requireParent } = require('../middleware/auth');
const {
  sanitizeInput,
  validateFinancialData,
  validateMessage
} = require('../middleware/validation');

// Role-based rate limiting for authenticated users
const createRoleBasedLimiter = (role) => {
  const limits = {
    parent: { windowMs: 15 * 60 * 1000, max: 100 }, // 100 requests per 15 minutes
    child: { windowMs: 15 * 60 * 1000, max: 50 },   // 50 requests per 15 minutes
    default: { windowMs: 15 * 60 * 1000, max: 30 }  // 30 requests per 15 minutes for anonymous
  };

  const limit = limits[role] || limits.default;

  return rateLimit({
    windowMs: limit.windowMs,
    max: limit.max,
    keyGenerator: (req) => `${req.user?.role || 'anonymous'}_${req.ip}`,
    handler: (req, res) => {
      const role = req.user?.role || 'anonymous';
      const resetTime = new Date(Date.now() + limit.windowMs);
      console.warn('Role-based rate limit exceeded', {
        role,
        ip: req.ip,
        userId: req.user?.id,
        endpoint: req.originalUrl,
        method: req.method,
        resetTime: resetTime.toISOString()
      });
      res.status(429).json({
        message: 'Too many requests, please slow down',
        retryAfter: Math.ceil(limit.windowMs / 1000),
        role: role,
        limit: limit.max,
        windowMs: limit.windowMs
      });
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// Apply role-based rate limiting to authenticated routes
const roleBasedLimiter = (req, res, next) => {
  const limiter = createRoleBasedLimiter(req.user?.role);
  return limiter(req, res, next);
};

// Throttling for expensive operations (analytics, bulk operations)
const expensiveOperationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Only 20 expensive operations per 15 minutes
  keyGenerator: (req) => `${req.user?.role || 'anonymous'}_${req.ip}`,
  message: 'Too many expensive operations, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Transaction routes
router.get('/transactions/:userId', auth, roleBasedLimiter, async (req, res) => {
  try {
    const user = await User.findOne({ id: req.params.userId });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Get total count for pagination info
    const totalTransactions = await Transaction.countDocuments({ user: user._id });

    const transactions = await Transaction.find({ user: user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      transactions,
      pagination: {
        page,
        limit,
        total: totalTransactions,
        totalPages: Math.ceil(totalTransactions / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/transactions', auth, requireParent, sanitizeInput, validateFinancialData, async (req, res) => {
  try {
    const { userId, type, description, amount, fromJar, toJar, reference } = req.body;
    console.log('DEBUG: Creating transaction', { userId, type, amount, reqUserId: req.user.id, reqUserRole: req.user.role });

    const user = await User.findOne({ id: userId });
    if (!user) {
      console.log('DEBUG: User not found for id:', userId);
      return res.status(404).json({ message: 'User not found' });
    }
    console.log('DEBUG: Found user:', { id: user.id, familyId: user.familyId, role: user.role });

    // Verify parent has permission for this child
    if (user.familyId !== req.user.familyId) {
      console.log('DEBUG: Family ID mismatch', { userFamilyId: user.familyId, reqUserFamilyId: req.user.familyId });
      return res.status(403).json({ message: 'Not authorized for this user' });
    }

    const transaction = new Transaction({
      user: user._id,
      type,
      description,
      amount,
      fromJar,
      toJar,
      reference
    });

    console.log('DEBUG: Saving transaction...');
    const saved = await transaction.save();
    console.log('DEBUG: Transaction saved:', saved._id);

    // Update user's points based on toJar (but not for parent manual adjustments)
    if (saved.toJar && saved.type !== 'parent-points-adjustment') {
      const jarFieldMap = {
        current: 'currentPoints',
        save: 'savePoints',
        spend: 'spendPoints',
        donate: 'donatePoints',
        invest: 'investPoints'
      };

      const fieldName = jarFieldMap[saved.toJar];
      if (fieldName) {
        user[fieldName] = (user[fieldName] || 0) + saved.amount;
        console.log(`DEBUG: Added ${saved.amount} points to ${saved.toJar} jar (${fieldName}) for user ${user.id}`);
      }
    }

    user.transactions.unshift(saved._id);
    await user.save();
    console.log('DEBUG: User updated with transaction');

    res.status(201).json(saved);
  } catch (error) {
    console.log('DEBUG: Transaction error:', error);
    res.status(400).json({ message: error.message });
  }
});

// Get family children - must come before /users/:id to avoid route conflict
router.get('/users/children', auth, requireParent, async (req, res) => {
  try {
    const children = await User.find({
      'caregivers.userId': req.user.id,
      role: 'child'
    }).select('-password -pin -otpCode -otpExpiresAt -otpVerified');

    res.json({ children });
  } catch (error) {
    console.error('Error fetching children:', error);
    res.status(500).json({ message: 'Failed to fetch children' });
  }
});

// User routes
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findOne({ id: req.params.id })
      .populate('goals')
      .populate('chores')
      .populate({ path: 'rewards', model: 'Reward' })
      .populate('transactions')
      .select('-password');

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get family children
router.get('/users', auth, async (req, res) => {
  try {
    const { familyId, role } = req.query;
    let query = {};

    if (familyId) {
      query.familyId = familyId;
    }

    if (role) {
      query.role = role;
    }

    const users = await User.find(query).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch('/users/:id', async (req, res) => {
  try {
    const update = { ...req.body, updatedAt: new Date() };
    const user = await User.findOneAndUpdate(
      { id: req.params.id },
      update,
      { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Failed to patch user', error });
  }
});

// Update family currency and automation settings (affects all family members)
router.patch('/users/:userId/settings', auth, async (req, res) => {
  try {
    const { currency, conversionRate, showDenominations, defaultSplit, interestRule, autoApprovalRules } = req.body;
    console.log('[SETTINGS PATCH] Received:', { interestRule, currency, conversionRate, showDenominations, defaultSplit, autoApprovalRules });

    // Validate inputs
    if (currency && !['points', 'inr'].includes(currency)) {
      return res.status(400).json({ message: 'Invalid currency value' });
    }

    if (conversionRate !== undefined && (conversionRate < 0.1 || conversionRate > 100)) {
      return res.status(400).json({ message: 'Conversion rate must be between 0.1 and 100' });
    }

    // Validate defaultSplit if provided
    if (defaultSplit) {
      const jars = ['current', 'save', 'spend', 'donate', 'invest'];
      const total = jars.reduce((sum, jar) => sum + (defaultSplit[jar] || 0), 0);
      if (total !== 100) {
        return res.status(400).json({ message: 'Point split percentages must total exactly 100%' });
      }
      for (const jar of jars) {
        if (defaultSplit[jar] < 0 || defaultSplit[jar] > 100) {
          return res.status(400).json({ message: `Invalid percentage for ${jar}: must be 0-100` });
        }
      }
    }

    // Validate autoApprovalRules if present
    if (autoApprovalRules) {
      const allowedKeys = ['choreClaimMax', 'rewardClaimMax', 'pointMoveMax'];
      for (const key of Object.keys(autoApprovalRules)) {
        if (!allowedKeys.includes(key)) {
          return res.status(400).json({ message: `Invalid auto-approval rule key: ${key}` });
        }
        const val = autoApprovalRules[key];
        if (typeof val !== 'number' || val < 0) {
          return res.status(400).json({ message: `Invalid value for ${key}: must be a non-negative number` });
        }
      }
    }

    const user = await User.findOne({ id: req.params.userId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Only parents can change settings for their family
    if (req.user.role === 'parent' && req.user.familyId !== user.familyId) {
      return res.status(403).json({ message: 'Not authorized to change settings for this user' });
    }

    // Kids can only change settings for themselves
    if (req.user.role !== 'parent' && req.user.id !== req.params.userId) {
      return res.status(403).json({ message: 'Not authorized to change settings for other users' });
    }

    const updateFields = {};
    if (currency !== undefined) updateFields.currency = currency;
    if (conversionRate !== undefined) updateFields.conversionRate = conversionRate;
    if (showDenominations !== undefined) updateFields.showDenominations = showDenominations;
    if (defaultSplit !== undefined) updateFields.defaultSplit = defaultSplit;
    if (interestRule !== undefined) updateFields.interestRule = interestRule;
    if (autoApprovalRules !== undefined) updateFields.autoApprovalRules = autoApprovalRules;
    updateFields.updatedAt = new Date();

    // If updating interest rule, ensure it's set for ALL children of the family (not parents)
    if (interestRule !== undefined) {
      // Always set interestRule for all family members, not just children.
      await User.updateMany(
        { familyId: user.familyId },
        { $set: { interestRule } }
      );
    }

    // If updating autoApprovalRules, set for all family members too (default: all members, can change if just parents should have this)
    const settingsFields = { ...updateFields };
    delete settingsFields.interestRule; // Already handled
    await User.updateMany(
      { familyId: user.familyId },
      settingsFields
    );

    // Return the updated user (the one who made the request)
    const updatedUser = await User.findOne({ id: req.params.userId }).select('-password');
    console.log('[SETTINGS PATCH] Updated user document:', {
      interestRule: updatedUser.interestRule,
      currency: updatedUser.currency,
      conversionRate: updatedUser.conversionRate,
      showDenominations: updatedUser.showDenominations,
      defaultSplit: updatedUser.defaultSplit,
      autoApprovalRules: updatedUser.autoApprovalRules
    });

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update settings', error: error.message });
  }
});

// Reward routes
router.get('/rewards/:userId', auth, async (req, res) => {
  try {
    // Find user by custom ID to get MongoDB ObjectId
    const user = await User.findOne({ id: req.params.userId });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    // Show all rewards, not just available, so PENDING and CLAIMED can be displayed
    const rewards = await Reward.find({
      user: user._id,
      $or: [
        { createdAt: { $gte: thirtyDaysAgo } },
        { approvedAt: { $gte: thirtyDaysAgo } },
        { purchasedAt: { $gte: thirtyDaysAgo } },
        { updatedAt: { $gte: thirtyDaysAgo } }
      ]
    });
    res.json(rewards);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/rewards', auth, requireParent, sanitizeInput, async (req, res) => {
  try {
    const { childId, name, description, cost, category } = req.body;
    console.log("DEBUG: Parent creating reward. AuthUser:", req.user, "childId:", childId);
    const child = await User.findOne({ id: childId, familyId: req.user.familyId, role: 'child' });
    console.log("DEBUG: Found child for reward:", child);
    if (!child) {
      return res.status(404).json({ message: "Child not found or does not belong to your family." });
    }
    const reward = new Reward({
      user: child._id,
      familyId: child.familyId,
      name,
      description,
      cost,
      category,
    });
    const saved = await reward.save();
    child.rewards = child.rewards || [];
    child.rewards.push(saved._id);
    await child.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PATCH /rewards/:rewardId -- allow parents to edit rewards and handle reward claims
router.patch('/rewards/:rewardId', auth, sanitizeInput, async (req, res) => {
  try {
    const reward = await Reward.findById(req.params.rewardId);
    if (!reward) return res.status(404).json({ message: 'Reward not found' });

    // Check if user is authorized to modify this reward
    const rewardOwner = await User.findById(reward.user);
    if (!rewardOwner) return res.status(404).json({ message: 'Reward owner not found' });

    // Parents can edit all fields for their children's rewards
    if (req.user.role === 'parent') {
      // Check if reward belongs to parent's family
      if (rewardOwner.familyId !== req.user.familyId) {
        return res.status(403).json({ message: 'Not authorized to modify this reward' });
      }
      // Allow updating all reward fields: name, cost, description
      const allowed = {};
      if (req.body.name !== undefined) allowed.name = req.body.name;
      if (req.body.cost !== undefined) allowed.cost = req.body.cost;
      if (req.body.description !== undefined) allowed.description = req.body.description;
      if (req.body.category !== undefined) allowed.category = req.body.category;

      Object.assign(reward, allowed, { updatedAt: new Date() });
      await reward.save();
      res.json(reward);
      return;
    }

    // Parent approval flow: on claim, create ApprovalRequest, do not fulfill yet
    if (req.body.purchased === true && !reward.purchased) {
      if (!reward.available) return res.status(400).json({ message: 'Reward is not available for claiming.' });
      if (reward.purchased) return res.status(400).json({ message: 'Reward already claimed.' });

      // Atomically check and reserve points in pendingCurrentPoints
      const availablePoints = (rewardOwner.currentPoints || 0) - (rewardOwner.pendingCurrentPoints || 0);
      if (availablePoints < reward.cost) {
        return res.status(400).json({ message: 'Not enough points to claim this reward.' });
      }

      // Atomically increment pendingCurrentPoints
      const updatedUser = await User.findOneAndUpdate(
        { _id: rewardOwner._id },
        { $inc: { pendingCurrentPoints: reward.cost } },
        { new: true }
      );

      if (!updatedUser) {
        return res.status(500).json({ message: 'Failed to reserve points for reward claim.' });
      }

      // --- AUTO-APPROVAL LOGIC for reward claims ---
      let autoApproved = false;
      let autoApprovalStatusMessage = '';
      // Get auto-approval thresholds for this family/parent
      // Prefer parent if assigned, otherwise family-wide rule from rewardOwner
      let parent = null;
      if (rewardOwner.parentId) {
        parent = await User.findOne({ id: rewardOwner.parentId });
      }
      let autoApprovalRules = (parent && parent.autoApprovalRules) || rewardOwner.autoApprovalRules || {};
      const rewardClaimMax = autoApprovalRules.rewardClaimMax;

      if (typeof rewardClaimMax === 'number' && rewardClaimMax >= 0 && reward.cost <= rewardClaimMax) {
        // Auto-approve immediately - deduct from both current and pending points atomically
        const updatedUser = await User.findOneAndUpdate(
          { _id: rewardOwner._id },
          {
            $inc: {
              currentPoints: -reward.cost,
              pendingCurrentPoints: -reward.cost
            }
          },
          { new: true }
        );

        if (!updatedUser) {
          return res.status(500).json({ message: 'Failed to update points for auto-approved reward.' });
        }

        reward.available = false;
        reward.purchased = true;
        reward.approvedAt = new Date();
        reward.purchasedAt = new Date();
        await reward.save();

        // Create transaction
        const txn = new Transaction({
          type: 'reward-purchase',
          description: `Bought "${reward.name}"`,
          amount: -reward.cost,
          user: rewardOwner._id,
          date: new Date().toLocaleString(),
        });
        await txn.save();
        rewardOwner.transactions = rewardOwner.transactions || [];
        rewardOwner.transactions.unshift(txn._id);
        await rewardOwner.save();

        // Optionally create notification...
        await Notification.create({
          familyId: rewardOwner.familyId,
          userId: rewardOwner.id,
          type: 'reward_auto_approved',
          message: `Your reward "${reward.name}" was auto-approved!`,
          referenceId: reward._id,
          isRead: false
        });

        autoApproved = true;
        autoApprovalStatusMessage = 'Reward auto-approved (below parent threshold).';
        const updatedReward = await Reward.findById(reward._id);
        res.status(200).json({ message: autoApprovalStatusMessage, reward: updatedReward, autoApproved: true });
        return;
      }
      // --- End AUTO-APPROVAL logic ---

      // Check for an existing pending request for this reward
      const ApprovalRequest = require('../models/ApprovalRequest');
      const existing = await ApprovalRequest.findOne({
        childId: rewardOwner.id,
        rewardId: reward._id.toString(),
        type: 'reward',
        status: 'Pending'
      });
      if (existing) {
        return res.status(400).json({ message: 'A reward approval request is already pending for this reward.' });
      }

      // Correct logic: always update available to false, purchased to false, status to pending and save
      reward.available = false;
      reward.purchased = false;
      reward.status = 'pending'; // Mark reward as pending approval
      await reward.save();
      // Reload and send updated reward after save
      const updatedReward = await Reward.findById(reward._id);

      // Create approval request - use first caregiver as primary approver
      const primaryCaregiver = rewardOwner.caregivers && rewardOwner.caregivers.length > 0 ? rewardOwner.caregivers[0] : null;
      if (!primaryCaregiver) return res.status(400).json({ message: 'No caregiver found for user.' });
      const approvalRequest = new ApprovalRequest({
        familyId: rewardOwner.familyId,
        childId: rewardOwner.id,
        parentId: primaryCaregiver.userId, // Backward compatibility field
        caregiverId: primaryCaregiver.userId, // New field for clarity
        type: 'reward',
        name: reward.name,
        amount: reward.cost,
        status: 'Pending',
        rewardId: reward._id.toString(),
        createdAt: new Date()
      });
      await approvalRequest.save();
      res.status(202).json({ message: 'Reward claim pending parent approval.', reward: updatedReward, approvalRequestId: approvalRequest._id });
      return;
    }

    // Otherwise: normal update (for other fields)
    Object.assign(reward, req.body, { updatedAt: new Date() });
    await reward.save();

    res.json(reward);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE /rewards/:rewardId -- allow parents and children to delete rewards with restrictions
router.delete('/rewards/:rewardId', auth, async (req, res) => {
  try {
    const { rewardId } = req.params;
    console.log('[DELETE REWARD] Starting deletion for rewardId:', rewardId, 'by user:', req.user.id, 'role:', req.user.role);

    // Find the reward and check for existence/ownership
    const reward = await Reward.findById(rewardId);
    if (!reward) {
      console.log('[DELETE REWARD] Reward not found:', rewardId);
      return res.status(404).json({ message: "Reward not found" });
    }
    console.log('[DELETE REWARD] Found reward:', { id: reward._id, name: reward.name, status: reward.status, user: reward.user });

    // Check authorization based on user role
    if (req.user.role === 'parent') {
      const rewardOwner = await User.findById(reward.user);
      if (!rewardOwner || rewardOwner.familyId !== req.user.familyId) {
        console.log('[DELETE REWARD] Parent not authorized:', { parentFamilyId: req.user.familyId, rewardOwnerFamilyId: rewardOwner?.familyId });
        return res.status(403).json({ message: "Not authorized to delete this reward" });
      }
      console.log('[DELETE REWARD] Parent authorization confirmed');
    } else if (req.user.role === 'child') {
      if (!reward.user.equals(req.user._id)) {
        console.log('[DELETE REWARD] Child not authorized:', { childId: req.user._id, rewardUserId: reward.user });
        return res.status(403).json({ message: "Not authorized to delete this reward" });
      }
      console.log('[DELETE REWARD] Child authorization confirmed');
    } else {
      console.log('[DELETE REWARD] Invalid user role:', req.user.role);
      return res.status(403).json({ message: "Invalid user role for reward deletion" });
    }

    // Check status restrictions - can't delete if pending or claimed
    if (reward.status !== 'active') {
      console.log('[DELETE REWARD] Cannot delete non-active reward:', { status: reward.status, expected: 'active' });
      return res.status(400).json({ message: "Can only delete rewards with status 'active'" });
    }
    console.log('[DELETE REWARD] Status check passed, proceeding with deletion');

    await Reward.findByIdAndDelete(rewardId);
    console.log('[DELETE REWARD] Successfully deleted reward:', rewardId);

    res.json({ message: "Reward deleted successfully" });
  } catch (error) {
    console.error('[DELETE REWARD] Error deleting reward:', error);
    res.status(500).json({ message: "Failed to delete reward", error: error.message });
  }
});

// Goal template routes
router.get('/goal-templates', auth, async (req, res) => {
  try {
    // For now, return hardcoded templates - could be moved to database later
    const templates = [
      {
        id: 'bike-fund',
        name: 'New Bike Fund',
        category: 'saving',
        targetAmount: 5000,
        duration: 90,
        jarAllocations: { current: 30, save: 50, spend: 10, donate: 5, invest: 5 },
        milestones: [
          { description: 'Save first 1,000 points', targetAmount: 1000, reward: 'Bike sticker pack' },
          { description: 'Halfway to bike!', targetAmount: 2500, reward: 'Extra screen time' },
          { description: 'Bike fund complete!', targetAmount: 5000, reward: 'New bicycle!' }
        ],
        description: 'Save up for your dream bicycle! Learn patience and delayed gratification.',
        icon: '🚲',
        difficulty: 'medium',
        recommendedAge: '8-12'
      },
      {
        id: 'vacation-fund',
        name: 'Family Vacation Fund',
        category: 'saving',
        targetAmount: 15000,
        duration: 180,
        jarAllocations: { current: 20, save: 60, spend: 5, donate: 10, invest: 5 },
        milestones: [
          { description: 'Save first 3,000 points', targetAmount: 3000, reward: 'Family movie night' },
          { description: 'Halfway to vacation!', targetAmount: 7500, reward: 'Choose vacation activity' },
          { description: 'Vacation fund complete!', targetAmount: 15000, reward: 'Dream vacation!' }
        ],
        description: 'Help save for an amazing family vacation. Every contribution counts!',
        icon: '✈️',
        difficulty: 'hard',
        recommendedAge: '10-15'
      },
      {
        id: 'charity-drive',
        name: 'Help Others Fund',
        category: 'charity',
        targetAmount: 2000,
        duration: 60,
        jarAllocations: { current: 10, save: 20, spend: 5, donate: 60, invest: 5 },
        milestones: [
          { description: 'Save first 500 points', targetAmount: 500, reward: 'Thank you card from charity' },
          { description: 'Halfway to helping others!', targetAmount: 1000, reward: 'Charity work visit' },
          { description: 'Donation goal reached!', targetAmount: 2000, reward: 'Charity impact certificate' }
        ],
        description: 'Save money to donate to a cause you care about. Giving feels great!',
        icon: '❤️',
        difficulty: 'easy',
        recommendedAge: '6-12'
      },
      {
        id: 'learning-books',
        name: 'Book Collection Fund',
        category: 'learning',
        targetAmount: 3000,
        duration: 75,
        jarAllocations: { current: 25, save: 40, spend: 20, donate: 10, invest: 5 },
        milestones: [
          { description: 'Save for first book', targetAmount: 750, reward: 'New adventure book' },
          { description: 'Halfway to book collection!', targetAmount: 1500, reward: 'Book reading challenge' },
          { description: 'Complete book fund!', targetAmount: 3000, reward: 'Personal library!' }
        ],
        description: 'Build your own library! Save for books that will expand your mind.',
        icon: '📚',
        difficulty: 'medium',
        recommendedAge: '7-14'
      },
      {
        id: 'sports-equipment',
        name: 'Sports Gear Fund',
        category: 'saving',
        targetAmount: 4000,
        duration: 100,
        jarAllocations: { current: 35, save: 45, spend: 15, donate: 3, invest: 2 },
        milestones: [
          { description: 'Save for basic equipment', targetAmount: 1000, reward: 'Sports team sticker' },
          { description: 'Halfway to sports gear!', targetAmount: 2000, reward: 'Extra practice session' },
          { description: 'Complete sports fund!', targetAmount: 4000, reward: 'Full sports equipment!' }
        ],
        description: 'Get the gear you need to excel at your favorite sport!',
        icon: '⚽',
        difficulty: 'medium',
        recommendedAge: '8-16'
      },
      {
        id: 'art-supplies',
        name: 'Art Studio Fund',
        category: 'saving',
        targetAmount: 2500,
        duration: 80,
        jarAllocations: { current: 30, save: 35, spend: 25, donate: 5, invest: 5 },
        milestones: [
          { description: 'Save for basic supplies', targetAmount: 625, reward: 'Art supply starter pack' },
          { description: 'Halfway to art studio!', targetAmount: 1250, reward: 'Art class enrollment' },
          { description: 'Complete art fund!', targetAmount: 2500, reward: 'Home art studio!' }
        ],
        description: 'Create your own art studio with paints, canvases, and supplies!',
        icon: '🎨',
        difficulty: 'easy',
        recommendedAge: '6-14'
      },
      {
        id: 'emergency-fund',
        name: 'Safety Net Fund',
        category: 'saving',
        targetAmount: 10000,
        duration: 365,
        jarAllocations: { current: 15, save: 70, spend: 0, donate: 5, invest: 10 },
        milestones: [
          { description: 'Save first 2,500 points', targetAmount: 2500, reward: 'Emergency kit inspection' },
          { description: 'Halfway to safety net!', targetAmount: 5000, reward: 'Financial planning session' },
          { description: 'Complete emergency fund!', targetAmount: 10000, reward: 'Peace of mind!' }
        ],
        description: 'Build a financial safety net for unexpected expenses. Smart planning!',
        icon: '🛡️',
        difficulty: 'hard',
        recommendedAge: '12-16'
      },
      {
        id: 'music-lessons',
        name: 'Music Journey Fund',
        category: 'learning',
        targetAmount: 8000,
        duration: 150,
        jarAllocations: { current: 20, save: 50, spend: 10, donate: 10, invest: 10 },
        milestones: [
          { description: 'Save for first lesson', targetAmount: 2000, reward: 'Instrument practice session' },
          { description: 'Halfway to music journey!', targetAmount: 4000, reward: 'Music theory book' },
          { description: 'Complete music fund!', targetAmount: 8000, reward: 'Full music course!' }
        ],
        description: 'Learn to play an instrument! Music education builds discipline and creativity.',
        icon: '🎵',
        difficulty: 'hard',
        recommendedAge: '8-16'
      }
    ];

    // Filter by category if provided
    const { category } = req.query;
    if (category && category !== 'all') {
      const filteredTemplates = templates.filter(t => t.category === category);
      return res.json(filteredTemplates);
    }

    res.json(templates);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Goal routes
router.get('/goals/:childId', auth, async (req, res) => {
  try {
    // Support lookup by MongoDB _id or custom user id
    let user;
    if (req.params.childId.match(/^[0-9a-fA-F]{24}$/)) {
      // If it's a valid ObjectId format, try _id
      user = await User.findById(req.params.childId);
    }
    if (!user) {
      // Fallback: try custom id field
      user = await User.findOne({ id: req.params.childId });
    }
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Pagination, filtering, archiving
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;
    const status = req.query.status;
    const archive = req.query.archive === 'true';
    const now = new Date();
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    // Build query
    let dateFilter;
    if (archive) {
      // Only archived goals: completed/expired/updated > 90 days ago
      dateFilter = { $lte: ninetyDaysAgo };
    } else {
      // Recent (not archived): within last 90 days
      dateFilter = { $gte: ninetyDaysAgo };
    }

    const goalQuery = { user: user._id };
    // Date range filter: apply to createdAt, completedAt, or updatedAt
    goalQuery.$or = [
      { createdAt: dateFilter },
      { completedAt: dateFilter },
      { updatedAt: dateFilter }
    ];
    // Status filter
    if (status && status !== 'all') {
      if (status === 'active') goalQuery.status = 'active';
      else if (status === 'completed') goalQuery.status = 'completed';
      else if (status === 'expired') goalQuery.status = 'expired';
    }

    // Get total count for metadata
    const totalGoals = await Goal.countDocuments(goalQuery);
    // Get paginated results
    const goals = await Goal.find(goalQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Check for expired goals and update them
    const updatedGoals = await Promise.all(goals.map(async (goal) => {
      if (goal.deadline && goal.status === 'active' && new Date(goal.deadline) < now) {
        goal.status = 'expired';
        await goal.save();
      }
      return goal;
    }));

    // Pagination metadata
    const totalPages = Math.ceil(totalGoals / limit);
    res.json({
      data: Array.isArray(updatedGoals) ? updatedGoals : [],
      pagination: {
        total: totalGoals,
        page,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        limit
      }
    });
  } catch (error) {
    res.status(500).json({ data: [], message: error.message });
  }
});

router.post('/goals', auth, sanitizeInput, async (req, res) => {
  console.log('[GOALS POST DEBUG] ===== START =====');
  console.log('[GOALS POST DEBUG] req.user exists:', !!req.user);
  console.log('[GOALS POST DEBUG] req.user.role:', JSON.stringify(req.user?.role));
  console.log('[GOALS POST DEBUG] req.user.id:', req.user?.id);

  try {
    const { childId, name, targetAmount, jar, description, deadline, templateId, milestones } = req.body;
    console.log('[GOALS POST DEBUG] Request body:', { childId, name, targetAmount, jar });

    console.log('[GOALS POST DEBUG] Role checks:');
    console.log('[GOALS POST DEBUG] role === "parent":', req.user.role === 'parent');
    console.log('[GOALS POST DEBUG] role === "child":', req.user.role === 'child');
    console.log('[GOALS POST DEBUG] role === "elder":', req.user.role === 'elder');

  let targetUserId;
  let parentId = req.user._id;

  // Determine the target user (goal owner)
  if (req.user.role === 'parent') {
    // Parents can create goals for their children
    if (!childId) {
      return res.status(400).json({ message: "childId is required for parent goal creation." });
    }
    console.log('[GOALS POST DEBUG] Looking for child:', { childId, parentFamilyId: req.user.familyId, parentId: req.user.id });
    const child = await User.findOne({ id: childId, familyId: req.user.familyId, role: 'child' });
    console.log('[GOALS POST DEBUG] Child query result:', child ? { id: child.id, name: child.name, familyId: child.familyId, role: child.role } : 'NOT FOUND');
    if (!child) {
      return res.status(404).json({ message: "Child not found or does not belong to your family." });
    }
    targetUserId = child._id;
  } else if (req.user.role === 'child') {
    // Children can create goals for themselves
    targetUserId = req.user._id;
    // For children, parent is their assigned parent
    const childUser = await User.findById(req.user._id);
    if (childUser.parentId) {
      // parentId is stored as string, need to convert to ObjectId
      const parentUser = await User.findOne({ id: childUser.parentId });
      parentId = parentUser ? parentUser._id : req.user._id; // fallback to self if parent not found
    } else {
      parentId = req.user._id; // fallback to self if no parent assigned
    }
    console.log('[GOALS POST] Child creating goal for themselves:', { targetUserId, parentId });
  } else {
    console.log('[GOALS POST] Invalid role detected:', req.user.role, 'User ID:', req.user.id, 'Family ID:', req.user.familyId);
    return res.status(403).json({ message: `Invalid user role '${req.user.role}' for goal creation. Only parents and children can create goals.` });
  }

    const goalData = {
      parent: parentId,
      user: targetUserId,
      createdBy: req.user._id,
      createdByType: req.user.role,
      name,
      targetAmount,
      jar,
    };

    // Add optional fields if provided
    if (description) goalData.description = description;
    if (deadline) goalData.deadline = new Date(deadline);
    if (templateId) goalData.templateId = templateId;
    if (milestones) goalData.milestones = milestones;

    const goal = new Goal(goalData);
    const savedGoal = await goal.save();
    res.status(201).json(savedGoal);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PATCH /goals/:goalId -- allow parents to edit goals and children to request status changes
router.patch('/goals/:goalId', auth, async (req, res) => {
  try {
    const { goalId } = req.params;
    const update = req.body;
    const allowed = {};

    // Find the goal and check for existence/ownership
    const goal = await Goal.findById(goalId);
    if (!goal) return res.status(404).json({ message: "Goal not found" });

    // Parents can update all fields: name, description, targetAmount, jar, deadline, status
    if (req.user.role === 'parent') {
      // Check if goal belongs to parent's family
      const goalOwner = await User.findById(goal.user);
      if (!goalOwner || goalOwner.familyId !== req.user.familyId) {
        return res.status(403).json({ message: "Not authorized to modify this goal" });
      }
      // Allow updating all goal fields
      if (update.name !== undefined) allowed.name = update.name;
      if (update.description !== undefined) allowed.description = update.description;
      if (update.targetAmount !== undefined) allowed.targetAmount = update.targetAmount;
      if (update.jar !== undefined) allowed.jar = update.jar;
      if (update.deadline !== undefined) allowed.deadline = update.deadline;
      if (update.status !== undefined) allowed.status = update.status;
    } else {
      // Child can only set status to 'pending'
      if (update.status !== 'pending') {
        return res.status(403).json({ message: "Children can only set goal status to pending" });
      }
      if (!goal.user.equals(req.user._id)) {
        return res.status(403).json({ message: "Not authorized to modify this goal" });
      }

      // Atomically check and reserve points in the appropriate pendingXPoints field
      const jar = goal.jar || 'current';
      const pointsField = jar + 'Points';
      const pendingField = 'pending' + jar.charAt(0).toUpperCase() + jar.slice(1) + 'Points';
      const availablePoints = (req.user[pointsField] || 0) - (req.user[pendingField] || 0);

      if (availablePoints < goal.targetAmount) {
        return res.status(400).json({ message: `Not enough points in ${jar} jar to claim this goal.` });
      }

      // Atomically increment the pending field
      const updatedUser = await User.findOneAndUpdate(
        { _id: req.user._id },
        { $inc: { [pendingField]: goal.targetAmount } },
        { new: true }
      );

      if (!updatedUser) {
        return res.status(500).json({ message: 'Failed to reserve points for goal claim.' });
      }

      // Allow updating status for children
      if (update.status !== undefined) allowed.status = update.status;
    }

    Object.assign(goal, allowed, { updatedAt: new Date() });
    await goal.save();
    res.json(goal);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE /goals/:goalId -- allow parents and children to delete goals with restrictions
router.delete('/goals/:goalId', auth, async (req, res) => {
  try {
    const { goalId } = req.params;

    // Find the goal and check for existence/ownership
    const goal = await Goal.findById(goalId);
    if (!goal) return res.status(404).json({ message: "Goal not found" });

    // Check authorization based on user role
    if (req.user.role === 'parent') {
      // Parents can delete goals from their family
      const goalOwner = await User.findById(goal.user);
      if (!goalOwner || goalOwner.familyId !== req.user.familyId) {
        return res.status(403).json({ message: "Not authorized to delete this goal" });
      }
    } else if (req.user.role === 'child') {
      // Children can only delete their own goals
      if (!goal.user.equals(req.user._id)) {
        return res.status(403).json({ message: "Not authorized to delete this goal" });
      }
    } else {
      return res.status(403).json({ message: "Invalid user role for goal deletion" });
    }

    // Check status restrictions - neither parents nor children can delete pending goals
    if (goal.status === 'pending') {
      return res.status(400).json({ message: "Cannot delete a goal that is pending approval" });
    }

    // Only allow deletion of active goals (parents and children can delete active goals)
    if (goal.status !== 'active') {
      return res.status(400).json({ message: "Can only delete active goals" });
    }

    // Delete the goal
    await Goal.findByIdAndDelete(goalId);

    res.json({ message: "Goal deleted successfully" });
  } catch (error) {
    console.error('Error deleting goal:', error);
    res.status(500).json({ message: "Failed to delete goal", error: error.message });
  }
});

// Chore routes
router.get('/chores/:childId', auth, async (req, res) => {
  try {
    // Find user by custom ID to get MongoDB ObjectId
    const user = await User.findOne({ id: req.params.childId });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const chores = await Chore.find({
      user: user._id,
      $or: [
        { createdAt: { $gte: thirtyDaysAgo } },
        { completedAt: { $gte: thirtyDaysAgo } },
        { approvedAt: { $gte: thirtyDaysAgo } },
        { updatedAt: { $gte: thirtyDaysAgo } }
      ]
    });

    // Add welcome task for first-time users
    let choresWithWelcome = [...chores];
    if (user.isFirstTimeUser && user.role === 'child') {
      // Check if welcome task already exists and is not completed
      const existingWelcomeTask = chores.find(c =>
        c.name === '🎉 Customize Your Avatar!' &&
        !c.completed &&
        !c.approved
      );

      if (!existingWelcomeTask) {
        // Create welcome task as a virtual chore (not saved to DB)
        const welcomeTask = {
          _id: 'welcome-task-' + user.id, // Virtual ID
          name: '🎉 Customize Your Avatar!',
          points: 25,
          description: 'Welcome to Money Pots! Start by customizing your avatar to make the app your own.',
          completed: false,
          approved: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          user: user._id,
          isWelcomeTask: true, // Flag to identify this as a welcome task
          useDefaultSplit: true, // Use default family split
          customSplit: null
        };
        choresWithWelcome.unshift(welcomeTask); // Add to beginning of list
      }
    }

    res.json(choresWithWelcome);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/chores', auth, requireParent, async (req, res) => {
  try {
    const { childId, name, points, description, frequency, deadline, useDefaultSplit, customSplit } = req.body;
    const child = await User.findOne({ id: childId, familyId: req.user.familyId, role: 'child' });
    if (!child) return res.status(404).json({ message: "Child not found or does not belong to your family." });

    // Validate customSplit if provided
    if (customSplit) {
      const jars = ['current', 'save', 'spend', 'donate', 'invest'];
      const total = jars.reduce((sum, jar) => sum + (customSplit[jar] || 0), 0);
      if (total !== 100) {
        return res.status(400).json({ message: 'Custom split percentages must total exactly 100%' });
      }
      for (const jar of jars) {
        if (customSplit[jar] < 0 || customSplit[jar] > 100) {
          return res.status(400).json({ message: `Invalid percentage for ${jar}: must be 0-100` });
        }
      }
    }

    // Handle recurring tasks (frequency !== 'once')
    if (frequency && frequency !== 'once') {
      // Create recurring template
      const template = new ChoreTemplate({
        familyId: req.user.familyId,
        parent: req.user._id,
        user: child._id,
        name,
        description: description || '',
        points,
        frequency,
        category: 'other', // Default category
        nextInstanceDue: calculateNextDueDate(frequency, new Date()),
        useDefaultSplit: useDefaultSplit !== undefined ? useDefaultSplit : true,
        customSplit: customSplit || null
      });

      await template.save();

      // Create first instance
      const { createNextInstance } = require('../scripts/recurringTasksJob');
      const firstInstance = await createNextInstance(template, new Date());

      res.status(201).json({
        template,
        firstInstance,
        message: `Recurring ${frequency} task created successfully`
      });
      return;
    }

    // Handle one-time tasks (frequency === 'once' or undefined)
    const choreData = {
      parent: req.user._id,
      user: child._id,
      name,
      points,
      frequency: frequency || 'once'
    };

    // Add optional fields if provided
    if (description) choreData.description = description;
    if (deadline) choreData.deadline = new Date(deadline);
    if (useDefaultSplit !== undefined) choreData.useDefaultSplit = useDefaultSplit;
    if (customSplit) choreData.customSplit = customSplit;

    const chore = new Chore(choreData);
    await chore.save();
    res.status(201).json(chore);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PATCH /chores/:choreId -- allow parents to edit chores and kids to mark their own chores as completed
router.patch('/chores/:choreId', auth, sanitizeInput, async (req, res) => {
  try {
    const { choreId } = req.params;
    const update = req.body;
    const allowed = {};

    // Find the chore
    const chore = await Chore.findById(choreId);
    if (!chore) return res.status(404).json({ message: "Chore not found" });

    // Parents can update any chore for their children
    if (req.user.role === 'parent') {
      // Check if chore belongs to parent's family
      const choreOwner = await User.findById(chore.user);
      if (!choreOwner || choreOwner.familyId !== req.user.familyId) {
        return res.status(403).json({ message: "Not authorized to modify this chore" });
      }
      // Parents can update all fields: name, description, points, frequency, deadline, completed, completedAt, useDefaultSplit, customSplit
      if (update.name !== undefined) allowed.name = update.name;
      if (update.description !== undefined) allowed.description = update.description;
      if (update.points !== undefined) allowed.points = update.points;
      if (update.frequency !== undefined) allowed.frequency = update.frequency;
      if (update.deadline !== undefined) allowed.deadline = update.deadline;
      if (update.completed !== undefined) allowed.completed = update.completed;
      if (update.completedAt !== undefined) allowed.completedAt = update.completedAt;
      if (update.useDefaultSplit !== undefined) allowed.useDefaultSplit = update.useDefaultSplit;
      if (update.customSplit !== undefined) {
        // Validate customSplit if provided
        const customSplit = update.customSplit;
        const jars = ['current', 'save', 'spend', 'donate', 'invest'];
        const total = jars.reduce((sum, jar) => sum + (customSplit[jar] || 0), 0);
        if (total !== 100) {
          return res.status(400).json({ message: 'Custom split percentages must total exactly 100%' });
        }
        for (const jar of jars) {
          if (customSplit[jar] < 0 || customSplit[jar] > 100) {
            return res.status(400).json({ message: `Invalid percentage for ${jar}: must be 0-100` });
          }
        }
        allowed.customSplit = customSplit;
      }
    } else {
      // Kids can only update their own chores and only mark as completed
      if (!chore.user.equals(req.user._id)) {
        return res.status(403).json({ message: "Not authorized to modify this chore" });
      }
      // Kids can only mark chores as completed, not uncompleted
      if (update.completed === false) {
        return res.status(403).json({ message: "You can only mark chores as completed" });
      }
      // Allow updating completed and completedAt fields for kids
      if (update.completed !== undefined) allowed.completed = update.completed;
      if (update.completedAt !== undefined) allowed.completedAt = update.completedAt;
      if (update.completed === true) {
        allowed.status = 'pending'; // Set status to pending when child marks as completed

        // Create approval request for chore completion (if not auto-approved)
        try {
          const childUser = await User.findById(req.user._id);
          const primaryCaregiver = childUser.caregivers && childUser.caregivers.length > 0 ? childUser.caregivers[0] : null;

          if (primaryCaregiver) {
            // Check for auto-approval
            let autoApproved = false;
            const parent = await User.findOne({ id: primaryCaregiver.userId });
            let autoApprovalRules = (parent && parent.autoApprovalRules) || childUser.autoApprovalRules || {};
            const choreClaimMax = autoApprovalRules.choreClaimMax;

            if (typeof choreClaimMax === 'number' && choreClaimMax >= 0 && chore.points <= choreClaimMax) {
              // Auto-approve immediately
              allowed.completed = true;
              allowed.approved = true;
              allowed.approvedAt = new Date();
              allowed.status = 'completed'; // Override to completed for auto-approved

              // Award points
              const split = childUser.defaultSplit || { current: 100, save: 0, spend: 0, donate: 0, invest: 0 };
              const jarFieldMap = {
                current: 'currentPoints',
                save: 'savePoints',
                spend: 'spendPoints',
                donate: 'donatePoints',
                invest: 'investPoints'
              };
              for (const [jar, pct] of Object.entries(split)) {
                if (pct > 0) {
                  const awarded = Math.round((chore.points * pct) / 100);
                  if (awarded > 0 && jarFieldMap[jar]) {
                    childUser[jarFieldMap[jar]] = (childUser[jarFieldMap[jar]] || 0) + awarded;
                  }
                }
              }
              await childUser.save();

              // Create transaction
              const txn = new Transaction({
                type: 'chore-completed',
                description: `Auto-approved chore "${chore.name}" for ${chore.points} points`,
                amount: chore.points,
                toJar: 'current', // Default to current for now
                user: childUser._id,
                date: new Date().toLocaleString()
              });
              await txn.save();
              childUser.transactions.unshift(txn._id);
              await childUser.save();

              // Notify child
              await Notification.create({
                familyId: childUser.familyId,
                userId: req.user.id,
                type: 'chore_auto_approved',
                message: `Your chore "${chore.name}" was auto-approved!`,
                isRead: false
              });

              autoApproved = true;
            }

            if (!autoApproved) {
              // Create approval request
              const approvalRequest = new (require('../models/ApprovalRequest'))({
                familyId: childUser.familyId,
                childId: req.user.id,
                parentId: parentId,
                type: 'chore',
                name: `Chore: ${chore.name}`,
                amount: chore.points,
                status: 'Pending',
                choreId: chore._id.toString(),
                createdAt: new Date()
              });
              await approvalRequest.save();

              // Notify parent
              await Notification.create({
                familyId: childUser.familyId,
                userId: parentId,
                type: 'request_submitted',
                message: `New chore completion request from ${childUser.name || req.user.id}.`,
                referenceId: approvalRequest._id,
                isRead: false
              });
            }
          }
        } catch (approvalError) {
          console.error('Error creating chore approval request:', approvalError);
          // Continue with the chore update even if approval creation fails
        }
      }
    }

    Object.assign(chore, allowed, { updatedAt: new Date() });
    await chore.save();
    res.json(chore);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Request routes
router.get('/requests/:userId', async (req, res) => {
  try {
    const ApprovalRequest = require('../models/ApprovalRequest');
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const result = await ApprovalRequest.find({
      childId: req.params.userId,
      $or: [
        { createdAt: { $gte: thirtyDaysAgo } },
        { actedAt: { $gte: thirtyDaysAgo } },
        { updatedAt: { $gte: thirtyDaysAgo } }
      ]
    }).sort({ createdAt: -1 });
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/requests', auth, requireParent, async (req, res) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const statusFilter = req.query.status;
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Build query
    let query = {
      familyId: req.user.familyId,
      $or: [
        { createdAt: { $gte: thirtyDaysAgo } },
        { actedAt: { $gte: thirtyDaysAgo } },
        { updatedAt: { $gte: thirtyDaysAgo } }
      ]
    };
    if (statusFilter && statusFilter !== 'all') {
      if (statusFilter === 'pending') query.status = 'Pending';
      else if (statusFilter === 'approved') query.status = 'Approved';
      else if (statusFilter === 'denied') query.status = 'Denied';
    }

    // Total count for pagination
    const ApprovalRequest = require('../models/ApprovalRequest');
    const User = require('../models/User');
    const totalRequests = await ApprovalRequest.countDocuments(query);

    const requests = await ApprovalRequest.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const usersById = {};
    const childIds = Array.from(new Set(requests.map(r => r.childId)));
    const foundUsers = await User.find({ id: { $in: childIds } }, 'id name');
    foundUsers.forEach(u => { usersById[u.id] = u.name; });

    const enriched = requests.map(req => ({
      ...req.toObject(),
      userName: usersById[req.childId] || 'Unknown User'
    }));

    res.json({
      requests: enriched,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalRequests / limit),
        totalRequests,
        hasNextPage: page < Math.ceil(totalRequests / limit),
        hasPrevPage: page > 1,
        limit
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/requests', auth, sanitizeInput, async (req, res) => {
  try {
    const { userId, note } = req.body;
    const childUser = await User.findOne({ id: userId });
    if (!childUser) return res.status(404).json({ message: 'Child user not found' });
    const primaryCaregiver = childUser.caregivers && childUser.caregivers.length > 0 ? childUser.caregivers[0] : null;
    if (!primaryCaregiver) return res.status(400).json({ message: 'No caregiver for this user.' });

    // ---------------- AUTO-APPROVAL LOGIC for chores & point moves ----------------
    let parent = await User.findOne({ id: primaryCaregiver.userId });
    let autoApprovalRules = (parent && parent.autoApprovalRules) || childUser.autoApprovalRules || {};
    let type = req.body.type;
    let autoApproved = false;
    let autoApprovalStatusMessage = '';
    // Handle Chore Claim Auto-Approval
    if (type === 'chore' && typeof req.body.amount === 'number') {
      const choreClaimMax = autoApprovalRules.choreClaimMax;
      if (typeof choreClaimMax === 'number' && choreClaimMax >= 0 && req.body.amount <= choreClaimMax) {
        // Instantly fulfill as approved
        // 1. Add points to jars (defaultSplit if set)
        const amount = req.body.amount;
        const split = childUser.defaultSplit || { current: 100, save: 0, spend: 0, donate: 0, invest: 0 };
        const jarFieldMap = {
          current: 'currentPoints',
          save: 'savePoints',
          spend: 'spendPoints',
          donate: 'donatePoints',
          invest: 'investPoints'
        };
        for (const [jar, pct] of Object.entries(split)) {
          if (pct > 0) {
            const awarded = Math.round((amount * pct) / 100);
            if (awarded > 0 && jarFieldMap[jar]) {
              childUser[jarFieldMap[jar]] = (childUser[jarFieldMap[jar]] || 0) + awarded;
              // Create transaction for this jar
              const txn = new Transaction({
                type: 'chore-completed',
                description: `Auto-approved chore - ${awarded} points to ${jar} jar`,
                amount: awarded,
                toJar: jar,
                user: childUser._id,
                date: new Date().toLocaleString()
              });
              txn.save(); // No need to await all
              childUser.transactions = childUser.transactions || [];
              childUser.transactions.unshift(txn._id);
            }
          }
        }
        await childUser.save();
        // Optionally, update referenced Chore doc as approved
        if (req.body.choreId) {
          const Chore = require('../models/Chore');
          const chore = await Chore.findById(req.body.choreId);
          if (chore) {
            chore.completed = true;
            chore.approved = true;
            chore.approvedAt = new Date();
            await chore.save();
          }
        }
        // Notify child
        await Notification.create({
          familyId: childUser.familyId,
          userId: userId,
          type: 'chore_auto_approved',
          message: `Your chore claim for ${amount} points was auto-approved!`,
          isRead: false
        });
        res.status(200).json({ message: "Chore auto-approved!", autoApproved: true });
        return;
      }
    }

    // Handle Goal Claim (goal-completion) Auto-Approval
    if (type === 'goal-completion' && typeof req.body.amount === 'number' && typeof req.body.goalId === 'string') {
      const rewardClaimMax = autoApprovalRules.rewardClaimMax;
      if (typeof rewardClaimMax === 'number' && rewardClaimMax >= 0 && req.body.amount <= rewardClaimMax) {
        const Goal = require('../models/Goal');
        let goal = await Goal.findById(req.body.goalId);
        if (!goal) {
          res.status(400).json({ message: "Invalid goalId" });
          return;
        }
        const jar = goal.jar || "current";
        const pointsField = jar + "Points";
        const amount = req.body.amount;
        if (typeof childUser[pointsField] !== "number" || childUser[pointsField] < amount) {
          res.status(400).json({ message: `Not enough points in ${jar} jar to claim goal.` });
          return;
        }

        // Deduct points and complete goal
        childUser[pointsField] -= amount;
        await childUser.save();

        goal.status = 'completed';
        goal.achieved = true;
        goal.achievedAt = new Date();
        goal.updatedAt = new Date();
        await goal.save();

        // Record transaction
        const txn = new Transaction({
          type: 'goal-completion',
          description: `Auto-approved goal "${goal.name}" completion, ${amount} points from ${jar}`,
          amount: -amount,
          user: childUser._id,
          toJar: jar,
          reference: goal._id,
          date: new Date().toLocaleString()
        });
        await txn.save();
        childUser.transactions = childUser.transactions || [];
        childUser.transactions.unshift(txn._id);
        await childUser.save();

        // Notify child
        await Notification.create({
          familyId: childUser.familyId,
          userId: userId,
          type: 'goal_auto_approved',
          message: `Your goal claim for "${goal.name}" was auto-approved!`,
          isRead: false
        });
        res.status(200).json({ message: "Goal claim auto-approved!", autoApproved: true });
        return;
      }
    }

    // Handle Point Move (pot transfer) Auto-Approval
    if ((type === 'move-points' || type === 'points-move') && typeof req.body.amount === 'number') {
      const pointMoveMax = autoApprovalRules.pointMoveMax;
      console.log('[AUTO-APPROVE:MovePoints] Incoming:', {
        type, amount: req.body.amount, pointMoveMax, from: req.body.from, to: req.body.to,
        userPoints: {
          current: childUser.currentPoints,
          save: childUser.savePoints,
          spend: childUser.spendPoints,
          donate: childUser.donatePoints,
          invest: childUser.investPoints
        }
      });
      if (typeof pointMoveMax === 'number' && pointMoveMax >= 0 && req.body.amount <= pointMoveMax) {
        // Instantly transfer points (assuming req.body.from, req.body.to)
        const from = req.body.from, to = req.body.to, amount = req.body.amount;
        const fromField = from + 'Points', toField = to + 'Points';
        console.log('[AUTO-APPROVE:MovePoints] Field resolution:', { fromField, toField });
        if (childUser[fromField] !== undefined && childUser[toField] !== undefined && childUser[fromField] >= amount) {
          console.log('[AUTO-APPROVE:MovePoints] Success branch for auto-approval.');
          childUser[fromField] -= amount;
          childUser[toField] += amount;
          await childUser.save();
          // Create transaction
          const txn = new Transaction({
            type: 'points-move',
            description: `Auto-approved points move: ${amount} from ${from} to ${to}`,
            amount: amount,
            user: childUser._id,
            date: new Date().toLocaleString()
          });
          await txn.save();
          childUser.transactions = childUser.transactions || [];
          childUser.transactions.unshift(txn._id);
          await childUser.save();
          // Notify child
          await Notification.create({
            familyId: childUser.familyId,
            userId: userId,
            type: 'move_auto_approved',
            message: `Your move of ${amount} points from ${from} to ${to} was auto-approved!`,
            isRead: false
          });
          res.status(200).json({ message: "Point move auto-approved!", autoApproved: true });
          return;
        } else {
          console.log('[AUTO-APPROVE:MovePoints] Not enough points or field mismatch:', {
            fromVal: childUser[fromField], toVal: childUser[toField],
          });
        }
      } else {
        console.log('[AUTO-APPROVE:MovePoints] Did not meet threshold for auto-approval.');
      }
    }
    // ---------------- END AUTO-APPROVAL LOGIC ----------------

    // For goal-completion requests, reserve points and update goal status to pending
    if (req.body.type === 'goal-completion' && req.body.goalId) {
      const Goal = require('../models/Goal');
      const goal = await Goal.findById(req.body.goalId);
      if (goal) {
        // Reserve points in the appropriate pending field
        const jar = goal.jar || 'current';
        const pointsField = jar + 'Points';
        const pendingField = 'pending' + jar.charAt(0).toUpperCase() + jar.slice(1) + 'Points';
        const availablePoints = (childUser[pointsField] || 0) - (childUser[pendingField] || 0);

        if (availablePoints < req.body.amount) {
          res.status(400).json({ message: `Not enough available points in ${jar} jar to claim this goal.` });
          return;
        }

        // Atomically reserve points
        const updatedUser = await User.findOneAndUpdate(
          { _id: childUser._id },
          { $inc: { [pendingField]: req.body.amount } },
          { new: true }
        );

        if (!updatedUser) {
          res.status(500).json({ message: 'Failed to reserve points for goal claim.' });
          return;
        }

        goal.status = 'pending';
        await goal.save();
      }
    }

    // For chore requests, update chore status to pending
    if (req.body.type === 'chore' && req.body.choreId) {
      const Chore = require('../models/Chore');
      const chore = await Chore.findById(req.body.choreId);
      if (chore) {
        chore.status = 'pending';
        await chore.save();
      }
    }

    const approvalRequest = new (require('../models/ApprovalRequest'))({
      ...req.body,
      familyId: childUser.familyId,
      childId: userId,
      parentId: primaryCaregiver.userId, // Use primary caregiver
      caregiverId: primaryCaregiver.userId, // New field for clarity
      status: 'Pending',
      createdAt: new Date()
    });

    // Add initial child note as first message if provided
    if (note && note.trim()) {
      approvalRequest.messages.push({
        sender: 'child',
        userId: userId,
        text: note.trim(),
        timestamp: new Date()
      });
    }

    await approvalRequest.save();

    // Notify parent on approval request submission
    await Notification.create({
      familyId: childUser.familyId,
      userId: parentId,
      type: 'request_submitted',
      message: `New request submitted by ${childUser.name || userId}.`,
      referenceId: approvalRequest._id,
      isRead: false
    });

    res.status(201).json(approvalRequest);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/requests/:requestId', auth, requireParent, async (req, res) => {
  try {
    const { status, parentComment } = req.body;
    const ApprovalRequest = require('../models/ApprovalRequest');
    const approval = await ApprovalRequest.findById(req.params.requestId);
    if (!approval) return res.status(404).json({ message: 'Request not found' });
    console.log("DEBUG: PUT /requests/:requestId", { statusFromFrontend: status, approvalType: approval.type, approvalStatus: approval.status, requestId: approval._id });
    console.log("DEBUG: Approving type:", approval.type, "RequestID:", approval._id);

    // Check that the request belongs to the authenticated parent's family
    if (approval.familyId !== req.user.familyId) {
      return res.status(403).json({ message: 'Not authorized to modify this request' });
    }

    // Only allow updating if the request is still pending
    if (approval.status !== 'Pending') {
      return res.status(400).json({ message: 'Request has already been processed' });
    }

    // Only allow messaging if status is changing from 'Pending'
    if (parentComment && parentComment.trim() && approval.status === 'Pending' && (status === 'Approved' || status === 'Denied')) {
      approval.messages.push({
        sender: 'parent',
        userId: req.user.id,
        text: parentComment.trim(),
        timestamp: new Date()
      });
    }

    approval.status = status;
    approval.updatedAt = new Date();
    approval.actedBy = req.user.id;
    approval.actedAt = new Date();

    await approval.save();

    // Notify kid on parent action (approve/deny)
    if (status === 'Approved' || status === 'Denied') {
      const notificationType = status === 'Approved' ? 'request_approved' : 'request_denied';
      const notificationMessage = status === 'Approved'
        ? 'Your request was approved by your parent.'
        : 'Your request was denied by your parent.';
      await Notification.create({
        familyId: approval.familyId,
        userId: approval.childId,
        type: notificationType,
        message: notificationMessage,
        referenceId: approval._id,
        isRead: false
      });
    }

    // If approved, process the request
    if (status === 'Approved' && (approval.type === 'move-points' || approval.type === 'points-move')) {
      const user = await User.findOne({ id: approval.childId });
      if (user && approval.from && approval.to && user[approval.from + 'Points'] !== undefined && user[approval.to + 'Points'] !== undefined && user[approval.from + 'Points'] >= approval.amount) {
        user[approval.from + 'Points'] -= approval.amount;
        user[approval.to + 'Points'] += approval.amount;
        const txn = new Transaction({
          type: 'points-move',
          description: `Moved ${approval.amount} points from ${approval.from} to ${approval.to} (Parent Approved Request)`,
          amount: approval.amount,
          user: user._id,
          date: new Date().toLocaleString(),
        });
        await txn.save();
        user.transactions.unshift(txn._id);
        await user.save();
      }
    }

    if (status === 'Approved' && approval.type === 'points') {
      const user = await User.findOne({ id: approval.childId });
      if (user) {
        user.currentPoints = (user.currentPoints || 0) + (approval.amount || 0);
        const txn = new Transaction({
          type: 'points-request',
          description: `Parent approved ${approval.amount} points (Request)`,
          amount: approval.amount,
          user: user._id,
          date: new Date().toLocaleString(),
        });
        await txn.save();
        user.transactions.unshift(txn._id);
        await user.save();
      }
    }

    if (status === 'Approved' && approval.type === 'reward') {
      const user = await User.findOne({ id: approval.childId });
      const RewardModel = require('../models/Reward');
      if (user) {
        // Deduct from both pendingCurrentPoints and currentPoints atomically
        const rewardDoc = approval.rewardId
          ? await RewardModel.findById(approval.rewardId)
          : await RewardModel.findOne({ name: approval.name, user: user._id });
        const cost = approval.amount;
        if ((user.currentPoints || 0) < cost) {
          return res.status(400).json({ message: 'Not enough points to fulfill this reward request at approval time.' });
        }

        // Atomically deduct from both pending and actual points
        const updatedUser = await User.findOneAndUpdate(
          { _id: user._id },
          {
            $inc: {
              currentPoints: -cost,
              pendingCurrentPoints: -cost
            }
          },
          { new: true }
        );

        if (!updatedUser) {
          return res.status(500).json({ message: 'Failed to update points for reward approval.' });
        }

        const txn = new Transaction({
          type: 'reward-purchase',
          description: `Bought "${approval.name}"`,
          amount: -cost,
          user: user._id,
          date: new Date().toLocaleString(),
        });
        await txn.save();
        updatedUser.transactions.unshift(txn._id);
        await updatedUser.save();

        // Update reward fulfillment and status
        if (rewardDoc) {
          rewardDoc.completed = true;
          rewardDoc.approved = true;
          rewardDoc.approvedAt = new Date();
          rewardDoc.purchased = true;
          rewardDoc.purchasedAt = new Date();
          rewardDoc.status = 'claimed'; // Update status to claimed
          await rewardDoc.save();
        }
      }
    }

    // If approved and chore-completion, award points and mark chore as approved
    if (status === 'Approved' && approval.type === 'chore') {
      const Chore = require('../models/Chore');
      const User = require('../models/User');
      if (!approval.choreId) {
        console.error('DEBUG: ApprovalRequest is missing choreId field for request:', approval._id);
        return res.status(400).json({ message: "ApprovalRequest for chore approval is missing choreId." });
      }
      const chore = await Chore.findById(approval.choreId);
      if (!chore) {
        console.error('DEBUG: No Chore found with id:', approval.choreId, 'for ApprovalRequest:', approval._id);
        return res.status(400).json({ message: `Could not find matching Chore (${approval.choreId}) for approval.` });
      }
      // Find child user
      const user = await User.findOne({ id: approval.childId });
      if (!user) {
        console.error('DEBUG: No User found with id:', approval.childId, 'for ApprovalRequest:', approval._id);
        return res.status(400).json({ message: "Could not find child user for chore completion." });
      }

      const pointsToAward = approval.amount || chore.points || 0;

      // Determine split configuration
      let splitConfig = null;
      if (chore.useDefaultSplit && user.defaultSplit) {
        // Use family default split
        splitConfig = user.defaultSplit;
      } else if (!chore.useDefaultSplit && chore.customSplit) {
        // Use chore-specific custom split
        splitConfig = chore.customSplit;
      } else {
        // Fallback to 100% current (Pocket Money) for backward compatibility
        splitConfig = { current: 100, save: 0, spend: 0, donate: 0, invest: 0 };
      }

      // Create transactions for each jar with points
      const jarFieldMap = {
        current: 'currentPoints',
        save: 'savePoints',
        spend: 'spendPoints',
        donate: 'donatePoints',
        invest: 'investPoints'
      };

      const transactions = [];
      for (const [jar, percentage] of Object.entries(splitConfig)) {
        if (percentage > 0) {
          const pointsForJar = Math.round((pointsToAward * percentage) / 100);
          if (pointsForJar > 0) {
            // Update user's jar points
            const fieldName = jarFieldMap[jar];
            user[fieldName] = (user[fieldName] || 0) + pointsForJar;

            // Create transaction for this jar
            const txn = new Transaction({
              type: 'chore-completed',
              description: `Parent approved chore completion: "${chore.name}" - ${pointsForJar} points to ${jar} jar`,
              amount: pointsForJar,
              toJar: jar,
              user: user._id,
              reference: chore._id,
              date: new Date().toLocaleString(),
            });
            await txn.save();
            transactions.push(txn._id);
          }
        }
      }

      // Save user with updated points
      await user.save();

      // Add all transaction IDs to user's transactions array
      user.transactions.unshift(...transactions);
      await user.save();

      console.log('RECENT_ADVENTURES_LOG: Created', transactions.length, 'transactions for chore approval:', transactions.map(t => ({ id: t._id, type: t.type, amount: t.amount, description: t.description })));

      // Mark chore as approved and set status to completed
      chore.completed = true;
      chore.approved = true;
      chore.approvedAt = new Date();
      chore.status = 'completed';
      await chore.save();
      console.log('DEBUG: Chore approved now set to', chore.approved, 'and status', chore.status, 'for Chore', chore._id);
    }

    // If approved and goal-completion, check points, deduct, set goal status to 'completed'
    if (status === 'Approved' && approval.type === 'goal-completion') {
      const Goal = require('../models/Goal');
      const User = require('../models/User');
      if (approval.goalId) {
        const goal = await Goal.findById(approval.goalId);
        if (goal) {
          // Find child user
          const user = await User.findOne({ id: approval.childId });
          if (!user) {
            return res.status(400).json({ message: "Could not find child user for goal completion." });
          }
          // Determine which jar is required and how much
          const jar = goal.jar;
          const pointsField = jar + "Points";
          const pendingField = 'pending' + jar.charAt(0).toUpperCase() + jar.slice(1) + 'Points';
          const target = goal.targetAmount || approval.amount || 0;
          if (!user[pointsField] || user[pointsField] < target) {
            // Reset goal status back to 'active' so child can try again
            goal.status = 'active';
            await goal.save();

            return res.status(400).json({
              message: `Not enough points in ${jar} jar for goal completion. The child needs ${target - (user[pointsField] || 0)} more points. Goal has been reset to active status.`
            });
          }

          // Atomically deduct from both pending and actual points
          const updatedUser = await User.findOneAndUpdate(
            { _id: user._id },
            {
              $inc: {
                [pointsField]: -target,
                [pendingField]: -target
              }
            },
            { new: true }
          );

          if (!updatedUser) {
            return res.status(500).json({ message: 'Failed to update points for goal approval.' });
          }

          goal.status = 'completed'; // Mark as completed/claimed
          goal.achieved = true;
          goal.achievedAt = new Date();
          goal.updatedAt = new Date();
          await goal.save();

          // Create transaction for goal completion
          const txn = new Transaction({
            type: 'goal-completion',
            description: `Parent approved goal "${goal.name}" completion, ${target} points from ${jar}`,
            amount: -target,
            user: user._id,
            toJar: jar,
            reference: goal._id,
            date: new Date().toLocaleString()
          });
          await txn.save();
          updatedUser.transactions = updatedUser.transactions || [];
          updatedUser.transactions.unshift(txn._id);
          await updatedUser.save();
        }
      }
    }
    // If denied and reward, reset reward availability and status, and refund pending points
    if (status === 'Denied' && approval.type === 'reward') {
      console.log('DEBUG: Inside reward deny handler.', { status, approvalType: approval.type, approvalId: approval._id });
      const RewardModel = require('../models/Reward');
      console.log('DEBUG Deny Reward:', { rewardId: approval.rewardId, approvalId: approval._id });
      if (approval.rewardId) {
        const reward = await RewardModel.findById(approval.rewardId);
        if (reward) {
          reward.available = true;
          reward.purchased = false;
          reward.status = 'active'; // Reset status to active so child can try again
          await reward.save();
          console.log('DEBUG Deny Reward - updated:', { _id: reward._id, available: reward.available, purchased: reward.purchased, status: reward.status });

          // Refund pending points
          const childUser = await User.findOne({ id: approval.childId });
          if (childUser) {
            await User.findOneAndUpdate(
              { _id: childUser._id },
              { $inc: { pendingCurrentPoints: -approval.amount } },
              { new: true }
            );
          }
        } else {
          console.log('DEBUG Deny Reward - reward not found:', approval.rewardId);
        }
      } else {
        console.log('DEBUG Deny Reward - approval.rewardId is missing.', approval._id);
      }
    }

    // If denied and goal-completion, reset goal status to 'active' and refund pending points
    if (status === 'Denied' && approval.type === 'goal-completion') {
      const Goal = require('../models/Goal');
      if (approval.goalId) {
        const goal = await Goal.findById(approval.goalId);
        if (goal) {
          goal.status = 'active'; // Reset to active so child can try again
          await goal.save();

          // Refund pending points
          const childUser = await User.findOne({ id: approval.childId });
          if (childUser && goal.jar) {
            const pendingField = 'pending' + goal.jar.charAt(0).toUpperCase() + goal.jar.slice(1) + 'Points';
            await User.findOneAndUpdate(
              { _id: childUser._id },
              { $inc: { [pendingField]: -approval.amount } },
              { new: true }
            );
          }
        }
      }
    }

    res.json(approval);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Child-specific endpoint for viewing their own requests
router.get('/my-requests', auth, async (req, res) => {
  try {
    // Only allow children to access their own requests
    if (req.user.role !== 'child') {
      return res.status(403).json({ message: 'This endpoint is only for children' });
    }

    const ApprovalRequest = require('../models/ApprovalRequest');
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get requests where childId matches the authenticated child's userId
    const requests = await ApprovalRequest.find({
      childId: req.user.id,
      $or: [
        { createdAt: { $gte: thirtyDaysAgo } },
        { actedAt: { $gte: thirtyDaysAgo } },
        { updatedAt: { $gte: thirtyDaysAgo } }
      ]
    }).sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error('Error fetching child requests:', error);
    res.status(500).json({ message: error.message });
  }
});

// Send message on existing request without changing status
router.post('/requests/:requestId/messages', auth, validateMessage, async (req, res) => {
  try {
    const { text } = req.body;
    const ApprovalRequest = require('../models/ApprovalRequest');
    const approval = await ApprovalRequest.findById(req.params.requestId);

    if (!approval) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Check that the request belongs to the authenticated user's family
    if (approval.familyId !== req.user.familyId) {
      return res.status(403).json({ message: 'Not authorized to modify this request' });
    }

    // Validate message text
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Message text is required' });
    }

    // Determine sender type and userId
    const sender = req.user.role === 'parent' ? 'parent' : 'child';
    const userId = req.user.id;

    // Add message to the request
    approval.messages.push({
      sender,
      userId,
      text: text.trim(),
      timestamp: new Date()
    });

    approval.updatedAt = new Date();
    await approval.save();

    // Create notification for the other party
    const notificationUserId = sender === 'parent' ? approval.childId : approval.parentId;
    const notificationMessage = sender === 'parent'
      ? 'Your parent sent you a message about your request.'
      : 'Your child sent you a message about their request.';

    await Notification.create({
      familyId: approval.familyId,
      userId: notificationUserId,
      type: 'request_message',
      message: notificationMessage,
      referenceId: approval._id,
      isRead: false
    });

    res.status(201).json({
      message: 'Message sent successfully',
      newMessage: approval.messages[approval.messages.length - 1]
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Achievement routes
router.get('/achievements/:userId', auth, async (req, res) => {
  try {
    // Find user by custom ID to get MongoDB ObjectId
    const user = await User.findOne({ id: req.params.userId });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const achievements = await Achievement.find({ user: user._id })
      .sort({ completed: 1, createdAt: -1 });
    res.json(achievements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/achievements/:userId/initialize', auth, async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findOne({ id: userId });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Create default achievements
    const defaultAchievements = [
      {
        type: 'points_saved',
        title: 'First Savings',
        description: 'Save your first 100 points',
        icon: '💰',
        target: 100
      },
      {
        type: 'chores_completed',
        title: 'Chore Champion',
        description: 'Complete 10 chores',
        icon: '🧹',
        target: 10
      },
      {
        type: 'goals_achieved',
        title: 'Goal Getter',
        description: 'Complete 5 savings goals',
        icon: '🎯',
        target: 5
      },
      {
        type: 'learning_streak',
        title: 'Learning Streak',
        description: 'Learn for 7 days in a row',
        icon: '🔥',
        target: 7
      },
      {
        type: 'quiz_master',
        title: 'Quiz Master',
        description: 'Answer 20 quiz questions correctly',
        icon: '🧠',
        target: 20
      }
    ];

    const achievements = [];
    for (const achievementData of defaultAchievements) {
      const achievement = await Achievement.getOrCreate(
        user._id,
        achievementData.type,
        achievementData.target,
        achievementData.title,
        achievementData.description,
        achievementData.icon
      );
      achievements.push(achievement);
    }

    res.json(achievements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch('/achievements/:achievementId/progress', auth, async (req, res) => {
  try {
    const { progress, streakData } = req.body;
    const achievement = await Achievement.findById(req.params.achievementId);

    if (!achievement) return res.status(404).json({ message: 'Achievement not found' });

    const updatedAchievement = await achievement.updateProgress(progress, streakData);
    res.json(updatedAchievement);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/achievements/:userId/streak', auth, async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findOne({ id: userId });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Find or create learning streak achievement
    const achievement = await Achievement.getOrCreate(
      user._id,
      'learning_streak',
      7,
      'Learning Streak',
      'Learn for 7 days in a row',
      '🔥'
    );

    // Update streak
    const updatedAchievement = await achievement.updateProgress(
      achievement.progress,
      { current: (achievement.streakCount || 0) + 1 }
    );

    res.json(updatedAchievement);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/achievements/:userId/check-milestones', auth, async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findOne({ id: userId });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Check various milestones
    const totalPoints = (user.currentPoints || 0) + (user.savePoints || 0) +
                       (user.spendPoints || 0) + (user.donatePoints || 0) + (user.investPoints || 0);

    // Update points saved achievement
    const pointsAchievement = await Achievement.getOrCreate(
      user._id, 'points_saved', 100, 'First Savings', 'Save your first 100 points', '💰'
    );
    await pointsAchievement.updateProgress(totalPoints);

    // Count completed chores
    const completedChores = await Chore.countDocuments({
      user: user._id,
      completed: true
    });

    const choreAchievement = await Achievement.getOrCreate(
      user._id, 'chores_completed', 10, 'Chore Champion', 'Complete 10 chores', '🧹'
    );
    await choreAchievement.updateProgress(completedChores);

    // Count completed goals
    const completedGoals = await Goal.countDocuments({
      user: user._id,
      status: 'completed'
    });

    const goalAchievement = await Achievement.getOrCreate(
      user._id, 'goals_achieved', 5, 'Goal Getter', 'Complete 5 savings goals', '🎯'
    );
    await goalAchievement.updateProgress(completedGoals);

    res.json({ message: 'Milestones checked and updated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Parent Milestone routes for family coaching features
router.get('/parent-milestones/:parentId/:childId', auth, requireParent, async (req, res) => {
  try {
    const { parentId, childId } = req.params;

    // Verify parent authorization
    if (req.user.id !== parentId) {
      return res.status(403).json({ message: 'Not authorized to view these milestones' });
    }

    // Verify child belongs to parent's family
    const child = await User.findOne({ id: childId });
    if (!child || child.familyId !== req.user.familyId) {
      return res.status(404).json({ message: 'Child not found in your family' });
    }

    // Return milestones from child's milestones array
    const milestones = child.milestones || [];
    res.json(milestones);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/parent-milestones/:parentId/:childId', auth, requireParent, sanitizeInput, async (req, res) => {
  try {
    const { parentId, childId } = req.params;
    const { milestoneId, title, achieved, progress, date, category, familyId } = req.body;

    // Verify parent authorization
    if (req.user.id !== parentId) {
      return res.status(403).json({ message: 'Not authorized to update milestones' });
    }

    // Verify child belongs to parent's family
    const child = await User.findOne({ id: childId });
    if (!child || child.familyId !== req.user.familyId) {
      return res.status(404).json({ message: 'Child not found in your family' });
    }

    // Initialize milestones array if it doesn't exist
    if (!child.milestones) {
      child.milestones = [];
    }

    // Find or create milestone
    let milestone = child.milestones.find(m => m.milestoneId === milestoneId);
    if (!milestone) {
      milestone = {
        milestoneId,
        title: title || 'Unknown Milestone',
        description: '',
        category: category || 'general',
        achieved: false,
        progress: 0,
        maxProgress: 1,
        achievedAt: null,
        updatedAt: new Date()
      };
      child.milestones.push(milestone);
    }

    // Update milestone data
    if (achieved !== undefined) milestone.achieved = achieved;
    if (progress !== undefined) milestone.progress = progress;
    if (date && achieved) milestone.achievedAt = new Date(date);
    milestone.updatedAt = new Date();

    // Save child with updated milestones
    await child.save();

    res.json({
      message: 'Milestone updated successfully',
      milestone: milestone
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Family Discussion routes
router.get('/family-discussions/:familyId', auth, requireParent, async (req, res) => {
  try {
    const { familyId } = req.params;

    // Verify parent has access to this family
    if (req.user.familyId !== familyId) {
      return res.status(403).json({ message: 'Not authorized to view discussions for this family' });
    }

    const discussions = await FamilyDiscussion.find({
      familyId: req.user.familyId,
      parentId: req.user._id
    })
    .populate('childId', 'name')
    .sort({ discussionDate: -1 })
    .limit(20);

    res.json(discussions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/family-discussions', auth, requireParent, sanitizeInput, async (req, res) => {
  try {
    const {
      childId,
      topic,
      customTopic,
      duration,
      participants,
      keyLearnings,
      actionItems,
      mood,
      notes,
      nextDiscussionDate
    } = req.body;

    // Verify child belongs to parent's family
    const child = await User.findOne({ id: childId });
    if (!child || child.familyId !== req.user.familyId) {
      return res.status(404).json({ message: 'Child not found in your family' });
    }

    const discussion = new FamilyDiscussion({
      familyId: req.user.familyId,
      parentId: req.user._id,
      childId: child._id,
      topic,
      customTopic,
      duration: duration || 15,
      participants: participants || [{
        userId: req.user._id,
        role: 'parent',
        attended: true
      }, {
        userId: child._id,
        role: 'child',
        attended: true
      }],
      keyLearnings,
      actionItems,
      mood,
      notes,
      nextDiscussionDate: nextDiscussionDate ? new Date(nextDiscussionDate) : null
    });

    const savedDiscussion = await discussion.save();
    const populatedDiscussion = await FamilyDiscussion.findById(savedDiscussion._id)
      .populate('childId', 'name');

    res.status(201).json(populatedDiscussion);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.patch('/family-discussions/:discussionId', auth, requireParent, sanitizeInput, async (req, res) => {
  try {
    const { discussionId } = req.params;
    const update = req.body;

    const discussion = await FamilyDiscussion.findById(discussionId);
    if (!discussion) {
      return res.status(404).json({ message: 'Discussion not found' });
    }

    // Verify ownership
    if (!discussion.parentId.equals(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to update this discussion' });
    }

    Object.assign(discussion, update, { updatedAt: new Date() });
    await discussion.save();

    const updatedDiscussion = await FamilyDiscussion.findById(discussionId)
      .populate('childId', 'name');

    res.json(updatedDiscussion);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/family-discussions/:discussionId', auth, requireParent, async (req, res) => {
  try {
    const { discussionId } = req.params;

    const discussion = await FamilyDiscussion.findById(discussionId);
    if (!discussion) {
      return res.status(404).json({ message: 'Discussion not found' });
    }

    // Verify ownership
    if (!discussion.parentId.equals(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to delete this discussion' });
    }

    await FamilyDiscussion.findByIdAndDelete(discussionId);

    res.json({ message: 'Discussion deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete discussion', error: error.message });
  }
});

// Family Timeline routes
router.get('/family-timeline/:familyId/:childId', auth, requireParent, async (req, res) => {
  try {
    const { familyId, childId } = req.params;

    // Verify parent has access to this family
    if (req.user.familyId !== familyId) {
      return res.status(403).json({ message: 'Not authorized to view timeline for this family' });
    }

    // Verify child belongs to parent's family
    const child = await User.findOne({ id: childId });
    if (!child || child.familyId !== req.user.familyId) {
      return res.status(404).json({ message: 'Child not found in your family' });
    }

    let timeline = await FamilyTimeline.findOne({
      familyId: req.user.familyId,
      childId: child._id,
      parentId: req.user._id
    });

    // If no timeline exists, create a default one
    if (!timeline) {
      timeline = new FamilyTimeline({
        familyId: req.user.familyId,
        childId: child._id,
        parentId: req.user._id,
        timeline: [],
        currentProjection: {
          childAge: child.userLevel || 8, // Default age estimate
          monthlySavings: 100, // Default monthly savings
          annualGrowth: 0.05,
          targetAmount: 50000, // Default education goal
          yearsToTarget: 10
        }
      });
      await timeline.save();
    }

    res.json(timeline);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/family-timeline/:familyId/:childId', auth, requireParent, sanitizeInput, async (req, res) => {
  try {
    const { familyId, childId } = req.params;
    const { title, description, timeline, currentProjection, familyWisdom } = req.body;

    // Verify parent has access to this family
    if (req.user.familyId !== familyId) {
      return res.status(403).json({ message: 'Not authorized to create timeline for this family' });
    }

    // Verify child belongs to parent's family
    const child = await User.findOne({ id: childId });
    if (!child || child.familyId !== req.user.familyId) {
      return res.status(404).json({ message: 'Child not found in your family' });
    }

    const familyTimeline = new FamilyTimeline({
      familyId: req.user.familyId,
      childId: child._id,
      parentId: req.user._id,
      title: title || 'Our Family Money Journey',
      description: description || 'Tracking our family\'s financial milestones and achievements over time',
      timeline: timeline || [],
      currentProjection: currentProjection || {
        childAge: child.userLevel || 8,
        monthlySavings: 100,
        annualGrowth: 0.05,
        targetAmount: 50000,
        yearsToTarget: 10
      },
      familyWisdom: familyWisdom || []
    });

    const savedTimeline = await familyTimeline.save();
    res.status(201).json(savedTimeline);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.patch('/family-timeline/:timelineId', auth, requireParent, sanitizeInput, async (req, res) => {
  try {
    const { timelineId } = req.params;
    const update = req.body;

    const timeline = await FamilyTimeline.findById(timelineId);
    if (!timeline) {
      return res.status(404).json({ message: 'Timeline not found' });
    }

    // Verify ownership
    if (!timeline.parentId.equals(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to update this timeline' });
    }

    Object.assign(timeline, update, { updatedAt: new Date() });
    await timeline.save();

    res.json(timeline);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Dream Board routes
router.get('/dream-board/:familyId/:childId', auth, requireParent, async (req, res) => {
  try {
    const { familyId, childId } = req.params;

    // Verify parent has access to this family
    if (req.user.familyId !== familyId) {
      return res.status(403).json({ message: 'Not authorized to view dream board for this family' });
    }

    // Verify child belongs to parent's family
    const child = await User.findOne({ id: childId });
    if (!child || child.familyId !== req.user.familyId) {
      return res.status(404).json({ message: 'Child not found in your family' });
    }

    let dreamBoard = await DreamBoard.findOne({
      familyId: req.user.familyId,
      childId: child._id,
      parentId: req.user._id
    });

    // If no dream board exists, create a default one
    if (!dreamBoard) {
      dreamBoard = new DreamBoard({
        familyId: req.user.familyId,
        childId: child._id,
        parentId: req.user._id,
        items: [],
        familyContributions: []
      });
      await dreamBoard.save();
    }

    res.json(dreamBoard);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/dream-board/:familyId/:childId', auth, requireParent, sanitizeInput, async (req, res) => {
  try {
    const { familyId, childId } = req.params;
    const { title, description, items, familyContributions, inspiration, backgroundTheme } = req.body;

    // Verify parent has access to this family
    if (req.user.familyId !== familyId) {
      return res.status(403).json({ message: 'Not authorized to create dream board for this family' });
    }

    // Verify child belongs to parent's family
    const child = await User.findOne({ id: childId });
    if (!child || child.familyId !== req.user.familyId) {
      return res.status(404).json({ message: 'Child not found in your family' });
    }

    const dreamBoard = new DreamBoard({
      familyId: req.user.familyId,
      childId: child._id,
      parentId: req.user._id,
      title: title || 'Our Family Dream Board',
      description: description || 'Visualizing our biggest dreams and planning how to achieve them together',
      items: items || [],
      familyContributions: familyContributions || [],
      inspiration: inspiration || {
        quote: "The future belongs to those who believe in the beauty of their dreams.",
        author: "Eleanor Roosevelt"
      },
      backgroundTheme: backgroundTheme || 'space'
    });

    const savedDreamBoard = await dreamBoard.save();
    res.status(201).json(savedDreamBoard);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.patch('/dream-board/:dreamBoardId', auth, requireParent, sanitizeInput, async (req, res) => {
  try {
    const { dreamBoardId } = req.params;
    const update = req.body;

    const dreamBoard = await DreamBoard.findById(dreamBoardId);
    if (!dreamBoard) {
      return res.status(404).json({ message: 'Dream board not found' });
    }

    // Verify ownership
    if (!dreamBoard.parentId.equals(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to update this dream board' });
    }

    // Transform items if they exist in the update
    if (update.items) {
      update.items = update.items.map(item => {
        // Map frontend categories to valid backend enum values
        let category = item.category || 'custom';
        if (category === 'vacation') category = 'travel'; // Map vacation to travel

        const transformedItem = {
          title: item.title,
          description: item.description || 'No description provided',
          category: category,
          targetAmount: item.targetAmount,
          currentSavings: item.currentSavings || 0,
          monthlyContribution: item.monthlyCommitment || item.monthlyContribution || 0, // Handle frontend naming
          priority: item.priority || 'medium',
          status: item.status || 'planning',
          icon: item.icon || '🎯',
          color: item.color || '#4fc1e9',
          position: item.position || { x: 0, y: 0 },
          tags: item.tags || [],
          notes: item.notes || ''
        };

        // Handle targetDate carefully
        try {
          if (item.deadline) {
            transformedItem.targetDate = new Date(item.deadline);
          } else if (item.targetDate) {
            transformedItem.targetDate = new Date(item.targetDate);
          } else {
            transformedItem.targetDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
          }
        } catch (dateError) {
          console.error('Error parsing date for dream item:', item, dateError);
          transformedItem.targetDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
        }

        // NEVER set _id from frontend - let MongoDB handle it
        // This prevents ObjectId casting errors from invalid strings

        return transformedItem;
      });
    }

    Object.assign(dreamBoard, update, { updatedAt: new Date() });
    await dreamBoard.save();

    res.json(dreamBoard);
  } catch (error) {
    console.error('Error updating dream board:', error);
    res.status(400).json({ message: 'Failed to update dream board', error: error.message });
  }
});

router.delete('/dream-board/:dreamBoardId', auth, requireParent, async (req, res) => {
  try {
    const { dreamBoardId } = req.params;

    const dreamBoard = await DreamBoard.findById(dreamBoardId);
    if (!dreamBoard) {
      return res.status(404).json({ message: 'Dream board not found' });
    }

    // Verify ownership
    if (!dreamBoard.parentId.equals(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to delete this dream board' });
    }

    await DreamBoard.findByIdAndDelete(dreamBoardId);

    res.json({ message: 'Dream board deleted successfully' });
  } catch (error) {
    console.error('Error deleting dream board:', error);
    res.status(500).json({ message: 'Failed to delete dream board', error: error.message });
  }
});



// Elder Wisdom routes
router.post('/elder-wisdom/:familyId', auth, sanitizeInput, async (req, res) => {
  try {
    const { familyId } = req.params;
    const { childId, elderName, advice } = req.body;

    // Verify user belongs to this family
    if (req.user.familyId !== familyId) {
      return res.status(403).json({ message: 'Not authorized to add wisdom to this family' });
    }

    // Verify child belongs to family
    const child = await User.findOne({ id: childId });
    if (!child || child.familyId !== req.user.familyId) {
      return res.status(404).json({ message: 'Child not found in your family' });
    }

    // Find and update timeline with wisdom
    const timeline = await FamilyTimeline.findOne({
      familyId: req.user.familyId,
      childId: child._id
    });

    if (timeline) {
      timeline.familyWisdom.push({
        elderName,
        advice,
        dateShared: new Date()
      });
      await timeline.save();
    }

    res.status(201).json({ message: 'Wisdom shared successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

/**
 * GET /notifications?userId=...
 * Get unread notifications for userId (parents and kids).
 */
router.get('/notifications', auth, async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ message: "Missing userId parameter" });
    }
    // Only allow access if requesting user matches or is parent in same family
    const targetUser = await User.findOne({ id: userId });
    if (!targetUser) {
      return res.status(404).json({ message: "Target user not found" });
    }
    if (
      req.user.id !== userId &&
      (req.user.role !== 'parent' || req.user.familyId !== targetUser.familyId)
    ) {
      return res.status(403).json({ message: "Not authorized to access these notifications" });
    }
    const notifications = await Notification.find({ userId, isRead: false }).sort({ createdAt: -1 }).limit(50);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: "Error fetching notifications", error });
  }
});

/**
 * PATCH /notifications/:notifId
 * Delete a notification (mark as read by removing it).
 */
router.patch('/notifications/:notifId', auth, async (req, res) => {
  try {
    const { notifId } = req.params;
    const notification = await Notification.findById(notifId);
    if (!notification) return res.status(404).json({ message: 'Notification not found' });

    // Only allow the user themself or a parent in their family
    const user = await User.findOne({ id: notification.userId });
    if (!user) return res.status(404).json({ message: 'Notification user not found' });

    if (
      req.user.id !== notification.userId &&
      (req.user.role !== 'parent' || req.user.familyId !== user.familyId)
    ) {
      return res.status(403).json({ message: "Not authorized to modify this notification" });
    }

    await Notification.findByIdAndDelete(notifId);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

/**
 * PATCH /notifications/mark-all-read?userId=...
 * Delete all unread notifications for a user.
 */
router.patch('/notifications/mark-all-read', auth, async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ message: 'userId is required' });
    }
    // Check authorization
    const targetUser = await User.findOne({ id: userId });
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (
      req.user.id !== userId &&
      (req.user.role !== 'parent' || req.user.familyId !== targetUser.familyId)
    ) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Notification.deleteMany({ userId, isRead: false });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Failed to mark notifications as read' });
  }
});

/**
 * GET /api/users/children - Get all children for a parent
 * Requires authentication, only returns children belonging to the authenticated parent
 */
router.get('/users/children', auth, requireParent, async (req, res) => {
  try {
    const children = await User.find({
      'caregivers.userId': req.user.id,
      role: 'child'
    }).select('-password -pin -otpCode -otpExpiresAt -otpVerified');

    res.json({ children });
  } catch (error) {
    console.error('Error fetching children:', error);
    res.status(500).json({ message: 'Failed to fetch children' });
  }
});

/**
 * POST /api/fix-parent-child-relationships - Fix parent-child relationships
 * Requires authentication, only parents can run this
 * Updates all children in the family to have the correct parentId
 */
router.post('/fix-parent-child-relationships', auth, requireParent, async (req, res) => {
  try {
    logger.info('Starting parent-child relationship fix', {
      userId: req.user.id,
      familyId: req.user.familyId,
      action: 'fix-parent-child-relationships'
    });

    // Find all children in the parent's family
    const children = await User.find({
      familyId: req.user.familyId,
      role: 'child'
    });

    logger.info('Found children for relationship fix', {
      familyId: req.user.familyId,
      totalChildren: children.length,
      userId: req.user.id
    });

    let updatedCount = 0;
    for (const child of children) {
      if (!child.parentId || child.parentId !== req.user.id) {
        logger.info('Updating child parentId', {
          childId: child.id,
          childName: child.name,
          oldParentId: child.parentId,
          newParentId: req.user.id,
          familyId: req.user.familyId
        });
        await User.updateOne(
          { _id: child._id },
          { $set: { parentId: req.user.id } }
        );
        updatedCount++;
      } else {
        logger.debug('Child already has correct parentId', {
          childId: child.id,
          parentId: child.parentId
        });
      }
    }

    logger.info('Parent-child relationship fix completed', {
      familyId: req.user.familyId,
      updatedChildren: updatedCount,
      totalChildren: children.length,
      userId: req.user.id
    });

    res.json({
      message: 'Parent-child relationships fixed successfully',
      updatedChildren: updatedCount,
      totalChildren: children.length
    });
  } catch (error) {
    logger.error('Error fixing parent-child relationships', {
      error: error.message,
      stack: error.stack,
      userId: req.user.id,
      familyId: req.user.familyId
    });
    res.status(500).json({ message: 'Failed to fix parent-child relationships' });
  }
});

// Analytics routes
router.get('/analytics/family/:familyId', auth, expensiveOperationLimiter, async (req, res) => {
  try {
    const { familyId } = req.params;
    const { startDate, endDate } = req.query;

    // Verify user has access to this family
    if (req.user.familyId !== familyId) {
      return res.status(403).json({ message: 'Not authorized to view analytics for this family' });
    }

    // Get all family members
    console.log('Analytics - REQUEST familyId:', familyId, 'USER familyId:', req.user.familyId, 'USER id:', req.user.id);
    const familyMembers = await User.find({ familyId }).select('_id id name role currentPoints savePoints spendPoints donatePoints investPoints defaultSplit');
    console.log('Analytics - found familyMembers:', familyMembers.length, familyMembers.map(m => ({ id: m.id, role: m.role, familyId: m.familyId })));

    if (familyMembers.length === 0) {
      return res.status(404).json({ message: 'No family members found' });
    }

    // Build date filter
    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter = {};
      if (startDate) dateFilter.$gte = new Date(startDate);
      if (endDate) dateFilter.$lte = new Date(endDate);
    } else {
      // Default to last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      dateFilter = { $gte: thirtyDaysAgo };
    }

    // Get family transactions
    const transactions = await Transaction.find({
      user: { $in: familyMembers.map(m => m._id) },
      createdAt: dateFilter
    }).sort({ createdAt: -1 });

    // Get family chores
    const chores = await Chore.find({
      user: { $in: familyMembers.map(m => m._id) }
    }).select('name points frequency useDefaultSplit customSplit');

    console.log('Analytics - found chores:', chores.length, chores.map(c => ({ name: c.name, completed: c.completed, approved: c.approved })));

    // Get family goals
    const goals = await Goal.find({
      user: { $in: familyMembers.map(m => m._id) },
      $or: [
        { status: 'active' },
        { status: 'completed' },
        { updatedAt: dateFilter }
      ]
    }).select('name targetAmount currentAmount deadline status jar createdAt');

    // Get family rewards - get all rewards for progress overview
    console.log('Analytics - looking for rewards with user IDs:', familyMembers.map(m => m._id.toString()));
    const rawRewards = await Reward.find({
      user: { $in: familyMembers.map(m => m._id) }
    }).select('name cost category purchased approved approvedAt purchasedAt status available completed').lean();

    // Convert to plain objects to ensure serialization
    const rewards = rawRewards.map(r => ({
      _id: r._id?.toString(),
      name: r.name,
      cost: r.cost,
      category: r.category,
      purchased: r.purchased,
      approved: r.approved,
      approvedAt: r.approvedAt,
      purchasedAt: r.purchasedAt,
      status: r.status,
      available: r.available,
      completed: r.completed
    }));

    console.log('Analytics - processed rewards:', rewards.length, rewards.map(r => ({
      name: r.name,
      purchased: r.purchased,
      approved: r.approved,
      completed: r.completed
    })));

    // Get real allowances for the family - show all allowances for analytics overview
    console.log('Analytics - About to query real allowances for familyId:', familyId);
    console.log('Analytics - User familyId from token:', req.user.familyId);
    console.log('Analytics - Are they equal?', familyId === req.user.familyId);

    const realAllowances = await RealAllowance.find({
      familyId: familyId
    }).sort({ date: -1 }).limit(50); // Limit to prevent too much data

    console.log('Analytics - RealAllowances query result - count:', realAllowances.length);
    console.log('Analytics - RealAllowances full data:', realAllowances.map(r => ({
      _id: r._id,
      familyId: r.familyId,
      childId: r.childId,
      parentId: r.parentId,
      amount: r.amount,
      currency: r.currency,
      method: r.method,
      category: r.category,
      date: r.date,
      note: r.note
    })));

    // Also check total count in database
    const totalCount = await RealAllowance.countDocuments({ familyId: req.user.familyId });
    console.log('Analytics - Total real allowances in DB for req.user.familyId:', totalCount);

    const totalCountParam = await RealAllowance.countDocuments({ familyId: familyId });
    console.log('Analytics - Total real allowances in DB for param familyId:', totalCountParam);

    // Check if there are any real allowances at all
    const allAllowances = await RealAllowance.find({}).limit(10);
    console.log('Analytics - Sample of ALL real allowances in DB:', allAllowances.map(r => ({
      _id: r._id,
      familyId: r.familyId,
      childId: r.childId,
      amount: r.amount
    })));

    // Check the familyId in the working allowance history endpoint
    console.log('Analytics - Checking what allowance history would find...');
    const historyAllowances = await RealAllowance.find({
      familyId: req.user.familyId
    }).sort({ date: -1 }).limit(5);
    console.log('Analytics - Allowance history would find:', historyAllowances.length, 'allowances');

    // Get one family member for settings (they should be the same)
    const familyUser = familyMembers[0];

    const responseData = {
      transactions,
      chores,
      goals,
      rewards,
      realAllowances,
      user: familyUser,
      familyMembers: familyMembers.map(m => ({
        id: m.id,
        name: m.name,
        role: m.role,
        currentPoints: m.currentPoints || 0,
        savePoints: m.savePoints || 0,
        spendPoints: m.spendPoints || 0,
        donatePoints: m.donatePoints || 0,
        investPoints: m.investPoints || 0,
        totalPoints: (m.currentPoints || 0) + (m.savePoints || 0) + (m.spendPoints || 0) + (m.donatePoints || 0) + (m.investPoints || 0)
      }))
    };

    console.log('Analytics - response data rewards:', responseData.rewards?.length || 0);
    console.log('Analytics - sending response with rewards count:', responseData.rewards?.length || 0);

    // Double-check right before sending
    console.log('Analytics - FINAL responseData.rewards sample:', responseData.rewards?.slice(0, 2));

    // Return aggregated data
    res.json(responseData);

  } catch (error) {
    console.error('Error fetching analytics data:', error);
    res.status(500).json({ message: 'Failed to fetch analytics data', error: error.message });
  }
});

// Batch data fetching endpoint for optimized loading
router.post('/batch', auth, async (req, res) => {
  try {
    const { userId, endpoints } = req.body;

    console.log('[BATCH API] Starting batch fetch for user:', userId, 'endpoints:', endpoints);

    // Validate required parameters
    if (!userId || !Array.isArray(endpoints)) {
      return res.status(400).json({
        message: 'userId and endpoints array are required'
      });
    }

    // Verify user has access to this data
    const user = await User.findOne({ id: userId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Only allow parents to fetch data for their family, or users to fetch their own data
    if (req.user.role === 'parent' && req.user.familyId !== user.familyId) {
      return res.status(403).json({ message: 'Not authorized to access this user\'s data' });
    }
    if (req.user.role !== 'parent' && req.user.id !== userId) {
      return res.status(403).json({ message: 'Not authorized to access other users\' data' });
    }

    const results = {};
    const errors = [];

    // Process each endpoint in parallel for better performance
    const endpointPromises = endpoints.map(async (endpoint) => {
      try {
        switch (endpoint) {
          case 'user':
            console.log('[BATCH API] Fetching user data');
            const userData = await User.findOne({ id: userId })
              .populate('goals')
              .populate('chores')
              .populate({ path: 'rewards', model: 'Reward' })
              .populate('transactions')
              .select('-password');
            results.user = userData;
            break;

          case 'chores':
            console.log('[BATCH API] Fetching chores data');
            const now = new Date();
            const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            const chores = await Chore.find({
              user: user._id,
              $or: [
                { createdAt: { $gte: thirtyDaysAgo } },
                { completedAt: { $gte: thirtyDaysAgo } },
                { approvedAt: { $gte: thirtyDaysAgo } },
                { updatedAt: { $gte: thirtyDaysAgo } }
              ]
            });

            // Add welcome task for first-time users
            let choresWithWelcome = [...chores];
            if (user.isFirstTimeUser && user.role === 'child') {
              // Check if welcome task already exists
              const existingWelcomeTask = chores.find(c =>
                c.name === '🎉 Customize Your Avatar!' &&
                !c.completed &&
                !c.approved
              );

              if (!existingWelcomeTask) {
                // Create welcome task as a virtual chore (not saved to DB)
                const welcomeTask = {
                  _id: 'welcome-task-' + user.id,
                  name: '🎉 Customize Your Avatar!',
                  points: 25,
                  description: 'Welcome to Money Pots! Start by customizing your avatar to make the app your own.',
                  completed: false,
                  approved: false,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                  user: user._id,
                  isWelcomeTask: true,
                  useDefaultSplit: true,
                  customSplit: null
                };
                choresWithWelcome.unshift(welcomeTask);
              }
            }
            results.chores = choresWithWelcome;
            break;

          case 'goals':
            console.log('[BATCH API] Fetching goals data');
            const goalsNow = new Date();
            const goalsThirtyDaysAgo = new Date(goalsNow.getTime() - 30 * 24 * 60 * 60 * 1000);
            const goals = await Goal.find({
              user: user._id,
              $or: [
                { createdAt: { $gte: goalsThirtyDaysAgo } },
                { completedAt: { $gte: goalsThirtyDaysAgo } },
                { updatedAt: { $gte: goalsThirtyDaysAgo } }
              ]
            });

            // Check for expired goals and update them
            const updatedGoals = await Promise.all(goals.map(async (goal) => {
              if (goal.deadline && goal.status === 'active' && new Date(goal.deadline) < goalsNow) {
                goal.status = 'expired';
                await goal.save();
              }
              return goal;
            }));
            results.goals = updatedGoals;
            break;

          case 'requests':
            console.log('[BATCH API] Fetching requests data');
            const ApprovalRequest = require('../models/ApprovalRequest');
            const requestsNow = new Date();
            const requestsThirtyDaysAgo = new Date(requestsNow.getTime() - 30 * 24 * 60 * 60 * 1000);
            const requests = await ApprovalRequest.find({
              childId: userId,
              $or: [
                { createdAt: { $gte: requestsThirtyDaysAgo } },
                { actedAt: { $gte: requestsThirtyDaysAgo } },
                { updatedAt: { $gte: requestsThirtyDaysAgo } }
              ]
            }).sort({ createdAt: -1 });
            results.requests = requests;
            break;

          case 'transactions':
            console.log('[BATCH API] Fetching transactions data');
            const transactions = await Transaction.find({ user: user._id })
              .sort({ createdAt: -1 })
              .limit(20); // Limit to recent transactions for performance
            results.transactions = transactions;
            break;

          case 'notifications':
            console.log('[BATCH API] Fetching notifications data');
            const notifications = await Notification.find({ userId })
              .sort({ createdAt: -1 })
              .limit(50);
            results.notifications = notifications;
            break;

          case 'rewards':
            console.log('[BATCH API] Fetching rewards data');
            const rewardsNow = new Date();
            const rewardsThirtyDaysAgo = new Date(rewardsNow.getTime() - 30 * 24 * 60 * 60 * 1000);
            const rewards = await Reward.find({
              user: user._id,
              $or: [
                { createdAt: { $gte: rewardsThirtyDaysAgo } },
                { approvedAt: { $gte: rewardsThirtyDaysAgo } },
                { purchasedAt: { $gte: rewardsThirtyDaysAgo } },
                { updatedAt: { $gte: rewardsThirtyDaysAgo } }
              ]
            });
            results.rewards = rewards;
            break;

          case 'children':
            console.log('[BATCH API] Fetching children data');
            // For children endpoint, we need familyId from the request body
            const { familyId } = req.body;
            if (!familyId) {
              errors.push({
                endpoint: 'children',
                error: 'familyId is required for children endpoint'
              });
              break;
            }

            // Only allow parents to fetch children data for their family
            if (req.user.role === 'parent' && req.user.familyId !== familyId) {
              errors.push({
                endpoint: 'children',
                error: 'Not authorized to access children data for this family'
              });
              break;
            }

            const children = await User.find({
              familyId,
              role: 'child'
            }).select('-password');
            results.children = children;
            break;

          default:
            console.log(`[BATCH API] Unknown endpoint: ${endpoint}`);
            break;
        }
      } catch (endpointError) {
        console.error(`[BATCH API] Error fetching ${endpoint}:`, endpointError);
        errors.push({
          endpoint,
          error: endpointError.message
        });
      }
    });

    // Wait for all endpoints to complete
    await Promise.all(endpointPromises);

    console.log(`[BATCH API] Completed batch fetch. Results keys:`, Object.keys(results), 'Errors:', errors.length);

    // Return results with any errors
    res.json({
      success: true,
      data: results,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[BATCH API] Fatal error:', error);
    res.status(500).json({
      message: 'Batch fetch failed',
      error: error.message
    });
  }
});

// DELETE /chores/:choreId -- allow parents and children to delete chores with restrictions
router.delete('/chores/:choreId', auth, async (req, res) => {
  try {
    const { choreId } = req.params;

    // Find the chore and check for existence/ownership
    const chore = await Chore.findById(choreId);
    if (!chore) return res.status(404).json({ message: "Chore not found" });

    // Check authorization based on user role
    if (req.user.role === 'parent') {
      const choreOwner = await User.findById(chore.user);
      if (!choreOwner || choreOwner.familyId !== req.user.familyId) {
        return res.status(403).json({ message: "Not authorized to delete this chore" });
      }
    } else if (req.user.role === 'child') {
      if (!chore.user.equals(req.user._id)) {
        return res.status(403).json({ message: "Not authorized to delete this chore" });
      }
    } else {
      return res.status(403).json({ message: "Invalid user role for chore deletion" });
    }

    // Check status restrictions - can't delete if pending or completed
    if (chore.status !== 'active') {
      return res.status(400).json({ message: "Can only delete chores with status 'active'" });
    }

    await Chore.findByIdAndDelete(choreId);

    res.json({ message: "Chore deleted successfully" });
  } catch (error) {
    console.error('Error deleting chore:', error);
    res.status(500).json({ message: "Failed to delete chore", error: error.message });
  }
});

/**
 * GET/POST /api/run-recurring-jobs
 * Manually trigger the recurring tasks job (for testing or manual runs)
 * This endpoint can be called from cron-job.org, GitHub Actions, browsers, or manually
 */
const handleRunRecurringJobs = (req, res) => {
  console.log('🔄 Running recurring tasks job via API trigger at', new Date().toISOString());

  const { runRecurringTasksJob } = require('../scripts/recurringTasksJob');

  runRecurringTasksJob()
    .then(results => {
      console.log('✅ Recurring tasks job completed successfully');
      res.json({
        success: true,
        message: 'Recurring tasks job completed',
        results,
        timestamp: new Date().toISOString(),
        instancesCreated: results.filter(r => r.newInstanceId).length
      });
    })
    .catch(error => {
      console.error('❌ Recurring tasks job failed:', error);
      res.status(500).json({
        success: false,
        message: 'Recurring tasks job failed',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    });
};

router.get('/run-recurring-jobs', handleRunRecurringJobs);
router.post('/run-recurring-jobs', handleRunRecurringJobs);

// Real Allowance routes
router.get('/real-allowances', auth, requireParent, async (req, res) => {
  try {
    const { childId, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    let query = { familyId: req.user.familyId };
    if (childId) {
      query.childId = childId;
    }

    // Get total count for pagination
    const totalAllowances = await RealAllowance.countDocuments(query);

    const allowances = await RealAllowance.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      allowances,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalAllowances,
        totalPages: Math.ceil(totalAllowances / limit),
        hasNextPage: page < Math.ceil(totalAllowances / limit),
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/real-allowances', auth, requireParent, sanitizeInput, async (req, res) => {
  try {
    const { childId, amount, currency, date, method, note, category } = req.body;

    // Validate required fields
    if (!childId || !amount) {
      return res.status(400).json({ message: 'childId and amount are required' });
    }

    // Verify child belongs to parent's family
    const child = await User.findOne({ id: childId, familyId: req.user.familyId, role: 'child' });
    if (!child) {
      return res.status(404).json({ message: 'Child not found in your family' });
    }

    // Validate amount
    if (amount <= 0 || amount > 100000) {
      return res.status(400).json({ message: 'Amount must be between 0.01 and 100,000' });
    }

    const realAllowance = new RealAllowance({
      familyId: req.user.familyId,
      childId,
      parentId: req.user.id,
      amount: parseFloat(amount),
      currency: currency || 'INR',
      date: date ? new Date(date) : new Date(),
      method: method || 'Cash',
      note: note || '',
      category: category || 'Allowance'
    });

    const savedAllowance = await realAllowance.save();
    res.status(201).json(savedAllowance);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.patch('/real-allowances/:allowanceId', auth, requireParent, sanitizeInput, async (req, res) => {
  try {
    const { allowanceId } = req.params;
    const updates = req.body;

    const allowance = await RealAllowance.findById(allowanceId);
    if (!allowance) {
      return res.status(404).json({ message: 'Real allowance record not found' });
    }

    // Verify ownership
    if (allowance.familyId !== req.user.familyId) {
      return res.status(403).json({ message: 'Not authorized to update this record' });
    }

    // Only allow updating certain fields
    const allowedUpdates = ['amount', 'currency', 'date', 'method', 'note', 'category'];
    const filteredUpdates = {};
    for (const key of allowedUpdates) {
      if (updates[key] !== undefined) {
        filteredUpdates[key] = updates[key];
      }
    }

    if (filteredUpdates.amount !== undefined && (filteredUpdates.amount <= 0 || filteredUpdates.amount > 100000)) {
      return res.status(400).json({ message: 'Amount must be between 0.01 and 100,000' });
    }

    Object.assign(allowance, filteredUpdates, { updatedAt: new Date() });
    await allowance.save();

    res.json(allowance);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/real-allowances/:allowanceId', auth, requireParent, async (req, res) => {
  try {
    const { allowanceId } = req.params;

    const allowance = await RealAllowance.findById(allowanceId);
    if (!allowance) {
      return res.status(404).json({ message: 'Real allowance record not found' });
    }

    // Verify ownership
    if (allowance.familyId !== req.user.familyId) {
      return res.status(403).json({ message: 'Not authorized to delete this record' });
    }

    await RealAllowance.findByIdAndDelete(allowanceId);
    res.json({ message: 'Real allowance record deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete real allowance record', error: error.message });
  }
});

/**
 * GET /notifications?userId=...
 * Get unread notifications for userId (parents and kids).
 */
router.get('/notifications', auth, async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ message: "Missing userId parameter" });
    }
    // Only allow access if requesting user matches or is parent in same family
    const targetUser = await User.findOne({ id: userId });
    if (!targetUser) {
      return res.status(404).json({ message: "Target user not found" });
    }
    if (
      req.user.id !== userId &&
      (req.user.role !== 'parent' || req.user.familyId !== targetUser.familyId)
    ) {
      return res.status(403).json({ message: "Not authorized to access these notifications" });
    }
    const notifications = await Notification.find({ userId, isRead: false }).sort({ createdAt: -1 }).limit(50);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: "Error fetching notifications", error });
  }
});

/**
 * PATCH /notifications/:notifId
 * Delete a notification (mark as read by removing it).
 */
router.patch('/notifications/:notifId', auth, async (req, res) => {
  try {
    const { notifId } = req.params;
    const notification = await Notification.findById(notifId);
    if (!notification) return res.status(404).json({ message: 'Notification not found' });

    // Only allow the user themself or a parent in their family
    const user = await User.findOne({ id: notification.userId });
    if (!user) return res.status(404).json({ message: 'Notification user not found' });

    if (
      req.user.id !== notification.userId &&
      (req.user.role !== 'parent' || req.user.familyId !== user.familyId)
    ) {
      return res.status(403).json({ message: "Not authorized to modify this notification" });
    }

    await Notification.findByIdAndDelete(notifId);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

/**
 * PATCH /notifications/mark-all-read?userId=...
 * Delete all unread notifications for a user.
 */
router.patch('/notifications/mark-all-read', auth, async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ message: 'userId is required' });
    }
    // Check authorization
    const targetUser = await User.findOne({ id: userId });
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (
      req.user.id !== userId &&
      (req.user.role !== 'parent' || req.user.familyId !== targetUser.familyId)
    ) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Notification.deleteMany({ userId, isRead: false });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Failed to mark notifications as read' });
  }
});

module.exports = router;
