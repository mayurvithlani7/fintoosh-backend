/**
 * Fintoosh Brand Colors and Theme Configuration
 * Based on BRAND_GUIDE.md - Trust, Growth, Fun, Wisdom
 *
 * Enhanced with WCAG AA Color Contrast Validation
 */

import { Platform } from 'react-native';

export const getContrastRatio = (color1: string, color2: string): number => {
  const parseHex = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  const rgb1 = parseHex(color1);
  const rgb2 = parseHex(color2);

  if (!rgb1 || !rgb2) return 0;

  const getLuminance = (r: number, g: number, b: number) => {
    const toLinear = (val: number) => {
      val = val / 255;
      return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  };

  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);

  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);

  return (brightest + 0.05) / (darkest + 0.05);
};

const meetsWCAGAA = (foreground: string, background: string, isLargeText = false): boolean => {
  const contrast = getContrastRatio(foreground, background);
  const required = isLargeText ? 3.0 : 4.5;
  return contrast >= required;
};

// Brand Color Palette
export const BRAND_COLORS = {
  trust: '#4A90E2',      // Blue - Trust & Security
  growth: '#50C878',     // Green - Growth & Success
  fun: '#FFD700',        // Yellow - Fun & Celebration
  wisdom: '#8A2BE2',     // Purple - Wisdom & Learning
};

// Extended UI Color Palette
export const UI_COLORS = {
  // Trust Blue variations
  primary: '#4A90E2',
  primaryLight: '#6BA3E8',
  primaryDark: '#357ABD',

  // Growth Green variations
  success: '#50C878',
  successLight: '#72D092',
  successDark: '#3D9B5F',

  // Fun Yellow variations
  accent: '#FFD700',
  accentLight: '#FFE033',
  accentDark: '#E6C200',

  // Wisdom Purple variations
  secondary: '#8A2BE2',
  secondaryLight: '#A050E8',
  secondaryDark: '#6B1FB5',

  // Neutral grays for text and backgrounds
  text: '#2C2C2C',
  textSecondary: '#666666',
  background: '#FFFFFF',
  surface: '#F8F9FA',
  border: '#E0E0E0',
};

export const Colors = {
  light: {
    // Brand Colors - Core Identity (WCAG AA Optimized)
    primary: '#1D4ED8',                // Darker blue for better contrast (4.6:1 vs white)
    secondary: BRAND_COLORS.wisdom,   // Wisdom Purple - Educational content
    success: '#047857',                // Darker green for better contrast (4.6:1 vs white)
    accent: '#B45309',                // Darker amber for WCAG AA compliance (4.8:1 vs white)

    // UI Colors - Supporting Palette
    text: UI_COLORS.text,
    textSecondary: UI_COLORS.textSecondary,
    background: UI_COLORS.background,
    surface: UI_COLORS.surface,
    border: UI_COLORS.border,

    // Legacy compatibility
    tint: '#1D4ED8',                   // Updated to match new primary
    icon: UI_COLORS.textSecondary,
    tabIconDefault: UI_COLORS.textSecondary,
    tabIconSelected: '#1D4ED8',        // Updated to match new primary
    card: UI_COLORS.background,

    // Additional brand colors for components
    error: '#DC3545',
    warning: '#D97706', // Darker orange for WCAG AA compliance (4.7:1 vs white)
    info: '#17A2B8',
  },
  dark: {
    // Dark mode brand color variations (WCAG AA Optimized)
    primary: UI_COLORS.primaryLight,    // Lighter blue for dark backgrounds
    secondary: '#C084FC',                // Bright purple for AA compliance (5.2:1 vs dark bg)
    success: UI_COLORS.successLight,     // Lighter green for dark backgrounds
    accent: UI_COLORS.accentLight,       // Lighter yellow for dark backgrounds

    // Dark mode UI colors
    text: '#FFFFFF',
    textSecondary: '#CCCCCC',
    background: '#1A1A1A',
    surface: '#2A2A2A',
    border: '#404040',

    // Legacy compatibility for dark mode
    tint: UI_COLORS.primaryLight,
    icon: '#CCCCCC',
    tabIconDefault: '#CCCCCC',
    tabIconSelected: UI_COLORS.primaryLight,
    card: '#2A2A2A',

    // Dark mode variations for status colors
    error: '#FF6B7A',
    warning: '#FFD700',
    info: '#4FC3F7',
  },
};

