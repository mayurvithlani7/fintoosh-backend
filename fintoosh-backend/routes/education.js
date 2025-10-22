const express = require('express');
const router = express.Router();

const EducationModule = require('../models/EducationModule');
const ChildProgress = require('../models/ChildProgress');
const User = require('../models/User');
const { auth, requireParent } = require('../middleware/auth');

// GET /api/education/modules - Get all available education modules
router.get('/modules', auth, async (req, res) => {
  try {
    const { category, difficulty, childId } = req.query;

    // Build query filters
    let query = { isActive: true };

    if (category && category !== 'all') {
      query.category = category;
    }

    if (difficulty && difficulty !== 'all') {
      query.difficulty = difficulty;
    }

    // Get modules with optional progress info if childId provided
    const modules = await EducationModule.find(query)
      .sort({ category: 1, order: 1, difficulty: 1 })
      .lean();

    // If childId provided, include progress information
    let modulesWithProgress = modules;
    if (childId) {
      // Verify child belongs to user's family
      const child = await User.findOne({ id: childId });
      if (!child || child.familyId !== req.user.familyId) {
        return res.status(403).json({ message: 'Not authorized to view this child\'s progress' });
      }

      // Get progress for each module
      const progressPromises = modules.map(async (module) => {
        const progress = await ChildProgress.findOne({
          child: child._id,
          module: module._id
        }).select('status progress completedAt');

        return {
          ...module,
          progress: progress || null
        };
      });

      modulesWithProgress = await Promise.all(progressPromises);
    }

    res.json({
      modules: modulesWithProgress,
      filters: {
        categories: ['saving', 'budgeting', 'investing', 'giving', 'general'],
        difficulties: ['beginner', 'intermediate', 'advanced']
      }
    });
  } catch (error) {
    console.error('Error fetching education modules:', error);
    res.status(500).json({ message: 'Failed to fetch education modules', error: error.message });
  }
});

// GET /api/education/modules/:moduleId - Get specific module details
router.get('/modules/:moduleId', auth, async (req, res) => {
  try {
    const { moduleId } = req.params;
    const { childId } = req.query;

    const module = await EducationModule.findById(moduleId);
    if (!module) {
      return res.status(404).json({ message: 'Education module not found' });
    }

    let response = module.toObject();

    // If childId provided, include progress information
    if (childId) {
      const child = await User.findOne({ id: childId });
      if (!child || child.familyId !== req.user.familyId) {
        return res.status(403).json({ message: 'Not authorized to view this child\'s progress' });
      }

      const progress = await ChildProgress.findOne({
        child: child._id,
        module: module._id
      }).populate('child', 'name');

      response.progress = progress;
    }

    res.json(response);
  } catch (error) {
    console.error('Error fetching education module:', error);
    res.status(500).json({ message: 'Failed to fetch education module', error: error.message });
  }
});

// GET /api/education/progress/:childId - Get child's education progress
router.get('/progress/:childId', auth, async (req, res) => {
  try {
    const { childId } = req.params;

    // Verify child belongs to user's family
    const child = await User.findOne({ id: childId });
    if (!child || child.familyId !== req.user.familyId) {
      return res.status(403).json({ message: 'Not authorized to view this child\'s progress' });
    }

    // Get all progress records for this child
    const progressRecords = await ChildProgress.find({ child: child._id })
      .populate('module', 'title category difficulty icon pointsReward')
      .sort({ lastAccessedAt: -1 });

    // Calculate overall statistics
    const stats = {
      totalModules: progressRecords.length,
      completedModules: progressRecords.filter(p => p.status === 'completed').length,
      inProgressModules: progressRecords.filter(p => p.status === 'in-progress').length,
      totalPointsEarned: progressRecords.reduce((sum, p) => sum + (p.pointsEarned || 0), 0),
      totalTimeSpent: progressRecords.reduce((sum, p) => sum + (p.totalTimeSpent || 0), 0),
      averageQuizScore: progressRecords.length > 0
        ? Math.round(progressRecords.reduce((sum, p) => sum + (p.bestQuizScore || 0), 0) / progressRecords.length)
        : 0
    };

    // Group by category for better organization
    const categories = ['saving', 'budgeting', 'investing', 'giving', 'general'];
    const progressByCategory = {};

    categories.forEach(category => {
      progressByCategory[category] = progressRecords.filter(p =>
        p.module && p.module.category === category
      );
    });

    res.json({
      child: {
        id: child.id,
        name: child.name
      },
      progress: progressRecords,
      stats,
      progressByCategory
    });
  } catch (error) {
    console.error('Error fetching child progress:', error);
    res.status(500).json({ message: 'Failed to fetch child progress', error: error.message });
  }
});

