import { useCenteredMessage } from '@/utils/centeredMessageContext';
import { API_URL } from '@/utils/config';
import { getAuthToken, getUser, getUserSpecificKey } from '@/utils/secureStorage';
import { useTheme } from '@/utils/themeContext';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { AnimatedProgressBar } from './animations/AnimatedProgressBar';
import { Confetti } from './animations/Confetti';

interface Achievement {
  _id: string;
  type: string;
  title: string;
  description: string;
  icon: string;
  progress: number;
  target: number;
  completed: boolean;
  completedAt?: string;
  streakCount?: number;
  powerUps?: {
    type: string;
    count: number;
    expiresAt: string;
  }[];
}

interface AchievementSystemProps {
  onClose?: () => void;
}

// Achievement update utility functions - exported for use by other components
export const updateAchievementProgress = async (achievementId: string, increment: number = 1) => {
  try {
    const { getUser, getUserSpecificKey } = await import('../utils/secureStorage');
    const currentUser = await getUser();

    if (!currentUser) {
      console.error('No user logged in - cannot update achievements');
      return;
    }

    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
    const userAchievementsKey = getUserSpecificKey('achievements', currentUser.id);

    let storedAchievements = await AsyncStorage.getItem(userAchievementsKey);
    if (!storedAchievements) return;

    const achievements: Achievement[] = JSON.parse(storedAchievements);
    const achievement = achievements.find(a => a._id === achievementId);

    if (achievement && !achievement.completed) {
      achievement.progress = Math.min(achievement.progress + increment, achievement.target);

      // Check if achievement is now completed
      if (achievement.progress >= achievement.target) {
        achievement.completed = true;
        achievement.completedAt = new Date().toISOString();
        // Achievement unlocked! (celebration would happen in UI)
      }

      await AsyncStorage.setItem(userAchievementsKey, JSON.stringify(achievements));
      return achievement.completed; // Return true if newly completed
    }

    return false;
  } catch (error) {
    console.error('Error updating achievement progress:', error);
    return false;
  }
};

export const getUserAchievements = async (): Promise<Achievement[]> => {
  try {
    const { getUser, getUserSpecificKey } = await import('@/utils/secureStorage');
    const currentUser = await getUser();

    if (!currentUser) return [];

    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
    const userAchievementsKey = getUserSpecificKey('achievements', currentUser.id);

    const storedAchievements = await AsyncStorage.getItem(userAchievementsKey);
    return storedAchievements ? JSON.parse(storedAchievements) : [];
  } catch (error) {
    console.error('Error getting user achievements:', error);
    return [];
  }
};