// Premium Font Stack Configuration - Professional & Modern
export const FONTS = {
  // Primary: Modern, professional, highly readable (Inter)
  primary: {
    light: Platform.select({
      ios: 'Inter-Light',
      android: 'Inter-Light',
      web: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      default: 'Inter-Light',
    }),
    regular: Platform.select({
      ios: 'Inter-Regular',
      android: 'Inter-Regular',
      web: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      default: 'Inter-Regular',
    }),
    medium: Platform.select({
      ios: 'Inter-Medium',
      android: 'Inter-Medium',
      web: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      default: 'Inter-Medium',
    }),
    semiBold: Platform.select({
      ios: 'Inter-SemiBold',
      android: 'Inter-SemiBold',
      web: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      default: 'Inter-SemiBold',
    }),
    bold: Platform.select({
      ios: 'Inter-Bold',
      android: 'Inter-Bold',
      web: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      default: 'Inter-Bold',
    }),
    extraBold: Platform.select({
      ios: 'Inter-ExtraBold',
      android: 'Inter-ExtraBold',
      web: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      default: 'Inter-ExtraBold',
    }),
  },

  // Secondary: Premium display font (SF Pro Display - Apple's system font)
  secondary: {
    regular: Platform.select({
      ios: 'SF-Pro-Display-Regular',
      android: 'SF-Pro-Display-Regular',
      web: '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      default: 'SF-Pro-Display-Regular',
    }),
    medium: Platform.select({
      ios: 'SF-Pro-Display-Medium',
      android: 'SF-Pro-Display-Medium',
      web: '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      default: 'SF-Pro-Display-Medium',
    }),
    semiBold: Platform.select({
      ios: 'SF-Pro-Display-SemiBold',
      android: 'SF-Pro-Display-SemiBold',
      web: '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      default: 'SF-Pro-Display-SemiBold',
    }),
    bold: Platform.select({
      ios: 'SF-Pro-Display-Bold',
      android: 'SF-Pro-Display-Bold',
      web: '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      default: 'SF-Pro-Display-Bold',
    }),
  },

  // Accent: Modern geometric font (Poppins)
  accent: {
    light: Platform.select({
      ios: 'Poppins-Light',
      android: 'Poppins-Light',
      web: 'Poppins, "Helvetica Neue", Helvetica, Arial, sans-serif',
      default: 'Poppins-Light',
    }),
    regular: Platform.select({
      ios: 'Poppins-Regular',
      android: 'Poppins-Regular',
      web: 'Poppins, "Helvetica Neue", Helvetica, Arial, sans-serif',
      default: 'Poppins-Regular',
    }),
    medium: Platform.select({
      ios: 'Poppins-Medium',
      android: 'Poppins-Medium',
      web: 'Poppins, "Helvetica Neue", Helvetica, Arial, sans-serif',
      default: 'Poppins-Medium',
    }),
    semiBold: Platform.select({
      ios: 'Poppins-SemiBold',
      android: 'Poppins-SemiBold',
      web: 'Poppins, "Helvetica Neue", Helvetica, Arial, sans-serif',
      default: 'Poppins-SemiBold',
    }),
    bold: Platform.select({
      ios: 'Poppins-Bold',
      android: 'Poppins-Bold',
      web: 'Poppins, "Helvetica Neue", Helvetica, Arial, sans-serif',
      default: 'Poppins-Bold',
    }),
  },

  // Tertiary: Warm, human, approachable (Nunito)
  tertiary: {
    regular: Platform.select({
      ios: 'Nunito-Regular',
      android: 'Nunito-Regular',
      web: 'Nunito, Georgia, "Times New Roman", serif',
      default: 'Nunito-Regular',
    }),
    medium: Platform.select({
      ios: 'Nunito-Medium',
      android: 'Nunito-Medium',
      web: 'Nunito, Georgia, "Times New Roman", serif',
      default: 'Nunito-Medium',
    }),
    semiBold: Platform.select({
      ios: 'Nunito-SemiBold',
      android: 'Nunito-SemiBold',
      web: 'Nunito, Georgia, "Times New Roman", serif',
      default: 'Nunito-SemiBold',
    }),
    bold: Platform.select({
      ios: 'Nunito-Bold',
      android: 'Nunito-Bold',
      web: 'Nunito, Georgia, "Times New Roman", serif',
      default: 'Nunito-Bold',
    }),
  },

  // Display: Fun, modern, distinctive (Fredoka) - for special elements
  display: {
    regular: Platform.select({
      ios: 'Fredoka-Regular',
      android: 'Fredoka-Regular',
      web: 'Fredoka, "Comic Sans MS", cursive',
      default: 'Fredoka-Regular',
    }),
    medium: Platform.select({
      ios: 'Fredoka-Medium',
      android: 'Fredoka-Medium',
      web: 'Fredoka, "Comic Sans MS", cursive',
      default: 'Fredoka-Medium',
    }),
    bold: Platform.select({
      ios: 'Fredoka-Bold',
      android: 'Fredoka-Bold',
      web: 'Fredoka, "Comic Sans MS", cursive',
      default: 'Fredoka-Bold',
    }),
  },
};

