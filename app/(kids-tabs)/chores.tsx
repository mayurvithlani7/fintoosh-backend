import HelpModal from '@/components/HelpModal';
import AnimatedCircularProgress from '@/components/animations/AnimatedCircularProgress';
import { TYPOGRAPHY } from '@/constants/theme';
import { API_URL } from '@/utils/config';
import { handleApiError } from '@/utils/errorHandler';
import { MOBILE_LAYOUT, MOBILE_STYLES } from '@/utils/mobileLayout';
import { getAuthToken, getUserData } from '@/utils/secureStorage';
import { useTheme } from '@/utils/themeContext';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { patchChore } from '../../utils/api';

const createStyles = (themeColors: any) => StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    paddingVertical: MOBILE_LAYOUT.sectionSpacing,
    paddingHorizontal: MOBILE_LAYOUT.containerPadding,
    backgroundColor: themeColors.background,
  },
  title: {
    ...TYPOGRAPHY.h2,
    color: themeColors.primary,
    marginBottom: MOBILE_LAYOUT.sectionSpacing,
    marginTop: MOBILE_LAYOUT.itemSpacing,
  },
  sectionCard: {
    ...MOBILE_STYLES.card,
    backgroundColor: themeColors.card,
    borderColor: themeColors.border,
    marginBottom: MOBILE_LAYOUT.sectionSpacing,
    width: MOBILE_LAYOUT.containerWidth,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    marginBottom: MOBILE_LAYOUT.itemSpacing,
    color: themeColors.text,
  },
  placeholder: {
    ...TYPOGRAPHY.bodySmall,
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
  scrollContent: {
    ...MOBILE_STYLES.scrollContent,
    backgroundColor: themeColors.background,
  },
});

export default function TasksScreen() {
  const { themeColors } = useTheme();
  const styles = createStyles(themeColors);
  const router = useRouter();
  const [helpModalVisible, setHelpModalVisible] = useState(false);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: themeColors.background }}
      contentContainerStyle={[styles.container, styles.scrollContent, { flexGrow: 1 }]}
      showsVerticalScrollIndicator={false}
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
            accessibilityRole="button"
            accessibilityLabel="Help and information"
            accessibilityHint="Open help guide for tasks and chores"
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
          >
            <Text style={{ color: themeColors.card, fontWeight: 'bold', ...MOBILE_STYLES.caption }}>❓ Help</Text>
          </TouchableOpacity>
        </View>
        <View style={MOBILE_STYLES.center}>
          <Text style={[styles.title, { color: themeColors.primary }]}>🧹 My Tasks</Text>
        </View>
      </View>

      <ChoresSection />

      {/* Help Modal */}
      <HelpModal
        visible={helpModalVisible}
        onClose={() => setHelpModalVisible(false)}
        title="🧹 My Tasks - Help"
        tabs={[
          {
            title: "How Task Adventures Work! 🎮",
            content: [
              {
                type: "text",
                text: "Hey there, task hero! 🎉 Complete fun tasks to earn points for your special money pots. Your parents set up the tasks, and you get to be the hero who claims them!",
                icon: "🧹"
              },
              {
                type: "bullet",
                text: "👀 Check out Active Tasks to see your mission list!"
              },
              {
                type: "bullet",
                text: "🖱️ Tap the 'Claim' button when you finish a task"
              },
              {
                type: "bullet",
                text: "⏳ Wait for your parent's thumbs up to get your points!"
              },
              {
                type: "highlight",
                text: "Always ask permission before starting tasks - safety first! 🛡️",
                icon: "🤝"
              }
            ]
          },
          {
            title: "Active Missions - Your Task List! 📋",
            content: [
              {
                type: "text",
                text: "These are your super tasks waiting to be completed:\n\n",
                icon: "📋"
              },
              {
                type: "bullet",
                text: "Shows the task name and how many points you'll win! 🏆\n"
                },
              {
                type: "bullet",
                text: "Press 'Claim' when you're done being awesome!\n"
              },
              {
                type: "bullet",
                text: "It says 'Pending...' while your parent checks your work\n"
              },
              {
                type: "highlight",
                text: "Each task can only be claimed once - be the first hero! ⚡",
                icon: "✋"
              }
            ]
          },
          {
            title: "Mission Accomplished! ✅",
            content: [
              {
                type: "text",
                text: "Look at all the awesome tasks you've finished:\n\n",
                icon: "✅"
              },
              {
                type: "bullet",
                text: "Green background = Your parent said 'Great job!' 🎉\n"
              },
              {
                type: "bullet",
                text: "Yellow background = Still waiting for approval ⏳\n"
              },
              {
                type: "bullet",
                text: "Shows your points earned and when you finished\n"
              },
              {
                type: "highlight",
                text: "Points go into your money pots when approved - cha-ching! 💰",
                icon: "🎉"
              }
            ]
          },
          {
            title: "Task Treasure Chest - Archive! 📚",
            content: [
              {
                type: "text",
                text: "Your old completed tasks are safely stored here:",
                icon: "📚"
              },
              {
                type: "bullet",
                text: "Shows tasks from the last 90 days by default 📅"
              },
              {
                type: "bullet",
                text: "Tap 'Show All Completed Tasks' to see your whole adventure!"
              },
              {
                type: "bullet",
                text: "Like looking through your hero scrapbook! 📖"
              },
              {
                type: "highlight",
                text: "See how much of a task superstar you've become! 🌟",
                icon: "📈"
              }
            ]
          }
        ]}
      />
    </ScrollView>
  );
}

