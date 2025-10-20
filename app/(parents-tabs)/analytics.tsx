import BackButton from '@/components/BackButton';
import HelpModal from '@/components/HelpModal';
import { SpendingInsights } from '@/components/SpendingInsights';
import { useAnalytics } from '@/hooks/useAnalytics';
import { getAuthToken, getUserData } from '@/utils/secureStorage';
import { useTheme } from '@/utils/themeContext';
import { useStaleDataWarning } from '@/utils/useStaleDataWarning';
import React, { useState } from 'react';
import { ActivityIndicator, Animated, Easing, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import Svg, { Circle } from 'react-native-svg';
import { fetchChores, fetchFamilyChildren, fetchGoals, fetchRewards, fetchUser } from '../../utils/api';

const createStyles = (themeColors: any) => StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: 12, paddingHorizontal: 6 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 22, marginTop: 6, color: themeColors.primary },
  sectionCard: { borderRadius: 16, marginBottom: 16, padding: 16, minWidth: 320, width: '97%', maxWidth: 520, elevation: 3, backgroundColor: themeColors.card, shadowColor: themeColors.border },
  sectionTitle: { fontSize: 20, fontWeight: '600', marginBottom: 12, color: themeColors.text },
  statusMessage: { fontSize: 15, fontWeight: '600', marginTop: 8, marginBottom: 16, textAlign: 'center', padding: 10, borderRadius: 8, width: '97%', maxWidth: 520, color: themeColors.success },
  placeholder: { color: themeColors.textSecondary, fontStyle: 'italic', fontSize: 15, marginBottom: 8 },
});

export default function ParentsAnalyticsScreen() {
  const { themeColors } = useTheme();
  const styles = createStyles(themeColors);
  const [helpModalVisible, setHelpModalVisible] = useState(false);
  const [feedback, setFeedback] = useState('');

  const { analyticsData, loading, error, refetch, exportData } = useAnalytics();

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

  const [showStaleWarning, , markRefreshed] = useStaleDataWarning();
  const handleRefresh = () => {
    refetch();
    markRefreshed();
  };

  return (
    <ScrollView style={{ backgroundColor: themeColors.background }} contentContainerStyle={styles.container}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: 520, marginBottom: 22, marginTop: 6 }}>
        <BackButton label="Back to Home" to="/(parents-tabs)" />
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
          <Text style={{ color: themeColors.card, fontWeight: 'bold', fontSize: 14 }}>Help</Text>
        </TouchableOpacity>
      </View>

      {showStaleWarning && (
        <Text style={{
          color: themeColors.warning,
          fontWeight: 'bold',
          fontSize: 15,
          backgroundColor: themeColors.surface,
          borderLeftWidth: 4,
          borderLeftColor: themeColors.warning,
          padding: 9,
          borderRadius: 6,
          marginBottom: 8,
          textAlign: 'center'
        }}>
          Progress data may be outdated. Tap "Refresh" for the latest.
        </Text>
      )}
      <Text style={styles.title}>Child's Progress Report</Text>

      {feedback ? <Text style={styles.statusMessage}>{feedback}</Text> : null}

      {/* Simple Analytics Overview */}
      <AnalyticsOverview />

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

