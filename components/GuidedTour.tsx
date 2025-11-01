import { useTheme } from '@/utils/themeContext';
import React, { useEffect, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface TourStep {
  title: string;
  content: string;
  target: 'total-balance' | 'my-pots' | 'my-tasks' | 'games';
  position: 'top' | 'bottom' | 'center';
}

interface GuidedTourProps {
  visible: boolean;
  onComplete: () => void;
  onDismiss: () => void;
}

const GuidedTour: React.FC<GuidedTourProps> = ({ visible, onComplete, onDismiss }) => {
  const { themeColors } = useTheme();
  const [currentStep, setCurrentStep] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(0));

  const tourSteps: TourStep[] = [
    {
      title: "Welcome to Your Money App! 🎉",
      content: "This is your special money app where you can earn points, save for things you want, and learn about money in a fun way!",
      target: 'total-balance',
      position: 'center'
    },
    {
      title: "Earn Points for Chores 🧹",
      content: "Do home tasks and chores to earn points! Your parents can give you points for helping around the house.",
      target: 'my-pots',
      position: 'center'
    },
    {
      title: "Save in Magic Pots 🏺",
      content: "You have 5 special money pots to save your points: for toys, charity, future goals, and more smart saving!",
      target: 'my-pots',
      position: 'center'
    },
    {
      title: "Learn Money Skills 📚",
      content: "Play fun games and watch videos to learn about saving money, spending wisely, and making good choices!",
      target: 'games',
      position: 'center'
    }
  ];

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [visible, fadeAnim]);

  const nextStep = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      // If we're on the first step and user presses "Skip", dismiss the tour
      onDismiss();
    }
  };



  const getModalPosition = (): any => {
    const currentTourStep = tourSteps[currentStep];
    switch (currentTourStep.position) {
      case 'top':
        return {
          justifyContent: 'flex-start' as const,
          alignItems: 'center' as const,
          paddingTop: height * 0.08,
        };
      case 'bottom':
        return {
          justifyContent: 'flex-end' as const,
          alignItems: 'center' as const,
          paddingBottom: height * 0.08,
        };
      default:
        return {
          justifyContent: 'center' as const,
          alignItems: 'center' as const,
        };
    }
  };

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalContainer: {
      backgroundColor: themeColors.card,
      borderRadius: 16,
      width: '100%',
      maxWidth: 450,
      elevation: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      borderWidth: 2,
      borderColor: themeColors.primary,
    },
    pointer: {
      width: 0,
      height: 0,
      borderLeftWidth: 15,
      borderRightWidth: 15,
      borderBottomWidth: 20,
      borderLeftColor: 'transparent',
      borderRightColor: 'transparent',
      borderBottomColor: themeColors.primary,
      alignSelf: 'center',
      marginBottom: -2,
    },
    pointerUp: {
      borderLeftWidth: 15,
      borderRightWidth: 15,
      borderTopWidth: 20,
      borderBottomWidth: 0,
      borderLeftColor: 'transparent',
      borderRightColor: 'transparent',
      borderTopColor: themeColors.primary,
      marginTop: -2,
      marginBottom: 0,
    },
    header: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: themeColors.primary,
      textAlign: 'center',
      lineHeight: 22,
    },
    stepIndicator: {
      fontSize: 12,
      color: themeColors.textSecondary,
      marginTop: 4,
    },
    content: {
      padding: 16,
      alignItems: 'center',
      minHeight: 60,
    },
    contentText: {
      fontSize: 14,
      color: themeColors.text,
      lineHeight: 20,
      textAlign: 'center',
      marginBottom: 16,
    },
    buttons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
      paddingHorizontal: 16,
      paddingBottom: 16,
    },
    button: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 20,
      minWidth: 70,
      alignItems: 'center',
      flex: 1,
      marginHorizontal: 4,
    },
    prevButton: {
      backgroundColor: themeColors.secondary,
    },
    nextButton: {
      backgroundColor: themeColors.primary,
    },
    skipButton: {
      backgroundColor: themeColors.error,
      marginTop: 8,
      marginHorizontal: 16,
      marginBottom: 16,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 20,
      alignItems: 'center',
      width: '100%',
    },
    buttonText: {
      color: themeColors.card,
      fontWeight: 'bold',
      fontSize: 13,
    },
    highlightOverlay: {
      position: 'absolute',
      backgroundColor: 'rgba(255, 255, 0, 0.3)',
      borderRadius: 10,
      borderWidth: 3,
      borderColor: themeColors.primary,
    },
  });

  const currentTourStep = tourSteps[currentStep];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{currentTourStep.title}</Text>
            <Text style={styles.stepIndicator}>
              Step {currentStep + 1} of {tourSteps.length}
            </Text>
          </View>

          <View style={styles.content}>
            <Text style={styles.contentText}>{currentTourStep.content}</Text>
          </View>

          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.button, styles.prevButton]}
              onPress={prevStep}
              disabled={currentStep === 0}
            >
              <Text style={styles.buttonText}>
                {currentStep === 0 ? 'Skip' : 'Previous'}
              </Text>
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

          <TouchableOpacity
            style={[styles.button, styles.skipButton]}
            onPress={onDismiss}
          >
            <Text style={styles.buttonText}>Skip Tour</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
};

export default GuidedTour;
