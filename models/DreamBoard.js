const mongoose = require('mongoose');

const DreamBoardItemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: [
      'education',
      'career',
      'family',
      'home',
      'travel',
      'health',
      'hobbies',
      'charity',
      'business',
      'custom'
    ],
    required: true
  },
  targetAmount: {
    type: Number,
    required: true
  },
  currentSavings: {
    type: Number,
    default: 0
  },
  monthlyContribution: {
    type: Number,
    default: 0
  },
  targetDate: {
    type: Date,
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['planning', 'saving', 'achieved', 'cancelled'],
    default: 'planning'
  },
  imageUrl: {
    type: String,
    default: null
  },
  icon: {
    type: String,
    default: '🎯'
  },
  position: {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 }
  },
  color: {
    type: String,
    default: '#4fc1e9'
  },
  tags: [{
    type: String
  }],
  milestones: [{
    description: String,
    targetAmount: Number,
    achievedDate: Date,
    achieved: {
      type: Boolean,
      default: false
    }
  }],
  linkedGoals: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Goal'
  }],
  notes: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const DreamBoardSchema = new mongoose.Schema({
  familyId: {
    type: String,
    required: true
  },
  childId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    default: 'Our Family Dream Board'
  },
  description: {
    type: String,
    default: 'Visualizing our biggest dreams and planning how to achieve them together'
  },
  items: [DreamBoardItemSchema],
  totalDreamValue: {
    type: Number,
    default: 0
  },
  monthlyCommitment: {
    type: Number,
    default: 0
  },
  familyContributions: [{
    contributorId: mongoose.Schema.Types.ObjectId,
    contributorName: String,
    monthlyAmount: Number,
    lastContribution: Date
  }],
  inspiration: {
    quote: String,
    author: String,
    dateAdded: {
      type: Date,
      default: Date.now
    }
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  shareWithFamily: {
    type: Boolean,
    default: true
  },
  backgroundTheme: {
    type: String,
    enum: ['space', 'ocean', 'forest', 'mountain', 'city', 'custom'],
    default: 'space'
  }
}, {
  timestamps: true
});

// Index for efficient queries
DreamBoardSchema.index({ familyId: 1, childId: 1 });
DreamBoardSchema.index({ parentId: 1 });

// Calculate totals when saving
DreamBoardSchema.pre('save', function(next) {
  this.totalDreamValue = this.items.reduce((sum, item) => sum + item.targetAmount, 0);
  this.monthlyCommitment = this.items.reduce((sum, item) => sum + item.monthlyContribution, 0);
  next();
});

module.exports = mongoose.model('DreamBoard', DreamBoardSchema);
