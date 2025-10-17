import { API_URL } from '@/utils/config';
import { saveAuthToken } from '@/utils/secureStorage';
import { useTheme } from '@/utils/themeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 5;
type LoginMethod = 'email' | 'mobile';

const { width } = Dimensions.get('window');
const FEATURE_ITEM_WIDTH = width * 0.85;
const FEATURE_ITEM_MARGIN = width * 0.025;

// --- COLOR PALETTE ---
const PRIMARY = '#6A49F3';
const SECONDARY = '#FFC107';
const SUCCESS_GREEN = '#4CAF50';
const ERROR_RED = '#E53935';
const INACTIVE_GRAY = '#E0E0E0';
const TEXT_DARK = '#223366';
const INPUT_BG = '#F7F9FC';

// --- IMAGE ASSET MAP ---
const featureImages = [
  require('../assets/images/placeholder-family.png'),
  require('../assets/images/placeholder-gullak.png'),
  require('../assets/images/placeholder-rewards.png'),
  require('../assets/images/placeholder-tracking.png')
];

// --- FEATURE DATA ---
const features = [
  {
    title: "Family Teamwork",
    description: "Parents assign tasks, kids complete them. Dhan Ki Samajh builds healthy financial habits at home.",
    image: featureImages[0],
  },
  {
    title: "Digital Gullak",
    description: "Modern Indian families manage money using digital jars for saving, spending, and donating.",
    image: featureImages[1],
  },
  {
    title: "Achieve Goals & Rewards",
    description: "Kids set goals and save up for meaningful rewards—motivation, simplified.",
    image: featureImages[2],
  },
  {
    title: "Track Money Wisely",
    description: "See your progress grow! Kids and parents track every rupee to master money wisdom.",
    image: featureImages[3],
  }
];

