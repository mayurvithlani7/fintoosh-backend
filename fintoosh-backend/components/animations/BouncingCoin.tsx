import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Text } from 'react-native';
import { useTheme } from '@/utils/themeContext';

interface BouncingCoinProps {
  amount?: number;
  duration?: number;
  size?: number;
  onComplete?: () => void;
}

export const BouncingCoin: React.FC<BouncingCoinProps> = ({
  amount = 10,
  duration = 1500,
  size = 40,
  onComplete
}) => {
  const { themeColors, animationSettings } = useTheme();
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const skipAnimation =
    !animationSettings.enabled || animationSettings.prefersReducedMotion;

  useEffect(() => {
    if (skipAnimation) {
      onComplete?.();
      return;
    }
    // Bounce animation sequence
    Animated.sequence([
      // First bounce up
      Animated.parallel([
        Animated.timing(bounceAnim, {
          toValue: -60,
          duration: duration * 0.2,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: duration * 0.2,
          useNativeDriver: true,
        })
      ]),
      // Bounce down
      Animated.parallel([
        Animated.timing(bounceAnim, {
          toValue: -30,
          duration: duration * 0.15,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: duration * 0.15,
          useNativeDriver: true,
        })
      ]),
      // Second bounce up
      Animated.parallel([
        Animated.timing(bounceAnim, {
          toValue: -45,
          duration: duration * 0.15,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: duration * 0.15,
          useNativeDriver: true,
        })
      ]),
      // Final bounce down and fade out
      Animated.parallel([
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: duration * 0.3,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: duration * 0.3,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: duration * 0.2,
          delay: duration * 0.1,
          useNativeDriver: true,
        })
      ])
    ]).start(() => {
      onComplete?.();
    });
  }, [amount, duration, size, onComplete, skipAnimation]);

  if (skipAnimation) {
    return (
      <View style={[styles.container, { opacity: 1 }]}>
        <View
          style={[
            styles.coin,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: themeColors.accent,
              shadowColor: themeColors.accent,
            }
          ]}
        >
          <Text style={[styles.coinText, { fontSize: size * 0.4, color: themeColors.card }]}>
            💰
          </Text>
        </View>
        <Text style={[styles.amountText, { color: themeColors.text, fontSize: size * 0.3 }]}>
          +{amount}
        </Text>
      </View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            { translateY: bounceAnim },
            { scale: scaleAnim }
          ],
          opacity: opacityAnim,
        }
      ]}
    >
      <View
        style={[
          styles.coin,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: themeColors.accent,
            shadowColor: themeColors.accent,
          }
        ]}
      >
        <Text style={[styles.coinText, { fontSize: size * 0.4, color: themeColors.card }]}>
          💰
        </Text>
      </View>
      <Text style={[styles.amountText, { color: themeColors.text, fontSize: size * 0.3 }]}>
        +{amount}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  coin: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    marginBottom: 4,
  },
  coinText: {
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  amountText: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default BouncingCoin;
