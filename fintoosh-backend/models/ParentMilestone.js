const mongoose = require('mongoose');

const ParentMilestoneSchema = new mongoose.Schema({
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  childId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  milestoneType: {
    type: String,
    enum: [
      'first_discussion',
      'first_lesson_completed',
      'weekly_money_talk',
      'goal_created',
      'teaching_streak_3_days',
      'teaching_streak_7_days',
      'teaching_streak_30_days',
      'discussion_logged',
      'family_goal_completed',
      'grandparent_story_shared'
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    default: '🎯'
  },
  points: {
    type: Number,
    default: 10
  },
  achievedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
ParentMilestoneSchema.index({ parentId: 1, childId: 1 });
ParentMilestoneSchema.index({ milestoneType: 1 });

module.exports = mongoose.model('ParentMilestone', ParentMilestoneSchema);
