const mongoose = require('mongoose');

const ledgerTransactionSchema = new mongoose.Schema({
  familyId: { type: String, required: true },           // Family scope for data isolation
  transactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  },                                                    // Links to existing Transaction model (optional)
  externalReference: { type: String },                  // For real allowances, bank transfers, etc.
  transactionType: {
    type: String,
    enum: [
      'transfer',        // Point transfers between jars
      'income',          // Chore rewards, interest, teaching income
      'expense',         // Reward redemptions, goal costs
      'allowance',       // Real money allowances given to children
      'adjustment',      // Balance corrections, system adjustments
      'reversal',        // Reversing previous transactions
      'investment',      // Investment-related transactions
      'external'         // Bank transfers, external payments
    ],
    required: true
  },
  description: { type: String, required: true },       // Human readable description
  totalDebit: { type: Number, required: true, min: 0 }, // Sum of all debit entries
  totalCredit: { type: Number, required: true, min: 0 }, // Sum of all credit entries
  currency: { type: String, default: 'points' },       // points, INR, USD, etc.
  exchangeRate: { type: Number, default: 1 },          // Conversion rate to base currency
  isBalanced: { type: Boolean, default: false },       // Must be true to post
  status: {
    type: String,
    enum: ['draft', 'posted', 'reversed'],
    default: 'draft'
  },
  postedDate: { type: Date },                          // When transaction was posted
  postedBy: { type: String, required: true },          // User ID who posted
  reversedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LedgerTransaction'
  },                                                   // Reference to reversing transaction
  reversalDate: { type: Date },
  entries: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LedgerEntry'
  }],                                                   // Array of all entries in this transaction
  metadata: { type: mongoose.Schema.Types.Mixed },     // Additional context data
  tags: [{ type: String }],                            // Categorization tags
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  collection: 'ledger_transactions'
});

// Indexes for efficient querying
ledgerTransactionSchema.index({ familyId: 1, status: 1, postedDate: -1 });
ledgerTransactionSchema.index({ familyId: 1, transactionType: 1, postedDate: -1 });
ledgerTransactionSchema.index({ externalReference: 1 });
ledgerTransactionSchema.index({ transactionId: 1 });

// Pre-save validation to ensure transaction is balanced
ledgerTransactionSchema.pre('save', function(next) {
  // Only validate balance for transactions that are being posted
  if (this.status === 'posted' && this.totalDebit !== this.totalCredit) {
    return next(new Error(`Unbalanced transaction: Debits (${this.totalDebit}) ≠ Credits (${this.totalCredit})`));
  }

  this.isBalanced = (this.totalDebit === this.totalCredit);
  this.updatedAt = new Date();
  next();
});

// Pre-save validation for posted transactions
ledgerTransactionSchema.pre('save', function(next) {
  if (this.status === 'posted' && !this.postedDate) {
    this.postedDate = new Date();
  }
  next();
});

// Instance method to post a transaction
ledgerTransactionSchema.methods.post = async function(postedBy) {
  if (this.status !== 'draft') {
    throw new Error('Only draft transactions can be posted');
  }

  if (!this.isBalanced) {
    throw new Error('Cannot post unbalanced transaction');
  }

  this.status = 'posted';
  this.postedDate = new Date();
  this.postedBy = postedBy;

  return this.save();
};

// Instance method to reverse a transaction
ledgerTransactionSchema.methods.reverse = async function(reason = 'Correction', reversedBy) {
  if (this.status !== 'posted') {
    throw new Error('Only posted transactions can be reversed');
  }

  // Create reversing transaction
  const reversingTransaction = new mongoose.model('LedgerTransaction')({
    familyId: this.familyId,
    transactionType: 'reversal',
    description: `Reversal: ${this.description} - ${reason}`,
    totalDebit: this.totalCredit,  // Reverse the amounts
    totalCredit: this.totalDebit,
    currency: this.currency,
    exchangeRate: this.exchangeRate,
    status: 'posted',
    postedDate: new Date(),
    postedBy: reversedBy,
    reversedBy: this._id,
    reversalDate: new Date(),
    metadata: {
      originalTransactionId: this._id,
      reversalReason: reason
    }
  });

  // Create reversing entries
  const LedgerEntry = mongoose.model('LedgerEntry');
  const reversingEntries = [];

  for (const entryId of this.entries) {
    const originalEntry = await LedgerEntry.findById(entryId);
    if (originalEntry) {
      const reversingEntry = new LedgerEntry({
        familyId: originalEntry.familyId,
        transactionId: originalEntry.transactionId,
        accountId: originalEntry.accountId,
        entryType: originalEntry.entryType === 'debit' ? 'credit' : 'debit',
        amount: originalEntry.amount,
        description: `Reversal: ${originalEntry.description}`,
        reference: originalEntry.reference,
        referenceType: originalEntry.referenceType,
        entryDate: new Date(),
        postedBy: reversedBy,
        reversedBy: originalEntry._id,
        reversalDate: new Date(),
        metadata: {
          ...originalEntry.metadata,
          reversalReason: reason,
          originalEntryId: originalEntry._id
        }
      });

      reversingEntries.push(reversingEntry);
    }
  }

  // Save reversing entries
  const savedReversingEntries = await LedgerEntry.insertMany(reversingEntries);
  reversingTransaction.entries = savedReversingEntries.map(entry => entry._id);

  // Mark original transaction as reversed
  this.status = 'reversed';
  this.reversedBy = reversingTransaction._id;
  this.reversalDate = new Date();

  // Save both transactions
  await reversingTransaction.save();
  await this.save();

  return { originalTransaction: this, reversingTransaction };
};