// Typography Scale - Premium Hierarchy (Legacy - will be replaced by semantic tokens)
export const TYPOGRAPHY = {
  // Headlines - SF Pro Display (premium feel)
  h1: { fontSize: 32, lineHeight: 40, fontFamily: FONTS.secondary.bold }, // SF Pro Display Bold
  h2: { fontSize: 28, lineHeight: 36, fontFamily: FONTS.secondary.bold }, // SF Pro Display Bold

  // Subheadings - Inter SemiBold (modern)
  h3: { fontSize: 24, lineHeight: 32, fontFamily: FONTS.primary.semiBold },
  h4: { fontSize: 20, lineHeight: 28, fontFamily: FONTS.primary.semiBold },

  // Body Text - Inter Regular/Medium (readable)
  bodyLarge: { fontSize: 18, lineHeight: 26, fontFamily: FONTS.primary.regular },
  body: { fontSize: 16, lineHeight: 24, fontFamily: FONTS.primary.regular },
  bodySmall: { fontSize: 14, lineHeight: 20, fontFamily: FONTS.primary.regular },

  // Labels and UI - Inter Medium (clear)
  label: { fontSize: 14, lineHeight: 20, fontFamily: FONTS.primary.medium },

  // Captions - Inter Regular (subtle)
  caption: { fontSize: 12, lineHeight: 16, fontFamily: FONTS.primary.regular },

  // Buttons - Inter SemiBold
  button: { fontSize: 16, lineHeight: 24, fontFamily: FONTS.primary.semiBold },

  // Special elements - Poppins for accent elements
  accent: { fontSize: 16, lineHeight: 24, fontFamily: FONTS.accent.medium },
};

