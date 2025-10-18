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

  if (!data || data.length === 0) {
    return (
      <View style={{ padding: 16, alignItems: 'center' }}>
        <Text style={{ color: textColor, fontSize: 16 }}>No spending data available</Text>
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
      <Text style={{ color: textColor, fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>
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

  if (!data || data.length === 0) {
    return (
      <View style={{ padding: 16, alignItems: 'center' }}>
        <Text style={{ color: textColor, fontSize: 16 }}>No jar data available</Text>
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
        <Text style={{ color: textColor, fontSize: 16 }}>No funds in jars</Text>
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
      <Text style={{ color: textColor, fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>
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

  if (!data || data.length === 0) {
    return (
      <View style={{ padding: 16, alignItems: 'center' }}>
        <Text style={{ color: textColor, fontSize: 16 }}>No chore completion data available</Text>
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
      <Text style={{ color: textColor, fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>
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

  if (!data || data.length === 0) {
    return (
      <View style={{ padding: 16, alignItems: 'center' }}>
        <Text style={{ color: textColor, fontSize: 16 }}>No goals data available</Text>
      </View>
    );
  }

  // Create progress chart data
  const progressData = {
    labels: data.slice(0, 4).map((goal: any) => goal.goalName.substring(0, 6) + (goal.goalName.length > 6 ? '...' : '')),
    data: data.slice(0, 4).map((goal: any) => goal.progress / 100)
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
    }
  };

  return (
    <View style={{ padding: 16 }}>
      <Text style={{ color: textColor, fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>
        {title}
      </Text>
      <ProgressChart
        data={progressData}
        width={screenWidth - 32}
        height={height}
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

  if (!data || data.length === 0) {
    return (
      <View style={{ padding: 16, alignItems: 'center' }}>
        <Text style={{ color: textColor, fontSize: 16 }}>No category data available</Text>
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
      <Text style={{ color: textColor, fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>
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

// Helper functions for colors
function getJarColor(jarName: string): string {
  const colors = {
    'Pocket Money': '#4CAF50',
    'Savings Pot': '#2196F3',
    'Spending Pot': '#FF9800',
    'Help Others Pot': '#9C27B0',
    'Grow Money Pot': '#607D8B'
  };
  return colors[jarName as keyof typeof colors] || '#757575';
}

function getCategoryColor(category: string): string {
  const colors = {
    'Food': '#FF5722',
    'Entertainment': '#3F51B5',
    'Transportation': '#009688',
    'Shopping': '#E91E63',
    'Education': '#00BCD4',
    'General': '#9E9E9E'
  };
  return colors[category as keyof typeof colors] || '#757575';
}

export function AnalyticsChartsContainer({ analyticsData }: { analyticsData: any }) {
  if (!analyticsData) {
    return (
      <View style={{ padding: 16, alignItems: 'center' }}>
        <Text style={{ fontSize: 16, color: '#666' }}>Loading analytics data...</Text>
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
