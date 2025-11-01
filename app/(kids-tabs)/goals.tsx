import GoalTemplates from '@/components/GoalTemplates';
import HelpModal from '@/components/HelpModal';
import AnimatedCircularProgress from '@/components/animations/AnimatedCircularProgress';
import { useCenteredMessage } from '@/utils/centeredMessageContext';
import { API_URL } from '@/utils/config';
import { useCurrency } from '@/utils/currencyContext';
import { handleApiError } from '@/utils/errorHandler';
import NotificationService from '@/utils/notificationService';
import { getAuthToken, getUser } from '@/utils/secureStorage';
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

import { MOBILE_LAYOUT, MOBILE_STYLES } from '@/utils/mobileLayout';

const createStyles = (themeColors: any) => StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 4,
    backgroundColor: themeColors.background,
  },
  title: {
    ...MOBILE_STYLES.title,
    color: themeColors.primary,
  },
  sectionCard: {
    ...MOBILE_STYLES.card,
    backgroundColor: themeColors.card,
    borderColor: themeColors.border,
    marginBottom: MOBILE_LAYOUT.sectionSpacing,
    width: MOBILE_LAYOUT.containerWidth,
  },
  sectionTitle: {
    ...MOBILE_STYLES.body,
    fontWeight: "600",
    marginBottom: MOBILE_LAYOUT.itemSpacing,
    color: themeColors.text,
  },
  placeholder: {
    ...MOBILE_STYLES.body,
    color: themeColors.textSecondary,
    fontStyle: "italic",
    marginBottom: MOBILE_LAYOUT.itemSpacing,
    marginTop: MOBILE_LAYOUT.itemSpacing,
    minHeight: 26
  },
  statusMessage: {
    ...MOBILE_STYLES.body,
    fontWeight: "600",
    marginTop: MOBILE_LAYOUT.itemSpacing,
    color: themeColors.success
  },
  refreshBtn: {
    ...MOBILE_STYLES.primaryButton,
    backgroundColor: themeColors.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  refreshBtnDisabled: {
    backgroundColor: themeColors.surface,
  },
  refreshBtnText: {
    ...MOBILE_STYLES.caption,
    color: themeColors.card,
    fontWeight: "bold",
  },
  refreshBtnTextDisabled: {
    ...MOBILE_STYLES.caption,
    color: themeColors.textSecondary,
  },
});

export default function GoalsScreen() {
  const { themeColors } = useTheme();
  const styles = createStyles(themeColors);
  const router = useRouter();
  const [helpModalVisible, setHelpModalVisible] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: themeColors.background }}
      contentContainerStyle={{ alignItems: "center", paddingVertical: 16, paddingHorizontal: 8 }}
    >
      <View style={{ ...MOBILE_STYLES.fullWidthContainer, marginBottom: MOBILE_LAYOUT.sectionSpacing, marginTop: MOBILE_LAYOUT.itemSpacing }}>
        <View style={{ ...MOBILE_STYLES.row, justifyContent: 'space-between', marginBottom: MOBILE_LAYOUT.itemSpacing }}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Go back to home screen"
            accessibilityHint="Navigate back to the main dashboard"
            style={{
              backgroundColor: themeColors.surface,
              borderRadius: MOBILE_LAYOUT.borderRadius,
              paddingHorizontal: MOBILE_LAYOUT.cardPadding,
              paddingVertical: MOBILE_LAYOUT.itemSpacing,
              elevation: MOBILE_LAYOUT.buttonElevation,
              minWidth: MOBILE_LAYOUT.minTouchTarget,
              minHeight: MOBILE_LAYOUT.minTouchTarget,
              justifyContent: 'center',
              alignItems: 'center',
            }}
            onPress={() => router.push('./')}
          >
            <Text style={{ color: themeColors.text, fontWeight: 'bold', ...MOBILE_STYLES.caption }}>⬅️ Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              backgroundColor: themeColors.accent,
              borderRadius: MOBILE_LAYOUT.borderRadius,
              paddingHorizontal: MOBILE_LAYOUT.cardPadding,
              paddingVertical: MOBILE_LAYOUT.itemSpacing,
              elevation: MOBILE_LAYOUT.buttonElevation,
              minWidth: MOBILE_LAYOUT.minTouchTarget,
              minHeight: MOBILE_LAYOUT.minTouchTarget,
              justifyContent: 'center',
              alignItems: 'center',
            }}
            onPress={() => setHelpModalVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Help and information"
            accessibilityHint="Double tap to open help guide for goals and rewards"
          >
            <Text style={{ color: themeColors.card, fontWeight: 'bold', ...MOBILE_STYLES.caption }}>❓ Help</Text>
          </TouchableOpacity>
        </View>
        <View style={MOBILE_STYLES.center}>
          <Text style={[styles.title, { color: themeColors.primary }]}>🎯 My Goals</Text>
        </View>
      </View>

      <KidGoalsRewardsSection refreshTrigger={refreshTrigger} onRefresh={() => setRefreshTrigger(prev => prev + 1)} />

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
    </ScrollView>
  );
}

