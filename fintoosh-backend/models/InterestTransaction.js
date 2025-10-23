const mongoose = require('mongoose');

const interestTransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  principalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  rate: {
    type: Number,
    required: true,
    min: 0,
    max: 0.1
  },
  payoutDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  streak: {
    type: Number,
    default: 0
  },
  frequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
interestTransactionSchema.index({ userId: 1, payoutDate: -1 });
interestTransactionSchema.index({ payoutDate: -1 });

module.exports = mongoose.model('InterestTransaction', interestTransactionSchema);
