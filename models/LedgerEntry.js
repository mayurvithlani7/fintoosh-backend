const mongoose = require('mongoose');

const ledgerEntrySchema = new mongoose.Schema({
  familyId: { type: String, required: true },           // Family scope for data isolation
  transactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
    required: true
  },                                                    // Links to existing Transaction model
  ledgerTransactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LedgerTransaction'
  },                                                    // Links to ledger transaction header
  accountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LedgerAccount',
    required: true
  },                                                    // Which account this entry affects
  entryType: {
    type: String,
    enum: ['debit', 'credit'],
    required: true
  },                                                    // Debit or credit entry
  amount: { type: Number, required: true, min: 0 },    // Always positive amount
  description: { type: String, required: true },       // Human readable description
  reference: { type: mongoose.Schema.Types.ObjectId },  // Reference to goal, chore, reward, etc.
  referenceType: {
    type: String,
    enum: ['goal', 'chore', 'reward', 'transfer', 'interest', 'external', 'user']
  },                                                    // Type of referenced object
  entryDate: { type: Date, default: Date.now },        // When the entry was created
  postedBy: { type: String, required: true },          // User ID who created this entry
  isReversed: { type: Boolean, default: false },       // If this entry has been reversed
  reversedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LedgerEntry'
  },                                                    // Reference to reversing entry
  reversalDate: { type: Date },                         // When reversal occurred
  metadata: { type: mongoose.Schema.Types.Mixed },      // Additional context data
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  collection: 'ledger_entries'
});

// Indexes for efficient querying
ledgerEntrySchema.index({ familyId: 1, transactionId: 1 });
ledgerEntrySchema.index({ familyId: 1, accountId: 1, entryDate: -1 });
ledgerEntrySchema.index({ familyId: 1, entryDate: -1 });
ledgerEntrySchema.index({ accountId: 1, entryDate: -1 });

// Pre-save validation to ensure amount is positive
ledgerEntrySchema.pre('save', function(next) {
  if (this.amount < 0) {
    return next(new Error('Ledger entry amount must be positive'));
  }
  this.updatedAt = new Date();
  next();
});

// Static method to create balanced entries for a transaction
ledgerEntrySchema.statics.createBalancedEntries = async function(entriesData) {
  // Validate that entries balance (total debits = total credits)
  const totalDebits = entriesData
    .filter(entry => entry.entryType === 'debit')
    .reduce((sum, entry) => sum + entry.amount, 0);

  const totalCredits = entriesData
    .filter(entry => entry.entryType === 'credit')
    .reduce((sum, entry) => sum + entry.amount, 0);

  if (totalDebits !== totalCredits) {
    throw new Error(`Unbalanced transaction: Debits (${totalDebits}) ≠ Credits (${totalCredits})`);
  }

  // Create and save all entries
  const entries = [];
  for (const entryData of entriesData) {
    const entry = new this(entryData);
    entries.push(entry);
  }

  return this.insertMany(entries);
};

// Static method to reverse an entry (for corrections)
ledgerEntrySchema.statics.reverseEntry = async function(originalEntryId, reversalReason = 'Correction') {
  const originalEntry = await this.findById(originalEntryId);
  if (!originalEntry) {
    throw new Error('Original entry not found');
  }

  if (originalEntry.isReversed) {
    throw new Error('Entry has already been reversed');
  }

  // Create reversing entry with opposite type
  const reversingEntry = new this({
    familyId: originalEntry.familyId,
    transactionId: originalEntry.transactionId,
    accountId: originalEntry.accountId,
    entryType: originalEntry.entryType === 'debit' ? 'credit' : 'debit',
    amount: originalEntry.amount,
    description: `Reversal: ${originalEntry.description} - ${reversalReason}`,
    reference: originalEntry.reference,
    referenceType: originalEntry.referenceType,
    entryDate: new Date(),
    postedBy: originalEntry.postedBy, // Keep original poster for audit
    reversedBy: originalEntry._id,
    reversalDate: new Date(),
    metadata: {
      ...originalEntry.metadata,
      reversalReason,
      originalEntryId: originalEntry._id
    }
  });

  // Mark original as reversed
  originalEntry.isReversed = true;
  originalEntry.reversalDate = new Date();
  originalEntry.updatedAt = new Date();

  // Save both entries
  await reversingEntry.save();
  await originalEntry.save();

  return { originalEntry, reversingEntry };
};

// Method to get account balance as of a certain date
ledgerEntrySchema.statics.getAccountBalance = async function(accountId, asOfDate = new Date()) {
  const pipeline = [
    {
      $match: {
        accountId: mongoose.Types.ObjectId(accountId),
        entryDate: { $lte: asOfDate },
        isReversed: false
      }
    },
    {
      $group: {
        _id: '$accountId',
        totalDebits: {
          $sum: { $cond: [{ $eq: ['$entryType', 'debit'] }, '$amount', 0] }
        },
        totalCredits: {
          $sum: { $cond: [{ $eq: ['$entryType', 'credit'] }, '$amount', 0] }
        }
      }
    }
  ];

  const result = await this.aggregate(pipeline);
  if (result.length === 0) return 0;

  const { totalDebits, totalCredits } = result[0];

  // Get account normal balance to determine sign
  const account = await mongoose.model('LedgerAccount').findById(accountId);
  if (!account) return 0;

  // For accounts with normal debit balance (assets, expenses)
  if (account.normalBalance === 'debit') {
    return totalDebits - totalCredits;
  }
  // For accounts with normal credit balance (liabilities, equity, income)
  else {
    return totalCredits - totalDebits;
  }
};

module.exports = mongoose.model('LedgerEntry', ledgerEntrySchema);
