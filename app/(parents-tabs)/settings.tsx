import BackButton from '@/components/BackButton';
import HelpModal from '@/components/HelpModal';
import { SEMANTIC_TYPOGRAPHY } from '@/constants/theme';
import { useCenteredMessage } from '@/utils/centeredMessageContext';
import { API_URL } from '@/utils/config';
import { useCurrency } from '@/utils/currencyContext';
import { MOBILE_LAYOUT, MOBILE_STYLES } from '@/utils/mobileLayout';
import { getAuthToken } from '@/utils/secureStorage';
import { useTheme } from '@/utils/themeContext';
import { Picker } from "@react-native-picker/picker";
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

const createStyles = (themeColors: any) => StyleSheet.create({
  container: { ...MOBILE_STYLES.scrollContent, alignItems: 'center' },
  title: { ...SEMANTIC_TYPOGRAPHY["type-display-medium"], marginBottom: MOBILE_LAYOUT.sectionSpacing, marginTop: MOBILE_LAYOUT.itemSpacing, color: themeColors.primary },
  sectionCard: { ...MOBILE_STYLES.card, minWidth: 300, width: '97%', maxWidth: 520, elevation: 2, backgroundColor: themeColors.card, shadowColor: themeColors.border },
  sectionTitle: { ...SEMANTIC_TYPOGRAPHY["type-heading-large"], marginBottom: MOBILE_LAYOUT.itemSpacing, color: themeColors.text },
  inputLabel: { fontWeight: '500', marginBottom: MOBILE_LAYOUT.itemSpacing, color: themeColors.text, ...SEMANTIC_TYPOGRAPHY["type-body"] },
  input: { borderWidth: 1, borderColor: themeColors.border, borderRadius: MOBILE_LAYOUT.borderRadius, padding: MOBILE_LAYOUT.cardPadding, ...SEMANTIC_TYPOGRAPHY["type-body"], marginBottom: MOBILE_LAYOUT.itemSpacing, backgroundColor: themeColors.surface, color: themeColors.text },
  inputWithPlaceholder: { borderWidth: 1, borderColor: themeColors.border, borderRadius: MOBILE_LAYOUT.borderRadius, padding: MOBILE_LAYOUT.cardPadding, ...SEMANTIC_TYPOGRAPHY["type-body"], marginBottom: MOBILE_LAYOUT.itemSpacing, backgroundColor: themeColors.surface, color: themeColors.text },
  pickerContainer: { borderWidth: 1, borderColor: themeColors.border, borderRadius: MOBILE_LAYOUT.borderRadius, marginBottom: MOBILE_LAYOUT.itemSpacing, backgroundColor: themeColors.surface },
  checkboxContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: MOBILE_LAYOUT.itemSpacing },
  checkbox: { width: MOBILE_LAYOUT.minTouchTarget, height: MOBILE_LAYOUT.minTouchTarget, borderWidth: 2, borderColor: themeColors.border, borderRadius: 4, marginRight: MOBILE_LAYOUT.itemSpacing, justifyContent: 'center', alignItems: 'center' },
  checkboxChecked: { backgroundColor: themeColors.primary },
  checkboxText: { ...SEMANTIC_TYPOGRAPHY["type-body"], color: themeColors.text },
  saveButton: { backgroundColor: themeColors.primary, paddingVertical: MOBILE_LAYOUT.itemSpacing, paddingHorizontal: MOBILE_LAYOUT.cardPadding, borderRadius: MOBILE_LAYOUT.borderRadius, alignItems: 'center', marginTop: MOBILE_LAYOUT.itemSpacing },
  saveButtonText: { ...SEMANTIC_TYPOGRAPHY["type-body"], color: themeColors.card, fontWeight: 'bold' },
  statusMessage: { ...SEMANTIC_TYPOGRAPHY["type-body-small"], fontWeight: '600', marginTop: MOBILE_LAYOUT.itemSpacing, color: themeColors.success, textAlign: 'center' },
  radioRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 12,
  },
  radioOption: {
    flex: 1,
    backgroundColor: themeColors.surface,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 2,
    borderWidth: 1.5,
    borderColor: themeColors.border,
  },
  radioSelected: {
    backgroundColor: themeColors.primary,
    borderColor: themeColors.primary,
  },
  radioText: {
    ...SEMANTIC_TYPOGRAPHY["type-body"],
    fontWeight: '600',
    color: themeColors.text,
  },
  radioTextSelected: {
    color: themeColors.card,
  },
});

