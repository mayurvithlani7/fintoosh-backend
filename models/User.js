const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Add familyId field (required for grouping users as a family)
const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  familyId: { type: String, required: true }, // <-- NEW field; required from now on
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  mobileNumber: { type: String, required: true }, // <-- NEW field for parent mobile lookup
  password: { type: String, required: true },
  referralCode: { type: String, default: null }, // Optional referral code for parent signup
  username: { type: String, unique: true, sparse: true }, // Unique username for child login (only set for children)
  pin: { type: String }, // 4-6 digit PIN for child login (only set for children)
  role: { type: String, enum: ['parent', 'child', 'elder'], default: 'child' },
  status: { type: String, enum: ['active', 'deactivated'], default: 'active' }, // Account status for deactivation/reactivation
  deactivatedAt: { type: Date, default: null }, // Timestamp when account was deactivated
  avatar: { type: String, default: 'boy1' },
  currentPoints: { type: Number, default: 0 },
  savePoints: { type: Number, default: 0 },
  spendPoints: { type: Number, default: 0 },
  donatePoints: { type: Number, default: 0 },
  investPoints: { type: Number, default: 0 },
  // Currency settings for INR localization
  currency: { type: String, enum: ['points', 'inr'], default: 'points' },
  conversionRate: { type: Number, default: 1, min: 0.1, max: 100 }, // 1 point = X INR
  showDenominations: { type: Boolean, default: false },
  // Point automation settings - default split across money jars
  defaultSplit: {
    current: { type: Number, default: 40, min: 0, max: 100 }, // Pocket Money
    save: { type: Number, default: 30, min: 0, max: 100 },    // Savings Pot
    spend: { type: Number, default: 15, min: 0, max: 100 },   // Spending Pot
    donate: { type: Number, default: 10, min: 0, max: 100 },  // Help Others Pot
    invest: { type: Number, default: 5, min: 0, max: 100 }    // Grow Money Pot
  },
  // Automated Savings Interest/Bonus rule
  interestRule: {
    rate: { type: Number, default: 0 },
    frequency: { type: String, enum: ['weekly', 'monthly'], default: 'monthly' },
    jar: { type: String, default: 'save' }
  },
  // Parent-Defined Auto-Approval Rules
  autoApprovalRules: {
    choreClaimMax: { type: Number, default: 0 },
    rewardClaimMax: { type: Number, default: 0 },
    pointMoveMax: { type: Number, default: 0 }
  },
  goals: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Goal' }],
  chores: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Chore' }],
  rewards: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Reward' }],
  transactions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' }],
  requests: [{}],
  parentId: { type: String, default: null }, // links to parent user's id
  userLevel: { type: Number, default: 1 },
  userExperience: { type: Number, default: 0 },
  achievements: [{ type: Object, default: [] }],
  tutorialCompleted: { type: Boolean, default: false },
  isFirstTimeUser: { type: Boolean, default: function() { return this.role === 'child'; } }, // New child onboarding flag
  parentPin: { type: String, default: '1234' },
  feedbackPromptCompleted: { type: Boolean, default: false }, // persistent consent/feedback flag
  // OTP fields for mobile verification
  otpCode: { type: String, default: null },
  otpExpiresAt: { type: Date, default: null },
  otpVerified: { type: Boolean, default: false },
  // Brute force protection fields
  loginAttempts: { type: Number, default: 0 },
  lockoutUntil: { type: Date, default: null },
  // Teaching milestones gamification
  badges: [{
    milestoneType: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String },
    icon: { type: String, default: '🏆' },
    unlockedAt: { type: Date, default: Date.now },
    pointsAwarded: { type: Number, default: 0 }
  }],
  // Teaching milestones progress
  milestones: [{
    milestoneId: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String },
    category: { type: String },
    achieved: { type: Boolean, default: false },
    progress: { type: Number, default: 0 },
    maxProgress: { type: Number, default: 1 },
    achievedAt: { type: Date },
    updatedAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
