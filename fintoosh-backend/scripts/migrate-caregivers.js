/**
 * Production Readiness: Migrate Caregiver Data
 * Ensures all users have proper caregiver relationships
 * Run this after deploying caregiver schema changes
 */

const mongoose = require('mongoose');
const User = require('../models/User');

const PROD_CONNECTION_STRING = 'mongodb+srv://fintoosh_prod:fintoosh2024@fintoosh-cluster.mwuprcs.mongodb.net/fintoosh_prod?retryWrites=true&w=majority&appName=fintoosh-cluster';

async function migrateCaregiverData() {
  try {
    console.log('🔄 Starting caregiver data migration...');
    console.log('📡 Connecting to production database...');

    await mongoose.connect(PROD_CONNECTION_STRING);
    console.log('✅ Connected to production MongoDB');

    // Find all users who might need caregiver migration
    const users = await User.find({
      $or: [
        { caregivers: { $exists: false } },
        { caregivers: { $size: 0 } },
        { caregivers: null }
      ]
    });

    console.log(`📊 Found ${users.length} users that may need caregiver migration`);

    let migratedCount = 0;
    let skippedCount = 0;

    for (const user of users) {
      console.log(`🔍 Processing user: ${user.id} (${user.name}) - Role: ${user.role}`);

      // Skip non-child users for caregiver migration
      if (user.role !== 'child') {
        console.log(`⏭️  Skipping non-child user: ${user.id}`);
        skippedCount++;
        continue;
      }

      // Check if user already has caregivers
      if (user.caregivers && user.caregivers.length > 0) {
        console.log(`⏭️  User ${user.id} already has caregivers: ${user.caregivers.length}`);
        skippedCount++;
        continue;
      }

      // Migrate from legacy parentId to new caregivers array
      if (user.parentId) {
        console.log(`🔄 Migrating legacy parentId for user: ${user.id}`);

        // Find the parent user
        const parent = await User.findOne({ id: user.parentId });
        if (parent) {
          user.caregivers = [{
            userId: user.parentId,
            relationship: 'parent', // Default relationship
            permissions: ['read', 'approve', 'manage'], // Full permissions
            invitedAt: new Date(),
            acceptedAt: new Date(),
            status: 'active'
          }];

          await user.save();
          console.log(`✅ Migrated caregiver data for user: ${user.id}`);
          migratedCount++;
        } else {
          console.log(`⚠️  Parent not found for user ${user.id}, parentId: ${user.parentId}`);
          skippedCount++;
        }
      } else {
        console.log(`⚠️  No parentId found for child user: ${user.id}`);
        // Create empty caregivers array to prevent future migrations
        user.caregivers = [];
        await user.save();
        console.log(`📝 Initialized empty caregivers array for user: ${user.id}`);
        migratedCount++;
      }
    }

    // Also ensure all parent users have proper structure
    const parents = await User.find({ role: 'parent' });
    console.log(`👨‍👩‍👦 Checking ${parents.length} parent users for data consistency...`);

    for (const parent of parents) {
      // Ensure parents have default settings if missing
      if (!parent.autoApprovalRules) {
        parent.autoApprovalRules = {
          choreClaimMax: 50,
          rewardClaimMax: 200,
          pointMoveMax: 500
        };
        await parent.save();
        console.log(`⚙️  Added default auto-approval rules for parent: ${parent.id}`);
      }
    }

    console.log('✅ Caregiver migration completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   • Migrated: ${migratedCount} users`);
    console.log(`   • Skipped: ${skippedCount} users`);
    console.log(`   • Total processed: ${users.length} users`);

    // Verification: Count users with caregivers
    const usersWithCaregivers = await User.countDocuments({
      role: 'child',
      caregivers: { $exists: true, $ne: [] }
    });

    const totalChildren = await User.countDocuments({ role: 'child' });

    console.log(`🔍 Verification:`);
    console.log(`   • Children with caregivers: ${usersWithCaregivers}`);
    console.log(`   • Total children: ${totalChildren}`);
    console.log(`   • Coverage: ${((usersWithCaregivers / totalChildren) * 100).toFixed(1)}%`);

  } catch (error) {
    console.error('❌ Error during caregiver migration:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from production MongoDB');
  }
}

// Run if called directly
if (require.main === module) {
  migrateCaregiverData();
}

module.exports = { migrateCaregiverData };
