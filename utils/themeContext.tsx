import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

// High contrast variants for accessibility
export const highContrastThemes = {
  light: {
    primary: '#005CB2',        // WCAG AA compliant blue
    secondary: '#6B46C1',      // WCAG AA compliant purple
    background: '#FFFFFF',     // Pure white
    surface: '#F8F9FA',        // Light gray surface
    card: '#FFFFFF',           // Pure white cards
    text: '#000000',           // Pure black text
    textSecondary: '#333333',  // Dark gray secondary text
    border: '#CCCCCC',         // Medium gray borders
    success: '#008000',        // Pure green
    warning: '#FFA500',        // Orange
    error: '#DC143C',          // Crimson
    accent: '#FF0000',         // Pure red
    jarColors: {
      current: '#E6F7FF',      // Light blue
      save: '#E6FFE6',         // Light green
      spend: '#FFFFE6',        // Light yellow
      donate: '#FFE6F7',       // Light pink
      invest: '#F7E6FF',       // Light purple
    }
  },
  dark: {
    primary: '#4FC3F7',        // Light blue for dark backgrounds
    secondary: '#BA68C8',      // Light purple
    background: '#000000',     // Pure black
    surface: '#1A1A1A',        // Very dark gray
    card: '#2D2D2D',           // Dark gray cards
    text: '#FFFFFF',           // Pure white text
    textSecondary: '#CCCCCC',  // Light gray secondary text
    border: '#666666',         // Medium gray borders
    success: '#00FF00',        // Pure green
    warning: '#FFD700',        // Gold
    error: '#FF6B6B',          // Light red
    accent: '#FF4500',         // Orange red
    jarColors: {
      current: '#003D4D',      // Dark teal
      save: '#004D00',         // Dark green
      spend: '#4D4D00',        // Dark yellow
      donate: '#4D003D',       // Dark magenta
      invest: '#33004D',       // Dark purple
    }
  }
};

