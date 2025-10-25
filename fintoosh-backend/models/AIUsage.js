const mongoose = require('mongoose');

const aiUsageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  date: {
    type: String, // YYYY-MM-DD format
    required: true
  },
  questionCount: {
    type: Number,
    default: 0,
    min: 0,
    max: 10 // Maximum 10 questions per day
  },
  lastQuestionTime: {
    type: Date,
    default: null
  },
  messages: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    messageLength: {
      type: Number,
      min: 0
    },
    responseLength: {
      type: Number,
      min: 0
    },
    question: {
      type: String,
      maxlength: 1000
    },
    response: {
      type: String,
      maxlength: 5000
    }
  }],
  resetTime: {
    type: Date,
    default: function() {
      // Next midnight
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      return tomorrow;
    }
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
aiUsageSchema.index({ userId: 1, date: 1 }, { unique: true });

// Static method to get or create daily usage record
aiUsageSchema.statics.getOrCreateDailyUsage = async function(userId, date = null) {
  const targetDate = date || new Date().toISOString().split('T')[0];

  let usageRecord = await this.findOne({ userId, date: targetDate });

  if (!usageRecord) {
    usageRecord = new this({
      userId,
      date: targetDate,
      questionCount: 0,
      messages: []
    });
    await usageRecord.save();
  }

  return usageRecord;
};

// Method to check if user can ask a question
aiUsageSchema.methods.canAskQuestion = function() {
  return this.questionCount < 10; // Max 10 questions per day
};

// Method to add a question
aiUsageSchema.methods.addQuestion = function(messageLength, responseLength, question = '', response = '') {
  if (!this.canAskQuestion()) {
    throw new Error('Daily question limit reached');
  }

  this.questionCount += 1;
  this.lastQuestionTime = new Date();

  this.messages.push({
    timestamp: new Date(),
    messageLength,
    responseLength,
    question,
    response
  });

  return this.save();
};

// Static method to get remaining questions for user
aiUsageSchema.statics.getRemainingQuestions = async function(userId) {
  const today = new Date().toISOString().split('T')[0];
  const usageRecord = await this.getOrCreateDailyUsage(userId, today);

  return Math.max(0, 10 - usageRecord.questionCount);
};

// Static method to check if user can ask question
aiUsageSchema.statics.canUserAskQuestion = async function(userId) {
  const today = new Date().toISOString().split('T')[0];
  const usageRecord = await this.getOrCreateDailyUsage(userId, today);

  const canAsk = usageRecord.canAskQuestion();
  const remaining = Math.max(0, 10 - usageRecord.questionCount);

  let resetTime = null;
  if (!canAsk) {
    // Calculate next reset time (tomorrow at midnight)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    resetTime = tomorrow;
  }

  return {
    canAsk,
    remainingQuestions: remaining,
    resetTime,
    reason: canAsk ? null : 'Daily question limit reached'
  };
};

// Static method to record a question
aiUsageSchema.statics.recordQuestion = async function(userId, messageLength, responseLength, question = '', response = '') {
  const today = new Date().toISOString().split('T')[0];
  const usageRecord = await this.getOrCreateDailyUsage(userId, today);

  return usageRecord.addQuestion(messageLength, responseLength, question, response);
};

// Pre-save middleware to ensure question count doesn't exceed limit
aiUsageSchema.pre('save', function(next) {
  if (this.questionCount > 10) {
    this.questionCount = 10;
  }
  next();
});

module.exports = mongoose.model('AIUsage', aiUsageSchema);
