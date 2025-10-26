import AnimatedCounter from '@/components/animations/AnimatedCounter';
import AnimatedProgressBar from '@/components/animations/AnimatedProgressBar';
import BouncingCoin from '@/components/animations/BouncingCoin';
import GuidedTour from '@/components/GuidedTour';
import HelpModal from '@/components/HelpModal';
import ActionCard from '@/components/ui/ActionCard';
import JarCard from '@/components/ui/JarCard';
import StatCard from '@/components/ui/StatCard';
import { fetchNotifications } from '@/utils/api';
import { API_URL } from '@/utils/config';
import { useCurrency } from '@/utils/currencyContext';
import { getAuthToken, getUserData } from '@/utils/secureStorage';
import { useTheme } from '@/utils/themeContext';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { memo, useCallback, useEffect, useReducer, useRef, useState } from "react";
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

// Smart Empty States with Action Prompts
const EmptyStateWithAction = ({
  type,
  dynamicStyles,
  themeColors,
  router
}: {
  type: 'activities' | 'goals';
  dynamicStyles: any;
  themeColors: any;
  router: any;
}) => {
  const emptyStates = {
    activities: {
      icon: "🚀",
      title: "Ready to Start Earning?",
      message: "Complete tasks, set goals, or move money to see your activity here!",
      action: "Do First Task",
      route: './chores'
    },
    goals: {
      icon: "🎯",
      title: "No Goals Yet?",
      message: "Set your first savings goal and watch your progress grow!",
      action: "Create Goal",
      route: './goals'
    }
  };

  const state = emptyStates[type];

  return (
    <View style={dynamicStyles.emptyState}>
      <Text style={dynamicStyles.emptyIcon}>{state.icon}</Text>
      <Text style={[dynamicStyles.emptyTitle, { color: themeColors.text }]}>{state.title}</Text>
      <Text style={[dynamicStyles.emptyMessage, { color: themeColors.textSecondary }]}>{state.message}</Text>
      <TouchableOpacity
        style={[dynamicStyles.emptyActionButton, { backgroundColor: themeColors.primary }]}
        onPress={() => router.push(state.route)}
      >
        <Text style={dynamicStyles.emptyActionText}>{state.action}</Text>
      </TouchableOpacity>
    </View>
  );
};

// Time-Based Contextual Content
const TimeBasedContent = ({ dynamicStyles, themeColors }: { dynamicStyles: any; themeColors: any }) => {
  const getTimeContext = () => {
    const hour = new Date().getHours();

    if (hour >= 6 && hour < 12) {
      return {
        greeting: "🌅 Good morning!",
        tip: "Start your day by checking your money goals!",
        suggestion: "Morning is perfect for planning your day!"
      };
    } else if (hour >= 12 && hour < 17) {
      return {
        greeting: "☀️ Good afternoon!",
        tip: "How are you doing on your daily tasks?",
        suggestion: "Afternoon is great for completing chores!"
      };
    } else {
      return {
        greeting: "🌙 Good evening!",
        tip: "Review what you accomplished today!",
        suggestion: "Evening is perfect for setting tomorrow's goals!"
      };
    }
  };

  const context = getTimeContext();

  return (
    <View style={[dynamicStyles.timeContext, { backgroundColor: themeColors.surface }]}>
      <Text style={[dynamicStyles.timeGreeting, { color: themeColors.primary }]}>{context.greeting}</Text>
      <Text style={[dynamicStyles.timeTip, { color: themeColors.text }]}>{context.tip}</Text>
      <Text style={[dynamicStyles.timeSuggestion, { color: themeColors.textSecondary }]}>{context.suggestion}</Text>
    </View>
  );
};

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
  badges?: any[];
  rewards?: any[];
  caregivers?: Array<{ userId: string; role: string; name?: string | null }>;
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

// State management with useReducer to prevent race conditions
interface AppState {
  // User data state
  jars: Jar[];
  userData: UserData | null;
  recentActivities: Activity[];
  loadingPhase: 'initial' | 'secondary' | 'complete';
  error: string | null;
  refreshing: boolean;

