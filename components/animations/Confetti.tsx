import React, { useEffect, useState } from 'react';
import { View, Animated, Dimensions, StyleSheet, Text } from 'react-native';
import { useTheme } from '@/utils/themeContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ConfettiPiece {
  id: number;
  left: Animated.Value;
  top: Animated.Value;
  rotation: Animated.Value;
  scale: Animated.Value;
  color: string;
}

interface ConfettiProps {
  duration?: number;
  onComplete?: () => void;
}

const COLORS = ['#FFD700', '#FF6B6B', '#4FC1E9', '#A78BFA', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export const Confetti: React.FC<ConfettiProps> = ({
  duration = 3000,
  onComplete
}) => {
  const { themeColors, animationSettings } = useTheme();
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  // Accessibility: skip animation if reduced-motion or global off
  const skipAnimation =
    !animationSettings.enabled || animationSettings.prefersReducedMotion;

  useEffect(() => {
    if (skipAnimation) {
      onComplete?.();
      return;
    }
    // Create confetti pieces
    const newPieces: ConfettiPiece[] = [];
    const pieceCount = 50;

    for (let i = 0; i < pieceCount; i++) {
      newPieces.push({
        id: i,
        left: new Animated.Value(Math.random() * screenWidth),
        top: new Animated.Value(-20),
        rotation: new Animated.Value(0),
        scale: new Animated.Value(1),
        color: COLORS[Math.floor(Math.random() * COLORS.length)]
      });
    }

    setPieces(newPieces);

    // Animate each piece
    const animations = newPieces.map((piece, index) => {
      const delay = Math.random() * 500;

      return Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(piece.top, {
            toValue: screenHeight + 100,
            duration: duration - delay,
            useNativeDriver: true,
          }),
          Animated.timing(piece.left, {
            toValue: Math.random() * screenWidth + (Math.random() - 0.5) * 200,
            duration: duration - delay,
            useNativeDriver: true,
          }),
          Animated.timing(piece.rotation, {
            toValue: Math.random() * 10,
            duration: duration - delay,
            useNativeDriver: true,
          }),
          Animated.timing(piece.scale, {
            toValue: 0,
            duration: duration - delay,
            useNativeDriver: true,
          })
        ])
      ]);
    });

    Animated.parallel(animations).start(() => {
      onComplete?.();
    });

    // Cleanup
    return () => {
      newPieces.forEach(piece => {
        piece.left.stopAnimation();
        piece.top.stopAnimation();
        piece.rotation.stopAnimation();
        piece.scale.stopAnimation();
      });
    };
  }, [duration, onComplete, skipAnimation]);

  if (skipAnimation) {
    // Use static visual, haptic, or sound feedback instead if enabled
    return (
      <View style={StyleSheet.absoluteFill} pointerEvents="none" accessible accessibilityLabel="Confetti celebration">
        <Text
          style={{
            fontSize: 38,
            color: themeColors.accent,
            textAlign: "center",
            marginTop: 60
          }}
        >
          🎉🎉🎉
        </Text>
      </View>
    );
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {pieces.map((piece) => (
        <Animated.View
          key={piece.id}
          style={{
            position: 'absolute',
            width: 8,
            height: 8,
            backgroundColor: piece.color,
            borderRadius: 4,
            transform: [
              { translateX: piece.left },
              { translateY: piece.top },
              { rotate: piece.rotation.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '360deg']
              }) },
              { scale: piece.scale }
            ],
            shadowColor: piece.color,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 5,
          }}
        />
      ))}
    </View>
  );
};

export default Confetti;
