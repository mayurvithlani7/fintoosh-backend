const mongoose = require('mongoose');

const rewardSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  familyId: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String },
  cost: { type: Number, required: true },
  category: { type: String, enum: ['experience', 'privilege', 'item'], default: 'experience' },
  status: { type: String, enum: ['active', 'pending', 'claimed'], default: 'active' },
  available: { type: Boolean, default: true },
  purchased: { type: Boolean, default: false },
  completed: { type: Boolean, default: false },
  approved: { type: Boolean, default: false },
  approvedAt: { type: Date }, // The date when the parent approved the reward fulfillment
  purchasedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Reward', rewardSchema);
