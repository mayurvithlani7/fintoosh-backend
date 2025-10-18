import AnimatedProgressBar from '@/components/animations/AnimatedProgressBar';
import BouncingCoin from '@/components/animations/BouncingCoin';
import GuidedTour from '@/components/GuidedTour';
import HelpModal from '@/components/HelpModal';
import Tooltip from '@/components/Tooltip';
import { fetchNotifications, markNotificationRead } from '@/utils/api';
import { API_URL } from '@/utils/config';
import { useCurrency } from '@/utils/currencyContext';
import { getAuthToken } from '@/utils/secureStorage';
import { ThemeType, useTheme } from '@/utils/themeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from "expo-router";
import React, { memo, useCallback, useEffect, useState } from "react";
import {
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

import SwipeNavigator from '@/components/SwipeNavigator';

// Type definitions
interface Jar {
  label: string;
  key: string;
  value: number;
  color: string;
  icon: string;
}

interface UserData {
  id: string;
  currentPoints: number;
  savePoints: number;
  spendPoints: number;
  donatePoints: number;
  investPoints: number;
  isFirstTimeUser?: boolean;
  role: string;
  goals?: any[];
  transactions?: any[];
}

interface Activity {
  id?: string;
  type: string;
  amount: number;
  description: string;
  timestamp: string;
  icon: string;
}

interface Notification {
  _id?: string;
  message: string;
  isRead?: boolean;
}

// Helper functions for transaction processing
const getTransactionDescription = (tx: any) => {
  switch (tx.type) {
    case 'chore-completion':
      return `Completed "${tx.choreName || 'a chore'}"`;
    case 'goal-progress':
      return `Made progress on "${tx.goalName || 'a goal'}"`;
    case 'points-moved':
      return `Moved ${tx.amount} points between jars`;
    case 'parent-points-adjustment':
      return `Points adjusted by parent`;
    case 'reward-purchase':
      return `Bought "${tx.rewardName || 'a reward'}"`;
    default:
      return `Transaction: ${tx.type}`;
  }
};

const getTransactionIcon = (type: string) => {
  switch (type) {
    case 'chore-completion':
      return '🧹';
    case 'goal-progress':
      return '🎯';
    case 'points-moved':
      return '🔄';
    case 'parent-points-adjustment':
      return '👨‍👩‍👧‍👦';
    case 'reward-purchase':
      return '🎁';
    default:
      return '💰';
  }
};

const generateMockActivities = (totalPoints: number) => {
  const activities = [
    {
      id: '1',
      type: 'chore-completion',
      description: 'Completed "Clean my room"',
      amount: 15,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      icon: '🧹'
    },
    {
      id: '2',
      type: 'goal-progress',
      description: 'Saved for "New bicycle"',
      amount: 25,
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      icon: '🎯'
    },
    {
      id: '3',
      type: 'points-moved',
      description: 'Moved points to Savings Pot',
      amount: 10,
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      icon: '🔄'
    },
    {
      id: '4',
      type: 'reward-purchase',
      description: 'Bought "Extra screen time"',
      amount: -20,
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      icon: '🎁'
    },
    {
      id: '5',
      type: 'parent-points-adjustment',
      description: 'Bonus points from parents!',
      amount: 5,
      timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
      icon: '👨‍👩‍👧‍👦'
    }
  ];

  return activities.slice(0, Math.min(5, Math.max(2, Math.floor(totalPoints / 50))));
};

const styles = StyleSheet.create({
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
    // color moved to dynamicStyles
  },
  jarBox: {
    minWidth: 85,
    alignItems: "center",
    // backgroundColor moved to dynamicStyles
    padding: 8,
    borderRadius: 8,
    margin: 8,
    borderWidth: 1,
    // borderColor moved to dynamicStyles
  },
  jarLabel: {
    fontWeight: "bold",
    marginBottom: 2,
    // color moved to dynamicStyles
    fontSize: 16,
  },
  jarPoints: {
    fontWeight: "700",
    fontSize: 21,
    marginBottom: 1,
    // color moved to dynamicStyles
  },
  quickActionCard: {
    // backgroundColor moved to dynamicStyles
    borderRadius: 14,
    marginBottom: 16,
    padding: 18,
    minWidth: 300,
    width: "97%",
    maxWidth: 520,
    elevation: 2,
    shadowColor: "#aaa",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
    // color moved to dynamicStyles
  },
  actionButton: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginVertical: 8,
    alignItems: "center",
    elevation: 2,
  },
  actionButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  statCard: {
    // backgroundColor moved to dynamicStyles
    borderRadius: 10,
    padding: 15,
    marginVertical: 5,
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    // color moved to dynamicStyles
  },
  statLabel: {
    fontSize: 14,
    // color moved to dynamicStyles
    marginTop: 5,
  },
});



