import AnimatedProgressBar from '@/components/animations/AnimatedProgressBar';
import BouncingCoin from '@/components/animations/BouncingCoin';
import GuidedTour from '@/components/GuidedTour';
import HelpModal from '@/components/HelpModal';
import Tooltip from '@/components/Tooltip';
import { fetchNotifications, markNotificationRead } from '@/utils/api';
import { API_URL } from '@/utils/config';
import { getAuthToken } from '@/utils/secureStorage';
import { useTheme } from '@/utils/themeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from "expo-router";
import React, { memo, useCallback, useEffect, useState } from "react";
import {
  RefreshControl,
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
    color: "#154477",
  },
  jarBox: {
    minWidth: 85,
    alignItems: "center",
    backgroundColor: "#f6faff",
    padding: 8,
    borderRadius: 8,
    margin: 8,
    borderWidth: 1,
    borderColor: "#abe",
  },
  jarLabel: {
    fontWeight: "bold",
    marginBottom: 2,
    color: "#167",
    fontSize: 16,
  },
  jarPoints: {
    fontWeight: "700",
    fontSize: 21,
    marginBottom: 1,
    color: "#201828",
  },
  quickActionCard: {
    backgroundColor: "#fff",
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
    color: "#234",
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
    backgroundColor: "#f0f8ff",
    borderRadius: 10,
    padding: 15,
    marginVertical: 5,
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2c5aa0",
  },
  statLabel: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
  },
});



