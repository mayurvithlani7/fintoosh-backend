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
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

/**
 * Calculate a readable next interest payout date string.
 * Placeholder: For demo, next payout is exactly 7 or 30 days away if no backend timestamp, else uses child's lastPayoutDate if available.
 */
import type { InterestRuleType } from "@/utils/currencyContext";

export default function ParentsOverviewScreen() {
  const router = useRouter();
  const { refresh } = useLocalSearchParams();
  const { themeColors } = useTheme();
  const {
    childData,
    childDataStatus,
    fetchChildData,
    isDataStale,
  } = useDataCache();
  const { interestRule } = useCurrency();
  const [refreshing, setRefreshing] = useState(false);
  const [helpModalVisible, setHelpModalVisible] = useState(false);

  // Notifications state
  const [notifications, setNotifications] = useState<{ _id?: string; message: string; isRead?: boolean }[]>([]);
  const [notifLoading, setNotifLoading] = useState(true);
  const [notifError, setNotifError] = useState<string | null>(null);

  // -- Global cache for childData, local state for notifications only --
  useFocusEffect(
    useCallback(() => {
      if (isDataStale('childData')) {
        fetchChildData();
      }
      loadNotifications();
    }, [isDataStale, fetchChildData])
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
      {(notifLoading || notifError || notifications.filter(n => !n.isRead).length > 0) && (
        <View style={[styles.notificationSection, {
          backgroundColor: themeColors.surface,
          borderColor: themeColors.border,
          borderWidth: 1,
          shadowColor: themeColors.border
        }]}>
          <Text style={[styles.notificationTitle, { color: themeColors.primary }]}>Notifications</Text>
          {notifLoading ? (
            <Text style={[styles.notificationText, { color: themeColors.textSecondary }]}>Loading...</Text>
          ) : notifError ? (
            <Text style={[styles.notificationText, { color: themeColors.textSecondary }]}>{notifError}</Text>
          ) : (
            notifications.filter(n => !n.isRead).slice(0, 4).map((notif, idx) => (
              <TouchableOpacity
                key={notif._id || idx}
                style={[styles.notificationCard, {
                  backgroundColor: themeColors.card,
                  borderColor: themeColors.border,
                  borderWidth: 1,
                  shadowColor: themeColors.border
                }]}
                onPress={async () => {
                  // Mark as read (backend), reload list and then navigate
                  try {
                    const currentUserStr = await AsyncStorage.getItem('user');
                    const token = await getAuthToken();
                    if (notif._id && token && currentUserStr) {
                      await markNotificationRead(notif._id, token);
                      await loadNotifications();
                    }
                  } catch {}
                  router.push('/(parents-tabs)/requests');
                }}
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
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: 520, marginBottom: 22, marginTop: 6 }}>
        <Text style={[styles.title, { color: themeColors.primary }]}>Family Finance Hub</Text>
        <TouchableOpacity
          style={{
            backgroundColor: themeColors.accent,
            borderRadius: 16,
            paddingHorizontal: 8,
            paddingVertical: 4,
            elevation: 2,
            minWidth: 32,
            alignItems: 'center',
          }}
          onPress={() => setHelpModalVisible(true)}
        >
          <Text style={{ color: themeColors.card, fontWeight: 'bold', fontSize: 14 }}>❓ Help</Text>
        </TouchableOpacity>
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

      {/* Interest Payout Info */}
      {interestRule && childData && (
        <View style={[styles.sectionCard, { backgroundColor: themeColors.surface, borderColor: themeColors.success, borderWidth: 1, shadowColor: themeColors.border }]}>
          <Text style={[styles.sectionTitle, { color: themeColors.success }]}>💸 Next Interest Payout</Text>
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
            <View style={[styles.jar, { backgroundColor: '#dfffec' }]}>
              <Text style={[styles.jarLabel, { color: '#225d32' }]}>Pocket Money</Text>
              <Text style={[styles.jarValue, { color: '#225d32' }]}>{childData.currentPoints}</Text>
            </View>
            <View style={[styles.jar, { backgroundColor: '#c9f8ec' }]}>
              <Text style={[styles.jarLabel, { color: '#1e624b' }]}>Savings Pot</Text>
              <Text style={[styles.jarValue, { color: '#1e624b' }]}>{childData.savePoints}</Text>
            </View>
            <View style={[styles.jar, { backgroundColor: '#f9e9ac' }]}>
              <Text style={[styles.jarLabel, { color: '#5d5433' }]}>Spending Pot</Text>
              <Text style={[styles.jarValue, { color: '#5d5433' }]}>{childData.spendPoints}</Text>
            </View>
            <View style={[styles.jar, { backgroundColor: '#ffe0ee' }]}>
              <Text style={[styles.jarLabel, { color: '#5e2c4f' }]}>Help Others Pot</Text>
              <Text style={[styles.jarValue, { color: '#5e2c4f' }]}>{childData.donatePoints}</Text>
            </View>
            <View style={[styles.jar, { backgroundColor: '#bffbe3' }]}>
              <Text style={[styles.jarLabel, { color: '#035e44' }]}>Grow Money Pot</Text>
              <Text style={[styles.jarValue, { color: '#035e44' }]}>{childData.investPoints}</Text>
            </View>
          </View>
        ) : (
          <View>
            <Text style={styles.placeholder}>
              No child is linked to your account. Add a child to manage their pots.
            </Text>
            <TouchableOpacity
              style={[styles.quickBtn, { backgroundColor: themeColors.success, alignSelf: 'center', marginTop: 16, minWidth: 200 }]}
              onPress={() => router.push('/addChild')}
            >
              <Text style={[styles.quickBtnText, { color: themeColors.card }]}>
                👶 Add Your Child
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <View style={[styles.sectionCard, { backgroundColor: themeColors.card, shadowColor: themeColors.border }]}>
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>What Can I Do?</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.quickBtn, { backgroundColor: themeColors.primary }]}
            onPress={() => router.push('/(parents-tabs)/requests')}
          >
            <Text style={[styles.quickBtnText, { color: themeColors.card }]}>Check Requests</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickBtn, { backgroundColor: themeColors.accent }]}
            onPress={() => router.push('/(parents-tabs)/points')}
          >
            <Text style={[styles.quickBtnText, { color: themeColors.card }]}>Give Pocket Money</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickBtn, { backgroundColor: themeColors.secondary }]}
            onPress={() => router.push('/(parents-tabs)/goals')}
          >
            <Text style={[styles.quickBtnText, { color: themeColors.card }]}>Set Child Goals</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickBtn, { backgroundColor: themeColors.warning }]}
            onPress={() => router.push('/(parents-tabs)/chores')}
          >
            <Text style={[styles.quickBtnText, { color: themeColors.card }]}>Add Home Tasks</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickBtn, { backgroundColor: themeColors.accent }]}
            onPress={() => router.push('/(parents-tabs)/rewards')}
          >
            <Text style={[styles.quickBtnText, { color: themeColors.card }]}>Manage Rewards</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickBtn, { backgroundColor: themeColors.primary }]}
            onPress={() => router.push('/(parents-tabs)/analytics')}
          >
            <Text style={[styles.quickBtnText, { color: themeColors.card }]}>View Progress</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickBtn, { backgroundColor: themeColors.secondary }]}
            onPress={() => router.push('/(parents-tabs)/transaction-history')}
          >
            <Text style={[styles.quickBtnText, { color: themeColors.card }]}>See History</Text>
          </TouchableOpacity>
        </View>
      </View>

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