export const AchievementSystem: React.FC<AchievementSystemProps> = ({ onClose }) => {
  const { themeColors } = useTheme();
  const { showMessage } = useCenteredMessage();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    try {
      // Get current user for user-specific storage
      const currentUser = await getUser();

      if (!currentUser) {
        console.error('No user logged in - cannot load achievements');
        setLoading(false);
        return;
      }

      // Use local storage for achievements since backend API doesn't exist
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      const userAchievementsKey = getUserSpecificKey('achievements', currentUser.id);

      let storedAchievements = await AsyncStorage.getItem(userAchievementsKey);
      let achievementData: Achievement[] = [];

      if (storedAchievements) {
        achievementData = JSON.parse(storedAchievements);
      } else {
        // Initialize realistic achievements for kids
        achievementData = [
          // 🌟 Getting Started - Easy wins
          {
            _id: 'welcome-hero',
            type: 'exploration',
            title: 'Welcome Hero',
            description: 'First time opening the Achievements section!',
            icon: '🎉',
            progress: 1,
            target: 1,
            completed: true,
            completedAt: new Date().toISOString()
          },
          {
            _id: 'explorer',
            type: 'exploration',
            title: 'App Explorer',
            description: 'Visit 3 different sections of the app',
            icon: '🗺️',
            progress: 1, // Assume they visited achievements
            target: 3,
            completed: false
          },
          {
            _id: 'curious-learner',
            type: 'learning',
            title: 'Curious Learner',
            description: 'Spend time learning about money',
            icon: '🧠',
            progress: 0,
            target: 5, // minutes
            completed: false
          },

          // 💰 Money Management - Realistic goals
          {
            _id: 'first-saver',
            type: 'saving',
            title: 'First Saver',
            description: 'Save your first points in the piggy bank',
            icon: '🐷',
            progress: 0,
            target: 10,
            completed: false
          },
          {
            _id: 'budget-planner',
            type: 'budgeting',
            title: 'Budget Buddy',
            description: 'Create your first budget plan',
            icon: '📊',
            progress: 0,
            target: 1,
            completed: false
          },
          {
            _id: 'charity-helper',
            type: 'giving',
            title: 'Helping Hand',
            description: 'Donate points to charity',
            icon: '🤲',
            progress: 0,
            target: 5,
            completed: false
          },

          // 🎓 Learning Journey - Achievable milestones
          {
            _id: 'quiz-starter',
            type: 'quiz',
            title: 'Quiz Beginner',
            description: 'Complete your first quiz',
            icon: '🧩',
            progress: 0,
            target: 1,
            completed: false
          },
          {
            _id: 'knowledge-seeker',
            type: 'learning',
            title: 'Knowledge Seeker',
            description: 'Complete 3 learning activities',
            icon: '📚',
            progress: 0,
            target: 3,
            completed: false
          },


          // 🏃‍♂️ Consistency - Realistic daily habits
          {
            _id: 'daily-visitor',
            type: 'consistency',
            title: 'Daily Visitor',
            description: 'Visit the app for 3 days in a row',
            icon: '📅',
            progress: 1, // Today
            target: 3,
            completed: false,
            streakCount: 1
          },
          {
            _id: 'week-champion',
            type: 'consistency',
            title: 'Week Champion',
            description: 'Use the app every day for a week',
            icon: '🏆',
            progress: 1,
            target: 7,
            completed: false,
            streakCount: 1
          },

          // 🎯 Goals & Progress - Meaningful achievements
          {
            _id: 'goal-setter',
            type: 'goals',
            title: 'Goal Setter',
            description: 'Create your first savings goal',
            icon: '🎯',
            progress: 0,
            target: 1,
            completed: false
          },
          {
            _id: 'goal-achiever',
            type: 'goals',
            title: 'Goal Achiever',
            description: 'Reach your first savings goal',
            icon: '✅',
            progress: 0,
            target: 1,
            completed: false
          },

          // 🎮 Game Achievements - Fun and engaging
          {
            _id: 'game-completed',
            type: 'games',
            title: 'Game Master',
            description: 'Complete your first game',
            icon: '🎮',
            progress: 0,
            target: 1,
            completed: false
          },

          // 👨‍👩‍👧‍👦 Family & Social - Encouraging sharing
          {
            _id: 'family-helper',
            type: 'chores',
            title: 'Family Helper',
            description: 'Complete your first chore',
            icon: '🧹',
            progress: 0,
            target: 1,
            completed: false
          },
          {
            _id: 'super-helper',
            type: 'chores',
            title: 'Super Helper',
            description: 'Complete 5 chores for the family',
            icon: '🦸‍♂️',
            progress: 0,
            target: 5,
            completed: false
          }
        ];

        await AsyncStorage.setItem(userAchievementsKey, JSON.stringify(achievementData));
      }

      // Update daily streaks based on actual usage tracking
      const today = new Date().toDateString();
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();

      // Get last app usage date
      const lastUsageKey = getUserSpecificKey('lastAppUsage', currentUser.id);
      const lastUsageDate = await AsyncStorage.getItem(lastUsageKey);

      const updatedAchievements = achievementData.map((achievement: Achievement) => {
        if (achievement._id === 'daily-visitor' || achievement._id === 'week-champion') {
          if (!achievement.completed) {
            let newStreakCount = achievement.streakCount || 0;

            if (!lastUsageDate) {
              // First time - start streak at 1
              newStreakCount = 1;
            } else if (lastUsageDate === yesterday) {
              // Consecutive day - increment streak
              newStreakCount = newStreakCount + 1;
            } else if (lastUsageDate !== today) {
              // Missed days or same day - reset to 1
              newStreakCount = 1;
            }
            // If lastUsageDate === today, keep current streak (already counted today)

            achievement.streakCount = newStreakCount;
            achievement.progress = Math.min(newStreakCount, achievement.target);

            if (achievement.progress >= achievement.target && !achievement.completed) {
              achievement.completed = true;
              achievement.completedAt = new Date().toISOString();
            }
          }
        }
        return achievement;
      });

      // Update last usage date to today
      await AsyncStorage.setItem(lastUsageKey, today);

      // Save updated achievements
      await AsyncStorage.setItem(userAchievementsKey, JSON.stringify(updatedAchievements));
      setAchievements(updatedAchievements);

      // Check for newly completed achievements
      const newlyCompleted = updatedAchievements.filter((a: Achievement) =>
        a.completed && !achievements.find(old => old._id === a._id)?.completed
      );

      if (newlyCompleted.length > 0) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      }
    } catch (error) {
      console.error('Error loading achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkMilestones = async () => {
    try {
      setRefreshing(true);
      showMessage('Checking your progress...', 'info');

      const token = await getAuthToken();
      const { getUser } = await import('@/utils/secureStorage');
      const user = await getUser();

      if (!token || !user) {
        showMessage('Unable to check progress. Please log in again.', 'error');
        return;
      }
      const userId = user.id;

      await fetch(`${API_URL}/achievements/${userId}/check-milestones`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      await loadAchievements(); // Refresh achievements
      showMessage('Progress updated successfully!', 'success');
    } catch (error) {
      console.error('Error checking milestones:', error);
      showMessage('Failed to check progress. Please try again.', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  const handleStreakFreeze = (achievementId: string) => {
    // This would use a streak freeze power-up
    Alert.alert('Streak Freeze', 'This would protect your learning streak for one day!');
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        <Text style={[styles.title, { color: themeColors.text }]}>Loading achievements...</Text>
      </View>
    );
  }

  const completedAchievements = achievements.filter(a => a.completed);
  const inProgressAchievements = achievements.filter(a => !a.completed);

  return (
    <>
      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: themeColors.background }]}>
        {showConfetti && <Confetti duration={3000} />}

        <Text style={[styles.title, { color: themeColors.text }]}>🏆 My Achievements</Text>

        {/* Daily Streak Section */}
        <View style={[styles.sectionCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>🔥 Daily Streaks</Text>

          {achievements
            .filter(a => a.type === 'learning_streak')
            .map((achievement) => (
              <View key={achievement._id} style={[styles.streakContainer, { backgroundColor: themeColors.surface }]}>
                <Text style={[styles.streakIcon, { color: themeColors.text }]}>{achievement.icon}</Text>
                <View style={styles.streakInfo}>
                  <Text style={[styles.streakTitle, { color: themeColors.text }]}>
                    {achievement.title}
                  </Text>
                  <Text style={[styles.streakCount, { color: themeColors.accent }]}>
                    {achievement.streakCount || 0} days
                  </Text>
                  <AnimatedProgressBar
                    progress={(achievement.streakCount || 0) / achievement.target}
                    height={6}
                    color={themeColors.accent}
                  />
                </View>

                {/* Power-ups */}
                {achievement.powerUps && achievement.powerUps.length > 0 && (
                  <View style={styles.powerUpsContainer}>
                    {achievement.powerUps.map((powerUp, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[styles.powerUp, { backgroundColor: themeColors.success }]}
                        onPress={() => handleStreakFreeze(achievement._id)}
                      >
                        <Text style={styles.powerUpText}>🛡️ Freeze</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            ))}
        </View>

        {/* Completed Achievements */}
        <View style={[styles.sectionCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            🏅 Completed ({completedAchievements.length})
          </Text>

          <View style={styles.achievementsGrid}>
            {completedAchievements.map((achievement) => (
              <TouchableOpacity
                key={achievement._id}
                style={[styles.achievementBadge, { backgroundColor: themeColors.success }]}
                onPress={() => setSelectedAchievement(achievement)}
              >
                <Text style={styles.badgeIcon}>{achievement.icon}</Text>
                <Text style={styles.badgeTitle}>{achievement.title}</Text>
                <Text style={styles.badgeSubtitle}>Completed!</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* In Progress Achievements */}
        <View style={[styles.sectionCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            📈 In Progress ({inProgressAchievements.length})
          </Text>

          {inProgressAchievements.map((achievement) => (
            <TouchableOpacity
              key={achievement._id}
              style={[styles.progressCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}
              onPress={() => setSelectedAchievement(achievement)}
            >
              <View style={styles.progressHeader}>
                <Text style={styles.progressIcon}>{achievement.icon}</Text>
                <View style={styles.progressInfo}>
                  <Text style={[styles.progressTitle, { color: themeColors.text }]}>
                    {achievement.title}
                  </Text>
                  <Text style={[styles.progressDescription, { color: themeColors.textSecondary }]}>
                    {achievement.description}
                  </Text>
                </View>
              </View>

              <View style={styles.progressBarContainer}>
                <Text style={[styles.progressText, { color: themeColors.text }]}>
                  {achievement.progress} / {achievement.target}
                </Text>
                <AnimatedProgressBar
                  progress={achievement.progress / achievement.target}
                  height={8}
                  color={themeColors.primary}
                  showPercentage
                />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.actionButton, {
            backgroundColor: refreshing ? themeColors.surface : themeColors.primary
          }]}
          onPress={checkMilestones}
          disabled={refreshing}
          accessibilityRole="button"
          accessibilityLabel={refreshing ? "Refreshing achievements" : "Check progress"}
          accessibilityHint="Check for newly completed achievements"
          accessibilityState={{ disabled: refreshing }}
        >
          <Text style={[styles.actionButtonText, {
            color: refreshing ? themeColors.textSecondary : themeColors.card
          }]}>
            {refreshing ? "⏳ Checking..." : "Check Progress"}
          </Text>
        </TouchableOpacity>



        {onClose && (
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Achievement Detail Modal */}
      <Modal
        visible={!!selectedAchievement}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedAchievement(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.card }]}>
            {selectedAchievement && (
              <>
                <Text style={[styles.modalTitle, { color: themeColors.text }]}>
                  {selectedAchievement.icon} {selectedAchievement.title}
                </Text>

                <Text style={[styles.modalDescription, { color: themeColors.textSecondary }]}>
                  {selectedAchievement.description}
                </Text>

                {selectedAchievement.completed ? (
                  <View style={[styles.completedBadge, { backgroundColor: themeColors.success }]}>
                    <Text style={styles.completedText}>✅ Completed!</Text>
                    {selectedAchievement.completedAt && (
                      <Text style={styles.completedDate}>
                        {new Date(selectedAchievement.completedAt).toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                ) : (
                  <View style={styles.progressSection}>
                    <Text style={[styles.progressLabel, { color: themeColors.text }]}>
                      Progress: {selectedAchievement.progress} / {selectedAchievement.target}
                    </Text>
                    <AnimatedProgressBar
                      progress={selectedAchievement.progress / selectedAchievement.target}
                      height={10}
                      color={themeColors.primary}
                      showPercentage
                    />
                  </View>
                )}

                {selectedAchievement.streakCount && (
                  <Text style={[styles.modalStreakInfo, { color: themeColors.accent }]}>
                    🔥 Current streak: {selectedAchievement.streakCount} days
                  </Text>
                )}

                <TouchableOpacity
                  style={styles.closeModalButton}
                  onPress={() => setSelectedAchievement(null)}
                >
                  <Text style={styles.closeModalText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  sectionCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    width: '100%',
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  streakIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  streakInfo: {
    flex: 1,
  },
  streakTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  streakCount: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  powerUpsContainer: {
    marginLeft: 12,
  },
  powerUp: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 4,
  },
  powerUpText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  achievementBadge: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  badgeTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  badgeSubtitle: {
    fontSize: 12,
    color: 'white',
    textAlign: 'center',
    opacity: 0.9,
  },
  progressCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  progressInfo: {
    flex: 1,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  progressDescription: {
    fontSize: 14,
  },
  progressBarContainer: {
    marginTop: 8,
  },
  progressText: {
    fontSize: 12,
    marginBottom: 4,
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    marginVertical: 10,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeButton: {
    backgroundColor: '#e9ecef',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 10,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 20,
    padding: 20,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalDescription: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  completedBadge: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  completedText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  completedDate: {
    fontSize: 14,
    color: 'white',
    opacity: 0.9,
  },
  progressSection: {
    marginBottom: 16,
  },
  progressLabel: {
    fontSize: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalStreakInfo: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: 'bold',
  },
  closeModalButton: {
    backgroundColor: '#6c757d',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 16,
  },
  closeModalText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },

});

export default AchievementSystem;
