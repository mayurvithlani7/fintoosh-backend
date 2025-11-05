import { MOBILE_LAYOUT, MOBILE_STYLES } from '@/utils/mobileLayout';
import React, { useCallback, useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import HelpModal from '@/components/HelpModal';
import { SEMANTIC_TYPOGRAPHY } from '@/constants/theme';
import { createTransaction, fetchFamilyChildren, fetchTransactions, fetchUser } from '@/utils/api';
import { useCenteredMessage } from '@/utils/centeredMessageContext';
import { getAuthToken } from '@/utils/secureStorage';
import { useTheme } from '@/utils/themeContext';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
/* @ts-ignore */
import BackButton from '@/components/BackButton';

export default function ParentsPointsScreen() {
  const router = useRouter();
  const { themeColors } = useTheme();
  const styles = createStyles(themeColors);
  const { showMessage } = useCenteredMessage();
  const [amount, setAmount] = useState('');
  const [toJar, setToJar] = useState<string>('current'); // Initialize with first option since Android Picker doesn't show placeholder well
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [children, setChildren] = useState<{ id: string; name: string }[]>([]);
  const [childData, setChildData] = useState<{
    name: string;
    currentPoints: number;
    savePoints: number;
    spendPoints: number;
    donatePoints: number;
    investPoints: number;
    pendingCurrentPoints?: number;
    pendingSavePoints?: number;
    pendingSpendPoints?: number;
    pendingDonatePoints?: number;
    pendingInvestPoints?: number;
  } | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [helpModalVisible, setHelpModalVisible] = useState(false);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const jarOptions = [
    { label: 'Pocket Money', value: 'current' },
    { label: 'Savings Pot', value: 'save' },
    { label: 'Spending Pot', value: 'spend' },
    { label: 'Help Others Pot', value: 'donate' },
    { label: 'Grow Money Pot', value: 'invest' }
  ];

  const selectedJarLabel = jarOptions.find(jar => jar.value === toJar)?.label || 'Select --';

  const handleJarSelect = (value: string) => {
    setToJar(value);
    setDropdownVisible(false);
  };

  const openDropdown = () => {
    setDropdownVisible(true);
  };

  useEffect(() => {
    loadChildren();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadChildren();
    }, [])
  );

  const loadChildren = async () => {
    try {
      const { getUser } = await import('@/utils/secureStorage');
      const currentUser = await getUser();
      if (!currentUser) {
        setLoading(false);
        setRefreshing(false);
        return;
      }
      if (currentUser.role !== 'parent' || !currentUser.familyId) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // Get family children
      const token = await getAuthToken();
      if (!token) {
        setLoading(false);
        setRefreshing(false);
        return;
      }
      const childrenData = await fetchFamilyChildren(currentUser.familyId as string, token);

      if (childrenData && childrenData.length > 0) {
        setChildren(childrenData.map((child: any) => ({ id: child.id, name: child.name })));

        // Auto-select first child if available and none selected
        if (childrenData.length > 0 && !selectedChildId) {
          const firstChildId = childrenData[0].id;
          setSelectedChildId(firstChildId as string);
        }
      }
    } catch (error) {
      console.error('Error loading children:', error);
    }
  };

  const loadChildData = useCallback(async () => {
    if (!selectedChildId) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const token = await getAuthToken();
      const selectedChild = children.find(child => child.id === selectedChildId);

      if (selectedChild && token) {
        const childUserData = await fetchUser(selectedChild.id, token || undefined);

        if (childUserData) {
          setChildData({
            name: childUserData.name || selectedChild.name || 'Child',
            currentPoints: childUserData.currentPoints || 0,
            savePoints: childUserData.savePoints || 0,
            spendPoints: childUserData.spendPoints || 0,
            donatePoints: childUserData.donatePoints || 0,
            investPoints: childUserData.investPoints || 0,
            pendingCurrentPoints: childUserData.pendingCurrentPoints || 0,
            pendingSavePoints: childUserData.pendingSavePoints || 0,
            pendingSpendPoints: childUserData.pendingSpendPoints || 0,
            pendingDonatePoints: childUserData.pendingDonatePoints || 0,
            pendingInvestPoints: childUserData.pendingInvestPoints || 0
  });

          // Fetch recent transactions for the child
          try {
            const transactions = await fetchTransactions(selectedChild.id, token, 1, 5); // Get last 5 transactions
            if (transactions && transactions.transactions) {
              // Filter for parent point adjustments only
              const parentAdjustments = transactions.transactions
                .filter((tx: any) => tx.type === 'parent-points-adjustment')
                .slice(0, 3); // Show only last 3
              setRecentTransactions(parentAdjustments);
            }
          } catch (txError) {
            console.error('Error fetching recent transactions:', txError);
            setRecentTransactions([]);
          }
        }
      }
    } catch (error) {
      console.error('Error loading child data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedChildId, children]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadChildData();
  }, [loadChildData]);

  // Load child data when selected child changes
  useEffect(() => {
    if (selectedChildId && children.length > 0) {
      loadChildData();
    }
  }, [selectedChildId, children, loadChildData]);

  async function handlePoints(isAdd: boolean) {
    console.log('handlePoints called with isAdd:', isAdd, 'amount:', amount, 'toJar:', toJar);

    // Validate input
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      showMessage('Enter a valid positive number for points.', 'error');
      return;
    }

    if (!childData) {
      showMessage('Child data not loaded. Please try again.', 'error');
      return;
    }

    const changeAmount = parseInt(amount, 10);
    const pointsField = `${toJar}Points` as keyof typeof childData;
    const totalPoints = childData[pointsField] as number || 0;

    // Map jar names to their pending field keys
    const pendingFieldMap: Record<string, keyof typeof childData> = {
      current: 'pendingCurrentPoints',
      save: 'pendingSavePoints',
      spend: 'pendingSpendPoints',
      donate: 'pendingDonatePoints',
      invest: 'pendingInvestPoints'
    };
    const pendingField = pendingFieldMap[toJar] as keyof typeof childData;
    const pendingPoints = (childData[pendingField] as number) || 0;
    const availablePoints = totalPoints - pendingPoints;

    // Check if subtracting would result in negative available points
    if (!isAdd && availablePoints < changeAmount) {
      showMessage(`Not enough available points in ${jarOptions.find(j => j.value === toJar)?.label} pot. Only ${availablePoints} points are available (some may be reserved for pending requests).`, 'error');
      return;
    }

    // Calculate new value
    const newValue = isAdd ? totalPoints + changeAmount : totalPoints - changeAmount;

    // Store original value for potential rollback
    const originalValue = totalPoints;

    // OPTIMISTIC UPDATE: Update UI immediately
    setChildData(prev => prev ? {
      ...prev,
      [pointsField]: newValue
    } : null);

    // Show instant success message
    showMessage(
      `${isAdd ? 'Added' : 'Subtracted'} ${amount} points ${isAdd ? 'to' : 'from'} the ${jarOptions.find(
        j => j.value === toJar
      )?.label} pot.`,
      'success'
    );

    // Clear form immediately for instant feedback
    setAmount('');

    try {
      // Get current user and child info
      const { getUser } = await import('@/utils/secureStorage');
      const currentUser = await getUser();
      if (!currentUser) {
        throw new Error('User not logged in');
      }
      if (currentUser.role !== 'parent' || !currentUser.familyId) {
        throw new Error('Invalid parent account');
      }

      // Get family children
      const token = await getAuthToken();
      if (!token) {
        throw new Error('Authentication failed');
      }

      const children = await fetchFamilyChildren(currentUser.familyId as string, token);
      console.log('Fetched children:', children);

      if (!children || children.length === 0) {
        throw new Error('No child found');
      }

      // Find the selected child
      const child = children.find((c: any) => c.id === selectedChildId) || children[0];
      if (!child) {
        throw new Error('Selected child not found');
      }
      console.log('Using child:', child);

      // Create transaction record (this handles point updates atomically)
      const transactionData = {
        userId: child.id || '',
        type: 'parent-points-adjustment',
        description: `Parent ${isAdd ? 'added' : 'subtracted'} ${changeAmount} points ${isAdd ? 'to' : 'from'} ${toJar} jar`,
        amount: isAdd ? changeAmount : -changeAmount,
        toJar: toJar
      };
      console.log('Creating transaction:', transactionData);
      await createTransaction(transactionData, token || undefined);

      // Success: Refresh recent transactions to show the new entry
      loadChildData();

    } catch (error) {
      console.error('Error updating points:', error);

      // FAILURE: Rollback optimistic update
      setChildData(prev => prev ? {
        ...prev,
        [pointsField]: originalValue
      } : null);

      // Restore form data so user can retry
      setAmount(amount);

      // Show error message
      showMessage('Failed to update points. Please try again.', 'error');
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, width: '100%' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 60}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        keyboardShouldPersistTaps="handled"
      >
      <View style={{ ...MOBILE_STYLES.fullWidthContainer, marginBottom: MOBILE_LAYOUT.sectionSpacing, marginTop: MOBILE_LAYOUT.itemSpacing }}>
        <View style={{ ...MOBILE_STYLES.row, justifyContent: 'space-between' }}>
          <BackButton label="Back to Home" to="/(parents-tabs)" />
          <TouchableOpacity
            style={{
              backgroundColor: themeColors.accent,
              borderRadius: MOBILE_LAYOUT.cardBorderRadius,
              paddingHorizontal: MOBILE_LAYOUT.cardPadding,
              paddingVertical: MOBILE_LAYOUT.itemSpacing,
              elevation: MOBILE_LAYOUT.buttonElevation,
              minWidth: MOBILE_LAYOUT.minTouchTarget,
              minHeight: MOBILE_LAYOUT.minTouchTarget,
              justifyContent: 'center',
              alignItems: 'center'
  }}
            onPress={() => setHelpModalVisible(true)}
          >
            <Text style={{ ...MOBILE_STYLES.body, color: themeColors.card
  }}>❓ Help</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={[styles.title, { color: themeColors.primary }]}>Manage Your Child's Points</Text>

      {/* Child Selector with Enhanced Visual Design */}
      {children.length > 1 && (
        <View style={[styles.sectionCard, {
          backgroundColor: themeColors.card,
          shadowColor: themeColors.border,
          borderWidth: 3,
          borderColor: themeColors.primary,
          borderRadius: 16,
          marginBottom: 12
        }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Text style={[styles.sectionTitle, { color: themeColors.text, ...SEMANTIC_TYPOGRAPHY["type-heading-small"], marginBottom: 0 }]}>
              👨‍👩‍👦 Select Child to View
            </Text>
            <View style={[styles.countBadge, {
              position: 'relative',
              marginLeft: 8,
              backgroundColor: themeColors.success
            }]}>
              <Text style={styles.countText}>{children.length}</Text>
            </View>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.childrenScroll}
            contentContainerStyle={styles.childrenScrollContent}
          >
            {children.map((child) => (
              <TouchableOpacity
                key={child.id}
                style={[
                  styles.childCard,
                  {
                    backgroundColor: selectedChildId === child.id ? themeColors.primary : themeColors.card,
                    borderColor: selectedChildId === child.id ? themeColors.primary : themeColors.border
  }
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Select ${child.name} - ${selectedChildId === child.id ? 'currently selected' : 'tap to select'}`}
                accessibilityHint="Switch to view this child's financial progress and manage their account"
                onPress={() => setSelectedChildId(child.id)}
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
          <Text style={{ ...SEMANTIC_TYPOGRAPHY["type-caption"], color: themeColors.textSecondary, marginTop: 8, textAlign: 'center' }}>
            Tap any child to view their individual progress and manage their account
          </Text>
        </View>
      )}

      {/* Child Name Display - Single Child per Parent */}
      {children.length === 1 && (
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
          <Text style={{ ...SEMANTIC_TYPOGRAPHY["type-body-small"], color: themeColors.text
  }}>
            👶 Viewing: {children[0].name}
          </Text>
        </View>
      )}

      {/* No Children Empty State */}
      {children.length === 0 && (
        <View style={[styles.sectionCard, {
          backgroundColor: themeColors.surface,
          shadowColor: themeColors.border,
          borderWidth: 3,
          borderColor: themeColors.warning,
          borderRadius: 16,
          marginBottom: 12,
          alignItems: 'center',
          paddingVertical: 24
        }]}>
          <Text style={[styles.sectionTitle, { color: themeColors.text, ...SEMANTIC_TYPOGRAPHY["type-heading-small"], marginBottom: 12 }]}>
            👶 No Children Linked Yet
          </Text>
          <Text style={[styles.placeholder, { color: themeColors.textSecondary, textAlign: 'center', marginBottom: 20 }]}>
            You need to add a child to your family account before you can manage points and money pots.
          </Text>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Add your first child"
            accessibilityHint="Navigate to add child screen to create a family account"
            style={{
              backgroundColor: themeColors.success,
              borderRadius: 12,
              paddingHorizontal: 24,
              paddingVertical: 12,
              elevation: 2
  }}
            onPress={() => router.push('/addChild' as any)}
          >
            <Text style={{ color: themeColors.card, ...SEMANTIC_TYPOGRAPHY["type-body"] }}>
              Add Your First Child
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Points Summary Dashboard */}
      {childData && (
        <View style={[styles.sectionCard, {
          backgroundColor: themeColors.surface,
          shadowColor: themeColors.border,
          borderWidth: 3,
          borderColor: themeColors.success,
          borderRadius: 16,
          marginBottom: 12
        }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={[styles.sectionTitle, { color: themeColors.text, ...SEMANTIC_TYPOGRAPHY["type-heading-small"], marginBottom: 0 }]}>
              💰 {childData.name}'s Points Summary
            </Text>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={refreshing ? "Refreshing data" : "Refresh data"}
              accessibilityHint="Reload latest points information"
              accessibilityState={{ disabled: refreshing }}
              style={[styles.refreshBtn, { backgroundColor: themeColors.secondary }]}
              onPress={onRefresh}
              disabled={refreshing}
            >
              <Text style={{ ...SEMANTIC_TYPOGRAPHY["type-body-small"], color: themeColors.card }}>
                {refreshing ? '⏳' : '↻'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.summaryGrid}>
            <View style={[styles.summaryItem, { backgroundColor: themeColors.surface, borderWidth: 1, borderColor: themeColors.border }]}>
              <Text style={[styles.summaryLabel, { color: themeColors.text }]}>🤑 Pocket</Text>
              <Text style={[styles.summaryValue, { color: themeColors.primary }]}>
                {(childData.currentPoints || 0) - (childData.pendingCurrentPoints || 0)}
              </Text>
              {(childData.pendingCurrentPoints || 0) > 0 && (
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
                    ...SEMANTIC_TYPOGRAPHY["type-caption-small"],
                    color: themeColors.warning, // Dark orange text for contrast
                    textAlign: 'center'
                  }}>
                    {childData.currentPoints} total, {childData.pendingCurrentPoints} pending
                  </Text>
                </View>
              )}
            </View>
            <View style={[styles.summaryItem, { backgroundColor: themeColors.surface, borderWidth: 1, borderColor: themeColors.border }]}>
              <Text style={[styles.summaryLabel, { color: themeColors.text }]}>🐷 Savings</Text>
              <Text style={[styles.summaryValue, { color: themeColors.accent }]}>
                {(childData.savePoints || 0) - (childData.pendingSavePoints || 0)}
              </Text>
              {(childData.pendingSavePoints || 0) > 0 && (
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
                    ...SEMANTIC_TYPOGRAPHY["type-caption-small"],
                    color: themeColors.warning, // Dark orange text for contrast
                    textAlign: 'center'
                  }}>
                    {childData.savePoints} total, {childData.pendingSavePoints} pending
                  </Text>
                </View>
              )}
            </View>
            <View style={[styles.summaryItem, { backgroundColor: themeColors.surface, borderWidth: 1, borderColor: themeColors.border }]}>
              <Text style={[styles.summaryLabel, { color: themeColors.text }]}>🛍️ Spending</Text>
              <Text style={[styles.summaryValue, { color: themeColors.secondary }]}>
                {(childData.spendPoints || 0) - (childData.pendingSpendPoints || 0)}
              </Text>
              {(childData.pendingSpendPoints || 0) > 0 && (
                <Text style={{ ...SEMANTIC_TYPOGRAPHY["type-caption-small"], color: themeColors.warning, textAlign: 'center', marginTop: 2 }}>
                  {childData.spendPoints} total, {childData.pendingSpendPoints} pending
                </Text>
              )}
            </View>
            <View style={[styles.summaryItem, { backgroundColor: themeColors.surface, borderWidth: 1, borderColor: themeColors.border }]}>
              <Text style={[styles.summaryLabel, { color: themeColors.text }]}>❤️ Help Others</Text>
              <Text style={[styles.summaryValue, { color: themeColors.warning }]}>
                {(childData.donatePoints || 0) - (childData.pendingDonatePoints || 0)}
              </Text>
              {(childData.pendingDonatePoints || 0) > 0 && (
                <Text style={{ ...SEMANTIC_TYPOGRAPHY["type-caption-small"], color: themeColors.warning, textAlign: 'center', marginTop: 2 }}>
                  {childData.donatePoints} total, {childData.pendingDonatePoints} pending
                </Text>
              )}
            </View>
            <View style={[styles.summaryItem, { backgroundColor: themeColors.surface, borderWidth: 1, borderColor: themeColors.border }]}>
              <Text style={[styles.summaryLabel, { color: themeColors.text }]}>📈 Grow Money</Text>
              <Text style={[styles.summaryValue, { color: themeColors.success }]}>
                {(childData.investPoints || 0) - (childData.pendingInvestPoints || 0)}
              </Text>
              {(childData.pendingInvestPoints || 0) > 0 && (
                <Text style={{ ...SEMANTIC_TYPOGRAPHY["type-caption-small"], color: themeColors.warning, textAlign: 'center', marginTop: 2 }}>
                  {childData.investPoints} total, {childData.pendingInvestPoints} pending
                </Text>
              )}
            </View>
            <View style={[styles.summaryItem, { backgroundColor: themeColors.surface, borderWidth: 2, borderColor: themeColors.primary }]}>
              <Text style={[styles.summaryLabel, { color: themeColors.text
  }]}>🏆 Total</Text>
              <Text style={[styles.summaryValue, { color: themeColors.primary
  }]}>
                {(childData.currentPoints || 0) + (childData.savePoints || 0) + (childData.spendPoints || 0) + (childData.donatePoints || 0) + (childData.investPoints || 0)}
              </Text>
            </View>
          </View>
        </View>
      )}

      <View style={[styles.sectionCard, { backgroundColor: themeColors.card, shadowColor: themeColors.border }]}>
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Give or Take Points</Text>

<View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, gap: 10 }}>
          <View style={{ flex: 1, marginRight: 6 }}>
            <Text style={styles.inputLabel}>Points to Give/Take</Text>
            <TextInput
              accessibilityLabel="Points to adjust"
              accessibilityHint="Enter the number of points to add or subtract from child's account"
              style={[styles.input, { minHeight: 40 }]}
              placeholder="e.g. 10"
              placeholderTextColor={themeColors.textSecondary}
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.inputLabel}>Which Pot?</Text>
            {Platform.OS === 'web' ? (
              <div style={{ minHeight: 40, display: 'flex', alignItems: 'center' }}>
                <select
                  style={{
                    width: '100%',
                    minHeight: 40,
                    borderRadius: 7,
                    borderColor: themeColors.border,
                    borderWidth: 1,
                    ...SEMANTIC_TYPOGRAPHY["type-body"],
                    padding: 8,
                    marginTop: 2,
                    backgroundColor: themeColors.surface,
                    color: themeColors.text
  }}
                  value={toJar}
                  onChange={e => setToJar(e.target.value as any)}
                >
                  <option value="placeholder">Select --</option>
                  {jarOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <View style={{ position: 'relative' }}>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Select money pot"
                  accessibilityHint="Choose which pot to add or subtract points from"
                  accessibilityState={{ expanded: dropdownVisible }}
                  style={{
                    height: 45,
                    backgroundColor: themeColors.surface,
                    borderRadius: 7,
                    borderWidth: 1,
                    borderColor: themeColors.border,
                    marginRight: 5,
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingHorizontal: 12,
                    flexDirection: 'row'
                  }}
                  onPress={openDropdown}
                >
                  <Text style={{
                    ...SEMANTIC_TYPOGRAPHY["type-body"],
                    color: themeColors.text || '#000',
                    flex: 1
                  }}>
                    {selectedJarLabel}
                  </Text>
                  <Text style={{
                    ...SEMANTIC_TYPOGRAPHY["type-body"],
                    color: themeColors.primary
  }}>
                    ▼
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Quick Preset Buttons */}
        <View style={styles.presetContainer}>
          <Text style={[styles.inputLabel, { ...SEMANTIC_TYPOGRAPHY["type-body-small"], marginBottom: 8 }]}>Quick Amounts:</Text>
          <View style={styles.presetRow}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Set points to 5"
              accessibilityHint="Quick select 5 points for adjustment"
              style={[styles.presetBtn, { backgroundColor: themeColors.secondary }]}
              onPress={() => setAmount('5')}
            >
              <Text style={styles.presetBtnText}>5</Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Set points to 10"
              accessibilityHint="Quick select 10 points for adjustment"
              style={[styles.presetBtn, { backgroundColor: themeColors.secondary }]}
              onPress={() => setAmount('10')}
            >
              <Text style={styles.presetBtnText}>10</Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Set points to 25"
              accessibilityHint="Quick select 25 points for adjustment"
              style={[styles.presetBtn, { backgroundColor: themeColors.secondary }]}
              onPress={() => setAmount('25')}
            >
              <Text style={styles.presetBtnText}>25</Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Set points to 50"
              accessibilityHint="Quick select 50 points for adjustment"
              style={[styles.presetBtn, { backgroundColor: themeColors.secondary }]}
              onPress={() => setAmount('50')}
            >
              <Text style={styles.presetBtnText}>50</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Give points to child"
            accessibilityHint="Add points to the selected money pot"
            style={[styles.actionBtn, { backgroundColor: themeColors.primary }]}
            onPress={() => handlePoints(true)}
          >
            <Text style={[styles.actionBtnText, { color: themeColors.card }]}>Give Points</Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Take points from child"
            accessibilityHint="Subtract points from the selected money pot"
            style={[styles.actionBtn, { backgroundColor: themeColors.warning }]}
            onPress={() => handlePoints(false)}
          >
            <Text style={[styles.actionBtnText, { color: themeColors.card }]}>Take Points</Text>
          </TouchableOpacity>
        </View>

      </View>



      {/* Recent Activity Section */}
      {recentTransactions.length > 0 && (
        <View style={[styles.sectionCard, { backgroundColor: themeColors.card, shadowColor: themeColors.border }]}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Recent Activity</Text>
          <View style={{ gap: 8 }}>
            {recentTransactions.map((transaction, index) => {
              const isPositive = transaction.amount > 0;
              const jarName = jarOptions.find(jar => jar.value === transaction.toJar)?.label || 'Unknown Pot';
              const date = transaction.date || transaction.createdAt;
              const displayDate = date ? new Date(date).toLocaleDateString() : 'Unknown';

              return (
                <View
                  key={transaction._id || index}
                  style={{
                    backgroundColor: themeColors.surface,
                    borderRadius: 8,
                    padding: 12,
                    borderLeftWidth: 3,
                    borderLeftColor: isPositive ? themeColors.success : themeColors.error
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{
                        ...SEMANTIC_TYPOGRAPHY["type-body-small"],
                        color: themeColors.text,
                        marginBottom: 2
                      }}>
                        {isPositive ? '+' : ''}{Math.abs(transaction.amount)} points
                      </Text>
                      <Text style={{
                        ...SEMANTIC_TYPOGRAPHY["type-caption-small"],
                        color: themeColors.textSecondary
                      }}>
                        {jarName} • {displayDate}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Dropdown Modal */}
      <Modal
        visible={dropdownVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDropdownVisible(false)}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            alignItems: 'center'
          }}
          activeOpacity={1}
          onPress={() => setDropdownVisible(false)}
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
              maxWidth: 300
            }}
            activeOpacity={1}
          >
            {jarOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                accessibilityRole="button"
                accessibilityLabel={`Select ${option.label} pot`}
                accessibilityHint="Choose this money pot for points adjustment"
                style={{
                  padding: 16,
                  borderBottomWidth: option.value === 'invest' ? 0 : 1,
                  borderBottomColor: themeColors.border
                }}
                onPress={() => handleJarSelect(option.value)}
              >
                <Text style={{
                  ...SEMANTIC_TYPOGRAPHY["type-body"],
                  color: themeColors.text
                }}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Help Modal */}
      <HelpModal
        visible={helpModalVisible}
        onClose={() => setHelpModalVisible(false)}
        title="💰 Manage Your Child's Points - Help"
        tabs={[
          {
            title: "Parent Points Control",
            content: [
              {
                type: "text",
                text: "As a parent, you can add or subtract points from your child's money pots to reward good behavior or teach lessons.",
                icon: "👨‍👩‍👧‍👦"
              },
              {
                type: "bullet",
                text: "Give points as rewards for chores, good grades, or helpful actions"
              },
              {
                type: "bullet",
                text: "Take points for teaching about consequences or mistakes"
              },
              {
                type: "bullet",
                text: "Choose which money pot to affect"
              },
              {
                type: "highlight",
                text: "All changes are recorded in transaction history for tracking!",
                icon: "📊"
              }
            ]
          },
          {
            title: "Money Pots Explained",
            content: [
              {
                type: "text",
                text: "Help your child learn money management by using different pots:",
                icon: "🏺"
              },
              {
                type: "bullet",
                text: "Pocket Money - Immediate spending"
              },
              {
                type: "bullet",
                text: "Savings Pot - Long-term goals"
              },
              {
                type: "bullet",
                text: "Spending Pot - Fun purchases"
              },
              {
                type: "bullet",
                text: "Help Others Pot - Charity and giving"
              },
              {
                type: "bullet",
                text: "Grow Money Pot - Investment learning"
              },
              {
                type: "highlight",
                text: "Use pots strategically to teach valuable money lessons!",
                icon: "🎓"
              }
            ]
          },
          {
            title: "When to Use",
            content: [
              {
                type: "text",
                text: "Good times to adjust points:",
                icon: "⏰"
              },
              {
                type: "bullet",
                text: "Completed chores or extra helpfulness"
              },
              {
                type: "bullet",
                text: "Good grades or learning achievements"
              },
              {
                type: "bullet",
                text: "Family contributions or responsibilities"
              },
              {
                type: "highlight",
                text: "Be consistent and explain your reasoning to help your child learn!",
                icon: "💬"
              }
            ]
          }
        ]}
      />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (themeColors: any) => StyleSheet.create({
  scroll: { backgroundColor: themeColors.background },
  container: { alignItems: 'center', paddingVertical: 12, paddingHorizontal: 6 },
  title: { ...SEMANTIC_TYPOGRAPHY["type-display-medium"], marginBottom: 22, marginTop: 6, color: themeColors.primary },
  sectionCard: { backgroundColor: themeColors.card, borderRadius: 16, marginBottom: 16, padding: 16, minWidth: 320, width: '97%', maxWidth: 520, elevation: 3, shadowColor: themeColors.border },
  sectionTitle: { fontSize: 20, marginBottom: 12, color: themeColors.text },
  inputLabel: { marginBottom: 4, color: themeColors.text, ...SEMANTIC_TYPOGRAPHY["type-body-small"] },
  input: { borderWidth: 1, borderColor: themeColors.border, borderRadius: 7, padding: 8, ...SEMANTIC_TYPOGRAPHY["type-body"], marginBottom: 2, backgroundColor: themeColors.surface, color: themeColors.text },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  actionBtn: { flex: 1, backgroundColor: themeColors.primary, padding: 12, borderRadius: 8, marginHorizontal: 4, alignItems: 'center' },
  actionBtnText: { color: themeColors.card, ...SEMANTIC_TYPOGRAPHY["type-body"] },
  validation: { color: themeColors.error, ...SEMANTIC_TYPOGRAPHY["type-body-small"] },
  statusMessage: { ...SEMANTIC_TYPOGRAPHY["type-body-small"], color: themeColors.success },
  placeholder: { color: themeColors.textSecondary, fontStyle: 'italic', ...SEMANTIC_TYPOGRAPHY["type-body-small"], marginBottom: 1, marginTop: 2, minHeight: 26 },
  jarsContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginTop: 10 },
  jar: { borderRadius: 14, padding: 18, minWidth: 80, alignItems: 'center', elevation: 2, shadowColor: themeColors.border, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2 },
  jarLabel: { ...SEMANTIC_TYPOGRAPHY["type-body-small"], marginBottom: 4 },
  jarValue: { ...SEMANTIC_TYPOGRAPHY["type-heading-small"] },
  presetContainer: { marginTop: 16, marginBottom: 8 },
  presetRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  presetBtn: { flex: 1, paddingVertical: 10, paddingHorizontal: 8, borderRadius: 6, marginHorizontal: 2, alignItems: 'center', minWidth: 50 },
  presetBtnText: { color: themeColors.card, ...SEMANTIC_TYPOGRAPHY["type-body-small"] },
  childSelector: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 8 },
  childButton: {
    backgroundColor: themeColors.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    margin: 4,
    minWidth: 80,
    maxWidth: 180,
    alignItems: 'center',
    overflow: 'hidden'
  },
  childButtonSelected: { backgroundColor: themeColors.primary },
  childButtonText: { color: themeColors.text, ...SEMANTIC_TYPOGRAPHY["type-body-small"]
  },
  childButtonTextSelected: { color: themeColors.card },
  // Child selector styles for enhanced design
  countBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  countText: {
    color: themeColors.card,
    ...SEMANTIC_TYPOGRAPHY["type-body-small"],
  },
  childrenScroll: {
    marginTop: 8
  },
  childrenScrollContent: {
    paddingHorizontal: 4
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
    shadowRadius: 2
  },
  childAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: themeColors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4
  },
  childAvatarText: {
    fontSize: 20,
  },
  childName: {
    ...SEMANTIC_TYPOGRAPHY["type-caption-small"],
    textAlign: 'center'
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
    justifyContent: 'center'
  },
  selectedCheckmark: {
    color: themeColors.card,
    ...SEMANTIC_TYPOGRAPHY["type-body-small"],
  },
  // Points summary dashboard
  refreshBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8
  },
  summaryItem: {
    flex: 1,
    minWidth: 140,
    maxWidth: 160,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 1,
    shadowColor: themeColors.shadow || '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2
  },
  summaryLabel: {
    ...SEMANTIC_TYPOGRAPHY["type-body-small"],
    textAlign: 'center',
    marginBottom: 4
  },
  summaryValue: {
    ...SEMANTIC_TYPOGRAPHY["type-heading-small"],
    textAlign: 'center'
  }
  });
