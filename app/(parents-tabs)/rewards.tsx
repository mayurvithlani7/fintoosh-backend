import BackButton from '@/components/BackButton';
import HelpModal from '@/components/HelpModal';
import { rewardSuggestions } from '@/constants/rewardSuggestions';
import { API_URL } from '@/utils/config';
import { useGlobalFeedback } from '@/utils/globalFeedbackContext';
import { getAuthToken } from '@/utils/secureStorage';
import { useTheme } from '@/utils/themeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
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
  const { showError, showFeedback } = useGlobalFeedback();
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
  const scrollViewRef = React.useRef<ScrollView>(null);

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
      const storedUser = await AsyncStorage.getItem('user');
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
      await loadChildren();
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
        const selectedChild = children.find(child => child._id === selectedChildId);
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
      const storedUser = await AsyncStorage.getItem('user');

      if (!token || !storedUser) {
        showError('Not authenticated.');
        setLoading(false);
        return;
      }
      const parentProfile = JSON.parse(storedUser);
      const familyId = parentProfile.familyId;
      if (!familyId) {
        showError('No familyId found for parent.');
        setLoading(false);
        return;
      }
      const data = await fetchFamilyChildren(familyId, token);
      setChildren(data);
      if (data.length > 0) {
        setSelectedChildId(data[0]._id ?? "");
      }
    } catch (err) {
      showError('Failed to load children for family.');
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
      const data: Reward[] = await fetchRewards(childId, token as any);
      // Security: Validate rewards belong to this family
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        const parentProfile = JSON.parse(storedUser);
        const allowedChildIds = children.map(c => c.id);
        if (
          data &&
          data.length > 0 &&
          data.some(
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
      setRewards(data);
    } catch (err: any) {
      showError('Failed to load rewards.');
      setRewards([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddReward() {
    if (!rewardName.trim() || !pointsCost.trim() || isNaN(Number(pointsCost)) || Number(pointsCost) <= 0) {
      showError('Please fill out all fields and enter a valid points cost (>0).');
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
            'Authorization': `Bearer ${token}`,
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
            'Authorization': `Bearer ${token}`,
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

      showFeedback(editingReward ? 'Reward updated successfully!' : 'Reward added for your child.');

      setRewardName('');
      setPointsCost('');
      setDescription('');
      setEditingReward(null);
      // Find selected child for correct id on fetchRewards
      const selectedChild = children.find(child => child._id === selectedChildId);
      if (selectedChild) {
        await loadRewards(selectedChild.id);
      }
    } catch (err: any) {
      showError(err.message || (editingReward ? 'Failed to update reward.' : 'Failed to add reward.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView ref={scrollViewRef} style={styles.scroll} contentContainerStyle={styles.container}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: 520, marginBottom: 22, marginTop: 6 }}>
        <BackButton label="Back to Home" to="/(parents-tabs)" />
        <TouchableOpacity
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
          <Text style={{ color: cardColor, fontWeight: 'bold', fontSize: 14 }}>❓ Help</Text>
        </TouchableOpacity>
      </View>
      <Text style={[styles.title, { color: themeColors.primary }]}>Manage Child Rewards</Text>

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
              {children.length === 1 ? (
                <Text style={{ color: themeColors.text, fontWeight: "600" }}>{children[0].name}</Text>
              ) : (
                <Text style={{ color: themeColors.textSecondary }}>No children found.</Text>
              )}
            </View>
          </View>
          <View style={{ marginBottom: 14 }}>
            <Text style={[styles.inputLabel, { color: themeColors.text }]}>Reward Name</Text>
            <TextInput
              style={[styles.input, { backgroundColor: themeColors.surface, color: themeColors.text, borderColor: themeColors.border }]}
              placeholder="e.g. New Book"
              placeholderTextColor={themeColors.textSecondary}
              value={rewardName}
              onChangeText={setRewardName}
            />
          </View>
          <View style={{ marginBottom: 12 }}>
            <Text style={[styles.inputLabel, { color: themeColors.text }]}>Points Cost</Text>
            <TextInput
              style={[styles.input, { backgroundColor: themeColors.surface, color: themeColors.text, borderColor: themeColors.border }]}
              placeholder="e.g. 100"
              placeholderTextColor={themeColors.textSecondary}
              keyboardType="numeric"
              value={pointsCost}
              onChangeText={setPointsCost}
            />
          </View>

          {/* Quick Preset Points */}
          <View style={styles.presetContainer}>
            <Text style={[styles.inputLabel, { fontSize: 14, marginBottom: 8 }]}>Quick Amounts:</Text>
            <View style={styles.presetRow}>
              <TouchableOpacity
                style={[styles.presetBtn, { backgroundColor: themeColors.secondary }]}
                onPress={() => setPointsCost('25')}
              >
                <Text style={styles.presetBtnText}>25</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.presetBtn, { backgroundColor: themeColors.secondary }]}
                onPress={() => setPointsCost('50')}
              >
                <Text style={styles.presetBtnText}>50</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.presetBtn, { backgroundColor: themeColors.secondary }]}
                onPress={() => setPointsCost('100')}
              >
                <Text style={styles.presetBtnText}>100</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.presetBtn, { backgroundColor: themeColors.secondary }]}
                onPress={() => setPointsCost('200')}
              >
                <Text style={styles.presetBtnText}>200</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Reward Name Suggestions */}
          <View style={styles.suggestionsContainer}>
            <Text style={[styles.inputLabel, { fontSize: 14, marginBottom: 8 }]}>Reward Ideas:</Text>
            <View style={styles.suggestionsGrid}>
              {rewardSuggestions.slice(0, 16).map((suggestion) => (
                <TouchableOpacity
                  key={suggestion}
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
            onPress={() => {
              const selectedChild = children.find(child => child._id === selectedChildId);
              if (selectedChild) {
                loadRewards(selectedChild.id);
              }
            }}
            disabled={loading}
          >
            <Text style={{ color: themeColors.card, fontWeight: 'bold', fontSize: 14 }}>
              {loading ? 'Refreshing...' : '🔄 Refresh'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Filter Tabs */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 10 }}>
          {['Available', 'Claimed'].map(tab => (
            <TouchableOpacity
              key={tab}
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
              <Text style={{ color: rewardsTab === tab ? themeColors.card : themeColors.primary, fontWeight: '500' }}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading && <ActivityIndicator size="small" color={themeColors.primary} />}
        {(() => {
          // DEBUG: Show status of all rewards at parent render time
          console.log('Rewards for rendering:', rewards.map(r => ({ id: r._id, name: r.name, status: r.status, purchased: r.purchased })));
          let filteredRewards: Reward[] = [];
          let showArchiveButton = false;
          if (rewardsTab === 'Available') {
            filteredRewards = rewards.filter(r => !r.purchased).sort((a, b) =>
              getRewardCreatedDate(b).getTime() - getRewardCreatedDate(a).getTime()
            );
          } else {
            // Claimed (purchased) rewards—recent by default
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
              {filteredRewards.map((r) => (
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
                    <Text style={{ fontWeight: 'bold', color: '#234' }}>{r.name}</Text>
                    <Text style={{ color: '#324', fontSize: 16 }}>({r.cost} pts)</Text>
                    {r.description && <Text style={{ fontSize: 13, color: '#567' }}>{r.description}</Text>}
                    {/* Status Display */}
                    {r.purchased ? (
                      <Text style={{ color: "#18722a", fontWeight: "bold", fontSize: 13 }}>Claimed</Text>
                    ) : r.status === 'pending' ? (
                      <Text style={{ color: "#a78912", fontWeight: "bold", fontSize: 13 }}>Pending Approval</Text>
                    ) : r.available === false ? (
                      <Text style={{ color: "#a78912", fontWeight: "bold", fontSize: 13 }}>Waiting for Approval</Text>
                    ) : (
                      <Text style={{ color: "#184e82", fontSize: 13 }}>Available</Text>
                    )}
                  </View>
                  {/* Parent controls: edit/delete for active, pending indicator, nothing for completed/approved */}
                  {r.status === 'active' && !r.purchased ? (
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
                          setEditingReward(r);
                          setRewardName(r.name);
                          setPointsCost(r.cost.toString());
                          setDescription(r.description || '');
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
                          console.log('[FRONTEND DELETE REWARD] Starting deletion for reward:', r._id, r.name);
                          showError('');
                          showFeedback('');
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

                            showFeedback('Reward deleted successfully.');
                            setTimeout(() => showFeedback(''), 3000);

                            const selectedChild = children.find(child => child._id === selectedChildId);
                            if (selectedChild) {
                              console.log('[FRONTEND DELETE REWARD] Reloading rewards for child:', selectedChild.id);
                              await loadRewards(selectedChild.id);
                            }
                          } catch (err: any) {
                            console.error('[FRONTEND DELETE REWARD] Error:', err);
                            showError(err.message || 'Failed to delete reward.');
                          }
                        }}
                      >
                        <Text style={{ color: themeColors.card, fontWeight: '600', fontSize: 12 }}>🗑️ Delete</Text>
                      </TouchableOpacity>
                    </View>
                  ) : r.status === 'pending' ? (
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
              {/* Archive toggle for claimed rewards */}
              {rewardsTab === 'Claimed' && showArchiveButton && !showAllClaimed && (
                <TouchableOpacity
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
                  <Text style={{ color: '#5837a7', fontWeight: '600' }}>Show All Claimed Rewards</Text>
                </TouchableOpacity>
              )}
              {rewardsTab === 'Claimed' && showAllClaimed && (
                <TouchableOpacity
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
                  <Text style={{ color: '#5837a7', fontWeight: '500' }}>Show Only Last 90 Days</Text>
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
  childPickerRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 6 },
  childBtn: { paddingHorizontal: 14, paddingVertical: 7, backgroundColor: themeColors.surface, borderRadius: 15, marginHorizontal: 3, marginBottom: 4 },
  childBtnSelected: { backgroundColor: themeColors.primary },
  childBtnText: { fontSize: 15, color: themeColors.text, fontWeight: '600' },
  childBtnTextSelected: { color: themeColors.card, fontWeight: '800' },
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
  presetContainer: { marginTop: 16, marginBottom: 8 },
  presetRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  presetBtn: { flex: 1, paddingVertical: 10, paddingHorizontal: 8, borderRadius: 6, marginHorizontal: 2, alignItems: 'center', minWidth: 50 },
  presetBtnText: { color: themeColors.card, fontWeight: '600', fontSize: 14 },
  suggestionsContainer: { marginTop: 16, marginBottom: 8 },
  suggestionsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  suggestionBtn: { flex: 1, paddingVertical: 8, paddingHorizontal: 6, borderRadius: 6, marginHorizontal: 2, marginVertical: 4, alignItems: 'center', minWidth: 70, maxWidth: 120 },
  suggestionBtnText: { color: themeColors.card, fontWeight: '600', fontSize: 12, textAlign: 'center' },
});
