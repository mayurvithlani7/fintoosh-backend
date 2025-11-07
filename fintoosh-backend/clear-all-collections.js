#!/usr/bin/env node

/**
 * COMPLETE DATABASE CLEAR SCRIPT
 *
 * This script clears ALL data from ALL MongoDB collections.
 * ⚠️  WARNING: This action is irreversible!
 *
 * Run with: node clear-all-collections.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import all models (only those that exist)
const User = require('./models/User');
const Chore = require('./models/Chore');
const Goal = require('./models/Goal');
const Reward = require('./models/Reward');
const Transaction = require('./models/Transaction');
const ApprovalRequest = require('./models/ApprovalRequest');
const Notification = require('./models/Notification');
const Achievement = require('./models/Achievement');
const FamilyDiscussion = require('./models/FamilyDiscussion');
const FamilyTimeline = require('./models/FamilyTimeline');
const DreamBoard = require('./models/DreamBoard');
const RealAllowance = require('./models/RealAllowance');
const AIUsage = require('./models/AIUsage');
const ChildProgress = require('./models/ChildProgress');
const EducationModule = require('./models/EducationModule');
const ParentMilestone = require('./models/ParentMilestone');

async function clearAllCollections() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    console.log('Connection string:', process.env.MONGODB_URI ? 'Found' : 'Missing');

    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://fintoosh_prod:fintoosh2024@fintoosh-cluster.mwuprcs.mongodb.net/fintoosh_prod?retryWrites=true&w=majority&appName=fintoosh-cluster';

    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to database successfully');

    // Count records before deletion
    console.log('📊 Counting existing records...');

    const counts = {
      users: await User.countDocuments(),
      chores: await Chore.countDocuments(),
      goals: await Goal.countDocuments(),
      rewards: await Reward.countDocuments(),
      transactions: await Transaction.countDocuments(),
      approvalRequests: await ApprovalRequest.countDocuments(),
      notifications: await Notification.countDocuments(),
      achievements: await Achievement.countDocuments(),
      familyDiscussions: await FamilyDiscussion.countDocuments(),
      familyTimelines: await FamilyTimeline.countDocuments(),
      dreamBoards: await DreamBoard.countDocuments(),
      realAllowances: await RealAllowance.countDocuments(),
      aiUsage: await AIUsage.countDocuments(),
      childProgress: await ChildProgress.countDocuments(),
      educationModules: await EducationModule.countDocuments(),
      parentMilestones: await ParentMilestone.countDocuments()
    };

    console.log('📊 Current data counts:');
    Object.entries(counts).forEach(([collection, count]) => {
      console.log(`  - ${collection}: ${count} records`);
    });

    const totalRecords = Object.values(counts).reduce((sum, count) => sum + count, 0);
    console.log(`\n📈 Total records across all collections: ${totalRecords}`);

    if (totalRecords === 0) {
      console.log('ℹ️ No data found to clear. Database is already empty.');
      return;
    }

    console.log('\n🚨 CRITICAL WARNING: About to delete ALL data from ALL collections!');
    console.log('This action cannot be undone!');
    console.log('Press Ctrl+C within 15 seconds to cancel...');

    await new Promise(resolve => setTimeout(resolve, 15000));

    console.log('🧹 Starting data clearance...');

    let deletedTotal = 0;

    // Clear collections in dependency order (safe deletion order)
    const collections = [
      { name: 'Notifications', model: Notification },
      { name: 'AI Usage', model: AIUsage },
      { name: 'Child Progress', model: ChildProgress },
      { name: 'Education Modules', model: EducationModule },
      { name: 'Parent Milestones', model: ParentMilestone },
      { name: 'Approval Requests', model: ApprovalRequest },
      { name: 'Transactions', model: Transaction },
      { name: 'Chores', model: Chore },
      { name: 'Goals', model: Goal },
      { name: 'Rewards', model: Reward },
      { name: 'Achievements', model: Achievement },
      { name: 'Family Discussions', model: FamilyDiscussion },
      { name: 'Family Timelines', model: FamilyTimeline },
      { name: 'Dream Boards', model: DreamBoard },
      { name: 'Real Allowances', model: RealAllowance },
      { name: 'Users', model: User } // Users last (referenced by others)
    ];

    for (const { name, model } of collections) {
      try {
        const result = await model.deleteMany({});
        const deleted = result.deletedCount || 0;
        if (deleted > 0) {
          console.log(`  ✅ Cleared ${name}: ${deleted} records`);
          deletedTotal += deleted;
        }
      } catch (error) {
        console.warn(`  ⚠️ Failed to clear ${name}: ${error.message}`);
      }
    }

    console.log(`\n🎉 Database clearance completed successfully!`);
    console.log(`🗑️ Total records deleted: ${deletedTotal}`);
    console.log('📊 Summary:');
    console.log(`  - Collections processed: ${collections.length}`);
    console.log(`  - Records before: ${totalRecords}`);
    console.log(`  - Records after: ${totalRecords - deletedTotal}`);
    console.log('\n✅ Database is now completely empty and ready for fresh data.');

  } catch (error) {
    console.error('❌ Fatal error during database clearance:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  } finally {
    try {
      await mongoose.connection.close();
      console.log('🔌 Database connection closed');
    } catch (closeError) {
      console.warn('Warning: Could not close database connection cleanly:', closeError.message);
    }
  }
}

// Run the script if executed directly
if (require.main === module) {
  clearAllCollections();
}

module.exports = { clearAllCollections };
