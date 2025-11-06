const mongoose = require('mongoose');

const ledgerAccountSchema = new mongoose.Schema({
  familyId: { type: String, required: true },           // Family scope for data isolation
  userId: { type: String, required: true },             // User who owns this account
  accountType: {
    type: String,
    enum: ['asset', 'liability', 'equity', 'income', 'expense'],
    required: true
  },
  accountSubtype: {
    type: String,
    enum: ['cash', 'receivable', 'payable', 'capital', 'retained-earnings', 'revenue', 'cost'],
    required: true
  },
  accountCode: { type: String, required: true },        // Unique code like '1001', '2001'
  accountName: { type: String, required: true },        // Human readable name
  jarType: {
    type: String,
    enum: ['current', 'save', 'spend', 'donate', 'invest', 'external', null],
    default: null
  },                                                     // Links to money jars or external accounts
  description: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  balance: { type: Number, default: 0 },                // Running balance (calculated field)
  normalBalance: {
    type: String,
    enum: ['debit', 'credit'],
    required: true
  },                                                    // Normal balance side for this account type
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  collection: 'ledger_accounts'
});

// Compound index for unique account codes per family
ledgerAccountSchema.index({ familyId: 1, accountCode: 1 }, { unique: true });
ledgerAccountSchema.index({ familyId: 1, userId: 1, jarType: 1 });

// Pre-save middleware to set normal balance based on account type
ledgerAccountSchema.pre('save', function(next) {
  // Set normal balance side based on account type (accounting convention)
  const normalBalances = {
    'asset': 'debit',
    'liability': 'credit',
    'equity': 'credit',
    'income': 'credit',
    'expense': 'debit'
  };

  this.normalBalance = normalBalances[this.accountType];
  this.updatedAt = new Date();
  next();
});

// Static method to create default chart of accounts for a family
ledgerAccountSchema.statics.createDefaultChartOfAccounts = async function(familyId, userId) {
  const defaultAccounts = [
    // Asset Accounts (Money Jars)
    {
      accountType: 'asset',
      accountSubtype: 'cash',
      accountCode: '1001',
      accountName: 'Current/Pocket Money',
      jarType: 'current',
      description: 'Available spending money'
    },
    {
      accountType: 'asset',
      accountSubtype: 'cash',
      accountCode: '1002',
      accountName: 'Savings Pot',
      jarType: 'save',
      description: 'Money set aside for savings goals'
    },
    {
      accountType: 'asset',
      accountSubtype: 'cash',
      accountCode: '1003',
      accountName: 'Spending Pot',
      jarType: 'spend',
      description: 'Money allocated for purchases and fun'
    },
    {
      accountType: 'asset',
      accountSubtype: 'cash',
      accountCode: '1004',
      accountName: 'Donation Pot',
      jarType: 'donate',
      description: 'Money dedicated to helping others'
    },
    {
      accountType: 'asset',
      accountSubtype: 'cash',
      accountCode: '1005',
      accountName: 'Investment Pot',
      jarType: 'invest',
      description: 'Money for long-term growth and investing'
    },

    // Equity Accounts (Parent Contributions)
    {
      accountType: 'equity',
      accountSubtype: 'capital',
      accountCode: '3001',
      accountName: 'Parent Capital Contributions',
      description: 'Points contributed by parents'
    },
    {
      accountType: 'equity',
      accountSubtype: 'retained-earnings',
      accountCode: '3002',
      accountName: 'Retained Earnings',
      description: 'Accumulated earnings from chores and activities'
    },
    {
      accountType: 'equity',
      accountSubtype: 'retained-earnings',
      accountCode: '3003',
      accountName: 'Accumulated Interest',
      description: 'Interest earned on savings'
    },

    // Income Accounts
    {
      accountType: 'income',
      accountSubtype: 'revenue',
      accountCode: '4001',
      accountName: 'Chore Rewards Income',
      description: 'Income from completed chores'
    },
    {
      accountType: 'income',
      accountSubtype: 'revenue',
      accountCode: '4002',
      accountName: 'Interest Income',
      description: 'Interest earned on savings accounts'
    },
    {
      accountType: 'income',
      accountSubtype: 'revenue',
      accountCode: '4003',
      accountName: 'Teaching Rewards Income',
      description: 'Income from teaching activities'
    },
    {
      accountType: 'income',
      accountSubtype: 'revenue',
      accountCode: '4004',
      accountName: 'Quiz Rewards Income',
      description: 'Income from quiz completions'
    },

    // Expense Accounts
    {
      accountType: 'expense',
      accountSubtype: 'cost',
      accountCode: '5001',
      accountName: 'Reward Redemptions',
      description: 'Cost of redeemed rewards'
    },
    {
      accountType: 'expense',
      accountSubtype: 'cost',
      accountCode: '5002',
      accountName: 'Goal Achievement Costs',
      description: 'Points spent achieving goals'
    },
    {
      accountType: 'expense',
      accountSubtype: 'cost',
      accountCode: '5003',
      accountName: 'Transfer Fees',
      description: 'Fees for point transfers'
    }
  ];

  const accounts = [];
  for (const accountData of defaultAccounts) {
    const account = new this({
      familyId,
      userId,
      ...accountData
    });
    accounts.push(account);
  }

  return this.insertMany(accounts);
};

module.exports = mongoose.model('LedgerAccount', ledgerAccountSchema);