// --- LoginScreen COMPONENT ---
export default function LoginScreen() {
  const { themeColors } = useTheme();
  const [userType, setUserType] = useState<'parent' | 'child'>('parent');
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);

  const [mobileNumber, setMobileNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const [statusMessage, setStatusMessage] = useState('');
  const [isDeactivatedAccount, setIsDeactivatedAccount] = useState(false);
  const [reactivationIdentifier, setReactivationIdentifier] = useState('');
  const [reactivationOtp, setReactivationOtp] = useState('');
  const [reactivationOtpSent, setReactivationOtpSent] = useState(false);
  const [reactivationSuccess, setReactivationSuccess] = useState(false);
  const router = useRouter();
  const now = Date.now();

  React.useEffect(() => {
    if (lockoutUntil && now > lockoutUntil) {
      setAttempts(0);
      setLockoutUntil(null);
      setStatusMessage('');
    }
  }, [lockoutUntil, now]);

  // Additional check for rate limiting messages
  React.useEffect(() => {
    if (statusMessage && statusMessage.includes('Too many') && statusMessage.includes('wait')) {
      // If there's a rate limit message, check if local lockout has expired
      const hasLockout = lockoutUntil && Date.now() < lockoutUntil;
      if (!hasLockout && statusMessage.includes('Too many failed attempts')) {
        // Local lockout expired, clear the message so user can try again
        setStatusMessage('');
        setAttempts(0);
      }
      // For server-side rate limiting messages, don't auto-clear them
    }
  }, [statusMessage, lockoutUntil]);

  // OTP resend timer
  React.useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleEmailLogin = async () => {
    if (lockoutUntil && Date.now() < lockoutUntil) {
      const waitMins = Math.ceil((lockoutUntil - Date.now()) / 60000);
      setStatusMessage(`Too many failed attempts. Try again in ${waitMins} minute(s).`);
      return;
    }
    if (email.trim().length === 0 || password.trim().length === 0) {
      setStatusMessage('Please enter both email and password.');
      return;
    }

    try {
      setStatusMessage('Logging in...');

      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim(),
        }),
      });

      // Handle both JSON and plain text responses (for rate limiting)
      let data;
      try {
        data = await response.json();
      } catch {
        // If JSON parsing fails (e.g., plain text 429 response), create a basic error object
        data = { message: 'Request failed' };
      }

      if (!response.ok) {
        // Check if account is deactivated and requires reactivation
        if (data.requiresReactivation) {
          setIsDeactivatedAccount(true);
          setStatusMessage('This account has been deactivated. Please reactivate your account.');
          // Clear any existing identifier - user must enter mobile number fresh
          setReactivationIdentifier('');
          return;
        }

        // Check if account is locked due to brute force protection
        if (response.status === 403 && data.lockoutRemaining) {
          setLockoutUntil(Date.now() + data.lockoutRemaining * 60000);
          setStatusMessage(data.message || 'Account is temporarily locked.');
          return;
        }

        // Check for rate limiting (429 Too Many Requests)
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const waitTime = retryAfter ? parseInt(retryAfter) : 60;

          // Provide more informative messaging based on wait time
          let message = '';
          if (waitTime <= 60) {
            message = `Too many login attempts. Please wait ${waitTime} seconds before trying again.`;
          } else if (waitTime <= 300) { // 5 minutes
            message = `Too many login attempts. Please wait ${Math.ceil(waitTime / 60)} minutes before trying again.`;
          } else {
            message = `Too many login attempts. Please wait a while before trying again (about ${Math.ceil(waitTime / 60)} minutes).`;
          }

          setStatusMessage(message);
          return;
        }

        // Update local attempts counter based on server response
        if (data.attemptsRemaining !== undefined) {
          setAttempts(MAX_ATTEMPTS - data.attemptsRemaining);
        } else {
          setAttempts(prev => prev + 1);
        }

        setStatusMessage(data.message || 'Invalid email or password.');
        return;
      }

      setAttempts(0);
      setLockoutUntil(null);

      await handleLoginSuccess(data);
    } catch (error) {
      // Authentication error tracking
      console.error('Email login error:', error, {
        feature: 'auth',
        action: 'email-login',
        email: email.trim(),
        attempts,
        hasLockout: !!lockoutUntil
      });

      // TODO: Add Sentry error capture when package is properly configured
      // Sentry.captureException(error, {
      //   tags: { feature: 'auth', action: 'email-login' },
      //   extra: { email: email.trim(), attempts, hasLockout: !!lockoutUntil }
      // });

      setStatusMessage('Network error. Please try again.');
    }
  };

  const handleSendOTP = async () => {
    if (!mobileNumber.trim()) {
      setStatusMessage('Please enter your mobile number.');
      return;
    }

    const mobileRegex = /^\+91\d{10}$/;
    if (!mobileRegex.test(mobileNumber.trim())) {
      setStatusMessage('Please enter a valid Indian mobile number (+91XXXXXXXXXX)');
      return;
    }

    try {
      setStatusMessage('Sending OTP...');

      const response = await fetch(`${API_URL}/auth/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mobileNumber: mobileNumber.trim(),
        }),
      });

      // Handle both JSON and plain text responses (for rate limiting)
      let data;
      try {
        data = await response.json();
      } catch {
        // If JSON parsing fails (e.g., plain text 429 response), create a basic error object
        data = { message: 'Request failed' };
      }

      if (!response.ok) {
        // Check for rate limiting (429 Too Many Requests)
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const waitTime = retryAfter ? parseInt(retryAfter) : 60;
          setStatusMessage(`Too many OTP requests. Please wait ${waitTime} seconds before trying again.`);
          return;
        }
        setStatusMessage(data.message || 'Failed to send OTP. Please try again.');
        return;
      }

      setUserId(data.userId);
      setOtpSent(true);
      setResendTimer(60);
      setStatusMessage('?? OTP sent to your mobile number!');
    } catch (error) {
      // Authentication error tracking
      console.error('Send OTP error:', error, {
        feature: 'auth',
        action: 'send-otp',
        mobileNumber: mobileNumber.trim()
      });

      // TODO: Add Sentry error capture when package is properly configured
      // Sentry.captureException(error, {
      //   tags: { feature: 'auth', action: 'send-otp' },
      //   extra: { mobileNumber: mobileNumber.trim() }
      // });

      setStatusMessage('Network error. Please try again.');
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim()) {
      setStatusMessage('Please enter the OTP.');
      return;
    }

    if (!userId) {
      setStatusMessage('Session expired. Please request OTP again.');
      return;
    }

    try {
      setStatusMessage('Verifying OTP...');

      const response = await fetch(`${API_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          otp: otp.trim(),
        }),
      });

      // Handle both JSON and plain text responses (for rate limiting)
      let data;
      try {
        data = await response.json();
      } catch {
        // If JSON parsing fails (e.g., plain text 429 response), create a basic error object
        data = { message: 'Request failed' };
      }

      if (!response.ok) {
        // Check for rate limiting (429 Too Many Requests)
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const waitTime = retryAfter ? parseInt(retryAfter) : 60;
          setStatusMessage(`Too many OTP verification attempts. Please wait ${waitTime} seconds before trying again.`);
          return;
        }
        setStatusMessage(data.message || 'Invalid OTP. Please try again.');
        return;
      }

      await handleLoginSuccess(data);
    } catch (error) {
      // Authentication error tracking
      console.error('Verify OTP error:', error, {
        feature: 'auth',
        action: 'verify-otp',
        hasUserId: !!userId,
        otpLength: otp.trim().length
      });

      // TODO: Add Sentry error capture when package is properly configured
      // Sentry.captureException(error, {
      //   tags: { feature: 'auth', action: 'verify-otp' },
      //   extra: { hasUserId: !!userId, otpLength: otp.trim().length }
      // });

      setStatusMessage('Network error. Please try again.');
    }
  };

  const handleLoginSuccess = async (data: any) => {
    // Check if account is deactivated
    if (data.user.status === 'deactivated') {
      setIsDeactivatedAccount(true);
      setStatusMessage('This account is currently deactivated.');
      // Store the identifier for reactivation
      if (userType === 'parent') {
        setReactivationIdentifier(loginMethod === 'email' ? email : mobileNumber);
      }
      return;
    }

    try {
      await saveAuthToken(data.token);
      await AsyncStorage.setItem('user', JSON.stringify(data.user));
    } catch (storageError) {
      console.error('Failed to store auth data:', storageError);
    }

    setStatusMessage(' Login successful!');
    setTimeout(() => {
      if (data.user.role === 'parent') {
        router.replace('/parent-dashboard');
      } else {
        router.replace('/kid-dashboard');
      }
    }, 1000);
  };

  const handleBack = () => {
    router.replace('/');
  };

  const switchToMobileLogin = () => {
    setLoginMethod('mobile');
    setStatusMessage('');
    setOtpSent(false);
    setOtp('');
    setUserId(null);
    setResendTimer(0);
  };

  const switchToEmailLogin = () => {
    setLoginMethod('email');
    setStatusMessage('');
  };

  const handleChildLogin = async () => {
    if (!username.trim() || !pin.trim()) {
      setStatusMessage('Please enter both username and PIN.');
      return;
    }

    try {
      setStatusMessage('Logging in...');

      const response = await fetch(`${API_URL}/auth/child-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.trim(),
          pin: pin.trim(),
        }),
      });

      // Handle both JSON and plain text responses (for rate limiting)
      let data;
      try {
        data = await response.json();
      } catch {
        // If JSON parsing fails (e.g., plain text 429 response), create a basic error object
        data = { message: 'Request failed' };
      }

      if (!response.ok) {
        // Check if account is deactivated and requires reactivation
        if (data.requiresReactivation) {
          setIsDeactivatedAccount(true);
          setStatusMessage('This account has been deactivated. Please reactivate your account.');
          return;
        }

        // Check if account is locked due to brute force protection
        if (response.status === 403 && data.lockoutRemaining) {
          setLockoutUntil(Date.now() + data.lockoutRemaining * 60000);
          setStatusMessage(data.message || 'Account is temporarily locked.');
          return;
        }

        // Check for rate limiting (429 Too Many Requests)
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const waitTime = retryAfter ? parseInt(retryAfter) : 60;
          setStatusMessage(`Too many login attempts. Please wait ${waitTime} seconds before trying again.`);
          return;
        }

        // Update local attempts counter based on server response
        if (data.attemptsRemaining !== undefined) {
          setAttempts(MAX_ATTEMPTS - data.attemptsRemaining);
        } else {
          setAttempts(prev => prev + 1);
        }

        setStatusMessage(data.message || 'Forgot your PIN? Please ask your Parent to reset it in their Settings.');
        return;
      }

      // Check if account is deactivated before proceeding
      if (data.user.status === 'deactivated') {
        setIsDeactivatedAccount(true);
        setStatusMessage('This account is currently deactivated.');
        return;
      }

      setAttempts(0);
      setLockoutUntil(null);

      await handleLoginSuccess(data);
    } catch (error) {
      // Authentication error tracking
      console.error('Child login error:', error, {
        feature: 'auth',
        action: 'child-login',
        username: username.trim(),
        hasPin: !!pin.trim()
      });

      // TODO: Add Sentry error capture when package is properly configured
      // Sentry.captureException(error, {
      //   tags: { feature: 'auth', action: 'child-login' },
      //   extra: { username: username.trim(), hasPin: !!pin.trim() }
      // });

      setStatusMessage('Network error. Please try again.');
    }
  };

  // Account reactivation functions
  const handleRequestReactivationOTP = async () => {
    console.log('Reactivation identifier:', reactivationIdentifier);
    console.log('Reactivation identifier trimmed:', reactivationIdentifier.trim());

    if (!reactivationIdentifier.trim()) {
      setStatusMessage('Please enter your mobile number.');
      return;
    }

    // Validate mobile number format
    const mobileRegex = /^\+91\d{10}$/;
    const isValid = mobileRegex.test(reactivationIdentifier.trim());
    console.log('Mobile validation result:', isValid, 'for:', reactivationIdentifier.trim());

    if (!isValid) {
      setStatusMessage('Please enter a valid 10-digit mobile number.');
      return;
    }

    try {
      setStatusMessage('Sending reactivation OTP...');

      const response = await fetch(`${API_URL}/auth/request-reactivation-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: reactivationIdentifier.trim(),
        }),
      });

      // Handle both JSON and plain text responses (for rate limiting)
      let data;
      try {
        data = await response.json();
      } catch {
        // If JSON parsing fails (e.g., plain text 429 response), create a basic error object
        data = { message: 'Request failed' };
      }

      if (!response.ok) {
        // Check for rate limiting (429 Too Many Requests)
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const waitTime = retryAfter ? parseInt(retryAfter) : 60;
          setStatusMessage(`Too many reactivation requests. Please wait ${waitTime} seconds before trying again.`);
          return;
        }
        console.error('Reactivation OTP error:', data);
        setStatusMessage(data.message || 'Failed to send reactivation OTP.');
        return;
      }

      setReactivationOtpSent(true);
      setStatusMessage('Reactivation OTP sent! Check your mobile for the code.');
    } catch (error) {
      // Authentication error tracking
      console.error('Request reactivation OTP error:', error, {
        feature: 'auth',
        action: 'request-reactivation-otp',
        reactivationIdentifier: reactivationIdentifier.trim()
      });

      // TODO: Add Sentry error capture when package is properly configured
      // Sentry.captureException(error, {
      //   tags: { feature: 'auth', action: 'request-reactivation-otp' },
      //   extra: { reactivationIdentifier: reactivationIdentifier.trim() }
      // });

      setStatusMessage('Network error. Please try again.');
    }
  };

  const handleReactivateAccount = async () => {
    if (!reactivationOtp.trim()) {
      setStatusMessage('Please enter the OTP.');
      return;
    }

    try {
      setStatusMessage('Reactivating account...');

      const response = await fetch(`${API_URL}/auth/reactivate-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: reactivationIdentifier.trim(),
          otp: reactivationOtp.trim(),
        }),
      });

      // Handle both JSON and plain text responses (for rate limiting)
      let data;
      try {
        data = await response.json();
      } catch {
        // If JSON parsing fails (e.g., plain text 429 response), create a basic error object
        data = { message: 'Request failed' };
      }

      if (!response.ok) {
        // Check for rate limiting (429 Too Many Requests)
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const waitTime = retryAfter ? parseInt(retryAfter) : 60;
          setStatusMessage(`Too many reactivation attempts. Please wait ${waitTime} seconds before trying again.`);
          return;
        }
        setStatusMessage(data.message || 'Failed to reactivate account.');
        return;
      }

      // Show success message for 2-3 seconds
      setReactivationSuccess(true);
      setStatusMessage('Account reactivated successfully! Please login now.');

      // After 3 seconds, reset to normal login state
      setTimeout(() => {
        setReactivationSuccess(false);
        setIsDeactivatedAccount(false);
        setReactivationOtpSent(false);
        setReactivationOtp('');
        // Reset login form
        setEmail('');
        setPassword('');
        setMobileNumber('');
        setOtp('');
        setOtpSent(false);
        setStatusMessage('');
      }, 3000);
    } catch (error) {
      // Authentication error tracking
      console.error('Reactivate account error:', error, {
        feature: 'auth',
        action: 'reactivate-account',
        reactivationIdentifier: reactivationIdentifier.trim(),
        otpLength: reactivationOtp.trim().length
      });

      // TODO: Add Sentry error capture when package is properly configured
      // Sentry.captureException(error, {
      //   tags: { feature: 'auth', action: 'reactivate-account' },
      //   extra: { reactivationIdentifier: reactivationIdentifier.trim(), otpLength: reactivationOtp.trim().length }
      // });

      setStatusMessage('Network error. Please try again.');
    }
  };

  const handleCancelReactivation = () => {
    setIsDeactivatedAccount(false);
    setReactivationIdentifier('');
    setReactivationOtp('');
    setReactivationOtpSent(false);
    setStatusMessage('');
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
          {/* --- HERO / APP STORY SECTION --- */}
          <View style={styles.heroSection}>
            <Image
              source={require('../assets/images/Fintoosh.png')}
              style={styles.heroImage}
              resizeMode="contain"
            />
            <Text style={styles.heroTitle}>Fintoosh</Text>
            <Text style={styles.heroTagline}>Wise Kids. Smarter Money.</Text>
            <Text style={styles.heroStory}>
              Teaching kids about money through fun tasks, digital savings jars, and family teamwork.
            </Text>
          </View>

          <View style={styles.outer}>
            {/* --- LOGIN CARD --- */}
            <View style={styles.card}>
              {isDeactivatedAccount ? (
                <>
                  <Text style={styles.welcomeTitle}>Account Reactivation</Text>
                  <Text style={styles.title}>Reactivate Account</Text>

                  <Text style={{ fontSize: 14, color: "#666", textAlign: 'center', marginBottom: 20, lineHeight: 20 }}>
                    Your family account has been temporarily deactivated. Enter your registered email or mobile number to receive a reactivation OTP.
                  </Text>

                  {!reactivationOtpSent ? (
                    <>
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Mobile Number</Text>
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
                            value={reactivationIdentifier.replace(/^\+91/, '')}
                            onChangeText={val => {
                              const digits = val.replace(/\D/g, '').slice(0, 10);
                              setReactivationIdentifier(`+91${digits}`);
                            }}
                            style={{ flex: 1, padding: 13, fontSize: 16, color: '#223366', backgroundColor: 'transparent' }}
                            autoCapitalize="none"
                            autoCorrect={false}
                            keyboardType="phone-pad"
                            maxLength={10}
                            placeholderTextColor="#999"
                          />
                        </View>
                      </View>
                      <View style={styles.buttonRow}>
                        <TouchableOpacity style={styles.button} onPress={handleRequestReactivationOTP}>
                          <Text style={styles.buttonText}>Send Reactivation OTP</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.button, styles.backButton]} onPress={handleCancelReactivation}>
                          <Text style={[styles.buttonText, styles.backButtonText]}>Cancel</Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  ) : (
                    <>
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Enter Reactivation OTP</Text>
                        <TextInput
                          placeholder="6-digit OTP sent to your mobile"
                          value={reactivationOtp}
                          onChangeText={setReactivationOtp}
                          style={styles.input}
                          keyboardType="numeric"
                          maxLength={6}
                          placeholderTextColor="#999"
                        />
                      </View>
                      <View style={styles.buttonRow}>
                        <TouchableOpacity style={styles.button} onPress={handleReactivateAccount}>
                          <Text style={styles.buttonText}>Reactivate Account</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.button, styles.backButton]} onPress={handleCancelReactivation}>
                          <Text style={[styles.buttonText, styles.backButtonText]}>Cancel</Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  )}
                </>
              ) : (
                <>
                  <Text style={styles.welcomeTitle}>Welcome Back</Text>
                  <Text style={styles.title}>Sign In</Text>

                  {/* User Type Toggle */}
                  <View style={styles.userTypeContainer}>
                    <TouchableOpacity
                      style={[styles.userTypeButton, userType === 'parent' && styles.userTypeActive]}
                      onPress={() => setUserType('parent')}
                    >
                      <Text style={[styles.userTypeText, userType === 'parent' && styles.userTypeTextActive]}>
                        Parent
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.userTypeButton, userType === 'child' && styles.userTypeActive]}
                      onPress={() => setUserType('child')}
                    >
                      <Text style={[styles.userTypeText, userType === 'child' && styles.userTypeTextActive]}>
                        Child
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {userType === 'parent' && (
                    <>
                      {/* Login Method Toggle for Parents */}
                      <View style={styles.toggleContainer}>
                        <TouchableOpacity
                          style={[styles.toggleButton, loginMethod === 'email' && styles.toggleActive]}
                          onPress={switchToEmailLogin}
                        >
                          <Text style={[styles.toggleText, loginMethod === 'email' && styles.toggleTextActive]}>
                            Email Login
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.toggleButton, loginMethod === 'mobile' && styles.toggleActive]}
                          onPress={switchToMobileLogin}
                        >
                          <Text style={[styles.toggleText, loginMethod === 'mobile' && styles.toggleTextActive]}>
                            Mobile OTP
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {loginMethod === 'email' ? (
                        <>
                          <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Email Address</Text>
                            <TextInput
                              placeholder="Enter your email"
                              value={email}
                              onChangeText={setEmail}
                              style={styles.input}
                              autoCapitalize="none"
                              autoCorrect={false}
                              keyboardType="email-address"
                              textContentType="emailAddress"
                              placeholderTextColor="#999"
                            />
                          </View>
                          <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Password</Text>
                            <TextInput
                              placeholder="Enter your password"
                              value={password}
                              onChangeText={setPassword}
                              style={styles.input}
                              autoCapitalize="none"
                              autoCorrect={false}
                              secureTextEntry
                              textContentType="password"
                              placeholderTextColor="#999"
                            />
                          </View>
                          <View style={styles.forgotPasswordContainer}>
                            <TouchableOpacity onPress={() => router.push('/forgot-password')}>
                              <Text style={styles.forgotPasswordLink}>Forgot Password?</Text>
                            </TouchableOpacity>
                          </View>
                          <View style={styles.buttonRow}>
                            <TouchableOpacity style={styles.button} onPress={handleEmailLogin}>
                              <Text style={styles.buttonText}>Sign In</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.button, styles.backButton]} onPress={handleBack}>
                              <Text style={[styles.buttonText, styles.backButtonText]}>Back</Text>
                            </TouchableOpacity>
                          </View>
                        </>
                      ) : (
                        <>
                          {!otpSent ? (
                            <>
                              <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Mobile Number</Text>
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
                                    value={mobileNumber.replace(/^\+91/, '')}
                                    onChangeText={val => {
                                      // Only allow 10 numeric digits, store as "+91" + digits
                                      const digits = val.replace(/\D/g, '').slice(0, 10);
                                      setMobileNumber(`+91${digits}`);
                                    }}
                                    style={{ flex: 1, padding: 13, fontSize: 16, color: '#223366', backgroundColor: 'transparent' }}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    keyboardType="phone-pad"
                                    maxLength={10}
                                    placeholderTextColor="#999"
                                  />
                                </View>
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
                          ) : (
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
                        </>
                      )}
                    </>
                  )}

                  {userType === 'child' && (
                    <>
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Username</Text>
                        <TextInput
                          placeholder="Enter your username"
                          value={username}
                          onChangeText={setUsername}
                          style={styles.input}
                          autoCapitalize="none"
                          autoCorrect={false}
                          placeholderTextColor="#999"
                        />
                      </View>
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>PIN</Text>
                        <TextInput
                          placeholder="Enter your 4-6 digit PIN"
                          value={pin}
                          onChangeText={val => setPin(val.replace(/\D/g, '').slice(0, 6))}
                          style={styles.input}
                          keyboardType="numeric"
                          maxLength={6}
                          secureTextEntry
                          placeholderTextColor="#999"
                        />
                      </View>
                      <View style={styles.buttonRow}>
                        <TouchableOpacity style={styles.button} onPress={handleChildLogin}>
                          <Text style={styles.buttonText}>Sign In</Text>
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
                        statusMessage.includes('success') || statusMessage.includes('OTP sent')
                          ? styles.success
                          : styles.error
                      ]}
                    >
                      {statusMessage}
                    </Text>
                  ) : null}

                  <View style={styles.signupPromptContainer}>
                    <Text style={styles.signupPromptText}>Don't have an account?</Text>
                    <TouchableOpacity onPress={() => router.push('/signup')}>
                      <Text style={styles.signupLink}>Sign up now</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
            {/* --- END LOGIN CARD --- */}

            {/* --- FEATURE CAROUSEL --- */}
            <Text style={styles.carouselHeader}>Why Choose Fintoosh?</Text>
            <View style={styles.benefitsContainer}>
              {[0,1,2,3].map((idx) => (
                <View key={idx} style={styles.featureCardVertical}>
                  <View style={styles.featureImageContainer}>
                    <Image
                      source={featureImages[idx]}
                      style={styles.featureImage}
                      resizeMode="contain"
                    />
                  </View>
                  <View style={styles.featureTextContent}>
                    <Text style={styles.featureTitle}>{features[idx].title}</Text>
                    <Text style={styles.featureDescription}>{features[idx].description}</Text>
                  </View>
                </View>
              ))}
            </View>
            {/* --- END FEATURE CAROUSEL --- */}
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
    backgroundColor: '#FFFFFF',
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
    marginVertical: 18,
    borderWidth: 1,
    borderColor: '#D0D7E4'
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

  slogan: {
    fontSize: 15,
    fontWeight: '600',
    color: SUCCESS_GREEN,
    marginBottom: 24,
    textAlign: 'center'
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
  signupPromptContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 27
  },
  signupPromptText: {
    fontSize: 15,
    color: TEXT_DARK,
    fontWeight: '400'
  },
  signupLink: {
    fontSize: 15,
    color: PRIMARY,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
    marginLeft: 7
  },

  // --- USER TYPE TOGGLE ---
  userTypeContainer: {
    flexDirection: 'row',
    backgroundColor: '#F0F4FF',
    borderRadius: 25,
    padding: 4,
    marginBottom: 20,
    width: '100%'
  },
  userTypeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 21,
    alignItems: 'center'
  },
  userTypeActive: {
    backgroundColor: PRIMARY,
    shadowColor: PRIMARY,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4
  },
  userTypeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#888'
  },
  userTypeTextActive: {
    color: '#FFF'
  },
  childLoginTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: TEXT_DARK,
    marginBottom: 20,
    textAlign: 'center'
  },

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
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    width: '100%',
    marginBottom: 10,
  },
  forgotPasswordLink: {
    fontSize: 14,
    color: PRIMARY,
    fontWeight: '600',
    textDecorationLine: 'underline'
  },

  // --- CAROUSEL STYLES ---
  carouselHeader: {
    fontSize: 18,
    fontWeight: '800',
    color: TEXT_DARK,
    marginTop: 27,
    marginBottom: 10,
    alignSelf: 'flex-start',
    marginLeft: width * 0.05,
    textAlign: 'left',
  },
  // New vertical stacking for benefits
  benefitsContainer: {
    width: '100%',
    paddingHorizontal: width * 0.05 - FEATURE_ITEM_MARGIN,
    paddingBottom: 20,
  },
  featureCardVertical: {
    width: '100%',
    marginBottom: 18,
    backgroundColor: '#FFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.11,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  featureImageContainer: {
    width: '100%',
    height: 110,
    backgroundColor: '#f5f5fc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureImage: {
    width: '70%',
    height: 92,
    resizeMode: 'contain',
  },
  featureTextContent: {
    padding: 15,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: PRIMARY,
    marginBottom: 5,
  },
  featureDescription: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
});
