// Achievement tracking utility
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from './config';
// Track learning streak
export async function trackLearningStreak() {
  try {
    const token = await getAuthToken();
    const storedUser = await AsyncStorage.getItem('user');

    if (!token || !storedUser) return;

    const user = JSON.parse(storedUser);
    const userId = user._id;

    await fetch(`${API_URL}/achievements/${userId}/streak`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
    });
  } catch (error) {
    console.error('Error tracking learning streak:', error);
  }
}

// Check and update milestone achievements
export async function checkMilestones() {
  try {
    const token = await getAuthToken();
    const storedUser = await AsyncStorage.getItem('user');

    if (!token || !storedUser) return;

    const user = JSON.parse(storedUser);
    const userId = user._id;

    await fetch(`${API_URL}/achievements/${userId}/check-milestones`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
    });
  } catch (error) {
    console.error('Error checking milestones:', error);
  }
}

// Update achievement progress
export async function updateAchievementProgress(achievementType, progress) {
  try {
    const token = await getAuthToken();
    const storedUser = await AsyncStorage.getItem('user');

    if (!token || !storedUser) return;

    const user = JSON.parse(storedUser);
    const userId = user._id;

    // First get the achievement
    const achievementsResponse = await fetch(`${API_URL}/achievements/${userId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (achievementsResponse.ok) {
      const achievements = await achievementsResponse.json();
      const achievement = achievements.find(a => a.type === achievementType);

      if (achievement && !achievement.completed) {
        await fetch(`${API_URL}/achievements/${achievement._id}/progress`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ progress }),
        });
      }
    }
  } catch (error) {
    console.error('Error updating achievement progress:', error);
  }
}

// Track quiz answers
export async function trackQuizAnswer(correct) {
  if (correct) {
    await updateAchievementProgress('quiz_master', 1); // Increment by 1
  }
}

// Track chore completion
export async function trackChoreCompletion() {
  await updateAchievementProgress('chores_completed', 1); // Increment by 1
}

// Track goal completion
export async function trackGoalCompletion() {
  await updateAchievementProgress('goals_achieved', 1); // Increment by 1
}

// Track savings
export async function trackSavings(points) {
  await updateAchievementProgress('points_saved', points);
}