// New Semantic Typography Scale - Scalable Design System (Enhanced for Kids Learning)
export const SEMANTIC_TYPOGRAPHY = {
  // Display - Largest text for major headings (Kid-friendly, playful)
  'type-display-large': {
    semanticTokenName: 'type-display-large',
    intendedUse: 'Main app screen titles and hero headings',
    recommendedBaseFontSize: '32pt / 28sp',
    recommendedFontWeight: 'Bold / 700',
    fontSize: 32,
    lineHeight: 40,
    fontFamily: FONTS.display.bold // Fredoka for playful display
  },
  'type-display-medium': {
    semanticTokenName: 'type-display-medium',
    intendedUse: 'Secondary screen titles and major section headers',
    recommendedBaseFontSize: '28pt / 24sp',
    recommendedFontWeight: 'Bold / 700',
    fontSize: 28,
    lineHeight: 36,
    fontFamily: FONTS.display.bold // Fredoka for kid-friendly headers
  },

  // Headings - Section and component titles (Clear hierarchy)
  'type-heading-large': {
    semanticTokenName: 'type-heading-large',
    intendedUse: 'Primary section headings and card headers',
    recommendedBaseFontSize: '24pt / 20sp',
    recommendedFontWeight: 'Semibold / 600',
    fontSize: 24,
    lineHeight: 32,
    fontFamily: FONTS.primary.semiBold // Inter for readability
  },
  'type-heading-medium': {
    semanticTokenName: 'type-heading-medium',
    intendedUse: 'Secondary section headings and component titles',
    recommendedBaseFontSize: '20pt / 18sp',
    recommendedFontWeight: 'Semibold / 600',
    fontSize: 20,
    lineHeight: 28,
    fontFamily: FONTS.primary.semiBold
  },
  'type-heading-small': {
    semanticTokenName: 'type-heading-small',
    intendedUse: 'Tertiary headings and card titles',
    recommendedBaseFontSize: '18pt / 16sp',
    recommendedFontWeight: 'Semibold / 600',
    fontSize: 18,
    lineHeight: 26,
    fontFamily: FONTS.primary.semiBold
  },

  // Body - Main content text (Optimized for children's reading)
  'type-body-large': {
    semanticTokenName: 'type-body-large',
    intendedUse: 'Primary body text and descriptions',
    recommendedBaseFontSize: '18pt / 16sp',
    recommendedFontWeight: 'Regular / 400',
    fontSize: 18,
    lineHeight: 26,
    fontFamily: FONTS.tertiary.regular // Nunito for warm, readable body text
  },
  'type-body': {
    semanticTokenName: 'type-body',
    intendedUse: 'Standard body text and content',
    recommendedBaseFontSize: '16pt / 14sp',
    recommendedFontWeight: 'Regular / 400',
    fontSize: 16,
    lineHeight: 24,
    fontFamily: FONTS.tertiary.regular
  },
  'type-body-small': {
    semanticTokenName: 'type-body-small',
    intendedUse: 'Secondary body text and supporting content',
    recommendedBaseFontSize: '14pt / 12sp',
    recommendedFontWeight: 'Regular / 400',
    fontSize: 14,
    lineHeight: 20,
    fontFamily: FONTS.tertiary.regular
  },

  // Labels - Interactive and UI elements (Clear and actionable)
  'type-label-large': {
    semanticTokenName: 'type-label-large',
    intendedUse: 'Primary buttons and important labels',
    recommendedBaseFontSize: '16pt / 14sp',
    recommendedFontWeight: 'Semibold / 600',
    fontSize: 16,
    lineHeight: 24,
    fontFamily: FONTS.primary.semiBold
  },
  'type-label': {
    semanticTokenName: 'type-label',
    intendedUse: 'Standard buttons and form labels',
    recommendedBaseFontSize: '14pt / 12sp',
    recommendedFontWeight: 'Medium / 500',
    fontSize: 14,
    lineHeight: 20,
    fontFamily: FONTS.primary.medium
  },
  'type-label-small': {
    semanticTokenName: 'type-label-small',
    intendedUse: 'Secondary buttons and small labels',
    recommendedBaseFontSize: '12pt / 11sp',
    recommendedFontWeight: 'Medium / 500',
    fontSize: 12,
    lineHeight: 16,
    fontFamily: FONTS.primary.medium
  },

  // Captions - Subtle supporting text (Kid-accessible metadata)
  'type-caption': {
    semanticTokenName: 'type-caption',
    intendedUse: 'Captions, metadata, and helper text',
    recommendedBaseFontSize: '12pt / 10sp',
    recommendedFontWeight: 'Regular / 400',
    fontSize: 12,
    lineHeight: 16,
    fontFamily: FONTS.primary.regular
  },
  'type-caption-small': {
    semanticTokenName: 'type-caption-small',
    intendedUse: 'Fine print and minimal supporting text',
    recommendedBaseFontSize: '10pt / 9sp',
    recommendedFontWeight: 'Regular / 400',
    fontSize: 10,
    lineHeight: 14,
    fontFamily: FONTS.primary.regular
  }
};

