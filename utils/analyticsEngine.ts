import { API_URL } from './config';

export interface TrendData {
  date: string;
  amount: number;
  category: string;
}

export interface CompletionStats {
  choreName: string;
  completedCount: number;
  totalPoints: number;
  completionRate: number;
}

export interface JarAnalytics {
  jarName: string;
  currentBalance: number;
  totalDeposits: number;
  totalWithdrawals: number;
  growthRate: number;
}

export interface GoalMetrics {
  goalName: string;
  progress: number;
  targetAmount: number;
  daysRemaining: number;
  projectedCompletion: string;
}

export interface PredictionData {
  nextMonthSpending: number;
  savingsPotential: number;
  recommendations: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

export interface AnalyticsData {
  spendingTrends: TrendData[];
  choreCompletion: CompletionStats[];
  jarDistribution: JarAnalytics[];
  goalProgress: GoalMetrics[];
  predictions: PredictionData;
}

// Simple linear regression for trend prediction
function linearRegression(data: { x: number; y: number }[]): { slope: number; intercept: number } {
  const n = data.length;
  if (n < 2) return { slope: 0, intercept: 0 };

  const sumX = data.reduce((sum, point) => sum + point.x, 0);
  const sumY = data.reduce((sum, point) => sum + point.y, 0);
  const sumXY = data.reduce((sum, point) => sum + point.x * point.y, 0);
  const sumXX = data.reduce((sum, point) => sum + point.x * point.x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
}

// Calculate moving average for smoothing trends
function calculateMovingAverage(data: number[], windowSize: number = 7): number[] {
  const result: number[] = [];
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - windowSize + 1);
    const end = i + 1;
    const sum = data.slice(start, end).reduce((a, b) => a + b, 0);
    result.push(sum / (end - start));
  }
  return result;
}

// Process spending trends with categorization
export function processSpendingTrends(transactions: any[], days: number = 30): TrendData[] {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const filteredTransactions = transactions.filter(t =>
    new Date(t.createdAt) >= cutoffDate &&
    t.type === 'spending' &&
    t.amount > 0
  );

  const dailySpending: { [date: string]: number } = {};
  const categorySpending: { [date: string]: { [category: string]: number } } = {};

  filteredTransactions.forEach(transaction => {
    const date = new Date(transaction.createdAt).toISOString().split('T')[0];
    const category = transaction.category || 'General';

    if (!dailySpending[date]) {
      dailySpending[date] = 0;
      categorySpending[date] = {};
    }

    dailySpending[date] += transaction.amount;
    categorySpending[date][category] = (categorySpending[date][category] || 0) + transaction.amount;
  });

  // Convert to trend data with primary category
  return Object.entries(dailySpending).map(([date, amount]) => {
    const categories = categorySpending[date];
    const primaryCategory = Object.entries(categories)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'General';

    return {
      date,
      amount: Math.round(amount),
      category: primaryCategory
    };
  }).sort((a, b) => a.date.localeCompare(b.date));
}

// Process chore completion statistics
export function processChoreCompletion(chores: any[], transactions: any[], days: number = 30): CompletionStats[] {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const choreStats: { [choreId: string]: { completed: number; points: number; chore: any } } = {};

  // Initialize with all chores
  chores.forEach(chore => {
    choreStats[chore._id] = { completed: 0, points: 0, chore };
  });

  // Count completions from transactions
  transactions
    .filter(t => t.type === 'chore-completion' && new Date(t.createdAt) >= cutoffDate)
    .forEach(transaction => {
      const choreId = transaction.choreId;
      if (choreStats[choreId]) {
        choreStats[choreId].completed += 1;
        choreStats[choreId].points += transaction.amount || 0;
      }
    });

  return Object.values(choreStats).map(({ completed, points, chore }) => {
    const totalPossible = chore.frequency ? chore.frequency * (days / 7) : days; // Estimate based on frequency
    const completionRate = totalPossible > 0 ? (completed / totalPossible) * 100 : 0;

    return {
      choreName: chore.name,
      completedCount: completed,
      totalPoints: points,
      completionRate: Math.min(100, Math.round(completionRate))
    };
  }).sort((a, b) => b.totalPoints - a.totalPoints);
}