const KidsHomeScreen = memo(function KidsHomeScreen() {
  const { themeColors, theme, setTheme, themes } = useTheme();
  const { refreshIntervals } = useCurrency();
  // Theme validation test - toggle between themes to verify color changes
  const [testTheme, setTestTheme] = useState(false);

  // Request deduplication state management
  const [activeRequests, setActiveRequests] = useState<Set<string>>(new Set());
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [jars, setJars] = useState<Jar[]>([
    { label: 'Pocket Money', key: 'current', value: 0, color: themeColors.jarColors.current, icon: '💰' },
    { label: 'Savings Pot', key: 'save', value: 0, color: themeColors.jarColors.save, icon: '🐷' },
    { label: 'Spending Pot', key: 'spend', value: 0, color: themeColors.jarColors.spend, icon: '🛒' },
    { label: 'Help Others Pot', key: 'donate', value: 0, color: themeColors.jarColors.donate, icon: '🤲' },
    { label: 'Grow Money Pot', key: 'invest', value: 0, color: themeColors.jarColors.invest, icon: '📈' }
  ]);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loadingPhase, setLoadingPhase] = useState<'initial' | 'secondary' | 'complete'>('initial');
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [helpModalVisible, setHelpModalVisible] = useState(false);
  const [guidedTourVisible, setGuidedTourVisible] = useState(false);
  const router = useRouter();

  // Shared API call function with request deduplication and AbortController
  const fetchUserData = useCallback(async (requestId: string) => {
    // Prevent duplicate requests
    if (activeRequests.has(requestId)) return;

    // Cancel previous request
    if (abortController) abortController.abort();

    const controller = new AbortController();
    setAbortController(controller);
    setActiveRequests(prev => new Set(prev).add(requestId));

    try {
      const token = await getAuthToken();
      const storedUser = await AsyncStorage.getItem('user');

      if (!token || !storedUser) {
        setError('Oops! 😅 We need to log you back in. Please ask a grown-up for help!');
        return;
      }

      const user = JSON.parse(storedUser);
      const userId = user.id;

      const response = await fetch(`${API_URL}/users/${userId}`, {
        signal: controller.signal,
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to load user data');
      const data = await response.json();

      // Only update state if this request wasn't cancelled
      if (!controller.signal.aborted) {
        setUserData(data);

        setJars([
          { label: 'Pocket Money', key: 'current', value: data.currentPoints || 0, color: themeColors.jarColors.current, icon: '💰' },
          { label: 'Savings Pot', key: 'save', value: data.savePoints || 0, color: themeColors.jarColors.save, icon: '🐷' },
          { label: 'Spending Pot', key: 'spend', value: data.spendPoints || 0, color: themeColors.jarColors.spend, icon: '🛒' },
          { label: 'Help Others Pot', key: 'donate', value: data.donatePoints || 0, color: themeColors.jarColors.donate, icon: '🤲' },
          { label: 'Grow Money Pot', key: 'invest', value: data.investPoints || 0, color: themeColors.jarColors.invest, icon: '📈' }
        ]);

        // Calculate total points for fallback
        const currentTotalPoints = (data.currentPoints || 0) +
                                  (data.savePoints || 0) +
                                  (data.spendPoints || 0) +
                                  (data.donatePoints || 0) +
                                  (data.investPoints || 0);

        // Try to load recent transactions for activity feed
        try {
          const transactionsResponse = await fetch(`${API_URL}/transactions/${userId}`, {
            signal: controller.signal,
            headers: { 'Authorization': `Bearer ${token}` },
          });

          if (transactionsResponse.ok && !controller.signal.aborted) {
            const transactions = await transactionsResponse.json();
            // Take the 5 most recent transactions
            const recentTransactions = transactions.slice(0, 5).map((tx: any) => ({
              id: tx._id,
              type: tx.type,
              amount: tx.amount,
              description: tx.description || getTransactionDescription(tx),
              timestamp: tx.createdAt,
              icon: getTransactionIcon(tx.type)
            }));
            setRecentActivities(recentTransactions);
          } else if (!controller.signal.aborted) {
            // Fallback to mock activities if no transactions
            setRecentActivities(generateMockActivities(currentTotalPoints));
          }
        } catch (txError) {
          if (!controller.signal.aborted) {
            console.log('Could not load transactions, using mock activities');
            setRecentActivities(generateMockActivities(currentTotalPoints));
          }
        }
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        console.error('Error loading user data:', error);
        setError('Oops! 🤔 Having trouble loading your points right now. Please try again!');
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoadingPhase('complete');
        setRefreshing(false);
        setActiveRequests(prev => {
          const newSet = new Set(prev);
          newSet.delete(requestId);
          return newSet;
        });
      }
    }
  }, [themeColors]);

  // Notification state and logic
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifLoading, setNotifLoading] = useState(true);
  const [notifError, setNotifError] = useState<string | null>(null);

  // Load notifications for kid
  const loadNotifications = useCallback(async () => {
    try {
      setNotifError(null);
      setNotifLoading(true);
      const token = await getAuthToken();
      const storedUser = await AsyncStorage.getItem('user');
      if (!token || !storedUser) {
        setNotifications([]);
        setNotifLoading(false);
        return;
      }
      const user = JSON.parse(storedUser);
      const userId = user.id;
      const notifList = await fetchNotifications(userId, token);
      setNotifications(notifList || []);
    } catch (err) {
      setNotifError("Failed to load notifications.");
      setNotifications([]);
    } finally {
      setNotifLoading(false);
    }
  }, []);
  useEffect(() => { loadNotifications(); }, [loadNotifications]);

  // Properly managed useFocusEffect with cleanup
  useFocusEffect(
    React.useCallback(() => {
      let isMounted = true;

      const loadData = async () => {
        if (!isMounted) return;
        await loadNotifications();
      };

      loadData();

      return () => {
        isMounted = false;
        // Cleanup any subscriptions, timers, etc.
      };
    }, [loadNotifications])
  );



  useEffect(() => {
    const requestId = `user-data-initial-${Date.now()}`;
    fetchUserData(requestId);
  }, [fetchUserData]);

  // Check for first-time user and show guided tour
  useEffect(() => {
    if (userData && userData.isFirstTimeUser && userData.role === 'child' && loadingPhase === 'complete') {
      // Small delay to ensure UI is fully loaded
      setTimeout(() => {
        setGuidedTourVisible(true);
      }, 1000);
    }
  }, [userData, loadingPhase]);

  useFocusEffect(
    React.useCallback(() => {
      const requestId = `user-data-focus-${Date.now()}`;
      fetchUserData(requestId);
    }, [fetchUserData])
  );

  // Auto-refresh data using configurable interval when screen is focused
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (loadingPhase === 'complete' && refreshIntervals.kidsHome > 0) {
      interval = setInterval(() => {
        const requestId = `user-data-auto-${Date.now()}`;
        fetchUserData(requestId);
      }, refreshIntervals.kidsHome);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
      // Cancel any pending requests on unmount
      if (abortController) {
        abortController.abort();
      }
    };
  }, [loadingPhase, fetchUserData, refreshIntervals.kidsHome, abortController]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    const requestId = `user-data-refresh-${Date.now()}`;
    fetchUserData(requestId);
  }, [fetchUserData]);

  const totalPoints = jars.reduce((sum, jar) => sum + jar.value, 0);

  // Calculate progress for gamified progress bar
  const calculateSetupProgress = () => {
    let completed = 0;
    const totalSteps = 3;

    // 1. Claim First Task - check if user is no longer first-time user
    if (userData && !userData.isFirstTimeUser) {
      completed++;
    }

    // 2. Set a Goal - check if user has any goals
    if (userData && userData.goals && userData.goals.length > 0) {
      completed++;
    }

    // 3. Move Points Between Pots - check if user has moved points (has transactions of type 'points-move')
    if (userData && userData.transactions && userData.transactions.some((tx: any) => tx.type === 'points-move')) {
      completed++;
    }

    return completed / totalSteps;
  };

  const setupProgress = calculateSetupProgress();

  // Dynamic styles based on theme
  const dynamicStyles = {
    title: {
      fontSize: 28,
      fontWeight: "bold" as const,
      marginBottom: 22,
      marginTop: 6,
      color: themeColors.text,
    },
    quickActionCard: {
      backgroundColor: themeColors.card,
      borderRadius: 14,
      marginBottom: 16,
      padding: 18,
      minWidth: 300,
      width: "97%",
      maxWidth: 520,
      elevation: 2,
      shadowColor: "#aaa",
      borderWidth: 1,
      borderColor: themeColors.border,
    } as any, // Cast to any to allow percentage width
    sectionTitle: {
      fontSize: 20,
      fontWeight: "600" as const,
      marginBottom: 8,
      color: themeColors.text,
    },
    totalPointsText: {
      fontSize: 36,
      fontWeight: 'bold' as const,
      color: themeColors.primary,
      textAlign: 'center' as const,
    },
    activityText: {
      color: themeColors.textSecondary,
      fontStyle: "italic" as const,
      textAlign: "center" as const,
      marginVertical: 20,
    },
  };

  // Error screen with retry
  if (error) {
    const ErrorCard = require('@/components/ui/ErrorCard').default;
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[styles.container, { backgroundColor: themeColors.background }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <ErrorCard error={error} onRetry={() => {
            const requestId = `user-data-retry-${Date.now()}`;
            fetchUserData(requestId);
          }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (loadingPhase === 'initial') {
    // Skeleton loading experience for kids home
    const SkeletonCard = require('@/components/ui/SkeletonCard').default;
    const SkeletonJar = require('@/components/ui/SkeletonJar').default;
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[styles.container, { backgroundColor: themeColors.background }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Title Skeleton */}
          <SkeletonCard height={38} width={150} style={{ alignSelf: "center", marginBottom: 10, marginTop: 6 }} />

          {/* Total Points Skeleton */}
          <SkeletonCard height={75} width={"96%"} borderRadius={16} style={{ marginBottom: 15 }} />

          {/* Jars Skeleton Grid */}
          <SkeletonCard height={32} width={120} style={{ marginBottom: 15 }} />
          <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-evenly", marginVertical: 10, width: "100%" }}>
            {[...Array(5)].map((_, i) => (
              <SkeletonJar key={i} size={75} />
            ))}
          </View>
          {/* Quick Actions Skeleton */}
          <SkeletonCard height={28} width={130} style={{ marginBottom: 10, marginTop: 10 }} />
          {[...Array(5)].map((_, i) => (
            <SkeletonCard key={i + "qa"} height={36} width={"98%"} borderRadius={12} style={{ marginBottom: 11 }} />
          ))}
          {/* Activity Feed Placeholder */}
          <SkeletonCard height={32} width={"92%"} borderRadius={10} style={{ marginTop: 26 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={[styles.container, { backgroundColor: themeColors.background }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
      

      {/* Theme Validation Test */}
      {__DEV__ && (
        <View style={[dynamicStyles.quickActionCard, { backgroundColor: themeColors.accent + '20' }]}>
          <Text style={[dynamicStyles.sectionTitle, { color: themeColors.accent }]}>🎨 Theme Test</Text>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: themeColors.accent }]}
            onPress={() => {
              const themeKeys = Object.keys(themes);
              const currentIndex = themeKeys.indexOf(theme);
              const nextIndex = (currentIndex + 1) % themeKeys.length;
              setTheme(themeKeys[nextIndex] as ThemeType);
            }}
          >
            <Text style={styles.actionButtonText}>
              Switch to {Object.keys(themes)[(Object.keys(themes).indexOf(theme) + 1) % Object.keys(themes).length]} theme
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Notifications */}
      {(notifLoading || notifError || notifications.filter(n => !n.isRead).length > 0) && (
        <View style={{
          backgroundColor: themeColors.surface,
          borderRadius: 15,
          padding: 10,
          marginBottom: 11,
          minWidth: 280,
          width: '97%',
          maxWidth: 520,
          elevation: 2,
          shadowColor: themeColors.border
        }}>
          <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 6, color: themeColors.primary }}>Notifications</Text>
          {notifLoading ? (
            <Text style={{ fontSize: 15, color: themeColors.textSecondary }}>Loading...</Text>
          ) : notifError ? (
            <Text style={{ fontSize: 15, color: themeColors.error }}>{notifError}</Text>
          ) : (
            notifications.filter(n => !n.isRead).slice(0, 4).map((notif, idx) => (
              <TouchableOpacity
                key={notif._id || idx}
                style={{
                  padding: 8,
                  marginBottom: 3,
                  backgroundColor: themeColors.card,
                  borderRadius: 7,
                  elevation: 1,
                  borderWidth: 1,
                  borderColor: themeColors.border,
                }}
                onPress={async () => {
                  try {
                    const token = await getAuthToken();
                    if (notif._id && token) {
                      await markNotificationRead(notif._id, token);
                      await loadNotifications();
                    }
                  } catch (err) {}
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: "bold", color: themeColors.warning }}>
                  {notif.message}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      )}

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: 520, marginBottom: 22, marginTop: 6 }}>
        <Text style={dynamicStyles.title} accessibilityRole="header" accessibilityLabel="My Money Home Dashboard">🏠 My Money Pots</Text>
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

      {/* Gamified Progress Bar */}
      {userData && userData.isFirstTimeUser && (
        <View style={[dynamicStyles.quickActionCard, { backgroundColor: themeColors.secondary + '20', borderColor: themeColors.primary }]}>
          <Text style={[dynamicStyles.sectionTitle, { color: themeColors.primary, textAlign: 'center' }]}>
            🎯 Getting Started Progress
          </Text>
          <Text style={{ textAlign: 'center', color: themeColors.textSecondary, fontSize: 14, marginBottom: 10 }}>
            Complete these steps to master your money pots!
          </Text>

          <AnimatedProgressBar
            progress={setupProgress}
            height={12}
            color={themeColors.primary}
            showPercentage={true}
          />

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 }}>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={{ fontSize: 20, marginBottom: 4 }}>
                {userData && !userData.isFirstTimeUser ? '✅' : '🎯'}
              </Text>
              <Text style={{ fontSize: 12, color: themeColors.textSecondary, textAlign: 'center' }}>
                Claim{'\n'}First Task
              </Text>
            </View>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={{ fontSize: 20, marginBottom: 4 }}>
                {userData && userData.goals && userData.goals.length > 0 ? '✅' : '🎯'}
              </Text>
              <Text style={{ fontSize: 12, color: themeColors.textSecondary, textAlign: 'center' }}>
                Set{'\n'}a Goal
              </Text>
            </View>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={{ fontSize: 20, marginBottom: 4 }}>
                {userData && userData.transactions && userData.transactions.some((tx: any) => tx.type === 'points-move') ? '✅' : '🎯'}
              </Text>
              <Text style={{ fontSize: 12, color: themeColors.textSecondary, textAlign: 'center' }}>
                Move{'\n'}Points
              </Text>
            </View>
          </View>

          {/* Celebration Animation when progress completes */}
          {setupProgress >= 1 && (
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
              <BouncingCoin
                amount={25}
                duration={2000}
                size={60}
              />
            </View>
          )}
        </View>
      )}

      {/* Refresh Button */}
      <View style={dynamicStyles.quickActionCard}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: themeColors.secondary, marginBottom: 0 }]}
          onPress={onRefresh}
          disabled={refreshing}
        >
          <Text style={styles.actionButtonText}>
            {refreshing ? 'Refreshing...' : '🔄 Refresh Points'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Total Points Summary */}
      <View style={dynamicStyles.quickActionCard}>
        <Text style={dynamicStyles.sectionTitle}>💰 Total Points</Text>
        <Text style={dynamicStyles.totalPointsText}>
          {totalPoints}
        </Text>
      </View>

      {/* Points Jars Overview */}
      <View style={dynamicStyles.quickActionCard}>
        <Text style={dynamicStyles.sectionTitle}>My Pots</Text>
        <View style={{flexDirection: "row", flexWrap: "wrap", justifyContent: "space-evenly", marginVertical: 10}}>
          {jars.map(jar => {
            const getJarTooltip = (key: string) => {
              switch (key) {
                case 'current':
                  return '💰 Pocket Money: Points you can spend right now for small treats!';
                case 'save':
                  return '🐷 Savings Pot: Money saved for big goals like a new bike or game!';
                case 'spend':
                  return '🛒 Spending Pot: For buying fun things you want!';
                case 'donate':
                  return '🤲 Help Others Pot: Points for giving to charity or helping others!';
                case 'invest':
                  return '📈 Grow Money Pot: Special savings that might grow bigger over time!';
                default:
                  return '';
              }
            };

            return (
              <Tooltip key={jar.label} content={getJarTooltip(jar.key)} position="top">
                <View
                  style={{
                    backgroundColor: jar.color,
                    borderRadius: 14,
                    padding: 16,
                    minWidth: 100,
                    alignItems: "center",
                    marginHorizontal: 8,
                    marginBottom: 8,
                    borderWidth: 1.2,
                    borderColor: themeColors.border,
                  }}
                >
                  <Text style={{ fontSize: 25, marginBottom: 3 }}>{jar.icon}</Text>
                  <Text style={{ fontWeight: "700", fontSize: 18, marginBottom: 3, color: themeColors.text }}>{jar.value}</Text>
                  <Text style={{ fontWeight: "bold", color: themeColors.text, fontSize: 13 }}>{jar.label}</Text>
                </View>
              </Tooltip>
            );
          })}
        </View>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: themeColors.primary }]}
