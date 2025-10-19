import React from 'react';
import { Dimensions, ScrollView, Text, View } from 'react-native';
import {
  BarChart,
  LineChart,
  PieChart,
  ProgressChart
} from 'react-native-chart-kit';
import { useThemeColor } from '../hooks/use-theme-color';
import { TrendData } from '../utils/analyticsEngine';

const screenWidth = Dimensions.get('window').width;

interface ChartProps {
  data: any;
  title: string;
  height?: number;
}

export function SpendingTrendsChart({ data, title = "Spending Trends", height = 220 }: ChartProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');

  // Guaranteed high-contrast colors
  const isDarkMode = backgroundColor === '#000000';
  const mainTextColor = isDarkMode ? '#ffffff' : '#000000';

  if (!data || data.length === 0) {
    return (
      <View style={{ padding: 16, alignItems: 'center' }}>
        <Text style={{ color: mainTextColor, fontSize: 16 }}>No spending data available</Text>
      </View>
    );
  }

  // Prepare data for line chart
  const chartData = {
    labels: data.slice(-7).map((item: TrendData) => {
      const date = new Date(item.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }),
    datasets: [{
      data: data.slice(-7).map((item: TrendData) => item.amount),
      color: (opacity = 1) => tintColor,
      strokeWidth: 2
    }],
    legend: ["Daily Spending"]
  };

  const chartConfig = {
    backgroundColor: backgroundColor,
    backgroundGradientFrom: backgroundColor,
    backgroundGradientTo: backgroundColor,
    decimalPlaces: 0,
    color: (opacity = 1) => textColor,
    labelColor: (opacity = 1) => textColor,
    style: {
      borderRadius: 16
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: tintColor
    }
  };

  return (
    <View style={{ padding: 16 }}>
      <Text style={{ color: mainTextColor, fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>
        {title}
      </Text>
      <LineChart
        data={chartData}
        width={screenWidth - 32}
        height={height}
        chartConfig={chartConfig}
        bezier
        style={{
          marginVertical: 8,
          borderRadius: 16
        }}
      />
    </View>
  );
}

export function JarDistributionPie({ data, title = "Money Jar Distribution", height = 220 }: ChartProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');

  // Guaranteed high-contrast colors
  const isDarkMode = backgroundColor === '#000000';
  const mainTextColor = isDarkMode ? '#ffffff' : '#000000';

  if (!data || data.length === 0) {
    return (
      <View style={{ padding: 16, alignItems: 'center' }}>
        <Text style={{ color: mainTextColor, fontSize: 16 }}>No jar data available</Text>
      </View>
    );
  }

  // Prepare data for pie chart
  const chartData = data.map((jar: any, index: number) => ({
    name: jar.jarName,
    balance: jar.currentBalance,
    color: getJarColor(jar.jarName),
    legendFontColor: textColor,
    legendFontSize: 12
  })).filter((item: any) => item.balance > 0);

  if (chartData.length === 0) {
    return (
      <View style={{ padding: 16, alignItems: 'center' }}>
        <Text style={{ color: mainTextColor, fontSize: 16 }}>No funds in jars</Text>
      </View>
    );
  }

  const chartConfig = {
    backgroundColor: backgroundColor,
    backgroundGradientFrom: backgroundColor,
    backgroundGradientTo: backgroundColor,
    color: (opacity = 1) => textColor,
    labelColor: (opacity = 1) => textColor,
    propsForLabels: {
      fontSize: 12
    }
  };

  return (
    <View style={{ padding: 16 }}>
      <Text style={{ color: mainTextColor, fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>
        {title}
      </Text>
      <PieChart
        data={chartData}
        width={screenWidth - 32}
        height={height}
        chartConfig={chartConfig}
        accessor="balance"
        backgroundColor="transparent"
        paddingLeft="15"
        absolute
      />
    </View>
  );
}

export function ChoreCompletionHeatmap({ data, title = "Chore Completion Activity", height = 220 }: ChartProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');

  // Guaranteed high-contrast colors
  const isDarkMode = backgroundColor === '#000000';
  const mainTextColor = isDarkMode ? '#ffffff' : '#000000';

  if (!data || data.length === 0) {
    return (
      <View style={{ padding: 16, alignItems: 'center' }}>
        <Text style={{ color: mainTextColor, fontSize: 16 }}>No chore completion data available</Text>
      </View>
    );
  }

  // Create a simple bar chart showing completion rates
  const chartData = {
    labels: data.slice(0, 5).map((chore: any) => chore.choreName.substring(0, 8) + (chore.choreName.length > 8 ? '...' : '')),
    datasets: [{
      data: data.slice(0, 5).map((chore: any) => chore.completionRate)
    }]
  };

  const chartConfig = {
    backgroundColor: backgroundColor,
    backgroundGradientFrom: backgroundColor,
    backgroundGradientTo: backgroundColor,
    decimalPlaces: 0,
    color: (opacity = 1) => tintColor,
    labelColor: (opacity = 1) => textColor,
    style: {
      borderRadius: 16
    },
    propsForLabels: {
      fontSize: 10
    },
    yAxisLabel: '',
    yAxisSuffix: '%'
  };

  return (
    <View style={{ padding: 16 }}>
      <Text style={{ color: mainTextColor, fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>
        {title}
      </Text>
      <BarChart
        data={chartData}
        width={screenWidth - 32}
        height={height}
        chartConfig={chartConfig}
        yAxisLabel=""
        yAxisSuffix="%"
        showValuesOnTopOfBars
        style={{
          marginVertical: 8,
          borderRadius: 16
        }}
      />
    </View>
  );
}

export function GoalProgressTimeline({ data, title = "Goal Progress Overview", height = 220 }: ChartProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');

  // Guaranteed high-contrast colors
  const isDarkMode = backgroundColor === '#000000';
  const mainTextColor = isDarkMode ? '#ffffff' : '#000000';

  if (!data || data.length === 0) {
    return (
      <View style={{ padding: 16, alignItems: 'center' }}>
        <Text style={{ color: mainTextColor, fontSize: 16 }}>No goals data available</Text>
      </View>
    );
  }

  // Create progress chart data - limit to 3 goals for better mobile display
  const progressData = {
    labels: data.slice(0, 3).map((goal: any) => goal.goalName.length > 8 ? goal.goalName.substring(0, 8) + '...' : goal.goalName),
    data: data.slice(0, 3).map((goal: any) => Math.min(1, Math.max(0, goal.progress / 100))) // Ensure 0-1 range
  };

  const chartConfig = {
    backgroundColor: backgroundColor,
    backgroundGradientFrom: backgroundColor,
    backgroundGradientTo: backgroundColor,
    decimalPlaces: 0,
    color: (opacity = 1) => tintColor,
    labelColor: (opacity = 1) => mainTextColor,
    style: {
      borderRadius: 16
    }
  };

  return (
    <View style={{ padding: 16 }}>
      <Text style={{ color: mainTextColor, fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>
        {title}
      </Text>

      {/* Progress bars for individual goals */}
      <View style={{ marginBottom: 16 }}>
        {data.slice(0, 3).map((goal: any, index: number) => (
          <View key={index} style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ color: mainTextColor, fontSize: 14, fontWeight: '600' }}>
                {goal.goalName.length > 15 ? goal.goalName.substring(0, 15) + '...' : goal.goalName}
              </Text>
              <Text style={{ color: mainTextColor, fontSize: 12 }}>
                {goal.progress}%
              </Text>
            </View>
            <View style={{
              height: 8,
              backgroundColor: isDarkMode ? '#333333' : '#e0e0e0',
              borderRadius: 4,
              overflow: 'hidden'
            }}>
              <View style={{
                height: '100%',
                width: `${Math.min(100, Math.max(0, goal.progress))}%`,
                backgroundColor: tintColor,
                borderRadius: 4
              }} />
            </View>
          </View>
        ))}
      </View>

      {/* Overall progress chart */}
      <ProgressChart
        data={progressData}
        width={Math.min(screenWidth - 32, 400)}
        height={Math.min(height, 180)}
        chartConfig={chartConfig}
        hideLegend={false}
        style={{
          marginVertical: 8,
          borderRadius: 16
        }}
      />
    </View>
  );
}

export function SpendingCategoryBreakdown({ data, title = "Spending by Category", height = 220 }: ChartProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');

  // Guaranteed high-contrast colors
  const isDarkMode = backgroundColor === '#000000';
  const mainTextColor = isDarkMode ? '#ffffff' : '#000000';

  if (!data || data.length === 0) {
    return (
      <View style={{ padding: 16, alignItems: 'center' }}>
        <Text style={{ color: mainTextColor, fontSize: 16 }}>No category data available</Text>
      </View>
    );
  }

  // Group by category
  const categoryTotals: { [key: string]: number } = {};
  data.forEach((item: TrendData) => {
    categoryTotals[item.category] = (categoryTotals[item.category] || 0) + item.amount;
  });

  const chartData = Object.entries(categoryTotals).map(([category, amount]) => ({
    name: category,
    amount,
    color: getCategoryColor(category),
    legendFontColor: textColor,
    legendFontSize: 12
  }));

  const chartConfig = {
    backgroundColor: backgroundColor,
    backgroundGradientFrom: backgroundColor,
    backgroundGradientTo: backgroundColor,
    color: (opacity = 1) => textColor,
    labelColor: (opacity = 1) => textColor,
    propsForLabels: {
      fontSize: 12
    }
  };

  return (
    <View style={{ padding: 16 }}>
      <Text style={{ color: mainTextColor, fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>
        {title}
      </Text>
      <PieChart
        data={chartData}
        width={screenWidth - 32}
        height={height}
        chartConfig={chartConfig}
        accessor="amount"
        backgroundColor="transparent"
        paddingLeft="15"
        absolute
      />
    </View>
  );
}

// Helper functions for theme-aware colors
function getJarColor(jarName: string): string {
  const backgroundColor = useThemeColor({}, 'background');
  const isDarkMode = backgroundColor === '#000000';

  const colors = isDarkMode ? {
    'Pocket Money': '#4ade80',    // Light green for dark mode
    'Savings Pot': '#4a9eff',     // Light blue for dark mode
    'Spending Pot': '#fb923c',    // Light orange for dark mode
    'Help Others Pot': '#fbbf24', // Light yellow for dark mode
    'Grow Money Pot': '#c084fc'   // Light purple for dark mode
  } : {
    'Pocket Money': '#16a34a',    // Dark green for light mode
    'Savings Pot': '#2563eb',     // Dark blue for light mode
    'Spending Pot': '#ea580c',    // Dark orange for light mode
    'Help Others Pot': '#ca8a04',  // Dark yellow for light mode
    'Grow Money Pot': '#a855f7'   // Dark purple for light mode
  };
  return colors[jarName as keyof typeof colors] || (isDarkMode ? '#888888' : '#666666');
}

function getCategoryColor(category: string): string {
  const backgroundColor = useThemeColor({}, 'background');
  const isDarkMode = backgroundColor === '#000000';

  const colors = isDarkMode ? {
    'Food': '#f87171',         // Light red for dark mode
    'Entertainment': '#60a5fa', // Light blue for dark mode
    'Transportation': '#34d399', // Light green for dark mode
    'Shopping': '#f472b6',      // Light pink for dark mode
    'Education': '#38bdf8',     // Light cyan for dark mode
    'General': '#9ca3af'        // Light gray for dark mode
  } : {
    'Food': '#dc2626',         // Dark red for light mode
    'Entertainment': '#1d4ed8', // Dark blue for light mode
    'Transportation': '#059669', // Dark green for light mode
    'Shopping': '#db2777',      // Dark pink for light mode
    'Education': '#0891b2',     // Dark cyan for light mode
    'General': '#6b7280'        // Dark gray for light mode
  };
  return colors[category as keyof typeof colors] || (isDarkMode ? '#888888' : '#666666');
}

export function AnalyticsChartsContainer({ analyticsData }: { analyticsData: any }) {
  const backgroundColor = useThemeColor({}, 'background');
  const isDarkMode = backgroundColor === '#000000';
  const mainTextColor = isDarkMode ? '#ffffff' : '#000000';
  const secondaryTextColor = isDarkMode ? '#cccccc' : '#666666';

  if (!analyticsData) {
    return (
      <View style={{ padding: 16, alignItems: 'center' }}>
        <Text style={{ fontSize: 16, color: secondaryTextColor }}>Loading analytics data...</Text>
      </View>
    );
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <SpendingTrendsChart
        data={analyticsData.spendingTrends}
        title="Spending Trends (Last 7 Days)"
      />

      <JarDistributionPie
        data={analyticsData.jarDistribution}
        title="Money Jar Distribution"
      />

      <SpendingCategoryBreakdown
        data={analyticsData.spendingTrends}
        title="Spending by Category"
      />

      <ChoreCompletionHeatmap
        data={analyticsData.choreCompletion}
        title="Chore Completion Rates"
      />

      <GoalProgressTimeline
        data={analyticsData.goalProgress}
        title="Goal Progress Overview"
      />
    </ScrollView>
  );
}
