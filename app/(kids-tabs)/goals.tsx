import GoalTemplates from '@/components/GoalTemplates';
import HelpModal from '@/components/HelpModal';
import AnimatedCircularProgress from '@/components/animations/AnimatedCircularProgress';
import { API_URL } from '@/utils/config';
import { useCurrency } from '@/utils/currencyContext';
import { handleApiError } from '@/utils/errorHandler';
import NotificationService from '@/utils/notificationService';
import { getAuthToken, getUserData } from '@/utils/secureStorage';
import { useTheme } from '@/utils/themeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

const createStyles = (themeColors: any) => StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 4,
    backgroundColor: themeColors.background,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 22,
    marginTop: 6,
    color: themeColors.primary,
  },
  sectionCard: {
    flex: 1,
    backgroundColor: themeColors.card,
    borderRadius: 14,
    marginBottom: 16,
    padding: 18,
    minWidth: 300,
    width: "97%",
    maxWidth: 520,
    alignSelf: 'center',
    elevation: 2,
    shadowColor: themeColors.border,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
    color: themeColors.text,
  },
  placeholder: {
    color: themeColors.textSecondary, fontStyle: "italic", fontSize: 15,
    marginBottom: 2, marginTop: 2, minHeight: 26
  },
  statusMessage: {
    fontSize: 15, fontWeight: "600", marginTop: 3, color: themeColors.success
  },
  refreshBtn: {
    backgroundColor: themeColors.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  refreshBtnDisabled: {
    backgroundColor: themeColors.surface,
  },
  refreshBtnText: {
    color: themeColors.card,
    fontWeight: "bold",
    fontSize: 12,
  },
  refreshBtnTextDisabled: {
    color: themeColors.textSecondary,
  },
});

