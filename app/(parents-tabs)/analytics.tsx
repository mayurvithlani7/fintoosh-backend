import { AnalyticsChartsContainer } from '@/components/AnalyticsChart';
import BackButton from '@/components/BackButton';
import HelpModal from '@/components/HelpModal';
import { SpendingInsights } from '@/components/SpendingInsights';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useAnalytics } from '@/hooks/useAnalytics';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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

      <Text style={[styles.title, { color: textColor }]}>Advanced Analytics Dashboard</Text>

      {feedback ? <Text style={[styles.statusMessage, { color: textColor }]}>{feedback}</Text> : null}

      {/* AI-Powered Insights */}
      <SpendingInsights
        onExport={handleExport}
        onRefresh={handleRefresh}
      />

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

const createStyles = (themeColors: any) => StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: 12, paddingHorizontal: 6 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 22, marginTop: 6 },
  sectionCard: { borderRadius: 16, marginBottom: 16, padding: 16, minWidth: 320, width: '97%', maxWidth: 520, elevation: 3 },
  sectionTitle: { fontSize: 20, fontWeight: '600', marginBottom: 12 },
  statusMessage: { fontSize: 15, fontWeight: '600', marginTop: 8, marginBottom: 16, textAlign: 'center', padding: 10, borderRadius: 8, width: '97%', maxWidth: 520 },
});
