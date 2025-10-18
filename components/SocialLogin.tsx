import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

type SocialLoginProps = {
  onLoginSuccess: (data: any) => void;
  onBack: () => void;
};

const SocialLogin: React.FC<SocialLoginProps> = ({ onLoginSuccess, onBack }) => {
  // Placeholder for future social login implementation
  const handleGoogleLogin = () => {
    // TODO: Implement Google OAuth
    console.log('Google login not implemented yet');
  };

  const handleFacebookLogin = () => {
    // TODO: Implement Facebook OAuth
    console.log('Facebook login not implemented yet');
  };

  const handleAppleLogin = () => {
    // TODO: Implement Apple Sign In
    console.log('Apple login not implemented yet');
  };

  return (
    <View style={{ width: '100%' }}>
      <Text style={{
        fontSize: 15,
        marginBottom: 6,
        fontWeight: '700',
        color: '#6A49F3',
        marginLeft: 6,
        textAlign: 'center'
      }}>Social Login</Text>

      <Text style={{
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 20
      }}>
        Sign in quickly with your favorite social account.
      </Text>

      <TouchableOpacity
        style={{
          backgroundColor: '#DB4437',
          borderRadius: 12,
          paddingVertical: 14,
          paddingHorizontal: 24,
          marginHorizontal: 4,
          marginBottom: 12,
          justifyContent: 'center',
          alignItems: 'center',
          shadowColor: '#DB4437',
          shadowOpacity: 0.35,
          shadowRadius: 8,
          elevation: 6
        }}
        onPress={handleGoogleLogin}
      >
        <Text style={{
          color: '#FFFFFF',
          fontSize: 16.5,
          fontWeight: '900'
        }}>Continue with Google</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{
          backgroundColor: '#4267B2',
          borderRadius: 12,
          paddingVertical: 14,
          paddingHorizontal: 24,
          marginHorizontal: 4,
          marginBottom: 12,
          justifyContent: 'center',
          alignItems: 'center',
          shadowColor: '#4267B2',
          shadowOpacity: 0.35,
          shadowRadius: 8,
          elevation: 6
        }}
        onPress={handleFacebookLogin}
      >
        <Text style={{
          color: '#FFFFFF',
          fontSize: 16.5,
          fontWeight: '900'
        }}>Continue with Facebook</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{
          backgroundColor: '#000000',
          borderRadius: 12,
          paddingVertical: 14,
          paddingHorizontal: 24,
          marginHorizontal: 4,
          marginBottom: 12,
          justifyContent: 'center',
          alignItems: 'center',
          shadowColor: '#000000',
          shadowOpacity: 0.35,
          shadowRadius: 8,
          elevation: 6
        }}
        onPress={handleAppleLogin}
      >
        <Text style={{
          color: '#FFFFFF',
          fontSize: 16.5,
          fontWeight: '900'
        }}>Continue with Apple</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{
          backgroundColor: '#E0E0E0',
          borderRadius: 12,
          paddingVertical: 14,
          paddingHorizontal: 24,
          marginHorizontal: 4,
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
  );
};

export default SocialLogin;
