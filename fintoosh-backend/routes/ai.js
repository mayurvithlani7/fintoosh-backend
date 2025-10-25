const express = require('express');
const router = express.Router();
const AIUsage = require('../models/AIUsage');
const { auth } = require('../middleware/auth');

// Middleware to verify user authentication
router.use(auth);

// GET /api/ai/usage - Get current user's AI usage stats
router.get('/usage', async (req, res) => {
  try {
    const userId = req.user.id;

    const usageStats = await AIUsage.canUserAskQuestion(userId);

    res.json({
      success: true,
      data: {
        canAsk: usageStats.canAsk,
        remainingQuestions: usageStats.remainingQuestions,
        resetTime: usageStats.resetTime,
        reason: usageStats.reason
      }
    });
  } catch (error) {
    console.error('Error getting AI usage:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get AI usage statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/ai/question - Record a question being asked
router.post('/question', async (req, res) => {
  try {
    const userId = req.user.id;
    const { messageLength, responseLength, question, response } = req.body;

    // Validate input
    if (typeof messageLength !== 'number' || messageLength < 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid messageLength'
      });
    }

    if (typeof responseLength !== 'number' || responseLength < 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid responseLength'
      });
    }

    // Check if user can ask a question
    const usageCheck = await AIUsage.canUserAskQuestion(userId);

    if (!usageCheck.canAsk) {
      return res.status(429).json({
        success: false,
        message: 'Daily question limit reached',
        data: {
          remainingQuestions: 0,
          resetTime: usageCheck.resetTime,
          reason: usageCheck.reason
        }
      });
    }

    // Record the question
    await AIUsage.recordQuestion(
      userId,
      messageLength,
      responseLength,
      question || '',
      response || ''
    );

    // Get updated usage stats
    const updatedStats = await AIUsage.canUserAskQuestion(userId);

    res.json({
      success: true,
      message: 'Question recorded successfully',
      data: {
        remainingQuestions: updatedStats.remainingQuestions,
        resetTime: updatedStats.resetTime
      }
    });
  } catch (error) {
    console.error('Error recording AI question:', error);

    // Handle specific errors
    if (error.message === 'Daily question limit reached') {
      return res.status(429).json({
        success: false,
        message: 'Daily question limit reached'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to record question',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/ai/history - Get user's AI usage history
router.get('/history', async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 30; // Default 30 days

    // Get usage records for the last N days
    const records = await AIUsage.find({
      userId,
      date: {
        $gte: new Date(Date.now() - limit * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }
    }).sort({ date: -1 });

    // Calculate total questions and statistics
    const totalQuestions = records.reduce((sum, record) => sum + record.questionCount, 0);
    const averagePerDay = records.length > 0 ? (totalQuestions / records.length).toFixed(1) : 0;

    res.json({
      success: true,
      data: {
        records,
        totalQuestions,
        averagePerDay: parseFloat(averagePerDay),
        daysTracked: records.length
      }
    });
  } catch (error) {
    console.error('Error getting AI history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get AI usage history',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// DELETE /api/ai/reset - Reset usage (admin only - for testing)
router.delete('/reset', async (req, res) => {
  try {
    // In production, this should check for admin role
    const userId = req.user.id;

    // Only allow reset for testing/development
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({
        success: false,
        message: 'Reset not allowed in production'
      });
    }

    await AIUsage.deleteMany({ userId });

    res.json({
      success: true,
      message: 'AI usage reset successfully'
    });
  } catch (error) {
    console.error('Error resetting AI usage:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset AI usage',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
