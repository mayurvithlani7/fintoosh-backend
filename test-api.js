const mongoose = require('mongoose');
const User = require('./models/User');

async function testAPI() {
  try {
    await mongoose.connect('mongodb+srv://fintoosh_prod:fintoosh2024@fintoosh-cluster.mwuprcs.mongodb.net/fintoosh_prod?retryWrites=true&w=majority&appName=fintoosh-cluster');

    console.log('Testing family children API...');

    // Find the parent user
    const parent = await User.findOne({ email: 'parent@demo.com' });
    if (!parent) {
      console.log('❌ Parent not found');
      return;
    }

    console.log('✅ Parent found:', parent.name, 'FamilyId:', parent.familyId);

    // Test the same query as the API
    const children = await User.find({
      familyId: parent.familyId,
      role: 'child'
    }).select('-password');

    console.log('✅ Children found:', children.length);
    children.forEach(child => {
      console.log('  -', child.name, 'FamilyId:', child.familyId);
    });

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
}

testAPI();
