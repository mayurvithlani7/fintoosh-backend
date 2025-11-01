const otpGenerator = require('otp-generator');
const User = require('../models/User');

// SendGrid configuration
const sgMail = require('@sendgrid/mail');
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@fintoosh.com';

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
  console.log('✅ OTP Service initialized with SendGrid');
} else {
  console.log('⚠️ OTP Service initialized - SendGrid credentials not configured');
}

class OTPService {
  /**
   * Generate a 6-digit numeric OTP (Msg91 requires numeric only)
   * @returns {string} Generated OTP
   */
  static generateOTP() {
    // Generate purely numeric OTP for Msg91 compatibility
    const otp = otpGenerator.generate(6, {
      digits: true,
      alphabets: false,
      upperCase: false,
      specialChars: false
    });

    // Ensure it's purely numeric (fallback if library behaves unexpectedly)
    const numericOTP = otp.replace(/[^0-9]/g, '');
    return numericOTP.length === 6 ? numericOTP : Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Send OTP via email using SendGrid
   * @param {string} email - Recipient email address
   * @param {string} otp - OTP to send
   * @returns {Promise<boolean>} Success status
   */
  static async sendOTP(email, otp) {
    try {
      console.log(`🔍 SENDGRID_API_KEY present: ${!!SENDGRID_API_KEY}`);
      console.log(`📧 Attempting to send OTP ${otp} to ${email}`);

      if (!SENDGRID_API_KEY) {
        console.log(`📧 DEV MODE: OTP ${otp} would be sent to ${email} (no API key)`);
        return true; // Return true for development if no API key
      }

      const msg = {
        to: email,
        from: {
          email: SENDGRID_FROM_EMAIL,
          name: 'Fintoosh'
        },
        subject: 'Your Fintoosh Verification Code',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #6A49F3;">Fintoosh Verification</h2>
            <p>Hello!</p>
            <p>Your verification code is:</p>
            <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
              <span style="font-size: 24px; font-weight: bold; color: #6A49F3;">${otp}</span>
            </div>
            <p>This code will expire in 10 minutes.</p>
            <p>If you didn't request this code, please ignore this email.</p>
            <br>
            <p>Best regards,<br>The Fintoosh Team</p>
          </div>
        `,
        text: `Your Fintoosh verification code is: ${otp}. This code will expire in 10 minutes.`
      };

      console.log(`📤 Sending email via SendGrid to ${email}`);

      const result = await sgMail.send(msg);

      console.log(`📡 SendGrid Response:`, result[0]?.statusCode);

      if (result[0]?.statusCode === 202) {
        console.log(`✅ OTP email sent successfully to ${email} via SendGrid`);
        return true;
      } else {
        console.error('❌ SendGrid Error:', result);
        return false;
      }
    } catch (error) {
      console.error('❌ SendGrid Network Error:', error.message);
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

      // Calculate when the last OTP was requested (10 minutes before expiry)
      const lastOTPTime = user.otpExpiresAt.getTime() - (10 * 60 * 1000);
      const timeSinceLastOTP = Date.now() - lastOTPTime;

      // Rate limit: don't allow new OTP within 30 seconds of last request
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