// POST /api/education/start/:moduleId - Start a module for a child
router.post('/start/:moduleId', auth, async (req, res) => {
  try {
    const { moduleId } = req.params;
    const { childId } = req.body;

    if (!childId) {
      return res.status(400).json({ message: 'childId is required' });
    }

    // Verify child belongs to user's family
    const child = await User.findOne({ id: childId });
    if (!child || child.familyId !== req.user.familyId) {
      return res.status(403).json({ message: 'Not authorized for this child' });
    }

    // Verify module exists
    const module = await EducationModule.findById(moduleId);
    if (!module) {
      return res.status(404).json({ message: 'Education module not found' });
    }

    // Check if progress already exists
    let progress = await ChildProgress.findOne({
      child: child._id,
      module: module._id
    });

    if (progress) {
      return res.status(400).json({ message: 'Module already started for this child' });
    }

    // Check prerequisites
    if (module.prerequisites && module.prerequisites.length > 0) {
      const completedPrerequisites = await ChildProgress.countDocuments({
        child: child._id,
        module: { $in: module.prerequisites },
        status: 'completed'
      });

      if (completedPrerequisites < module.prerequisites.length) {
        return res.status(400).json({
          message: 'Prerequisites not met for this module',
          prerequisites: module.prerequisites
        });
      }
    }

    // Create progress record
    progress = new ChildProgress({
      child: child._id,
      family: child.familyId,
      module: module._id,
      status: 'in-progress',
      lessonsProgress: module.content.lessons.map((lesson, index) => ({
        lessonIndex: index,
        completed: false,
        timeSpent: 0,
        lastAccessedAt: new Date()
      }))
    });

    await progress.save();

    // Populate module data for response
    await progress.populate('module', 'title category difficulty icon estimatedTime');

    res.status(201).json({
      message: 'Module started successfully',
      progress
    });
  } catch (error) {
    console.error('Error starting education module:', error);
    res.status(500).json({ message: 'Failed to start education module', error: error.message });
  }
});

// POST /api/education/complete-lesson - Mark lesson as completed
router.post('/complete-lesson', auth, async (req, res) => {
  try {
    const { childId, moduleId, lessonIndex, timeSpent } = req.body;

    // Verify child belongs to user's family
    const child = await User.findOne({ id: childId });
    if (!child || child.familyId !== req.user.familyId) {
      return res.status(403).json({ message: 'Not authorized for this child' });
    }

    // Get progress record
    const progress = await ChildProgress.findOne({
      child: child._id,
      module: moduleId
    });

    if (!progress) {
      return res.status(404).json({ message: 'Progress record not found' });
    }

    // Mark lesson as completed
    await progress.completeLesson(lessonIndex, timeSpent);

    res.json({
      message: 'Lesson completed successfully',
      progress: progress.progress,
      lessonCompleted: true
    });
  } catch (error) {
    console.error('Error completing lesson:', error);
    res.status(500).json({ message: 'Failed to complete lesson', error: error.message });
  }
});

