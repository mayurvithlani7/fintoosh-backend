/**
 * Mobile Layout Utilities
 * Provides consistent mobile-friendly dimensions and responsive design helpers
 * Optimized for Android and iOS mobile devices
 */

import { Dimensions, PixelRatio, Platform } from 'react-native';

// Get screen dimensions
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const pixelRatio = PixelRatio.get();

// Device type detection
export const isAndroid = Platform.OS === 'android';
export const isIOS = Platform.OS === 'ios';

// Screen size categories
export const isSmallScreen = screenWidth < 360;
export const isMediumScreen = screenWidth >= 360 && screenWidth < 480;
export const isLargeScreen = screenWidth >= 480;

// Mobile layout constants
export const MOBILE_LAYOUT = {
  // Container dimensions
  containerWidth: screenWidth - 32, // Full width minus standard padding
  containerPadding: 16,

  // Touch targets (minimum 44px for accessibility)
  minTouchTarget: 44,
  buttonHeight: 48,
  tabHeight: 48,

  // Typography scaling
  titleSize: Math.max(24, screenWidth * 0.06),
  subtitleSize: Math.max(18, screenWidth * 0.045),
  bodySize: Math.max(16, screenWidth * 0.04),
  captionSize: Math.max(14, screenWidth * 0.035),
  smallSize: Math.max(12, screenWidth * 0.03),

  // Spacing
  cardPadding: 16,
  sectionSpacing: 16,
  itemSpacing: 12,

  // Border radius
  borderRadius: 12,
  cardBorderRadius: 16,

  // Shadows/Elevation
  cardElevation: 3,
  buttonElevation: 2,

  // Colors (will be overridden by theme)
  borderWidth: 1,
};

/**
 * Get responsive dimension based on screen size
 */
export function getResponsiveValue(small: number, medium: number, large: number): number {
  if (isSmallScreen) return small;
  if (isMediumScreen) return medium;
  return large;
}

/**
 * Get scaled font size for mobile readability
 */
export function getScaledFontSize(baseSize: number): number {
  return Math.max(baseSize, screenWidth * (baseSize / 375)); // 375 is iPhone 6 width
}

/**
 * Common mobile-optimized styles
 */
export const MOBILE_STYLES = {
  // Container styles
  fullWidthContainer: {
    width: MOBILE_LAYOUT.containerWidth,
    alignSelf: 'center' as const,
  },

  // Card styles
  card: {
    backgroundColor: 'transparent', // Will be overridden by theme
    borderRadius: MOBILE_LAYOUT.cardBorderRadius,
    padding: MOBILE_LAYOUT.cardPadding,
    marginBottom: MOBILE_LAYOUT.sectionSpacing,
    elevation: MOBILE_LAYOUT.cardElevation,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: MOBILE_LAYOUT.borderWidth,
    borderColor: 'transparent', // Will be overridden by theme
  },

  // Button styles
  primaryButton: {
    minHeight: MOBILE_LAYOUT.buttonHeight,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: MOBILE_LAYOUT.borderRadius,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    elevation: MOBILE_LAYOUT.buttonElevation,
  },

  // Tab styles
  tabContainer: {
    flexDirection: 'row' as const,
    backgroundColor: 'transparent', // Will be overridden by theme
    borderRadius: MOBILE_LAYOUT.cardBorderRadius,
    padding: 4,
    marginBottom: MOBILE_LAYOUT.sectionSpacing,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },

  tabButton: {
    flex: 1,
    minHeight: MOBILE_LAYOUT.tabHeight,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: MOBILE_LAYOUT.borderRadius,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },

  // Typography
  title: {
    fontSize: MOBILE_LAYOUT.titleSize,
    fontWeight: 'bold' as const,
    textAlign: 'center' as const,
  },

  subtitle: {
    fontSize: MOBILE_LAYOUT.subtitleSize,
    textAlign: 'center' as const,
  },

  body: {
    fontSize: MOBILE_LAYOUT.bodySize,
    lineHeight: MOBILE_LAYOUT.bodySize * 1.5,
  },

  caption: {
    fontSize: MOBILE_LAYOUT.captionSize,
    lineHeight: MOBILE_LAYOUT.captionSize * 1.4,
  },

  // Layout helpers
  row: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },

  spaceBetween: {
    justifyContent: 'space-between' as const,
  },

  center: {
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },

  // ScrollView content
  scrollContent: {
    paddingHorizontal: MOBILE_LAYOUT.containerPadding,
    paddingTop: 20,
    paddingBottom: 40,
  },
};

/**
 * Get platform-specific styles
 */
export function getPlatformStyles() {
  return {
    // Android-specific adjustments
    android: {
      buttonElevation: 4,
      cardElevation: 3,
      fontFamily: 'Roboto',
    },

    // iOS-specific adjustments
    ios: {
      buttonElevation: 0, // iOS uses shadow instead
      cardElevation: 0,
      fontFamily: 'System',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
  };
}

/**
 * Safe area adjustments for different devices
 */
export function getSafeAreaInsets() {
  // Basic safe area handling - can be enhanced with react-native-safe-area-context
  return {
    top: isIOS ? 44 : 24, // Status bar height
    bottom: isIOS ? 34 : 24, // Home indicator height
    left: 0,
    right: 0,
  };
}

export default {
  MOBILE_LAYOUT,
  MOBILE_STYLES,
  getResponsiveValue,
  getScaledFontSize,
  getPlatformStyles,
  getSafeAreaInsets,
  isAndroid,
  isIOS,
  isSmallScreen,
  isMediumScreen,
  isLargeScreen,
  screenWidth,
  screenHeight,
  pixelRatio,
};
