import { API_URL } from '@/utils/config';
import { getAuthToken } from '@/utils/secureStorage';
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

export const AchievementSystem: React.FC<AchievementSystemProps> = ({ onClose }) => {
  const { themeColors } = useTheme();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    try {
      const token = await getAuthToken();
      const { getUser } = await import('@/utils/secureStorage');
      const user = await getUser();

      if (!token || !user) return;
      const userId = user.id;

      // Initialize achievements if not already done
      await fetch(`${API_URL}/achievements/${userId}/initialize`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      // Load achievements
      const response = await fetch(`${API_URL}/achievements/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setAchievements(data);

        // Check for newly completed achievements
        const newlyCompleted = data.filter((a: Achievement) =>
          a.completed && !achievements.find(old => old._id === a._id)?.completed
        );

        if (newlyCompleted.length > 0) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 3000);
        }
      }
    } catch (error) {
      console.error('Error loading achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkMilestones = async () => {
    try {
      const token = await getAuthToken();
      const { getUser } = await import('@/utils/secureStorage');
      const user = await getUser();

      if (!token || !user) return;
      const userId = user.id;

      await fetch(`${API_URL}/achievements/${userId}/check-milestones`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      loadAchievements(); // Refresh achievements
    } catch (error) {
      console.error('Error checking milestones:', error);
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
              <View key={achievement._id} style={styles.streakContainer}>
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
          style={[styles.actionButton, { backgroundColor: themeColors.primary }]}
          onPress={checkMilestones}
        >
          <Text style={[styles.actionButtonText, { color: themeColors.card }]}>Check Progress</Text>
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
    backgroundColor: '#fff3cd',
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
