const mongoose = require('mongoose');
const User = require('./models/User');

async function createDemoOTPUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/kid-budgeting-simulator');
    console.log('Connected to MongoDB');

    // Create demo user with mobile number
    const demoUser = new User({
      id: 'demo-otp-user',
      familyId: 'demo-family-otp',
      name: 'Demo OTP User',
      email: 'demo-otp@example.com',
      password: 'password123',
      mobileNumber: '+919876543210', // Test mobile number
      role: 'child'
    });

    await demoUser.save();
    console.log('✅ Demo OTP user created successfully!');
    console.log('📱 Mobile: +919876543210');
    console.log('📧 Email: demo-otp@example.com');
    console.log('🔑 Password: password123');
    console.log('');
    console.log('🚀 Now you can test OTP login:');
    console.log('1. Go to login screen in the app');
    console.log('2. Select "Mobile OTP" tab');
    console.log('3. Enter: +919876543210');
    console.log('4. Check backend console for OTP code');
    console.log('5. Enter the code in the app');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating demo user:', error);
    process.exit(1);
  }
}

createDemoOTPUser();
