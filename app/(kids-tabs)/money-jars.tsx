import AnimatedCircularProgress from '@/components/animations/AnimatedCircularProgress';
import AnimatedCounter from '@/components/animations/AnimatedCounter';
import HelpModal from '@/components/HelpModal';
import { RupeeDenominations } from '@/components/RupeeDenominations';
import { TYPOGRAPHY, getContrastRatio } from '@/constants/theme';
import { useCenteredMessage } from '@/utils/centeredMessageContext';
import { API_URL } from '@/utils/config';
import { InterestRuleType, useCurrency } from '@/utils/currencyContext';
import { handleApiError } from '@/utils/errorHandler';
import { MOBILE_LAYOUT, MOBILE_STYLES } from '@/utils/mobileLayout';
import { getAuthToken, getUserData } from '@/utils/secureStorage';
import { useTheme } from '@/utils/themeContext';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

// Utility function to get optimal text color based on background
const getOptimalTextColor = (backgroundColor: string): string => {
  try {
    // Check contrast with white text
    const whiteContrast = getContrastRatio(backgroundColor, '#FFFFFF');
    // Check contrast with dark text
    const darkContrast = getContrastRatio(backgroundColor, '#000000');

    // Return white if it has better contrast, otherwise dark
    return whiteContrast > darkContrast ? '#FFFFFF' : '#000000';
  } catch (error) {
    // Fallback to white text if contrast calculation fails
    return '#FFFFFF';
  }
};

