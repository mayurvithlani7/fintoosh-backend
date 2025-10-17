import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet } from "react-native";

interface SkeletonCardProps {
  width?: number | string;
  height?: number;
  style?: any;
  borderRadius?: number;
  lines?: number;
  lineHeight?: number;
  lineSpacing?: number;
}

const SkeletonCard: React.FC<SkeletonCardProps> = ({
  width = "100%",
  height = 100,
  style,
  borderRadius = 14,
  lines = 1,
  lineHeight = 18,
  lineSpacing = 14,
}) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  return (
    <View
      style={[
        styles.skeletonCard,
        { width, height, borderRadius },
        style,
      ]}
    >
      {[...Array(lines)].map((_, i) => (
        <View
          key={i}
          style={[
            styles.line,
            {
              width: '90%',
              height: lineHeight,
              marginBottom: i === lines - 1 ? 0 : lineSpacing,
              borderRadius: lineHeight / 2,
            }
          ]}
        >
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              {
                opacity: 0.6,
                backgroundColor: "#f1ebf6",
                zIndex: 2,
                transform: [
                  {
                    translateX: shimmerAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-40, 300],
                    }),
                  },
                ],
              },
            ]}
          />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  skeletonCard: {
    backgroundColor: "#ede7fa",
    overflow: "hidden",
    marginVertical: 10,
    padding: 16,
    justifyContent: "center",
  },
  line: {
    backgroundColor: "#e5def3",
    width: "100%",
    marginBottom: 0,
    position: "relative",
    overflow: "hidden",
  },
});

export default SkeletonCard;
