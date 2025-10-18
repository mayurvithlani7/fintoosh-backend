import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Secure storage utility for sensitive authentication data
 * Uses expo-secure-store for encrypted storage on native platforms
 * Falls back to AsyncStorage/localStorage on web
 */

const AUTH_TOKEN_KEY = 'authToken';
const USER_DATA_KEY = 'userData';

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
          console.log('Auth token saved to localStorage (web development)');
        }

        // Save to sessionStorage as backup
        if (window.sessionStorage) {
          window.sessionStorage.setItem(AUTH_TOKEN_KEY, token);
          console.log('Auth token saved to sessionStorage (web development)');
        }
      }

      // Save to AsyncStorage as additional backup for Expo web
      try {
        await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
        console.log('Auth token saved to AsyncStorage (web development)');
      } catch (asyncError) {
        console.warn('AsyncStorage not available for token saving');
      }
    } else {
      // Native platforms: use SecureStore
      await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
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
    console.error('Failed to save auth token to secure storage:', error);
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
          console.log('getAuthToken (web): found token in localStorage, length:', token.length);
          return token;
        }

        // Try sessionStorage as fallback
        token = window.sessionStorage?.getItem(AUTH_TOKEN_KEY);
        if (token) {
          console.log('getAuthToken (web): found token in sessionStorage, length:', token.length);
          return token;
        }

        // Try AsyncStorage as last resort (for Expo web compatibility)
        try {
          token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
          if (token) {
            console.log('getAuthToken (web): found token in AsyncStorage, length:', token.length);
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
      // Native platforms: use SecureStore
      const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
      return token;
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
      // Native platforms: use SecureStore
      await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
    }
  } catch (error) {
    console.error('Failed to delete auth token from secure storage:', error);
    throw error;
  }
};

/**
 * Save user data to secure storage
 * User data contains profile information and is also sensitive
 */
export const saveUserData = async (userData: any): Promise<void> => {
  try {
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
      // Native platforms: use SecureStore
      await SecureStore.setItemAsync(USER_DATA_KEY, userDataString);
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
      // Native platforms: use SecureStore
      userDataString = await SecureStore.getItemAsync(USER_DATA_KEY);
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
      // Native platforms: use SecureStore
      await SecureStore.deleteItemAsync(USER_DATA_KEY);
    }
  } catch (error) {
    console.error('Failed to delete user data from secure storage:', error);
    throw error;
  }
};

/**
 * Clear all authentication data (both token and user data)
 */
export const clearAllAuthData = async (): Promise<void> => {
  try {
    await Promise.all([
      deleteAuthToken(),
      deleteUserData()
    ]);
    console.log('All authentication data cleared from secure storage');
  } catch (error) {
    console.error('Failed to clear all auth data from secure storage:', error);
    throw error;
  }
};
