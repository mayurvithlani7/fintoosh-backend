const mongoose = require('mongoose');

// Sub-schema for individual lessons within a module
const lessonSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  type: { type: String, enum: ['text', 'video', 'interactive', 'simulation'], default: 'text' },
  mediaUrl: { type: String }, // For videos or images
  estimatedTime: { type: Number, default: 2 }, // minutes
  order: { type: Number, default: 0 },
  interactiveData: { type: mongoose.Schema.Types.Mixed } // For custom interactive elements
});

// Sub-schema for quiz questions
const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  type: { type: String, enum: ['multiple-choice', 'true-false', 'drag-drop'], default: 'multiple-choice' },
  options: [{ type: String }], // For multiple choice
  correctAnswer: { type: mongoose.Schema.Types.Mixed, required: true }, // Can be string, array, or boolean
  explanation: { type: String },
  points: { type: Number, default: 10 }
});

// Sub-schema for quiz
const quizSchema = new mongoose.Schema({
  title: { type: String, default: 'Module Quiz' },
  questions: [questionSchema],
  passingScore: { type: Number, default: 70 }, // percentage
  maxAttempts: { type: Number, default: 3 },
  timeLimit: { type: Number } // minutes, optional
});

// Sub-schema for resources
const resourceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: { type: String, enum: ['article', 'video', 'game', 'worksheet'], default: 'article' },
  url: { type: String },
  description: { type: String },
  external: { type: Boolean, default: false }
});

// Main Education Module schema
const educationModuleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: {
    type: String,
    enum: ['saving', 'budgeting', 'investing', 'giving', 'general'],
    required: true
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  estimatedTime: { type: Number, default: 5 }, // total minutes
  description: { type: String, required: true },
  icon: { type: String, default: '📚' },
  color: { type: String, default: '#007AFF' }, // theme color

  // Content structure
  content: {
    introduction: { type: String, required: true },
    lessons: [lessonSchema],
    quiz: quizSchema,
    resources: [resourceSchema]
  },

  // Learning progression
  prerequisites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'EducationModule' }],
  unlocks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'EducationModule' }], // modules this unlocks

  // Gamification
  pointsReward: { type: Number, default: 50 },
  badgeReward: {
    title: { type: String },
    description: { type: String },
    icon: { type: String }
  },

  // Metadata
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 }, // for sorting within category
  tags: [{ type: String }],

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Indexes for efficient queries
educationModuleSchema.index({ category: 1, difficulty: 1 });
educationModuleSchema.index({ isActive: 1 });
educationModuleSchema.index({ prerequisites: 1 });

// Pre-save middleware to update timestamps
educationModuleSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('EducationModule', educationModuleSchema);
