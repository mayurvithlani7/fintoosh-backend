const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const InterestRule = require('../models/InterestRule');
const InterestTransaction = require('../models/InterestTransaction');
const User = require('../models/User');

// Get interest rules for current user (parent)
router.get('/rules', auth, async (req, res) => {
  try {
    const rules = await InterestRule.find({
      userId: req.user.id,
      isActive: true
    }).sort({ createdAt: -1 });

    res.json({ rules });
  } catch (error) {
    console.error('Error fetching interest rules:', error);
    res.status(500).json({ message: 'Failed to fetch interest rules' });
  }
});

// Create or update interest rule
router.post('/rules', auth, async (req, res) => {
  try {
    const { rate, frequency, jar } = req.body;

    // Validate inputs
    if (rate < 0 || rate > 0.1) {
      return res.status(400).json({ message: 'Interest rate must be between 0% and 10%' });
    }

    if (!['daily', 'weekly', 'monthly'].includes(frequency)) {
      return res.status(400).json({ message: 'Invalid frequency' });
    }

    if (!['save', 'spend', 'donate', 'invest'].includes(jar)) {
      return res.status(400).json({ message: 'Invalid jar type' });
    }

    // Check if rule already exists
    let existingRule = await InterestRule.findOne({
      userId: req.user.id,
      isActive: true
    });

    if (existingRule) {
      // Update existing rule
      existingRule.rate = rate;
      existingRule.frequency = frequency;
      existingRule.jar = jar;
      await existingRule.save();
      res.json({ rule: existingRule, message: 'Interest rule updated successfully' });
    } else {
      // Create new rule
      const newRule = new InterestRule({
        userId: req.user.id,
        rate,
        frequency,
        jar
      });
      await newRule.save();
      res.status(201).json({ rule: newRule, message: 'Interest rule created successfully' });
    }
  } catch (error) {
    console.error('Error creating/updating interest rule:', error);
    res.status(500).json({ message: 'Failed to create interest rule' });
  }
});

