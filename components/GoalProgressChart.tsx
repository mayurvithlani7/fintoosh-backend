import { useTheme } from '@/utils/themeContext';
import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';

const { width } = Dimensions.get('window');

interface Milestone {
  description: string;
  targetAmount: number;
  completed?: boolean;
  completedAt?: Date;
}

interface Goal {
  _id: string;
  name: string;
  targetAmount: number;
  currentAmount?: number;
  milestones?: Milestone[];
  jar: string;
  status: string;
  templateId?: string;
}

interface GoalProgressChartProps {
  goal: Goal;
  currentProgress?: number;
}

const createStyles = (themeColors: any) => StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  progressContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  progressBar: {
    height: 24,
    backgroundColor: themeColors.surface,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: themeColors.border,
  },
  progressFill: {
    height: '100%',
    backgroundColor: themeColors.primary,
    borderRadius: 10,
  },
  progressText: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 14,
    fontWeight: 'bold',
    color: themeColors.card,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  milestonesContainer: {
    marginTop: 15,
  },
  milestonesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: themeColors.text,
    marginBottom: 10,
  },
  milestoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    padding: 8,
    borderRadius: 8,
    backgroundColor: themeColors.surface,
  },
  milestoneIcon: {
    fontSize: 16,
    marginRight: 10,
    width: 20,
    textAlign: 'center',
  },
  milestoneContent: {
    flex: 1,
  },
  milestoneDescription: {
    fontSize: 14,
    color: themeColors.text,
    fontWeight: '500',
  },
  milestoneTarget: {
    fontSize: 12,
    color: themeColors.textSecondary,
    marginTop: 2,
  },
  milestoneStatus: {
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    textAlign: 'center',
    minWidth: 60,
  },
  statusCompleted: {
    backgroundColor: themeColors.success,
    color: themeColors.card,
  },
  statusPending: {
    backgroundColor: themeColors.warning,
    color: themeColors.card,
  },
  statusUpcoming: {
    backgroundColor: themeColors.surface,
    color: themeColors.textSecondary,
  },
  noMilestones: {
    textAlign: 'center',
    color: themeColors.textSecondary,
    fontStyle: 'italic',
    marginTop: 10,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: themeColors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: themeColors.textSecondary,
    marginTop: 2,
  },
});

const GoalProgressChart: React.FC<GoalProgressChartProps> = ({ goal, currentProgress }) => {
  const { themeColors } = useTheme();
  const styles = createStyles(themeColors);

  // Calculate progress percentage
  const targetAmount = goal.targetAmount || 0;
  const currentAmount = currentProgress || goal.currentAmount || 0;
  const progressPercentage = Math.min((currentAmount / targetAmount) * 100, 100);

  // Format amounts for display
  const formatAmount = (amount: number) => {
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}K`;
    }
    return amount.toString();
  };

  // Calculate remaining amount
  const remainingAmount = Math.max(targetAmount - currentAmount, 0);

  // Get milestones with status
  const getMilestonesWithStatus = () => {
    if (!goal.milestones || goal.milestones.length === 0) return [];

    return goal.milestones.map((milestone, index) => {
      const isCompleted = milestone.completed || currentAmount >= milestone.targetAmount;
      const isCurrent = !isCompleted && currentAmount >= (goal.milestones![index - 1]?.targetAmount || 0);

      let status: 'completed' | 'pending' | 'upcoming' = 'upcoming';
      if (isCompleted) status = 'completed';
      else if (isCurrent) status = 'pending';

      return {
        ...milestone,
        status,
        isCompleted,
        isCurrent,
      };
    });
  };

  const milestonesWithStatus = getMilestonesWithStatus();

  const renderMilestoneItem = (milestone: any, index: number) => {
    const getIcon = () => {
      if (milestone.isCompleted) return '✅';
      if (milestone.isCurrent) return '🎯';
      return '⏳';
    };

    const getStatusStyle = () => {
      switch (milestone.status) {
        case 'completed':
          return styles.statusCompleted;
        case 'pending':
          return styles.statusPending;
        default:
          return styles.statusUpcoming;
      }
    };

    const getStatusText = () => {
      switch (milestone.status) {
        case 'completed':
          return 'Done!';
        case 'pending':
          return 'Next';
        default:
          return 'Upcoming';
      }
    };

    return (
      <View key={index} style={styles.milestoneItem}>
        <Text style={styles.milestoneIcon}>{getIcon()}</Text>
        <View style={styles.milestoneContent}>
          <Text style={styles.milestoneDescription}>
            {milestone.description}
          </Text>
          <Text style={styles.milestoneTarget}>
            Target: {formatAmount(milestone.targetAmount)} points
          </Text>
        </View>
        <Text style={[styles.milestoneStatus, getStatusStyle()]}>
          {getStatusText()}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Progress Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{formatAmount(currentAmount)}</Text>
          <Text style={styles.statLabel}>Saved</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{formatAmount(targetAmount)}</Text>
          <Text style={styles.statLabel}>Target</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{formatAmount(remainingAmount)}</Text>
          <Text style={styles.statLabel}>Remaining</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{progressPercentage.toFixed(0)}%</Text>
          <Text style={styles.statLabel}>Complete</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${progressPercentage}%` }
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {formatAmount(currentAmount)} / {formatAmount(targetAmount)} ({progressPercentage.toFixed(0)}%)
        </Text>
      </View>

      {/* Milestones Section */}
      {milestonesWithStatus.length > 0 && (
        <View style={styles.milestonesContainer}>
          <Text style={styles.milestonesTitle}>🎯 Goal Milestones</Text>
          {milestonesWithStatus.map((milestone, index) =>
            renderMilestoneItem(milestone, index)
          )}
        </View>
      )}

      {(!goal.milestones || goal.milestones.length === 0) && (
        <Text style={styles.noMilestones}>
          No milestones set for this goal. Keep saving to reach your target! 💪
        </Text>
      )}
    </View>
  );
};

export default GoalProgressChart;