// Static method to create allowance transaction
ledgerTransactionSchema.statics.createAllowanceTransaction = async function(allowanceData) {
  const {
    familyId,
    allowanceId,
    childId,
    parentId,
    amount,
    currency = 'INR',
    method,
    jarType = 'current',
    description
  } = allowanceData;

  // Get account IDs
  const LedgerAccount = mongoose.model('LedgerAccount');
  const parentCapitalAccount = await LedgerAccount.findOne({
    familyId,
    userId: parentId,
    accountCode: '3001' // Parent Capital Contributions
  });

  const childJarAccount = await LedgerAccount.findOne({
    familyId,
    userId: childId,
    jarType: jarType
  });

  if (!parentCapitalAccount || !childJarAccount) {
    throw new Error('Required ledger accounts not found');
  }

  const transaction = new this({
    familyId,
    externalReference: allowanceId,
    transactionType: 'allowance',
    description: description || `Real allowance: ${method} - ${amount} ${currency}`,
    totalDebit: amount,
    totalCredit: amount,
    currency,
    status: 'draft',
    postedBy: parentId,
    metadata: {
      allowanceId,
      childId,
      method,
      jarType
    },
    tags: ['allowance', 'real-money', method.toLowerCase()]
  });

  // Create balanced entries
  const LedgerEntry = mongoose.model('LedgerEntry');
  const entries = await LedgerEntry.createBalancedEntries([
    {
      familyId,
      transactionId: transaction._id,
      accountId: parentCapitalAccount._id,
      entryType: 'debit',  // Parent capital decreases (money going out)
      amount,
      description: `Allowance payment: ${method}`,
      reference: allowanceId,
      referenceType: 'user',
      entryDate: new Date(),
      postedBy: parentId,
      metadata: { allowanceId, method }
    },
    {
      familyId,
      transactionId: transaction._id,
      accountId: childJarAccount._id,
      entryType: 'credit', // Child jar increases (money coming in)
      amount,
      description: `Allowance received: ${method}`,
      reference: allowanceId,
      referenceType: 'user',
      entryDate: new Date(),
      postedBy: parentId,
      metadata: { allowanceId, method }
    }
  ]);

  transaction.entries = entries.map(entry => entry._id);

  return transaction.save();
};

// Static method to get family financial summary
ledgerTransactionSchema.statics.getFamilyFinancialSummary = async function(familyId, asOfDate = new Date()) {
  const pipeline = [
    {
      $match: {
        familyId,
        status: 'posted',
        postedDate: { $lte: asOfDate }
      }
    },
    {
      $group: {
        _id: '$transactionType',
        count: { $sum: 1 },
        totalAmount: { $sum: '$totalDebit' }, // Could use either debit or credit since they're equal
        lastTransaction: { $max: '$postedDate' }
      }
    }
  ];

  const summary = await this.aggregate(pipeline);

  // Calculate totals by type
  const totals = {
    allowances: 0,
    transfers: 0,
    income: 0,
    expenses: 0,
    adjustments: 0,
    totalTransactions: 0
  };

  summary.forEach(item => {
    totals.totalTransactions += item.count;

    switch (item._id) {
      case 'allowance':
        totals.allowances += item.totalAmount;
        break;
      case 'transfer':
        totals.transfers += item.totalAmount;
        break;
      case 'income':
        totals.income += item.totalAmount;
        break;
      case 'expense':
        totals.expenses += item.totalAmount;
        break;
      case 'adjustment':
        totals.adjustments += item.totalAmount;
        break;
    }
  });

  return totals;
};

module.exports = mongoose.model('LedgerTransaction', ledgerTransactionSchema);
