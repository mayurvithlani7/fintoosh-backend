import BackButton from '@/components/BackButton';
import HelpModal from '@/components/HelpModal';
import ValidationMessage from '@/components/ui/ValidationMessage';
import { choreSuggestions } from '@/constants/choreSuggestions';
import { SEMANTIC_TYPOGRAPHY } from '@/constants/theme';
import { useCenteredMessage } from '@/utils/centeredMessageContext';
import { API_URL } from '@/utils/config';
import { getAuthToken, getUserData } from '@/utils/secureStorage';
import { useTheme } from '@/utils/themeContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const createStyles = (themeColors: any) => StyleSheet.create({
  scroll: { backgroundColor: themeColors.background },
  container: { alignItems: 'center', paddingVertical: 12, paddingHorizontal: 6 },
  title: { ...SEMANTIC_TYPOGRAPHY["type-display-medium"], marginBottom: 22, marginTop: 6, color: themeColors.primary },
  sectionCard: { backgroundColor: themeColors.card, borderRadius: 16, marginBottom: 16, padding: 16, minWidth: 320, width: '97%', maxWidth: 520, elevation: 3, shadowColor: themeColors.border },
  sectionTitle: { ...SEMANTIC_TYPOGRAPHY["type-heading-small"], marginBottom: 12, color: themeColors.text },
  formRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  formGroup: { flex: 1, marginHorizontal: 6 },
  inputLabel: { ...SEMANTIC_TYPOGRAPHY["type-body-small"], marginBottom: 4, color: themeColors.text },
  input: { borderWidth: 1, borderColor: themeColors.border, borderRadius: 7, padding: 8, ...SEMANTIC_TYPOGRAPHY["type-body"], marginBottom: 2, backgroundColor: themeColors.surface, color: themeColors.text },
  formBtn: { backgroundColor: themeColors.primary, padding: 10, borderRadius: 8, marginTop: 3, marginHorizontal: 6, alignItems: 'center' },
  formBtnText: { ...SEMANTIC_TYPOGRAPHY["type-body-small"], color: themeColors.card },
  validation: { color: themeColors.error, ...SEMANTIC_TYPOGRAPHY["type-body-small"], marginTop: 4 },
  statusMessage: { ...SEMANTIC_TYPOGRAPHY["type-body-small"], color: themeColors.success, marginTop: 4 },
  placeholder: { color: themeColors.textSecondary, fontStyle: 'italic', ...SEMANTIC_TYPOGRAPHY["type-body-small"], textAlign: 'center', paddingVertical: 20 },
  frequencySelector: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', marginTop: 8, marginBottom: 8 },
  frequencyButton: { backgroundColor: themeColors.surface, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15, margin: 2, minWidth: 60, alignItems: 'center' },
  frequencyButtonSelected: { backgroundColor: themeColors.secondary },
  frequencyButtonText: { color: themeColors.text, ...SEMANTIC_TYPOGRAPHY["type-caption-small"] },
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
    ...SEMANTIC_TYPOGRAPHY["type-caption-small"],
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
    ...SEMANTIC_TYPOGRAPHY["type-body-small"],
    color: themeColors.text,
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
    ...SEMANTIC_TYPOGRAPHY["type-body"],
    color: themeColors.text,
  },
  presetContainer: { marginTop: 16, marginBottom: 8 },
  presetRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  presetBtn: { flex: 1, paddingVertical: 10, paddingHorizontal: 8, borderRadius: 6, marginHorizontal: 2, alignItems: 'center', minWidth: 50 },
  presetBtnText: { color: themeColors.card, ...SEMANTIC_TYPOGRAPHY["type-body-small"] },
  suggestionsContainer: { marginTop: 16, marginBottom: 8 },
  suggestionsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  suggestionBtn: { flex: 1, paddingVertical: 8, paddingHorizontal: 6, borderRadius: 6, marginHorizontal: 2, marginVertical: 4, alignItems: 'center', minWidth: 70, maxWidth: 120 },
  suggestionBtnText: { color: themeColors.card, ...SEMANTIC_TYPOGRAPHY["type-caption-small"], textAlign: 'center' },
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
  childButtonText: { color: themeColors.text, ...SEMANTIC_TYPOGRAPHY["type-body-small"] },
  childButtonTextSelected: { color: themeColors.card },
  // Child selector styles for enhanced design
  countBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    color: themeColors.card,
    ...SEMANTIC_TYPOGRAPHY["type-body-small"],
  },
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
    ...SEMANTIC_TYPOGRAPHY["type-heading-small"],
  },
  childName: {
    ...SEMANTIC_TYPOGRAPHY["type-caption-small"],
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
    ...SEMANTIC_TYPOGRAPHY["type-body-small"],
  },
  // Tasks summary dashboard styles (copied from goals)
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
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
    shadowRadius: 2,
  },
  summaryLabel: {
    ...SEMANTIC_TYPOGRAPHY["type-body-small"],
    textAlign: 'center',
    marginBottom: 4,
  },
  summaryValue: {
    ...SEMANTIC_TYPOGRAPHY["type-heading-small"],
    textAlign: 'center',
  },
});

