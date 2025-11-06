import Confetti from '@/components/animations/Confetti';
import HelpModal from '@/components/HelpModal';
import { SEMANTIC_TYPOGRAPHY } from '@/constants/theme';
import { useCenteredMessage } from '@/utils/centeredMessageContext';
import { API_URL } from '@/utils/config';
import { getAuthToken, getUserData } from '@/utils/secureStorage';
import { useTheme } from '@/utils/themeContext';
import { useStaleDataWarning } from '@/utils/useStaleDataWarning';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Animated, Dimensions, KeyboardAvoidingView, Platform, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

// Mobile-Optimized Status Indicator Component
const StatusIndicator = ({ status, createdAt, themeColors }: {
  status: string;
  createdAt: string;
  themeColors: any;
}) => {
  const screenWidth = Dimensions.get('window').width;
  const isMobile = screenWidth < 400;

  const [showConfetti, setShowConfetti] = useState(false);
  const [bounceAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    if (status === 'Approved') {
      setShowConfetti(true);
      Animated.sequence([
        Animated.timing(bounceAnim, { toValue: 1.05, duration: 120, useNativeDriver: true }),
        Animated.timing(bounceAnim, { toValue: 1, duration: 120, useNativeDriver: true })
  ]).start();
    }
  }, [status]);

  const getStatusConfig = (status: string) => {
    const now = new Date();
    const requestDate = new Date(createdAt);
    const hoursElapsed = (now.getTime() - requestDate.getTime()) / (1000 * 60 * 60);

    switch (status) {
      case 'Pending':
        const progress = Math.min(hoursElapsed / 24, 1);
        return {
          icon: '⏳',
          color: themeColors.warning,
          bgColor: themeColors.warning + '12',
          text: isMobile ? 'Pending' : 'Waiting for approval',
          subtext: isMobile ? '' : (progress > 0.5 ? 'Reviewing soon' : 'Submitted recently'),
          showProgress: true,
          progress: progress,
          tooltip: 'Parents review requests carefully to teach patience and planning!'
  };
      case 'Approved':
        return {
          icon: '✅',
          color: themeColors.success,
          bgColor: themeColors.success + '12',
          text: 'Approved!',
          subtext: isMobile ? '' : 'Great job!',
          showProgress: true,
          progress: Math.min(hoursElapsed / 24, 1),
          tooltip: 'Approved requests show you\'re learning to manage money responsibly.'
  };
      case 'Denied':
        return {
          icon: '❌',
          color: themeColors.error,
          bgColor: themeColors.error + '12',
          text: 'Not approved',
          subtext: isMobile ? '' : 'Try again later',
          showProgress: true,
          progress: Math.min(hoursElapsed / 24, 1),
          tooltip: 'Sometimes requests need more planning. This helps you learn about budgeting!'
  };
      default:
        return {
          icon: '📝',
          color: themeColors.textSecondary,
          bgColor: themeColors.border + '12',
          text: 'Submitted',
          subtext: isMobile ? '' : 'Waiting to be reviewed',
          showProgress: false,
          tooltip: 'Your request has been sent to your parents for review.'
  };
    }
  };

  const config = getStatusConfig(status);

  return (
    <View style={{ marginTop: isMobile ? 4 : 8 }}>
      <Animated.View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: config.bgColor,
          borderRadius: isMobile ? 10 : 14,
          paddingHorizontal: isMobile ? 8 : 12,
          paddingVertical: isMobile ? 6 : 8,
          gap: isMobile ? 6 : 8,
          borderWidth: 1,
          borderColor: config.color + '30',
          transform: [{ scale: status === 'Approved' ? bounceAnim : 1 }],
          maxWidth: isMobile ? 160 : 200,
          minWidth: isMobile ? 120 : 160
  }}
      >
        <Text style={{ ...SEMANTIC_TYPOGRAPHY["type-heading-small"] }}>{config.icon}</Text>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: config.color,
              ...SEMANTIC_TYPOGRAPHY["type-caption"],
              textAlign: 'left',
              lineHeight: isMobile ? 14 : 16
  }}
            numberOfLines={2}
            adjustsFontSizeToFit={false}
          >
            {config.text}
          </Text>
          {config.subtext && (
            <Text style={{
              color: config.color,
              ...SEMANTIC_TYPOGRAPHY["type-caption-small"],
              textAlign: 'left',
              opacity: 0.8,
              marginTop: 1,
              lineHeight: isMobile ? 12 : 14
  }}
            numberOfLines={1}
          >
              {config.subtext}
            </Text>
          )}
        </View>
      </Animated.View>

      {/* Simple Progress Bar for Pending Requests */}
      {config.showProgress && config.progress !== undefined && config.progress > 0 && (
        <View style={{ marginTop: 3, alignItems: 'center', flexDirection: 'row' }}>
          <View style={{
            height: 3,
            width: isMobile ? 80 : 100,
            backgroundColor: themeColors.border + '50',
            borderRadius: 1.5,
            borderWidth: 0.5,
            borderColor: themeColors.border + '30',
            overflow: 'hidden',
            flexDirection: 'row'
          }}>
            <View style={{
              height: '100%',
              width: `${Math.min(config.progress * 100, 100)}%`,
              backgroundColor: config.color,
              borderRadius: 1.5
            }} />
          </View>
        </View>
      )}

      {/* Confetti Animation for Approved */}
      {showConfetti && (
        <Confetti
          duration={1200}
          onComplete={() => setShowConfetti(false)}
        />
      )}
    </View>
  );
};

