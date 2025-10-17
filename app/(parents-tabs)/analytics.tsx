import { getAuthToken } from '@/utils/secureStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState } from 'react';
import { ActivityIndicator, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { fetchChores, fetchFamilyChildren, fetchGoals, fetchRewards, fetchTransactions, fetchUser } from '../../utils/api';
/* @ts-ignore */
import BackButton from '@/components/BackButton';
import HelpModal from '@/components/HelpModal';
import { useTheme } from '@/utils/themeContext';

import { PieChart } from 'react-native-chart-kit';

export default function ParentsAnalyticsScreen() {
  const [feedback, setFeedback] = useState('');
  const [helpModalVisible, setHelpModalVisible] = useState(false);

  function handlePrint() {
    setFeedback('Print triggered (add real print feature or print current view).');
    setTimeout(() => setFeedback(''), 5000);
  }

  function handleExportJSON() {
    setFeedback('JSON export triggered (implement real download).');
    setTimeout(() => setFeedback(''), 5000);
  }

  function handleExportCSV() {
    setFeedback('CSV export triggered (implement real transaction download).');
    setTimeout(() => setFeedback(''), 5000);
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: 520, marginBottom: 22, marginTop: 6 }}>
        <BackButton label="Back to Home" to="/(parents-tabs)" />
        <TouchableOpacity
          style={{
            backgroundColor: '#6846b3',
            borderRadius: 20,
            paddingHorizontal: 12,
            paddingVertical: 6,
            elevation: 2,
          }}
          onPress={() => setHelpModalVisible(true)}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>Help</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.title}>Child&apos;s Progress Report</Text>

      {feedback ? <Text style={styles.statusMessage}>{feedback}</Text> : null}

      <AnalyticsOverview />

      <FinancialForecasting />

      <BehavioralInsights />

      {/* Help Modal */}
      <HelpModal
        visible={helpModalVisible}
        onClose={() => setHelpModalVisible(false)}
        title="Analytics - Help"
        tabs={[
          {
            title: "Understanding Your Child's Progress",
            content: [
              {
                type: "text",
                text: "This dashboard shows your child's complete financial learning journey! Track their money management skills, task completion, and saving habits all in one place.",
                icon: "📊"
              },
              {
                type: "bullet",
                text: "Monitor points earned through chores and tasks"
              },
              {
                type: "bullet",
                text: "Track savings goals and achievements"
              },
              {
                type: "bullet",
                text: "See reward redemptions and spending patterns"
              },
              {
                type: "bullet",
                text: "Visual charts show money distribution across pots"
              },
              {
                type: "highlight",
                text: "Use this data to guide your child's financial education journey!",
                icon: "👀"
              }
            ]
          },
          {
            title: "Reading the Key Metrics",
            content: [
              {
                type: "text",
                text: "Each number tells a story about your child's financial habits:",
                icon: "📈"
              },
              {
                type: "bullet",
                text: "Total Points - Combined value across all money pots"
              },
              {
                type: "bullet",
                text: "Home Tasks Done - Ratio of completed chores (e.g., 8/12 means 8 out of 12 tasks finished)"
              },
              {
                type: "bullet",
                text: "Goals Completed - Savings targets achieved (helps build long-term planning skills)"
              },
              {
                type: "bullet",
                text: "Rewards Claimed - Items purchased with earned points"
              },
              {
                type: "highlight",
                text: "Look for increasing numbers over time - that's the sign of growing financial responsibility!",
                icon: "📊"
              }
            ]
          },
          {
            title: "Understanding the Money Pots Chart",
            content: [
              {
                type: "text",
                text: "The colorful pie chart reveals how your child allocates their earnings:",
                icon: "🥧"
              },
              {
                type: "bullet",
                text: "Pocket Money (Blue) - Immediate spending for small treats"
              },
              {
                type: "bullet",
                text: "Savings Pot (Green) - Long-term goals like bikes or tablets"
              },
              {
                type: "bullet",
                text: "Spending Pot (Orange) - Fun purchases and entertainment"
              },
              {
                type: "bullet",
                text: "Help Others Pot (Yellow) - Charitable giving and donations"
              },
              {
                type: "bullet",
                text: "Grow Money Pot (Purple) - Learning about investments"
              },
              {
                type: "highlight",
                text: "A well-balanced chart shows your child understands different money purposes!",
                icon: "⚖️"
              }
            ]
          },
          {
            title: "How to Use This Information",
            content: [
              {
                type: "text",
                text: "Turn data into teaching moments for your child:",
                icon: "💡"
              },
              {
                type: "bullet",
                text: "Praise consistent task completion and saving habits"
              },
              {
                type: "bullet",
                text: "Discuss why certain money pots are fuller than others"
              },
              {
                type: "bullet",
                text: "Set new goals based on their current progress"
              },
              {
                type: "bullet",
                text: "Celebrate achievements and completed goals"
              },
              {
                type: "bullet",
                text: "Address areas where they might need more guidance"
              },
              {
                type: "highlight",
                text: "Use the data to have meaningful conversations about money management!",
                icon: "👨‍👩‍👧‍👦"
              }
            ]
          },
          {
            title: "Financial Forecasting Explained",
            content: [
              {
                type: "text",
                text: "See realistic timelines for your child's savings goals:",
                icon: "💰"
              },
              {
                type: "bullet",
                text: "Calculates based on their recent earning and saving patterns"
              },
              {
                type: "bullet",
                text: "Shows exactly how many weeks until goal completion"
              },
              {
                type: "bullet",
                text: "Helps set achievable targets and expectations"
              },
              {
                type: "bullet",
                text: "Motivates steady saving habits with clear deadlines"
              },
              {
                type: "bullet",
                text: "Updates automatically as their habits change"
              },
              {
                type: "highlight",
                text: "Use forecasts to teach patience and the power of consistent saving!",
                icon: "🎯"
              }
            ]
          },
          {
            title: "Monthly Earning vs Spending Analysis",
            content: [
              {
                type: "text",
                text: "Understand your child's monthly financial balance:",
                icon: "📈"
              },
              {
                type: "bullet",
                text: "Earning % - Points gained from chores, tasks, and goals"
              },
              {
                type: "bullet",
                text: "Spending % - Points used for rewards and purchases"
              },
              {
                type: "bullet",
                text: "Total Activity - Number of financial transactions this month"
              },
              {
                type: "bullet",
                text: "Balance Check - Are they earning more than they spend?"
              },
              {
                type: "highlight",
                text: "A healthy balance shows they're learning to both earn and spend wisely!",
                icon: "⚖️"
              }
            ]
          },
          {
            title: "Best Practices for Monitoring",
            content: [
              {
                type: "text",
                text: "Make the most of your child's financial learning experience:",
                icon: "📅"
              },
              {
                type: "bullet",
                text: "Review weekly to spot trends and celebrate progress"
              },
              {
                type: "bullet",
                text: "Discuss the numbers together - make it a learning conversation"
              },
              {
                type: "bullet",
                text: "Adjust chore values or goals based on their performance"
              },
              {
                type: "bullet",
                text: "Notice when they're consistently saving or giving to charity"
              },
              {
                type: "bullet",
                text: "Use the data to teach cause-and-effect relationships"
              },
              {
                type: "highlight",
                text: "Remember: Every child learns at their own pace - focus on steady improvement!",
                icon: "🎉"
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
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [error, setError] = useState('');

  const loadAnalytics = async () => {
    setLoading(true);
    setError('');
    try {
      const token = await getAuthToken();
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
    } catch (_err: any) { // Changed to _err to fix linter warning
      setError('Failed to load analytics');
    }
    setLoading(false);
  };

  React.useEffect(() => {
    loadAnalytics();
  }, []);

  return (
    <View style={[styles.sectionCard, { backgroundColor: themeColors.card, shadowColor: themeColors.border }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <View style={{flex: 1}}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Child's Progress Overview</Text>
        </View>
        <TouchableOpacity
          style={{
            backgroundColor: themeColors.primary,
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
          <Text style={{ color: themeColors.card, fontWeight: 'bold', fontSize: 13 }}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </Text>
        </TouchableOpacity>
      </View>
      {error ? <Text style={[styles.placeholder, { color: themeColors.textSecondary }]}>{error}</Text> : null}
      {loading ? <ActivityIndicator size="small" color={themeColors.primary} /> : null}
      {!loading && summary && (
        <>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 10 }}>
            <View style={[styles.analyticCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
              <Text style={{ color: themeColors.text }}>Total Points: <Text style={[styles.boldText, { color: themeColors.primary }]}>{summary.totalPoints}</Text></Text>
            </View>
            <View style={[styles.analyticCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
              <Text style={{ color: themeColors.text }}>Home Tasks Done: <Text style={[styles.boldText, { color: themeColors.primary }]}>{summary.completedChores}/{summary.chores}</Text></Text>
            </View>
            <View style={[styles.analyticCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
              <Text style={{ color: themeColors.text }}>Goals Completed: <Text style={[styles.boldText, { color: themeColors.primary }]}>{summary.completedGoals}/{summary.goals}</Text></Text>
            </View>
            <View style={[styles.analyticCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
              <Text style={{ color: themeColors.text }}>Rewards Claimed: <Text style={[styles.boldText, { color: themeColors.primary }]}>{summary.completedRewards}/{summary.rewards}</Text></Text>
            </View>
          </View>
          <Text style={{ fontWeight: "bold", fontSize: 16, marginBottom: 6 }}>Points by Pot</Text>
          <View style={{ alignItems: "center", justifyContent: "center" }}>
            {(() => {
              try {
                const themeColorArray = [themeColors.primary, themeColors.success, themeColors.warning, themeColors.accent, themeColors.secondary];
                const chartData = Object.entries(summary.jars).map(([jar, points], i) => {
                  const jarNameMap: { [key: string]: string } = {
                    current: 'Pocket Money',
                    save: 'Savings Pot',
                    spend: 'Spending Pot',
                    donate: 'Help Others',
                    invest: 'Grow Money Pot'
                  };
                  return {
                    name: jarNameMap[jar] || jar[0].toUpperCase() + jar.slice(1),
                    population: points as number,
                    color: themeColorArray[i % 5] || themeColors.primary,
                    legendFontColor: themeColors.text,
                    legendFontSize: 13,
                  };
                });

                return (
                  <PieChart
                    data={chartData}
                    width={Math.min(Dimensions.get('window').width * 0.94, 340)}
                    height={230}
                    chartConfig={{
                      color: (opacity = 1, index = 0) => themeColorArray[index % 5] || themeColors.primary,
                      labelColor: (opacity = 1) => themeColors.text || '#000',
                      backgroundColor: themeColors.card || '#fff',
                    }}
                    accessor="population"
                    backgroundColor="transparent"
                    paddingLeft="14"
                    absolute
                  />
                );
              } catch (chartError) {
                console.error('Chart rendering error:', chartError);
                return (
                  <View style={{ padding: 20, alignItems: 'center' }}>
                    <Text style={{ color: themeColors.textSecondary, textAlign: 'center' }}>
                      Unable to display chart. Data may be unavailable.
                    </Text>
                  </View>
                );
              }
            })()}
          </View>
          <Text style={{ color: "#888", fontSize: 12, marginTop: 10 }}>
            Child: {summary.name}
          </Text>
        </>
      )}
      {!loading && !summary && (
        <Text style={styles.placeholder}>No progress data available yet.</Text>
      )}
    </View>
  );
};

const FinancialForecasting = () => {
  const { themeColors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [forecast, setForecast] = useState<any>(null);
  const [error, setError] = useState('');

  const loadForecast = async () => {
    setLoading(true);
    setError('');
    try {
      const token = await getAuthToken();
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

      // Fetch transactions and goals for forecasting
      const transactions = await fetchTransactions(kid.id, token as any);
      const goals = await fetchGoals(kid.id, token as any);

      // Calculate average savings rate from recent transactions
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const recentTransactions = transactions.filter((tx: any) => {
        const txDate = new Date(tx.createdAt || tx.date);
        return txDate >= thirtyDaysAgo && tx.amount > 0;
      });

      // Calculate daily savings rate
      const totalSaved = recentTransactions.reduce((sum: number, tx: any) => sum + tx.amount, 0);
      const daysDiff = Math.max(1, (now.getTime() - thirtyDaysAgo.getTime()) / (1000 * 60 * 60 * 24));
      const dailySavingsRate = totalSaved / daysDiff;

      // Find active goals
      const activeGoals = goals.filter((g: any) => g.status === 'active' && g.jar === 'save');

      if (activeGoals.length > 0 && dailySavingsRate > 0) {
        const goal = activeGoals[0]; // Use first active savings goal
        const remainingAmount = goal.targetAmount - (goal.currentAmount || 0);
        const weeksToGoal = Math.ceil(remainingAmount / (dailySavingsRate * 7));

        setForecast({
          goalName: goal.name,
          targetAmount: goal.targetAmount,
          currentAmount: goal.currentAmount || 0,
          remainingAmount: remainingAmount,
          dailySavingsRate: Math.round(dailySavingsRate * 100) / 100,
          weeksToGoal: weeksToGoal,
          estimatedCompletion: new Date(now.getTime() + weeksToGoal * 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          name: kid.name
        });
      } else {
        setForecast(null);
      }
    } catch (_err: any) { // Changed to _err to fix linter warning
      setError('Failed to load forecast');
    }
    setLoading(false);
  };

  React.useEffect(() => {
    loadForecast();
  }, []);

  return (
    <View style={[styles.sectionCard, { backgroundColor: themeColors.card, shadowColor: themeColors.border }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <View style={{flex: 1}}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>💰 Financial Forecasting</Text>
        </View>
        <TouchableOpacity
          style={{
            backgroundColor: themeColors.warning,
            borderRadius: 6,
            paddingVertical: 7,
            paddingHorizontal: 14,
            minWidth: 38,
            maxWidth: 120,
            alignItems: 'center',
            justifyContent: 'center',
            height: 36
          }}
          onPress={loadForecast}
          disabled={loading}
        >
          <Text style={{ color: themeColors.card, fontWeight: 'bold', fontSize: 13 }}>
            {loading ? 'Loading...' : 'Refresh'}
          </Text>
        </TouchableOpacity>
      </View>
      {error ? <Text style={[styles.placeholder, { color: themeColors.textSecondary }]}>{error}</Text> : null}
      {loading ? <ActivityIndicator size="small" color={themeColors.warning} /> : null}
      {!loading && forecast && (
        <>
          <Text style={{ fontSize: 16, marginBottom: 12, color: themeColors.text }}>
            At your child's current savings rate of <Text style={[styles.boldText, { color: themeColors.primary }]}>{forecast.dailySavingsRate} points per day</Text>,
            they will reach their goal "{forecast.goalName}" in approximately <Text style={[styles.boldText, { color: themeColors.primary }]}>{forecast.weeksToGoal} weeks</Text>.
          </Text>
          <View style={{ backgroundColor: themeColors.surface, padding: 12, borderRadius: 8, marginBottom: 10, borderColor: themeColors.border, borderWidth: 1 }}>
            <Text style={{ fontSize: 14, marginBottom: 6, color: themeColors.text }}>
              📊 <Text style={{ fontWeight: 'bold' }}>Goal Progress:</Text> {forecast.currentAmount} / {forecast.targetAmount} points
            </Text>
            <Text style={{ fontSize: 14, marginBottom: 6, color: themeColors.text }}>
              🎯 <Text style={{ fontWeight: 'bold' }}>Remaining:</Text> {forecast.remainingAmount} points needed
            </Text>
            <Text style={{ fontSize: 14, color: themeColors.text }}>
              📅 <Text style={{ fontWeight: 'bold' }}>Estimated Completion:</Text> {forecast.estimatedCompletion}
            </Text>
          </View>
          <Text style={{ color: themeColors.textSecondary, fontSize: 12, marginTop: 10 }}>
            Based on last 30 days of activity • Child: {forecast.name}
          </Text>
        </>
      )}
      {!loading && !forecast && (
        <Text style={[styles.placeholder, { color: themeColors.textSecondary }]}>
          No active savings goals or insufficient transaction history for forecasting.
        </Text>
      )}
    </View>
  );
};

const BehavioralInsights = () => {
  const { themeColors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<any>(null);
  const [error, setError] = useState('');

  const loadInsights = async () => {
    setLoading(true);
    setError('');
    try {
      const token = await getAuthToken();
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

      // Fetch transactions for analysis
      const transactions = await fetchTransactions(kid.id, token as any);

      // Get current month
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      // Filter transactions for current month
      const monthlyTransactions = transactions.filter((tx: any) => {
        const txDate = new Date(tx.createdAt || tx.date);
        return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
      });

      // Categorize transactions
      let earningPoints = 0;
      let spendingPoints = 0;

      monthlyTransactions.forEach((tx: any) => {
        const type = tx.type;
        const amount = Math.abs(tx.amount);

        // Earning categories: chore-completion, parent-points-adjustment (positive), goal-completion
        if (type === 'chore-completion' || type === 'parent-points-adjustment' && tx.amount > 0 || type === 'goal-completion') {
          earningPoints += amount;
        }
        // Spending categories: reward-purchase, points-move, goal-contribution (negative)
        else if (type === 'reward-purchase' || type === 'points-move' || (type === 'goal-contribution' && tx.amount < 0)) {
          spendingPoints += amount;
        }
      });

      const totalPoints = earningPoints + spendingPoints;
      const earningPercentage = totalPoints > 0 ? Math.round((earningPoints / totalPoints) * 100) : 0;
      const spendingPercentage = totalPoints > 0 ? Math.round((spendingPoints / totalPoints) * 100) : 0;

      setInsights({
        month: now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        earningPoints,
        spendingPoints,
        totalPoints,
        earningPercentage,
        spendingPercentage,
        transactionCount: monthlyTransactions.length,
        name: kid.name
      });
    } catch (_err: any) { // Changed to _err to fix linter warning
      setError('Failed to load insights');
    }
    setLoading(false);
  };

  React.useEffect(() => {
    loadInsights();
  }, []);

  return (
    <View style={[styles.sectionCard, { backgroundColor: themeColors.card, shadowColor: themeColors.border }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <View style={{flex: 1}}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>📈 Behavioral Insights</Text>
        </View>
        <TouchableOpacity
          style={{
            backgroundColor: themeColors.secondary,
            borderRadius: 6,
            paddingVertical: 7,
            paddingHorizontal: 14,
            minWidth: 38,
            maxWidth: 120,
            alignItems: 'center',
            justifyContent: 'center',
            height: 36
          }}
          onPress={loadInsights}
          disabled={loading}
        >
          <Text style={{ color: themeColors.card, fontWeight: 'bold', fontSize: 13 }}>
            {loading ? 'Loading...' : 'Refresh'}
          </Text>
        </TouchableOpacity>
      </View>
      {error ? <Text style={[styles.placeholder, { color: themeColors.textSecondary }]}>{error}</Text> : null}
      {loading ? <ActivityIndicator size="small" color={themeColors.secondary} /> : null}
      {!loading && insights && (
        <>
          <Text style={{ fontSize: 16, marginBottom: 12, color: themeColors.text }}>
            This month ({insights.month}), your child earned <Text style={[styles.boldText, { color: themeColors.primary }]}>{insights.earningPercentage}%</Text> of points
            and spent <Text style={[styles.boldText, { color: themeColors.primary }]}>{insights.spendingPercentage}%</Text> of points.
          </Text>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
            <View style={[styles.jarStat, { backgroundColor: themeColors.surface, borderColor: themeColors.success, borderWidth: 1, flex: 1, marginRight: 8 }]}>
              <Text style={{ fontSize: 14, fontWeight: 'bold', color: themeColors.text }}>💰 Earning</Text>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: themeColors.text }}>{insights.earningPoints}</Text>
              <Text style={{ fontSize: 12, color: themeColors.textSecondary }}>{insights.earningPercentage}%</Text>
            </View>
            <View style={[styles.jarStat, { backgroundColor: themeColors.surface, borderColor: themeColors.warning, borderWidth: 1, flex: 1, marginLeft: 8 }]}>
              <Text style={{ fontSize: 14, fontWeight: 'bold', color: themeColors.text }}>🛒 Spending</Text>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: themeColors.text }}>{insights.spendingPoints}</Text>
              <Text style={{ fontSize: 12, color: themeColors.textSecondary }}>{insights.spendingPercentage}%</Text>
            </View>
          </View>

          <View style={{ backgroundColor: themeColors.surface, padding: 10, borderRadius: 8, borderColor: themeColors.border, borderWidth: 1 }}>
            <Text style={{ fontSize: 14, color: themeColors.text }}>
              📊 <Text style={{ fontWeight: 'bold' }}>Total Activity:</Text> {insights.transactionCount} transactions • {insights.totalPoints} points
            </Text>
          </View>

          <Text style={{ color: themeColors.textSecondary, fontSize: 12, marginTop: 10 }}>
            Current month analysis • Child: {insights.name}
          </Text>
        </>
      )}
      {!loading && !insights && (
        <Text style={[styles.placeholder, { color: themeColors.textSecondary }]}>
          No transaction data available for behavioral analysis.
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  scroll: { backgroundColor: '#f7fafd' },
  container: { alignItems: 'center', paddingVertical: 12, paddingHorizontal: 6 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 22, marginTop: 6, color: '#194476' },
  exportSection: {
    backgroundColor: '#e9f7fd',
    borderRadius: 12,
    padding: 10,
    width: '97%',
    maxWidth: 520,
    marginBottom: 16
  },
  sectionCard: { backgroundColor: '#fff', borderRadius: 16, marginBottom: 16, padding: 16, minWidth: 320, width: '97%', maxWidth: 520, elevation: 3, shadowColor: '#aaa' },
  sectionTitle: { fontSize: 20, fontWeight: '600', marginBottom: 12, color: '#226' },
  placeholder: { color: '#999', fontStyle: 'italic', fontSize: 15, marginBottom: 8 },
  exportBtn: { backgroundColor: '#78d2eb', padding: 10, borderRadius: 8, marginVertical: 4, alignItems: 'center' },
  exportBtnText: { color: '#155674', fontWeight: '600', fontSize: 16 },
  statusMessage: { fontSize: 15, fontWeight: '600', color: '#159320', marginTop: 8, marginBottom: 16, textAlign: 'center', backgroundColor: '#e8f5e8', padding: 10, borderRadius: 8, width: '97%', maxWidth: 520 },
  analyticCard: { backgroundColor: "#e9f7fd", padding: 8, borderRadius: 7, marginRight: 6, marginBottom: 7, minWidth: 130, alignItems: "center" },
  jarStat: { backgroundColor: "#f4ecfe", borderRadius: 7, padding: 7, marginRight: 8, marginBottom: 7, minWidth: 90, alignItems: "center" },
  boldText: { fontWeight: "bold", color: "#154477" },
});