// Process jar distribution analytics
export function processJarDistribution(user: any, transactions: any[], days: number = 30): JarAnalytics[] {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const jarStats: { [jar: string]: { deposits: number; withdrawals: number; current: number } } = {
    current: { deposits: 0, withdrawals: 0, current: user.currentPoints || 0 },
    save: { deposits: 0, withdrawals: 0, current: user.savePoints || 0 },
    spend: { deposits: 0, withdrawals: 0, current: user.spendPoints || 0 },
    donate: { deposits: 0, withdrawals: 0, current: user.donatePoints || 0 },
    invest: { deposits: 0, withdrawals: 0, current: user.investPoints || 0 }
  };

  const recentTransactions = transactions.filter(t => new Date(t.createdAt) >= cutoffDate);

  recentTransactions.forEach(transaction => {
    if (transaction.toJar && jarStats[transaction.toJar]) {
      jarStats[transaction.toJar].deposits += transaction.amount;
    }
    if (transaction.fromJar && jarStats[transaction.fromJar]) {
      jarStats[transaction.fromJar].withdrawals += transaction.amount;
    }
  });

  const jarNames = {
    current: 'Pocket Money',
    save: 'Savings Pot',
    spend: 'Spending Pot',
    donate: 'Help Others Pot',
    invest: 'Grow Money Pot'
  };

  return Object.entries(jarStats).map(([jar, stats]) => {
    const previousBalance = stats.current - stats.deposits + stats.withdrawals;
    const growthRate = previousBalance > 0 ?
      ((stats.current - previousBalance) / previousBalance) * 100 : 0;

    return {
      jarName: jarNames[jar as keyof typeof jarNames],
      currentBalance: stats.current,
      totalDeposits: stats.deposits,
      totalWithdrawals: stats.withdrawals,
      growthRate: Math.round(growthRate * 100) / 100
    };
  });
}

// Process goal progress metrics
export function processGoalProgress(goals: any[]): GoalMetrics[] {
  const now = new Date();

  return goals.map(goal => {
    const progress = goal.currentAmount || 0;
    const target = goal.targetAmount;
    const progressPercent = target > 0 ? (progress / target) * 100 : 0;

    let daysRemaining = 0;
    let projectedCompletion = 'On Track';

    if (goal.deadline) {
      const deadline = new Date(goal.deadline);
      daysRemaining = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (daysRemaining > 0) {
        const dailyNeeded = (target - progress) / daysRemaining;
        const currentDaily = progress / Math.max(1, Math.ceil((now.getTime() - new Date(goal.createdAt).getTime()) / (1000 * 60 * 60 * 24)));

        if (dailyNeeded > currentDaily * 1.5) {
          projectedCompletion = 'Behind Schedule';
        } else if (dailyNeeded < currentDaily * 0.8) {
          projectedCompletion = 'Ahead of Schedule';
        }
      } else {
        projectedCompletion = 'Overdue';
      }
    }

    return {
      goalName: goal.name,
      progress: Math.round(progressPercent),
      targetAmount: target,
      daysRemaining: Math.max(0, daysRemaining),
      projectedCompletion
    };
  }).sort((a, b) => a.daysRemaining - b.daysRemaining);
}