// POST /api/education/submit-quiz - Submit quiz answers
router.post('/submit-quiz', auth, async (req, res) => {
  try {
    const { childId, moduleId, answers, timeSpent } = req.body;

    // Verify child belongs to user's family
    const child = await User.findOne({ id: childId });
    if (!child || child.familyId !== req.user.familyId) {
      return res.status(403).json({ message: 'Not authorized for this child' });
    }

    // Get progress record
    const progress = await ChildProgress.findOne({
      child: child._id,
      module: moduleId
    });

    if (!progress) {
      return res.status(404).json({ message: 'Progress record not found' });
    }

    // Get module to check answers
    const module = await EducationModule.findById(moduleId);
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }

    // Calculate score
    let correctAnswers = 0;
    const detailedAnswers = answers.map((userAnswer, index) => {
      const question = module.content.quiz.questions[index];
      let isCorrect = false;

      if (question) {
        // Check answer based on question type
        if (question.type === 'multiple-choice') {
          isCorrect = userAnswer === question.correctAnswer;
        } else if (question.type === 'true-false') {
          isCorrect = userAnswer === question.correctAnswer;
        } else if (question.type === 'drag-drop') {
          // For drag-drop, correctAnswer would be an array
          isCorrect = JSON.stringify(userAnswer) === JSON.stringify(question.correctAnswer);
        }

        if (isCorrect) correctAnswers++;
      }

      return {
        questionIndex: index,
        userAnswer,
        isCorrect,
        timeSpent: timeSpent ? timeSpent[index] : 0
      };
    });

    const totalQuestions = module.content.quiz.questions.length;
    const score = Math.round((correctAnswers / totalQuestions) * 100);

    // Record quiz attempt
    await progress.recordQuizAttempt(score, totalQuestions, correctAnswers, timeSpent, detailedAnswers);

    // If passed and module completed, award points and badge
    let pointsAwarded = 0;
    let badgeAwarded = false;

    if (progress.status === 'completed' && progress.quizPassed && !progress.pointsEarned) {
      // Award points to child
      pointsAwarded = module.pointsReward || 50;
      child.currentPoints = (child.currentPoints || 0) + pointsAwarded;
      await child.save();

      progress.pointsEarned = pointsAwarded;

      // Award badge if specified
      if (module.badgeReward && !progress.badgeEarned) {
        const badge = {
          milestoneType: 'education_module',
          title: module.badgeReward.title,
          description: module.badgeReward.description,
          icon: module.badgeReward.icon || '🎓',
          unlockedAt: new Date(),
          pointsAwarded
        };

        child.badges = child.badges || [];
        child.badges.push(badge);
        await child.save();

        progress.badgeEarned = true;
      }

      await progress.save();
    }

    res.json({
      message: 'Quiz submitted successfully',
      score,
      passed: progress.quizPassed,
      moduleCompleted: progress.status === 'completed',
      pointsAwarded,
      badgeAwarded,
      attempts: progress.quizAttempts.length
    });
  } catch (error) {
    console.error('Error submitting quiz:', error);
    res.status(500).json({ message: 'Failed to submit quiz', error: error.message });
  }
});

// POST /api/education/complete - Mark entire module as completed (legacy endpoint)
router.post('/complete', auth, async (req, res) => {
  try {
    const { childId, moduleId } = req.body;

    // Verify child belongs to user's family
    const child = await User.findOne({ id: childId });
    if (!child || child.familyId !== req.user.familyId) {
      return res.status(403).json({ message: 'Not authorized for this child' });
    }

    // Get progress record
    const progress = await ChildProgress.findOne({
      child: child._id,
      module: moduleId
    });

    if (!progress) {
      return res.status(404).json({ message: 'Progress record not found' });
    }

    // Mark as completed
    progress.status = 'completed';
    progress.completedAt = new Date();
    await progress.save();

    res.json({
      message: 'Module marked as completed',
      progress
    });
  } catch (error) {
    console.error('Error completing module:', error);
    res.status(500).json({ message: 'Failed to complete module', error: error.message });
  }
});

// POST /api/education/reset-progress - Reset progress for a module (admin/parent only)
router.post('/reset-progress', auth, requireParent, async (req, res) => {
  try {
    const { childId, moduleId } = req.body;

    // Verify child belongs to parent's family
    const child = await User.findOne({ id: childId });
    if (!child || child.familyId !== req.user.familyId) {
      return res.status(403).json({ message: 'Not authorized for this child' });
    }

    // Reset progress
    const result = await ChildProgress.findOneAndUpdate(
      { child: child._id, module: moduleId },
      {
        status: 'not-started',
        progress: 0,
        lessonsProgress: [],
        quizAttempts: [],
        quizPassed: false,
        pointsEarned: 0,
        badgeEarned: false,
        totalTimeSpent: 0,
        startedAt: null,
        completedAt: null,
        lastAccessedAt: new Date()
      },
      { new: true }
    );

    if (!result) {
      return res.status(404).json({ message: 'Progress record not found' });
    }

    res.json({
      message: 'Progress reset successfully',
      progress: result
    });
  } catch (error) {
    console.error('Error resetting progress:', error);
    res.status(500).json({ message: 'Failed to reset progress', error: error.message });
  }
});

module.exports = router;
