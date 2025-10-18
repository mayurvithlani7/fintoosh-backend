import HelpModal from '@/components/HelpModal';
import { API_URL } from '@/utils/config';
import { useGlobalFeedback } from '@/utils/globalFeedbackContext';
import { getAuthToken } from '@/utils/secureStorage';
import { useTheme } from '@/utils/themeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
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
    minWidth: 300,
    width: "97%",
    maxWidth: 520,
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

export default function ChoresScreen() {
  const { themeColors } = useTheme();
  const styles = createStyles(themeColors);
  const router = useRouter();
  const [helpModalVisible, setHelpModalVisible] = useState(false);

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: themeColors.background }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: 520, marginBottom: 22, marginTop: 6 }}>
        <TouchableOpacity
          style={{
            backgroundColor: themeColors.surface,
            borderRadius: 20,
            paddingHorizontal: 12,
            paddingVertical: 6,
            elevation: 2,
          }}
          onPress={() => router.push('./')}
        >
          <Text style={{ color: themeColors.text, fontWeight: 'bold', fontSize: 14 }}>⬅️ Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: themeColors.primary }]}>🧹 My Tasks</Text>
        <TouchableOpacity
          style={{
            backgroundColor: themeColors.accent,
            borderRadius: 20,
            paddingHorizontal: 12,
            paddingVertical: 6,
            elevation: 2,
          }}
          onPress={() => setHelpModalVisible(true)}
        >
          <Text style={{ color: themeColors.card, fontWeight: 'bold', fontSize: 14 }}>❓ Help</Text>
        </TouchableOpacity>
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
    </ScrollView>
  );
}

