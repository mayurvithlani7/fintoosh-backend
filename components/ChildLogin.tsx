import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';

type ChildLoginProps = {
  onLoginSuccess: (data: any) => void;
  onBack: () => void;
};

const ChildLogin: React.FC<ChildLoginProps> = ({ onLoginSuccess, onBack }) => {
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [isRetrying, setIsRetrying] = useState(false);

  // Retry logic for server errors
  const attemptLoginWithRetry = async (maxRetries = 2, baseDelay = 1000): Promise<{response: Response, data: any}> => {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        setIsRetrying(attempt > 0);

        const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/auth/child-login`, {
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
        const contentType = response.headers.get('content-type');

        // Check if response is HTML (indicates server error page)
        if (contentType && contentType.includes('text/html')) {
          if (attempt < maxRetries) {
            console.warn(`[CHILDLOGIN] Server error on attempt ${attempt + 1}, retrying...`);
            await new Promise(resolve => setTimeout(resolve, baseDelay * Math.pow(2, attempt)));
            continue; // Retry
          }
          console.error('[CHILDLOGIN] Server returned HTML after all retries - likely server error');
          throw new Error('Server temporarily unavailable. Please try again in a few minutes.');
        }

        try {
          const responseText = await response.text();

          // Additional check for HTML content in response body
          if (responseText.trim().startsWith('<')) {
            if (attempt < maxRetries) {
              console.warn(`[CHILDLOGIN] HTML response on attempt ${attempt + 1}, retrying...`);
              await new Promise(resolve => setTimeout(resolve, baseDelay * Math.pow(2, attempt)));
              continue; // Retry
            }
            console.error('[CHILDLOGIN] Response body starts with HTML tag after all retries - server error page');
            throw new Error('Server temporarily unavailable. Please try again in a few minutes.');
          }

          // Try to parse as JSON
          data = JSON.parse(responseText);
        } catch (err) {
          if (err instanceof Error && err.message.includes('Server temporarily unavailable')) {
            throw err; // Re-throw our custom server error
          }
          console.error('[CHILDLOGIN] Error parsing JSON response:', err);
          data = { message: 'Invalid server response. Please try again.' };
        }

        // If we get here, we have valid JSON data
        return { response, data };

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (lastError.message.includes('Server temporarily unavailable')) {
          throw lastError; // Don't retry server errors
        }

        if (attempt === maxRetries) {
          throw lastError; // Last attempt failed
        }

        // Wait before retrying (exponential backoff)
        console.warn(`[CHILDLOGIN] Attempt ${attempt + 1} failed, retrying in ${baseDelay * Math.pow(2, attempt)}ms...`);
        await new Promise(resolve => setTimeout(resolve, baseDelay * Math.pow(2, attempt)));
      }
    }

    // This should never be reached, but TypeScript needs it
    throw lastError || new Error('Login failed after all retries');
  };

  const handleChildLogin = async () => {
    if (!username.trim() || !pin.trim()) {
      setStatusMessage('Please enter both username and PIN.');
      return;
    }

    try {
      setStatusMessage(isRetrying ? 'Retrying login...' : 'Logging in...');
      setIsRetrying(false);

      // Use retry logic for login attempts
      const { response, data } = await attemptLoginWithRetry();

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

      setIsRetrying(false);
      await onLoginSuccess(data);
    } catch (error) {
      console.error('[CHILDLOGIN] Network or fetch error:', error);
      setIsRetrying(false);

      // Handle custom server errors
      if (error instanceof Error && error.message.includes('Server temporarily unavailable')) {
        setStatusMessage(error.message);
      } else {
        setStatusMessage('Network error. Please try again.');
      }
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
        <View style={{
          position: 'relative',
        }}>
          <TextInput
            placeholder="Enter your 4-6 digit PIN"
            value={pin}
            onChangeText={val => setPin(val.replace(/\D/g, '').slice(0, 6))}
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
            keyboardType="numeric"
            maxLength={6}
            secureTextEntry={!showPin}
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
            onPress={() => setShowPin(!showPin)}
            accessibilityRole="button"
            accessibilityLabel={showPin ? "Hide PIN" : "Show PIN"}
            accessibilityHint="Double tap to toggle PIN visibility"
          >
            <Ionicons
              name={showPin ? "eye-off" : "eye"}
              size={20}
              color="#666"
            />
          </TouchableOpacity>
        </View>
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
