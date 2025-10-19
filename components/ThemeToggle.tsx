import { ThemeType, useTheme } from '@/utils/themeContext';
import React from 'react';
import { Animated, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ThemeToggleProps {
  style?: any;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ style }) => {
  const { theme, setTheme, toggleDarkMode, currentSeason, isDarkMode, animationSettings } = useTheme();
  const [showThemeModal, setShowThemeModal] = React.useState(false);
  const [isTransitioning, setIsTransitioning] = React.useState(false);
  const spinValue = React.useRef(new Animated.Value(0)).current;

  const themeOptions = [
    { key: 'light', label: '☀️ Light', description: 'Bright and cheerful' },
    { key: 'dark', label: '🌙 Dark', description: 'Easy on the eyes' },
    { key: 'indian', label: '🇮🇳 Indian', description: 'Saffron, white, and green' },
    ...(currentSeason ? [(
      currentSeason === 'diwali' ? { key: currentSeason, label: '🪔 Diwali', description: 'Festival of lights theme' } :
      currentSeason === 'holi' ? { key: currentSeason, label: '🎨 Holi', description: 'Festival of colors theme' } :
      {
        key: currentSeason,
        label: currentSeason === 'halloween' ? '🎃 Halloween' :
               currentSeason === 'christmas' ? '🎄 Christmas' :
               currentSeason === 'summer' ? '🏖️ Summer' :
               currentSeason === 'easter' ? '🐰 Easter' : '🎨 Seasonal',
        description: 'Special seasonal theme'
      }
    )] : [])
  ];

  const handleThemeSelect = async (themeKey: ThemeType) => {
    if (!animationSettings.enabled || animationSettings.prefersReducedMotion) {
      setTheme(themeKey);
      setShowThemeModal(false);
      return;
    }

    // Start transition animation
    setIsTransitioning(true);
    spinValue.setValue(0);

    // Animate the spin
    Animated.timing(spinValue, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start(() => {
      setTheme(themeKey);
      setIsTransitioning(false);
      setShowThemeModal(false);
    });
  };

  // Create spin animation
  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  return (
    <>
      <TouchableOpacity
        style={[styles.toggleButton, style]}
        onPress={() => setShowThemeModal(true)}
        accessibilityRole="button"
        accessibilityLabel={`Current theme: ${theme}. Tap to change theme`}
        accessibilityHint="Opens theme selection menu"
      >
        <Text style={styles.toggleIcon}>
          {theme === 'light' ? '☀️' :
           theme === 'dark' ? '🌙' :
           theme === 'indian' ? '🇮🇳' :
           theme === 'diwali' ? '🪔' :
           theme === 'holi' ? '🎨' :
           theme === 'halloween' ? '🎃' :
           theme === 'christmas' ? '🎄' :
           theme === 'summer' ? '🏖️' :
           theme === 'easter' ? '🐰' : '🎨'}
        </Text>
        <Text style={styles.toggleText}>Theme</Text>
      </TouchableOpacity>

      {/* Theme Transition Overlay */}
      <Modal
        visible={isTransitioning}
        transparent={true}
        animationType="none"
      >
        <View style={styles.transitionOverlay}>
          <Animated.View
            style={[
              styles.transitionSpinner,
              { transform: [{ rotate: spin }] }
            ]}
          >
            <Text style={styles.transitionEmoji}>
              {theme === 'light' ? '☀️' :
               theme === 'dark' ? '🌙' :
               theme === 'indian' ? '🇮🇳' :
               theme === 'diwali' ? '🪔' :
               theme === 'holi' ? '🎨' :
               theme === 'halloween' ? '🎃' :
               theme === 'christmas' ? '🎄' :
               theme === 'summer' ? '🏖️' :
               theme === 'easter' ? '🐰' : '🎨'}
            </Text>
          </Animated.View>
          <Text style={styles.transitionText}>Changing theme...</Text>
        </View>
      </Modal>

      <Modal
        visible={showThemeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowThemeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🎨 Choose Theme</Text>

            {themeOptions.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.themeOption,
                  theme === option.key && styles.selectedTheme
                ]}
                onPress={() => handleThemeSelect(option.key as ThemeType)}
                accessibilityRole="button"
                accessibilityLabel={`${option.label}: ${option.description}`}
                accessibilityState={{ selected: theme === option.key }}
              >
                <Text style={styles.themeLabel}>{option.label}</Text>
                <Text style={styles.themeDescription}>{option.description}</Text>
                {theme === option.key && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowThemeModal(false)}
              accessibilityRole="button"
              accessibilityLabel="Close theme selection"
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  toggleIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '85%',
    maxWidth: 400,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedTheme: {
    borderColor: '#4fc1e9',
    backgroundColor: '#e3f2fd',
  },
  themeLabel: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    color: '#333',
  },
  themeDescription: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    marginLeft: 10,
  },
  checkmark: {
    fontSize: 20,
    color: '#4fc1e9',
    fontWeight: 'bold',
  },
  closeButton: {
    backgroundColor: '#e9ecef',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 10,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
  },
  transitionOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  transitionSpinner: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 50,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  transitionEmoji: {
    fontSize: 40,
  },
  transitionText: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
  },
});

export default ThemeToggle;