export default function GoalsScreen() {
  const { themeColors } = useTheme();
  const styles = createStyles(themeColors);
  const router = useRouter();
  const [helpModalVisible, setHelpModalVisible] = useState(false);

  return (
    <View style={styles.container}>
      <View style={{ width: '100%', maxWidth: 520, marginBottom: 16, marginTop: 6 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <TouchableOpacity
            style={{
              backgroundColor: themeColors.surface,
              borderRadius: 16,
              paddingHorizontal: 16,
              paddingVertical: 12,
              elevation: 2,
              minWidth: 48,
              minHeight: 48,
              justifyContent: 'center',
              alignItems: 'center',
            }}
            onPress={() => router.push('./')}
            accessibilityRole="button"
            accessibilityLabel="Go back to home screen"
            accessibilityHint="Double tap to return to the main dashboard"
          >
            <Text style={{ color: themeColors.text, fontWeight: 'bold', fontSize: 14 }}>⬅️ Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              backgroundColor: themeColors.accent,
              borderRadius: 16,
              paddingHorizontal: 16,
              paddingVertical: 12,
              elevation: 2,
              minWidth: 48,
              minHeight: 48,
              justifyContent: 'center',
              alignItems: 'center',
            }}
            onPress={() => setHelpModalVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Help and information"
            accessibilityHint="Double tap to open help guide for goals and rewards"
          >
            <Text style={{ color: themeColors.card, fontWeight: 'bold', fontSize: 14 }}>❓ Help</Text>
          </TouchableOpacity>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={[styles.title, { color: themeColors.primary }]}>🎯 My Goals</Text>
        </View>
      </View>

      <KidGoalsRewardsSection />

      {/* Help Modal */}
      <HelpModal
        visible={helpModalVisible}
        onClose={() => setHelpModalVisible(false)}
        title="🎯 My Goals - Help"
        tabs={[
          {
            title: "Dream Big Adventures! 🌟",
            content: [
              {
                type: "text",
                text: "Hey there, dream chaser! 🎯 Goals are your special treasure hunts to save for amazing things you really, really want! Like a shiny new bike or your favorite game!",
                icon: "🎯"
              },
              {
                type: "bullet",
                text: "💰 Save your points in special money pots"
              },
              {
                type: "bullet",
                text: "👨‍👩‍👧‍👦 Your parents help set up these fun challenges"
              },
              {
                type: "bullet",
                text: "📊 Watch your progress grow like a superhero power bar!"
              },
              {
                type: "highlight",
                text: "Hit your goal and shout 'I did it!' for parent approval! 🏆",
                icon: "🏆"
              }
            ]
          },
          {
            title: "My Goal Quest Board! 📋",
            content: [
              {
                type: "text",
                text: "Your goal adventures appear here - let's see what quests you're on!",
                icon: "📋"
              },
              {
                type: "bullet",
                text: "Active - Your current missions in progress ⚔️"
              },
              {
                type: "bullet",
                text: "Completed - Victories you've already won! 🎊"
              },
              {
                type: "bullet",
                text: "Shows your treasure collected vs. mission target"
              },
              {
                type: "bullet",
                text: "Yellow = Waiting for your parent's champion stamp ⏳"
              },
              {
                type: "highlight",
                text: "Tap 'Claim' when you conquer your goal - you're a winner! 🎉",
                icon: "🎉"
              }
            ]
          },
          {
            title: "Claim Your Victories! 🏆",
            content: [
              {
                type: "text",
                text: "Ready to celebrate your achievements?",
                icon: "🤝"
              },
              {
                type: "bullet",
                text: "🖱️ Tap 'Claim' when you complete your goal"
              },
              {
                type: "bullet",
                text: "⏳ Shows 'Pending...' while waiting for approval"
              },
              {
                type: "bullet",
                text: "👨‍👩‍👧‍👦 Parent gives the official victory stamp!"
              },
              {
                type: "bullet",
                text: "Goal gets marked as completed when approved!"
              },
              {
                type: "highlight",
                text: "Be patient and kind - good things come to goal crushers! 😊",
                icon: "⏳"
              }
            ]
          }
        ]}
      />
    </View>
  );
}

// --- KidGoalsRewardsSection (loads from database, allows claiming) ---
import { useStaleDataWarning } from "@/utils/useStaleDataWarning";

function KidGoalsRewardsSection() {
  const { themeColors } = useTheme();
  const styles = createStyles(themeColors);
  const { formatAmount } = useCurrency();
  const [goals, setGoals] = useState<any[]>([]);
  const [rewards, setRewards] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  // Tabs/filter for rewards
  const [rewardsTab, setRewardsTab] = useState<'Available' | 'Claimed'>('Available');
  const [showRewardsArchive, setShowRewardsArchive] = useState(false);
  // Tabs for goal filtering
  const [tab, setTab] = useState<'Active' | 'Completed'>('Active');
  // Show archived completed
  const [showArchive, setShowArchive] = useState(false);
  // Goal templates modal
  const [showTemplates, setShowTemplates] = useState(false);
  const [showStaleWarning, , markRefreshed] = useStaleDataWarning();

  // Handle template selection
  const handleTemplateSelect = async (template: any) => {
    try {
      const token = await getAuthToken();
      const user = await getUserData();

      if (!token || !user) {
        Alert.alert('Error', 'Not authenticated.');
        return;
      }

      // Create goal from template
      const jarAllocations = template.jarAllocations as Record<string, number>;
      const primaryJar = Object.entries(jarAllocations).reduce((a, b) => jarAllocations[a[0]] > jarAllocations[b[0]] ? a : b)[0]; // Use jar with highest allocation

      const goalData = {
        childId: user.id,
        name: template.name,
        targetAmount: template.targetAmount,
        jar: primaryJar,
        description: template.description,
        deadline: new Date(Date.now() + template.duration * 24 * 60 * 60 * 1000).toISOString(), // Convert days to milliseconds
        templateId: template.id,
        milestones: template.milestones
      };

      console.log('[GOALS FRONTEND] Creating goal with data:', goalData);
      console.log('[GOALS FRONTEND] Making request to:', `${API_URL}/goals`);
      console.log('[GOALS FRONTEND] Token (first 20 chars):', token.substring(0, 20));

      const response = await fetch(`${API_URL}/goals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(goalData)
      });

      console.log('[GOALS FRONTEND] Response status:', response.status);
      console.log('[GOALS FRONTEND] Response ok:', response.ok);

      if (!response.ok) {
        let errorMessage = 'Failed to create goal from template.';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
          console.error('[GOALS FRONTEND] Error response JSON:', errorData);
        } catch {
          try {
            const errorText = await response.text();
            errorMessage = errorText || errorMessage;
            console.error('[GOALS FRONTEND] Error response text:', errorText);
          } catch {
            console.error('[GOALS FRONTEND] Could not read error response');
          }
        }
        Alert.alert('Error', `${response.status} ${response.statusText}: ${errorMessage}`);
        return;
      }

      const newGoal = await response.json();

      // Add to local state
      setGoals(prevGoals => [newGoal, ...prevGoals]);

      setShowTemplates(false);
      setMsg(`Goal "${template.name}" created successfully!`);
      setTimeout(() => setMsg(""), 5000);

    } catch (error) {
      console.error('Error creating goal from template:', error);
      Alert.alert('Error', 'Failed to create goal from template.');
    }
  };

  // Helper: get goal created date robustly
  function getGoalCreatedDate(g: any): Date {
    if (g.createdAt && typeof g.createdAt === "string") return new Date(g.createdAt);
    if (g._id && typeof g._id === "string" && g._id.length >= 8) {
      const timestamp = parseInt(g._id.slice(0, 8), 16) * 1000;
      return new Date(timestamp);
    }
    return new Date();
  }

  // Helper: get user-friendly jar name
  function getJarDisplayName(jar: string): string {
    const jarNames: { [key: string]: string } = {
      current: 'Pocket Money Pot',
      save: 'Savings Pot',
      spend: 'Spending Pot',
      donate: 'Help Others Pot',
      invest: 'Grow Money Pot'
    };
    return jarNames[jar] || jar;
  }

  // Load goals, rewards, and requests on component mount
  const loadGoalsAndRewards = async () => {
    try {
      const token = await getAuthToken();
      const user = await getUserData();

      if (!token || !user) {
        setLoading(false);
        return;
      }
      // Always fetch freshest user data from backend (not AsyncStorage!)
      const userId = user.id;
      const userRes = await fetch(`${API_URL}/users/${user.id || user._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!userRes.ok) {
        await handleApiError(userRes, { showError: (msg) => Alert.alert('Error', msg), feature: 'Goals - User Data' });
        setLoading(false);
        return;
      }
      const freshUserData = await userRes.json();
      setUserData(freshUserData);

      // Load all approval requests first (needed for goal status logic)
      const reqRes = await fetch(`${API_URL}/requests/${userId}`);
      let requestsData: any[] = [];
      if (reqRes.ok) {
        requestsData = await reqRes.json();
        setRequests(requestsData);
      }

      // Load goals
      const goalsResponse = await fetch(`${API_URL}/goals/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (goalsResponse.ok) {
        const goalsData = await goalsResponse.json();
        // Support for backend returning { data: [...] } OR a direct array (legacy)
        const goalsArray = Array.isArray(goalsData?.data) ? goalsData.data : Array.isArray(goalsData) ? goalsData : [];
        console.log('[KIDS GOALS] Fetched goals from server:', JSON.stringify(goalsArray, null, 2));
        // Security check: All loaded goals must belong to this user (kid)
        if (
          user &&
          goalsArray &&
          goalsArray.length > 0 &&
          goalsArray.some((g: any) => (g.childId && g.childId !== user.id))
        ) {
          const { clearSensitiveAppData } = await import('@/utils/secureStorage');
          await clearSensitiveAppData();
          if (typeof window !== 'undefined' && window.location) window.location.href = '/login';
          return;
        }
        // Check for goal progress milestones and send notifications
        if (userData && goalsArray.length > 0) {
          for (const goal of goalsArray) {
            const jarPoints = userData[goal.jar + "Points"] || 0;
            const progressPercent = Math.floor((jarPoints / goal.targetAmount) * 100);

            // Check for milestone achievements (25%, 50%, 75%, 90%)
            const milestones = [25, 50, 75, 90];
            for (const milestone of milestones) {
              if (progressPercent >= milestone && progressPercent < milestone + 5) { // Allow some tolerance
                // Check if we haven't notified about this milestone recently
                const milestoneKey = `goal_${goal._id}_milestone_${milestone}`;
                const lastNotified = await AsyncStorage.getItem(milestoneKey);
                const now = Date.now();

                if (!lastNotified || (now - parseInt(lastNotified)) > 24 * 60 * 60 * 1000) { // 24 hours
                  NotificationService.scheduleGoalMilestoneNotification(goal.name, milestone);
                  await AsyncStorage.setItem(milestoneKey, now.toString());
                }
                break; // Only send one milestone notification per goal check
              }
            }

            // Check for goal completion
            if (jarPoints >= goal.targetAmount && goal.status === "active") {
              const completionKey = `goal_${goal._id}_completed`;
              const lastNotified = await AsyncStorage.getItem(completionKey);

              if (!lastNotified) {
                NotificationService.scheduleGoalMilestoneNotification(goal.name, 100, true);
                await AsyncStorage.setItem(completionKey, Date.now().toString());
              }
            }

            // Check for deadline reminders
            if (goal.deadline) {
              const deadline = new Date(goal.deadline);
              const now = new Date();
              const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

              if (daysLeft > 0 && daysLeft <= 7) {
                const reminderKey = `goal_${goal._id}_deadline_${daysLeft}`;
                const lastNotified = await AsyncStorage.getItem(reminderKey);
                const now = Date.now();

                if (!lastNotified || (now - parseInt(lastNotified)) > 24 * 60 * 60 * 1000) { // 24 hours
                  NotificationService.scheduleGoalDeadlineReminder(goal.name, daysLeft);
                  await AsyncStorage.setItem(reminderKey, now.toString());
                }
              }
            }

            // Check for encouragement reminders for inactive goals
            const lastActivityKey = `goal_${goal._id}_last_activity`;
            const lastActivity = await AsyncStorage.getItem(lastActivityKey);
            const now = Date.now();

            if (lastActivity) {
              const daysSinceActivity = Math.floor((now - parseInt(lastActivity)) / (1000 * 60 * 60 * 24));
              if (daysSinceActivity >= 3 && goal.status === "active") {
                const encouragementKey = `goal_${goal._id}_encouragement_${daysSinceActivity}`;
                const lastEncouraged = await AsyncStorage.getItem(encouragementKey);

                if (!lastEncouraged || (now - parseInt(lastEncouraged)) > 24 * 60 * 60 * 1000) {
                  NotificationService.scheduleGoalEncouragementNotification(goal.name, daysSinceActivity);
                  await AsyncStorage.setItem(encouragementKey, now.toString());
                }
              }
            }

            // Update last activity timestamp
            await AsyncStorage.setItem(lastActivityKey, now.toString());
          }
        }

        // Goals now have the correct status from the database, so we can use them directly
        setGoals(goalsArray);
      }

      // Load available rewards
      const rewardsResponse = await fetch(`${API_URL}/rewards/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (rewardsResponse.ok) {
        const rewardsData = await rewardsResponse.json();
        setRewards(rewardsData);
      }
    } catch (error) {
      console.error('Error loading goals and rewards:', error);
      Alert.alert('Error', 'Failed to load goals and rewards.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGoalsAndRewards();

    // Smart polling with exponential backoff and activity detection
    const { AppState } = require('react-native');
    let pollInterval: NodeJS.Timeout | null = null;
    let currentInterval = 30000; // Start at 30 seconds (much better than 3!)
    let isPolling = true;
    let lastActivityTime = Date.now();

    // Exponential backoff: 30s -> 60s -> 120s -> 240s -> max 600s (10 minutes)
    const getNextInterval = () => Math.min(currentInterval * 2, 600000);

    // Reset polling interval on user activity
    const resetPollingInterval = () => {
      lastActivityTime = Date.now();
      currentInterval = 30000; // Reset to base 30 seconds
      if (pollInterval) {
        clearInterval(pollInterval);
      }
      startPolling();
    };

    // Start polling with current interval
    const startPolling = () => {
      if (!isPolling) return;

      pollInterval = setInterval(() => {
        // Only poll if app is active and it's been at least 10 seconds since last activity
        if (AppState.currentState === 'active' && (Date.now() - lastActivityTime) > 10000) {
          loadGoalsAndRewards();
          currentInterval = getNextInterval(); // Exponential backoff

          // Restart with new interval
          if (pollInterval) {
            clearInterval(pollInterval);
            startPolling();
          }
        }
      }, currentInterval);
    };

    // Start initial polling
    startPolling();

    // App state listener - pause polling when backgrounded
    let currentState = AppState.currentState;
    const appStateSubscription = AppState.addEventListener('change', (nextState: any) => {
      if (currentState.match(/inactive|background/) && nextState === 'active') {
        // App came back to foreground - refresh immediately and reset polling
        loadGoalsAndRewards();
        resetPollingInterval();
      } else if (nextState.match(/inactive|background/)) {
        // App went to background - pause polling
        isPolling = false;
        if (pollInterval) {
          clearInterval(pollInterval);
          pollInterval = null;
        }
      } else if (nextState === 'active') {
        // App became active - resume polling
        isPolling = true;
        resetPollingInterval();
      }
      currentState = nextState;
    });

    return () => {
      isPolling = false;
      if (pollInterval) {
        clearInterval(pollInterval);
      }
      appStateSubscription.remove();
    };
  }, []);

  // Also refresh when screen comes into focus (for navigation)
  useFocusEffect(
    React.useCallback(() => {
      loadGoalsAndRewards();
    }, [])
  );

  const handleClaimGoal = async (goalId: string, goalName: string, jar: string, targetAmount: number) => {
    try {
      setClaiming(goalId);

      const token = await getAuthToken();
      const user = await getUserData();

      if (!token || !user) {
        Alert.alert('Error', 'Not authenticated.');
        return;
      }

      // Submit a goal completion request to parent
      const requestData = {
        userId: user.id, // Use string ID for request routing
        type: 'goal-completion',
        name: `Goal: ${goalName}`,
        amount: targetAmount,
        reason: `I have completed my goal to save ${targetAmount} points in the ${jar} jar!`,
        goalId: goalId,
      };

      const response = await fetch(`${API_URL}/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        // Handle non-JSON responses (like plain text for rate limiting)
        let errorMessage = 'Failed to submit goal completion request.';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          // If JSON parsing fails, use default message
        }
        Alert.alert('Error', errorMessage);
        return;
      }

      // Update local state to show goal as pending
      setGoals(goals.map(g =>
        g._id === goalId ? { ...g, status: 'pending' } : g
      ));

      // Immediately refresh user data to show updated pending points
      await loadGoalsAndRewards();

      setMsg("Goal completion request submitted to parent!");
      setTimeout(() => setMsg(""), 5000);

    } catch (error) {
      console.error('Error submitting goal completion request:', error);
      Alert.alert('Error', 'Failed to submit request.');
    } finally {
      setClaiming(null);
    }
  };

  const handleClaimReward = async (rewardId: string) => {
    try {
      setClaiming(rewardId);

      const token = await getAuthToken();
      const user = await getUserData();
      if (!token || !user) {
        Alert.alert('Error', 'Not authenticated.');
        return;
      }
      const reward = rewards.find(r => r._id === rewardId);
      if (!reward) {
        Alert.alert('Error', 'Reward not found.');
        return;
      }
      // For rewards, claiming means PATCHing reward to mark as claim requested (purchased: true),
      // backend sets available: false, purchased: false (pending), and creates ApprovalRequest
      const response = await fetch(`${API_URL}/rewards/${rewardId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ purchased: true }),
      });

      if (!response.ok) {
        // Handle non-JSON responses (like plain text for rate limiting)
        let errorMessage = 'Failed to claim reward.';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          // If JSON parsing fails, use default message
        }
        Alert.alert('Error', errorMessage);
        return;
      }

      // Fetch updated requests and rewards immediately for pending status
      try {
        const token2 = await getAuthToken();
        const user2 = await getUserData();
        if (user2) {
          // Requests
          const reqRes = await fetch(`${API_URL}/requests/${user2.id}`);
          if (reqRes.ok) setRequests(await reqRes.json());
          // Rewards
          const rewardsResponse = await fetch(`${API_URL}/rewards/${user2.id}`, {
            headers: { 'Authorization': `Bearer ${token2}` },
          });
          if (rewardsResponse.ok) {
            const rewardsData = await rewardsResponse.json();
            setRewards(rewardsData);
          }
        }
      } catch {}
      setMsg("Reward claim submitted for parent approval.");
      setTimeout(() => setMsg(""), 5000);

    } catch (error) {
      console.error('Error claiming reward:', error);
      Alert.alert('Error', 'Failed to claim reward.');
    } finally {
      setClaiming(null);
    }
  };

  const handleDeleteGoal = async (goalId: string, goalName: string) => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`Are you sure you want to delete "${goalName}"? This action cannot be undone.`);
      if (!confirmed) return;
      try {
        const token = await getAuthToken();
        const user = await getUserData();
        if (!token || !user) {
          Alert.alert('Error', 'Not authenticated.');
          return;
        }

        const response = await fetch(`${API_URL}/goals/${goalId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          let errorMessage = 'Failed to delete goal.';
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          } catch {
            // If JSON parsing fails, use default message
          }
          Alert.alert('Error', errorMessage);
          return;
        }

        setGoals(goals.filter(g => g._id !== goalId));
        setMsg(`Goal "${goalName}" deleted successfully.`);
        setTimeout(() => setMsg(""), 5000);

      } catch (error) {
        console.error('Error deleting goal:', error);
        Alert.alert('Error', 'Failed to delete goal.');
      }
    } else {
      Alert.alert(
        'Delete Goal',
        `Are you sure you want to delete "${goalName}"? This action cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                const token = await getAuthToken();
                const user = await getUserData();
                if (!token || !user) {
                  Alert.alert('Error', 'Not authenticated.');
                  return;
                }

                const response = await fetch(`${API_URL}/goals/${goalId}`, {
                  method: 'DELETE',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                  },
                });

                if (!response.ok) {
                  let errorMessage = 'Failed to delete goal.';
                  try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                  } catch {
                    // If JSON parsing fails, use default message
                  }
                  Alert.alert('Error', errorMessage);
                  return;
                }

                setGoals(goals.filter(g => g._id !== goalId));
                setMsg(`Goal "${goalName}" deleted successfully.`);
                setTimeout(() => setMsg(""), 5000);

              } catch (error) {
                console.error('Error deleting goal:', error);
                Alert.alert('Error', 'Failed to delete goal.');
              }
            }
          }
        ]
      );
    }
  };

  if (loading) {
    return (
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Goals & Gifts</Text>
        <Text style={styles.placeholder}>Loading goals and rewards...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: themeColors.card, borderRadius: 14, marginBottom: 16, alignSelf: 'center', maxWidth: 520, width: "97%", shadowColor: themeColors.border, elevation: 2 }}
      contentContainerStyle={{ padding: 18, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>My Goals</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity
            style={[styles.refreshBtn, { backgroundColor: themeColors.secondary, paddingHorizontal: 12, paddingVertical: 6 }]}
            onPress={() => setShowTemplates(true)}
            accessibilityRole="button"
            accessibilityLabel="Choose goal template"
            accessibilityHint="Double tap to browse and select from goal templates"
          >
            <Text style={[styles.refreshBtnText, { color: themeColors.card, fontSize: 12 }]}>
              🎯 Template
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.refreshBtn, { backgroundColor: loading ? themeColors.surface : themeColors.primary }]}
            onPress={() => loadGoalsAndRewards()}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel={loading ? "Refreshing goals and rewards" : "Refresh goals and rewards"}
            accessibilityHint="Double tap to reload your goals and available rewards"
            accessibilityState={{ disabled: loading }}
          >
            <Text style={[styles.refreshBtnText, { color: loading ? themeColors.textSecondary : themeColors.card }]}>
              {loading ? 'Refreshing...' : '🔄 Refresh'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      {/* Tabs for results (ALWAYS always rendered) */}
      <View style={{ flexDirection: "row", justifyContent: "center", marginBottom: 10 }}>
        {["Active", "Completed"].map(t => (
          <TouchableOpacity
            key={t}
            style={{
              backgroundColor: tab === t ? themeColors.secondary : themeColors.surface,
              paddingHorizontal: 15,
              paddingVertical: 6,
              borderRadius: 18,
              marginHorizontal: 6,
            }}
            onPress={() => { setTab(t as "Active" | "Completed"); setShowArchive(false); }}
            accessibilityRole="tab"
            accessibilityLabel={`${t} goals`}
            accessibilityHint={`Show ${t.toLowerCase()} goals`}
            accessibilityState={{ selected: tab === t }}
          >
            <Text style={{ color: tab === t ? themeColors.card : themeColors.text, fontWeight: tab === t ? "bold" : "600", fontSize: 15 }}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {/* Show per tab, empty state, or results as appropriate */}
      {(() => {
        // 1. Identify status for each goal
        function getGoalStatus(g: any) {
          if (g.status === "completed" || g.completed === true) return "completed";
          if (g.status === "pending") return "pending";
          if (g.status === "expired") return "expired";
          return "active";
        }

        // 2. Best available completion/comparison date
        function getGoalCompletionDate(g: any): Date {
          if (g.completedAt && typeof g.completedAt === "string") return new Date(g.completedAt);
          // fallback: backend may only give createdAt
          return getGoalCreatedDate(g);
        }

        // 3. Split into active/completed as per status, then slice by date for completed archive
        let activeGoals = goals.filter(g =>
          getGoalStatus(g) !== "completed" && getGoalStatus(g) !== "expired"
        ).sort((a, b) => getGoalCreatedDate(b).getTime() - getGoalCreatedDate(a).getTime());
        let completedGoalsAll = goals.filter(g => getGoalStatus(g) === "completed" || getGoalStatus(g) === "expired");

        if (tab === "Active") {
          return (
            <FlatList
              ListHeaderComponent={
                <>
                  {activeGoals.length === 0 ? (
                    <Text style={styles.placeholder}>No active goals.</Text>
                  ) : null}
                </>
              }
              data={activeGoals}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => renderGoal(item)}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 10 }}
              style={{ flex: 1 }}
              scrollEnabled={false }
            />
          );
        }

        // "Completed": last 90d, with archive logic
        const now = new Date();
        const ninetyDaysAgo = new Date(now);
        ninetyDaysAgo.setDate(now.getDate() - 90);
        const completedRecent = completedGoalsAll.filter(g => getGoalCompletionDate(g) >= ninetyDaysAgo);
        const completedArchived = completedGoalsAll.filter(g => getGoalCompletionDate(g) < ninetyDaysAgo);
        let completedGoals = completedRecent.sort((a, b) =>
          getGoalCompletionDate(b).getTime() - getGoalCompletionDate(a).getTime()
        );
        if (showArchive) {
          completedGoals = [...completedRecent, ...completedArchived].sort((a, b) =>
            getGoalCompletionDate(b).getTime() - getGoalCompletionDate(a).getTime()
          );
        }
        if (completedGoals.length === 0)
          return <Text style={styles.placeholder}>No completed goals in the past 90 days.</Text>;
        return (
          <>
            <FlatList
              data={completedGoals}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => renderGoal(item)}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 10 }}
              style={{ flex: 1 }}
              scrollEnabled={false }
            />
            {completedArchived.length > 0 && !showArchive && (
              <TouchableOpacity
                style={{
                  marginTop: 12,
                  alignSelf: "center",
                  backgroundColor: themeColors.accent + "22",
                  paddingHorizontal: 20,
                  paddingVertical: 8,
                  borderRadius: 16
                }}
                onPress={() => setShowArchive(true)}
              >
                <Text style={{ color: themeColors.primary, fontWeight: "600" }}>Show All Completed Goals</Text>
              </TouchableOpacity>
            )}
            {completedArchived.length > 0 && showArchive && (
              <TouchableOpacity
                style={{
                  marginTop: 10,
                  alignSelf: "center",
                  backgroundColor: themeColors.surface,
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                  borderRadius: 16
                }}
                onPress={() => setShowArchive(false)}
              >
                <Text style={{ color: themeColors.primary, fontWeight: "500" }}>Show Only Last 90 Days</Text>
              </TouchableOpacity>
            )}
          </>
        );
      })()}

      {/* Individual goal card rendering */}
      {/** Renders are moved into renderGoal function for code clarity **/}




      {msg ? <Text style={styles.statusMessage}>{msg}</Text> : null}

      {/* Goal Templates Modal */}
      <GoalTemplates
        visible={showTemplates}
        onSelect={handleTemplateSelect}
        onClose={() => setShowTemplates(false)}
      />
    </ScrollView>
  );


  // Individual goal renderer (uses parent logic for claim display, etc.)
  function renderGoal(g: any) {
    const jarPoints = userData ? userData[g.jar + "Points"] || 0 : 0;
    const pendingJarPoints = userData ? userData["pending" + g.jar.charAt(0).toUpperCase() + g.jar.slice(1) + "Points"] || 0 : 0;
    const availableJarPoints = jarPoints - pendingJarPoints;
    const isCompleted = g.completed === true || g.status === "completed";
    const isPending = g.status === "pending" && !isCompleted;
    const isExpired = g.status === "expired";
    const canClaim = availableJarPoints >= g.targetAmount && g.status === "active" && !isCompleted && !isExpired;

    let buttonText = "Claim";
    let buttonColor = "#bbfbc1";

    if (isCompleted) {
      buttonText = "Completed!";
      buttonColor = "#ddd";
    } else if (isPending) {
      buttonText = "Pending...";
      buttonColor = "#ffe58b";
    } else if (canClaim) {
      buttonText = claiming === g._id ? "Claiming..." : "Claim";
      buttonColor = "#bbfbc1";
    } else {
      buttonText = "Need More Points";
      buttonColor = "#ccc";
    }

    return (
      <View
        key={g._id}
        style={{
          backgroundColor: isCompleted ? themeColors.success + "15" : isPending ? themeColors.warning + "33" : isExpired ? themeColors.error + "15" : themeColors.surface,
          marginBottom: 7,
          borderRadius: 6,
          padding: 12,
          borderWidth: 1,
          borderColor: isCompleted ? themeColors.success : isPending ? themeColors.warning : isExpired ? themeColors.error : themeColors.border,
        }}
        accessibilityLabel={`Goal: ${g.name}. ${isCompleted ? 'Completed' : isPending ? 'Pending approval' : isExpired ? 'Expired' : 'Active'}. Progress: ${formatAmount(jarPoints)} out of ${formatAmount(g.targetAmount)} points.`}
        accessibilityHint={canClaim ? 'Double tap to claim this goal' : isCompleted ? 'This goal has been completed' : isPending ? 'Waiting for parent approval' : isExpired ? 'This goal has expired' : 'You need more points to claim this goal'}
      >
        <View style={{ marginBottom: 8 }}>
          <Text style={{ fontWeight: "bold", color: themeColors.text, fontSize: 16 }} numberOfLines={1} ellipsizeMode="tail">{g.name}</Text>
          {g.description && (
            <Text style={{ fontSize: 14, color: themeColors.textSecondary, marginTop: 4 }} numberOfLines={2} ellipsizeMode="tail">
              {g.description}
            </Text>
          )}
        </View>

        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View style={{ flex: 2 }}>
            <Text style={{ fontSize: 14, color: themeColors.textSecondary }}>
              Save in: {getJarDisplayName(g.jar)}
            </Text>
            {g.deadline && (
              <Text style={{ fontSize: 12, color: themeColors.textSecondary, marginTop: 2 }}>
                Deadline: {new Date(g.deadline).toLocaleDateString()}
              </Text>
            )}
            {isPending && (
              <Text style={{ fontSize: 11, color: themeColors.warning, fontStyle: "italic", marginTop: 2 }}>
                Awaiting parent approval
              </Text>
            )}
            {isExpired && (
              <Text style={{ fontSize: 11, color: themeColors.error, fontStyle: "italic", marginTop: 2 }}>
                Goal expired ⏰
              </Text>
            )}
            {isCompleted && (
              <Text style={{ fontSize: 11, color: themeColors.success, fontStyle: "italic", marginTop: 2 }}>
                Goal achieved! 🎉
              </Text>
            )}
          </View>

          <View style={{ alignItems: "flex-end" }}>
            {g.status === "active" && !isCompleted && !isExpired ? (
              <View style={{ alignItems: "center", marginBottom: 4 }}>
                <AnimatedCircularProgress
                  size={50}
                  width={6}
                  fill={Math.min((jarPoints / g.targetAmount) * 100, 100)}
                  tintColor={canClaim ? themeColors.primary : themeColors.textSecondary}
                  backgroundColor={themeColors.border}
                  duration={1500}
                />
                <Text style={{ color: themeColors.primary, fontSize: 12, marginTop: 2 }}>
                  {formatAmount(jarPoints)}{pendingJarPoints > 0 ? ` (${pendingJarPoints} pending)` : ''}/{formatAmount(g.targetAmount)}
                </Text>
                {pendingJarPoints > 0 && (
                  <Text style={{ color: themeColors.textSecondary, fontSize: 10, marginTop: 1 }}>
                    Available: {formatAmount(availableJarPoints)}
                  </Text>
                )}
              </View>
            ) : (
              <View style={{ alignItems: "center", marginBottom: 4, minHeight: 50 }}>
                {isExpired ? (
                  <Text style={{ color: themeColors.primary, fontSize: 14, fontWeight: "bold", marginTop: 8 }}>
                    {formatAmount(jarPoints)}/{formatAmount(g.targetAmount)}
                  </Text>
                ) : isCompleted ? (
                  <Text style={{ color: themeColors.primary, fontSize: 14, fontWeight: "bold", marginTop: 8 }}>
                    {formatAmount(g.targetAmount)}
                  </Text>
                ) : null}
              </View>
            )}
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {canClaim && (
                <TouchableOpacity
                  style={{
                    backgroundColor: themeColors.success,
                    paddingVertical: 5,
                    paddingHorizontal: 13,
                    borderRadius: 8,
                  }}
                  onPress={() => handleClaimGoal(g._id, g.name, g.jar, g.targetAmount)}
                  disabled={claiming === g._id}
                  accessibilityRole="button"
                  accessibilityLabel={`Claim goal: ${g.name}`}
                  accessibilityHint="Double tap to submit goal completion request to parent"
                  accessibilityState={{ disabled: claiming === g._id }}
                >
                  <Text style={{
                    color: themeColors.card,
                    fontWeight: "bold",
                    fontSize: 12
                  }}>
                    {claiming === g._id ? "Claiming..." : "Claim"}
                  </Text>
                </TouchableOpacity>
              )}
              {g.status === 'active' && g.createdByType === 'child' && (
                <TouchableOpacity
                  style={{
                    backgroundColor: themeColors.error,
                    paddingVertical: 5,
                    paddingHorizontal: 10,
                    borderRadius: 8,
                  }}
                  onPress={() => handleDeleteGoal(g._id, g.name)}
                  accessibilityRole="button"
                  accessibilityLabel={`Delete goal: ${g.name}`}
                  accessibilityHint="Double tap to delete this goal"
                >
                  <Text style={{
                    color: themeColors.card,
                    fontWeight: "bold",
                    fontSize: 12
                  }}>
                    🗑️ Delete
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </View>
    );
  }

  // Individual reward renderer - visually engaging for kids
  function renderReward(r: any) {
    // Pending if there is a pending approval request for this reward
    const hasPending = requests.some(
      (req: any) => req.type === "reward" && req.rewardId === r._id && req.status === "Pending"
    );
    // "Can claim" if available, not purchased, not pending, and enough available points
    const availablePoints = userData ? (userData.currentPoints || 0) - (userData.pendingCurrentPoints || 0) : 0;
    const canClaim = r.available && !r.purchased && userData && availablePoints >= r.cost && !hasPending;

    const getStatusText = () => {
      if (r.purchased) return 'Claimed';
      if (hasPending) return 'Pending approval';
      if (canClaim) return 'Available to claim';
      return 'Not enough points';
    };

    // Fun status icons and colors for kids
    const getStatusConfig = () => {
      if (r.purchased) return { icon: '🏆', color: themeColors.success, bgColor: themeColors.success + '20', text: 'Won!' };
      if (hasPending) return { icon: '⏳', color: themeColors.warning, bgColor: themeColors.warning + '25', text: 'Waiting...' };
      if (canClaim) return { icon: '🎯', color: themeColors.primary, bgColor: themeColors.primary + '20', text: 'Claim Now!' };
      return { icon: '💪', color: themeColors.textSecondary, bgColor: themeColors.surface, text: 'Keep Saving!' };
    };

    const statusConfig = getStatusConfig();

    return (
      <View
        key={r._id}
        style={{
          backgroundColor: statusConfig.bgColor,
          marginBottom: 12,
          borderRadius: 16,
          padding: 16,
          borderWidth: 2,
          borderColor: r.purchased ? themeColors.success : hasPending ? themeColors.warning : canClaim ? themeColors.primary : themeColors.border,
          shadowColor: statusConfig.color,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}
        accessibilityLabel={`Reward: ${r.name}. Cost: ${formatAmount(r.cost)} points. Status: ${getStatusText()}.`}
        accessibilityHint={canClaim ? 'Double tap to claim this reward' : r.purchased ? 'This reward has been claimed' : hasPending ? 'Waiting for parent approval' : 'You need more points to claim this reward'}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <Text style={{ fontSize: 24, marginRight: 12 }}>{statusConfig.icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={{
              fontSize: 18,
              fontWeight: "bold",
              color: themeColors.text,
              marginBottom: 4
            }} numberOfLines={1} ellipsizeMode="tail">
              {r.name}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{
                fontSize: 16,
                fontWeight: "bold",
                color: themeColors.primary,
                marginRight: 8
              }}>
                💰 {formatAmount(r.cost)} points
              </Text>
              {userData && (
                <Text style={{
                  fontSize: 14,
                  color: themeColors.textSecondary
                }}>
                  (Total: {formatAmount(userData.currentPoints || 0)}{(userData.pendingCurrentPoints || 0) > 0 ? `, ${userData.pendingCurrentPoints} pending` : ''})
                </Text>
              )}
              {userData && (userData.pendingCurrentPoints || 0) > 0 && (
                <Text style={{
                  fontSize: 12,
                  color: themeColors.textSecondary,
                  marginTop: 2
                }}>
                  Available: {formatAmount((userData.currentPoints || 0) - (userData.pendingCurrentPoints || 0))}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Status button - more engaging for kids */}
        {r.purchased ? (
          <View style={{
            backgroundColor: themeColors.success,
            borderRadius: 12,
            paddingVertical: 10,
            paddingHorizontal: 16,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center'
          }}>
            <Text style={{ fontSize: 16, marginRight: 8 }}>🎉</Text>
            <Text style={{
              color: 'white',
              fontWeight: "bold",
              fontSize: 16
            }}>
              {statusConfig.text}
            </Text>
          </View>
        ) : hasPending ? (
          <View style={{
            backgroundColor: themeColors.warning,
            borderRadius: 12,
            paddingVertical: 10,
            paddingHorizontal: 16,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center'
          }}>
            <Text style={{ fontSize: 16, marginRight: 8 }}>⏳</Text>
            <Text style={{
              color: 'white',
              fontWeight: "bold",
              fontSize: 16
            }}>
              {statusConfig.text}
            </Text>
          </View>
        ) : canClaim ? (
          <TouchableOpacity
            style={{
              backgroundColor: themeColors.primary,
              borderRadius: 12,
              paddingVertical: 12,
              paddingHorizontal: 20,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              shadowColor: themeColors.primary,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 4,
              elevation: 4,
            }}
            onPress={() => handleClaimReward(r._id)}
            disabled={claiming === r._id}
            accessibilityRole="button"
            accessibilityLabel={`Claim reward: ${r.name}`}
            accessibilityHint="Double tap to submit reward claim request to parent"
            accessibilityState={{ disabled: claiming === r._id }}
          >
            <Text style={{ fontSize: 18, marginRight: 8 }}>🎁</Text>
            <Text style={{
              color: 'white',
              fontWeight: "bold",
              fontSize: 16
            }}>
              {claiming === r._id ? "Claiming..." : statusConfig.text}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={{
            backgroundColor: themeColors.surface,
            borderRadius: 12,
            paddingVertical: 10,
            paddingHorizontal: 16,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: themeColors.border
          }}>
            <Text style={{ fontSize: 16, marginRight: 8 }}>💪</Text>
            <Text style={{
              color: themeColors.textSecondary,
              fontWeight: "bold",
              fontSize: 16
            }}>
              {statusConfig.text}
            </Text>
          </View>
        )}
      </View>
    );
  }
}
