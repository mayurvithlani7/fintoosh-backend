import { AnalyticsChartsContainer } from '@/components/AnalyticsChart';
import BackButton from '@/components/BackButton';
import HelpModal from '@/components/HelpModal';
import { SpendingInsights } from '@/components/SpendingInsights';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useAnalytics } from '@/hooks/useAnalytics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState } from 'react';
import { ActivityIndicator, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { fetchChores, fetchFamilyChildren, fetchGoals, fetchRewards, fetchUser } from '../../utils/api';

export default function ParentsAnalyticsScreen() {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');

  const styles = createStyles({ background: backgroundColor, text: textColor, tint: tintColor });
  const [helpModalVisible, setHelpModalVisible] = useState(false);
  const [feedback, setFeedback] = useState('');

  const { analyticsData, loading, error, refetch, exportData } = useAnalytics();

  const handleExport = () => {
    const csvData = exportData();
    if (csvData) {
      // In a real app, this would trigger a download or share
      setFeedback('Analytics data exported successfully!');
      setTimeout(() => setFeedback(''), 3000);
    } else {
      setFeedback('No data available to export');
      setTimeout(() => setFeedback(''), 3000);
    }
  };

  const handleRefresh = () => {
    refetch();
  };

  return (
    <ScrollView style={{ backgroundColor }} contentContainerStyle={styles.container}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: 520, marginBottom: 22, marginTop: 6 }}>
        <BackButton label="Back to Home" to="/(parents-tabs)" />
        <TouchableOpacity
          style={{
            backgroundColor: tintColor,
            borderRadius: 20,
            paddingHorizontal: 12,
            paddingVertical: 6,
            elevation: 2,
          }}
          onPress={() => setHelpModalVisible(true)}
        >
          <Text style={{ color: backgroundColor, fontWeight: 'bold', fontSize: 14 }}>Help</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.title, { color: textColor }]}>Child's Progress Report</Text>

      {feedback ? <Text style={[styles.statusMessage, { color: textColor }]}>{feedback}</Text> : null}

      {/* Simple Analytics Overview */}
      <AnalyticsOverview />

      {/* Separator */}
      <View style={{ height: 2, backgroundColor: textColor, opacity: 0.3, marginVertical: 20, width: '90%', alignSelf: 'center' }} />

      <Text style={[styles.title, { color: textColor, fontSize: 24 }]}>Advanced Analytics Dashboard</Text>

      {/* AI-Powered Insights */}
      <View style={[styles.sectionCard, { backgroundColor: backgroundColor === '#000000' ? '#1a1a1a' : '#ffffff' }]}>
        <SpendingInsights
          onExport={handleExport}
          onRefresh={handleRefresh}
        />
      </View>

      {/* Charts Section */}
      <View style={[styles.sectionCard, { backgroundColor: backgroundColor === '#000000' ? '#1a1a1a' : '#ffffff' }]}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>📊 Data Visualizations</Text>
        <AnalyticsChartsContainer analyticsData={analyticsData} />
      </View>

      {/* Error Display */}
      {error && (
        <View style={[styles.sectionCard, { backgroundColor: '#ffebee' }]}>
          <Text style={{ color: '#c62828', fontSize: 16 }}>
            ⚠️ Error loading analytics: {error}
          </Text>
          <TouchableOpacity
            style={{ backgroundColor: '#c62828', padding: 10, borderRadius: 6, marginTop: 10 }}
            onPress={handleRefresh}
          >
            <Text style={{ color: '#ffffff', textAlign: 'center' }}>Retry</Text>
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

// AnalyticsOverview component
const AnalyticsOverview = () => {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [error, setError] = useState('');

  const loadAnalytics = async () => {
    setLoading(true);
    setError('');
    try {
      const token = await AsyncStorage.getItem('authToken');
      const parentRaw = await AsyncStorage.getItem('user');
      if (!token || !parentRaw) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }
      const parent = JSON.parse(parentRaw);
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
        completedChores: chores.filter((c: any) => c.completed).length,
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
        name: kid.name
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

  // Theme-aware colors for the component - use guaranteed high contrast
  const isDarkMode = backgroundColor === '#000000';
  const surfaceColor = isDarkMode ? '#1a1a1a' : '#ffffff';
  const cardBackgroundColor = isDarkMode ? '#2a2a2a' : '#e9f7fd';
  const accentColor = isDarkMode ? '#4a9eff' : '#4CAF50';
  const accentTextColor = '#ffffff'; // Always white text on colored buttons
  const mainTextColor = isDarkMode ? '#ffffff' : '#000000'; // High contrast
  const secondaryTextColor = isDarkMode ? '#cccccc' : '#154477';
  const mutedTextColor = isDarkMode ? '#888888' : '#666666';
  const shadowColor = isDarkMode ? '#000000' : '#aaa';

  return (
    <View style={[createStyles({ background: surfaceColor, text: textColor, tint: tintColor }).sectionCard, { backgroundColor: surfaceColor, shadowColor }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <View style={{ flex: 1 }}>
          <Text style={[createStyles({ background: surfaceColor, text: textColor, tint: tintColor }).sectionTitle, { color: textColor }]}>Child's Progress Overview</Text>
        </View>
        <TouchableOpacity
          style={{
            backgroundColor: accentColor,
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
      {error ? <Text style={[createStyles({ background: surfaceColor, text: textColor, tint: tintColor }).placeholder, { color: mutedTextColor }]}>{error}</Text> : null}
      {loading ? <ActivityIndicator size="small" color={textColor} /> : null}
      {!loading && summary && (
        <>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 10 }}>
            <View style={{ backgroundColor: cardBackgroundColor, padding: 8, borderRadius: 7, marginRight: 6, marginBottom: 7, minWidth: 130, alignItems: "center" }}>
              <Text style={{ color: mainTextColor }}>Total Points: <Text style={{ fontWeight: "bold", color: secondaryTextColor }}>{summary.totalPoints}</Text></Text>
            </View>
            <View style={{ backgroundColor: cardBackgroundColor, padding: 8, borderRadius: 7, marginRight: 6, marginBottom: 7, minWidth: 130, alignItems: "center" }}>
              <Text style={{ color: mainTextColor }}>Home Tasks Done: <Text style={{ fontWeight: "bold", color: secondaryTextColor }}>{summary.completedChores}/{summary.chores}</Text></Text>
            </View>
            <View style={{ backgroundColor: cardBackgroundColor, padding: 8, borderRadius: 7, marginRight: 6, marginBottom: 7, minWidth: 130, alignItems: "center" }}>
              <Text style={{ color: mainTextColor }}>Goals Completed: <Text style={{ fontWeight: "bold", color: secondaryTextColor }}>{summary.completedGoals}/{summary.goals}</Text></Text>
            </View>
            <View style={{ backgroundColor: cardBackgroundColor, padding: 8, borderRadius: 7, marginRight: 6, marginBottom: 7, minWidth: 130, alignItems: "center" }}>
              <Text style={{ color: mainTextColor }}>Rewards Claimed: <Text style={{ fontWeight: "bold", color: secondaryTextColor }}>{summary.completedRewards}/{summary.rewards}</Text></Text>
            </View>
          </View>
          <Text style={{ fontWeight: "bold", fontSize: 16, marginBottom: 6, color: mainTextColor }}>Points by Pot</Text>
          <View style={{ alignItems: "center", justifyContent: "center" }}>
            <PieChart
              data={Object.entries(summary.jars).map(([jar, points], i) => {
                const jarNameMap: { [key: string]: string } = {
                  current: 'Pocket Money',
                  save: 'Savings Pot',
                  spend: 'Spending Pot',
                  donate: 'Help Others',
                  invest: 'Grow Money Pot'
                };
                // Theme-aware colors for jars
                const jarColors = isDarkMode
                  ? ['#4a9eff', '#4ade80', '#fb923c', '#fbbf24', '#c084fc'] // Dark mode colors
                  : ['#2563eb', '#16a34a', '#ea580c', '#ca8a04', '#a855f7']; // Light mode colors
                return {
                  name: jarNameMap[jar] || jar[0].toUpperCase() + jar.slice(1),
                  population: points as number,
                  color: jarColors[i % 5],
                  legendFontColor: mainTextColor,
                  legendFontSize: 13,
                };
              })}
              width={Math.min(Dimensions.get('window').width * 0.94, 340)}
              height={230}
              // @ts-ignore
              chartConfig={{
                color: (opacity = 1, index = 0) => {
                  const jarColors = isDarkMode
                    ? ['#4a9eff', '#4ade80', '#fb923c', '#fbbf24', '#c084fc'] // Dark mode colors
                    : ['#2563eb', '#16a34a', '#ea580c', '#ca8a04', '#a855f7']; // Light mode colors
                  return jarColors[index % 5];
                },
                labelColor: (opacity = 1) => mainTextColor,
                backgroundColor: surfaceColor,
              }}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="14"
              absolute
            />
          </View>
          <Text style={{ color: mutedTextColor, fontSize: 12, marginTop: 10 }}>
            Child: {summary.name}
          </Text>
        </>
      )}
      {!loading && !summary && (
        <Text style={[createStyles({ background: surfaceColor, text: textColor, tint: tintColor }).placeholder, { color: mutedTextColor }]}>No progress data available yet.</Text>
      )}
    </View>
  );
};

const createStyles = (themeColors: { background: string; text: string; tint: string }) => StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: 12, paddingHorizontal: 6 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 22, marginTop: 6 },
  sectionCard: { borderRadius: 16, marginBottom: 16, padding: 16, minWidth: 320, width: '97%', maxWidth: 520, elevation: 3 },
  sectionTitle: { fontSize: 20, fontWeight: '600', marginBottom: 12 },
  statusMessage: { fontSize: 15, fontWeight: '600', marginTop: 8, marginBottom: 16, textAlign: 'center', padding: 10, borderRadius: 8, width: '97%', maxWidth: 520 },
  placeholder: { color: '#999', fontStyle: 'italic', fontSize: 15, marginBottom: 8 },
});
