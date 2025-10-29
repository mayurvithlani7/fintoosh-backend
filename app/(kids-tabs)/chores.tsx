import HelpModal from '@/components/HelpModal';
import AnimatedCircularProgress from '@/components/animations/AnimatedCircularProgress';
import { API_URL } from '@/utils/config';
import { handleApiError } from '@/utils/errorHandler';
import { useGlobalFeedback } from '@/utils/globalFeedbackContext';
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
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 22,
    marginTop: 6,
    color: themeColors.primary,
  },
  sectionCard: {
    backgroundColor: themeColors.card,
    borderRadius: 14,
    marginBottom: 16,
    padding: 18,
    width: '100%',
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
    color: themeColors.textSecondary,
    fontStyle: "italic", fontSize: 15,
    marginBottom: 2, marginTop: 2, minHeight: 26
  },
});

export default function TasksScreen() {
  const { themeColors } = useTheme();
  const styles = createStyles(themeColors);
  const router = useRouter();
  const [helpModalVisible, setHelpModalVisible] = useState(false);

  return (
    <View style={styles.container}>
      <View style={{ width: '100%', maxWidth: 520, marginBottom: 16, marginTop: 6 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Go back to home screen"
            accessibilityHint="Navigate back to the main dashboard"
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
          >
            <Text style={{ color: themeColors.text, fontWeight: 'bold', fontSize: 14 }}>⬅️ Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Help and information"
            accessibilityHint="Open help guide for tasks and chores"
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
          >
            <Text style={{ color: themeColors.card, fontWeight: 'bold', fontSize: 14 }}>❓ Help</Text>
          </TouchableOpacity>
        </View>
        <View style={{ alignItems: 'center' }}>
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
                text: "These are your super tasks waiting to be completed:",
                icon: "📋"
              },
              {
                type: "bullet",
                text: "Shows the task name and how many points you'll win! 🏆"
                },
              {
                type: "bullet",
                text: "Press 'Claim' when you're done being awesome!"
              },
              {
                type: "bullet",
                text: "It says 'Pending...' while your parent checks your work"
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
                text: "Look at all the awesome tasks you've finished:",
                icon: "✅"
              },
              {
                type: "bullet",
                text: "Green background = Your parent said 'Great job!' 🎉"
              },
              {
                type: "bullet",
                text: "Yellow background = Still waiting for approval ⏳"
              },
              {
                type: "bullet",
                text: "Shows your points earned and when you finished"
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
    </View>
  );
}

// --- Chores Section (list) ---
import { useStaleDataWarning } from '@/utils/useStaleDataWarning';

function ChoresSection() {
  const { themeColors } = useTheme();
  const styles = createStyles(themeColors);
  const [chores, setChores] = useState<any[]>([]);
  const [userData, setUserData] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { showError, showFeedback } = useGlobalFeedback();
  // Tabs/archive for chores
  const [choresTab, setChoresTab] = useState<'Active' | 'Completed'>('Active');
  const [showArchive, setShowArchive] = useState(false);
  const [showStaleWarning, , markRefreshed] = useStaleDataWarning();

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
  const loadChoresUserAndRequests = async () => {
    console.log('🔄 Chores: Starting loadChoresUserAndRequests...');
    try {
      const token = await getAuthToken();
      const user = await getUserData();

      console.log('🔄 Chores: Token exists:', !!token, 'User exists:', !!user);

      if (!token || !user) {
        console.log('🔄 Chores: Missing token or user data');
        setLoading(false);
        return;
      }
      const userId = user.id;
      // User
      const userRes = await fetch(`${API_URL}/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!userRes.ok) {
        await handleApiError(userRes, { showError, feature: 'Chores - User Data' });
        setLoading(false);
        return;
      }
      setUserData(await userRes.json());
      // Chores
      const choresRes = await fetch(`${API_URL}/chores/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!choresRes.ok) {
        await handleApiError(choresRes, { showError, feature: 'Chores - Task List' });
        setLoading(false);
        return;
      }
      const choresData = await choresRes.json();
      // Security: Only allow chores for this child session (user.id)
      if (
        user &&
        choresData &&
        choresData.length > 0 &&
        choresData.some((c: any) => (c.childId && c.childId !== user.id))
      ) {
        const { clearSensitiveAppData } = await import('@/utils/secureStorage');
        await clearSensitiveAppData();
        if (typeof window !== 'undefined' && window.location) window.location.href = '/login';
        return;
      }
      setChores(choresData);
      // Requests (for pending claim)
      const reqRes = await fetch(`${API_URL}/requests/${userId}`);
      if (reqRes.ok) setRequests(await reqRes.json());
      markRefreshed();
    } catch (err) {
      showError("Could not load chores/user info.");
    } finally {
      setLoading(false);
    }
  };

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
      showError('Failed to mark as done');
    }
  };

  // Handle claim: send approval request to parent via backend
  const handleClaimChore = async (choreId: string) => {
    try {
      const token = await getAuthToken();
      const user = await getUserData();
      if (!token || !user) {
        showError("Not authenticated");
        return;
      }
      const userId = user.id;
      const chore = chores.find(c => c._id === choreId);
      if (!chore) {
        showError("Chore not found");
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
          showError(errorMessage);
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

        // Reload data immediately to show completion
        await loadChoresUserAndRequests();
        showFeedback("Welcome task completed! You earned 25 points! 🎉");
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
        showError("No parent or caregiver found for your account. Please ask a grown-up to check your family settings.");
        return;
      }

      // Normal chore handling - Post approval request for chore
      const requestData = {
        userId: userId,
        parentId: parentId,
        type: "chore",
        name: `Chore: ${chore.name}`,
        amount: chore.points || chore.pointValue || 0,
        reason: `I completed the chore: ${chore.name}`,
        choreId: choreId,
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
        let errorMessage = "Failed to request chore approval.";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          // If JSON parsing fails, use default message
        }
        showError(errorMessage);
        return;
      }
      // Check for auto-approval in backend response
      const data = await response.json().catch(() => ({}));
      await loadChoresUserAndRequests();
      if (data.autoApproved) {
        showFeedback("Points added! (Auto-Approved)");
      } else {
        showFeedback("Chore claimed! Awaiting parent approval...");
      }
    } catch (err) {
      showError("Network error. Try again.");
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
      {/* Quick Actions Header */}
      <View style={{
        backgroundColor: themeColors.surface,
        borderRadius: 16,
        marginBottom: 16,
        padding: 16,
        width: '97%',
        maxWidth: 520,
        alignSelf: 'center',
        elevation: 3,
        shadowColor: themeColors.border,
        borderWidth: 1,
        borderColor: themeColors.border + '30',
      }}>
        <TouchableOpacity
          style={{
            backgroundColor: themeColors.secondary,
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderRadius: 10,
            alignItems: 'center',
            elevation: 1,
          }}
          onPress={() => loadChoresUserAndRequests()}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel={loading ? "Refreshing task data" : "Refresh task data"}
          accessibilityHint="Reload latest information about your tasks"
          accessibilityState={{ disabled: loading }}
        >
          <Text style={{
            color: themeColors.card,
            fontSize: 14,
            fontWeight: '600'
          }}>
            {loading ? '🔄 Refreshing...' : '🔄 Refresh Tasks'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tasks Section - Always Visible */}
      <View
        style={{
          backgroundColor: themeColors.card,
          borderRadius: 14,
          marginBottom: 16,
          width: '97%',
          maxWidth: 520,
          alignSelf: 'center',
          elevation: 2,
          shadowColor: themeColors.border,
        }}
      >
        <View style={{
          padding: 18,
          paddingBottom: 8,
          borderBottomWidth: 1,
          borderBottomColor: themeColors.border + '30'
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[styles.sectionTitle, { color: themeColors.text, marginBottom: 0 }]}>🧹 My Tasks</Text>
              <View style={{
                backgroundColor: themeColors.primary,
                borderRadius: 10,
                paddingHorizontal: 8,
                paddingVertical: 2,
                marginLeft: 8
              }}>
                <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>
                  {chores.length}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Full-Width Tasks Content */}
      <View style={{
        backgroundColor: themeColors.background,
        paddingHorizontal: 16,
        paddingTop: 20,
        paddingBottom: 40,
      }}>
        <ScrollView
          style={{ backgroundColor: themeColors.background }}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Enhanced Tabs */}
          <View style={{
            flexDirection: 'row',
            backgroundColor: themeColors.surface,
            borderRadius: 16,
            padding: 4,
            marginBottom: 20,
            elevation: 2,
            shadowColor: themeColors.border,
          }}>
            {["Active", "Completed"].map(t => (
              <TouchableOpacity
                key={t}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  borderRadius: 12,
                  backgroundColor: choresTab === t ? themeColors.primary : 'transparent',
                  alignItems: 'center',
                  minHeight: 48,
                }}
                onPress={() => { setChoresTab(t as "Active" | "Completed"); setShowArchive(false); }}
                accessibilityRole="tab"
                accessibilityLabel={`${t} tasks`}
                accessibilityHint={`Show ${t.toLowerCase()} tasks`}
                accessibilityState={{ selected: choresTab === t }}
              >
                <Text style={{
                  color: choresTab === t ? 'white' : themeColors.text,
                  fontWeight: choresTab === t ? "bold" : "600",
                  fontSize: 16
                }}>
                  {t === "Active" ? "⚡ Active Missions" : "🏆 Completed Tasks"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Tasks content */}
          {(() => {
            // Partition chores
            let activeChores = chores.filter(
              c => !(c.completed || c.approved)
            ).sort((a, b) => getChoreCompletedDate(b).getTime() - getChoreCompletedDate(a).getTime());
            let completedChoresAll = chores.filter(
              c => c.completed || c.approved
            );
            if (choresTab === "Active") {
              if (activeChores.length === 0) {
                return (
                  <View style={{
                    alignItems: 'center',
                    paddingVertical: 60,
                    paddingHorizontal: 20,
                  }}>
                    <Text style={{ fontSize: 72, marginBottom: 20 }}>🧹</Text>
                    <Text style={{
                      fontSize: 22,
                      fontWeight: 'bold',
                      color: themeColors.text,
                      marginBottom: 12,
                      textAlign: 'center'
                    }}>
                      No Active Tasks Yet
                    </Text>
                    <Text style={{
                      fontSize: 16,
                      color: themeColors.textSecondary,
                      textAlign: 'center',
                      marginBottom: 32,
                      lineHeight: 24
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
                    No Completed Tasks Yet
                  </Text>
                  <Text style={{
                    fontSize: 16,
                    color: themeColors.textSecondary,
                    textAlign: 'center',
                    marginBottom: 32,
                    lineHeight: 24
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
                    <Text style={{ color: themeColors.primary, fontWeight: "600", fontSize: 16 }}>Show All Completed Tasks</Text>
                  </TouchableOpacity>
                )}
                {archived.length > 0 && showArchive && (
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Show only recently completed tasks"
                    accessibilityHint="Hide tasks completed more than 90 days ago"
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
    const canClaim = c.status === 'active';
    const showPending = c.status === 'pending';
    const showCompleted = c.status === 'completed';

    // Smart categorization and styling
    const category = detectCategory(c.name, c.description);
    const frequencyStyle = getFrequencyStyle(c.frequency);
    const pointsStyle = getPointsStyle(c.points || c.pointValue || 0);
    const points = c.points || c.pointValue || 0;

    return (
      <View key={c._id} style={{
        flexDirection: "column",
        marginBottom: 12,
        backgroundColor: showCompleted ? themeColors.success + "15" :
                      showPending ? themeColors.warning + "20" :
                      category.bgColor || themeColors.surface,
        borderRadius: 12,
        padding: 12,
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
