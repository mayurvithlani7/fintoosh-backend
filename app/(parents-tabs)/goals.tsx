import BackButton from '@/components/BackButton';
import GoalTemplates from '@/components/GoalTemplates';
import HelpModal from '@/components/HelpModal';
import ValidationMessage from '@/components/ui/ValidationMessage';
import { API_URL } from '@/utils/config';
import { useDataCache } from '@/utils/dataCacheContext';
import { getAuthToken } from '@/utils/secureStorage';
import { useTheme } from '@/utils/themeContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Platform, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { useGlobalFeedback } from '@/utils/globalFeedbackContext';
export default function ParentsGoalsScreen() {
  console.log('ParentsGoalsScreen component rendered');

  const { themeColors } = useTheme();
  const styles = createStyles(themeColors);
  const { childData, fetchChildData } = useDataCache();

  console.log('Goals screen - childData:', childData);
  console.log('Goals screen - childData?.id:', childData?.id);
  console.log('Goals screen - childData?.name:', childData?.name);

  const [goal, setGoal] = useState('');
  const [description, setDescription] = useState('');
  const [pointsNeeded, setPointsNeeded] = useState('');
  const [deadline, setDeadline] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedJar, setSelectedJar] = useState('current');
  const [selectedChild, setSelectedChild] = useState(childData?.id || '');
  const [children, setChildren] = useState<{ id: string; name: string }[]>(childData ? [{ id: childData.id, name: childData.name }] : []);

  console.log('Goals screen - selectedChild:', selectedChild);
  console.log('Goals screen - children:', children);
  const [goals, setGoals] = useState<{
    _id: string;
    name: string;
    description?: string;
    targetAmount: number;
    jar: string;
    deadline?: string;
    status: string;
    createdAt: string;
  }[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  // Validation
  const [goalNameError, setGoalNameError] = useState<string | null>(null);
  const [pointsError, setPointsError] = useState<string | null>(null);

  // No auto suggestions; cleaned out.
  // New: Tab/filter for goals
  const [goalsTab, setGoalsTab] = useState<'Active' | 'Completed'>('Active');
  // Show/hide archive for Completed
  const [showAllCompleted, setShowAllCompleted] = useState(false);
  const [helpModalVisible, setHelpModalVisible] = useState(false);
  const [editingGoal, setEditingGoal] = useState<any>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const scrollViewRef = React.useRef<ScrollView>(null);

  const jarOptions = [
    { label: 'Pocket Money', value: 'current' },
    { label: 'Savings Pot', value: 'save' },
    { label: 'Spending Pot', value: 'spend' },
    { label: 'Help Others Pot', value: 'donate' },
    { label: 'Grow Money Pot', value: 'invest' }
  ];

  useEffect(() => {
    loadChildren();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (selectedChild) {
        loadGoals();
      }
    }, [selectedChild])
  );

  const loadChildren = async () => {
    try {
      const token = await getAuthToken();
      if (!token) {
        console.log('No token available for loading children');
        return;
      }

      console.log('Loading children with token:', token.substring(0, 20) + '...');

      // First get current user to get familyId
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const currentUserStr = await AsyncStorage.getItem('user');
      if (!currentUserStr) {
        console.log('No user data in storage');
        return;
      }

      const currentUser = JSON.parse(currentUserStr);
      const familyId = currentUser.familyId;
      console.log('Loading children for familyId:', familyId);

      const response = await fetch(`${API_URL}/users?familyId=${familyId}&role=child`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      console.log('Children API response status:', response.status);

      if (response.ok) {
        const childUsers = await response.json();
        console.log('Family children fetched:', childUsers.length, 'children');

        setChildren(childUsers.map((child: any) => ({ id: child.id, name: child.name })));

        // Auto-select first child if available
        if (childUsers.length > 0 && !selectedChild) {
          console.log('Auto-selecting first child:', childUsers[0].name, 'with ID:', childUsers[0].id);
          setSelectedChild(childUsers[0].id);
        }
      } else {
        console.error('Failed to load children, status:', response.status);
        const errorText = await response.text();
        console.error('Error response:', errorText);
      }
    } catch (err) {
      console.error('Error loading children:', err);
    }
  };

  const loadGoals = async () => {
    if (!selectedChild) {
      setRefreshing(false);
      return;
    }

    try {
      setLoading(true);
      const token = await getAuthToken();
      if (!token) {
        setRefreshing(false);
        return;
      }

      const response = await fetch(`${API_URL}/goals/${selectedChild}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const goalsData = await response.json();
        setGoals(goalsData);
      }
    } catch (err) {
      console.error('Error loading goals:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadGoals();
  }, [selectedChild]);

  const { showError, showFeedback } = useGlobalFeedback();
  const handleAddGoal = async () => {
    console.log('[PARENTS GOALS] handleAddGoal called', {
      goal: goal.trim(),
      pointsNeeded: pointsNeeded.trim(),
      selectedChild,
      selectedJar,
      editingGoal: !!editingGoal
    });

    if (!goal.trim() || !pointsNeeded.trim()) {
      console.log('[PARENTS GOALS] Validation failed: missing goal or points');
      showError('Please enter a goal and points amount.');
      return;
    }

    if (isNaN(Number(pointsNeeded)) || Number(pointsNeeded) <= 0) {
      console.log('[PARENTS GOALS] Validation failed: invalid points amount');
      showError('Please enter a valid points amount (>0).');
      return;
    }

    // Deadline validation (prevent backdate by picker bug/programmatic issue, double safety)
    if (deadline.trim()) {
      const today = new Date();
      today.setHours(0,0,0,0);
      const deadlineDate = new Date(deadline.trim());
      if (isNaN(deadlineDate.getTime())) {
        console.log('[PARENTS GOALS] Validation failed: invalid deadline');
        showError('Please enter a valid deadline date (YYYY-MM-DD).');
        return;
      }
      if (deadlineDate < today) {
        console.log('[PARENTS GOALS] Validation failed: deadline in past');
        showError('Deadline can\'t be in the past. Please pick today or a future date.');
        return;
      }
    }

    try {
      console.log('[PARENTS GOALS] Getting auth token...');
      const token = await getAuthToken();
      console.log('[PARENTS GOALS] Token retrieved:', token ? `${token.substring(0, 20)}...` : 'null');

      if (!token) {
        console.log('[PARENTS GOALS] No token found');
        showError('Not authenticated. Please login again.');
        return;
      }

      const requestBody: any = {
        name: goal.trim(),
        targetAmount: Number(pointsNeeded),
        jar: selectedJar,
      };

      if (description.trim()) {
        requestBody.description = description.trim();
      }

      if (deadline.trim()) {
        requestBody.deadline = deadline.trim();
      }

      let response;
      let apiUrl;
      if (editingGoal) {
        // Update existing goal
        apiUrl = `${API_URL}/goals/${editingGoal._id}`;
        console.log('[PARENTS GOALS] Updating goal:', apiUrl, requestBody);
        response = await fetch(apiUrl, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(requestBody),
        });
      } else {
        // Add new goal
        requestBody.childId = selectedChild;
        apiUrl = `${API_URL}/goals`;
        console.log('[PARENTS GOALS] Creating goal:', apiUrl, requestBody);
        response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(requestBody),
        });
      }

      console.log('[PARENTS GOALS] API Response:', {
        status: response.status,
        statusText: response.statusText,
        url: apiUrl
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: editingGoal ? 'Failed to update goal' : 'Failed to add goal' }));
        console.log('[PARENTS GOALS] API Error:', errorData);
        throw new Error(errorData.message || (editingGoal ? 'Failed to update goal' : 'Failed to add goal'));
      }

      const responseData = await response.json();
      console.log('[PARENTS GOALS] API Success:', responseData);

      setGoal('');
      setDescription('');
      setPointsNeeded('');
      setDeadline('');
      setSelectedJar('current');
      setEditingGoal(null);
      showFeedback(editingGoal ? 'Goal updated successfully!' : 'Goal added successfully!');

      // Refresh goals list
      loadGoals();
    } catch (err: any) {
      console.error('[PARENTS GOALS] Error saving goal:', err);
      showError(err.message || (editingGoal ? 'Failed to update goal. Please try again.' : 'Failed to add goal. Please try again.'));
    }
  };

  const handleChildChange = (childId: string) => {
    setSelectedChild(childId);
  };

  // Handle template selection for parents
  const handleTemplateSelect = (template: any) => {
    // Pre-populate the form with template data
    setGoal(template.name);
    setPointsNeeded(template.targetAmount.toString());
    setDescription(template.description);

    // Set jar to the one with highest allocation
    const jarAllocations = template.jarAllocations as Record<string, number>;
    const primaryJar = Object.entries(jarAllocations).reduce((a, b) => jarAllocations[a[0]] > jarAllocations[b[0]] ? a : b)[0];
    setSelectedJar(primaryJar);

    // Calculate deadline from duration
    const deadlineDate = new Date(Date.now() + template.duration * 24 * 60 * 60 * 1000);
    const formattedDeadline = deadlineDate.toISOString().split('T')[0];
    setDeadline(formattedDeadline);

    // Close modal
    setShowTemplates(false);

    // Clear any validation errors
    setGoalNameError(null);
    setPointsError(null);

    // Scroll to top to show the form
    scrollViewRef.current?.scrollTo({ x: 0, y: 0, animated: true });
  };

  const handleDeleteGoal = async (goalId: string, goalName: string) => {
    Alert.alert(
      'Delete Goal',
      `Are you sure you want to delete "${goalName}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await getAuthToken();
              if (!token) {
                showError('Not authenticated.');
                return;
              }

              const response = await fetch(`${API_URL}/goals/${goalId}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`,
                },
              });

              if (!response.ok) {
                let errorMessage = 'Failed to delete goal.';
                try {
                  const errorData = await response.json();
                  errorMessage = errorData.message || errorMessage;
                } catch {
                  // If JSON parsing fails, use default message
                }
                showError(errorMessage);
                return;
              }

              showFeedback(`Goal "${goalName}" deleted successfully.`);

              // Refresh goals list
              loadGoals();
            } catch (error) {
              console.error('Error deleting goal:', error);
              showError('Failed to delete goal.');
            }
          }
        }
      ]
    );
  };

  return (
    <ScrollView
      ref={scrollViewRef}
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
            borderRadius: 16,
            paddingHorizontal: 8,
            paddingVertical: 4,
            elevation: 2,
            minWidth: 32,
            alignItems: 'center',
          }}
          onPress={() => setHelpModalVisible(true)}
        >
          <Text style={{ color: themeColors.card, fontWeight: 'bold', fontSize: 14 }}>❓ Help</Text>
        </TouchableOpacity>
      </View>
      <Text style={[styles.title, { color: themeColors.primary }]}>Set Child Goals</Text>

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

      {/* Add/Edit Goal Form */}
      <View style={[styles.sectionCard, { backgroundColor: themeColors.card, shadowColor: themeColors.border }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>{editingGoal ? 'Edit Goal' : 'Add New Goal'}</Text>
          {!editingGoal && (
            <TouchableOpacity
              style={[styles.templateBtn, { backgroundColor: themeColors.secondary }]}
              onPress={() => setShowTemplates(true)}
              accessibilityRole="button"
              accessibilityLabel="Use goal template"
              accessibilityHint="Browse and select from pre-made goal templates"
            >
              <Text style={[styles.templateBtnText, { color: themeColors.card }]}>🎯 Use Template</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.formRow}>
          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>Goal Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. New bike"
              value={goal}
              onChangeText={val => {
                setGoal(val);
                if (!val.trim()) setGoalNameError("Please enter a goal name.");
                else if (val.length < 3) setGoalNameError("Goal name must be at least 3 characters.");
                else if (editingGoal ? goals.some(g => g._id !== editingGoal._id && g.name.trim().toLowerCase() === val.trim().toLowerCase()) : goals.some(g => g.name.trim().toLowerCase() === val.trim().toLowerCase()))
                  setGoalNameError("You already have a goal with this name.");
                else setGoalNameError(null);
              }}
              accessibilityLabel="Goal Name"
            />
            <ValidationMessage message={goalNameError} type={goalNameError ? "error" : "success"} />
          </View>
          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>Points Needed</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 500"
              keyboardType="numeric"
              value={pointsNeeded}
              onChangeText={val => {
                setPointsNeeded(val);
                if (!val.trim()) setPointsError("Please enter required points.");
                else if (isNaN(Number(val)) || Number(val) <= 0) setPointsError("Enter a positive number.");
                else setPointsError(null);
              }}
              accessibilityLabel="Points Needed"
            />
            <ValidationMessage message={pointsError} type={pointsError ? "error" : "success"} />
          </View>
        </View>

        <Text style={styles.inputLabel}>Description (Optional)</Text>
        <TextInput
          style={[styles.input, { height: 60, textAlignVertical: 'top' }]}
          placeholder="Describe what the goal is about..."
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
        />

        <Text style={styles.inputLabel}>Deadline (Optional)</Text>
        {Platform.OS === "web" ? (
          <View style={{ width: '100%' }}>
            <input
              style={{
                width: '100%',
                padding: 8,
                borderRadius: 7,
                border: '1px solid #abc',
                fontSize: 16,
                background: '#f5fafd',
                color: '#112',
                marginBottom: 2,
                boxSizing: 'border-box',
              }}
              type="date"
              min={new Date().toISOString().split("T")[0]}
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
            />
          </View>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.75}
            >
              <Text style={{ color: deadline ? '#112' : '#999', fontSize: 16 }}>
                {deadline ? deadline : 'Select deadline date'}
              </Text>
              <Text style={{ marginLeft: 8, fontSize: 18 }}>📅</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={deadline ? new Date(deadline) : new Date()}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                minimumDate={new Date(new Date().setHours(0, 0, 0, 0))}
                onChange={(event, selectedDate) => {
                  if (Platform.OS === "android") {
                    setShowDatePicker(false);
                    if (event.type === "set" && selectedDate) {
                      const pad = (n: number) => n < 10 ? '0' + n : n;
                      const formatted =
                        selectedDate.getFullYear() + '-' +
                        pad(selectedDate.getMonth() + 1) + '-' +
                        pad(selectedDate.getDate());
                      setDeadline(formatted);
                    }
                  } else { // iOS: picker may be inline (never closes automatically)
                    if (selectedDate) {
                      const pad = (n: number) => n < 10 ? '0' + n : n;
                      const formatted =
                        selectedDate.getFullYear() + '-' +
                        pad(selectedDate.getMonth() + 1) + '-' +
                        pad(selectedDate.getDate());
                      setDeadline(formatted);
                    }
                  }
                }}
              />
            )}
          </>
        )}

        <Text style={styles.inputLabel}>Which Pot?</Text>
        <View style={styles.jarSelector}>
          {jarOptions.map(jar => (
            <TouchableOpacity
              key={jar.value}
              style={[
                styles.jarButton,
                selectedJar === jar.value && styles.jarButtonSelected
              ]}
              onPress={() => setSelectedJar(jar.value)}
            >
              <Text style={[
                styles.jarButtonText,
                selectedJar === jar.value && styles.jarButtonTextSelected
              ]}>
                {jar.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <TouchableOpacity
            style={[styles.formBtn, { backgroundColor: themeColors.primary, flex: editingGoal ? 0.6 : 1 }]}
            onPress={handleAddGoal}
            disabled={Boolean(goalNameError || pointsError)}
            accessibilityLabel={editingGoal ? "Update Goal" : "Add Goal"}
          >
            <Text style={[styles.formBtnText, { color: themeColors.card }]}>{editingGoal ? 'Update Goal' : 'Add Goal'}</Text>
          </TouchableOpacity>
          {editingGoal && (
            <TouchableOpacity
              style={[styles.cancelBtn, { flex: 0.35 }]}
              onPress={() => {
                setEditingGoal(null);
                setGoal('');
                setDescription('');
                setPointsNeeded('');
                setDeadline('');
                setSelectedJar('current');
                setGoalNameError(null);
                setPointsError(null);
              }}
              accessibilityLabel="Cancel Edit"
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Current Goals - With Tabs/Filters */}
      <View style={[styles.sectionCard, { backgroundColor: themeColors.card, shadowColor: themeColors.border }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            {children.length === 1 ? `${children[0].name}'s Goals` : 'Current Goals'}
          </Text>
          <TouchableOpacity
            style={[styles.refreshBtn, { backgroundColor: refreshing ? '#ccc' : themeColors.secondary }, refreshing && styles.refreshBtnDisabled]}
            onPress={onRefresh}
            disabled={refreshing}
          >
            <Text style={[styles.refreshBtnText, { color: refreshing ? '#666' : themeColors.card }, refreshing && styles.refreshBtnTextDisabled]}>
              {refreshing ? 'Refreshing...' : '🔄 Refresh Child\'s Goals'}
            </Text>
          </TouchableOpacity>
        </View>
        {/* Filter Tabs */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 10 }}>
          {['Active', 'Completed'].map(tab => (
            <TouchableOpacity
              key={tab}
              onPress={() => setGoalsTab(tab as "Active" | "Completed")}
              style={{
                backgroundColor: goalsTab === tab ? themeColors.secondary : themeColors.surface,
                paddingHorizontal: 15,
                paddingVertical: 6,
                borderRadius: 18,
                marginHorizontal: 6
              }}
            >
              <Text style={{ color: goalsTab === tab ? themeColors.card : themeColors.text, fontWeight: goalsTab === tab ? 'bold' : '600', fontSize: 15 }}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {loading ? (
          <Text style={styles.placeholder}>Loading goals...</Text>
        ) : (
          (() => {
            // Filter logic with 90-day limit for completed
            let filteredGoals;
            let showArchiveButton = false;
            if (goalsTab === 'Active') {
              filteredGoals = goals.filter(g => g.status !== 'completed');
            } else {
              // "Completed"
              const now = new Date();
              const ninetyDaysAgo = new Date(now);
              ninetyDaysAgo.setDate(now.getDate() - 90);
              const filteredRecent = goals.filter(g =>
                g.status === 'completed' &&
                new Date(g.createdAt) >= ninetyDaysAgo
              );
              const filteredArchived = goals.filter(g =>
                g.status === 'completed' &&
                new Date(g.createdAt) < ninetyDaysAgo
              );
              filteredGoals = filteredRecent;
              showArchiveButton = filteredArchived.length > 0;
              // If "Show All Completed Goals" is enabled, show all
              if (showAllCompleted) {
                filteredGoals = [...filteredRecent, ...filteredArchived].sort((a, b) =>
                  new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );
              }
            }
            if (filteredGoals.length === 0) {
              return (
                <Text style={styles.placeholder}>
                  {goalsTab === 'Active'
                    ? 'No goals in progress.'
                    : 'No goals completed recently.'}
                </Text>
              );
            }
            return (
              <View>
                {filteredGoals.map(g => (
                  <View
                    key={g._id}
                    style={{
                      backgroundColor: themeColors.surface,
                      marginVertical: 5,
                      padding: 12,
                      borderRadius: 7,
                    }}
                  >
                    <Text style={{ marginBottom: 4 }}>
                      <Text style={{ fontWeight: 'bold', color: themeColors.text, fontSize: 16 }}>{g.name}</Text>
                    </Text>
                    {g.description && (
                      <Text style={{ fontSize: 14, color: themeColors.textSecondary, marginBottom: 6 }}>
                        {g.description}
                      </Text>
                    )}
                    <Text style={{ color: themeColors.textSecondary, fontSize: 14 }}>
                      Target: {g.targetAmount} points in {jarOptions.find(j => j.value === g.jar)?.label || g.jar} pot
                    </Text>
                    {g.deadline && (
                      <Text style={{ color: themeColors.textSecondary, fontSize: 12, marginTop: 2 }}>
                        Deadline: {new Date(g.deadline).toLocaleDateString()}
                      </Text>
                    )}
                    <Text style={{ color: themeColors.textSecondary, fontSize: 12, marginTop: 2 }}>
                      Status: {g.status} • Created: {new Date(g.createdAt).toLocaleDateString()}
                    </Text>
                    {/* Edit and Delete buttons for parents - only show if goal hasn't been claimed/approved */}
                    {g.status === 'active' && (
                      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 }}>
                        <TouchableOpacity
                          style={{
                            backgroundColor: themeColors.primary,
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            borderRadius: 6,
                            marginLeft: 8
                          }}
                          onPress={() => {
                            setEditingGoal(g);
                            setGoal(g.name);
                            setDescription(g.description || '');
                            setPointsNeeded(g.targetAmount.toString());
                            setSelectedJar(g.jar);
                            setDeadline(g.deadline ? g.deadline.split('T')[0] : '');
                            // Scroll to top to show the form
                            scrollViewRef.current?.scrollTo({ x: 0, y: 0, animated: true });
                          }}
                        >
                          <Text style={{ color: themeColors.card, fontWeight: '600', fontSize: 12 }}>✏️ Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={{
                            backgroundColor: themeColors.error,
                            paddingHorizontal: 10,
                            paddingVertical: 6,
                            borderRadius: 6,
                            marginLeft: 8
                          }}
                          onPress={() => handleDeleteGoal(g._id, g.name)}
                        >
                          <Text style={{ color: themeColors.card, fontWeight: '600', fontSize: 12 }}>🗑️ Delete</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                ))}
                {/* Archive Toggle for completed goals */}
                {goalsTab === 'Completed' && showArchiveButton && !showAllCompleted && (
                  <TouchableOpacity
                    style={{
                      marginTop: 10,
                      alignSelf: 'center',
                    backgroundColor: themeColors.surface,
                    paddingHorizontal: 14,
                    paddingVertical: 7,
                    borderRadius: 16
                  }}
                  onPress={() => setShowAllCompleted(true)}
                >
                  <Text style={{ color: themeColors.primary, fontWeight: '500' }}>Show All Completed Goals</Text>
                </TouchableOpacity>
                )}
                {goalsTab === 'Completed' && showAllCompleted && (
                  <TouchableOpacity
                    style={{
                      marginTop: 10,
                      alignSelf: 'center',
                      backgroundColor: themeColors.surface,
                      paddingHorizontal: 14,
                      paddingVertical: 7,
                      borderRadius: 16
                    }}
                    onPress={() => setShowAllCompleted(false)}
                  >
                    <Text style={{ color: themeColors.primary, fontWeight: '500' }}>Show Only Last 90 Days</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })()
        )}
      </View>

      {/* Help Modal */}
      <HelpModal
        visible={helpModalVisible}
        onClose={() => setHelpModalVisible(false)}
        title="🎯 Set Child Goals - Help"
        tabs={[
          {
            title: "Understanding Goals",
            content: [
              {
                type: "text",
                text: "Goals are powerful teaching tools that help children learn financial planning, delayed gratification, and the satisfaction of achievement through consistent saving.",
                icon: "🎯"
              },
              {
                type: "bullet",
                text: "Children earn points through chores and tasks to work toward their goals"
              },
              {
                type: "bullet",
                text: "Goals can be short-term (weeks) or long-term (months) savings targets"
              },
              {
                type: "bullet",
                text: "You can set deadlines to create urgency and time management skills"
              },
              {
                type: "bullet",
                text: "Goals automatically complete when the target points are reached"
              },
              {
                type: "highlight",
                text: "Goals transform everyday tasks into meaningful achievements!",
                icon: "🏆"
              }
            ]
          },
          {
            title: "Setting Effective Goals",
            content: [
              {
                type: "text",
                text: "Create motivating goals that match your child's interests and abilities:",
                icon: "✏️"
              },
              {
                type: "bullet",
                text: "🎯 Specific Names: 'New Bicycle' or 'Art Supplies Set' instead of just 'Toy'"
              },
              {
                type: "bullet",
                text: "💰 Realistic Costs: Match points to what your child can reasonably earn"
              },
              {
                type: "bullet",
                text: "⏰ Optional Deadlines: Create time pressure for better planning skills"
              },
              {
                type: "bullet",
                text: "📝 Rich Descriptions: Explain why the goal matters and what it includes"
              },
              {
                type: "bullet",
                text: "🎭 Age-Appropriate: Consider your child's attention span and interests"
              },
              {
                type: "highlight",
                text: "The best goals are exciting, achievable, and personally meaningful!",
                icon: "⭐"
              }
            ]
          },
          {
            title: "Choosing Money Pots Wisely",
            content: [
              {
                type: "text",
                text: "Each money pot teaches different financial concepts - choose strategically:",
                icon: "🏺"
              },
              {
                type: "bullet",
                text: "💰 Pocket Money - Immediate spending for small treats and wants"
              },
              {
                type: "bullet",
                text: "🐷 Savings Pot - Long-term goals requiring patience (bikes, tablets)"
              },
              {
                type: "bullet",
                text: "🛍️ Spending Pot - Fun purchases that aren't essential"
              },
              {
                type: "bullet",
                text: "❤️ Help Others Pot - Charity and giving back to community"
              },
              {
                type: "bullet",
                text: "📈 Grow Money Pot - Learning about investments and compound growth"
              },
              {
                type: "highlight",
                text: "The pot choice teaches whether money is for needs, wants, or helping others!",
                icon: "🧠"
              }
            ]
          },
          {
            title: "Managing & Tracking Goals",
            content: [
              {
                type: "text",
                text: "Monitor progress and help your child stay motivated:",
                icon: "📊"
              },
              {
                type: "bullet",
                text: "Active Tab - Shows current goals your child is working toward"
              },
              {
                type: "bullet",
                text: "Completed Tab - Past achievements (shows last 90 days by default)"
              },
              {
                type: "bullet",
                text: "Edit Button - Modify goal details anytime (name, cost, deadline)"
              },
              {
                type: "bullet",
                text: "Progress Tracking - See how many points earned vs. target needed"
              },
              {
                type: "bullet",
                text: "Automatic Completion - Goals finish when target points are reached"
              },
              {
                type: "highlight",
                text: "Regular check-ins help children stay focused and motivated!",
                icon: "�"
              }
            ]
          },
          {
            title: "Goal Setting Best Practices",
            content: [
              {
                type: "text",
                text: "Make goal-setting a positive learning experience:",
                icon: "💡"
              },
              {
                type: "bullet",
                text: "Start Small: Begin with achievable goals to build confidence"
              },
              {
                type: "bullet",
                text: "Family Input: Discuss and choose goals together as a family"
              },
              {
                type: "bullet",
                text: "Realistic Timelines: Don't set impossible deadlines"
              },
              {
                type: "bullet",
                text: "Progress Celebrations: Praise effort and small milestones"
              },
              {
                type: "bullet",
                text: "Flexible Adjustments: Modify goals if they're too hard or easy"
              },
              {
                type: "highlight",
                text: "Goals should excite, not overwhelm - adjust as your child grows!",
                icon: "🌱"
              }
            ]
          },
          {
            title: "Teaching Financial Lessons",
            content: [
              {
                type: "text",
                text: "Use goals to build lifelong money management skills:",
                icon: "📚"
              },
              {
                type: "bullet",
                text: "Delayed Gratification: Waiting and saving for bigger rewards"
              },
              {
                type: "bullet",
                text: "Planning Ahead: Setting deadlines and working backward"
              },
              {
                type: "bullet",
                text: "Budgeting: Allocating points across different goals"
              },
              {
                type: "bullet",
                text: "Achievement Satisfaction: Pride in earned accomplishments"
              },
              {
                type: "bullet",
                text: "Resilience: Learning from setbacks and trying again"
              },
              {
                type: "highlight",
                text: "Goals teach that consistent effort leads to meaningful success!",
                icon: "🌟"
              }
            ]
          },
          {
            title: "Goal Achievement Examples",
            content: [
              {
                type: "text",
                text: "Real-world goal examples for different ages and interests:",
                icon: "🎁"
              },
              {
                type: "bullet",
                text: "Young Children (5-8): Art supplies set (200 pts), new storybook (150 pts)"
              },
              {
                type: "bullet",
                text: "Middle Childhood (9-12): Board game (300 pts), sports equipment (400 pts)"
              },
              {
                type: "bullet",
                text: "Pre-Teens (13-15): Headphones (600 pts), bicycle accessories (500 pts)"
              },
              {
                type: "bullet",
                text: "Charitable Goals: Donate to animal shelter (250 pts), school supplies for needy kids (350 pts)"
              },
              {
                type: "highlight",
                text: "Mix material goals with charitable ones to teach giving back!",
                icon: "❤️"
              }
            ]
          }
        ]}
      />

      {/* Goal Templates Modal */}
      <GoalTemplates
        visible={showTemplates}
        onSelect={handleTemplateSelect}
        onClose={() => setShowTemplates(false)}
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
  formRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  formGroup: { flex: 1, marginHorizontal: 6 },
  inputLabel: { fontWeight: '500', marginBottom: 4, color: themeColors.text, fontSize: 15 },
  input: { borderWidth: 1, borderColor: themeColors.border, borderRadius: 7, padding: 8, fontSize: 16, marginBottom: 2, backgroundColor: themeColors.surface, color: themeColors.text },
  formBtn: { backgroundColor: themeColors.primary, padding: 10, borderRadius: 8, marginTop: 3, marginHorizontal: 6, alignItems: 'center' },
  formBtnText: { fontWeight: '700', color: themeColors.card, fontSize: 15 },
  validation: { color: themeColors.error, fontSize: 15, marginTop: 4 },
  statusMessage: { fontSize: 15, fontWeight: '600', color: themeColors.success, marginTop: 4 },
  placeholder: { color: themeColors.textSecondary, fontStyle: 'italic', fontSize: 15, textAlign: 'center', paddingVertical: 20 },
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
  jarSelector: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', marginTop: 8, marginBottom: 8 },
  jarButton: { backgroundColor: themeColors.surface, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15, margin: 2, minWidth: 60, alignItems: 'center' },
  jarButtonSelected: { backgroundColor: themeColors.secondary },
  jarButtonText: { color: themeColors.text, fontSize: 12, fontWeight: '600' },
  jarButtonTextSelected: { color: themeColors.card },
  refreshBtn: {
    backgroundColor: themeColors.secondary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  refreshBtnDisabled: {
    backgroundColor: themeColors.surface,
  },
  refreshBtnText: {
    color: themeColors.card,
    fontWeight: "bold",
    fontSize: 12,
  },
  refreshBtnTextDisabled: {
    color: themeColors.textSecondary,
  },
  cancelBtn: {
    backgroundColor: themeColors.surface,
    borderWidth: 1,
    borderColor: themeColors.border,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontWeight: '700',
    color: themeColors.text,
    fontSize: 15,
  },
  templateBtn: {
    backgroundColor: themeColors.secondary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignItems: 'center',
  },
  templateBtnText: {
    color: themeColors.card,
    fontWeight: '600',
    fontSize: 12,
  },
});