// --- Chores Section (list) ---
import { useCenteredMessage } from '@/utils/centeredMessageContext';
import { useStaleDataWarning } from '@/utils/useStaleDataWarning';

function ChoresSection() {
  const { themeColors } = useTheme();
  const styles = createStyles(themeColors);
  const [chores, setChores] = useState<any[]>([]);
  const [userData, setUserData] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { showMessage } = useCenteredMessage();
  // Tabs/archive for chores
  const [choresTab, setChoresTab] = useState<'Active' | 'Completed'>('Active');
  const [showArchive, setShowArchive] = useState(false);
  const [showStaleWarning, , markRefreshed] = useStaleDataWarning(300000); // 5 minutes

  // Helper: robust completion date
  function getChoreCompletedDate(c: any): Date {
    if (c.completedAt && typeof c.completedAt === "string") return new Date(c.completedAt);
    if (c.createdAt && typeof c.createdAt === "string") return new Date(c.createdAt);
    if (c._id && typeof c._id === "string" && c._id.length >= 8) {
      const timestamp = parseInt(c._id.slice(0, 8), 16) * 1000;
      return new Date(timestamp);
    }
    return new Date();
  }

  // Smart category detection based on task content - Theme Compatible
  function detectCategory(taskName: string, description: string = '') {
    const text = (taskName + ' ' + description).toLowerCase();

    if (text.includes('clean') || text.includes('wash') || text.includes('vacuum') || text.includes('tidy') || text.includes('room')) {
      return {
        category: 'Cleaning',
        emoji: '🧹',
        color: themeColors.success,
        bgColor: themeColors.success + '15'
      };
    }

    if (text.includes('read') || text.includes('learn') || text.includes('study') || text.includes('book') || text.includes('homework')) {
      return {
        category: 'Learning',
        emoji: '📚',
        color: themeColors.primary,
        bgColor: themeColors.primary + '15'
      };
    }

    if (text.includes('help') || text.includes('family') || text.includes('together') || text.includes('assist') || text.includes('parent')) {
      return {
        category: 'Helping',
        emoji: '🤝',
        color: themeColors.warning,
        bgColor: themeColors.warning + '15'
      };
    }

    return {
      category: 'Other',
      emoji: '⭐',
      color: themeColors.accent,
      bgColor: themeColors.accent + '15'
    };
  }

  // Frequency-based priority styling - Theme Compatible
  function getFrequencyStyle(frequency: string) {
    switch (frequency) {
      case 'daily':
        return { priority: 'high', accentColor: themeColors.error, borderColor: themeColors.error }; // Error color for daily (high priority)
      case 'weekly':
        return { priority: 'medium', accentColor: themeColors.warning, borderColor: themeColors.warning }; // Warning color for weekly
      case 'monthly':
        return { priority: 'low', accentColor: themeColors.success, borderColor: themeColors.success }; // Success color for monthly
      default:
        return { priority: 'normal', accentColor: themeColors.primary, borderColor: themeColors.primary }; // Primary color for one-time
    }
  }

  // Points-based visual weight
  function getPointsStyle(points: number) {
    if (points >= 25) return { weight: 'high', badgeColor: '#FFD700' }; // Gold
    if (points >= 10) return { weight: 'medium', badgeColor: '#C0C0C0' }; // Silver
    return { weight: 'low', badgeColor: '#CD7F32' }; // Bronze
  }

  // Fetch chores, user data, and approval requests from backend
  const loadChoresUserAndRequests = async (isRefresh = false) => {
    console.log('🔄 Chores: Starting loadChoresUserAndRequests...', isRefresh ? '(refresh)' : '(initial)');
    try {
      if (!isRefresh) setLoading(true);
      const token = await getAuthToken();
      const user = await getUserData();

      console.log('🔄 Chores: Token exists:', !!token, 'User exists:', !!user);

      if (!token || !user) {
        console.log('🔄 Chores: Missing token or user data');
        if (!isRefresh) setLoading(false);
        return;
      }
      const userId = user.id;
      // User
      const userRes = await fetch(`${API_URL}/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!userRes.ok) {
        await handleApiError(userRes, { showError: (msg) => showMessage(msg, 'error'), feature: 'Chores - User Data' });
        if (!isRefresh) setLoading(false);
        return;
      }
      setUserData(await userRes.json());
      // Chores
      const choresRes = await fetch(`${API_URL}/chores/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!choresRes.ok) {
        await handleApiError(choresRes, { showError: (msg) => showMessage(msg, 'error'), feature: 'Chores - Task List' });
        if (!isRefresh) setLoading(false);
        return;
      }
      const choresResponse = await choresRes.json();
      // Extract chores array from response object
      const choresData = choresResponse.chores || [];
      // Ensure choresData is an array
      const safeChoresData = Array.isArray(choresData) ? choresData : [];
      // Security: Only allow chores for this child session (user.id)
      if (
        user &&
        safeChoresData &&
        safeChoresData.length > 0 &&
        safeChoresData.some((c: any) => (c.childId && c.childId !== user.id))
      ) {
        const { clearSensitiveAppData } = await import('@/utils/secureStorage');
        await clearSensitiveAppData();
        if (typeof window !== 'undefined' && window.location) window.location.href = '/login';
        return;
      }
      setChores(safeChoresData);
      // Requests (for pending claim)
      const reqRes = await fetch(`${API_URL}/requests/${userId}`);
      if (reqRes.ok) setRequests(await reqRes.json());
      markRefreshed();
    } catch (err) {
      showMessage("Could not load chores/user info.", 'error');
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  };

  const onRefresh = React.useCallback(() => {
    console.log('[CHORES] Manual refresh triggered');
    setRefreshing(true);
    loadChoresUserAndRequests(true);
  }, []);

  useEffect(() => {
    loadChoresUserAndRequests();

    // Update when app comes back to foreground
    const { AppState } = require('react-native');
    let currentState = AppState.currentState;
    const appStateSubscription = AppState.addEventListener('change', (nextState: any) => {
      if (currentState.match(/inactive|background/) && nextState === 'active') {
        loadChoresUserAndRequests();
      }
      currentState = nextState;
    });

    return () => {
      appStateSubscription.remove();
    };
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadChoresUserAndRequests();
    }, [])
  );

  // Handle marking chore as done (send PATCH to backend)
  const handleToggleDone = async (choreId: string, done: boolean) => {
    try {
      const token = await getAuthToken();
      await patchChore(choreId, { completed: true, completedAt: new Date() }, token as any);
      // Will pick up update on next poll (or can reload immediately if more instant feel desired)
    } catch (error) {
      console.error('Error marking chore as done:', error);
      showMessage('Failed to mark as done', 'error');
    }
  };

  // Handle claim: send approval request to parent via backend
  const handleClaimChore = async (choreId: string) => {
    try {
      const token = await getAuthToken();
      const user = await getUserData();
      if (!token || !user) {
        showMessage("Not authenticated", 'error');
        return;
      }
      const userId = user.id;
      const chore = chores.find(c => c._id === choreId);
      if (!chore) {
        showMessage("Chore not found", 'error');
        return;
      }

      // Special handling for welcome task - auto-approve and award points immediately
      if (chore.isWelcomeTask) {
        // Directly award points using the default split (no parent approval needed)
        const requestData = {
          userId: userId,
          type: "chore",
          name: `Welcome Task: ${chore.name}`,
          amount: chore.points || chore.pointValue || 0,
          reason: `Welcome to Money Pots! Completed: ${chore.name}`,
          choreId: choreId,
          autoApprove: true, // Special flag for welcome tasks
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
          let errorMessage = "Failed to complete welcome task.";
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          } catch {
            // If JSON parsing fails, use default message
          }
          showMessage(errorMessage, 'error');
          return;
        }

        // Update user to mark as not first-time user
        await fetch(`${API_URL}/users/${userId}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ isFirstTimeUser: false }),
        });

        // Update achievement for completing first chore
        try {
          const { updateAchievementProgress } = await import('../../components/AchievementSystem');
          await updateAchievementProgress('family-helper', 1);
        } catch (error) {
          console.error('Error updating chore achievement:', error);
        }

        // Reload data immediately to show completion
        await loadChoresUserAndRequests();
        showMessage("Welcome task completed! You earned 25 points! 🎉", 'success');
        return;
      }

      // DEBUG: Log user data to understand the structure
      console.log('DEBUG handleClaimChore - User data:', {
        userId: user.id,
        hasCaregivers: !!(user as any).caregivers,
        caregiversType: typeof (user as any).caregivers,
        caregiversLength: (user as any).caregivers?.length,
        caregiversContent: (user as any).caregivers,
        parentId: (user as any).parentId
      });

      // Get parent ID from caregivers array - find first valid caregiver
      let parentId = null;
      if ((user as any).caregivers && Array.isArray((user as any).caregivers)) {
        console.log('DEBUG: Checking caregivers array');
        // Find the first caregiver with a valid userId
        const validCaregiver = (user as any).caregivers.find((caregiver: any) =>
          caregiver && caregiver.userId
        );
        console.log('DEBUG: Valid caregiver found:', validCaregiver);
        parentId = validCaregiver ? validCaregiver.userId : null;
      }

      // Fallback to legacy parentId field for backward compatibility
      if (!parentId) {
        console.log('DEBUG: No valid caregiver found, checking parentId fallback');
        parentId = (user as any).parentId;
        console.log('DEBUG: ParentId fallback:', parentId);
      }

      console.log('DEBUG: Final parentId:', parentId);

      if (!parentId) {
        console.error('ERROR: No parent or caregiver found despite parents being present');
        console.log('Full user object:', user);
        showMessage("No parent or caregiver found for your account. Please ask a grown-up to check your family settings.", 'error');
        return;
      }

      // Normal chore handling - First update chore status locally, then API calls
      console.log('🔄 Claiming chore:', choreId);

      // Update local state immediately to show pending status
      setChores(prevChores =>
        prevChores.map(c =>
          c._id === choreId
            ? { ...c, completed: true, status: 'pending', completedAt: new Date() }
            : c
        )
      );

      try {
        // Update chore status on backend
        await patchChore(choreId, {
          completed: true,
          completedAt: new Date(),
          status: 'pending'
        }, token as any);
        console.log('✅ Chore status updated on backend');
      } catch (patchError) {
        console.error('❌ Error updating chore status:', patchError);
        // Revert local state on error
        setChores(prevChores =>
          prevChores.map(c =>
            c._id === choreId
              ? { ...c, completed: false, status: c.status === 'pending' && !c.completed ? 'active' : c.status }
              : c
          )
        );
        showMessage('Failed to update chore status', 'error');
        return;
      }

      // Then post approval request for chore
      const requestData = {
        userId: userId,
        parentId: parentId,
        type: "chore",
        name: `Chore: ${chore.name}`,
        amount: chore.points || chore.pointValue || 0,
        reason: `I completed the chore: ${chore.name}`,
        choreId: choreId,
      };

      try {
        const response = await fetch(`${API_URL}/requests`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(requestData),
        });

        if (!response.ok) {
          // Handle non-JSON responses (like plain text for rate limiting)
          let errorMessage = "Failed to request chore approval.";
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          } catch {
            // If JSON parsing fails, use default message
          }
          console.error('❌ Approval request failed:', errorMessage);
          showMessage(errorMessage, 'error');
          return;
        }

        // Check for auto-approval in backend response
        const data = await response.json().catch(() => ({}));
        console.log('✅ Approval request successful, autoApproved:', data.autoApproved);

        // Update achievement for completing chore (claimed/submitted)
        try {
          const { updateAchievementProgress } = await import('../../components/AchievementSystem');
          await updateAchievementProgress('family-helper', 1);
        } catch (error) {
          console.error('Error updating chore achievement:', error);
        }

        // Reload data to get final state
        await loadChoresUserAndRequests();

        if (data.autoApproved) {
          showMessage("Points added! (Auto-Approved)", 'success');
        } else {
          showMessage("Chore claimed! Awaiting parent approval...", 'success');
        }

      } catch (requestError) {
        console.error('❌ Network error during approval request:', requestError);
        showMessage('Network error during approval request', 'error');
      }
    } catch (err) {
      showMessage("Network error. Try again.", 'error');
    }
  };

  if (loading) {
    return (
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Tasks</Text>
        <Text style={styles.placeholder}>Loading tasks...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Tasks Section - Always Visible */}
      <View
        style={{
          ...MOBILE_STYLES.card,
          backgroundColor: themeColors.card,
          marginBottom: MOBILE_LAYOUT.sectionSpacing,
          width: MOBILE_LAYOUT.containerWidth,
          borderColor: themeColors.border + '30'
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
              <Text style={[styles.sectionTitle, { color: themeColors.text, marginBottom: 0, fontSize: 20 }]}>🧹 My Tasks</Text>
              <View style={{
                backgroundColor: themeColors.primary,
                borderRadius: MOBILE_LAYOUT.borderRadius,
                paddingHorizontal: MOBILE_LAYOUT.itemSpacing,
                paddingVertical: 2,
                marginLeft: MOBILE_LAYOUT.itemSpacing
              }}>
                <Text style={{ color: 'white', ...MOBILE_STYLES.caption, fontWeight: 'bold' }}>
                  {chores.length}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.refreshBtn, { backgroundColor: themeColors.secondary }]}
              onPress={onRefresh}
              disabled={refreshing}
              accessibilityRole="button"
              accessibilityLabel={refreshing ? "Refreshing task data" : "Refresh task data"}
              accessibilityHint="Double tap to reload your available tasks"
              accessibilityState={{ disabled: refreshing }}
            >
              <Text style={{ fontSize: 14, color: themeColors.card }}>
                {refreshing ? '⏳' : '↻'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Full-Width Tasks Content */}
      <View style={MOBILE_STYLES.scrollContent}>
        <ScrollView
          style={{ backgroundColor: themeColors.background }}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
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
                  backgroundColor: choresTab === t ? themeColors.primary : 'transparent',
                }}
                onPress={() => { setChoresTab(t as "Active" | "Completed"); setShowArchive(false); }}
                accessibilityRole="tab"
                accessibilityLabel={`${t} tasks`}
                accessibilityHint={`Show ${t.toLowerCase()} tasks`}
                accessibilityState={{ selected: choresTab === t }}
              >
                <Text style={{
                  ...MOBILE_STYLES.body,
                  color: choresTab === t ? 'white' : themeColors.text,
                  fontWeight: choresTab === t ? "bold" : "600",
                }}>
                  {t === "Active" ? "⚡ Active Missions" : "🏆 Completed Tasks"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Tasks content */}
          {(() => {
            // Partition chores based on status
            // Active tab shows: claimable chores + chores waiting for parent approval
            let activeChores = chores.filter(
              c => c.status === 'active' || c.status === 'pending'
            ).sort((a, b) => getChoreCompletedDate(b).getTime() - getChoreCompletedDate(a).getTime());
            // Completed tab shows: only fully approved chores
            let completedChoresAll = chores.filter(
              c => c.status === 'completed' || c.approved
            );
            if (choresTab === "Active") {
              if (activeChores.length === 0) {
                return (
                  <View style={{
                    alignItems: 'center',
                    paddingVertical: MOBILE_LAYOUT.sectionSpacing * 3,
                    paddingHorizontal: MOBILE_LAYOUT.containerPadding,
                  }}>
                    <Text style={{ fontSize: 72, marginBottom: MOBILE_LAYOUT.sectionSpacing }}>🧹</Text>
                    <Text style={{
                      ...MOBILE_STYLES.title,
                      color: themeColors.text,
                      marginBottom: MOBILE_LAYOUT.itemSpacing,
                      textAlign: 'center'
                    }}>
                      No Active Tasks Yet
                    </Text>
                    <Text style={{
                      ...MOBILE_STYLES.body,
                      color: themeColors.textSecondary,
                      textAlign: 'center',
                      marginBottom: MOBILE_LAYOUT.sectionSpacing * 2,
                      lineHeight: MOBILE_LAYOUT.bodySize * 1.5
                    }}>
                      Complete tasks to earn points and watch your money grow! 🌱
                    </Text>
                  </View>
                );
              }
              return (
                <FlatList
                  data={activeChores}
                  keyExtractor={(item) => item._id}
                  renderItem={({ item }) => renderChore(item)}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 10 }}
                  style={{ flex: 1 }}
                  scrollEnabled={false}
                />
              );
            }
            // Completed: filter last 90 days by best-available date, rest archived
            const now = new Date();
            const ninetyDaysAgo = new Date(now);
            ninetyDaysAgo.setDate(now.getDate() - 90);
            const recent = completedChoresAll.filter(c => getChoreCompletedDate(c) >= ninetyDaysAgo);
            const archived = completedChoresAll.filter(c => getChoreCompletedDate(c) < ninetyDaysAgo);
            let choresToShow = recent.sort((a, b) => getChoreCompletedDate(b).getTime() - getChoreCompletedDate(a).getTime());
            if (showArchive)
              choresToShow = [...recent, ...archived].sort((a, b) => getChoreCompletedDate(b).getTime() - getChoreCompletedDate(a).getTime());
            if (choresToShow.length === 0) {
              return (
                <View style={{
                  alignItems: 'center',
                  paddingVertical: MOBILE_LAYOUT.sectionSpacing * 3,
                  paddingHorizontal: MOBILE_LAYOUT.containerPadding,
                }}>
                  <Text style={{ fontSize: 72, marginBottom: MOBILE_LAYOUT.sectionSpacing }}>🏆</Text>
                  <Text style={{
                    ...MOBILE_STYLES.title,
                    color: themeColors.text,
                    marginBottom: MOBILE_LAYOUT.itemSpacing,
                    textAlign: 'center'
                  }}>
                    No Completed Tasks Yet
                  </Text>
                  <Text style={{
                    ...MOBILE_STYLES.body,
                    color: themeColors.textSecondary,
                    textAlign: 'center',
                    marginBottom: MOBILE_LAYOUT.sectionSpacing * 2,
                    lineHeight: MOBILE_LAYOUT.bodySize * 1.5
                  }}>
                    Complete your first task to see your achievements here! ✨
                  </Text>
                </View>
              );
            }
            return (
              <>
                <FlatList
                  data={choresToShow}
                  keyExtractor={(item) => item._id}
                  renderItem={({ item }) => renderChore(item)}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 10 }}
                  style={{ flex: 1 }}
                  scrollEnabled={false}
                />
                {archived.length > 0 && !showArchive && (
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Show all completed tasks from any time"
                    accessibilityHint="Display tasks completed more than 90 days ago"
                    style={{
                      marginTop: MOBILE_LAYOUT.sectionSpacing,
                      alignSelf: "center",
                      backgroundColor: themeColors.accent + "22",
                      paddingHorizontal: MOBILE_LAYOUT.cardPadding * 2,
                      paddingVertical: MOBILE_LAYOUT.itemSpacing,
                      borderRadius: MOBILE_LAYOUT.borderRadius * 2,
                      minHeight: MOBILE_LAYOUT.minTouchTarget,
                    }}
                    onPress={() => setShowArchive(true)}
                  >
                    <Text style={{ color: themeColors.primary, fontWeight: "600", ...MOBILE_STYLES.body }}>Show All Completed Tasks</Text>
                  </TouchableOpacity>
                )}
                {archived.length > 0 && showArchive && (
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Show only recently completed tasks"
                    accessibilityHint="Hide tasks completed more than 90 days ago"
                    style={{
                      marginTop: MOBILE_LAYOUT.itemSpacing * 2,
                      alignSelf: "center",
                      backgroundColor: themeColors.surface,
                      paddingHorizontal: MOBILE_LAYOUT.cardPadding * 1.5,
                      paddingVertical: MOBILE_LAYOUT.itemSpacing,
                      borderRadius: MOBILE_LAYOUT.borderRadius * 1.5,
                      minHeight: MOBILE_LAYOUT.minTouchTarget,
                    }}
                    onPress={() => setShowArchive(false)}
                  >
                    <Text style={{ color: themeColors.primary, fontWeight: "500", ...MOBILE_STYLES.body }}>Show Only Last 90 Days</Text>
                  </TouchableOpacity>
                )}
              </>
            );
          })()}

          {showStaleWarning && (
            <Text style={{
              color: themeColors.warning,
              fontWeight: 'bold',
              fontSize: 15,
              backgroundColor: '#fffbe5',
              borderLeftWidth: 4,
              borderLeftColor: themeColors.warning,
              padding: 12,
              borderRadius: 8,
              marginTop: 16,
              textAlign: 'center'
            }}>
              Your task list may be out of date. Tap Refresh for the latest status.
            </Text>
          )}
        </ScrollView>
      </View>
    </View>
  );

  // Helper for rendering a chore row
  function renderChore(c: any) {
    // Use status field from database for consistency
    // active = can claim, pending = waiting for approval, completed = approved
    const canClaim = c.status === 'active' || (c.status === 'pending' && !c.completed && !c.approved);
    const showPending = c.status === 'pending' && c.completed && !c.approved;
    const showCompleted = c.status === 'completed' || c.approved;

    // Smart categorization and styling
    const category = detectCategory(c.name, c.description);
    const frequencyStyle = getFrequencyStyle(c.frequency);
    const pointsStyle = getPointsStyle(c.points || c.pointValue || 0);
    const points = c.points || c.pointValue || 0;

    return (
      <View key={c._id} style={{
        flexDirection: "column",
        marginBottom: 20,
        backgroundColor: showCompleted ? themeColors.success + "15" :
                      showPending ? themeColors.warning + "20" :
                      category.bgColor || themeColors.surface,
        borderRadius: 12,
        padding: 20,
        borderWidth: 2,
        borderColor: showCompleted ? themeColors.success :
                  showPending ? themeColors.warning :
                  frequencyStyle.borderColor,
        shadowColor: frequencyStyle.accentColor,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: showCompleted || showPending ? 0.1 : 0.2,
        shadowRadius: 3,
        elevation: showCompleted || showPending ? 1 : 3
      }}>
        {/* Header with category and frequency */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
          <Text style={{ fontSize: 16, color: category.color, fontWeight: "bold", marginRight: 6 }}>
            {category.emoji}
          </Text>
          <Text style={{ fontSize: 12, color: category.color, fontWeight: "600", backgroundColor: category.color + "20", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 }}>
            {category.category}
          </Text>
          <View style={{ flex: 1 }} />
          <Text style={{ fontSize: 11, color: frequencyStyle.accentColor, fontWeight: "bold", textTransform: "uppercase" }}>
            🔄 {c.frequency}
          </Text>
        </View>

        {/* Main content area */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          {/* Status indicator */}
          {showCompleted ? (
            <View style={{ alignItems: "center", marginRight: 10 }}>
              <AnimatedCircularProgress
                size={30}
                width={3}
                fill={100}
                tintColor={themeColors.success}
                backgroundColor={themeColors.border}
                duration={800}
              />
              <Text style={{
                position: "absolute",
                top: 5,
                fontSize: 16,
                color: themeColors.card,
                fontWeight: "bold"
              }}>🎉</Text>
            </View>
          ) : showPending ? (
            <View style={{ alignItems: "center", marginRight: 10 }}>
              <View style={{
                width: 30, height: 30, borderRadius: 15,
                backgroundColor: themeColors.warning,
                alignItems: "center", justifyContent: "center"
              }}>
                <Text style={{ fontSize: 16, color: themeColors.card, fontWeight: "bold" }}>⏳</Text>
              </View>
            </View>
          ) : canClaim ? (
            <View style={{ alignItems: "center", marginRight: 10 }}>
              <AnimatedCircularProgress
                size={30}
                width={3}
                fill={25}
                tintColor={themeColors.primary}
                backgroundColor={themeColors.border}
                duration={1200}
              />
              <Text style={{
                position: "absolute",
                top: 5,
                fontSize: 14,
                color: themeColors.card,
                fontWeight: "bold"
              }}>🎯</Text>
            </View>
          ) : (
            <View style={{
              width: 30, height: 30, borderRadius: 15,
              backgroundColor: themeColors.card,
              borderColor: themeColors.border, borderWidth: 2,
              marginRight: 10, alignItems: "center", justifyContent: "center"
            }}></View>
          )}

          {/* Task name and points */}
          <View style={{ flex: 1 }}>
            <Text style={{
              fontWeight: showCompleted ? "700" : "600",
              color: showCompleted ? themeColors.success : showPending ? themeColors.text : themeColors.text,
              fontSize: 15,
              marginBottom: 2
            }} numberOfLines={1} ellipsizeMode="tail">
              {c.name}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={{
                fontSize: 12,
                color: pointsStyle.badgeColor,
                fontWeight: "bold",
                marginRight: 8
              }}>
                💰 {points} pts
              </Text>
              {c.deadline && (
                <Text style={{
                  fontSize: 11,
                  color: themeColors.textSecondary,
                  fontWeight: "500"
                }}>
                  ⏰ Due soon
                </Text>
              )}
            </View>
          </View>

          {/* Action area */}
          <View style={{ alignItems: "flex-end" }}>
            {showCompleted ? (
              <View style={{ alignItems: "center" }}>
                <Text style={{ color: themeColors.success, fontWeight: "bold", fontSize: 12 }}>✅</Text>
                <Text style={{ color: themeColors.success, fontWeight: "bold", fontSize: 10 }}>Approved</Text>
              </View>
            ) : showPending ? (
              <View style={{ alignItems: "center" }}>
                <Text style={{ color: themeColors.warning, fontWeight: "bold", fontSize: 12 }}>🔄</Text>
                <Text style={{ color: themeColors.warning, fontWeight: "bold", fontSize: 10 }}>Pending</Text>
              </View>
            ) : canClaim ? (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={`Claim task: ${c.name} for ${points} points`}
                accessibilityHint="Submit task completion request to parent for approval"
                style={{
                  backgroundColor: themeColors.primary,
                  borderRadius: 8,
                  paddingVertical: 6,
                  paddingHorizontal: 12,
                  shadowColor: themeColors.primary,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 3,
                  elevation: 3
                }}
                onPress={() => handleClaimChore(c._id)}
              >
                <Text style={{ color: themeColors.card, fontWeight: "bold", fontSize: 12 }}>Claim</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>
    );
  }
}
