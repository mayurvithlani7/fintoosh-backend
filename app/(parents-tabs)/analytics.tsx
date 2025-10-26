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
});

export default function ParentsAnalyticsScreen() {
  const { themeColors } = useTheme();
  const styles = createStyles(themeColors);
  const [helpModalVisible, setHelpModalVisible] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [children, setChildren] = useState<{ id: string; name: string }[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('');

  const { analyticsData, loading, error, refetch, exportData, clearCache } = useAnalytics();

  // Load children and initialize analytics
  React.useEffect(() => {
    async function loadChildren() {
      try {
        const token = await getAuthToken();
        const parentProfile = await getUser();
        if (!token || !parentProfile) return;
        const familyId = parentProfile.familyId;
        if (!familyId) return;

        const data = await fetchFamilyChildren(familyId, token);
        setChildren(data);
        if (data.length > 0) {
          setSelectedChildId(data[0].id ?? "");
        }
      } catch (err) {
        console.error('Failed to load children:', err);
      }
    }

    loadChildren();
    clearCache();
    refetch();
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
    await refetch();
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
              paddingHorizontal: 12,
              paddingVertical: 6,
              elevation: 2,
            }}
            onPress={handleRefresh}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel={loading ? "Refreshing analytics data" : "Refresh analytics data"}
            accessibilityHint="Reload the latest analytics and progress data"
            accessibilityState={{ disabled: loading }}
          >
            <Text style={{ color: themeColors.card, fontWeight: 'bold', fontSize: 14 }}>
              {loading ? 'Refreshing...' : '🔄 Refresh'}
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

      {/* Child Selection */}
      {children.length > 1 && (
        <View style={[styles.sectionCard, { backgroundColor: themeColors.card, shadowColor: themeColors.border, marginBottom: 12 }]}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Select Child</Text>
          <View style={styles.childSelector}>
            {children.map((child) => (
              <TouchableOpacity
                key={child.id}
                style={[
                  styles.childButton,
                  selectedChildId === child.id && styles.childButtonSelected
                ]}
                onPress={() => setSelectedChildId(child.id)}
              >
                <Text style={[
                  styles.childButtonText,
                  selectedChildId === child.id && styles.childButtonTextSelected
                ]}>
                  {child.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {feedback ? <Text style={styles.statusMessage}>{feedback}</Text> : null}

      {/* Simple Analytics Overview */}
      <AnalyticsOverview analyticsData={analyticsData} analyticsLoading={loading} />

      {/* Separator */}
      <View style={{ height: 2, backgroundColor: themeColors.text, opacity: 0.3, marginVertical: 20, width: '90%', alignSelf: 'center' }} />

      <Text style={[styles.title, { fontSize: 24 }]}>Advanced Analytics Dashboard</Text>

      {/* AI-Powered Insights */}
      <View style={[styles.sectionCard]}>
        <SpendingInsights
          onExport={handleExport}
          onRefresh={handleRefresh}
        />
      </View>

      {/* Error Display */}
      {error && (
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

const AnalyticsOverview = ({ analyticsData, analyticsLoading }: { analyticsData: any, analyticsLoading: boolean }) => {
  const { themeColors } = useTheme();
  const styles = createStyles(themeColors);

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

  // Build summary from processed analytics data
  console.log('AnalyticsOverview - analyticsData:', analyticsData);
  const familyMembers = analyticsData.familyMembers || [];
  console.log('AnalyticsOverview - familyMembers:', familyMembers);
  const child = familyMembers.find((m: any) => m.role === 'child') || familyMembers.find((m: any) => m.role !== 'parent');
  console.log('AnalyticsOverview - found child:', child);
  console.log('AnalyticsOverview - child name:', child ? child.name : 'No child found');

  // Use processed data for summary
  const choreCompletion = analyticsData.choreCompletion || [];
  const goalProgress = analyticsData.goalProgress || [];
  const jarDistribution = analyticsData.jarDistribution || [];
  const rewards = analyticsData.rewards || [];
  const realAllowances = analyticsData.realAllowances || [];

  // Debug logging for real allowances
  console.log('AnalyticsOverview - realAllowances:', realAllowances);
  console.log('AnalyticsOverview - realAllowances length:', realAllowances.length);
  console.log('AnalyticsOverview - realAllowances sample:', realAllowances.slice(0, 2));

  console.log('AnalyticsOverview - raw analyticsData:', analyticsData);
  console.log('AnalyticsOverview - choreCompletion:', choreCompletion);
  console.log('AnalyticsOverview - choreCompletion details:', choreCompletion.map((c: any) => ({ name: c.choreName, completed: c.completedCount })));
  console.log('AnalyticsOverview - goalProgress:', goalProgress);
  console.log('AnalyticsOverview - goalProgress details:', goalProgress.map((g: any) => ({ name: g.goalName, progress: g.progress, status: g.projectedCompletion })));
  console.log('AnalyticsOverview - jarDistribution:', jarDistribution);
  console.log('AnalyticsOverview - jarDistribution details:', jarDistribution.map((j: any) => ({ name: j.jarName, balance: j.currentBalance, deposits: j.totalDeposits })));
  console.log('AnalyticsOverview - rewards:', rewards);
  console.log('AnalyticsOverview - rewards details:', rewards.map((r: any) => ({ name: r.name, purchased: r.purchased, approved: r.approved, completed: r.completed })));
  console.log('AnalyticsOverview - completedRewards calculation:', rewards.filter((r: any) => r.approved === true));

  // Get current points from jar distribution
  const currentJar = jarDistribution.find((jar: any) => jar.jarName === 'Pocket Money');
  const saveJar = jarDistribution.find((jar: any) => jar.jarName === 'Savings Pot');
  const spendJar = jarDistribution.find((jar: any) => jar.jarName === 'Spending Pot');
  const donateJar = jarDistribution.find((jar: any) => jar.jarName === 'Help Others Pot');
  const investJar = jarDistribution.find((jar: any) => jar.jarName === 'Grow Money Pot');

  const summary = {
    totalPoints: (currentJar?.currentBalance || 0) + (saveJar?.currentBalance || 0) + (spendJar?.currentBalance || 0) + (donateJar?.currentBalance || 0) + (investJar?.currentBalance || 0),
    chores: choreCompletion.length,
    completedChores: choreCompletion.filter((chore: any) => (chore.completedCount || 0) > 0).length,
    goals: goalProgress.length,
    completedGoals: goalProgress.filter((g: any) => g.progress === 100 || g.projectedCompletion === 'Completed').length,
    rewards: rewards.length,
    completedRewards: rewards.filter((r: any) => r.approved === true).length,
    jars: {
      current: currentJar?.currentBalance || 0,
      save: saveJar?.currentBalance || 0,
      spend: spendJar?.currentBalance || 0,
      donate: donateJar?.currentBalance || 0,
      invest: investJar?.currentBalance || 0
    },
    name: child ? child.name : 'Child',
    goalsList: goalProgress.map((g: any) => ({
      name: g.goalName || 'Goal',
      progress: Math.max(0, Math.min(1, (g.progress || 0) / 100)),
    })),
  };

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
              <ProgressRing
                percent={summary.chores > 0 ? summary.completedChores / summary.chores : 0}
                amount={`${summary.completedChores}/${summary.chores}`}
                color={themeColors.success}
                size={110}
                strokeWidth={10}
                labelColor={mainTextColor}
                ringBackground={cardBackgroundColor}
              />
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
                percent={summary.rewards > 0 ? summary.completedRewards / summary.rewards : 0}
                amount={`${summary.completedRewards}/${summary.rewards}`}
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
            {saveJar?.totalDeposits === 0 && spendJar?.totalDeposits === 0 ? (
              <Text style={{ color: mutedTextColor, fontSize: 14 }}>
                No savings or spending data available yet.
              </Text>
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
