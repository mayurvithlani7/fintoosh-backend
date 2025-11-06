const mongoose = require('mongoose');
const softDeletePlugin = require('../models/plugins/softDelete');

// Real Allowance model for logging actual cash/digital allowances given to children
const realAllowanceSchema = new mongoose.Schema({
  familyId: {
    type: String,
    required: true,
    index: true
  },
  childId: {
    type: String,
    required: true,
    index: true
  },
  parentId: {
    type: String,
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0.01
  },
  currency: {
    type: String,
    enum: ['INR', 'USD', 'EUR', 'GBP', 'CAD', 'AUD'],
    default: 'INR'
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  method: {
    type: String,
    enum: ['Cash', 'UPI', 'Bank Transfer', 'Card', 'Wallet', 'Other'],
    default: 'Cash'
  },
  note: {
    type: String,
    maxlength: 500,
    default: ''
  },
  category: {
    type: String,
    enum: ['Allowance', 'Reward', 'Gift', 'Extra', 'Other'],
    default: 'Allowance'
  },
  // Ledger integration
  ledgerTransactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LedgerTransaction'
  }, // Links to corresponding ledger transaction
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Apply soft delete plugin with 7-year retention for financial records
realAllowanceSchema.plugin(softDeletePlugin, {
  retentionPeriods: { 'RealAllowance': 2555 } // 7 years for financial compliance
});

// Indexes for efficient queries
realAllowanceSchema.index({ familyId: 1, childId: 1, date: -1 });
realAllowanceSchema.index({ parentId: 1, createdAt: -1 });
realAllowanceSchema.index({ ledgerTransactionId: 1 });

// Update timestamp on save
realAllowanceSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('RealAllowance', realAllowanceSchema);
