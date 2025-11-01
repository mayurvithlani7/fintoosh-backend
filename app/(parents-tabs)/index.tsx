import HelpModal from '@/components/HelpModal';
import RealAllowanceForm, { RealAllowanceData } from '@/components/RealAllowanceForm';
import RealAllowanceHistory from '@/components/RealAllowanceHistory';
import { ActionSuggestions } from '@/components/ui/ActionSuggestions';
import { InterestMotivator } from '@/components/ui/InterestMotivator';
import SkeletonJar from '@/components/ui/SkeletonJar';
import { API_URL } from '@/utils/config';
import { useCurrency } from '@/utils/currencyContext';
import { useDataCache } from '@/utils/dataCacheContext';
import { MOBILE_LAYOUT, MOBILE_STYLES } from '@/utils/mobileLayout';
import { getAuthToken } from '@/utils/secureStorage';
import { useTheme } from '@/utils/themeContext';
import { Picker } from '@react-native-picker/picker';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import { Image, Modal, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

/**
 * Calculate a readable next interest payout date string.
 * Placeholder: For demo, next payout is exactly 7 or 30 days away if no backend timestamp, else uses child's lastPayoutDate if available.
 */
import type { InterestRuleType } from "@/utils/currencyContext";

// Helper function to determine jar status based on points
const getJarStatus = (points: number, jarType: 'pocket' | 'savings' | 'spending' | 'donate' | 'invest'): 'excellent' | 'good' | 'needs_attention' | 'low' => {
  if (points === 0) {
    return 'low';
  }

  switch (jarType) {
    case 'pocket':
    case 'savings':
    case 'donate':
    case 'invest':
      // Standard pots: 1-100 = Refill Needed, 101-2000 = Good Start, 2001-5000 = Good Balance, 5001-10000 = Great Balance, >10000 = Excellent
      if (points >= 10001) return 'excellent';
      if (points >= 5001) return 'excellent'; // Great Balance maps to excellent status
      if (points >= 2001) return 'good'; // Good Balance maps to good status
      if (points >= 101) return 'good'; // Good Start maps to good status
      return 'needs_attention'; // Refill Needed maps to needs_attention

    case 'spending':
      // Spending pot: 1-20 = Refill Needed, 21-250 = Good Start, 251-1000 = Good Balance, 1001-3000 = Great Balance, >3000 = Excellent
      if (points > 3000) return 'excellent';
      if (points >= 1001) return 'excellent'; // Great Balance maps to excellent
      if (points >= 251) return 'good'; // Good Balance maps to good
      if (points >= 21) return 'good'; // Good Start maps to good
      return 'needs_attention'; // Refill Needed maps to needs_attention

    default:
      return 'good';
  }
};

// Enhanced empty state component with progressive onboarding
const EmptyState = ({ styles }: { styles: any }) => {
  const router = useRouter();
  const { themeColors } = useTheme();

  return (
    <View style={styles.emptyContainer}>
      <Image
        source={require('@/assets/images/placeholder-family.png')}
        style={styles.emptyImage}
        resizeMode="contain"
      />
      <Text style={[styles.emptyTitle, { color: themeColors.primary }]}>
        Welcome to Family Finance Hub!
      </Text>
      <Text style={[styles.emptyDescription, { color: themeColors.text }]}>
        Start teaching your child about money management by adding their profile.
      </Text>
      <View style={styles.onboardingSteps}>
        <Text style={[styles.onboardingStep, { color: themeColors.textSecondary }]}>
          • Set up money pots and goals
        </Text>
        <Text style={[styles.onboardingStep, { color: themeColors.textSecondary }]}>
          • Approve spending requests
        </Text>
        <Text style={[styles.onboardingStep, { color: themeColors.textSecondary }]}>
          • Track financial learning progress
        </Text>
      </View>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Add your child profile"
        accessibilityHint="Navigate to child setup and onboarding screen"
        style={[styles.primaryButton, { backgroundColor: themeColors.success }]}
        onPress={() => router.push('/addChild')}
      >
        <Text style={[styles.primaryButtonText, { color: themeColors.card }]}>
          Add Your Child
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default function ParentsOverviewScreen() {
  const router = useRouter();
  const { refresh } = useLocalSearchParams();
  const { themeColors } = useTheme();
  const styles = createStyles(themeColors);
  const {
    childData,
    childDataStatus,
    fetchChildData,
    isDataStale,
  } = useDataCache();
  const { interestRule } = useCurrency();
  const [refreshing, setRefreshing] = useState(false);
  const [helpModalVisible, setHelpModalVisible] = useState(false);
  const [showMoreActions, setShowMoreActions] = useState(false);
  const [realAllowanceFormVisible, setRealAllowanceFormVisible] = useState(false);
  const [realAllowanceHistoryVisible, setRealAllowanceHistoryVisible] = useState(false);
  const [showChildDropdown, setShowChildDropdown] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    interest: false,      // Collapsed by default - secondary info
    pots: true,          // Expanded by default - core child status
  });
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [lastAllowanceDate, setLastAllowanceDate] = useState<Date | undefined>(undefined);
  const [interestSummary, setInterestSummary] = useState<{
    totalEarned: number;
    currentStreak: number;
    lastPayoutDate?: Date;
    nextPayoutDate?: Date;
    transactionsCount: number;
  } | null>(null);
  const [interestHistory, setInterestHistory] = useState<any[]>([]);
  const [familyChildren, setFamilyChildren] = useState<Array<{ id: string; name: string; caregivers?: Array<{ userId: string; role: string }> }>>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

  // Page dots for pots section
  const potsScrollRef = useRef<ScrollView>(null);
  const [potsScrollPosition, setPotsScrollPosition] = useState(0);

  // Rate limiting and request deduplication
  const activeRequests = useRef(new Map<string, Promise<any>>());
  const lastRequestTime = useRef(0);
  const [rateLimitWait, setRateLimitWait] = useState(0);

  // Request deduplication wrapper for fetchChildData
  const dedupedFetchChildData = useCallback(async (forceRefresh = false, childId?: string) => {
    const requestKey = `childData-${childId || 'default'}`;

    // Check if request is already in progress
    if (activeRequests.current.has(requestKey) && !forceRefresh) {
      console.log('🔄 Skipping duplicate child data request:', requestKey);
      return activeRequests.current.get(requestKey);
    }

    // Rate limiting check
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime.current;
    if (timeSinceLastRequest < 1000 && !forceRefresh) { // Minimum 1 second between requests
      console.log('⏳ Rate limiting: Too soon since last request');
      return;
    }

    lastRequestTime.current = now;

    const requestPromise = (async () => {
      try {
        await fetchChildData(forceRefresh, childId);
      } catch (error: any) {
        // Handle rate limiting specifically
        if (error?.message?.includes('Too many requests')) {
          const waitTime = parseInt(error.message.match(/(\d+)/)?.[1] || '60');
          console.log(`⏳ Rate limited: Waiting ${waitTime} seconds`);

          setRateLimitWait(waitTime);
          setTimeout(() => {
            setRateLimitWait(0);
            // Retry once after waiting
            console.log('🔄 Retrying after rate limit...');
            fetchChildData(forceRefresh, childId).catch(err =>
              console.error('Retry failed:', err?.message || err)
            );
          }, waitTime * 1000);

          throw error; // Re-throw to prevent further processing
        }

        // Handle other errors
        console.error('❌ Child data fetch error:', error?.message || error);
        throw error;
      }
    })();

    if (!forceRefresh) {
      activeRequests.current.set(requestKey, requestPromise);
      requestPromise.finally(() => {
        activeRequests.current.delete(requestKey);
      });
    }

    return requestPromise;
  }, [fetchChildData]);

  // Fetch family children data
  const fetchFamilyChildren = useCallback(async () => {
    try {
      const token = await getAuthToken();
      if (!token) return;

      // Get current user to get familyId
      const { getUser } = await import('@/utils/secureStorage');
      const currentUser = await getUser();
      if (!currentUser || !currentUser.familyId) return;

      const response = await fetch(`${API_URL}/users?familyId=${currentUser.familyId}&role=child`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const children = await response.json();
        const childrenData = children.map((child: any) => ({
          id: child.id,
          name: child.name
        }));
        setFamilyChildren(childrenData);

        // Auto-select first child if we don't have one selected
        if (childrenData.length > 0 && !selectedChildId) {
          setSelectedChildId(childrenData[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching family children:', error);
      setFamilyChildren([]);
    }
  }, [selectedChildId]);

  // Fetch interest data for the child
  const fetchInterestData = useCallback(async () => {
    if (!childData?._id) return;

    try {
      const token = await getAuthToken();
      if (!token) return;

      // Fetch interest summary
      const summaryResponse = await fetch(`${API_URL}/interest/summary/${childData._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
  },
});

      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json();
        setInterestSummary({
          totalEarned: summaryData.totalEarned || 0,
          currentStreak: summaryData.currentStreak || 0,
          lastPayoutDate: summaryData.lastPayoutDate ? new Date(summaryData.lastPayoutDate) : undefined,
          nextPayoutDate: summaryData.nextPayoutDate ? new Date(summaryData.nextPayoutDate) : undefined,
          transactionsCount: summaryData.transactionsCount || 0,
        });
      }

      // Fetch recent interest history
      const historyResponse = await fetch(`${API_URL}/interest/history/${childData._id}?limit=5`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        setInterestHistory(historyData.transactions || []);
      }
    } catch (error) {
      console.error('Error fetching interest data:', error);
      // Set default values if API fails
      setInterestSummary({
        totalEarned: 0,
        currentStreak: 0,
        transactionsCount: 0,
      });
      setInterestHistory([]);
    }
  }, [childData?._id]);

  // Progressive loading states
  const [loadingPhase, setLoadingPhase] = useState<'critical' | 'secondary' | 'complete'>('critical');

  // -- Progressive data loading with prioritization --
  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        setLoadingPhase('critical');

        // Load critical data first (child data)
        if (isDataStale('childData')) {
          await dedupedFetchChildData();
        }
        setLoadingPhase('secondary');

        // Then load secondary data with delay
        setTimeout(() => {
          setLoadingPhase('complete');
        }, 100);
      };

      loadData();
    }, [dedupedFetchChildData]) // isDataStale is stable from context
  );

  // Check for refresh parameter and update data
  React.useEffect(() => {
    if (refresh === 'true') {
      dedupedFetchChildData(true); // Force refresh
      fetchInterestData(); // Also refresh interest data
      fetchFamilyChildren(); // Refresh children data
    } else if (childData?._id) {
      // Initial load of interest data
      fetchInterestData();
      // Initial load of children data
      fetchFamilyChildren();
    }
  }, [refresh, dedupedFetchChildData, fetchInterestData, fetchFamilyChildren, childData?._id]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    dedupedFetchChildData(true).finally(() => setRefreshing(false));
  }, [dedupedFetchChildData]);

  // Handle real allowance form submission
  const handleRealAllowanceSubmit = useCallback(async (data: RealAllowanceData) => {
    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${API_URL}/real-allowances`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save real allowance');
      }

      // Success - could show a success message or refresh data
      console.log('Real allowance saved successfully');
    } catch (error) {
      console.error('Error saving real allowance:', error);
      throw error; // Re-throw to let the form handle it
    }
  }, []);



  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >


      {/* Heading */}
      <View style={{ ...MOBILE_STYLES.fullWidthContainer, marginBottom: MOBILE_LAYOUT.sectionSpacing, marginTop: MOBILE_LAYOUT.itemSpacing }}>
        <View style={{ ...MOBILE_STYLES.row, justifyContent: 'space-between', marginBottom: MOBILE_LAYOUT.itemSpacing }}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Refresh child's data"
            accessibilityHint="Reload latest information about your child's points and activities"
            accessibilityState={{ disabled: refreshing }}
            style={{
              backgroundColor: themeColors.secondary,
              borderRadius: MOBILE_LAYOUT.cardBorderRadius,
              width: MOBILE_LAYOUT.minTouchTarget,
              height: MOBILE_LAYOUT.minTouchTarget,
              justifyContent: 'center',
              alignItems: 'center',
              elevation: MOBILE_LAYOUT.buttonElevation,
            }}
            onPress={onRefresh}
            disabled={refreshing}
          >
            <Text style={{ ...MOBILE_STYLES.body, color: themeColors.card }}>{refreshing ? '⏳' : '↻'}</Text>
          </TouchableOpacity>

          <View style={MOBILE_STYLES.row}>
            {familyChildren.length > 0 && (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Add another child"
                accessibilityHint="Create an account for another child in your family"
                style={{
                  backgroundColor: themeColors.success,
                  borderRadius: MOBILE_LAYOUT.cardBorderRadius,
                  width: MOBILE_LAYOUT.minTouchTarget,
                  height: MOBILE_LAYOUT.minTouchTarget,
                  justifyContent: 'center',
                  alignItems: 'center',
                  elevation: MOBILE_LAYOUT.buttonElevation,
                  marginRight: MOBILE_LAYOUT.itemSpacing,
                }}
                onPress={() => router.push('/addChild')}
              >
                <Text style={{ ...MOBILE_STYLES.body, color: themeColors.card, fontWeight: 'bold' }}>+</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Help and information"
              accessibilityHint="Open help guide for parent dashboard features"
              style={{
                backgroundColor: themeColors.accent,
                borderRadius: MOBILE_LAYOUT.cardBorderRadius,
                width: MOBILE_LAYOUT.minTouchTarget,
                height: MOBILE_LAYOUT.minTouchTarget,
                justifyContent: 'center',
                alignItems: 'center',
                elevation: MOBILE_LAYOUT.buttonElevation,
              }}
              onPress={() => setHelpModalVisible(true)}
            >
              <Text style={{ ...MOBILE_STYLES.body, color: themeColors.card }}>❓</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={MOBILE_STYLES.center}>
          <Text style={[styles.title, { color: themeColors.primary }]}>Family Finance Hub</Text>
        </View>
      </View>

      {/* Single Child Indicator - Show when only one child exists */}
      {familyChildren.length === 1 && childData && (
        <View style={{
          backgroundColor: themeColors.surface,
          borderRadius: 12,
          padding: 8,
          marginBottom: 8,
          marginTop: 8,
          borderWidth: 1,
          borderColor: themeColors.border,
          alignSelf: 'center',
          minWidth: 200,
          alignItems: 'center'
        }}>
          <Text style={{ fontSize: 14, color: themeColors.text, fontWeight: '600' }}>
            👶 Viewing: {childData.name}
          </Text>
        </View>
      )}

      {/* Child Selector - Enhanced Horizontal Cards - Show for any number of children */}
      {familyChildren.length > 0 && (
        <View style={[styles.sectionCard, {
          backgroundColor: themeColors.surface,
          shadowColor: themeColors.border,
          borderWidth: 3,
          borderColor: themeColors.primary,
          borderRadius: 16,
          marginBottom: 12,
          marginTop: 12
        }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Text style={[styles.sectionTitle, { color: themeColors.text, fontSize: 18, marginBottom: 0 }]}>
              👨‍👩‍👦 Select Child to View
            </Text>
            <View style={[styles.selectedIndicator, {
              position: 'relative',
              marginLeft: 8,
              backgroundColor: themeColors.success
            }]}>
              <Text style={styles.selectedCheckmark}>{familyChildren.length}</Text>
            </View>

            {/* Dropdown Alternative for many children */}
            {familyChildren.length > 3 && (
              <TouchableOpacity
                style={[styles.dropdownToggle, { backgroundColor: themeColors.secondary }]}
                onPress={() => setShowChildDropdown(!showChildDropdown)}
                accessibilityLabel="Toggle child selection dropdown"
                accessibilityHint="Show or hide dropdown to select child"
              >
                <Text style={{ color: themeColors.card, fontSize: 14 }}>▼</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Dropdown Picker for many children */}
          {showChildDropdown && familyChildren.length > 3 && (
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedChildId || ''}
                onValueChange={async (value) => {
                  setSelectedChildId(value);
                  setShowChildDropdown(false);
                  // Fetch data for the newly selected child
                  await fetchChildData(true, value); // Force refresh with specific child
                  // Also refresh interest data for the selected child
                  await fetchInterestData();
                }}
                style={{ height: 50 }}
              >
                {familyChildren.map((child) => (
                  <Picker.Item
                    key={child.id}
                    label={child.name}
                    value={child.id}
                  />
                ))}
              </Picker>
            </View>
          )}

          {/* Horizontal Card Selector - Show for all cases unless dropdown is active */}
          {(!showChildDropdown || familyChildren.length <= 3) && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.childrenScroll}
              contentContainerStyle={styles.childrenScrollContent}
            >
              {familyChildren.map((child) => (
                <TouchableOpacity
                  key={child.id}
                  style={[
                    styles.childCard,
                    {
                      backgroundColor: selectedChildId === child.id ? themeColors.primary : themeColors.card,
                      borderColor: selectedChildId === child.id ? themeColors.primary : themeColors.border,
                      borderWidth: selectedChildId === child.id ? 3 : 2,
                    }
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${child.name} - ${selectedChildId === child.id ? 'currently selected' : 'tap to select'}`}
                  accessibilityHint="Switch to view this child's financial progress and manage their account"
                  onPress={async () => {
                    setSelectedChildId(child.id);
                    // Fetch data for the newly selected child
                    await fetchChildData(true, child.id); // Force refresh with specific child
                    // Also refresh interest data for the selected child
                    await fetchInterestData();
                  }}
                >
                  <View style={styles.childAvatar}>
                    <Text style={[styles.childAvatarText, {
                      color: selectedChildId === child.id ? themeColors.card : themeColors.primary
                    }]}>
                      {child.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={[styles.childName, {
                    color: selectedChildId === child.id ? themeColors.card : themeColors.text
                  }]}>
                    {child.name}
                  </Text>
                  {selectedChildId === child.id && (
                    <View style={styles.selectedIndicator}>
                      <Text style={styles.selectedCheckmark}>👑</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          <Text style={{ fontSize: 13, color: themeColors.textSecondary, marginTop: 8, textAlign: 'center' }}>
            Currently viewing: {childData?.name || 'No child selected'} • Tap any child above to switch{familyChildren.length > 3 ? ' • Use dropdown for more options' : ''}
          </Text>
        </View>
      )}







      {/* Child Jars Panel - Compact Horizontal Layout */}
      <View style={[styles.sectionCard, {
        backgroundColor: themeColors.surface,
        shadowColor: themeColors.border,
        borderWidth: 2,
        borderColor: themeColors.success,
        borderRadius: 16
      }]}>
        <Text style={[styles.sectionTitle, { color: themeColors.text, fontSize: 18 }]}>
          {childData ? `${childData.name}'s Money Pots` : 'Money Pots'}
        </Text>
        {childDataStatus === 'loading' ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.compactJarsScroll}>
            {[...Array(5)].map((_, i) => (
              <View key={i} style={styles.compactJarWrapper}>
                <SkeletonJar size={50} />
              </View>
            ))}
          </ScrollView>
        ) : childData ? (
          <>
            <ScrollView
              ref={potsScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.compactJarsScroll}
              contentContainerStyle={{
                paddingLeft: 12, // Minimal left padding so first jar starts from left
                paddingRight: 80, // Moderate right padding to show scrollability
                alignItems: 'center',
              }}
              onScroll={(event) => {
                const scrollX = event.nativeEvent.contentOffset.x;
                const itemWidth = 92; // width (80) + marginHorizontal (6*2) = 92
                const activeIndex = Math.round(scrollX / itemWidth); // Use round instead of floor for better sensitivity

                // Group jars into 2 sections: 0-1, 2-4
                let groupIndex = 0;
                if (activeIndex >= 1) { // More responsive - switch after first jar
                  groupIndex = 1;  // Jars 1-4: Savings, Spending, Help Others & Grow Money pots
                }

                setPotsScrollPosition(groupIndex);
              }}
              scrollEventThrottle={16}
              decelerationRate="normal" // Remove fast snapping
            >
              <TouchableOpacity
                style={styles.compactJarWrapper}
                accessibilityRole="button"
                accessibilityLabel={`Pocket Money: ${childData.currentPoints} points`}
                onPress={() => router.push('/(parents-tabs)/points')}
              >
                <View style={[styles.compactJar, { backgroundColor: themeColors.card }]}>
                  <Text style={styles.compactJarEmoji}>🤑</Text>
                  <Text style={[styles.compactJarValue, { color: themeColors.text }]}>{childData.currentPoints}</Text>
                  <Text style={[styles.compactJarLabel, { color: themeColors.textSecondary }]}>Pocket</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.compactJarWrapper}
                accessibilityRole="button"
                accessibilityLabel={`Savings Pot: ${childData.savePoints} points`}
                onPress={() => router.push('/(parents-tabs)/goals')}
              >
                <View style={[styles.compactJar, { backgroundColor: themeColors.card }]}>
                  <Text style={styles.compactJarEmoji}>🐷</Text>
                  <Text style={[styles.compactJarValue, { color: themeColors.text }]}>{childData.savePoints}</Text>
                  <Text style={[styles.compactJarLabel, { color: themeColors.textSecondary }]}>Savings</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.compactJarWrapper}
                accessibilityRole="button"
                accessibilityLabel={`Spending Pot: ${childData.spendPoints} points`}
                onPress={() => router.push('/(parents-tabs)/requests')}
              >
                <View style={[styles.compactJar, { backgroundColor: themeColors.card }]}>
                  <Text style={styles.compactJarEmoji}>🛍️</Text>
                  <Text style={[styles.compactJarValue, { color: themeColors.text }]}>{childData.spendPoints}</Text>
                  <Text style={[styles.compactJarLabel, { color: themeColors.textSecondary }]}>Spending</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.compactJarWrapper}
                accessibilityRole="button"
                accessibilityLabel={`Help Others Pot: ${childData.donatePoints} points`}
                onPress={() => router.push('/(parents-tabs)/points')}
              >
                <View style={[styles.compactJar, { backgroundColor: themeColors.card }]}>
                  <Text style={styles.compactJarEmoji}>❤️</Text>
                  <Text style={[styles.compactJarValue, { color: themeColors.text }]}>{childData.donatePoints}</Text>
                  <Text style={[styles.compactJarLabel, { color: themeColors.textSecondary }]}>Help Others</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.compactJarWrapper}
                accessibilityRole="button"
                accessibilityLabel={`Grow Money Pot: ${childData.investPoints} points`}
                onPress={() => router.push('/(parents-tabs)/points')}
              >
                <View style={[styles.compactJar, { backgroundColor: themeColors.card }]}>
                  <Text style={styles.compactJarEmoji}>📈</Text>
                  <Text style={[styles.compactJarValue, { color: themeColors.text }]}>{childData.investPoints}</Text>
                  <Text style={[styles.compactJarLabel, { color: themeColors.textSecondary }]}>Grow Money</Text>
                </View>
              </TouchableOpacity>
            </ScrollView>

            {/* Page Dots Indicator - Only 2 dots for grouped sections */}
            <View style={{
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              paddingVertical: 8,
              gap: 6,
            }}>
              {[0, 1].map((groupIndex) => (
                <View
                  key={groupIndex}
                  style={{
                    width: potsScrollPosition === groupIndex ? 12 : 8,
                    height: potsScrollPosition === groupIndex ? 12 : 8,
                    borderRadius: potsScrollPosition === groupIndex ? 6 : 4,
                    backgroundColor: potsScrollPosition === groupIndex ? themeColors.primary : themeColors.border,
                  }}
                />
              ))}
            </View>
          </>
        ) : (
          <EmptyState styles={styles} />
        )}
      </View>

      {/* Interest Earnings Section - Below Kids Money Pots */}
      {(() => {
        const effectiveInterestRule = interestRule;
        const shouldShowInterest =
          effectiveInterestRule &&
          effectiveInterestRule.rate > 0 &&
          childData &&
          childData.savePoints > 0;

        if (!shouldShowInterest) return null;

        const nextPayoutAmount = Math.max(
          1,
          Math.round(childData.savePoints * (effectiveInterestRule.rate / 100))
        );
        const nextPayoutDays =
          effectiveInterestRule.frequency === 'monthly' ? 30 : 7;

        return (
          <View style={[styles.sectionCard, {
            backgroundColor: themeColors.surface,
            shadowColor: themeColors.border,
            borderWidth: 2,
            borderColor: themeColors.accent,
            borderRadius: 16
          }]}>
            <TouchableOpacity
              style={styles.sectionHeader}
              accessibilityRole="button"
              accessibilityLabel={
                expandedSections.interest
                  ? 'Collapse interest details'
                  : 'Expand interest details'
              }
              accessibilityHint="Show or hide interest earning information"
              onPress={() =>
                setExpandedSections((prev) => ({
                  ...prev,
                  interest: !prev.interest,
                }))
              }
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <Text style={styles.interestEmoji}>💰</Text>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.sectionTitle,
                      { color: themeColors.text, fontSize: 16, marginBottom: 2 },
                    ]}
                  >
                    Interest Earnings
                  </Text>
                  <Text
                    style={[
                      styles.placeholder,
                      { color: themeColors.textSecondary, fontSize: 14 },
                    ]}
                  >
                    Earned: ₹{interestSummary?.totalEarned || 0} | Next: ₹
                    {nextPayoutAmount} in {nextPayoutDays} days
                  </Text>
                </View>
              </View>
              <Text style={[styles.expandIcon, { color: themeColors.textSecondary }]}>
                {expandedSections.interest ? '▲' : '▼'}
              </Text>
            </TouchableOpacity>

            {expandedSections.interest && (
              <View style={styles.expandedContent}>
                <InterestMotivator
                  nextPayout={{
                    amount: nextPayoutAmount,
                    days: nextPayoutDays,
                  }}
                  totalEarned={interestSummary?.totalEarned || 0}
                  streak={interestSummary?.currentStreak || 0}
                  recentPayouts={interestHistory}
                  themeColors={themeColors}
                  onExpand={() => {}}
                  isExpanded={true}
                />
              </View>
            )}
          </View>
        );
      })()}

      {/* Quick Actions - Grouped by Priority */}
      <View style={[styles.actionCard, {
        backgroundColor: themeColors.secondary + '15',
        shadowColor: themeColors.border,
        borderWidth: 4,
        borderColor: themeColors.warning,
        borderRadius: 18,
        borderStyle: 'solid'
      }]}>
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Quick Actions</Text>

        {/* Smart Action Suggestions */}
        <ActionSuggestions
          pendingRequests={pendingRequestsCount}
          childData={childData}
          lastAllowanceDate={lastAllowanceDate}
          recentGoalActivity={childData?.savePoints > 0}
          themeColors={themeColors}
          onNavigateToRequests={() => router.push('/(parents-tabs)/requests')}
          onNavigateToPoints={() => router.push('/(parents-tabs)/points')}
          onNavigateToGoals={() => router.push('/(parents-tabs)/goals')}
          onNavigateToChores={() => router.push('/(parents-tabs)/chores')}
        />

        {/* Primary Actions - Most frequently used */}
        <View style={styles.primaryActions}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Check requests and approvals"
            accessibilityHint="Navigate to review and approve child requests"
            style={[styles.primaryActionBtn, { backgroundColor: themeColors.primary }]}
            onPress={() => router.push('/(parents-tabs)/requests')}
          >
            <Text style={[styles.primaryActionText, { color: themeColors.card }]}>📋</Text>
            <Text style={[styles.primaryActionLabel, { color: themeColors.card }]}>Check Requests</Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Give pocket money"
            accessibilityHint="Navigate to add points to child's account"
            style={[styles.primaryActionBtn, { backgroundColor: themeColors.success }]}
            onPress={() => router.push('/(parents-tabs)/points')}
          >
            <Text style={[styles.primaryActionText, { color: themeColors.card }]}>💰</Text>
            <Text style={[styles.primaryActionLabel, { color: themeColors.card }]}>Give Pocket Money</Text>
          </TouchableOpacity>
        </View>

        {/* More Actions Button */}
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="More actions and features"
          accessibilityHint="Open menu with additional parent features"
          style={[styles.moreActionsBtn, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}
          onPress={() => setShowMoreActions(true)}
        >
          <Text style={[styles.moreActionsText, { color: themeColors.text }]}>More Actions ▼</Text>
        </TouchableOpacity>
      </View>

      {/* More Actions Modal */}
      <Modal
        visible={showMoreActions}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowMoreActions(false)}
      >
        <View style={styles.moreActionsModal}>
          <TouchableOpacity
            style={styles.moreActionsModal}
            activeOpacity={1}
            onPress={() => setShowMoreActions(false)}
          >
            <View style={styles.moreActionsSheet}>
              <Text style={[styles.moreActionsTitle, { color: themeColors.text }]}>All Actions</Text>

              <View style={styles.moreActionsGrid}>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Set child goals"
                  accessibilityHint="Navigate to goals management screen"
                  style={[styles.moreActionBtn, { backgroundColor: themeColors.secondary }]}
                  onPress={() => {
                    setShowMoreActions(false);
                    router.push('/(parents-tabs)/goals');
                  }}
                >
                  <Text style={styles.moreActionEmoji}>🎯</Text>
                  <Text style={[styles.moreActionText, { color: themeColors.card }]}>Set Child Goals</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Add home tasks"
                  accessibilityHint="Navigate to chores and tasks management"
                  style={[styles.moreActionBtn, { backgroundColor: themeColors.warning }]}
                  onPress={() => {
                    setShowMoreActions(false);
                    router.push('/(parents-tabs)/chores');
                  }}
                >
                  <Text style={styles.moreActionEmoji}>🧹</Text>
                  <Text style={[styles.moreActionText, { color: themeColors.card }]}>Add Home Tasks</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Manage rewards"
                  accessibilityHint="Navigate to rewards management screen"
                  style={[styles.moreActionBtn, { backgroundColor: themeColors.accent }]}
                  onPress={() => {
                    setShowMoreActions(false);
                    router.push('/(parents-tabs)/rewards');
                  }}
                >
                  <Text style={styles.moreActionEmoji}>🎁</Text>
                  <Text style={[styles.moreActionText, { color: themeColors.card }]}>Manage Rewards</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="View progress analytics"
                  accessibilityHint="Navigate to detailed progress and analytics"
                  style={[styles.moreActionBtn, { backgroundColor: themeColors.primary }]}
                  onPress={() => {
                    setShowMoreActions(false);
                    router.push('/(parents-tabs)/analytics');
                  }}
                >
                  <Text style={styles.moreActionEmoji}>📊</Text>
                  <Text style={[styles.moreActionText, { color: themeColors.card }]}>View Progress</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="See transaction history"
                  accessibilityHint="Navigate to complete transaction history"
                  style={[styles.moreActionBtn, { backgroundColor: themeColors.secondary }]}
                  onPress={() => {
                    setShowMoreActions(false);
                    router.push('/(parents-tabs)/transaction-history');
                  }}
                >
                  <Text style={styles.moreActionEmoji}>📜</Text>
                  <Text style={[styles.moreActionText, { color: themeColors.card }]}>See History</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Record real allowance"
                  accessibilityHint="Log actual cash or digital allowances given to your child"
                  style={[styles.moreActionBtn, { backgroundColor: themeColors.accent }]}
                  onPress={() => {
                    setShowMoreActions(false);
                    setRealAllowanceFormVisible(true);
                  }}
                >
                  <Text style={styles.moreActionEmoji}>💵</Text>
                  <Text style={[styles.moreActionText, { color: themeColors.card }]}>Record Allowance</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="View allowance history"
                  accessibilityHint="See all recorded real allowances given to your children"
                  style={[styles.moreActionBtn, { backgroundColor: themeColors.success }]}
                  onPress={() => {
                    setShowMoreActions(false);
                    setRealAllowanceHistoryVisible(true);
                  }}
                >
                  <Text style={styles.moreActionEmoji}>📜</Text>
                  <Text style={[styles.moreActionText, { color: themeColors.card }]}>Allowance History</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Close menu"
                  accessibilityHint="Close the more actions menu"
                  style={[styles.moreActionBtn, { backgroundColor: themeColors.surface, borderWidth: 1, borderColor: themeColors.border }]}
                  onPress={() => setShowMoreActions(false)}
                >
                  <Text style={styles.moreActionEmoji}>❌</Text>
                  <Text style={[styles.moreActionText, { color: themeColors.text }]}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Help Modal */}
      <HelpModal
        visible={helpModalVisible}
        onClose={() => setHelpModalVisible(false)}
        title="👨‍👩‍👧‍👦 Parent Overview - Help"
        tabs={[
          {
            title: "Welcome to Family Finance Hub",
            content: [
              {
                type: "text",
                text: "Welcome to your Family Finance Hub! This central dashboard helps you guide your child's financial learning journey with powerful tools and insights.",
                icon: "🏠"
              },
              {
                type: "bullet",
                text: "Real-time monitoring of your child's money pots and points balance"
              },
              {
                type: "bullet",
                text: "Quick access to approve requests, set goals, and manage rewards"
              },
              {
                type: "bullet",
                text: "Interest payout tracking for savings encouragement"
              },
              {
                type: "bullet",
                text: "Notifications for important updates and approvals needed"
              },
              {
                type: "highlight",
                text: "Everything you need to teach your child about money management in one place!",
                icon: "💰"
              }
            ]
          },
          {
            title: "Understanding Money Pots",
            content: [
              {
                type: "text",
                text: "Your child learns to manage money through 5 specialized pots, each teaching different financial concepts:",
                icon: "🏺"
              },
              {
                type: "bullet",
                text: "🤑 Pocket Money - Immediate spending for treats and small purchases"
              },
              {
                type: "bullet",
                text: "🐷 Savings Pot - Long-term goals like bikes, tablets, or special outings"
              },
              {
                type: "bullet",
                text: "🛍️ Spending Pot - Fun items they want but don't necessarily need"
              },
              {
                type: "bullet",
                text: "❤️ Help Others Pot - Charitable giving and community support"
              },
              {
                type: "bullet",
                text: "📈 Grow Money Pot - Learning about investments and financial growth"
              },
              {
                type: "highlight",
                text: "Each pot teaches valuable lessons about budgeting, saving, and responsible spending!",
                icon: "🎓"
              }
            ]
          },
          {
            title: "Managing Notifications & Requests",
            content: [
              {
                type: "text",
                text: "Stay connected with your child's financial activities through smart notifications:",
                icon: "🔔"
              },
              {
                type: "bullet",
                text: "Reward requests - When your child wants to redeem points"
              },
              {
                type: "bullet",
                text: "Point transfer requests - When they want to move money between pots"
              },
              {
                type: "bullet",
                text: "Goal completion notifications - Celebrating achievements"
              },
              {
                type: "bullet",
                text: "Chore approval requests - When tasks are completed"
              },
              {
                type: "bullet",
                text: "System updates - New features and important announcements"
              },
              {
                type: "highlight",
                text: "Tap any notification to go directly to the relevant management screen!",
                icon: "👆"
              }
            ]
          },
          {
            title: "Quick Actions Guide",
            content: [
              {
                type: "text",
                text: "Navigate efficiently with these quick action buttons:",
                icon: "⚡"
              },
              {
                type: "bullet",
                text: "📋 Check Requests - Review and approve/reject child requests"
              },
              {
                type: "bullet",
                text: "💰 Give Pocket Money - Add points to your child's account"
              },
              {
                type: "bullet",
                text: "🎯 Set Child Goals - Create savings targets and milestones"
              },
              {
                type: "bullet",
                text: "🧹 Add Home Tasks - Set up chores and earning opportunities"
              },
              {
                type: "bullet",
                text: "🎁 Manage Rewards - Create prizes your child can work towards"
              },
              {
                type: "bullet",
                text: "📊 View Progress - See detailed analytics and reports"
              },
              {
                type: "bullet",
                text: "📜 See History - Review transaction history and patterns"
              },
              {
                type: "highlight",
                text: "Each button opens a specialized management area - explore them all!",
                icon: "🎯"
              }
            ]
          },
          {
            title: "Interest & Savings Program",
            content: [
              {
                type: "text",
                text: "Encourage saving habits with our interest program:",
                icon: "💸"
              },
              {
                type: "bullet",
                text: "Automatic interest added to Savings Pot balances"
              },
              {
                type: "bullet",
                text: "Weekly or monthly payouts based on your settings"
              },
              {
                type: "bullet",
                text: "Teaches compound growth and delayed gratification"
              },
              {
                type: "bullet",
                text: "Tracks next payout date automatically"
              },
              {
                type: "highlight",
                text: "Interest motivates children to save more and wait longer for bigger rewards!",
                icon: "⏳"
              }
            ]
          },
          {
            title: "Tips for Success",
            content: [
              {
                type: "text",
                text: "Make the most of your child's financial education:",
                icon: "💡"
              },
              {
                type: "bullet",
                text: "Discuss money decisions together during family time"
              },
              {
                type: "bullet",
                text: "Celebrate both small savings and big achievements"
              },
              {
                type: "bullet",
                text: "Use real-world examples to explain financial concepts"
              },
              {
                type: "bullet",
                text: "Review progress regularly and adjust goals as needed"
              },
              {
                type: "bullet",
                text: "Encourage questions and make learning fun"
              },
              {
                type: "highlight",
                text: "Financial literacy is a journey - enjoy teaching these valuable life skills!",
                icon: "🌟"
              }
            ]
          }
        ]}
      />


      {/* Real Allowance Form */}
      <RealAllowanceForm
        visible={realAllowanceFormVisible}
        onClose={() => setRealAllowanceFormVisible(false)}
        onSubmit={handleRealAllowanceSubmit}
        children={familyChildren}
        selectedChildId={selectedChildId}
      />
      {/* Real Allowance History */}
      <RealAllowanceHistory
        visible={realAllowanceHistoryVisible}
        onClose={() => setRealAllowanceHistoryVisible(false)}
        children={familyChildren}
      />
    </ScrollView>
  );
}



function getNextInterestPayout(
  rule: InterestRuleType,
  childData: { lastInterestPayoutDate?: string }
): string {
  // Backend should supply lastInterestPayoutDate and handle in production!
  const now = new Date();
  let daysToAdd = rule.frequency === "monthly" ? 30 : 7;
  let lastDate = childData.lastInterestPayoutDate
    ? new Date(childData.lastInterestPayoutDate)
    : now;
  let next = new Date(lastDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
  return next.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const createStyles = (themeColors: any) => StyleSheet.create({

  scroll: { backgroundColor: themeColors.background },
  container: { alignItems: 'center', paddingVertical: 12, paddingHorizontal: 6 },
  navRow: { flexDirection: 'row', alignSelf: 'center', marginBottom: 12 },
  navBtn: { backgroundColor: themeColors.secondary, borderRadius: 8, marginHorizontal: 4, paddingVertical: 8, paddingHorizontal: 16 },
  navBtnText: { color: themeColors.card, fontWeight: 'bold', fontSize: 16 },
  title: { fontSize: 35, fontWeight: 'bold', marginBottom: 22, marginTop: 6, color: themeColors.primary },
  sectionCard: { backgroundColor: themeColors.card, borderRadius: 12, marginBottom: 12, padding: 12, minWidth: 320, width: '97%', maxWidth: 450, elevation: 1, shadowColor: themeColors.border }, // Reduced bulk and maxWidth
  actionCard: { backgroundColor: themeColors.card, borderRadius: 12, marginBottom: 12, padding: 12, minWidth: 320, width: '97%', maxWidth: 450, elevation: 2, borderWidth: 1, borderColor: themeColors.primary, shadowColor: themeColors.border }, // Reduced bulk and maxWidth
  sectionTitle: { fontSize: 20, fontWeight: '600', marginBottom: 8, color: themeColors.text },
  placeholder: { fontStyle: 'italic', fontSize: 15, marginBottom: 1, marginTop: 2, minHeight: 26, color: themeColors.textSecondary },
  quickActions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  quickBtn: {
    padding: 16,          // Increased from 12 to meet 48dp accessibility
    borderRadius: 8,
    margin: 4,
    minWidth: 160,        // Increased from 140
    minHeight: 48,        // Added explicit minimum height
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickBtnText: { fontWeight: '700', fontSize: 15 },
  jarsContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginTop: 10 },
  jar: { borderRadius: 14, padding: 18, minWidth: 80, alignItems: 'center', elevation: 2, shadowColor: themeColors.shadow || '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2 },
  jarLabel: { fontWeight: 'bold', fontSize: 14, marginBottom: 4 },
  jarValue: { fontSize: 18, fontWeight: 'bold' },
  // Empty state styles
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyImage: {
    width: 200,
    height: 150,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyDescription: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  onboardingSteps: {
    alignSelf: 'stretch',
    marginBottom: 30,
  },
  onboardingStep: {
    fontSize: 16,
    marginBottom: 8,
    lineHeight: 24,
  },
  primaryButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    minWidth: 200,
    alignItems: 'center',
    elevation: 3,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  // More actions modal styles
  moreActionsModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  moreActionsSheet: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '60%',
  },
  moreActionsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  moreActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  moreActionBtn: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  moreActionText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
  moreActionEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  // Primary actions styles
  primaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  primaryActionBtn: {
    flex: 1,
    padding: 20,
    borderRadius: 12,
    marginHorizontal: 4,
    alignItems: 'center',
    elevation: 3,
  },
  primaryActionText: {
    fontSize: 32,
    marginBottom: 8,
  },
  primaryActionLabel: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  moreActionsBtn: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  moreActionsText: {
    fontSize: 16,
    fontWeight: '600',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: themeColors.border,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: themeColors.surface,
  },
  // Collapsible section styles
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  expandIcon: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  expandedContent: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  interestEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  // Compact jar styles
  compactJarsScroll: {
    paddingVertical: 8,
  },
  compactJarWrapper: {
    marginHorizontal: 6,
    alignItems: 'center',
  },
  compactJar: {
    width: 80,
    height: 80,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: themeColors.shadow || '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  compactJarEmoji: {
    fontSize: 20,
    marginBottom: 2,
  },
  compactJarValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  compactJarLabel: {
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 12,
  },
  // Child selector styles
  childrenScroll: {
    marginTop: 8,
  },
  childrenScrollContent: {
    paddingHorizontal: 4,
  },
  childCard: {
    width: 90,
    height: 90,
    borderRadius: 16,
    marginHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    elevation: 2,
    shadowColor: themeColors.shadow || '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  childAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: themeColors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  childAvatarText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  childName: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  selectedIndicator: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: themeColors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCheckmark: {
    color: themeColors.card,
    fontSize: 14,
    fontWeight: 'bold',
  },
  dropdownToggle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
  },
});
