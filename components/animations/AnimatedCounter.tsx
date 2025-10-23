import { useTheme } from '@/utils/themeContext';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  fontSize?: number;
  color?: string;
  fontWeight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
  prefix?: string;
  suffix?: string;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  duration = 1000,
  fontSize = 36,
  color,
  fontWeight = 'bold',
  prefix = '',
  suffix = ''
}) => {
  const { themeColors, animationSettings } = useTheme();
  const [displayValue, setDisplayValue] = useState(0);

  const skipAnimation =
    !animationSettings.enabled || animationSettings.prefersReducedMotion;

  useEffect(() => {
    if (skipAnimation) {
      setDisplayValue(value);
      return;
    }

    // Simple easing animation using setTimeout
    const startValue = displayValue;
    const difference = value - startValue;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-out)
      const easedProgress = 1 - Math.pow(1 - progress, 3);

      const currentValue = Math.round(startValue + (difference * easedProgress));
      setDisplayValue(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration, skipAnimation]);

  return (
    <Text
      style={[
        styles.counter,
        {
          fontSize,
          color: color || themeColors.primary,
          fontWeight,
        }
      ]}
    >
      {prefix}{Math.round(displayValue)}{suffix}
    </Text>
  );
};

const styles = StyleSheet.create({
  counter: {
    textAlign: 'center',
  },
});

export default AnimatedCounter;
