const mongoose = require('mongoose');

const FamilyTimelineEntrySchema = new mongoose.Schema({
  year: {
    type: Number,
    required: true
  },
  age: {
    type: Number,
    required: true
  },
  event: {
    type: String,
    required: true,
    enum: [
      'birth',
      'school_start',
      'first_savings',
      'first_goal_achieved',
      'school_fees_saved',
      'diwali_savings',
      'birthday_savings',
      'exam_fees_saved',
      'first_investment',
      'college_fees_saved',
      'marriage_savings',
      'first_job',
      'house_down_payment',
      'retirement_planning',
      'custom'
    ]
  },
  customEvent: {
    type: String,
    default: null
  },
  amount: {
    type: Number,
    default: 0
  },
  description: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    default: '🎯'
  },
  significance: {
    type: String,
    enum: ['low', 'medium', 'high', 'milestone'],
    default: 'medium'
  }
});

const FamilyTimelineSchema = new mongoose.Schema({
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
    default: 'Our Family Money Journey'
  },
  description: {
    type: String,
    default: 'Tracking our family\'s financial milestones and achievements over time'
  },
  timeline: [FamilyTimelineEntrySchema],
  currentProjection: {
    childAge: {
      type: Number,
      required: true
    },
    monthlySavings: {
      type: Number,
      default: 0
    },
    annualGrowth: {
      type: Number,
      default: 0.05 // 5% annual growth
    },
    targetAmount: {
      type: Number,
      default: 0
    },
    yearsToTarget: {
      type: Number,
      default: 0
    }
  },
  familyWisdom: [{
    elderName: String,
    advice: String,
    dateShared: {
      type: Date,
      default: Date.now
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
FamilyTimelineSchema.index({ familyId: 1, childId: 1 });
FamilyTimelineSchema.index({ parentId: 1 });

module.exports = mongoose.model('FamilyTimeline', FamilyTimelineSchema);
