const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  familyId: { type: String, required: true }, // For data isolation and audit
  type: {
    type: String,
    enum: [
      'chore-completion',
      'chore-completed',
      'goal-contribution',
      'reward-purchase',
      'reward-reservation',
      'donation-reservation',
      'donation-approved',
      'points-move',
      'points-request',
      'points-reserved',
      'points-released',
      'points-approved',
      'points-awarded',
      'points-deducted',
      'quiz-reward',
      'game-reward',
      'investment-growth',
      'withdrawal',
      'goal-completion',
      'parent-points-adjustment',
      'allowance-received',
      'interest-earned'
    ],
    required: true
  },
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  fromJar: { type: String, enum: ['current', 'save', 'spend', 'donate', 'invest'] },
  toJar: { type: String, enum: ['current', 'save', 'spend', 'donate', 'invest'] },
  reference: { type: mongoose.Schema.Types.ObjectId }, // Reference to goal, chore, reward, etc.
  approved: { type: Boolean, default: false },
  approvedAt: { type: Date }, // The date when the transaction was approved (if applicable)
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Index for family-based queries
transactionSchema.index({ familyId: 1, createdAt: -1 });
transactionSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);
