import { API_URL } from '@/utils/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
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

export default function SignupScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [mobileDigits, setMobileDigits] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [touched, setTouched] = useState<{ fullName: boolean; email: boolean; mobileNumber: boolean; password: boolean; referralCode: boolean }>({ fullName: false, email: false, mobileNumber: false, password: false, referralCode: false });
  const [errors, setErrors] = useState<{ fullName: string; email: string; mobileNumber: string; password: string; referralCode: string }>({ fullName: '', email: '', mobileNumber: '', password: '', referralCode: '' });

  // Computed mobile number
  const mobileNumber = `${countryCode}${mobileDigits}`;
  const [statusMessage, setStatusMessage] = useState('');
  const [statusColor, setStatusColor] = useState('red');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  function validateField(field: string, value: string) {
    switch (field) {
      case 'fullName':
        if (!value.trim()) return 'Full Name is required';
        return '';
      case 'email':
        if (!value.trim()) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email address';
        return '';
      case 'mobileNumber':
        if (!value.trim()) return 'Mobile Number is required';
        if (!/^\+91\d{10}$/.test(value)) return 'Please enter a valid 10-digit mobile number';
        return '';
      case 'password':
        if (!value.trim()) return 'Password is required';
        if (value.length < 6) return 'Password must be at least 6 characters';
        return '';
      case 'referralCode':
        // Optional field, no validation needed
        return '';
    }
    return '';
  }

  function validateAll() {
    return {
      fullName: validateField('fullName', fullName),
      email: validateField('email', email),
      mobileNumber: validateField('mobileNumber', mobileNumber),
      password: validateField('password', password),
      referralCode: validateField('referralCode', referralCode),
    };
  }

  const handleBlur = (field: 'fullName' | 'email' | 'mobileNumber' | 'password' | 'referralCode') => {
    setTouched(t => ({ ...t, [field]: true }));
    setErrors(e => ({
      ...e,
      [field]: validateField(field, eval(field))
    }));
  };

  const handleChange = (field: 'fullName' | 'email' | 'mobileNumber' | 'password' | 'referralCode', value: string) => {
    if (field === 'fullName') setFullName(value);
    else if (field === 'email') setEmail(value);
    else if (field === 'mobileNumber') setMobileDigits(value.replace(/\D/g, '').slice(0, 10));
    else if (field === 'password') setPassword(value);
    else if (field === 'referralCode') setReferralCode(value);
    if (touched[field]) {
      setErrors(e => ({
        ...e,
        [field]: validateField(field, field === 'mobileNumber' ? `${countryCode}${value.replace(/\D/g, '').slice(0, 10)}` : value)
      }));
    }
  };

  const handleSubmit = async () => {
    setTouched({
      fullName: true,
      email: true,
      mobileNumber: true,
      password: true,
      referralCode: true
    });
    const fieldErrors = validateAll();
    setErrors(fieldErrors);
    if (fieldErrors.fullName || fieldErrors.email || fieldErrors.mobileNumber || fieldErrors.password) {
      setStatusMessage('Please fix the errors above before submitting.');
      setStatusColor('red');
      return;
    }

    setLoading(true);
    setStatusMessage('');
    setStatusColor('red');

    try {
      const body: any = {
        name: fullName.trim(),
        email: email.trim(),
        mobileNumber: mobileNumber.trim(),
        password: password,
        referralCode: referralCode.trim() || undefined
      };

      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        let errorMessage = 'Registration failed. Please try again.';
        if (data.message) {
          errorMessage = data.message;
        }
        setStatusMessage(errorMessage);
        setStatusColor('red');
        setLoading(false);
        return;
      }

      // Store auth data before navigation
      try {
        await AsyncStorage.setItem('authToken', data.token);
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
        setStatusMessage('Account created successfully!');
        setStatusColor('green');
        setLoading(false);
        // Navigate immediately after storage
        router.replace('/addChild');
      } catch (storageError) {
        console.error('Failed to store auth data:', storageError);
        setStatusMessage('Account created but login failed. Please try logging in manually.');
        setStatusColor('red');
        setLoading(false);
        setTimeout(() => {
          router.replace('/login');
        }, 2000);
      }
    } catch (e: any) {
      setStatusMessage('Network error. Please try again.');
      setStatusColor('red');
      setLoading(false);
    }
  };

  const handleLoginRedirect = () => {
    router.replace('/login');
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
            <Text style={styles.heroTitle}>Join Fintoosh</Text>
            <Text style={styles.heroTagline}>Wise Kids. Smarter Money.</Text>
            <Text style={styles.heroStory}>
              Teaching kids about money through fun tasks, digital savings jars, and family teamwork.
            </Text>
          </View>

          <View style={styles.outer}>
            <View style={styles.card}>
              <Text style={styles.signupMainTitle}>Create Parent Account</Text>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput
                  placeholder="Enter your full name"
                  value={fullName}
                  onChangeText={val => handleChange('fullName', val)}
                  onBlur={() => handleBlur('fullName')}
                  style={styles.input}
                  autoCapitalize="words"
                  textContentType="name"
                  editable={!loading}
                  placeholderTextColor="#c0cbe7"
                />
                {touched.fullName && errors.fullName ? (
                  <Text style={styles.validation}>{errors.fullName}</Text>
                ) : null}
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <TextInput
                  placeholder="Enter your email"
                  value={email}
                  onChangeText={val => handleChange('email', val)}
                  onBlur={() => handleBlur('email')}
                  style={styles.input}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  editable={!loading}
                  placeholderTextColor="#c0cbe7"
                />
                {touched.email && errors.email ? (
                  <Text style={styles.validation}>{errors.email}</Text>
                ) : null}
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Mobile Number</Text>
                <View style={styles.phoneInputContainer}>
  <TouchableOpacity style={styles.countryCodeButton}>
    <Text style={styles.countryCodeText}>+91</Text>
  </TouchableOpacity>
                  <TextInput
                    placeholder="Enter 10-digit mobile number"
                    value={mobileDigits}
                    onChangeText={val => handleChange('mobileNumber', val)}
                    onBlur={() => handleBlur('mobileNumber')}
                    style={styles.phoneInput}
                    keyboardType="phone-pad"
                    maxLength={10}
                    editable={!loading}
                    placeholderTextColor="#c0cbe7"
                  />
                </View>
                {touched.mobileNumber && errors.mobileNumber ? (
                  <Text style={styles.validation}>{errors.mobileNumber}</Text>
                ) : null}
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Password</Text>
                <TextInput
                  placeholder="Create a password"
                  value={password}
                  onChangeText={val => handleChange('password', val)}
                  onBlur={() => handleBlur('password')}
                  style={styles.input}
                  autoCapitalize="none"
                  secureTextEntry
                  textContentType="password"
                  editable={!loading}
                  placeholderTextColor="#c0cbe7"
                />
                {touched.password && errors.password ? (
                  <Text style={styles.validation}>{errors.password}</Text>
                ) : null}
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Referral Code (Optional)</Text>
                <TextInput
                  placeholder="Enter referral code if you have one"
                  value={referralCode}
                  onChangeText={val => handleChange('referralCode', val)}
                  onBlur={() => handleBlur('referralCode')}
                  style={styles.input}
                  autoCapitalize="none"
                  editable={!loading}
                  placeholderTextColor="#c0cbe7"
                />
                {touched.referralCode && errors.referralCode ? (
                  <Text style={styles.validation}>{errors.referralCode}</Text>
                ) : null}
              </View>
              <TouchableOpacity style={[styles.button, loading && { opacity: 0.5 }]} onPress={handleSubmit} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create Account</Text>}
              </TouchableOpacity>
              {statusMessage ? (
                <Text style={[styles.statusMessage, { color: statusColor }]}>{statusMessage}</Text>
              ) : null}
              <TouchableOpacity onPress={handleLoginRedirect} disabled={loading}>
                <Text style={styles.loginLink}>Already have an account? Sign in</Text>
              </TouchableOpacity>
            </View>

            {/* --- ONBOARDING CAROUSEL or VISUAL HIGHLIGHT --- */}
            <Text style={styles.carouselHeader}>Why Join Fintoosh?</Text>
            <View style={styles.benefitsContainer}>
              {[
                {
                  title: 'Smart Money Learning',
                  image: require('../assets/images/placeholder-gullak.png'),
                  description: 'Interactive lessons and games teach kids about saving, spending, and budgeting.'
                },
                {
                  title: 'Family Money Goals',
                  image: require('../assets/images/placeholder-rewards.png'),
                  description: 'Set and achieve financial goals together as a family with rewards and celebrations.'
                },
                {
                  title: 'Real Money Tracking',
                  image: require('../assets/images/placeholder-tracking.png'),
                  description: 'Monitor progress with visual charts and celebrate financial milestones.'
                }
              ].map((item, idx) => (
                <View key={item.title} style={styles.featureCardVertical}>
                  <Image source={item.image} style={styles.featureImageWide} resizeMode="contain" />
                  <View style={styles.featureTextContent}>
                    <Text style={styles.featureTitle}>{item.title}</Text>
                    <Text style={styles.featureDescription}>{item.description}</Text>
                  </View>
                </View>
              ))}
            </View>
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
    marginBottom: 12,
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
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: 0.5,
    color: '#6A49F3',
    textAlign: 'center',
    marginBottom: 3,
  },
  heroTagline: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '700',
    marginBottom: 10,
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
  card: {
    backgroundColor: '#ffffffee',
    borderRadius: 22,
    padding: 20,
    width: '94%',
    maxWidth: 390,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 14,
    elevation: 8,
    marginVertical: 16
  },
  signupMainTitle: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 8,
    color: '#6A49F3',
    letterSpacing: 0.2,
    textAlign: 'center'
  },
  inputGroup: { width: '100%', marginBottom: 13 },
  inputLabel: {
    fontSize: 15,
    marginBottom: 6,
    fontWeight: '700',
    color: '#6A49F3',
    marginLeft: 6,
  },
  radioRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 6,
  },
  radioOption: {
    flex: 1,
    backgroundColor: '#f1defd',
    paddingVertical: 11,
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 2,
    borderWidth: 1.5,
    borderColor: '#b1caff',
  },
  radioSelected: {
    backgroundColor: '#ffd9ba',
    borderColor: '#efb159',
  },
  radioText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#5b4090',
  },
  input: {
    borderWidth: 2,
    borderColor: '#b6a0e6',
    borderRadius: 14,
    padding: 13,
    fontSize: 17,
    backgroundColor: '#f4f7fe',
    color: '#101928'
  },
  button: {
    backgroundColor: '#a869ef',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 30,
    marginTop: 10,
    marginBottom: 1,
    shadowColor: '#cfbae6',
    shadowOpacity: 0.23,
    shadowRadius: 10,
    elevation: 4
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  statusMessage: {
    marginTop: 14,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center'
  },
  loginLink: {
    color: '#4166ee',
    fontSize: 16,
    marginTop: 18,
    textAlign: 'center',
    textDecorationLine: 'underline'
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#b6a0e6',
    borderRadius: 14,
    backgroundColor: '#f4f7fe',
  },
  countryCodeButton: {
    paddingHorizontal: 12,
    paddingVertical: 13,
    backgroundColor: '#e8f4ff',
    borderRightWidth: 1,
    borderRightColor: '#b6a0e6',
  },
  countryCodeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4166ee',
  },
  phoneInput: {
    flex: 1,
    padding: 13,
    fontSize: 17,
    color: '#101928',
  },
  validation: {
    color: '#f03a47',
    fontSize: 14,
    marginTop: 2,
  },

  // --- Carousel Styles ---
  carouselHeader: {
    fontSize: 17,
    fontWeight: '800',
    color: '#223366',
    marginTop: 23,
    marginBottom: 7,
    alignSelf: 'flex-start',
    marginLeft: 14,
    textAlign: 'left',
  },
  carouselContainer: {
    paddingHorizontal: 12,
    paddingBottom: 18,
  },
  // New vertical stacking for benefits
  benefitsContainer: {
    width: '100%',
    paddingHorizontal: 12,
    paddingBottom: 18,
  },
  featureCardVertical: {
    width: '100%',
    marginBottom: 18,
    backgroundColor: '#fff',
    borderRadius: 19,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.09,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  featureImage: {
    width: '100%',
    height: 120,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16
  },
  featureImageWide: {
    width: '100%',
    height: 150,
    resizeMode: 'contain'
  },
  featureTextContent: {
    padding: 13,
  },
  featureTitle: {
    fontSize: 16.5,
    fontWeight: '900',
    color: '#6A49F3',
    marginBottom: 3,
  },
  featureDescription: {
    fontSize: 15,
    color: '#666',
    lineHeight: 20,
  },
});
