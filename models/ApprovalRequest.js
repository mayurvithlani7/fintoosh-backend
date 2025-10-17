const mongoose = require('mongoose');

const approvalRequestSchema = new mongoose.Schema({
  familyId: { type: String, required: true },     // shared by parent & all children
  childId: { type: String, required: true },      // user's id (e.g. 'kid-demo')
  parentId: { type: String, required: true },     // user's parent id (e.g. 'parent-demo')
  type: { type: String, required: true },         // e.g. 'move-points', 'points', 'reward'
  name: { type: String },                         // Name/label for UI
  amount: { type: Number, required: true },
  from: { type: String },                         // Source jar for move-points
  to: { type: String },                           // Target jar for move-points
  fromBalance: { type: Number },                  // Balance of from jar at request time
  toBalance: { type: Number },                    // Balance of to jar at request time
  reason: { type: String },
  status: { type: String, default: 'Pending', enum: ['Pending', 'Approved', 'Denied'] },
  goalId: { type: String },                       // For robust goal matching
  choreId: { type: String },                      // For robust chore matching
  rewardId: { type: String },                     // For robust reward matching (added by Cline)
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date },
  // For history:
  actedBy: { type: String },                      // Last parent id who acted
  actedAt: { type: Date },
  // For messaging:
  messages: [{
    sender: { type: String, required: true },     // 'child' or 'parent'
    userId: { type: String, required: true },     // actual user id
    text: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  }]
}, {
  collection: 'approval_requests'
});

module.exports = mongoose.model('ApprovalRequest', approvalRequestSchema);
