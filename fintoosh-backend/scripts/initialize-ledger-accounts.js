const mongoose = require('mongoose');
const LedgerAccount = require('../../models/LedgerAccount');
const User = require('../../models/User');
require('dotenv').config();

/**
 * Initialize ledger accounts for all existing families
 * This script creates the chart of accounts for each family that doesn't have one yet
 */
async function initializeLedgerAccounts() {
  try {
    console.log('🔄 Starting ledger account initialization...');

    // Connect to MongoDB
   const mongoUri = 'mongodb+srv://fintoosh_prod:fintoosh2024@fintoosh-cluster.mwuprcs.mongodb.net/fintoosh_prod?retryWrites=true&w=majority&appName=fintoosh-cluster';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Get all unique family IDs
    const families = await User.distinct('familyId');
    console.log(`📊 Found ${families.length} families`);

    let totalAccountsCreated = 0;

    // Process each family
    for (const familyId of families) {
      console.log(`\n🏠 Processing family: ${familyId}`);

      // Check if this family already has ledger accounts
      const existingAccounts = await LedgerAccount.countDocuments({ familyId });
      if (existingAccounts > 0) {
        console.log(`⏭️  Family ${familyId} already has ${existingAccounts} ledger accounts, skipping...`);
        continue;
      }

      // Get a user from this family to use as the account owner
      const familyUser = await User.findOne({ familyId }).select('id name');
      if (!familyUser) {
        console.log(`⚠️  No users found for family ${familyId}, skipping...`);
        continue;
      }

      console.log(`👤 Creating accounts for family member: ${familyUser.name} (${familyUser.id})`);

      // Create default chart of accounts for this family
      const accountsCreated = await LedgerAccount.createDefaultChartOfAccounts(familyId, familyUser.id);
      totalAccountsCreated += accountsCreated.length;

      console.log(`✅ Created ${accountsCreated.length} ledger accounts for family ${familyId}`);
    }

    console.log(`\n🎉 Ledger account initialization complete!`);
    console.log(`📈 Total accounts created: ${totalAccountsCreated}`);
    console.log(`👨‍👩‍👧‍👦 Families processed: ${families.length}`);

  } catch (error) {
    console.error('❌ Error initializing ledger accounts:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the script
if (require.main === module) {
  initializeLedgerAccounts();
}

module.exports = { initializeLedgerAccounts };