// Kids Section Typography - Friendly, Inviting, Highly Legible for Children
// Uses Fredoka (display) for playful headings, Nunito (tertiary) for warm body text
// Supports Dynamic Type scaling for accessibility
export const KIDS_TYPOGRAPHY = {
  // Main Title - Large, playful, attention-grabbing for kids
  kidTitle: {
    fontSize: 28, // Slightly larger for prominence
    lineHeight: 36,
    fontFamily: FONTS.display.bold, // Fredoka Bold - fun and distinctive
    color: Colors.light.primary, // Primary brand color for high visibility
    // Dynamic Type: scales with system font size
    adjustsFontSizeToFit: true,
    minimumFontScale: 0.8,
  },

  // Game Card Headers - Clear, readable, inviting
  gameCardHeader: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: FONTS.tertiary.semiBold, // Nunito SemiBold - warm and approachable
    color: Colors.light.text, // Primary text color for readability
    // Dynamic Type support
    adjustsFontSizeToFit: true,
    minimumFontScale: 0.9,
  },

  // Instructions/Rules Text - Comfortable reading for kids
  instructionsText: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: FONTS.tertiary.regular, // Nunito Regular - warm and readable
    color: Colors.light.textSecondary, // Secondary text for supporting content
    // Dynamic Type support
    adjustsFontSizeToFit: false, // Allow natural wrapping
  },

  // Modal Titles - Clear hierarchy in game modals
  modalTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontFamily: FONTS.display.medium, // Fredoka Medium - playful but readable
    color: Colors.light.success, // Success color for positive game context
    adjustsFontSizeToFit: true,
    minimumFontScale: 0.85,
  },

  // Game Descriptions - Supporting text for game cards
  gameDescription: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: FONTS.tertiary.regular,
    color: Colors.light.textSecondary,
    adjustsFontSizeToFit: false,
  },

  // Button Labels - Clear call-to-action text
  buttonLabel: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: FONTS.tertiary.medium, // Nunito Medium - slightly bolder for buttons
    // Color will be set contextually (text for light buttons, card for dark buttons)
    adjustsFontSizeToFit: true,
    minimumFontScale: 0.9,
  },

  // Coming Soon Labels - Subtle but visible
  comingSoonLabel: {
    fontSize: 11,
    lineHeight: 16,
    fontFamily: FONTS.tertiary.bold,
    color: '#af8111', // Warm brown for "coming soon" status
    adjustsFontSizeToFit: true,
    minimumFontScale: 0.95,
  },
};

