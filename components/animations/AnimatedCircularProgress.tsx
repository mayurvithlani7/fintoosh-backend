import { useTheme } from '@/utils/themeContext';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface AnimatedCircularProgressProps {
  size: number;
  width: number;
  fill: number; // 0 to 100
  tintColor?: string;
  backgroundColor?: string;
  duration?: number;
  rotation?: number;
  onComplete?: () => void;
}

export const AnimatedCircularProgress: React.FC<AnimatedCircularProgressProps> = ({
  size,
  width,
  fill,
  tintColor,
  backgroundColor,
  duration = 1000,
  rotation = 0,
  onComplete
}) => {
  const { themeColors, animationSettings } = useTheme();
  const animatedValue = useRef(new Animated.Value(0)).current;

  const skipAnimation =
    !animationSettings.enabled || animationSettings.prefersReducedMotion;

  useEffect(() => {
    if (skipAnimation) {
      animatedValue.setValue(fill / 100);
      onComplete?.();
      return;
    }
    Animated.timing(animatedValue, {
      toValue: fill / 100,
      duration: duration,
      useNativeDriver: false,
    }).start(() => {
      onComplete?.();
    });
  }, [fill, duration, onComplete, skipAnimation]);

  const radius = (size - width) / 2;
  const circumference = radius * 2 * Math.PI;

  const strokeDasharray = circumference;
  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: `${rotation}deg` }] }}>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={backgroundColor || themeColors.border}
          strokeWidth={width}
          fill="transparent"
        />
        {/* Progress circle */}
        {skipAnimation ? (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={tintColor || themeColors.primary}
            strokeWidth={width}
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={circumference - (fill / 100) * circumference}
            strokeLinecap="round"
          />
        ) : (
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={tintColor || themeColors.primary}
            strokeWidth={width}
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        )}
      </Svg>
    </View>
  );
};

// Animated version of Circle for smooth animations
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AnimatedCircularProgress;
