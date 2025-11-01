import { useCenteredMessage } from '@/utils/centeredMessageContext';
import { useTheme } from '@/utils/themeContext';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Global CenteredMessageModal component that uses context
const CenteredMessageModal: React.FC = () => {
  const { themeColors } = useTheme();
  const { currentMessage, hideMessage } = useCenteredMessage();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const autoHideTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (currentMessage) {
      // Show animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide after duration
      autoHideTimer.current = setTimeout(() => {
        hideModal();
      }, currentMessage.autoHideDuration || 3000);
    } else {
      // Reset animations
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
    }

    return () => {
      if (autoHideTimer.current) {
        clearTimeout(autoHideTimer.current);
      }
    };
  }, [currentMessage]);

  const hideModal = () => {
    if (currentMessage) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        hideMessage(currentMessage.id);
      });
    }
  };

  if (!currentMessage) return null;

  const getTypeConfig = () => {
    switch (currentMessage.type) {
      case 'success':
        return {
          backgroundColor: themeColors.success || '#4CAF50',
          textColor: '#FFFFFF',
          icon: '✅',
          borderColor: themeColors.success || '#4CAF50',
        };
      case 'error':
        return {
          backgroundColor: themeColors.error || '#F44336',
          textColor: '#FFFFFF',
          icon: '❌',
          borderColor: themeColors.error || '#F44336',
        };
      case 'info':
      default:
        return {
          backgroundColor: themeColors.primary || '#2196F3',
          textColor: '#FFFFFF',
          icon: 'ℹ️',
          borderColor: themeColors.primary || '#2196F3',
        };
    }
  };

  const typeConfig = getTypeConfig();

  return (
    <View style={styles.overlay}>
      <Animated.View
        style={[
          styles.modalContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          }
        ]}
      >
        <View style={[styles.modalContent, { backgroundColor: typeConfig.backgroundColor, borderColor: typeConfig.borderColor }]}>
          <View style={styles.content}>
            <Text style={styles.icon}>{typeConfig.icon}</Text>
            <Text style={[styles.message, { color: typeConfig.textColor }]}>
              {currentMessage.message}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={hideModal}
            accessibilityRole="button"
            accessibilityLabel="Close message"
            accessibilityHint="Tap to dismiss this message"
          >
            <Text style={[styles.closeText, { color: typeConfig.textColor }]}>✕</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  modalContainer: {
    width: screenWidth * 0.85,
    maxWidth: 400,
    minHeight: 120,
  },
  modalContent: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  icon: {
    fontSize: 24,
    marginRight: 12,
    marginTop: 2,
  },
  message: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
    flex: 1,
    textAlign: 'left',
  },
  closeButton: {
    padding: 4,
    marginLeft: 12,
  },
  closeText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default CenteredMessageModal;
