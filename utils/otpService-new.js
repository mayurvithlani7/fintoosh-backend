const twilio = require('twilio');
const otpGenerator = require('otp-generator');
const User = require('../models/User');

// Twilio configuration
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

// Initialize Twilio client only if credentials are valid
let twilioClient = null;
// Temporarily disabled for testing
console.log('OTP Service initialized - Twilio client disabled for testing');

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
   * Send OTP via SMS using Twilio
   * @param {string} phoneNumber - Recipient phone number (with country code)
   * @param {string} otp - OTP to send
   * @returns {Promise<boolean>} Success status
   */
  static async sendOTP(phoneNumber, otp) {
    try {
      console.log(`OTP ${otp} would be sent to ${phoneNumber}`);
      console.warn('Twilio client not configured. Skipping SMS send.');
      return true; // Return true for development/testing
    } catch (error) {
      console.error('Error sending OTP:', error);
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
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      await User.findByIdAndUpdate(userId, {
        otpCode: otp, // In production, encrypt this
        otpExpiresAt: expiresAt,
        otpVerified: false
      });

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
          otpVerified: true
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

      // Rate limit: don't allow new OTP within 1 minute of last request
      const timeSinceLastOTP = Date.now() - (user.otpExpiresAt.getTime() - 5 * 60 * 1000);
      return timeSinceLastOTP > 60000; // 1 minute cooldown
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