// --- Chores Section (list) ---
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

  // Fetch chores, user data, and approval requests from backend
  const loadChoresUserAndRequests = async () => {
    try {
      const token = await getAuthToken();
      const storedUser = await AsyncStorage.getItem('user');
      if (!token || !storedUser) {
        setLoading(false);
        return;
      }
      const user = JSON.parse(storedUser);
      const userId = user.id || user._id;
      // User
      const userRes = await fetch(`${API_URL}/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!userRes.ok) {
        // Handle rate limiting specifically
        if (userRes.status === 429) {
          const retryAfter = userRes.headers.get('Retry-After');
          const waitTime = retryAfter ? parseInt(retryAfter) : 60;
          showError(`Too many requests. Please wait ${waitTime} seconds before trying again.`);
          setLoading(false);
          return;
        }
        throw new Error("Failed to fetch user data");
      }
      setUserData(await userRes.json());
      // Chores
      const choresRes = await fetch(`${API_URL}/chores/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!choresRes.ok) {
        // Handle rate limiting specifically
        if (choresRes.status === 429) {
          const retryAfter = choresRes.headers.get('Retry-After');
          const waitTime = retryAfter ? parseInt(retryAfter) : 60;
          showError(`Too many requests. Please wait ${waitTime} seconds before trying again.`);
          setLoading(false);
          return;
        }
        throw new Error("Failed to fetch chores");
      }
      setChores(await choresRes.json());
      // Requests (for pending claim)
      const reqRes = await fetch(`${API_URL}/requests/${userId}`);
      if (reqRes.ok) setRequests(await reqRes.json());
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
    let appStateListener = null;
    let currentState = AppState.currentState;
    appStateListener = AppState.addEventListener('change', nextState => {
      if (currentState.match(/inactive|background/) && nextState === 'active') {
        loadChoresUserAndRequests();
      }
      currentState = nextState;
    });

    return () => {
      if (appStateListener && appStateListener.remove) appStateListener.remove();
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
      await patchChore(choreId, { completed: true, completedAt: new Date() }, token);
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
      const storedUser = await AsyncStorage.getItem('user');
      if (!token || !storedUser) {
        showError("Not authenticated");
        return;
      }
      const user = JSON.parse(storedUser);
      const userId = user.id || user._id;
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

      // Normal chore handling - Post approval request for chore
      const requestData = {
        userId: userId,
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
    <View style={[styles.sectionCard, { backgroundColor: themeColors.card, shadowColor: themeColors.border }]}>
      <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Tasks</Text>
      {/* Chores Tabs */}
      <View style={{ flexDirection: "row", justifyContent: "center", marginBottom: 10 }}>
        {["Active", "Completed"].map(t => (
          <TouchableOpacity
            key={t}
            style={{
              backgroundColor: choresTab === t ? themeColors.secondary : themeColors.surface,
              paddingHorizontal: 15,
              paddingVertical: 6,
              borderRadius: 18,
              marginHorizontal: 6,
            }}
            onPress={() => { setChoresTab(t as "Active" | "Completed"); setShowArchive(false); }}
          >
            <Text style={{ color: choresTab === t ? themeColors.card : themeColors.text, fontWeight: choresTab === t ? "bold" : "600", fontSize: 15 }}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {(() => {
        // Partition chores
        let activeChores = chores.filter(
          c => !(c.completed || c.approved)
        );
        let completedChoresAll = chores.filter(
          c => c.completed || c.approved
        );
        if (choresTab === "Active") {
          if (activeChores.length === 0)
            return <Text style={styles.placeholder}>No active tasks.</Text>;
          return activeChores.map(renderChore);
        }
        // Completed: filter last 90 days by best-available date, rest archived
        const now = new Date();
        const ninetyDaysAgo = new Date(now);
        ninetyDaysAgo.setDate(now.getDate() - 90);
        const recent = completedChoresAll.filter(c => getChoreCompletedDate(c) >= ninetyDaysAgo);
        const archived = completedChoresAll.filter(c => getChoreCompletedDate(c) < ninetyDaysAgo);
        let choresToShow = recent;
        if (showArchive)
          choresToShow = [...recent, ...archived].sort((a, b) => getChoreCompletedDate(b).getTime() - getChoreCompletedDate(a).getTime());
        if (choresToShow.length === 0)
          return <Text style={styles.placeholder}>No completed tasks in last 90 days.</Text>;
        return (
          <>
            {choresToShow.map(renderChore)}
            {archived.length > 0 && !showArchive && (
              <TouchableOpacity
                style={{
                  marginTop: 12,
                  alignSelf: "center",
                  backgroundColor: themeColors.surface,
                  borderColor: themeColors.border,
                  borderWidth: 1,
                  paddingHorizontal: 20,
                  paddingVertical: 8,
                  borderRadius: 16
                }}
                onPress={() => setShowArchive(true)}
              >
                <Text style={{ color: themeColors.primary, fontWeight: "600" }}>Show All Completed Tasks</Text>
              </TouchableOpacity>
            )}
            {archived.length > 0 && showArchive && (
              <TouchableOpacity
                style={{
                  marginTop: 10,
                  alignSelf: "center",
                  backgroundColor: themeColors.surface,
                  borderColor: themeColors.border,
                  borderWidth: 1,
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
    </View>
  );

  // Helper for rendering a chore row
  function renderChore(c: any) {
    // Backend fields: completed, approved (booleans)
    // Is there a pending ApprovalRequest for this chore?
    const hasPendingApproval = requests.some(
      (r: any) => r.type === "chore" && r.choreId === c._id && r.status === "Pending"
    );
    // Remove check/toggle logic: always show Claim for active, not completed, not approved, not pending
    const canClaim = !c.completed && !c.approved && !hasPendingApproval;
    // Show Pending if not approved and there is a pending approval
    const showPending = !c.approved && hasPendingApproval;
    // Show Completed/achieved if approved: parent's approval is source of truth
    const showCompleted = c.approved;
    return (
      <View key={c._id} style={{
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 7,
        backgroundColor:
          showCompleted ? themeColors.success + "15"
            : showPending ? themeColors.warning + "33"
            : themeColors.surface,
        borderRadius: 8,
        padding: 9,
        borderColor: showCompleted ? themeColors.success : showPending ? themeColors.warning : themeColors.border,
        borderWidth: 1
      }}>
        {showCompleted ? (
          <>
            <Text style={{
              width: 30, height: 30, borderRadius: 15,
              backgroundColor: themeColors.success,
              color: themeColors.card, fontSize: 19,
              marginRight: 10, textAlign: "center", textAlignVertical: "center", paddingTop: 4, fontWeight: "bold"
            }}>✔️</Text>
            <Text style={{ flex: 3, fontWeight: "700", color: themeColors.success, fontSize: 16, marginRight: 5 }}>{c.name}</Text>
            <Text style={{ flex: 1, color: themeColors.success, fontWeight: "bold", fontSize: 15 }}>{c.points || c.pointValue || 0} pts</Text>
            <Text style={{ color: themeColors.success, fontWeight: "bold", marginLeft: 9 }}>
              Completed! 🎉
            </Text>
          </>
        ) : (
          <>
            <View style={{
              width: 30, height: 30, borderRadius: 15,
              backgroundColor: themeColors.card,
              borderColor: themeColors.success, borderWidth: 2,
              marginRight: 10, alignItems: "center", justifyContent: "center"
            }}></View>
            <Text style={{ flex: 3, fontWeight: "600", color: themeColors.text, fontSize: 15 }}>{c.name}</Text>
            <Text style={{ flex: 1, color: themeColors.primary, fontWeight: "bold", fontSize: 14 }}>{c.points || c.pointValue || 0} pts</Text>
            {/* Claim button if eligible */}
            {canClaim && (
              <TouchableOpacity
                style={{
                  backgroundColor: themeColors.warning + "33",
                  borderRadius: 8,
                  paddingVertical: 5,
                  paddingHorizontal: 13,
                  marginLeft: 7
                }}
                onPress={() => handleClaimChore(c._id)}
              >
                <Text style={{ color: themeColors.warning, fontWeight: "bold" }}>Claim</Text>
              </TouchableOpacity>
            )}
            {showPending && (
              <Text style={{ color: themeColors.warning, fontWeight: "bold", marginLeft: 9 }}>Pending...</Text>
            )}
          </>
        )}
      </View>
    );
  }
}
