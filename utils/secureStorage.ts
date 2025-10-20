import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Secure storage utility for sensitive authentication data
 * Uses expo-secure-store for encrypted storage on native platforms
 * Falls back to AsyncStorage/localStorage on web
 */

const AUTH_TOKEN_KEY = 'authToken';
const USER_DATA_KEY = 'user';

/**
 * Check if we're running on web platform
 */
const isWeb = Platform.OS === 'web';

/**
 * Save authentication token to secure storage
 * Also performs one-time cleanup of token from AsyncStorage
 */
export const saveAuthToken = async (token: string): Promise<void> => {
  try {
    if (isWeb) {
      // Web fallback: save to multiple storage methods for Expo Router compatibility
      if (typeof window !== 'undefined') {
        // Save to localStorage
        if (window.localStorage) {
          window.localStorage.setItem(AUTH_TOKEN_KEY, token);
          // console.log('Auth token saved to localStorage (web development)');
        }

        // Save to sessionStorage as backup
        if (window.sessionStorage) {
          window.sessionStorage.setItem(AUTH_TOKEN_KEY, token);
          // console.log('Auth token saved to sessionStorage (web development)');
        }
      }

      // Save to AsyncStorage as additional backup for Expo web
      try {
        await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
        // console.log('Auth token saved to AsyncStorage (web development)');
      } catch (asyncError) {
        console.warn('AsyncStorage not available for token saving');
      }
    } else {
      // Native platforms: only use SecureStore for tokens—NEVER AsyncStorage for primary storage.
      await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
      // Do NOT save token to AsyncStorage for security reasons.
    }

    // One-time migration: remove from AsyncStorage if it exists (but keep it now for web compatibility)
    // Commenting out migration for now to allow AsyncStorage backup on web
    /*
    try {
      const existingToken = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      if (existingToken) {
        await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
        console.log('Auth token migrated from AsyncStorage to secure storage');
      }
    } catch (asyncStorageError) {
      // Silently handle AsyncStorage errors during migration
      console.warn('AsyncStorage migration warning:', asyncStorageError);
    }
    */
  } catch (error) {
    console.error('Failed to save auth token to secure storage'); // details redacted for security
    throw error;
  }
};

/**
 * Retrieve authentication token from secure storage
 */
export const getAuthToken = async (): Promise<string | null> => {
  try {
    if (isWeb) {
      // Web fallback: try multiple storage methods for Expo Router compatibility
      if (typeof window !== 'undefined') {
        // Try localStorage first
        let token = window.localStorage?.getItem(AUTH_TOKEN_KEY);
        if (token) {
          // console.log('getAuthToken (web): found token in localStorage');
          return token;
        }

        // Try sessionStorage as fallback
        token = window.sessionStorage?.getItem(AUTH_TOKEN_KEY);
        if (token) {
          // console.log('getAuthToken (web): found token in sessionStorage');
          return token;
        }

        // Try AsyncStorage as last resort (for Expo web compatibility)
        try {
          token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
          if (token) {
            // console.log('getAuthToken (web): found token in AsyncStorage');
            return token;
          }
        } catch (asyncError) {
          console.warn('AsyncStorage not available for token retrieval');
        }

        console.log('getAuthToken (web): token not found in any storage method');
        return null;
      }
      console.log('getAuthToken (web): window not available');
      return null;
    } else {
      // Native platforms: use SecureStore with AsyncStorage fallback
      console.log('getAuthToken (native): checking SecureStore...');
      let token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
      if (token) {
        console.log('getAuthToken (native): found token in SecureStore, length:', token.length);
        return token;
      }
      console.log('getAuthToken (native): SecureStore empty, checking AsyncStorage...');
      try {
        token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
        if (token) {
          console.log('getAuthToken (native): fallback token found in AsyncStorage, length:', token.length);
          // Attempt to rehydrate SecureStore (best-effort)
          try {
            await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
            console.log('getAuthToken (native): rehydrated SecureStore');
          } catch (rehydrateError) {
            console.log('getAuthToken (native): failed to rehydrate SecureStore:', rehydrateError);
          }
          return token;
        }
        console.log('getAuthToken (native): AsyncStorage also empty');
      } catch (asyncError) {
        console.warn('AsyncStorage not available for token retrieval (native):', asyncError);
      }
      console.log('getAuthToken (native): token not found in any storage');
      return null;
    }
  } catch (error) {
    console.error('Failed to retrieve auth token from secure storage:', error);
    return null;
  }
};

