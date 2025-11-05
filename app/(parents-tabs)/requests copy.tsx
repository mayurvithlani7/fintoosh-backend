import BackButton from '@/components/BackButton';
import HelpModal from '@/components/HelpModal';
import { useCenteredMessage } from '@/utils/centeredMessageContext';
import { API_URL } from '@/utils/config';
import { formatDateTime } from '@/utils/dateUtils';
import { getAuthToken } from '@/utils/secureStorage';
import { useTheme } from '@/utils/themeContext';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

export default function ParentsRequestsScreen() {
  const router = useRouter();
  const { themeColors } = useTheme();
  const { showMessage } = useCenteredMessage();
  const styles = createStyles(themeColors);

  // Function to get user-friendly request type display name
  const getRequestTypeDisplay = (type: string) => {
    switch (type) {
      case 'chore':
        return 'Chore Completion';
      case 'goal-completion':
        return 'Goal Achievement';
      case 'reward':
        return 'Reward Purchase';
      case 'move-points':
        return 'Point Transfer';
      case 'points':
        return 'Points Request';
      case 'points-move':
        return 'Points Transfer';
      default:
        return type.charAt(0).toUpperCase() + type.slice(1).replace(/-/g, ' ');
    }
  };
  const [requests, setRequests] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    hasNextPage: true,
    loading: true,
    loadingMore: false,
    refreshing: false,
    filter: 'pending',
    searchQuery: '',
  });
  const [requestCounts, setRequestCounts] = useState({
    pending: 0,
    approved: 0,
    denied: 0,
  });
  const [paginationMeta, setPaginationMeta] = useState<any | null>(null);
  const [approvalModal, setApprovalModal] = useState({
    visible: false,
    request: null as any,
    approved: false,
    comment: '',
  });
  const [helpModalVisible, setHelpModalVisible] = useState(false);
  const [errorState, setErrorState] = useState<{
    type: 'network' | 'auth' | 'server' | null;
    message: string;
    retryAction?: () => void;
  } | null>(null);

  // Load requests when component mounts or filter/search/pagination changes
  const loadRequests = async (opts?: { page?: number; reset?: boolean; filter?: string; searchQuery?: string }) => {
    const page = opts?.page || 1;
    const reset = opts?.reset || false;
    const filter = opts?.filter ?? pagination.filter;
    const searchQuery = opts?.searchQuery ?? pagination.searchQuery;

    try {
      if (reset) setPagination((prev) => ({ ...prev, loading: true, currentPage: 1, hasNextPage: true }));
      else if (page === 1) setPagination((prev) => ({ ...prev, loading: true, loadingMore: false, refreshing: false }));
      else setPagination((prev) => ({ ...prev, loadingMore: true }));

      const token = await getAuthToken();
                  if (!token) {
                    showMessage('Not authenticated. Please login again.', 'error');
                    return;
                  }
      const apiStatus = getApiStatus(filter);
      let url = `${API_URL}/requests?page=${page}&limit=20&status=${apiStatus}`;
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to load requests');

      const json = await response.json();
      const newRequests = json.requests ?? [];
      const meta = json.pagination ?? {};

      // Security: reject if any requests returned for child not in parent's children list
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        const storedUser = await AsyncStorage.getItem('user');
        let allowedChildNames: string[] = [];
        if (storedUser) {
          const parentProfile = JSON.parse(storedUser);
          if (Array.isArray(parentProfile.children)) {
            allowedChildNames = parentProfile.children.map((c: any) => c.name);
          }
        }
        if (
          allowedChildNames.length > 0 &&
          newRequests.some((req: any) => req.childName && !allowedChildNames.includes(req.childName))
        ) {
          const { clearSensitiveAppData } = await import('@/utils/secureStorage');
          await clearSensitiveAppData();
          if (typeof window !== 'undefined' && window.location) window.location.href = '/login';
          return;
        }
      } catch (err) {
        // fail safe: continue
      }

      setPaginationMeta(meta);

      setRequests((prev) =>
        reset || page === 1 ? newRequests : [...prev, ...newRequests.filter((r: any) => !prev.some((old) => old._id === r._id))]
      );
      setPagination((prev) => ({
        ...prev,
        loading: false,
        loadingMore: false,
        hasNextPage: !!meta.hasNextPage,
        currentPage: meta.currentPage || page,
        refreshing: false, // Always set to false when operation completes
      }));
    } catch (error: any) {
      setPagination((prev) => ({
        ...prev,
        loading: false,
        loadingMore: false,
        refreshing: false,
      }));
      setErrorState({
        type: 'network',
        message: error?.message || 'Failed to load requests.',
        retryAction: () => loadRequests({ page: 1, reset: true }),
      });
    }
  };

  useEffect(() => {
    loadRequests({ page: 1, reset: true });
    // eslint-disable-next-line
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

  const handleApproval = async () => {
    if (!approvalModal.request) return;
    try {
      const token = await getAuthToken();
      if (!token) {
        showMessage('Not authenticated. Please login again.', 'error');
        return;
      }

      const body: any = {
        status: approvalModal.approved ? 'Approved' : 'Denied',
      };
      if (approvalModal.comment.trim()) {
        body.parentComment = approvalModal.comment.trim();
      }

      const response = await fetch(`${API_URL}/requests/${approvalModal.request._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        let errorMessage = 'Failed to update request';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch { }
        throw new Error(errorMessage);
      }

      showMessage(`Request ${approvalModal.approved ? 'approved' : 'denied'}.`, approvalModal.approved ? 'success' : 'info');
      setApprovalModal({ visible: false, request: null, approved: false, comment: '' });

      // Refresh the requests list immediately
      loadRequests({ page: 1, reset: true });
    } catch (error: any) {
      showMessage(error?.message || 'Failed to update request. Please try again.', 'error');
    }
  };

  // Filtering options (pending, approved, denied)
  const handleFilterChange = (newFilter: 'pending' | 'approved' | 'denied') => {
    setPagination((prev) => ({ ...prev, filter: newFilter, currentPage: 1, hasNextPage: true }));
    loadRequests({ page: 1, reset: true, filter: newFilter });
  };

  // Map filter to API status values
  const getApiStatus = (filter: string) => {
    switch (filter) {
      case 'pending': return 'Pending';
      case 'approved': return 'Approved';
      case 'denied': return 'Denied';
      default: return 'Pending';
    }
  };

  // FlatList: load next page when reaching end
  const loadMore = () => {
    if (pagination.hasNextPage && !pagination.loadingMore && !pagination.loading) {
      loadRequests({ page: pagination.currentPage + 1 });
    }
  };

  const archiveThreshold = React.useMemo(() => {
    const now = new Date();
    now.setDate(now.getDate() - 90);
    return now;
  }, []);

  // Calculate request counts for filter chips
  React.useEffect(() => {
    const counts = {
      pending: requests.filter(r => r.status === 'Pending').length,
      approved: requests.filter(r => r.status === 'Approved' && new Date(r.createdAt) >= archiveThreshold).length,
      denied: requests.filter(r => r.status === 'Denied' && new Date(r.createdAt) >= archiveThreshold).length,
    };
    setRequestCounts(counts);
  }, [requests, archiveThreshold]);

  // Filter for recent approved/denied - memoized to prevent infinite loops
  const displayedRequests = React.useMemo(() => {
    let filtered: any[] = [];
    if (pagination.filter === 'approved' || pagination.filter === 'denied') {
      const statusLabel = pagination.filter === 'approved' ? 'Approved' : 'Denied';
      filtered = requests.filter((r) =>
        r.status === statusLabel && new Date(r.createdAt) >= archiveThreshold
      );
    } else {
      filtered = requests.filter((r) => r.status === 'Pending');
    }
    if (pagination.searchQuery) {
      filtered = filtered.filter(
        (req) =>
          req.name?.toLowerCase().includes(pagination.searchQuery.toLowerCase()) ||
          req.type?.toLowerCase().includes(pagination.searchQuery.toLowerCase())
      );
    }
    return filtered;
  }, [requests, pagination.filter, pagination.searchQuery, archiveThreshold]);

  const renderRequestCard = ({ item: request }: { item: any }) => (
    <View style={[styles.sectionCard, { alignSelf: 'center', width: '97%', maxWidth: 520, minWidth: 320 }]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Text style={styles.sectionTitle}>{getRequestTypeDisplay(request.type)} Request</Text>
        <Text style={[styles.childNameBadge, { backgroundColor: themeColors.primary + '20', color: themeColors.primary }]}>
          {request.childName || request.userName || 'Unknown Child'}
        </Text>
      </View>

      {/* Enhanced move-points display */}
      {request.type === 'move-points' ? (
        <View style={{ marginTop: 8, marginBottom: 8 }}>
          <Text style={styles.requestText}>
            <Text style={styles.boldText}>Request:</Text> Move {request.amount} points from {request.from === 'current' ? 'Pocket Money' : request.from === 'save' ? 'Savings Pot' : request.from === 'spend' ? 'Spending Pot' : request.from === 'donate' ? 'Help Others Pot' : request.from === 'invest' ? 'Grow Money Pot' : request.from} to {request.to === 'current' ? 'Pocket Money' : request.to === 'save' ? 'Savings Pot' : request.to === 'spend' ? 'Spending Pot' : request.to === 'donate' ? 'Help Others Pot' : request.to === 'invest' ? 'Grow Money Pot' : request.to}
          </Text>
          <Text style={styles.requestText}>
            <Text style={styles.boldText}>Amount:</Text> {request.amount} points
          </Text>

          {/* Visual Before/After Display */}
          {request.fromBalance !== undefined && request.toBalance !== undefined && (
            <View style={{
              backgroundColor: themeColors.surface,
              borderRadius: 12,
              padding: 12,
              marginTop: 12,
              borderWidth: 2,
              borderColor: themeColors.border
            }}>
              <Text style={[styles.requestText, {
                fontWeight: 'bold',
                fontSize: 16,
                textAlign: 'center',
                marginBottom: 12,
                color: themeColors.primary
              }]}>
                📊 Before & After Summary
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={[styles.requestText, { fontSize: 14, textAlign: 'center', marginBottom: 4 }]}>
                    <Text style={styles.boldText}>From:</Text>
                  </Text>
                  <Text style={[styles.requestText, { fontSize: 14, textAlign: 'center', marginBottom: 4 }]}>
                    {request.from === 'current' ? 'Pocket Money' :
                      request.from === 'save' ? 'Savings Pot' :
                        request.from === 'spend' ? 'Spending Pot' :
                          request.from === 'donate' ? 'Help Others Pot' :
                            request.from === 'invest' ? 'Grow Money Pot' : request.from}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={[styles.requestText, {
                      fontSize: 14,
                      textAlign: 'center',
                      fontWeight: 'bold',
                      marginRight: 4
                    }]}>
                      {request.fromBalance} → {request.fromBalance - request.amount}
                    </Text>
                    {/* Balance Validation Indicators */}
                    {(() => {
                      const newBalance = request.fromBalance - request.amount;
                      const currentAmount = request.fromBalance;
                      if (newBalance < 0) {
                        return <Text style={{ fontSize: 14 }}>🚨</Text>; // Negative balance risk
                      } else if (newBalance < currentAmount * 0.2) {
                        return <Text style={{ fontSize: 14 }}>⚠️</Text>; // Low balance warning (below 20%)
                      }
                      return null;
                    })()}
                  </View>
                </View>
                <View style={{
                  width: 2,
                  backgroundColor: themeColors.border,
                  marginHorizontal: 12
                }} />
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={[styles.requestText, { fontSize: 14, textAlign: 'center', marginBottom: 4 }]}>
                    <Text style={styles.boldText}>To:</Text>
                  </Text>
                  <Text style={[styles.requestText, { fontSize: 14, textAlign: 'center', marginBottom: 4 }]}>
                    {request.to === 'current' ? 'Pocket Money' :
                      request.to === 'save' ? 'Savings Pot' :
                        request.to === 'spend' ? 'Spending Pot' :
                          request.to === 'donate' ? 'Help Others Pot' :
                            request.to === 'invest' ? 'Grow Money Pot' : request.to}
                  </Text>
                  <Text style={[styles.requestText, {
                    fontSize: 14,
                    textAlign: 'center',
                    color: themeColors.success,
                    fontWeight: 'bold'
                  }]}>
                    {request.toBalance} → {request.toBalance + request.amount}
                  </Text>
                </View>
              </View>

              {/* Educational Note for Balance Management */}
              {(() => {
                const newBalance = request.fromBalance - request.amount;
                if (newBalance < 0 || newBalance < request.fromBalance * 0.2) {
                  return (
                    <Text style={[styles.requestText, {
                      fontSize: 12,
                      fontStyle: 'italic',
                      color: themeColors.textSecondary,
                      textAlign: 'center',
                      marginTop: 8,
                      paddingHorizontal: 8
                    }]}>
                      💡 Maintaining healthy jar balances teaches responsible money management!
                    </Text>
                  );
                }
                return null;
              })()}

              {/* Quick Action Buttons - Only show for pending requests */}
              {request.status === 'Pending' && (
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'center',
                  marginTop: 12,
                  paddingTop: 12,
                  borderTopWidth: 1,
                  borderTopColor: themeColors.border + '40'
                }}>
                  <TouchableOpacity
                    style={[{
                      backgroundColor: themeColors.success,
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      borderRadius: 6,
                      marginHorizontal: 4,
                      minWidth: 80,
                      alignItems: 'center'
                    }]}
                    onPress={() => setApprovalModal({ visible: true, request, approved: true, comment: '' })}
                  >
                    <Text style={{ color: themeColors.card, fontWeight: '600', fontSize: 14 }}>✓ Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[{
                      backgroundColor: themeColors.error,
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      borderRadius: 6,
                      marginHorizontal: 4,
                      minWidth: 80,
                      alignItems: 'center'
                    }]}
                    onPress={() => setApprovalModal({ visible: true, request, approved: false, comment: '' })}
                  >
                    <Text style={{ color: themeColors.card, fontWeight: '600', fontSize: 14 }}>✗ Deny</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          <Text style={[styles.requestText, { marginTop: 12 }]}>
            <Text style={styles.boldText}>Submitted:</Text> {formatDateTime(request.createdAt)}
          </Text>
        </View>
      ) : (
        <>
          <Text style={styles.requestText}>
            <Text style={styles.boldText}>Request:</Text> {request.name}
          </Text>
          {request.amount && (
            <Text style={styles.requestText}>
              <Text style={styles.boldText}>Amount:</Text> {request.amount} points
            </Text>
          )}

          {/* Available Balance Context for Financial Requests */}
          {(request.type === 'donation' || request.type === 'reward' || request.type === 'goal-completion') && request.amount && (
            <View style={{
              backgroundColor: themeColors.surface + '80',
              borderRadius: 8,
              padding: 10,
              marginTop: 8,
              borderWidth: 1,
              borderColor: themeColors.border
            }}>
              <Text style={{
                fontSize: 14,
                fontWeight: 'bold',
                color: themeColors.primary,
                textAlign: 'center',
                marginBottom: 6
              }}>
                💰 Available Balance Check
              </Text>
              <Text style={{
                fontSize: 13,
                color: themeColors.textSecondary,
                textAlign: 'center',
                fontStyle: 'italic'
              }}>
                This request requires {request.amount} points. Check your child's available balance before approving.
              </Text>
            </View>
          )}

          {request.reason && (
            <View>
              <Text style={styles.requestText}>
                <Text style={styles.boldText}>Details:</Text> {request.type === 'chore' && request.reason ? request.reason.replace(/^I completed the chore:\s*/i, `${request.childName || 'Child'} completed chore: `) : request.reason}
              </Text>
              <Text style={styles.requestText}>
                <Text style={styles.boldText}>Submitted:</Text> {formatDateTime(request.createdAt)}
              </Text>
            </View>
          )}
        </>
      )}
      {/* Messages */}
      {(request.messages && request.messages.length > 0) || request.status === 'Pending' ? (
        <View style={styles.messagesContainer}>
          <Text style={[styles.sectionTitle, { fontSize: 16, marginBottom: 8 }]}>Messages:</Text>
          {request.messages && request.messages.length > 0 ? (
            request.messages.map(
              (
                msg: {
                  id?: string | number;
                  sender: string;
                  userId: string;
                  text: string;
                  timestamp: string;
                },
                index: number
              ) => (
                <View
                  key={
                    msg.id
                      ? msg.id
                      : `${msg.timestamp}-${msg.sender}-${msg.userId}-${index}`
                  }
                  style={[
                    styles.messageBubble,
                    msg.sender === 'child' ? styles.childMessage : styles.parentMessage
                  ]}
                >
                  <Text style={[styles.messageText, { color: themeColors.text }]}>{msg.text}</Text>
                  <Text style={[styles.messageTime, { color: themeColors.textSecondary }]}>
                    {new Date(msg.timestamp).toLocaleDateString()} {new Date(msg.timestamp).toLocaleTimeString()}
                  </Text>
                </View>
              )
            )
          ) : (
            <Text style={[styles.messageText, { fontStyle: 'italic', color: themeColors.textSecondary }]}>
              No messages yet. Start a conversation!
            </Text>
          )}

          {/* Message Input */}
          <View style={styles.messageInputContainer}>
            <TextInput
              style={[styles.messageInput, { backgroundColor: themeColors.surface, color: themeColors.text }]}
              placeholder="Type your message..."
              placeholderTextColor={themeColors.textSecondary}
              value={approvalModal.comment}
              onChangeText={(text) => setApprovalModal(prev => ({ ...prev, comment: text }))}
              multiline={true}
              maxLength={500}
            />
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Send message"
              accessibilityHint="Send message to child about this request"
              style={[styles.sendButton, { backgroundColor: themeColors.primary }]}
              onPress={async () => {
                if (!approvalModal.comment.trim()) return;

                try {
                  const token = await getAuthToken();
                  if (!token) {
                    showMessage('Not authenticated. Please login again.', 'error');
                    return;
                  }
                  const response = await fetch(`${API_URL}/requests/${request._id}/messages`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                      text: approvalModal.comment.trim(),
                    }),
                  });
                  if (!response.ok) throw new Error('Failed to send message');
                  const newMessage = await response.json();
                  setRequests(prev =>
                    prev.map(req =>
                      req._id === request._id
                        ? { ...req, messages: [...(req.messages || []), newMessage.newMessage] }
                        : req
                    )
                  );
                  setApprovalModal(prev => ({ ...prev, comment: '' }));
                  loadRequests({ page: 1, reset: true });
                } catch (error) {
                  showMessage('Failed to send message. Please try again.', 'error');
                }
              }}
            >
              <Text style={{ color: themeColors.card, fontWeight: '600', fontSize: 14 }}>Send</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {request.status === 'Pending' ? (
        <View style={styles.quickActionsContainer}>
          <View style={styles.quickActionRow}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={`Quick approve: ${request.name}`}
              accessibilityHint="Approve this request instantly"
              style={[styles.quickActionBtn, { backgroundColor: themeColors.success }]}
              onPress={() => setApprovalModal({ visible: true, request, approved: true, comment: '' })}
            >
              <Text style={styles.quickActionEmoji}>✅</Text>
              <Text style={styles.quickActionText}>Approve</Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={`Quick deny: ${request.name}`}
              accessibilityHint="Deny this request"
              style={[styles.quickActionBtn, { backgroundColor: themeColors.error }]}
              onPress={() => setApprovalModal({ visible: true, request, approved: false, comment: '' })}
            >
              <Text style={styles.quickActionEmoji}>❌</Text>
              <Text style={styles.quickActionText}>Deny</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.statusContainer}>
          <Text style={[styles.statusBadge, {
            backgroundColor:
              request.status === 'Approved' ? themeColors.success + '20' :
                request.status === 'Denied' ? themeColors.error + '20' : themeColors.surface,
            color:
              request.status === 'Approved' ? themeColors.success :
                request.status === 'Denied' ? themeColors.error : themeColors.textSecondary,
          }]}>
            {request.status === 'Approved' ? '✅' : request.status === 'Denied' ? '❌' : '⏳'} {request.status}
          </Text>
          <Text style={[styles.timestampText, { color: themeColors.textSecondary }]}>
            {formatDateTime(request.updatedAt || request.createdAt)}
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: themeColors.background }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: 520, marginBottom: 22, marginTop: 6, alignSelf: 'center' }}>
        <BackButton label="Back to Home" to="/(parents-tabs)" />
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Refresh requests list"
            accessibilityHint="Reload latest requests and update status"
            accessibilityState={{ disabled: pagination.refreshing }}
            style={{
              backgroundColor: themeColors.secondary,
              borderRadius: 20,
              width: 40,
              height: 40,
              justifyContent: 'center',
              alignItems: 'center',
              elevation: 1,
              marginRight: 8,
            }}
            onPress={onRefresh}
            disabled={pagination.refreshing}
          >
            <Text style={{ fontSize: 16, color: themeColors.card }}>
              {pagination.refreshing ? '⏳' : '↻'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Help and information"
            accessibilityHint="Open help guide for managing child requests"
            style={{
              backgroundColor: themeColors.accent,
              borderRadius: 20,
              width: 40,
              height: 40,
              justifyContent: 'center',
              alignItems: 'center',
              elevation: 1,
            }}
            onPress={() => setHelpModalVisible(true)}
          >
            <Text style={{ color: themeColors.card, fontSize: 16 }}>❓</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.title}>Child's Requests</Text>

      {/* Search and Filter Section */}
      <View style={styles.sectionCard}>
        <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>Find Requests</Text>
        <TextInput
          accessibilityLabel="Search requests"
          accessibilityHint="Search by request type or content"
          style={[styles.searchInput, { backgroundColor: themeColors.surface, color: themeColors.text, borderColor: themeColors.border }]}
          placeholder="Search by request type or content..."
          placeholderTextColor={themeColors.textSecondary}
          value={pagination.searchQuery}
          onChangeText={(text) => {
            setPagination((prev) => ({ ...prev, searchQuery: text }));
            // Debounce search calls, simplified here
            setTimeout(() => loadRequests({ page: 1, reset: true, searchQuery: text }), 300);
          }}
        />

        <View style={styles.filterChips}>
          <TouchableOpacity
            accessibilityRole="tab"
            accessibilityLabel="Pending requests filter"
            accessibilityHint="Show requests waiting for approval"
            accessibilityState={{ selected: pagination.filter === 'pending' }}
            style={[styles.chip, { backgroundColor: pagination.filter === 'pending' ? themeColors.primary : themeColors.surface }]}
            onPress={() => handleFilterChange('pending')}
          >
            <Text style={[styles.chipText, { color: pagination.filter === 'pending' ? themeColors.card : themeColors.text }]}>
              🕐 Pending ({requestCounts.pending})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="tab"
            accessibilityLabel="Approved requests filter"
            accessibilityHint="Show requests that have been approved"
            accessibilityState={{ selected: pagination.filter === 'approved' }}
            style={[styles.chip, { backgroundColor: pagination.filter === 'approved' ? themeColors.success : themeColors.surface }]}
            onPress={() => handleFilterChange('approved')}
          >
            <Text style={[styles.chipText, { color: pagination.filter === 'approved' ? themeColors.card : themeColors.text }]}>
              ✅ Approved ({requestCounts.approved})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="tab"
            accessibilityLabel="Denied requests filter"
            accessibilityHint="Show requests that have been denied"
            accessibilityState={{ selected: pagination.filter === 'denied' }}
            style={[styles.chip, { backgroundColor: pagination.filter === 'denied' ? themeColors.error : themeColors.surface }]}
            onPress={() => handleFilterChange('denied')}
          >
            <Text style={[styles.chipText, { color: pagination.filter === 'denied' ? themeColors.card : themeColors.text }]}>
              ❌ Denied ({requestCounts.denied})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Pull-to-refresh and FlatList for Requests */}
<FlatList
        data={displayedRequests}
        keyExtractor={(item, index) => `${item._id}-${index}`}
        renderItem={renderRequestCard}
        contentContainerStyle={{ paddingBottom: 50 }}
        refreshControl={
          <RefreshControl refreshing={pagination.refreshing} onRefresh={onRefresh} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        initialNumToRender={20}
        maxToRenderPerBatch={10}
        windowSize={10}
        getItemLayout={(_, index) => ({ length: 280, offset: 280 * index, index })} // Approx height
        ListFooterComponent={
          pagination.loadingMore ? (
            <ActivityIndicator style={{ marginVertical: 18 }} />
          ) : null
        }
        ListEmptyComponent={
          pagination.loading ? (
            <ActivityIndicator style={{ margin: 48 }} />
          ) : (
            <View style={[styles.sectionCard, { alignSelf: 'center', width: '97%', maxWidth: 520, minWidth: 320 }]}>
              <Text style={styles.placeholder}>
                {pagination.filter === "approved"
                  ? "No approved requests in the past 90 days."
                  : pagination.filter === "denied"
                    ? "No denied requests in the past 90 days."
                    : pagination.searchQuery ? `No ${pagination.filter.toLowerCase()} requests match "${pagination.searchQuery}".` : `No ${pagination.filter.toLowerCase()} requests.`}
              </Text>
            </View>
          )
        }
      />



      <Modal
        visible={approvalModal.visible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setApprovalModal({ visible: false, request: null, approved: false, comment: '' })}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {approvalModal.approved ? 'Approve' : 'Deny'} Request
            </Text>
            {approvalModal.request && (
              <View style={styles.modalRequestSummary}>
                <Text style={styles.modalRequestText}>
                  <Text style={styles.boldText}>Child:</Text> {approvalModal.request.childName}
                </Text>
                <Text style={styles.modalRequestText}>
                  <Text style={styles.boldText}>Request:</Text> {approvalModal.request.name}
                </Text>
                {approvalModal.request.amount && (
                  <Text style={styles.modalRequestText}>
                    <Text style={styles.boldText}>Amount:</Text> {approvalModal.request.amount} points
                  </Text>
                )}
                {approvalModal.request.type === 'move-points' && approvalModal.request.fromBalance !== undefined && approvalModal.request.toBalance !== undefined && (
                  <View style={{ marginTop: 12, padding: 10, backgroundColor: '#f0f8ff', borderRadius: 8 }}>
                    <Text style={[styles.modalRequestText, { fontWeight: 'bold', marginBottom: 8, textAlign: 'center' }]}>
                      Before & After Summary
                    </Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.modalRequestText, { fontSize: 14, textAlign: 'center' }]}>
                          <Text style={styles.boldText}>From: </Text>
                          {approvalModal.request.from === 'current' ? 'Pocket Money' :
                            approvalModal.request.from === 'save' ? 'Savings Pot' :
                              approvalModal.request.from === 'spend' ? 'Spending Pot' :
                                approvalModal.request.from === 'donate' ? 'Help Others Pot' :
                                  approvalModal.request.from === 'invest' ? 'Grow Money Pot' : approvalModal.request.from}
                        </Text>
                        <Text style={[styles.modalRequestText, { fontSize: 14, textAlign: 'center', color: '#d32f2f' }]}>
                          {approvalModal.request.fromBalance} → {approvalModal.request.fromBalance - approvalModal.request.amount}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.modalRequestText, { fontSize: 14, textAlign: 'center' }]}>
                          <Text style={styles.boldText}>To: </Text>
                          {approvalModal.request.to === 'current' ? 'Pocket Money' :
                            approvalModal.request.to === 'save' ? 'Savings Pot' :
                              approvalModal.request.to === 'spend' ? 'Spending Pot' :
                                approvalModal.request.to === 'donate' ? 'Help Others Pot' :
                                  approvalModal.request.to === 'invest' ? 'Grow Money Pot' : approvalModal.request.to}
                        </Text>
                        <Text style={[styles.modalRequestText, { fontSize: 14, textAlign: 'center', color: '#2e7d32' }]}>
                          {approvalModal.request.toBalance} → {approvalModal.request.toBalance + approvalModal.request.amount}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            )}
            <Text style={styles.modalLabel}>Add a Note (Optional):</Text>
            <TextInput
              style={[styles.commentInput, { color: themeColors.text }]}
              placeholder="Add a note for your child..."
              placeholderTextColor={themeColors.textSecondary}
              value={approvalModal.comment}
              onChangeText={(text) => setApprovalModal(prev => ({ ...prev, comment: text }))}
              multiline={true}
              numberOfLines={3}
              maxLength={200}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Cancel approval"
                accessibilityHint="Close modal without making changes"
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setApprovalModal({ visible: false, request: null, approved: false, comment: '' })}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={`${approvalModal.approved ? 'Approve' : 'Deny'} request`}
                accessibilityHint={`${approvalModal.approved ? 'Approve' : 'Deny'} the request and send notification to child`}
                style={[styles.modalBtn, approvalModal.approved ? styles.approveBtn : styles.denyBtn]}
                onPress={handleApproval}
              >
                <Text style={styles.modalBtnText}>
                  {approvalModal.approved ? 'Approve' : 'Deny'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Help Modal */}
      <HelpModal
        visible={helpModalVisible}
        onClose={() => setHelpModalVisible(false)}
        title="📝 Parent Requests - Help"
        tabs={[
          {
            title: "Managing Requests",
            content: [
              {
                type: "text",
                text: "This is where you review and approve your child's requests for rewards, point transfers, and special permissions.",
                icon: "👨‍👩‍👧‍👦"
              },
              {
                type: "bullet",
                text: "Requests appear when your child asks for something that needs approval"
              },
              {
                type: "bullet",
                text: "You can approve or deny each request with optional notes"
              },
              {
                type: "bullet",
                text: "Approved requests are automatically processed"
              },
              {
                type: "highlight",
                text: "Use requests to teach children about decision-making and responsibility!",
                icon: "🧠"
              }
            ]
          },
          {
            title: "Request Types",
            content: [
              {
                type: "text",
                text: "Different types of requests your child might make:",
                icon: "📋"
              },
              {
                type: "bullet",
                text: "Reward Purchase - Buying items from the rewards store"
              },
              {
                type: "bullet",
                text: "Point Transfer - Moving points between money pots"
              },
              {
                type: "bullet",
                text: "Chore Completion - Claiming points for finished tasks"
              },
              {
                type: "bullet",
                text: "Special Permissions - Extra privileges or exceptions"
              },
              {
                type: "highlight",
                text: "Each request helps your child learn different money skills!",
                icon: "🎓"
              }
            ]
          },
          {
            title: "Approval Process",
            content: [
              {
                type: "text",
                text: "How to handle pending requests:",
                icon: "✅"
              },
              {
                type: "bullet",
                text: "Review the request details and child's reason"
              },
              {
                type: "bullet",
                text: "Tap Approve or Deny button"
              },
              {
                type: "bullet",
                text: "Add an optional note explaining your decision"
              },
              {
                type: "bullet",
                text: "The child will receive a notification about your decision"
              },
              {
                type: "highlight",
                text: "Use notes to teach and guide your child's understanding!",
                icon: "💬"
              }
            ]
          },
          {
            title: "Filtering & Organization",
            content: [
              {
                type: "text",
                text: "Keep track of requests with filters:",
                icon: "🔍"
              },
              {
                type: "bullet",
                text: "Pending - New requests waiting for your decision"
              },
              {
                type: "bullet",
                text: "Approved - Requests you've approved (last 90 days)"
              },
              {
                type: "bullet",
                text: "Denied - Requests you've denied (last 90 days)"
              },
              {
                type: "bullet",
                text: "All - View everything together"
              },
              {
                type: "highlight",
                text: "Check Pending regularly to stay on top of your child's requests!",
                icon: "⏰"
              }
            ]
          },
          {
            title: "Message Threads",
            content: [
              {
                type: "text",
                text: "Some requests include conversation threads:",
                icon: "💭"
              },
              {
                type: "bullet",
                text: "Child's original message explaining their request"
              },
                {
                type: "bullet",
                text: "Your approval/denial notes"
              },
              {
                type: "bullet",
                text: "Back-and-forth communication about the request"
              },
              {
                type: "highlight",
                text: "Use messages to discuss decisions and teach valuable lessons!",
                icon: "📚"
              }
            ]
          }
        ]}
      />
    </View>
  );
}

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
  approveBtn: { backgroundColor: themeColors.success },
  approveBtnText: { color: themeColors.card, fontWeight: '600', fontSize: 16 },
  denyBtn: { backgroundColor: themeColors.error },
  denyBtnText: { color: themeColors.card, fontWeight: '600', fontSize: 16 },
  feedbackCard: { backgroundColor: themeColors.success + '22', borderRadius: 8, padding: 12, marginTop: 10, minWidth: 320, width: '97%', maxWidth: 520 },
  feedbackText: { color: themeColors.success, fontSize: 16, fontWeight: '600', textAlign: 'center' },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 2 },
  filterBtn: { backgroundColor: themeColors.surface, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, margin: 4, minWidth: 80, alignItems: 'center' },
  filterBtnActive: { backgroundColor: themeColors.primary },
  filterBtnText: { color: themeColors.text, fontSize: 14, fontWeight: '600' },
  filterBtnTextActive: { color: themeColors.card },
  searchInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: themeColors.surface,
    borderColor: themeColors.border,
    color: themeColors.text,
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 1,
    backgroundColor: themeColors.surface,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    color: themeColors.text,
  },
  messagesContainer: { marginTop: 12, marginBottom: 8 },
  messageBubble: { padding: 10, borderRadius: 12, marginBottom: 8, maxWidth: '80%' },
  childMessage: { backgroundColor: themeColors.surface, alignSelf: 'flex-start' },
  parentMessage: { backgroundColor: themeColors.secondary, alignSelf: 'flex-end' },
  messageText: { fontSize: 14, color: themeColors.text },
  messageTime: { fontSize: 10, color: themeColors.textSecondary, marginTop: 4, textAlign: 'right' },
  modalOverlay: { flex: 1, backgroundColor: themeColors.overlay || 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: themeColors.card, borderRadius: 16, padding: 20, width: '90%', maxWidth: 400 },
  modalTitle: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 16, color: themeColors.primary },
  modalRequestSummary: { backgroundColor: themeColors.surface, padding: 12, borderRadius: 8, marginBottom: 16 },
  modalRequestText: { fontSize: 16, marginBottom: 6, color: themeColors.text },
  modalLabel: { fontSize: 16, fontWeight: '600', marginBottom: 8, color: themeColors.text },
  commentInput: { borderWidth: 1, borderColor: themeColors.border, borderRadius: 8, padding: 12, minHeight: 80, textAlignVertical: 'top', marginBottom: 16, backgroundColor: themeColors.surface, color: themeColors.text },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  modalBtn: { flex: 1, padding: 12, borderRadius: 8, marginHorizontal: 4, alignItems: 'center' },
  modalBtnText: { color: themeColors.card, fontWeight: '600', fontSize: 16 },
  cancelBtn: { backgroundColor: themeColors.surface, borderWidth: 1, borderColor: themeColors.border },
  cancelBtnText: { color: themeColors.text, fontWeight: '600' },
  messageInputContainer: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 8, gap: 8 },
  messageInput: { flex: 1, borderWidth: 1, borderColor: themeColors.border, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 16, maxHeight: 100, textAlignVertical: 'top', backgroundColor: themeColors.surface, color: themeColors.text },
  sendButton: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, minWidth: 60, alignItems: 'center', backgroundColor: themeColors.primary },
  sendButtonText: { color: themeColors.card, fontWeight: '600', fontSize: 14 },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
    color: themeColors.error,
  },
  errorMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
    color: themeColors.text,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
    backgroundColor: themeColors.primary,
  },
  retryButtonText: {
    color: themeColors.card,
    fontSize: 16,
    fontWeight: '600',
  },
  childNameBadge: {
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  // Quick actions for pending requests
  quickActionsContainer: {
    marginTop: 12,
  },
  quickActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  quickActionBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    alignItems: 'center',
    elevation: 2,
  },
  quickActionEmoji: {
    fontSize: 18,
    marginBottom: 4,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  messageActionBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    alignSelf: 'center',
    elevation: 1,
  },
  messageActionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Status display for approved/denied requests
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  timestampText: {
    fontSize: 12,
    color: themeColors.textSecondary,
  },
});
