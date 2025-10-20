import HelpModal from '@/components/HelpModal';
import { API_URL } from '@/utils/config';
import { getAuthToken } from '@/utils/secureStorage';
import { useTheme } from '@/utils/themeContext';
import { useStaleDataWarning } from '@/utils/useStaleDataWarning';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const createStyles = (themeColors: any) => StyleSheet.create({
  scroll: { backgroundColor: themeColors.background },
  container: { alignItems: 'center', paddingVertical: 12, paddingHorizontal: 6 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 22, marginTop: 6, color: themeColors.primary },
  sectionCard: { backgroundColor: themeColors.card, borderRadius: 16, marginBottom: 16, padding: 16, minWidth: 320, width: '97%', maxWidth: 520, elevation: 3, shadowColor: themeColors.border },
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
                  <Text style={styles.sectionTitle}>{request.type} Request</Text>
                  <View style={{
                    flexDirection: 'row', alignItems: 'center', backgroundColor: getStatusColor(request.status),
                    borderRadius: 18, paddingHorizontal: 10, paddingVertical: 4, gap: 5
                  }}>
                    <Text style={{ color: themeColors.card, fontSize: 17 }}>{getStatusIcon(request.status)}</Text>
                    <Text style={{ color: themeColors.card, fontWeight: 'bold', fontSize: 14 }}>{request.status}</Text>
                  </View>
                </View>
                <Text style={styles.requestText}>
                  <Text style={styles.boldText}>Request:</Text> {request.name}
                </Text>
                {request.amount && (
                  <Text style={styles.requestText}>
                    <Text style={styles.boldText}>Amount:</Text> {request.amount} points
                  </Text>
                )}
                {request.reason && (
                  <Text style={styles.requestText}>
                    <Text style={styles.boldText}>Reason:</Text> {request.reason}
                  </Text>
                )}
                <Text style={[styles.requestText, { color: themeColors.textSecondary }]}>
                  <Text style={styles.boldText}>Requested:</Text> {new Date(request.createdAt).toLocaleDateString()} at {new Date(request.createdAt).toLocaleTimeString()}
                </Text>

                {/* Message Thread */}
                {(request.messages && request.messages.length > 0) && (
                  <View style={styles.messagesContainer}>
                    <Text style={[styles.sectionTitle, { fontSize: 16, marginBottom: 8 }]}>Messages:</Text>
                    {request.messages.map((msg, index) => (
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

                    {/* Message Input - child can always add message */}
                    <View style={styles.messageInputContainer}>
                      <TextInput
                        style={[styles.messageInput, { backgroundColor: themeColors.surface, color: themeColors.text }]}
                        placeholder="Type your message..."
                        placeholderTextColor={themeColors.textSecondary}
                        value={messageInput[request.id] || ''}
                        onChangeText={(text) => setMessageInput(prev => ({ ...prev, [request.id]: text }))}
                        multiline={true}
                        maxLength={500}
                      />
                      <TouchableOpacity
                        style={[styles.sendButton, { backgroundColor: themeColors.primary }]}
                        onPress={async () => {
                          const text = messageInput[request.id]?.trim();
                          if (!text) return;

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
                      >
                        <Text style={{ color: themeColors.card, fontWeight: '600', fontSize: 14 }}>Send</Text>
                      </TouchableOpacity>
                    </View>
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
            title: "Request Status",
            content: [
              {
                type: "text",
                text: "Each request has a status:",
                icon: "📊"
              },
              {
                type: "bullet",
                text: "⏳ Pending - Waiting for parent to decide"
              },
              {
                type: "bullet",
                text: "✅ Approved - Parent said yes!"
              },
              {
                type: "bullet",
                text: "❌ Denied - Parent said no this time"
              },
              {
                type: "highlight",
                text: "Approved requests add points to your account!",
                icon: "🎉"
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
            title: "Messages",
            content: [
              {
                type: "text",
                text: "Sometimes parents send messages:",
                icon: "💬"
              },
              {
                type: "bullet",
                text: "Blue bubbles - Messages you sent"
              },
              {
                type: "bullet",
                text: "Purple bubbles - Messages from parents"
              },
              {
                type: "bullet",
                text: "Shows date and time"
              },
              {
                type: "highlight",
                text: "Talk nicely with your parents through messages!",
                icon: "🙂"
              }
            ]
          }
        ]}
      />
    </ScrollView>
  );
}