// --- KidGoalsRewardsSection (loads from database, allows claiming) ---
import { useStaleDataWarning } from "@/utils/useStaleDataWarning";

function KidGoalsRewardsSection({ refreshTrigger, onRefresh }: { refreshTrigger?: number; onRefresh?: () => void }) {
  const { themeColors } = useTheme();
  const styles = createStyles(themeColors);
  const { formatAmount } = useCurrency();
  const [goals, setGoals] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState<string | null>(null);
  // Tabs for goal filtering
  const [tab, setTab] = useState<'Active' | 'Completed'>('Active');
  // Show archived completed
  const [showArchive, setShowArchive] = useState(false);
  // Goal templates modal
  const [showTemplates, setShowTemplates] = useState(false);
  // Collapsible section states
  const [goalsExpanded, setGoalsExpanded] = useState(true);
  const [showStaleWarning, , markRefreshed] = useStaleDataWarning();
  const { showMessage } = useCenteredMessage();

  // Watch for refresh trigger changes from parent
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      loadGoalsAndRewards();
    }
  }, [refreshTrigger]);

  // Handle template selection
  const handleTemplateSelect = async (template: any) => {
    try {
      const token = await getAuthToken();
      const user = await getUser();

      if (!token || !user) {
        showMessage('Not authenticated.', 'error');
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
        showMessage(`${response.status} ${response.statusText}: ${errorMessage}`, 'error');
        return;
      }

      const newGoal = await response.json();

      // Add to local state
      setGoals(prevGoals => [newGoal, ...prevGoals]);

      setShowTemplates(false);
      showMessage(`Goal "${template.name}" created successfully!`, 'success');

    } catch (error) {
      console.error('Error creating goal from template:', error);
      showMessage('Failed to create goal from template.', 'error');
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
    console.log('🔄 Goals: Starting loadGoalsAndRewards...');
    try {
      const token = await getAuthToken();
      const user = await getUser();

      console.log('🔄 Goals: Token exists:', !!token, 'User exists:', !!user);

      if (!token || !user) {
        console.log('🔄 Goals: Missing token or user data');
        setLoading(false);
        return;
      }
      // Always fetch freshest user data from backend (not AsyncStorage!)
      const userId = user.id;
      const userRes = await fetch(`${API_URL}/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!userRes.ok) {
        await handleApiError(userRes, { showError: (msg) => showMessage(msg, 'error'), feature: 'Goals - User Data' });
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


    } catch (error) {
      console.error('Error loading goals:', error);
      showMessage('Failed to load goals.', 'error');
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
      const user = await getUser();

      if (!token || !user) {
        showMessage('Not authenticated.', 'error');
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
        showMessage(errorMessage, 'error');
        return;
      }

      // Update local state to show goal as pending
      setGoals(goals.map(g =>
        g._id === goalId ? { ...g, status: 'pending' } : g
      ));

      // Immediately refresh user data to show updated pending points
      await loadGoalsAndRewards();

      showMessage("Goal completion request submitted to parent!", 'success');

    } catch (error) {
      console.error('Error submitting goal completion request:', error);
      showMessage('Failed to submit request.', 'error');
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
        const user = await getUser();
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
        showMessage(`Goal "${goalName}" deleted successfully.`, 'success');

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
                const user = await getUser();
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
        <Text style={styles.sectionTitle}>🎯 My Goals</Text>
        <Text style={styles.placeholder}>Loading goals...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Quick Actions Header */}
      <View style={{
        ...MOBILE_STYLES.card,
        backgroundColor: themeColors.surface,
        marginBottom: MOBILE_LAYOUT.sectionSpacing,
        width: MOBILE_LAYOUT.containerWidth,
        borderColor: themeColors.border + '30',
      }}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Choose goal template"
          accessibilityHint="Browse and select from available goal templates"
          style={{
            ...MOBILE_STYLES.primaryButton,
            backgroundColor: themeColors.primary,
            marginBottom: MOBILE_LAYOUT.itemSpacing,
          }}
          onPress={() => setShowTemplates(true)}
        >
          <Text style={{
            ...MOBILE_STYLES.body,
            color: 'white',
            fontWeight: 'bold'
          }}>
            🎯 Create New Goal
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            ...MOBILE_STYLES.primaryButton,
            backgroundColor: themeColors.secondary,
          }}
          onPress={onRefresh}
          accessibilityRole="button"
          accessibilityLabel="Refresh goals"
          accessibilityHint="Double tap to reload your goals"
        >
          <Text style={{
            ...MOBILE_STYLES.body,
            color: themeColors.card,
            fontWeight: '600'
          }}>
            🔄 Refresh Goals
          </Text>
        </TouchableOpacity>
      </View>

      {/* Goals Section - Always Visible */}
      <View
        style={{
          ...MOBILE_STYLES.card,
          backgroundColor: themeColors.card,
          marginBottom: MOBILE_LAYOUT.sectionSpacing,
          width: MOBILE_LAYOUT.containerWidth,
          borderColor: themeColors.border + '30',
        }}
      >
        <View style={{
          padding: MOBILE_LAYOUT.cardPadding,
          paddingBottom: MOBILE_LAYOUT.itemSpacing,
          borderBottomWidth: 1,
          borderBottomColor: themeColors.border + '30'
        }}>
          <View style={{ ...MOBILE_STYLES.row, justifyContent: 'space-between' }}>
            <View style={MOBILE_STYLES.row}>
              <Text style={[styles.sectionTitle, { color: themeColors.text, marginBottom: 0 }]}>🎯 My Goals</Text>
              <View style={{
                backgroundColor: themeColors.primary,
                borderRadius: MOBILE_LAYOUT.borderRadius,
                paddingHorizontal: MOBILE_LAYOUT.itemSpacing,
                paddingVertical: 2,
                marginLeft: MOBILE_LAYOUT.itemSpacing
              }}>
                <Text style={{ color: 'white', ...MOBILE_STYLES.caption, fontWeight: 'bold' }}>
                  {goals.length}
                </Text>
              </View>
            </View>
          </View>
        </View>

      </View>

      {/* Full-Width Goals Content */}
      <View style={MOBILE_STYLES.scrollContent}>
        {/* Enhanced Tabs */}
        <View style={{
          ...MOBILE_STYLES.tabContainer,
          backgroundColor: themeColors.surface,
          marginBottom: MOBILE_LAYOUT.sectionSpacing,
        }}>
          {["Active", "Completed"].map(t => (
            <TouchableOpacity
              key={t}
              style={{
                ...MOBILE_STYLES.tabButton,
                backgroundColor: tab === t ? themeColors.primary : 'transparent',
              }}
              onPress={() => { setTab(t as "Active" | "Completed"); setShowArchive(false); }}
              accessibilityRole="tab"
              accessibilityLabel={`${t} goals`}
              accessibilityHint={`Show ${t.toLowerCase()} goals`}
              accessibilityState={{ selected: tab === t }}
            >
              <Text style={{
                ...MOBILE_STYLES.body,
                color: tab === t ? 'white' : themeColors.text,
                fontWeight: tab === t ? "bold" : "600",
              }}>
                {t === "Active" ? "⚡ Active Goals" : "🏆 Completed"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Goals content */}
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
                      <View style={{
                        alignItems: 'center',
                        paddingVertical: 60,
                        paddingHorizontal: 20,
                      }}>
                        <Text style={{ fontSize: 72, marginBottom: 20 }}>🎯</Text>
                        <Text style={{
                          fontSize: 22,
                          fontWeight: 'bold',
                          color: themeColors.text,
                          marginBottom: 12,
                          textAlign: 'center'
                        }}>
                          Ready to Start Saving?
                        </Text>
                        <Text style={{
                          fontSize: 16,
                          color: themeColors.textSecondary,
                          textAlign: 'center',
                          marginBottom: 32,
                          lineHeight: 24
                        }}>
                          Create your first savings goal and watch your money grow! 💰
                        </Text>
                        <TouchableOpacity style={{
                          backgroundColor: themeColors.primary,
                          paddingVertical: 16,
                          paddingHorizontal: 32,
                          borderRadius: 16,
                          flexDirection: 'row',
                          alignItems: 'center',
                          elevation: 4,
                        }}>
                          <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold', marginRight: 8 }}>
                            🎯 Let's Create One!
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ) : null}
                  </>
                }
                data={activeGoals}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => renderGoal(item)}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 10 }}
                style={{ flex: 1 }}
                scrollEnabled={false}
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
            return (
              <View style={{
                alignItems: 'center',
                paddingVertical: 60,
                paddingHorizontal: 20,
              }}>
                <Text style={{ fontSize: 72, marginBottom: 20 }}>🏆</Text>
                <Text style={{
                  fontSize: 22,
                  fontWeight: 'bold',
                  color: themeColors.text,
                  marginBottom: 12,
                  textAlign: 'center'
                }}>
                  No Completed Goals Yet
                </Text>
                <Text style={{
                  fontSize: 16,
                  color: themeColors.textSecondary,
                  textAlign: 'center',
                  marginBottom: 32,
                  lineHeight: 24
                }}>
                  Complete your first goal to see your achievements here! 🌟
                </Text>
              </View>
            );
          return (
            <>
              <FlatList
                data={completedGoals}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => renderGoal(item)}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 10 }}
                style={{ flex: 1 }}
                scrollEnabled={false}
              />
              {completedArchived.length > 0 && !showArchive && (
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Show all completed goals from any time"
                  accessibilityHint="Display goals completed more than 90 days ago"
                  style={{
                    marginTop: 20,
                    alignSelf: "center",
                    backgroundColor: themeColors.accent + "22",
                    paddingHorizontal: 24,
                    paddingVertical: 12,
                    borderRadius: 20,
                    minHeight: 48,
                  }}
                  onPress={() => setShowArchive(true)}
                >
                  <Text style={{ color: themeColors.primary, fontWeight: "600", fontSize: 16 }}>Show All Completed Goals</Text>
                </TouchableOpacity>
              )}
              {completedArchived.length > 0 && showArchive && (
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Show only recently completed goals"
                  accessibilityHint="Hide goals completed more than 90 days ago"
                  style={{
                    marginTop: 16,
                    alignSelf: "center",
                    backgroundColor: themeColors.surface,
                    paddingHorizontal: 18,
                    paddingVertical: 10,
                    borderRadius: 18,
                    minHeight: 48,
                  }}
                  onPress={() => setShowArchive(false)}
                >
                  <Text style={{ color: themeColors.primary, fontWeight: "500", fontSize: 16 }}>Show Only Last 90 Days</Text>
                </TouchableOpacity>
              )}
            </>
          );
        })()}
      </View>

      {/* Goal Templates Modal */}
      <GoalTemplates
        visible={showTemplates}
        onSelect={handleTemplateSelect}
        onClose={() => setShowTemplates(false)}
      />
    </View>
  );


  // Individual goal renderer - Simplified and less confusing
  function renderGoal(g: any) {
    const jarPoints = userData ? userData[g.jar + "Points"] || 0 : 0;
    const availableJarPoints = jarPoints - (userData ? userData["pending" + g.jar.charAt(0).toUpperCase() + g.jar.slice(1) + "Points"] || 0 : 0);

    // Check if there is a pending goal-completion request for this goal
    const hasPendingClaim = requests.some(
      (req: any) => req.type === "goal-completion" && req.goalId === g._id && req.status === "Pending"
    );

    const isCompleted = g.completed === true || g.status === "completed";
    const isPending = g.status === "pending" && !isCompleted;
    const isExpired = g.status === "expired";
    const canClaim = availableJarPoints >= g.targetAmount && g.status === "active" && !isCompleted && !isExpired && !hasPendingClaim;

    // Determine status and colors
    let statusText = '';
    let statusColor = themeColors.secondary;
    let bgColor = themeColors.surface;

    if (isCompleted) {
      statusText = '🏆 Completed';
      statusColor = themeColors.success;
      bgColor = themeColors.success + '10';
    } else if (isPending) {
      statusText = '⏳ Pending';
      statusColor = themeColors.warning;
      bgColor = themeColors.warning + '15';
    } else if (isExpired) {
      statusText = '❌ Expired';
      statusColor = themeColors.error;
      bgColor = themeColors.error + '10';
    } else if (canClaim) {
      statusText = '✅ Ready to Claim';
      statusColor = themeColors.primary;
    } else {
      statusText = '💪 In Progress';
      statusColor = themeColors.secondary;
    }

    return (
      <View
        key={g._id}
        style={{
          backgroundColor: bgColor,
          borderRadius: 16,
          padding: 20,
          marginBottom: 16,
          borderWidth: 2,
          borderColor: statusColor + '30',
          elevation: 3,
          shadowColor: statusColor,
        }}
        accessibilityLabel={`Goal: ${g.name}. ${statusText}. Progress: ${formatAmount(jarPoints)} out of ${formatAmount(g.targetAmount)} points.`}
        accessibilityHint={canClaim ? 'Double tap to claim this goal' : isCompleted ? 'This goal has been completed' : isPending ? 'Waiting for parent approval' : isExpired ? 'This goal has expired' : 'You need more points to claim this goal'}
      >
        {/* Goal Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <View style={{ flex: 1 }}>
            <Text style={{
              fontSize: 18,
              fontWeight: 'bold',
              color: themeColors.text,
              marginBottom: 4
            }} numberOfLines={2} ellipsizeMode="tail">
              {g.name}
            </Text>
            <Text style={{
              fontSize: 14,
              color: statusColor,
              fontWeight: '600'
            }}>
              {statusText}
            </Text>
          </View>

          {/* Progress Circle */}
          {g.status === "active" && !isCompleted && !isExpired && (
            <View style={{ alignItems: 'center' }}>
              <AnimatedCircularProgress
                size={60}
                width={6}
                fill={Math.min((jarPoints / g.targetAmount) * 100, 100)}
                tintColor={canClaim ? themeColors.primary : themeColors.textSecondary}
                backgroundColor={themeColors.border}
                duration={1500}
              />
              <Text style={{
                fontSize: 12,
                color: themeColors.primary,
                fontWeight: 'bold',
                marginTop: 4
              }}>
                {Math.round((jarPoints / g.targetAmount) * 100)}%
              </Text>
            </View>
          )}
        </View>

        {/* Progress Text */}
        <View style={{ marginBottom: 16 }}>
          {isCompleted ? (
            <Text style={{
              fontSize: 16,
              color: themeColors.success,
              fontWeight: '600',
              textAlign: 'center'
            }}>
              🎉 Target Reached!
            </Text>
          ) : (
            <Text style={{
              fontSize: 16,
              color: themeColors.text,
              fontWeight: '600',
              textAlign: 'center'
            }}>
              {formatAmount(jarPoints)} / {formatAmount(g.targetAmount)} points
            </Text>
          )}
          {isCompleted ? (
            <Text style={{
              fontSize: 14,
              color: themeColors.success,
              textAlign: 'center',
              marginTop: 2,
              fontWeight: '600'
            }}>
              Target: {formatAmount(g.targetAmount)} points achieved! 🎉
            </Text>
          ) : (
            <Text style={{
              fontSize: 14,
              color: themeColors.textSecondary,
              textAlign: 'center',
              marginTop: 2
            }}>
              Save in: {getJarDisplayName(g.jar)}
            </Text>
          )}
        </View>

        {/* Action Button */}
        <View style={{ alignItems: 'center' }}>
          {canClaim && (
            <TouchableOpacity
              style={{
                backgroundColor: themeColors.success,
                paddingVertical: 12,
                paddingHorizontal: 24,
                borderRadius: 12,
                minWidth: 120,
                elevation: 2,
              }}
              onPress={() => handleClaimGoal(g._id, g.name, g.jar, g.targetAmount)}
              disabled={claiming === g._id}
              accessibilityRole="button"
              accessibilityLabel={`Claim goal: ${g.name}`}
              accessibilityHint="Double tap to submit goal completion request to parent"
              accessibilityState={{ disabled: claiming === g._id }}
            >
              <Text style={{
                color: 'white',
                fontSize: 16,
                fontWeight: 'bold',
                textAlign: 'center'
              }}>
                {claiming === g._id ? '🎯 Claiming...' : '🎯 Claim Goal'}
              </Text>
            </TouchableOpacity>
          )}

          {g.status === 'active' && g.createdByType === 'child' && !canClaim && (
            <TouchableOpacity
              style={{
                backgroundColor: themeColors.error,
                paddingVertical: 8,
                paddingHorizontal: 16,
                borderRadius: 10,
                marginTop: 8,
              }}
              onPress={() => handleDeleteGoal(g._id, g.name)}
              accessibilityRole="button"
              accessibilityLabel={`Delete goal: ${g.name}`}
              accessibilityHint="Double tap to delete this goal"
            >
              <Text style={{
                color: 'white',
                fontSize: 14,
                fontWeight: 'bold'
              }}>
                🗑️ Delete
              </Text>
            </TouchableOpacity>
          )}

          {!canClaim && !isCompleted && !isPending && !isExpired && (
            <Text style={{
              fontSize: 14,
              color: themeColors.textSecondary,
              textAlign: 'center',
              marginTop: 8
            }}>
              Keep saving! 💪
            </Text>
          )}
        </View>
      </View>
    );
  }


}
