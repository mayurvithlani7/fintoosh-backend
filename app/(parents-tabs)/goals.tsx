import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Platform, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import BackButton from '@/components/BackButton';
import GoalTemplates from '@/components/GoalTemplates';
import HelpModal from '@/components/HelpModal';
import ValidationMessage from '@/components/ui/ValidationMessage';
import { API_URL } from '@/utils/config';
import { useDataCache } from '@/utils/dataCacheContext';
import { getAuthToken } from '@/utils/secureStorage';
import { useTheme } from '@/utils/themeContext';
import { useStaleDataWarning } from '@/utils/useStaleDataWarning';

import { goalSuggestions } from '@/constants/goalSuggestions';
import { useGlobalFeedback } from '@/utils/globalFeedbackContext';
export default function ParentsGoalsScreen() {
  const { themeColors } = useTheme();
  const styles = createStyles(themeColors);
  const { childData, fetchChildData } = useDataCache();

  const [goal, setGoal] = useState('');
  const [description, setDescription] = useState('');
  const [pointsNeeded, setPointsNeeded] = useState('');
  const [deadline, setDeadline] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedJar, setSelectedJar] = useState('current');
  const [selectedChild, setSelectedChild] = useState(childData?.id || '');
  const [children, setChildren] = useState<{ id: string; name: string }[]>(childData ? [{ id: childData.id, name: childData.name }] : []);

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
  const [showStaleWarning, , markRefreshed] = useStaleDataWarning();

  // Validation
  const [goalNameError, setGoalNameError] = useState<string | null>(null);
  const [pointsError, setPointsError] = useState<string | null>(null);

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

  // Secure: force clear and reload of children/goals on parent session/token change
  useEffect(() => {
    async function checkUser() {
      const token = await getAuthToken();
      const { getUser } = await import('@/utils/secureStorage');
      const storedUser = await getUser();
      if (!token || !storedUser) {
        setChildren([]);
        setSelectedChild('');
        setGoals([]);
        return;
      }
      setChildren([]);
      setSelectedChild('');
      setGoals([]);
      loadChildren();
    }
    checkUser();

    if (typeof window !== "undefined" && window.addEventListener) {
      const handleStorage = (e: any) => {
        if (e.key === "user" || e.key === "accessToken" || e.key === "token") {
          checkUser();
        }
      };
      window.addEventListener("storage", handleStorage);
      return () => window.removeEventListener("storage", handleStorage);
    }
  }, []);

  const loadChildren = async () => {
    try {
      const token = await getAuthToken();
      if (!token) {
        console.log('No token available for loading children');
        return;
      }

      console.log('Loading children with token:', token.substring(0, 20) + '...');

      // First get current user to get familyId
      const { getUser } = await import('@/utils/secureStorage');
      const currentUser = await getUser();
      if (!currentUser) {
        console.log('No user data in storage');
        return;
      }
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
        if (childUsers.length > 0) {
          const childId = childUsers[0].id;
          console.log('Auto-selecting first child:', childUsers[0].name, 'with ID:', childId);
          setSelectedChild(childId);
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

  const loadGoals = useCallback(async (isRefresh = false) => {
    if (!selectedChild) {
      if (isRefresh) setRefreshing(false);
      return;
    }

    try {
      if (!isRefresh) setLoading(true);
      const token = await getAuthToken();
      if (!token) {
        if (isRefresh) setRefreshing(false);
        return;
      }

      console.log('[PARENTS GOALS] Loading goals for child:', selectedChild, isRefresh ? '(refresh)' : '(initial)');
      const response = await fetch(`${API_URL}/goals/${selectedChild}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const responseData = await response.json();
        // Handle both old format (array) and new format ({ data: [...], pagination: {...} })
        const goalsData = responseData.data || responseData;
        // Security check: All loaded goals must belong to selectedChild
        if (
          goalsData &&
          goalsData.length > 0 &&
          goalsData.some((g: any) => (g.childId && g.childId !== selectedChild))
        ) {
          const { secureLogout } = await import('@/utils/secureStorage');
          await secureLogout();
          if (typeof window !== 'undefined' && window.location) window.location.href = '/login';
          return;
        }
        console.log('[PARENTS GOALS] Loaded goals:', goalsData.length, 'goals');
        setGoals(Array.isArray(goalsData) ? goalsData : []);
        markRefreshed();
      } else {
        console.error('[PARENTS GOALS] Failed to load goals:', response.status);
      }
    } catch (err) {
      console.error('[PARENTS GOALS] Error loading goals:', err);
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  }, [selectedChild]);

  const onRefresh = useCallback(() => {
    console.log('[PARENTS GOALS] Manual refresh triggered');
    setRefreshing(true);
    loadGoals(true);
  }, [loadGoals]);

  // Fetch goals every time the selected child changes
  useEffect(() => {
    if (selectedChild) {
      loadGoals();
    }
  }, [selectedChild, loadGoals]);



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

    if (!selectedChild) {
      console.log('[PARENTS GOALS] Validation failed: no child selected');
      showError('Please wait for children to load.');
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
        apiUrl = `${API_URL}/goals/${editingGoal._id}`;
        response = await fetch(apiUrl, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(requestBody),
        });
      } else {
        requestBody.childId = selectedChild;
        apiUrl = `${API_URL}/goals`;
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
        throw new Error(errorData.message || (editingGoal ? 'Failed to update goal' : 'Failed to add goal'));
      }

      setGoal('');
      setDescription('');
      setPointsNeeded('');
      setDeadline('');
      setSelectedJar('current');
      setEditingGoal(null);
      showFeedback(editingGoal ? 'Goal updated successfully!' : 'Goal added successfully!');

      loadGoals();
    } catch (err: any) {
      showError(err.message || (editingGoal ? 'Failed to update goal. Please try again.' : 'Failed to add goal. Please try again.'));
    }
  };

  const handleChildChange = (childId: string) => {
    setSelectedChild(childId);
  };

  // Handle template selection for parents
  const handleTemplateSelect = (template: any) => {
    setGoal(template.name);
    setPointsNeeded(template.targetAmount.toString());
    setDescription(template.description);

    const jarAllocations = template.jarAllocations as Record<string, number>;
    const primaryJar = Object.entries(jarAllocations).reduce((a, b) => jarAllocations[a[0]] > jarAllocations[b[0]] ? a : b)[0];
    setSelectedJar(primaryJar);

    const deadlineDate = new Date(Date.now() + template.duration * 24 * 60 * 60 * 1000);
    const formattedDeadline = deadlineDate.toISOString().split('T')[0];
    setDeadline(formattedDeadline);

    setShowTemplates(false);

    setGoalNameError(null);
    setPointsError(null);

    scrollViewRef.current?.scrollTo({ x: 0, y: 0, animated: true });
  };

  const handleDeleteGoal = async (goalId: string, goalName: string) => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`Are you sure you want to delete "${goalName}"? This action cannot be undone.`);
      if (!confirmed) return;
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
          } catch { }
          showError(errorMessage);
          return;
        }

        showFeedback(`Goal "${goalName}" deleted successfully.`);
        loadGoals();
      } catch (error) {
        showError('Failed to delete goal.');
      }
    } else {
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
                  } catch { }
                  showError(errorMessage);
                  return;
                }

                showFeedback(`Goal "${goalName}" deleted successfully.`);
                loadGoals();
              } catch (error) {
                showError('Failed to delete goal.');
              }
            }
          }
        ]
      );
    }
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

      {/* Child Selection */}
      {children.length > 1 && (
        <View style={[styles.sectionCard, { backgroundColor: themeColors.card, shadowColor: themeColors.border }]}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Select Child</Text>
          <View style={styles.childSelector}>
            {children.map((child) => (
              <TouchableOpacity
                key={child.id}
                style={[
                  styles.childButton,
                  selectedChild === child.id && styles.childButtonSelected
                ]}
                onPress={() => handleChildChange(child.id)}
              >
                <Text style={[
                  styles.childButtonText,
                  selectedChild === child.id && styles.childButtonTextSelected
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

        {/* Goal Name Suggestions */}
        <View style={styles.suggestionsContainer}>
          <Text style={[styles.inputLabel, { fontSize: 14, marginBottom: 8 }]}>Goal Ideas:</Text>
          <View style={styles.suggestionsGrid}>
            {goalSuggestions.slice(0, 16).map((suggestion) => (
              <TouchableOpacity
                key={suggestion}
                style={[styles.suggestionBtn, { backgroundColor: themeColors.secondary }]}
                onPress={() => {
                  setGoal(suggestion);
                  setGoalNameError(null);
                }}
              >
                <Text style={styles.suggestionBtnText}>{suggestion}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Quick Preset Goal Amounts */}
        <View style={styles.presetContainer}>
          <Text style={[styles.inputLabel, { fontSize: 14, marginBottom: 8 }]}>Quick Amounts:</Text>
          <View style={styles.presetRow}>
            <TouchableOpacity
              style={[styles.presetBtn, { backgroundColor: themeColors.secondary }]}
              onPress={() => setPointsNeeded('100')}
            >
              <Text style={styles.presetBtnText}>100</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.presetBtn, { backgroundColor: themeColors.secondary }]}
              onPress={() => setPointsNeeded('250')}
            >
              <Text style={styles.presetBtnText}>250</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.presetBtn, { backgroundColor: themeColors.secondary }]}
              onPress={() => setPointsNeeded('500')}
            >
              <Text style={styles.presetBtnText}>500</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.presetBtn, { backgroundColor: themeColors.secondary }]}
              onPress={() => setPointsNeeded('1000')}
            >
              <Text style={styles.presetBtnText}>1000</Text>
            </TouchableOpacity>
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

      {showStaleWarning && (
        <Text style={{ color: themeColors.warning, fontWeight: 'bold', fontSize: 15, backgroundColor: '#fffbe5', borderLeftWidth: 4, borderLeftColor: themeColors.warning, padding: 9, borderRadius: 6, marginBottom: 8, textAlign: 'center' }}>
          This goals data may be outdated. Tap "Refresh" for the latest status.
        </Text>
      )}
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
            let filteredGoals;
            let showArchiveButton = false;
            if (goalsTab === 'Active') {
              filteredGoals = goals.filter(g => g.status !== 'completed').sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              );
            } else {
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
              filteredGoals = filteredRecent.sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              );
              showArchiveButton = filteredArchived.length > 0;
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
                {filteredGoals.map((g) => (
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
                    <Text style={{ color: themeColors.textSecondary, fontSize: 14, marginBottom: 6 }}>
                      Target: {g.targetAmount} points in {jarOptions.find(j => j.value === g.jar)?.label || g.jar}
                    </Text>

                    {/* Progress Visualization for Active Goals */}
                    {g.status === 'active' && childData && (
                      <View style={{ marginBottom: 8 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <Text style={{ fontSize: 12, color: themeColors.textSecondary, fontWeight: '600' }}>
                            Progress
                          </Text>
                          <Text style={{ fontSize: 12, color: themeColors.text, fontWeight: '600' }}>
                            {(() => {
                              const jarPoints = g.jar === 'current' ? childData.currentPoints :
                                               g.jar === 'save' ? childData.savePoints :
                                               g.jar === 'spend' ? childData.spendPoints :
                                               g.jar === 'donate' ? childData.donatePoints :
                                               g.jar === 'invest' ? childData.investPoints : 0;
                              const progress = Math.min((jarPoints / g.targetAmount) * 100, 100);
                              const remaining = Math.max(g.targetAmount - jarPoints, 0);
                              return `${Math.round(progress)}% • ${remaining} points needed`;
                            })()}
                          </Text>
                        </View>
                        <View style={{
                          height: 8,
                          backgroundColor: themeColors.surface,
                          borderRadius: 4,
                          overflow: 'hidden',
                          borderWidth: 1,
                          borderColor: themeColors.border + '40'
                        }}>
                          {(() => {
                            const jarPoints = g.jar === 'current' ? childData.currentPoints :
                                             g.jar === 'save' ? childData.savePoints :
                                             g.jar === 'spend' ? childData.spendPoints :
                                             g.jar === 'donate' ? childData.donatePoints :
                                             g.jar === 'invest' ? childData.investPoints : 0;
                            const progress = Math.min((jarPoints / g.targetAmount) * 100, 100);
                            return (
                              <View style={{
                                height: '100%',
                                width: `${progress}%`,
                                backgroundColor: progress >= 100 ? themeColors.success :
                                                progress >= 75 ? themeColors.primary :
                                                progress >= 50 ? themeColors.accent :
                                                themeColors.warning,
                                borderRadius: 3
                              }} />
                            );
                          })()}
                        </View>
                      </View>
                    )}
                    {g.deadline && (
                      <Text style={{ color: themeColors.textSecondary, fontSize: 12, marginTop: 2 }}>
                        Deadline: {new Date(g.deadline).toLocaleDateString()}
                      </Text>
                    )}
                    <Text style={{ color: themeColors.textSecondary, fontSize: 12, marginTop: 2 }}>
                      Status: {g.status} • Created: {new Date(g.createdAt).toLocaleDateString()}
                    </Text>
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
                    {g.status === 'pending' && (
                      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 }}>
                        <Text style={{
                          color: themeColors.warning,
                          fontWeight: 'bold',
                          fontSize: 13,
                          backgroundColor: themeColors.surface,
                          paddingVertical: 7,
                          paddingHorizontal: 14,
                          borderRadius: 7,
                        }}>
                          Pending Approval
                        </Text>
                      </View>
                    )}
                  </View>
                ))}
                {/* Archive toggle for completed goals */}
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
      <HelpModal
        visible={helpModalVisible}
        onClose={() => setHelpModalVisible(false)}
        title="🎯 Set Child Goals - Help"
        tabs={[
          {
            title: "Creating Goals for Your Child",
            content: [
              {
                type: "text",
                text: "Goals help your child learn about delayed gratification, planning, and achieving long-term objectives. Set meaningful targets that teach valuable financial lessons.",
                icon: "🎯"
              },
              {
                type: "bullet",
                text: "Choose goals that match your child's interests and age level"
              },
              {
                type: "bullet",
                text: "Set realistic point amounts and deadlines"
              },
              {
                type: "bullet",
                text: "Use different money pots to teach various financial concepts"
              },
              {
                type: "bullet",
                text: "Add descriptions to explain why the goal matters"
              },
              {
                type: "highlight",
                text: "Goals create excitement and motivation for saving and financial planning!",
                icon: "💰"
              }
            ]
          },
          {
            title: "Understanding Money Pots",
            content: [
              {
                type: "text",
                text: "Each goal is assigned to a specific money pot, teaching different financial concepts:",
                icon: "🏺"
              },
              {
                type: "bullet",
                text: "🤑 Pocket Money - Quick treats and immediate gratification"
              },
              {
                type: "bullet",
                text: "🐷 Savings Pot - Big purchases and long-term goals"
              },
              {
                type: "bullet",
                text: "🛍️ Spending Pot - Fun items and entertainment"
              },
              {
                type: "bullet",
                text: "❤️ Help Others Pot - Charitable giving and generosity"
              },
              {
                type: "bullet",
                text: "📈 Grow Money Pot - Investment and financial growth"
              },
              {
                type: "highlight",
                text: "Choose the pot that best fits the goal's purpose and learning objective!",
                icon: "🎓"
              }
            ]
          },
          {
            title: "Goal Templates",
            content: [
              {
                type: "text",
                text: "Use our pre-built goal templates for inspiration:",
                icon: "📋"
              },
              {
                type: "bullet",
                text: "Bike Fund - Learning about big purchases and saving"
              },
              {
                type: "bullet",
                text: "Family Vacation - Group goals and shared experiences"
              },
              {
                type: "bullet",
                text: "Charity Drive - Teaching generosity and giving back"
              },
              {
                type: "bullet",
                text: "Book Collection - Educational and personal development"
              },
              {
                type: "bullet",
                text: "Sports Equipment - Health and physical activity goals"
              },
              {
                type: "highlight",
                text: "Templates include suggested point amounts and pot allocations - customize them for your child!",
                icon: "⚡"
              }
            ]
          },
          {
            title: "Managing Goal Progress",
            content: [
              {
                type: "text",
                text: "Track and manage your child's goal progress:",
                icon: "📊"
              },
              {
                type: "bullet",
                text: "Active goals can be edited or deleted by parents"
              },
              {
                type: "bullet",
                text: "Children can request to mark goals as pending for completion"
              },
              {
                type: "bullet",
                text: "Parents approve goal completions and transfer points"
              },
              {
                type: "bullet",
                text: "Completed goals move to history for review"
              },
              {
                type: "bullet",
                text: "Expired goals teach about planning and deadlines"
              },
              {
                type: "highlight",
                text: "Regular check-ins help children stay motivated and on track!",
                icon: "🎯"
              }
            ]
          },
          {
            title: "Tips for Success",
            content: [
              {
                type: "text",
                text: "Make goal-setting a positive learning experience:",
                icon: "💡"
              },
              {
                type: "bullet",
                text: "Start with small, achievable goals to build confidence"
              },
              {
                type: "bullet",
                text: "Discuss progress regularly during family time"
              },
              {
                type: "bullet",
                text: "Celebrate milestones and completed goals together"
              },
              {
                type: "bullet",
                text: "Use goals to teach patience and delayed gratification"
              },
              {
                type: "bullet",
                text: "Adjust goals as your child grows and learns"
              },
              {
                type: "highlight",
                text: "Goals are powerful teachers - they show that hard work and planning lead to success!",
                icon: "🌟"
              }
            ]
          }
        ]}
      />

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
  presetContainer: { marginTop: 16, marginBottom: 8 },
  presetRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  presetBtn: { flex: 1, paddingVertical: 10, paddingHorizontal: 8, borderRadius: 6, marginHorizontal: 2, alignItems: 'center', minWidth: 50 },
  presetBtnText: { color: themeColors.card, fontWeight: '600', fontSize: 14 },
  suggestionsContainer: { marginTop: 16, marginBottom: 8 },
  suggestionsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  suggestionBtn: { flex: 1, paddingVertical: 8, paddingHorizontal: 6, borderRadius: 6, marginHorizontal: 2, marginVertical: 4, alignItems: 'center', minWidth: 70, maxWidth: 120 },
  suggestionBtnText: { color: themeColors.card, fontWeight: '600', fontSize: 12, textAlign: 'center' },
});
