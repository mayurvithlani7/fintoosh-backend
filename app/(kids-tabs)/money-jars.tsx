import AnimatedCircularProgress from '@/components/animations/AnimatedCircularProgress';
import AnimatedCounter from '@/components/animations/AnimatedCounter';
import HelpModal from '@/components/HelpModal';
import { RupeeDenominations } from '@/components/RupeeDenominations';
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
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

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
          fontSize: 25,
          marginBottom: 3,
          zIndex: 2,
        }}>{jar.icon}</Text>
        <AnimatedCounter value={jar.value} fontSize={22} />
        <Text style={{
          fontWeight: "bold",
          marginBottom: 2,
          color: themeColors.primary,
          fontSize: 14,
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
              fontSize: 11,
              fontWeight: 'bold',
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
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 16,
        textAlign: 'center',
        color: themeColors.primary
      }}>📋 Recent Transfers</Text>

      {requests.length === 0 ? (
        <Text style={{
          textAlign: 'center',
          color: themeColors.textSecondary,
          fontSize: 16,
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
                <Text style={{ fontSize: 20 }}>{status.icon}</Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 16,
                  fontWeight: 'bold',
                  color: themeColors.text
                }}>
                  Move {request.amount} points
                </Text>
                <Text style={{
                  fontSize: 14,
                  color: status.color,
                  fontWeight: '600'
                }}>
                  {status.text}
                </Text>
                <Text style={{
                  fontSize: 12,
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
                    color: themeColors.card,
                    fontSize: 12,
                    fontWeight: 'bold'
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
            color: themeColors.card,
            fontSize: 16,
            fontWeight: 'bold'
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
            fontSize: 18,
            fontWeight: "600",
            marginBottom: expanded ? 16 : 0,
            color: themeColors.primary
          }}>
            🎯 Smart Allocation Coach
          </Text>

          {!expanded && (
            <Text style={{
              fontSize: 14,
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
                  fontSize: 14,
                  fontWeight: "600",
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
                        fontSize: 18,
                        marginRight: 8,
                        width: 25,
                        textAlign: 'center'
                      }}>{jar.icon}</Text>
                      <Text style={{
                        fontSize: 13,
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
                            backgroundColor: jar.color || themeColors.primary
                          }}
                        />
                      </View>
                      <Text style={{
                        fontSize: 11,
                        fontWeight: 'bold',
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
                    fontSize: 14,
                    fontWeight: "600",
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
                        fontSize: 20,
                        marginRight: 10,
                      }}>{rec.icon}</Text>
                      <Text style={{
                        flex: 1,
                        fontSize: 13,
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
                    fontSize: 13,
                    fontWeight: 'bold',
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
                    fontSize: 13,
                    fontWeight: 'bold',
                    color: themeColors.card
                  }}>🎯 Goals</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
        <Text style={{ fontSize: 16, color: themeColors.primary, marginLeft: 8 }}>
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
    ...MOBILE_STYLES.title,
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
    ...MOBILE_STYLES.body,
    fontWeight: "600",
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
    fontWeight: "bold",
    marginBottom: 2,
    color: themeColors.primary,
    fontSize: 16,
  },
  jarPoints: {
    fontWeight: "700",
    fontSize: 21,
    marginBottom: 1,
    color: themeColors.text,
  },
  formRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  formGroup: { flex: 1, marginHorizontal: 4 },
  inputLabel: {
    fontWeight: "500",
    marginBottom: 4,
    color: themeColors.text,
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: themeColors.border,
    borderRadius: 7,
    padding: 8,
    fontSize: 16,
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
    fontSize: 16,
    padding: 8,
    marginTop: 1,
    backgroundColor: themeColors.surface,
    color: themeColors.text,
  } as any,
  formBtn: { backgroundColor: themeColors.warning, padding: 14, borderRadius: 8, marginTop: 7, marginHorizontal: 4, alignSelf: "flex-end" },
  formBtnText: { fontWeight: "700", color: themeColors.text, fontSize: 15 },
  placeholder: { color: themeColors.textSecondary, fontStyle: "italic", fontSize: 15, marginBottom: 2, marginTop: 2, minHeight: 26 },
  statusMessage: { fontSize: 15, fontWeight: "600", marginTop: 3, color: themeColors.success },
  // Allocation Coach Styles
  allocationCoach: {
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
  },
  coachTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: 'center',
  },
  allocationChart: {
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    textAlign: 'center',
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  jarEmoji: {
    fontSize: 20,
    marginRight: 8,
    width: 30,
    textAlign: 'center',
  },
  jarName: {
    fontSize: 14,
    flex: 1,
  },
  progressBar: {
    flex: 2,
    height: 8,
    backgroundColor: themeColors.border,
    borderRadius: 4,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  percentage: {
    fontSize: 12,
    fontWeight: 'bold',
    width: 35,
    textAlign: 'right',
  },
  recommendationsSection: {
    marginBottom: 16,
  },
  recommendationsTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  recommendationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  recommendationIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
  },
  recommendationAction: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  quickActionBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default function MoneyJarsScreen() {
  const { themeColors } = useTheme();
  const { showMessage } = useCenteredMessage();
  const styles = createStyles(themeColors);
  const { formatAmount, showDenominations, convertToINR, interestRule } = useCurrency();
  const scrollViewRef = useRef<ScrollView>(null);
  const [jars, setJars] = useState([
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
          await handleApiError(response, { showError: (msg) => Alert.alert('Error', msg), feature: 'Money Jars - User Data' });
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
        { label: 'Pocket Money', key: 'current', value: validatePoints(freshUserData.currentPoints), color: themeColors.jarColors.current, icon: '💰' },
        { label: 'Savings Pot', key: 'save', value: validatePoints(freshUserData.savePoints), color: themeColors.jarColors.save, icon: '🐷' },
        { label: 'Spending Pot', key: 'spend', value: validatePoints(freshUserData.spendPoints), color: themeColors.jarColors.spend, icon: '🛒' },
        { label: 'Help Others Pot', key: 'donate', value: validatePoints(freshUserData.donatePoints), color: themeColors.jarColors.donate, icon: '🤲' },
        { label: 'Grow Money Pot', key: 'invest', value: validatePoints(freshUserData.investPoints), color: themeColors.jarColors.invest, icon: '📈' }
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

  function daysUntilPayout(rule: InterestRuleType): number {
    const now = new Date();
    let daysToAdd = rule.frequency === "monthly" ? 30 : 7;
    return daysToAdd;
  }

  return (
    <ScrollView
      ref={scrollViewRef}
      style={{ flex: 1, backgroundColor: themeColors.background }}
      contentContainerStyle={{ alignItems: "center", paddingVertical: 16, paddingHorizontal: 8 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
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
            <Text style={{ ...MOBILE_STYLES.body, color: themeColors.text, fontWeight: 'bold' }}>⬅️ Back</Text>
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
                backgroundColor: themeColors.accent,
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
          <Text style={styles.title}>🏺 My Money Pots</Text>
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
            <Text style={{ fontSize: 25, marginBottom: 3 }}>{jar.icon}</Text>
            <Text style={[styles.jarPoints]}>{formatAmount(jar.value)}</Text>
            <Text style={[styles.jarLabel]}>{jar.label}</Text>
            {showDenominations && (
              <RupeeDenominations amount={convertToINR(jar.value)} />
            )}
            {jar.key === "save" && interestRule && (
              <Text style={{
                marginTop: 4,
                fontSize: 13,
                color: themeColors.success,
                backgroundColor: themeColors.success + "25",
                borderRadius: 5,
                paddingHorizontal: 7,
                paddingVertical: 3,
                fontWeight: "600"
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
  );
}

/**
 * Move Points Section
 */
function MovePointsSection({ jars, setJars, onRequestSubmitted }: {
  jars: { key: string; label: string; value: number; color: string; icon: string }[],
  setJars: React.Dispatch<React.SetStateAction<any>>,
  onRequestSubmitted?: () => void
}) {
  const { themeColors } = useTheme();
  const [amount, setAmount] = React.useState("");
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [note, setNote] = React.useState("");
  const [status, setStatus] = React.useState<{ type: "error" | "ok"; msg: string } | null>(null);

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
      setStatus({ type: "error", msg: "Please fix the errors above before submitting." });
      return;
    }

    const amt = Number(amount);
    const fromJar = jars.find(j => j.key === from);
    if (!fromJar || fromJar.value < amt) {
      setStatus({ type: "error", msg: "Not enough points in selected pot." });
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
    setStatus({ type: "ok", msg: "Sending request..." });

    try {
      const token = await getAuthToken();
      const user = await getUserData();

      if (!token || !user) {
        setStatus({ type: "error", msg: "Not authenticated. Please login again." });
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
        setStatus({ type: "error", msg: errorData.message || "Failed to submit request." });
        setAmount(originalAmount);
        setFrom(originalFrom);
        setTo(originalTo);
        setNote(originalNote);
        return;
      }

      setStatus({ type: "ok", msg: "Request sent to parent for approval! ✅" });
      // Refresh the transfer requests list
      onRequestSubmitted?.();
      setTimeout(() => setStatus(null), 3000);

    } catch (error) {
      console.error('Error submitting move points request:', error);
      setStatus({ type: "error", msg: "Network error. Please try again." });
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
        fontSize: 20,
        fontWeight: "600",
        marginBottom: 8,
        color: themeColors.text,
      }}>Move Points Between Pots</Text>
      <View style={{ marginBottom: 10, alignItems: "center", width: "100%" }}>

        <View style={{ width: "100%", maxWidth: 220, marginBottom: 7 }}>
          <Text style={{
            fontWeight: "500",
            marginBottom: 4,
            color: themeColors.text,
            fontSize: 14,
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
              fontSize: 16,
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
              color: themeColors.error,
              fontSize: 12,
              marginTop: 2,
              textAlign: 'center'
            }}>
              {amountError}
            </Text>
          )}
        </View>

        <View style={{ width: "100%", maxWidth: 220, marginBottom: 7 }}>
          <Text style={{
            fontWeight: "500",
            marginBottom: 4,
            color: themeColors.text,
            fontSize: 14,
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
              fontSize: 16,
              color: from ? themeColors.text : themeColors.textSecondary,
              flex: 1
            }}>
              {from ? `${jars.find(j => j.key === from)?.label} (${jars.find(j => j.key === from)?.value})` : 'Select Pot'}
            </Text>
            <Text style={{
              fontSize: 16,
              color: themeColors.primary,
              fontWeight: 'bold'
            }}>
              ▼
            </Text>
          </TouchableOpacity>
          {fromError && (
            <Text style={{
              color: themeColors.error,
              fontSize: 12,
              marginTop: 2,
              textAlign: 'center'
            }}>
              {fromError}
            </Text>
          )}
        </View>

        <View style={{ width: "100%", maxWidth: 220, marginBottom: 7 }}>
          <Text style={{
            fontWeight: "500",
            marginBottom: 4,
            color: themeColors.text,
            fontSize: 14,
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
              fontSize: 16,
              color: to ? themeColors.text : themeColors.textSecondary,
              flex: 1
            }}>
              {to ? jars.find(j => j.key === to)?.label : 'Select Pot'}
            </Text>
            <Text style={{
              fontSize: 16,
              color: themeColors.primary,
              fontWeight: 'bold'
            }}>
              ▼
            </Text>
          </TouchableOpacity>
          {toError && (
            <Text style={{
              color: themeColors.error,
              fontSize: 12,
              marginTop: 2,
              textAlign: 'center'
            }}>
              {toError}
            </Text>
          )}
        </View>

        <View style={{ width: "100%", maxWidth: 220, marginBottom: 7 }}>
          <Text style={{
            fontWeight: "500",
            marginBottom: 4,
            color: themeColors.text,
            fontSize: 14,
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
              fontSize: 16,
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
            <Text style={{ color: themeColors.warning, fontWeight: "bold", fontSize: 16 }}>
              Ask to Move Points
            </Text>
          </TouchableOpacity>
        </View>

        {status && (
          <Text style={{
            marginTop: 7,
            color: status.type === "error" ? themeColors.error : themeColors.success,
            fontWeight: "bold",
            textAlign: "center"
          }}
          accessibilityLabel={`${status.type === "error" ? "Error" : "Success"}: ${status.msg}`}
          >
            {status.msg}
          </Text>
        )}

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
            justifyContent: 'flex-start',
            alignItems: 'center',
            paddingTop: 600 // Position at 600 padding as requested
          }}
          activeOpacity={1}
          onPress={() => setFromDropdownVisible(false)}
        >
          <TouchableOpacity
            style={{
              backgroundColor: themeColors.surface,
              borderRadius: 7,
              borderWidth: 1,
              borderColor: themeColors.border,
              minWidth: 200,
              elevation: 5,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              maxWidth: 300,
              marginTop: 10 // Small gap from the dropdown field
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
                  fontSize: 16,
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
            justifyContent: 'flex-start',
            alignItems: 'center',
            paddingTop: 650 // Position at 650 padding for "To" field
          }}
          activeOpacity={1}
          onPress={() => setToDropdownVisible(false)}
        >
          <TouchableOpacity
            style={{
              backgroundColor: themeColors.surface,
              borderRadius: 7,
              borderWidth: 1,
              borderColor: themeColors.border,
              minWidth: 200,
              elevation: 5,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              maxWidth: 300,
              marginTop: 10 // Small gap from the dropdown field
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
                  fontSize: 16,
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
