const mongoose = require('mongoose');
const User = require('./models/User');

// MongoDB Atlas connection string from environment
const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://fintoosh_prod:fintoosh2024@fintoosh-cluster.mwuprcs.mongodb.net/fintoosh_prod?retryWrites=true&w=majority&appName=fintoosh-cluster';

async function fixParentChildRelationship() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoUri);

    console.log('Finding families with children but missing parentId...');

    // Find all children
    const children = await User.find({ role: 'child' });

    for (const child of children) {
      if (!child.parentId) {
        console.log(`Child ${child.name} (${child.id}) is missing parentId. FamilyId: ${child.familyId}`);

        // Find the parent in the same family
        const parent = await User.findOne({
          familyId: child.familyId,
          role: 'parent'
        });

        if (parent) {
          console.log(`Found parent ${parent.name} (${parent.id}) for child ${child.name}`);

          // Update the child with parentId
          await User.updateOne(
            { _id: child._id },
            { $set: { parentId: parent.id } }
          );

          console.log(`✅ Updated child ${child.name} with parentId: ${parent.id}`);
        } else {
          console.log(`❌ No parent found for child ${child.name} in family ${child.familyId}`);
        }
      } else {
        console.log(`Child ${child.name} already has parentId: ${child.parentId}`);
      }
    }

    console.log('\nVerifying all children now have parentId...');

    const childrenWithoutParentId = await User.find({
      role: 'child',
      $or: [
        { parentId: { $exists: false } },
        { parentId: null },
        { parentId: '' }
      ]
    });

    if (childrenWithoutParentId.length === 0) {
      console.log('✅ All children now have parentId set correctly!');
    } else {
      console.log(`❌ Still ${childrenWithoutParentId.length} children without parentId:`);
      childrenWithoutParentId.forEach(child => {
        console.log(`  - ${child.name} (${child.id})`);
      });
    }

    await mongoose.disconnect();
    console.log('Disconnected from database.');
  } catch (error) {
    console.error('Error:', error);
    await mongoose.disconnect();
  }
}

// Run the fix
fixParentChildRelationship();
