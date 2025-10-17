import { useRouter, useSegments } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import { PanResponder, PanResponderGestureState, StyleSheet, View } from 'react-native';

const SWIPE_THRESHOLD = 40;

type TabSwipeProps = {
  tabRoutes: string[]; // Absolute segment keys for tabs in order
  children: React.ReactNode;
  disabled?: boolean; // Allow disabling swipe navigation
};

// Usage: <SwipeNavigator tabRoutes={[... tab segment names ...]}> ...screen... </SwipeNavigator>
export default function SwipeNavigator({ tabRoutes, children, disabled = false }: TabSwipeProps) {
  const router = useRouter();
  const segments = useSegments();
  const scrollViewRef = useRef<any>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const lastScrollTime = useRef(0);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState: PanResponderGestureState) => {
        // Don't set responder if swipe navigation is disabled
        if (disabled) return false;

        // Don't set responder if content was recently scrolling (last 100ms)
        const now = Date.now();
        if (now - lastScrollTime.current < 100) return false;

        // Only set responder if horizontal swipe initiated and more horizontal than vertical
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) &&
               Math.abs(gestureState.dx) > 15 &&
               Math.abs(gestureState.dy) < 10; // Reduce vertical tolerance
      },
      onPanResponderGrant: () => {
        // Optional: Add haptic feedback or visual feedback here
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

  // Enhanced scroll handler that tracks timing
  const handleScroll = useCallback((event: any) => {
    lastScrollTime.current = Date.now();
  }, []);

  // Wrap children to inject scroll tracking
  const wrappedChildren = React.Children.map(children, (child) => {
    if (React.isValidElement(child) && child.type === require('react-native').ScrollView) {
      return React.cloneElement(child as React.ReactElement<any>, {
        onScroll: handleScroll,
        scrollEventThrottle: 16,
        ref: scrollViewRef,
      });
    }
    return child;
  });

  return (
    <View style={styles.flex} {...panResponder.panHandlers}>
      {wrappedChildren || children}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  }
});
