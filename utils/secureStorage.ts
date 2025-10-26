import AsyncStorage from '@react-native-async-storage/async-storage';

// Secure Storage with User Isolation
// Prevents data leakage between multiple users on same device

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  familyId: string;
  role: 'parent' | 'child';
  username?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

// Generate user-specific keys for data isolation
export const getUserSpecificKey = (baseKey: string, userId?: string): string => {
  if (!userId) return baseKey; // Fallback for global keys
  return `${baseKey}_${userId}`;
};

// Secure storage for user data
export const secureStorage = {
  // Store user profile with user-specific key
  setUser: async (user: UserProfile): Promise<void> => {
    try {
      const userKey = getUserSpecificKey('user', user.id);
      await AsyncStorage.setItem(userKey, JSON.stringify(user));

      // Also store global reference for current user
      await AsyncStorage.setItem('currentUserId', user.id);
      await AsyncStorage.setItem('currentUser', JSON.stringify(user));
    } catch (error) {
      console.error('Error storing user data:', error);
      throw new Error('Failed to store user data');
    }
  },

  // Get current user profile
  getUser: async (): Promise<UserProfile | null> => {
    try {
      const currentUserStr = await AsyncStorage.getItem('currentUser');
      if (currentUserStr) {
        return JSON.parse(currentUserStr);
      }
      return null;
    } catch (error) {
      console.error('Error retrieving user data:', error);
      return null;
    }
  },

  // Get user by specific ID (for validation)
  getUserById: async (userId: string): Promise<UserProfile | null> => {
    try {
      const userKey = getUserSpecificKey('user', userId);
      const userStr = await AsyncStorage.getItem(userKey);
      if (userStr) {
        return JSON.parse(userStr);
      }
      return null;
    } catch (error) {
      console.error('Error retrieving user data by ID:', error);
      return null;
    }
  },

  // Store auth tokens with user-specific key
  setAuthToken: async (token: string, userId?: string): Promise<void> => {
    try {
      const tokenKey = getUserSpecificKey('authToken', userId);
      await AsyncStorage.setItem(tokenKey, token);

      // Also store global token for current session
      await AsyncStorage.setItem('currentAuthToken', token);
    } catch (error) {
      console.error('Error storing auth token:', error);
      throw new Error('Failed to store auth token');
    }
  },

  // Get current auth token
  getAuthToken: async (): Promise<string | null> => {
    try {
      const token = await AsyncStorage.getItem('currentAuthToken');
      return token;
    } catch (error) {
      console.error('Error retrieving auth token:', error);
      return null;
    }
  },

  // Store family data with family-specific key
  setFamilyData: async (familyData: any, familyId: string): Promise<void> => {
    try {
      const familyKey = getUserSpecificKey('family', familyId);
      await AsyncStorage.setItem(familyKey, JSON.stringify(familyData));
    } catch (error) {
      console.error('Error storing family data:', error);
      throw new Error('Failed to store family data');
    }
  },

  // Get family data
  getFamilyData: async (familyId: string): Promise<any | null> => {
    try {
      const familyKey = getUserSpecificKey('family', familyId);
      const dataStr = await AsyncStorage.getItem(familyKey);
      if (dataStr) {
        return JSON.parse(dataStr);
      }
      return null;
    } catch (error) {
      console.error('Error retrieving family data:', error);
      return null;
    }
  },

  // Store app settings (global, not user-specific)
  setAppSettings: async (settings: any): Promise<void> => {
    try {
      await AsyncStorage.setItem('appSettings', JSON.stringify(settings));
    } catch (error) {
      console.error('Error storing app settings:', error);
      throw new Error('Failed to store app settings');
    }
  },

  // Get app settings
  getAppSettings: async (): Promise<any | null> => {
    try {
      const settingsStr = await AsyncStorage.getItem('appSettings');
      if (settingsStr) {
        return JSON.parse(settingsStr);
      }
      return null;
    } catch (error) {
      console.error('Error retrieving app settings:', error);
      return null;
    }
  },
};

// Secure logout - clears ALL user data
export const secureLogout = async (): Promise<void> => {
  try {
    // Get current user to clear their specific data
    const currentUser = await secureStorage.getUser();
    if (currentUser) {
      const userId = currentUser.id;
      const familyId = currentUser.familyId;

      // Clear user-specific data
      await AsyncStorage.removeItem(getUserSpecificKey('user', userId));
      await AsyncStorage.removeItem(getUserSpecificKey('authToken', userId));
      await AsyncStorage.removeItem(getUserSpecificKey('family', familyId));
    }

    // Clear global session data
    await AsyncStorage.removeItem('currentUserId');
    await AsyncStorage.removeItem('currentUser');
    await AsyncStorage.removeItem('currentAuthToken');

    // Clear legacy keys (for backward compatibility)
    await AsyncStorage.removeItem('user');
    await AsyncStorage.removeItem('accessToken');
    await AsyncStorage.removeItem('token');

    console.log('Secure logout completed - all user data cleared');
  } catch (error) {
    console.error('Error during secure logout:', error);
    // Even if there's an error, try to clear global keys
    try {
      await AsyncStorage.removeItem('currentUserId');
      await AsyncStorage.removeItem('currentUser');
      await AsyncStorage.removeItem('currentAuthToken');
    } catch (fallbackError) {
      console.error('Fallback logout cleanup failed:', fallbackError);
    }
  }
};

// Validate current session
export const validateSession = async (): Promise<boolean> => {
  try {
    const user = await secureStorage.getUser();
    const token = await secureStorage.getAuthToken();

    if (!user || !token) {
      return false;
    }

    // Validate token with server (optional - depends on your auth system)
    // For now, just check if data exists and is valid
    return true;
  } catch (error) {
    console.error('Session validation error:', error);
    return false;
  }
};

// Clear all data (for account deletion)
export const clearAllUserData = async (): Promise<void> => {
  try {
    // Get all keys
    const keys = await AsyncStorage.getAllKeys();

    // Clear user-specific keys
    const keysToRemove = keys.filter(key =>
      key.startsWith('user_') ||
      key.startsWith('authToken_') ||
      key.startsWith('family_') ||
      key === 'currentUserId' ||
      key === 'currentUser' ||
      key === 'currentAuthToken' ||
      key === 'user' || // legacy
      key === 'accessToken' || // legacy
      key === 'token' // legacy
    );

    await AsyncStorage.multiRemove(keysToRemove);
    console.log('All user data cleared');
  } catch (error) {
    console.error('Error clearing all user data:', error);
  }
};

// Export legacy functions for backward compatibility (but they now use secure storage)
export { secureLogout as clearAllAuthData, secureLogout as clearSensitiveAppData, secureLogout as deleteAuthToken };
export const setUser = secureStorage.setUser;
export const getUser = secureStorage.getUser;
export const getUserById = secureStorage.getUserById;
export const setAuthToken = secureStorage.setAuthToken;
export const getAuthToken = secureStorage.getAuthToken;
export const saveAuthToken = secureStorage.setAuthToken;
export const saveUserData = secureStorage.setUser;
export const getUserData = secureStorage.getUser;
