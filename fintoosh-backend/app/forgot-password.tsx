import { API_URL } from '@/utils/config';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';

import {
  Dimensions,
  Image,
  ImageBackground,
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
type ResetMethod = 'email' | 'mobile';

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
  const [resetMethod, setResetMethod] = useState<ResetMethod>('email');
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState<'identifier' | 'otp' | 'password'>('identifier');
  const [otpSent, setOtpSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
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
      setStatusMessage('Please enter your email or mobile number.');
      return;
    }

    let validationRegex;
    if (resetMethod === 'email') {
      validationRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!validationRegex.test(identifier.trim())) {
        setStatusMessage('Please enter a valid email address.');
        return;
      }
    } else {
      validationRegex = /^\+91\d{10}$/;
      if (!validationRegex.test(identifier.trim())) {
        setStatusMessage('Please enter a valid Indian mobile number (+91XXXXXXXXXX).');
        return;
      }
    }

    try {
      setStatusMessage('Sending OTP...');

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
        setStatusMessage(data.message || 'Failed to send OTP. Please try again.');
        return;
      }

      setOtpSent(true);
      setStep('otp');
      setResendTimer(60);
      setStatusMessage('OTP sent successfully!');
    } catch (error) {
      console.error('Send OTP error:', error);
      setStatusMessage('Network error. Please try again.');
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim()) {
      setStatusMessage('Please enter the OTP.');
      return;
    }

    try {
      setStatusMessage('Verifying OTP...');

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
        setStatusMessage(data.message || 'Invalid OTP. Please try again.');
        return;
      }

      setStep('password');
      setStatusMessage('OTP verified! Please set your new password.');
    } catch (error) {
      console.error('Verify OTP error:', error);
      setStatusMessage('Network error. Please try again.');
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword.trim() || !confirmPassword.trim()) {
      setStatusMessage('Please fill in all password fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatusMessage('Passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setStatusMessage('Password must be at least 6 characters long.');
      return;
    }

    try {
      setStatusMessage('Resetting password...');

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
        setStatusMessage(data.message || 'Failed to reset password. Please try again.');
        return;
      }

      setStatusMessage('Password reset successful! Redirecting to login...');
      setTimeout(() => {
        router.replace('/login');
      }, 2000);
    } catch (error) {
      console.error('Reset password error:', error);
      setStatusMessage('Network error. Please try again.');
    }
  };

  const handleBack = () => {
    router.replace('/login');
  };

  const switchToEmail = () => {
    setResetMethod('email');
    setStatusMessage('');
    setIdentifier('');
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setStep('identifier');
    setOtpSent(false);
    setResendTimer(0);
  };

  const switchToMobile = () => {
    setResetMethod('mobile');
    setStatusMessage('');
    setIdentifier('');
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setStep('identifier');
    setOtpSent(false);
    setResendTimer(0);
  };

  return (
    <ImageBackground
      source={require('../assets/images/android-icon-background.png')}
      style={styles.background}
      resizeMode="cover"
      blurRadius={2}
    >
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

              {/* Reset Method Toggle */}
              <View style={styles.toggleContainer}>
                <TouchableOpacity
                  style={[styles.toggleButton, resetMethod === 'email' && styles.toggleActive]}
                  onPress={switchToEmail}
                >
                  <Text style={[styles.toggleText, resetMethod === 'email' && styles.toggleTextActive]}>
                    Email Reset
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleButton, resetMethod === 'mobile' && styles.toggleActive]}
                  onPress={switchToMobile}
                >
                  <Text style={[styles.toggleText, resetMethod === 'mobile' && styles.toggleTextActive]}>
                    Mobile OTP
                  </Text>
                </TouchableOpacity>
              </View>

              {step === 'identifier' && (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>
                      {resetMethod === 'email' ? 'Email Address' : 'Mobile Number'}
                    </Text>
                    {resetMethod === 'email' ? (
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
                    ) : (
                      <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        borderWidth: 1,
                        borderColor: '#D0D7E4',
                        borderRadius: 14,
                        backgroundColor: '#F7F9FC',
                      }}>
                        <TouchableOpacity style={{ paddingHorizontal: 12, paddingVertical: 13, backgroundColor: '#e8f4ff', borderRightWidth: 1, borderRightColor: '#D0D7E4' }}>
                          <Text style={{ fontSize: 16, fontWeight: '600', color: '#4166ee' }}>+91</Text>
                        </TouchableOpacity>
                        <TextInput
                          placeholder="Enter 10-digit mobile number"
                          value={identifier.replace(/^\+91/, '')}
                          onChangeText={val => {
                            const digits = val.replace(/\D/g, '').slice(0, 10);
                            setIdentifier(`+91${digits}`);
                          }}
                          style={{ flex: 1, padding: 13, fontSize: 16, color: '#223366', backgroundColor: 'transparent' }}
                          autoCapitalize="none"
                          autoCorrect={false}
                          keyboardType="phone-pad"
                          maxLength={10}
                          placeholderTextColor="#999"
                        />
                      </View>
                    )}
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

              {statusMessage ? (
                <Text
                  style={[
                    styles.statusMessage,
                    statusMessage.includes('success') || statusMessage.includes('sent') || statusMessage.includes('verified')
                      ? styles.success
                      : styles.error
                  ]}
                >
                  {statusMessage}
                </Text>
              ) : null}
            </View>
            {/* --- END RESET CARD --- */}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
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
    color: PRIMARY,
    textAlign: 'center',
    marginBottom: 3,
  },
  heroTagline: {
    fontSize: 16,
    color: SUCCESS_GREEN,
    fontWeight: '700',
    marginBottom: 11,
    textAlign: 'center'
  },
  heroStory: {
    fontSize: 14.7,
    color: '#455574',
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
});
