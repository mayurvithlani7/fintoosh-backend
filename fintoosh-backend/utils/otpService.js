const otpGenerator = require('otp-generator');
const User = require('../models/User');

// Msg91 configuration
const MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY;
const MSG91_SENDER_ID = process.env.MSG91_SENDER_ID || 'FINTOO';

if (MSG91_AUTH_KEY) {
  console.log('✅ OTP Service initialized with Msg91');
} else {
  console.log('⚠️ OTP Service initialized - Msg91 credentials not configured');
}

class OTPService {
  /**
   * Generate a 6-digit numeric OTP
   * @returns {string} Generated OTP
   */
  static generateOTP() {
    return otpGenerator.generate(6, {
      digits: true,
      alphabets: false,
      upperCase: false,
      specialChars: false
    });
  }

  /**
   * Send OTP via SMS using Msg91
   * @param {string} phoneNumber - Recipient phone number (with country code)
   * @param {string} otp - OTP to send
   * @returns {Promise<boolean>} Success status
   */
  static async sendOTP(phoneNumber, otp) {
    try {
      console.log(`🔍 MSG91_AUTH_KEY present: ${!!MSG91_AUTH_KEY}`);
      console.log(`📱 Attempting to send OTP ${otp} to ${phoneNumber}`);

      if (!MSG91_AUTH_KEY) {
        console.log(`📱 DEV MODE: OTP ${otp} would be sent to ${phoneNumber} (no API key)`);
        return true; // Return true for development if no API key
      }

      // Remove country code (+91) for Msg91 API
      const mobileNumber = phoneNumber.replace(/^\+91/, '');
      console.log(`📱 Cleaned mobile number: ${mobileNumber}`);

      const payload = {
        mobile: mobileNumber,
        sender: MSG91_SENDER_ID,
        message: `Your Fintoosh verification code is: ${otp}`,
        otp: otp
      };

      console.log(`📤 Sending to Msg91 API:`, JSON.stringify(payload, null, 2));

      const response = await fetch('https://api.msg91.com/api/v5/otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authkey': MSG91_AUTH_KEY
        },
        body: JSON.stringify(payload)
      });

      console.log(`📡 Msg91 API Response Status: ${response.status}`);

      const result = await response.json();
      console.log(`📡 Msg91 API Response:`, JSON.stringify(result, null, 2));

      if (result.type === 'success') {
        console.log(`✅ OTP sent successfully to ${phoneNumber} via Msg91`);
        return true;
      } else {
        console.error('❌ Msg91 API Error:', result.message || result);
        return false;
      }
    } catch (error) {
      console.error('❌ Msg91 API Network Error:', error.message);
      console.error('❌ Full error:', error);
      return false;
    }
  }

  /**
   * Store OTP for user (encrypted and with expiration)
   * @param {string} userId - User ID
   * @param {string} otp - OTP to store
   * @returns {Promise<boolean>} Success status
   */
  static async storeOTP(userId, otp) {
    try {
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes (increased from 5)

      await User.findByIdAndUpdate(userId, {
        otpCode: otp, // In production, encrypt this
        otpExpiresAt: expiresAt,
        otpVerified: false
      });

      console.log(`💾 OTP stored for user ${userId}, expires at ${expiresAt}`);
      return true;
    } catch (error) {
      console.error('Error storing OTP:', error);
      return false;
    }
  }

  /**
   * Verify OTP for user
   * @param {string} userId - User ID
   * @param {string} otp - OTP to verify
   * @returns {Promise<boolean>} Verification status
   */
  static async verifyOTP(userId, otp) {
    try {
      const user = await User.findById(userId);

      if (!user || !user.otpCode || !user.otpExpiresAt) {
        return false;
      }

      // Check if OTP has expired
      if (new Date() > user.otpExpiresAt) {
        // Clear expired OTP
        await User.findByIdAndUpdate(userId, {
          otpCode: null,
          otpExpiresAt: null,
          otpVerified: false
        });
        return false;
      }

    // Verify OTP
    if (user.otpCode === otp) {
      // Mark as verified and clear OTP
      await User.findByIdAndUpdate(userId, {
        otpCode: null,
        otpExpiresAt: null,
        otpVerified: true,
        updatedAt: new Date()
      });
      return true;
    }

      return false;
    } catch (error) {
      console.error('Error verifying OTP:', error);
      return false;
    }
  }

  /**
   * Check if user can request new OTP (rate limiting)
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Whether user can request OTP
   */
  static async canRequestOTP(userId) {
    try {
      const user = await User.findById(userId);

      if (!user) return false;

      // Allow new OTP if no existing OTP or if previous one expired
      if (!user.otpExpiresAt || new Date() > user.otpExpiresAt) {
        return true;
      }

      // Rate limit: don't allow new OTP within 30 seconds of last request (reduced from 60)
      const timeSinceLastOTP = Date.now() - (user.otpExpiresAt.getTime() - 10 * 60 * 1000);
      return timeSinceLastOTP > 30000; // 30 second cooldown
    } catch (error) {
      console.error('Error checking OTP request eligibility:', error);
      return false;
    }
  }

  /**
   * Clear OTP data for user
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Success status
   */
  static async clearOTP(userId) {
    try {
      await User.findByIdAndUpdate(userId, {
        otpCode: null,
        otpExpiresAt: null,
        otpVerified: false
      });
      return true;
    } catch (error) {
      console.error('Error clearing OTP:', error);
      return false;
    }
  }
}

module.exports = OTPService;
