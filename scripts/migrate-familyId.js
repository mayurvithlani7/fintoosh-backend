// Usage: node migrate-familyId.js
// Updates all User.familyId fields to the last 10 digits of their mobileNumber.

const mongoose = require('mongoose');
const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/kid-budgeting-simulator';

async function migrateFamilyIds() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

  const users = await User.find({});
  let updated = 0;
  for (const user of users) {
    if (user.mobileNumber) {
      const digits = user.mobileNumber.replace(/\D/g, '');
      const newFamilyId = digits.slice(-10);
      if (user.familyId !== newFamilyId) {
        user.familyId = newFamilyId;
        await user.save();
        console.log(`Updated user ${user.id} (${user.email}): familyId set to ${user.familyId}`);
        updated++;
      }
    }
  }
  console.log(`Migration complete. Total users updated: ${updated}`);
  await mongoose.disconnect();
}

migrateFamilyIds().catch(err => {
  console.error('Migration error:', err);
  mongoose.disconnect();
});