onPress={() => router.push('./money-jars')}
          accessibilityRole="button"
          accessibilityLabel="Manage money jars"
          accessibilityHint="Navigate to the money jars screen to move points between different savings categories"
        >
          <Text style={[styles.actionButtonText, { color: themeColors.card }]}>See My Pots</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <View style={dynamicStyles.quickActionCard}>
        <Text style={dynamicStyles.sectionTitle}>What Can I Do?</Text>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: themeColors.warning }]}
        onPress={() => router.push('./money-jars')}
        >
          <Text style={styles.actionButtonText}>Move Points Between Pots</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: themeColors.success }]}
onPress={() => router.push('./goals')}
        >
          <Text style={styles.actionButtonText}>Check My Goals</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: themeColors.secondary }]}
onPress={() => router.push('./chores')}
        >
          <Text style={styles.actionButtonText}>Do Home Tasks for Points</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: themeColors.error }]}
onPress={() => router.push('./learn')}
        >
          <Text style={styles.actionButtonText}>Money Gyaan</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: themeColors.accent }]}
onPress={() => router.push('./games')}
        >
          <Text style={styles.actionButtonText}>Play Money Games</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Activity Feed */}
      <View style={dynamicStyles.quickActionCard}>
        <Text style={dynamicStyles.sectionTitle}>What I Did Recently</Text>

        {recentActivities.length > 0 ? (
          recentActivities.map((activity, index) => (
            <View
              key={activity.id || index}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 8,
                paddingHorizontal: 4,
                borderBottomWidth: index < recentActivities.length - 1 ? 1 : 0,
                borderBottomColor: themeColors.border,
              }}
            >
              <Text style={{ fontSize: 24, marginRight: 12 }}>{activity.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, color: themeColors.text, fontWeight: '500' }}>
                  {activity.description}
                </Text>
                <Text style={{ fontSize: 12, color: themeColors.textSecondary, marginTop: 2 }}>
                  {new Date(activity.timestamp).toLocaleDateString()} • {activity.amount > 0 ? '+' : ''}{activity.amount} points
                </Text>
              </View>
            </View>
          ))
        ) : (
          <View style={{ alignItems: 'center', paddingVertical: 20 }}>
            <Text style={{ fontSize: 16, color: themeColors.textSecondary, textAlign: 'center' }}>
              🏆 Complete some chores or save some points to see your activities here!
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: themeColors.accent, marginTop: 15 }]}
onPress={() => router.push('./transaction-history')}
        >
          <Text style={[styles.actionButtonText, { color: themeColors.card }]}>
            See All Activities 📊
          </Text>
        </TouchableOpacity>
      </View>

      {/* Help Modal */}
      <HelpModal
        visible={helpModalVisible}
        onClose={() => setHelpModalVisible(false)}
        title="🏠 My Money Pots - Help"
        tabs={[
          {
            title: "Start",
            content: [
              {
                type: "text",
                text: "Welcome to your Money Pots! This is your home base where you can see all your points and what you can do with them.",
                icon: "🏠"
              },
              {
                type: "bullet",
                text: "Check your total points at the top"
              },
              {
                type: "bullet",
                text: "Look at your 5 money pots below"
              },
              {
                type: "bullet",
                text: "Use the buttons to do different activities"
              },
              {
                type: "highlight",
                text: "Parents approve most actions, so ask nicely! 😊",
                icon: "👨‍👩‍👧‍👦"
              }
            ]
          },
          {
            title: "Pots",
            content: [
              {
                type: "text",
                text: "You have 5 special pots for your points:",
                icon: "🏺"
              },
              {
                type: "bullet",
                text: "💰 Pocket Money - Spend right now"
              },
              {
                type: "bullet",
                text: "🐷 Savings Pot - Big goals later"
              },
              {
                type: "bullet",
                text: "🛒 Spending Pot - Fun things"
              },
              {
                type: "bullet",
                text: "🤲 Help Others Pot - Charity & giving"
              },
              {
                type: "bullet",
                text: "📈 Grow Money Pot - Special savings"
              },
              {
                type: "highlight",
                text: "Tap 'See My Pots' to move points (needs parent approval)",
                icon: "🔄"
              }
            ]
          },
          {
            title: "Actions",
            content: [
              {
                type: "text",
                text: "Things you can do:",
                icon: "🎯"
              },
              {
                type: "bullet",
                text: "Move Points - Transfer between pots"
              },
              {
                type: "bullet",
                text: "Check Goals - See savings progress"
              },
              {
                type: "bullet",
                text: "Do Chores - Earn points"
              },
              {
                type: "bullet",
                text: "Money Gyaan - Learn about money"
              },
              {
                type: "bullet",
                text: "Play Games - Fun money learning"
              },
              {
                type: "highlight",
                text: "Most actions need parent approval first!",
                icon: "🤝"
              }
            ]
          },
          {
            title: "Activity",
            content: [
              {
                type: "text",
                text: "Recent activities show:",
                icon: "📊"
              },
              {
                type: "bullet",
                text: "🧹 - Chores completed"
              },
              {
                type: "bullet",
                text: "🎯 - Goal progress"
              },
              {
                type: "bullet",
                text: "🔄 - Points moved"
              },
              {
                type: "bullet",
                text: "🎁 - Rewards bought"
              },
              {
                type: "bullet",
                text: "👨‍👩‍👧‍👦 - Points from parents"
              },
              {
                type: "highlight",
                text: "Tap 'See All Activities' for full history!",
                icon: "📈"
              }
            ]
          }
        ]}
      />

      {/* Guided Tour for First-Time Users */}
      <GuidedTour
        visible={guidedTourVisible}
        onComplete={async () => {
          setGuidedTourVisible(false);
          // Update user to mark as not first-time user
          try {
            const token = await getAuthToken();
            const storedUser = await AsyncStorage.getItem('user');
            if (token && storedUser) {
              const user = JSON.parse(storedUser);
              await fetch(`${API_URL}/users/${user.id}`, {
                method: 'PATCH',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ isFirstTimeUser: false }),
              });
              // Update local userData
              setUserData((prev: UserData | null) => prev ? { ...prev, isFirstTimeUser: false } : null);
            }
          } catch (error) {
            console.error('Failed to update first-time user status:', error);
          }
        }}
        onDismiss={() => setGuidedTourVisible(false)}
      />
      </ScrollView>
    </SafeAreaView>
  );
});

// Wrap with swipe navigation for tabs. Order MUST match your Tabs!
export default function KidsHomeScreenWithSwipe() {
  // Swipe navigation is enabled by default. Can be disabled per screen by passing disabled={true}
  return (
    <SwipeNavigator
      tabRoutes={['index', 'money-jars', 'goals', 'chores', 'learn', 'more']}
    >
      <KidsHomeScreen />
    </SwipeNavigator>
  );
}
