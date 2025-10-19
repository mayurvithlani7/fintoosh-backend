import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Text } from 'react-native';
import { useTheme } from '@/utils/themeContext';

interface AnimatedProgressBarProps {
  progress: number; // 0 to 1
  duration?: number;
  height?: number;
  color?: string;
  backgroundColor?: string;
  showPercentage?: boolean;
  onComplete?: () => void;
}

export const AnimatedProgressBar: React.FC<AnimatedProgressBarProps> = ({
  progress,
  duration = 1000,
  height = 8,
  color,
  backgroundColor,
  showPercentage = false,
  onComplete
}) => {
  const { themeColors, animationSettings } = useTheme();
  const animatedValue = useRef(new Animated.Value(0)).current;

  const skipAnimation =
    !animationSettings.enabled || animationSettings.prefersReducedMotion;

  useEffect(() => {
    if (skipAnimation) {
      animatedValue.setValue(progress);
      onComplete?.();
      return;
    }
    Animated.timing(animatedValue, {
      toValue: progress,
      duration: duration,
      useNativeDriver: false,
    }).start(() => {
      onComplete?.();
    });
  }, [progress, duration, onComplete, skipAnimation]);

  const barWidth = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[
      styles.container,
      {
        height: height,
        backgroundColor: backgroundColor || themeColors.border,
        borderRadius: height / 2,
      }
    ]}>
      {skipAnimation ? (
        <View
          style={[
            styles.fill,
            {
              width: `${progress * 100}%`,
              backgroundColor: color || themeColors.primary,
              borderRadius: height / 2,
              opacity: 1
            }
          ]}
        />
      ) : (
        <Animated.View
          style={[
            styles.fill,
            {
              width: barWidth,
              backgroundColor: color || themeColors.primary,
              borderRadius: height / 2,
            }
          ]}
        />
      )}
      {showPercentage && (
        skipAnimation ? (
          <Text
            style={[
              styles.percentage,
              {
                color: themeColors.text,
                opacity: 1,
              }
            ]}
          >
            {`${Math.round(progress * 100)}%`}
          </Text>
        ) : (
          <Animated.Text
            style={[
              styles.percentage,
              {
                color: themeColors.text,
                opacity: animatedValue,
              }
            ]}
          >
            {animatedValue.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%'],
            })}
          </Animated.Text>
        )
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
  },
  fill: {
    height: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  percentage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default AnimatedProgressBar;
