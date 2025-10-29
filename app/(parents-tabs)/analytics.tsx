import BackButton from '@/components/BackButton';
import HelpModal from '@/components/HelpModal';
import { SpendingInsights } from '@/components/SpendingInsights';
import { useAnalytics } from '@/hooks/useAnalytics';
import { fetchFamilyChildren } from '@/utils/api';
import { getAuthToken, getUser } from '@/utils/secureStorage';
import { useTheme } from '@/utils/themeContext';

import React, { useState } from 'react';
import { ActivityIndicator, Animated, Easing, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import Svg, { Circle } from 'react-native-svg';

const createStyles = (themeColors: any) => StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: 12, paddingHorizontal: 6 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 22, marginTop: 6, color: themeColors.primary },
  sectionCard: { borderRadius: 16, marginBottom: 16, padding: 16, minWidth: 320, width: '97%', maxWidth: 520, elevation: 3, backgroundColor: themeColors.card, shadowColor: themeColors.border },
  sectionTitle: { fontSize: 20, fontWeight: '600', marginBottom: 12, color: themeColors.text },
  statusMessage: { fontSize: 15, fontWeight: '600', marginTop: 8, marginBottom: 16, textAlign: 'center', padding: 10, borderRadius: 8, width: '97%', maxWidth: 520, color: themeColors.success },
  placeholder: { color: themeColors.textSecondary, fontStyle: 'italic', fontSize: 15, marginBottom: 8 },
  childSelector: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 8 },
  childButton: {
    backgroundColor: themeColors.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    margin: 4,
    minWidth: 80,
    maxWidth: 180,
    alignItems: 'center',
    overflow: 'hidden',
  },
  childButtonSelected: { backgroundColor: themeColors.primary },
  childButtonText: { color: themeColors.text, fontSize: 14, fontWeight: '600' },
  childButtonTextSelected: { color: themeColors.card },
  // Child selector styles for enhanced design
  countBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    color: themeColors.card,
    fontSize: 14,
    fontWeight: 'bold',
  },
  childrenScroll: {
    marginTop: 8,
  },
  childrenScrollContent: {
    paddingHorizontal: 4,
  },
  childCard: {
    width: 90,
    height: 90,
    borderRadius: 16,
    marginHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    elevation: 2,
    shadowColor: themeColors.shadow || '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  childAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: themeColors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  childAvatarText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  childName: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  selectedIndicator: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: themeColors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCheckmark: {
    color: themeColors.card,
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default function ParentsAnalyticsScreen() {
  const { themeColors } = useTheme();
  const styles = createStyles(themeColors);
  const [helpModalVisible, setHelpModalVisible] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [children, setChildren] = useState<{ id?: string; _id?: string; name: string }[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('');

  const { analyticsData, loading, error, refetch, exportData, clearCache } = useAnalytics();

  // Load children and initialize analytics
  React.useEffect(() => {
    async function loadChildren() {
      try {
        const token = await getAuthToken();
        const parentProfile = await getUser();
        if (!token || !parentProfile) {
          setFeedback('Please log in to view analytics.');
          return;
        }
        const familyId = parentProfile.familyId;
        if (!familyId) {
          setFeedback('Family information not available. Please contact support.');
          return;
        }

        const data = await fetchFamilyChildren(familyId, token);
        setChildren(data);
        if (data.length > 0) {
          setSelectedChildId(data[0]._id || data[0].id || "");
        }
      } catch (err) {
        console.error('Failed to load children:', err);
        setFeedback('Failed to load family data. Please try refreshing.');
      }
    }

    loadChildren();
    // Don't clear cache immediately - let the analytics hook handle caching
  }, []); // Empty dependency array to run only once on mount

  const handleExport = () => {
    const csvData = exportData();
    if (csvData) {
      setFeedback('Analytics data exported successfully!');
      setTimeout(() => setFeedback(''), 3000);
    } else {
      setFeedback('No data available to export');
      setTimeout(() => setFeedback(''), 3000);
    }
  };

  const handleRefresh = async () => {
    clearCache(); // Clear cached data first
    await refetch(); // This will now bypass cache due to forceRefresh parameter
  };



  return (
    <ScrollView style={{ backgroundColor: themeColors.background }} contentContainerStyle={styles.container}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: 520, marginBottom: 22, marginTop: 6 }}>
        <BackButton label="Back to Home" to="/(parents-tabs)" />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity
            style={{
              backgroundColor: themeColors.secondary,
              borderRadius: 20,
              paddingHorizontal: 8,
              paddingVertical: 6,
              elevation: 2,
              minWidth: 32,
              alignItems: 'center',
            }}
            onPress={handleRefresh}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel={loading ? "Refreshing analytics data" : "Refresh analytics data"}
            accessibilityHint="Reload the latest analytics and progress data"
            accessibilityState={{ disabled: loading }}
          >
            <Text style={{ color: themeColors.card, fontWeight: 'bold', fontSize: 14 }}>
              {loading ? '⏳' : '↻'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              backgroundColor: themeColors.accent,
              borderRadius: 20,
              paddingHorizontal: 12,
              paddingVertical: 6,
              elevation: 2,
            }}
            onPress={() => setHelpModalVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Help and information"
            accessibilityHint="Open help guide for analytics dashboard"
          >
            <Text style={{ color: themeColors.card, fontWeight: 'bold', fontSize: 14 }}>Help</Text>
          </TouchableOpacity>
        </View>
      </View>


      <Text style={styles.title}>Child's Progress Report</Text>

      {/* Enhanced Child Selector */}
      {children.length > 1 && (
        <View style={[styles.sectionCard, {
          backgroundColor: themeColors.card,
          shadowColor: themeColors.border,
          borderWidth: 3,
          borderColor: themeColors.primary,
          borderRadius: 16,
          marginBottom: 12
        }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Text style={[styles.sectionTitle, { color: themeColors.text, fontSize: 18, marginBottom: 0 }]}>
              👨‍👩‍👦 Select Child to View Analytics
            </Text>
            <View style={[styles.countBadge, {
              position: 'relative',
              marginLeft: 8,
              backgroundColor: themeColors.success
            }]}>
              <Text style={styles.countText}>{children.length}</Text>
            </View>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.childrenScroll}
            contentContainerStyle={styles.childrenScrollContent}
          >
            {children.map((child) => (
              <TouchableOpacity
                key={child._id || child.id}
                style={[
                  styles.childCard,
                  {
                    backgroundColor: selectedChildId === (child._id || child.id) ? themeColors.primary : themeColors.card,
                    borderColor: selectedChildId === (child._id || child.id) ? themeColors.primary : themeColors.border,
                  }
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Select ${child.name} - ${selectedChildId === (child._id || child.id) ? 'currently selected' : 'tap to select'}`}
                accessibilityHint="Switch to view this child's analytics and progress"
                onPress={() => setSelectedChildId(child._id || child.id || "")}
              >
                <View style={styles.childAvatar}>
                  <Text style={[styles.childAvatarText, {
                    color: selectedChildId === (child._id || child.id) ? themeColors.card : themeColors.primary
                  }]}>
                    {child.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text style={[styles.childName, {
                  color: selectedChildId === (child._id || child.id) ? themeColors.card : themeColors.text
                }]}>
                  {child.name}
                </Text>
                {selectedChildId === (child._id || child.id) && (
                  <View style={styles.selectedIndicator}>
                    <Text style={styles.selectedCheckmark}>👑</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
          <Text style={{ fontSize: 13, color: themeColors.textSecondary, marginTop: 8, textAlign: 'center' }}>
            Tap any child to view their individual analytics and progress
          </Text>
        </View>
      )}

      {feedback ? <Text style={styles.statusMessage}>{feedback}</Text> : null}

      {/* Simple Analytics Overview */}
      <AnalyticsOverview analyticsData={analyticsData} analyticsLoading={loading} selectedChildId={selectedChildId} />

      {/* Separator */}
      <View style={{ height: 2, backgroundColor: themeColors.text, opacity: 0.3, marginVertical: 20, width: '90%', alignSelf: 'center' }} />

      <Text style={[styles.title, { fontSize: 24 }]}>Family AI Financial Insights (All Children)</Text>

      {/* Family-Wide AI Insights */}
      <View style={[styles.sectionCard]}>
        <SpendingInsights
          onRefresh={handleRefresh}
        />
      </View>

      {/* Error Display - Only show for actual data loading errors, not authentication issues */}
      {error && !error.includes('Family ID not available') && (
        <View style={styles.sectionCard}>
          <Text style={{ color: themeColors.error, fontSize: 16 }}>
            ⚠️ Error loading analytics: {error}
          </Text>
          <TouchableOpacity
            style={{ backgroundColor: themeColors.error, padding: 10, borderRadius: 6, marginTop: 10 }}
            onPress={handleRefresh}
            accessibilityRole="button"
            accessibilityLabel="Retry loading analytics"
            accessibilityHint="Attempt to reload analytics data again"
          >
            <Text style={{ color: themeColors.card, textAlign: 'center' }}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Help Modal */}
      <HelpModal
        visible={helpModalVisible}
        onClose={() => setHelpModalVisible(false)}
        title="Advanced Analytics Dashboard - Help"
        tabs={[
          {
            title: "AI-Powered Financial Insights",
            content: [
              {
                type: "text",
                text: "Our advanced analytics use AI to provide personalized financial insights for your family!",
                icon: "🤖"
              },
              {
                type: "bullet",
                text: "Risk Assessment - Get a financial health score based on spending patterns"
              },
              {
                type: "bullet",
                text: "Predictive Analytics - See spending forecasts and savings recommendations"
              },
              {
                type: "bullet",
                text: "Personalized Tips - Receive tailored advice based on your family's data"
              },
              {
                type: "bullet",
                text: "Trend Analysis - Understand spending patterns and habits over time"
              },
              {
                type: "highlight",
                text: "AI insights help you make data-driven decisions for your child's financial education!",
                icon: "💡"
              }
            ]
          },
          {
            title: "Understanding the Charts",
            content: [
              {
                type: "text",
                text: "Multiple visualization types help you understand different aspects of financial behavior:",
                icon: "📈"
              },
              {
                type: "bullet",
                text: "Line Charts - Track spending trends and patterns over time"
              },
              {
                type: "bullet",
                text: "Pie Charts - See how money is distributed across different pots"
              },
              {
                type: "bullet",
                text: "Bar Charts - Compare completion rates for different chores"
              },
              {
                type: "bullet",
                text: "Progress Charts - Monitor goal completion status"
              },
              {
                type: "highlight",
                text: "Each chart tells a different story about your child's financial journey!",
                icon: "📊"
              }
            ]
          },
          {
            title: "Data Export & Reporting",
            content: [
              {
                type: "text",
                text: "Download comprehensive reports for record-keeping or sharing:",
                icon: "📄"
              },
              {
                type: "bullet",
                text: "CSV Export - Download all analytics data in spreadsheet format"
              },
              {
                type: "bullet",
                text: "Complete Dataset - Includes transactions, goals, chores, and predictions"
              },
              {
                type: "bullet",
                text: "Time Range Filtering - Export data for specific periods"
              },
              {
                type: "bullet",
                text: "Family-wide Reports - See data across all family members"
              },
              {
                type: "highlight",
                text: "Keep detailed records of your child's financial learning progress!",
                icon: "💾"
              }
            ]
          },
          {
            title: "Privacy & Security",
            content: [
              {
                type: "text",
                text: "Your family's financial data is protected with enterprise-grade security:",
                icon: "🔒"
              },
              {
                type: "bullet",
                text: "End-to-end encryption for all data transmission"
              },
              {
                type: "bullet",
                text: "Secure token-based authentication"
              },
              {
                type: "bullet",
                text: "Family-level data isolation"
              },
              {
                type: "bullet",
                text: "No data shared with third parties"
              },
              {
                type: "highlight",
                text: "Your family's financial information stays private and secure!",
                icon: "🛡️"
              }
            ]
          },
          {
            title: "Best Practices for Advanced Analytics",
            content: [
              {
                type: "text",
                text: "Make the most of your advanced analytics dashboard:",
                icon: "🎯"
              },
              {
                type: "bullet",
                text: "Review weekly to identify trends and patterns"
              },
              {
                type: "bullet",
                text: "Use AI recommendations to guide financial discussions"
              },
              {
                type: "bullet",
                text: "Export quarterly reports for progress tracking"
              },
              {
                type: "bullet",
                text: "Compare data across different time periods"
              },
              {
                type: "bullet",
                text: "Set up alerts for unusual spending patterns"
              },
              {
                type: "highlight",
                text: "Consistent monitoring leads to better financial habits and outcomes!",
                icon: "📈"
              }
            ]
          }
        ]}
      />
    </ScrollView>
  );
}

const AnalyticsOverview = ({ analyticsData, analyticsLoading, selectedChildId }: { analyticsData: any, analyticsLoading: boolean, selectedChildId: string }) => {
  const { themeColors } = useTheme();
  const styles = createStyles(themeColors);

  const [processedData, setProcessedData] = React.useState<any>(null);
  const [processing, setProcessing] = React.useState(false);

  // Process child-specific analytics data when analyticsData or selectedChildId changes
  React.useEffect(() => {
    const processChildData = async () => {
      if (!analyticsData || !selectedChildId) {
        setProcessedData(null);
        return;
      }

      setProcessing(true);

      try {
        // Build summary from processed analytics data
        console.log('AnalyticsOverview - analyticsData:', analyticsData);
        const familyMembers = analyticsData.familyMembers || [];
        console.log('AnalyticsOverview - familyMembers:', familyMembers);

        // Find the selected child for child-specific analytics
        // familyMembers from analytics API now include '_id' field
        // selectedChildId from fetchFamilyChildren is the MongoDB _id string
        // Match by _id first, then fallback to other logic
        console.log('AnalyticsOverview - selectedChildId from state:', selectedChildId);
        console.log('AnalyticsOverview - familyMembers available:', familyMembers.map(m => ({ _id: m._id, id: m.id, name: m.name, role: m.role })));

        const selectedChild = familyMembers.find((m: any) => m._id === selectedChildId) ||
                             familyMembers.find((m: any) => m.id === selectedChildId) ||
                             familyMembers.find((m: any) => m.role === 'child') ||
                             familyMembers.find((m: any) => m.role !== 'parent');

        console.log('AnalyticsOverview - selectedChildId:', selectedChildId);
        console.log('AnalyticsOverview - found selected child:', selectedChild);
        console.log('AnalyticsOverview - selected child name:', selectedChild ? selectedChild.name : 'No child found');
        console.log('AnalyticsOverview - selected child _id:', selectedChild ? selectedChild._id : 'No _id');
        console.log('AnalyticsOverview - selected child id:', selectedChild ? selectedChild.id : 'No id');

        // Filter data to be child-specific instead of family-wide
        // Use selectedChildId (MongoDB _id string) for filtering transactions, chores, goals, rewards
        // Use selectedChild.id (custom id) for filtering real allowances
        const mongoChildId = selectedChildId; // MongoDB _id string
        const customChildId = selectedChild ? selectedChild.id : selectedChildId; // custom id for allowances

        console.log('AnalyticsOverview - CHILD FILTERING DEBUG:');
        console.log('AnalyticsOverview - mongoChildId (selectedChildId):', mongoChildId);
        console.log('AnalyticsOverview - selectedChild object:', selectedChild);

        // Debug transaction filtering
        console.log('AnalyticsOverview - DEBUG filtering transactions for mongoChildId:', mongoChildId);
        console.log('AnalyticsOverview - DEBUG analyticsData.transactions length:', analyticsData.transactions?.length);
        console.log('AnalyticsOverview - DEBUG analyticsData.chores length:', analyticsData.chores?.length);
        console.log('AnalyticsOverview - DEBUG analyticsData.goals length:', analyticsData.goals?.length);

        if (analyticsData.transactions?.length > 0) {
          console.log('AnalyticsOverview - DEBUG first transaction user field:', analyticsData.transactions[0].user, 'type:', typeof analyticsData.transactions[0].user);
          console.log('AnalyticsOverview - DEBUG comparison test:', analyticsData.transactions[0].user === mongoChildId);
          // Try converting ObjectId to string if needed
          const userAsString = typeof analyticsData.transactions[0].user === 'object' ? analyticsData.transactions[0].user.toString() : analyticsData.transactions[0].user;
          console.log('AnalyticsOverview - DEBUG converted user field:', userAsString, 'comparison:', userAsString === mongoChildId);
        }

        if (analyticsData.chores?.length > 0) {
          console.log('AnalyticsOverview - DEBUG first chore user field:', analyticsData.chores[0].user, 'type:', typeof analyticsData.chores[0].user);
          const choreUserAsString = typeof analyticsData.chores[0].user === 'object' ? analyticsData.chores[0].user.toString() : analyticsData.chores[0].user;
          console.log('AnalyticsOverview - DEBUG chore user converted:', choreUserAsString, 'comparison:', choreUserAsString === mongoChildId);
        }

        if (analyticsData.goals?.length > 0) {
          console.log('AnalyticsOverview - DEBUG first goal user field:', analyticsData.goals[0].user, 'type:', typeof analyticsData.goals[0].user);
          const goalUserAsString = typeof analyticsData.goals[0].user === 'object' ? analyticsData.goals[0].user.toString() : analyticsData.goals[0].user;
          console.log('AnalyticsOverview - DEBUG goal user converted:', goalUserAsString, 'comparison:', goalUserAsString === mongoChildId);
        }

        // Try multiple filtering approaches
        const childTransactions = analyticsData.transactions?.filter((t: any) => {
          const transactionUser = typeof t.user === 'object' ? t.user.toString() : t.user;
          const matches = transactionUser === mongoChildId;
          console.log('AnalyticsOverview - DEBUG transaction filter:', { transactionUser, mongoChildId, matches });
          return matches;
        }) || [];
        const childChores = analyticsData.chores?.filter((c: any) => {
          const choreUser = typeof c.user === 'object' ? c.user.toString() : c.user;
          const matches = choreUser === mongoChildId;
          console.log('AnalyticsOverview - DEBUG chore filter:', { choreUser, mongoChildId, matches });
          return matches;
        }) || [];
        const childGoals = analyticsData.goals?.filter((g: any) => {
          const goalUser = typeof g.user === 'object' ? g.user.toString() : g.user;
          const matches = goalUser === mongoChildId;
          console.log('AnalyticsOverview - DEBUG goal filter:', {
            goal: g,
            goalUser,
            goalUserType: typeof g.user,
            mongoChildId,
            mongoChildIdType: typeof mongoChildId,
            matches
          });
          return matches;
        }) || [];

        console.log('AnalyticsOverview - GOALS FILTERING RESULTS:');
        console.log('AnalyticsOverview - analyticsData.goals length:', analyticsData.goals?.length || 0);
        console.log('AnalyticsOverview - childGoals length:', childGoals.length);
        console.log('AnalyticsOverview - childGoals content:', childGoals);
        console.log('AnalyticsOverview - analyticsData.goals sample:', analyticsData.goals?.slice(0, 2));
        console.log('AnalyticsOverview - childGoals sample:', childGoals.slice(0, 2));
        const childRewards = analyticsData.rewards?.filter((r: any) => {
          const rewardUser = typeof r.user === 'object' ? r.user.toString() : r.user;
          return rewardUser === mongoChildId;
        }) || [];
        const childRealAllowances = analyticsData.realAllowances?.filter((ra: any) => ra.childId === customChildId) || [];

        // More detailed debugging
        console.log('AnalyticsOverview - DETAILED FILTERING:');
        console.log('AnalyticsOverview - Total transactions:', analyticsData.transactions?.length || 0);
        console.log('AnalyticsOverview - Total chores:', analyticsData.chores?.length || 0);
        console.log('AnalyticsOverview - Total goals:', analyticsData.goals?.length || 0);
        console.log('AnalyticsOverview - Total rewards:', analyticsData.rewards?.length || 0);

        if (analyticsData.transactions?.length > 0) {
          console.log('AnalyticsOverview - Sample transaction users:', analyticsData.transactions.slice(0, 3).map(t => ({
            user: t.user,
            userType: typeof t.user,
            userString: typeof t.user === 'object' ? t.user.toString() : t.user,
            matches: (typeof t.user === 'object' ? t.user.toString() : t.user) === mongoChildId
          })));
        }
        if (analyticsData.chores?.length > 0) {
          console.log('AnalyticsOverview - Sample chore users:', analyticsData.chores.slice(0, 3).map(c => ({
            user: c.user,
            userType: typeof c.user,
            userString: typeof c.user === 'object' ? c.user.toString() : c.user,
            matches: (typeof c.user === 'object' ? c.user.toString() : c.user) === mongoChildId
          })));
        }

        console.log('AnalyticsOverview - childTransactions count:', childTransactions.length);
        console.log('AnalyticsOverview - childChores count:', childChores.length);
        console.log('AnalyticsOverview - childGoals count:', childGoals.length);
        console.log('AnalyticsOverview - childRewards count:', childRewards.length);
        console.log('AnalyticsOverview - childRealAllowances count:', childRealAllowances.length);

        // Process child-specific analytics data
        const { processSpendingTrends, processChoreCompletion, processGoalProgress, processJarDistribution } = await import('../../utils/analyticsEngine');

        console.log('AnalyticsOverview - ABOUT TO PROCESS GOALS:');
        console.log('AnalyticsOverview - childGoals before processing:', childGoals);
        console.log('AnalyticsOverview - childGoals[0]:', childGoals[0]);
        console.log('AnalyticsOverview - childGoals[1]:', childGoals[1]);

        const spendingTrends = processSpendingTrends(childTransactions);
        const choreCompletion = processChoreCompletion(childChores, childTransactions);
        const goalProgress = processGoalProgress(childGoals);
        const jarDistribution = selectedChild ? processJarDistribution(selectedChild, childTransactions) : [];
        const rewards = childRewards;
        const realAllowances = childRealAllowances;

        // Get current points from jar distribution
        const currentJar = jarDistribution.find((jar: any) => jar.jarName === 'Pocket Money');
        const saveJar = jarDistribution.find((jar: any) => jar.jarName === 'Savings Pot');
        const spendJar = jarDistribution.find((jar: any) => jar.jarName === 'Spending Pot');
        const donateJar = jarDistribution.find((jar: any) => jar.jarName === 'Help Others Pot');
        const investJar = jarDistribution.find((jar: any) => jar.jarName === 'Grow Money Pot');

        console.log('AnalyticsOverview - GOAL PROGRESS RESULTS:');
        console.log('AnalyticsOverview - goalProgress array:', goalProgress);
        console.log('AnalyticsOverview - goalProgress length:', goalProgress.length);
        goalProgress.forEach((g, index) => {
          console.log(`AnalyticsOverview - goal ${index}:`, {
            name: g.goalName,
            progress: g.progress,
            projectedCompletion: g.projectedCompletion,
            isCompleted: g.progress === 100 || g.projectedCompletion === 'Completed'
          });
        });

        const completedGoalsCount = goalProgress.filter((g: any) => g.progress === 100 || g.projectedCompletion === 'Completed').length;
        console.log('AnalyticsOverview - completedGoalsCount:', completedGoalsCount);

        // Output full structure of childChores for the first 5 elements
        const assignedChoreCount = childChores.length;
        console.log('[CHORE COMPLETION DEBUG] Full childChores[0..4] (for field inspection):', childChores.slice(0, 5));
        // Try to handle common nesting (_doc, data, details etc.)
        // FINAL: Count only chores with _doc.completed === true
        const completedTaskCount = childChores.filter(c => c._doc && c._doc.completed === true).length;

        const summaryData = {
          totalPoints: (currentJar?.currentBalance || 0) + (saveJar?.currentBalance || 0) + (spendJar?.currentBalance || 0) + (donateJar?.currentBalance || 0) + (investJar?.currentBalance || 0),
          chores: choreCompletion.length,
          completedChores: choreCompletion.filter((chore: any) => (chore.completedCount || 0) > 0).length,
          goals: goalProgress.length,
          completedGoals: completedGoalsCount,
          rewardsCount: rewards.length,
          completedRewards: rewards.filter((r: any) => r.approved === true || r.purchased === true || r.status === 'claimed').length,
          // New: Real task stats
          assignedChoreCount,
          completedTaskCount,
          jars: {
            current: currentJar?.currentBalance || 0,
            save: saveJar?.currentBalance || 0,
            spend: spendJar?.currentBalance || 0,
            donate: donateJar?.currentBalance || 0,
            invest: investJar?.currentBalance || 0
          },
          name: selectedChild ? selectedChild.name : 'Child',
          goalsList: goalProgress.map((g: any) => ({
            name: g.goalName || 'Goal',
            progress: Math.max(0, Math.min(1, (g.progress || 0) / 100)),
          })),
          spendingTrends,
          choreCompletion,
          goalProgress,
          jarDistribution,
          rewards: rewards,
          realAllowances: realAllowances
        };

        setProcessedData(summaryData);
      } catch (error) {
        console.error('Error processing child analytics data:', error);
        setProcessedData(null);
      } finally {
        setProcessing(false);
      }
    };

    processChildData();
  }, [analyticsData, selectedChildId]);

  if (analyticsLoading || processing) {
    return (
      <View style={[styles.sectionCard]}>
        <ActivityIndicator size="small" color={themeColors.text} />
        <Text style={[styles.placeholder, { color: themeColors.textSecondary }]}>Loading analytics...</Text>
      </View>
    );
  }

  if (!analyticsData) {
    return (
      <View style={[styles.sectionCard]}>
        <Text style={[styles.placeholder, { color: themeColors.textSecondary }]}>No analytics data available yet.</Text>
      </View>
    );
  }

  if (!processedData) {
    return (
      <View style={[styles.sectionCard]}>
        <Text style={[styles.placeholder, { color: themeColors.textSecondary }]}>Processing child data...</Text>
      </View>
    );
  }

  const summary = processedData;

  // Extract variables from processedData
  const saveJar = summary?.jarDistribution?.find((jar: any) => jar.jarName === 'Savings Pot');
  const spendJar = summary?.jarDistribution?.find((jar: any) => jar.jarName === 'Spending Pot');
  const jarDistribution = summary?.jarDistribution || [];
  const realAllowances = summary?.realAllowances || [];

  // Theme-aware colors from the theme API (always use themeColors)
  const accentTextColor = themeColors.card;
  const mainTextColor = themeColors.text;
  const secondaryTextColor = themeColors.warning;
  const mutedTextColor = themeColors.textSecondary;
  const cardBackgroundColor = themeColors.card;
  const shadowColor = themeColors.border;

  return (
    <View style={[styles.sectionCard, { backgroundColor: cardBackgroundColor, shadowColor }]}>
      <Text style={styles.sectionTitle}>Child's Progress Overview</Text>
      {summary && (
        <>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-evenly',
            alignItems: 'center',
            marginVertical: 14,
            flexWrap: 'wrap'
          }}>
            {/* Animated circular progress ring for chores */}
            <View style={{ alignItems: "center", marginHorizontal: 10 }}>
              <Text style={{ fontWeight: 'bold', color: mainTextColor, marginBottom: 4 }}>Tasks Completed</Text>
              {/* Show proper progress or fallback if chore fields are all undefined */}
              {summary.assignedChoreCount === 0 ? (
                <Text style={{ color: mutedTextColor }}>No assigned tasks found.</Text>
              ) : (Object.values(summary).includes(undefined) || summary.completedTaskCount === undefined) ? (
                <Text style={{ color: mutedTextColor }}>Incomplete task data.</Text>
              ) : (
                <ProgressRing
                  percent={summary.assignedChoreCount > 0 ? summary.completedTaskCount / summary.assignedChoreCount : 0}
                  amount={`${summary.completedTaskCount}/${summary.assignedChoreCount}`}
                  color={themeColors.success}
                  size={110}
                  strokeWidth={10}
                  labelColor={mainTextColor}
                  ringBackground={cardBackgroundColor}
                />
              )}
            </View>
            {/* Animated circular progress ring for goals */}
            <View style={{ alignItems: "center", marginHorizontal: 10 }}>
              <Text style={{ fontWeight: 'bold', color: mainTextColor, marginBottom: 4 }}>Goals Completed</Text>
              <ProgressRing
                percent={summary.goals > 0 ? summary.completedGoals / summary.goals : 0}
                amount={`${summary.completedGoals}/${summary.goals}`}
                color={themeColors.primary}
                size={110}
                strokeWidth={10}
                labelColor={mainTextColor}
                ringBackground={cardBackgroundColor}
              />
            </View>
            {/* Rewards Progress */}
            <View style={{ alignItems: "center", marginHorizontal: 10 }}>
              <Text style={{ fontWeight: 'bold', color: mainTextColor, marginBottom: 4 }}>Rewards Claimed</Text>
              <ProgressRing
                percent={summary.rewardsCount > 0 ? summary.completedRewards / summary.rewardsCount : 0}
                amount={`${summary.completedRewards}/${summary.rewardsCount}`}
                color={themeColors.accent}
                size={110}
                strokeWidth={10}
                labelColor={mainTextColor}
                ringBackground={cardBackgroundColor}
              />
            </View>
          </View>

          {/* Savings vs Spending Ratio */}
          <Text style={{ fontWeight: "bold", fontSize: 16, marginBottom: 4, marginTop: 10, color: mainTextColor }}>
            Savings vs Spending Ratio
          </Text>
          <View style={{
            padding: 14,
            backgroundColor: cardBackgroundColor,
            borderRadius: 10,
            borderColor: themeColors.primary,
            borderWidth: 1,
            marginBottom: 8,
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {(saveJar?.totalDeposits === 0 && spendJar?.totalDeposits === 0) ? (
              (saveJar?.currentBalance === 0 && spendJar?.currentBalance === 0) ? (
                <Text style={{ color: mutedTextColor, fontSize: 14 }}>
                  No savings or spending data available yet.
                </Text>
              ) : (
                <>
                  <Text style={{ color: mainTextColor, fontWeight: '600', fontSize: 20, marginBottom: 6 }}>
                    {`₹${(saveJar?.currentBalance || 0).toLocaleString()} saved vs ₹${(spendJar?.currentBalance || 0).toLocaleString()} spent`}
                  </Text>
                  <Text style={{ color: secondaryTextColor, fontSize: 15 }}>
                    {(saveJar?.currentBalance || 0) > 0
                      ? `Saved ${((saveJar?.currentBalance || 0) / (spendJar?.currentBalance || 1)).toFixed(2)}x as much as spent`
                      : `Spent ${((spendJar?.currentBalance || 0) / Math.max(1, saveJar?.currentBalance || 0)).toFixed(2)}x as much as saved`}
                  </Text>
                </>
              )
            ) : spendJar?.totalDeposits === 0 ? (
              <Text style={{ color: themeColors.success, fontWeight: 'bold', fontSize: 16 }}>
                All earnings have been saved!<Text style={{ color: mainTextColor, fontWeight: '400', fontSize: 14 }}> (No spending yet)</Text>
              </Text>
            ) : (
              <>
                <Text style={{ color: mainTextColor, fontWeight: '600', fontSize: 20, marginBottom: 6 }}>
                  {`₹${(saveJar?.totalDeposits || 0).toLocaleString()} saved vs ₹${(spendJar?.totalDeposits || 0).toLocaleString()} spent`}
                </Text>
                <Text style={{ color: secondaryTextColor, fontSize: 15 }}>
                  {(saveJar?.totalDeposits || 0) > 0
                    ? `Saved ${((saveJar?.totalDeposits || 0) / (spendJar?.totalDeposits || 1)).toFixed(2)}x as much as spent`
                    : `Spent ${((spendJar?.totalDeposits || 0) / Math.max(1, saveJar?.totalDeposits || 0)).toFixed(2)}x as much as saved`}
                </Text>
              </>
            )}
          </View>
          <Text style={{ color: mutedTextColor, fontSize: 12, marginTop: 8 }}>
            Child: {summary.name}
          </Text>

          {/* Real Allowances Summary */}
          <Text style={{ fontWeight: "bold", fontSize: 16, marginTop: 18, marginBottom: 7, color: mainTextColor }}>
            Real Allowances Summary
          </Text>
          <View style={{
            padding: 14,
            backgroundColor: cardBackgroundColor,
            borderRadius: 10,
            borderColor: themeColors.success,
            borderWidth: 1,
            marginBottom: 8,
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {realAllowances.length === 0 ? (
              <Text style={{ color: mutedTextColor, fontSize: 14 }}>
                No real allowances recorded yet.
              </Text>
            ) : (
              <>
                <Text style={{ color: mainTextColor, fontWeight: '600', fontSize: 18, marginBottom: 6 }}>
                  {realAllowances.length} allowance{realAllowances.length !== 1 ? 's' : ''} recorded
                </Text>
                <Text style={{ color: themeColors.success, fontSize: 16, fontWeight: 'bold' }}>
                  Total: ₹{realAllowances.reduce((sum: number, allowance: any) => sum + allowance.amount, 0).toLocaleString()}
                </Text>
                <Text style={{ color: secondaryTextColor, fontSize: 14, marginTop: 4 }}>
                  Most recent: {new Date(realAllowances[0]?.date).toLocaleDateString()}
                </Text>
              </>
            )}
          </View>

          {/* Pie Chart: Points by Pot */}
          <Text style={{ fontWeight: "bold", fontSize: 16, marginTop: 18, marginBottom: 7, color: mainTextColor }}>
            Points by Pot
          </Text>
          <View style={{ alignItems: "center", justifyContent: "center" }}>
            <PieChartPointsByPot jarDistribution={jarDistribution} themeColors={themeColors} />
          </View>
        </>
      )}
    </View>
  );
};

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function ProgressRing({
  percent,
  amount,
  color,
  size = 100,
  strokeWidth = 13,
  labelColor,
  ringBackground = '#e0e0e0'
}: {
  percent: number,
  amount: string,
  color: string,
  size?: number,
  strokeWidth?: number,
  labelColor?: string,
  ringBackground?: string
}) {
  // Clamp
  percent = Math.max(0, Math.min(1, percent || 0));

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: percent,
      duration: 1000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [percent]);

  const strokeDashoffset = animatedValue.interpolate
    ? animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [circumference, 0],
      })
    : circumference - circumference * percent;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', left: 0, top: 0 }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={ringBackground}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference},${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </Svg>
      <Text style={{ fontWeight: 'bold', fontSize: 18, color: labelColor, marginBottom: 0 }}>
        {amount}
      </Text>
      <Text style={{ fontSize: 13, color: color, fontWeight: '600' }}>
        {Math.round(percent * 100)}%
      </Text>
    </View>
  );
}

function PieChartPointsByPot({
  jarDistribution,
  themeColors
}: {
  jarDistribution: any,
  themeColors: any
}) {
  const screenWidth = 340;

  // Define specific colors for each jar type
  const jarColorMap = {
    'Pocket Money': '#4CAF50',      // Green
    'Savings Pot': '#2196F3',       // Blue
    'Spending Pot': '#FF9800',      // Orange
    'Help Others Pot': '#9C27B0',   // Purple
    'Grow Money Pot': '#FF5722'     // Red
  };

  // Prepare pieData using total deposits to show historical pot allocation
  const pieData = jarDistribution
    .map((jar: any) => ({
      name: jar.jarName,
      population: jar.totalDeposits || 0,
      color: jarColorMap[jar.jarName as keyof typeof jarColorMap] || themeColors.primary,
      key: jar.jarName.toLowerCase().replace(' pot', '').replace(' money', '')
    }))
    .filter((item: any) => item.population > 0);

  if (pieData.length === 0) {
    return (
      <Text style={{ color: themeColors.text, opacity: 0.7, marginTop: 4 }}>
        No funds in pots yet.
      </Text>
    );
  }

  return (
    <View style={{
      width: "100%",
      alignItems: "center",
      justifyContent: "center",
      marginVertical: 10,
      paddingHorizontal: 0,
      flexDirection: "column"
    }}>
      {/* Pie Chart centered */}
      <View style={{
        alignItems: "center",
        justifyContent: "center",
        width: 220,
        height: 210
      }}>
        <PieChart
          data={pieData}
          width={220}
          height={200}
          chartConfig={{
            color: (opacity = 1, index = 0) => pieData[index]?.color || themeColors.primary,
            labelColor: () => themeColors.text,
          } as any}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="40"
          absolute
          hasLegend={false}
        />
      </View>
      {/* Legend below */}
      <View style={{
        marginTop: 16,
        width: "100%",
        maxWidth: 300,
        alignSelf: "center"
      }}>
        {pieData.map((item: { name: string; population: number; color: string; key: string }) => (
          <View
            key={item.key}
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 7,
            }}
          >
            <View
              style={{
                width: 16,
                height: 16,
                backgroundColor: item.color,
                borderRadius: 7,
                marginRight: 8,
                borderWidth: 1,
                borderColor: themeColors.border,
              }}
            />
            <Text style={{ color: themeColors.text, fontWeight: "600", fontSize: 13, minWidth: 62 }}>{item.name}</Text>
            <Text style={{ color: themeColors.text, fontWeight: "700", fontSize: 14, marginLeft: 7 }}>
              ₹{item.population.toLocaleString()}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