/**
 * Delete authentication token from secure storage
 */
export const deleteAuthToken = async (): Promise<void> => {
  try {
    if (isWeb) {
      // Web fallback: use localStorage
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(AUTH_TOKEN_KEY);
      }
    } else {
      // Native platforms: use SecureStore and AsyncStorage
      await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
      try {
        await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
      } catch (asyncError) {
        console.warn('AsyncStorage not available for token deletion (native)');
      }
    }
  } catch (error) {
    console.error('Failed to delete auth token from secure storage:', error);
    throw error;
  }
};

/**
 * Validate user data object before saving
 */
const validateUserData = (userData: any): boolean => {
  if (!userData || typeof userData !== 'object') {
    console.warn('User data validation failed: not an object');
    return false;
  }

  // Check for required fields (adjust based on your user schema)
  if (!userData.id) {
    console.warn('User data validation failed: missing id field');
    return false;
  }

  // Try to serialize to ensure it's valid JSON
  try {
    JSON.stringify(userData);
    return true;
  } catch (error) {
    console.warn('User data validation failed: cannot serialize to JSON', error);
    return false;
  }
};

/**
 * Save user data to secure storage
 * User data contains profile information and is also sensitive
 */
export const saveUserData = async (userData: any): Promise<void> => {
  try {
    // Validate data before saving
    if (!validateUserData(userData)) {
      throw new Error('Invalid user data provided for storage');
    }

    const userDataString = JSON.stringify(userData);

    if (isWeb) {
      // Web fallback: save to multiple storage methods for Expo Router compatibility
      if (typeof window !== 'undefined') {
        // Save to localStorage
        if (window.localStorage) {
          window.localStorage.setItem(USER_DATA_KEY, userDataString);
          console.log('User data saved to localStorage (web development)');
        }

        // Save to sessionStorage as backup
        if (window.sessionStorage) {
          window.sessionStorage.setItem(USER_DATA_KEY, userDataString);
          console.log('User data saved to sessionStorage (web development)');
        }
      }

      // Save to AsyncStorage as additional backup for Expo web
      try {
        await AsyncStorage.setItem(USER_DATA_KEY, userDataString);
        console.log('User data saved to AsyncStorage (web development)');
      } catch (asyncError) {
        console.warn('AsyncStorage not available for user data saving');
      }
    } else {
      // Native platforms: use SecureStore with AsyncStorage backup
      await SecureStore.setItemAsync(USER_DATA_KEY, userDataString);
      try {
        await AsyncStorage.setItem(USER_DATA_KEY, userDataString);
      } catch (asyncError) {
        console.warn('AsyncStorage backup not available for user data saving (native)');
      }
    }
  } catch (error) {
    console.error('Failed to save user data to secure storage:', error);
    throw error;
  }
};

/**
 * Retrieve user data from secure storage
 */
