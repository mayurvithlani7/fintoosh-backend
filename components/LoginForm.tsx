import { API_URL } from '@/utils/config';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';

type LoginFormProps = {
  onLoginSuccess: (data: any) => void;
  onBack: () => void;
};

const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess, onBack }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const router = useRouter();

  const MAX_ATTEMPTS = 5;
  const LOCKOUT_MINUTES = 5;

  React.useEffect(() => {
    if (lockoutUntil && Date.now() > lockoutUntil) {
      setAttempts(0);
      setLockoutUntil(null);
      setStatusMessage('');
    }
  }, [lockoutUntil]);

  React.useEffect(() => {
    if (statusMessage && statusMessage.includes('Too many') && statusMessage.includes('wait')) {
      const hasLockout = lockoutUntil && Date.now() < lockoutUntil;
      if (!hasLockout && statusMessage.includes('Too many failed attempts')) {
        setStatusMessage('');
        setAttempts(0);
      }
    }
  }, [statusMessage, lockoutUntil]);

  const handleEmailLogin = async () => {
    if (lockoutUntil && Date.now() < lockoutUntil) {
      const waitMins = Math.ceil((lockoutUntil - Date.now()) / 60000);
      setStatusMessage(`Too many failed attempts. Try again in ${waitMins} minute(s).`);
      return;
    }
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (cleanEmail.length === 0 || cleanPassword.length === 0) {
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
          email: cleanEmail,
          password: cleanPassword,
        }),
      });

      let data;
      try {
        data = await response.json();
      } catch {
        data = { message: 'Request failed' };
      }

      if (!response.ok) {
        if (data.requiresReactivation) {
          setStatusMessage('This account has been deactivated. Please reactivate your account.');
          return;
        }

        if (response.status === 403 && data.lockoutRemaining) {
          setLockoutUntil(Date.now() + data.lockoutRemaining * 60000);
          setStatusMessage(data.message || 'Account is temporarily locked.');
          return;
        }

        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const waitTime = retryAfter ? parseInt(retryAfter) : 60;

          let message = '';
          if (waitTime <= 60) {
            message = `Too many login attempts. Please wait ${waitTime} seconds before trying again.`;
          } else if (waitTime <= 300) {
            message = `Too many login attempts. Please wait ${Math.ceil(waitTime / 60)} minutes before trying again.`;
          } else {
            message = `Too many login attempts. Please wait a while before trying again (about ${Math.ceil(waitTime / 60)} minutes).`;
          }

          setStatusMessage(message);
          return;
        }

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
      await onLoginSuccess(data);
    } catch (error) {
      console.error('Email login error:', error);
      setStatusMessage('Network error. Please try again.');
    }
  };

  return (
    <View style={{ width: '100%' }}>
      <View style={{ marginBottom: 13 }}>
        <Text style={{
          fontSize: 15,
          marginBottom: 6,
          fontWeight: '700',
          color: '#6A49F3',
          marginLeft: 6,
        }}>Email Address</Text>
        <TextInput
          placeholder="Enter your email"
          value={email}
          onChangeText={setEmail}
          style={{
            borderWidth: 1,
            borderColor: '#D0D7E4',
            borderRadius: 14,
            padding: 14,
            fontSize: 16,
            backgroundColor: '#F7F9FC',
            color: '#223366'
          }}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          textContentType="emailAddress"
          placeholderTextColor="#999"
        />
      </View>
      <View style={{ marginBottom: 13 }}>
        <Text style={{
          fontSize: 15,
          marginBottom: 6,
          fontWeight: '700',
          color: '#6A49F3',
          marginLeft: 6,
        }}>Password</Text>
        <View style={{
          position: 'relative',
        }}>
          <TextInput
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            style={{
              borderWidth: 1,
              borderColor: '#D0D7E4',
              borderRadius: 14,
              padding: 14,
              paddingRight: 50, // Make room for eye icon
              fontSize: 16,
              backgroundColor: '#F7F9FC',
              color: '#223366'
            }}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry={!showPassword}
            textContentType="password"
            placeholderTextColor="#999"
          />
          <TouchableOpacity
            style={{
              position: 'absolute',
              right: 14,
              top: '50%',
              transform: [{ translateY: -10 }],
              padding: 4,
            }}
            onPress={() => setShowPassword(!showPassword)}
            accessibilityRole="button"
            accessibilityLabel={showPassword ? "Hide password" : "Show password"}
            accessibilityHint="Double tap to toggle password visibility"
          >
            <Ionicons
              name={showPassword ? "eye-off" : "eye"}
              size={20}
              color="#666"
            />
          </TouchableOpacity>
        </View>
      </View>
      <View style={{
        alignItems: 'flex-end',
        width: '100%',
        marginBottom: 10,
      }}>
        <TouchableOpacity onPress={() => router.push('/forgot-password')}>
          <Text style={{
            fontSize: 14,
            color: '#6A49F3',
            fontWeight: '600',
            textDecorationLine: 'underline'
          }}>Forgot Password?</Text>
        </TouchableOpacity>
      </View>
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginTop: 10,
        marginBottom: 10,
      }}>
        <TouchableOpacity
          style={{
            backgroundColor: '#FFC107',
            borderRadius: 12,
            paddingVertical: 14,
            paddingHorizontal: 24,
            marginHorizontal: 4,
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: '#FFC107',
            shadowOpacity: 0.35,
            shadowRadius: 8,
            elevation: 6
          }}
          onPress={handleEmailLogin}
        >
          <Text style={{
            color: '#223366',
            fontSize: 16.5,
            fontWeight: '900'
          }}>Sign In</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            backgroundColor: '#E0E0E0',
            borderRadius: 12,
            paddingVertical: 14,
            paddingHorizontal: 24,
            marginHorizontal: 4,
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: '#888',
            shadowOpacity: 0.2,
          }}
          onPress={onBack}
        >
          <Text style={{
            color: '#444',
            fontSize: 16.5,
            fontWeight: '900'
          }}>Back</Text>
        </TouchableOpacity>
      </View>
      {statusMessage ? (
        <Text style={{
          marginTop: 15,
          fontSize: 15,
          fontWeight: '700',
          textAlign: 'center',
          color: statusMessage.includes('success') || statusMessage.includes('OTP sent')
            ? '#4CAF50'
            : '#E53935'
        }}>
          {statusMessage}
        </Text>
      ) : null}
    </View>
  );
};

export default LoginForm;