// Generate predictive insights using simple ML algorithms
export function generatePredictions(
  spendingTrends: TrendData[],
  jarDistribution: JarAnalytics[],
  goalProgress: GoalMetrics[]
): PredictionData {
  // Predict next month spending using linear regression
  const spendingData = spendingTrends.map((trend, index) => ({
    x: index,
    y: trend.amount
  }));

  const regression = linearRegression(spendingData);
  const nextMonthSpending = Math.max(0, Math.round(regression.slope * spendingData.length + regression.intercept));

  // Calculate savings potential based on current jar distribution
  const totalBalance = jarDistribution.reduce((sum, jar) => sum + jar.currentBalance, 0);
  const savingsJar = jarDistribution.find(jar => jar.jarName === 'Savings Pot');
  const savingsRate = savingsJar ? (savingsJar.currentBalance / totalBalance) * 100 : 0;
  const savingsPotential = Math.round(totalBalance * 0.3); // Target 30% in savings

  // Generate recommendations
  const recommendations: string[] = [];

  if (savingsRate < 20) {
    recommendations.push('Consider increasing savings rate to 20-30% of total balance');
  }

  if (nextMonthSpending > spendingTrends.slice(-7).reduce((sum, t) => sum + t.amount, 0) / 7 * 1.2) {
    recommendations.push('Spending trend indicates potential budget concerns next month');
  }

  const overdueGoals = goalProgress.filter(g => g.projectedCompletion === 'Overdue');
  if (overdueGoals.length > 0) {
    recommendations.push(`Focus on ${overdueGoals.length} overdue goal(s) to maintain momentum`);
  }

  // Determine risk level
  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  if (recommendations.length >= 3 || savingsRate < 10) {
    riskLevel = 'high';
  } else if (recommendations.length >= 2 || nextMonthSpending > spendingTrends.slice(-7).reduce((sum, t) => sum + t.amount, 0) / 7 * 1.1) {
    riskLevel = 'medium';
  }

  return {
    nextMonthSpending,
    savingsPotential,
    recommendations: recommendations.length > 0 ? recommendations : ['Financial habits are on track!'],
    riskLevel
  };
}

// Main analytics processing function
export async function processAnalyticsData(
  familyId: string,
  startDate?: string,
  endDate?: string
): Promise<AnalyticsData> {
  try {
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);

    const response = await fetch(`${API_URL}/api/analytics/family/${familyId}?${queryParams}`);
    if (!response.ok) {
      throw new Error('Failed to fetch analytics data');
    }

    const rawData = await response.json();

    const spendingTrends = processSpendingTrends(rawData.transactions);
    const choreCompletion = processChoreCompletion(rawData.chores, rawData.transactions);
    const jarDistribution = processJarDistribution(rawData.user, rawData.transactions);
    const goalProgress = processGoalProgress(rawData.goals);
    const predictions = generatePredictions(spendingTrends, jarDistribution, goalProgress);

    return {
      spendingTrends,
      choreCompletion,
      jarDistribution,
      goalProgress,
      predictions
    };
  } catch (error) {
    console.error('Error processing analytics data:', error);
    throw error;
  }
}

// Export data for reports
export function exportAnalyticsData(data: AnalyticsData): string {
  const csvData = [
    ['Analytics Report', new Date().toLocaleDateString()],
    [''],
    ['Spending Trends'],
    ['Date', 'Amount', 'Category'],
    ...data.spendingTrends.map(trend => [trend.date, trend.amount.toString(), trend.category]),
    [''],
    ['Chore Completion'],
    ['Chore Name', 'Completed Count', 'Total Points', 'Completion Rate (%)'],
    ...data.choreCompletion.map(chore => [
      chore.choreName,
      chore.completedCount.toString(),
      chore.totalPoints.toString(),
      chore.completionRate.toString()
    ]),
    [''],
    ['Jar Distribution'],
    ['Jar Name', 'Current Balance', 'Total Deposits', 'Total Withdrawals', 'Growth Rate (%)'],
    ...data.jarDistribution.map(jar => [
      jar.jarName,
      jar.currentBalance.toString(),
      jar.totalDeposits.toString(),
      jar.totalWithdrawals.toString(),
      jar.growthRate.toString()
    ]),
    [''],
    ['Goal Progress'],
    ['Goal Name', 'Progress (%)', 'Target Amount', 'Days Remaining', 'Projected Completion'],
    ...data.goalProgress.map(goal => [
      goal.goalName,
      goal.progress.toString(),
      goal.targetAmount.toString(),
      goal.daysRemaining.toString(),
      goal.projectedCompletion
    ]),
    [''],
    ['Predictions'],
    ['Next Month Spending', data.predictions.nextMonthSpending.toString()],
    ['Savings Potential', data.predictions.savingsPotential.toString()],
    ['Risk Level', data.predictions.riskLevel],
    ['Recommendations', data.predictions.recommendations.join('; ')]
  ];

  return csvData.map(row => row.join(',')).join('\n');
}
