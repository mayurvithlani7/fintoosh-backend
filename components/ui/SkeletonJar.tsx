import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet } from "react-native";

interface SkeletonJarProps {
  size?: number;
  style?: any;
}

const SkeletonJar: React.FC<SkeletonJarProps> = ({ size = 65, style }) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  return (
    <View
      style={[
        styles.jarWrapper,
        {
          width: size + 8,
          height: size + 22,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.jarBody,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: "#dfdbf3",
            opacity: 0.85,
            transform: [
              {
                translateX: shimmerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-30, 40],
                }),
              },
            ],
          },
        ]}
      />
      <View style={styles.jarLabelPlaceholder} />
    </View>
  );
};

const styles = StyleSheet.create({
  jarWrapper: {
    alignItems: "center",
    margin: 5,
  },
  jarBody: {
    backgroundColor: "#e9e2f7",
    shadowColor: "#aaa",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.09,
    shadowRadius: 4,
    elevation: 2,
  },
  jarLabelPlaceholder: {
    width: 42,
    height: 12,
    backgroundColor: "#ece8f4",
    borderRadius: 6,
    marginTop: 6,
  },
});

export default SkeletonJar;
