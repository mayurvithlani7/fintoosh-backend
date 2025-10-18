const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

async function createDemoUsers() {
  try {
    await mongoose.connect('mongodb+srv://fintoosh_prod:fintoosh2024@fintoosh-cluster.mwuprcs.mongodb.net/fintoosh_prod?retryWrites=true&w=majority&appName=fintoosh-cluster');

    // Clear existing users
    await User.deleteMany({});

    // Create a family
    const familyId = 'demo-family-123';

    // Hash passwords
    const parentPassword = await bcrypt.hash('parent123', 10);
    const childPassword = await bcrypt.hash('child123', 10);

    // Create parent user
    const parent = new User({
      id: 'parent-demo',
      name: 'Demo Parent',
      email: 'parent@demo.com',
      mobileNumber: '+1234567890',
      password: 'parent123', // Don't pre-hash, let the model handle it
      role: 'parent',
      familyId: familyId,
      currentPoints: 0,
      savePoints: 0,
      spendPoints: 0,
      donatePoints: 0,
      investPoints: 0,
      transactions: [],
      goals: [],
      chores: [],
      rewards: []
    });

    await parent.save();
    console.log('Created parent:', parent.name, parent.email);

    // Create child user
    const child = new User({
      id: 'child-demo',
      name: 'Demo Child',
      email: 'child@demo.com',
      mobileNumber: '+0987654321',
      password: 'child123', // Don't pre-hash, let the model handle it
      role: 'child',
      familyId: familyId,
      parentId: parent.id,
      currentPoints: 50,
      savePoints: 25,
      spendPoints: 30,
      donatePoints: 10,
      investPoints: 15,
      transactions: [],
      goals: [],
      chores: [],
      rewards: []
    });

    await child.save();
    console.log('Created child:', child.name, child.email);

    console.log('\nDemo users created successfully!');
    console.log('Parent login: parent@demo.com / parent123');
    console.log('Child login: child@demo.com / child123');
    console.log('Family ID:', familyId);

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error creating demo users:', error);
    await mongoose.disconnect();
  }
}

createDemoUsers();
