const ParentMilestone = require('./models/ParentMilestone');
const User = require('./models/User');
const mongoose = require('mongoose');

// Test script to verify milestone database operations
async function testMilestones() {
  try {
    console.log('🧪 Testing Parent Milestone Database Operations...');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/kid-budgeting-simulator');
    console.log('✅ Connected to MongoDB');

    // Test 1: Create a test user
    console.log('\n📝 Test 1: Creating test user...');
    const testUser = await User.findOne({ id: 'test-parent' });
    let parent;
    if (!testUser) {
      parent = new User({
        id: 'test-parent',
        name: 'Test Parent',
        email: 'test@example.com',
        mobileNumber: '9999999999',
        password: 'hashedpassword',
        familyId: 'test-family',
        role: 'parent'
      });
      await parent.save();
      console.log('✅ Created test parent:', parent.id);
    } else {
      parent = testUser;
      console.log('✅ Found existing test parent:', parent.id);
    }

    // Test 2: Create a test child
    console.log('\n👶 Test 2: Creating test child...');
    const testChild = await User.findOne({ id: 'test-child' });
    let child;
    if (!testChild) {
      child = new User({
        id: 'test-child',
        name: 'Test Child',
        email: 'child@example.com',
        mobileNumber: '9999999998',
        password: 'hashedpassword',
        familyId: 'test-family',
        role: 'child',
        parentId: parent.id
      });
      await child.save();
      console.log('✅ Created test child:', child.id);
    } else {
      child = testChild;
      console.log('✅ Found existing test child:', child.id);
    }

    // Test 3: Create milestone achievements
    console.log('\n🏆 Test 3: Creating milestone achievements...');
    const milestones = [
      {
        parentId: parent._id,
        childId: child._id,
        milestoneType: 'first_discussion',
        title: 'First Money Talk',
        description: 'Started your first family discussion about money',
        achievedAt: new Date()
      },
      {
        parentId: parent._id,
        childId: child._id,
        milestoneType: 'goal_created',
        title: 'Goal Setting Guide',
        description: 'Helped child set their first savings goal',
        achievedAt: new Date()
      }
    ];

    for (const milestoneData of milestones) {
      const milestone = new ParentMilestone(milestoneData);
      await milestone.save();
      console.log('✅ Created milestone:', milestone.title);
    }

    // Test 4: Retrieve milestones
    console.log('\n📖 Test 4: Retrieving milestones...');
    const retrievedMilestones = await ParentMilestone.find({
      parentId: parent._id,
      childId: child._id
    });

    console.log('✅ Retrieved milestones:', retrievedMilestones.length);
    retrievedMilestones.forEach((m, i) => {
      console.log(`  ${i + 1}. ${m.title} - ${m.milestoneType}`);
    });

    // Test 5: Test API-like operations
    console.log('\n🔄 Test 5: Testing API-like operations...');

    // Simulate the API call logic
    const apiMilestones = retrievedMilestones.map(m => ({
      milestoneId: m.milestoneType,
      title: m.title,
      achieved: true,
      progress: 1,
      date: m.achievedAt.toISOString().split('T')[0],
      category: m.milestoneType.split('_')[0]
    }));

    console.log('✅ API-formatted milestones:', apiMilestones.length);
    apiMilestones.forEach((m, i) => {
      console.log(`  ${i + 1}. ${m.title} - ${m.achieved ? 'Achieved' : 'Pending'}`);
    });

    console.log('\n🎉 All milestone database tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

testMilestones();
