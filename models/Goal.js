const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  description: { type: String },
  targetAmount: { type: Number, required: true },
  currentAmount: { type: Number, default: 0 },
  jar: { type: String, enum: ['current', 'save', 'spend', 'donate', 'invest'], default: 'save' },
  deadline: { type: Date },
  status: { type: String, enum: ['active', 'pending', 'completed', 'expired'], default: 'active' },
  completed: { type: Boolean, default: false },
  completedAt: { type: Date },
  // Enhanced goal management fields
  templateId: { type: String, required: false },
  milestones: [{
    description: { type: String, required: true },
    targetAmount: { type: Number, required: true },
    reward: { type: String },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date }
  }],
  collaborators: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // for family goals
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Goal', goalSchema);
