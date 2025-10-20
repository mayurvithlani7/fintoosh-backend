import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { useTheme } from '@/utils/themeContext';

export default function Index() {
  const { themeColors } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [shouldRedirect, setShouldRedirect] = useState<string | null>(null);

  useEffect(() => {
    const checkInitialRoute = async () => {
      try {
        console.log('[INDEX] Starting initial route check...');
        const { getAuthToken, getUserData, clearAllAuthData } = await import('@/utils/secureStorage');

        // Check if auth token exists
        const token = await getAuthToken();
        console.log(`[INDEX] Token check: ${token ? 'present' : 'null'}`);

        // Check if user data exists with error handling
        let user = null;
        try {
          user = await getUserData();
          console.log(`[INDEX] User data check: ${user ? 'present' : 'null'}`);

          // Validate user data
          if (user && typeof user === 'object' && user.id && user.role) {
            console.log(`[INDEX] User validation passed: ${user.role}, id: ${user.id}`);
          } else if (user) {
            console.warn('[INDEX] User data invalid, clearing corrupted data');
            await clearAllAuthData();
            user = null;
          }
        } catch (userDataError) {
          console.error('[INDEX] Error retrieving user data:', userDataError);
          // Clear corrupted data
          try {
            await clearAllAuthData();
            console.log('[INDEX] Cleared corrupted auth data');
          } catch (clearError) {
            console.error('[INDEX] Failed to clear corrupted data:', clearError);
          }
          user = null;
        }

        // Determine redirect destination
        if (token && user) {
          if (user.role === 'parent') {
            console.log('[INDEX] Redirecting to parents tabs');
            setShouldRedirect('/(parents-tabs)');
          } else if (user.role === 'child') {
            console.log('[INDEX] Redirecting to kids tabs');
            setShouldRedirect('/(kids-tabs)');
          } else {
            console.log('[INDEX] Invalid user role, redirecting to login');
            setShouldRedirect('/login');
          }
        } else {
          console.log('[INDEX] No valid auth data, redirecting to login');
          setShouldRedirect('/login');
        }
      } catch (error) {
        console.error('[INDEX] Initial route check error:', error);
        // On error, redirect to login
        setShouldRedirect('/login');
      } finally {
        setIsLoading(false);
      }
    };

    // Small delay to ensure storage is ready
    setTimeout(checkInitialRoute, 100);
  }, []);

  // Show loading while checking
  if (isLoading) {
    return (
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: themeColors?.background || '#ffffff'
      }}>
        <Text style={{
          color: themeColors?.text || '#000000',
          fontSize: 18
        }}>
          Starting Fintoosh...
        </Text>
      </View>
    );
  }

  // Redirect to appropriate screen
  if (shouldRedirect) {
    return <Redirect href={shouldRedirect} />;
  }

  // Fallback loading state
  return (
    <View style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: themeColors?.background || '#ffffff'
    }}>
      <Text style={{
        color: themeColors?.text || '#000000',
        fontSize: 18
      }}>
        Loading...
      </Text>
    </View>
  );
}
