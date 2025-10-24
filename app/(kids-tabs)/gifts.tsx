import HelpModal from '@/components/HelpModal';
import { API_URL } from '@/utils/config';
import { useCurrency } from '@/utils/currencyContext';
import { handleApiError } from '@/utils/errorHandler';
import { getAuthToken, getUserData } from '@/utils/secureStorage';
import { useTheme } from '@/utils/themeContext';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Alert,
    FlatList,
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

export default function GiftsScreen() {
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
            accessibilityHint="Double tap to open help guide for gifts and rewards"
          >
            <Text style={{ color: themeColors.card, fontWeight: 'bold', fontSize: 14 }}>❓ Help</Text>
          </TouchableOpacity>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={[styles.title, { color: themeColors.primary }]}>🎁 My Gifts</Text>
        </View>
      </View>

      <GiftsSection />

      {/* Help Modal */}
      <HelpModal
        visible={helpModalVisible}
        onClose={() => setHelpModalVisible(false)}
        title="🎁 My Gifts - Help"
        tabs={[
          {
            title: "Magical Gift Treasure Chest! 🎁",
            content: [
              {
                type: "text",
                text: "Wow! Special magical prizes you can unlock with your hard-earned points:",
                icon: "🎁"
              },
              {
                type: "bullet",
                text: "Available - Treasures ready for you to claim! ✨"
              },
              {
                type: "bullet",
                text: "Claimed - Your collection of won prizes! 🏅"
              },
              {
                type: "bullet",
                text: "Need enough points to open the treasure chest 🔑"
              },
              {
                type: "bullet",
                text: "Parent approval makes the magic happen! ✨"
              },
              {
                type: "highlight",
                text: "Awesome way to spend points on super fun rewards! 💰🎊",
                icon: "💰"
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
                text: "🖱️ Tap 'Claim' on magical gifts"
              },
              {
                type: "bullet",
                text: "⏳ Shows 'Pending...' while magic happens"
              },
              {
                type: "bullet",
                text: "👨‍👩‍👧‍👦 Parent gives the official victory stamp!"
              },
              {
                type: "bullet",
                text: "🎁 You get your prize when approved - yay!"
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

// --- Gifts Section (rewards/claimables) ---
import { useStaleDataWarning } from "@/utils/useStaleDataWarning";

function GiftsSection() {
  const { themeColors } = useTheme();
  const styles = createStyles(themeColors);
  const { formatAmount } = useCurrency();
  const [rewards, setRewards] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  // Tabs/filter for rewards
  const [rewardsTab, setRewardsTab] = useState<'Available' | 'Claimed'>('Available');
  const [showRewardsArchive, setShowRewardsArchive] = useState(false);
  const [showStaleWarning, , markRefreshed] = useStaleDataWarning();

  // Load rewards and requests on component mount
  const loadRewardsAndRequests = async () => {
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
        await handleApiError(userRes, { showError: (msg) => Alert.alert('Error', msg), feature: 'Gifts - User Data' });
        setLoading(false);
        return;
      }
      const freshUserData = await userRes.json();
      setUserData(freshUserData);

      // Load all approval requests first (needed for reward status logic)
      const reqRes = await fetch(`${API_URL}/requests/${userId}`);
      let requestsData: any[] = [];
      if (reqRes.ok) {
        requestsData = await reqRes.json();
        setRequests(requestsData);
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
      console.error('Error loading rewards and requests:', error);
      Alert.alert('Error', 'Failed to load gifts and rewards.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRewardsAndRequests();

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
          loadRewardsAndRequests();
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
        loadRewardsAndRequests();
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
      loadRewardsAndRequests();
    }, [])
  );

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
          'Authorization': `Bearer ${token}` },
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
          const rewardsResponse = await fetch(`${API_URL}/rewards/${user2._id}`, {
            headers: { 'Authorization': `Bearer ${token2}` },
          });
          if (rewardsResponse.ok) {
            const rewardsData = await rewardsResponse.json();
            setRewards(rewardsData);
          }
        }
      } catch {}
      setMsg("Gift claim submitted for parent approval.");
      setTimeout(() => setMsg(""), 5000);

    } catch (error) {
      console.error('Error claiming reward:', error);
      Alert.alert('Error', 'Failed to claim gift.');
    } finally {
      setClaiming(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Gifts</Text>
        <Text style={styles.placeholder}>Loading gifts...</Text>
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
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>My Gifts</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity
            style={[styles.refreshBtn, { backgroundColor: loading ? themeColors.surface : themeColors.primary }]}
            onPress={() => loadRewardsAndRequests()}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel={loading ? "Refreshing gifts and rewards" : "Refresh gifts and rewards"}
            accessibilityHint="Double tap to reload your available gifts"
            accessibilityState={{ disabled: loading }}
          >
            <Text style={[styles.refreshBtnText, { color: loading ? themeColors.textSecondary : themeColors.card }]}>
              {loading ? 'Refreshing...' : '🔄 Refresh Gifts'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Rewards Tabs - colorful and engaging */}
      <View style={{
        flexDirection: "row",
        justifyContent: "center",
        marginBottom: 16,
        backgroundColor: themeColors.surface + '80',
        borderRadius: 20,
        padding: 4
      }}>
        {["Available", "Claimed"].map(t => (
          <TouchableOpacity
            key={t}
            style={{
              backgroundColor: rewardsTab === t ? themeColors.accent : 'transparent',
              paddingHorizontal: 20,
              paddingVertical: 10,
              borderRadius: 16,
              marginHorizontal: 2,
              flex: 1,
              alignItems: 'center',
              shadowColor: rewardsTab === t ? themeColors.accent : 'transparent',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 4,
              elevation: rewardsTab === t ? 3 : 0,
            }}
            onPress={() => { setRewardsTab(t as "Available" | "Claimed"); setShowRewardsArchive(false); }}
            accessibilityRole="tab"
            accessibilityLabel={`${t} rewards`}
            accessibilityHint={`Show ${t.toLowerCase()} rewards`}
            accessibilityState={{ selected: rewardsTab === t }}
          >
            <Text style={{
              color: rewardsTab === t ? themeColors.card : themeColors.text,
              fontWeight: rewardsTab === t ? "bold" : "600",
              fontSize: 16
            }}>
              {t === "Available" ? "🎯 Ready to Win!" : "🏆 My Treasures!"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {/* Rewards content - always shows appropriate empty states */}
      {(() => {
        // Helper for claimed date
        const getRewardClaimedDate = (r: any) => {
          if (r.purchasedAt && typeof r.purchasedAt === "string") return new Date(r.purchasedAt);
          if (r.createdAt && typeof r.createdAt === "string") return new Date(r.createdAt);
          if (r._id && typeof r._id === "string" && r._id.length >= 8) {
            const timestamp = parseInt(r._id.slice(0, 8), 16) * 1000;
            return new Date(timestamp);
          }
          return new Date();
        };
        let availableRewards = rewards.filter(r => !r.purchased).sort((a, b) =>
          getRewardClaimedDate(b).getTime() - getRewardClaimedDate(a).getTime()
        );
        let claimedAll = rewards.filter(r => r.purchased);
        const now = new Date();
        const ninetyDaysAgo = new Date(now);
        ninetyDaysAgo.setDate(now.getDate() - 90);
        const claimedRecent = claimedAll.filter(r => getRewardClaimedDate(r) >= ninetyDaysAgo).sort((a, b) =>
          getRewardClaimedDate(b).getTime() - getRewardClaimedDate(a).getTime()
        );
        const claimedArchived = claimedAll.filter(r => getRewardClaimedDate(r) < ninetyDaysAgo);
        let claimedRewards = claimedRecent;
        if (showRewardsArchive) {
          claimedRewards = [...claimedRecent, ...claimedArchived].sort((a, b) =>
            getRewardClaimedDate(b).getTime() - getRewardClaimedDate(a).getTime()
          );
        }
        if (rewardsTab === "Available") {
          if (availableRewards.length === 0)
            return <Text style={styles.placeholder}>No gifts available to claim right now!</Text>;
          return (
            <FlatList
              data={availableRewards}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => renderReward(item)}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 10 }}
              style={{ flex: 1 }}
              scrollEnabled={false }
            />
          );
        }
        // Claimed
        if (claimedRewards.length === 0)
          return <Text style={styles.placeholder}>No claimed gifts in the last 90 days.</Text>;
        return (
          <>
            <FlatList
              data={claimedRewards}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => renderReward(item)}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 10 }}
              style={{ flex: 1 }}
              scrollEnabled={false }
            />
            {claimedArchived.length > 0 && !showRewardsArchive && (
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
                onPress={() => setShowRewardsArchive(true)}
              >
                <Text style={{ color: themeColors.primary, fontWeight: "600" }}>Show All Claimed Gifts</Text>
              </TouchableOpacity>
            )}
            {claimedArchived.length > 0 && showRewardsArchive && (
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
                onPress={() => setShowRewardsArchive(false)}
              >
                <Text style={{ color: themeColors.primary, fontWeight: "500" }}>Show Only Last 90 Days</Text>
              </TouchableOpacity>
            )}
          </>
        );
      })()}

      {msg ? <Text style={styles.statusMessage}>{msg}</Text> : null}
    </ScrollView>
  );

  // Individual reward renderer - visually engaging for kids
  function renderReward(r: any) {
    // Pending if there is a pending approval request for this reward
    const hasPending = requests.some(
      (req: any) => req.type === "reward" && req.rewardId === r._id && req.status === "Pending"
    );
    // "Can claim" if available, not purchased, not pending, and enough points
    const canClaim = r.available && !r.purchased && userData && userData.currentPoints >= r.cost && !hasPending;

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
        accessibilityLabel={`Gift: ${r.name}. Cost: ${formatAmount(r.cost)} points. Status: ${getStatusText()}.`}
        accessibilityHint={canClaim ? 'Double tap to claim this gift' : r.purchased ? 'This gift has been claimed' : hasPending ? 'Waiting for parent approval' : 'You need more points to claim this gift'}
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
                  (You have: {formatAmount(userData.currentPoints || 0)})
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
            accessibilityLabel={`Claim gift: ${r.name}`}
            accessibilityHint="Double tap to submit gift claim request to parent"
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