  // Notification state
  notifications: Notification[];
  notifLoading: boolean;
  notifError: string | null;

  // UI state
  guidedTourVisible: boolean;
}

type AppAction =
  | { type: 'SET_LOADING_PHASE'; payload: AppState['loadingPhase'] }
  | { type: 'SET_REFRESHING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_USER_DATA'; payload: { userData: UserData; jars: Jar[]; activities: Activity[] } }
  | { type: 'SET_NOTIFICATIONS_LOADING'; payload: boolean }
  | { type: 'SET_NOTIFICATIONS_ERROR'; payload: string | null }
  | { type: 'SET_NOTIFICATIONS'; payload: Notification[] }
  | { type: 'MARK_NOTIFICATION_READ'; payload: string }
  | { type: 'SET_GUIDED_TOUR_VISIBLE'; payload: boolean }
  | { type: 'UPDATE_USER_FIRST_TIME_STATUS'; payload: boolean };

const initialState: AppState = {
  jars: [
    { label: 'Pocket Money', key: 'current', value: 0, color: '#4CAF50', icon: '💰' },
    { label: 'Savings Pot', key: 'save', value: 0, color: '#2196F3', icon: '🐷' },
    { label: 'Spending Pot', key: 'spend', value: 0, color: '#FF9800', icon: '🛒' },
    { label: 'Help Others Pot', key: 'donate', value: 0, color: '#9C27B0', icon: '🤲' },
    { label: 'Grow Money Pot', key: 'invest', value: 0, color: '#607D8B', icon: '📈' }
  ],
  userData: null,
  recentActivities: [],
  loadingPhase: 'initial',
  error: null,
  refreshing: false,
  notifications: [],
  notifLoading: true,
  notifError: null,
  guidedTourVisible: false,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LOADING_PHASE':
      return { ...state, loadingPhase: action.payload };
    case 'SET_REFRESHING':
      return { ...state, refreshing: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_USER_DATA':
      return {
        ...state,
        userData: action.payload.userData,
        jars: action.payload.jars,
        recentActivities: action.payload.activities,
      };
    case 'SET_NOTIFICATIONS_LOADING':
      return { ...state, notifLoading: action.payload };
    case 'SET_NOTIFICATIONS_ERROR':
      return { ...state, notifError: action.payload };
    case 'SET_NOTIFICATIONS':
      return { ...state, notifications: action.payload };
    case 'MARK_NOTIFICATION_READ':
      return {
        ...state,
        notifications: state.notifications.map(n =>
          n._id === action.payload ? { ...n, isRead: true } : n
        ),
      };
    case 'SET_GUIDED_TOUR_VISIBLE':
      return { ...state, guidedTourVisible: action.payload };
    case 'UPDATE_USER_FIRST_TIME_STATUS':
      return {
        ...state,
        userData: state.userData ? { ...state.userData, isFirstTimeUser: action.payload } : null,
      };
    default:
      return state;
  }
}

// Helper functions for transaction processing
const getTransactionDescription = (tx: any) => {
  switch (tx.type) {
    case 'chore-completed':
      return `Completed "${tx.choreName || 'a chore'}"`;
    case 'goal-completion':
      return `Completed "${tx.goalName || 'a goal'}"`;
    case 'points-move':
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
    case 'chore-completed':
      return '🧹';
    case 'goal-completion':
      return '🎯';
    case 'points-move':
      return '🔄';
    case 'parent-points-adjustment':
      return '👨‍👩‍👧‍👦';
    case 'reward-purchase':
      return '🎁';
    default:
      return '💰';
  }
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
  // Empty state styles - moved to dynamicStyles
  // Time-based content styles - moved to dynamicStyles
});



