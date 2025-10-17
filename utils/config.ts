// API Configuration
// Environment-aware configuration for API endpoints

const PRODUCTION_API_URL = "https://fintoosh-backend.onrender.com";

// Get development API URL from environment variable, fallback to localhost:5001
const getDevelopmentApiUrl = (): string => {
  // In Expo, environment variables are accessed via process.env
  const envApiUrl = process.env.API_URL || process.env.EXPO_PUBLIC_API_URL;

  // If no environment variable is set, determine based on platform
  if (!envApiUrl || envApiUrl === "${API_URL}") {
    // For Expo Go and mobile devices, use the computer's IP address
    // In development, you may need to replace this with your computer's IP
    // For example: "http://192.168.1.100:5001" (replace with your IP)
    const defaultUrl = "http://localhost:5001";

    // Log instructions for mobile testing
    if (__DEV__) {
      console.log('🔧 API Configuration:');
      console.log('For mobile testing, you may need to set EXPO_PUBLIC_API_URL to your computer\'s IP address');
      console.log('Example: set EXPO_PUBLIC_API_URL=http://192.168.1.100:5001');
      console.log('Find your IP with: ipconfig (Windows) or ifconfig (Mac/Linux)');
    }

    return defaultUrl;
  }

  return envApiUrl;
};

// Determine API base URL based on environment
// TEMPORARILY FORCE PRODUCTION FOR TESTING
export const API_BASE_URL = PRODUCTION_API_URL; // Always use production for now

// Full API URL with /api suffix
export const API_URL = `${API_BASE_URL}/api`;

// Default refresh intervals (in milliseconds)
export const DEFAULT_REFRESH_INTERVALS = {
  KIDS_HOME: 5 * 60 * 1000, // 5 minutes for kids home screen (was 30 seconds)
  NOTIFICATIONS: 2 * 60 * 1000, // 2 minutes for notifications
  GENERAL: 10 * 60 * 1000, // 10 minutes for general data
};
