import Confetti from '@/components/animations/Confetti';
import HelpModal from '@/components/HelpModal';
import { API_URL } from '@/utils/config';
import { getAuthToken } from '@/utils/secureStorage';
import { useTheme } from '@/utils/themeContext';
import { useStaleDataWarning } from '@/utils/useStaleDataWarning';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Animated, Dimensions, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

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
        Animated.timing(bounceAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
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
          tooltip: 'Parents review requests carefully to teach patience and planning!',
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
          tooltip: 'Approved requests show you\'re learning to manage money responsibly.',
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
          tooltip: 'Sometimes requests need more planning. This helps you learn about budgeting!',
        };
      default:
        return {
          icon: '📝',
          color: themeColors.textSecondary,
          bgColor: themeColors.border + '12',
          text: 'Submitted',
          subtext: isMobile ? '' : 'Waiting to be reviewed',
          showProgress: false,
          tooltip: 'Your request has been sent to your parents for review.',
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
          borderRadius: isMobile ? 8 : 12,
          paddingHorizontal: isMobile ? 6 : 10,
          paddingVertical: isMobile ? 4 : 6,
          gap: isMobile ? 4 : 6,
          borderWidth: 1,
          borderColor: config.color + '25',
          transform: [{ scale: status === 'Approved' ? bounceAnim : 1 }],
          maxWidth: isMobile ? 120 : 160,
        }}
      >
        <Text style={{ fontSize: isMobile ? 14 : 16 }}>{config.icon}</Text>
        <View style={{ flex: 1 }}>
          <Text style={{
            color: config.color,
            fontWeight: '600',
            fontSize: isMobile ? 10 : 12,
            textAlign: 'center'
          }}>
            {config.text}
          </Text>
          {config.subtext && !isMobile && (
            <Text style={{
              color: config.color,
              fontSize: 9,
              textAlign: 'center',
              opacity: 0.7
            }}>
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
  themeColors
}: {
  requestId: string;
  value: string;
  onChangeText: (text: string) => void;
  onSend: (text: string) => Promise<void>;
  themeColors: any;
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
        <Text style={{ fontSize: 16, marginRight: 8 }}>💬</Text>
        <Text style={{
          fontSize: 12,
          color: themeColors.primary,
          fontWeight: '600',
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
            fontSize: 12,
            color: themeColors.card,
            fontWeight: '600'
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
              fontSize: 14,
              fontWeight: '600',
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
                    fontSize: 12,
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
              fontSize: 16,
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
            fontSize: 10,
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
            <Text style={{ fontSize: 18 }}>😊</Text>
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
              Alert.alert(
                'Voice Messages',
                'Voice messages will be available soon! For now, use text with emojis to express yourself.',
                [{ text: 'OK' }]
              );
            }}
          >
            <Text style={{ fontSize: 16 }}>🎤</Text>
          </TouchableOpacity>

          {/* Send Button */}
          <TouchableOpacity
            style={{
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: 20,
              minWidth: 60,
              alignItems: 'center',
              backgroundColor: value.trim() ? themeColors.primary : themeColors.border,
            }}
            onPress={handleSend}
            disabled={!value.trim()}
          >
            <Text style={{
              color: themeColors.card,
              fontWeight: '600',
              fontSize: 14
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
              fontSize: 16,
              fontWeight: '600',
              color: themeColors.text
            }}>
              Choose an emoji 😊
            </Text>
            <TouchableOpacity
              onPress={() => setShowEmojiPicker(false)}
              style={{ padding: 4 }}
            >
              <Text style={{ fontSize: 18, color: themeColors.text }}>×</Text>
            </TouchableOpacity>
          </View>

          {Object.entries(emojiCategories).map(([category, emojis]) => (
            <View key={category} style={{ marginBottom: 12 }}>
              <Text style={{
                fontSize: 14,
                fontWeight: '600',
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
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 18, marginTop: 6, color: themeColors.primary },
  sectionCard: { backgroundColor: themeColors.card, borderRadius: 16, marginBottom: 16, padding: 16, width: '95%', maxWidth: 480, elevation: 3, shadowColor: themeColors.border },
  sectionTitle: { fontSize: 20, fontWeight: '600', marginBottom: 12, color: themeColors.text },
  placeholder: { color: themeColors.textSecondary, fontStyle: 'italic', fontSize: 15, textAlign: 'center', paddingVertical: 20 },
  requestText: { fontSize: 16, marginBottom: 8, color: themeColors.text },
  boldText: { fontWeight: '600', color: themeColors.primary },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  actionBtn: { flex: 1, padding: 12, borderRadius: 8, marginHorizontal: 4, alignItems: 'center' },
  actionBtnText: { color: themeColors.card, fontWeight: '600', fontSize: 16 },
  filterChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, minHeight: 36, justifyContent: 'center', alignItems: 'center', elevation: 1, backgroundColor: themeColors.surface },
  chipText: { fontSize: 14, fontWeight: '600', textAlign: 'center', color: themeColors.text },
  searchInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, marginBottom: 16, backgroundColor: themeColors.surface, borderColor: themeColors.border, color: themeColors.text },
  messagesContainer: { marginTop: 12, marginBottom: 8 },
  messageBubble: { padding: 10, borderRadius: 12, marginBottom: 8, maxWidth: '80%' },
  childMessage: { backgroundColor: themeColors.surface, alignSelf: 'flex-start' },
  parentMessage: { backgroundColor: themeColors.secondary, alignSelf: 'flex-end' },
  messageText: { fontSize: 14, color: themeColors.text },
  messageTime: { fontSize: 10, color: themeColors.textSecondary, marginTop: 4, textAlign: 'right' },
  messageInputContainer: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 8, gap: 8 },
  messageInput: { flex: 1, borderWidth: 1, borderColor: themeColors.border, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 16, maxHeight: 100, textAlignVertical: 'top', backgroundColor: themeColors.surface, color: themeColors.text },
  sendButton: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, minWidth: 60, alignItems: 'center', backgroundColor: themeColors.primary },
  sendButtonText: { color: themeColors.card, fontWeight: '600', fontSize: 14 },
});

