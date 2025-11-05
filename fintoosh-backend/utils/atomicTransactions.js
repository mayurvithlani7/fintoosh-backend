/**
 * Atomic Transaction Utilities for Financial Operations
 * Prevents race conditions in points operations using MongoDB transactions
 */

const mongoose = require('mongoose');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

/**
 * Resolve user identifier to MongoDB ObjectId
 * Handles both custom user IDs (strings) and ObjectIds
 * @param {string|ObjectId} userIdentifier - User ID or ObjectId
 * @returns {ObjectId} - MongoDB ObjectId
 */
async function resolveUserObjectId(userIdentifier) {
  // If already an ObjectId, return it
  if (userIdentifier instanceof mongoose.Types.ObjectId) {
    return userIdentifier;
  }

  // If it's a string, try to find the user and return their _id
  if (typeof userIdentifier === 'string') {
    const user = await User.findOne({ id: userIdentifier }).select('_id');
    if (!user) {
      throw new Error(`User not found: ${userIdentifier}`);
    }
    return user._id;
  }

  throw new Error(`Invalid user identifier: ${userIdentifier}`);
}

/**
 * Execute atomic financial transaction with MongoDB session
 * @param {Function} operation - Async function that receives session and returns result
 * @returns {Promise} - Result of the atomic operation
 */
async function executeFinancialTransaction(operation) {
  const session = await mongoose.startSession();

  try {
    let result;
    await session.withTransaction(async () => {
      result = await operation(session);
    });
    console.log('✅ Financial transaction completed successfully');
    return result;
  } catch (error) {
    console.error('❌ Financial transaction failed:', error);
    throw error;
  } finally {
    await session.endSession();
  }
}

/**
 * Atomic point transfer between jars
 * @param {string} userId - User ID (custom or ObjectId)
 * @param {string} fromJar - Source jar (current, save, spend, donate, invest)
 * @param {string} toJar - Destination jar
 * @param {number} amount - Amount to transfer
 * @param {Object} transactionData - Additional transaction data
 */
async function atomicPointTransfer(userId, fromJar, toJar, amount, transactionData = {}) {
  const userObjectId = await resolveUserObjectId(userId);

  return executeFinancialTransaction(async (session) => {
    // Validate jars
    const validJars = ['current', 'save', 'spend', 'donate', 'invest'];
    if (!validJars.includes(fromJar) || !validJars.includes(toJar)) {
      throw new Error('Invalid jar specified');
    }

    // Build field names
    const fromField = `${fromJar}Points`;
    const toField = `${toJar}Points`;

    // Atomic transfer: deduct from source, add to destination
    const updatedUser = await User.findOneAndUpdate(
      { _id: userObjectId },
      {
        $inc: {
          [fromField]: -amount,
          [toField]: amount
        }
      },
      { session, new: true }
    );

    if (!updatedUser) {
      throw new Error('User not found or insufficient points');
    }

    // Create transaction record atomically
    const transaction = await Transaction.create([{
      type: 'points-move',
      description: transactionData.description || `Moved ${amount} points from ${fromJar} to ${toJar}`,
      amount: amount,
      fromJar: fromJar,
      toJar: toJar,
      user: userObjectId,
      ...transactionData
    }], { session });

    return {
      user: updatedUser,
      transaction: transaction[0]
    };
  });
}

/**
 * Atomic point reservation for pending operations (rewards, goals, etc.)
 * @param {string} userId - User ID (custom or ObjectId)
 * @param {string} jar - Jar to reserve from
 * @param {number} amount - Amount to reserve
 * @param {Object} transactionData - Additional transaction data
 */
async function atomicReservePoints(userId, jar, amount, transactionData = {}) {
  const userObjectId = await resolveUserObjectId(userId);

  return executeFinancialTransaction(async (session) => {
    const pointsField = `${jar}Points`;
    const pendingField = `pending${jar.charAt(0).toUpperCase() + jar.slice(1)}Points`;

    // Check available points and reserve atomically
    const updatedUser = await User.findOneAndUpdate(
      {
        _id: userObjectId,
        [pointsField]: { $gte: amount } // Ensure sufficient available points
      },
      {
        $inc: { [pendingField]: amount }
      },
      { session, new: true }
    );

    if (!updatedUser) {
      throw new Error(`Insufficient points in ${jar} jar for reservation`);
    }

    // Create transaction record atomically
    const transaction = await Transaction.create([{
      type: 'points-reserved',
      description: transactionData.description || `Reserved ${amount} points from ${jar} jar`,
      amount: -amount, // Negative for reservation
      fromJar: jar,
      user: userObjectId,
      ...transactionData
    }], { session });

    return {
      user: updatedUser,
      transaction: transaction[0]
    };
  });
}

