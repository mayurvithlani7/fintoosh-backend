# 🎨 Theme & Styling Rules

## 🎯 Design System Foundation

### Theme Structure
```typescript
// ✅ Complete theme structure
export const Colors = {
  light: {
    // Brand Colors - Core Identity
    primary: '#1D4ED8',
    secondary: '#8A2BE2',
    success: '#047857',
    accent: '#B45309',
    error: '#DC3545',
    warning: '#D97706',
    info: '#17A2B8',

    // UI Colors - Supporting Palette
    text: '#2C2C2C',
    textSecondary: '#666666',
    background: '#FFFFFF',
    surface: '#F8F9FA',
    border: '#E0E0E0',
  },
  dark: {
    // Dark mode variations
    primary: '#60A5FA',
    secondary: '#C084FC',
    // ... rest of dark theme
  },
};

// Typography Scale
export const FONTS = {
  primary: { regular: 'Inter-Regular', medium: 'Inter-Medium', bold: 'Inter-Bold' },
  secondary: { regular: 'SF-Pro-Display-Regular', bold: 'SF-Pro-Display-Bold' },
  // ... font definitions
};
```

### Color Contrast Validation
```typescript
// ✅ WCAG AA Compliance (4.5:1 minimum)
export const getContrastRatio = (color1: string, color2: string): number => {
  // Implementation for automatic contrast checking
};

export const meetsWCAGAA = (foreground: string, background: string): boolean => {
  const contrast = getContrastRatio(foreground, background);
  return contrast >= 4.5;
};
```

## 🚫 HARDCODED COLORS PROHIBITED

### ❌ NEVER Use Hardcoded Colors
```typescript
// ❌ WRONG - Hardcoded colors
<View style={{ backgroundColor: '#FF0000' }}>
<Text style={{ color: '#007AFF' }}>

// ✅ CORRECT - Theme-based colors
<View style={{ backgroundColor: theme.colors.error }}>
<Text style={{ color: theme.colors.primary }}>
```

### ✅ Theme Usage Patterns
```typescript
// ✅ Always use theme colors
import { useTheme } from '@/hooks/useTheme';

const Component = () => {
  const theme = useTheme();

  return (
    <View style={{ backgroundColor: theme.colors.surface }}>
      <Text style={{ color: theme.colors.text }}>
        Content
      </Text>
    </View>
  );
};
```

## 📝 Typography System

### Semantic Typography Scale
```typescript
// ✅ Semantic tokens for consistency
export const SEMANTIC_TYPOGRAPHY = {
  'type-display-large': {
    semanticTokenName: 'type-display-large',
    intendedUse: 'Main app screen titles',
    fontSize: 32,
    lineHeight: 40,
    fontFamily: FONTS.display.bold
  },
  'type-heading-large': {
    semanticTokenName: 'type-heading-large',
    intendedUse: 'Section headings',
    fontSize: 24,
    lineHeight: 32,
    fontFamily: FONTS.primary.semiBold
  },
  // ... more semantic tokens
};
```

### Typography Usage
```typescript
// ✅ Use semantic typography
<Text style={theme.typography['type-heading-large']}>
  Section Title
</Text>

// ✅ Compose typography with colors
<Text style={[
  theme.typography['type-body'],
  { color: theme.colors.textSecondary }
]}>
  Secondary text
</Text>
```

## 🎨 Component Styling Patterns

### StyleSheet Organization
```typescript
// ✅ Group related styles logically
const styles = StyleSheet.create({
  // Layout styles
  container: {
    flex: 1,
    padding: theme.spacing.medium,
  },

  // Component styles
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.medium,
    ...theme.shadows.small,
  },

  // Text styles
  title: {
    ...theme.typography['type-heading-medium'],
    color: theme.colors.text,
  },

  subtitle: {
    ...theme.typography['type-body-small'],
    color: theme.colors.textSecondary,
  },
});
```

### Spacing System
```typescript
// ✅ Consistent spacing scale
export const SPACING = {
  tiny: 4,
  small: 8,
  medium: 16,
  large: 24,
  xlarge: 32,
  xxlarge: 48,
};

// Usage
padding: theme.spacing.medium,
marginVertical: theme.spacing.small,
```

