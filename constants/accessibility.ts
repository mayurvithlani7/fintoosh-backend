// Accessibility constants for WCAG AA compliance
export const ACCESSIBILITY = {
  // Minimum touch target size (44dp x 44dp) for accessibility
  MIN_TOUCH_TARGET: 44,

  // Minimum readable font size
  MIN_FONT_SIZE: 14,

  // Maximum line height ratio for readability
  MAX_LINE_HEIGHT_RATIO: 1.5,

  // Minimum contrast ratios (WCAG AA)
  MIN_CONTRAST_RATIO_NORMAL: 4.5,  // Normal text
  MIN_CONTRAST_RATIO_LARGE: 3.0,   // Large text (18pt+ or 14pt+ bold)

  // Focus indicator requirements
  FOCUS_INDICATOR_WIDTH: 2,
  FOCUS_INDICATOR_COLOR: '#007AFF', // iOS blue

  // Screen reader delays
  SCREEN_READER_DELAY: 100, // ms

  // Motion preferences
  REDUCED_MOTION_DURATION_MULTIPLIER: 0.5,
} as const;

// Helper functions for accessibility
export const getAccessibleFontSize = (size: number): number => {
  return Math.max(size, ACCESSIBILITY.MIN_FONT_SIZE);
};

export const getAccessibleTouchTargetSize = (currentSize: number): number => {
  return Math.max(currentSize, ACCESSIBILITY.MIN_TOUCH_TARGET);
};

export const isTouchTargetAccessible = (width: number, height: number): boolean => {
  return width >= ACCESSIBILITY.MIN_TOUCH_TARGET && height >= ACCESSIBILITY.MIN_TOUCH_TARGET;
};
