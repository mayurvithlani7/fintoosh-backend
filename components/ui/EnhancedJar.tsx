import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import AnimatedCircularProgress from '../animations/AnimatedCircularProgress';

interface EnhancedJarProps {
  label: string;
  value: number;
  totalPoints?: number;
  themeColors: any;
  trend?: string;
  status?: 'excellent' | 'good' | 'needs_attention' | 'low';
  recommended?: number; // percentage of total points
  showProgressRing?: boolean;
}

export const EnhancedJar: React.FC<EnhancedJarProps> = ({
  label,
  value,
  totalPoints,
  themeColors,
  trend,
  status = 'good',
  recommended = 20,
  showProgressRing = true
}) => {
  // Calculate progress percentage
  const progressPercent = totalPoints ? Math.min((value / totalPoints) * 100, 100) : 50;

  // Get status colors and messages
  const getStatusConfig = () => {
    switch (status) {
      case 'excellent':
        return {
          color: themeColors.success,
          bgColor: themeColors.success + '15',
          message: 'Excellent!',
          icon: '🌟'
        };
      case 'good':
        return {
          color: themeColors.primary,
          bgColor: themeColors.primary + '15',
          message: 'Good balance',
          icon: '👍'
        };
      case 'needs_attention':
        return {
          color: themeColors.warning,
          bgColor: themeColors.warning + '15',
          message: 'Consider adjusting',
          icon: '⚠️'
        };
      case 'low':
        return {
          color: themeColors.error,
          bgColor: themeColors.error + '15',
          message: 'Needs attention',
          icon: '📉'
        };
      default:
        return {
          color: themeColors.primary,
          bgColor: themeColors.primary + '15',
          message: 'Good balance',
          icon: '👍'
        };
    }
  };

  const statusConfig = getStatusConfig();

  // Get recommended range (recommended ± 10%)
  const recommendedMin = Math.max(0, recommended - 10);
  const recommendedMax = recommended + 10;
  const isInRecommendedRange = progressPercent >= recommendedMin && progressPercent <= recommendedMax;

  const styles = createStyles(themeColors);

  return (
    <View style={[styles.container, { backgroundColor: statusConfig.bgColor }]}>
      {/* Progress Ring */}
      {showProgressRing && (
        <View style={styles.progressContainer}>
          <AnimatedCircularProgress
            size={60}
            width={4}
            fill={progressPercent}
            tintColor={statusConfig.color}
            backgroundColor={themeColors.border}
            duration={1500}
          />
          <View style={styles.progressOverlay}>
            <Text style={[styles.trendText, { color: trend?.startsWith('+') ? themeColors.success : themeColors.error }]}>
              {trend || ''}
            </Text>
          </View>
        </View>
      )}

      {/* Content */}
      <View style={styles.content}>
        <Text style={[styles.label, { color: themeColors.text }]}>{label}</Text>
        <Text style={[styles.value, { color: themeColors.text }]}>{value}</Text>

        {/* Status Indicator */}
        <View style={styles.statusRow}>
          <Text style={[styles.statusIcon]}>{statusConfig.icon}</Text>
          <Text style={[styles.statusText, { color: statusConfig.color }]}>
            {statusConfig.message}
          </Text>
        </View>

        {/* Recommended Range Indicator */}
        {recommended && (
          <View style={styles.recommendationRow}>
            <Text style={[styles.recommendationText, { color: themeColors.textSecondary }]}>
              Target: {recommended}%
            </Text>
            {isInRecommendedRange && (
              <Text style={[styles.recommendationIcon, { color: themeColors.success }]}>✓</Text>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

const createStyles = (themeColors: any) => StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    minWidth: 120,
    alignItems: 'center',
    elevation: 2,
    shadowColor: themeColors.border,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  progressContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  progressOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  content: {
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  value: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  recommendationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recommendationText: {
    fontSize: 10,
    fontWeight: '500',
  },
  recommendationIcon: {
    fontSize: 12,
    marginLeft: 4,
  },
});

export default EnhancedJar;
