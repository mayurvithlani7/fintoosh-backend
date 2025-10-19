const mongoose = require('mongoose');
const User = require('./models/User');

async function addStatusField() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/kid-budgeting-simulator', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // First, let's see what users look like
    const sampleUsers = await User.find({}).limit(2);
    console.log('Sample user fields:', Object.keys(sampleUsers[0]?._doc || {}));

    // Update all users that don't have status field using MongoDB direct query
    const db = mongoose.connection.db;
    const collection = db.collection('users');

    // Update all documents that don't have status field
    const result = await collection.updateMany(
      { status: { $exists: false } },
      {
        $set: {
          status: 'active',
          deactivatedAt: null
        }
      }
    );

    console.log(`Updated ${result.modifiedCount} users with status field`);

    // Also check if any users have null/undefined status and set to active
    const nullStatusResult = await collection.updateMany(
      { status: null },
      {
        $set: {
          status: 'active',
          deactivatedAt: null
        }
      }
    );

    console.log(`Updated ${nullStatusResult.modifiedCount} users with null status`);

    // Show current status distribution
    const activeCount = await collection.countDocuments({ status: 'active' });
    const deactivatedCount = await collection.countDocuments({ status: 'deactivated' });
    const totalUsers = await collection.countDocuments({});

    console.log(`Total users: ${totalUsers}`);
    console.log(`Active users: ${activeCount}`);
    console.log(`Deactivated users: ${deactivatedCount}`);
    console.log(`Users without status field: ${totalUsers - activeCount - deactivatedCount}`);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

addStatusField();