const KidsHomeScreen = memo(function KidsHomeScreen() {
  // For quick actions show-more toggle
  const [showMore, setShowMore] = useState(false);
  const { themeColors } = useTheme();
  const { refreshIntervals, formatAmount } = useCurrency();
  // Theme validation test - toggle between themes to verify color changes
  const [testTheme, setTestTheme] = useState(false);

  // Request deduplication using ref to avoid React state race conditions
  const activeRequestsRef = useRef<Map<string, AbortController>>(new Map());

  // Consolidated state management with useReducer to prevent race conditions
  const [state, dispatch] = useReducer(appReducer, {
    ...initialState,
    jars: [
      { label: 'Pocket Money', key: 'current', value: 0, color: themeColors.jarColors.current, icon: '💰' },
      { label: 'Savings Pot', key: 'save', value: 0, color: themeColors.jarColors.save, icon: '🐷' },
      { label: 'Spending Pot', key: 'spend', value: 0, color: themeColors.jarColors.spend, icon: '🛒' },
      { label: 'Help Others Pot', key: 'donate', value: 0, color: themeColors.jarColors.donate, icon: '🤲' },
      { label: 'Grow Money Pot', key: 'invest', value: 0, color: themeColors.jarColors.invest, icon: '📈' }
    ]
  });

  const router = useRouter();

  // Extract state for easier access
  const {
    jars,
    userData,
    recentActivities,
    loadingPhase,
    error,
    refreshing,
    notifications,
    notifLoading,
    notifError,
    guidedTourVisible
  } = state;

  // Local UI state not managed by reducer
  const [helpModalVisible, setHelpModalVisible] = React.useState(false);
  const [caregivers, setCaregivers] = React.useState<Array<{ userId: string; role: string; name?: string | null }>>([]);

  // Shared API call function with request deduplication and AbortController
  const fetchUserData = useCallback(async (requestId: string) => {
    // Prevent duplicate requests - check if this requestId is already active
    if (activeRequestsRef.current.has(requestId)) {
      // Request already in progress, abort the existing one and start new
      const existingController = activeRequestsRef.current.get(requestId);
      if (existingController) {
        existingController.abort();
      }
    }

    // Create new AbortController for this request
    const controller = new AbortController();
    activeRequestsRef.current.set(requestId, controller);

    try {
      const token = await getAuthToken();
      const storedUser = await getUserData();

      if (!token || !storedUser) {
        dispatch({ type: 'SET_ERROR', payload: 'Oops! 😅 We need to log you back in. Please ask a grown-up for help!' });
        return;
      }

      const user = storedUser;
      const userId = user.id;

      // Use regular API calls to fetch user data and transactions
      const userResponse = await fetch(`${API_URL}/users/${userId}`, {
        signal: controller.signal,
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!userResponse.ok) throw new Error('Failed to load user data');
      const data = await userResponse.json();

      let transactions: any[] = [];

      // Try to load recent transactions for activity feed
      try {
        console.log('RECENT_ADVENTURES_LOG: Fetching transactions for user:', userId);
        const transactionsResponse = await fetch(`${API_URL}/transactions/${userId}`, {
          signal: controller.signal,
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (transactionsResponse.ok && !controller.signal.aborted) {
          const responseData = await transactionsResponse.json();
          transactions = responseData.transactions || [];
          console.log('RECENT_ADVENTURES_LOG: Fetched', transactions.length, 'transactions:', transactions.map(t => ({ type: t.type, amount: t.amount, description: t.description })));
        } else {
          console.log('RECENT_ADVENTURES_LOG: Transaction fetch failed with status:', transactionsResponse.status);
        }
      } catch (txError) {
        if (!controller.signal.aborted) {
          console.log('RECENT_ADVENTURES_LOG: Could not load transactions, error:', txError instanceof Error ? txError.message : String(txError));
        }
      }

      // Only update state if this request wasn't cancelled
      if (!controller.signal.aborted) {

        // Calculate total points for fallback
        const currentTotalPoints = (data.currentPoints || 0) +
                                  (data.savePoints || 0) +
                                  (data.spendPoints || 0) +
                                  (data.donatePoints || 0) +
                                  (data.investPoints || 0);

        let activities: Activity[] = [];

        // Only use real transactions from the API - no mock data
        if (transactions && transactions.length > 0) {
          // Take the 5 most recent transactions
          activities = transactions.slice(0, 5).map((tx: any) => ({
            id: tx._id,
            type: tx.type,
            amount: tx.amount,
            description: tx.description || getTransactionDescription(tx),
            timestamp: tx.createdAt,
            icon: getTransactionIcon(tx.type)
          }));
        }
        // No fallback to mock data - activities array remains empty if no real transactions

        // Fetch goals, badges, and rewards separately for kids
        let goals: any[] = [];
        let badges: any[] = [];
        let rewards: any[] = [];

        try {
          // Fetch goals
          const goalsResponse = await fetch(`${API_URL}/goals/${userId}`, {
            signal: controller.signal,
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (goalsResponse.ok) {
            const goalsData = await goalsResponse.json();
            goals = goalsData.goals || [];
          }

          // Fetch badges/achievements
          const badgesResponse = await fetch(`${API_URL}/achievements/${userId}`, {
            signal: controller.signal,
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (badgesResponse.ok) {
            const badgesData = await badgesResponse.json();
            badges = badgesData.achievements || [];
          }

          // Fetch rewards
          const rewardsResponse = await fetch(`${API_URL}/rewards/${userId}`, {
            signal: controller.signal,
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (rewardsResponse.ok) {
            const rewardsData = await rewardsResponse.json();
            rewards = rewardsData.rewards || [];
          }
        } catch (fetchError) {
          console.log('Could not fetch goals/badges/rewards, using empty arrays:', fetchError instanceof Error ? fetchError.message : String(fetchError));
        }

        const jars = [
          { label: 'Pocket Money', key: 'current', value: data.currentPoints || 0, color: themeColors.jarColors.current, icon: '💰' },
          { label: 'Savings Pot', key: 'save', value: data.savePoints || 0, color: themeColors.jarColors.save, icon: '🐷' },
          { label: 'Spending Pot', key: 'spend', value: data.spendPoints || 0, color: themeColors.jarColors.spend, icon: '🛒' },
          { label: 'Help Others Pot', key: 'donate', value: data.donatePoints || 0, color: themeColors.jarColors.donate, icon: '🤲' },
          { label: 'Grow Money Pot', key: 'invest', value: data.investPoints || 0, color: themeColors.jarColors.invest, icon: '📈' }
        ];

        // Add goals, badges, and rewards to userData
        const userDataWithExtras = {
          ...data,
          goals,
          badges,
          rewards,
          transactions // Include transactions for setup progress calculation
        };

        dispatch({ type: 'SET_USER_DATA', payload: { userData: userDataWithExtras, jars, activities } });
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        console.error('Error loading user data:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Oops! 🤔 Having trouble loading your points right now. Please try again!' });
      }
    } finally {
      // Always clean up the request from active requests
      activeRequestsRef.current.delete(requestId);

      if (!controller.signal.aborted) {
        dispatch({ type: 'SET_LOADING_PHASE', payload: 'complete' });
        dispatch({ type: 'SET_REFRESHING', payload: false });
      }
    }
  }, [themeColors]);

  // Notification suppression (persistent):
  const [notificationsSuppressed, setNotificationsSuppressed] = useState<boolean>(false);
  const NOTIF_CLEARED_KEY = 'kids_notifications_cleared_at';
  useEffect(() => {
    (async () => {
      const clearedAt = await (await import('@react-native-async-storage/async-storage')).default.getItem(NOTIF_CLEARED_KEY);
      setNotificationsSuppressed(!!clearedAt);
    })();
  }, []);

  // Load notifications for kid
  const loadNotifications = useCallback(async () => {
    try {
      dispatch({ type: 'SET_NOTIFICATIONS_ERROR', payload: null });
      dispatch({ type: 'SET_NOTIFICATIONS_LOADING', payload: true });
      const token = await getAuthToken();
      const storedUser = await getUserData();
      if (!token || !storedUser) {
        dispatch({ type: 'SET_NOTIFICATIONS', payload: [] });
        dispatch({ type: 'SET_NOTIFICATIONS_LOADING', payload: false });
        return;
      }
      const user = storedUser;
      const userId = user.id;
      const notifList = await fetchNotifications(userId, token);
      dispatch({ type: 'SET_NOTIFICATIONS', payload: notifList || [] });
      // If there are new notifications, unsuppress if ANY notification is newer than clear time
      if (notifList && notifList.length > 0) {
        const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
        const clearedAtStr = await AsyncStorage.getItem(NOTIF_CLEARED_KEY);
        if (clearedAtStr) {
          const clearedTime = Number(clearedAtStr);
          // Show notifications if ANY notification arrived after clearing
          const hasNewAfterClear = notifList.some((n: any) =>
            n.createdAt && Number(new Date(n.createdAt)) > clearedTime
          );
          if (hasNewAfterClear) {
            setNotificationsSuppressed(false);
            await AsyncStorage.removeItem(NOTIF_CLEARED_KEY);
          }
        }
      }
    } catch (err) {
      dispatch({ type: 'SET_NOTIFICATIONS_ERROR', payload: "Failed to load notifications." });
      dispatch({ type: 'SET_NOTIFICATIONS', payload: [] });
    } finally {
      dispatch({ type: 'SET_NOTIFICATIONS_LOADING', payload: false });
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
        dispatch({ type: 'SET_GUIDED_TOUR_VISIBLE', payload: true });
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
      activeRequestsRef.current.forEach(controller => controller.abort());
      activeRequestsRef.current.clear();
    };
  }, [loadingPhase, fetchUserData, refreshIntervals.kidsHome]);

  const onRefresh = useCallback(() => {
    dispatch({ type: 'SET_REFRESHING', payload: true });
    const requestId = `user-data-refresh-${Date.now()}`;
    fetchUserData(requestId);
  }, [fetchUserData]);

  const totalPoints = jars.reduce((sum, jar) => sum + jar.value, 0);

  // Calculate today's earnings from transactions
  const calculateTodaysEarnings = () => {
    if (!recentActivities || recentActivities.length === 0) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1); // Start of tomorrow

    return recentActivities
      .filter(activity => {
        const activityDate = new Date(activity.timestamp);
        return activityDate >= today && activityDate < tomorrow && activity.amount > 0;
      })
      .reduce((sum, activity) => sum + activity.amount, 0);
  };

  const todaysEarnings = calculateTodaysEarnings();

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
      width: '100%',
      maxWidth: 520,
      alignSelf: 'center',
      elevation: 3,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      borderWidth: 2,
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
    // Empty state styles
    emptyState: {
      alignItems: 'center',
      paddingVertical: 30,
      paddingHorizontal: 20,
    },
    emptyIcon: {
      fontSize: 48,
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 8,
      textAlign: 'center',
    },
    emptyMessage: {
      fontSize: 16,
      textAlign: 'center',
      marginBottom: 20,
    },
    emptyActionButton: {
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 25,
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    },
    emptyActionText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: 'bold',
    },
    // Time-based content styles
    timeContext: {
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      borderWidth: 2,
      borderColor: themeColors.border,
    },
    timeGreeting: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 8,
    },
    timeTip: {
      fontSize: 16,
      marginBottom: 6,
      fontWeight: '500',
    },
    timeSuggestion: {
      fontSize: 14,
      fontStyle: 'italic',
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



      <View style={{ width: '100%', maxWidth: 520, marginBottom: 16, marginTop: 6 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 8 }}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Help and information"
            accessibilityHint="Open help guide for money pots"
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
          <Text
            style={[dynamicStyles.title, { color: themeColors.primary }]}
            accessibilityRole="header"
            accessibilityLabel="My Money Adventure - Home Dashboard"
          >
            🏠 My Money Adventure
          </Text>
        </View>

        {/* Time-Based Contextual Content */}
        <TimeBasedContent dynamicStyles={dynamicStyles} themeColors={themeColors} />

        {/* Caregivers Section */}
        {userData && userData.caregivers && userData.caregivers.length > 0 && (
          <View style={[dynamicStyles.quickActionCard, { backgroundColor: themeColors.surface + '80', borderColor: themeColors.success }]} >
            <Text style={[dynamicStyles.sectionTitle, { color: themeColors.success, textAlign: 'center' }]}>
              👨‍👩‍👧‍👦 My Family Helpers
            </Text>
            <Text style={{ textAlign: 'center', color: themeColors.textSecondary, fontSize: 14, marginBottom: 12 }}>
              These amazing people help me with my money adventure! 💪
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
              {userData.caregivers.map((caregiver: any, index: number) => {
                // Create kid-friendly labels and avoid duplicates
                const getKidFriendlyLabel = () => {
                  const role = caregiver.role || 'caregiver';
                  const relationship = caregiver.relationship;
                  const name = caregiver.name;

                  // Use name if available, otherwise use kid-friendly role names
                  if (name && name.trim()) {
                    return name;
                  }

                  // Use relationship field if available (more specific)
                  if (relationship) {
                    switch (relationship.toLowerCase()) {
                      case 'mother':
                        return 'Mom';
                      case 'father':
                        return 'Dad';
                      case 'grandmother':
                        return 'Grandma';
                      case 'grandfather':
                        return 'Grandpa';
                      case 'step-mother':
                        return 'Step-Mom';
                      case 'step-father':
                        return 'Step-Dad';
                      case 'guardian':
                        return 'Guardian';
                      default:
                        return 'Helper';
                    }
                  }

                  // Fallback to role-based labels (less specific)
                  switch (role.toLowerCase()) {
                    case 'parent':
                      return index === 0 ? 'My Parent' : 'Parent';
                    case 'mother':
                    case 'mom':
                      return 'Mom';
                    case 'father':
                    case 'dad':
                      return 'Dad';
                    case 'guardian':
                      return 'Guardian';
                    case 'grandparent':
                    case 'grandma':
                    case 'grandpa':
                      return index === 0 ? 'Grandparent' : 'Grandma/Pa';
                    default:
                      return 'Helper';
                  }
                };

                const getKidFriendlyEmoji = () => {
                  const role = caregiver.role || 'caregiver';

                  switch (role.toLowerCase()) {
                    case 'mother':
                    case 'mom':
                      return '👩';
                    case 'father':
                    case 'dad':
                      return '👨';
                    case 'grandparent':
                    case 'grandma':
                    case 'grandpa':
                      return '👴';
                    case 'guardian':
                      return '🛡️';
                    default:
                      return '❤️';
                  }
                };

                const label = getKidFriendlyLabel();
                const emoji = getKidFriendlyEmoji();

                return (
                  <View key={String(index)} style={{
                    backgroundColor: themeColors.card,
                    borderRadius: 12,
                    padding: 12,
                    minWidth: 100,
                    alignItems: 'center',
                    elevation: 2,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.2,
                    shadowRadius: 2,
                    borderWidth: 1,
                    borderColor: themeColors.border
                  }}>
                    <Text style={{ fontSize: 24, marginBottom: 4 }}>
                      {emoji}
                    </Text>
                    <Text style={{ fontSize: 12, color: themeColors.textSecondary, textAlign: 'center', fontWeight: '500' }}>
                      {label}
                    </Text>
                  </View>
                );
              })}
            </View>
            <Text style={{ textAlign: 'center', color: themeColors.textSecondary, fontSize: 12, marginTop: 8, fontStyle: 'italic' }}>
              Ask them for help with your money pots! 🎯
            </Text>
          </View>
        )}
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
          accessibilityRole="button"
          accessibilityLabel={refreshing ? "Refreshing points data" : "Update my points"}
          accessibilityHint="Refresh to get the latest points and activities"
          accessibilityState={{ disabled: refreshing }}
          style={[styles.actionButton, { backgroundColor: themeColors.secondary, marginBottom: 0 }]}
          onPress={onRefresh}
          disabled={refreshing}
        >
        <Text style={styles.actionButtonText}>
          {refreshing ? '🔄 Getting Latest...' : '🔄 Update My Points'}
        </Text>
        </TouchableOpacity>
      </View>

      {/* Hero Section with Total Points and Quick Stats */}
      <View style={[dynamicStyles.quickActionCard, {
        backgroundColor: themeColors.primary + '10',
        borderColor: themeColors.primary,
        borderWidth: 2,
      }]}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <AnimatedCounter
              value={totalPoints}
              fontSize={42}
              color={themeColors.primary}
              suffix=""
            />
            <Text style={{
              fontSize: 16,
              color: themeColors.textSecondary,
              marginTop: 4,
              textAlign: 'center'
            }}>
              My Points
            </Text>
          </View>

          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-around',
            flex: 1,
          }}>
            <StatCard
              icon="🎁"
              value={userData && userData.rewards ? userData.rewards.length.toString() : "0"}
              label="Rewards"
              color={themeColors.accent + '20'}
              size="small"
            />
            <StatCard
              icon="🎯"
              value={userData && userData.goals ? userData.goals.length.toString() : "0"}
              label="Goals"
              color={themeColors.warning + '20'}
              size="small"
            />
            <StatCard
              icon="📈"
              value={todaysEarnings > 0 ? `+${todaysEarnings}` : "0"}
              label="Today"
              color={themeColors.success + '20'}
              size="small"
            />
          </View>
        </View>
      </View>

      {/* Enhanced Money Jars Overview */}
      <View style={dynamicStyles.quickActionCard}>
        <Text style={dynamicStyles.sectionTitle}>My Pots</Text>
        <View style={{flexDirection: "row", flexWrap: "wrap", justifyContent: "space-evenly", marginVertical: 10}}>
          {jars.map(jar => (
            <JarCard
              key={jar.label}
              jar={jar}
              progress={(jar.value / totalPoints) * 100}
              trend="+5%"
              showInsights={true}
            />
          ))}
        </View>
      </View>

      {/* Enhanced Quick Actions */}
      <View style={dynamicStyles.quickActionCard}>
        <Text style={dynamicStyles.sectionTitle}>What Can I Do?</Text>

        {/* Smart Action Cards - Always show 2-3 most important actions */}
        <ActionCard
          icon="🔄"
          title="Move My Points"
          subtitle="Switch money between your pots!"
          color={themeColors.warning}
          onPress={() => router.push('./money-jars')}
        />

        <ActionCard
          icon="🎯"
          title="Set Awesome Goals"
          subtitle="Save for your dream prize!"
          color={themeColors.success}
          onPress={() => router.push('./goals')}
        />

        {/* Show more actions based on user state */}
        {showMore && (
          <>
            <ActionCard
              icon="🎁"
              title="Claim Amazing Gifts"
              subtitle="Earn rewards with your points!"
              color={themeColors.warning}
              onPress={() => router.push('./gifts')}
            />
            <ActionCard
              icon="🧹"
              title="Do Fun Tasks"
              subtitle="Complete chores & earn points!"
              color={themeColors.secondary}
              badge={userData?.transactions?.filter((tx: any) => tx.type === 'chore-completion').length || 0}
              onPress={() => router.push('./chores')}
            />

            <ActionCard
              icon="📚"
              title="Money Magic School"
              subtitle="Learn cool money tricks!"
              color={themeColors.error}
              onPress={() => router.push('./learn')}
            />

            <ActionCard
              icon="🎮"
              title="Play Money Games"
              subtitle="Have fun while learning!"
              color={themeColors.accent}
              onPress={() => router.push('./games')}
            />
          </>
        )}

        <TouchableOpacity
          onPress={() => setShowMore(v => !v)}
          accessibilityRole="button"
          style={{
            marginTop: 12,
            alignItems: 'center',
            padding: 12,
            borderRadius: 10,
            alignSelf: 'center',
            backgroundColor: themeColors.surface,
            borderWidth: 1,
            borderColor: themeColors.border,
            minWidth: 120,
          }}
        >
          <Text style={{ fontWeight: 'bold', color: themeColors.primary, fontSize: 16 }}>
            {showMore ? "Show Less ▲" : "Show More ▼"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Recent Activity Feed */}
      <View style={dynamicStyles.quickActionCard}>
        <Text style={dynamicStyles.sectionTitle}>🎉 My Recent Adventures</Text>

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
                  {new Date(activity.timestamp).toLocaleDateString()} • {activity.amount > 0 ? '+' : ''}{formatAmount(Math.abs(activity.amount))} points
                </Text>
              </View>
            </View>
          ))
        ) : (
          <View style={{ paddingVertical: 20, alignItems: 'center' }}>
            <Text style={{ fontSize: 16, color: themeColors.textSecondary, textAlign: 'center', marginBottom: 16 }}>
              🚀 Ready for your first adventure?
            </Text>
            <Text style={{ fontSize: 14, color: themeColors.textSecondary, textAlign: 'center', marginBottom: 20 }}>
              Complete chores, claim rewards, or set goals to earn points! Your awesome activities will appear here after your parent gives the thumbs up! 🎉
            </Text>

            <View style={{ flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginBottom: 16 }}>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Do chores and tasks"
                accessibilityHint="Navigate to chores page to earn points"
                style={[styles.actionButton, { backgroundColor: themeColors.secondary, flex: 1, marginHorizontal: 4 }]}
                onPress={() => router.push('./chores')}
              >
                <Text style={[styles.actionButtonText, { fontSize: 14 }]}>Do Tasks</Text>
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Set savings goals"
                accessibilityHint="Navigate to goals page to create savings targets"
                style={[styles.actionButton, { backgroundColor: themeColors.success, flex: 1, marginHorizontal: 4 }]}
                onPress={() => router.push('./goals')}
              >
                <Text style={[styles.actionButtonText, { fontSize: 14 }]}>Set Goals</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="View transaction history"
              accessibilityHint="Navigate to full activity and transaction history"
              style={[styles.actionButton, { backgroundColor: themeColors.accent, marginTop: 8 }]}
              onPress={() => router.push('./transaction-history')}
            >
              <Text style={[styles.actionButtonText, { fontSize: 14 }]}>View All History 📊</Text>
            </TouchableOpacity>
          </View>
        )}

        {recentActivities.length > 0 && (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="See all activities and transaction history"
            accessibilityHint="Navigate to complete activity and transaction history page"
            style={[styles.actionButton, { backgroundColor: themeColors.accent, marginTop: 15 }]}
            onPress={() => router.push('./transaction-history')}
          >
            <Text style={[styles.actionButtonText, { color: themeColors.card }]}>
              See All Activities 📊
            </Text>
          </TouchableOpacity>
        )}
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
          dispatch({ type: 'SET_GUIDED_TOUR_VISIBLE', payload: false });
          // Update user to mark as not first-time user
          try {
            const token = await getAuthToken();
            const storedUser = await getUserData();
            if (token && storedUser) {
              const user = storedUser;
              await fetch(`${API_URL}/users/${user.id}`, {
                method: 'PATCH',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ isFirstTimeUser: false }),
              });
              // Update local userData via reducer
              dispatch({ type: 'UPDATE_USER_FIRST_TIME_STATUS', payload: false });
            }
          } catch (error) {
            console.error('Failed to update first-time user status:', error);
          }
        }}
        onDismiss={() => dispatch({ type: 'SET_GUIDED_TOUR_VISIBLE', payload: false })}
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
