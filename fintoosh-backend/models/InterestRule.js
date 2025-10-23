const mongoose = require('mongoose');

const interestRuleSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rate: {
    type: Number,
    required: true,
    min: 0,
    max: 0.1 // Maximum 10% interest
  },
  frequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    default: 'weekly'
  },
  jar: {
    type: String,
    enum: ['save', 'spend', 'donate', 'invest'],
    default: 'save'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastPayoutDate: {
    type: Date,
    default: null
  },
  totalInterestPaid: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
interestRuleSchema.index({ userId: 1, isActive: 1 });

module.exports = mongoose.model('InterestRule', interestRuleSchema);
