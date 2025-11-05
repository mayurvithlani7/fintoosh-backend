/**
 * Migration: Add Default Relationships for Existing Caregivers
 * Sets default relationship values for caregivers who don't have them
 */

const mongoose = require('mongoose');
const User = require('../models/User');

const PROD_CONNECTION_STRING = 'mongodb+srv://fintoosh_prod:fintoosh2024@fintoosh-cluster.mwuprcs.mongodb.net/fintoosh_prod?retryWrites=true&w=majority&appName=fintoosh-cluster';

async function migrateRelationships() {
  try {
    console.log('🔄 Starting relationship migration...');
    console.log('📡 Connecting to production database...');

    await mongoose.connect(PROD_CONNECTION_STRING);
    console.log('✅ Connected to production MongoDB');

    // Find all caregivers (parents) who don't have a relationship field
    const caregiversWithoutRelationship = await User.find({
      role: 'parent',
      relationship: { $exists: false }
    });

    console.log(`📊 Found ${caregiversWithoutRelationship.length} caregivers without relationship field`);

    let migratedCount = 0;

    for (const caregiver of caregiversWithoutRelationship) {
      console.log(`🔍 Processing caregiver: ${caregiver.id} (${caregiver.name})`);

      // Find the family to determine if this is the original parent or additional caregiver
      const familyMembers = await User.find({ familyId: caregiver.familyId, role: 'parent' });

      // If there's only one parent, they're the original parent
      // If there are multiple parents, additional ones are caregivers
      const isOriginalParent = familyMembers.length === 1;

      // Use valid enum values: 'guardian' for additional caregivers, 'mother' as default for original
      const relationship = isOriginalParent ? 'mother' : 'guardian';

      caregiver.relationship = relationship;
      await caregiver.save();

      console.log(`✅ Set relationship to '${relationship}' for ${caregiver.name}`);
      migratedCount++;
    }

    console.log('✅ Relationship migration completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   • Migrated: ${migratedCount} caregivers`);
    console.log(`   • Total processed: ${caregiversWithoutRelationship.length}`);

  } catch (error) {
    console.error('❌ Error during relationship migration:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from production MongoDB');
  }
}

// Run if called directly
if (require.main === module) {
  migrateRelationships();
}

module.exports = { migrateRelationships };
