import { API_URL } from '@/utils/config';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';

type OTPLoginProps = {
  onLoginSuccess: (data: any) => void;
  onBack: () => void;
  onReactivationRequired?: () => void;
};

const OTPLogin: React.FC<OTPLoginProps> = ({ onLoginSuccess, onBack, onReactivationRequired }) => {
  const [mobileNumber, setMobileNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');

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
      console.error('Send OTP error:', error);
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
          setStatusMessage(`Too many OTP verification attempts. Please wait ${waitTime} seconds before trying again.`);
          return;
        }
        setStatusMessage(data.message || 'Invalid OTP. Please try again.');
        return;
      }

      await onLoginSuccess(data);
    } catch (error) {
      console.error('Verify OTP error:', error);
      setStatusMessage('Network error. Please try again.');
    }
  };

  return (
    <View style={{ width: '100%' }}>
      {!otpSent ? (
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
                value={mobileNumber.replace(/^\+91/, '')}
                onChangeText={val => {
                  const digits = val.replace(/\D/g, '').slice(0, 10);
                  setMobileNumber(`+91${digits}`);
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
              onPress={handleSendOTP}
            >
              <Text style={{
                color: '#223366',
                fontSize: 16.5,
                fontWeight: '900'
              }}>Send OTP</Text>
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
            }}>Enter OTP</Text>
            <View style={{
              position: 'relative',
            }}>
              <TextInput
                placeholder="6-digit OTP"
                value={otp}
                onChangeText={setOtp}
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
                autoCapitalize="characters"
                autoCorrect={false}
                keyboardType="default"
                maxLength={6}
                secureTextEntry={!showOtp}
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
                onPress={() => setShowOtp(!showOtp)}
                accessibilityRole="button"
                accessibilityLabel={showOtp ? "Hide OTP" : "Show OTP"}
                accessibilityHint="Double tap to toggle OTP visibility"
              >
                <Ionicons
                  name={showOtp ? "eye-off" : "eye"}
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
              onPress={handleVerifyOTP}
            >
              <Text style={{
                color: '#223366',
                fontSize: 16.5,
                fontWeight: '900'
              }}>Verify OTP</Text>
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
          {resendTimer > 0 ? (
            <Text style={{
              fontSize: 14,
              color: '#666',
              textAlign: 'center',
              marginTop: 12
            }}>
              Resend OTP in {resendTimer} seconds
            </Text>
          ) : (
            <TouchableOpacity onPress={handleSendOTP}>
              <Text style={{
                fontSize: 14,
                color: '#6A49F3',
                fontWeight: '600',
                textAlign: 'center',
                marginTop: 12,
                textDecorationLine: 'underline'
              }}>Resend OTP</Text>
            </TouchableOpacity>
          )}
        </>
      )}
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

export default OTPLogin;
