import HelpModal from '@/components/HelpModal';
import { useCenteredMessage } from '@/utils/centeredMessageContext';
import { API_URL } from '@/utils/config';
import { useCurrency } from '@/utils/currencyContext';
import { handleApiError } from '@/utils/errorHandler';
import { getAuthToken, getUserData } from '@/utils/secureStorage';
import { useTheme } from '@/utils/themeContext';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from "expo-router";
import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
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
    paddingVertical: MOBILE_LAYOUT.sectionSpacing,
    paddingHorizontal: MOBILE_LAYOUT.containerPadding,
    backgroundColor: themeColors.background,
  },
  title: {
    ...MOBILE_STYLES.title,
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

export default function GiftsScreen() {
  const { themeColors } = useTheme();
  const styles = createStyles(themeColors);
  const router = useRouter();
  const [helpModalVisible, setHelpModalVisible] = useState(false);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: themeColors.background }}
      contentContainerStyle={{ alignItems: "center", paddingVertical: 16, paddingHorizontal: 8 }}
    >
      <View style={{ ...MOBILE_STYLES.fullWidthContainer, marginBottom: MOBILE_LAYOUT.sectionSpacing, marginTop: MOBILE_LAYOUT.itemSpacing }}>
        <View style={{ ...MOBILE_STYLES.row, justifyContent: 'space-between', marginBottom: MOBILE_LAYOUT.itemSpacing }}>
          <TouchableOpacity
            style={{
              backgroundColor: themeColors.surface,
              borderRadius: MOBILE_LAYOUT.cardBorderRadius,
              paddingHorizontal: MOBILE_LAYOUT.cardPadding,
              paddingVertical: MOBILE_LAYOUT.itemSpacing,
              elevation: MOBILE_LAYOUT.buttonElevation,
              minWidth: MOBILE_LAYOUT.minTouchTarget,
              minHeight: MOBILE_LAYOUT.minTouchTarget,
              justifyContent: 'center',
              alignItems: 'center',
            }}
            onPress={() => router.push('./')}
            accessibilityRole="button"
            accessibilityLabel="Go back to home screen"
            accessibilityHint="Double tap to return to the main dashboard"
          >
            <Text style={{ ...MOBILE_STYLES.body, color: themeColors.text, fontWeight: 'bold' }}>⬅️ Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              backgroundColor: themeColors.accent,
              borderRadius: MOBILE_LAYOUT.cardBorderRadius,
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
            accessibilityHint="Double tap to open help guide for gifts and rewards"
          >
            <Text style={{ ...MOBILE_STYLES.body, color: themeColors.card, fontWeight: 'bold' }}>❓ Help</Text>
          </TouchableOpacity>
        </View>
        <View style={MOBILE_STYLES.center}>
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
    </ScrollView>
  );
}

// --- Gifts Section (rewards/claimables) ---
import { MOBILE_LAYOUT, MOBILE_STYLES } from '@/utils/mobileLayout';
import { useStaleDataWarning } from "@/utils/useStaleDataWarning";

