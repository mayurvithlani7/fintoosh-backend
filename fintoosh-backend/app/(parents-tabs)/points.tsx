import { Picker } from '@react-native-picker/picker';
import React, { useCallback, useEffect, useState } from 'react';
import { Platform, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import HelpModal from '@/components/HelpModal';
import { createTransaction, fetchFamilyChildren, fetchUser, patchUserPoints } from '@/utils/api';
import { useGlobalFeedback } from '@/utils/globalFeedbackContext';
import { getAuthToken } from '@/utils/secureStorage';
import { useTheme } from '@/utils/themeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
/* @ts-ignore */
import BackButton from '@/components/BackButton';

export default function ParentsPointsScreen() {
  const { themeColors } = useTheme();
  const styles = createStyles(themeColors);
  const { showError, showFeedback } = useGlobalFeedback();
  const [amount, setAmount] = useState('');
  const [toJar, setToJar] = useState<'current' | 'save' | 'spend' | 'donate' | 'invest'>('current');
  const [childData, setChildData] = useState<{
    name: string;
    currentPoints: number;
    savePoints: number;
    spendPoints: number;
    donatePoints: number;
    investPoints: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [helpModalVisible, setHelpModalVisible] = useState(false);
  const jarOptions = [
    { label: 'Pocket Money', value: 'current' },
    { label: 'Savings Pot', value: 'save' },
    { label: 'Spending Pot', value: 'spend' },
    { label: 'Help Others Pot', value: 'donate' },
    { label: 'Grow Money Pot', value: 'invest' }
  ];

  useEffect(() => {
    loadChildData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadChildData();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadChildData();
  }, []);

  const loadChildData = async () => {
    try {
      const currentUserStr = await AsyncStorage.getItem('user');
      if (!currentUserStr) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const currentUser = JSON.parse(currentUserStr);
      if (currentUser.role !== 'parent' || !currentUser.familyId) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // Get family children
      const token = await getAuthToken();
      const children = await fetchFamilyChildren(currentUser.familyId, token);

      if (children && children.length > 0) {
        // Get the first child's data
        const firstChild = children[0];
        const childUserData = await fetchUser(firstChild.id, token);

        if (childUserData) {
          setChildData({
            name: childUserData.name || firstChild.name || 'Child',
            currentPoints: childUserData.currentPoints || 0,
            savePoints: childUserData.savePoints || 0,
            spendPoints: childUserData.spendPoints || 0,
            donatePoints: childUserData.donatePoints || 0,
            investPoints: childUserData.investPoints || 0,
          });
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
      const currentUserStr = await AsyncStorage.getItem('user');
      if (!currentUserStr) {
        showError('User not logged in.');
        return;
      }

      const currentUser = JSON.parse(currentUserStr);
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

      const children = await fetchFamilyChildren(currentUser.familyId, token);
      console.log('Fetched children:', children);

      if (!children || children.length === 0) {
        showError('No child found.');
        return;
      }

      const child = children[0]; // Use first child
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
      const updatedChildren = await fetchFamilyChildren(currentUser.familyId, token);
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

      {/* Refresh Button */}
      <View style={[styles.sectionCard, { backgroundColor: themeColors.card, shadowColor: themeColors.border }]}>
        <TouchableOpacity
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
                  {jarOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <View style={{
                backgroundColor: themeColors.surface,
                borderRadius: 7,
                borderWidth: 1,
                borderColor: themeColors.border,
                marginRight: 5,
                paddingVertical: 2,
                minHeight: 40
              }}>
                <Picker
                  selectedValue={toJar}
                  onValueChange={v => setToJar(v)}
                  style={{height: 36, fontSize: 15, width: "100%", color: themeColors.text}}
                  dropdownIconColor={themeColors.primary}
                  itemStyle={{ color: themeColors.text }}
                >
                  {jarOptions.map(opt => (
                    <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
                  ))}
                </Picker>
              </View>
            )}
          </View>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: themeColors.primary }]} onPress={() => handlePoints(true)}>
            <Text style={[styles.actionBtnText, { color: themeColors.card }]}>Give Points</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: themeColors.warning }]} onPress={() => handlePoints(false)}>
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
});