const KidsHomeScreen = memo(function KidsHomeScreen() {
  const { themeColors } = useTheme();
  const [jars, setJars] = useState<Jar[]>([
    { label: 'Pocket Money', key: 'current', value: 0, color: themeColors.jarColors.current, icon: '💰' },
    { label: 'Savings Pot', key: 'save', value: 0, color: themeColors.jarColors.save, icon: '🐷' },
    { label: 'Spending Pot', key: 'spend', value: 0, color: themeColors.jarColors.spend, icon: '🛒' },
    { label: 'Help Others Pot', key: 'donate', value: 0, color: themeColors.jarColors.donate, icon: '🤲' },
    { label: 'Grow Money Pot', key: 'invest', value: 0, color: themeColors.jarColors.invest, icon: '📈' }
  ]);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [helpModalVisible, setHelpModalVisible] = useState(false);
  const [guidedTourVisible, setGuidedTourVisible] = useState(false);
  const router = useRouter();

  // Shared API call function to reduce duplication
  const fetchUserData = useCallback(async (token: string, userId: string) => {
    const response = await fetch(`${API_URL}/users/${userId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) {
      throw new Error('Failed to load user data');
    }
    return response.json();
  }, []);

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
  useFocusEffect(
    React.useCallback(() => { loadNotifications(); }, [loadNotifications])
  );

  // Load user data and jar values from backend
  const loadUserData = useCallback(async () => {
    try {
      setError(null);
      const token = await getAuthToken();
      const storedUser = await AsyncStorage.getItem('user');

      if (!token || !storedUser) {
        setError('Not authenticated. Please login again.');
        return;
      }

      const user = JSON.parse(storedUser);
      const userId = user.id;

      // Load user data
      const userResponse = await fetch(`${API_URL}/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!userResponse.ok) {
        throw new Error('Failed to load user data');
      }

      const freshUserData = await userResponse.json();
      setUserData(freshUserData);

      setJars([
        { label: 'Pocket Money', key: 'current', value: freshUserData.currentPoints || 0, color: themeColors.jarColors.current, icon: '💰' },
        { label: 'Savings Pot', key: 'save', value: freshUserData.savePoints || 0, color: themeColors.jarColors.save, icon: '🐷' },
        { label: 'Spending Pot', key: 'spend', value: freshUserData.spendPoints || 0, color: themeColors.jarColors.spend, icon: '🛒' },
        { label: 'Help Others Pot', key: 'donate', value: freshUserData.donatePoints || 0, color: themeColors.jarColors.donate, icon: '🤲' },
        { label: 'Grow Money Pot', key: 'invest', value: freshUserData.investPoints || 0, color: themeColors.jarColors.invest, icon: '📈' }
      ]);

      // Calculate total points for fallback
      const currentTotalPoints = (freshUserData.currentPoints || 0) +
                                (freshUserData.savePoints || 0) +
                                (freshUserData.spendPoints || 0) +
                                (freshUserData.donatePoints || 0) +
                                (freshUserData.investPoints || 0);

      // Try to load recent transactions for activity feed
      try {
        const transactionsResponse = await fetch(`${API_URL}/transactions/${userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (transactionsResponse.ok) {
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
        } else {
          // Fallback to mock activities if no transactions
          setRecentActivities(generateMockActivities(currentTotalPoints));
        }
      } catch (txError) {
        console.log('Could not load transactions, using mock activities');
        setRecentActivities(generateMockActivities(currentTotalPoints));
      }

    } catch (error) {
      console.error('Error loading user data:', error);
      setError('Failed to load user data. Please check your connection, then tap retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [themeColors]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  // Check for first-time user and show guided tour
  useEffect(() => {
    if (userData && userData.isFirstTimeUser && userData.role === 'child' && !loading) {
      // Small delay to ensure UI is fully loaded
      setTimeout(() => {
        setGuidedTourVisible(true);
      }, 1000);
    }
  }, [userData, loading]);

  useFocusEffect(
    React.useCallback(() => {
      loadUserData();
    }, [loadUserData])
  );

  // Auto-refresh data every 30 seconds when screen is focused
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (!loading) {
      interval = setInterval(() => {
        loadUserData();
      }, 30000); // Refresh every 30 seconds
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [loading, loadUserData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadUserData();
  }, [loadUserData]);

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
      width: "97%" as any,
      maxWidth: 520,
      elevation: 2,
      shadowColor: "#aaa",
      borderWidth: 1,
      borderColor: themeColors.border,
    },
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
      <ScrollView
        contentContainerStyle={[styles.container, { backgroundColor: themeColors.background }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <ErrorCard error={error} onRetry={loadUserData} />
      </ScrollView>
    );
  }

  if (loading) {
    // Skeleton loading experience for kids home
    const SkeletonCard = require('@/components/ui/SkeletonCard').default;
    const SkeletonJar = require('@/components/ui/SkeletonJar').default;
    return (
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
    );
  }

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: themeColors.background }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      

      {/* Notifications */}
      {(notifLoading || notifError || notifications.filter(n => !n.isRead).length > 0) && (
        <View style={{
          backgroundColor: "#f6f8fb",
          borderRadius: 15,
          padding: 10,
          marginBottom: 11,
          minWidth: 280,
          width: '97%',
          maxWidth: 520,
          elevation: 2,
          shadowColor: '#caf'
        }}>
          <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 6, color: "#2767aa" }}>Notifications</Text>
          {notifLoading ? (
            <Text style={{ fontSize: 15, color: "#7a7a7a" }}>Loading...</Text>
          ) : notifError ? (
            <Text style={{ fontSize: 15, color: "#b22" }}>{notifError}</Text>
          ) : (
            notifications.filter(n => !n.isRead).slice(0, 4).map((notif, idx) => (
              <TouchableOpacity
                key={notif._id || idx}
                style={{
                  padding: 8,
                  marginBottom: 3,
                  backgroundColor: '#f7f4e9',
                  borderRadius: 7,
                  elevation: 1,
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
                <Text style={{ fontSize: 15, fontWeight: "bold", color: '#C85D12' }}>
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
                    padding: 14,
                    minWidth: 84,
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
  );
});

// Wrap with swipe navigation for tabs. Order MUST match your Tabs!
export default function KidsHomeScreenWithSwipe() {
  return (
    <SwipeNavigator tabRoutes={['index', 'money-jars', 'goals', 'chores', 'learn', 'more']}>
      <KidsHomeScreen />
    </SwipeNavigator>
  );
}
