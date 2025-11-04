import { useCenteredMessage } from '@/utils/centeredMessageContext';
import { API_URL } from '@/utils/config';
import { useTheme } from '@/utils/themeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from "@react-native-picker/picker";
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
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

export default function JoinFamilyScreen() {
  const { themeColors } = useTheme();
  const { showMessage } = useCenteredMessage();
  const [familyCode, setFamilyCode] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [relationship, setRelationship] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const validateForm = () => {
    if (!familyCode.trim()) {
      showMessage('Family code is required', 'error');
      return false;
    }

    if (!name.trim()) {
      showMessage('Full name is required', 'error');
      return false;
    }

    if (!email.trim()) {
      showMessage('Email is required', 'error');
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showMessage('Please enter a valid email address', 'error');
      return false;
    }

    if (!mobileNumber.trim()) {
      showMessage('Mobile number is required', 'error');
      return false;
    }

    if (!/^\+91\d{10}$/.test(mobileNumber)) {
      showMessage('Please enter a valid 10-digit mobile number with +91', 'error');
      return false;
    }

    if (!password.trim()) {
      showMessage('Password is required', 'error');
      return false;
    }

    if (password.length < 6) {
      showMessage('Password must be at least 6 characters', 'error');
      return false;
    }

    if (password !== confirmPassword) {
      showMessage('Passwords do not match', 'error');
      return false;
    }

    return true;
  };

  const handleJoinFamily = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/join-family-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          familyCode: familyCode.trim().toUpperCase(),
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password: password,
          mobileNumber: mobileNumber.trim(),
          relationship: relationship.trim() || undefined
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        showMessage(data.message || 'Failed to join family. Please try again.', 'error');
        setLoading(false);
        return;
      }

      // Store auth data
      try {
        await AsyncStorage.setItem('authToken', data.token);
        await AsyncStorage.setItem('user', JSON.stringify(data.user));

        showMessage('Successfully joined family! Welcome aboard! 🎉', 'success');
        setLoading(false);

        // Navigate to parent dashboard after short delay
        setTimeout(() => {
          router.replace('/(parents-tabs)');
        }, 1500);

      } catch (storageError) {
        console.error('Failed to store auth data:', storageError);
        showMessage('Joined family but login failed. Please try logging in manually.', 'error');
        setLoading(false);
        setTimeout(() => {
          router.replace('/login');
        }, 2000);
      }
    } catch (error) {
      console.error('Join family error:', error);
      showMessage('Network error. Please try again.', 'error');
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    router.replace('/login');
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
          {/* Header */}
          <View style={styles.headerSection}>
            <Image
              source={require('../assets/images/Fintoosh.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.headerTitle}>Join Your Family</Text>
            <Text style={styles.headerSubtitle}>Connect with your loved ones on Fintoosh</Text>
          </View>

          <View style={styles.outer}>
            <View style={styles.card}>
              <Text style={styles.title}>👨‍👩‍👧‍👦 Join Family Account</Text>
              <Text style={styles.subtitle}>
                Enter your family code to join and help manage your children's financial learning journey.
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Family Code</Text>
                <TextInput
                  placeholder="e.g., FAM-ABC123"
                  value={familyCode}
                  onChangeText={(text) => setFamilyCode(text.toUpperCase())}
                  style={styles.input}
                  autoCapitalize="characters"
                  maxLength={11}
                  editable={!loading}
                  placeholderTextColor="#c0cbe7"
                />
                <Text style={{ fontSize: 13, color: "#666", marginTop: 4 }}>
                  Ask your family member for this code
                </Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput
                  placeholder="Enter your full name"
                  value={name}
                  onChangeText={setName}
                  style={styles.input}
                  autoCapitalize="words"
                  textContentType="name"
                  editable={!loading}
                  placeholderTextColor="#c0cbe7"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <TextInput
                  placeholder="Enter your email"
                  value={email}
                  onChangeText={setEmail}
                  style={styles.input}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  editable={!loading}
                  placeholderTextColor="#c0cbe7"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Mobile Number</Text>
                <View style={styles.phoneInputContainer}>
                  <TouchableOpacity style={styles.countryCodeButton}>
                    <Text style={styles.countryCodeText}>+91</Text>
                  </TouchableOpacity>
                  <TextInput
                    placeholder="Enter 10-digit mobile number"
                    value={mobileNumber.replace(/^\+91/, '')}
                    onChangeText={(text) => setMobileNumber(`+91${text.replace(/\D/g, '').slice(0, 10)}`)}
                    style={styles.phoneInput}
                    keyboardType="phone-pad"
                    maxLength={10}
                    editable={!loading}
                    placeholderTextColor="#c0cbe7"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Password</Text>
                <TextInput
                  placeholder="Create a password"
                  value={password}
                  onChangeText={setPassword}
                  style={styles.input}
                  autoCapitalize="none"
                  secureTextEntry
                  textContentType="password"
                  editable={!loading}
                  placeholderTextColor="#c0cbe7"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Confirm Password</Text>
                <TextInput
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  style={styles.input}
                  autoCapitalize="none"
                  secureTextEntry
                  textContentType="password"
                  editable={!loading}
                  placeholderTextColor="#c0cbe7"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Relationship to Children (Optional)</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={relationship}
                    onValueChange={(value) => setRelationship(value)}
                    style={{ height: 50 }}
                    enabled={!loading}
                  >
                    <Picker.Item label="Select relationship..." value="" />
                    <Picker.Item label="Mother" value="mother" />
                    <Picker.Item label="Father" value="father" />
                    <Picker.Item label="Grandmother" value="grandmother" />
                    <Picker.Item label="Grandfather" value="grandfather" />
                    <Picker.Item label="Guardian" value="guardian" />
                    <Picker.Item label="Other" value="other" />
                  </Picker>
                </View>
                <Text style={{ fontSize: 13, color: "#666", marginTop: 4 }}>
                  This helps personalize the app for your family
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.joinButton, loading && { opacity: 0.5 }]}
                onPress={handleJoinFamily}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.joinButtonText}>Join Family</Text>
                )}
              </TouchableOpacity>



              <TouchableOpacity onPress={handleBackToLogin} disabled={loading}>
                <Text style={styles.backLink}>Back to Login</Text>
              </TouchableOpacity>
            </View>

            {/* Benefits Section */}
            <Text style={styles.benefitsHeader}>Why Join Your Family on Fintoosh?</Text>
            <View style={styles.benefitsContainer}>
              {[
                {
                  title: 'Family Money Goals',
                  description: 'Help your children learn valuable money skills together',
                  icon: '👨‍👩‍👧‍👦'
                },
                {
                  title: 'Approve Activities',
                  description: 'Review and approve chores, goals, and reward requests',
                  icon: '✅'
                },
                {
                  title: 'Track Progress',
                  description: 'Monitor your children\'s financial learning journey',
                  icon: '📊'
                }
              ].map((item, idx) => (
                <View key={item.title} style={styles.benefitCard}>
                  <Text style={styles.benefitIcon}>{item.icon}</Text>
                  <Text style={styles.benefitTitle}>{item.title}</Text>
                  <Text style={styles.benefitDescription}>{item.description}</Text>
                </View>
              ))}
            </View>
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
  headerSection: {
    alignItems: 'center',
    marginTop: 35,
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  logoImage: {
    width: 120,
    height: 120,
    marginBottom: 15,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#FFE5B4',
    backgroundColor: '#fffbed',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 0.5,
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 3,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#FF6B6B',
    fontWeight: '700',
    textAlign: 'center'
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
  title: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 8,
    color: '#6A49F3',
    letterSpacing: 0.2,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20
  },
  inputGroup: {
    width: '100%',
    marginBottom: 16
  },
  inputLabel: {
    fontSize: 15,
    marginBottom: 6,
    fontWeight: '700',
    color: '#6A49F3',
    marginLeft: 6,
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
  pickerContainer: {
    borderWidth: 2,
    borderColor: '#b6a0e6',
    borderRadius: 14,
    backgroundColor: '#f4f7fe',
    marginBottom: 4,
  },
  joinButton: {
    backgroundColor: '#a869ef',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 30,
    marginTop: 10,
    marginBottom: 1,
    shadowColor: '#cfbae6',
    shadowOpacity: 0.23,
    shadowRadius: 10,
    elevation: 4,
    width: '100%',
    alignItems: 'center'
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
  },
  statusMessage: {
    marginTop: 14,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center'
  },
  backLink: {
    color: '#4166ee',
    fontSize: 16,
    marginTop: 18,
    textAlign: 'center',
    textDecorationLine: 'underline'
  },
  benefitsHeader: {
    fontSize: 17,
    fontWeight: '800',
    color: '#223366',
    marginTop: 23,
    marginBottom: 7,
    alignSelf: 'flex-start',
    marginLeft: 14,
    textAlign: 'left',
  },
  benefitsContainer: {
    width: '100%',
    paddingHorizontal: 12,
    paddingBottom: 18,
  },
  benefitCard: {
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
    padding: 16,
    alignItems: 'center'
  },
  benefitIcon: {
    fontSize: 32,
    marginBottom: 8
  },
  benefitTitle: {
    fontSize: 16.5,
    fontWeight: '900',
    color: '#6A49F3',
    marginBottom: 6,
    textAlign: 'center'
  },
  benefitDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20
  },
});