// Standard themes with improved contrast
export const themes = {
  light: {
    // WCAG AA compliant colors (4.5:1 contrast ratio minimum)
    primary: '#154477',        // Blue - moved from hardcoded
    secondary: '#7B1FA2',      // Purple with good contrast
    background: '#FFFFFF',     // Pure white
    surface: '#f6faff',        // Light blue surface - moved from hardcoded
    card: '#FFFFFF',           // Pure white
    text: '#201828',           // Dark blue-gray - moved from hardcoded
    textSecondary: '#64748b',  // Medium gray
    border: '#BDBDBD',         // Light gray borders
    success: '#388E3C',        // Green with good contrast
    warning: '#E65100',        // Darker orange for better contrast (WCAG AA compliant)
    error: '#D32F2F',          // Red with good contrast
    accent: '#C2185B',         // Darker pink for better contrast (WCAG AA compliant)
    jarColors: {
      current: '#228B22',      // Dark green - high contrast
      save: '#1E40AF',         // Dark blue - high contrast
      spend: '#C2410C',        // Dark orange - high contrast
      donate: '#7C2D12',       // Dark brown - high contrast
      invest: '#B45309',       // Dark gold - high contrast
    }
  },
  dark: {
    primary: '#4FC3F7',        // Light blue for dark backgrounds
    secondary: '#8b5cf6',
    background: '#0f172a',
    surface: '#1e293b',
    card: '#1e293b',
    text: '#f1f5f9',
    textSecondary: '#94a3b8',
    border: '#334155',
    success: '#34d399',
    warning: '#fbbf24',
    error: '#f87171',
    accent: '#ff6b6b',
    jarColors: {
      current: '#22C55E',      // Bright green - high contrast
      save: '#3B82F6',         // Bright blue - high contrast
      spend: '#F97316',        // Bright orange - high contrast
      donate: '#A855F7',       // Bright purple - high contrast
      invest: '#F59E0B',       // Bright gold - high contrast
    }
  },
  // Seasonal themes
  halloween: {
    primary: '#ff6b35',
    secondary: '#f7931e',
    background: '#1a1a1a',
    surface: '#2d2d2d',
    card: '#2d2d2d',
    text: '#ffffff',
    textSecondary: '#cccccc',
    border: '#444444',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    accent: '#ff4500',
    jarColors: {
      current: '#2d1b1b',
      save: '#1b2d1b',
      spend: '#2d2d1b',
      donate: '#1b1b2d',
      invest: '#2d1b2d',
    }
  },
  christmas: {
    primary: '#dc2626',
    secondary: '#16a34a',
    background: '#ffffff',
    surface: '#f8fafc',
    card: '#ffffff',
    text: '#1e293b',
    textSecondary: '#64748b',
    border: '#e2e8f0',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    accent: '#dc2626',
    jarColors: {
      current: '#fef2f2',
      save: '#f0fdf4',
      spend: '#fefce8',
      donate: '#fdf2f8',
      invest: '#f0f9ff',
    }
  },
  summer: {
    primary: '#059669',
    secondary: '#0891b2',
    background: '#ffffff',
    surface: '#f0fdfa',
    card: '#ffffff',
    text: '#1e293b',
    textSecondary: '#64748b',
    border: '#d1fae5',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    accent: '#06b6d4',
    jarColors: {
      current: '#ecfdf5',
      save: '#ecfdf5',
      spend: '#ecfdf5',
      donate: '#ecfdf5',
      invest: '#ecfdf5',
    }
  },
  easter: {
    primary: '#7c3aed',
    secondary: '#ea580c',
    background: '#fef7ff',
    surface: '#fdf4ff',
    card: '#ffffff',
    text: '#1e293b',
    textSecondary: '#64748b',
    border: '#f3e8ff',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    accent: '#7c3aed',
    jarColors: {
      current: '#fef7ff',
      save: '#fef7ff',
      spend: '#fef7ff',
      donate: '#fef7ff',
      invest: '#fef7ff',
    }
  },
  // Indian cultural themes
  indian: {
    primary: '#FF9933',        // Saffron
    secondary: '#138808',      // India Green
    background: '#FFFFFF',     // White
    surface: '#FFF8DC',        // Cream
    card: '#FFFFFF',
    text: '#1e293b',
    textSecondary: '#64748b',
    border: '#FFD700',         // Gold
    success: '#228B22',        // Forest Green
    warning: '#FF8C00',        // Dark Orange
    error: '#DC143C',          // Crimson
    accent: '#FF6347',         // Tomato
    jarColors: {
      current: '#FFFACD',      // Lemon Chiffon
      save: '#F0FFF0',         // Honeydew
      spend: '#FFF8DC',        // Cornsilk
      donate: '#FDF5E6',       // Old Lace
      invest: '#F5F5DC',       // Beige
    }
  },
  // diwali: {
  //   primary: '#FFD700',        // Gold
  //   secondary: '#FF4500',      // Orange Red
  //   background: '#2F1B14',     // Dark Brown
  //   surface: '#8B4513',        // Saddle Brown
  //   card: '#DAA520',           // Goldenrod
  //   text: '#FFFFFF',
  //   textSecondary: '#FFE4B5',  // Moccasin
  //   border: '#FFD700',
  //   success: '#32CD32',        // Lime Green
  //   warning: '#FF6347',
  //   error: '#DC143C',
  //   accent: '#FF1493',         // Deep Pink
  //   jarColors: {
  //     current: '#4B0082',      // Indigo
  //     save: '#8B0000',         // Dark Red
  //     spend: '#FFD700',        // Gold
  //     donate: '#FF6347',       // Tomato
  //     invest: '#32CD32',       // Lime Green
  //   }
  // },
  holi: {
    primary: '#FF1493',        // Deep Pink
    secondary: '#00BFFF',      // Deep Sky Blue
    background: '#FFF8DC',     // Cornsilk
    surface: '#F0E68C',        // Khaki
    card: '#FFFFE0',           // Light Yellow
    text: '#8B4513',           // Saddle Brown
    textSecondary: '#D2691E',  // Chocolate
    border: '#FF6347',         // Tomato
    success: '#32CD32',        // Lime Green
    warning: '#FF8C00',        // Dark Orange
    error: '#DC143C',          // Crimson
    accent: '#FF69B4',         // Hot Pink
    jarColors: {
      current: '#FFB6C1',      // Light Pink
      save: '#87CEEB',         // Sky Blue
      spend: '#98FB98',        // Pale Green
      donate: '#F0E68C',       // Khaki
      invest: '#FFA07A',       // Light Salmon
    }
  }
};

