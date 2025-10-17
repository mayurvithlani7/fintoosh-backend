const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: [
      'points_saved',
      'chores_completed',
      'goals_achieved',
      'learning_streak',
      'budget_master',
      'charity_giver',
      'first_savings',
      'saving_streak',
      'quiz_master'
    ],
    required: true
  },
  title: { type: String, required: true },
  description: { type: String, required: true },
  icon: { type: String, default: '🏆' },
  points: { type: Number, default: 0 },
  progress: { type: Number, default: 0 },
  target: { type: Number, required: true },
  completed: { type: Boolean, default: false },
  completedAt: { type: Date },
  streakCount: { type: Number, default: 0 },
  lastActivity: { type: Date },
  powerUps: [{
    type: { type: String, enum: ['streak_freeze', 'double_points', 'bonus_chance'] },
    count: { type: Number, default: 1 },
    expiresAt: { type: Date }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Pre-save middleware to update updatedAt
achievementSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static method to get or create achievement
achievementSchema.statics.getOrCreate = async function(userId, type, target, title, description, icon = '🏆') {
  let achievement = await this.findOne({ user: userId, type });
  if (!achievement) {
    achievement = new this({
      user: userId,
      type,
      title,
      description,
      icon,
      target,
      progress: 0
    });
    await achievement.save();
  }
  return achievement;
};

// Method to update progress
achievementSchema.methods.updateProgress = async function(newProgress, streakData = null) {
  this.progress = Math.min(newProgress, this.target);

  // Handle streak logic
  if (streakData) {
    const today = new Date().toDateString();
    const lastActivity = this.lastActivity ? this.lastActivity.toDateString() : null;

    if (lastActivity === today) {
      // Already active today, maintain streak
      this.streakCount = streakData.current || this.streakCount;
    } else if (lastActivity === new Date(Date.now() - 86400000).toDateString()) {
      // Consecutive day, increment streak
      this.streakCount = (this.streakCount || 0) + 1;
    } else {
      // Streak broken, reset to 1
      this.streakCount = 1;
    }

    this.lastActivity = new Date();
  }

  // Check completion
  if (this.progress >= this.target && !this.completed) {
    this.completed = true;
    this.completedAt = new Date();

    // Award power-ups for certain achievements
    if (this.type === 'learning_streak' && this.streakCount >= 7) {
      this.powerUps.push({
        type: 'streak_freeze',
        count: 1,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      });
    }
  }

  await this.save();
  return this;
};

module.exports = mongoose.model('Achievement', achievementSchema);