export default function KidsRequestsScreen() {
  const { themeColors } = useTheme();
  const styles = createStyles(themeColors);
  const [showStaleWarning, , markRefreshed] = useStaleDataWarning();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'denied' | 'all'>('pending');
  const [showArchive, setShowArchive] = useState(false);
  const [helpModalVisible, setHelpModalVisible] = useState(false);
  const [messageInput, setMessageInput] = useState<{ [key: string]: string }>({});
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  useEffect(() => { loadRequests(); }, []);
  useFocusEffect(useCallback(() => { loadRequests(); }, []));

  const loadRequests = async () => {
    try {
      const token = await getAuthToken();
      const storedUser = await AsyncStorage.getItem('user');
      if (!token || !storedUser) {
        Alert.alert('Error', 'Not authenticated. Please login again.');
        return;
      }
      const user = JSON.parse(storedUser);
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
      setRequests(transformedRequests);
      markRefreshed();
    } catch (error) {
      console.error('Error loading requests:', error);
      Alert.alert('Error', 'Failed to load requests. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadRequests();
  }, []);

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
      case 'goal-completion': return 'Goal Achievement';
      case 'move-points': return 'Jar Transfer';
      case 'reward': return 'Prize Claim';
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

  // Filtering logic inspired by the parent's screen
  const now = new Date();
  const ninetyDaysAgo = new Date(now);
  ninetyDaysAgo.setDate(now.getDate() - 90);
  let baseRequests: typeof requests = [];
  let showArchiveButton = false;

  if (filter === "approved" || filter === "denied") {
    const statusLabel = filter === "approved" ? "Approved" : "Denied";
    const recent = requests.filter(r => r.status === statusLabel && new Date(r.createdAt) >= ninetyDaysAgo);
    const archived = requests.filter(r => r.status === statusLabel && new Date(r.createdAt) < ninetyDaysAgo);
    baseRequests = showArchive ? [...recent, ...archived] : recent;
    showArchiveButton = archived.length > 0;
  } else if (filter === "pending") {
    baseRequests = requests.filter(r => r.status === "Pending");
  } else {
    baseRequests = requests;
  }
  // Apply search filter
  const searchedRequests = baseRequests.filter(req =>
    searchQuery === '' ||
    req.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    req.type.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredRequests = searchedRequests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
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
              alignItems: 'center',
            }}
            onPress={() => router.push('./')}
          >
            <Text style={{ color: themeColors.text, fontWeight: 'bold', fontSize: 14 }}>⬅️ Back</Text>
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
              alignItems: 'center',
            }}
            onPress={() => setHelpModalVisible(true)}
          >
            <Text style={{ color: themeColors.card, fontWeight: 'bold', fontSize: 14 }}>❓ Help</Text>
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
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <View style={styles.filterChips}>
          {[
            { key: 'pending', label: 'Pending', count: requests.filter(r => r.status === 'Pending').length },
            { key: 'approved', label: 'Approved', count: requests.filter(r => r.status === 'Approved').length },
            { key: 'denied', label: 'Denied', count: requests.filter(r => r.status === 'Denied').length },
            { key: 'all', label: 'All', count: requests.length }
          ].map(({ key, label, count }) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.chip,
                { backgroundColor: filter === key ? themeColors.accent : themeColors.surface }
              ]}
              onPress={() => { setFilter(key as any); setShowArchive(false); }}
            >
              <Text style={{
                color: filter === key ? themeColors.card : themeColors.text,
                fontWeight: filter === key ? 'bold' : '600',
                fontSize: 15,
              }}>
                {label} ({count})
              </Text>
            </TouchableOpacity>
          ))}
          {(filter === "approved" || filter === "denied") && showArchiveButton && (
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
                fontSize: 15,
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
          disabled={refreshing}
        >
          <Text style={[styles.actionBtnText, { color: themeColors.card }]}>
            {refreshing ? 'Refreshing...' : '🔄 Refresh Requests'}
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.sectionCard}>
          <Text style={styles.placeholder}>Loading your requests...</Text>
        </View>
      ) : (
        filteredRequests.length === 0 ? (
          <View style={styles.sectionCard}>
            <Text style={styles.placeholder}>
              {filter === "approved"
                ? showArchive ? "No approved requests found." : "No approved requests in the past 90 days."
                : filter === "denied"
                  ? showArchive ? "No denied requests found." : "No denied requests in the past 90 days."
                  : searchQuery ? `No ${filter.toLowerCase()} requests match "${searchQuery}".` : `No ${filter.toLowerCase()} requests.`}
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
                    <Text style={[styles.sectionTitle, { fontSize: 16, marginBottom: 8 }]}>Messages:</Text>
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
                            Alert.alert('Error', 'Not authenticated. Please login again.');
                            return;
                          }
                          const response = await fetch(`${API_URL}/requests/${request.id}/messages`, {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${token}`,
                            },
                            body: JSON.stringify({ text }),
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
                          Alert.alert('Error', 'Failed to send message. Please try again.');
                        }
                      }}
                      themeColors={themeColors}
                    />
                  </View>
                )}
              </View>
            ))}
            {/* Archive toggle for approved/denied */}
            {(filter === "approved" || filter === "denied") && showArchiveButton && !showArchive && (
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
                <Text style={{ color: themeColors.primary, fontWeight: "600" }}>
                  Show All {filter === "approved" ? "Approved" : "Denied"} Requests
                </Text>
              </TouchableOpacity>
            )}
            {(filter === "approved" || filter === "denied") && showArchiveButton && showArchive && (
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
  );
}