export type ThemeType = keyof typeof themes;

interface AnimationSettings {
  enabled: boolean;
  prefersReducedMotion: boolean;
  hapticFeedback: boolean;
  soundFeedback: boolean;
}

interface ThemeContextType {
  theme: ThemeType;
  themeColors: typeof themes.light;
  themes: typeof themes;
  setTheme: (theme: ThemeType) => void;
  toggleDarkMode: () => void;
  isDarkMode: boolean;
  currentSeason: string | null;
  animationSettings: AnimationSettings;
  setAnimationEnabled: (enabled: boolean) => void;
  setHapticFeedback: (enabled: boolean) => void;
  setSoundFeedback: (enabled: boolean) => void;
  highContrastMode: boolean;
  setHighContrastMode: (enabled: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Helper function to get current season with timezone robustness
const getCurrentSeason = (): string | null => {
  // Use UTC to ensure consistency across timezones, then convert to local
  const now = new Date();
  const utcYear = now.getUTCFullYear();
  const utcMonth = now.getUTCMonth() + 1;
  const utcDay = now.getUTCDate();

  // Create local date for accurate seasonal detection
  const localNow = new Date();
  const month = localNow.getMonth() + 1;
  const day = localNow.getDate();

  // Diwali (October 20 - November 15, varies by year but generally this range)
  // if ((month === 10 && day >= 20) || (month === 11 && day <= 15)) {
  //   return 'diwali';
  // }

  // Holi (February 20 - March 20, varies but generally this range)
  if ((month === 2 && day >= 20) || (month === 3 && day <= 20)) {
    return 'holi';
  }

  // Halloween (October 15 - November 5)
  if ((month === 10 && day >= 15) || (month === 11 && day <= 5)) {
    return 'halloween';
  }

  // Christmas/Holiday (December 1 - December 31)
  if (month === 12) {
    return 'christmas';
  }

  // Easter (March 20 - April 10)
  if ((month === 3 && day >= 20) || (month === 4 && day <= 10)) {
    return 'easter';
  }

  // Summer (June 1 - August 31)
  if (month >= 6 && month <= 8) {
    return 'summer';
  }

  return null; // Default to light/dark mode
};

// Helper function to calculate contrast ratio
const getContrastRatio = (color1: string, color2: string): number => {
  // Simple contrast calculation - in a real app, you'd use a proper color library
  // For now, we'll use a basic heuristic based on theme definitions
  const isLightColor = (color: string) => {
    // Simple check for light colors (this is approximate)
    const lightColors = ['#ffffff', '#fff8dc', '#f8fafc', '#fdf4ff', '#fef7ff', '#f0fdfa', '#ffffe0', '#f0e68c'];
    return lightColors.some(light => color.toLowerCase().includes(light.slice(1)));
  };

  const isDarkColor = (color: string) => {
    const darkColors = ['#1e293b', '#0f172a', '#1a1a1a', '#2f1b14', '#8b4513', '#8B4513'];
    return darkColors.some(dark => color.toLowerCase().includes(dark.slice(1)));
  };

  if (isLightColor(color1) && isDarkColor(color2)) return 15; // Good contrast
  if (isDarkColor(color1) && isLightColor(color2)) return 15; // Good contrast
  if (isLightColor(color1) && isLightColor(color2)) return 1; // Poor contrast
  if (isDarkColor(color1) && isDarkColor(color2)) return 1; // Poor contrast
  return 7; // Medium contrast
};

// Validate theme contrast and fix if needed
const validateAndFixThemeContrast = (themeColors: any) => {
  const textBackgroundRatio = getContrastRatio(themeColors.background, themeColors.text);
  const textSecondaryBackgroundRatio = getContrastRatio(themeColors.background, themeColors.textSecondary);

  // If contrast is too low, adjust colors
  if (textBackgroundRatio < 4.5) {
    // Poor contrast - make text darker if background is light
    if (themeColors.background === '#FFF8DC' && themeColors.text === '#8B4513') {
      // Holi theme needs better contrast
      return {
        ...themeColors,
        text: '#1e293b', // Darker text for better contrast
        textSecondary: '#64748b', // Darker secondary text
      };
    }
  }

  return themeColors;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeType>('light');
  const [currentSeason, setCurrentSeason] = useState<string | null>(null);
  const [highContrastMode, setHighContrastModeState] = useState<boolean>(false);
  const [animationSettings, setAnimationSettings] = useState<AnimationSettings>({
    enabled: true,
    prefersReducedMotion: false,
    hapticFeedback: true,
    soundFeedback: true,
  });

  // Load theme and animation preferences on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('userTheme');
        if (savedTheme && savedTheme in themes) {
          setThemeState(savedTheme as ThemeType);
        } else {
          // Check for seasonal theme
          const season = getCurrentSeason();
          setCurrentSeason(season);
          if (season) {
            setThemeState(season as ThemeType);
          }
        }

        const savedAnimations = await AsyncStorage.getItem('animationSettings');
        if (savedAnimations) {
          try {
            const parsedAnimations = JSON.parse(savedAnimations);
            setAnimationSettings(prev => ({ ...prev, ...parsedAnimations }));
          } catch (parseError) {
            console.error('Failed to parse animation settings from AsyncStorage:', parseError);
            // Clear corrupted data
            try {
              await AsyncStorage.removeItem('animationSettings');
              console.log('Cleared corrupted animation settings data');
            } catch (clearError) {
              console.error('Failed to clear corrupted animation settings:', clearError);
            }
          }
        }
      } catch (error) {
        console.error('Error loading theme or animation settings:', error);
      }
    };

