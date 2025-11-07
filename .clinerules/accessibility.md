# ♿ Accessibility Rules

## 🎯 Accessibility Standards

### WCAG AA Compliance Requirements
- **Color Contrast**: 4.5:1 minimum for normal text, 3:1 for large text
- **Touch Targets**: 44px minimum touch target size
- **Screen Reader**: Full screen reader support
- **Keyboard Navigation**: Full keyboard accessibility
- **Focus Indicators**: Clear focus indicators

## 🎨 Color Contrast Validation

### Automatic Contrast Checking
```typescript
// ✅ WCAG AA color contrast validation
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

export const meetsWCAGAA = (foreground: string, background: string): boolean => {
  const contrast = getContrastRatio(foreground, background);
  return contrast >= 4.5;
};
```

### Theme Contrast Validation
```typescript
// ✅ Automatic theme validation
export function validateThemeContrast(theme: typeof Colors.light): {
  overallScore: number;
  criticalIssues: Array<{colorName: string, ratio: number}>;
  recommendations: string[];
} {
  const results = [];
  const textColorTests = [
    { fg: 'text', bg: 'background', name: 'Primary Text' },
    { fg: 'textSecondary', bg: 'background', name: 'Secondary Text' },
  ];

  // Validate all color combinations
  textColorTests.forEach(test => {
    const fgColor = theme[test.fg as keyof typeof theme] as string;
    const bgColor = theme[test.bg as keyof typeof theme] as string;
    const ratio = getContrastRatio(fgColor, bgColor);
    results.push({ name: test.name, ratio, meetsAA: ratio >= 4.5 });
  });

  const passedTests = results.filter(r => r.meetsAA).length;
  const overallScore = results.length > 0 ? (passedTests / results.length) * 100 : 100;
  const criticalIssues = results.filter(r => !r.meetsAA);

  return {
    overallScore,
    criticalIssues,
    recommendations: criticalIssues.map(issue =>
      `Fix ${issue.name} contrast ratio: ${issue.ratio.toFixed(2)}:1 (needs 4.5:1)`
    )
  };
}
```

## 📱 Screen Reader Support

### Component Accessibility Props
```typescript
// ✅ Essential accessibility props
<Button
  accessible={true}
  accessibilityLabel="Submit form"
  accessibilityHint="Double tap to submit your information"
  accessibilityRole="button"
  accessibilityState={{ disabled: isLoading }}
/>

// ✅ Image accessibility
<Image
  source={icon}
  accessible={true}
  accessibilityLabel="User profile picture"
  accessibilityIgnoresInvertColors={true}
/>

// ✅ Form field accessibility
<TextInput
  accessible={true}
  accessibilityLabel="Email address"
  accessibilityHint="Enter your email address"
  autoComplete="email"
  textContentType="emailAddress"
  keyboardType="email-address"
/>
```

### Dynamic Content Accessibility
```typescript
// ✅ Announce dynamic content changes
import { AccessibilityInfo } from 'react-native';

const announceUpdate = (message: string) => {
  AccessibilityInfo.announceForAccessibility(message);
};

// Usage
const [count, setCount] = useState(0);
useEffect(() => {
  announceUpdate(`Count updated to ${count}`);
}, [count]);
```

## 🎯 Touch Target Requirements

### Minimum Touch Target Sizes
```typescript
// ✅ 44px minimum touch targets
const styles = StyleSheet.create({
  touchable: {
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: 12,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // For smaller elements, add padding
  smallButton: {
    height: 32,
    width: 32,
    borderRadius: 16,
    // Add invisible touch area
    ...Platform.select({
      ios: {
        // iOS handles this automatically
      },
      android: {
        // Android needs padding for touch targets
      },
    }),
  },
});
```

### Touch Target Testing
```typescript
// ✅ Automated touch target validation
const validateTouchTargets = (component: ReactElement) => {
  const issues = [];

  // Find all touchable elements
  const touchables = findTouchableElements(component);

  touchables.forEach(touchable => {
    const { width, height } = getElementDimensions(touchable);

    if (width < 44 || height < 44) {
      issues.push({
        element: touchable,
        width,
        height,
        message: `Touch target too small: ${width}x${height}px (minimum 44x44px)`
      });
    }
  });

  return issues;
};
```

## ⌨️ Keyboard Navigation

