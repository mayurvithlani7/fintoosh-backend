import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import React from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

interface OfflineIndicatorProps {
  showWhenOnline?: boolean;
}

const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  showWhenOnline = false
}) => {
  const { isConnected, isInternetReachable } = useNetworkStatus();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  const isOffline = !isConnected || isInternetReachable === false;

  React.useEffect(() => {
    if (isOffline || showWhenOnline) {
      // Fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      // Fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isOffline, showWhenOnline, fadeAnim]);

  // Don't render anything if online and not showing when online
  if (!isOffline && !showWhenOnline) {
    return null;
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={[
        styles.indicator,
        isOffline ? styles.offline : styles.online
      ]}>
        <View style={[
          styles.dot,
          isOffline ? styles.offlineDot : styles.onlineDot
        ]} />
        <Text style={[
          styles.text,
          isOffline ? styles.offlineText : styles.onlineText
        ]}>
          {isOffline ? 'No Internet Connection' : 'Back Online'}
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  indicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  offline: {
    backgroundColor: '#ffebee',
    borderBottomWidth: 2,
    borderBottomColor: '#f44336',
  },
  online: {
    backgroundColor: '#e8f5e8',
    borderBottomWidth: 2,
    borderBottomColor: '#4caf50',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  offlineDot: {
    backgroundColor: '#f44336',
  },
  onlineDot: {
    backgroundColor: '#4caf50',
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
  },
  offlineText: {
    color: '#c62828',
  },
  onlineText: {
    color: '#2e7d32',
  },
});

export default OfflineIndicator;
