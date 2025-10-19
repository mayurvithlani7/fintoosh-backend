// Usage: node list-children.js
const mongoose = require('mongoose');
const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/kid-budgeting-simulator';

async function listChildren(familyId = null) {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

  let query = { role: 'child' };
  if (familyId) {
    query.familyId = familyId;
  }

  const children = await User.find(query);

  if (children.length === 0) {
    console.log('No child users found.');
  } else {
    children.forEach(child => {
      console.log({
        id: child.id,
        name: child.name,
        familyId: child.familyId,
        email: child.email,
        mobileNumber: child.mobileNumber
      });
    });
    console.log(`Total: ${children.length} child user(s) found.`);
  }

  await mongoose.disconnect();
}

// Optionally pass familyId as a command-line arg
const familyIdFromArg = process.argv[2];
listChildren(familyIdFromArg).catch(err => {
  console.error('Error:', err);
  mongoose.disconnect();
});
