import { useTheme } from '@/utils/themeContext';
import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface WelcomeTourProps {
  visible: boolean;
  onComplete: () => void;
  onDismiss: () => void;
}

const WelcomeTour: React.FC<WelcomeTourProps> = ({ visible, onComplete, onDismiss }) => {
  const { themeColors } = useTheme();
  const [currentStep, setCurrentStep] = useState(0);

  const tourSteps = [
    {
      title: "🎉 Welcome to Your Money App!",
      content: "Hi there! This is your special app to learn about money, earn points, and save for fun things!",
      emoji: "👋"
    },
    {
      title: "🧹 Earn Points for Chores",
      content: "Do helpful tasks around the house and earn points from your parents. The more you help, the more you earn!",
      emoji: "⭐"
    },
    {
      title: "🏺 Save in Magic Pots",
      content: "You have 5 special money pots to save your points: for toys, helping others, and big dreams!",
      emoji: "💰"
    },
    {
      title: "🎮 Learn While Playing",
      content: "Play fun games and watch videos to learn smart ways to use your money and save for the future!",
      emoji: "🎯"
    }
  ];

  const nextStep = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const skipTour = () => {
    // Skip this entire tutorial
    onDismiss();
  };

  const currentTourStep = tourSteps[currentStep];

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16,
    },
    modalContainer: {
      backgroundColor: themeColors.card,
      borderRadius: 24,
      width: '92%',
      maxWidth: 380,
      padding: 20,
      alignItems: 'center',
      borderWidth: 4,
      borderColor: themeColors.primary,
      elevation: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
    emoji: {
      fontSize: 52,
      marginBottom: 20,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: themeColors.primary,
      textAlign: 'center',
      marginBottom: 18,
      lineHeight: 30,
    },
    content: {
      fontSize: 17,
      color: themeColors.text,
      textAlign: 'center',
      lineHeight: 26,
      marginBottom: 28,
      paddingHorizontal: 8,
    },
    stepIndicator: {
      fontSize: 15,
      color: themeColors.textSecondary,
      marginBottom: 28,
      fontWeight: '500',
    },
    buttonsContainer: {
      width: '100%',
      gap: 16,
    },
    buttonRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
      gap: 16,
    },
    button: {
      flex: 1,
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: 28,
      alignItems: 'center',
      minHeight: 56,
      justifyContent: 'center',
    },
    skipButton: {
      backgroundColor: themeColors.error,
    },
    nextButton: {
      backgroundColor: themeColors.primary,
    },
    skipTourButton: {
      backgroundColor: themeColors.surface,
      borderWidth: 2,
      borderColor: themeColors.border,
    },
    buttonText: {
      color: themeColors.card,
      fontWeight: 'bold',
      fontSize: 17,
    },
    skipTourText: {
      color: themeColors.text,
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.emoji}>{currentTourStep.emoji}</Text>

          <Text style={styles.title}>{currentTourStep.title}</Text>

          <Text style={styles.content}>{currentTourStep.content}</Text>

          <Text style={styles.stepIndicator}>
            Step {currentStep + 1} of {tourSteps.length}
          </Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.skipButton]}
              onPress={skipTour}
            >
              <Text style={styles.buttonText}>Skip</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.nextButton]}
              onPress={nextStep}
            >
              <Text style={styles.buttonText}>
                {currentStep === tourSteps.length - 1 ? 'Get Started!' : 'Next'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default WelcomeTour;
