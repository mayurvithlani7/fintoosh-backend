const mongoose = require('mongoose');
const User = require('../models/User');

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/kid-budgeting-simulator');
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

// Migration function
async function migrateCurrencySettings() {
  try {
    console.log('Starting currency settings migration...');

    // Update all users who don't have currency settings
    const result = await User.updateMany(
      {
        $or: [
          { currency: { $exists: false } },
          { conversionRate: { $exists: false } },
          { showDenominations: { $exists: false } }
        ]
      },
      {
        $set: {
          currency: 'points',
          conversionRate: 1,
          showDenominations: false,
          updatedAt: new Date()
        }
      }
    );

    console.log(`Migration completed. Updated ${result.modifiedCount} users.`);

    // Verify the migration
    const totalUsers = await User.countDocuments();
    const usersWithCurrency = await User.countDocuments({
      currency: { $exists: true },
      conversionRate: { $exists: true },
      showDenominations: { $exists: true }
    });

    console.log(`Total users: ${totalUsers}`);
    console.log(`Users with currency settings: ${usersWithCurrency}`);

    if (totalUsers === usersWithCurrency) {
      console.log('✅ Migration successful! All users now have currency settings.');
    } else {
      console.log('⚠️  Migration may have issues. Not all users have currency settings.');
    }

  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Run migration
async function runMigration() {
  try {
    await connectDB();
    await migrateCurrencySettings();
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
}

// Export for potential use in other scripts
module.exports = { migrateCurrencySettings };

// Run if called directly
if (require.main === module) {
  runMigration();
}
