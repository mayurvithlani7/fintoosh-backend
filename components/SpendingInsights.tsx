import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useThemeColor } from '../hooks/use-theme-color';
import { usePredictions } from '../hooks/useAnalytics';

interface SpendingInsightsProps {
  onExport?: () => void;
  onRefresh?: () => void | Promise<void>;
}

export function SpendingInsights({ onExport, onRefresh }: SpendingInsightsProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');

  const { predictions, riskColor, riskText, loading, error } = usePredictions();

  // Guaranteed high-contrast colors
  const isDarkMode = backgroundColor === '#000000';
  const mainTextColor = isDarkMode ? '#ffffff' : '#000000';
  const secondaryTextColor = isDarkMode ? '#cccccc' : '#666666';
  const surfaceColor = isDarkMode ? '#1a1a1a' : '#f5f5f5';
  const cardBackgroundColor = backgroundColor;

  if (loading) {
    return (
      <View style={{ padding: 16 }}>
        <Text style={{ color: mainTextColor, fontSize: 16 }}>Loading insights...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ padding: 16 }}>
        <Text style={{ color: mainTextColor, fontSize: 16 }}>Error loading insights: {error}</Text>
      </View>
    );
  }

  if (!predictions) {
    return (
      <View style={{ padding: 16 }}>
        <Text style={{ color: mainTextColor, fontSize: 16 }}>No insights available</Text>
      </View>
    );
  }

  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Text style={{ color: mainTextColor, fontSize: 20, fontWeight: 'bold' }}>
          AI Financial Insights
        </Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {onRefresh && (
            <TouchableOpacity
              onPress={onRefresh}
              style={{ padding: 8, backgroundColor: tintColor, borderRadius: 6 }}
            >
              <Text style={{ color: backgroundColor, fontSize: 14, fontWeight: '600' }}>
                Refresh
              </Text>
            </TouchableOpacity>
          )}
          {onExport && (
            <TouchableOpacity
              onPress={onExport}
              style={{ padding: 8, backgroundColor: tintColor, borderRadius: 6 }}
            >
              <Text style={{ color: backgroundColor, fontSize: 14, fontWeight: '600' }}>
                Export
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Risk Level Indicator */}
      <View style={{ marginBottom: 16 }}>
        <Text style={{ color: mainTextColor, fontSize: 16, fontWeight: '600', marginBottom: 8 }}>
          Financial Health Status
        </Text>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: 12,
          backgroundColor: riskColor + '20',
          borderRadius: 8,
          borderLeftWidth: 4,
          borderLeftColor: riskColor
        }}>
          <Text style={{
            color: riskColor,
            fontSize: 18,
            fontWeight: 'bold',
            marginRight: 8
          }}>
            {riskText}
          </Text>
          <Text style={{ color: mainTextColor, fontSize: 14 }}>
            {predictions.riskLevel === 'low' && 'Your financial habits are on track!'}
            {predictions.riskLevel === 'medium' && 'Some areas need attention to optimize savings.'}
            {predictions.riskLevel === 'high' && 'Action needed to improve financial health.'}
          </Text>
        </View>
      </View>

      {/* Key Metrics */}
      <View style={{ marginBottom: 16 }}>
        <Text style={{ color: mainTextColor, fontSize: 16, fontWeight: '600', marginBottom: 12 }}>
          Key Projections
        </Text>
        <View style={{ gap: 12 }}>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 12,
            backgroundColor: surfaceColor,
            borderRadius: 8
          }}>
            <Text style={{ color: mainTextColor, fontSize: 14 }}>Next Month Savings Pot</Text>
            <Text style={{ color: mainTextColor, fontSize: 16, fontWeight: '600' }}>
              ₹{predictions.nextMonthSavingsPot.toLocaleString()}
            </Text>
          </View>

          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 12,
            backgroundColor: surfaceColor,
            borderRadius: 8
          }}>
            <Text style={{ color: mainTextColor, fontSize: 14 }}>Next Month Spending Pot</Text>
            <Text style={{ color: mainTextColor, fontSize: 16, fontWeight: '600' }}>
              ₹{predictions.nextMonthSpendingPot.toLocaleString()}
            </Text>
          </View>
        </View>
      </View>

      {/* Recommendations */}
      <View style={{ marginBottom: 16 }}>
        <Text style={{ color: mainTextColor, fontSize: 16, fontWeight: '600', marginBottom: 12 }}>
          Personalized Recommendations
        </Text>
        <ScrollView style={{ maxHeight: 200 }}>
          {predictions.recommendations.map((recommendation, index) => (
            <View
              key={index}
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                padding: 12,
                marginBottom: 8,
                backgroundColor: surfaceColor,
                borderRadius: 8,
                borderLeftWidth: 3,
                borderLeftColor: tintColor
              }}
            >
              <Text style={{
                color: tintColor,
                fontSize: 16,
                fontWeight: 'bold',
                marginRight: 8,
                marginTop: -2
              }}>
                •
              </Text>
              <Text style={{
                color: mainTextColor,
                fontSize: 14,
                flex: 1,
                lineHeight: 20
              }}>
                {recommendation}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Educational Tips */}
      <View>
        <Text style={{ color: mainTextColor, fontSize: 16, fontWeight: '600', marginBottom: 12 }}>
          Financial Education Tips
        </Text>
        <View style={{
          padding: 12,
          backgroundColor: surfaceColor,
          borderRadius: 8,
          borderLeftWidth: 3,
          borderLeftColor: '#4CAF50'
        }}>
          <Text style={{
            color: mainTextColor,
            fontSize: 14,
            lineHeight: 20
          }}>
            💡 <Text style={{ fontWeight: '600' }}>Pro Tip:</Text> The 50/30/20 rule suggests spending 50% on needs, 30% on wants, and saving 20%. Adjust your jar allocations to work toward this goal for better financial health.
          </Text>
        </View>
      </View>
    </View>
  );
}

export function SpendingInsightsCard({ analyticsData, onExport, onRefresh }: {
  analyticsData: any;
  onExport?: () => void;
  onRefresh?: () => void | Promise<void>;
}) {
  if (!analyticsData) {
    return (
      <View style={{ padding: 16, alignItems: 'center' }}>
        <Text style={{ fontSize: 16, color: '#666' }}>No analytics data available</Text>
      </View>
    );
  }

  return (
    <SpendingInsights
      onExport={onExport}
      onRefresh={onRefresh}
    />
  );
}