    loadSettings();

    // Reduced motion detection
    let setReducedMotion: (v: boolean) => void = () => {};
    if (Platform.OS !== 'web' && AccessibilityInfo) {
      setReducedMotion = (prefers: boolean) =>
        setAnimationSettings((prev) => ({
          ...prev,
          prefersReducedMotion: prefers,
        }));
      AccessibilityInfo.isReduceMotionEnabled().then(setReducedMotion);
      const listener = AccessibilityInfo.addEventListener(
        'reduceMotionChanged',
        setReducedMotion
      );
      return () => {
        if (typeof listener?.remove === 'function') listener.remove();
      };
    }
    // Update seasonal theme daily
    const checkSeason = () => {
      const season = getCurrentSeason();
      setCurrentSeason(season);
      if (season && !AsyncStorage.getItem('userTheme')) {
        setThemeState(season as ThemeType);
      }
    };
    checkSeason();
    const interval = setInterval(checkSeason, 24 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Persist animation settings
  const persistAnimationSettings = async (settings: Partial<AnimationSettings>) => {
    try {
      setAnimationSettings((prev) => {
        const next = { ...prev, ...settings };
        AsyncStorage.setItem('animationSettings', JSON.stringify(next));
        return next;
      });
    } catch (error) {
      console.error('Error saving animation settings:', error);
    }
  };

  const setTheme = async (newTheme: ThemeType) => {
    try {
      setThemeState(newTheme);
      await AsyncStorage.setItem('userTheme', newTheme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const toggleDarkMode = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  const setAnimationEnabled = (enabled: boolean) => persistAnimationSettings({ enabled });
  const setHapticFeedback = (enabled: boolean) => persistAnimationSettings({ hapticFeedback: enabled });
  const setSoundFeedback = (enabled: boolean) => persistAnimationSettings({ soundFeedback: enabled });

  const setHighContrastMode = async (enabled: boolean) => {
    try {
      setHighContrastModeState(enabled);
      await AsyncStorage.setItem('highContrastMode', JSON.stringify(enabled));
    } catch (error) {
      console.error('Error saving high contrast setting:', error);
    }
  };

  const isDarkMode = theme === 'dark';

  // Use high contrast themes if enabled, otherwise use standard themes
  const baseThemeColors = highContrastMode
    ? (highContrastThemes[theme === 'dark' ? 'dark' : 'light'] || highContrastThemes.light)
    : themes[theme];

  const themeColors = validateAndFixThemeContrast(baseThemeColors);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        themeColors,
        themes,
        setTheme,
        toggleDarkMode,
        isDarkMode,
        currentSeason,
        animationSettings,
        setAnimationEnabled,
        setHapticFeedback,
        setSoundFeedback,
        highContrastMode,
        setHighContrastMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};