### Focus Management
```typescript
// ✅ Keyboard navigation support
import { useFocusEffect } from '@react-navigation/native';

const Screen = () => {
  const inputRef = useRef<TextInput>(null);

  useFocusEffect(
    useCallback(() => {
      // Auto-focus first input
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }, [])
  );

  return (
    <View>
      <TextInput
        ref={inputRef}
        accessible={true}
        accessibilityLabel="First name"
      />
    </View>
  );
};
```

### Focus Indicators
```typescript
// ✅ Custom focus indicators
const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 4,
    padding: 12,
  },

  inputFocused: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
});

// Usage with state
const [isFocused, setIsFocused] = useState(false);
<TextInput
  style={[styles.input, isFocused && styles.inputFocused]}
  onFocus={() => setIsFocused(true)}
  onBlur={() => setIsFocused(false)}
/>
```

## 🔊 Audio & Haptic Feedback

### Haptic Feedback
```typescript
// ✅ Contextual haptic feedback
import * as Haptics from 'expo-haptics';

const handleSuccess = async () => {
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  // Show success message
};

const handleError = async () => {
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  // Show error message
};

const handleButtonPress = async () => {
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  // Handle button action
};
```

## 📊 Content Scaling

### Dynamic Type Support
```typescript
// ✅ iOS Dynamic Type support
<Text
  style={[
    theme.typography.body,
    {
      adjustsFontSizeToFit: true,
      minimumFontScale: 0.8,
    }
  ]}
  numberOfLines={1}
  maxFontSizeMultiplier={2.0} // Support up to 200% scaling
>
  {content}
</Text>
```

### Responsive Layouts
```typescript
// ✅ Scalable layouts
import { useWindowDimensions } from 'react-native';

const { width, height, scale, fontScale } = useWindowDimensions();

// Responsive spacing based on screen size
const responsiveSpacing = (baseSize: number) => {
  const scaleFactor = Math.min(width / 375, height / 667); // Based on iPhone 6/7/8
  return Math.round(baseSize * scaleFactor);
};

// Responsive font sizes
const responsiveFontSize = (baseSize: number) => {
  return Math.round(baseSize * fontScale);
};
```

## 🧪 Accessibility Testing

### Automated Testing
```typescript
// ✅ Accessibility test utilities
import { render } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';

describe('Accessibility Tests', () => {
  it('has proper accessibility labels', () => {
    const { getByA11yLabel } = render(<Button title="Submit" />);

    expect(getByA11yLabel('Submit form')).toBeTruthy();
  });

  it('meets touch target requirements', () => {
    const { getByTestId } = render(<Button title="Submit" testID="button" />);
    const button = getByTestId('button');

    // Check dimensions
    const { width, height } = button.props.style || {};
    expect(width).toBeGreaterThanOrEqual(44);
    expect(height).toBeGreaterThanOrEqual(44);
  });

  it('has proper color contrast', () => {
    const validation = validateThemeContrast(theme);
    expect(validation.overallScore).toBeGreaterThanOrEqual(95);
  });
});
```

### Manual Testing Checklist
```typescript
// ✅ Accessibility checklist
const accessibilityChecklist = {
  // Visual
  colorContrast: false,
  touchTargets: false,
  focusIndicators: false,

  // Screen Reader
  labels: false,
  hints: false,
  roles: false,

  // Navigation
  keyboardSupport: false,
  logicalOrder: false,

  // Content
  dynamicType: false,
  scalableLayouts: false,

  // Feedback
  hapticFeedback: false,
  audioCues: false,
};

// Validation function
const validateAccessibility = (component: ReactElement): {
  score: number;
  issues: string[];
} => {
  const issues = [];

  // Run automated checks
  const contrastValidation = validateThemeContrast(theme);
  if (contrastValidation.overallScore < 95) {
    issues.push('Color contrast issues detected');
  }

  // Check for accessibility props
  const touchables = findTouchableElements(component);
  touchables.forEach(touchable => {
    if (!touchable.props.accessible) {
      issues.push('Touchable element missing accessible prop');
    }
    if (!touchable.props.accessibilityLabel) {
      issues.push('Touchable element missing accessibilityLabel');
    }
  });

  const score = ((accessibilityChecklist.length - issues.length) / accessibilityChecklist.length) * 100;

  return { score, issues };
};
```

This comprehensive accessibility framework ensures your app is usable by everyone, including users with disabilities.