// Enhanced Message Input Component with Emoji Support
const EnhancedMessageInput = ({
  requestId,
  value,
  onChangeText,
  onSend,
  themeColors,
  showMessage
}: {
  requestId: string;
  value: string;
  onChangeText: (text: string) => void;
  onSend: (text: string) => Promise<void>;
  themeColors: any;
  showMessage: (message: string, type: 'success' | 'error' | 'info') => void;
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showQuickResponses, setShowQuickResponses] = useState(false);

  const emojiCategories = {
    'Faces': ['😊', '🙏', '😢', '😮', '🥺', '😍', '🤔', '😅', '🙂', '😉'],
    'Hearts': ['❤️', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️'],
    'Hands': ['👋', '🙌', '👍', '👎', '👏', '🙏', '🤝', '✌️', '🤞', '🤟'],
    'Objects': ['🎉', '🎊', '🎈', '🎁', '💰', '💸', '🤑', '💎', '🔑', '📝']
  };

  const quickResponses = [
    { text: 'Thank you! 🙏', category: 'polite' },
    { text: 'Can I try again? 🔄', category: 'polite' },
    { text: 'I understand 😊', category: 'polite' },
    { text: 'That makes sense! 💡', category: 'polite' },
    { text: 'I\'ll be more careful next time ⚠️', category: 'polite' },
    { text: 'Please explain why? 🤔', category: 'question' },
    { text: 'What can I do better? 📈', category: 'question' },
    { text: 'I\'m excited! 🎉', category: 'positive' },
    { text: 'Great job helping me learn! 🌟', category: 'positive' }
  ];

  const handleEmojiSelect = (emoji: string) => {
    onChangeText(value + emoji);
    setShowEmojiPicker(false);
  };

  const handleQuickResponseSelect = (response: string) => {
    onChangeText(response);
    setShowQuickResponses(false);
  };

  const handleSend = async () => {
    const text = value.trim();
    if (!text) return;
    await onSend(text);
  };

  return (
    <View style={{ marginTop: 8 }}>
      {/* Communication Coaching Tip */}
      <View style={{
        backgroundColor: themeColors.primary + '15',
        borderRadius: 12,
        padding: 8,
        marginBottom: 8,
        flexDirection: 'row',
        alignItems: 'center'
      }}>
        <Text style={{ ...SEMANTIC_TYPOGRAPHY["type-body"], marginRight: 8 }}>💬</Text>
        <Text style={{
          ...SEMANTIC_TYPOGRAPHY["type-caption-small"],
          color: themeColors.primary,
          flex: 1
        }}>
          Remember to be polite and respectful when messaging your parents!
        </Text>
      </View>

      {/* Quick Response Templates */}
      <View style={{ marginBottom: 8 }}>
        <TouchableOpacity
          style={{
            backgroundColor: themeColors.secondary,
            borderRadius: 16,
            paddingHorizontal: 12,
            paddingVertical: 6,
            alignSelf: 'flex-start'
          }}
          onPress={() => setShowQuickResponses(!showQuickResponses)}
        >
          <Text style={{
            ...SEMANTIC_TYPOGRAPHY["type-caption-small"],
            color: themeColors.card
  }}>
            💭 Quick Responses {showQuickResponses ? '▼' : '▶'}
          </Text>
        </TouchableOpacity>

        {showQuickResponses && (
          <View style={{
            backgroundColor: themeColors.surface,
            borderRadius: 12,
            padding: 12,
            marginTop: 8,
            borderWidth: 1,
            borderColor: themeColors.border
          }}>
            <Text style={{
              ...SEMANTIC_TYPOGRAPHY["type-body-small"],
              marginBottom: 8,
              color: themeColors.text
            }}>
              Choose a polite response:
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {quickResponses.map((response, index) => (
                <TouchableOpacity
                  key={index}
                  style={{
                    backgroundColor: themeColors.card,
                    borderRadius: 16,
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderWidth: 1,
                    borderColor: themeColors.border
                  }}
                  onPress={() => handleQuickResponseSelect(response.text)}
                >
                  <Text style={{
                    ...SEMANTIC_TYPOGRAPHY["type-caption-small"],
                    color: themeColors.text
                  }}>
                    {response.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* Message Input Container */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 8,
        marginBottom: 8
      }}>
        <View style={{ flex: 1 }}>
          <TextInput
            style={{
              borderWidth: 1,
              borderColor: themeColors.border,
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingVertical: 10,
              ...SEMANTIC_TYPOGRAPHY["type-body"],
              maxHeight: 100,
              textAlignVertical: 'top',
              backgroundColor: themeColors.surface,
              color: themeColors.text
            }}
            placeholder="Type your message..."
            placeholderTextColor={themeColors.textSecondary}
            value={value}
            onChangeText={onChangeText}
            multiline={true}
            maxLength={500}
          />

          {/* Character Counter */}
          <Text style={{
            ...SEMANTIC_TYPOGRAPHY["type-caption-small"],
            color: themeColors.textSecondary,
            textAlign: 'right',
            marginTop: 2,
            marginRight: 8
          }}>
            {value.length}/500
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={{ flexDirection: 'row', gap: 4 }}>
          {/* Emoji Button */}
          <TouchableOpacity
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: themeColors.secondary,
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onPress={() => setShowEmojiPicker(!showEmojiPicker)}
          >
            <Text style={{ ...SEMANTIC_TYPOGRAPHY["type-heading-small"] }}>😊</Text>
          </TouchableOpacity>

          {/* Voice Message Button (Placeholder) */}
          <TouchableOpacity
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: themeColors.surface,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: themeColors.border
            }}
            onPress={() => {
              showMessage('Voice messages will be available soon! For now, use text with emojis to express yourself.', 'info');
            }}
          >
            <Text style={{ ...SEMANTIC_TYPOGRAPHY["type-body"] }}>🎤</Text>
          </TouchableOpacity>

          {/* Send Button */}
          <TouchableOpacity
            style={{
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: 20,
              minWidth: 60,
              alignItems: 'center',
              backgroundColor: value.trim() ? themeColors.primary : themeColors.border
  }}
            onPress={handleSend}
            disabled={!value.trim()}
          >
            <Text style={{
              color: themeColors.card,
              ...SEMANTIC_TYPOGRAPHY["type-body-small"]
            }}>
              Send
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Emoji Picker Modal */}
      {showEmojiPicker && (
        <View style={{
          backgroundColor: themeColors.surface,
          borderRadius: 12,
          padding: 16,
          marginTop: 8,
          borderWidth: 1,
          borderColor: themeColors.border
        }}>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12
          }}>
            <Text style={{
              ...SEMANTIC_TYPOGRAPHY["type-body"],
              color: themeColors.text
            }}>
              Choose an emoji 😊
            </Text>
            <TouchableOpacity
              onPress={() => setShowEmojiPicker(false)}
              style={{ padding: 4 }}
            >
              <Text style={{ ...SEMANTIC_TYPOGRAPHY["type-heading-small"], color: themeColors.text }}>×</Text>
            </TouchableOpacity>
          </View>

          {Object.entries(emojiCategories).map(([category, emojis]) => (
            <View key={category} style={{ marginBottom: 12 }}>
              <Text style={{
                ...SEMANTIC_TYPOGRAPHY["type-body-small"],
                color: themeColors.primary,
                marginBottom: 6
              }}>
                {category}
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {emojis.map((emoji) => (
                  <TouchableOpacity
                    key={emoji}
                    style={{
                      width: 36,
                      height: 36,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: themeColors.card,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: themeColors.border
                    }}
                    onPress={() => handleEmojiSelect(emoji)}
                  >
                    <Text style={{ fontSize: 20 }}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const createStyles = (themeColors: any) => StyleSheet.create({
  scroll: { backgroundColor: themeColors.background },
  container: { alignItems: 'center', paddingVertical: 12, paddingHorizontal: 6 },
  title: { ...SEMANTIC_TYPOGRAPHY["type-display-medium"], marginBottom: 18, marginTop: 6, color: themeColors.primary },
  sectionCard: { backgroundColor: themeColors.card, borderRadius: 16, marginBottom: 16, padding: 16, width: '95%', maxWidth: 480, elevation: 3, shadowColor: themeColors.border },
  sectionTitle: { ...SEMANTIC_TYPOGRAPHY["type-heading-large"], marginBottom: 12, color: themeColors.text },
  placeholder: { color: themeColors.textSecondary, fontStyle: 'italic', ...SEMANTIC_TYPOGRAPHY["type-body-small"], textAlign: 'center', paddingVertical: 20 },
  requestText: { ...SEMANTIC_TYPOGRAPHY["type-body"], marginBottom: 8, color: themeColors.text },
  boldText: { color: themeColors.primary },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  actionBtn: { flex: 1, padding: 12, borderRadius: 8, marginHorizontal: 4, alignItems: 'center' },
  actionBtnText: { color: themeColors.card, ...SEMANTIC_TYPOGRAPHY["type-body"] },
  filterChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, minHeight: 36, justifyContent: 'center', alignItems: 'center', elevation: 1, backgroundColor: themeColors.surface },
  chipText: { ...SEMANTIC_TYPOGRAPHY["type-body-small"], textAlign: 'center', color: themeColors.text },
  searchInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, ...SEMANTIC_TYPOGRAPHY["type-body"], marginBottom: 16, backgroundColor: themeColors.surface, borderColor: themeColors.border, color: themeColors.text },
  messagesContainer: { marginTop: 12, marginBottom: 8 },
  messageBubble: { padding: 10, borderRadius: 12, marginBottom: 8, maxWidth: '80%' },
  childMessage: { backgroundColor: themeColors.surface, alignSelf: 'flex-start' },
  parentMessage: { backgroundColor: themeColors.secondary, alignSelf: 'flex-end' },
  messageText: { ...SEMANTIC_TYPOGRAPHY["type-body-small"], color: themeColors.text },
  messageTime: { ...SEMANTIC_TYPOGRAPHY["type-caption-small"], color: themeColors.textSecondary, marginTop: 4, textAlign: 'right' },
  messageInputContainer: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 8, gap: 8 },
  messageInput: { flex: 1, borderWidth: 1, borderColor: themeColors.border, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, ...SEMANTIC_TYPOGRAPHY["type-body"], maxHeight: 100, textAlignVertical: 'top', backgroundColor: themeColors.surface, color: themeColors.text },
  sendButton: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, minWidth: 60, alignItems: 'center', backgroundColor: themeColors.primary },
  sendButtonText: { color: themeColors.card, ...SEMANTIC_TYPOGRAPHY["type-body-small"] }
  });

export default function KidsRequestsScreen() {
  const { themeColors } = useTheme();
  const { showMessage } = useCenteredMessage();
  const styles = createStyles(themeColors);
  const screenWidth = Dimensions.get('window').width;
  const isMobile = screenWidth < 400;
  const [showStaleWarning, markRefreshed] = useStaleDataWarning();
  const [requests, setRequests] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    hasNextPage: true,
    loading: true,
    loadingMore: false,
    refreshing: false,
    filter: 'pending',
    searchQuery: ''
  });
  const [requestCounts, setRequestCounts] = useState({
    pending: 0,
    approved: 0,
    denied: 0
  });
  const [paginationMeta, setPaginationMeta] = useState<any | null>(null);
  const [showArchive, setShowArchive] = useState(false);
  const [helpModalVisible, setHelpModalVisible] = useState(false);
  const [messageInput, setMessageInput] = useState<{ [key: string]: string }>({});
  const router = useRouter();

  // Load requests when component mounts or filter/search changes
  const loadRequests = useCallback(async (opts?: { page?: number; reset?: boolean }) => {
    const page = opts?.page || 1;
    const reset = opts?.reset || false;

    try {
      if (reset) setPagination((prev) => ({ ...prev, loading: true, currentPage: 1, hasNextPage: true }));
      else if (page === 1) setPagination((prev) => ({ ...prev, loading: true, loadingMore: false, refreshing: false }));
      else setPagination((prev) => ({ ...prev, loadingMore: true }));

      const token = await getAuthToken();
      const user = await getUserData();

      if (!token || !user) {
        showMessage('Not authenticated. Please login again.', 'error');
        return;
      }

      const userId = user.id;
      const response = await fetch(`${API_URL}/requests/${userId}`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!response.ok) throw new Error('Failed to load requests');
      const requestsData = await response.json();

      const transformedRequests = requestsData.map((req: any) => ({
        id: req._id || req.id,
        type: req.type,
        name: req.name,
        amount: req.amount,
        reason: req.reason,
        status: req.status,
        createdAt: req.createdAt,
        messages: req.messages || []
      }));

      setRequests((prev) =>
        reset || page === 1 ? transformedRequests : [...prev, ...transformedRequests.filter((r: any) => !prev.some((old) => old.id === r.id))]
      );
      setPagination((prev) => ({
        ...prev,
        loading: false,
        loadingMore: false,
        hasNextPage: false, // Since we load all at once for now, no pagination
        currentPage: 1,
        refreshing: false,
      }));
    } catch (error) {
      console.error('Error loading requests:', error);
      showMessage('Failed to load requests. Please try again.', 'error');
      setPagination((prev) => ({
        ...prev,
        loading: false,
        loadingMore: false,
        refreshing: false
      }));
    }
  }, [showMessage]);

  useEffect(() => {
    loadRequests({ page: 1, reset: true });
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadRequests({ page: 1, reset: true });
    }, [])
  );

  const onRefresh = useCallback(() => {
    setPagination((prev) => ({ ...prev, refreshing: true }));
    loadRequests({ page: 1, reset: true });
  }, []);

  // Filter change handler
  const handleFilterChange = (newFilter: 'pending' | 'approved' | 'denied' | 'all') => {
    setPagination((prev) => ({ ...prev, filter: newFilter, currentPage: 1, hasNextPage: true }));
    setShowArchive(false);
  };

  // Search handler
  const handleSearchChange = (text: string) => {
    setPagination((prev) => ({ ...prev, searchQuery: text }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return themeColors.warning;
      case 'Approved': return themeColors.success;
      case 'Denied': return themeColors.error;
      default: return themeColors.border;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pending': return '⏳';
      case 'Approved': return '✅';
      case 'Denied': return '❌';
      default: return '❓';
    }
  };

  // Kid-friendly request type converter
  const getKidFriendlyRequestType = (type: string) => {
    switch (type) {
      case 'chore': return 'Task';
      case 'goal-completion': return 'Goal';
      case 'move-points': return 'Jar Transfer';
      case 'reward': return 'Prize';
      case 'points': return 'Allowance';
      default: return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  // Kid-friendly request name simplifier
  const getKidFriendlyRequestName = (type: string, name: string) => {
    switch (type) {
      case 'chore':
        // Remove "Chore: " prefix and make it more personal
        return name.replace(/^Chore:\s*/i, '').replace(/^I completed the chore:\s*/i, '');
      case 'goal-completion':
        // Make goal completions more celebratory
        return name.replace(/^Goal:\s*/i, '').replace(/^I have completed my goal to save/i, 'I saved');
      case 'move-points':
        // Keep move-points as-is since they're already clear
        return name;
      case 'reward':
        // Keep rewards as-is
        return name;
      default:
        return name;
    }
  };

  // Kid-friendly reason simplifier
  const getKidFriendlyReason = (type: string, reason: string) => {
    if (!reason) return '';

    switch (type) {
      case 'chore':
        return reason.replace(/^I completed the chore:\s*/i, 'I finished ').replace(/^I completed/i, 'I finished');
      case 'goal-completion':
        return reason.replace(/^I have completed my goal to save/i, 'I saved').replace(/points in the (\w+) jar/i, 'points!');
      case 'move-points':
        return reason.replace(/^Child requested to move/i, 'I want to move');
      case 'reward':
        return reason.replace(/^Child requested/i, 'I want to claim');
      default:
        return reason;
    }
  };

  // Kid-friendly relative date formatter
  const getKidFriendlyDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));

    // Format time in 12-hour format
    const timeString = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    if (diffInDays === 0) {
      return `Today at ${timeString}`;
    } else if (diffInDays === 1) {
      return `Yesterday at ${timeString}`;
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago at ${timeString}`;
    } else {
      // For older dates, show a simplified format
      const month = date.toLocaleDateString('en-US', { month: 'short' });
      const day = date.getDate();
      return `${month} ${day} at ${timeString}`;
    }
  };

  // Calculate request counts for filter chips
  React.useEffect(() => {
    const counts = {
      pending: requests.filter(r => r.status === 'Pending').length,
      approved: requests.filter(r => r.status === 'Approved').length,
      denied: requests.filter(r => r.status === 'Denied').length
    };
    setRequestCounts(counts);
  }, [requests]);

  // Filtering logic inspired by the parent's screen
  const now = new Date();
  const ninetyDaysAgo = new Date(now);
  ninetyDaysAgo.setDate(now.getDate() - 90);
  let baseRequests: typeof requests = [];
  let showArchiveButton = false;

  if (pagination.filter === "approved" || pagination.filter === "denied") {
    const statusLabel = pagination.filter === "approved" ? "Approved" : "Denied";
    const recent = requests.filter(r => r.status === statusLabel && new Date(r.createdAt) >= ninetyDaysAgo);
    const archived = requests.filter(r => r.status === statusLabel && new Date(r.createdAt) < ninetyDaysAgo);
    baseRequests = showArchive ? [...recent, ...archived] : recent;
    showArchiveButton = archived.length > 0;
  } else if (pagination.filter === "pending") {
    baseRequests = requests.filter(r => r.status === "Pending");
  } else {
    baseRequests = requests;
  }
  // Apply search filter
  const searchedRequests = baseRequests.filter(req =>
    pagination.searchQuery === '' ||
    req.name.toLowerCase().includes(pagination.searchQuery.toLowerCase()) ||
    req.type.toLowerCase().includes(pagination.searchQuery.toLowerCase())
  );
  const filteredRequests = searchedRequests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

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
          <RefreshControl refreshing={pagination.refreshing} onRefresh={onRefresh} />
        }
        keyboardShouldPersistTaps="handled"
      >
      <View style={{ width: '100%', maxWidth: 520, marginBottom: 16, marginTop: 6 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <TouchableOpacity
            style={{
              backgroundColor: themeColors.surface,
              borderRadius: 16,
              paddingHorizontal: 16,
              paddingVertical: 12,
              elevation: 2,
              minWidth: 48,
              minHeight: 48,
              justifyContent: 'center',
              alignItems: 'center'
  }}
            onPress={() => router.push('./')}
          >
            <Text style={{ color: themeColors.text, ...SEMANTIC_TYPOGRAPHY["type-body-small"] }}>⬅️ Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              backgroundColor: themeColors.accent,
              borderRadius: 16,
              paddingHorizontal: 16,
              paddingVertical: 12,
              elevation: 2,
              minWidth: 48,
              minHeight: 48,
              justifyContent: 'center',
              alignItems: 'center'
  }}
            onPress={() => setHelpModalVisible(true)}
          >
            <Text style={{ color: themeColors.card, ...SEMANTIC_TYPOGRAPHY["type-body-small"] }}>❓ Help</Text>
          </TouchableOpacity>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={[styles.title, { color: themeColors.primary }]}>
            📋 My Requests
          </Text>
        </View>
      </View>

      {/* Search & Filter */}
      <View style={styles.sectionCard}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by request type or name..."
          placeholderTextColor={themeColors.textSecondary}
          value={pagination.searchQuery}
          onChangeText={handleSearchChange}
        />
        <View style={styles.filterChips}>
          {[
            { key: 'pending', label: 'Pending', count: requestCounts.pending },
            { key: 'approved', label: 'Approved', count: requestCounts.approved },
            { key: 'denied', label: 'Denied', count: requestCounts.denied },
            { key: 'all', label: 'All', count: requests.length }
          ].map(({ key, label, count }) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.chip,
                { backgroundColor: pagination.filter === key ? themeColors.accent : themeColors.surface }
              ]}
              onPress={() => handleFilterChange(key as any)}
            >
              <Text style={{
                color: pagination.filter === key ? themeColors.card : themeColors.text,
                fontWeight: pagination.filter === key ? 'bold' : '600',
                ...SEMANTIC_TYPOGRAPHY["type-body-small"]
  }}>
                {label} ({count})
              </Text>
            </TouchableOpacity>
          ))}
          {(pagination.filter === "approved" || pagination.filter === "denied") && showArchiveButton && (
            <TouchableOpacity
              style={[
                styles.chip,
                { backgroundColor: showArchive ? themeColors.accent : themeColors.surface }
              ]}
              onPress={() => setShowArchive(!showArchive)}
            >
              <Text style={{
                color: showArchive ? themeColors.card : themeColors.text,
                fontWeight: showArchive ? 'bold' : '600',
                ...SEMANTIC_TYPOGRAPHY["type-body-small"]
  }}>
                📁 {showArchive ? 'Show Recent' : 'Show Archive'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Refresh Button */}
      <View style={styles.sectionCard}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: themeColors.primary, alignSelf: 'center', minWidth: 200 }]}
          onPress={onRefresh}
          disabled={pagination.refreshing}
        >
          <Text style={[styles.actionBtnText, { color: themeColors.card }]}>
            {pagination.refreshing ? 'Refreshing...' : '🔄 Refresh Requests'}
          </Text>
        </TouchableOpacity>
      </View>

      {pagination.loading ? (
        <View style={[styles.sectionCard, { alignItems: 'center', justifyContent: 'center', minHeight: 120 }]}>
          <ActivityIndicator size="large" color={themeColors.primary} />
          <Text style={[styles.placeholder, { marginTop: 12 }]}>Loading your requests...</Text>
        </View>
      ) : (
        filteredRequests.length === 0 ? (
          <View style={styles.sectionCard}>
            <Text style={styles.placeholder}>
              {pagination.filter === "approved"
                ? showArchive ? "No approved requests found." : "No approved requests in the past 90 days."
                : pagination.filter === "denied"
                  ? showArchive ? "No denied requests found." : "No denied requests in the past 90 days."
                  : pagination.searchQuery ? `No ${pagination.filter.toLowerCase()} requests match "${pagination.searchQuery}".` : `No ${pagination.filter.toLowerCase()} requests.`}
            </Text>
          </View>
        ) : (
          <>
            {filteredRequests.map(request => (
              <View key={request.id} style={[styles.sectionCard, { backgroundColor: themeColors.card, shadowColor: themeColors.border }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={styles.sectionTitle}>{getKidFriendlyRequestType(request.type)} Request</Text>
                  <StatusIndicator
                    status={request.status}
                    createdAt={request.createdAt}
                    themeColors={themeColors}
                  />
                </View>
                <Text style={styles.requestText}>
                  <Text style={styles.boldText}>Request:</Text> {getKidFriendlyRequestName(request.type, request.name)}
                </Text>
                {request.amount && (
                  <Text style={styles.requestText}>
                    <Text style={styles.boldText}>Amount:</Text> {request.amount} points
                  </Text>
                )}
                {request.reason && (
                  <Text style={styles.requestText}>
                    <Text style={styles.boldText}>What I did:</Text> {getKidFriendlyReason(request.type, request.reason)}
                  </Text>
                )}
                <Text style={[styles.requestText, { color: themeColors.textSecondary }]}>
                  <Text style={styles.boldText}>Asked:</Text> {getKidFriendlyDateTime(request.createdAt)}
                </Text>

                {/* Message Thread */}
                {(request.messages && request.messages.length > 0) && (
                  <View style={styles.messagesContainer}>
                    <Text style={[styles.sectionTitle, { ...SEMANTIC_TYPOGRAPHY["type-body"], marginBottom: 8 }]}>Messages:</Text>
                    {request.messages.map((msg: { sender: string; text: string; timestamp: string }, index: number) => (
                      <View key={index} style={[
                        styles.messageBubble,
                        msg.sender === 'child'
                          ? { backgroundColor: themeColors.secondary + '1A', alignSelf: 'flex-start' }
                          : { backgroundColor: themeColors.primary + '14', alignSelf: 'flex-end' }
                      ]}>
                        <Text style={[styles.messageText, { color: themeColors.text }]}>{msg.text}</Text>
                        <Text style={[styles.messageTime, { color: themeColors.textSecondary }]}>
                          {new Date(msg.timestamp).toLocaleDateString()} {new Date(msg.timestamp).toLocaleTimeString()}
                        </Text>
                      </View>
                    ))}

                    {/* Enhanced Message Input - child can always add message */}
                    <EnhancedMessageInput
                      requestId={request.id}
                      value={messageInput[request.id] || ''}
                      onChangeText={(text) => setMessageInput(prev => ({ ...prev, [request.id]: text }))}
                      onSend={async (text) => {
                        try {
                          const token = await getAuthToken();
                          if (!token) {
                            showMessage('Not authenticated. Please login again.', 'error');
                            return;
                          }
                          const response = await fetch(`${API_URL}/requests/${request.id}/messages`, {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({ text })
  });

                          if (!response.ok) throw new Error('Failed to send message');
                          const newMessage = await response.json();
                          setRequests(prev => prev.map(req =>
                            req.id === request.id
                              ? { ...req, messages: [...(req.messages || []), newMessage.newMessage] }
                              : req
                          ));
                          setMessageInput(prev => ({ ...prev, [request.id]: '' }));
                          loadRequests();
                        } catch (error) {
                          console.error('Error sending message:', error);
                          showMessage('Failed to send message. Please try again.', 'error');
                        }
                      }}
                      themeColors={themeColors}
                      showMessage={showMessage}
                    />
                  </View>
                )}
              </View>
            ))}
            {/* Archive toggle for approved/denied */}
            {(pagination.filter === "approved" || pagination.filter === "denied") && showArchiveButton && !showArchive && (
              <TouchableOpacity
                style={{
                  marginTop: 12,
                  alignSelf: "center",
                  backgroundColor: themeColors.accent + "22",
                  paddingHorizontal: 20,
                  paddingVertical: 8,
                  borderRadius: 16
                }}
                onPress={() => setShowArchive(true)}
              >
                <Text style={{ color: themeColors.primary
  }}>
                  Show All {pagination.filter === "approved" ? "Approved" : "Denied"} Requests
                </Text>
              </TouchableOpacity>
            )}
            {(pagination.filter === "approved" || pagination.filter === "denied") && showArchiveButton && showArchive && (
              <TouchableOpacity
                style={{
                  marginTop: 10,
                  alignSelf: "center",
                  backgroundColor: themeColors.surface,
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                  borderRadius: 16
                }}
                onPress={() => setShowArchive(false)}
              >
                <Text style={{ color: themeColors.primary, fontWeight: "500" }}>
                  Show Only Last 90 Days
                </Text>
              </TouchableOpacity>
            )}
          </>
        )
      )}

      <HelpModal
        visible={helpModalVisible}
        onClose={() => setHelpModalVisible(false)}
        title="📋 My Requests - Help"
        tabs={[
          {
            title: "What Are Requests?",
            content: [
              {
                type: "text",
                text: "Requests are things you ask your parents to approve! When you want to move points or get rewards, parents must say yes first.",
                icon: "📋"
              },
              {
                type: "bullet",
                text: "Moving points between jars needs approval"
              },
              {
                type: "bullet",
                text: "Getting rewards needs approval"
              },
              {
                type: "bullet",
                text: "Completing big goals needs approval"
              },
              {
                type: "highlight",
                text: "This page shows all your requests and their status!",
                icon: "👀"
              }
            ]
          },
          {
            title: "Request Status & Progress",
            content: [
              {
                type: "text",
                text: "Each request has fun status indicators and progress tracking:",
                icon: "📊"
              },
              {
                type: "bullet",
                text: "🚀 Pending - Shows rocket stages and time remaining!"
              },
              {
                type: "bullet",
                text: "🎉 Approved - Celebration with confetti animation!"
              },
              {
                type: "bullet",
                text: "🌱 Denied - Gentle encouragement to try again"
              },
              {
                type: "bullet",
                text: "📊 Progress bars show how long requests have been waiting"
              },
              {
                type: "highlight",
                text: "Tap any status for helpful tips about money management!",
                icon: "💡"
              }
            ]
          },
          {
            title: "Using the Tabs",
            content: [
              {
                type: "text",
                text: "Use tabs to see different requests:",
                icon: "📑"
              },
              {
                type: "bullet",
                text: "Pending - Requests waiting for approval"
              },
              {
                type: "bullet",
                text: "Approved - Requests parents said yes to"
              },
              {
                type: "bullet",
                text: "Denied - Requests parents said no to"
              },
              {
                type: "bullet",
                text: "All - Shows everything together"
              },
              {
                type: "highlight",
                text: "Numbers in parentheses show how many requests!",
                icon: "🔢"
              }
            ]
          },
          {
            title: "Enhanced Communication",
            content: [
              {
                type: "text",
                text: "Express yourself with fun communication tools:",
                icon: "💬"
              },
              {
                type: "bullet",
                text: "😊 Emoji picker - Add emojis to show feelings!"
              },
              {
                type: "bullet",
                text: "💭 Quick responses - Choose polite pre-made messages"
              },
              {
                type: "bullet",
                text: "🎤 Voice messages - Coming soon!"
              },
              {
                type: "bullet",
                text: "💬 Polite reminders - Tips for respectful communication"
              },
              {
                type: "highlight",
                text: "Communication helps you learn and build better relationships!",
                icon: "❤️"
              }
            ]
          }
        ]}
      />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
