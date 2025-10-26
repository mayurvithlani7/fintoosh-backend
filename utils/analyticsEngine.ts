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
  nextMonthSavingsPot: number;
  nextMonthSpendingPot: number;
  recommendations: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

export interface AnalyticsData {
  spendingTrends: TrendData[];
  choreCompletion: CompletionStats[];
  jarDistribution: JarAnalytics[];
  goalProgress: GoalMetrics[];
  predictions: PredictionData;
  familyMembers?: any[];
  rewards?: any[];
  realAllowances?: any[];
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

  const filteredTransactions = transactions.filter(t => {
    try {
      const transactionDate = new Date(t.createdAt);
      return !isNaN(transactionDate.getTime()) &&
             transactionDate >= cutoffDate &&
             t.type === 'spending' &&
             t.amount > 0;
    } catch {
      return false;
    }
  });

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
    .filter(t => {
      try {
        const transactionDate = new Date(t.createdAt);
        return !isNaN(transactionDate.getTime()) &&
               (t.type === 'chore-completion' || t.type === 'chore-completed') &&
               transactionDate >= cutoffDate;
      } catch {
        return false;
      }
    })
    .forEach(transaction => {
      const choreId = transaction.choreId || transaction.reference;
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

// Process jar distribution analytics for a single user
export function processJarDistribution(user: any, transactions: any[], days: number = 30): JarAnalytics[] {
  console.log('[JAR DISTRIBUTION DEBUG] Input user:', {
    id: user?.id,
    name: user?.name,
    currentPoints: user?.currentPoints,
    savePoints: user?.savePoints,
    spendPoints: user?.spendPoints,
    donatePoints: user?.donatePoints,
    investPoints: user?.investPoints
  });
  console.log('[JAR DISTRIBUTION DEBUG] Input transactions count:', transactions?.length || 0);
  if (transactions?.length > 0) {
    console.log('[JAR DISTRIBUTION DEBUG] Sample transaction:', transactions[0]);
  }

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const jarStats: { [jar: string]: { deposits: number; withdrawals: number; current: number } } = {
    current: { deposits: 0, withdrawals: 0, current: user?.currentPoints || 0 },
    save: { deposits: 0, withdrawals: 0, current: user?.savePoints || 0 },
    spend: { deposits: 0, withdrawals: 0, current: user?.spendPoints || 0 },
    donate: { deposits: 0, withdrawals: 0, current: user?.donatePoints || 0 },
    invest: { deposits: 0, withdrawals: 0, current: user?.investPoints || 0 }
  };

  console.log('[JAR DISTRIBUTION DEBUG] Initial jar stats:', jarStats);

  const recentTransactions = transactions.filter(t => {
    try {
      const transactionDate = new Date(t.createdAt);
      return !isNaN(transactionDate.getTime()) && transactionDate >= cutoffDate;
    } catch {
      return false;
    }
  });

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

// Process jar distribution analytics for entire family (aggregates balances across all family members)
export function processFamilyJarDistribution(familyMembers: any[], transactions: any[], days: number = 30): JarAnalytics[] {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  // Aggregate current balances across all family members
  const aggregatedBalances = {
    current: familyMembers.reduce((sum, member) => sum + (member.currentPoints || 0), 0),
    save: familyMembers.reduce((sum, member) => sum + (member.savePoints || 0), 0),
    spend: familyMembers.reduce((sum, member) => sum + (member.spendPoints || 0), 0),
    donate: familyMembers.reduce((sum, member) => sum + (member.donatePoints || 0), 0),
    invest: familyMembers.reduce((sum, member) => sum + (member.investPoints || 0), 0)
  };

  const jarStats: { [jar: string]: { deposits: number; withdrawals: number; current: number } } = {
    current: { deposits: 0, withdrawals: 0, current: aggregatedBalances.current },
    save: { deposits: 0, withdrawals: 0, current: aggregatedBalances.save },
    spend: { deposits: 0, withdrawals: 0, current: aggregatedBalances.spend },
    donate: { deposits: 0, withdrawals: 0, current: aggregatedBalances.donate },
    invest: { deposits: 0, withdrawals: 0, current: aggregatedBalances.invest }
  };

  const recentTransactions = transactions.filter(t => {
    try {
      const transactionDate = new Date(t.createdAt);
      return !isNaN(transactionDate.getTime()) && transactionDate >= cutoffDate;
    } catch {
      return false;
    }
  });

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
    // Check if goal is completed (multiple ways to detect completion)
    const isCompleted = goal.status === 'completed' ||
                       goal.completed === true ||
                       goal.achieved === true ||
                       (goal.currentAmount && goal.targetAmount && goal.currentAmount >= goal.targetAmount);

    // If completed, set progress to 100%
    const progressPercent = isCompleted ? 100 :
                           (goal.targetAmount > 0 ? (goal.currentAmount || 0) / goal.targetAmount * 100 : 0);

    let daysRemaining = 0;
    let projectedCompletion = isCompleted ? 'Completed' : 'On Track';

    if (goal.deadline && !isCompleted) {
      const deadline = new Date(goal.deadline);
      daysRemaining = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (daysRemaining > 0) {
        const currentAmount = goal.currentAmount || 0;
        const dailyNeeded = (goal.targetAmount - currentAmount) / daysRemaining;
        const currentDaily = currentAmount / Math.max(1, Math.ceil((now.getTime() - new Date(goal.createdAt).getTime()) / (1000 * 60 * 60 * 24)));

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
      targetAmount: goal.targetAmount,
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
  const spendingJar = jarDistribution.find(jar => jar.jarName === 'Spending Pot');
  const savingsRate = savingsJar ? (savingsJar.currentBalance / totalBalance) * 100 : 0;
  const savingsPotential = Math.round(totalBalance * 0.3); // Target 30% in savings
  const savingsPotAmount = savingsJar ? savingsJar.currentBalance : 0;
  const spendingPotAmount = spendingJar ? spendingJar.currentBalance : 0;

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

  // Predict next month balances using recent trends
  const recentDeposits = jarDistribution.map(jar => jar.totalDeposits).reduce((sum, dep) => sum + dep, 0);
  const recentWithdrawals = jarDistribution.map(jar => jar.totalWithdrawals).reduce((sum, wit) => sum + wit, 0);
  const monthlyGrowth = recentDeposits - recentWithdrawals;

  // Simple prediction: current balance + expected monthly growth, but never below current balance
  // If no recent activity, assume balance stays the same
  const savingsGrowth = monthlyGrowth > 0 ? monthlyGrowth * 0.4 : 0;
  const spendingGrowth = monthlyGrowth > 0 ? monthlyGrowth * 0.3 : 0;

  const nextMonthSavingsPot = Math.max(savingsJar?.currentBalance || 0, (savingsJar?.currentBalance || 0) + savingsGrowth);
  const nextMonthSpendingPot = Math.max(spendingJar?.currentBalance || 0, (spendingJar?.currentBalance || 0) + spendingGrowth);

  return {
    nextMonthSpending,
    nextMonthSavingsPot: Math.round(nextMonthSavingsPot),
    nextMonthSpendingPot: Math.round(nextMonthSpendingPot),
    recommendations: recommendations.length > 0 ? recommendations : ['Financial habits are on track!'],
    riskLevel
  };
}

// Fetch raw analytics data without processing
export async function fetchAnalyticsRawData(
  familyId: string,
  startDate?: string,
  endDate?: string
): Promise<any> {
  try {
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);

    // Get auth token from secure storage
    const { getAuthToken } = await import('./secureStorage');
    const token = await getAuthToken();

    const headers: { [key: string]: string } = {
      'Content-Type': 'application/json'
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    console.log('[ANALYTICS FRONTEND] Making request to:', `${API_URL}/analytics/family/${familyId}?${queryParams}`);
    console.log('[ANALYTICS FRONTEND] Headers:', headers);

    const response = await fetch(`${API_URL}/analytics/family/${familyId}?${queryParams}`, {
      headers
    });

    console.log('[ANALYTICS FRONTEND] Response status:', response.status);
    console.log('[ANALYTICS FRONTEND] Response ok:', response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[ANALYTICS FRONTEND] Error response:', errorText);
      throw new Error(`Failed to fetch analytics data: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const rawData = await response.json();

    // DEBUG: Print received user and transaction data for verification
    console.log('[ANALYTICS DEBUG] user:', rawData.user);
    console.log('[ANALYTICS DEBUG] familyMembers:', rawData.familyMembers);
    if (Array.isArray(rawData.transactions)) {
      console.log('[ANALYTICS DEBUG] transactions count:', rawData.transactions.length);
      if (rawData.transactions.length > 0) {
        console.log('[ANALYTICS DEBUG] sample transaction:', rawData.transactions[0]);
      }
    } else {
      console.log('[ANALYTICS DEBUG] transactions:', rawData.transactions);
    }

    return rawData;
  } catch (error) {
    console.error('Error fetching analytics raw data:', error);
    throw error;
  }
}

// Process raw analytics data into final format
export function processAnalyticsRawData(rawData: any): AnalyticsData {
  console.log('[ANALYTICS PROCESS] Raw data received:', {
    hasTransactions: !!rawData.transactions,
    hasChores: !!rawData.chores,
    hasGoals: !!rawData.goals,
    hasRewards: !!rawData.rewards,
    hasRealAllowances: !!rawData.realAllowances,
    rewardsLength: Array.isArray(rawData.rewards) ? rawData.rewards.length : 'not array',
    realAllowancesLength: Array.isArray(rawData.realAllowances) ? rawData.realAllowances.length : 'not array',
    rewards: rawData.rewards,
    realAllowances: rawData.realAllowances
  });

  // Validate and provide defaults for raw data
  const transactions = Array.isArray(rawData.transactions) ? rawData.transactions : [];
  const chores = Array.isArray(rawData.chores) ? rawData.chores : [];
  const goals = Array.isArray(rawData.goals) ? rawData.goals : [];
  const user = rawData.user || {};
  const familyMembers = Array.isArray(rawData.familyMembers) ? rawData.familyMembers : [];
  const rewards = Array.isArray(rawData.rewards) ? rawData.rewards : [];
  const realAllowances = Array.isArray(rawData.realAllowances) ? rawData.realAllowances : [];

  console.log('[ANALYTICS PROCESS] Processed rewards:', rewards);
  console.log('[ANALYTICS PROCESS] Processed realAllowances:', realAllowances);

  const spendingTrends = processSpendingTrends(transactions);
  const choreCompletion = processChoreCompletion(chores, transactions);
  const jarDistribution = processFamilyJarDistribution(familyMembers, transactions);
  const goalProgress = processGoalProgress(goals);
  const predictions = generatePredictions(spendingTrends, jarDistribution, goalProgress);

  const result = {
    spendingTrends,
    choreCompletion,
    jarDistribution,
    goalProgress,
    predictions,
    familyMembers: familyMembers,
    rewards: rewards,
    realAllowances: realAllowances
  };

  console.log('[ANALYTICS PROCESS] Final result rewards:', result.rewards);
  console.log('[ANALYTICS PROCESS] Final result realAllowances:', result.realAllowances);

  return result;
}

// Main analytics processing function (kept for backward compatibility)
export async function processAnalyticsData(
  familyId: string,
  startDate?: string,
  endDate?: string
): Promise<AnalyticsData> {
  const rawData = await fetchAnalyticsRawData(familyId, startDate, endDate);
  return processAnalyticsRawData(rawData);
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
    ['Next Month Savings Pot', data.predictions.nextMonthSavingsPot.toString()],
    ['Next Month Spending Pot', data.predictions.nextMonthSpendingPot.toString()],
    ['Risk Level', data.predictions.riskLevel],
    ['Recommendations', data.predictions.recommendations.join('; ')]
  ];

  return csvData.map(row => row.join(',')).join('\n');
}