function GiftsSection() {
  const { themeColors } = useTheme();
  const { showMessage } = useCenteredMessage();
  const styles = createStyles(themeColors);
  const { formatAmount } = useCurrency();
  const [rewards, setRewards] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  // Tabs/filter for rewards
  const [rewardsTab, setRewardsTab] = useState<'Available' | 'Claimed'>('Available');
  const [showRewardsArchive, setShowRewardsArchive] = useState(false);
  const [showStaleWarning, , markRefreshed] = useStaleDataWarning();

  // Load rewards and requests on component mount
  const loadRewardsAndRequests = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      const token = await getAuthToken();
      const user = await getUserData();

      if (!token || !user) {
        if (!isRefresh) setLoading(false);
        return;
      }
      // Always fetch freshest user data from backend (not AsyncStorage!)
      const userId = user.id;
      const userRes = await fetch(`${API_URL}/users/${user.id || (user as any)._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!userRes.ok) {
        await handleApiError(userRes, { showError: (msg) => showMessage(msg, 'error'), feature: 'Gifts - User Data' });
        if (!isRefresh) setLoading(false);
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
      showMessage('Failed to load gifts and rewards.', 'error');
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
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

  // Memoized helper functions
  const getRewardStatus = useCallback((r: any) => {
    if (r.purchased) return "claimed";
    return "available";
  }, []);

  const getRewardClaimedDate = useCallback((r: any): Date => {
    if (r.purchasedAt && typeof r.purchasedAt === "string") return new Date(r.purchasedAt);
    if (r.createdAt && typeof r.createdAt === "string") return new Date(r.createdAt);
    if (r._id && typeof r._id === "string" && r._id.length >= 8) {
      const timestamp = parseInt(r._id.slice(0, 8), 16) * 1000;
      return new Date(timestamp);
    }
    return new Date();
  }, []);

  // Memoized processed data
  const processedRewards = useMemo(() => {
    const availableRewards = rewards.filter(r => !r.purchased)
      .sort((a, b) => getRewardClaimedDate(b).getTime() - getRewardClaimedDate(a).getTime());

    const claimedRewards = rewards.filter(r => r.purchased)
      .sort((a, b) => getRewardClaimedDate(b).getTime() - getRewardClaimedDate(a).getTime());

    return {
      available: availableRewards,
      claimed: claimedRewards
    };
  }, [rewards, getRewardClaimedDate]);

  // Memoized reward renderer component
  const RewardItem = memo(({ reward, userData, requests, onClaim, claiming }: {
    reward: any;
    userData: any;
    requests: any[];
    onClaim: (rewardId: string) => void;
    claiming: string | null;
  }) => {
    const { themeColors } = useTheme();
    const { formatAmount } = useCurrency();

    // Pending if there is a pending approval request for this reward
    const hasPending = requests.some(
      (req: any) => req.type === "reward" && req.rewardId === reward._id && req.status === "Pending"
    );
    // "Can claim" if available, not purchased, not pending, and enough available points (total - pending)
    const availablePoints = userData ? (userData.currentPoints || 0) - (userData.pendingCurrentPoints || 0) : 0;
    const canClaim = reward.available && !reward.purchased && userData && availablePoints >= reward.cost && !hasPending;

    // Fun status icons and colors for kids
    const getStatusConfig = () => {
      if (reward.purchased) return { icon: '🏆', color: themeColors.success, bgColor: themeColors.success + '20', text: 'Won!' };
      if (hasPending) return { icon: '⏳', color: themeColors.warning, bgColor: themeColors.warning + '25', text: 'Waiting...' };
      if (canClaim) return { icon: '🎯', color: themeColors.primary, bgColor: themeColors.primary + '20', text: 'Claim Now!' };
      return { icon: '💪', color: themeColors.textSecondary, bgColor: themeColors.surface, text: 'Keep Saving!' };
    };

    const statusConfig = getStatusConfig();

    return (
      <View
        style={{
          backgroundColor: statusConfig.bgColor,
          marginVertical: 5,
          borderRadius: 7,
          padding: 16,
          borderWidth: 1,
          borderColor: reward.purchased ? themeColors.success : hasPending ? themeColors.warning : canClaim ? themeColors.primary : themeColors.border,
          shadowColor: statusConfig.color,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.08,
          shadowRadius: 2,
          elevation: 1,
        }}
        accessibilityLabel={`Gift: ${reward.name}. Cost: ${formatAmount(reward.cost)} points. Status: ${statusConfig.text}.`}
        accessibilityHint={canClaim ? 'Double tap to claim this gift' : reward.purchased ? 'This gift has been claimed' : hasPending ? 'Waiting for parent approval' : 'You need more points to claim this gift'}
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
              {reward.name}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{
                fontSize: 16,
                fontWeight: "bold",
                color: themeColors.primary,
                marginRight: 8
              }}>
                💰 {formatAmount(reward.cost)} points
              </Text>
              {/* Only show total for available gifts (not claimed) */}
              {userData && !reward.purchased && (
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
        {reward.purchased ? (
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
          <View style={{ alignItems: 'center' }}>
            <View style={{
              backgroundColor: themeColors.warning,
              borderRadius: 12,
              paddingVertical: 10,
              paddingHorizontal: 16,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              marginBottom: 8
            }}>
              <Text style={{ fontSize: 16, marginRight: 8 }}>⏳</Text>
              <Text style={{
                color: 'white',
                fontWeight: "bold",
                fontSize: 16
              }}>
                Waiting for Parent Approval
              </Text>
            </View>
            <Text style={{
              fontSize: 14,
              color: themeColors.warning,
              textAlign: 'center',
              fontWeight: '500'
            }}>
              Your parent will review and approve your gift claim! 🎁👨‍👩‍👧‍👦
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
            onPress={() => onClaim(reward._id)}
            disabled={claiming === reward._id}
            accessibilityRole="button"
            accessibilityLabel={`Claim gift: ${reward.name}`}
            accessibilityHint="Double tap to submit gift claim request to parent"
            accessibilityState={{ disabled: claiming === reward._id }}
          >
            <Text style={{ fontSize: 18, marginRight: 8 }}>🎁</Text>
            <Text style={{
              color: 'white',
              fontWeight: "bold",
              fontSize: 16
            }}>
              {claiming === reward._id ? "Claiming..." : statusConfig.text}
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
  });

  const handleClaimReward = async (rewardId: string) => {
    try {
      setClaiming(rewardId);

      const token = await getAuthToken();
      const user = await getUserData();
      if (!token || !user) {
        showMessage('Not authenticated.', 'error');
        return;
      }
      const reward = rewards.find(r => r._id === rewardId);
      if (!reward) {
        showMessage('Reward not found.', 'error');
        return;
      }
      // For rewards, claiming means PATCHing reward to mark as claim requested (purchased: true),
      // backend sets available: false, purchased: false (pending), and creates ApprovalRequest
      console.log('🎁 DEBUG: Making PATCH request to:', `${API_URL}/rewards/${rewardId}`);
      console.log('🎁 DEBUG: Request method:', 'PATCH');
      console.log('🎁 DEBUG: Request headers:', {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.substring(0, 20)}...`
      });
      console.log('🎁 DEBUG: Request body:', JSON.stringify({ purchased: true }));

      const response = await fetch(`${API_URL}/rewards/${rewardId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ purchased: true }),
      });

      console.log('🎁 DEBUG: Response status:', response.status);
      console.log('🎁 DEBUG: Response ok:', response.ok);

      if (!response.ok) {
        // Handle non-JSON responses (like plain text for rate limiting)
        let errorMessage = 'Failed to claim reward.';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          // If JSON parsing fails, use default message
        }
        showMessage(errorMessage, 'error');
        return;
      }

      // Update userData to reflect pending points immediately
      if (userData) {
        setUserData({
          ...userData,
          currentPoints: (userData.currentPoints || 0) - reward.cost,
          pendingCurrentPoints: (userData.pendingCurrentPoints || 0) + reward.cost
        });
      }

      // Fetch updated requests and rewards for consistency
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
      setMsg("Gift claim submitted for parent approval.");
      setTimeout(() => setMsg(""), 5000);

    } catch (error) {
      console.error('Error claiming reward:', error);
      showMessage('Failed to claim gift.', 'error');
    } finally {
      setClaiming(null);
    }
  };

  // Memoized render function
  const renderReward = useCallback(({ item }: { item: any }) => (
    <RewardItem
      reward={item}
      userData={userData}
      requests={requests}
      onClaim={handleClaimReward}
      claiming={claiming}
    />
  ), [userData, requests, claiming, handleClaimReward]);

  // Memoized key extractor
  const keyExtractor = useCallback((item: any) => item._id, []);

  const onRefresh = React.useCallback(() => {
    console.log('[GIFTS] Manual refresh triggered');
    setRefreshing(true);
    loadRewardsAndRequests(true);
  }, []);

  if (loading) {
    return (
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Gifts</Text>
        <Text style={styles.placeholder}>Loading gifts...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Gifts Section - Always Visible */}
      <View
        style={{
          backgroundColor: themeColors.card,
          borderRadius: 16,
          marginBottom: 16,
          minWidth: 320,
          width: '97%',
          maxWidth: 520,
          alignSelf: 'center',
          elevation: 3,
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
              <Text style={[styles.sectionTitle, { color: themeColors.text, marginBottom: 0, fontSize: 20 }]}>🎁 My Gifts</Text>
              <View style={{
                backgroundColor: themeColors.primary,
                borderRadius: 10,
                paddingHorizontal: 8,
                paddingVertical: 2,
                marginLeft: 8
              }}>
                <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>
                  {rewards.length}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.refreshBtn, { backgroundColor: themeColors.secondary }]}
              onPress={onRefresh}
              disabled={refreshing}
              accessibilityRole="button"
              accessibilityLabel={refreshing ? "Refreshing gifts and rewards" : "Refresh gifts and rewards"}
              accessibilityHint="Double tap to reload your available gifts"
              accessibilityState={{ disabled: refreshing }}
            >
              <Text style={{ fontSize: 14, color: themeColors.card }}>
                {refreshing ? '⏳' : '↻'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Full-Width Gifts Content */}
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
            {["Available", "Claimed"].map(t => (
              <TouchableOpacity
                key={t}
                style={{
                  marginHorizontal: 6,
                  paddingVertical: 12,
                  paddingHorizontal: 15,
                  borderRadius: 18,
                  backgroundColor: rewardsTab === t ? themeColors.secondary : themeColors.surface
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
                  fontSize: 15
                }}>
                  {t === "Available" ? "🎯 Ready to Win!" : "🏆 My Treasures!"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Rewards content */}
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
              if (availableRewards.length === 0) {
                return (
                  <View style={{
                    alignItems: 'center',
                    paddingVertical: 60,
                    paddingHorizontal: 20,
                  }}>
                    <Text style={{ fontSize: 72, marginBottom: 20 }}>🎁</Text>
                    <Text style={{
                      fontSize: 22,
                      fontWeight: 'bold',
                      color: themeColors.text,
                      marginBottom: 12,
                      textAlign: 'center'
                    }}>
                      No Gifts Available Yet
                    </Text>
                    <Text style={{
                      fontSize: 16,
                      color: themeColors.textSecondary,
                      textAlign: 'center',
                      marginBottom: 32,
                      lineHeight: 24
                    }}>
                      Keep earning points and more magical gifts will appear! 🌟
                    </Text>
                  </View>
                );
              }
              return (
                <FlatList
                  data={availableRewards}
                  keyExtractor={keyExtractor}
                  renderItem={renderReward}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 10 }}
                  style={{ flex: 1 }}
                  scrollEnabled={false}
                />
              );
            }
            // Claimed
            if (claimedRewards.length === 0) {
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
                    No Claimed Gifts Yet
                  </Text>
                  <Text style={{
                    fontSize: 16,
                    color: themeColors.textSecondary,
                    textAlign: 'center',
                    marginBottom: 32,
                    lineHeight: 24
                  }}>
                    Claim your first gift to see your treasures here! 💎
                  </Text>
                </View>
              );
            }
            return (
              <>
                <FlatList
                  data={claimedRewards}
                  keyExtractor={keyExtractor}
                  renderItem={renderReward}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 10 }}
                  style={{ flex: 1 }}
                  scrollEnabled={false}
                />
                {claimedArchived.length > 0 && !showRewardsArchive && (
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Show all claimed gifts from any time"
                    accessibilityHint="Display gifts claimed more than 90 days ago"
                    style={{
                      marginTop: 20,
                      alignSelf: "center",
                      backgroundColor: themeColors.accent + "22",
                      paddingHorizontal: 24,
                      paddingVertical: 12,
                      borderRadius: 20,
                      minHeight: 48,
                    }}
                    onPress={() => setShowRewardsArchive(true)}
                  >
                    <Text style={{ color: themeColors.primary, fontWeight: "600", fontSize: 16 }}>Show All Claimed Gifts</Text>
                  </TouchableOpacity>
                )}
                {claimedArchived.length > 0 && showRewardsArchive && (
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Show only recently claimed gifts"
                    accessibilityHint="Hide gifts claimed more than 90 days ago"
                    style={{
                      marginTop: 16,
                      alignSelf: "center",
                      backgroundColor: themeColors.surface,
                      paddingHorizontal: 18,
                      paddingVertical: 10,
                      borderRadius: 18,
                      minHeight: 48,
                    }}
                    onPress={() => setShowRewardsArchive(false)}
                  >
                    <Text style={{ color: themeColors.primary, fontWeight: "500", fontSize: 16 }}>Show Only Last 90 Days</Text>
                  </TouchableOpacity>
                )}
              </>
            );
          })()}

          {msg ? <Text style={styles.statusMessage}>{msg}</Text> : null}
        </ScrollView>
      </View>
    </View>
  );


}
