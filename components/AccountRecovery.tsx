import { API_URL } from '@/utils/config';
import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';

type AccountRecoveryProps = {
  onReactivationSuccess: () => void;
  onCancel: () => void;
};

const AccountRecovery: React.FC<AccountRecoveryProps> = ({ onReactivationSuccess, onCancel }) => {
  const [reactivationIdentifier, setReactivationIdentifier] = useState('');
  const [reactivationOtp, setReactivationOtp] = useState('');
  const [reactivationOtpSent, setReactivationOtpSent] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const handleRequestReactivationOTP = async () => {
    if (!reactivationIdentifier.trim()) {
      setStatusMessage('Please enter your mobile number.');
      return;
    }

    const mobileRegex = /^\+91\d{10}$/;
    const isValid = mobileRegex.test(reactivationIdentifier.trim());

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

      let data;
      try {
        data = await response.json();
      } catch {
        data = { message: 'Request failed' };
      }

      if (!response.ok) {
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
      console.error('Request reactivation OTP error:', error);
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

      let data;
      try {
        data = await response.json();
      } catch {
        data = { message: 'Request failed' };
      }

      if (!response.ok) {
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const waitTime = retryAfter ? parseInt(retryAfter) : 60;
          setStatusMessage(`Too many reactivation attempts. Please wait ${waitTime} seconds before trying again.`);
          return;
        }
        setStatusMessage(data.message || 'Failed to reactivate account.');
        return;
      }

      setStatusMessage('Account reactivated successfully! Please login now.');
      setTimeout(() => {
        onReactivationSuccess();
      }, 3000);
    } catch (error) {
      console.error('Reactivate account error:', error);
      setStatusMessage('Network error. Please try again.');
    }
  };

  return (
    <View style={{ width: '100%' }}>
      <Text style={{
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 0.8,
        color: '#223366',
        marginBottom: 2,
        textAlign: 'center',
      }}>Account Reactivation</Text>
      <Text style={{
        fontSize: 26,
        fontWeight: '900',
        marginBottom: 6,
        color: '#6A49F3',
        textAlign: 'center',
        letterSpacing: 0.2
      }}>Reactivate Account</Text>

      <Text style={{
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 20
      }}>
        Your family account has been temporarily deactivated. Enter your registered email or mobile number to receive a reactivation OTP.
      </Text>

      {!reactivationOtpSent ? (
        <>
          <View style={{ marginBottom: 13 }}>
            <Text style={{
              fontSize: 15,
              marginBottom: 6,
              fontWeight: '700',
              color: '#6A49F3',
              marginLeft: 6,
            }}>Mobile Number</Text>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              borderWidth: 1,
              borderColor: '#D0D7E4',
              borderRadius: 14,
              backgroundColor: '#F7F9FC',
            }}>
              <TouchableOpacity style={{
                paddingHorizontal: 12,
                paddingVertical: 13,
                backgroundColor: '#e8f4ff',
                borderRightWidth: 1,
                borderRightColor: '#D0D7E4'
              }}>
                <Text style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: '#4166ee'
                }}>+91</Text>
              </TouchableOpacity>
              <TextInput
                placeholder="Enter 10-digit mobile number"
                value={reactivationIdentifier.replace(/^\+91/, '')}
                onChangeText={val => {
                  const digits = val.replace(/\D/g, '').slice(0, 10);
                  setReactivationIdentifier(`+91${digits}`);
                }}
                style={{
                  flex: 1,
                  padding: 13,
                  fontSize: 16,
                  color: '#223366',
                  backgroundColor: 'transparent'
                }}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="phone-pad"
                maxLength={10}
                placeholderTextColor="#999"
              />
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
              onPress={handleRequestReactivationOTP}
            >
              <Text style={{
                color: '#223366',
                fontSize: 16.5,
                fontWeight: '900'
              }}>Send Reactivation OTP</Text>
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
              onPress={onCancel}
            >
              <Text style={{
                color: '#444',
                fontSize: 16.5,
                fontWeight: '900'
              }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <>
          <View style={{ marginBottom: 13 }}>
            <Text style={{
              fontSize: 15,
              marginBottom: 6,
              fontWeight: '700',
              color: '#6A49F3',
              marginLeft: 6,
            }}>Enter Reactivation OTP</Text>
            <TextInput
              placeholder="6-digit OTP sent to your mobile"
              value={reactivationOtp}
              onChangeText={setReactivationOtp}
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
              onPress={handleReactivateAccount}
            >
              <Text style={{
                color: '#223366',
                fontSize: 16.5,
                fontWeight: '900'
              }}>Reactivate Account</Text>
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
              onPress={onCancel}
            >
              <Text style={{
                color: '#444',
                fontSize: 16.5,
                fontWeight: '900'
              }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
      {statusMessage ? (
        <Text style={{
          marginTop: 15,
          fontSize: 15,
          fontWeight: '700',
          textAlign: 'center',
          color: statusMessage.includes('success') || statusMessage.includes('sent')
            ? '#4CAF50'
            : '#E53935'
        }}>
          {statusMessage}
        </Text>
      ) : null}
    </View>
  );
};

export default AccountRecovery;
