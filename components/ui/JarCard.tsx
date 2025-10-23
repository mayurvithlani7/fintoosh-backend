import { useTheme } from '@/utils/themeContext';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Jar {
  label: string;
  key: string;
  value: number;
  color: string;
  icon: string;
}

interface JarCardProps {
  jar: Jar;
  progress: number;
  trend?: string;
  onPress?: () => void;
  showInsights?: boolean;
}

export const JarCard: React.FC<JarCardProps> = ({
  jar,
  progress,
  trend,
  onPress,
  showInsights = true
}) => {
  const { themeColors } = useTheme();
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [scaleAnim] = useState(new Animated.Value(1));

  const handlePress = () => {
    // Add micro-interaction
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    if (onPress) {
      onPress();
    } else {
      router.push('./money-jars');
    }
  };

  const getJarInsights = (key: string) => {
    switch (key) {
      case 'current':
        return 'Ready to spend on fun treats!';
      case 'save':
        return trend || 'Growing steadily for big goals';
      case 'spend':
        return 'Perfect for your favorite things';
      case 'donate':
        return 'Making a difference in the world';
      case 'invest':
        return trend || 'Building wealth for the future';
      default:
        return '';
    }
  };

  const getJarTooltip = (key: string) => {
    switch (key) {
      case 'current':
        return '💰 Pocket Money: Points you can spend right now for small treats!';
      case 'save':
        return '🐷 Savings Pot: Money saved for big goals like a new bike or game!';
      case 'spend':
        return '🛒 Spending Pot: For buying fun things you want!';
      case 'donate':
        return '🤲 Help Others Pot: Points for giving to charity or helping others!';
      case 'invest':
        return '📈 Grow Money Pot: Special savings that might grow bigger over time!';
      default:
        return '';
    }
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[
          styles.container,
          {
            backgroundColor: jar.color,
            borderColor: themeColors.border,
          }
        ]}
        onPress={handlePress}
        onLongPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={`${jar.label} with ${jar.value} points`}
        accessibilityHint="Tap to manage this money pot, long press for details"
      >
        {/* Main Jar Display */}
        <View style={styles.mainContent}>
          <Text style={styles.icon}>{jar.icon}</Text>
          <Text style={[styles.value, { color: themeColors.text }]}>{jar.value}</Text>
          <Text style={[styles.label, { color: themeColors.text }]}>{jar.label}</Text>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View
              style={[
                styles.progressBar,
                {
                  width: `${Math.min(progress, 100)}%`,
                  backgroundColor: themeColors.text + '80',
                }
              ]}
            />
          </View>

          {/* Trend Indicator */}
          {trend && (
            <View style={styles.trendContainer}>
              <Text style={[styles.trend, { color: themeColors.text }]}>{trend}</Text>
            </View>
          )}
        </View>

        {/* Expanded Details */}
        {isExpanded && showInsights && (
          <View style={[styles.expandedContent, { backgroundColor: themeColors.surface + '90' }]}>
            <Text style={[styles.insight, { color: themeColors.textSecondary }]}>
              {getJarInsights(jar.key)}
            </Text>
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: themeColors.primary }]}
                onPress={() => router.push('./money-jars')}
              >
                <Text style={[styles.actionButtonText, { color: themeColors.card }]}>Move Points</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: themeColors.secondary }]}
                onPress={() => router.push('./goals')}
              >
                <Text style={[styles.actionButtonText, { color: themeColors.card }]}>Set Goal</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Tap Hint for New Users */}
        {!isExpanded && (
          <View style={styles.tapHint}>
            <Text style={[styles.tapHintText, { color: themeColors.text + '60' }]}>
              Tap for details
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    padding: 16,
    minWidth: 120,
    alignItems: "center",
    marginHorizontal: 8,
    marginBottom: 8,
    borderWidth: 1.2,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  mainContent: {
    alignItems: 'center',
    width: '100%',
  },
  icon: {
    fontSize: 28,
    marginBottom: 8,
  },
  value: {
    fontWeight: "700",
    fontSize: 20,
    marginBottom: 4,
    textAlign: 'center',
  },
  label: {
    fontWeight: "600",
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  progressContainer: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    marginBottom: 6,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  trendContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 4,
  },
  trend: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  expandedContent: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    width: '100%',
  },
  insight: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tapHint: {
    position: 'absolute',
    bottom: 4,
    right: 4,
  },
  tapHintText: {
    fontSize: 10,
    fontStyle: 'italic',
  },
});

export default JarCard;
