import HelpModal from '@/components/HelpModal';
import { ActionSuggestions } from '@/components/ui/ActionSuggestions';
import { EnhancedJar } from '@/components/ui/EnhancedJar';
import { InterestMotivator } from '@/components/ui/InterestMotivator';
import SkeletonJar from '@/components/ui/SkeletonJar';
import { API_URL } from '@/utils/config';
import { useCurrency } from '@/utils/currencyContext';
import { useDataCache } from '@/utils/dataCacheContext';
import { getAuthToken } from '@/utils/secureStorage';
import { useTheme } from '@/utils/themeContext';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Image, Modal, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

/**
 * Calculate a readable next interest payout date string.
 * Placeholder: For demo, next payout is exactly 7 or 30 days away if no backend timestamp, else uses child's lastPayoutDate if available.
 */
import type { InterestRuleType } from "@/utils/currencyContext";

// Helper function to determine jar status based on points
const getJarStatus = (points: number, jarType: 'pocket' | 'savings' | 'spending' | 'donate' | 'invest'): 'excellent' | 'good' | 'needs_attention' | 'low' => {
  if (points === 0) {
    return 'low';
  }

  switch (jarType) {
    case 'pocket':
    case 'savings':
    case 'donate':
    case 'invest':
      // Standard pots: 1-100 = Refill Needed, 101-2000 = Good Start, 2001-5000 = Good Balance, 5001-10000 = Great Balance, >10000 = Excellent
      if (points >= 10001) return 'excellent';
      if (points >= 5001) return 'excellent'; // Great Balance maps to excellent status
      if (points >= 2001) return 'good'; // Good Balance maps to good status
      if (points >= 101) return 'good'; // Good Start maps to good status
      return 'needs_attention'; // Refill Needed maps to needs_attention

    case 'spending':
      // Spending pot: 1-20 = Refill Needed, 21-250 = Good Start, 251-1000 = Good Balance, 1001-3000 = Great Balance, >3000 = Excellent
      if (points > 3000) return 'excellent';
      if (points >= 1001) return 'excellent'; // Great Balance maps to excellent
      if (points >= 251) return 'good'; // Good Balance maps to good
      if (points >= 21) return 'good'; // Good Start maps to good
      return 'needs_attention'; // Refill Needed maps to needs_attention

    default:
      return 'good';
  }
};

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
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [lastAllowanceDate, setLastAllowanceDate] = useState<Date | undefined>(undefined);
  const [interestSummary, setInterestSummary] = useState<{
    totalEarned: number;
    currentStreak: number;
    lastPayoutDate?: Date;
    nextPayoutDate?: Date;
    transactionsCount: number;
  } | null>(null);
  const [interestHistory, setInterestHistory] = useState<any[]>([]);



  // Fetch interest data for the child
  const fetchInterestData = useCallback(async () => {
    if (!childData?._id) return;

    try {
      const token = await getAuthToken();
      if (!token) return;

      // Fetch interest summary
      const summaryResponse = await fetch(`${API_URL}/interest/summary/${childData._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json();
        setInterestSummary({
          totalEarned: summaryData.totalEarned || 0,
          currentStreak: summaryData.currentStreak || 0,
          lastPayoutDate: summaryData.lastPayoutDate ? new Date(summaryData.lastPayoutDate) : undefined,
          nextPayoutDate: summaryData.nextPayoutDate ? new Date(summaryData.nextPayoutDate) : undefined,
          transactionsCount: summaryData.transactionsCount || 0,
        });
      }

      // Fetch recent interest history
      const historyResponse = await fetch(`${API_URL}/interest/history/${childData._id}?limit=5`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        setInterestHistory(historyData.transactions || []);
      }
    } catch (error) {
      console.error('Error fetching interest data:', error);
      // Set default values if API fails
      setInterestSummary({
        totalEarned: 0,
        currentStreak: 0,
        transactionsCount: 0,
      });
      setInterestHistory([]);
    }
  }, [childData?._id]);

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
      fetchInterestData(); // Also refresh interest data
    } else if (childData?._id) {
      // Initial load of interest data
      fetchInterestData();
    }
  }, [refresh, fetchChildData, fetchInterestData, childData?._id]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchChildData(true).finally(() => setRefreshing(false));
  }, [fetchChildData]);



  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >


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
      <View style={[styles.sectionCard, {
        backgroundColor: themeColors.card,
        shadowColor: themeColors.border,
        borderWidth: 2,
        borderColor: themeColors.primary,
        borderStyle: 'dashed'
      }]}>
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

      {/* Enhanced Interest Section with Gamification */}
      {(() => {
        console.log('InterestMotivator Debug:', {
          interestRule: interestRule ? 'exists' : 'null',
          childData: childData ? 'exists' : 'null',
          savePoints: childData?.savePoints,
          rate: interestRule?.rate,
          frequency: interestRule?.frequency
        });

        // Only show interest section if interest is configured and rate > 0
        const effectiveInterestRule = interestRule;
        const shouldShowInterest = effectiveInterestRule && effectiveInterestRule.rate > 0 && childData && childData.savePoints > 0;

        return shouldShowInterest ? (
          <InterestMotivator
            nextPayout={{
              amount: Math.max(1, Math.round(childData.savePoints * (effectiveInterestRule.rate / 100))), // Calculate next payout amount
              days: effectiveInterestRule.frequency === 'monthly' ? 30 : 7
            }}
            totalEarned={interestSummary?.totalEarned || 0}
            streak={interestSummary?.currentStreak || 0}
            recentPayouts={interestHistory}
            themeColors={themeColors}
            onExpand={() => setExpandedSections(prev => ({ ...prev, interest: !prev.interest }))}
            isExpanded={expandedSections.interest}
          />
        ) : null;
      })()}

      {/* Child Jars Panel */}
      <View style={[styles.sectionCard, {
        backgroundColor: themeColors.surface,
        shadowColor: themeColors.border,
        borderWidth: 3,
        borderColor: themeColors.success,
        borderRadius: 20
      }]}>
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
            <EnhancedJar
              label="Pocket Money"
              value={childData.currentPoints}
              totalPoints={childData.currentPoints + childData.savePoints + childData.spendPoints + childData.donatePoints + childData.investPoints}
              themeColors={themeColors}
              status={getJarStatus(childData.currentPoints, 'pocket')}
            />
            <EnhancedJar
              label="Savings Pot"
              value={childData.savePoints}
              totalPoints={childData.currentPoints + childData.savePoints + childData.spendPoints + childData.donatePoints + childData.investPoints}
              themeColors={themeColors}
              status={getJarStatus(childData.savePoints, 'savings')}
            />
            <EnhancedJar
              label="Spending Pot"
              value={childData.spendPoints}
              totalPoints={childData.currentPoints + childData.savePoints + childData.spendPoints + childData.donatePoints + childData.investPoints}
              themeColors={themeColors}
              status={getJarStatus(childData.spendPoints, 'spending')}
            />
            <EnhancedJar
              label="Help Others Pot"
              value={childData.donatePoints}
              totalPoints={childData.currentPoints + childData.savePoints + childData.spendPoints + childData.donatePoints + childData.investPoints}
              themeColors={themeColors}
              status={getJarStatus(childData.donatePoints, 'donate')}
            />
            <EnhancedJar
              label="Grow Money Pot"
              value={childData.investPoints}
              totalPoints={childData.currentPoints + childData.savePoints + childData.spendPoints + childData.donatePoints + childData.investPoints}
              themeColors={themeColors}
              status={getJarStatus(childData.investPoints, 'invest')}
            />
          </View>
        ) : (
          <EmptyState styles={styles} />
        )}
      </View>

      {/* Quick Actions - Grouped by Priority */}
      <View style={[styles.actionCard, {
        backgroundColor: themeColors.secondary + '15',
        shadowColor: themeColors.border,
        borderWidth: 4,
        borderColor: themeColors.warning,
        borderRadius: 18,
        borderStyle: 'solid'
      }]}>
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Quick Actions</Text>

        {/* Smart Action Suggestions */}
        <ActionSuggestions
          pendingRequests={pendingRequestsCount}
          childData={childData}
          lastAllowanceDate={lastAllowanceDate}
          recentGoalActivity={childData?.savePoints > 0}
          themeColors={themeColors}
          onNavigateToRequests={() => router.push('/(parents-tabs)/requests')}
          onNavigateToPoints={() => router.push('/(parents-tabs)/points')}
          onNavigateToGoals={() => router.push('/(parents-tabs)/goals')}
          onNavigateToChores={() => router.push('/(parents-tabs)/chores')}
        />

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
