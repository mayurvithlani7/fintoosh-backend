const express = require('express');
const router = express.Router();
const { getActiveFestival, getFestivalById, getAllFestivals, getUpcomingFestivals } = require('../constants/festivalCalendar');
const { auth } = require('../middleware/auth');

// Middleware to verify user authentication
router.use(auth);

// GET /api/festival/active - Get currently active festival
router.get('/active', async (req, res) => {
  try {
    const activeFestival = getActiveFestival();

    if (!activeFestival) {
      return res.json({
        success: true,
        data: null,
        message: 'No active festival at this time'
      });
    }

    res.json({
      success: true,
      data: activeFestival
    });
  } catch (error) {
    console.error('Error getting active festival:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get active festival',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/festival/upcoming - Get upcoming festivals
router.get('/upcoming', async (req, res) => {
  try {
    const upcomingFestivals = getUpcomingFestivals();

    res.json({
      success: true,
      data: upcomingFestivals
    });
  } catch (error) {
    console.error('Error getting upcoming festivals:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get upcoming festivals',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/festival/:festivalId - Get specific festival details
router.get('/:festivalId', async (req, res) => {
  try {
    const { festivalId } = req.params;
    const festival = getFestivalById(festivalId);

    if (!festival) {
      return res.status(404).json({
        success: false,
        message: 'Festival not found'
      });
    }

    res.json({
      success: true,
      data: festival
    });
  } catch (error) {
    console.error('Error getting festival:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get festival details',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/festival/:festivalId/progress - Record festival progress
router.post('/:festivalId/progress', async (req, res) => {
  try {
    const { festivalId } = req.params;
    const { challengeId, completed, score, data } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!challengeId) {
      return res.status(400).json({
        success: false,
        message: 'Challenge ID is required'
      });
    }

    // Here you would typically save progress to database
    // For now, we'll just return success
    // TODO: Implement database storage for festival progress

    const progressData = {
      userId,
      festivalId,
      challengeId,
      completed: completed || false,
      score: score || 0,
      data: data || {},
      timestamp: new Date()
    };

    console.log('Festival progress recorded:', progressData);

    res.json({
      success: true,
      message: 'Progress recorded successfully',
      data: progressData
    });
  } catch (error) {
    console.error('Error recording festival progress:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record progress',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/festival/:festivalId/complete - Mark festival as completed
router.post('/:festivalId/complete', async (req, res) => {
  try {
    const { festivalId } = req.params;
    const { totalScore, badgeEarned } = req.body;
    const userId = req.user.id;

    const festival = getFestivalById(festivalId);
    if (!festival) {
      return res.status(404).json({
        success: false,
        message: 'Festival not found'
      });
    }

    // Here you would typically:
    // 1. Save completion to database
    // 2. Award points/badges
    // 3. Update user profile

    const completionData = {
      userId,
      festivalId,
      completedAt: new Date(),
      totalScore: totalScore || 0,
      badgeEarned: badgeEarned !== false,
      rewards: festival.rewards
    };

    console.log('Festival completed:', completionData);

    res.json({
      success: true,
      message: 'Festival completed successfully!',
      data: completionData
    });
  } catch (error) {
    console.error('Error completing festival:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete festival',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/festival/history - Get user's festival history
router.get('/history/all', async (req, res) => {
  try {
    const userId = req.user.id;

    // Here you would fetch from database
    // For now, return empty array
    // TODO: Implement database query for festival history

    const history = []; // Would be fetched from database

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Error getting festival history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get festival history',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