// Get interest summary for a child
router.get('/summary/:childId', auth, async (req, res) => {
  try {
    const { childId } = req.params;

    // Verify the child belongs to the authenticated parent
    const child = await User.findById(childId);
    if (!child || child.parentId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get total interest earned
    const totalEarnedResult = await InterestTransaction.aggregate([
      { $match: { userId: child._id } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const totalEarned = totalEarnedResult.length > 0 ? totalEarnedResult[0].total : 0;

    // Get current streak (consecutive payouts)
    const recentTransactions = await InterestTransaction.find({
      userId: child._id
    }).sort({ payoutDate: -1 }).limit(10);

    let currentStreak = 0;
    if (recentTransactions.length > 0) {
      const now = new Date();
      const lastPayout = recentTransactions[0].payoutDate;
      const daysSinceLastPayout = Math.floor((now.getTime() - lastPayout.getTime()) / (1000 * 60 * 60 * 24));

      // If last payout was within the expected frequency window, count streak
      const frequencyDays = recentTransactions[0].frequency === 'weekly' ? 7 :
                           recentTransactions[0].frequency === 'monthly' ? 30 : 1;

      if (daysSinceLastPayout <= frequencyDays + 1) { // Allow 1 day grace period
        currentStreak = recentTransactions[0].streak;
      }
    }

    // Get last payout date
    const lastPayout = recentTransactions.length > 0 ? recentTransactions[0].payoutDate : null;

    // Calculate next payout date
    let nextPayoutDate = null;
    if (lastPayout) {
      const frequencyDays = recentTransactions[0].frequency === 'weekly' ? 7 :
                           recentTransactions[0].frequency === 'monthly' ? 30 : 1;
      nextPayoutDate = new Date(lastPayout.getTime() + frequencyDays * 24 * 60 * 60 * 1000);
    }

    res.json({
      totalEarned,
      currentStreak,
      lastPayoutDate: lastPayout,
      nextPayoutDate,
      transactionsCount: recentTransactions.length
    });
  } catch (error) {
    console.error('Error fetching interest summary:', error);
    res.status(500).json({ message: 'Failed to fetch interest summary' });
  }
});

// Get interest transaction history for a child
router.get('/history/:childId', auth, async (req, res) => {
  try {
    const { childId } = req.params;
    const { limit = 10, skip = 0 } = req.query;

    // Verify the child belongs to the authenticated parent
    const child = await User.findById(childId);
    if (!child || child.parentId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const transactions = await InterestTransaction.find({
      userId: childId
    })
    .sort({ payoutDate: -1 })
    .limit(parseInt(limit))
    .skip(parseInt(skip));

    res.json({ transactions });
  } catch (error) {
    console.error('Error fetching interest history:', error);
    res.status(500).json({ message: 'Failed to fetch interest history' });
  }
});

// Process interest payouts (for cron jobs)
router.post('/process-payouts', auth, async (req, res) => {
  try {
    console.log('Processing interest payouts...');

    const activeRules = await InterestRule.find({ isActive: true });
    const payoutResults = [];

    for (const rule of activeRules) {
      try {
        // Find children of this parent
        const children = await User.find({
          parentId: rule.userId,
          role: 'child'
        });

        for (const child of children) {
          const savingsBalance = child[rule.jar + 'Points'] || 0;

          if (savingsBalance > 0) {
            // Calculate interest based on frequency
            let interestAmount = 0;
            const daysInPeriod = rule.frequency === 'weekly' ? 7 :
                                rule.frequency === 'monthly' ? 30 : 1;

            interestAmount = (savingsBalance * rule.rate * daysInPeriod) / 365; // Daily compounding

            if (interestAmount > 0) {
              // Calculate current streak
              const recentTransactions = await InterestTransaction.find({
                userId: child._id
              }).sort({ payoutDate: -1 }).limit(1);

              let currentStreak = 1;
              if (recentTransactions.length > 0) {
                const lastPayout = recentTransactions[0];
                const daysSinceLastPayout = Math.floor((Date.now() - lastPayout.payoutDate.getTime()) / (1000 * 60 * 60 * 24));

                const expectedDays = rule.frequency === 'weekly' ? 7 :
                                   rule.frequency === 'monthly' ? 30 : 1;

                if (daysSinceLastPayout <= expectedDays + 1) { // Allow 1 day grace period
                  currentStreak = lastPayout.streak + 1;
                }
              }

              // Credit interest to child's account
              await User.findByIdAndUpdate(child._id, {
                $inc: { currentPoints: interestAmount }
              });

              // Create transaction record
              const transaction = new InterestTransaction({
                userId: child._id,
                amount: interestAmount,
                principalAmount: savingsBalance,
                rate: rule.rate,
                payoutDate: new Date(),
                streak: currentStreak,
                frequency: rule.frequency
              });
              await transaction.save();

              // Update rule's last payout date and total
              await InterestRule.findByIdAndUpdate(rule._id, {
                lastPayoutDate: new Date(),
                $inc: { totalInterestPaid: interestAmount }
              });

              payoutResults.push({
                childId: child._id,
                childName: child.name,
                amount: interestAmount,
                streak: currentStreak
              });
            }
          }
        }
      } catch (error) {
        console.error(`Error processing payouts for rule ${rule._id}:`, error);
      }
    }

    res.json({
      message: 'Interest payouts processed successfully',
      payoutsProcessed: payoutResults.length,
      details: payoutResults
    });
  } catch (error) {
    console.error('Error processing interest payouts:', error);
    res.status(500).json({ message: 'Failed to process interest payouts' });
  }
});

// Create default interest rule for new parents
router.post('/setup-default/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;

    // Verify user is admin or the user themselves
    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const existingRule = await InterestRule.findOne({
      userId: userId,
      isActive: true
    });

    if (existingRule) {
      return res.json({ rule: existingRule, message: 'Interest rule already exists' });
    }

    const defaultRule = new InterestRule({
      userId: userId,
      rate: 0.025, // 2.5% default
      frequency: 'weekly',
      jar: 'save'
    });

    await defaultRule.save();
    res.status(201).json({ rule: defaultRule, message: 'Default interest rule created' });
  } catch (error) {
    console.error('Error creating default interest rule:', error);
    res.status(500).json({ message: 'Failed to create default interest rule' });
  }
});

module.exports = router;
