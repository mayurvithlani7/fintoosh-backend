const mongoose = require('mongoose');
 
// Sub-schema for quiz attempts
const quizAttemptSchema = new mongoose.Schema({
  attemptNumber: { type: Number, required: true },
  score: { type: Number, required: true }, // percentage
  totalQuestions: { type: Number, required: true },
  correctAnswers: { type: Number, required: true },
  timeSpent: { type: Number }, // seconds
  completedAt: { type: Date, default: Date.now },
  answers: [{ // Store user's answers for review
    questionIndex: { type: Number, required: true },
    userAnswer: { type: mongoose.Schema.Types.Mixed },
    isCorrect: { type: Boolean, required: true },
    timeSpent: { type: Number } // seconds on this question
  }]
});

// Sub-schema for lesson progress
const lessonProgressSchema = new mongoose.Schema({
  lessonIndex: { type: Number, required: true },
  completed: { type: Boolean, default: false },
  timeSpent: { type: Number, default: 0 }, // seconds
  completedAt: { type: Date },
  lastAccessedAt: { type: Date, default: Date.now }
});

// Main Child Progress schema
const childProgressSchema = new mongoose.Schema({
  child: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  family: { type: String, required: true }, // familyId for efficient queries

  module: { type: mongoose.Schema.Types.ObjectId, ref: 'EducationModule', required: true },

  // Overall progress
  status: {
    type: String,
    enum: ['not-started', 'in-progress', 'completed', 'locked'],
    default: 'not-started'
  },
  progress: { type: Number, default: 0 }, // percentage 0-100

  // Lesson tracking
  lessonsProgress: [lessonProgressSchema],
  currentLesson: { type: Number, default: 0 },

  // Quiz tracking
  quizAttempts: [quizAttemptSchema],
  quizPassed: { type: Boolean, default: false },
  bestQuizScore: { type: Number, default: 0 },

  // Rewards earned
  pointsEarned: { type: Number, default: 0 },
  badgeEarned: { type: Boolean, default: false },

  // Time tracking
  totalTimeSpent: { type: Number, default: 0 }, // seconds
  startedAt: { type: Date },
  completedAt: { type: Date },
  lastAccessedAt: { type: Date, default: Date.now },

  // Learning analytics
  learningStreak: { type: Number, default: 0 }, // consecutive days accessed
  averageSessionTime: { type: Number, default: 0 }, // seconds
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' }, // self-assessed

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Indexes for efficient queries
childProgressSchema.index({ child: 1, module: 1 }, { unique: true });
childProgressSchema.index({ family: 1, status: 1 });
childProgressSchema.index({ child: 1, status: 1 });
childProgressSchema.index({ lastAccessedAt: -1 });

// Pre-save middleware
childProgressSchema.pre('save', function(next) {
  this.updatedAt = new Date();

  // Update startedAt when first accessed
  if (this.status === 'in-progress' && !this.startedAt) {
    this.startedAt = new Date();
  }

  // Update completedAt when completed
  if (this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
  }

  next();
});

// Virtual for completion percentage based on lessons and quiz
childProgressSchema.virtual('completionPercentage').get(function() {
  if (this.status === 'completed') return 100;
  if (this.status === 'not-started') return 0;

  let totalLessons = this.lessonsProgress.length;
  let completedLessons = this.lessonsProgress.filter(l => l.completed).length;

  let lessonProgress = totalLessons > 0 ? (completedLessons / totalLessons) * 80 : 0; // 80% weight
  let quizProgress = this.quizPassed ? 20 : 0; // 20% weight

  return Math.round(lessonProgress + quizProgress);
});

// Method to update progress
childProgressSchema.methods.updateProgress = function() {
  const completion = this.completionPercentage;

  if (completion === 100 && this.quizPassed) {
    this.status = 'completed';
    this.progress = 100;
  } else if (completion > 0) {
    this.status = 'in-progress';
    this.progress = completion;
  }

  return this.save();
};

// Method to record lesson completion
childProgressSchema.methods.completeLesson = function(lessonIndex, timeSpent) {
  const lesson = this.lessonsProgress.find(l => l.lessonIndex === lessonIndex);
  if (lesson && !lesson.completed) {
    lesson.completed = true;
    lesson.completedAt = new Date();
    lesson.timeSpent += timeSpent || 0;
    this.totalTimeSpent += timeSpent || 0;
  }

  return this.updateProgress();
};

// Method to record quiz attempt
childProgressSchema.methods.recordQuizAttempt = function(score, totalQuestions, correctAnswers, timeSpent, answers) {
  const attemptNumber = this.quizAttempts.length + 1;

  this.quizAttempts.push({
    attemptNumber,
    score,
    totalQuestions,
    correctAnswers,
    timeSpent,
    answers
  });

  if (score >= 70) { // passing score
    this.quizPassed = true;
    this.bestQuizScore = Math.max(this.bestQuizScore, score);
  }

  return this.updateProgress();
};

module.exports = mongoose.model('ChildProgress', childProgressSchema);