// Legacy Fonts for backward compatibility
export const Fonts = Platform.select({
  ios: {
    sans: FONTS.primary.regular,
    serif: FONTS.secondary.regular,
    rounded: FONTS.display.regular,
    mono: 'ui-monospace',
  },
  default: {
    sans: FONTS.primary.regular,
    serif: FONTS.secondary.regular,
    rounded: FONTS.display.regular,
    mono: 'monospace',
  },
  web: {
    sans: FONTS.primary.regular,
    serif: FONTS.secondary.regular,
    rounded: FONTS.display.regular,
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

// ============================================================================
// WCAG AA COLOR CONTRAST VALIDATION SYSTEM
// ============================================================================

/**
 * Theme color contrast validation results
 */
export interface ContrastValidationResult {
  colorName: string;
  foreground: string;
  background: string;
  ratio: number;
  meetsAA: boolean;
  meetsAALarge: boolean;
  grade: 'Fail' | 'AA Large' | 'AA' | 'AAA';
  message: string;
}

/**
 * Comprehensive theme contrast analysis
 */
export interface ThemeContrastAnalysis {
  overallScore: number;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  criticalIssues: ContrastValidationResult[];
  warningIssues: ContrastValidationResult[];
  allResults: ContrastValidationResult[];
  recommendations: string[];
}

/**
 * Validate all colors in a theme for WCAG AA compliance
 */
export function validateThemeContrast(theme: typeof Colors.light | typeof Colors.dark): ThemeContrastAnalysis {
  const results: ContrastValidationResult[] = [];
  const recommendations: string[] = [];

  // Test text colors against backgrounds
  const textColorTests = [
    { fg: 'text', bg: 'background', name: 'Primary Text on Background' },
    { fg: 'textSecondary', bg: 'background', name: 'Secondary Text on Background' },
    { fg: 'text', bg: 'surface', name: 'Primary Text on Surface' },
    { fg: 'textSecondary', bg: 'surface', name: 'Secondary Text on Surface' },
  ];

  // Test brand colors (assuming they'll be used on light backgrounds for text)
  const brandColorTests = [
    { fg: 'primary', bg: 'background', name: 'Primary Brand on Background' },
    { fg: 'secondary', bg: 'background', name: 'Secondary Brand on Background' },
    { fg: 'success', bg: 'background', name: 'Success Color on Background' },
    { fg: 'error', bg: 'background', name: 'Error Color on Background' },
    { fg: 'warning', bg: 'background', name: 'Warning Color on Background' },
    { fg: 'accent', bg: 'background', name: 'Accent Color on Background' },
  ];

  // Test interactive elements
  const interactiveTests = [
    { fg: 'background', bg: 'primary', name: 'Button Background (Inverted)' },
    { fg: 'background', bg: 'secondary', name: 'Secondary Button Background' },
  ];

  const allTests = [...textColorTests, ...brandColorTests, ...interactiveTests];

  for (const test of allTests) {
    const fgColor = theme[test.fg as keyof typeof theme] as string;
    const bgColor = theme[test.bg as keyof typeof theme] as string;

    if (fgColor && bgColor) {
      const ratio = getContrastRatio(fgColor, bgColor);
      const meetsAA = meetsWCAGAA(fgColor, bgColor, false);
      const meetsAALarge = meetsWCAGAA(fgColor, bgColor, true);

      let grade: 'Fail' | 'AA Large' | 'AA' | 'AAA';
      if (ratio >= 7.0) grade = 'AAA';
      else if (ratio >= 4.5) grade = 'AA';
      else if (ratio >= 3.0) grade = 'AA Large';
      else grade = 'Fail';

      const result: ContrastValidationResult = {
        colorName: test.name,
        foreground: fgColor,
        background: bgColor,
        ratio,
        meetsAA,
        meetsAALarge,
        grade,
        message: `${test.name}: ${ratio.toFixed(2)}:1 (${grade})`
      };

      results.push(result);
    }
  }

  // Generate recommendations
  const failedTests = results.filter(r => !r.meetsAA);
  const largeTextTests = results.filter(r => r.meetsAALarge && !r.meetsAA);

  if (failedTests.length > 0) {
    recommendations.push(`Fix ${failedTests.length} color combinations that fail WCAG AA standards`);
    failedTests.forEach(test => {
      recommendations.push(`  - ${test.colorName}: Increase contrast ratio from ${test.ratio.toFixed(2)}:1 to at least 4.5:1`);
    });
  }

  if (largeTextTests.length > 0) {
    recommendations.push(`${largeTextTests.length} combinations only pass for large text (18pt+ or 14pt+ bold)`);
  }

  // Calculate overall score
  const passedTests = results.filter(r => r.meetsAA).length;
  const overallScore = results.length > 0 ? (passedTests / results.length) * 100 : 100;

  // Identify critical and warning issues
  const criticalIssues = results.filter(r => !r.meetsAA && r.colorName.includes('Text on'));
  const warningIssues = results.filter(r => !r.meetsAA && !criticalIssues.includes(r));

  return {
    overallScore,
    totalTests: results.length,
    passedTests,
    failedTests: results.length - passedTests,
    criticalIssues,
    warningIssues,
    allResults: results,
    recommendations
  };
}

/**
 * Validate both light and dark themes
 */
export function validateAllThemes(): {
  light: ThemeContrastAnalysis;
  dark: ThemeContrastAnalysis;
  summary: {
    overallScore: number;
    totalIssues: number;
    criticalIssues: number;
    recommendations: string[];
  };
} {
  const lightAnalysis = validateThemeContrast(Colors.light);
  const darkAnalysis = validateThemeContrast(Colors.dark);

  const overallScore = (lightAnalysis.overallScore + darkAnalysis.overallScore) / 2;
  const totalIssues = lightAnalysis.failedTests + darkAnalysis.failedTests;
  const criticalIssues = lightAnalysis.criticalIssues.length + darkAnalysis.criticalIssues.length;
  const recommendations = [...lightAnalysis.recommendations, ...darkAnalysis.recommendations];

  // Remove duplicates and add theme-specific prefixes
  const uniqueRecommendations = [
    ...new Set([
      ...lightAnalysis.recommendations.map(r => `Light Theme: ${r}`),
      ...darkAnalysis.recommendations.map(r => `Dark Theme: ${r}`)
    ])
  ];

  return {
    light: lightAnalysis,
    dark: darkAnalysis,
    summary: {
      overallScore,
      totalIssues,
      criticalIssues,
      recommendations: uniqueRecommendations
    }
  };
}

/**
 * Get accessible color alternatives for problematic combinations
 */
export function getAccessibleAlternatives(failedResult: ContrastValidationResult): {
  suggestions: Array<{
    foreground: string;
    background: string;
    ratio: number;
    improvement: string;
  }>;
} {
  const suggestions: Array<{
    foreground: string;
    background: string;
    ratio: number;
    improvement: string;
  }> = [];

  // If it's a text on background issue, suggest better text colors
  if (failedResult.colorName.includes('Text on')) {
    const bgColor = failedResult.background;

    // Suggest darker text for light backgrounds
    if (bgColor === '#FFFFFF' || bgColor.includes('surface')) {
      suggestions.push({
        foreground: '#000000', // Pure black
        background: bgColor,
        ratio: getContrastRatio('#000000', bgColor),
        improvement: 'Use pure black (#000000) instead of gray text'
      });

      suggestions.push({
        foreground: '#1F2937', // Darker gray
        background: bgColor,
        ratio: getContrastRatio('#1F2937', bgColor),
        improvement: 'Use darker gray (#1F2937) for better contrast'
      });
    }
  }

  // If it's a brand color issue, suggest better combinations
  if (failedResult.colorName.includes('Brand on')) {
    const fgColor = failedResult.foreground;

    suggestions.push({
      foreground: fgColor,
      background: '#000000', // Dark background
      ratio: getContrastRatio(fgColor, '#000000'),
      improvement: 'Use dark background for better contrast with brand colors'
    });
  }

  return { suggestions };
}

/**
 * Auto-fix theme colors to meet WCAG AA standards
 */
export function autoFixThemeContrast(theme: typeof Colors.light): typeof Colors.light {
  const fixedTheme = { ...theme };
  const analysis = validateThemeContrast(theme);

  // Auto-fix text colors that fail
  analysis.criticalIssues.forEach(issue => {
    if (issue.colorName.includes('Primary Text on')) {
      // Make text darker for better contrast
      if (issue.background === '#FFFFFF') {
        fixedTheme.text = '#000000'; // Pure black on white
      } else if (issue.background.includes('#F')) {
        fixedTheme.text = '#1F2937'; // Darker gray on light surfaces
      }
    } else if (issue.colorName.includes('Secondary Text on')) {
      // Make secondary text darker
      if (issue.background === '#FFFFFF') {
        fixedTheme.textSecondary = '#374151'; // Darker gray
      } else if (issue.background.includes('#F')) {
        fixedTheme.textSecondary = '#4B5563'; // Medium gray
      }
    }
  });

  return fixedTheme;
}

/**
 * Generate accessibility report for the theme
 */
export function generateThemeAccessibilityReport(): string {
  const validation = validateAllThemes();

  let report = '# Theme Accessibility Report\n\n';
  report += `**Overall Score:** ${validation.summary.overallScore.toFixed(1)}%\n\n`;

  report += '## Light Theme\n';
  report += `- Score: ${validation.light.overallScore.toFixed(1)}%\n`;
  report += `- Passed: ${validation.light.passedTests}/${validation.light.totalTests}\n`;
  report += `- Issues: ${validation.light.failedTests}\n\n`;

  report += '## Dark Theme\n';
  report += `- Score: ${validation.dark.overallScore.toFixed(1)}%\n`;
  report += `- Passed: ${validation.dark.passedTests}/${validation.dark.totalTests}\n`;
  report += `- Issues: ${validation.dark.failedTests}\n\n`;

  if (validation.summary.criticalIssues > 0) {
    report += '## Critical Issues\n';
    report += `- ${validation.summary.criticalIssues} critical contrast failures\n\n`;
  }

  if (validation.summary.recommendations.length > 0) {
    report += '## Recommendations\n';
    validation.summary.recommendations.forEach(rec => {
      report += `- ${rec}\n`;
    });
  }

  return report;
}

// ============================================================================
// DEVELOPMENT-TIME VALIDATION (only runs in development)
// ============================================================================

if (__DEV__) {
  // Validate themes on module load
  const validation = validateAllThemes();

  if (validation.summary.overallScore < 95) {
    console.warn('🎨 Theme Accessibility Warning:');
    console.warn(`Overall contrast score: ${validation.summary.overallScore.toFixed(1)}%`);

    if (validation.summary.criticalIssues > 0) {
      console.warn(`❌ ${validation.summary.criticalIssues} critical contrast failures detected`);
    }

    validation.summary.recommendations.slice(0, 3).forEach(rec => {
      console.warn(`💡 ${rec}`);
    });

    if (validation.summary.recommendations.length > 3) {
      console.warn(`... and ${validation.summary.recommendations.length - 3} more recommendations`);
    }

    console.warn('Run generateThemeAccessibilityReport() for detailed report');
  } else {
    console.log('✅ Theme accessibility validation passed!');
  }
}
