import { useCenteredMessage } from '@/utils/centeredMessageContext';
import { API_URL } from '@/utils/config';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';

import { LinearGradient } from 'expo-linear-gradient';
import {
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

// --- CONSTANTS ---
type ResetMethod = 'email';

const { width } = Dimensions.get('window');

// --- COLOR PALETTE ---
const PRIMARY = '#6A49F3';
const SECONDARY = '#FFC107';
const SUCCESS_GREEN = '#4CAF50';
const ERROR_RED = '#E53935';
const INACTIVE_GRAY = '#E0E0E0';
const TEXT_DARK = '#223366';
const INPUT_BG = '#F7F9FC';

// --- ForgotPasswordScreen COMPONENT ---
export default function ForgotPasswordScreen() {
  const { showMessage } = useCenteredMessage();
  const [resetMethod, setResetMethod] = useState<ResetMethod>('email');
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState<'identifier' | 'otp' | 'password'>('identifier');
  const [otpSent, setOtpSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const router = useRouter();

  React.useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleSendOTP = async () => {
    if (!identifier.trim()) {
      showMessage('Please enter your email address.', 'error');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(identifier.trim())) {
      showMessage('Please enter a valid email address.', 'error');
      return;
    }

    try {
      showMessage('Sending OTP...', 'info');

      const response = await fetch(`${API_URL}/auth/request-parent-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: identifier.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        showMessage(data.message || 'Failed to send OTP. Please try again.', 'error');
        return;
      }

      setOtpSent(true);
      setStep('otp');
      setResendTimer(60);
      showMessage('OTP sent successfully!', 'success');
    } catch (error) {
      console.error('Send OTP error:', error);
      showMessage('Network error. Please try again.', 'error');
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim()) {
      showMessage('Please enter the OTP.', 'error');
      return;
    }

    try {
      showMessage('Verifying OTP...', 'info');

      const response = await fetch(`${API_URL}/auth/verify-parent-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: identifier.trim(),
          otp: otp.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        showMessage(data.message || 'Invalid OTP. Please try again.', 'error');
        return;
      }

      setStep('password');
      showMessage('OTP verified! Please set your new password.', 'success');
    } catch (error) {
      console.error('Verify OTP error:', error);
      showMessage('Network error. Please try again.', 'error');
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword.trim() || !confirmPassword.trim()) {
      showMessage('Please fill in all password fields.', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showMessage('Passwords do not match.', 'error');
      return;
    }

    if (newPassword.length < 6) {
      showMessage('Password must be at least 6 characters long.', 'error');
      return;
    }

    try {
      showMessage('Resetting password...', 'info');

      const response = await fetch(`${API_URL}/auth/reset-parent-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: identifier.trim(),
          otp: otp.trim(),
          newPassword: newPassword.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        showMessage(data.message || 'Failed to reset password. Please try again.', 'error');
        return;
      }

      showMessage('Password reset successful! Redirecting to login...', 'success');
      setTimeout(() => {
        router.replace('/login');
      }, 2000);
    } catch (error) {
      console.error('Reset password error:', error);
      showMessage('Network error. Please try again.', 'error');
    }
  };

  const handleBack = () => {
    router.replace('/login');
  };

  const switchToEmail = () => {
    setResetMethod('email');
    setIdentifier('');
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setStep('identifier');
    setOtpSent(false);
    setResendTimer(0);
  };



  return (
    <View style={styles.background}>
      <LinearGradient
        colors={['#6366f1', '#8b5cf6', '#a855f7', '#c084fc']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <KeyboardAvoidingView
        style={{ flex: 1, width: '100%' }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {/* --- HERO SECTION --- */}
          <View style={styles.heroSection}>
            <Image
              source={require('../assets/images/Fintoosh.png')}
              style={styles.heroImage}
              resizeMode="contain"
            />
            <Text style={styles.heroTitle}>Reset Password</Text>
            <Text style={styles.heroTagline}>Secure Account Recovery</Text>
            <Text style={styles.heroStory}>
              We'll help you reset your password securely using multi-factor authentication.
            </Text>
          </View>

          <View style={styles.outer}>
            {/* --- RESET CARD --- */}
            <View style={styles.card}>
              <Text style={styles.welcomeTitle}>Password Recovery</Text>
              <Text style={styles.title}>Reset Your Password</Text>

              {/* Email Reset Only */}
              <View style={styles.emailOnlyContainer}>
                <Text style={styles.emailOnlyText}>
                  📧 Email Password Reset
                </Text>
              </View>

              {step === 'identifier' && (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Email Address</Text>
                    <TextInput
                      placeholder="Enter your registered email"
                      value={identifier}
                      onChangeText={setIdentifier}
                      style={styles.input}
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="email-address"
                      textContentType="emailAddress"
                      placeholderTextColor="#999"
                    />
                  </View>
                  <View style={styles.buttonRow}>
                    <TouchableOpacity style={styles.button} onPress={handleSendOTP}>
                      <Text style={styles.buttonText}>Send OTP</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.button, styles.backButton]} onPress={handleBack}>
                      <Text style={[styles.buttonText, styles.backButtonText]}>Back</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {step === 'otp' && (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Enter OTP</Text>
                    <TextInput
                      placeholder="6-digit OTP"
                      value={otp}
                      onChangeText={setOtp}
                      style={styles.input}
                      autoCapitalize="characters"
                      autoCorrect={false}
                      keyboardType="default"
                      maxLength={6}
                      placeholderTextColor="#999"
                    />
                  </View>
                  <View style={styles.buttonRow}>
                    <TouchableOpacity style={styles.button} onPress={handleVerifyOTP}>
                      <Text style={styles.buttonText}>Verify OTP</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.button, styles.backButton]} onPress={handleBack}>
                      <Text style={[styles.buttonText, styles.backButtonText]}>Back</Text>
                    </TouchableOpacity>
                  </View>
                  {resendTimer > 0 ? (
                    <Text style={styles.resendText}>
                      Resend OTP in {resendTimer} seconds
                    </Text>
                  ) : (
                    <TouchableOpacity onPress={handleSendOTP}>
                      <Text style={styles.resendLink}>Resend OTP</Text>
                    </TouchableOpacity>
                  )}
                </>
              )}

              {step === 'password' && (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>New Password</Text>
                    <TextInput
                      placeholder="Enter new password (min 6 characters)"
                      value={newPassword}
                      onChangeText={setNewPassword}
                      style={styles.input}
                      autoCapitalize="none"
                      autoCorrect={false}
                      secureTextEntry
                      textContentType="newPassword"
                      placeholderTextColor="#999"
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Confirm New Password</Text>
                    <TextInput
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      style={styles.input}
                      autoCapitalize="none"
                      autoCorrect={false}
                      secureTextEntry
                      textContentType="newPassword"
                      placeholderTextColor="#999"
                    />
                  </View>
                  <View style={styles.buttonRow}>
                    <TouchableOpacity style={styles.button} onPress={handleResetPassword}>
                      <Text style={styles.buttonText}>Reset Password</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.button, styles.backButton]} onPress={handleBack}>
                      <Text style={[styles.buttonText, styles.backButtonText]}>Back</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}


            </View>
            {/* --- END RESET CARD --- */}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#f1f7fe'
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    paddingBottom: 40
  },
  heroSection: {
    alignItems: 'center',
    marginTop: 35,
    paddingHorizontal: 24,
    marginBottom: 10,
  },
  heroImage: {
    width: 140,
    height: 140,
    marginBottom: 10,
    borderRadius: 72,
    borderWidth: 3,
    borderColor: '#FFE5B4',
    backgroundColor: '#fffbed',
  },
  heroTitle: {
    fontSize: 33,
    fontWeight: '900',
    letterSpacing: 0.5,
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 3,
  },
  heroTagline: {
    fontSize: 16,
    color: '#FF6B6B',
    fontWeight: '700',
    marginBottom: 11,
    textAlign: 'center'
  },
  heroStory: {
    fontSize: 14.7,
    color: '#E6E6FA',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 4,
    fontWeight: '500'
  },

  outer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 35,
  },

  // --- CARD & BRANDING ---
  card: {
    backgroundColor: '#FFF',
    borderRadius: 22,
    padding: 28,
    width: '92%',
    maxWidth: 380,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 18,
    elevation: 10,
    marginVertical: 18
  },
  welcomeTitle: {
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 0.8,
    color: TEXT_DARK,
    marginBottom: 2,
    textAlign: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    marginBottom: 6,
    color: PRIMARY,
    textAlign: 'center',
    letterSpacing: 0.2
  },

  // --- INPUTS ---
  inputGroup: { width: '100%', marginBottom: 13 },
  inputLabel: {
    fontSize: 15,
    marginBottom: 6,
    fontWeight: '700',
    color: PRIMARY,
    marginLeft: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D0D7E4',
    borderRadius: 14,
    padding: 14,
    fontSize: 16,
    backgroundColor: INPUT_BG,
    color: TEXT_DARK
  },

  // --- BUTTONS ---
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
    marginBottom: 10,
  },
  button: {
    backgroundColor: SECONDARY,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    marginHorizontal: 4,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: SECONDARY,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6
  },
  backButton: {
    backgroundColor: INACTIVE_GRAY,
    shadowColor: '#888',
    shadowOpacity: 0.2,
  },
  buttonText: {
    color: TEXT_DARK,
    fontSize: 16.5,
    fontWeight: '900'
  },
  backButtonText: {
    color: '#444',
  },

  // --- MESSAGES & LINKS ---
  statusMessage: {
    marginTop: 15,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center'
  },
  error: { color: ERROR_RED },
  success: { color: SUCCESS_GREEN },

  // --- TOGGLE ---
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F0F4FF',
    borderRadius: 25,
    padding: 4,
    marginBottom: 22,
    width: '100%'
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 21,
    alignItems: 'center'
  },
  toggleActive: {
    backgroundColor: PRIMARY,
    shadowColor: PRIMARY,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4
  },
  toggleText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#888'
  },
  toggleTextActive: {
    color: '#FFF'
  },
  resendText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 12
  },
  resendLink: {
    fontSize: 14,
    color: PRIMARY,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 12,
    textDecorationLine: 'underline'
  },
  emailOnlyContainer: {
    backgroundColor: '#E8F4FF',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 22,
    width: '100%',
    alignItems: 'center'
  },
  emailOnlyText: {
    fontSize: 14,
    fontWeight: '600',
    color: PRIMARY
  },
});