function ParentAutomationRulesSection({ themeColors }: { themeColors: any }) {
  const { autoApprovalRules = {}, updateSettings, reloadSettings } = useCurrency();
  const [choreClaimMax, setChoreClaimMax] = useState(autoApprovalRules.choreClaimMax !== undefined ? autoApprovalRules.choreClaimMax.toString() : '');
  const [rewardClaimMax, setRewardClaimMax] = useState(autoApprovalRules.rewardClaimMax !== undefined ? autoApprovalRules.rewardClaimMax.toString() : '');
  const [pointMoveMax, setPointMoveMax] = useState(autoApprovalRules.pointMoveMax !== undefined ? autoApprovalRules.pointMoveMax.toString() : '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Sync when autoApprovalRules update on reload
  useEffect(() => {
    setChoreClaimMax(
      autoApprovalRules.choreClaimMax !== undefined ? autoApprovalRules.choreClaimMax.toString() : ''
    );
    setRewardClaimMax(
      autoApprovalRules.rewardClaimMax !== undefined ? autoApprovalRules.rewardClaimMax.toString() : ''
    );
    setPointMoveMax(
      autoApprovalRules.pointMoveMax !== undefined ? autoApprovalRules.pointMoveMax.toString() : ''
    );
  }, [autoApprovalRules]);

  const handleSave = async () => {
    const fields = [
      { key: 'choreClaimMax', val: choreClaimMax },
      { key: 'rewardClaimMax', val: rewardClaimMax },
      { key: 'pointMoveMax', val: pointMoveMax }
    ];
    const rules: any = {};
    for (const { key, val } of fields) {
      if (val !== '') {
        const parsed = parseInt(val);
        if (isNaN(parsed) || parsed < 0) {
          setMessage('Please enter valid non-negative numbers for all fields.');
          return;
        }
        rules[key] = parsed;
      }
    }

    setSaving(true);
    try {
      await updateSettings({ autoApprovalRules: rules });
      await reloadSettings();
      setMessage('Automation rules saved!');
      setTimeout(() => setMessage(''), 3000);
    } catch {
      setMessage('Failed to save automation rules. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const styles = createStyles(themeColors);

  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>🤖 Automation Rules (Auto-Approval)</Text>
            <Text style={{ ...SEMANTIC_TYPOGRAPHY["type-body-small"], color: themeColors.textSecondary, marginBottom: MOBILE_LAYOUT.itemSpacing, lineHeight: 20 }}>
        Parents can set point-based rules to automatically approve low-value requests.
      </Text>
      <View style={{ marginBottom: 14 }}>
        <Text style={styles.inputLabel}>Chore Claims: Auto-approve all claims under</Text>
        <TextInput
          value={choreClaimMax}
          onChangeText={setChoreClaimMax}
          keyboardType="numeric"
          placeholder="Points (e.g., 50)"
          style={styles.inputWithPlaceholder}
          placeholderTextColor={themeColors.textSecondary}
        />
        <Text style={{ ...SEMANTIC_TYPOGRAPHY["type-caption"], color: themeColors.textSecondary }}>Example: Enter 50 to auto-approve all chores worth 50 points or less.</Text>
      </View>
      <View style={{ marginBottom: 14 }}>
        <Text style={styles.inputLabel}>Reward Claims: Auto-approve all rewards under</Text>
        <TextInput
          value={rewardClaimMax}
          onChangeText={setRewardClaimMax}
          keyboardType="numeric"
          placeholder="Points (e.g., 20)"
          style={styles.inputWithPlaceholder}
          placeholderTextColor={themeColors.textSecondary}
        />
        <Text style={{ ...SEMANTIC_TYPOGRAPHY["type-caption"], color: themeColors.textSecondary }}>Example: Enter 20 to auto-approve reward redemptions that cost 20 points or less.</Text>
      </View>
      <View style={{ marginBottom: 18 }}>
        <Text style={styles.inputLabel}>Point Moves: Auto-approve moves less than</Text>
        <TextInput
          value={pointMoveMax}
          onChangeText={setPointMoveMax}
          keyboardType="numeric"
          placeholder="Points (e.g., 10)"
          style={styles.input}
        />
        <Text style={{ ...SEMANTIC_TYPOGRAPHY["type-caption"], color: themeColors.textSecondary }}>Example: Enter 10 to auto-approve point transfers between jars below 10 points.</Text>
      </View>
      <TouchableOpacity
        style={[styles.saveButton, saving && { opacity: 0.6 }]}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.saveButtonText}>
          {saving ? 'Saving...' : 'Save Automation Rules'}
        </Text>
      </TouchableOpacity>
      {!!message && <Text style={styles.statusMessage}>{message}</Text>}
    </View>
  );
}

export default function ParentSettingsScreen() {
  const router = useRouter();
  const { themeColors } = useTheme();
  const { showMessage } = useCenteredMessage();
  const { currency, conversionRate, showDenominations, defaultSplit, interestRule, updateSettings, reloadSettings } = useCurrency();
  const styles = createStyles(themeColors);

  const [selectedCurrency, setSelectedCurrency] = useState<'points' | 'inr'>('points');
  const [selectedConversionRate, setSelectedConversionRate] = useState('1');
  const [selectedShowDenominations, setSelectedShowDenominations] = useState(false);
  const [selectedDefaultSplit, setSelectedDefaultSplit] = useState({
    current: '40',
    save: '30',
    spend: '15',
    donate: '10',
    invest: '5'
  });

  // Savings Interest Rule State
  const [interestRate, setInterestRate] = useState('5'); // percent as string
  const [interestFrequency, setInterestFrequency] = useState('monthly');
  // Only "save" jar is supported.
  const [savingInterest, setSavingInterest] = useState(false);
  const [interestMsg, setInterestMsg] = useState("");
  // To prepopulate from stored user, we would fetch from settings in a real app – left as-is for now.

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [helpModalVisible, setHelpModalVisible] = useState(false);

  // Child Account Management State
  const [childManagementModalVisible, setChildManagementModalVisible] = useState(false);
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChild, setSelectedChild] = useState<any>(null);
  const [parentPassword, setParentPassword] = useState('');
  const [newChildPin, setNewChildPin] = useState('');
  const [confirmChildPin, setConfirmChildPin] = useState('');
  const [resettingPin, setResettingPin] = useState(false);
  const [childManagementMessage, setChildManagementMessage] = useState('');
  const [loadingChildren, setLoadingChildren] = useState(false);

  // Account Deactivation State
  const [deactivationModalVisible, setDeactivationModalVisible] = useState(false);
  const [deactivationPassword, setDeactivationPassword] = useState('');
  const [deactivatingAccount, setDeactivatingAccount] = useState(false);
  const [deactivationMessage, setDeactivationMessage] = useState('');

  // Account Deletion State
  const [deletionModalVisible, setDeletionModalVisible] = useState(false);
  const [deletionStep, setDeletionStep] = useState(1); // 1: Warning, 2: Confirmation, 3: MFA
  const [deletionConfirmationText, setDeletionConfirmationText] = useState('');
  const [deletionPassword, setDeletionPassword] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deletionMessage, setDeletionMessage] = useState('');

  // Caregiver Relationship Management State
  const [caregiverModalVisible, setCaregiverModalVisible] = useState(false);
  const [caregivers, setCaregivers] = useState<any[]>([]);
  const [selectedCaregiver, setSelectedCaregiver] = useState<any>(null);
  const [selectedRelationship, setSelectedRelationship] = useState('');
  const [updatingRelationship, setUpdatingRelationship] = useState(false);
  const [caregiverMessage, setCaregiverMessage] = useState('');

  // Custom Dropdown State
  const [currencyDropdownVisible, setCurrencyDropdownVisible] = useState(false);
  const [frequencyDropdownVisible, setFrequencyDropdownVisible] = useState(false);
  const [relationshipDropdownVisible, setRelationshipDropdownVisible] = useState(false);
  const [childDropdownVisible, setChildDropdownVisible] = useState(false);

  // Secure: Reset children state and refetch on parent session/token/user change
  useEffect(() => {
    async function checkUser() {
      const token = await getAuthToken();
      const { getUser } = await import('@/utils/secureStorage');
      const storedUser = await getUser();
      if (!token || !storedUser) {
        setChildren([]);
        setSelectedChild(null);
        return;
      }
      setChildren([]);
      setSelectedChild(null);
      await fetchChildren();
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

  // Sync ALL local state with context values when they load or after a save+reload
  useEffect(() => {
    setSelectedCurrency(currency);
    setSelectedConversionRate(conversionRate.toString());
    setSelectedShowDenominations(showDenominations);
    setSelectedDefaultSplit({
      current: defaultSplit.current.toString(),
      save: defaultSplit.save.toString(),
      spend: defaultSplit.spend.toString(),
      donate: defaultSplit.donate.toString(),
      invest: defaultSplit.invest.toString(),
    });
    // Also sync interest rule UI
    if (typeof interestRule?.rate === "number") setInterestRate(interestRule.rate.toString());
    if (interestRule?.frequency) setInterestFrequency(interestRule.frequency);
  }, [currency, conversionRate, showDenominations, defaultSplit, interestRule]);

  const handleSave = async () => {
    const rate = parseFloat(selectedConversionRate);
    if (isNaN(rate) || rate < 0.1 || rate > 100) {
      showMessage('Conversion rate must be between 0.1 and 100', 'error');
      return;
    }

    setSaving(true);
    try {
      await updateSettings({
        currency: selectedCurrency,
        conversionRate: rate,
        showDenominations: selectedShowDenominations,
      });
      setMessage("Settings saved successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch {
      showMessage('Failed to save settings. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAutomation = async () => {
    const split = {
      current: parseInt(selectedDefaultSplit.current) || 0,
      save: parseInt(selectedDefaultSplit.save) || 0,
      spend: parseInt(selectedDefaultSplit.spend) || 0,
      donate: parseInt(selectedDefaultSplit.donate) || 0,
      invest: parseInt(selectedDefaultSplit.invest) || 0,
    };

    const total = Object.values(split).reduce((sum, val) => sum + val, 0);
    if (total !== 100) {
        showMessage('Point percentages must total exactly 100%', 'error');
        return;
    }

    setSaving(true);
    try {
      await updateSettings({ defaultSplit: split });
      setMessage("Point automation settings saved successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch {
      showMessage('Failed to save automation settings. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Savings Interest Rule save handler
  const handleSaveInterestRule = async () => {
    const rateNum = parseFloat(interestRate);
    if (isNaN(rateNum) || rateNum < 0.1 || rateNum > 10) {
      showMessage('Interest rate should be between 0.1% and 10%', 'error');
      return;
    }
    if (!['weekly', 'monthly'].includes(interestFrequency)) {
      showMessage('Choose a payout frequency.', 'error');
      return;
    }
    setSavingInterest(true);
    try {
      await updateSettings({
        interestRule: {
          rate: rateNum,
          frequency: interestFrequency,
          jar: "save"
        }
      });
      // Force context reload so parent dashboard will see new rule live:
      await reloadSettings();
      setInterestMsg("Interest rule saved!");
      setTimeout(() => setInterestMsg(""), 2500);
    } catch {
      showMessage('Could not save interest rule, try again later.', 'error');
    } finally {
      setSavingInterest(false);
    }
  };

  // Child Account Management Functions
  const fetchChildren = async () => {
    setLoadingChildren(true);
    try {
      const { getUser } = await import('@/utils/secureStorage');
      const currentUser = await getUser();
      const token = await getAuthToken();

      if (!currentUser || !token) {
        setChildren([]);
        setLoadingChildren(false);
        return;
      }
      const response = await fetch(`${API_URL}/users?familyId=${currentUser.familyId}&role=child`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setChildren(data || []);
      } else {
        console.error('Failed to fetch children');
        setChildren([]);
      }
    } catch (error) {
      console.error('Error fetching children:', error);
      setChildren([]);
    } finally {
      setLoadingChildren(false);
    }
  };

  const handleResetChildPin = async () => {
    if (!selectedChild) {
      setChildManagementMessage('Please select a child first.');
      return;
    }

    if (!parentPassword.trim()) {
      setChildManagementMessage('Please enter your parent password.');
      return;
    }

    if (!newChildPin.trim() || !confirmChildPin.trim()) {
      setChildManagementMessage('Please fill in both PIN fields.');
      return;
    }

    if (newChildPin !== confirmChildPin) {
      setChildManagementMessage('PINs do not match.');
      return;
    }

    if (newChildPin.length < 4 || newChildPin.length > 6) {
      setChildManagementMessage('PIN must be 4-6 digits.');
      return;
    }

    setResettingPin(true);
    setChildManagementMessage('');

    try {
      const response = await fetch(`${API_URL}/auth/reset-child-pin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getAuthToken()}`,
        },
        body: JSON.stringify({
          childId: selectedChild._id,
          newPin: newChildPin.trim(),
          parentPassword: parentPassword.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setChildManagementMessage('Child PIN reset successfully!');
        // Reset form
        setSelectedChild(null);
        setParentPassword('');
        setNewChildPin('');
        setConfirmChildPin('');
        setChildManagementModalVisible(false);
        setTimeout(() => setChildManagementMessage(''), 3000);
              } else {
                showMessage('Network error. Please try again.', 'error');
              }
    } catch (error) {
      console.error('Error resetting PIN:', error);
      setChildManagementMessage('Network error. Please try again.');
    } finally {
      setResettingPin(false);
    }
  };

  const openChildPinResetModal = async () => {
    await fetchChildren();
    setChildManagementModalVisible(true);
  };

  // Account Deactivation Function
  const handleDeactivateAccount = async () => {
    if (!deactivationPassword.trim()) {
      setDeactivationMessage('Please enter your password.');
      return;
    }

    setDeactivatingAccount(true);
    setDeactivationMessage('');

    try {
      const response = await fetch(`${API_URL}/auth/deactivate-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getAuthToken()}`,
        },
        body: JSON.stringify({
          password: deactivationPassword.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setDeactivationMessage('Account deactivated successfully. All family logins are now blocked.');
        // Close modal immediately
        setDeactivationModalVisible(false);
    // Force immediate logout and navigation
    setTimeout(async () => {
      try {
        console.log('Account deactivated, clearing ALL auth data and navigating to login...');
        // Clear ALL user data to prevent app reload from showing dashboard
        const { clearAllUserData } = await import('@/utils/secureStorage');
        await clearAllUserData();
        // Use dismissAll to ensure clean navigation state
        router.dismissAll();
        // Navigate to login screen directly
        router.replace('/login');
      } catch (error) {
        console.error('Error during logout after deactivation:', error);
        // Fallback navigation - try to clear what we can
        try {
          const { clearAllUserData } = await import('@/utils/secureStorage');
          await clearAllUserData();
        } catch (clearError) {
          console.error('Fallback clear failed:', clearError);
        }
        router.dismissAll();
        router.replace('/login');
      }
    }, 200);
      } else {
        setDeactivationMessage(data.message || 'Failed to deactivate account. Please try again.');
      }
    } catch (error) {
      console.error('Error deactivating account:', error);
      setDeactivationMessage('Network error. Please try again.');
    } finally {
      setDeactivatingAccount(false);
    }
  };

  // Caregiver Relationship Management Functions
  const fetchCaregiversForManagement = useCallback(async () => {
    try {
      const token = await getAuthToken();
      const { getUser } = await import('@/utils/secureStorage');
      const currentUser = await getUser();

      if (!token || !currentUser) {
        showMessage('Not authenticated. Please login again.', 'error');
        return;
      }

      // Fetch all parents in the family
      const parentsResponse = await fetch(`${API_URL}/users?familyId=${currentUser.familyId}&role=parent`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!parentsResponse.ok) {
        console.error('Failed to fetch caregivers for management');
        setCaregivers([]);
        return;
      }

      const caregivers = await parentsResponse.json();

      // Fetch children to get relationship information
      const childrenResponse = await fetch(`${API_URL}/users?familyId=${currentUser.familyId}&role=child`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      let children = [];
      if (childrenResponse.ok) {
        children = await childrenResponse.json();
      }

      // Add relationship information to caregivers based on children data
      const caregiversWithRelationships = caregivers.map((caregiver: any) => {
        // First, try to find relationship from any child that has this caregiver
        let relationship = null;
        for (const child of children) {
          if (child.caregivers && Array.isArray(child.caregivers)) {
            const caregiverEntry = child.caregivers.find((c: any) => c.userId === caregiver.id);
            if (caregiverEntry && caregiverEntry.relationship) {
              relationship = caregiverEntry.relationship;
              break;
            }
          }
        }

        // If no child-specific relationship found, use the parent's stored relationship
        if (!relationship && caregiver.relationship) {
          relationship = caregiver.relationship;
        }

        return {
          ...caregiver,
          relationship: relationship
        };
      });

      setCaregivers(caregiversWithRelationships || []);
    } catch (error) {
      console.error('Error fetching caregivers for management:', error);
      setCaregivers([]);
      showMessage('Network error. Please try again.', 'error');
    }
  }, []);

  const handleUpdateCaregiverRelationship = async () => {
    if (!selectedCaregiver) {
      setCaregiverMessage('Please select a caregiver first.');
      return;
    }

    if (!selectedRelationship.trim()) {
      setCaregiverMessage('Please select a relationship.');
      return;
    }

    setUpdatingRelationship(true);
    setCaregiverMessage('');

    try {
      const token = await getAuthToken();
      const { getUser } = await import('@/utils/secureStorage');
      const currentUser = await getUser();

      if (!token || !currentUser) {
        throw new Error('Authentication required');
      }

      // Get all child users in the family to find the one that has this caregiver
      const childResponse = await fetch(`${API_URL}/users?familyId=${currentUser.familyId}&role=child`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!childResponse.ok) {
        throw new Error('Failed to get child data');
      }

      const childUsers = await childResponse.json();

      // Find the child user that has this caregiver in their caregivers array
      let childUser = null;
      let caregiverIndex = -1;

      for (const child of childUsers) {
        const index = child.caregivers.findIndex((c: any) => c.userId === selectedCaregiver.id);
        if (index !== -1) {
          childUser = child;
          caregiverIndex = index;
          break;
        }
      }

      if (!childUser || caregiverIndex === -1) {
        throw new Error('Caregiver not found in any child\'s caregivers list');
      }

      const response = await fetch(`${API_URL}/users/${childUser.id}/caregivers/${caregiverIndex}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          relationship: selectedRelationship
        }),
      });

      if (response.ok) {
        setCaregiverMessage('Caregiver relationship updated successfully!');
        setSelectedCaregiver(null);
        setSelectedRelationship('');
        // Refresh the caregivers list
        await fetchCaregiversForManagement();
        // Close modal after successful update
        setTimeout(() => {
          setCaregiverMessage('');
          setCaregiverModalVisible(false);
        }, 2000);
      } else {
        const errorData = await response.json();
        setCaregiverMessage(errorData.message || 'Failed to update relationship. Please try again.');
      }
    } catch (error) {
      console.error('Error updating caregiver relationship:', error);
      setCaregiverMessage('Network error. Please try again.');
    } finally {
      setUpdatingRelationship(false);
    }
  };

  // Account Deletion Function
  const handleDeleteAccount = async () => {
    if (!deletionPassword.trim()) {
      setDeletionMessage('Please enter your password.');
      return;
    }

    setDeletingAccount(true);
    setDeletionMessage('');

    try {
      const response = await fetch(`${API_URL}/auth/delete-family-account`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getAuthToken()}`,
        },
        body: JSON.stringify({
          password: deletionPassword.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setDeletionMessage('Family account permanently deleted. All data has been removed.');
        // Close modal immediately
        setDeletionModalVisible(false);
        // Force immediate logout and navigation
        setTimeout(async () => {
          try {
            console.log('Account deleted, clearing ALL auth data and navigating to login...');
            // Clear ALL user data to prevent app reload from showing dashboard
            const { clearAllUserData } = await import('@/utils/secureStorage');
            await clearAllUserData();
            // Navigate to login screen directly - use dismissAll to ensure clean navigation state
            router.dismissAll();
            router.replace('/login');
          } catch (error) {
            console.error('Error during logout after deletion:', error);
            // Fallback navigation - try to clear what we can
            try {
              const { clearAllUserData } = await import('@/utils/secureStorage');
              await clearAllUserData();
            } catch (clearError) {
              console.error('Fallback clear failed:', clearError);
            }
            router.dismissAll();
            router.replace('/login');
          }
        }, 500); // Reduced delay for faster logout
      } else {
        setDeletionMessage(data.message || 'Failed to delete account. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      setDeletionMessage('Network error. Please try again.');
    } finally {
      setDeletingAccount(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, width: '100%' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 60}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={{ 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        width: '100%', 
        maxWidth: 520, 
        marginBottom: 22, 
        marginTop: 6,
        backgroundColor: themeColors.background,
        borderRadius: 15,
        padding: 8
      }}>
        <BackButton label="Back to Dashboard" to="/(parents-tabs)" />
        <TouchableOpacity
          style={{
            backgroundColor: themeColors.secondary,
            borderRadius: 20,
            paddingHorizontal: 12,
            paddingVertical: 6,
            elevation: 2,
          }}
          onPress={() => setHelpModalVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Help and information"
          accessibilityHint="Open help guide for family settings"
        >
          <Text style={{ ...SEMANTIC_TYPOGRAPHY["type-body-small"], color: themeColors.card, fontWeight: 'bold' }}>❓ Help</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.title}>⚙️ Family Settings</Text>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>💰 Currency Display</Text>

        <Text style={styles.inputLabel}>Display Format:</Text>
        <View style={styles.radioRow}>
          <TouchableOpacity
            style={[styles.radioOption, selectedCurrency === 'points' && styles.radioSelected]}
            onPress={() => setSelectedCurrency('points')}
          >
            <Text style={[styles.radioText, selectedCurrency === 'points' && styles.radioTextSelected]}>
              Points (Default)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.radioOption, selectedCurrency === 'inr' && styles.radioSelected]}
            onPress={() => setSelectedCurrency('inr')}
          >
            <Text style={[styles.radioText, selectedCurrency === 'inr' && styles.radioTextSelected]}>
              Indian Rupees (₹)
            </Text>
          </TouchableOpacity>
        </View>

        {selectedCurrency === 'inr' && (
          <>
            <Text style={styles.inputLabel}>Conversion Rate (1 point = ₹X):</Text>
            <TextInput
              value={selectedConversionRate}
              onChangeText={setSelectedConversionRate}
              keyboardType="numeric"
              placeholder="e.g., 5"
              style={styles.inputWithPlaceholder}
              placeholderTextColor={themeColors.textSecondary}
            />

            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setSelectedShowDenominations(!selectedShowDenominations)}
            >
              <View style={[styles.checkbox, selectedShowDenominations && styles.checkboxChecked]}>
                {selectedShowDenominations && <Text style={{ ...SEMANTIC_TYPOGRAPHY["type-body-small"], color: 'white' }}>✓</Text>}
              </View>
              <Text style={styles.checkboxText}>Show rupee denomination breakdown</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity
          style={[styles.saveButton, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
          accessibilityRole="button"
          accessibilityLabel={saving ? "Saving currency settings" : "Save currency display settings"}
          accessibilityHint="Apply changes to currency format and conversion rate"
          accessibilityState={{ disabled: saving }}
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Saving...' : 'Save Settings'}
          </Text>
        </TouchableOpacity>

        {message && <Text style={styles.statusMessage}>{message}</Text>}
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>🤖 Point Automation</Text>
        <Text style={{ ...SEMANTIC_TYPOGRAPHY["type-body-small"], color: "#666", marginBottom: MOBILE_LAYOUT.sectionSpacing, lineHeight: 20 }}>
          Set default percentages for how chore points are automatically distributed across money jars.
          Total must equal 100%.
        </Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <View style={{ width: '48%', marginBottom: 12 }}>
            <Text style={styles.inputLabel}>💰 Pocket Money</Text>
            <TextInput
              value={selectedDefaultSplit.current}
              onChangeText={(text) => setSelectedDefaultSplit(prev => ({ ...prev, current: text }))}
              keyboardType="numeric"
              placeholder="40"
              style={styles.input}
            />
          </View>
          <View style={{ width: '48%', marginBottom: 12 }}>
            <Text style={styles.inputLabel}>🐷 Savings Pot</Text>
            <TextInput
              value={selectedDefaultSplit.save}
              onChangeText={(text) => setSelectedDefaultSplit(prev => ({ ...prev, save: text }))}
              keyboardType="numeric"
              placeholder="30"
              style={styles.input}
            />
          </View>
          <View style={{ width: '48%', marginBottom: 12 }}>
            <Text style={styles.inputLabel}>🛒 Spending Pot</Text>
            <TextInput
              value={selectedDefaultSplit.spend}
              onChangeText={(text) => setSelectedDefaultSplit(prev => ({ ...prev, spend: text }))}
              keyboardType="numeric"
              placeholder="15"
              style={styles.input}
            />
          </View>
          <View style={{ width: '48%', marginBottom: 12 }}>
            <Text style={styles.inputLabel}>❤️ Help Others</Text>
            <TextInput
              value={selectedDefaultSplit.donate}
              onChangeText={(text) => setSelectedDefaultSplit(prev => ({ ...prev, donate: text }))}
              keyboardType="numeric"
              placeholder="10"
              style={styles.input}
            />
          </View>
          <View style={{ width: '48%', marginBottom: 12 }}>
            <Text style={styles.inputLabel}>📈 Grow Money</Text>
            <TextInput
              value={selectedDefaultSplit.invest}
              onChangeText={(text) => setSelectedDefaultSplit(prev => ({ ...prev, invest: text }))}
              keyboardType="numeric"
              placeholder="5"
              style={styles.input}
            />
          </View>
        </View>

        <Text style={{ ...SEMANTIC_TYPOGRAPHY["type-body-small"], color: "#666", textAlign: 'center', marginBottom: MOBILE_LAYOUT.itemSpacing }}>
          Total: {Object.values(selectedDefaultSplit).reduce((sum, val) => sum + (parseInt(val) || 0), 0)}%
        </Text>

        <TouchableOpacity
          style={[styles.saveButton, saving && { opacity: 0.6 }]}
          onPress={handleSaveAutomation}
          disabled={saving}
          accessibilityRole="button"
          accessibilityLabel={saving ? "Saving automation settings" : "Save point automation settings"}
          accessibilityHint="Apply changes to point distribution automation"
          accessibilityState={{ disabled: saving }}
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Saving...' : 'Save Automation Settings'}
          </Text>
        </TouchableOpacity>

        {message && <Text style={styles.statusMessage}>{message}</Text>}
      </View>

      {/* --- Savings Interest/Bonus Feature Section --- */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>🏦 Savings Interest/Bonus</Text>
        <Text style={{ ...SEMANTIC_TYPOGRAPHY["type-body-small"], color: "#666", marginBottom: MOBILE_LAYOUT.sectionSpacing, lineHeight: 20 }}>
          Reward your child for saving! Set up an automatic interest/bonus system to help their savings jar grow over time.
        </Text>
        <View style={{ marginBottom: 12 }}>
          <Text style={styles.inputLabel}>Interest Rate (%)</Text>
        <TextInput
          value={interestRate}
          onChangeText={setInterestRate}
          keyboardType="numeric"
          placeholder="e.g., 5"
          style={styles.inputWithPlaceholder}
          placeholderTextColor={themeColors.textSecondary}
        />
        </View>
        <View style={{ marginBottom: 12 }}>
          <Text style={styles.inputLabel}>Frequency</Text>
          <View style={styles.radioRow}>
            <TouchableOpacity
              style={[styles.radioOption, interestFrequency === 'monthly' && styles.radioSelected]}
              onPress={() => setInterestFrequency('monthly')}
            >
              <Text style={[styles.radioText, interestFrequency === 'monthly' && styles.radioTextSelected]}>
                Monthly
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.radioOption, interestFrequency === 'weekly' && styles.radioSelected]}
              onPress={() => setInterestFrequency('weekly')}
            >
              <Text style={[styles.radioText, interestFrequency === 'weekly' && styles.radioTextSelected]}>
                Weekly
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={{ marginBottom: 12 }}>
          <Text style={styles.inputLabel}>Target Pot</Text>
          <TextInput
            value="Saving Pot"
            editable={false}
            style={[styles.input, { backgroundColor: "#edeff2", color: "#888" }]}
          />
            <Text style={{ ...SEMANTIC_TYPOGRAPHY["type-caption"], color: "#888" }}>
              (Interest will only be applied to the Saving Pot)
            </Text>
        </View>
        <TouchableOpacity
          style={[styles.saveButton, savingInterest && { opacity: 0.6 }]}
          onPress={handleSaveInterestRule}
          disabled={savingInterest}
          accessibilityRole="button"
          accessibilityLabel={savingInterest ? "Saving interest rule" : "Save savings interest rule"}
          accessibilityHint="Apply automatic interest settings for child's savings jar"
          accessibilityState={{ disabled: savingInterest }}
        >
          <Text style={styles.saveButtonText}>
            {savingInterest ? 'Saving...' : 'Save Interest Rule'}
          </Text>
        </TouchableOpacity>
        {interestMsg && <Text style={styles.statusMessage}>{interestMsg}</Text>}
      </View>

      {/* --- Automation Rules (Auto-Approval) Section --- */}
      <ParentAutomationRulesSection themeColors={themeColors} />

      {/* --- Family Caregiver Management Section --- */}
      {(Platform.OS === 'web' || Platform.OS === 'android') && (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>👨‍👩‍👧‍👦 Family Caregiver Management</Text>
        <Text style={{ ...SEMANTIC_TYPOGRAPHY["type-body-small"], color: "#666", marginBottom: MOBILE_LAYOUT.sectionSpacing, lineHeight: 20 }}>
          Reward your child for saving! Set up an automatic interest/bonus system to help their savings jar grow over time.
        </Text>

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: '#2196F3' }]}
          onPress={async () => {
            console.log('[SETTINGS] Generate Family Code button pressed');
            try {
              console.log('[SETTINGS] Getting auth token...');
              const token = await getAuthToken();
              console.log('[SETTINGS] Token retrieved:', token ? 'YES' : 'NO');
              if (!token) {
                showMessage('Not authenticated. Please login again.', 'error');
                return;
              }

              console.log('[SETTINGS] Making API call to generate family code...');
              const response = await fetch(`${API_URL}/auth/family-code`, {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${token}`,
                },
              });

              console.log('[SETTINGS] API response status:', response.status);
              console.log('[SETTINGS] API response headers:', Object.fromEntries(response.headers.entries()));

              if (response.ok) {
                const data = await response.json();
                console.log('[SETTINGS] Family code data:', data);
                showMessage(`Family Code Generated: ${data.familyCode}\n\nShare this code with additional caregivers to join your family.`, 'success');
              } else {
                let errorMessage = 'Failed to generate family code.';
                try {
                  const errorData = await response.json();
                  errorMessage = errorData.message || errorMessage;
                  console.log('[SETTINGS] Error response:', errorData);
                } catch (parseError) {
                  console.log('[SETTINGS] Could not parse error response:', parseError);
                }
                showMessage(errorMessage, 'error');
              }
            } catch (error) {
              console.error('[SETTINGS] Error generating family code:', error);
              const errorMessage = error instanceof Error ? error.message : 'Unknown error';
              showMessage(`Network error: ${errorMessage}. Please try again.`, 'error');
            }
          }}
        >
          <Text style={styles.saveButtonText}>🔗 Generate Family Code</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: '#FF6B35', marginTop: 12 }]}
          onPress={() => {
            fetchCaregiversForManagement();
            setCaregiverModalVisible(true);
          }}
        >
          <Text style={[styles.saveButtonText, { color: themeColors.background }]}>👨‍👩‍👧‍👦 Manage Caregiver Relationships</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: '#4CAF50', marginTop: 12 }]}
          onPress={async () => {
            console.log('[SETTINGS] View Family Caregivers button pressed');
            try {
              console.log('[SETTINGS] Getting auth token for caregivers...');
              const token = await getAuthToken();
              console.log('[SETTINGS] Token retrieved:', token ? 'YES' : 'NO');

              const { getUser } = await import('@/utils/secureStorage');
              console.log('[SETTINGS] Getting current user...');
              const currentUser = await getUser();
              console.log('[SETTINGS] Current user:', currentUser ? { id: currentUser.id, familyId: currentUser.familyId } : 'NULL');

              if (!token || !currentUser) {
                showMessage('Not authenticated. Please login again.', 'error');
                return;
              }

              const apiUrl = `${API_URL}/users?familyId=${currentUser.familyId}&role=parent`;
              console.log('[SETTINGS] Making API call to:', apiUrl);

              const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${token}`,
                },
              });

              console.log('[SETTINGS] Caregivers API response status:', response.status);
              console.log('[SETTINGS] Caregivers API response headers:', Object.fromEntries(response.headers.entries()));

              if (response.ok) {
                const caregivers = await response.json();
                console.log('[SETTINGS] Caregivers data:', caregivers);

                const caregiverNames = caregivers.map((c: any) => c.name).join(', ');
                console.log('[SETTINGS] Caregiver names:', caregiverNames);

                showMessage(`Current caregivers in your family: ${caregiverNames}`, 'success');
              } else {
                let errorMessage = 'Failed to load caregiver information.';
                try {
                  const errorData = await response.json();
                  errorMessage = errorData.message || errorMessage;
                  console.log('[SETTINGS] Caregivers error response:', errorData);
                } catch (parseError) {
                  console.log('[SETTINGS] Could not parse caregivers error response:', parseError);
                }
                showMessage(errorMessage, 'error');
              }
            } catch (error) {
              console.error('[SETTINGS] Error loading caregivers:', error);
              const errorMessage = error instanceof Error ? error.message : 'Unknown error';
              showMessage(`Network error: ${errorMessage}. Please try again.`, 'error');
            }
          }}
        >
          <Text style={styles.saveButtonText}>👥 View Family Caregivers</Text>
        </TouchableOpacity>

        <Text style={{ ...SEMANTIC_TYPOGRAPHY["type-caption"], color: "#888", marginTop: MOBILE_LAYOUT.sectionSpacing, lineHeight: 18 }}>
          🔐 <Text style={{ fontWeight: 'bold' }}>Security:</Text> Family codes are unique and secure. Each caregiver gets full access to approve children's requests.{'\n'}
          👨‍👩‍👧‍👦 <Text style={{ fontWeight: 'bold' }}>Permissions:</Text> All caregivers can create/manage children, approve requests, and view family data.
        </Text>
      </View>
      )}

      {/* --- Child Account Management Section --- */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>👨‍👩‍👧 Child Account Management</Text>
        <Text style={{ ...SEMANTIC_TYPOGRAPHY["type-body-small"], color: "#666", marginBottom: MOBILE_LAYOUT.sectionSpacing, lineHeight: 20 }}>
          Manage your child's account settings and security. As the parent and gatekeeper, you have full control over account recovery.
        </Text>

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: '#FF6B35' }]}
          onPress={openChildPinResetModal}
        >
          <Text style={styles.saveButtonText}>Reset Child PIN</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: '#4CAF50', marginTop: 12 }]}
          onPress={async () => {
            try {
              const token = await getAuthToken();
              if (!token) {
                showMessage('Not authenticated. Please login again.', 'error');
                return;
              }

              const response = await fetch(`${API_URL}/fix-parent-child-relationships`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                },
              });

              const data = await response.json();

              if (response.ok) {
              showMessage(`Parent-child relationships fixed! Updated ${data.updatedChildren} children.`, 'success');
              } else {
                showMessage(data.message || 'Failed to fix relationships.', 'error');
              }
            } catch (error) {
              console.error('Error fixing relationships:', error);
              showMessage('Network error. Please try again.', 'error');
            }
          }}
        >
          <Text style={styles.saveButtonText}>🔧 Fix Parent-Child Relationships</Text>
        </TouchableOpacity>

        <Text style={{ ...SEMANTIC_TYPOGRAPHY["type-caption"], color: "#888", marginTop: MOBILE_LAYOUT.itemSpacing, lineHeight: 18 }}>
          🔐 <Text style={{ fontWeight: 'bold' }}>Security Feature:</Text> Requires your parent password for verification before any child account changes.{'\n'}
          🔧 <Text style={{ fontWeight: 'bold' }}>Fix Relationships:</Text> Updates all children in your family to have the correct parent linkage.
        </Text>
      </View>

      {/* --- Account Deactivation Section --- */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>🚫 Account Deactivation</Text>
        <Text style={{ fontSize: 14, color: "#666", marginBottom: 18, lineHeight: 20 }}>
          Temporarily pause your family account without losing any data. All points, chores, goals, and history will be saved and restored upon reactivation.
        </Text>

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: '#d32f2f', borderWidth: 2, borderColor: '#b71c1c' }]}
          onPress={() => setDeactivationModalVisible(true)}
        >
          <Text style={styles.saveButtonText}>Temporarily Deactivate Family Account</Text>
        </TouchableOpacity>

        <Text style={{ fontSize: 13, color: "#888", marginTop: 12, lineHeight: 18 }}>
          ⚠️ <Text style={{ fontWeight: 'bold' }}>Important:</Text> This will block all family logins. Contact support to reactivate your account.
        </Text>
      </View>

      {/* --- Account Deletion Section --- */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>💀 Permanent Account Deletion</Text>
        <Text style={{ fontSize: 14, color: "#666", marginBottom: 18, lineHeight: 20 }}>
          Permanently delete your family account and all associated data. This action cannot be undone and will result in complete data loss.
        </Text>

        <TouchableOpacity
          style={[styles.saveButton, {
            backgroundColor: '#8B0000',
            borderWidth: 3,
            borderColor: '#660000'
          }]}
          onPress={() => {
            setDeletionStep(1);
            setDeletionModalVisible(true);
          }}
        >
          <Text style={styles.saveButtonText}>🗑️ Permanently Delete Family Account</Text>
        </TouchableOpacity>

        <Text style={{ fontSize: 13, color: "#888", marginTop: 12, lineHeight: 18 }}>
          🚨 <Text style={{ fontWeight: 'bold', color: '#d32f2f' }}>WARNING:</Text> This will permanently delete all family data including points, transactions, goals, and achievements. This action cannot be reversed.
        </Text>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>ℹ️ How It Works</Text>
        <Text style={{ fontSize: 14, color: themeColors.text, lineHeight: 22 }}>
          • <Text style={{ fontWeight: "bold", color: themeColors.primary }}>Points</Text>: Abstract earning system - great for teaching basic concepts
          {'\n'}
          • <Text style={{ fontWeight: "bold", color: themeColors.primary }}>Indian Rupees</Text>: Real money display with ₹ symbol and customizable conversion rates
          {'\n'}
          • <Text style={{ fontWeight: "bold", color: themeColors.primary }}>Denominations</Text>: Shows breakdown into actual ₹500, ₹200, ₹100 notes and coins
          {'\n'}
          • <Text style={{ fontWeight: "bold", color: themeColors.primary }}>Auto-Approval</Text>: Parents can set point thresholds for automatic chore/reward approvals
          {'\n'}
          • <Text style={{ fontWeight: "bold", color: themeColors.primary }}>Savings Interest</Text>: Automatic bonus system to reward consistent saving
          {'\n'}
          • <Text style={{ fontWeight: "bold", color: themeColors.text }}>Changes apply to all family members immediately</Text>
        </Text>
      </View>

      {/* Help Modal */}
      <HelpModal
        visible={helpModalVisible}
        onClose={() => setHelpModalVisible(false)}
        title="⚙️ Family Settings - Help"
        tabs={[
          {
            title: "Understanding Family Settings",
            content: [
              {
                type: "text",
                text: "Family Settings are your control center for customizing how money appears and works throughout the entire app. Every setting you change here applies to both you and your child automatically.",
                icon: "⚙️"
              },
              {
                type: "bullet",
                text: "Settings apply to all family members instantly"
              },
              {
                type: "bullet",
                text: "Changes are saved permanently and remembered"
              },
              {
                type: "bullet",
                text: "You can switch between different money display systems"
              },
              {
                type: "bullet",
                text: "Advanced features like automation and interest are also controlled here"
              },
              {
                type: "highlight",
                text: "Settings help you customize the learning experience for your family!",
                icon: "👨‍👩‍👧‍👦"
              }
            ]
          },
          {
            title: "Money Display Formats",
            content: [
              {
                type: "text",
                text: "Choose how money appears throughout the app - each format teaches different financial concepts:",
                icon: "💰"
              },
              {
                type: "bullet",
                text: "🎯 Points - Abstract earning system perfect for teaching basic concepts"
              },
              {
                type: "bullet",
                text: "🇮🇳 Indian Rupees - Real money display with ₹ symbol and authentic Indian currency"
              },
              {
                type: "bullet",
                text: "📊 Both formats work together to bridge learning and real-world application"
              },
              {
                type: "highlight",
                text: "Points teach concepts, rupees connect to real-world shopping and saving!",
                icon: "🧠"
              }
            ]
          },
          {
            title: "Setting Conversion Rates",
            content: [
              {
                type: "text",
                text: "When using Indian Rupees, define the exchange rate between points and rupees:",
                icon: "🔄"
              },
              {
                type: "bullet",
                text: "Example: 1 point = ₹5 means 10 points = ₹50, 50 points = ₹250"
              },
              {
                type: "bullet",
                text: "Choose rates that match your child's age and spending habits"
              },
              {
                type: "bullet",
                text: "Helps children understand the real-world value of their earnings"
              },
              {
                type: "bullet",
                text: "Start with small conversions (₹1-5) for younger children"
              },
              {
                type: "highlight",
                text: "Conversion rates help children connect app earnings to real purchases!",
                icon: "�"
              }
            ]
          },
          {
            title: "Rupee Denominations Feature",
            content: [
              {
                type: "text",
                text: "Show how amounts break down into actual Indian rupee notes and coins:",
                icon: "💵"
              },
              {
                type: "bullet",
                text: "₹500 notes, ₹200 notes, ₹100 notes, ₹50 notes, ₹20 notes"
              },
              {
                type: "bullet",
                text: "₹10 coins, ₹5 coins, ₹2 coins, ₹1 coins"
              },
              {
                type: "bullet",
                text: "Helps children visualize and understand real Indian currency"
              },
              {
                type: "bullet",
                text: "Teaches practical skills like making change and bill recognition"
              },
              {
                type: "highlight",
                text: "Transforms abstract numbers into tangible money children can understand!",
                icon: "👆"
              }
            ]
          },
          {
            title: "Point Distribution Automation",
            content: [
              {
                type: "text",
                text: "Automatically distribute chore points across your child's money pots:",
                icon: "🤖"
              },
              {
                type: "bullet",
                text: "Set default percentages for Pocket Money, Savings, Spending, Help Others, and Grow Money pots"
              },
              {
                type: "bullet",
                text: "Total must always equal exactly 100%"
              },
              {
                type: "bullet",
                text: "Can be overridden per chore for special teaching moments"
              },
              {
                type: "highlight",
                text: "Automation saves time while teaching consistent money allocation habits!",
                icon: "⚡"
              }
            ]
          },
          {
            title: "Savings Interest System",
            content: [
              {
                type: "text",
                text: "Reward your child for saving with automatic interest/bonus system:",
                icon: "🏦"
              },
              {
                type: "bullet",
                text: "Set interest rate (0.1% to 10%) to add to savings jar"
              },
              {
                type: "bullet",
                text: "Choose frequency: Weekly or Monthly compounding"
              },
              {
                type: "bullet",
                text: "Only applies to the Savings jar for focused learning"
              },
              {
                type: "bullet",
                text: "Teaches the power of compound interest and delayed gratification"
              },
              {
                type: "highlight",
                text: "Interest rewards consistent savers and teaches long-term financial planning!",
                icon: "📈"
              }
            ]
          },
          {
            title: "Auto-Approval Rules",
            content: [
              {
                type: "text",
                text: "Set automatic approval thresholds to streamline common requests:",
                icon: "✅"
              },
              {
                type: "bullet",
                text: "Chore Claims - Auto-approve chore completions below point threshold"
              },
              {
                type: "bullet",
                text: "Reward Claims - Auto-approve reward redemptions below point threshold"
              },
              {
                type: "bullet",
                text: "Point Moves - Auto-approve jar transfers below point threshold"
              },
              {
                type: "bullet",
                text: "Reduces your daily approval workload for small transactions"
              },
              {
                type: "highlight",
                text: "Automation saves time while maintaining your oversight on important decisions!",
                icon: "⏰"
              }
            ]
          },
          {
            title: "Progressive Money Teaching",
            content: [
              {
                type: "text",
                text: "Use settings strategically to build financial literacy over time:",
                icon: "📚"
              },
              {
                type: "bullet",
                text: "Phase 1: Start with Points only (focus on earning/saving concepts)"
              },
              {
                type: "bullet",
                text: "Phase 2: Add Rupees (connect to real-world shopping)"
              },
              {
                type: "bullet",
                text: "Phase 3: Enable Denominations (teach bill recognition)"
              },
              {
                type: "bullet",
                text: "Phase 4: Add Automation (build independent money habits)"
              },
              {
                type: "highlight",
                text: "Gradually increase complexity as your child masters each financial concept!",
                icon: "🌱"
              }
            ]
          },
          {
            title: "Child Account Security",
            content: [
              {
                type: "text",
                text: "Manage your child's account access and security settings:",
                icon: "🔐"
              },
              {
                type: "bullet",
                text: "PIN Reset - Change your child's login PIN if forgotten"
              },
              {
                type: "bullet",
                text: "Requires parent password for security"
              },
              {
                type: "bullet",
                text: "Account Deactivation - Temporarily pause family access"
              },
              {
                type: "bullet",
                text: "Account Deletion - Permanently remove all family data"
              },
              {
                type: "highlight",
                text: "Security features protect your family's financial learning journey!",
                icon: "🛡️"
              }
            ]
          }
        ]}
      />

      {/* Child PIN Reset Modal */}
      <Modal
        visible={childManagementModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setChildManagementModalVisible(false)}
      >
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0,0,0,0.5)'
        }}>
          <View style={{
            backgroundColor: themeColors.card,
            borderRadius: 14,
            padding: 20,
            width: '90%',
            maxWidth: 400,
            maxHeight: '80%',
            position: 'relative'
          }}>
            {/* Close Button */}
            <TouchableOpacity
              onPress={() => setChildManagementModalVisible(false)}
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                zIndex: 10,
                backgroundColor: themeColors.background,
                borderRadius: 18,
                paddingHorizontal: 8,
                paddingVertical: 3,
                elevation: 2,
                borderWidth: 1,
                borderColor: themeColors.border,
              }}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Text style={{ fontSize: 20, color: themeColors.text }}>×</Text>
            </TouchableOpacity>

            <Text style={[styles.sectionTitle, { marginBottom: 16, color: themeColors.text }]}>🔑 Reset Child PIN</Text>

            {loadingChildren ? (
              <Text style={{ textAlign: 'center', marginVertical: 20, color: themeColors.text }}>Loading children...</Text>
            ) : children.length === 0 ? (
              <Text style={{ textAlign: 'center', marginVertical: 20, color: themeColors.text }}>No children found.</Text>
            ) : (
              <>
                <Text style={[styles.inputLabel, { color: themeColors.text }]}>Select Child:</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={selectedChild?._id || ''}
                    onValueChange={(value) => {
                      const child = children.find(c => c._id === value);
                      setSelectedChild(child);
                    }}
                    style={{ height: 50 }}
                  >
                    <Picker.Item label="Choose a child..." value="" />
                    {children.map(child => (
                      <Picker.Item key={child._id} label={child.name} value={child._id} />
                    ))}
                  </Picker>
                </View>

                {selectedChild && (
                  <>
                    <Text style={styles.inputLabel}>Parent Password:</Text>
                    <TextInput
                      value={parentPassword}
                      onChangeText={setParentPassword}
                      secureTextEntry
                      placeholder="Enter your password"
                      style={styles.inputWithPlaceholder}
                      placeholderTextColor={themeColors.textSecondary}
                    />

                    <Text style={styles.inputLabel}>New PIN (4-6 digits):</Text>
                    <TextInput
                      value={newChildPin}
                      onChangeText={setNewChildPin}
                      keyboardType="numeric"
                      secureTextEntry
                      placeholder="Enter new PIN"
                      style={styles.input}
                    />

                    <Text style={styles.inputLabel}>Confirm PIN:</Text>
                    <TextInput
                      value={confirmChildPin}
                      onChangeText={setConfirmChildPin}
                      keyboardType="numeric"
                      secureTextEntry
                      placeholder="Confirm new PIN"
                      style={styles.input}
                    />

                    {childManagementMessage ? (
                      <Text style={[styles.statusMessage, {
                        color: childManagementMessage.includes('successfully') ? '#18722a' : '#d32f2f',
                        marginBottom: 16
                      }]}>
                        {childManagementMessage}
                      </Text>
                    ) : null}

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <TouchableOpacity
                        style={[styles.saveButton, { backgroundColor: '#666', flex: 1, marginRight: 8 }]}
                        onPress={() => setChildManagementModalVisible(false)}
                      >
                        <Text style={styles.saveButtonText}>Cancel</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.saveButton, { flex: 2 }, resettingPin && { opacity: 0.6 }]}
                        onPress={handleResetChildPin}
                        disabled={resettingPin}
                      >
                        <Text style={styles.saveButtonText}>
                          {resettingPin ? 'Resetting...' : 'Reset PIN'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Account Deactivation Modal */}
      <Modal
        visible={deactivationModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDeactivationModalVisible(false)}
      >
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0,0,0,0.5)'
        }}>
          <View style={{
            backgroundColor: themeColors.card,
            borderRadius: 14,
            padding: 20,
            width: '90%',
            maxWidth: 400,
            maxHeight: '80%'
          }}>
            <Text style={[styles.sectionTitle, { marginBottom: 16, color: themeColors.error }]}>🚫 Deactivate Family Account</Text>

            <Text style={{ fontSize: 16, color: themeColors.text, marginBottom: 16, lineHeight: 22 }}>
              Are you sure you want to temporarily deactivate your family account?
            </Text>

            <Text style={{ fontSize: 14, color: themeColors.textSecondary, marginBottom: 20, lineHeight: 20 }}>
              • All family logins (Parent and Child) will be blocked{'\n'}
              • All data (points, chores, goals, history) will be saved{'\n'}
              • Contact support to reactivate your account
            </Text>

            <Text style={styles.inputLabel}>Enter Parent Password to Confirm:</Text>
            <TextInput
              value={deactivationPassword}
              onChangeText={setDeactivationPassword}
              secureTextEntry
              placeholder="Enter your password"
              style={styles.inputWithPlaceholder}
              placeholderTextColor={themeColors.textSecondary}
            />

            {deactivationMessage ? (
              <Text style={[styles.statusMessage, {
                color: deactivationMessage.includes('successfully') ? '#18722a' : '#d32f2f',
                marginBottom: 16
              }]}>
                {deactivationMessage}
              </Text>
            ) : null}

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: '#666', flex: 1, marginRight: 8 }]}
                onPress={() => {
                  setDeactivationModalVisible(false);
                  setDeactivationPassword('');
                  setDeactivationMessage('');
                }}
              >
                <Text style={styles.saveButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: '#d32f2f', flex: 2 }, deactivatingAccount && { opacity: 0.6 }]}
                onPress={handleDeactivateAccount}
                disabled={deactivatingAccount}
              >
                <Text style={styles.saveButtonText}>
                  {deactivatingAccount ? 'Deactivating...' : 'Deactivate Account'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Account Deletion Modal - 3-Step Process */}
      <Modal
        visible={deletionModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          if (deletionStep === 1) {
            setDeletionModalVisible(false);
            setDeletionStep(1);
            setDeletionConfirmationText('');
            setDeletionPassword('');
            setDeletionMessage('');
          }
        }}
      >
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0,0,0,0.7)'
        }}>
          <View style={{
            backgroundColor: themeColors.card,
            borderRadius: 14,
            padding: 24,
            width: '90%',
            maxWidth: 420,
            maxHeight: '85%'
          }}>
            {/* Step Indicator */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 20 }}>
              {[1, 2, 3].map(step => (
                  <View
                    key={step}
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 15,
                      backgroundColor: deletionStep >= step ? themeColors.error : themeColors.border,
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginHorizontal: 5
                    }}
                  >
                    <Text style={{ color: deletionStep >= step ? themeColors.card : themeColors.textSecondary, fontWeight: 'bold' }}>
                      {step}
                    </Text>
                  </View>
              ))}
            </View>

            {/* Step 1: Warning */}
            {deletionStep === 1 && (
              <>
                <Text style={[styles.sectionTitle, { marginBottom: 16, color: themeColors.error, textAlign: 'center' }]}>
                  💀 Permanent Account Deletion
                </Text>

                <Text style={{ fontSize: 16, color: themeColors.text, marginBottom: 20, lineHeight: 24, textAlign: 'center' }}>
                  This action will <Text style={{ fontWeight: 'bold', color: themeColors.error }}>permanently and irreversibly</Text> delete your family account and all associated data.
                </Text>

                <Text style={{ fontSize: 14, color: themeColors.error, marginBottom: 20, lineHeight: 22, backgroundColor: themeColors.surface, padding: 12, borderRadius: 8 }}>
                  🚨 <Text style={{ fontWeight: 'bold' }}>Irreversible Data Loss:</Text>{'\n'}
                  • All points, savings, and transaction history{'\n'}
                  • All chores, goals, and achievements{'\n'}
                  • All rewards and family progress{'\n'}
                  • All user profiles (parent and children){'\n'}
                  • All personal information and settings
                </Text>

                <Text style={{ fontSize: 14, color: themeColors.textSecondary, marginBottom: 24, lineHeight: 20 }}>
                  This deletion complies with data protection regulations and ensures complete removal of all personal information from our systems.
                </Text>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <TouchableOpacity
                    style={[styles.saveButton, { backgroundColor: '#666', flex: 1, marginRight: 8 }]}
                    onPress={() => {
                      setDeletionModalVisible(false);
                      setDeletionStep(1);
                      setDeletionConfirmationText('');
                      setDeletionPassword('');
                      setDeletionMessage('');
                    }}
                  >
                    <Text style={styles.saveButtonText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.saveButton, { backgroundColor: '#8B0000', flex: 2 }]}
                    onPress={() => setDeletionStep(2)}
                  >
                    <Text style={styles.saveButtonText}>Continue to Next Step</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* Step 2: Manual Confirmation */}
            {deletionStep === 2 && (
              <>
                <Text style={[styles.sectionTitle, { marginBottom: 16, color: themeColors.error, textAlign: 'center' }]}>
                  ✍️ Manual Confirmation Required
                </Text>

                <Text style={{ fontSize: 16, color: themeColors.text, marginBottom: 20, lineHeight: 24, textAlign: 'center' }}>
                  To prevent accidental deletions, you must manually confirm by typing the word below.
                </Text>

                <View style={{ backgroundColor: themeColors.surface, padding: 16, borderRadius: 8, marginBottom: 20, alignItems: 'center' }}>
                  <Text style={{ fontSize: 24, fontWeight: 'bold', color: themeColors.error, letterSpacing: 2 }}>
                    DELETE
                  </Text>
                </View>

                <Text style={styles.inputLabel}>Type "DELETE" to confirm:</Text>
                <TextInput
                  value={deletionConfirmationText}
                  onChangeText={setDeletionConfirmationText}
                  placeholder="Type DELETE here"
                  style={[styles.inputWithPlaceholder, {
                    borderColor: deletionConfirmationText === 'DELETE' ? '#4CAF50' : '#aaa',
                    borderWidth: 2
                  }]}
                  placeholderTextColor={themeColors.textSecondary}
                  autoCapitalize="characters"
                  autoCorrect={false}
                />

                {deletionMessage ? (
                  <Text style={[styles.statusMessage, {
                    color: deletionMessage.includes('correctly') ? '#18722a' : '#d32f2f',
                    marginBottom: 16
                  }]}>
                    {deletionMessage}
                  </Text>
                ) : null}

                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <TouchableOpacity
                    style={[styles.saveButton, { backgroundColor: '#666', flex: 1, marginRight: 8 }]}
                    onPress={() => {
                      setDeletionStep(1);
                      setDeletionConfirmationText('');
                      setDeletionMessage('');
                    }}
                  >
                    <Text style={styles.saveButtonText}>Back</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.saveButton, {
                      backgroundColor: deletionConfirmationText === 'DELETE' ? '#8B0000' : '#ccc',
                      flex: 2
                    }]}
                    onPress={() => {
                      if (deletionConfirmationText === 'DELETE') {
                        setDeletionStep(3);
                        setDeletionMessage('');
                      } else {
                        setDeletionMessage('Please type "DELETE" correctly to proceed.');
                      }
                    }}
                    disabled={deletionConfirmationText !== 'DELETE'}
                  >
                    <Text style={styles.saveButtonText}>Continue to Final Step</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* Step 3: MFA with Password */}
            {deletionStep === 3 && (
              <>
                <Text style={[styles.sectionTitle, { marginBottom: 16, color: themeColors.error, textAlign: 'center' }]}>
                  🔐 Final Authorization Required
                </Text>

                <Text style={{ fontSize: 16, color: themeColors.text, marginBottom: 20, lineHeight: 24, textAlign: 'center' }}>
                  This is your final opportunity to cancel. Enter your parent password to permanently delete the account.
                </Text>

                <Text style={{ fontSize: 14, color: themeColors.error, marginBottom: 20, lineHeight: 22, backgroundColor: themeColors.surface, padding: 12, borderRadius: 8 }}>
                  ⚠️ <Text style={{ fontWeight: 'bold' }}>Final Warning:</Text> After clicking "Delete Account", all data will be permanently removed and cannot be recovered.
                </Text>

                <Text style={styles.inputLabel}>Enter Parent Password:</Text>
                <TextInput
                  value={deletionPassword}
                  onChangeText={setDeletionPassword}
                  secureTextEntry
                  placeholder="Enter your password"
                  style={styles.inputWithPlaceholder}
                  placeholderTextColor={themeColors.textSecondary}
                />

                {deletionMessage ? (
                  <Text style={[styles.statusMessage, {
                    color: deletionMessage.includes('successfully') ? '#18722a' : '#d32f2f',
                    marginBottom: 16
                  }]}>
                    {deletionMessage}
                  </Text>
                ) : null}

                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <TouchableOpacity
                    style={[styles.saveButton, { backgroundColor: '#666', flex: 1, marginRight: 8 }]}
                    onPress={() => {
                      setDeletionStep(2);
                      setDeletionPassword('');
                      setDeletionMessage('');
                    }}
                  >
                    <Text style={styles.saveButtonText}>Back</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.saveButton, { backgroundColor: '#8B0000', flex: 2 }, deletingAccount && { opacity: 0.6 }]}
                    onPress={handleDeleteAccount}
                    disabled={deletingAccount || !deletionPassword.trim()}
                  >
                    <Text style={styles.saveButtonText}>
                      {deletingAccount ? 'Deleting...' : '🗑️ Delete Account'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Caregiver Relationship Management Modal */}
      <Modal
        visible={caregiverModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCaregiverModalVisible(false)}
      >
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0,0,0,0.5)'
        }}>
          <View style={{
            backgroundColor: themeColors.card,
            borderRadius: 14,
            padding: 20,
            width: '90%',
            maxWidth: 400,
            maxHeight: '80%',
            position: "relative"
          }}>
            {/* Close Button */}
            <TouchableOpacity
              onPress={() => {
                setCaregiverModalVisible(false);
                setSelectedCaregiver(null);
                setSelectedRelationship('');
                setCaregiverMessage('');
              }}
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                zIndex: 10,
                backgroundColor: themeColors.background,
                borderRadius: 18,
                paddingHorizontal: 8,
                paddingVertical: 3,
                elevation: 2,
                borderWidth: 1,
                borderColor: themeColors.border,
              }}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Text style={{ fontSize: 20, color: themeColors.text }}>×</Text>
            </TouchableOpacity>

            <Text style={[styles.sectionTitle, { marginBottom: 16, color: themeColors.text }]}>👨‍👩‍👧‍👦 Manage Caregiver Relationships</Text>

            <Text style={[styles.inputLabel, { color: themeColors.text }]}>Select Caregiver:</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedCaregiver?._id || ''}
                onValueChange={(value) => {
                  const caregiver = caregivers.find(c => c._id === value);
                  setSelectedCaregiver(caregiver);
                  // Pre-populate relationship if it exists
                  setSelectedRelationship(caregiver?.relationship || '');
                }}
                style={{ height: 50 }}
              >
                <Picker.Item label="Choose a caregiver..." value="" />
                {caregivers.map((caregiver: any) => (
                  <Picker.Item
                    key={caregiver._id}
                    label={`${caregiver.name} (${caregiver.relationship || 'No relationship set'})`}
                    value={caregiver._id}
                  />
                ))}
              </Picker>
            </View>

            {selectedCaregiver && (
              <>
                <Text style={styles.inputLabel}>Relationship to Child:</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={selectedRelationship}
                    onValueChange={setSelectedRelationship}
                    style={{ height: 50 }}
                  >
                    <Picker.Item label="Select relationship..." value="" />
                    <Picker.Item label="Mother" value="mother" />
                    <Picker.Item label="Father" value="father" />
                    <Picker.Item label="Grandmother" value="grandmother" />
                    <Picker.Item label="Grandfather" value="grandfather" />
                    <Picker.Item label="Step-Mother" value="step-mother" />
                    <Picker.Item label="Step-Father" value="step-father" />
                    <Picker.Item label="Guardian" value="guardian" />
                    <Picker.Item label="Other" value="other" />
                  </Picker>
                </View>

                <Text style={{ fontSize: 13, color: themeColors.textSecondary, marginBottom: 16, lineHeight: 18 }}>
                  Setting the relationship helps kids understand who their caregivers are. For example, "mother" will show as "Mom" on the child's dashboard.
                </Text>

                {caregiverMessage ? (
                  <Text style={[styles.statusMessage, {
                    color: caregiverMessage.includes('successfully') ? '#18722a' : '#d32f2f',
                    marginBottom: 16
                  }]}>
                    {caregiverMessage}
                  </Text>
                ) : null}

                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <TouchableOpacity
                    style={[styles.saveButton, { backgroundColor: '#666', flex: 1, marginRight: 8 }]}
                    onPress={() => {
                      setCaregiverModalVisible(false);
                      setSelectedCaregiver(null);
                      setSelectedRelationship('');
                      setCaregiverMessage('');
                    }}
                  >
                    <Text style={styles.saveButtonText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.saveButton, { flex: 2 }, updatingRelationship && { opacity: 0.6 }]}
                    onPress={handleUpdateCaregiverRelationship}
                    disabled={updatingRelationship || !selectedRelationship.trim()}
                  >
                    <Text style={styles.saveButtonText}>
                      {updatingRelationship ? 'Updating...' : 'Update Relationship'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {!selectedCaregiver && (
              <Text style={{ textAlign: 'center', color: themeColors.text, marginTop: 20 }}>
                Select a caregiver to set their relationship to the child.
              </Text>
            )}
          </View>
        </View>
      </Modal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
