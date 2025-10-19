const mongoose = require('mongoose');

const FamilyDiscussionSchema = new mongoose.Schema({
  familyId: {
    type: String,
    required: true
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  childId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  topic: {
    type: String,
    required: true,
    enum: [
      'daily-spending',
      'saving-goals',
      'needs-vs-wants',
      'budget-planning',
      'family-values',
      'future-planning',
      'custom'
    ]
  },
  customTopic: {
    type: String,
    default: null
  },
  discussionDate: {
    type: Date,
    default: Date.now
  },
  duration: {
    type: Number, // in minutes
    default: 15
  },
  participants: [{
    userId: mongoose.Schema.Types.ObjectId,
    role: {
      type: String,
      enum: ['parent', 'child', 'grandparent', 'guardian']
    },
    attended: {
      type: Boolean,
      default: true
    }
  }],
  keyLearnings: [{
    type: String
  }],
  actionItems: [{
    description: String,
    assignedTo: mongoose.Schema.Types.ObjectId,
    completed: {
      type: Boolean,
      default: false
    },
    dueDate: Date
  }],
  mood: {
    type: String,
    enum: ['excellent', 'good', 'okay', 'challenging'],
    default: 'good'
  },
  notes: {
    type: String,
    default: ''
  },
  nextDiscussionDate: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for efficient queries
FamilyDiscussionSchema.index({ familyId: 1, discussionDate: -1 });
FamilyDiscussionSchema.index({ parentId: 1, childId: 1 });

module.exports = mongoose.model('FamilyDiscussion', FamilyDiscussionSchema);
