import { clearAllAuthData, saveAuthToken, saveUserData } from '@/utils/secureStorage';
import { useTheme } from '@/utils/themeContext';
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
  TouchableOpacity,
  View
} from 'react-native';

// Import the new components
import AccountRecovery from '@/components/AccountRecovery';
import ChildLogin from '@/components/ChildLogin';
import LoginForm from '@/components/LoginForm';
import OTPLogin from '@/components/OTPLogin';

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
  const [isDeactivatedAccount, setIsDeactivatedAccount] = useState(false);
  const router = useRouter();

  // Clear all authentication/session data when this screen mounts to avoid any stale user/token
  React.useEffect(() => {
    clearAllAuthData();
  }, []);

  const handleLoginSuccess = async (data: any) => {
    // Check if account is deactivated
    if (data.user.status === 'deactivated') {
      setIsDeactivatedAccount(true);
      return;
    }

    try {
      console.log('Login response:', JSON.stringify(data));
      await saveAuthToken(data.token);
      await saveUserData(data.user);
      console.log('Login successful: stored token and user data securely');
    } catch (storageError) {
      console.error('Failed to store auth data:', storageError);
    }

    setTimeout(() => {
      if (data.user.role === 'parent') {
        router.replace('/(parents-tabs)');
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
  };

  const switchToEmailLogin = () => {
    setLoginMethod('email');
  };

  const handleReactivationSuccess = () => {
    setIsDeactivatedAccount(false);
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
                <AccountRecovery
                  onReactivationSuccess={handleReactivationSuccess}
                  onCancel={() => setIsDeactivatedAccount(false)}
                />
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
                        <LoginForm onLoginSuccess={handleLoginSuccess} onBack={handleBack} />
                      ) : (
                        <OTPLogin onLoginSuccess={handleLoginSuccess} onBack={handleBack} />
                      )}
                    </>
                  )}

                  {userType === 'child' && (
                    <ChildLogin onLoginSuccess={handleLoginSuccess} onBack={handleBack} />
                  )}

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
    backgroundColor: '#F7F9FC',
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
