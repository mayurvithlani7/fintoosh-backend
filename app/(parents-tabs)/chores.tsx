import BackButton from '@/components/BackButton';
import HelpModal from '@/components/HelpModal';
import ValidationMessage from '@/components/ui/ValidationMessage';
import { API_URL } from '@/utils/config';
import { getAuthToken, getUserData } from '@/utils/secureStorage';
import { useTheme } from '@/utils/themeContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { Platform, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

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
  frequencySelector: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', marginTop: 8, marginBottom: 8 },
  frequencyButton: { backgroundColor: themeColors.surface, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15, margin: 2, minWidth: 60, alignItems: 'center' },
  frequencyButtonSelected: { backgroundColor: themeColors.secondary },
  frequencyButtonText: { color: themeColors.text, fontSize: 12, fontWeight: '600' },
  frequencyButtonTextSelected: { color: themeColors.card },
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
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: themeColors.border,
    borderRadius: 4,
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: themeColors.primary,
  },
  checkboxText: {
    fontSize: 16,
    color: themeColors.text,
  },
});

export default function ParentsChoresScreen() {
  const { themeColors } = useTheme();
  const styles = createStyles(themeColors);
  const [choreName, setChoreName] = useState('');
  const [description, setDescription] = useState('');
  const [points, setPoints] = useState('');
  const [frequency, setFrequency] = useState('once');
  const [deadline, setDeadline] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedChild, setSelectedChild] = useState('');
  // Point automation - split settings
  const [useDefaultSplit, setUseDefaultSplit] = useState(true);
  const [customSplit, setCustomSplit] = useState({
    current: '0',
    save: '0',
    spend: '0',
    donate: '0',
    invest: '0'
  });
  const [children, setChildren] = useState<{ id: string; name: string }[]>([]);
  const [chores, setChores] = useState<{
    _id: string;
    name: string;
    description?: string;
    points: number;
    frequency: string;
    deadline?: string;
    completed: boolean;
    approved: boolean;
    completedAt?: string;
    approvedAt?: string;
    createdAt: string;
    status?: string; // <-- add status for backend state ("active", "pending", "completed")
  }[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [lastRefreshed, setLastRefreshed] = useState(Date.now());
  const [showStaleWarning, setShowStaleWarning] = useState(false);
  // Validation
  const [choreNameError, setChoreNameError] = useState<string | null>(null);
  const [pointsError, setPointsError] = useState<string | null>(null);

  // Tabs for chores
  const [choresTab, setChoresTab] = useState<'To Do' | 'Done'>('To Do');
  // Show/hide archive for Completed
  const [showAllCompleted, setShowAllCompleted] = useState(false);
  const [helpModalVisible, setHelpModalVisible] = useState(false);
  const [editingChore, setEditingChore] = useState<any>(null);
  const scrollViewRef = React.useRef<ScrollView>(null);

  const frequencyOptions = [
    { label: 'One Time', value: 'once' },
    { label: 'Daily', value: 'daily' },
    { label: 'Weekly', value: 'weekly' },
    { label: 'Monthly', value: 'monthly' }
  ];

  // Watch for changes in parent authentication and force reset children state and reload on user/family/session change
  useEffect(() => {
    let isMounted = true;
    async function checkUser() {
      const currentUser = await getUserData();
      const token = await getAuthToken();
      if (!currentUser || !token) {
        setChildren([]);
        setSelectedChild('');
        setChores([]);
        return;
      }
      // Whenever familyId or token changes, force a full reload
      setChildren([]);
      setSelectedChild('');
      setChores([]);
      loadChildren();
    }
    checkUser();

    // Optionally monitor "storage" events for cross-tab updates (web only)
    if (Platform.OS === 'web' && typeof window !== "undefined" && window.addEventListener) {
      const handleStorage = (e: any) => {
        if (e.key === "user" || e.key === "accessToken" || e.key === "token") {
          checkUser();
        }
      };
      window.addEventListener("storage", handleStorage);
      return () => window.removeEventListener("storage", handleStorage);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (selectedChild) {
        loadChores();
      }
      // Mark as potentially not stale if loaded on focus
    }, [selectedChild])
  );

  // If the tab loses focus, mark data as potentially stale
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== "undefined") {
      const onBlur = () => setShowStaleWarning(true);
      window.addEventListener('blur', onBlur);
      return () => window.removeEventListener('blur', onBlur);
    }
    // No-op on native
    return undefined;
  }, []);

  // Optionally, after certain time (e.g., 60s), show data might be stale
  useEffect(() => {
    const interval = setInterval(() => {
      if (Date.now() - lastRefreshed > 60 * 1000) {
        setShowStaleWarning(true);
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [lastRefreshed]);

  const loadChildren = async () => {
    try {
      const token = await getAuthToken();
      if (!token) {
        console.log('No token available for loading children');
        return;
      }

      console.log('Loading children with token:', token.substring(0, 20) + '...');

      // First get current user to get familyId
      const currentUser = await getUserData();
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

  const loadChores = async () => {
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

      const response = await fetch(`${API_URL}/chores/${selectedChild}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const choresData = await response.json();
        // Security check: chores must belong to selectedChild
        if (
          choresData &&
          choresData.length > 0 &&
          choresData.some((c: any) => (c.childId && c.childId !== selectedChild))
        ) {
          const { clearSensitiveAppData } = await import('@/utils/secureStorage');
          await clearSensitiveAppData();
          if (typeof window !== 'undefined' && window.location) window.location.href = '/login';
          return;
        }
        setChores(choresData);
        setLastRefreshed(Date.now());
        setShowStaleWarning(false);
      }
    } catch (error) {
      console.error('Error loading chores:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadChores();
  }, [selectedChild]);

  const handleAddChore = async () => {
    setError('');
    setFeedback('');

    if (!choreName.trim() || !points.trim()) {
      setError('Please enter a task name and points for the task.');
      return;
    }

    if (isNaN(Number(points)) || Number(points) <= 0) {
      setError('Please enter a valid points amount (>0).');
      return;
    }

    // Deadline validation
    if (deadline.trim()) {
      const today = new Date();
      today.setHours(0,0,0,0);
      const deadlineDate = new Date(deadline.trim());
      if (isNaN(deadlineDate.getTime())) {
        setError('Please enter a valid deadline date (YYYY-MM-DD).');
        return;
      }
      if (deadlineDate < today) {
        setError('Deadline can\'t be in the past. Please pick today or a future date.');
        return;
      }
    }

    try {
      const token = await getAuthToken();
      if (!token) {
        setError('Not authenticated. Please login again.');
        return;
      }

      const requestBody: any = {
        name: choreName.trim(),
        points: Number(points),
        frequency,
        useDefaultSplit,
      };

      if (description.trim()) {
        requestBody.description = description.trim();
      }

      if (deadline.trim()) {
        requestBody.deadline = deadline.trim();
      }

      // Add split settings if custom split is selected
      if (!useDefaultSplit) {
        const customSplitObj = {
          current: parseInt(customSplit.current) || 0,
          save: parseInt(customSplit.save) || 0,
          spend: parseInt(customSplit.spend) || 0,
          donate: parseInt(customSplit.donate) || 0,
          invest: parseInt(customSplit.invest) || 0,
        };

        // Validate custom split totals 100%
        const total = Object.values(customSplitObj).reduce((sum, val) => sum + val, 0);
        if (total !== 100) {
          setError('Custom split percentages must total exactly 100%');
          return;
        }

        requestBody.customSplit = customSplitObj;
      }

      let response;
      if (editingChore) {
        // Update existing chore
        response = await fetch(`${API_URL}/chores/${editingChore._id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
        });
      } else {
        // Add new chore
        requestBody.childId = selectedChild;
        response = await fetch(`${API_URL}/chores`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
        });
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: editingChore ? 'Failed to update task' : 'Failed to add task' }));
        throw new Error(errorData.message || (editingChore ? 'Failed to update task' : 'Failed to add task'));
      }

      setChoreName('');
      setDescription('');
      setPoints('');
      setFrequency('once');
      setDeadline('');
      setEditingChore(null);
      setFeedback(editingChore ? 'Task updated successfully!' : 'Task added successfully!');
      setTimeout(() => setFeedback(''), 3000);

      // Refresh chores list
      loadChores();
    } catch (error: any) {
      console.error('Error saving task:', error);
      setError(error.message || (editingChore ? 'Failed to update task. Please try again.' : 'Failed to add task. Please try again.'));
    }
  };

  const handleChildChange = (childId: string) => {
    setSelectedChild(childId);
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
      <Text style={[styles.title, { color: themeColors.primary }]}>Manage Tasks</Text>

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

      {/* Add/Edit Chore Form */}
      <View style={[styles.sectionCard, { backgroundColor: themeColors.card, shadowColor: themeColors.border }]}>
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>{editingChore ? 'Edit Task' : 'Add New Task'}</Text>

        <View style={styles.formRow}>
          <View style={styles.formGroup}>
            <Text style={[styles.inputLabel, { color: themeColors.text }]}>Task Name</Text>
            <TextInput
              style={[styles.input, { backgroundColor: themeColors.surface, color: themeColors.text, borderColor: themeColors.border }]}
              placeholder="e.g. Clean room"
              placeholderTextColor={themeColors.textSecondary}
              value={choreName}
              onChangeText={val => {
                setChoreName(val);
                if (!val.trim()) setChoreNameError("Please enter a task name.");
                else if (val.length < 3) setChoreNameError("Task name must be at least 3 characters.");
                else setChoreNameError(null);
              }}
              accessibilityLabel="Task Name"
            />
            <ValidationMessage message={choreNameError} type={choreNameError ? "error" : "success"} />
          </View>
          <View style={styles.formGroup}>
            <Text style={[styles.inputLabel, { color: themeColors.text }]}>Points for Task</Text>
            <TextInput
              style={[styles.input, { backgroundColor: themeColors.surface, color: themeColors.text, borderColor: themeColors.border }]}
              placeholder="e.g. 25"
              placeholderTextColor={themeColors.textSecondary}
              keyboardType="numeric"
              value={points}
              onChangeText={val => {
                setPoints(val);
                if (!val.trim()) setPointsError("Please enter points reward.");
                else if (isNaN(Number(val)) || Number(val) <= 0) setPointsError("Enter a positive number.");
                else setPointsError(null);
              }}
              accessibilityLabel="Points Reward"
            />
            <ValidationMessage message={pointsError} type={pointsError ? "error" : "success"} />
          </View>
        </View>

        <Text style={[styles.inputLabel, { color: themeColors.text }]}>Details (Optional)</Text>
        <TextInput
          style={[styles.input, { height: 60, textAlignVertical: 'top', backgroundColor: themeColors.surface, color: themeColors.text, borderColor: themeColors.border }]}
          placeholder="Describe what the task involves..."
          placeholderTextColor={themeColors.textSecondary}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
        />

        <Text style={[styles.inputLabel, { color: themeColors.text }]}>How Often</Text>
        <View style={styles.frequencySelector}>
          {frequencyOptions.map(freq => (
            <TouchableOpacity
              key={freq.value}
              style={[
                styles.frequencyButton,
                frequency === freq.value && styles.frequencyButtonSelected
              ]}
              onPress={() => setFrequency(freq.value)}
            >
              <Text style={[
                styles.frequencyButtonText,
                frequency === freq.value && styles.frequencyButtonTextSelected
              ]}>
                {freq.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.inputLabel, { color: themeColors.text }]}>Due Date (Optional)</Text>
        {Platform.OS === "web" ? (
          <View style={{ width: '100%' }}>
            <input
              style={{
                width: '100%',
                padding: 8,
                borderRadius: 7,
                border: `1px solid ${themeColors.border}`,
                fontSize: 16,
                background: themeColors.surface,
                color: themeColors.text,
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
              style={[styles.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: themeColors.surface, borderColor: themeColors.border }]}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.75}
            >
              <Text style={{ color: deadline ? themeColors.text : themeColors.textSecondary, fontSize: 16 }}>
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

        {/* Point Automation - Split Settings */}
        <Text style={[styles.inputLabel, { color: themeColors.text }]}>⚖️ Point Distribution</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setUseDefaultSplit(true)}
          >
            <View style={[styles.checkbox, useDefaultSplit && styles.checkboxChecked]}>
              {useDefaultSplit && <Text style={{ color: 'white', fontSize: 14 }}>✓</Text>}
            </View>
            <Text style={[styles.checkboxText, { color: themeColors.text }]}>Use Family Default Split</Text>
          </TouchableOpacity>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setUseDefaultSplit(false)}
          >
            <View style={[styles.checkbox, !useDefaultSplit && styles.checkboxChecked]}>
              {!useDefaultSplit && <Text style={{ color: 'white', fontSize: 14 }}>✓</Text>}
            </View>
            <Text style={[styles.checkboxText, { color: themeColors.text }]}>Custom Split for This Task</Text>
          </TouchableOpacity>
        </View>

        {!useDefaultSplit && (
          <View style={{ marginBottom: 12 }}>
            <Text style={{ fontSize: 14, color: themeColors.text, marginBottom: 8 }}>
              Set custom percentages (must total 100%):
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
              <View style={{ width: '48%', marginBottom: 8 }}>
                <Text style={{ fontSize: 12, color: themeColors.text, marginBottom: 2 }}>💰 Pocket Money</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: themeColors.surface, color: themeColors.text, borderColor: themeColors.border }]}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={themeColors.textSecondary}
                  value={customSplit.current}
                  onChangeText={(text) => setCustomSplit(prev => ({ ...prev, current: text }))}
                />
              </View>
              <View style={{ width: '48%', marginBottom: 8 }}>
                <Text style={{ fontSize: 12, color: themeColors.text, marginBottom: 2 }}>🐷 Savings Pot</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: themeColors.surface, color: themeColors.text, borderColor: themeColors.border }]}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={themeColors.textSecondary}
                  value={customSplit.save}
                  onChangeText={(text) => setCustomSplit(prev => ({ ...prev, save: text }))}
                />
              </View>
              <View style={{ width: '48%', marginBottom: 8 }}>
                <Text style={{ fontSize: 12, color: themeColors.text, marginBottom: 2 }}>🛒 Spending Pot</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: themeColors.surface, color: themeColors.text, borderColor: themeColors.border }]}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={themeColors.textSecondary}
                  value={customSplit.spend}
                  onChangeText={(text) => setCustomSplit(prev => ({ ...prev, spend: text }))}
                />
              </View>
              <View style={{ width: '48%', marginBottom: 8 }}>
                <Text style={{ fontSize: 12, color: themeColors.text, marginBottom: 2 }}>❤️ Help Others</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: themeColors.surface, color: themeColors.text, borderColor: themeColors.border }]}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={themeColors.textSecondary}
                  value={customSplit.donate}
                  onChangeText={(text) => setCustomSplit(prev => ({ ...prev, donate: text }))}
                />
              </View>
              <View style={{ width: '48%', marginBottom: 8 }}>
                <Text style={{ fontSize: 12, color: themeColors.text, marginBottom: 2 }}>📈 Grow Money</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: themeColors.surface, color: themeColors.text, borderColor: themeColors.border }]}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={themeColors.textSecondary}
                  value={customSplit.invest}
                  onChangeText={(text) => setCustomSplit(prev => ({ ...prev, invest: text }))}
                />
              </View>
            </View>
            <Text style={{ fontSize: 14, color: themeColors.text, textAlign: 'center' }}>
              Total: {Object.values(customSplit).reduce((sum, val) => sum + (parseInt(val) || 0), 0)}%
            </Text>
          </View>
        )}

        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <TouchableOpacity
            style={[styles.formBtn, { backgroundColor: themeColors.primary, flex: editingChore ? 0.6 : 1 }]}
            onPress={handleAddChore}
            disabled={Boolean(choreNameError || pointsError)}
            accessibilityLabel={editingChore ? "Update Task" : "Add Task"}
          >
            <Text style={[styles.formBtnText, { color: themeColors.card }]}>{editingChore ? 'Update Task' : 'Add Task'}</Text>
          </TouchableOpacity>
          {editingChore && (
            <TouchableOpacity
              style={[styles.cancelBtn, { flex: 0.35 }]}
              onPress={() => {
                setEditingChore(null);
                setChoreName('');
                setDescription('');
                setPoints('');
                setFrequency('once');
                setDeadline('');
                setError('');
                setFeedback('');
                setChoreNameError(null);
                setPointsError(null);
              }}
              accessibilityLabel="Cancel Edit"
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
        <ValidationMessage message={error} type="error" />
        {feedback ? <Text style={styles.statusMessage}>{feedback}</Text> : null}
      </View>

      {showStaleWarning && (
        <Text style={{ color: themeColors.warning, fontWeight: 'bold', fontSize: 15, backgroundColor: '#fffbe5', borderLeftWidth: 4, borderLeftColor: themeColors.warning, padding: 9, borderRadius: 6, marginBottom: 8, textAlign: 'center' }}>
          Tasks data may be outdated. Tap "Refresh" for the latest status.
        </Text>
      )}
      {/* Current Chores - With Tabs/Filters */}
      <View style={[styles.sectionCard, { backgroundColor: themeColors.card, shadowColor: themeColors.border }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            {children.length === 1 ? `${children[0].name}'s Chores` : 'Current Chores'}
          </Text>
          <TouchableOpacity
            style={[styles.refreshBtn, { backgroundColor: refreshing ? '#ccc' : themeColors.secondary }, refreshing && styles.refreshBtnDisabled]}
            onPress={onRefresh}
            disabled={refreshing}
          >
            <Text style={[styles.refreshBtnText, { color: refreshing ? '#666' : themeColors.card }, refreshing && styles.refreshBtnTextDisabled]}>
              {refreshing ? 'Refreshing...' : '🔄 Refresh Chores'}
            </Text>
          </TouchableOpacity>
        </View>
        {/* Filter Tabs */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 10 }}>
          {['To Do', 'Done'].map(tab => (
            <TouchableOpacity
              key={tab}
              onPress={() => setChoresTab(tab as "To Do" | "Done")}
              style={{
                backgroundColor: choresTab === tab ? themeColors.secondary : themeColors.surface,
                paddingHorizontal: 15,
                paddingVertical: 6,
                borderRadius: 18,
                marginHorizontal: 6
              }}
            >
              <Text style={{ color: choresTab === tab ? themeColors.card : themeColors.text, fontWeight: choresTab === tab ? 'bold' : '600', fontSize: 15 }}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {loading ? (
          <Text style={styles.placeholder}>Loading chores...</Text>
        ) : (() => {
            // DEBUG: Log all chores with status field for parent debugging
            console.log('Chores for rendering:', chores.map(c => ({ id: c._id, name: c.name, status: c.status })));
            // Filter logic with 90-day limit for completed
            let filteredChores;
            let showArchiveButton = false;
            // Unified function: is a chore "Done"?
            const isChoreDone = (c: any) =>
              c.completed === true ||
              c.status === 'completed' ||
              c.approved === true;

            if (choresTab === 'To Do') {
              filteredChores = chores.filter(c => !isChoreDone(c));
            } else {
              // "Done": last 90 days
              const now = new Date();
              const ninetyDaysAgo = new Date(now);
              ninetyDaysAgo.setDate(now.getDate() - 90);
              const filteredRecent = chores.filter(c =>
                isChoreDone(c) && new Date(c.createdAt) >= ninetyDaysAgo
              );
              const filteredArchived = chores.filter(c =>
                isChoreDone(c) && new Date(c.createdAt) < ninetyDaysAgo
              );
              filteredChores = filteredRecent;
              showArchiveButton = filteredArchived.length > 0;
              if (showAllCompleted) {
                filteredChores = [...filteredRecent, ...filteredArchived].sort((a, b) =>
                  new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );
              }
            }
            if (filteredChores.length === 0) {
              return (
                <Text style={styles.placeholder}>
                  {choresTab === 'To Do'
                    ? 'No tasks to do.'
                    : 'No tasks completed recently.'}
                </Text>
              );
            }
            return (
              <>
                {filteredChores.map(c => (
                  <View
                    key={c._id}
                    style={{
                      backgroundColor: (c.completed && c.approved) ? '#e5fcd8' : '#f6faff',
                      marginVertical: 5,
                      padding: 12,
                      borderRadius: 7,
                    }}
                  >
                    <Text style={{ marginBottom: 4 }}>
                      <Text style={{ fontWeight: 'bold', color: '#234', fontSize: 16 }}>{c.name}</Text>
                    </Text>
                    {c.description && (
                      <Text style={{ fontSize: 14, color: '#666', marginBottom: 6 }}>
                        {c.description}
                      </Text>
                    )}
                    <Text style={{ color: '#666', fontSize: 14 }}>
                      Reward: {c.points} points • Frequency: {frequencyOptions.find(f => f.value === c.frequency)?.label || c.frequency}
                    </Text>
                    {c.deadline && (
                      <Text style={{ color: '#666', fontSize: 12, marginTop: 2 }}>
                        Deadline: {new Date(c.deadline).toLocaleDateString()}
                      </Text>
                    )}
                    <Text style={{ color: '#666', fontSize: 12, marginTop: 2 }}>
                      Status: {c.status ? c.status.charAt(0).toUpperCase() + c.status.slice(1) : ((c.completed && c.approved) ? 'Completed' : c.completed ? 'Pending Approval' : 'Active')} • Created: {new Date(c.createdAt).toLocaleDateString()}
                    </Text>
                    {/* Parent controls: edit/delete for active, pending indicator, nothing for completed/approved */}
                    {c.status === 'active' ? (
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
                            setEditingChore(c);
                            setChoreName(c.name);
                            setDescription(c.description || '');
                            setPoints(c.points.toString());
                            setFrequency(c.frequency);
                            setDeadline(c.deadline ? c.deadline.split('T')[0] : '');
                            setError('');
                            setFeedback('');
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
                          onPress={async () => {
                            setError('');
                            setFeedback('');
                            try {
                              const token = await getAuthToken();
                              const response = await fetch(`${API_URL}/chores/${c._id}`, {
                                method: 'DELETE',
                                headers: { 'Authorization': `Bearer ${token}` }
                              });
                              if (!response.ok) {
                                const data = await response.json().catch(() => ({}));
                                throw new Error(data.message || 'Failed to delete chore.');
                              }
                              setFeedback('Task deleted successfully.');
                              setTimeout(() => setFeedback(''), 3000);
                              loadChores();
                            } catch (err: any) {
                              setError(err.message || 'Failed to delete chore.');
                            }
                          }}
                        >
                          <Text style={{ color: themeColors.card, fontWeight: '600', fontSize: 12 }}>🗑️ Delete</Text>
                        </TouchableOpacity>
                      </View>
                    ) : c.status === 'pending' ? (
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
                    ) : null}
                  </View>
                ))}
                {/* Archive Toggle for completed chores */}
                {choresTab === 'Done' && showArchiveButton && !showAllCompleted && (
                  <TouchableOpacity
                    style={{
                      marginTop: 12,
                      alignSelf: 'center',
                      backgroundColor: '#e7e2fa',
                      paddingHorizontal: 20,
                      paddingVertical: 8,
                      borderRadius: 16
                    }}
                    onPress={() => setShowAllCompleted(true)}
                  >
                    <Text style={{ color: '#5837a7', fontWeight: '600' }}>Show All Completed Tasks</Text>
                  </TouchableOpacity>
                )}
                {choresTab === 'Done' && showAllCompleted && (
                  <TouchableOpacity
                    style={{
                      marginTop: 10,
                      alignSelf: 'center',
                      backgroundColor: '#e6e6e6',
                      paddingHorizontal: 14,
                      paddingVertical: 7,
                      borderRadius: 16
                    }}
                    onPress={() => setShowAllCompleted(false)}
                  >
                    <Text style={{ color: '#5837a7', fontWeight: '500' }}>Show Only Last 90 Days</Text>
                  </TouchableOpacity>
                )}
              </>
            );
          })()
        }
      </View>

      {/* Help Modal */}
      <HelpModal
        visible={helpModalVisible}
        onClose={() => setHelpModalVisible(false)}
        title="🧹 Manage Tasks - Help"
        tabs={[
          {
            title: "Why Tasks Matter",
            content: [
              {
                type: "text",
                text: "Tasks teach children responsibility, work ethic, and the value of earning rewards through effort. They build essential life skills while contributing to family harmony.",
                icon: "🧹"
              },
              {
                type: "bullet",
                text: "Develops self-discipline and time management"
              },
              {
                type: "bullet",
                text: "Teaches that rewards come from consistent effort"
              },
              {
                type: "bullet",
                text: "Builds family teamwork and shared responsibility"
              },
              {
                type: "highlight",
                text: "Tasks transform everyday responsibilities into valuable learning experiences!",
                icon: "🌟"
              }
            ]
          },
          {
            title: "Creating Effective Tasks",
            content: [
              {
                type: "text",
                text: "Design tasks that motivate while teaching valuable skills:",
                icon: "✏️"
              },
              {
                type: "bullet",
                text: "Clear, specific task names"
              },
              {
                type: "bullet",
                text: "Fair point rewards (10-50 points based on effort)"
              },
              {
                type: "bullet",
                text: "Appropriate frequency: Daily, Weekly, Monthly, or One-time"
              },
              {
                type: "bullet",
                text: "Optional deadlines for time management"
              },
              {
                type: "highlight",
                text: "Great tasks are clear, achievable, and tied to meaningful rewards!",
                icon: "🏆"
              }
            ]
          },
          {
            title: "Choosing Frequency",
            content: [
              {
                type: "text",
                text: "Match task frequency to how often the responsibility naturally occurs:",
                icon: "⏰"
              },
              {
                type: "bullet",
                text: "Daily - Habits like making bed, clearing dishes"
              },
              {
                type: "bullet",
                text: "Weekly - Maintenance like vacuuming, laundry"
              },
              {
                type: "bullet",
                text: "Monthly - Deep cleaning, organizing"
              },
              {
                type: "bullet",
                text: "One-time - Special responsibilities or events"
              },
              {
                type: "highlight",
                text: "Choose frequencies that build consistency without overwhelming!",
                icon: "⚖️"
              }
            ]
          },
          {
            title: "Point Distribution",
            content: [
              {
                type: "text",
                text: "Control how task points are allocated across money pots:",
                icon: "⚖️"
              },
              {
                type: "bullet",
                text: "Use Family Default - Standard point distribution"
              },
              {
                type: "bullet",
                text: "Custom Split - Override for specific tasks (total must be 100%)"
              },
              {
                type: "bullet",
                text: "5 Pots: Pocket Money, Savings, Spending, Help Others, Grow Money"
              },
              {
                type: "highlight",
                text: "Custom splits teach specific financial lessons through tasks!",
                icon: "🎓"
              }
            ]
          },
          {
            title: "Managing Tasks",
            content: [
              {
                type: "text",
                text: "Track progress and maintain accountability:",
                icon: "📊"
              },
              {
                type: "bullet",
                text: "To Do Tab - Active tasks waiting completion"
              },
              {
                type: "bullet",
                text: "Done Tab - Completed tasks (last 90 days)"
              },
              {
                type: "bullet",
                text: "Edit Button - Modify task details anytime"
              },
              {
                type: "bullet",
                text: "Refresh - Update list to see new completions"
              },
              {
                type: "highlight",
                text: "Consistent tracking builds trust and accountability!",
                icon: "👁️"
              }
            ]
          },
          {
            title: "Task Ideas by Age",
            content: [
              {
                type: "text",
                text: "Age-appropriate task suggestions:",
                icon: "🎯"
              },
              {
                type: "bullet",
                text: "Ages 5-7: Set table, water plants, make bed"
              },
              {
                type: "bullet",
                text: "Ages 8-10: Take out trash, sweep floors, help cook"
              },
              {
                type: "bullet",
                text: "Ages 11-13: Vacuum, clean bathroom, wash dishes"
              },
              {
                type: "bullet",
                text: "Ages 14+: Laundry, meal prep, yard work"
              },
              {
                type: "highlight",
                text: "Start simple and increase complexity as skills develop!",
                icon: "🌱"
              }
            ]
          }
        ]}
      />
    </ScrollView>
  );
}
