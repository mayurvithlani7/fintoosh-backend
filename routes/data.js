const express = require('express');
const router = express.Router();

const User = require('../models/User');
const Goal = require('../models/Goal');
const Chore = require('../models/Chore');
const Transaction = require('../models/Transaction');
const Reward = require('../models/Reward');
const Achievement = require('../models/Achievement');
const ApprovalRequest = require('../models/ApprovalRequest');
const ParentMilestone = require('../models/ParentMilestone');
const FamilyDiscussion = require('../models/FamilyDiscussion');
const FamilyTimeline = require('../models/FamilyTimeline');
const DreamBoard = require('../models/DreamBoard');
const Notification = require('../models/Notification');
const { auth, requireParent } = require('../middleware/auth');

// Transaction routes
router.get('/transactions/:userId', auth, async (req, res) => {
  try {
    const user = await User.findOne({ id: req.params.userId });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const transactions = await Transaction.find({ user: user._id })
      .sort({ createdAt: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/transactions', auth, requireParent, async (req, res) => {
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

router.post('/rewards', auth, requireParent, async (req, res) => {
  try {
    const { childId, name, description, cost, category } = req.body;
    console.log("DEBUG: Parent creating reward. AuthUser:", req.user, "childId:", childId);
    const child = await User.findOne({ _id: childId, familyId: req.user.familyId, role: 'child' });
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
router.patch('/rewards/:rewardId', auth, async (req, res) => {
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

      // Check points (but do not deduct yet)
      const currentPoints = rewardOwner.currentPoints || 0;
      if (currentPoints < reward.cost) {
        return res.status(400).json({ message: 'Not enough points to claim this reward.' });
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
        // Auto-approve immediately
        reward.available = false;
        reward.purchased = true;
        reward.approvedAt = new Date();
        reward.purchasedAt = new Date();
        await reward.save();

        rewardOwner.currentPoints -= reward.cost;
        if (rewardOwner.currentPoints < 0) rewardOwner.currentPoints = 0;
        await rewardOwner.save();

        // Create transaction
        const txn = new Transaction({
          type: 'reward-purchase',
          description: `Auto-approved reward "${reward.name}" for ${reward.cost} points`,
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

      // Correct logic: always update available to false and save
      reward.available = false;
      reward.purchased = false;
      await reward.save();
      // Reload and send updated reward after save
      const updatedReward = await Reward.findById(reward._id);

      // Create approval request
      const parentId = rewardOwner.parentId;
      if (!parentId) return res.status(400).json({ message: 'No parent found for user.' });
      const approvalRequest = new ApprovalRequest({
        familyId: rewardOwner.familyId,
        childId: rewardOwner.id,
        parentId,
        type: 'reward',
        name: `Reward: ${reward.name}`,
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

// Goal routes
router.get('/goals/:childId', auth, async (req, res) => {
  try {
    // Find user by custom ID to get MongoDB ObjectId
    const user = await User.findOne({ id: req.params.childId });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const goals = await Goal.find({
      user: user._id,
      $or: [
        { createdAt: { $gte: thirtyDaysAgo } },
        { completedAt: { $gte: thirtyDaysAgo } },
        { updatedAt: { $gte: thirtyDaysAgo } }
      ]
    });

    // Check for expired goals and update them
    const updatedGoals = await Promise.all(goals.map(async (goal) => {
      if (goal.deadline && goal.status === 'active' && new Date(goal.deadline) < now) {
        // Mark goal as expired
        goal.status = 'expired';
        await goal.save();
      }
      return goal;
    }));

    res.json(updatedGoals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/goals', auth, requireParent, async (req, res) => {
  try {
    const { childId, name, targetAmount, jar, description, deadline } = req.body;
    const child = await User.findOne({ id: childId, familyId: req.user.familyId, role: 'child' });
    if (!child) {
      return res.status(404).json({ message: "Child not found or does not belong to your family." });
    }

    const goalData = {
      parent: req.user._id,
      user: child._id,
      name,
      targetAmount,
      jar,
    };

    // Add optional fields if provided
    if (description) goalData.description = description;
    if (deadline) goalData.deadline = new Date(deadline);

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

    const choreData = {
      parent: req.user._id,
      user: child._id,
      name,
      points,
    };

    // Add optional fields if provided
    if (description) choreData.description = description;
    if (frequency) choreData.frequency = frequency;
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
router.patch('/chores/:choreId', auth, async (req, res) => {
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
    console.log("DEBUG: Parent fetching requests. AuthUser:", req.user);
    const ApprovalRequest = require('../models/ApprovalRequest');
    const User = require('../models/User');
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const requests = await ApprovalRequest.find({
      familyId: req.user.familyId,
      $or: [
        { createdAt: { $gte: thirtyDaysAgo } },
        { actedAt: { $gte: thirtyDaysAgo } },
        { updatedAt: { $gte: thirtyDaysAgo } }
      ]
    }).sort({ createdAt: -1 });

    const usersById = {};
    const childIds = Array.from(new Set(requests.map(r => r.childId)));
    const foundUsers = await User.find({ id: { $in: childIds } }, 'id name');
    foundUsers.forEach(u => { usersById[u.id] = u.name; });
    const enriched = requests.map(req => ({
      ...req.toObject(),
      userName: usersById[req.childId] || 'Unknown User'
    }));
    res.json(enriched);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/requests', auth, async (req, res) => {
  try {
    const { userId, note } = req.body;
    const childUser = await User.findOne({ id: userId });
    if (!childUser) return res.status(404).json({ message: 'Child user not found' });
    const parentId = childUser.parentId;
    if (!parentId) return res.status(400).json({ message: 'No parentId for this user.' });

    // ---------------- AUTO-APPROVAL LOGIC for chores & point moves ----------------
    let parent = await User.findOne({ id: parentId });
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

    const approvalRequest = new (require('../models/ApprovalRequest'))({
      ...req.body,
      familyId: childUser.familyId,
      childId: userId,
      parentId,
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
        // Deduct from currentPoints (i.e. "current" jar)
        const rewardDoc = approval.rewardId
          ? await RewardModel.findById(approval.rewardId)
          : await RewardModel.findOne({ name: approval.name, user: user._id });
        const cost = approval.amount;
        if ((user.currentPoints || 0) < cost) {
          return res.status(400).json({ message: 'Not enough points to fulfill this reward request at approval time.' });
        }
        user.currentPoints = (user.currentPoints || 0) - cost;
        const txn = new Transaction({
          type: 'reward-purchase',
          description: `Parent approved reward "${approval.name}" for ${cost} points`,
          amount: -cost,
          user: user._id,
          date: new Date().toLocaleString(),
        });
        await txn.save();
        user.transactions.unshift(txn._id);

        // Update reward fulfillment
        if (rewardDoc) {
          rewardDoc.approvedAt = new Date();
          rewardDoc.purchased = true;
          rewardDoc.purchasedAt = new Date();
          await rewardDoc.save();
        }

        await user.save();
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

      // Mark chore as approved
      chore.approved = true;
      chore.approvedAt = new Date();
      await chore.save();
      console.log('DEBUG: Chore approved now set to', chore.approved, 'for Chore', chore._id);
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
          const target = goal.targetAmount || approval.amount || 0;
          if (!user[pointsField] || user[pointsField] < target) {
            return res.status(400).json({ message: `Not enough points in ${jar} jar for goal completion. Kid must have enough points at time of approval.` });
          }
          // Deduct points and complete goal
          user[pointsField] -= target;
          await user.save();
          goal.status = 'completed'; // Mark as completed/claimed
          await goal.save();
        }
      }
    }
    // If denied and reward, reset reward availability
    if (status === 'Denied' && approval.type === 'reward') {
      console.log('DEBUG: Inside reward deny handler.', { status, approvalType: approval.type, approvalId: approval._id });
      const RewardModel = require('../models/Reward');
      console.log('DEBUG Deny Reward:', { rewardId: approval.rewardId, approvalId: approval._id });
      if (approval.rewardId) {
        const reward = await RewardModel.findById(approval.rewardId);
        if (reward) {
          reward.available = true;
          reward.purchased = false;
          await reward.save();
          console.log('DEBUG Deny Reward - updated:', { _id: reward._id, available: reward.available, purchased: reward.purchased });
        } else {
          console.log('DEBUG Deny Reward - reward not found:', approval.rewardId);
        }
      } else {
        console.log('DEBUG Deny Reward - approval.rewardId is missing.', approval._id);
      }
    }

    // If denied and goal-completion, reset goal status to 'active'
    if (status === 'Denied' && approval.type === 'goal-completion') {
      const Goal = require('../models/Goal');
      if (approval.goalId) {
        const goal = await Goal.findById(approval.goalId);
        if (goal) {
          goal.status = 'active'; // Reset to active so child can try again
          await goal.save();
        }
      }
    }

    res.json(approval);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Send message on existing request without changing status
router.post('/requests/:requestId/messages', auth, async (req, res) => {
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

router.post('/parent-milestones/:parentId/:childId', auth, requireParent, async (req, res) => {
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

router.post('/family-discussions', auth, requireParent, async (req, res) => {
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

router.patch('/family-discussions/:discussionId', auth, requireParent, async (req, res) => {
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

router.post('/family-timeline/:familyId/:childId', auth, requireParent, async (req, res) => {
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

router.patch('/family-timeline/:timelineId', auth, requireParent, async (req, res) => {
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

router.post('/dream-board/:familyId/:childId', auth, requireParent, async (req, res) => {
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

router.patch('/dream-board/:dreamBoardId', auth, requireParent, async (req, res) => {
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

    Object.assign(dreamBoard, update, { updatedAt: new Date() });
    await dreamBoard.save();

    res.json(dreamBoard);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Elder Wisdom routes
router.post('/elder-wisdom/:familyId', auth, async (req, res) => {
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
 * Get all notifications for userId (parents and kids).
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
    const notifications = await Notification.find({ userId }).sort({ createdAt: -1 }).limit(50);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: "Error fetching notifications", error });
  }
});

/**
 * PATCH /notifications/:notifId
 * Mark a notification as read.
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

    notification.isRead = true;
    await notification.save();
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

/**
 * GET /api/users/children - Get all children for a parent
 * Requires authentication, only returns children belonging to the authenticated parent
 */
router.get('/users/children', auth, requireParent, async (req, res) => {
  try {
    const children = await User.find({
      parentId: req.user.id,
      role: 'child'
    }).select('-password -pin -otpCode -otpExpiresAt -otpVerified');

    res.json({ children });
  } catch (error) {
    console.error('Error fetching children:', error);
    res.status(500).json({ message: 'Failed to fetch children' });
  }
});

module.exports = router;
