const mongoose = require('mongoose');
const User = require('./models/User');
const Chore = require('./models/Chore');

async function testAPI() {
  try {
    await mongoose.connect('mongodb+srv://fintoosh_prod:fintoosh2024@fintoosh-cluster.mwuprcs.mongodb.net/fintoosh_prod?retryWrites=true&w=majority&appName=fintoosh-cluster');

    console.log('Testing chores API...');

    // Find a child user to test chores for
    const child = await User.findOne({ role: 'child' });
    if (!child) {
      console.log('❌ No child users found');
      return;
    }

    console.log('✅ Found child user:', {
      id: child.id,
      name: child.name,
      familyId: child.familyId,
      role: child.role
    });

    // Test chores query for this child
    const chores = await Chore.find({ user: child._id });
    console.log('✅ Chores found for child:', chores.length);

    if (chores.length > 0) {
      chores.forEach(chore => {
        console.log('  - Chore:', {
          name: chore.name,
          points: chore.points,
          completed: chore.completed,
          approved: chore.approved,
          status: chore.status,
          user: chore.user?.toString()
        });
      });
    } else {
      console.log('❌ No chores found for this child');
    }

    // Also check all chores in the database
    const allChores = await Chore.find({});
    console.log('✅ Total chores in database:', allChores.length);

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
}

testAPI();
