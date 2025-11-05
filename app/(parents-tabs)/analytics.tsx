import BackButton from '@/components/BackButton';
import HelpModal from '@/components/HelpModal';
import { SpendingInsights } from '@/components/SpendingInsights';
import { SEMANTIC_TYPOGRAPHY } from '@/constants/theme';
import { useAnalytics } from '@/hooks/useAnalytics';
import { fetchFamilyChildren } from '@/utils/api';
import { useCenteredMessage } from '@/utils/centeredMessageContext';
import { useDataCache } from '@/utils/dataCacheContext';
import { MOBILE_LAYOUT, MOBILE_STYLES } from '@/utils/mobileLayout';
import { getAuthToken, getUser } from '@/utils/secureStorage';
import { useTheme } from '@/utils/themeContext';

import React, { useState } from 'react';
import { ActivityIndicator, Animated, Easing, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import Svg, { Circle } from 'react-native-svg';

const createStyles = (themeColors: any) => StyleSheet.create({
  container: { ...MOBILE_STYLES.scrollContent, alignItems: 'center' },
  title: { ...SEMANTIC_TYPOGRAPHY["type-display-medium"], marginBottom: MOBILE_LAYOUT.sectionSpacing, marginTop: MOBILE_LAYOUT.itemSpacing, color: themeColors.primary },
  sectionCard: { ...MOBILE_STYLES.card, minWidth: 320, width: '97%', maxWidth: 520, elevation: 3, backgroundColor: themeColors.card, shadowColor: themeColors.border },
  sectionTitle: { ...SEMANTIC_TYPOGRAPHY["type-heading-large"], marginBottom: MOBILE_LAYOUT.itemSpacing, color: themeColors.text },
  statusMessage: { ...SEMANTIC_TYPOGRAPHY["type-body-small"], fontWeight: '600', marginTop: MOBILE_LAYOUT.itemSpacing, marginBottom: MOBILE_LAYOUT.sectionSpacing, textAlign: 'center', padding: MOBILE_LAYOUT.cardPadding, borderRadius: MOBILE_LAYOUT.borderRadius, width: '97%', maxWidth: 520, color: themeColors.success },
  placeholder: { ...SEMANTIC_TYPOGRAPHY["type-body-small"], color: themeColors.textSecondary, fontStyle: 'italic', marginBottom: MOBILE_LAYOUT.itemSpacing },
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
  childButtonText: { ...SEMANTIC_TYPOGRAPHY["type-body-small"], color: themeColors.text },
  childButtonTextSelected: { color: themeColors.card },
  // Child selector styles for enhanced design
  countBadge: {
    width: MOBILE_LAYOUT.minTouchTarget,
    height: MOBILE_LAYOUT.minTouchTarget,
    borderRadius: MOBILE_LAYOUT.minTouchTarget / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    ...SEMANTIC_TYPOGRAPHY["type-body-small"],
    color: themeColors.card,
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
    ...SEMANTIC_TYPOGRAPHY["type-heading-small"],
  },
  childName: {
    ...SEMANTIC_TYPOGRAPHY["type-caption"],
    textAlign: 'center',
  },
  selectedIndicator: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: MOBILE_LAYOUT.minTouchTarget,
    height: MOBILE_LAYOUT.minTouchTarget,
    borderRadius: MOBILE_LAYOUT.minTouchTarget / 2,
    backgroundColor: themeColors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCheckmark: {
    ...SEMANTIC_TYPOGRAPHY["type-body-small"],
    color: themeColors.card,
    fontWeight: 'bold',
  },
});

// Memoized child selector item component for performance
const ChildSelectorItem = React.memo(({
  child,
  isSelected,
  themeColors,
  onPress
}: {
  child: { id?: string; _id?: string; name: string };
  isSelected: boolean;
  themeColors: any;
  onPress: () => void;
}) => (
  <TouchableOpacity
    style={[
      {
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
        backgroundColor: isSelected ? themeColors.primary : themeColors.card,
        borderColor: isSelected ? themeColors.primary : themeColors.border,
      }
    ]}
    accessibilityRole="button"
    accessibilityLabel={`Select ${child.name} - ${isSelected ? 'currently selected' : 'tap to select'}`}
    accessibilityHint="Switch to view this child's analytics and progress"
    onPress={onPress}
  >
    <View style={{
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: themeColors.accent,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 4
    }}>
      <Text style={{
        ...SEMANTIC_TYPOGRAPHY["type-heading-small"],
        color: isSelected ? themeColors.card : themeColors.primary
      }}>
        {child.name.charAt(0).toUpperCase()}
      </Text>
    </View>
    <Text style={[{
      ...SEMANTIC_TYPOGRAPHY["type-caption"],
      textAlign: 'center',
      color: isSelected ? themeColors.card : themeColors.text
    }]}>
      {child.name}
    </Text>
    {isSelected && (
      <View style={{
        position: 'absolute',
        top: -8,
        right: -8,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: themeColors.success,
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Text style={{
          ...SEMANTIC_TYPOGRAPHY["type-body-small"],
          color: themeColors.card,
          fontWeight: 'bold'
        }}>👑</Text>
      </View>
    )}
  </TouchableOpacity>
));

export default function ParentsAnalyticsScreen() {
  const { themeColors } = useTheme();
  const { showMessage } = useCenteredMessage();
  const styles = createStyles(themeColors);
  const [helpModalVisible, setHelpModalVisible] = useState(false);
  const [children, setChildren] = useState<{ id?: string; _id?: string; name: string }[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('');

  const { analyticsData, loading, error, refetch, exportData, clearCache } = useAnalytics();
  const { childData: selectedChildData, fetchChildData } = useDataCache();

  // Memoize child selector items - only when we have multiple children
  const memoizedChildSelectorItems = React.useMemo(() =>
    children.length > 1 ? children.map((child) => (
      <ChildSelectorItem
        key={child._id || child.id}
        child={child}
        isSelected={selectedChildId === (child._id || child.id)}
        themeColors={themeColors}
        onPress={() => setSelectedChildId(child._id || child.id || "")}
      />
    )) : [],
    [children, selectedChildId, themeColors]
  );

  // Load children and initialize analytics
  React.useEffect(() => {
    async function loadChildren() {
      try {
        const token = await getAuthToken();
        const parentProfile = await getUser();
        if (!token || !parentProfile) {
          showMessage('Please log in to view analytics.', 'error');
          return;
        }
        const familyId = parentProfile.familyId;
        if (!familyId) {
          showMessage('Family information not available. Please contact support.', 'error');
          return;
        }

        const data = await fetchFamilyChildren(familyId, token);
        setChildren(data);
        if (data.length > 0) {
          setSelectedChildId(data[0]._id || data[0].id || "");
        }
      } catch (err) {
        console.error('Failed to load children:', err);
        showMessage('Failed to load family data. Please try refreshing.', 'error');
      }
    }

    loadChildren();
    // Don't clear cache immediately - let the analytics hook handle caching
  }, []); // Empty dependency array to run only once on mount

  // Load specific child data when selectedChildId changes
  React.useEffect(() => {
    if (selectedChildId && fetchChildData) {
      fetchChildData(false, selectedChildId).catch(err => {
        console.error('Failed to load child data for analytics:', err);
      });
    }
  }, [selectedChildId, fetchChildData]);

  const handleExport = () => {
    const csvData = exportData();
    if (csvData) {
      showMessage('Analytics data exported successfully!', 'success');
    } else {
      showMessage('No data available to export', 'info');
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
            <Text style={{ ...SEMANTIC_TYPOGRAPHY["type-body-small"], color: themeColors.card, fontWeight: 'bold' }}>
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
            <Text style={{ ...SEMANTIC_TYPOGRAPHY["type-body-small"], color: themeColors.card, fontWeight: 'bold' }}>Help</Text>
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
            <Text style={[styles.sectionTitle, { color: themeColors.text, ...SEMANTIC_TYPOGRAPHY["type-heading-medium"], marginBottom: 0 }]}>
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
            {memoizedChildSelectorItems}
          </ScrollView>
          <Text style={{ ...SEMANTIC_TYPOGRAPHY["type-caption"], color: themeColors.textSecondary, marginTop: MOBILE_LAYOUT.itemSpacing, textAlign: 'center' }}>
            Tap any child to view their individual analytics and progress
          </Text>
        </View>
      )}



      {/* Simple Analytics Overview - Always render to avoid hook count issues */}
      <AnalyticsOverview analyticsData={analyticsData} analyticsLoading={loading} selectedChildId={selectedChildId} />

      {/* Separator */}
      <View style={{ height: 2, backgroundColor: themeColors.text, opacity: 0.3, marginVertical: 20, width: '90%', alignSelf: 'center' }} />

      <Text style={[styles.title, { ...SEMANTIC_TYPOGRAPHY["type-display-medium"] }]}>Family AI Financial Insights (All Children)</Text>

      {/* Family-Wide AI Insights */}
      <View style={[styles.sectionCard]}>
        <SpendingInsights
          onRefresh={handleRefresh}
        />
      </View>

      {/* Error Display - Only show for actual data loading errors, not authentication issues */}
      {error && !error.includes('Family ID not available') && (
        <View style={styles.sectionCard}>
          <Text style={{ ...SEMANTIC_TYPOGRAPHY["type-body"], color: themeColors.error }}>
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

  // MEMOIZED: Process child-specific analytics data - only recalculates when inputs change
  const processedData = React.useMemo(() => {
    if (!analyticsData || !selectedChildId) {
      return null;
    }

    try {
      // Find the selected child for child-specific analytics
      const familyMembers = analyticsData.familyMembers || [];
      const selectedChild = familyMembers.find((m: any) => m._id === selectedChildId) ||
                           familyMembers.find((m: any) => m.id === selectedChildId) ||
                           familyMembers.find((m: any) => m.role === 'child') ||
                           familyMembers.find((m: any) => m.role !== 'parent');

      // Store selectedChild for passing to components
      const selectedChildData = selectedChild;

      // Optimized filtering - convert user IDs to strings once
      const mongoChildId = selectedChildId;
      const customChildId = selectedChild ? selectedChild.id : selectedChildId;

      // Filter data efficiently
      const childTransactions = analyticsData.transactions?.filter((t: any) => {
        const transactionUser = typeof t.user === 'object' ? t.user.toString() : t.user;
        return transactionUser === mongoChildId;
      }) || [];

      const childChores = analyticsData.chores?.filter((c: any) => {
        const choreUser = typeof c.user === 'object' ? c.user.toString() : c.user;
        return choreUser === mongoChildId;
      }) || [];

      const childGoals = analyticsData.goals?.filter((g: any) => {
        const goalUser = typeof g.user === 'object' ? g.user.toString() : g.user;
        return goalUser === mongoChildId;
      }) || [];

      const childRewards = analyticsData.rewards?.filter((r: any) => {
        const rewardUser = typeof r.user === 'object' ? r.user.toString() : r.user;
        return rewardUser === mongoChildId;
      }) || [];

      const childRealAllowances = analyticsData.realAllowances?.filter((ra: any) => ra.childId === customChildId) || [];

      // Process analytics data
      const { processSpendingTrends, processChoreCompletion, processGoalProgress, processJarDistribution } = require('../../utils/analyticsEngine');

      const spendingTrends = processSpendingTrends(childTransactions);
      const choreCompletion = processChoreCompletion(childChores, childTransactions);
      const goalProgress = processGoalProgress(childGoals);
      const jarDistribution = selectedChild ? processJarDistribution(selectedChild, childTransactions) : [];

      // Calculate summary data
      const currentJar = jarDistribution.find((jar: any) => jar.jarName === 'Pocket Money');
      const saveJar = jarDistribution.find((jar: any) => jar.jarName === 'Savings Pot');
      const spendJar = jarDistribution.find((jar: any) => jar.jarName === 'Spending Pot');
      const donateJar = jarDistribution.find((jar: any) => jar.jarName === 'Help Others Pot');
      const investJar = jarDistribution.find((jar: any) => jar.jarName === 'Grow Money Pot');

      const completedGoalsCount = goalProgress.filter((g: any) => g.progress === 100 || g.projectedCompletion === 'Completed').length;
      const completedTaskCount = childChores.filter((c: any) => c._doc && c._doc.completed === true).length;

      return {
        totalPoints: (currentJar?.currentBalance || 0) + (saveJar?.currentBalance || 0) + (spendJar?.currentBalance || 0) + (donateJar?.currentBalance || 0) + (investJar?.currentBalance || 0),
        chores: choreCompletion.length,
        completedChores: choreCompletion.filter((chore: any) => (chore.completedCount || 0) > 0).length,
        goals: goalProgress.length,
        completedGoals: completedGoalsCount,
        rewardsCount: childRewards.length,
        completedRewards: childRewards.filter((r: any) => r.approved === true || r.purchased === true || r.status === 'claimed').length,
        assignedChoreCount: childChores.length,
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
        rewards: childRewards,
        realAllowances: childRealAllowances,
        saveJar,
        spendJar,
        selectedChild: selectedChildData
      };
    } catch (error) {
      console.error('Error processing child analytics data:', error);
      return null;
    }
  }, [analyticsData, selectedChildId]);

  if (analyticsLoading) {
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
  const selectedChildData = summary?.selectedChild;

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
              <Text style={{ ...SEMANTIC_TYPOGRAPHY["type-body"], fontWeight: 'bold', color: mainTextColor, marginBottom: MOBILE_LAYOUT.itemSpacing }}>Tasks Completed</Text>
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
              <Text style={{ ...SEMANTIC_TYPOGRAPHY["type-body"], fontWeight: 'bold', color: mainTextColor, marginBottom: MOBILE_LAYOUT.itemSpacing }}>Goals Completed</Text>
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
              <Text style={{ ...SEMANTIC_TYPOGRAPHY["type-body"], fontWeight: 'bold', color: mainTextColor, marginBottom: MOBILE_LAYOUT.itemSpacing }}>Rewards Claimed</Text>
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
          <Text style={{ ...SEMANTIC_TYPOGRAPHY["type-body"], fontWeight: "bold", marginBottom: MOBILE_LAYOUT.itemSpacing, marginTop: MOBILE_LAYOUT.sectionSpacing, color: mainTextColor }}>
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
                <Text style={{ ...SEMANTIC_TYPOGRAPHY["type-body-small"], color: mutedTextColor }}>
                  No savings or spending data available yet.
                </Text>
              ) : (
                <>
                  <Text style={{ ...SEMANTIC_TYPOGRAPHY["type-heading-small"], color: mainTextColor, fontWeight: '600', marginBottom: MOBILE_LAYOUT.itemSpacing }}>
                    {`₹${(saveJar?.currentBalance || 0).toLocaleString()} saved vs ₹${(spendJar?.currentBalance || 0).toLocaleString()} spent`}
                  </Text>
                  <Text style={{ ...SEMANTIC_TYPOGRAPHY["type-body-small"], color: secondaryTextColor }}>
                    {(saveJar?.currentBalance || 0) > 0
                      ? `Saved ${((saveJar?.currentBalance || 0) / (spendJar?.currentBalance || 1)).toFixed(2)}x as much as spent`
                      : `Spent ${((spendJar?.currentBalance || 0) / Math.max(1, saveJar?.currentBalance || 0)).toFixed(2)}x as much as saved`}
                  </Text>
                </>
              )
            ) : spendJar?.totalDeposits === 0 ? (
              <Text style={{ ...SEMANTIC_TYPOGRAPHY["type-body"], color: themeColors.success, fontWeight: 'bold' }}>
                All earnings have been saved!<Text style={{ ...SEMANTIC_TYPOGRAPHY["type-body-small"], color: mainTextColor, fontWeight: '400' }}> (No spending yet)</Text>
              </Text>
            ) : (
              <>
                <Text style={{ ...SEMANTIC_TYPOGRAPHY["type-heading-small"], color: mainTextColor, fontWeight: '600', marginBottom: MOBILE_LAYOUT.itemSpacing }}>
                  {`₹${(saveJar?.totalDeposits || 0).toLocaleString()} saved vs ₹${(spendJar?.totalDeposits || 0).toLocaleString()} spent`}
                </Text>
                <Text style={{ ...SEMANTIC_TYPOGRAPHY["type-body-small"], color: secondaryTextColor }}>
                  {(saveJar?.totalDeposits || 0) > 0
                    ? `Saved ${((saveJar?.totalDeposits || 0) / (spendJar?.totalDeposits || 1)).toFixed(2)}x as much as spent`
                    : `Spent ${((spendJar?.totalDeposits || 0) / Math.max(1, saveJar?.totalDeposits || 0)).toFixed(2)}x as much as saved`}
                </Text>
              </>
            )}
          </View>
          <Text style={{ ...SEMANTIC_TYPOGRAPHY["type-caption"], color: mutedTextColor, marginTop: MOBILE_LAYOUT.itemSpacing }}>
            Child: {summary.name}
          </Text>

          {/* Real Allowances Summary */}
          <Text style={{ ...SEMANTIC_TYPOGRAPHY["type-body"], fontWeight: "bold", marginTop: MOBILE_LAYOUT.sectionSpacing, marginBottom: MOBILE_LAYOUT.itemSpacing, color: mainTextColor }}>
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
              <Text style={{ ...SEMANTIC_TYPOGRAPHY["type-body-small"], color: mutedTextColor }}>
                No real allowances recorded yet.
              </Text>
            ) : (
              <>
                <Text style={{ ...SEMANTIC_TYPOGRAPHY["type-heading-small"], color: mainTextColor, fontWeight: '600', marginBottom: MOBILE_LAYOUT.itemSpacing }}>
                  {realAllowances.length} allowance{realAllowances.length !== 1 ? 's' : ''} recorded
                </Text>
                <Text style={{ ...SEMANTIC_TYPOGRAPHY["type-body"], color: themeColors.success, fontWeight: 'bold' }}>
                  Total: ₹{realAllowances.reduce((sum: number, allowance: any) => sum + allowance.amount, 0).toLocaleString()}
                </Text>
                <Text style={{ ...SEMANTIC_TYPOGRAPHY["type-body-small"], color: secondaryTextColor, marginTop: MOBILE_LAYOUT.itemSpacing }}>
                  Most recent: {new Date(realAllowances[0]?.date).toLocaleDateString()}
                </Text>
              </>
            )}
          </View>

          {/* Pie Chart: Total Points by Pot */}
          <Text style={{ ...SEMANTIC_TYPOGRAPHY["type-body"], fontWeight: "bold", marginTop: MOBILE_LAYOUT.sectionSpacing, marginBottom: MOBILE_LAYOUT.itemSpacing, color: mainTextColor }}>
            Total Points by Pot
          </Text>
          <View style={{ alignItems: "center", justifyContent: "center" }}>
            <PieChartPointsByPot jarDistribution={jarDistribution} themeColors={themeColors} selectedChild={selectedChildData} />
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
      <Text style={{ ...SEMANTIC_TYPOGRAPHY["type-heading-small"], color: labelColor, marginBottom: 0 }}>
        {amount}
      </Text>
      <Text style={{ ...SEMANTIC_TYPOGRAPHY["type-caption"], color: color, fontWeight: '600' }}>
        {Math.round(percent * 100)}%
      </Text>
    </View>
  );
}

function PieChartPointsByPot({
  jarDistribution,
  themeColors,
  selectedChild
}: {
  jarDistribution: any,
  themeColors: any,
  selectedChild: any
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

  // Calculate available balances using same logic as other screens
  const availableBalances = selectedChild ? {
    pocket: (selectedChild.currentPoints || 0) - (selectedChild.pendingCurrentPoints || 0),
    savings: (selectedChild.savePoints || 0) - (selectedChild.pendingSavePoints || 0),
    spending: (selectedChild.spendPoints || 0) - (selectedChild.pendingSpendPoints || 0),
    donate: (selectedChild.donatePoints || 0) - (selectedChild.pendingDonatePoints || 0),
    invest: (selectedChild.investPoints || 0) - (selectedChild.pendingInvestPoints || 0)
  } : {
    pocket: 0,
    savings: 0,
    spending: 0,
    donate: 0,
    invest: 0
  };

  // Prepare pieData using available balance (current - pending) to show actual spending power
  const pieData = jarDistribution
    .map((jar: any) => {
      // Map jar names to available balance keys
      const balanceKey = jar.jarName === 'Pocket Money' ? 'pocket' :
                        jar.jarName === 'Savings Pot' ? 'savings' :
                        jar.jarName === 'Spending Pot' ? 'spending' :
                        jar.jarName === 'Help Others Pot' ? 'donate' :
                        jar.jarName === 'Grow Money Pot' ? 'invest' : null;

      const availableBalance = balanceKey ? availableBalances[balanceKey as keyof typeof availableBalances] || 0 : 0;

      return {
        name: jar.jarName,
        population: Math.max(0, availableBalance), // Show available balance, not historical deposits
        totalBalance: jar.currentBalance || 0,
        pendingBalance: balanceKey ? (jar.currentBalance || 0) - availableBalance : 0,
        historicalDeposits: jar.totalDeposits || 0,
        color: jarColorMap[jar.jarName as keyof typeof jarColorMap] || themeColors.primary,
        key: jar.jarName.toLowerCase().replace(' pot', '').replace(' money', '')
      };
    })
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
            <Text style={{ ...SEMANTIC_TYPOGRAPHY["type-caption"], color: themeColors.text, minWidth: 62 }}>{item.name}</Text>
            <Text style={{ ...SEMANTIC_TYPOGRAPHY["type-body-small"], color: themeColors.text, fontWeight: 'bold', marginLeft: MOBILE_LAYOUT.itemSpacing }}>
              ₹{item.population.toLocaleString()}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
