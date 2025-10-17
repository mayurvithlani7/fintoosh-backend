import React from 'react';
import { Animated, StyleSheet, View } from 'react-native';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style
}) => {
  const animatedValue = new Animated.Value(0);

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style
      ]}
    />
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#E0E0E0',
  },
});

// Pre-built skeleton components for common use cases
export const SkeletonCard: React.FC = () => (
  <View style={skeletonStyles.card}>
    <View style={skeletonStyles.cardHeader}>
      <SkeletonLoader width={120} height={20} />
      <SkeletonLoader width={80} height={16} />
    </View>
    <View style={skeletonStyles.cardContent}>
      <SkeletonLoader width="100%" height={16} style={{ marginBottom: 8 }} />
      <SkeletonLoader width="80%" height={16} style={{ marginBottom: 8 }} />
      <SkeletonLoader width="60%" height={16} />
    </View>
    <View style={skeletonStyles.cardFooter}>
      <SkeletonLoader width={100} height={32} borderRadius={16} />
    </View>
  </View>
);

export const SkeletonList: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <View style={skeletonStyles.list}>
    {Array.from({ length: count }, (_, index) => (
      <View key={index} style={skeletonStyles.listItem}>
        <SkeletonLoader width={50} height={50} borderRadius={25} style={{ marginRight: 12 }} />
        <View style={skeletonStyles.listItemContent}>
          <SkeletonLoader width={150} height={18} style={{ marginBottom: 6 }} />
          <SkeletonLoader width={100} height={14} />
        </View>
      </View>
    ))}
  </View>
);

export const SkeletonText: React.FC<{ lines?: number; width?: number[] }> = ({
  lines = 3,
  width = [100, 80, 60]
}) => (
  <View>
    {Array.from({ length: lines }, (_, index) => (
      <SkeletonLoader
        key={index}
        width={`${width[index % width.length]}%`}
        height={16}
        style={{ marginBottom: index < lines - 1 ? 8 : 0 }}
      />
    ))}
  </View>
);

const skeletonStyles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardContent: {
    marginBottom: 16,
  },
  cardFooter: {
    alignItems: 'flex-end',
  },
  list: {
    paddingVertical: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  listItemContent: {
    flex: 1,
  },
});

export default SkeletonLoader;
