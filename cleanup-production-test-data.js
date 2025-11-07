#!/usr/bin/env node

/**
 * PRODUCTION TEST DATA CLEANUP SCRIPT
 *
 * This script safely removes all test data created during production testing.
 * Run this locally against the production database to clean up test accounts.
 *
 * WARNING: This script will permanently delete data. Use with extreme caution.
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: './.env.production' });

// Import models
const User = require('./models/User');
const Chore = require('./models/Chore');
const Goal = require('./models/Goal');
const Reward = require('./models/Reward');
const Transaction = require('./models/Transaction');
const ApprovalRequest = require('./models/ApprovalRequest');
const Notification = require('./models/Notification');

async function cleanupTestData() {
  try {
    console.log('🔄 Connecting to MongoDB Atlas...');

    // Connect to production database
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to database');

    // Define test data identifiers
    const testFamilyId = '9876543212';
    const testParentEmail = 'testprodphase2@example.com';
    const testChildUsername = 'testchild';
    const testParentName = 'Test Parent Prod';
    const testChildName = 'Test Child';

    console.log('🔍 Finding test data...');

    // Find test users
    const testParent = await User.findOne({
      email: testParentEmail,
      name: testParentName,
      familyId: testFamilyId
    });

    const testChild = await User.findOne({
      name: testChildName,
      familyId: testFamilyId,
      role: 'child'
    });

    if (!testParent && !testChild) {
      console.log('ℹ️ No test data found to clean up');
      return;
    }

    console.log('📋 Found test data:');
    if (testParent) console.log(`  - Parent: ${testParent.name} (${testParent.email})`);
    if (testChild) console.log(`  - Child: ${testChild.name} (${testChild.id})`);

    // Confirm before deletion
    console.log('\n⚠️  WARNING: This will permanently delete all test data!');
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...');

    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('🧹 Starting cleanup...');

    let deletedCount = 0;

    // Delete in reverse dependency order

    // 1. Delete notifications
    if (testParent || testChild) {
      const userIds = [testParent?._id, testChild?._id].filter(Boolean);
      const notificationsDeleted = await Notification.deleteMany({
        $or: [
          { userId: { $in: userIds.map(id => id.toString()) } },
          { familyId: testFamilyId }
        ]
      });
      console.log(`  ✅ Deleted ${notificationsDeleted.deletedCount} notifications`);
      deletedCount += notificationsDeleted.deletedCount;
    }

    // 2. Delete approval requests
    const approvalsDeleted = await ApprovalRequest.deleteMany({
      $or: [
        { childId: testChild?.id },
        { parentId: testParent?.id },
        { familyId: testFamilyId }
      ]
    });
    console.log(`  ✅ Deleted ${approvalsDeleted.deletedCount} approval requests`);
    deletedCount += approvalsDeleted.deletedCount;

    // 3. Delete transactions
    if (testParent || testChild) {
      const userIds = [testParent?._id, testChild?._id].filter(Boolean);
      const transactionsDeleted = await Transaction.deleteMany({
        user: { $in: userIds }
      });
      console.log(`  ✅ Deleted ${transactionsDeleted.deletedCount} transactions`);
      deletedCount += transactionsDeleted.deletedCount;
    }

    // 4. Delete chores
    if (testParent || testChild) {
      const userIds = [testParent?._id, testChild?._id].filter(Boolean);
      const choresDeleted = await Chore.deleteMany({
        $or: [
          { user: { $in: userIds } },
          { parent: { $in: userIds } }
        ]
      });
      console.log(`  ✅ Deleted ${choresDeleted.deletedCount} chores`);
      deletedCount += choresDeleted.deletedCount;
    }

    // 5. Delete goals
    if (testParent || testChild) {
      const userIds = [testParent?._id, testChild?._id].filter(Boolean);
      const goalsDeleted = await Goal.deleteMany({
        $or: [
          { user: { $in: userIds } },
          { parent: { $in: userIds } }
        ]
      });
      console.log(`  ✅ Deleted ${goalsDeleted.deletedCount} goals`);
      deletedCount += goalsDeleted.deletedCount;
    }

    // 6. Delete rewards
    if (testParent || testChild) {
      const userIds = [testParent?._id, testChild?._id].filter(Boolean);
      const rewardsDeleted = await Reward.deleteMany({
        user: { $in: userIds },
        familyId: testFamilyId
      });
      console.log(`  ✅ Deleted ${rewardsDeleted.deletedCount} rewards`);
      deletedCount += rewardsDeleted.deletedCount;
    }

    // 7. Delete child user (remove from parent's caregivers array first)
    if (testChild) {
      await User.updateMany(
        { 'caregivers.userId': testChild.id },
        { $pull: { caregivers: { userId: testChild.id } } }
      );
      await User.findByIdAndDelete(testChild._id);
      console.log(`  ✅ Deleted child user: ${testChild.name}`);
      deletedCount += 1;
    }

    // 8. Delete parent user
    if (testParent) {
      await User.findByIdAndDelete(testParent._id);
      console.log(`  ✅ Deleted parent user: ${testParent.name}`);
      deletedCount += 1;
    }

    console.log(`\n🎉 Cleanup complete! Deleted ${deletedCount} records total.`);
    console.log('📊 Summary:');
    console.log(`  - Family ID: ${testFamilyId} (test data)`);
    console.log(`  - Parent account: ${testParentEmail}`);
    console.log(`  - Child account: ${testChildName}`);

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run cleanup if this script is executed directly
if (require.main === module) {
  cleanupTestData();
}

module.exports = { cleanupTestData };
