import React, { useCallback, useEffect, useState } from 'react';
import { Modal, Platform, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import HelpModal from '@/components/HelpModal';
import { createTransaction, fetchFamilyChildren, fetchTransactions, fetchUser, patchUserPoints } from '@/utils/api';
import { useGlobalFeedback } from '@/utils/globalFeedbackContext';
import { getAuthToken } from '@/utils/secureStorage';
import { useTheme } from '@/utils/themeContext';
import { useFocusEffect } from '@react-navigation/native';
/* @ts-ignore */
import BackButton from '@/components/BackButton';

export default function ParentsPointsScreen() {
  const { themeColors } = useTheme();
  const styles = createStyles(themeColors);
  const { showError, showFeedback } = useGlobalFeedback();
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

  // Load child data when selected child changes
  useEffect(() => {
    if (selectedChildId && children.length > 0) {
      loadChildData();
    }
  }, [selectedChildId, children]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadChildData();
  }, []);

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
          setSelectedChildId(firstChildId);
        }
      }
    } catch (error) {
      console.error('Error loading children:', error);
    }
  };

  const loadChildData = async () => {
    if (!selectedChildId) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const token = await getAuthToken();
      const selectedChild = children.find(child => child.id === selectedChildId);

      if (selectedChild) {
        const childUserData = await fetchUser(selectedChild.id, token);

        if (childUserData) {
          setChildData({
            name: childUserData.name || selectedChild.name || 'Child',
            currentPoints: childUserData.currentPoints || 0,
            savePoints: childUserData.savePoints || 0,
            spendPoints: childUserData.spendPoints || 0,
            donatePoints: childUserData.donatePoints || 0,
            investPoints: childUserData.investPoints || 0,
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
  };

  async function handlePoints(isAdd: boolean) {
    console.log('handlePoints called with isAdd:', isAdd, 'amount:', amount, 'toJar:', toJar);

    // Reset errors - all error/feedback is now global
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      showError('Enter a valid positive number for points.');
      return;
    }



    try {
      // Get current user and child info
      const { getUser } = await import('@/utils/secureStorage');
      const currentUser = await getUser();
      if (!currentUser) {
        showError('User not logged in.');
        return;
      }
      if (currentUser.role !== 'parent' || !currentUser.familyId) {
        showError('Invalid parent account.');
        return;
      }

      // Get family children
      const token = await getAuthToken();
      if (!token) {
        showError('Authentication failed. Please log in again.');
        return;
      }

      const children = await fetchFamilyChildren(currentUser.familyId as string, token);
      console.log('Fetched children:', children);

      if (!children || children.length === 0) {
        showError('No child found.');
        return;
      }

      // Find the selected child
      const child = children.find((c: any) => c.id === selectedChildId);
      if (!child) {
        showError('Selected child not found.');
        return;
      }
      console.log('Using child:', child);

      const pointsField = toJar + 'Points';
      const currentValue = child[pointsField] || 0;
      const changeAmount = parseInt(amount, 10);
      console.log('Current value in', pointsField, ':', currentValue);
      console.log('Change amount:', changeAmount);

      // Check if subtracting would result in negative points
      if (!isAdd && currentValue < changeAmount) {
        showError(`Not enough points in ${jarOptions.find(j => j.value === toJar)?.label} pot.`);
        return;
      }

      // Calculate new value
      const newValue = isAdd ? currentValue + changeAmount : currentValue - changeAmount;
      console.log('New value will be:', newValue);

      // Update child points via API
      const updateData = { [pointsField]: newValue };
      console.log('Calling patchUserPoints with:', updateData);
      // @ts-ignore
      await patchUserPoints(child.id, updateData, token);

      // Create transaction record
      const transactionData = {
        userId: child.id,
        type: 'parent-points-adjustment',
        description: `Parent ${isAdd ? 'added' : 'subtracted'} ${changeAmount} points ${isAdd ? 'to' : 'from'} ${toJar} jar`,
        amount: isAdd ? changeAmount : -changeAmount,
        toJar: toJar
      };
      console.log('Creating transaction:', transactionData);
      // @ts-ignore
      await createTransaction(transactionData, token);

      // Refresh child data
      console.log('Refreshing child data...');
      await loadChildData();

      // Check what the updated value is
      const updatedChildren = await fetchFamilyChildren(currentUser.familyId as string, token);
      if (updatedChildren && updatedChildren.length > 0) {
        const updatedChild = updatedChildren[0];
        const updatedChildData = await fetchUser(updatedChild.id, token);
        console.log('After update - database shows currentPoints:', updatedChildData?.currentPoints);
      }

      showFeedback(
        `${isAdd ? 'Added' : 'Subtracted'} ${amount} points ${isAdd ? 'to' : 'from'} the ${jarOptions.find(
          j => j.value === toJar
        )?.label} pot.`
      );
      setAmount('');

    } catch (error) {
      console.error('Error updating points:', error);
      showError('Failed to update points. Please try again.');
    }
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: 520, marginBottom: 22, marginTop: 6 }}>
        <BackButton label="Back to Home" to="/(parents-tabs)" />
        <TouchableOpacity
          style={{
            backgroundColor: themeColors.accent,
            borderRadius: 20,
            paddingHorizontal: 12,
            paddingVertical: 6,
            elevation: 2,
          }}
          onPress={() => setHelpModalVisible(true)}
        >
          <Text style={{ color: themeColors.card, fontWeight: 'bold', fontSize: 14 }}>❓ Help</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.title, { color: themeColors.primary }]}>Manage Your Child's Points</Text>

      {/* Child Selector */}
      {children.length > 1 && (
        <View style={[styles.sectionCard, { backgroundColor: themeColors.card, shadowColor: themeColors.border }]}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Select Child</Text>
          <View style={styles.childSelector}>
            {children.map((child) => (
              <TouchableOpacity
                key={child.id}
                style={[
                  styles.childButton,
                  selectedChildId === child.id && styles.childButtonSelected
                ]}
                onPress={() => setSelectedChildId(child.id)}
              >
                <Text style={[
                  styles.childButtonText,
                  selectedChildId === child.id && styles.childButtonTextSelected
                ]}>
                  {child.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Child Name Display - Single Child per Parent */}
      {children.length === 1 && (
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          marginBottom: 14,
          marginTop: 6,
          width: '100%',
        }}>
          <Text style={{ fontSize: 15, color: themeColors.primary, fontWeight: '600', marginRight: 4 }}>Child:</Text>
          <Text
            style={{
              backgroundColor: themeColors.primary,
              color: themeColors.card,
              borderRadius: 18,
              paddingHorizontal: 14,
              paddingVertical: 6,
              fontWeight: '700',
              maxWidth: 140,
              fontSize: 15,
              overflow: 'hidden',
              textAlign: 'center',
            }}
            numberOfLines={1}
            ellipsizeMode="tail"
            allowFontScaling
          >
            {children[0].name}
          </Text>
        </View>
      )}

      {/* Refresh Button */}
      <View style={[styles.sectionCard, { backgroundColor: themeColors.card, shadowColor: themeColors.border }]}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={refreshing ? "Refreshing child's data" : "Refresh child's data"}
          accessibilityHint="Reload latest information about your child's points"
          accessibilityState={{ disabled: refreshing }}
          style={[styles.actionBtn, { backgroundColor: themeColors.secondary, alignSelf: 'center', minWidth: 200 }]}
          onPress={onRefresh}
          disabled={refreshing}
        >
          <Text style={[styles.actionBtnText, { color: themeColors.card }]}>
            {refreshing ? 'Refreshing...' : '🔄 Refresh Your Child\'s Data'}
          </Text>
        </TouchableOpacity>
      </View>

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
                    fontSize: 16,
                    padding: 8,
                    marginTop: 2,
                    backgroundColor: themeColors.surface,
                    color: themeColors.text,
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
                    fontSize: 16,
                    color: themeColors.text || '#000',
                    flex: 1
                  }}>
                    {selectedJarLabel}
                  </Text>
                  <Text style={{
                    fontSize: 16,
                    color: themeColors.primary,
                    fontWeight: 'bold'
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
          <Text style={[styles.inputLabel, { fontSize: 14, marginBottom: 8 }]}>Quick Amounts:</Text>
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

      {/* Child Points Overview */}
      <View style={[styles.sectionCard, { backgroundColor: themeColors.card, shadowColor: themeColors.border }]}>
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
{childData ? `${childData.name}'s Points` : "Your Child's Points"}
        </Text>
        {loading ? (
          <Text style={styles.placeholder}>Loading child data...</Text>
        ) : childData ? (
          <View style={styles.jarsContainer}>
            <View style={[styles.jar, { backgroundColor: themeColors.jarColors.current, borderColor: themeColors.success }]}>
              <Text style={[styles.jarLabel, { color: themeColors.success }]}>Pocket Money</Text>
              <Text style={[styles.jarValue, { color: themeColors.success }]}>{childData.currentPoints}</Text>
            </View>
            <View style={[styles.jar, { backgroundColor: themeColors.jarColors.save, borderColor: themeColors.primary }]}>
              <Text style={[styles.jarLabel, { color: themeColors.primary }]}>Savings Pot</Text>
              <Text style={[styles.jarValue, { color: themeColors.primary }]}>{childData.savePoints}</Text>
            </View>
            <View style={[styles.jar, { backgroundColor: themeColors.jarColors.spend, borderColor: themeColors.accent }]}>
              <Text style={[styles.jarLabel, { color: themeColors.accent }]}>Spending Pot</Text>
              <Text style={[styles.jarValue, { color: themeColors.accent }]}>{childData.spendPoints}</Text>
            </View>
            <View style={[styles.jar, { backgroundColor: themeColors.jarColors.donate, borderColor: themeColors.warning }]}>
              <Text style={[styles.jarLabel, { color: themeColors.text }]}>Help Others Pot</Text>
              <Text style={[styles.jarValue, { color: themeColors.text }]}>{childData.donatePoints}</Text>
            </View>
            <View style={[styles.jar, { backgroundColor: themeColors.jarColors.invest, borderColor: themeColors.secondary }]}>
              <Text style={[styles.jarLabel, { color: themeColors.secondary }]}>Grow Money Pot</Text>
              <Text style={[styles.jarValue, { color: themeColors.secondary }]}>{childData.investPoints}</Text>
            </View>
          </View>
        ) : (
          <Text style={styles.placeholder}>
            No child is linked to your account. Add a child to manage their pots.
          </Text>
        )}
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
                        fontSize: 14,
                        fontWeight: '600',
                        color: themeColors.text,
                        marginBottom: 2
                      }}>
                        {isPositive ? '+' : ''}{Math.abs(transaction.amount)} points
                      </Text>
                      <Text style={{
                        fontSize: 12,
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
                  fontSize: 16,
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
  );
}

const createStyles = (themeColors: any) => StyleSheet.create({
  scroll: { backgroundColor: themeColors.background },
  container: { alignItems: 'center', paddingVertical: 12, paddingHorizontal: 6 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 22, marginTop: 6, color: themeColors.primary },
  sectionCard: { backgroundColor: themeColors.card, borderRadius: 16, marginBottom: 16, padding: 16, minWidth: 320, width: '97%', maxWidth: 520, elevation: 3, shadowColor: themeColors.border },
  sectionTitle: { fontSize: 20, fontWeight: '600', marginBottom: 12, color: themeColors.text },
  inputLabel: { fontWeight: '500', marginBottom: 4, color: themeColors.text, fontSize: 15 },
  input: { borderWidth: 1, borderColor: themeColors.border, borderRadius: 7, padding: 8, fontSize: 16, marginBottom: 2, backgroundColor: themeColors.surface, color: themeColors.text },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  actionBtn: { flex: 1, backgroundColor: themeColors.primary, padding: 12, borderRadius: 8, marginHorizontal: 4, alignItems: 'center' },
  actionBtnText: { fontWeight: '700', color: themeColors.card, fontSize: 16 },
  validation: { color: themeColors.error, fontSize: 15 },
  statusMessage: { fontSize: 15, fontWeight: '600', color: themeColors.success },
  placeholder: { color: themeColors.textSecondary, fontStyle: 'italic', fontSize: 15, marginBottom: 1, marginTop: 2, minHeight: 26 },
  jarsContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginTop: 10 },
  jar: { borderRadius: 14, padding: 18, minWidth: 80, alignItems: 'center', elevation: 2, shadowColor: themeColors.border, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2 },
  jarLabel: { fontWeight: 'bold', fontSize: 14, marginBottom: 4 },
  jarValue: { fontSize: 18, fontWeight: 'bold' },
  presetContainer: { marginTop: 16, marginBottom: 8 },
  presetRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  presetBtn: { flex: 1, paddingVertical: 10, paddingHorizontal: 8, borderRadius: 6, marginHorizontal: 2, alignItems: 'center', minWidth: 50 },
  presetBtnText: { color: themeColors.card, fontWeight: '600', fontSize: 14 },
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
    overflow: 'hidden',
  },
  childButtonSelected: { backgroundColor: themeColors.primary },
  childButtonText: { color: themeColors.text, fontSize: 14, fontWeight: '600' },
  childButtonTextSelected: { color: themeColors.card },
});
