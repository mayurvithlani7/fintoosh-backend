import BackButton from '@/components/BackButton';
import HelpModal from '@/components/HelpModal';
import { API_URL } from '@/utils/config';
import { getAuthToken } from '@/utils/secureStorage';
import { useTheme } from '@/utils/themeContext';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Modal, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function ParentsRequestsScreen() {
  const router = useRouter();
  const { themeColors } = useTheme();
  const [requests, setRequests] = useState<{
    id: string;
    childName: string;
    type: string;
    name: string;
    amount?: number;
    reason?: string;
    status: string;
    createdAt: string;
    messages?: {
      sender: string;
      userId: string;
      text: string;
      timestamp: string;
    }[];
  }[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [approvalModal, setApprovalModal] = useState<{
    visible: boolean;
    request: any;
    approved: boolean;
    comment: string;
  }>({ visible: false, request: null, approved: false, comment: '' });
  const [helpModalVisible, setHelpModalVisible] = useState(false);

  useEffect(() => {
    loadRequests();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadRequests();
    }, [])
  );

  const loadRequests = async () => {
    try {
      const token = await getAuthToken();
      if (!token) {
        Alert.alert('Error', 'Not authenticated. Please login again.');
        return;
      }

      const response = await fetch(`${API_URL}/requests`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        // Handle rate limiting specifically
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const waitTime = retryAfter ? parseInt(retryAfter) : 60;
          throw new Error(`Too many requests. Please wait ${waitTime} seconds before trying again.`);
        }
        throw new Error('Failed to load requests');
      }

      const requestsData = await response.json();

      // Transform the data for display
      const transformedRequests = requestsData.map((req: any) => ({
        id: req._id || req.id,
        childName: req.userName || 'Unknown Child',
        type: req.type,
        name: req.name,
        amount: req.amount,
        reason: req.reason,
        status: req.status,
        createdAt: req.createdAt,
        messages: req.messages || [],
        // Include balance fields for Inter-Jar Requests and Approvals
        fromBalance: req.fromBalance,
        toBalance: req.toBalance,
        from: req.from,
        to: req.to
      }));

      setRequests(transformedRequests);
    } catch (error) {
      console.error('Error loading requests:', error);
      // Check if it's a rate limiting error with specific message
      if (error instanceof Error && error.message.includes('Too many requests')) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert('Error', 'Failed to load requests. Please try again.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadRequests();
  }, []);

  const handleApproval = async () => {
    if (!approvalModal.request) return;

    try {
      const token = await getAuthToken();
      if (!token) {
        Alert.alert('Error', 'Not authenticated. Please login again.');
        return;
      }

      const body: any = {
        status: approvalModal.approved ? 'Approved' : 'Denied'
      };

      if (approvalModal.comment.trim()) {
        body.parentComment = approvalModal.comment.trim();
      }

    

      const response = await fetch(`${API_URL}/requests/${approvalModal.request.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        // Handle rate limiting specifically
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const waitTime = retryAfter ? parseInt(retryAfter) : 60;
          throw new Error(`Too many requests. Please wait ${waitTime} seconds before trying again.`);
        }
        // Handle other errors
        let errorMessage = 'Failed to update request';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          // If JSON parsing fails, use default message
        }
        throw new Error(errorMessage);
      }

      // Update local state
      setRequests(prev =>
        prev.map(req =>
          req.id === approvalModal.request.id
            ? { ...req, status: approvalModal.approved ? 'Approved' : 'Denied' }
            : req
        )
      );

      setFeedback(`Request ${approvalModal.approved ? 'approved' : 'denied'}.`);
      setApprovalModal({ visible: false, request: null, approved: false, comment: '' });

      // Refresh after a short delay to show updated data
      setTimeout(() => {
        loadRequests();
        setFeedback('');
      }, 2000);

    } catch (error) {
      console.error('Error updating request:', error);
      setFeedback('Failed to update request. Please try again.');
      setTimeout(() => setFeedback(''), 3000);
    }
  };

  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'denied'>('pending');

  // State for showing archived requests
  const [showArchived, setShowArchived] = useState(false);

  const now = new Date();
  const ninetyDaysAgo = new Date(now);
  ninetyDaysAgo.setDate(now.getDate() - 90);

  // Filtering with 90-day default for approved/denied
  let baseRequests: typeof requests = [];
  let showArchiveButton = false;
  if (filter === "approved" || filter === "denied") {
    const statusLabel = filter === "approved" ? "Approved" : "Denied";
    const recent = requests.filter(r => r.status === statusLabel && new Date(r.createdAt) >= ninetyDaysAgo);
    const archived = requests.filter(r => r.status === statusLabel && new Date(r.createdAt) < ninetyDaysAgo);
    baseRequests = recent;
    showArchiveButton = archived.length > 0;
    if (showArchived) {
      baseRequests = [...recent, ...archived].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  } else {
    baseRequests = requests.filter(req => {
      switch (filter) {
        case 'pending': return req.status === 'Pending';
        case 'all': return true;
        default: return req.status === 'Pending';
      }
    });
  }
  const filteredRequests = baseRequests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <ScrollView
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
            borderRadius: 20,
            paddingHorizontal: 12,
            paddingVertical: 6,
            elevation: 2,
          }}
          onPress={() => setHelpModalVisible(true)}
        >
          <Text style={{ color: themeColors.card, fontWeight: 'bold', fontSize: 14 }}>❓ Help</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.title}>Child's Requests</Text>

      {/* Filter Buttons */}
      <View style={styles.sectionCard}>
<Text style={[styles.sectionTitle, { marginBottom: 6 }]}>Sort Requests</Text>
        <View style={styles.filterRow}>
          {[
            { key: 'pending', label: 'Pending', count: requests.filter(r => r.status === 'Pending').length },
            { key: 'approved', label: 'Approved', count: requests.filter(r => r.status === 'Approved').length },
            { key: 'denied', label: 'Denied', count: requests.filter(r => r.status === 'Denied').length },
            { key: 'all', label: 'All', count: requests.length }
          ].map(({ key, label, count }) => (
            <TouchableOpacity
              key={key}
              style={[styles.filterBtn, { backgroundColor: filter === key ? themeColors.secondary : themeColors.surface }, filter === key && styles.filterBtnActive]}
              onPress={() => setFilter(key as any)}
            >
              <Text style={[styles.filterBtnText, { color: filter === key ? themeColors.card : themeColors.text }]}>
                {label} ({count})
              </Text>
            </TouchableOpacity>
          ))}
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
            {refreshing ? 'Refreshing...' : '🔄 Check for New Requests'}
          </Text>
        </TouchableOpacity>
      </View>

      {filteredRequests.length === 0 ? (
        <View style={styles.sectionCard}>
          <Text style={styles.placeholder}>
            {filter === "approved"
              ? showArchived
                ? "No approved requests found."
                : "No approved requests in the past 90 days."
              : filter === "denied"
                ? showArchived
                  ? "No denied requests found."
                  : "No denied requests in the past 90 days."
                : `No ${filter === 'all' ? '' : filter.toLowerCase() + ' '}requests.`}
          </Text>
        </View>
      ) : (
        <>
          {filteredRequests.map((request: any) => (
            <View key={request.id} style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>{request.type} Request</Text>
              <Text style={styles.requestText}>
                <Text style={styles.boldText}>Child:</Text> {request.childName}
              </Text>
              <Text style={styles.requestText}>
                <Text style={styles.boldText}>Request:</Text> {request.name}
              </Text>
              {request.amount && (
                <Text style={styles.requestText}>
                  <Text style={styles.boldText}>Amount:</Text> {request.amount} points
                </Text>
              )}
              {request.reason && (
                <View>
                  <Text style={styles.requestText}>
                    <Text style={styles.boldText}>Reason:</Text> {request.reason}
                  </Text>
                  <Text style={styles.requestText}>
                    <Text style={styles.boldText}>Date & Time:</Text> {new Date(request.createdAt).toLocaleDateString()} at {new Date(request.createdAt).toLocaleTimeString()}
                  </Text>
                </View>
              )}
              {/* Message Thread */}
              {(request.messages && request.messages.length > 0) || request.status === 'Pending' ? (
                <View style={styles.messagesContainer}>
                  <Text style={[styles.sectionTitle, { fontSize: 16, marginBottom: 8 }]}>Messages:</Text>
                  {request.messages && request.messages.length > 0 ? (
                    request.messages.map(
                      (
                        msg: {
                          sender: string;
                          userId: string;
                          text: string;
                          timestamp: string;
                        },
                        index: number
                      ) => (
                        <View key={index} style={[
                          styles.messageBubble,
                          msg.sender === 'child' ? styles.childMessage : styles.parentMessage
                        ]}>
                          <Text style={[styles.messageText, { color: themeColors.text }]}>{msg.text}</Text>
                          <Text style={[styles.messageTime, { color: themeColors.textSecondary }]}>
                            {new Date(msg.timestamp).toLocaleDateString()} {new Date(msg.timestamp).toLocaleTimeString()}
                          </Text>
                        </View>
                      )
                    )
                  ) : (
                    <Text style={[styles.messageText, { fontStyle: 'italic', color: themeColors.textSecondary }]}>No messages yet. Start a conversation!</Text>
                  )}

                  {/* Message Input */}
                  <View style={styles.messageInputContainer}>
                    <TextInput
                      style={[styles.messageInput, { backgroundColor: themeColors.surface, color: themeColors.text }]}
                      placeholder="Type your message..."
                      placeholderTextColor={themeColors.textSecondary}
                      value={approvalModal.comment} // Reusing the comment state for simplicity
                      onChangeText={(text) => setApprovalModal(prev => ({ ...prev, comment: text }))}
                      multiline={true}
                      maxLength={500}
                    />
                    <TouchableOpacity
                      style={[styles.sendButton, { backgroundColor: themeColors.primary }]}
                      onPress={async () => {
                        if (!approvalModal.comment.trim()) return;

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
                            body: JSON.stringify({
                              text: approvalModal.comment.trim(),
                            }),
                          });

                          if (!response.ok) {
                            throw new Error('Failed to send message');
                          }

                          // Update local state to show the new message
                          const newMessage = await response.json();
                          setRequests(prev =>
                            prev.map(req =>
                              req.id === request.id
                                ? { ...req, messages: [...(req.messages || []), newMessage.newMessage] }
                                : req
                            )
                          );

                          // Clear the input
                          setApprovalModal(prev => ({ ...prev, comment: '' }));

                          // Refresh to get updated data
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
              ) : null}

              {request.status === 'Pending' ? (
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: themeColors.success }]}
                    onPress={() => setApprovalModal({ visible: true, request, approved: true, comment: '' })}
                  >
                    <Text style={{ color: themeColors.card, fontWeight: '600', fontSize: 16 }}>Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: themeColors.error }]}
                    onPress={() => setApprovalModal({ visible: true, request, approved: false, comment: '' })}
                  >
                    <Text style={{ color: themeColors.card, fontWeight: '600', fontSize: 16 }}>Deny</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Text
                  style={{
                    marginTop: 10,
                    fontWeight: 'bold',
                    color:
                      request.status === 'Approved' ? themeColors.success :
                        request.status === 'Denied' ? themeColors.error : themeColors.textSecondary,
                    fontSize: 15,
                    textAlign: 'right'
                  }}
                >
                  Status: {request.status}
                </Text>
              )}
            </View>
          ))}
          {/* Archive toggle */}
          {(filter === "approved" || filter === "denied") && showArchiveButton && !showArchived && (
            <TouchableOpacity
              style={{
                marginTop: 12,
                alignSelf: 'center',
                backgroundColor: themeColors.accent + "22",
                paddingHorizontal: 20,
                paddingVertical: 8,
                borderRadius: 16
              }}
              onPress={() => setShowArchived(true)}
            >
              <Text style={{ color: themeColors.primary, fontWeight: '600' }}>
                Show All {filter === "approved" ? "Approved" : "Denied"} Requests
              </Text>
            </TouchableOpacity>
          )}
          {(filter === "approved" || filter === "denied") && showArchiveButton && showArchived && (
            <TouchableOpacity
              style={{
                marginTop: 10,
                alignSelf: 'center',
                backgroundColor: themeColors.surface,
                paddingHorizontal: 14,
                paddingVertical: 7,
                borderRadius: 16
              }}
              onPress={() => setShowArchived(false)}
            >
              <Text style={{ color: themeColors.primary, fontWeight: '500' }}>
                Show Only Last 90 Days
              </Text>
            </TouchableOpacity>
          )}
        </>
      )}

      {feedback ? (
        <View style={[styles.feedbackCard, { backgroundColor: themeColors.secondary + "22" }]}>
          <Text style={[styles.feedbackText, { color: themeColors.secondary }]}>{feedback}</Text>
        </View>
      ) : null}

      {/* Approval Modal */}
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

                {/* Before & After Summary for move-points requests */}
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

            <Text style={styles.modalLabel}>
              Add a Note (Optional):
            </Text>
            <TextInput
              style={styles.commentInput}
              placeholder="Add a note for your child..."
              value={approvalModal.comment}
              onChangeText={(text) => setApprovalModal(prev => ({ ...prev, comment: text }))}
              multiline={true}
              numberOfLines={3}
              maxLength={200}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setApprovalModal({ visible: false, request: null, approved: false, comment: '' })}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { backgroundColor: '#f7fafd' },
  container: { alignItems: 'center', paddingVertical: 12, paddingHorizontal: 6 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 22, marginTop: 6, color: '#194476' },
  sectionCard: { backgroundColor: '#fff', borderRadius: 16, marginBottom: 16, padding: 16, minWidth: 320, width: '97%', maxWidth: 520, elevation: 3, shadowColor: '#aaa' },
  sectionTitle: { fontSize: 20, fontWeight: '600', marginBottom: 12, color: '#226' },
  placeholder: { color: '#999', fontStyle: 'italic', fontSize: 15, textAlign: 'center', paddingVertical: 20 },
  requestText: { fontSize: 16, marginBottom: 8, color: '#234' },
  boldText: { fontWeight: '600', color: '#226' },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  actionBtn: { flex: 1, padding: 12, borderRadius: 8, marginHorizontal: 4, alignItems: 'center' },
  actionBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  approveBtn: { backgroundColor: '#4CAF50' },
  approveBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  denyBtn: { backgroundColor: '#f44336' },
  denyBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  feedbackCard: { backgroundColor: '#e8f5e8', borderRadius: 8, padding: 12, marginTop: 10, minWidth: 320, width: '97%', maxWidth: 520 },
  feedbackText: { color: '#2e7d32', fontSize: 16, fontWeight: '600', textAlign: 'center' },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 2 },
  filterBtn: { backgroundColor: '#f0f0f0', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, margin: 4, minWidth: 80, alignItems: 'center' },
  filterBtnActive: { backgroundColor: '#4CAF50' },
  filterBtnText: { color: '#666', fontSize: 14, fontWeight: '600' },
  filterBtnTextActive: { color: '#fff' },
  messagesContainer: { marginTop: 12, marginBottom: 8 },
  messageBubble: { padding: 10, borderRadius: 12, marginBottom: 8, maxWidth: '80%' },
  childMessage: { backgroundColor: '#e3f2fd', alignSelf: 'flex-start' },
  parentMessage: { backgroundColor: '#f3e5f5', alignSelf: 'flex-end' },
  messageText: { fontSize: 14, color: '#333' },
  messageTime: { fontSize: 10, color: '#666', marginTop: 4, textAlign: 'right' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 16, padding: 20, width: '90%', maxWidth: 400 },
  modalTitle: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 16, color: '#194476' },
  modalRequestSummary: { backgroundColor: '#f7fafd', padding: 12, borderRadius: 8, marginBottom: 16 },
  modalRequestText: { fontSize: 16, marginBottom: 6, color: '#234' },
  modalLabel: { fontSize: 16, fontWeight: '600', marginBottom: 8, color: '#226' },
  commentInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, minHeight: 80, textAlignVertical: 'top', marginBottom: 16 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  modalBtn: { flex: 1, padding: 12, borderRadius: 8, marginHorizontal: 4, alignItems: 'center' },
  modalBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  cancelBtn: { backgroundColor: '#6c757d' },
  cancelBtnText: { color: '#fff', fontWeight: '600' },
  messageInputContainer: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 8, gap: 8 },
  messageInput: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 16, maxHeight: 100, textAlignVertical: 'top' },
  sendButton: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, minWidth: 60, alignItems: 'center' },
  sendButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});