/**
 * Atomic approval of reserved points (finalize deduction)
 * @param {string} userId - User ID (custom or ObjectId)
 * @param {string} jar - Jar where points were reserved
 * @param {number} amount - Amount to approve/deduct
 * @param {Object} transactionData - Additional transaction data
 */
async function atomicApproveReservedPoints(userId, jar, amount, transactionData = {}) {
  const userObjectId = await resolveUserObjectId(userId);

  return executeFinancialTransaction(async (session) => {
    const pointsField = `${jar}Points`;
    const pendingField = `pending${jar.charAt(0).toUpperCase() + jar.slice(1)}Points`;

    // Atomically deduct from both actual and pending balances
    const updatedUser = await User.findOneAndUpdate(
      { _id: userObjectId },
      {
        $inc: {
          [pointsField]: -amount,
          [pendingField]: -amount
        }
      },
      { session, new: true }
    );

    if (!updatedUser) {
      throw new Error('Failed to approve reserved points');
    }

    // Create transaction record atomically
    const transaction = await Transaction.create([{
      type: transactionData.type || 'points-approved',
      description: transactionData.description || `Approved ${amount} points from ${jar} jar`,
      amount: -amount,
      fromJar: jar,
      user: userObjectId,
      ...transactionData
    }], { session });

    return {
      user: updatedUser,
      transaction: transaction[0]
    };
  });
}

/**
 * Atomic release of reserved points (deny/cancel operation)
 * @param {string} userId - User ID (custom or ObjectId)
 * @param {string} jar - Jar where points were reserved
 * @param {number} amount - Amount to release back
 * @param {Object} transactionData - Additional transaction data
 */
async function atomicReleaseReservedPoints(userId, jar, amount, transactionData = {}) {
  const userObjectId = await resolveUserObjectId(userId);

  return executeFinancialTransaction(async (session) => {
    const pendingField = `pending${jar.charAt(0).toUpperCase() + jar.slice(1)}Points`;

    // Atomically release pending reservation
    const updatedUser = await User.findOneAndUpdate(
      { _id: userObjectId },
      {
        $inc: { [pendingField]: -amount }
      },
      { session, new: true }
    );

    if (!updatedUser) {
      throw new Error('Failed to release reserved points');
    }

    // Create transaction record atomically
    const transaction = await Transaction.create([{
      type: 'points-released',
      description: transactionData.description || `Released ${amount} reserved points back to ${jar} jar`,
      amount: amount, // Positive for release
      toJar: jar,
      user: userObjectId,
      ...transactionData
    }], { session });

    return {
      user: updatedUser,
      transaction: transaction[0]
    };
  });
}

/**
 * Atomic direct points award/deduction (admin operations, chores, etc.)
 * @param {string} userId - User ID (custom or ObjectId)
 * @param {string} jar - Jar to modify
 * @param {number} amount - Amount to add (positive) or deduct (negative)
 * @param {Object} transactionData - Additional transaction data
 */
async function atomicModifyPoints(userId, jar, amount, transactionData = {}) {
  const userObjectId = await resolveUserObjectId(userId);

  return executeFinancialTransaction(async (session) => {
    const pointsField = `${jar}Points`;

    // Atomic points modification
    const updatedUser = await User.findOneAndUpdate(
      { _id: userObjectId },
      {
        $inc: { [pointsField]: amount }
      },
      { session, new: true }
    );

    if (!updatedUser) {
      throw new Error('Failed to modify points');
    }

    // Create transaction record atomically
    const transaction = await Transaction.create([{
      type: transactionData.type || (amount > 0 ? 'points-awarded' : 'points-deducted'),
      description: transactionData.description || `${amount > 0 ? 'Awarded' : 'Deducted'} ${Math.abs(amount)} points to ${jar} jar`,
      amount: amount,
      [amount > 0 ? 'toJar' : 'fromJar']: jar,
      user: userObjectId,
      ...transactionData
    }], { session });

    return {
      user: updatedUser,
      transaction: transaction[0]
    };
  });
}

module.exports = {
  executeFinancialTransaction,
  atomicPointTransfer,
  atomicReservePoints,
  atomicApproveReservedPoints,
  atomicReleaseReservedPoints,
  atomicModifyPoints
};
