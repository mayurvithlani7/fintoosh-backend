const mongoose = require('mongoose');
const User = require('./models/User');

async function checkUsers() {
  try {
    await mongoose.connect('mongodb://localhost:27017/kid-budgeting-simulator');
    const users = await User.find({}, 'name email role familyId');
    console.log('Users in database:');
    users.forEach(user => {
      console.log(`  ${user.name} (${user.email}) - Role: ${user.role}, FamilyId: ${user.familyId}`);
    });

    // Check for parents
    const parents = await User.find({role: 'parent'}, 'name email familyId');
    console.log('\nParents:');
    parents.forEach(async (parent) => {
      console.log(`  ${parent.name} - FamilyId: ${parent.familyId}`);

      // Find children in this family
      const children = await User.find({familyId: parent.familyId, role: 'child'}, 'name email');
      console.log(`    Children in family ${parent.familyId}:`);
      children.forEach(child => {
        console.log(`      ${child.name} (${child.email})`);
      });
      if (children.length === 0) {
        console.log(`      No children found`);
      }
    });

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    await mongoose.disconnect();
  }
}

checkUsers();
