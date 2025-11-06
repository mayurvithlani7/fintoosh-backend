const mongoose = require('mongoose');
const softDeletePlugin = require('./plugins/softDelete');

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
      'points-move',
      'points-request',
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

// Apply soft delete plugin with 7-year retention for financial records
transactionSchema.plugin(softDeletePlugin, {
  retentionPeriods: { 'Transaction': 2555 } // 7 years for financial compliance
});

// Index for family-based queries
transactionSchema.index({ familyId: 1, createdAt: -1 });
transactionSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);
