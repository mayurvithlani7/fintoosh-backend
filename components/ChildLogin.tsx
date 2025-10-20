import { API_URL } from '@/utils/config';
import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';

type ChildLoginProps = {
  onLoginSuccess: (data: any) => void;
  onBack: () => void;
};

const ChildLogin: React.FC<ChildLoginProps> = ({ onLoginSuccess, onBack }) => {
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  const handleChildLogin = async () => {
    if (!username.trim() || !pin.trim()) {
      setStatusMessage('Please enter both username and PIN.');
      return;
    }

    try {
      setStatusMessage('Logging in...');

      // console.log('[CHILDLOGIN] API_URL:', API_URL);
      // console.log('[CHILDLOGIN] Sending login request:', {
      //   url: `${API_URL}/auth/child-login`,
      //   username: username.trim(),
      //   pin: pin.trim(),
      // });

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

      let data;
      try {
        data = await response.json();
      } catch (err) {
        console.error('[CHILDLOGIN] Error parsing response:', err);
        data = { message: 'Request failed' };
      }

      if (!response.ok) {
        if (data.requiresReactivation) {
          setStatusMessage('This account has been deactivated. Please reactivate your account.');
          return;
        }

        if (response.status === 403 && data.lockoutRemaining) {
          setStatusMessage(data.message || 'Account is temporarily locked.');
          return;
        }

        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const waitTime = retryAfter ? parseInt(retryAfter) : 60;
          setStatusMessage(`Too many login attempts. Please wait ${waitTime} seconds before trying again.`);
          return;
        }

        setStatusMessage(data.message || 'Forgot your PIN? Please ask your Parent to reset it in their Settings.');
        return;
      }

      // Check if account is deactivated before proceeding
      if (data.user.status === 'deactivated') {
        setStatusMessage('This account is currently deactivated.');
        return;
      }

      await onLoginSuccess(data);
    } catch (error) {
      console.error('[CHILDLOGIN] Network or fetch error:', error);
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
        }}>Username</Text>
        <TextInput
          placeholder="Enter your username"
          value={username}
          onChangeText={setUsername}
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
        }}>PIN</Text>
        <TextInput
          placeholder="Enter your 4-6 digit PIN"
          value={pin}
          onChangeText={val => setPin(val.replace(/\D/g, '').slice(0, 6))}
          style={{
            borderWidth: 1,
            borderColor: '#D0D7E4',
            borderRadius: 14,
            padding: 14,
            fontSize: 16,
            backgroundColor: '#F7F9FC',
            color: '#223366'
          }}
          keyboardType="numeric"
          maxLength={6}
          secureTextEntry
          placeholderTextColor="#999"
        />
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
          onPress={handleChildLogin}
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

export default ChildLogin;