export const getUserData = async (): Promise<any | null> => {
  try {
    let userDataString: string | null = null;

    if (isWeb) {
      // Web fallback: try multiple storage methods for Expo Router compatibility
      if (typeof window !== 'undefined') {
        // Try localStorage first
        userDataString = window.localStorage?.getItem(USER_DATA_KEY);
        if (userDataString) {
          console.log('getUserData (web): found data in localStorage');
        } else {
          // Try sessionStorage as fallback
          userDataString = window.sessionStorage?.getItem(USER_DATA_KEY);
          if (userDataString) {
            console.log('getUserData (web): found data in sessionStorage');
          } else {
            // Try AsyncStorage as last resort (for Expo web compatibility)
            try {
              userDataString = await AsyncStorage.getItem(USER_DATA_KEY);
              if (userDataString) {
                console.log('getUserData (web): found data in AsyncStorage');
              }
            } catch (asyncError) {
              console.warn('AsyncStorage not available for user data retrieval');
            }
          }
        }

        if (!userDataString) {
          console.log('getUserData (web): user data not found in any storage method');
          return null;
        }
      } else {
        console.log('getUserData (web): window not available');
        return null;
      }
    } else {
      // Native platforms: use SecureStore with AsyncStorage fallback
      userDataString = await SecureStore.getItemAsync(USER_DATA_KEY);
      if (!userDataString) {
        try {
          userDataString = await AsyncStorage.getItem(USER_DATA_KEY);
          if (userDataString) {
            console.log('getUserData (native): fallback data found in AsyncStorage');
            try {
              await SecureStore.setItemAsync(USER_DATA_KEY, userDataString);
            } catch {
              // ignore rehydrate errors
            }
          }
        } catch (asyncError) {
          console.warn('AsyncStorage not available for user data retrieval (native)');
        }
      }
    }

    if (!userDataString) {
      return null;
    }

    try {
      return JSON.parse(userDataString);
    } catch (parseError) {
      console.error('Failed to parse user data from secure storage:', parseError);
      return null;
    }
  } catch (error) {
    console.error('Failed to retrieve user data from secure storage:', error);
    return null;
  }
};

/**
 * Delete user data from secure storage
 */
export const deleteUserData = async (): Promise<void> => {
  try {
    if (isWeb) {
      // Web fallback: use localStorage
      if (typeof window !== 'undefined') {
        if (window.localStorage) {
          window.localStorage.removeItem(USER_DATA_KEY);
        }
        if (window.sessionStorage) {
          window.sessionStorage.removeItem(USER_DATA_KEY);
        }
      }
      // Also try AsyncStorage
      try {
        await AsyncStorage.removeItem(USER_DATA_KEY);
      } catch (asyncError) {
        console.warn('AsyncStorage not available for user data deletion');
      }
    } else {
      // Native platforms: use SecureStore and AsyncStorage
      await SecureStore.deleteItemAsync(USER_DATA_KEY);
      try {
        await AsyncStorage.removeItem(USER_DATA_KEY);
      } catch (asyncError) {
        console.warn('AsyncStorage not available for user data deletion (native)');
      }
    }
  } catch (error) {
    console.error('Failed to delete user data from secure storage:', error);
    throw error;
  }
};

/**
 * Remove all sensitive app data associated with user/family/child, not just auth
 * (Call this during logout to fully prevent stale data leaks for new logins)
 */
export const clearSensitiveAppData = async (): Promise<void> => {
  const ASYNC_KEYS = [
    'user',
    'authToken',
    'familyDiscussions',
    'dreamBoard',
    'familyTimeline',
    'teachingMilestones',
    'parents_notifications_cleared_at',
    'kids_notifications_cleared_at'
    // ADD further keys if new user-specific AsyncStorage keys are added
  ];
  // Remove all keys with allSettled so all attempts are made
  const removeResults = await Promise.allSettled(
    ASYNC_KEYS.map(async (key) => {
      try {
        await AsyncStorage.removeItem(key);
      } catch (err) {
        console.warn("Failed to remove persistent data key: " + key, err);
      }
    })
  );
  // Always attempt auth data wipe regardless of above failures
  await clearAllAuthData();
  const removeErrors = removeResults.filter(r => r.status === 'rejected');
  if (removeErrors.length > 0) {
    console.warn('[clearSensitiveAppData] Some async keys failed to clear:', removeErrors);
  }
  console.log("All sensitive user/family/child AsyncStorage and secure data clear attempts completed");
};

/**
 * Clear all authentication data (both token and user data)
 */
export const clearAllAuthData = async (): Promise<void> => {
  // Use allSettled to ensure both deletes are always attempted
  const results = await Promise.allSettled([
    deleteAuthToken(),
    deleteUserData()
  ]);
  const errors = results.filter(r => r.status === 'rejected');
  if (errors.length > 0) {
    console.warn('Some authentication data failed to clear:', errors);
  }
  console.log('All authentication data clear attempts completed');
};