// Enhanced Jar Card with Progress Rings
const EnhancedJarCard = ({ jar, totalPoints, goals }: {
  jar: any;
  totalPoints: number;
  goals: any[];
}) => {
  const { themeColors } = useTheme();

  const getProgressData = () => {
    let progress: number;
    let color: string;
    let label: string;
    let showRing: boolean;

    switch (jar.key) {
      case 'current':
        // Pocket money spending limit (assume 30% of total)
        const limit = totalPoints * 0.3;
        const usage = limit > 0 ? (jar.value / limit) * 100 : 0;
        progress = Math.min(usage, 100);
        color = usage > 80 ? themeColors.warning : themeColors.success;
        label = limit > 0 ? `${Math.round(usage)}% of limit` : 'No spending limit set';
        showRing = true;
        break;
      case 'save':
        // Savings goal progress
        const savingsGoals = goals.filter(g => g.type === 'savings');
        const target = savingsGoals.reduce((sum, g) => sum + (g.targetAmount || 0), 0);
        progress = target > 0 ? (jar.value / target) * 100 : 0;
        progress = Math.min(progress, 100);
        color = themeColors.primary;
        label = target > 0 ? `Goal: ${Math.round(progress)}%` : 'Set a savings goal!';
        showRing = target > 0;
        break;
      case 'spend':
        // Spending pot budget utilization
        const budget = totalPoints * 0.15; // Assume 15% for spending
        const utilization = budget > 0 ? (jar.value / budget) * 100 : 0;
        progress = Math.min(utilization, 100);
        color = utilization > 70 ? themeColors.warning : themeColors.accent;
        label = budget > 0 ? `${Math.round(utilization)}% budget used` : 'Fun spending pot!';
        showRing = true;
        break;
      case 'donate':
        // Donation milestones
        const milestones = [50, 100, 200, 500];
        const currentMilestone = milestones.find(m => jar.value < m) || milestones[milestones.length - 1];
        progress = currentMilestone > 0 ? (jar.value / currentMilestone) * 100 : 100;
        progress = Math.min(progress, 100);
        color = themeColors.secondary;
        label = jar.value > 0 ? `${jar.value}/${currentMilestone} to next level!` : 'Start donating!';
        showRing = jar.value > 0;
        break;
      case 'invest':
        // Investment growth potential
        const growth = jar.value * 0.05; // Assume 5% monthly growth
        progress = jar.value > 0 ? 75 : 0; // Show potential when invested
        progress = Math.min(progress, 100);
        color = themeColors.success;
        label = jar.value > 0 ? `Growing: +${Math.round(growth)}/month` : 'Start investing!';
        showRing = jar.value > 0;
        break;
      default:
        progress = 0;
        color = themeColors.border;
        label = '';
        showRing = false;
    }

    return { progress, color, label, showRing };
  };

  const progressData = getProgressData();

  return (
    <View style={[{
      minWidth: 85,
      alignItems: "center",
      padding: 8,
      borderRadius: 8,
      margin: 8,
      borderWidth: 1,
      borderColor: themeColors.border,
      backgroundColor: jar.color || themeColors.surface,
      position: 'relative' as any,
      overflow: 'hidden' as any,
    }]}>
      {/* Progress Ring Background - positioned first so it appears behind */}
      {progressData.showRing && (
        <View style={{
          position: 'absolute' as any,
          top: 4,
          left: 4,
          right: 4,
          bottom: 4,
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 0,
        }}>
          <AnimatedCircularProgress
            size={70}
            width={4}
            fill={progressData.progress}
            tintColor={progressData.color}
            backgroundColor="transparent"
            rotation={-90}
          />
        </View>
      )}

      {/* Jar Content - positioned on top */}
      <View style={{
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
        paddingVertical: 8,
      }}>
        <Text style={{
          ...TYPOGRAPHY.h2,
          marginBottom: 3,
          zIndex: 2,
        }}>{jar.icon}</Text>
        <AnimatedCounter value={jar.value} fontSize={TYPOGRAPHY.h3.fontSize} color={getOptimalTextColor(jar.color)} />
        <Text style={{
          ...TYPOGRAPHY.label,
          marginBottom: 2,
          color: getOptimalTextColor(jar.color), // Dynamic text color for contrast
          textAlign: 'center',
        }}>{jar.label}</Text>

        {/* Progress Label */}
        {progressData.label && (
          <View style={{
            backgroundColor: themeColors.surface + '90',
            borderRadius: 6,
            paddingHorizontal: 6,
            paddingVertical: 2,
            marginTop: 2,
            zIndex: 2,
          }}>
            <Text style={{
              ...TYPOGRAPHY.caption,
              textAlign: 'center',
              color: progressData.color,
            }}>
              {progressData.label}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

// Transfer Status Timeline Component
const TransferTimeline = ({ requests, router }: { requests: any[]; router: any }) => {
  const { themeColors } = useTheme();

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          icon: '⏳',
          color: themeColors.warning,
          text: 'Waiting for approval',
          description: 'Your parent is reviewing your request'
        };
      case 'approved':
        return {
          icon: '✅',
          color: themeColors.success,
          text: 'Transfer complete!',
          description: 'Points moved successfully'
        };
      case 'rejected':
        return {
          icon: '❌',
          color: themeColors.error,
          text: 'Request declined',
          description: 'Check with your parent for details'
        };
      default:
        return {
          icon: '📤',
          color: themeColors.textSecondary,
          text: 'Submitted',
          description: 'Request sent successfully'
        };
    }
  };

  return (
    <View style={{
      borderRadius: 14,
      marginBottom: 16,
      padding: 18,
      minWidth: 300,
      width: "97%",
      maxWidth: 520,
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      backgroundColor: themeColors.surface
    }}>
      <Text style={{
        ...TYPOGRAPHY.h4,
        marginBottom: 16,
        textAlign: 'center',
        color: themeColors.primary
      }}>📋 Recent Transfers</Text>

      {requests.length === 0 ? (
        <Text style={{
          ...TYPOGRAPHY.body,
          textAlign: 'center',
          color: themeColors.textSecondary,
          fontStyle: 'italic'
        }}>
          No transfer requests yet. Try moving some points!
        </Text>
      ) : (
        requests.slice(0, 3).map((request, index) => {
          const status = getStatusConfig(request.status);
          return (
            <View key={request._id || index} style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 12,
              borderRadius: 8,
              marginBottom: 8,
              backgroundColor: themeColors.card,
              borderWidth: 1,
              borderColor: themeColors.border
            }}>
              <View style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: status.color + '20',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12
              }}>
                <Text style={{ ...TYPOGRAPHY.h4 }}>{status.icon}</Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={{
                  ...TYPOGRAPHY.body,
                  color: themeColors.text
                }}>
                  Move {request.amount} points
                </Text>
                <Text style={{
                  ...TYPOGRAPHY.label,
                  color: status.color
                }}>
                  {status.text}
                </Text>
                <Text style={{
                  ...TYPOGRAPHY.caption,
                  color: themeColors.textSecondary
                }}>
                  {new Date(request.createdAt || request.date).toLocaleDateString()}
                </Text>
              </View>

              {request.status === 'approved' && (
                <View style={{
                  backgroundColor: themeColors.success,
                  borderRadius: 12,
                  paddingHorizontal: 8,
                  paddingVertical: 4
                }}>
                  <Text style={{
                    ...TYPOGRAPHY.caption,
                    color: themeColors.card
                  }}>Approved!</Text>
                </View>
              )}
            </View>
          );
        })
      )}

      {requests.length > 3 && (
        <TouchableOpacity
          style={{
            backgroundColor: themeColors.primary,
            borderRadius: 8,
            paddingVertical: 12,
            paddingHorizontal: 16,
            alignItems: 'center',
            marginTop: 8
          }}
          onPress={() => router.push('./requests')}
        >
          <Text style={{
            ...TYPOGRAPHY.button,
            color: themeColors.card
          }}>View All Transfers →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// Smart Allocation Coach Component
const AllocationCoach = ({ jars, router, scrollToMovePoints, expanded, onToggle }: {
  jars: any[];
  router: any;
  scrollToMovePoints?: () => void;
  expanded: boolean;
  onToggle: () => void;
}) => {
  const { themeColors } = useTheme();

  const getAllocationInsights = () => {
    const total = jars.reduce((sum, jar) => sum + jar.value, 0);
    if (total === 0) return { current: {}, ideal: {}, recommendations: [] };

    const current = jars.reduce((acc, jar) => {
      acc[jar.key] = (jar.value / total) * 100;
      return acc;
    }, {} as any);

    // Ideal allocations based on age/financial literacy level
    const ideal = {
      current: 30, // Pocket money for immediate needs
      save: 40,    // Savings for goals
      spend: 15,   // Discretionary spending
      donate: 10,  // Charitable giving
      invest: 5    // Long-term investing
    };

    const recommendations = [];
    if (current.save < ideal.save) {
      recommendations.push({
        type: 'savings',
        message: 'Consider moving more to Savings for your goals!',
        action: 'Boost Savings',
        icon: '🐷'
      });
    }
    if (current.current > ideal.current) {
      recommendations.push({
        type: 'spending',
        message: 'You have plenty for spending - save some for later!',
        action: 'Save More',
        icon: '💰'
      });
    }
    if (current.spend > ideal.spend) {
      recommendations.push({
        type: 'balance',
        message: 'Try balancing your spending with saving!',
        action: '',
        icon: '⚖️'
      });
    }

    return { current, ideal, recommendations };
  };

  const insights = getAllocationInsights();

  return (
    <TouchableOpacity
      style={{
        borderRadius: 14,
        marginBottom: 16,
        padding: 18,
        minWidth: 300,
        width: "97%",
        maxWidth: 520,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        backgroundColor: themeColors.surface
      }}
      onPress={onToggle}
      accessibilityRole="button"
      accessibilityLabel={expanded ? "Collapse allocation coach" : "Expand allocation coach"}
      accessibilityHint="Show or hide smart money allocation suggestions"
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <Text style={{
            ...TYPOGRAPHY.bodyLarge,
            marginBottom: expanded ? 16 : 0,
            color: themeColors.primary
          }}>
            🎯 Smart Allocation Coach
          </Text>

          {!expanded && (
            <Text style={{
              ...TYPOGRAPHY.label,
              color: themeColors.textSecondary,
              marginTop: 4
            }}>
              Get personalized tips for your money pots
            </Text>
          )}

          {expanded && (
            <>
              {/* Current vs Ideal Comparison - Simplified Bar Chart */}
              <View style={{ marginBottom: 16 }}>
                <Text style={{
                  ...TYPOGRAPHY.label,
                  marginBottom: 12,
                  color: themeColors.text
                }}>Your Current Balance:</Text>
                {jars.map(jar => {
                  const percentage = insights.current[jar.key] || 0;
                  return (
                    <View key={jar.key} style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      marginBottom: 6,
                    }}>
                <Text style={{
                  ...TYPOGRAPHY.bodyLarge,
                  marginRight: 8,
                  width: 25,
                  textAlign: 'center'
                }}>{jar.icon}</Text>
                <Text style={{
                  ...TYPOGRAPHY.bodySmall,
                  flex: 1,
                  color: themeColors.text
                }}>{jar.label.replace(' Pot', '')}</Text>
                <View style={{
                  flex: 2,
                  height: 6,
                  backgroundColor: themeColors.border,
                  borderRadius: 3,
                  marginHorizontal: 8,
                  overflow: 'hidden',
                }}>
                  <View
                    style={{
                      height: '100%',
                      width: `${percentage}%`,
                      borderRadius: 3,
                      backgroundColor: '#D2691E' // Orange/brown color for better visibility
                    }}
                  />
                </View>
                <Text style={{
                  ...TYPOGRAPHY.caption,
                  width: 30,
                  textAlign: 'right',
                  color: themeColors.text
                }}>
                  {Math.round(percentage)}%
                </Text>
                    </View>
                  );
                })}
              </View>

              {/* Recommendations */}
              {insights.recommendations.length > 0 && (
                <View style={{ marginBottom: 16 }}>
                  <Text style={{
                    ...TYPOGRAPHY.label,
                    marginBottom: 8,
                    color: themeColors.text
                  }}>
                    💡 Smart Suggestions:
                  </Text>
                  {insights.recommendations.slice(0, 2).map((rec, index) => (
                    <View
                      key={index}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        padding: 10,
                        borderRadius: 6,
                        marginBottom: 6,
                        backgroundColor: themeColors.card,
                        borderWidth: 1,
                        borderColor: themeColors.border
                      }}
                    >
                      <Text style={{
                        ...TYPOGRAPHY.h4,
                        marginRight: 10,
                      }}>{rec.icon}</Text>
                      <Text style={{
                        flex: 1,
                        ...TYPOGRAPHY.bodySmall,
                        color: themeColors.text
                      }}>
                        {rec.message}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Quick Actions */}
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                gap: 8,
              }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    paddingHorizontal: 14,
                    borderRadius: 6,
                    alignItems: 'center',
                    elevation: 1,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 2,
                    backgroundColor: themeColors.secondary
                  }}
                  onPress={scrollToMovePoints}
                >
                  <Text style={{
                    ...TYPOGRAPHY.bodySmall,
                    color: themeColors.card
                  }}>⚖️ Balance</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    paddingHorizontal: 14,
                    borderRadius: 6,
                    alignItems: 'center',
                    elevation: 1,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 2,
                    backgroundColor: themeColors.success
                  }}
                  onPress={() => router.push('./goals')}
                >
                  <Text style={{
                    ...TYPOGRAPHY.bodySmall,
                    color: themeColors.card
                  }}>🎯 Goals</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
        <Text style={{ ...TYPOGRAPHY.body, color: themeColors.primary, marginLeft: 8 }}>
          {expanded ? '▲' : '▼'}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const createStyles = (themeColors: any) => StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    paddingVertical: MOBILE_LAYOUT.sectionSpacing,
    paddingHorizontal: MOBILE_LAYOUT.containerPadding,
    backgroundColor: themeColors.background,
  },
  title: {
    ...TYPOGRAPHY.h2,
    color: themeColors.primary,
    marginBottom: MOBILE_LAYOUT.sectionSpacing,
    marginTop: MOBILE_LAYOUT.itemSpacing,
  },
  sectionCard: {
    ...MOBILE_STYLES.card,
    backgroundColor: themeColors.card,
    borderColor: themeColors.border,
    marginBottom: MOBILE_LAYOUT.sectionSpacing,
    width: MOBILE_LAYOUT.containerWidth,
  },
  sectionTitle: {
    ...TYPOGRAPHY.body,
    marginBottom: MOBILE_LAYOUT.itemSpacing,
    color: themeColors.text,
  },
  jarBox: {
    minWidth: 85,
    alignItems: "center",
    backgroundColor: themeColors.surface,
    padding: 8,
    borderRadius: 8,
    margin: 8,
    borderWidth: 1,
    borderColor: themeColors.border,
  },
  jarLabel: {
    ...TYPOGRAPHY.body,
    marginBottom: 2,
    color: '#F59E0B',
  },
  jarPoints: {
    ...TYPOGRAPHY.h2,
    marginBottom: 1,
    color: '#FFFFFF', // White text for contrast on dark jar backgrounds
  },
  formRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  formGroup: { flex: 1, marginHorizontal: 4 },
  inputLabel: {
    ...TYPOGRAPHY.label,
    marginBottom: 4,
    color: themeColors.text,
  },
  input: {
    borderWidth: 1,
    borderColor: themeColors.border,
    borderRadius: 7,
    padding: 8,
    ...TYPOGRAPHY.body,
    marginBottom: 2,
    backgroundColor: themeColors.surface,
    color: themeColors.text,
  },
  webSelect: {
    width: "100%",
    minHeight: 38,
    borderRadius: 7,
    borderColor: themeColors.border,
    borderWidth: 1,
    ...TYPOGRAPHY.body,
    padding: 8,
    marginTop: 1,
    backgroundColor: themeColors.surface,
    color: themeColors.text,
  } as any,
    formBtn: { backgroundColor: themeColors.warning, padding: 14, borderRadius: 8, marginTop: 7, marginHorizontal: 4, alignSelf: "flex-end" },
    formBtnText: { ...TYPOGRAPHY.bodySmall, color: themeColors.text },
  // Allocation Coach Styles (updated to use TYPOGRAPHY)
  coachTitle: {
    ...TYPOGRAPHY.bodyLarge,
    marginBottom: 16,
    textAlign: 'center',
  },
  chartTitle: {
    ...TYPOGRAPHY.label,
    marginBottom: 12,
    textAlign: 'center',
  },
  jarEmoji: {
    ...TYPOGRAPHY.bodyLarge,
    marginRight: 8,
    width: 30,
    textAlign: 'center',
  },
  jarName: {
    ...TYPOGRAPHY.bodySmall,
    flex: 1,
  },
  percentage: {
    ...TYPOGRAPHY.caption,
    width: 35,
    textAlign: 'right',
  },
  recommendationsTitle: {
    ...TYPOGRAPHY.label,
    marginBottom: 8,
  },
  recommendationIcon: {
    ...TYPOGRAPHY.h4,
    marginRight: 12,
  },
  recommendationText: {
    ...TYPOGRAPHY.bodySmall,
    flex: 1,
  },
  recommendationAction: {
    ...TYPOGRAPHY.bodySmall,
  },
  quickActionText: {
    ...TYPOGRAPHY.bodySmall,
  },
  placeholder: { color: themeColors.textSecondary, fontStyle: "italic", ...TYPOGRAPHY.bodySmall, marginBottom: 2, marginTop: 2, minHeight: 26 },
  statusMessage: { ...TYPOGRAPHY.bodySmall, marginTop: 3, color: themeColors.success },
});

