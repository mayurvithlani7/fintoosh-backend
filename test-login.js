const mongoose = require('mongoose');
const User = require('./models/User');

async function testLogin() {
  try {
    await mongoose.connect('mongodb://localhost:27017/kid-budgeting-simulator');

    console.log('Connected to database');

    // Find the demo parent user
    const user = await User.findOne({ email: 'parent@demo.com' });
    if (!user) {
      console.log('❌ User not found!');
      return;
    }

    console.log('✅ User found:', user.name, user.email, user.role);

    // Test password comparison
    const testPassword = 'parent123';
    const isValid = await user.comparePassword(testPassword);
    console.log('Password valid for "' + testPassword + '":', isValid);

    if (isValid) {
      console.log('✅ Login should work!');
    } else {
      console.log('❌ Password mismatch');
      console.log('Stored hash starts with:', user.password.substring(0, 10) + '...');
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
}

testLogin();
