const mongoose = require('mongoose');

const choreSchema = new mongoose.Schema({
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  description: { type: String },
  points: { type: Number, required: true },
  frequency: { type: String, enum: ['daily', 'weekly', 'monthly', 'once'], default: 'once' },
  deadline: { type: Date },
  completed: { type: Boolean, default: false },
  approved: { type: Boolean, default: false },
  approvedAt: { type: Date }, // The date when the parent approved the chore as completed
  completedAt: { type: Date },
  // Point automation - split settings
  useDefaultSplit: { type: Boolean, default: true }, // Use family default or custom split
  customSplit: {
    current: { type: Number, default: 0, min: 0, max: 100 }, // Pocket Money
    save: { type: Number, default: 0, min: 0, max: 100 },    // Savings Pot
    spend: { type: Number, default: 0, min: 0, max: 100 },   // Spending Pot
    donate: { type: Number, default: 0, min: 0, max: 100 },  // Help Others Pot
    invest: { type: Number, default: 0, min: 0, max: 100 }   // Grow Money Pot
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Chore', choreSchema);