export default function MoneyJarsScreen() {
  const { themeColors } = useTheme();
  const { showMessage } = useCenteredMessage();
  const styles = createStyles(themeColors);
  const { formatAmount, showDenominations, convertToINR, interestRule } = useCurrency();
  const scrollViewRef = useRef<ScrollView>(null);
  const [jars, setJars] = useState<any[]>([
    { label: 'Pocket Money', key: 'current', value: 0, color: themeColors.jarColors.current, icon: '💰' },
    { label: 'Savings Pot', key: 'save', value: 0, color: themeColors.jarColors.save, icon: '🐷' },
    { label: 'Spending Pot', key: 'spend', value: 0, color: themeColors.jarColors.spend, icon: '🛒' },
    { label: 'Help Others Pot', key: 'donate', value: 0, color: themeColors.jarColors.donate, icon: '🤲' },
    { label: 'Grow Money Pot', key: 'invest', value: 0, color: themeColors.jarColors.invest, icon: '📈' }
  ]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [optimisticRequests, setOptimisticRequests] = useState<any[]>([]);
  const [transferRequests, setTransferRequests] = useState<any[]>([]);
  const [helpModalVisible, setHelpModalVisible] = useState(false);
  const [coachExpanded, setCoachExpanded] = useState(false);
  const [budgetExpanded, setBudgetExpanded] = useState(false);
  const [charityExpanded, setCharityExpanded] = useState(false);
  const router = useRouter();

  const scrollToMovePoints = () => {
    // Scroll to the Move Points section (approximately 850 pixels from top)
    // This positions the Move Points form in view instead of scrolling to the end
    scrollViewRef.current?.scrollTo({ y: 850, animated: true });
  };

  const loadUserData = async (showErrors = true) => {
    console.log('🔄 Money Jars: Starting loadUserData...');
    try {
      const token = await getAuthToken();
      const user = await getUserData();

      console.log('🔄 Money Jars: Token exists:', !!token, 'User exists:', !!user);

      if (!token || !user) {
        console.log('🔄 Money Jars: Missing token or user data');
        if (showErrors) {
          showMessage('Not authenticated. Please login again.', 'error');
        }
        return;
      }
      const userId = user.id;

      console.log('🔄 Money Jars: Fetching data for user:', userId);

      // Use simple fetch to avoid CORS issues
      const response = await fetch(`${API_URL}/users/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('🔄 Money Jars: API response status:', response.status);

      if (!response.ok) {
        console.log('🔄 Money Jars: API call failed with status:', response.status);
        if (showErrors) {
          const { showMessage } = useCenteredMessage();
          await handleApiError(response, { showError: (msg) => showMessage(msg, 'error'), feature: 'Money Jars - User Data' });
        }
        return;
      }

      const freshUserData = await response.json();

      console.log('🔄 Money Jars: Raw API response:', freshUserData);

      // Validate that we have numeric values for points
      const validatePoints = (value: any) => {
        const num = Number(value);
        return isNaN(num) ? 0 : Math.max(0, num);
      };

      const jarData = [
        {
          label: 'Pocket Money',
          key: 'current',
          value: validatePoints(freshUserData.currentPoints) - validatePoints(freshUserData.pendingCurrentPoints),
          totalValue: validatePoints(freshUserData.currentPoints),
          pendingValue: validatePoints(freshUserData.pendingCurrentPoints),
          color: themeColors.jarColors.current,
          icon: '💰'
        },
        {
          label: 'Savings Pot',
          key: 'save',
          value: validatePoints(freshUserData.savePoints) - validatePoints(freshUserData.pendingSavePoints),
          totalValue: validatePoints(freshUserData.savePoints),
          pendingValue: validatePoints(freshUserData.pendingSavePoints),
          color: themeColors.jarColors.save,
          icon: '🐷'
        },
        {
          label: 'Spending Pot',
          key: 'spend',
          value: validatePoints(freshUserData.spendPoints) - validatePoints(freshUserData.pendingSpendPoints),
          totalValue: validatePoints(freshUserData.spendPoints),
          pendingValue: validatePoints(freshUserData.pendingSpendPoints),
          color: themeColors.jarColors.spend,
          icon: '🛒'
        },
        {
          label: 'Help Others Pot',
          key: 'donate',
          value: validatePoints(freshUserData.donatePoints) - validatePoints(freshUserData.pendingDonatePoints),
          totalValue: validatePoints(freshUserData.donatePoints),
          pendingValue: validatePoints(freshUserData.pendingDonatePoints),
          color: themeColors.jarColors.donate,
          icon: '🤲'
        },
        {
          label: 'Grow Money Pot',
          key: 'invest',
          value: validatePoints(freshUserData.investPoints) - validatePoints(freshUserData.pendingInvestPoints),
          totalValue: validatePoints(freshUserData.investPoints),
          pendingValue: validatePoints(freshUserData.pendingInvestPoints),
          color: themeColors.jarColors.invest,
          icon: '📈'
        }
      ];

      console.log('🔄 Money Jars: Setting jar data:', jarData);

      setJars(jarData);

      console.log('Loaded user points:', {
        current: validatePoints(freshUserData.currentPoints),
        save: validatePoints(freshUserData.savePoints),
        spend: validatePoints(freshUserData.spendPoints),
        donate: validatePoints(freshUserData.donatePoints),
        invest: validatePoints(freshUserData.investPoints)
      });

    } catch (error) {
      console.error('Error loading user data:', error);
      if (showErrors) {
        showMessage('Failed to load user data. Please try again.', 'error');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      console.log('🔄 Money Jars: loadUserData completed');
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadUserData();
      loadTransferRequests();
    }, [])
  );

  const loadTransferRequests = async () => {
    try {
      const token = await getAuthToken();
      const user = await getUserData();

      if (!token || !user) return;

      const userId = user.id;

      console.log('Loading transfer requests for user:', userId);

      // Use the child-specific endpoint that allows children to view their own requests
      const response = await fetch(`${API_URL}/my-requests`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('API response status:', response.status);

      if (response.ok) {
        const requests = await response.json();
        console.log('Loaded requests:', requests);
        setTransferRequests(requests);
      } else {
        console.log('Failed to load requests:', response.statusText);
        // For now, set empty array if we can't load requests
        setTransferRequests([]);
      }
    } catch (error) {
      console.error('Error loading transfer requests:', error);
      setTransferRequests([]);
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadUserData(false);
    await loadTransferRequests();
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: themeColors.background }]}>
        <Text style={styles.title}>Loading...</Text>
      </View>
  );
}

/**
 * Expandable Budget Section - Expandable wrapper for budget creation
 */
function ExpandableBudgetSection({ expanded, onToggle, onBudgetCreated }: {
  expanded: boolean;
  onToggle: () => void;
  onBudgetCreated: () => void;
}) {
  const { themeColors } = useTheme();

  return (
    <TouchableOpacity
      style={{
        borderRadius: 14,
        marginBottom: 16,
        padding: 18,
        minWidth: 300,
        width: "97%",
        maxWidth: 520,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        backgroundColor: themeColors.surface
      }}
      onPress={onToggle}
      accessibilityRole="button"
      accessibilityLabel={expanded ? "Collapse budget creation" : "Expand budget creation"}
      accessibilityHint="Show or hide budget creation options"
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <Text style={{
            ...TYPOGRAPHY.bodyLarge,
            marginBottom: expanded ? 16 : 0,
            color: themeColors.primary
          }}>
            🎯 Create Money Budget
          </Text>

          {!expanded && (
            <Text style={{
              ...TYPOGRAPHY.label,
              color: themeColors.textSecondary,
              marginTop: 4
            }}>
              Set spending limits to learn responsible money management
            </Text>
          )}

          {expanded && <BudgetCreationSection onBudgetCreated={onBudgetCreated} />}
        </View>
        <Text style={{ ...TYPOGRAPHY.body, color: themeColors.primary, marginLeft: 8 }}>
          {expanded ? '▲' : '▼'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

/**
 * Expandable Charity Section - Expandable wrapper for charity donations
 */
function ExpandableCharitySection({ jars, expanded, onToggle, onDonationMade }: {
  jars: any[];
  expanded: boolean;
  onToggle: () => void;
  onDonationMade: () => void;
}) {
  const { themeColors } = useTheme();

  return (
    <TouchableOpacity
      style={{
        borderRadius: 14,
        marginBottom: 16,
        padding: 18,
        minWidth: 300,
        width: "97%",
        maxWidth: 520,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        backgroundColor: themeColors.surface
      }}
      onPress={onToggle}
      accessibilityRole="button"
      accessibilityLabel={expanded ? "Collapse charity donation" : "Expand charity donation"}
      accessibilityHint="Show or hide charity donation options"
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <Text style={{
            ...TYPOGRAPHY.bodyLarge,
            marginBottom: expanded ? 16 : 0,
            color: themeColors.secondary
          }}>
            ❤️ Make a Donation
          </Text>

          {!expanded && (
            <Text style={{
              ...TYPOGRAPHY.label,
              color: themeColors.textSecondary,
              marginTop: 4
            }}>
              Share your points to help others and support causes
            </Text>
          )}

          {expanded && <CharityDonationSection jars={jars} onDonationMade={onDonationMade} />}
        </View>
        <Text style={{ ...TYPOGRAPHY.body, color: themeColors.secondary, marginLeft: 8 }}>
          {expanded ? '▲' : '▼'}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

/**
 * Budget Creation Section - Kids can create spending budgets for their jars
 */
function BudgetCreationSection({ onBudgetCreated }: { onBudgetCreated: () => void }) {
  const { themeColors } = useTheme();
  const { showMessage } = useCenteredMessage();
  const [isCreating, setIsCreating] = useState(false);
  const [jarKey, setJarKey] = useState('');
  const [budgetAmount, setBudgetAmount] = useState('');
  const [budgetPeriod, setBudgetPeriod] = useState('weekly');
  const [budgetNote, setBudgetNote] = useState('');

  const jarOptions = [
    { key: 'current', label: 'Pocket Money', icon: '💰', description: 'Daily spending money' },
    { key: 'spend', label: 'Spending Pot', icon: '🛒', description: 'Fun purchases and treats' },
    { key: 'donate', label: 'Help Others Pot', icon: '🤲', description: 'Money for giving to others' }
  ];

  const periodOptions = [
    { key: 'daily', label: 'Daily', description: 'Reset every day' },
    { key: 'weekly', label: 'Weekly', description: 'Reset every week' },
    { key: 'monthly', label: 'Monthly', description: 'Reset every month' }
  ];

  const handleCreateBudget = async () => {
    if (!jarKey || !budgetAmount || !budgetPeriod) {
      showMessage('Please fill in all fields', 'error');
      return;
    }

    const amount = parseInt(budgetAmount);
    if (amount <= 0 || amount > 10000) {
      showMessage('Budget amount must be between 1 and 10,000 points', 'error');
      return;
    }

    setIsCreating(true);
    try {
      const token = await getAuthToken();
      const user = await getUserData();

      if (!token || !user) {
        showMessage('Not authenticated', 'error');
        return;
      }

      const requestData = {
        userId: user.id,
        type: 'budget-create',
        name: `Create ${budgetPeriod} budget for ${jarOptions.find(j => j.key === jarKey)?.label}`,
        amount: amount,
        jar: jarKey,
        period: budgetPeriod,
        reason: budgetNote || `Setting a ${budgetPeriod} spending limit to learn responsible money management`,
        budgetAmount: amount,
        budgetPeriod: budgetPeriod,
        budgetJar: jarKey
      };

      const response = await fetch(`${API_URL}/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        showMessage(errorData.message || 'Failed to create budget request', 'error');
        return;
      }

      // Update achievement for budget creation
      try {
        const { updateAchievementProgress } = await import('../../components/AchievementSystem');
        await updateAchievementProgress('budget-planner', 1);
      } catch (error) {
        console.error('Error updating budget achievement:', error);
      }

      showMessage('Budget creation request sent to parent! 🎯', 'success');
      setJarKey('');
      setBudgetAmount('');
      setBudgetPeriod('weekly');
      setBudgetNote('');
      onBudgetCreated();

    } catch (error) {
      console.error('Error creating budget:', error);
      showMessage('Network error. Please try again.', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <View style={{
      borderRadius: 14,
      marginBottom: 16,
      padding: 18,
      minWidth: 300,
      width: "97%",
      maxWidth: 520,
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      backgroundColor: themeColors.surface
    }}>
      <Text style={{
        ...TYPOGRAPHY.bodyLarge,
        marginBottom: 16,
        color: themeColors.primary,
        textAlign: 'center'
      }}>🎯 Create Money Budget</Text>

      <Text style={{
        ...TYPOGRAPHY.label,
        color: themeColors.textSecondary,
        textAlign: 'center',
        marginBottom: 20
      }}>
        Set spending limits to learn responsible money management! 🧠💰
      </Text>

      {/* Jar Selection */}
      <Text style={{
        ...TYPOGRAPHY.label,
        marginBottom: 8,
        color: themeColors.text
      }}>Which pot should have a budget?</Text>

      <View style={{ marginBottom: 16 }}>
        {jarOptions.map((jar) => (
          <TouchableOpacity
            key={jar.key}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 12,
              borderRadius: 8,
              marginBottom: 8,
              borderWidth: 2,
              borderColor: jarKey === jar.key ? themeColors.primary : themeColors.border,
              backgroundColor: jarKey === jar.key ? themeColors.primary + '15' : themeColors.card
            }}
            onPress={() => setJarKey(jar.key)}
          >
            <Text style={{ ...TYPOGRAPHY.h2, marginRight: 12 }}>{jar.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{
                ...TYPOGRAPHY.body,
                color: themeColors.text
              }}>
                {jar.label}
              </Text>
              <Text style={{
                ...TYPOGRAPHY.caption,
                color: themeColors.textSecondary
              }}>
                {jar.description}
              </Text>
            </View>
            {jarKey === jar.key && (
              <Text style={{ ...TYPOGRAPHY.h4, color: themeColors.primary }}>✓</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Budget Amount */}
      <View style={{ marginBottom: 16 }}>
        <Text style={{
          ...TYPOGRAPHY.label,
          marginBottom: 8,
          color: themeColors.text
        }}>Budget Amount (points):</Text>
        <TextInput
          style={{
            borderWidth: 1,
            borderColor: themeColors.border,
            borderRadius: 8,
            padding: 12,
            ...TYPOGRAPHY.body,
            backgroundColor: themeColors.surface,
            color: themeColors.text
          }}
          placeholder="e.g., 500"
          value={budgetAmount}
          onChangeText={(text) => setBudgetAmount(text.replace(/[^0-9]/g, ''))}
          keyboardType="numeric"
          maxLength={5}
          placeholderTextColor={themeColors.textSecondary}
        />
      </View>

      {/* Budget Period */}
      <View style={{ marginBottom: 16 }}>
        <Text style={{
          ...TYPOGRAPHY.label,
          marginBottom: 8,
          color: themeColors.text
        }}>Budget Period:</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {periodOptions.map((period) => (
            <TouchableOpacity
              key={period.key}
              style={{
                flex: 1,
                padding: 12,
                borderRadius: 8,
                borderWidth: 2,
                borderColor: budgetPeriod === period.key ? themeColors.secondary : themeColors.border,
                backgroundColor: budgetPeriod === period.key ? themeColors.secondary + '15' : themeColors.card,
                alignItems: 'center'
              }}
              onPress={() => setBudgetPeriod(period.key)}
            >
              <Text style={{
                ...TYPOGRAPHY.label,
                color: budgetPeriod === period.key ? themeColors.secondary : themeColors.text
              }}>
                {period.label}
              </Text>
              <Text style={{
                ...TYPOGRAPHY.caption,
                color: themeColors.textSecondary,
                textAlign: 'center'
              }}>
                {period.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Budget Note */}
      <View style={{ marginBottom: 20 }}>
        <Text style={{
          ...TYPOGRAPHY.label,
          marginBottom: 8,
          color: themeColors.text
        }}>Why this budget? (Optional):</Text>
        <TextInput
          style={{
            borderWidth: 1,
            borderColor: themeColors.border,
            borderRadius: 8,
            padding: 12,
            ...TYPOGRAPHY.label,
            backgroundColor: themeColors.surface,
            color: themeColors.text,
            minHeight: 60,
            textAlignVertical: 'top'
          }}
          placeholder="e.g., To save for a special toy or learn to control spending"
          value={budgetNote}
          onChangeText={setBudgetNote}
          multiline
          maxLength={200}
          placeholderTextColor={themeColors.textSecondary}
        />
      </View>

      {/* Create Budget Button */}
      <TouchableOpacity
        style={{
          backgroundColor: isCreating ? themeColors.surface : themeColors.primary,
          borderRadius: 12,
          paddingVertical: 16,
          alignItems: 'center',
          elevation: 3,
          shadowColor: themeColors.primary,
          shadowOpacity: 0.3,
          shadowRadius: 4
        }}
        onPress={handleCreateBudget}
        disabled={isCreating}
      >
        <Text style={{
          color: isCreating ? themeColors.textSecondary : themeColors.card,
          ...TYPOGRAPHY.button
        }}>
          {isCreating ? '⏳ Creating Budget...' : '🎯 Create Budget Plan'}
        </Text>
      </TouchableOpacity>

      <Text style={{
        ...TYPOGRAPHY.caption,
        color: themeColors.textSecondary,  
        textAlign: 'center',
        marginTop: 12,
        fontStyle: 'italic'
      }}>
        Your parent will review and approve your budget plan! 📝✅
      </Text>
    </View>
  );
}

/**
 * Charity Donation Section - Kids can donate points from their jars to causes
 */
function CharityDonationSection({ jars, onDonationMade }: { jars: any[], onDonationMade: () => void }) {
  const { themeColors } = useTheme();
  const { showMessage } = useCenteredMessage();
  const [isDonating, setIsDonating] = useState(false);
  const [fromJar, setFromJar] = useState('');
  const [donationAmount, setDonationAmount] = useState('');
  const [cause, setCause] = useState('');
  const [donationNote, setDonationNote] = useState('');

  const donationCauses = [
    { key: 'animals', label: 'Animal Shelter 🐾', description: 'Help animals find homes and care' },
    { key: 'environment', label: 'Save Nature 🌱', description: 'Protect our planet and wildlife' },
    { key: 'education', label: 'School Supplies 📚', description: 'Help kids learn and grow' },
    { key: 'food', label: 'Food for Families 🍽️', description: 'Provide meals for those in need' },
    { key: 'health', label: 'Medical Help ⚕️', description: 'Support healthcare for communities' },
    { key: 'other', label: 'Other Cause 🤝', description: 'Any cause that helps people' }
  ];

  // Get jars that have points available for donation
  const availableJars = jars.filter(jar => jar.value > 0 && jar.key !== 'invest'); // Can't donate from invest jar

  const handleMakeDonation = async () => {
    if (!fromJar || !donationAmount || !cause) {
      showMessage('Please fill in all required fields', 'error');
      return;
    }

    const amount = parseInt(donationAmount);
    if (amount <= 0) {
      showMessage('Donation amount must be greater than 0', 'error');
      return;
    }

    const selectedJar = jars.find(j => j.key === fromJar);
    if (!selectedJar || selectedJar.value < amount) {
      showMessage('Not enough points in selected jar', 'error');
      return;
    }

    setIsDonating(true);
    try {
      const token = await getAuthToken();
      const user = await getUserData();

      if (!token || !user) {
        showMessage('Not authenticated', 'error');
        return;
      }

      const selectedCause = donationCauses.find(c => c.key === cause);

      // Create donation request for parent approval (let backend handle pending points)
      const requestData = {
        userId: user.id,
        type: 'donation',
        name: `Donate ${amount} points to ${selectedCause?.label}`,
        amount: amount,
        from: fromJar,
        to: 'donate', // Points will be moved to donate jar for actual donation
        cause: cause,
        reason: donationNote || `Making a donation to help ${selectedCause?.description.toLowerCase()}`,
        donationAmount: amount,
        donationCause: cause,
        donationNote: donationNote
      };

      const response = await fetch(`${API_URL}/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        showMessage(errorData.message || 'Failed to submit donation request', 'error');
        return;
      }

      // Update local state to show pending points immediately for better UX
      setJars(jars.map(jar =>
        jar.key === fromJar
          ? {
              ...jar,
              value: jar.value - amount,
              pendingValue: (jar.pendingValue || 0) + amount,
              totalValue: jar.totalValue // totalValue remains the same until approved
            }
          : jar
      ));

      // Update achievement for making a donation request
      try {
        const { updateAchievementProgress } = await import('../../components/AchievementSystem');
        await updateAchievementProgress('charity-helper', amount);
      } catch (error) {
        console.error('Error updating charity achievement:', error);
      }

      showMessage(`Donation request sent to parent! ❤️ ${selectedCause?.label}`, 'success');
      setFromJar('');
      setDonationAmount('');
      setCause('');
      setDonationNote('');
      onDonationMade();

    } catch (error) {
      console.error('Error making donation:', error);
      showMessage('Network error. Please try again.', 'error');
    } finally {
      setIsDonating(false);
    }
  };

  return (
    <View style={{
      borderRadius: 14,
      marginBottom: 16,
      padding: 18,
      minWidth: 300,
      width: "97%",
      maxWidth: 520,
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      backgroundColor: themeColors.surface
    }}>
      <Text style={{
        ...TYPOGRAPHY.bodyLarge,
        marginBottom: 16,
        color: themeColors.secondary,
        textAlign: 'center'
      }}>❤️ Make a Donation</Text>

      <Text style={{
        ...TYPOGRAPHY.label,
        color: themeColors.textSecondary,
        textAlign: 'center',
        marginBottom: 20
      }}>
        Share your points to help others! Every donation makes a difference! 🌟
      </Text>

      {/* From Jar Selection */}
      <Text style={{
        ...TYPOGRAPHY.label,
        marginBottom: 8,
        color: themeColors.text
      }}>Which pot to donate from?</Text>

      <View style={{ marginBottom: 16 }}>
        {availableJars.map((jar) => (
          <TouchableOpacity
            key={jar.key}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 12,
              borderRadius: 8,
              marginBottom: 8,
              borderWidth: 2,
              borderColor: fromJar === jar.key ? themeColors.secondary : themeColors.border,
              backgroundColor: fromJar === jar.key ? themeColors.secondary + '15' : themeColors.card
            }}
            onPress={() => setFromJar(jar.key)}
          >
            <Text style={{ ...TYPOGRAPHY.h2, marginRight: 12 }}>{jar.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{
                ...TYPOGRAPHY.body,
                color: themeColors.text
              }}>
                {jar.label}
              </Text>
              <Text style={{
                ...TYPOGRAPHY.caption,
                color: themeColors.textSecondary
              }}>
                {jar.value} points available
              </Text>
            </View>
            {fromJar === jar.key && (
              <Text style={{ ...TYPOGRAPHY.h4, color: themeColors.secondary }}>✓</Text>
            )}
          </TouchableOpacity>
        ))}

        {availableJars.length === 0 && (
          <Text style={{
            textAlign: 'center',
            color: themeColors.textSecondary,
            fontStyle: 'italic',
            padding: 20
          }}>
            You need points in your jars to make donations! 💝
          </Text>
        )}
      </View>

      {/* Donation Amount */}
      <View style={{ marginBottom: 16 }}>
        <Text style={{
          ...TYPOGRAPHY.label,
          marginBottom: 8,
          color: themeColors.text
        }}>How many points to donate?</Text>
        <TextInput
          style={{
            borderWidth: 1,
            borderColor: themeColors.border,
            borderRadius: 8,
            padding: 12,
            ...TYPOGRAPHY.body,
            backgroundColor: themeColors.surface,
            color: themeColors.text
          }}
          placeholder="e.g., 25"
          value={donationAmount}
          onChangeText={(text) => setDonationAmount(text.replace(/[^0-9]/g, ''))}
          keyboardType="numeric"
          maxLength={5}
          placeholderTextColor={themeColors.textSecondary}
        />
      </View>

      {/* Cause Selection */}
      <View style={{ marginBottom: 16 }}>
        <Text style={{
          ...TYPOGRAPHY.label,
          marginBottom: 8,
          color: themeColors.text
        }}>What cause do you want to support?</Text>

        <View style={{ gap: 8 }}>
          {donationCauses.map((donationCause) => (
            <TouchableOpacity
              key={donationCause.key}
              style={{
                padding: 12,
                borderRadius: 8,
                borderWidth: 2,
                borderColor: cause === donationCause.key ? themeColors.secondary : themeColors.border,
                backgroundColor: cause === donationCause.key ? themeColors.secondary + '15' : themeColors.card
              }}
              onPress={() => setCause(donationCause.key)}
            >
              <Text style={{
                ...TYPOGRAPHY.body,
                color: themeColors.text
              }}>
                {donationCause.label}
              </Text>
              <Text style={{
                ...TYPOGRAPHY.caption,
                color: themeColors.textSecondary
              }}>
                {donationCause.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Donation Note */}
      <View style={{ marginBottom: 20 }}>
        <Text style={{
          ...TYPOGRAPHY.label,
          marginBottom: 8,
          color: themeColors.text
        }}>Why are you donating? (Optional):</Text>
        <TextInput
          style={{
            borderWidth: 1,
            borderColor: themeColors.border,
            borderRadius: 8,
            padding: 12,
            ...TYPOGRAPHY.label,
            backgroundColor: themeColors.surface,
            color: themeColors.text,
            minHeight: 60,
            textAlignVertical: 'top'
          }}
          placeholder="e.g., I want to help animals because they're so cute!"
          value={donationNote}
          onChangeText={setDonationNote}
          multiline
          maxLength={200}
          placeholderTextColor={themeColors.textSecondary}
        />
      </View>

      {/* Make Donation Button */}
      <TouchableOpacity
        style={{
          backgroundColor: isDonating ? themeColors.surface : themeColors.secondary,
          borderRadius: 12,
          paddingVertical: 16,
          alignItems: 'center',
          elevation: 3,
          shadowColor: themeColors.secondary,
          shadowOpacity: 0.3,
          shadowRadius: 4
        }}
        onPress={handleMakeDonation}
        disabled={isDonating || availableJars.length === 0}
      >
        <Text style={{
          ...TYPOGRAPHY.button,
          color: isDonating ? themeColors.textSecondary : themeColors.card
        }}>
          {isDonating ? '⏳ Making Donation...' : '❤️ Make Donation'}
        </Text>
      </TouchableOpacity>

      <Text style={{
        ...TYPOGRAPHY.caption,
        color: themeColors.textSecondary,
        textAlign: 'center',
        marginTop: 12,
        fontStyle: 'italic'
      }}>
        Your parent will help make the donation happen! Every point helps! 🌈
      </Text>
    </View>
  );
}

  function daysUntilPayout(rule: InterestRuleType): number {
    const now = new Date();
    let daysToAdd = rule.frequency === "monthly" ? 30 : 7;
    return daysToAdd;
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, width: '100%' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 60}
    >
      <ScrollView
        ref={scrollViewRef}
        style={{ flex: 1, backgroundColor: themeColors.background }}
        contentContainerStyle={{ alignItems: "center", paddingVertical: 16, paddingHorizontal: 8 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        keyboardShouldPersistTaps="handled"
      >
      <View style={{ ...MOBILE_STYLES.fullWidthContainer, marginBottom: MOBILE_LAYOUT.sectionSpacing, marginTop: MOBILE_LAYOUT.itemSpacing }}>
        {/* Header Row with Back and Action Buttons */}
        <View style={{ ...MOBILE_STYLES.row, justifyContent: 'space-between', marginBottom: MOBILE_LAYOUT.itemSpacing }}>
          <TouchableOpacity
            style={{
              backgroundColor: themeColors.surface,
              borderRadius: MOBILE_LAYOUT.cardBorderRadius,
              paddingHorizontal: MOBILE_LAYOUT.cardPadding,
              paddingVertical: MOBILE_LAYOUT.itemSpacing,
              elevation: MOBILE_LAYOUT.buttonElevation,
              minWidth: MOBILE_LAYOUT.minTouchTarget,
              minHeight: MOBILE_LAYOUT.minTouchTarget,
              justifyContent: 'center',
              alignItems: 'center',
            }}
            onPress={() => router.push('./')}
            accessibilityRole="button"
            accessibilityLabel="Go back to home screen"
            accessibilityHint="Double tap to return to the main dashboard"
          >
            <Text style={{ ...MOBILE_STYLES.body, color: themeColors.text }}>⬅️ Back</Text>
          </TouchableOpacity>

          <View style={MOBILE_STYLES.row}>
            <TouchableOpacity
              style={{
                backgroundColor: themeColors.secondary,
                borderRadius: MOBILE_LAYOUT.borderRadius * 1.5,
                width: MOBILE_LAYOUT.minTouchTarget,
                height: MOBILE_LAYOUT.minTouchTarget,
                justifyContent: 'center',
                alignItems: 'center',
                elevation: MOBILE_LAYOUT.buttonElevation,
                marginRight: MOBILE_LAYOUT.itemSpacing,
                opacity: refreshing ? 0.7 : 1,
                transform: [{ scale: refreshing ? 0.98 : 1 }],
              }}
              onPress={onRefresh}
              disabled={refreshing}
              accessibilityRole="button"
              accessibilityLabel={refreshing ? "Updating money pot points" : "Update money pot points"}
              accessibilityHint="Double tap to reload your current point balances"
              accessibilityState={{ disabled: refreshing }}
            >
              <Text style={{ ...MOBILE_STYLES.body, color: themeColors.card }}>{refreshing ? '⏳' : '↻'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                backgroundColor: themeColors.secondary,
                borderRadius: MOBILE_LAYOUT.borderRadius * 1.5,
                width: MOBILE_LAYOUT.minTouchTarget,
                height: MOBILE_LAYOUT.minTouchTarget,
                justifyContent: 'center',
                alignItems: 'center',
                elevation: MOBILE_LAYOUT.buttonElevation,
              }}
              onPress={() => setHelpModalVisible(true)}
              accessibilityRole="button"
              accessibilityLabel="Help and information"
              accessibilityHint="Double tap to open help guide for money pots"
            >
              <Text style={{ ...MOBILE_STYLES.body, color: themeColors.card }}>❓</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Title Below Header */}
        <View style={{ alignItems: 'center', marginBottom: MOBILE_LAYOUT.itemSpacing * 3 }}>
        <Text style={[styles.title, { color: themeColors.primary }]}>🏺 My Money Pots</Text>
        </View>
      </View>



      {/* JARS DISPLAY */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-evenly", marginVertical: 18 }}>
        {jars.map(jar => (
            <View
              key={jar.label}
              style={[
                styles.jarBox,
                { backgroundColor: jar.color || themeColors.surface, borderColor: themeColors.border }
              ]}
            >
              <Text style={{ ...TYPOGRAPHY.h1, marginBottom: 3 }}>{jar.icon}</Text>
              <Text style={[styles.jarPoints]}>{formatAmount(jar.value)}</Text>
              <Text style={[styles.jarLabel]}>{jar.label}</Text>
              {jar.pendingValue > 0 && (
                <View style={{
                  backgroundColor: '#FFFFFF', // White background for contrast on dark jar backgrounds
                  borderRadius: 4,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  marginTop: 2,
                  borderWidth: 1,
                  borderColor: themeColors.warning + '40'
                }}>
                  <Text style={{
                    ...TYPOGRAPHY.caption,
                    color: themeColors.warning, // Keep dark orange text
                    textAlign: 'center'
                  }}>
                    {formatAmount(jar.totalValue)} total, {formatAmount(jar.pendingValue)} pending
                  </Text>
                </View>
              )}
              {showDenominations && (
                <RupeeDenominations amount={convertToINR(jar.value)} />
              )}
              {jar.key === "save" && interestRule && (
                <Text style={{
                  marginTop: 4,
                  ...TYPOGRAPHY.bodySmall,
                  color: themeColors.success, // Keep dark green text
                  backgroundColor: '#FFFFFF', // White background for contrast on dark jar backgrounds
                  borderRadius: 5,
                  paddingHorizontal: 7,
                  paddingVertical: 3
                }}>
                  🏦 Your points are earning!
                  {"\n"}
                  Next payout in {daysUntilPayout(interestRule)} days
                </Text>
              )}
            </View>
        ))}
      </View>

      {/* Section Divider */}
      <View style={{
        height: 1,
        backgroundColor: themeColors.border + '40',
        marginVertical: 12,
        width: '90%',
        alignSelf: 'center'
      }} />

      {/* SMART ALLOCATION COACH */}
      <AllocationCoach
        jars={jars}
        router={router}
        scrollToMovePoints={scrollToMovePoints}
        expanded={coachExpanded}
        onToggle={() => setCoachExpanded(!coachExpanded)}
      />

      {/* Section Divider */}
      <View style={{
        height: 1,
        backgroundColor: themeColors.border + '40',
        marginVertical: 12,
        width: '90%',
        alignSelf: 'center'
      }} />

      {/* MOVE POINTS SECTION */}
      <MovePointsSection jars={jars} setJars={setJars} onRequestSubmitted={loadTransferRequests} />

      {/* Section Divider */}
      <View style={{
        height: 1,
        backgroundColor: themeColors.border + '40',
        marginVertical: 12,
        width: '90%',
        alignSelf: 'center'
      }} />

      {/* TRANSFER TIMELINE */}
      <TransferTimeline
        requests={transferRequests}
        router={router}
      />

      {/* Section Divider */}
      <View style={{
        height: 1,
        backgroundColor: themeColors.border + '40',
        marginVertical: 12,
        width: '90%',
        alignSelf: 'center'
      }} />

      {/* BUDGET CREATION SECTION - EXPANDABLE */}
      <ExpandableBudgetSection
        expanded={budgetExpanded}
        onToggle={() => setBudgetExpanded(!budgetExpanded)}
        onBudgetCreated={() => loadUserData(false)}
      />

      {/* Section Divider */}
      <View style={{
        height: 1,
        backgroundColor: themeColors.border + '40',
        marginVertical: 12,
        width: '90%',
        alignSelf: 'center'
      }} />

      {/* CHARITY DONATION SECTION - EXPANDABLE */}
      <ExpandableCharitySection
        jars={jars}
        expanded={charityExpanded}
        onToggle={() => setCharityExpanded(!charityExpanded)}
        onDonationMade={() => loadUserData(false)}
      />

      {/* Help Modal */}
      <HelpModal
        visible={helpModalVisible}
        onClose={() => setHelpModalVisible(false)}
        title="🏺 My Money Pots - Help"
        tabs={[
          {
            title: "Super Secret Money Jars! 🔒",
            content: [
              {
                type: "text",
                text: "Whoa! Your money jars are like magical treasure chests! 🏺✨ You have 5 special jars that keep your points safe and organized for different adventures!",
                icon: "🏺"
              },
              {
                type: "bullet",
                text: "🎨 Each jar has its own cool color and fun emoji!"
              },
              {
                type: "bullet",
                text: "🤖 Points jump into jars automatically when you earn them!"
              },
              {
                type: "bullet",
                text: "🔄 You can ask to move points between jars (with permission!)"
              },
              {
                type: "highlight",
                text: "Your parents are the jar masters - they decide where points go! 👑",
                icon: "👨‍👩‍👧‍👦"
              }
            ]
          },
          {
            title: "Meet Your 5 Money Heroes! 🦸‍♂️",
            content: [
              {
                type: "text",
                text: "Your money jars are superheroes, each with their own special power:",
                icon: "🏦"
              },
              {
                type: "bullet",
                text: "💰 Pocket Money - Your instant fun buddy for treats and toys!"
              },
              {
                type: "bullet",
                text: "🐷 Savings Pot - Your future dreams collector for big wishes!"
              },
              {
                type: "bullet",
                text: "🛒 Spending Pot - Your shopping sidekick for cool stuff!"
              },
              {
                type: "bullet",
                text: "🤲 Help Others Pot - Your kindness champion for giving and sharing!"
              },
              {
                type: "bullet",
                text: "📈 Grow Money Pot - Your magic grower for long-term treasures!"
              },
              {
                type: "highlight",
                text: "Each hero teaches you different money superpowers! 💪🎓",
                icon: "🎓"
              }
            ]
          },
          {
            title: "Jar-to-Jar Point Adventures! 🚀",
            content: [
              {
                type: "text",
                text: "Ready for an epic point-moving quest?",
                icon: "🔄"
              },
              {
                type: "bullet",
                text: "🎯 Choose how many points to send on their journey"
              },
              {
                type: "bullet",
                text: "🏠 Pick which jar to take points FROM (their starting point)"
              },
              {
                type: "bullet",
                text: "🎪 Pick which jar to move points TO (their destination!)"
              },
              {
                type: "bullet",
                text: "💌 Add a special note explaining your adventure plan"
              },
              {
                type: "highlight",
                text: "Parent approval makes the magic happen - safety first! ✨🛡️",
                icon: "✅"
              }
            ]
          },
          {
            title: "Why Parents Are The Boss? 👑",
            content: [
              {
                type: "text",
                text: "Moving points needs parent permission because they're your money mentors:",
                icon: "🛡️"
              },
              {
                type: "bullet",
                text: "🎯 They help you make super smart money choices!"
              },
              {
                type: "bullet",
                text: "🧠 They explain the 'why' behind every decision"
              },
              {
                type: "bullet",
                text: "📚 It teaches you to plan like a money wizard!"
              },
              {
                type: "highlight",
                text: "Parents want you to become a money master - you're learning! 🧙‍♂️❤️",
                icon: "❤️"
              }
            ]
          }
        ]}
      />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/**
 * Move Points Section
 */
function MovePointsSection({ jars, setJars, onRequestSubmitted }: {
  jars: { key: string; label: string; value: number; totalValue?: number; pendingValue?: number; color: string; icon: string }[],
  setJars: React.Dispatch<React.SetStateAction<any>>,
  onRequestSubmitted?: () => void
}) {
  const { themeColors } = useTheme();
  const { showMessage } = useCenteredMessage();
  const [amount, setAmount] = React.useState("");
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [note, setNote] = React.useState("");

  // Dropdown modal states
  const [fromDropdownVisible, setFromDropdownVisible] = React.useState(false);
  const [toDropdownVisible, setToDropdownVisible] = React.useState(false);

  // Validation states
  const [amountError, setAmountError] = React.useState<string | null>(null);
  const [fromError, setFromError] = React.useState<string | null>(null);
  const [toError, setToError] = React.useState<string | null>(null);

  // Validation functions (unchanged...)
  const validateAmount = (value: string) => {
    const num = Number(value);
    if (!value.trim()) {
      setAmountError("Please enter the number of points to move");
      return false;
    }
    if (isNaN(num) || num <= 0) {
      setAmountError("Please enter a valid positive number");
      return false;
    }
    if (num > 10000) {
      setAmountError("Maximum 10,000 points per transfer");
      return false;
    }
    if (!Number.isInteger(num)) {
      setAmountError("Points must be whole numbers");
      return false;
    }
    setAmountError(null);
    return true;
  };

  const validateFromJar = (value: string) => {
    if (!value) {
      setFromError("Please select a source jar");
      return false;
    }
    const jar = jars.find(j => j.key === value);
    if (!jar) {
      setFromError("Selected jar not found");
      return false;
    }
    if (jar.value <= 0) {
      setFromError("This jar is empty");
      return false;
    }
    setFromError(null);
    return true;
  };

  const validateToJar = (value: string, fromValue?: string) => {
    if (!value) {
      setToError("Please select a destination jar");
      return false;
    }
    if (value === fromValue) {
      setToError("Cannot move points to the same jar");
      return false;
    }
    setToError(null);
    return true;
  };

  // Input handlers (unchanged...)
  const handleAmountChange = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    setAmount(numericValue);
    if (numericValue) {
      validateAmount(numericValue);
    } else {
      setAmountError(null);
    }
  };

  const handleFromChange = (value: string) => {
    setFrom(value);
    if (value) {
      validateFromJar(value);
      if (to && value === to) {
        setToError("Cannot move points to the same jar");
      } else if (to) {
        validateToJar(to, value);
      }
    } else {
      setFromError(null);
    }
  };

  const handleToChange = (value: string) => {
    setTo(value);
    if (value) {
      validateToJar(value, from);
    } else {
      setToError(null);
    }
  };

  async function handleMovePoints() {
    const amountValid = validateAmount(amount);
    const fromValid = validateFromJar(from);
    const toValid = validateToJar(to, from);

    if (!amountValid || !fromValid || !toValid) {
      showMessage("Please fix the errors above before submitting.", "error");
      return;
    }

    const amt = Number(amount);
    const fromJar = jars.find(j => j.key === from);
    if (!fromJar || fromJar.value < amt) {
      showMessage("Not enough points in selected pot.", "error");
      return;
    }

    const originalAmount = amount;
    const originalFrom = from;
    const originalTo = to;
    const originalNote = note;

    setAmount("");
    setFrom("");
    setTo("");
    setNote("");

    try {
      const token = await getAuthToken();
      const user = await getUserData();

      if (!token || !user) {
        showMessage("Not authenticated. Please login again.", "error");
        setAmount(originalAmount);
        setFrom(originalFrom);
        setTo(originalTo);
        setNote(originalNote);
        return;
      }

      const userId = user.id;

      const toJar = jars.find(j => j.key === to);
      const requestData: any = {
        userId: userId,
        type: 'move-points',
        name: `Move ${amt} points from ${fromJar.label} to ${toJar?.label}`,
        amount: amt,
        from: from,
        to: to,
        fromBalance: fromJar.value,
        toBalance: toJar?.value || 0,
        reason: `Child requested to move ${amt} points from ${fromJar.label} to ${toJar?.label}`
      };

      if (originalNote.trim()) {
        requestData.note = originalNote.trim();
      }

      const response = await fetch(`${API_URL}/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        showMessage(errorData.message || "Failed to submit request.", "error");
        setAmount(originalAmount);
        setFrom(originalFrom);
        setTo(originalTo);
        setNote(originalNote);
        return;
      }

      // Reserve points as pending immediately for race condition prevention
      setJars(jars.map(jar =>
        jar.key === from
          ? {
              ...jar,
              value: jar.value - amt,
              pendingValue: (jar.pendingValue || 0) + amt,
              totalValue: jar.totalValue // totalValue remains the same until approved
            }
          : jar
      ));

      // Update savings achievement if moving to save jar
      if (to === 'save' && response.ok) {
        import('../../components/AchievementSystem').then(({ updateAchievementProgress }) => {
          updateAchievementProgress('first-saver', amt);
        }).catch(error => {
          console.error('Error updating savings achievement:', error);
        });
      }

      showMessage("Request sent to parent for approval! ✅", "success");
      // Refresh the transfer requests list
      onRequestSubmitted?.();

    } catch (error) {
      console.error('Error submitting move points request:', error);
      showMessage("Network error. Please try again.", "error");
      setAmount(originalAmount);
      setFrom(originalFrom);
      setTo(originalTo);
      setNote(originalNote);
    }
  }

  return (
    <View style={[{
      backgroundColor: themeColors.card,
      borderRadius: 0,
      marginBottom: 16,
      padding: 18,
      minWidth: 300,
      width: "97%",
      maxWidth: 520,
      elevation: 2,
      shadowColor: themeColors.border,
    }]}>
      <Text style={{
        ...TYPOGRAPHY.h3,
        marginBottom: 8,
        color: themeColors.text,
      }}>Move Points Between Pots</Text>
      <View style={{ marginBottom: 10, alignItems: "center", width: "100%" }}>

        <View style={{ width: "100%", maxWidth: 220, marginBottom: 7 }}>
          <Text style={{
            ...TYPOGRAPHY.label,
            marginBottom: 4,
            color: themeColors.text
          }}>Points to Move:</Text>
          <TextInput
            placeholder="Enter points"
            value={amount}
            onChangeText={handleAmountChange}
            keyboardType="numeric"
            style={{
              borderWidth: 1,
              borderColor: amountError ? themeColors.error : themeColors.border,
              borderRadius: 7,
              padding: 8,
              ...TYPOGRAPHY.body,
              marginBottom: 2,
              backgroundColor: themeColors.surface,
              color: themeColors.text,
              width: "100%"
            }}
            placeholderTextColor={themeColors.textSecondary}
            accessibilityLabel="Points to move"
            accessibilityHint="Enter the number of points you want to transfer between money pots"
          />
          {amountError && (
            <Text style={{
              ...TYPOGRAPHY.caption,
              color: themeColors.error,
              marginTop: 2,
              textAlign: 'center'
            }}>
              {amountError}
            </Text>
          )}
        </View>

        <View style={{ width: "100%", maxWidth: 220, marginBottom: 7 }}>
          <Text style={{
            ...TYPOGRAPHY.label,
            marginBottom: 4,
            color: themeColors.text
          }}>From Which Pot?</Text>
          <TouchableOpacity
            style={{
              height: 45,
              backgroundColor: themeColors.surface,
              borderWidth: 1,
              borderColor: fromError ? themeColors.error : themeColors.border,
              borderRadius: 7,
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 12,
              flexDirection: 'row',
              width: "100%"
            }}
            onPress={() => setFromDropdownVisible(true)}
          >
            <Text style={{
              ...TYPOGRAPHY.body,
              color: from ? themeColors.text : themeColors.textSecondary,
              flex: 1
            }}>
              {from ? `${jars.find(j => j.key === from)?.label} (${jars.find(j => j.key === from)?.value})` : 'Select Pot'}
            </Text>
            <Text style={{
              ...TYPOGRAPHY.body,
              color: themeColors.primary
            }}>
              ▼
            </Text>
          </TouchableOpacity>
          {fromError && (
            <Text style={{
              ...TYPOGRAPHY.caption,
              color: themeColors.error,
              marginTop: 2,
              textAlign: 'center'
            }}>
              {fromError}
            </Text>
          )}
        </View>

        <View style={{ width: "100%", maxWidth: 220, marginBottom: 7 }}>
          <Text style={{
            ...TYPOGRAPHY.label,
            marginBottom: 4,
            color: themeColors.text
          }}>To Which Pot?</Text>
          <TouchableOpacity
            style={{
              height: 45,
              backgroundColor: themeColors.surface,
              borderWidth: 1,
              borderColor: toError ? themeColors.error : themeColors.border,
              borderRadius: 7,
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 12,
              flexDirection: 'row',
              width: "100%"
            }}
            onPress={() => setToDropdownVisible(true)}
          >
            <Text style={{
              ...TYPOGRAPHY.body,
              color: to ? themeColors.text : themeColors.textSecondary,
              flex: 1
            }}>
              {to ? jars.find(j => j.key === to)?.label : 'Select Pot'}
            </Text>
            <Text style={{
              ...TYPOGRAPHY.body,
              color: themeColors.primary
            }}>
              ▼
            </Text>
          </TouchableOpacity>
          {toError && (
            <Text style={{
              ...TYPOGRAPHY.caption,
              color: themeColors.error,
              marginTop: 2,
              textAlign: 'center'
            }}>
              {toError}
            </Text>
          )}
        </View>

        <View style={{ width: "100%", maxWidth: 220, marginBottom: 7 }}>
          <Text style={{
            ...TYPOGRAPHY.label,
            marginBottom: 4,
            color: themeColors.text
          }}>Note to Parent (Optional):</Text>
          <TextInput
            placeholder="Why do you want to move these points?"
            value={note}
            onChangeText={setNote}
            multiline={true}
            numberOfLines={2}
            maxLength={200}
            style={{
              borderWidth: 1,
              borderColor: themeColors.border,
              borderRadius: 7,
              padding: 8,
              ...TYPOGRAPHY.body,
              marginBottom: 2,
              backgroundColor: themeColors.surface,
              color: themeColors.text,
              minHeight: 60,
              textAlignVertical: 'top',
              width: "100%"
            }}
            placeholderTextColor={themeColors.textSecondary}
            accessibilityLabel="Optional note to parent"
            accessibilityHint="Add a message explaining why you want to move these points"
          />
        </View>

        <View style={{ width: "100%", maxWidth: 220 }}>
          <TouchableOpacity
            style={{
              backgroundColor: themeColors.warning + "33",
              borderRadius: 8,
              paddingVertical: 8,
              marginTop: 7,
              alignItems: "center",
              width: "100%"
            }}
            onPress={handleMovePoints}
            accessibilityRole="button"
            accessibilityLabel="Submit point transfer request"
            accessibilityHint="Send request to parent to move points between money pots"
          >
            <Text style={{ color: themeColors.warning, ...TYPOGRAPHY.button }}>
              Ask to Move Points
            </Text>
          </TouchableOpacity>
        </View>

      </View>

      {/* From Dropdown Modal */}
      <Modal
        visible={fromDropdownVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setFromDropdownVisible(false)}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 20
          }}
          activeOpacity={1}
          onPress={() => setFromDropdownVisible(false)}
        >
          <TouchableOpacity
            style={{
              backgroundColor: themeColors.surface,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: themeColors.border,
              minWidth: 280,
              elevation: 10,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              maxWidth: 320,
              paddingVertical: 8
            }}
            activeOpacity={1}
          >
            {jars.filter(jar => jar.value > 0).map((jar) => (
              <TouchableOpacity
                key={jar.key}
                style={{
                  padding: 16,
                  borderBottomWidth: jar.key === 'invest' ? 0 : 1,
                  borderBottomColor: themeColors.border
                }}
                onPress={() => {
                  handleFromChange(jar.key);
                  setFromDropdownVisible(false);
                }}
              >
                <Text style={{
                  ...TYPOGRAPHY.body,
                  color: themeColors.text
                }}>
                  {jar.label} ({jar.value})
                </Text>
              </TouchableOpacity>
            ))}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* To Dropdown Modal */}
      <Modal
        visible={toDropdownVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setToDropdownVisible(false)}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 20
          }}
          activeOpacity={1}
          onPress={() => setToDropdownVisible(false)}
        >
          <TouchableOpacity
            style={{
              backgroundColor: themeColors.surface,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: themeColors.border,
              minWidth: 280,
              elevation: 10,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              maxWidth: 320,
              paddingVertical: 8
            }}
            activeOpacity={1}
          >
            {jars.filter(jar => jar.key !== from).map((jar) => (
              <TouchableOpacity
                key={jar.key}
                style={{
                  padding: 16,
                  borderBottomWidth: jar.key === 'invest' ? 0 : 1,
                  borderBottomColor: themeColors.border
                }}
                onPress={() => {
                  handleToChange(jar.key);
                  setToDropdownVisible(false);
                }}
              >
                <Text style={{
                  ...TYPOGRAPHY.body,
                  color: themeColors.text
                }}>
                  {jar.label}
                </Text>
              </TouchableOpacity>
            ))}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
