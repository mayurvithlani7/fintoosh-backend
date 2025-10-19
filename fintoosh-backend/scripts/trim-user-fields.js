// Usage: node trim-user-fields.js
const mongoose = require('mongoose');
const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/kid-budgeting-simulator'; // Set your correct URI

async function runCleanup() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

  const users = await User.find({});
  let updatedCount = 0;

  for (const user of users) {
    let dirty = false;
    // Ensure all fields are present and fix only if necessary
    if (typeof user.familyId === 'string') {
      const trimmed = user.familyId.trim();
      if (trimmed !== user.familyId) { user.familyId = trimmed; dirty = true; }
    }
    if (typeof user.mobileNumber === 'string') {
      const trimmed = user.mobileNumber.trim();
      if (trimmed !== user.mobileNumber) { user.mobileNumber = trimmed; dirty = true; }
    }
    if (user.parentId && typeof user.parentId === 'string') {
      const trimmed = user.parentId.trim();
      if (trimmed !== user.parentId) { user.parentId = trimmed; dirty = true; }
    }
    if (typeof user.email === 'string') {
      const trimmed = user.email.trim().toLowerCase();
      if (trimmed !== user.email) { user.email = trimmed; dirty = true; }
    }
    if (dirty) {
      await user.save();
      updatedCount++;
      console.log(`Updated user ${user.id || user._id}: trimmed fields`);
    }
  }

  await mongoose.disconnect();
  console.log(`Cleanup complete. Total users with changes: ${updatedCount}`);
}

runCleanup().catch(err => {
  console.error('Cleanup failed:', err);
  mongoose.disconnect();
});