const AnalyticsOverview = () => {
  const { themeColors } = useTheme();
  const styles = createStyles(themeColors);

  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [error, setError] = useState('');

  const loadAnalytics = async () => {
    setLoading(true);
    setError('');
    try {
      const token = await getAuthToken();
      const parent = await getUserData();
      if (!token || !parent) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }
      const familyId = parent.familyId;
      const children = await fetchFamilyChildren(familyId, token);
      if (!children || children.length === 0) {
        setError('No child linked to your account.');
        setLoading(false);
        return;
      }
      const kid = children[0];
      const user = await fetchUser(kid.id, token);
      const chores = await fetchChores(kid.id, token);
      const goals = await fetchGoals(kid.id, token);
      const rewards = await fetchRewards(kid.id, token);

      // Single child summary
      const summaryObj = {
        totalPoints: user.currentPoints ?? 0,
        chores: chores.length,
        completedChores: chores.filter((c: any) =>
          c.completed === true ||
          c.status === 'completed' ||
          c.approved === true
        ).length,
        goals: goals.length,
        completedGoals: goals.filter((g: any) => g.completed || g.status === 'completed').length,
        rewards: rewards.length,
        completedRewards: rewards.filter((r: any) => r.purchased).length,
        jars: {
          current: user.currentPoints ?? 0,
          save: user.savePoints ?? 0,
          spend: user.spendPoints ?? 0,
          donate: user.donatePoints ?? 0,
          invest: user.investPoints ?? 0
        },
        name: kid.name,
        goalsList: goals.map((g: any) => ({
          name: g.name || g.title || 'Goal',
          // Use either direct percent or (currentValue / targetValue)
          progress: g.completed || g.status === 'completed'
            ? 1
            : g.progress !== undefined
              ? Math.max(0, Math.min(1, g.progress / 100))
              : (g.current !== undefined && g.target !== undefined && g.target > 0)
                ? Math.max(0, Math.min(1, g.current / g.target))
                : 0,
        })),
      };
      setSummary(summaryObj);
    } catch (err: any) {
      setError('Failed to load analytics');
    }
    setLoading(false);
  };

  React.useEffect(() => {
    loadAnalytics();
  }, []);

  // Theme-aware colors from the theme API (always use themeColors)
  const accentTextColor = themeColors.card;
  const mainTextColor = themeColors.text;
  const secondaryTextColor = themeColors.warning;
  const mutedTextColor = themeColors.textSecondary;
  const cardBackgroundColor = themeColors.card;
  const shadowColor = themeColors.border;

  return (
    <View style={[styles.sectionCard, { backgroundColor: cardBackgroundColor, shadowColor }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>Child's Progress Overview</Text>
        </View>
        <TouchableOpacity
          style={{
            backgroundColor: themeColors.accent,
            borderRadius: 6,
            paddingVertical: 7,
            paddingHorizontal: 14,
            minWidth: 38,
            maxWidth: 120,
            alignItems: 'center',
            justifyContent: 'center',
            height: 36
          }}
          onPress={loadAnalytics}
          disabled={loading}
        >
          <Text style={{ color: accentTextColor, fontWeight: 'bold', fontSize: 13 }}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </Text>
        </TouchableOpacity>
      </View>
      {error ? <Text style={[styles.placeholder, { color: mutedTextColor }]}>{error}</Text> : null}
      {loading ? <ActivityIndicator size="small" color={mainTextColor} /> : null}
      {!loading && summary && (
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
            {summary.jars.save === 0 && summary.jars.spend === 0 ? (
              <Text style={{ color: mutedTextColor, fontSize: 14 }}>
                No savings or spending data available yet.
              </Text>
            ) : summary.jars.spend === 0 ? (
              <Text style={{ color: themeColors.success, fontWeight: 'bold', fontSize: 16 }}>
                All earnings have been saved!<Text style={{ color: mainTextColor, fontWeight: '400', fontSize: 14 }}> (No spending yet)</Text>
              </Text>
            ) : (
              <>
                <Text style={{ color: mainTextColor, fontWeight: '600', fontSize: 20, marginBottom: 6 }}>
                  {`₹${summary.jars.save.toLocaleString()} saved vs ₹${summary.jars.spend.toLocaleString()} spent`}
                </Text>
                <Text style={{ color: secondaryTextColor, fontSize: 15 }}>
                  {summary.jars.save > 0
                    ? `Saved ${(summary.jars.save / summary.jars.spend).toFixed(2)}x as much as spent`
                    : `Spent ${(summary.jars.spend / Math.max(1, summary.jars.save)).toFixed(2)}x as much as saved`}
                </Text>
              </>
            )}
          </View>
          <Text style={{ color: mutedTextColor, fontSize: 12, marginTop: 8 }}>
            Child: {summary.name}
          </Text>

          {/* Pie Chart: Points by Pot */}
          <Text style={{ fontWeight: "bold", fontSize: 16, marginTop: 18, marginBottom: 7, color: mainTextColor }}>
            Points by Pot
          </Text>
          <View style={{ alignItems: "center", justifyContent: "center" }}>
            <PieChartPointsByPot jars={summary.jars} themeColors={themeColors} />
          </View>
        </>
      )}
      {!loading && !summary && (
        <Text style={[styles.placeholder, { color: mutedTextColor }]}>No progress data available yet.</Text>
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
  jars,
  themeColors
}: {
  jars: any,
  themeColors: any
}) {
  const screenWidth = 340;
  const jarNames: { [key: string]: string } = {
    current: "Pocket Money",
    save: "Savings Pot",
    spend: "Spending Pot",
    donate: "Help Others",
    invest: "Grow Money Pot"
  };

  // Use jarColors from theme
  const jarColors = themeColors.jarColors || {};
  // Prepare pieData with color string for each jar
  const pieData = Object.entries(jars)
    .map(([jar, points]) => ({
      name: jarNames[jar] || jar,
      population: typeof points === "number" ? points : 0,
      color: jarColors[jar] || themeColors.primary,
      key: jar
    }))
    .filter(item => item.population > 0);

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
        {pieData.map(item => (
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