export default function ParentsChoresScreen() {
  const { themeColors } = useTheme();
  const { showMessage } = useCenteredMessage();
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
  const [lastRefreshed, setLastRefreshed] = useState(Date.now());
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
  const formSectionRef = React.useRef<View>(null);

  // Helper function to check if a chore is done
  const isChoreDone = (c: any) =>
    c.completed === true ||
    c.status === 'completed' ||
    c.approved === true;

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

    // Only on web: monitor "storage" events for cross-tab updates
    if (Platform.OS === "web" && typeof window !== "undefined" && typeof window.addEventListener === "function") {
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
    // Only on web, listen for blur to mark data as potentially stale
    if (Platform.OS === "web" && typeof window !== "undefined" && typeof window.addEventListener === "function") {
      // Stale warning removed for better UX
      const onBlur = () => {}; // No-op
      window.addEventListener('blur', onBlur);
      return () => window.removeEventListener('blur', onBlur);
    }
    // No-op on native
    return undefined;
  }, []);

  // Optionally, after certain time (e.g., 60s), show data might be stale
  useEffect(() => {
    // Stale warning removed for better UX
    return () => {};
  }, []);

  const loadChildren = async () => {
    try {
      const token = await getAuthToken();
      if (!token) {
        console.log('No token available for loading children');
        showMessage('Authentication required. Please log in again.', 'error');
        return;
      }

      console.log('Loading children with token:', token.substring(0, 20) + '...');

      // First get current user to get familyId
      const currentUser = await getUserData();
      if (!currentUser) {
        console.log('No user data in storage');
        showMessage('User session expired. Please log in again.', 'error');
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
        let errorMessage = 'Failed to load children.';

        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (parseError) {
          const errorText = await response.text();
          console.error('Error response text:', errorText);
        }

        // Handle specific HTTP status codes
        if (response.status === 401) {
          errorMessage = 'Authentication expired. Please log in again.';
        } else if (response.status === 403) {
          errorMessage = 'Access denied. Please check your permissions.';
        } else if (response.status === 404) {
          errorMessage = 'Family information not found.';
        } else if (response.status >= 500) {
          errorMessage = 'Server error. Please try again later.';
        }

        showMessage(errorMessage, 'error');
      }
    } catch (err) {
      console.error('Error loading children:', err);

      // Handle network and other errors
      let errorMessage = 'Failed to load children. Please check your connection and try again.';

      if (err instanceof TypeError && err.message.includes('fetch')) {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (err instanceof Error && err.message) {
        errorMessage = `Error: ${err.message}`;
      }

      showMessage(errorMessage, 'error');
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
        showMessage('Authentication required. Please log in again.', 'error');
        setRefreshing(false);
        return;
      }

      const response = await fetch(`${API_URL}/chores/${selectedChild}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const choresResponse = await response.json();
        // Extract chores array from paginated response
        const choresData = choresResponse.chores || [];
        // Ensure it's an array
        const safeChoresData = Array.isArray(choresData) ? choresData : [];
        // Security check: chores must belong to selectedChild
        if (
          safeChoresData &&
          safeChoresData.length > 0 &&
          safeChoresData.some((c: any) => (c.childId && c.childId !== selectedChild))
        ) {
          const { clearSensitiveAppData } = await import('@/utils/secureStorage');
          await clearSensitiveAppData();
          if (typeof window !== 'undefined' && window.location) window.location.href = '/login';
          return;
        }
        setChores(safeChoresData);
        setLastRefreshed(Date.now());
      } else {
        console.error('Failed to load chores, status:', response.status);
        let errorMessage = 'Failed to load tasks.';

        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (parseError) {
          const errorText = await response.text();
          console.error('Error response text:', errorText);
        }

        // Handle specific HTTP status codes
        if (response.status === 401) {
          errorMessage = 'Authentication expired. Please log in again.';
        } else if (response.status === 403) {
          errorMessage = 'Access denied. Please check your permissions.';
        } else if (response.status === 404) {
          errorMessage = 'Child not found or tasks not available.';
        } else if (response.status >= 500) {
          errorMessage = 'Server error. Please try again later.';
        }

        showMessage(errorMessage, 'error');
      }
    } catch (error) {
      console.error('Error loading chores:', error);

      // Handle network and other errors
      let errorMessage = 'Failed to load tasks. Please check your connection and try again.';

      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (error instanceof Error && error.message) {
        errorMessage = `Error: ${error.message}`;
      }

      showMessage(errorMessage, 'error');
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

    // Validate input
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

    // Custom split validation
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
    }

    // Create optimistic chore object
    const optimisticChore = {
      _id: `temp-${Date.now()}`, // Temporary ID for optimistic update
      name: choreName.trim(),
      description: description.trim() || undefined,
      points: Number(points),
      frequency,
      deadline: deadline.trim() || undefined,
      status: 'active' as const,
      completed: false,
      approved: false,
      createdAt: new Date().toISOString(),
      useDefaultSplit,
      customSplit: useDefaultSplit ? undefined : {
        current: parseInt(customSplit.current) || 0,
        save: parseInt(customSplit.save) || 0,
        spend: parseInt(customSplit.spend) || 0,
        donate: parseInt(customSplit.donate) || 0,
        invest: parseInt(customSplit.invest) || 0,
      }
    };

    // Store original state for potential rollback
    const originalChores = [...chores];
    const originalEditingChore = editingChore;

    // OPTIMISTIC UPDATE: Add chore to UI immediately
    if (editingChore) {
      // Update existing chore
      setChores(prev => prev.map(c => c._id === editingChore._id ? { ...optimisticChore, _id: editingChore._id } : c));
    } else {
      // Add new chore
      setChores(prev => [optimisticChore, ...prev]);
    }

    // Show instant success message
    showMessage(editingChore ? 'Task updated successfully!' : 'Task added successfully!', 'success');

    // Clear form immediately for instant feedback
    setChoreName('');
    setDescription('');
    setPoints('');
    setFrequency('once');
    setDeadline('');
    setEditingChore(null);

    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error('Not authenticated. Please login again.');
      }

      const requestBody: any = {
        name: optimisticChore.name,
        points: optimisticChore.points,
        frequency: optimisticChore.frequency,
        useDefaultSplit: optimisticChore.useDefaultSplit,
      };

      if (optimisticChore.description) {
        requestBody.description = optimisticChore.description;
      }

      if (optimisticChore.deadline) {
        requestBody.deadline = optimisticChore.deadline;
      }

      // Add split settings if custom split is selected
      if (optimisticChore.customSplit) {
        requestBody.customSplit = optimisticChore.customSplit;
      }

      let response;
      if (originalEditingChore) {
        // Update existing chore
        response = await fetch(`${API_URL}/chores/${originalEditingChore._id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
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
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(requestBody),
        });
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: originalEditingChore ? 'Failed to update task' : 'Failed to add task' }));
        throw new Error(errorData.message || (originalEditingChore ? 'Failed to update task' : 'Failed to add task'));
      }

      // Success: Refresh data to get server-generated IDs and any updates
      loadChores();

    } catch (error: any) {
      console.error('Error saving task:', error);

      // FAILURE: Rollback optimistic update
      setChores(originalChores);
      setEditingChore(originalEditingChore);

      // Restore form data so user can retry
      setChoreName(optimisticChore.name);
      setDescription(optimisticChore.description || '');
      setPoints(optimisticChore.points.toString());
      setFrequency(optimisticChore.frequency);
      setDeadline(optimisticChore.deadline || '');
      setUseDefaultSplit(optimisticChore.useDefaultSplit);
      if (optimisticChore.customSplit) {
        setCustomSplit({
          current: optimisticChore.customSplit.current.toString(),
          save: optimisticChore.customSplit.save.toString(),
          spend: optimisticChore.customSplit.spend.toString(),
          donate: optimisticChore.customSplit.donate.toString(),
          invest: optimisticChore.customSplit.invest.toString(),
        });
      }

      // Show error message
      showMessage(error.message || (originalEditingChore ? 'Failed to update task. Please try again.' : 'Failed to add task. Please try again.'), 'error');
    }
  };

  const handleChildChange = (childId: string) => {
    setSelectedChild(childId);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, width: '100%' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 60}
    >
      <ScrollView
        ref={scrollViewRef}
        style={styles.scroll}
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        keyboardShouldPersistTaps="handled"
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
          <Text style={[SEMANTIC_TYPOGRAPHY["type-body-small"], { color: themeColors.card }]}>❓ Help</Text>
        </TouchableOpacity>
      </View>
      <Text style={[styles.title, { color: themeColors.primary }]}>Manage Tasks</Text>

      {/* Enhanced Child Selector */}
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
              👨‍👩‍👦 Select Child to View Tasks
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
                    backgroundColor: selectedChild === child.id ? themeColors.primary : themeColors.card,
                    borderColor: selectedChild === child.id ? themeColors.primary : themeColors.border,
                  }
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Select ${child.name} - ${selectedChild === child.id ? 'currently selected' : 'tap to select'}`}
                accessibilityHint="Switch to view this child's tasks and progress"
                onPress={() => handleChildChange(child.id)}
              >
                <View style={styles.childAvatar}>
                  <Text style={[styles.childAvatarText, {
                    color: selectedChild === child.id ? themeColors.card : themeColors.primary
                  }]}>
                    {child.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text style={[styles.childName, {
                  color: selectedChild === child.id ? themeColors.card : themeColors.text
                }]}>
                  {child.name}
                </Text>
                {selectedChild === child.id && (
                  <View style={styles.selectedIndicator}>
                    <Text style={styles.selectedCheckmark}>👑</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
          <Text style={[SEMANTIC_TYPOGRAPHY["type-caption"], { color: themeColors.textSecondary, marginTop: 8, textAlign: 'center' }]}>
            Tap any child to view their individual tasks and progress
          </Text>
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
          <Text style={[SEMANTIC_TYPOGRAPHY["type-body-small"], { color: themeColors.primary, marginRight: 4 }]}>Child:</Text>
          <Text
            style={{
              backgroundColor: themeColors.primary,
              color: themeColors.card,
              borderRadius: 18,
              paddingHorizontal: 14,
              paddingVertical: 6,
              maxWidth: 140,
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

      {/* Tasks Summary Dashboard */}
      {children.length > 0 && selectedChild && (
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
              🧹 Tasks Summary
            </Text>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={refreshing ? "Refreshing data" : "Refresh data"}
              accessibilityHint="Reload latest tasks information"
              accessibilityState={{ disabled: refreshing }}
              style={[styles.refreshBtn, { backgroundColor: themeColors.secondary }]}
              onPress={onRefresh}
              disabled={refreshing}
            >
              <Text style={[SEMANTIC_TYPOGRAPHY["type-body-small"], { color: themeColors.card }]}>
                {refreshing ? '⏳' : '↻'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.summaryGrid}>
            <View style={[styles.summaryItem, { backgroundColor: themeColors.surface, borderWidth: 1, borderColor: themeColors.border }]}>
              <Text style={[styles.summaryLabel, { color: themeColors.text }]}>📋 To Do</Text>
              <Text style={[styles.summaryValue, { color: themeColors.primary }]}>
                {chores.filter(c => c.status === 'active' || c.status === 'pending' && !c.completed).length}
              </Text>
            </View>
            <View style={[styles.summaryItem, { backgroundColor: themeColors.surface, borderWidth: 1, borderColor: themeColors.border }]}>
              <Text style={[styles.summaryLabel, { color: themeColors.text }]}>⏳ Pending</Text>
              <Text style={[styles.summaryValue, { color: themeColors.warning }]}>
                {chores.filter(c => c.status === 'pending').length}
              </Text>
            </View>
            <View style={[styles.summaryItem, { backgroundColor: themeColors.surface, borderWidth: 1, borderColor: themeColors.border }]}>
              <Text style={[styles.summaryLabel, { color: themeColors.text }]}>✅ Completed</Text>
              <Text style={[styles.summaryValue, { color: themeColors.success }]}>
                {chores.filter(c => c.status === 'completed' || (c.completed && c.approved)).length}
              </Text>
            </View>
            <View style={[styles.summaryItem, { backgroundColor: themeColors.surface, borderWidth: 2, borderColor: themeColors.primary }]}>
              <Text style={[styles.summaryLabel, { color: themeColors.text }]}>🏆 Total</Text>
              <Text style={[styles.summaryValue, { color: themeColors.primary }]}>
                {chores.length}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Add/Edit Chore Form */}
      <View style={[styles.sectionCard, { backgroundColor: themeColors.card, shadowColor: themeColors.border }]} ref={formSectionRef}>
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
              accessibilityLabel="Task name"
              accessibilityHint="Enter the name of the task for your child"
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

        {/* Quick Preset Points */}
        <View style={styles.presetContainer}>
          <Text style={[styles.inputLabel, { ...SEMANTIC_TYPOGRAPHY["type-body-small"], marginBottom: 8 }]}>Quick Amounts:</Text>
          <View style={styles.presetRow}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Set points to 10"
              accessibilityHint="Quick select 10 points for task reward"
              style={[styles.presetBtn, { backgroundColor: themeColors.secondary }]}
              onPress={() => setPoints('10')}
            >
              <Text style={styles.presetBtnText}>10</Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Set points to 25"
              accessibilityHint="Quick select 25 points for task reward"
              style={[styles.presetBtn, { backgroundColor: themeColors.secondary }]}
              onPress={() => setPoints('25')}
            >
              <Text style={styles.presetBtnText}>25</Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Set points to 50"
              accessibilityHint="Quick select 50 points for task reward"
              style={[styles.presetBtn, { backgroundColor: themeColors.secondary }]}
              onPress={() => setPoints('50')}
            >
              <Text style={styles.presetBtnText}>50</Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Set points to 100"
              accessibilityHint="Quick select 100 points for task reward"
              style={[styles.presetBtn, { backgroundColor: themeColors.secondary }]}
              onPress={() => setPoints('100')}
            >
              <Text style={styles.presetBtnText}>100</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Chore Name Suggestions */}
        <View style={styles.suggestionsContainer}>
          <Text style={[styles.inputLabel, { ...SEMANTIC_TYPOGRAPHY["type-body-small"], marginBottom: 8 }]}>Task Ideas:</Text>
          <View style={styles.suggestionsGrid}>
            {choreSuggestions.slice(0, 16).map((suggestion) => (
              <TouchableOpacity
                key={suggestion}
                accessibilityRole="button"
                accessibilityLabel={`Use task suggestion: ${suggestion}`}
                accessibilityHint="Fill task name field with this suggestion"
                style={[styles.suggestionBtn, { backgroundColor: themeColors.secondary }]}
                onPress={() => {
                  setChoreName(suggestion);
                  setChoreNameError(null);
                }}
              >
                <Text style={styles.suggestionBtnText}>{suggestion}</Text>
              </TouchableOpacity>
            ))}
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
              accessibilityRole="button"
              accessibilityLabel={`Set frequency to ${freq.label}`}
              accessibilityHint="Choose how often this task should repeat"
              accessibilityState={{ selected: frequency === freq.value }}
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
              <Text style={[SEMANTIC_TYPOGRAPHY["type-body"], { color: deadline ? themeColors.text : themeColors.textSecondary }]}>
                {deadline ? deadline : 'Select deadline date'}
              </Text>
              <Text style={[SEMANTIC_TYPOGRAPHY["type-heading-small"], { marginLeft: 8 }]}>📅</Text>
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
            accessibilityRole="radio"
            accessibilityLabel="Use family default split"
            accessibilityHint="Points will be distributed according to family settings"
            accessibilityState={{ selected: useDefaultSplit }}
            style={styles.checkboxContainer}
            onPress={() => setUseDefaultSplit(true)}
          >
            <View style={[styles.checkbox, useDefaultSplit && styles.checkboxChecked]}>
              {useDefaultSplit && <Text style={[SEMANTIC_TYPOGRAPHY["type-body-small"], { color: 'white' }]}>✓</Text>}
            </View>
            <Text style={[styles.checkboxText, { color: themeColors.text }]}>Use Family Default Split</Text>
          </TouchableOpacity>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <TouchableOpacity
            accessibilityRole="radio"
            accessibilityLabel="Custom split for this task"
            accessibilityHint="Set custom percentages for how points are distributed"
            accessibilityState={{ selected: !useDefaultSplit }}
            style={styles.checkboxContainer}
            onPress={() => setUseDefaultSplit(false)}
          >
            <View style={[styles.checkbox, !useDefaultSplit && styles.checkboxChecked]}>
              {!useDefaultSplit && <Text style={[SEMANTIC_TYPOGRAPHY["type-body-small"], { color: 'white' }]}>✓</Text>}
            </View>
            <Text style={[styles.checkboxText, { color: themeColors.text }]}>Custom Split for This Task</Text>
          </TouchableOpacity>
        </View>

        {!useDefaultSplit && (
          <View style={{ marginBottom: 12 }}>
            <Text style={[SEMANTIC_TYPOGRAPHY["type-body-small"], { color: themeColors.text, marginBottom: 8 }]}>
              Set custom percentages (must total 100%):
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
              <View style={{ width: '48%', marginBottom: 8 }}>
                <Text style={[SEMANTIC_TYPOGRAPHY["type-caption-small"], { color: themeColors.text, marginBottom: 2 }]}>💰 Pocket Money</Text>
                <TextInput
                  accessibilityLabel="Pocket money percentage"
                  accessibilityHint="Set percentage of task points to go to pocket money"
                  style={[styles.input, { backgroundColor: themeColors.surface, color: themeColors.text, borderColor: themeColors.border }]}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={themeColors.textSecondary}
                  value={customSplit.current}
                  onChangeText={(text) => setCustomSplit(prev => ({ ...prev, current: text }))}
                />
              </View>
              <View style={{ width: '48%', marginBottom: 8 }}>
                <Text style={[SEMANTIC_TYPOGRAPHY["type-caption-small"], { color: themeColors.text, marginBottom: 2 }]}>🐷 Savings Pot</Text>
                <TextInput
                  accessibilityLabel="Savings pot percentage"
                  accessibilityHint="Set percentage of task points to go to savings"
                  style={[styles.input, { backgroundColor: themeColors.surface, color: themeColors.text, borderColor: themeColors.border }]}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={themeColors.textSecondary}
                  value={customSplit.save}
                  onChangeText={(text) => setCustomSplit(prev => ({ ...prev, save: text }))}
                />
              </View>
              <View style={{ width: '48%', marginBottom: 8 }}>
                <Text style={[SEMANTIC_TYPOGRAPHY["type-caption-small"], { color: themeColors.text, marginBottom: 2 }]}>🛒 Spending Pot</Text>
                <TextInput
                  accessibilityLabel="Spending pot percentage"
                  accessibilityHint="Set percentage of task points to go to spending"
                  style={[styles.input, { backgroundColor: themeColors.surface, color: themeColors.text, borderColor: themeColors.border }]}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={themeColors.textSecondary}
                  value={customSplit.spend}
                  onChangeText={(text) => setCustomSplit(prev => ({ ...prev, spend: text }))}
                />
              </View>
              <View style={{ width: '48%', marginBottom: 8 }}>
                <Text style={[SEMANTIC_TYPOGRAPHY["type-caption-small"], { color: themeColors.text, marginBottom: 2 }]}>❤️ Help Others</Text>
                <TextInput
                  accessibilityLabel="Help others pot percentage"
                  accessibilityHint="Set percentage of task points to go to charity"
                  style={[styles.input, { backgroundColor: themeColors.surface, color: themeColors.text, borderColor: themeColors.border }]}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={themeColors.textSecondary}
                  value={customSplit.donate}
                  onChangeText={(text) => setCustomSplit(prev => ({ ...prev, donate: text }))}
                />
              </View>
              <View style={{ width: '48%', marginBottom: 8 }}>
                <Text style={[SEMANTIC_TYPOGRAPHY["type-caption-small"], { color: themeColors.text, marginBottom: 2 }]}>📈 Grow Money</Text>
                <TextInput
                  accessibilityLabel="Grow money pot percentage"
                  accessibilityHint="Set percentage of task points to go to investments"
                  style={[styles.input, { backgroundColor: themeColors.surface, color: themeColors.text, borderColor: themeColors.border }]}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={themeColors.textSecondary}
                  value={customSplit.invest}
                  onChangeText={(text) => setCustomSplit(prev => ({ ...prev, invest: text }))}
                />
              </View>
            </View>
            <Text style={[SEMANTIC_TYPOGRAPHY["type-body-small"], { color: themeColors.text, textAlign: 'center' }]}>
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
      </View>


      {/* Current Chores - With Tabs/Filters */}
      <View style={[styles.sectionCard, { backgroundColor: themeColors.card, shadowColor: themeColors.border }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            {children.length === 1 ? `${children[0].name}'s Chores` : 'Current Chores'}
          </Text>
          <TouchableOpacity
            style={[styles.refreshBtn, { backgroundColor: refreshing ? themeColors.surface : themeColors.secondary }]}
            onPress={onRefresh}
            disabled={refreshing}
          >
            <Text style={[styles.refreshBtnText, { color: refreshing ? themeColors.textSecondary : themeColors.card }]}>
              {refreshing ? '⏳' : '↻'}
            </Text>
          </TouchableOpacity>
        </View>
        {/* Filter Tabs */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 10 }}>
          {['To Do', 'Done'].map(tab => (
            <TouchableOpacity
              key={tab}
              accessibilityRole="tab"
              accessibilityLabel={`${tab} tasks`}
              accessibilityHint={`Show ${tab.toLowerCase()} tasks`}
              accessibilityState={{ selected: choresTab === tab }}
              onPress={() => setChoresTab(tab as "To Do" | "Done")}
              style={{
                backgroundColor: choresTab === tab ? themeColors.secondary : themeColors.surface,
                paddingHorizontal: 15,
                paddingVertical: 6,
                borderRadius: 18,
                marginHorizontal: 6
              }}
            >
              <Text style={[SEMANTIC_TYPOGRAPHY["type-body-small"], { color: choresTab === tab ? themeColors.card : themeColors.text }]}>
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

  // Helper: robust completion date
  function getChoreCompletedDate(c: any): Date {
    if (c.completedAt && typeof c.completedAt === "string") return new Date(c.completedAt);
    if (c.createdAt && typeof c.createdAt === "string") return new Date(c.createdAt);
    if (c._id && typeof c._id === "string" && c._id.length >= 8) {
      const timestamp = parseInt(c._id.slice(0, 8), 16) * 1000;
      return new Date(timestamp);
    }
    return new Date();
  }

            console.log('DEBUG: choresTab =', choresTab);
            if (choresTab === 'To Do') {
              filteredChores = chores.filter(c => c.status === 'active' || c.status === 'pending');
              console.log('DEBUG: After filtering -', filteredChores.length, 'tasks');
              console.log('DEBUG: filteredChores =', filteredChores.map(c => ({id: c._id, name: c.name, status: c.status, completed: c.completed, approved: c.approved})));
              filteredChores = filteredChores.sort((a, b) =>
                getChoreCompletedDate(b).getTime() - getChoreCompletedDate(a).getTime()
              );
            } else {
              // "Done": completed chores (last 90 days by default)
              const now = new Date();
              const ninetyDaysAgo = new Date(now);
              ninetyDaysAgo.setDate(now.getDate() - 90);
              const filteredRecent = chores.filter(c =>
                c.status === 'completed' && new Date(c.createdAt) >= ninetyDaysAgo
              );
              const filteredArchived = chores.filter(c =>
                c.status === 'completed' && new Date(c.createdAt) < ninetyDaysAgo
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
              <View>
                {filteredChores.map((c) => (
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
                      <Text style={[SEMANTIC_TYPOGRAPHY["type-body"], { color: '#234' }]}>{c.name}</Text>
                    </Text>
                    {c.description && (
                      <Text style={[SEMANTIC_TYPOGRAPHY["type-body-small"], { color: '#666', marginBottom: 6 }]}>
                        {c.description}
                      </Text>
                    )}
                    <Text style={[SEMANTIC_TYPOGRAPHY["type-body-small"], { color: '#666' }]}>
                      Reward: {c.points} points • Frequency: {frequencyOptions.find(f => f.value === c.frequency)?.label || c.frequency}
                    </Text>
                    {c.deadline && (
                      <Text style={[SEMANTIC_TYPOGRAPHY["type-caption-small"], { color: '#666', marginTop: 2 }]}>
                        Deadline: {new Date(c.deadline).toLocaleDateString()}
                      </Text>
                    )}
                    <Text style={[SEMANTIC_TYPOGRAPHY["type-caption-small"], { color: '#666', marginTop: 2 }]}>
                      Status: {c.status ? c.status.charAt(0).toUpperCase() + c.status.slice(1) : ((c.completed && c.approved) ? 'Completed' : c.completed ? 'Pending Approval' : 'Active')} • Created: {new Date(c.createdAt).toLocaleDateString()}
                    </Text>
                    {/* Parent controls: edit/delete for active, pending indicator for pending, nothing for completed/approved */}
                    {c.status === 'active' ? (
                      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 }}>
                        <TouchableOpacity
                          accessibilityRole="button"
                          accessibilityLabel={`Edit task: ${c.name}`}
                          accessibilityHint="Open task edit form with current details"
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
                            // Scroll to the form section (approximately where the form is located)
                            scrollViewRef.current?.scrollTo({ x: 0, y: 400, animated: true });
                          }}
                        >
                          <Text style={[SEMANTIC_TYPOGRAPHY["type-caption-small"], { color: themeColors.card }]}>✏️ Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          accessibilityRole="button"
                          accessibilityLabel={`Delete task: ${c.name}`}
                          accessibilityHint="Permanently remove this task"
                          style={{
                            backgroundColor: themeColors.error,
                            paddingHorizontal: 10,
                            paddingVertical: 6,
                            borderRadius: 6,
                            marginLeft: 8
                          }}
                          onPress={async () => {
                            setError('');
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
                              showMessage('Task deleted successfully.', 'success');
                              loadChores();
                            } catch (err: any) {
                              showMessage(err.message || 'Failed to delete chore.', 'error');
                            }
                          }}
                        >
                          <Text style={[SEMANTIC_TYPOGRAPHY["type-caption-small"], { color: themeColors.card }]}>🗑️ Delete</Text>
                        </TouchableOpacity>
                      </View>
                    ) : c.status === 'pending' ? (
                      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 }}>
                        <Text style={{
                          color: themeColors.warning,
                          ...SEMANTIC_TYPOGRAPHY["type-caption"],
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
                    accessibilityRole="button"
                    accessibilityLabel="Show all completed tasks from any time"
                    accessibilityHint="Display tasks completed more than 90 days ago"
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
                    <Text style={[SEMANTIC_TYPOGRAPHY["type-body-small"], { color: '#5837a7' }]}>Show All Completed Tasks</Text>
                  </TouchableOpacity>
                )}
                {choresTab === 'Done' && showAllCompleted && (
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Show only recently completed tasks"
                    accessibilityHint="Hide tasks completed more than 90 days ago"
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
                    <Text style={[SEMANTIC_TYPOGRAPHY["type-body-small"], { color: '#5837a7' }]}>Show Only Last 90 Days</Text>
                  </TouchableOpacity>
                )}
              </View>
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
    </KeyboardAvoidingView>
  );
}