const styles = StyleSheet.create({
  notificationSection: {
    borderRadius: 14,
    padding: 12,
    marginBottom: 18,
    minWidth: 320,
    width: '97%',
    maxWidth: 520,
    elevation: 2,
  },
  notificationTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  notificationCard: {
    padding: 8,
    marginBottom: 3,
    borderRadius: 7,
    elevation: 1,
  },
  notificationText: {
    fontSize: 15,
  },
  notificationUnread: {
    fontWeight: 'bold',
  },
  notificationRead: {
    opacity: 0.5,
  },
  scroll: { backgroundColor: '#f7fafd' },
  container: { alignItems: 'center', paddingVertical: 12, paddingHorizontal: 6 },
  navRow: { flexDirection: 'row', alignSelf: 'center', marginBottom: 12 },
  navBtn: { backgroundColor: '#78d2eb', borderRadius: 8, marginHorizontal: 4, paddingVertical: 8, paddingHorizontal: 16 },
  navBtnText: { color: '#155674', fontWeight: 'bold', fontSize: 16 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 22, marginTop: 6, color: '#194476' },
  sectionCard: { backgroundColor: '#fff', borderRadius: 16, marginBottom: 16, padding: 16, minWidth: 320, width: '97%', maxWidth: 520, elevation: 3, shadowColor: '#aaa' },
  sectionTitle: { fontSize: 20, fontWeight: '600', marginBottom: 8, color: '#226' },
  placeholder: { color: '#999', fontStyle: 'italic', fontSize: 15, marginBottom: 1, marginTop: 2, minHeight: 26 },
  quickActions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  quickBtn: { backgroundColor: '#d7b5fb', padding: 12, borderRadius: 8, margin: 4, minWidth: 140, alignItems: 'center' },
  quickBtnText: { fontWeight: '700', color: '#50317a', fontSize: 15 },
  jarsContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginTop: 10 },
  jar: { borderRadius: 14, padding: 18, minWidth: 80, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2 },
  jarLabel: { fontWeight: 'bold', fontSize: 14, marginBottom: 4 },
  jarValue: { fontSize: 18, fontWeight: 'bold' },
});
