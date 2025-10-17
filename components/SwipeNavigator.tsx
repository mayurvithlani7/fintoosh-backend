import React, { useRef } from 'react';
import { View, PanResponder, PanResponderGestureState, StyleSheet } from 'react-native';
import { useRouter, useSegments } from 'expo-router';

const SWIPE_THRESHOLD = 40;

type TabSwipeProps = {
  tabRoutes: string[]; // Absolute segment keys for tabs in order
  children: React.ReactNode;
};

// Usage: <SwipeNavigator tabRoutes={[... tab segment names ...]}> ...screen... </SwipeNavigator>
export default function SwipeNavigator({ tabRoutes, children }: TabSwipeProps) {
  const router = useRouter();
  const segments = useSegments();
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState: PanResponderGestureState) => {
        // Only set responder if horizontal swipe initiated
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 10;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (Math.abs(gestureState.dx) < SWIPE_THRESHOLD) return;
        // Find current index
        const curr = segments[segments.length - 1];
        const currentIndex = tabRoutes.indexOf(curr as string);
        if (currentIndex === -1) return;
        let tabTo;
        if (gestureState.dx > SWIPE_THRESHOLD && currentIndex > 0) {
          tabTo = tabRoutes[currentIndex - 1];
        } else if (gestureState.dx < -SWIPE_THRESHOLD && currentIndex < tabRoutes.length - 1) {
          tabTo = tabRoutes[currentIndex + 1];
        }
        if (tabTo) {
          // Use router.replace to avoid stacking
          router.replace(tabTo);
        }
      },
    })
  ).current;

  return (
    <View style={styles.flex} {...panResponder.panHandlers}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  }
});
