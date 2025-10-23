import React, { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface NextPayout {
  amount: number;
  days: number;
}

interface InterestMotivatorProps {
  nextPayout: NextPayout;
  totalEarned: number;
  streak?: number; // weeks of consecutive interest earning
  recentPayouts?: any[]; // Recent interest transactions
  themeColors: any;
  onExpand?: () => void;
  isExpanded?: boolean;
}

export const InterestMotivator: React.FC<InterestMotivatorProps> = ({
  nextPayout,
  totalEarned,
  streak = 0,
  recentPayouts = [],
  themeColors,
  onExpand,
  isExpanded = false
}) => {
  const [celebrationAnim] = useState(new Animated.Value(0));
  const [progressAnim] = useState(new Animated.Value(0));

  // Calculate progress percentage (assuming 7-day cycle for weekly, 30-day for monthly)
  const cycleDays = 7; // We'll assume weekly for simplicity, can be made dynamic
  const progressPercent = Math.min(((cycleDays - nextPayout.days) / cycleDays) * 100, 100);

  useEffect(() => {
    // Animate progress bar
    Animated.timing(progressAnim, {
      toValue: progressPercent,
      duration: 1500,
      useNativeDriver: false,
    }).start();

    // Celebration animation for milestones
    if (streak > 0 && streak % 4 === 0) { // Every 4 weeks
      Animated.sequence([
        Animated.timing(celebrationAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(celebrationAnim, {
          toValue: 0,
          duration: 300,
          delay: 1000,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [progressPercent, streak]);

  const getMotivationalMessage = () => {
    if (streak >= 12) return "🏆 You're a savings champion!";
    if (streak >= 8) return "🌟 Amazing consistency!";
    if (streak >= 4) return "💪 Great savings habit!";
    if (nextPayout.days <= 1) return "🎉 Payout tomorrow!";
    if (nextPayout.days <= 3) return "⚡ Almost there!";
    return "🚀 Keep up the momentum!";
  };

  const getStreakIcon = () => {
    if (streak >= 12) return "🏆";
    if (streak >= 8) return "🌟";
    if (streak >= 4) return "🔥";
    return "🌱";
  };

  const styles = createStyles(themeColors);

  return (
    <View style={[styles.container, { backgroundColor: themeColors.success + '10', borderColor: themeColors.success }]}>
      {/* Celebration overlay */}
      <Animated.View
        style={[
          styles.celebrationOverlay,
          {
            opacity: celebrationAnim,
            transform: [{
              scale: celebrationAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 1.2],
              }),
            }],
          },
        ]}
      >
        <Text style={styles.celebrationText}>🎉 MILESTONE! 🎉</Text>
      </Animated.View>

      {/* Header */}
      <TouchableOpacity
        style={styles.header}
        onPress={onExpand}
        activeOpacity={0.8}
      >
        <View style={styles.headerLeft}>
          <Text style={styles.icon}>💸</Text>
          <Text style={[styles.title, { color: themeColors.success }]}>Interest Earnings</Text>
        </View>
        <Text style={[styles.expandIcon, { color: themeColors.textSecondary }]}>
          {isExpanded ? '▼' : '▶'}
        </Text>
      </TouchableOpacity>

      {/* Collapsed content preview */}
      {!isExpanded && (
        <View style={styles.collapsedPreview}>
          <Text style={[styles.previewText, { color: themeColors.text }]}>
            Next: <Text style={{ fontWeight: 'bold', color: themeColors.success }}>+₹{nextPayout.amount}</Text> in {nextPayout.days} day{nextPayout.days !== 1 ? 's' : ''}
          </Text>
          <Text style={[styles.motivationText, { color: themeColors.textSecondary }]}>
            {getMotivationalMessage()}
          </Text>
        </View>
      )}

      {/* Expanded content */}
      {isExpanded && (
        <View style={styles.expandedContent}>
          {/* Progress bar */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={[styles.progressLabel, { color: themeColors.text }]}>Next Payout Progress</Text>
              <Text style={[styles.progressPercent, { color: themeColors.success }]}>
                {Math.round(progressPercent)}%
              </Text>
            </View>
            <View style={[styles.progressBar, { backgroundColor: themeColors.border }]}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: themeColors.success,
                    width: progressAnim.interpolate({
                      inputRange: [0, 100],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>
            <Text style={[styles.progressText, { color: themeColors.textSecondary }]}>
              {nextPayout.days} day{nextPayout.days !== 1 ? 's' : ''} until +₹{nextPayout.amount}
            </Text>
          </View>

          {/* Stats grid */}
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: themeColors.surface }]}>
              <Text style={styles.statIcon}>💰</Text>
              <Text style={[styles.statValue, { color: themeColors.success }]}>₹{totalEarned}</Text>
              <Text style={[styles.statLabel, { color: themeColors.textSecondary }]}>Total Earned</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: themeColors.surface }]}>
              <Text style={styles.statIcon}>{getStreakIcon()}</Text>
              <Text style={[styles.statValue, { color: themeColors.primary }]}>{streak}</Text>
              <Text style={[styles.statLabel, { color: themeColors.textSecondary }]}>Week Streak</Text>
            </View>
          </View>

          {/* Motivational message */}
          <View style={[styles.motivationCard, { backgroundColor: themeColors.primary + '10' }]}>
            <Text style={[styles.motivationIcon]}>💪</Text>
            <Text style={[styles.motivationMessage, { color: themeColors.primary }]}>
              {getMotivationalMessage()}
            </Text>
          </View>

          {/* Recent payouts - show real data or placeholder */}
          <View style={styles.recentSection}>
            <Text style={[styles.recentTitle, { color: themeColors.text }]}>Recent Payouts</Text>
            {recentPayouts && recentPayouts.length > 0 ? (
              <View style={styles.recentList}>
                {recentPayouts.map((payout, index) => (
                  <View key={index} style={[styles.recentItem, { backgroundColor: themeColors.surface + '50' }]}>
                    <Text style={[styles.recentDate, { color: themeColors.textSecondary }]}>
                      {new Date(payout.payoutDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </Text>
                    <Text style={[styles.recentType, { color: themeColors.text }]}>
                      {payout.frequency === 'weekly' ? 'Weekly' : 'Monthly'} Interest
                    </Text>
                    <Text style={[styles.recentAmount, { color: themeColors.success }]}>
                      +₹{payout.amount}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={[styles.recentPlaceholder, { backgroundColor: themeColors.surface + '50' }]}>
                <Text style={[styles.recentPlaceholderText, { color: themeColors.textSecondary }]}>
                  📊 Real payout history will appear here once interest has been earned
                </Text>
                <Text style={[styles.recentPlaceholderSubtext, { color: themeColors.textSecondary }]}>
                  Keep saving to start earning interest!
                </Text>
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

const createStyles = (themeColors: any) => StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    elevation: 2,
    shadowColor: themeColors.border,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  celebrationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    zIndex: 10,
  },
  celebrationText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 24,
    marginRight: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  expandIcon: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  collapsedPreview: {
    paddingTop: 8,
  },
  previewText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  motivationText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  expandedContent: {
    marginTop: 8,
  },
  progressSection: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    textAlign: 'center',
  },
  motivationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  motivationIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  motivationMessage: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  recentSection: {
    marginTop: 8,
  },
  recentTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  recentList: {
    gap: 6,
  },
  recentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 8,
    padding: 8,
  },
  recentDate: {
    fontSize: 12,
    flex: 1,
  },
  recentType: {
    fontSize: 12,
    flex: 2,
    textAlign: 'center',
  },
  recentAmount: {
    fontSize: 12,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'right',
  },
  recentPlaceholder: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  recentPlaceholderText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 8,
  },
  recentPlaceholderSubtext: {
    fontSize: 12,
    textAlign: 'center',
  },
});

export default InterestMotivator;
