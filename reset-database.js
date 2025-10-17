const mongoose = require('mongoose');
const User = require('./models/User');

// Reset database to fix index issues
async function resetDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/kid-budgeting-simulator', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Drop all existing indexes on users collection
    try {
      await mongoose.connection.collection('users').dropIndexes();
      console.log('Dropped all indexes from users collection');
    } catch (error) {
      console.log('No indexes to drop or drop failed:', error.message);
    }

    // Clear all existing users (for clean testing)
    const deletedCount = await User.deleteMany({});
    console.log(`Cleared ${deletedCount.deletedCount} existing users`);

    // Create fresh sparse index for username
    await mongoose.connection.collection('users').createIndex(
      { username: 1 },
      {
        unique: true,
        sparse: true,
        name: 'username_sparse_unique'
      }
    );

    console.log('✅ Created fresh sparse username index');

    // Verify indexes
    const indexes = await mongoose.connection.collection('users').indexes();
    console.log('Current indexes:', indexes.map(idx => idx.name));

    console.log('✅ Database reset completed successfully!');
    console.log('✅ You can now create parent accounts without conflicts');

  } catch (error) {
    console.error('❌ Error resetting database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the reset
resetDatabase();
