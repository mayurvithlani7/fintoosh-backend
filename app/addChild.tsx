import { API_URL } from '@/utils/config';
import { getAuthToken } from '@/utils/secureStorage';
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

export default function AddChildScreen() {
  const [childName, setChildName] = useState('');
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [touched, setTouched] = useState<{ childName: boolean; username: boolean; pin: boolean }>({ childName: false, username: false, pin: false });
  const [errors, setErrors] = useState<{ childName: string; username: string; pin: string }>({ childName: '', username: '', pin: '' });

  const [statusMessage, setStatusMessage] = useState('');
  const [statusColor, setStatusColor] = useState('red');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  function validateField(field: string, value: string) {
    switch (field) {
      case 'childName':
        if (!value.trim()) return 'Child Name is required';
        return '';
      case 'username':
        if (!value.trim()) return 'Username is required';
        if (value.length < 3) return 'Username must be at least 3 characters';
        if (!/^[a-zA-Z0-9_]+$/.test(value)) return 'Username can only contain letters, numbers, and underscores';
        return '';
      case 'pin':
        if (!value.trim()) return 'PIN is required';
        if (!/^\d{4,6}$/.test(value)) return 'PIN must be 4-6 digits';
        return '';
    }
    return '';
  }

  function validateAll() {
    return {
      childName: validateField('childName', childName),
      username: validateField('username', username),
      pin: validateField('pin', pin),
    };
  }

  const handleBlur = (field: 'childName' | 'username' | 'pin') => {
    setTouched(t => ({ ...t, [field]: true }));
    const value = field === 'childName' ? childName : field === 'username' ? username : pin;
    setErrors(e => ({
      ...e,
      [field]: validateField(field, value)
    }));
  };

  const handleChange = (field: 'childName' | 'username' | 'pin', value: string) => {
    if (field === 'childName') setChildName(value);
    else if (field === 'username') setUsername(value.replace(/[^a-zA-Z0-9_]/g, ''));
    else if (field === 'pin') setPin(value.replace(/\D/g, '').slice(0, 6));
    if (touched[field]) {
      setErrors(e => ({
        ...e,
        [field]: validateField(field, field === 'pin' ? value.replace(/\D/g, '').slice(0, 6) : value)
      }));
    }
  };

  const handleSubmit = async () => {
    setTouched({
      childName: true,
      username: true,
      pin: true
    });
    const fieldErrors = validateAll();
    setErrors(fieldErrors);
    if (fieldErrors.childName || fieldErrors.username || fieldErrors.pin) {
      setStatusMessage('Please fix the errors above before submitting.');
      setStatusColor('red');
      return;
    }

    setLoading(true);
    setStatusMessage('');
    setStatusColor('red');

    try {
      // Get auth token with retry logic
      let token = await getAuthToken();
      if (!token) {
        // Try once more in case of timing issues
        await new Promise(resolve => setTimeout(resolve, 500));
        token = await getAuthToken();
        if (!token) {
          setStatusMessage('Authentication required. Please login again.');
          setStatusColor('red');
          setLoading(false);
          // Redirect to login after a delay
          setTimeout(() => {
            router.replace('/login');
          }, 2000);
          return;
        }
      }

      console.log('=== ADD CHILD REQUEST ===');
      console.log('API URL:', API_URL);
      console.log('Token exists:', !!token);
      console.log('Request data:', { name: childName.trim(), username: username.trim(), pin: pin.trim() });

      const response = await fetch(`${API_URL}/auth/create-child`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: childName.trim(),
          username: username.trim(),
          pin: pin.trim(),
        }),
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        let errorMessage = 'Failed to create child account. Please try again.';
        if (data.message) {
          errorMessage = data.message;
        }
        setStatusMessage(errorMessage);
        setStatusColor('red');
        setLoading(false);
        return;
      }

      setStatusMessage('Child account created successfully!');
      setStatusColor('green');
      setLoading(false);
      setTimeout(() => {
        // Navigate back to parent dashboard with refresh trigger
        router.replace({
          pathname: '/parent-dashboard',
          params: { refresh: 'true' }
        });
      }, 1200);
    } catch (e: any) {
      setStatusMessage('Network error. Please try again.');
      setStatusColor('red');
      setLoading(false);
    }
  };

  const handleSkip = () => {
    router.replace('/parent-dashboard');
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
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 60}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* --- HERO SECTION --- */}
          <View style={styles.heroSection}>
            <Image
              source={require('../assets/images/placeholder-family.png')}
              style={styles.heroImage}
              resizeMode="contain"
            />
            <Text style={styles.heroTitle}>Add Your Child</Text>
            <Text style={styles.heroTagline}>Create a personalized account for your child</Text>
            <Text style={styles.heroStory}>
              Set up a unique username and PIN so your child can log in independently and start their financial learning journey.
            </Text>
          </View>

          <View style={styles.outer}>
            <View style={styles.card}>
              <Text style={styles.title}>Child Account Setup</Text>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Child's Name</Text>
                <TextInput
                  placeholder="Enter your child's full name"
                  value={childName}
                  onChangeText={val => handleChange('childName', val)}
                  onBlur={() => handleBlur('childName')}
                  style={styles.input}
                  autoCapitalize="words"
                  textContentType="name"
                  editable={!loading}
                  placeholderTextColor="#c0cbe7"
                />
                {touched.childName && errors.childName ? (
                  <Text style={styles.validation}>{errors.childName}</Text>
                ) : null}
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Username</Text>
                <TextInput
                  placeholder="Create a unique username"
                  value={username}
                  onChangeText={val => handleChange('username', val)}
                  onBlur={() => handleBlur('username')}
                  style={styles.input}
                  autoCapitalize="none"
                  editable={!loading}
                  placeholderTextColor="#c0cbe7"
                />
                {touched.username && errors.username ? (
                  <Text style={styles.validation}>{errors.username}</Text>
                ) : null}
                <Text style={styles.hint}>Letters, numbers, and underscores only</Text>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>PIN (4-6 digits)</Text>
                <TextInput
                  placeholder="Create a 4-6 digit PIN"
                  value={pin}
                  onChangeText={val => handleChange('pin', val)}
                  onBlur={() => handleBlur('pin')}
                  style={styles.input}
                  keyboardType="numeric"
                  maxLength={6}
                  secureTextEntry
                  editable={!loading}
                  placeholderTextColor="#c0cbe7"
                />
                {touched.pin && errors.pin ? (
                  <Text style={styles.validation}>{errors.pin}</Text>
                ) : null}
                <Text style={styles.hint}>Your child will use this PIN to log in</Text>
              </View>
              <TouchableOpacity style={[styles.button, loading && { opacity: 0.5 }]} onPress={handleSubmit} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create Child Account</Text>}
              </TouchableOpacity>
              {statusMessage ? (
                <Text style={[styles.statusMessage, { color: statusColor }]}>{statusMessage}</Text>
              ) : null}
              <TouchableOpacity onPress={handleSkip} disabled={loading}>
                <Text style={styles.skipLink}>Skip for now</Text>
              </TouchableOpacity>
            </View>

            {/* --- INFO SECTION --- */}
            <Text style={styles.infoHeader}>Why Create a Child Account?</Text>
            <View style={styles.infoContainer}>
              <View style={styles.infoItem}>
                <Text style={styles.infoIcon}>🔐</Text>
                <View style={styles.infoText}>
                  <Text style={styles.infoTitle}>Independent Access</Text>
                  <Text style={styles.infoDescription}>Your child can log in anytime with their username and PIN</Text>
                </View>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoIcon}>📚</Text>
                <View style={styles.infoText}>
                  <Text style={styles.infoTitle}>Personalized Learning</Text>
                  <Text style={styles.infoDescription}>Track progress and achievements in their own account</Text>
                </View>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoIcon}>👨‍👩‍👧‍👦</Text>
                <View style={styles.infoText}>
                  <Text style={styles.infoTitle}>Family Connection</Text>
                  <Text style={styles.infoDescription}>Linked to your account for seamless family management</Text>
                </View>
              </View>
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
    width: 120,
    height: 120,
    marginBottom: 10,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#FFE5B4',
    backgroundColor: '#fffbed',
  },
  heroTitle: {
    fontSize: 28,
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
    fontSize: 14.5,
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
  title: {
    fontSize: 24,
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
  input: {
    borderWidth: 2,
    borderColor: '#b6a0e6',
    borderRadius: 14,
    padding: 13,
    fontSize: 17,
    backgroundColor: '#f4f7fe',
    color: '#101928'
  },
  hint: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
    marginLeft: 6,
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
  skipLink: {
    color: '#666',
    fontSize: 16,
    marginTop: 18,
    textAlign: 'center',
    textDecorationLine: 'underline'
  },
  validation: {
    color: '#f03a47',
    fontSize: 14,
    marginTop: 2,
  },
  infoHeader: {
    fontSize: 18,
    fontWeight: '800',
    color: '#223366',
    marginTop: 23,
    marginBottom: 10,
    alignSelf: 'flex-start',
    marginLeft: 14,
    textAlign: 'left',
  },
  infoContainer: {
    width: '100%',
    paddingHorizontal: 12,
    paddingBottom: 18,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
  },
  infoIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  infoText: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#6A49F3',
    marginBottom: 2,
  },
  infoDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
});
