const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
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
      'parent-points-adjustment'
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
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Transaction', transactionSchema);
