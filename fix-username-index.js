const mongoose = require('mongoose');

// Fix MongoDB username index to allow null values for parent accounts
async function fixUsernameIndex() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/kid-budgeting-simulator', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Drop the existing username index if it exists
    try {
      await mongoose.connection.collection('users').dropIndex('username_1');
      console.log('Dropped existing username index');
    } catch (error) {
      console.log('No existing username index to drop, or drop failed:', error.message);
    }

    // Create new sparse index that allows multiple null values
    await mongoose.connection.collection('users').createIndex(
      { username: 1 },
      {
        unique: true,
        sparse: true,
        name: 'username_sparse_unique'
      }
    );

    console.log('Created new sparse username index');

    // Verify the index
    const indexes = await mongoose.connection.collection('users').indexes();
    const usernameIndex = indexes.find(idx => idx.name === 'username_sparse_unique');
    if (usernameIndex) {
      console.log('✅ Username index verified:', usernameIndex);
    } else {
      console.log('❌ Username index not found');
    }

    console.log('✅ Username index fix completed successfully');

  } catch (error) {
    console.error('❌ Error fixing username index:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the fix
fixUsernameIndex();