### Border Radius System
```typescript
// ✅ Consistent border radius
export const BORDER_RADIUS = {
  small: 4,
  medium: 8,
  large: 12,
  xlarge: 16,
  round: 9999, // Fully rounded
};

// Usage
borderRadius: theme.borderRadius.medium,
```

### Shadow System
```typescript
// ✅ Platform-specific shadows
export const SHADOWS = {
  small: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    android: {
      elevation: 2,
    },
  }),
  medium: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
    },
    android: {
      elevation: 4,
    },
  }),
};
```

## 🎭 Dark Mode Support

### Theme Provider Setup
```typescript
// ✅ Theme context with dark mode
import { ThemeProvider } from '@/contexts/ThemeContext';

const App = () => (
  <ThemeProvider>
    <AppContent />
  </ThemeProvider>
);

// Hook usage
const useTheme = () => {
  const { theme, isDark, toggleTheme } = useContext(ThemeContext);
  return theme;
};
```

### Dark Mode Color Mapping
```typescript
// ✅ Light/dark mode color mapping
export const Colors = {
  light: {
    primary: '#1D4ED8',
    text: '#2C2C2C',
    background: '#FFFFFF',
    // ... light colors
  },
  dark: {
    primary: '#60A5FA', // Lighter for dark backgrounds
    text: '#FFFFFF',
    background: '#1A1A1A',
    // ... dark colors
  },
};
```

## 🔧 Styling Best Practices

### Platform-Specific Styling
```typescript
// ✅ Platform-aware styling
const styles = StyleSheet.create({
  container: {
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
      },
      android: {
        elevation: 4,
      },
    }),
  },
});
```

### Responsive Design
```typescript
// ✅ Responsive scaling
import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// Responsive font sizes
const responsiveFontSize = (baseSize: number) => {
  const scale = width / 375; // Based on iPhone 6/7/8 width
  return Math.round(baseSize * scale);
};
```

### Dynamic Type Support
```typescript
// ✅ iOS Dynamic Type support
<Text
  style={[
    theme.typography['type-body'],
    {
      adjustsFontSizeToFit: true,
      minimumFontScale: 0.8,
    }
  ]}
  numberOfLines={1}
>
  Responsive text
</Text>
```

## 🧪 Theme Testing & Validation

### Contrast Validation
```typescript
// ✅ Automatic contrast checking
if (__DEV__) {
  const validation = validateThemeContrast(theme);
  if (validation.overallScore < 95) {
    console.warn('Theme accessibility warning:', validation.recommendations);
  }
}
```

### Theme Consistency Tests
```typescript
// ✅ Theme consistency validation
describe('Theme Validation', () => {
  it('has consistent color palette', () => {
    expect(theme.colors.primary).toBeDefined();
    expect(theme.colors.text).toBeDefined();
    // ... comprehensive theme validation
  });

  it('meets WCAG AA contrast requirements', () => {
    const results = validateAllThemes();
    expect(results.summary.overallScore).toBeGreaterThanOrEqual(95);
  });
});
```

## 📚 Theme Documentation

### Theme Token Reference
```typescript
// ✅ Documented theme interface
export interface Theme {
  colors: {
    // Brand colors
    primary: string;
    secondary: string;
    success: string;
    error: string;
    warning: string;
    accent: string;

    // UI colors
    text: string;
    textSecondary: string;
    background: string;
    surface: string;
    border: string;
  };

  typography: {
    [key: string]: {
      fontSize: number;
      lineHeight: number;
      fontFamily: string;
    };
  };

  spacing: {
    tiny: number;
    small: number;
    medium: number;
    large: number;
    xlarge: number;
  };

  borderRadius: {
    small: number;
    medium: number;
    large: number;
    xlarge: number;
  };

  shadows: {
    small: object;
    medium: object;
    large: object;
  };
}
```

This comprehensive theme system ensures consistent, accessible, and maintainable styling across your entire application.
