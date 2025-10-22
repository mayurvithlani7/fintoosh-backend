import HelpModal from '@/components/HelpModal';
import SkeletonJar from '@/components/ui/SkeletonJar';
import { fetchNotifications, markNotificationRead } from '@/utils/api';
import { useCurrency } from '@/utils/currencyContext';
import { useDataCache } from '@/utils/dataCacheContext';
import { getAuthToken } from '@/utils/secureStorage';
import { useTheme } from '@/utils/themeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, Image, Modal, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

/**
 * Calculate a readable next interest payout date string.
 * Placeholder: For demo, next payout is exactly 7 or 30 days away if no backend timestamp, else uses child's lastPayoutDate if available.
 */
import type { InterestRuleType } from "@/utils/currencyContext";

// Enhanced empty state component with progressive onboarding
const EmptyState = ({ styles }: { styles: any }) => {
  const router = useRouter();
  const { themeColors } = useTheme();

  return (
    <View style={styles.emptyContainer}>
      <Image
        source={require('@/assets/images/placeholder-family.png')}
        style={styles.emptyImage}
        resizeMode="contain"
      />
      <Text style={[styles.emptyTitle, { color: themeColors.primary }]}>
        Welcome to Family Finance Hub!
      </Text>
      <Text style={[styles.emptyDescription, { color: themeColors.text }]}>
        Start teaching your child about money management by adding their profile.
      </Text>
      <View style={styles.onboardingSteps}>
        <Text style={[styles.onboardingStep, { color: themeColors.textSecondary }]}>
          • Set up money pots and goals
        </Text>
        <Text style={[styles.onboardingStep, { color: themeColors.textSecondary }]}>
          • Approve spending requests
        </Text>
        <Text style={[styles.onboardingStep, { color: themeColors.textSecondary }]}>
          • Track financial learning progress
        </Text>
      </View>
      <TouchableOpacity
        style={[styles.primaryButton, { backgroundColor: themeColors.success }]}
        onPress={() => router.push('/addChild')}
      >
        <Text style={[styles.primaryButtonText, { color: themeColors.card }]}>
          Add Your Child
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default function ParentsOverviewScreen() {
  const router = useRouter();
  const { refresh } = useLocalSearchParams();
  const { themeColors } = useTheme();
  const styles = createStyles(themeColors);
  const {
    childData,
    childDataStatus,
    fetchChildData,
    isDataStale,
  } = useDataCache();
  const { interestRule } = useCurrency();
  const [refreshing, setRefreshing] = useState(false);
  const [helpModalVisible, setHelpModalVisible] = useState(false);
  const [showMoreActions, setShowMoreActions] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    notifications: true,  // Always expanded if there are unread notifications
    interest: false,      // Collapsed by default - secondary info
    pots: true,          // Expanded by default - core child status
  });

  // Utility for persisting "cleared at" time
  const NOTIF_CLEARED_KEY = 'parents_notifications_cleared_at';

  // Notifications state
  const [notifications, setNotifications] = useState<{ _id?: string; message: string; isRead?: boolean }[]>([]);
  const [notifLoading, setNotifLoading] = useState(true);
  const [notifError, setNotifError] = useState<string | null>(null);
  // Local persistent state: suppress notifications if cleared until new ones arrive
  const [notificationsSuppressed, setNotificationsSuppressed] = useState<boolean>(false);

  // On mount, check if persisted clear is present
  React.useEffect(() => {
    (async () => {
      const clearedAt = await AsyncStorage.getItem(NOTIF_CLEARED_KEY);
      setNotificationsSuppressed(!!clearedAt);
    })();
  }, []);

  // Progressive loading states
  const [loadingPhase, setLoadingPhase] = useState<'critical' | 'secondary' | 'complete'>('critical');

  // -- Progressive data loading with prioritization --
  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        setLoadingPhase('critical');

        // Load critical data first (child data)
        if (isDataStale('childData')) {
          await fetchChildData();
        }
        setLoadingPhase('secondary');

        // Then load secondary data with delay
        setTimeout(() => {
          loadNotifications();
          setLoadingPhase('complete');
        }, 100);
      };

      loadData();
    }, [fetchChildData]) // isDataStale is stable from context
  );

  // Check for refresh parameter and update data
  React.useEffect(() => {
    if (refresh === 'true') {
      fetchChildData(true); // Force refresh
    }
  }, [refresh, fetchChildData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchChildData(true).finally(() => setRefreshing(false));
    loadNotifications();
  }, [fetchChildData]);

  // Handle notification press - separate function to avoid issues in renderItem
  const handleNotificationPress = useCallback(async (notif: { _id?: string; message: string; isRead?: boolean }) => {
    try {
      const currentUserStr = await AsyncStorage.getItem('user');
      const token = await getAuthToken();
      if (notif._id && token && currentUserStr) {
        await markNotificationRead(notif._id, token);
        await loadNotifications();
      }
    } catch (err) {
      // Silent fail for notification marking
    }
    router.push('/(parents-tabs)/requests');
  }, [router]);

  // Use context only in components, not in event/callback bodies!
  // childData is now handled globally (cache), no local error/loading for jars panel needed

  // Fetch parent notifications
  const loadNotifications = async () => {
    try {
      setNotifError(null);
      setNotifLoading(true);
      const currentUserStr = await AsyncStorage.getItem('user');
      const token = await getAuthToken();
      if (!currentUserStr || !token) {
        setNotifications([]);
        setNotifLoading(false);
        return;
      }
      const currentUser = JSON.parse(currentUserStr);
      if (!currentUser.id) {
        setNotifications([]);
        setNotifLoading(false);
        return;
      }
      const notifList = await fetchNotifications(currentUser.id, token);
      setNotifications(notifList || []);
    // If there are new notifications, unsuppress if ANY notification is newer than clear time
    if (notifList && notifList.length > 0) {
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
    } catch {
      setNotifError("Failed to load notifications.");
      setNotifications([]);
    } finally {
      setNotifLoading(false);
    }
  };



  // Remove legacy error UI (now handled via global snackbar)

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Notifications section */}
      {(notificationsSuppressed === false && (notifLoading || notifError || notifications.filter(n => !n.isRead).length > 0)) && (
        <View style={[styles.notificationSection, {
          backgroundColor: themeColors.surface,
          borderColor: themeColors.border,
          borderWidth: 1,
          shadowColor: themeColors.border
        }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={[styles.notificationTitle, { color: themeColors.primary }]}>Notifications</Text>
            {/* Hide clear button if loading or there are no notifications */}
            {!notifLoading && notifications.length > 0 && (
              <TouchableOpacity
                onPress={async () => {
                  try {
                    const currentUserStr = await AsyncStorage.getItem('user');
                    const token = await getAuthToken();
                    if (currentUserStr && token) {
                      const currentUser = JSON.parse(currentUserStr);
                      if (currentUser.id) {
                        // Mark all unread notifications as read individually
                        const unreadNotifications = notifications.filter(n => !n.isRead);
                        const markPromises = unreadNotifications.map(async (notif) => {
                          if (notif._id) {
                            try {
                              await markNotificationRead(notif._id, token);
                              return true;
                            } catch {
                              return false;
                            }
                          }
                          return false;
                        });

                        const results = await Promise.all(markPromises);
                        const successCount = results.filter(Boolean).length;

                        if (successCount > 0) {
                          // Successfully marked some/all notifications as read
                          setNotifications([]);
                          setNotificationsSuppressed(true);
                          // Persist the time of clear for future reloads
                          await AsyncStorage.setItem(NOTIF_CLEARED_KEY, String(Date.now()));

                          if (successCount < unreadNotifications.length) {
                            // Partial success - some notifications failed to mark
                            Alert.alert(
                              'Partial Success',
                              `Cleared ${successCount} of ${unreadNotifications.length} notifications. Some may still appear.`,
                              [{ text: 'OK' }]
                            );
                          }
                        } else {
                          // No notifications were successfully marked
                          Alert.alert(
                            'Clear Failed',
                            'Unable to clear notifications. Please try again.',
                            [{ text: 'OK' }]
                          );
                        }
                      }
                    }
                  } catch (err) {
                    console.error('Failed to mark all notifications as read:', err);
                    Alert.alert(
                      'Clear Notifications Failed',
                      'Network error. Please check your connection and try again.',
                      [{ text: 'OK' }]
                    );
                  }
                }}
                style={{
                  backgroundColor: themeColors.error,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 8,
                  marginBottom: 6,
                }}
                accessibilityRole="button"
                accessibilityLabel="Clear all notifications"
              >
                <Text style={{ color: themeColors.card, fontWeight: 'bold', fontSize: 14 }}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>
          {notifLoading ? (
            <Text style={[styles.notificationText, { color: themeColors.textSecondary }]}>Loading...</Text>
          ) : notifError ? (
            <Text style={[styles.notificationText, { color: themeColors.textSecondary }]}>{notifError}</Text>
          ) : (
            notifications.filter(n => !n.isRead).slice(0, 4).map((notif, index) => (
              <TouchableOpacity
                key={notif._id || `notif-${index}`}
                style={[styles.notificationCard, {
                  backgroundColor: themeColors.card,
                  borderColor: themeColors.border,
                  borderWidth: 1,
                  shadowColor: themeColors.border
                }]}
                onPress={() => handleNotificationPress(notif)}
              >
                <Text style={[styles.notificationText, styles.notificationUnread, { color: themeColors.warning }]}>
                  {notif.message}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      )}

      {/* Heading */}
      <View style={{ width: '100%', maxWidth: 520, marginBottom: 16, marginTop: 6 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 8 }}>
          <TouchableOpacity
            style={{
              backgroundColor: themeColors.accent,
              borderRadius: 16,
              paddingHorizontal: 16, // Increased from 8 for accessibility
              paddingVertical: 12,  // Increased from 4 for accessibility
              elevation: 2,
              minWidth: 48,         // Explicit minimum for accessibility
              minHeight: 48,        // Explicit minimum for accessibility
              justifyContent: 'center',
              alignItems: 'center',
            }}
            onPress={() => setHelpModalVisible(true)}
          >
            <Text style={{ color: themeColors.card, fontWeight: 'bold', fontSize: 14 }}>❓ Help</Text>
          </TouchableOpacity>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={[styles.title, { color: themeColors.primary }]}>Family Finance Hub</Text>
        </View>
      </View>

      {/* Refresh Button */}
      <View style={[styles.sectionCard, { backgroundColor: themeColors.card, shadowColor: themeColors.border }]}>
        <TouchableOpacity
          style={[styles.quickBtn, { backgroundColor: themeColors.primary, alignSelf: 'center', minWidth: 200 }]}
          onPress={onRefresh}
          disabled={refreshing}
        >
          <Text style={[styles.quickBtnText, { color: themeColors.card }]}>
            {refreshing ? 'Refreshing...' : '🔄 Refresh Your Child\'s Data'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Interest Payout Info - Collapsible */}
      {interestRule && childData && (
        <View style={[styles.sectionCard, { backgroundColor: themeColors.surface, borderColor: themeColors.success, borderWidth: 1, shadowColor: themeColors.border }]}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => setExpandedSections(prev => ({ ...prev, interest: !prev.interest }))}
          >
            <Text style={[styles.sectionTitle, { color: themeColors.success }]}>💸 Next Interest Payout</Text>
            <Text style={[styles.expandIcon, { color: themeColors.textSecondary }]}>
              {expandedSections.interest ? '▼' : '▶'}
            </Text>
          </TouchableOpacity>

          {expandedSections.interest && (
            <View style={styles.expandedContent}>
              <Text style={{ fontSize: 15, color: themeColors.text, marginBottom: 6 }}>
                <Text style={{ fontWeight: 'bold' }}>Savings Pot Balance:</Text> {childData.savePoints}
              </Text>
              <Text style={{ fontSize: 15, color: themeColors.text, marginBottom: 6 }}>
                <Text style={{ fontWeight: 'bold' }}>Interest Rate:</Text> {interestRule.rate}% {interestRule.frequency === 'monthly' ? 'per month' : 'per week'}
              </Text>
              <Text style={{ fontSize: 15, color: themeColors.text }}>
                <Text style={{ fontWeight: 'bold' }}>Next Payout Date:</Text> {getNextInterestPayout(interestRule, childData)}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Child Jars Panel */}
      <View style={[styles.sectionCard, { backgroundColor: themeColors.card, shadowColor: themeColors.border }]}>
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
          {childData ? `${childData.name}'s Pots` : 'Your Child\'s Pots'}
        </Text>
        {childDataStatus === 'loading' ? (
          (() => {
            return (
              <View style={styles.jarsContainer}>
                {[...Array(5)].map((_, i) => (
                  <SkeletonJar key={i} size={70} />
                ))}
              </View>
            );
          })()
        ) : childData ? (
          <View style={styles.jarsContainer}>
            <View style={[styles.jar, { backgroundColor: themeColors.jarColors?.current || '#E8F5E8' }]}>
              <Text style={[styles.jarLabel, { color: themeColors.text }]}>Pocket Money</Text>
              <Text style={[styles.jarValue, { color: themeColors.text }]}>{childData.currentPoints}</Text>
            </View>
            <View style={[styles.jar, { backgroundColor: themeColors.jarColors?.save || '#E3F2FD' }]}>
              <Text style={[styles.jarLabel, { color: themeColors.text }]}>Savings Pot</Text>
              <Text style={[styles.jarValue, { color: themeColors.text }]}>{childData.savePoints}</Text>
            </View>
            <View style={[styles.jar, { backgroundColor: themeColors.jarColors?.spend || '#FFF3E0' }]}>
              <Text style={[styles.jarLabel, { color: themeColors.text }]}>Spending Pot</Text>
              <Text style={[styles.jarValue, { color: themeColors.text }]}>{childData.spendPoints}</Text>
            </View>
            <View style={[styles.jar, { backgroundColor: themeColors.jarColors?.donate || '#FCE4EC' }]}>
              <Text style={[styles.jarLabel, { color: themeColors.text }]}>Help Others Pot</Text>
              <Text style={[styles.jarValue, { color: themeColors.text }]}>{childData.donatePoints}</Text>
            </View>
            <View style={[styles.jar, { backgroundColor: themeColors.jarColors?.invest || '#F3E5F5' }]}>
              <Text style={[styles.jarLabel, { color: themeColors.text }]}>Grow Money Pot</Text>
              <Text style={[styles.jarValue, { color: themeColors.text }]}>{childData.investPoints}</Text>
            </View>
          </View>
        ) : (
          <EmptyState styles={styles} />
        )}
      </View>

      {/* Quick Actions - Grouped by Priority */}
      <View style={[styles.actionCard, { backgroundColor: themeColors.card, shadowColor: themeColors.border }]}>
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Quick Actions</Text>

        {/* Primary Actions - Most frequently used */}
        <View style={styles.primaryActions}>
          <TouchableOpacity
            style={[styles.primaryActionBtn, { backgroundColor: themeColors.primary }]}
            onPress={() => router.push('/(parents-tabs)/requests')}
          >
            <Text style={[styles.primaryActionText, { color: themeColors.card }]}>📋</Text>
            <Text style={[styles.primaryActionLabel, { color: themeColors.card }]}>Check Requests</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.primaryActionBtn, { backgroundColor: themeColors.success }]}
            onPress={() => router.push('/(parents-tabs)/points')}
          >
            <Text style={[styles.primaryActionText, { color: themeColors.card }]}>💰</Text>
            <Text style={[styles.primaryActionLabel, { color: themeColors.card }]}>Give Pocket Money</Text>
          </TouchableOpacity>
        </View>

        {/* More Actions Button */}
        <TouchableOpacity
          style={[styles.moreActionsBtn, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}
          onPress={() => setShowMoreActions(true)}
        >
          <Text style={[styles.moreActionsText, { color: themeColors.text }]}>More Actions ▼</Text>
        </TouchableOpacity>
      </View>

      {/* More Actions Modal */}
      <Modal
        visible={showMoreActions}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowMoreActions(false)}
      >
        <View style={styles.moreActionsModal}>
          <TouchableOpacity
            style={styles.moreActionsModal}
            activeOpacity={1}
            onPress={() => setShowMoreActions(false)}
          >
            <View style={styles.moreActionsSheet}>
              <Text style={[styles.moreActionsTitle, { color: themeColors.text }]}>All Actions</Text>

              <View style={styles.moreActionsGrid}>
                <TouchableOpacity
                  style={[styles.moreActionBtn, { backgroundColor: themeColors.secondary }]}
                  onPress={() => {
                    setShowMoreActions(false);
                    router.push('/(parents-tabs)/goals');
                  }}
                >
                  <Text style={styles.moreActionEmoji}>🎯</Text>
                  <Text style={[styles.moreActionText, { color: themeColors.card }]}>Set Child Goals</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.moreActionBtn, { backgroundColor: themeColors.warning }]}
                  onPress={() => {
                    setShowMoreActions(false);
                    router.push('/(parents-tabs)/chores');
                  }}
                >
                  <Text style={styles.moreActionEmoji}>🧹</Text>
                  <Text style={[styles.moreActionText, { color: themeColors.card }]}>Add Home Tasks</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.moreActionBtn, { backgroundColor: themeColors.accent }]}
                  onPress={() => {
                    setShowMoreActions(false);
                    router.push('/(parents-tabs)/rewards');
                  }}
                >
                  <Text style={styles.moreActionEmoji}>🎁</Text>
                  <Text style={[styles.moreActionText, { color: themeColors.card }]}>Manage Rewards</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.moreActionBtn, { backgroundColor: themeColors.primary }]}
                  onPress={() => {
                    setShowMoreActions(false);
                    router.push('/(parents-tabs)/analytics');
                  }}
                >
                  <Text style={styles.moreActionEmoji}>📊</Text>
                  <Text style={[styles.moreActionText, { color: themeColors.card }]}>View Progress</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.moreActionBtn, { backgroundColor: themeColors.secondary }]}
                  onPress={() => {
                    setShowMoreActions(false);
                    router.push('/(parents-tabs)/transaction-history');
                  }}
                >
                  <Text style={styles.moreActionEmoji}>📜</Text>
                  <Text style={[styles.moreActionText, { color: themeColors.card }]}>See History</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.moreActionBtn, { backgroundColor: themeColors.surface, borderWidth: 1, borderColor: themeColors.border }]}
                  onPress={() => setShowMoreActions(false)}
                >
                  <Text style={styles.moreActionEmoji}>❌</Text>
                  <Text style={[styles.moreActionText, { color: themeColors.text }]}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Help Modal */}
      <HelpModal
        visible={helpModalVisible}
        onClose={() => setHelpModalVisible(false)}
        title="👨‍👩‍👧‍👦 Parent Overview - Help"
        tabs={[
          {
            title: "Welcome to Family Finance Hub",
            content: [
              {
                type: "text",
                text: "Welcome to your Family Finance Hub! This central dashboard helps you guide your child's financial learning journey with powerful tools and insights.",
                icon: "🏠"
              },
              {
                type: "bullet",
                text: "Real-time monitoring of your child's money pots and points balance"
              },
              {
                type: "bullet",
                text: "Quick access to approve requests, set goals, and manage rewards"
              },
              {
                type: "bullet",
                text: "Interest payout tracking for savings encouragement"
              },
              {
                type: "bullet",
                text: "Notifications for important updates and approvals needed"
              },
              {
                type: "highlight",
                text: "Everything you need to teach your child about money management in one place!",
                icon: "💰"
              }
            ]
          },
          {
            title: "Understanding Money Pots",
            content: [
              {
                type: "text",
                text: "Your child learns to manage money through 5 specialized pots, each teaching different financial concepts:",
                icon: "🏺"
              },
              {
                type: "bullet",
                text: "🤑 Pocket Money - Immediate spending for treats and small purchases"
              },
              {
                type: "bullet",
                text: "🐷 Savings Pot - Long-term goals like bikes, tablets, or special outings"
              },
              {
                type: "bullet",
                text: "🛍️ Spending Pot - Fun items they want but don't necessarily need"
              },
              {
                type: "bullet",
                text: "❤️ Help Others Pot - Charitable giving and community support"
              },
              {
                type: "bullet",
                text: "📈 Grow Money Pot - Learning about investments and financial growth"
              },
              {
                type: "highlight",
                text: "Each pot teaches valuable lessons about budgeting, saving, and responsible spending!",
                icon: "🎓"
              }
            ]
          },
          {
            title: "Managing Notifications & Requests",
            content: [
              {
                type: "text",
                text: "Stay connected with your child's financial activities through smart notifications:",
                icon: "🔔"
              },
              {
                type: "bullet",
                text: "Reward requests - When your child wants to redeem points"
              },
              {
                type: "bullet",
                text: "Point transfer requests - When they want to move money between pots"
              },
              {
                type: "bullet",
                text: "Goal completion notifications - Celebrating achievements"
              },
              {
                type: "bullet",
                text: "Chore approval requests - When tasks are completed"
              },
              {
                type: "bullet",
                text: "System updates - New features and important announcements"
              },
              {
                type: "highlight",
                text: "Tap any notification to go directly to the relevant management screen!",
                icon: "👆"
              }
            ]
          },
          {
            title: "Quick Actions Guide",
            content: [
              {
                type: "text",
                text: "Navigate efficiently with these quick action buttons:",
                icon: "⚡"
              },
              {
                type: "bullet",
                text: "📋 Check Requests - Review and approve/reject child requests"
              },
              {
                type: "bullet",
                text: "💰 Give Pocket Money - Add points to your child's account"
              },
              {
                type: "bullet",
                text: "🎯 Set Child Goals - Create savings targets and milestones"
              },
              {
                type: "bullet",
                text: "🧹 Add Home Tasks - Set up chores and earning opportunities"
              },
              {
                type: "bullet",
                text: "🎁 Manage Rewards - Create prizes your child can work towards"
              },
              {
                type: "bullet",
                text: "📊 View Progress - See detailed analytics and reports"
              },
              {
                type: "bullet",
                text: "📜 See History - Review transaction history and patterns"
              },
              {
                type: "highlight",
                text: "Each button opens a specialized management area - explore them all!",
                icon: "🎯"
              }
            ]
          },
          {
            title: "Interest & Savings Program",
            content: [
              {
                type: "text",
                text: "Encourage saving habits with our interest program:",
                icon: "💸"
              },
              {
                type: "bullet",
                text: "Automatic interest added to Savings Pot balances"
              },
              {
                type: "bullet",
                text: "Weekly or monthly payouts based on your settings"
              },
              {
                type: "bullet",
                text: "Teaches compound growth and delayed gratification"
              },
              {
                type: "bullet",
                text: "Tracks next payout date automatically"
              },
              {
                type: "highlight",
                text: "Interest motivates children to save more and wait longer for bigger rewards!",
                icon: "⏳"
              }
            ]
          },
          {
            title: "Tips for Success",
            content: [
              {
                type: "text",
                text: "Make the most of your child's financial education:",
                icon: "💡"
              },
              {
                type: "bullet",
                text: "Discuss money decisions together during family time"
              },
              {
                type: "bullet",
                text: "Celebrate both small savings and big achievements"
              },
              {
                type: "bullet",
                text: "Use real-world examples to explain financial concepts"
              },
              {
                type: "bullet",
                text: "Review progress regularly and adjust goals as needed"
              },
              {
                type: "bullet",
                text: "Encourage questions and make learning fun"
              },
              {
                type: "highlight",
                text: "Financial literacy is a journey - enjoy teaching these valuable life skills!",
                icon: "🌟"
              }
            ]
          }
        ]}
      />
    </ScrollView>
  );
}
function getNextInterestPayout(
  rule: InterestRuleType,
  childData: { lastInterestPayoutDate?: string }
): string {
  // Backend should supply lastInterestPayoutDate and handle in production!
  const now = new Date();
  let daysToAdd = rule.frequency === "monthly" ? 30 : 7;
  let lastDate = childData.lastInterestPayoutDate
    ? new Date(childData.lastInterestPayoutDate)
    : now;
  let next = new Date(lastDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
  return next.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const createStyles = (themeColors: any) => StyleSheet.create({
  notificationSection: {
    borderRadius: 14,
    padding: 12,
    marginBottom: 18,
    minWidth: 320,
    width: '97%',
    maxWidth: 520,
    elevation: 8,  // Higher than regular cards for critical notifications
    shadowColor: themeColors.shadow || '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 10,
  },
  notificationTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
    color: themeColors.primary,
  },
  notificationCard: {
    padding: 8,
    marginBottom: 3,
    borderRadius: 7,
    elevation: 1,
  },
  notificationText: {
    fontSize: 15,
    color: themeColors.text,
  },
  notificationUnread: {
    fontWeight: 'bold',
    color: themeColors.warning,
  },
  notificationRead: {
    opacity: 0.5,
  },
  scroll: { backgroundColor: themeColors.background },
  container: { alignItems: 'center', paddingVertical: 12, paddingHorizontal: 6 },
  navRow: { flexDirection: 'row', alignSelf: 'center', marginBottom: 12 },
  navBtn: { backgroundColor: themeColors.secondary, borderRadius: 8, marginHorizontal: 4, paddingVertical: 8, paddingHorizontal: 16 },
  navBtnText: { color: themeColors.card, fontWeight: 'bold', fontSize: 16 },
  title: { fontSize: 35, fontWeight: 'bold', marginBottom: 22, marginTop: 6, color: themeColors.primary },
  sectionCard: { backgroundColor: themeColors.card, borderRadius: 16, marginBottom: 16, padding: 16, minWidth: 320, width: '97%', maxWidth: 520, elevation: 2, shadowColor: themeColors.border }, // Standard elevation for regular cards
  actionCard: { backgroundColor: themeColors.card, borderRadius: 16, marginBottom: 16, padding: 16, minWidth: 320, width: '97%', maxWidth: 520, elevation: 4, borderWidth: 2, borderColor: themeColors.primary, shadowColor: themeColors.border }, // Higher elevation for action sections
  sectionTitle: { fontSize: 20, fontWeight: '600', marginBottom: 8, color: themeColors.text },
  placeholder: { fontStyle: 'italic', fontSize: 15, marginBottom: 1, marginTop: 2, minHeight: 26, color: themeColors.textSecondary },
  quickActions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  quickBtn: {
    padding: 16,          // Increased from 12 to meet 48dp accessibility
    borderRadius: 8,
    margin: 4,
    minWidth: 160,        // Increased from 140
    minHeight: 48,        // Added explicit minimum height
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickBtnText: { fontWeight: '700', fontSize: 15 },
  jarsContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginTop: 10 },
  jar: { borderRadius: 14, padding: 18, minWidth: 80, alignItems: 'center', elevation: 2, shadowColor: themeColors.shadow || '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2 },
  jarLabel: { fontWeight: 'bold', fontSize: 14, marginBottom: 4 },
  jarValue: { fontSize: 18, fontWeight: 'bold' },
  // Empty state styles
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyImage: {
    width: 200,
    height: 150,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyDescription: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  onboardingSteps: {
    alignSelf: 'stretch',
    marginBottom: 30,
  },
  onboardingStep: {
    fontSize: 16,
    marginBottom: 8,
    lineHeight: 24,
  },
  primaryButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    minWidth: 200,
    alignItems: 'center',
    elevation: 3,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  // More actions modal styles
  moreActionsModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  moreActionsSheet: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '60%',
  },
  moreActionsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  moreActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  moreActionBtn: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  moreActionText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
  moreActionEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  // Primary actions styles
  primaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  primaryActionBtn: {
    flex: 1,
    padding: 20,
    borderRadius: 12,
    marginHorizontal: 4,
    alignItems: 'center',
    elevation: 3,
  },
  primaryActionText: {
    fontSize: 32,
    marginBottom: 8,
  },
  primaryActionLabel: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  moreActionsBtn: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  moreActionsText: {
    fontSize: 16,
    fontWeight: '600',
  },
  // Collapsible section styles
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  expandIcon: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  expandedContent: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
});
