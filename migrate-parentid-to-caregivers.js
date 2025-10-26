const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fintoosh', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// User model (ensure it's the updated one)
const User = require('./fintoosh-backend/models/User');

const migrateParentIdToCaregivers = async () => {
  try {
    console.log('Starting migration: parentId to caregivers array');

    // Find all users that have parentId set (legacy)
    const usersWithParentId = await User.find({ parentId: { $ne: null } });

    console.log(`Found ${usersWithParentId.length} users with parentId`);

    let migratedCount = 0;

    for (const user of usersWithParentId) {
      if (user.parentId && (!user.caregivers || user.caregivers.length === 0)) {
        // Migrate: Add parentId as first caregiver with role 'parent'
        user.caregivers = [{
          userId: user.parentId,
          role: 'parent'
        }];
        user.parentId = undefined; // Remove old field (optional, but good for cleanup)
        await user.save();
        migratedCount++;
        console.log(`Migrated user ${user.id} (${user.name}): parentId ${user.parentId} -> caregivers`);
      }
    }

    console.log(`Migration completed: ${migratedCount} users migrated`);

    // Optional: Check for any remaining parentId references
    const remaining = await User.countDocuments({ parentId: { $ne: null } });
    if (remaining > 0) {
      console.warn(`Warning: ${remaining} users still have parentId set`);
    }

  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run migration
connectDB().then(migrateParentIdToCaregivers);
