import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Text } from 'react-native';
import { useTheme } from '@/utils/themeContext';

interface SuccessAnimationProps {
  size?: number;
  duration?: number;
  onComplete?: () => void;
}

export const SuccessAnimation: React.FC<SuccessAnimationProps> = ({
  size = 80,
  duration = 800,
  onComplete
}) => {
  const { themeColors, animationSettings } = useTheme();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const skipAnimation =
    !animationSettings.enabled || animationSettings.prefersReducedMotion;

  useEffect(() => {
    if (skipAnimation) {
      onComplete?.();
      return;
    }
    // Success animation sequence
    Animated.sequence([
      // Scale in with rotation
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1.2,
          friction: 3,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: duration * 0.6,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: duration * 0.4,
          useNativeDriver: true,
        })
      ]),
      // Bounce effect
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 0.9,
          friction: 3,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1.1,
          friction: 3,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 3,
          tension: 100,
          useNativeDriver: true,
        })
      ])
    ]).start(() => {
      onComplete?.();
    });
  }, [size, duration, onComplete, skipAnimation]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (skipAnimation) {
    return (
      <View style={styles.container}>
        <View
          style={[
            styles.checkmarkCircle,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: themeColors.success,
              shadowColor: themeColors.success,
            }
          ]}
        >
          <Text style={[styles.checkmark, { fontSize: size * 0.6, color: '#fff' }]}>
            ✓
          </Text>
        </View>
      </View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            { scale: scaleAnim },
            { rotate: rotation }
          ],
          opacity: opacityAnim,
        }
      ]}
    >
      <View
        style={[
          styles.checkmarkCircle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: themeColors.success,
            shadowColor: themeColors.success,
          }
        ]}
      >
        <Text style={[styles.checkmark, { fontSize: size * 0.6, color: '#fff' }]}>
          ✓
        </Text>
      </View>
    </Animated.View>
  );
};

// Pulsing success effect for backgrounds
export const PulsingSuccess: React.FC<{ children: React.ReactNode; duration?: number }> = ({
  children,
  duration = 600
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.05,
        duration: duration * 0.3,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: duration * 0.7,
        useNativeDriver: true,
      })
    ]).start();
  }, [duration]);

  return (
    <Animated.View
      style={{
        transform: [{ scale: pulseAnim }],
      }}
    >
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  checkmark: {
    fontWeight: 'bold',
    textAlign: 'center',
    textAlignVertical: 'center',
  },
});

export default SuccessAnimation;
