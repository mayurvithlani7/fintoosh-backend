import BackButton from '@/components/BackButton';
import HelpModal from '@/components/HelpModal';
import { rewardSuggestions } from '@/constants/rewardSuggestions';
import { SEMANTIC_TYPOGRAPHY } from '@/constants/theme';
import { useCenteredMessage } from '@/utils/centeredMessageContext';
import { API_URL } from '@/utils/config';
import { getAuthToken } from '@/utils/secureStorage';
import { useTheme } from '@/utils/themeContext';
import { useFocusEffect } from '@react-navigation/native';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { fetchFamilyChildren, fetchRewards } from '../../utils/api';

interface ChildUser {
  _id: string;
  id: string;
  name: string;
}

interface Reward {
  _id: string;
  name: string;
  cost: number;
  description?: string;
  purchased?: boolean;
  available?: boolean;
  status?: string; // status field ("active", "pending", "completed")
}

export default function ParentsRewardsScreen() {
  const { showMessage } = useCenteredMessage();
  const { themeColors } = useTheme();
  const styles = createStyles(themeColors);
  const accentColor = themeColors.accent;
  const cardColor = themeColors.card;
  const [children, setChildren] = useState<ChildUser[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(false);
  const [rewardName, setRewardName] = useState('');
  const [pointsCost, setPointsCost] = useState('');
  const [description, setDescription] = useState('');
  // Remove local error and feedback; use global
  // New: Tab/filter for rewards
  const [rewardsTab, setRewardsTab] = useState<'Available' | 'Claimed'>('Available');
  // Show/hide archive for Claimed
  const [showAllClaimed, setShowAllClaimed] = useState(false);
  const [helpModalVisible, setHelpModalVisible] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);

  // Validation state
  const [validationErrors, setValidationErrors] = useState<{
    rewardName?: string;
    pointsCost?: string;
    description?: string;
    childId?: string;
  }>({});
  const scrollViewRef = React.useRef<ScrollView>(null);
  const formSectionRef = React.useRef<View>(null);

  // Utility: always return the Date the reward was created (createdAt if present, else Mongo _id)
  function getRewardCreatedDate(r: Reward): Date {
    if ((r as any).createdAt && typeof (r as any).createdAt === "string") {
      return new Date((r as any).createdAt);
    }
    // fallback to Mongo ObjectId timestamp
    if (r._id && typeof r._id === "string" && r._id.length >= 8) {
      const timestamp = parseInt(r._id.slice(0, 8), 16) * 1000;
      return new Date(timestamp);
    }
    return new Date(); // fallback: now
  }

  // Secure: force clear and reload of children and rewards when parent session changes
  useEffect(() => {
    async function checkUser() {
      const token = await getAuthToken();
      const { getUser } = await import('@/utils/secureStorage');
      const storedUser = await getUser();
      if (!token || !storedUser) {
        setChildren([]);
        setSelectedChildId('');
        setRewards([]);
        return;
      }
      // Reset all local state before reload
      setChildren([]);
      setSelectedChildId('');
      setRewards([]);
      loadChildren();
    }
    checkUser();

    // Optionally monitor "storage" events for cross-tab updates (web)
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

  // Auto-fetch rewards whenever the screen is focused (parent tab switch), for real-time updates after kid claims
  useFocusEffect(
    React.useCallback(() => {
      if (selectedChildId) {
        const selectedChild = children.find(child => child.id === selectedChildId);
        if (selectedChild) {
          loadRewards(selectedChild.id);
        }
      }
    }, [selectedChildId, children])
  );

  async function loadChildren() {
    try {
      setLoading(true);
      const token = await getAuthToken();
      const { getUser } = await import('@/utils/secureStorage');
      const parentProfile = await getUser();

      if (!token || !parentProfile) {
        showMessage('Not authenticated.', 'error');
        setLoading(false);
        return;
      }
      const familyId = parentProfile.familyId;
      if (!familyId) {
        showMessage('No familyId found for parent.', 'error');
        setLoading(false);
        return;
      }
      const data = await fetchFamilyChildren(familyId, token);
      setChildren(data);
      if (data.length > 0) {
        setSelectedChildId(data[0].id ?? "");
      }
    } catch (err) {
      showMessage('Failed to load children for family.', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function loadRewards(childId: string) {
    try {
      setLoading(true);
      const token = await getAuthToken();
      if (!token) {
        setLoading(false);
        return;
      }
      const rewardsResponse = await fetchRewards(childId, token as any);
      // Extract rewards array from paginated response
      const data: Reward[] = rewardsResponse.rewards || [];
      // Ensure it's an array
      const safeRewardsData = Array.isArray(data) ? data : [];

      // Security: Validate rewards belong to this family
      const { getUser } = await import('@/utils/secureStorage');
      const parentProfile = await getUser();
      if (parentProfile) {
        const allowedChildIds = children.map(c => c.id);
        if (
          safeRewardsData &&
          safeRewardsData.length > 0 &&
          safeRewardsData.some(
            r =>
              typeof (r as any).childId !== 'undefined' &&
              (typeof (r as any).childId === 'object'
                ? !(allowedChildIds.includes((r as any).childId.id))
                : !(allowedChildIds.includes((r as any).childId)))
          )
        ) {
          // Detected a cross-family/child data leak/misconfig, force logout and clear
          const { clearSensitiveAppData } = await import('@/utils/secureStorage');
          await clearSensitiveAppData();
          if (typeof window !== 'undefined' && window.location) {
            window.location.href = '/login';
          }
          return;
        }
      }
      setRewards(safeRewardsData);
    } catch (err: any) {
      showMessage('Failed to load rewards.', 'error');
      setRewards([]);
    } finally {
      setLoading(false);
    }
  }

  // Validation function
  const validateRewardForm = (): boolean => {
    const errors: typeof validationErrors = {};

    // Validate reward name
    const trimmedName = rewardName.trim();
    if (!trimmedName) {
      errors.rewardName = 'Reward name is required';
    } else if (trimmedName.length < 2) {
      errors.rewardName = 'Reward name must be at least 2 characters';
    } else if (trimmedName.length > 100) {
      errors.rewardName = 'Reward name must be less than 100 characters';
    }

    // Validate points cost
    const trimmedCost = pointsCost.trim();
    if (!trimmedCost) {
      errors.pointsCost = 'Points cost is required';
    } else {
      const costNum = Number(trimmedCost);
      if (isNaN(costNum)) {
        errors.pointsCost = 'Points cost must be a valid number';
      } else if (costNum <= 0) {
        errors.pointsCost = 'Points cost must be greater than 0';
      } else if (costNum > 10000) {
        errors.pointsCost = 'Points cost cannot exceed 10,000';
      }
    }

    // Validate description (optional but check length if provided)
    const trimmedDescription = description.trim();
    if (trimmedDescription && trimmedDescription.length > 500) {
      errors.description = 'Description must be less than 500 characters';
    }

    // Validate child selection
    if (!selectedChildId) {
      errors.childId = 'Please select a child';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Clear validation errors when inputs change
  React.useEffect(() => {
    if (validationErrors.rewardName && rewardName.trim()) {
      setValidationErrors(prev => ({ ...prev, rewardName: undefined }));
    }
  }, [rewardName, validationErrors.rewardName]);

  React.useEffect(() => {
    if (validationErrors.pointsCost && pointsCost.trim()) {
      setValidationErrors(prev => ({ ...prev, pointsCost: undefined }));
    }
  }, [pointsCost, validationErrors.pointsCost]);

  React.useEffect(() => {
    if (validationErrors.description && description.trim().length <= 500) {
      setValidationErrors(prev => ({ ...prev, description: undefined }));
    }
  }, [description, validationErrors.description]);

  async function handleAddReward() {
    // Validate form before submission
    if (!validateRewardForm()) {
      // Show first validation error as message
      const firstError = Object.values(validationErrors).find(error => error);
      if (firstError) {
        showMessage(firstError, 'error');
      }
      return;
    }

    setLoading(true);
    try {
      const token = await getAuthToken();

      let response;
      if (editingReward) {
        // Update existing reward
        response = await fetch(`${API_URL}/rewards/${editingReward._id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: rewardName.trim(),
            cost: Number(pointsCost),
            description: description.trim() ? description.trim() : null,
          }),
        });
      } else {
        // Add new reward
        response = await fetch(`${API_URL}/rewards`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            childId: selectedChildId,
            name: rewardName.trim(),
            cost: Number(pointsCost),
            description: description.trim() ? description.trim() : null,
            category: 'experience', // default category
          }),
        });
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: editingReward ? 'Failed to update reward' : 'Failed to add reward' }));
        throw new Error(errorData.message || (editingReward ? 'Failed to update reward' : 'Failed to add reward'));
      }

      showMessage(editingReward ? 'Reward updated successfully!' : 'Reward added for your child.', 'success');

      // Clear form and validation errors
      setRewardName('');
      setPointsCost('');
      setDescription('');
      setValidationErrors({});
      setEditingReward(null);

      // Find selected child for correct id on fetchRewards
      const selectedChild = children.find(child => child.id === selectedChildId);
      if (selectedChild) {
        await loadRewards(selectedChild.id);
      }
    } catch (err: any) {
      showMessage(err.message || (editingReward ? 'Failed to update reward.' : 'Failed to add reward.'), 'error');
    } finally {
      setLoading(false);
    }
  }

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
        keyboardShouldPersistTaps="handled"
      >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: 520, marginBottom: 22, marginTop: 6 }}>
        <BackButton label="Back to Home" to="/(parents-tabs)" />
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Help and information"
          accessibilityHint="Open help guide for managing child rewards"
          style={{
            backgroundColor: accentColor,
            borderRadius: 16,
            paddingHorizontal: 8,
            paddingVertical: 4,
            elevation: 2,
            minWidth: 32,
            alignItems: 'center',
          }}
          onPress={() => setHelpModalVisible(true)}
        >
          <Text style={[SEMANTIC_TYPOGRAPHY["type-body-small"], { color: cardColor }]}>❓ Help</Text>
        </TouchableOpacity>
      </View>
      <Text style={[styles.title, { color: themeColors.primary, ...SEMANTIC_TYPOGRAPHY["type-display-medium"] }]}>Manage Child Rewards</Text>

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
              👨‍👩‍👦 Select Child to View Rewards
            </Text>
            <View style={[styles.countBadge, {
              position: 'relative',
              marginLeft: 8,
              backgroundColor: themeColors.success
            }]}>
              <Text style={[SEMANTIC_TYPOGRAPHY["type-body-small"], { color: themeColors.card }]}>{children.length}</Text>
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
                    borderColor: selectedChildId === child.id ? themeColors.primary : themeColors.border,
                  }
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Select ${child.name} - ${selectedChildId === child.id ? 'currently selected' : 'tap to select'}`}
                accessibilityHint="Switch to view this child's rewards and progress"
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
          <Text style={[SEMANTIC_TYPOGRAPHY["type-caption"], { color: themeColors.textSecondary, marginTop: 8, textAlign: 'center' }]}>
            Tap any child to view their individual rewards and progress
          </Text>
        </View>
      )}

      {/* Rewards Summary Dashboard */}
      {children.length > 0 && selectedChildId && (
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
              🎁 Rewards Summary
            </Text>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={loading ? "Refreshing data" : "Refresh data"}
              accessibilityHint="Reload latest rewards information"
              accessibilityState={{ disabled: loading }}
              style={[styles.refreshBtn, { backgroundColor: themeColors.secondary }]}
              onPress={() => {
                const selectedChild = children.find(child => child.id === selectedChildId);
                if (selectedChild) {
                  loadRewards(selectedChild.id);
                }
              }}
              disabled={loading}
            >
              <Text style={[SEMANTIC_TYPOGRAPHY["type-body-small"], { color: themeColors.card }]}>
                {loading ? '⏳' : '↻'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.summaryGrid}>
            <View style={[styles.summaryItem, { backgroundColor: themeColors.surface, borderWidth: 1, borderColor: themeColors.border }]}>
              <Text style={[styles.summaryLabel, { color: themeColors.text }]}>🎁 Available</Text>
              <Text style={[styles.summaryValue, { color: themeColors.primary }]}>
                {rewards.filter(r => !r.purchased && r.status !== 'pending' && r.available !== false).length}
              </Text>
            </View>
            <View style={[styles.summaryItem, { backgroundColor: themeColors.surface, borderWidth: 1, borderColor: themeColors.border }]}>
              <Text style={[styles.summaryLabel, { color: themeColors.text }]}>⏳ Pending</Text>
              <Text style={[styles.summaryValue, { color: themeColors.warning }]}>
                {rewards.filter(r => r.status === 'pending' || (r.available === false && !r.purchased)).length}
              </Text>
            </View>
            <View style={[styles.summaryItem, { backgroundColor: themeColors.surface, borderWidth: 1, borderColor: themeColors.border }]}>
              <Text style={[styles.summaryLabel, { color: themeColors.text }]}>✅ Claimed</Text>
              <Text style={[styles.summaryValue, { color: themeColors.success }]}>
                {rewards.filter(r => r.purchased === true).length}
              </Text>
            </View>
            <View style={[styles.summaryItem, { backgroundColor: themeColors.surface, borderWidth: 2, borderColor: themeColors.primary }]}>
              <Text style={[styles.summaryLabel, { color: themeColors.text }]}>🏆 Total</Text>
              <Text style={[styles.summaryValue, { color: themeColors.primary }]}>
                {rewards.length}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Add/Edit Reward */}
      <View style={[styles.sectionCard, { backgroundColor: themeColors.card, shadowColor: themeColors.border }]}>
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>{editingReward ? 'Edit Reward' : 'Add New Reward'}</Text>
        <View style={{ width: '100%' }}>
          <View style={{ marginBottom: 14 }}>
            <Text style={[styles.inputLabel, { color: themeColors.text }]}>Child</Text>
            <View style={{
              borderWidth: 1,
              borderColor: themeColors.border,
              borderRadius: 7,
              backgroundColor: themeColors.surface,
              padding: 8,
              minHeight: 36,
              justifyContent: 'center'
            }}>
              {loading ? (
                <Text style={{ color: themeColors.textSecondary }}>Loading children...</Text>
              ) : children.length > 0 ? (
                <Text style={[SEMANTIC_TYPOGRAPHY["type-body"], { color: themeColors.text }]}>
                  {children.find(child => child.id === selectedChildId)?.name || children[0].name}
                </Text>
              ) : (
                <Text style={{ color: themeColors.textSecondary }}>No children found.</Text>
              )}
            </View>
          </View>
          <View style={{ marginBottom: 14 }}>
            <Text style={[styles.inputLabel, { color: themeColors.text }]}>Reward Name</Text>
            <TextInput
              accessibilityLabel="Reward name"
              accessibilityHint="Enter the name of the reward for your child"
              style={[styles.input, {
                backgroundColor: themeColors.surface,
                color: themeColors.text,
                borderColor: validationErrors.rewardName ? themeColors.error : themeColors.border
              }]}
              placeholder="e.g. New Book"
              placeholderTextColor={themeColors.textSecondary}
              value={rewardName}
              onChangeText={setRewardName}
            />
            {validationErrors.rewardName && (
              <Text style={[styles.validation, { color: themeColors.error }]}>{validationErrors.rewardName}</Text>
            )}
          </View>
          <View style={{ marginBottom: 12 }}>
            <Text style={[styles.inputLabel, { color: themeColors.text }]}>Points Cost</Text>
            <TextInput
              style={[styles.input, {
                backgroundColor: themeColors.surface,
                color: themeColors.text,
                borderColor: validationErrors.pointsCost ? themeColors.error : themeColors.border
              }]}
              placeholder="e.g. 100"
              placeholderTextColor={themeColors.textSecondary}
              keyboardType="numeric"
              value={pointsCost}
              onChangeText={setPointsCost}
            />
            {validationErrors.pointsCost && (
              <Text style={[styles.validation, { color: themeColors.error }]}>{validationErrors.pointsCost}</Text>
            )}
          </View>

          {/* Quick Preset Points */}
          <View style={styles.presetContainer}>
            <Text style={[styles.inputLabel, { ...SEMANTIC_TYPOGRAPHY["type-body-small"], marginBottom: 8 }]}>Quick Amounts:</Text>
          <View style={styles.presetRow}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Set points cost to 25"
              accessibilityHint="Quick select 25 points for reward cost"
              style={[styles.presetBtn, { backgroundColor: themeColors.secondary }]}
              onPress={() => setPointsCost('25')}
            >
              <Text style={styles.presetBtnText}>25</Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Set points cost to 50"
              accessibilityHint="Quick select 50 points for reward cost"
              style={[styles.presetBtn, { backgroundColor: themeColors.secondary }]}
              onPress={() => setPointsCost('50')}
            >
              <Text style={styles.presetBtnText}>50</Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Set points cost to 100"
              accessibilityHint="Quick select 100 points for reward cost"
              style={[styles.presetBtn, { backgroundColor: themeColors.secondary }]}
              onPress={() => setPointsCost('100')}
            >
              <Text style={styles.presetBtnText}>100</Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Set points cost to 200"
              accessibilityHint="Quick select 200 points for reward cost"
              style={[styles.presetBtn, { backgroundColor: themeColors.secondary }]}
              onPress={() => setPointsCost('200')}
            >
              <Text style={styles.presetBtnText}>200</Text>
            </TouchableOpacity>
          </View>
          </View>

          {/* Reward Name Suggestions */}
          <View style={styles.suggestionsContainer}>
            <Text style={[styles.inputLabel, { ...SEMANTIC_TYPOGRAPHY["type-body-small"], marginBottom: 8 }]}>Reward Ideas:</Text>
            <View style={styles.suggestionsGrid}>
              {rewardSuggestions.slice(0, 16).map((suggestion) => (
                <TouchableOpacity
                  key={suggestion}
                  accessibilityRole="button"
                  accessibilityLabel={`Use reward suggestion: ${suggestion}`}
                  accessibilityHint="Fill reward name field with this suggestion"
                  style={[styles.suggestionBtn, { backgroundColor: themeColors.secondary }]}
                  onPress={() => {
                    setRewardName(suggestion);
                  }}
                >
                  <Text style={styles.suggestionBtnText}>{suggestion}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
        <View style={styles.formGroup}>
          <Text style={[styles.inputLabel, { color: themeColors.text }]}>Description (optional)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: themeColors.surface, color: themeColors.text, borderColor: themeColors.border }]}
            placeholder="Description"
            placeholderTextColor={themeColors.textSecondary}
            value={description}
            onChangeText={setDescription}
          />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={editingReward ? "Update reward" : "Add reward"}
            accessibilityHint={editingReward ? "Save changes to the reward" : "Create a new reward for your child"}
            accessibilityState={{ disabled: loading }}
            style={[styles.formBtn, { backgroundColor: themeColors.primary, flex: editingReward ? 0.6 : 1 }]}
            onPress={handleAddReward}
            disabled={loading}
          >
            <Text style={[styles.formBtnText, { color: themeColors.card }]}>{editingReward ? 'Update Reward' : 'Add Reward'}</Text>
          </TouchableOpacity>
          {editingReward && (
            <TouchableOpacity
              style={[styles.cancelBtn, { backgroundColor: themeColors.warning, flex: 0.35 }]}
              onPress={() => {
                setEditingReward(null);
                setRewardName('');
                setPointsCost('');
                setDescription('');
                // Clear local error/feedback
              }}
              accessibilityLabel="Cancel Edit"
            >
              <Text style={[styles.cancelBtnText, { color: themeColors.card }]}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Rewards List */}
      <View style={[styles.sectionCard, { backgroundColor: themeColors.card, shadowColor: themeColors.border }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Your Child's Rewards</Text>
          <TouchableOpacity
            style={{
              backgroundColor: themeColors.secondary,
              paddingVertical: 6,
              paddingHorizontal: 12,
              borderRadius: 6,
              marginTop: 0,
              marginHorizontal: 0,
              minWidth: 36,
              maxWidth: 160,
              alignItems: 'center',
              justifyContent: 'center'
            }}
            accessibilityRole="button"
            accessibilityLabel={loading ? "Refreshing rewards list" : "Refresh rewards list"}
            accessibilityHint="Reload latest information about your child's rewards"
            accessibilityState={{ disabled: loading }}
            onPress={() => {
              const selectedChild = children.find(child => child.id === selectedChildId);
              if (selectedChild) {
                loadRewards(selectedChild.id);
              }
            }}
            disabled={loading}
          >
            <Text style={[SEMANTIC_TYPOGRAPHY["type-body-small"], { color: themeColors.card }]}>
              {loading ? '⏳' : '↻'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Filter Tabs */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 10 }}>
          {['Available', 'Claimed'].map(tab => (
            <TouchableOpacity
              key={tab}
              accessibilityRole="tab"
              accessibilityLabel={`${tab} rewards`}
              accessibilityHint={`Show ${tab.toLowerCase()} rewards`}
              accessibilityState={{ selected: rewardsTab === tab }}
              onPress={() => setRewardsTab(tab as "Available" | "Claimed")}
              style={{
                marginTop: 10,
                alignSelf: 'center',
                backgroundColor: rewardsTab === tab ? themeColors.primary : themeColors.surface,
                paddingHorizontal: 14,
                paddingVertical: 7,
                borderRadius: 16,
                marginHorizontal: 6
              }}
            >
              <Text style={[SEMANTIC_TYPOGRAPHY["type-body-small"], { color: rewardsTab === tab ? themeColors.card : themeColors.primary }]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading && (
          <View style={[styles.sectionCard, { alignItems: 'center', justifyContent: 'center', minHeight: 120 }]}>
            <ActivityIndicator size="large" color={themeColors.primary} />
            <Text style={[styles.placeholder, { marginTop: 12 }]}>Loading rewards...</Text>
          </View>
        )}

        {(() => {
          // Memoized filtered rewards calculation
          const memoizedRewards = useMemo(() => {
            console.log('Rewards for rendering:', rewards.map(r => ({ id: r._id, name: r.name, status: r.status, purchased: r.purchased })));
            let filteredRewards: Reward[] = [];
            let showArchiveButton = false;
            if (rewardsTab === 'Available') {
              filteredRewards = rewards.filter(r => !r.purchased).sort((a, b) =>
                getRewardCreatedDate(b).getTime() - getRewardCreatedDate(a).getTime()
              );
            } else {
              const now = new Date();
              const ninetyDaysAgo = new Date(now);
              ninetyDaysAgo.setDate(now.getDate() - 90);
              const filteredRecent = rewards.filter(r =>
                r.purchased && getRewardCreatedDate(r) >= ninetyDaysAgo
              );
              const filteredArchived = rewards.filter(r =>
                r.purchased && getRewardCreatedDate(r) < ninetyDaysAgo
              );
              filteredRewards = filteredRecent.sort((a, b) =>
                getRewardCreatedDate(b).getTime() - getRewardCreatedDate(a).getTime()
              );
              showArchiveButton = filteredArchived.length > 0;
              if (showAllClaimed) {
                filteredRewards = [...filteredRecent, ...filteredArchived].sort((a, b) =>
                  getRewardCreatedDate(b).getTime() - getRewardCreatedDate(a).getTime()
                );
              }
            }
            return { filteredRewards, showArchiveButton };
          }, [rewards, rewardsTab, showAllClaimed]);

          const { filteredRewards, showArchiveButton } = memoizedRewards;

          if (!loading && rewards.length === 0) {
            return <Text style={[styles.placeholder, { color: themeColors.textSecondary }]}>No rewards set for your child yet.</Text>;
          }
          if (filteredRewards.length === 0) {
            return (
              <Text style={[styles.placeholder, { color: themeColors.textSecondary }]}>
                {rewardsTab === 'Available'
                  ? 'No rewards available.'
                  : 'No rewards claimed recently.'}
              </Text>
            );
          }
          return (
            <View>
              {filteredRewards.map((r: Reward) => (
                <View
                  key={r._id}
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    backgroundColor: r.purchased ? '#e5fcd8'
                      : r.status === 'pending' || r.available === false ? '#fffbe5'
                      : '#f6faff',
                    marginVertical: 5,
                    padding: 9,
                    borderRadius: 7,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: r.purchased ? "#95c294"
                      : r.status === 'pending' || r.available === false ? "#d9cc7b"
                      : "#abd6ee"
                  }}
                >
                  <View style={{ flex: 4 }}>
                    <Text style={[SEMANTIC_TYPOGRAPHY["type-body"], { color: '#234' }]}>{r.name}</Text>
                    <Text style={[SEMANTIC_TYPOGRAPHY["type-body"], { color: '#324' }]}>({r.cost} pts)</Text>
                    {r.description && <Text style={[SEMANTIC_TYPOGRAPHY["type-caption"], { color: '#567' }]}>{r.description}</Text>}
                    {/* Status Display */}
                    {r.purchased ? (
                      <Text style={[SEMANTIC_TYPOGRAPHY["type-caption"], { color: "#18722a" }]}>Claimed</Text>
                    ) : r.status === 'pending' ? (
                      <Text style={[SEMANTIC_TYPOGRAPHY["type-caption"], { color: "#a78912" }]}>Pending Approval</Text>
                    ) : r.available === false ? (
                      <Text style={[SEMANTIC_TYPOGRAPHY["type-caption"], { color: "#a78912" }]}>Waiting for Approval</Text>
                    ) : (
                      <Text style={[SEMANTIC_TYPOGRAPHY["type-caption"], { color: "#184e82" }]}>Available</Text>
                    )}
                  </View>
                  {/* Parent controls: edit/delete for active, pending indicator, nothing for completed/approved */}
                  {r.status === 'active' && !r.purchased ? (
                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 }}>
                      <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel={`Edit reward: ${r.name}`}
                        accessibilityHint="Open reward edit form with current details"
                        style={{
                          backgroundColor: themeColors.primary,
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 6,
                          marginLeft: 8
                        }}
                        onPress={() => {
                          setEditingReward(r);
                          setRewardName(r.name);
                          setPointsCost(r.cost.toString());
                          setDescription(r.description || '');
                          // Scroll to the form section (approximately where the form is located)
                          scrollViewRef.current?.scrollTo({ x: 0, y: 400, animated: true });
                        }}
                      >
                        <Text style={[SEMANTIC_TYPOGRAPHY["type-caption-small"], { color: themeColors.card }]}>✏️ Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel={`Delete reward: ${r.name}`}
                        accessibilityHint="Permanently remove this reward"
                        style={{
                          backgroundColor: themeColors.error,
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          borderRadius: 6,
                          marginLeft: 8
                        }}
                        onPress={async () => {
                          console.log('[FRONTEND DELETE REWARD] Starting deletion for reward:', r._id, r.name);
                          try {
                            const token = await getAuthToken();
                            console.log('[FRONTEND DELETE REWARD] Got token:', token ? 'present' : 'missing');

                            const deleteUrl = `${API_URL}/rewards/${r._id}`;
                            console.log('[FRONTEND DELETE REWARD] Making DELETE request to:', deleteUrl);

                            const response = await fetch(deleteUrl, {
                              method: 'DELETE',
                              headers: { 'Authorization': `Bearer ${token}` }
                            });

                            console.log('[FRONTEND DELETE REWARD] Response status:', response.status);
                            console.log('[FRONTEND DELETE REWARD] Response ok:', response.ok);

                            if (!response.ok) {
                              let errorMessage = 'Failed to delete reward.';
                              try {
                                const errorData = await response.json();
                                console.log('[FRONTEND DELETE REWARD] Error response data:', errorData);
                                errorMessage = errorData.message || errorMessage;
                              } catch (parseError) {
                                console.log('[FRONTEND DELETE REWARD] Could not parse error response:', parseError);
                                const errorText = await response.text();
                                console.log('[FRONTEND DELETE REWARD] Raw error response:', errorText);
                              }
                              throw new Error(errorMessage);
                            }

                            const responseData = await response.json().catch(() => ({}));
                            console.log('[FRONTEND DELETE REWARD] Success response:', responseData);

                            showMessage('Reward deleted successfully.', 'success');

                            const selectedChild = children.find(child => child.id === selectedChildId);
                            if (selectedChild) {
                              console.log('[FRONTEND DELETE REWARD] Reloading rewards for child:', selectedChild.id);
                              await loadRewards(selectedChild.id);
                            }
                          } catch (err: any) {
                            console.error('[FRONTEND DELETE REWARD] Error:', err);
                            showMessage(err.message || 'Failed to delete reward.', 'error');
                          }
                        }}
                      >
                        <Text style={[SEMANTIC_TYPOGRAPHY["type-caption-small"], { color: themeColors.card }]}>🗑️ Delete</Text>
                      </TouchableOpacity>
                    </View>
                  ) : r.status === 'pending' ? (
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
              {/* Archive toggle for claimed rewards */}
              {rewardsTab === 'Claimed' && showArchiveButton && !showAllClaimed && (
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Show all claimed rewards from any time"
                  accessibilityHint="Display rewards claimed more than 90 days ago"
                  style={{
                    marginTop: 12,
                    alignSelf: 'center',
                    backgroundColor: '#e7e2fa',
                    paddingHorizontal: 20,
                    paddingVertical: 8,
                    borderRadius: 16
                  }}
                  onPress={() => setShowAllClaimed(true)}
                >
                  <Text style={[SEMANTIC_TYPOGRAPHY["type-body-small"], { color: '#5837a7' }]}>Show All Claimed Rewards</Text>
                </TouchableOpacity>
              )}
              {rewardsTab === 'Claimed' && showAllClaimed && (
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Show only recently claimed rewards"
                  accessibilityHint="Hide rewards claimed more than 90 days ago"
                  style={{
                    marginTop: 10,
                    alignSelf: 'center',
                    backgroundColor: '#e6e6e6',
                    paddingHorizontal: 14,
                    paddingVertical: 7,
                    borderRadius: 16
                  }}
                  onPress={() => setShowAllClaimed(false)}
                >
                  <Text style={[SEMANTIC_TYPOGRAPHY["type-body-small"], { color: '#5837a7' }]}>Show Only Last 90 Days</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })()}
      </View>

      {/* Help Modal */}
      <HelpModal
        visible={helpModalVisible}
        onClose={() => setHelpModalVisible(false)}
        title="🎁 Manage Child Rewards - Help"
        tabs={[
          {
            title: "Understanding the Rewards System",
            content: [
              {
                type: "text",
                text: "Rewards are the exciting payoff for your child's hard work! They learn that consistent effort and saving lead to special privileges and items they want.",
                icon: "🎁"
              },
              {
                type: "bullet",
                text: "You set up rewards with clear names, point costs, and descriptions"
              },
              {
                type: "bullet",
                text: "Children browse available rewards and request to claim them"
              },
              {
                type: "bullet",
                text: "You review and approve requests, teaching decision-making"
              },
              {
                type: "bullet",
                text: "Successfully claimed rewards motivate continued good behavior"
              },
              {
                type: "highlight",
                text: "Rewards transform chores and saving into meaningful achievements!",
                icon: "🏆"
              }
            ]
          },
          {
            title: "Creating Effective Rewards",
            content: [
              {
                type: "text",
                text: "Design rewards that motivate while teaching valuable lessons:",
                icon: "✏️"
              },
              {
                type: "bullet",
                text: "🎯 Clear Names: Use appealing, specific titles ('Movie Night with Family')"
              },
              {
                type: "bullet",
                text: "💰 Fair Pricing: Set costs that require effort but are achievable"
              },
              {
                type: "bullet",
                text: "📝 Detailed Descriptions: Explain exactly what the reward includes"
              },
              {
                type: "bullet",
                text: "🎭 Mix Categories: Physical items, experiences, privileges, and donations"
              },
              {
                type: "bullet",
                text: "👶 Age-Appropriate: Match rewards to your child's interests and maturity"
              },
              {
                type: "highlight",
                text: "The best rewards feel earned and exciting - not too easy or impossible!",
                icon: "🎯"
              }
            ]
          },
          {
            title: "Managing Reward Requests",
            content: [
              {
                type: "text",
                text: "Your approval process teaches children about patience and decision-making:",
                icon: "📋"
              },
              {
                type: "bullet",
                text: "Available Tab - Shows rewards children can request right now"
              },
              {
                type: "bullet",
                text: "Claimed Tab - History of earned rewards (recent 90 days)"
              },
              {
                type: "bullet",
                text: "Pending Approvals - Rewards waiting for your decision"
              },
              {
                type: "bullet",
                text: "Edit Option - Modify reward details anytime"
              },
              {
                type: "bullet",
                text: "Refresh Button - Update the list to see new requests"
              },
              {
                type: "highlight",
                text: "Regular review helps you stay connected with your child's progress!",
                icon: "👀"
              }
            ]
          },
          {
            title: "Setting the Right Point Costs",
            content: [
              {
                type: "text",
                text: "Point costs should balance motivation with realistic effort:",
                icon: "⚖️"
              },
              {
                type: "bullet",
                text: "Small Rewards (25-50 pts): Daily chores, good behavior"
              },
              {
                type: "bullet",
                text: "Medium Rewards (100-200 pts): Special treats, outings"
              },
              {
                type: "bullet",
                text: "Large Rewards (300+ pts): Big purchases, special experiences"
              },
              {
                type: "bullet",
                text: "Consider your child's earning speed and saving habits"
              },
              {
                type: "bullet",
                text: "Adjust costs based on what motivates your child most"
              },
              {
                type: "highlight",
                text: "Start with achievable goals - increase difficulty as confidence grows!",
                icon: "📈"
              }
            ]
          },
          {
            title: "Teaching Financial Lessons",
            content: [
              {
                type: "text",
                text: "Use rewards to build lifelong money management skills:",
                icon: "📚"
              },
              {
                type: "bullet",
                text: "Delayed Gratification: Waiting and saving for wanted items"
              },
              {
                type: "bullet",
                text: "Budgeting: Choosing which rewards to prioritize"
              },
              {
                type: "bullet",
                text: "Decision Making: Weighing wants against effort required"
              },
              {
                type: "bullet",
                text: "Responsibility: Following through on earning commitments"
              },
              {
                type: "bullet",
                text: "Goal Achievement: Celebrating earned success"
              },
              {
                type: "highlight",
                text: "Rewards aren't just treats - they're powerful teaching tools!",
                icon: "🌟"
              }
            ]
          },
          {
            title: "Creative Reward Ideas",
            content: [
              {
                type: "text",
                text: "Spark your child's imagination with diverse reward options:",
                icon: "💡"
              },
              {
                type: "bullet",
                text: "🎮 Digital Fun: Extra game time, app downloads, online experiences"
              },
              {
                type: "bullet",
                text: "🍕 Food Rewards: Favorite meals, baking sessions, restaurant outings"
              },
              {
                type: "bullet",
                text: "🎨 Creative Activities: Art supplies, craft projects, music lessons"
              },
              {
                type: "bullet",
                text: "🏞️ Outdoor Adventures: Park visits, bike rides, nature explorations"
              },
              {
                type: "bullet",
                text: "👨‍👩‍👧‍👦 Family Experiences: Movie nights, game nights, special outings"
              },
              {
                type: "bullet",
                text: "❤️ Giving Rewards: Donating to charity, helping others, volunteering"
              },
              {
                type: "highlight",
                text: "Mix material rewards with experiences for well-rounded development!",
                icon: "⚖️"
              }
            ]
          },
          {
            title: "Best Practices & Tips",
            content: [
              {
                type: "text",
                text: "Make the rewards system work effectively for your family:",
                icon: "💡"
              },
              {
                type: "bullet",
                text: "Be Consistent: Honor earned rewards to build trust"
              },
              {
                type: "bullet",
                text: "Review Regularly: Update rewards based on changing interests"
              },
              {
                type: "bullet",
                text: "Celebrate Effort: Praise the work, not just the reward"
              },
              {
                type: "bullet",
                text: "Family Discussions: Talk about why certain rewards were chosen"
              },
              {
                type: "bullet",
                text: "Balance Giving: Include rewards that benefit others"
              },
              {
                type: "highlight",
                text: "The goal is teaching financial wisdom, not just giving prizes!",
                icon: "🎯"
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
  sectionTitle: { ...SEMANTIC_TYPOGRAPHY["type-heading-small"], marginBottom: 12, color: themeColors.text },
  formRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  formGroup: { flex: 1, marginHorizontal: 6 },
  inputLabel: { ...SEMANTIC_TYPOGRAPHY["type-body-small"], marginBottom: 4, color: themeColors.text },
  input: { borderWidth: 1, borderColor: themeColors.border, borderRadius: 7, padding: 8, ...SEMANTIC_TYPOGRAPHY["type-body"], marginBottom: 2, backgroundColor: themeColors.surface, color: themeColors.text },
  formBtn: { backgroundColor: themeColors.primary, padding: 10, borderRadius: 8, marginTop: 3, marginHorizontal: 6, alignItems: 'center' },
  formBtnText: { ...SEMANTIC_TYPOGRAPHY["type-body-small"], color: themeColors.card },
  validation: { color: themeColors.error, ...SEMANTIC_TYPOGRAPHY["type-body-small"], marginTop: 4, marginBottom: 4 },
  statusMessage: { ...SEMANTIC_TYPOGRAPHY["type-body-small"], color: themeColors.success, marginTop: 4 },
  placeholder: { color: themeColors.textSecondary, fontStyle: 'italic', ...SEMANTIC_TYPOGRAPHY["type-body-small"], textAlign: 'center', paddingVertical: 20 },
  childPickerRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 6 },
  childBtn: { paddingHorizontal: 14, paddingVertical: 7, backgroundColor: themeColors.surface, borderRadius: 15, marginHorizontal: 3, marginBottom: 4 },
  childBtnSelected: { backgroundColor: themeColors.primary },
  childBtnText: { ...SEMANTIC_TYPOGRAPHY["type-body-small"], color: themeColors.text },
  childBtnTextSelected: { color: themeColors.card },
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
  // Refresh button and summary styles (copied from goals)
  refreshBtn: {
    backgroundColor: themeColors.secondary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
  },
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
