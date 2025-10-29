/**
 * MoneyBuddy AI Chat Component
 * Conversational AI interface for financial education
 * Features personalized conversations, safety measures, and cultural awareness
 */

import { AIContextBuilder, aiService, type UserContext } from '@/utils/aiService';
import { API_URL } from '@/utils/config';
import { getAuthToken, getUserData } from '@/utils/secureStorage';
import { useTheme } from '@/utils/themeContext';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

// Message types
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
}

// Component props
interface MoneyBuddyAIProps {
  onClose?: () => void;
  initialMessage?: string;
  compact?: boolean;
}

const createStyles = (themeColors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeColors.background,
  },
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.05,
  },
  compactContainer: {
    height: 500,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: themeColors.card,
    elevation: 8,
    shadowColor: themeColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: themeColors.primary,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.primary + '40',
    minHeight: 70,
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    // TODO: Replace with LinearGradient for gradient background
    backgroundColor: themeColors.primary,
  },
  compactHeader: {
    // TODO: Replace with LinearGradient for gradient background
    backgroundColor: themeColors.primary,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: themeColors.card,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  compactHeaderTitle: {
    color: themeColors.card,
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 13,
    color: themeColors.card + 'CC',
    marginTop: 4,
    fontWeight: '500',
  },
  compactHeaderSubtitle: {
    color: themeColors.card + 'CC',
    fontSize: 12,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: themeColors.card + '33',
  },
  closeButtonText: {
    fontSize: 16,
    color: themeColors.primary,
    fontWeight: 'bold',
  },
  compactCloseButtonText: {
    color: themeColors.primary,
  },
  messagesContainer: {
    flex: 1,
    padding: 20,
    paddingBottom: 10,
  },
  messageBubble: {
    maxWidth: '85%',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: themeColors.primary,
    borderBottomRightRadius: 4,
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    backgroundColor: themeColors.surface,
    borderWidth: 1,
    borderColor: themeColors.border + '60',
    borderBottomLeftRadius: 4,
    elevation: 1,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  },
  userMessageText: {
    color: themeColors.card,
  },
  assistantMessageText: {
    color: themeColors.text,
  },
  messageTimestamp: {
    fontSize: 11,
    marginTop: 6,
    opacity: 0.6,
    fontWeight: '500',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: themeColors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: themeColors.border + '60',
    maxWidth: '80%',
    alignSelf: 'flex-start',
    marginBottom: 12,
    elevation: 1,
  },
  typingDots: {
    flexDirection: 'row',
    marginLeft: 12,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: themeColors.primary,
    marginHorizontal: 3,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 16,
    backgroundColor: themeColors.card,
    borderTopWidth: 1,
    borderTopColor: themeColors.border + '40',
  },
  textInput: {
    flex: 1,
    borderWidth: 2,
    borderColor: themeColors.primary + '40',
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: themeColors.surface,
    color: themeColors.text,
    maxHeight: 100,
    shadowColor: themeColors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  textInputFocused: {
    borderColor: themeColors.primary,
    shadowOpacity: 0.2,
  },
  sendButton: {
    marginLeft: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: themeColors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  sendButtonDisabled: {
    backgroundColor: themeColors.surface,
    elevation: 0,
    shadowOpacity: 0,
  },
  sendButtonText: {
    fontSize: 20,
    color: themeColors.card,
    fontWeight: 'bold',
  },
  sendButtonTextDisabled: {
    color: themeColors.textSecondary,
  },
  conversationStarters: {
    padding: 20,
    // TODO: Replace with LinearGradient for gradient background
    backgroundColor: themeColors.primary + '11',
    borderRadius: 16,
    margin: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: themeColors.primary + '20',
  },
  startersTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: themeColors.primary,
    marginBottom: 16,
    textAlign: 'center',
  },
  starterButton: {
    // TODO: Replace with LinearGradient for gradient background
    backgroundColor: themeColors.primary + '22',
    borderWidth: 1,
    borderColor: themeColors.primary + '30',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginRight: 8,
    marginBottom: 8,
    elevation: 1,
    shadowColor: themeColors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  starterButtonText: {
    color: themeColors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  errorContainer: {
    padding: 20,
    // TODO: Replace with LinearGradient for gradient background
    backgroundColor: themeColors.error + '11',
    borderRadius: 16,
    margin: 20,
    borderWidth: 1,
    borderColor: themeColors.error + '40',
  },
  errorText: {
    color: themeColors.error,
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  retryButton: {
    marginTop: 12,
    alignSelf: 'center',
    // TODO: Replace with LinearGradient for gradient background
    backgroundColor: themeColors.error,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    elevation: 2,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  messageSender: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.8,
    color: themeColors.text,
  },
});

export default function MoneyBuddyAI({ onClose, initialMessage, compact = false }: MoneyBuddyAIProps) {
  console.log('🎯 MoneyBuddyAI component rendered');

  const { themeColors } = useTheme();
  const styles = createStyles(themeColors);

  // State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showStarters, setShowStarters] = useState(true);
  const [remainingQuestions, setRemainingQuestions] = useState<number>(10);

  // Refs
  const scrollViewRef = useRef<ScrollView>(null);
  const conversationHistory = useRef<Array<{ role: string; content: string }>>([]);

  const loadUsageStats = async () => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_URL}/ai/usage`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setRemainingQuestions(data.data.remainingQuestions);
        }
      }
    } catch (error) {
      console.error('Error loading usage stats:', error);
    }
  };

  // Initialize user context and usage stats
  useEffect(() => {
    console.log('🚀 MoneyBuddyAI: Initializing component...');
    initializeContext();
    loadUsageStats();
  }, []);

  // Send initial message if provided
  useEffect(() => {
    if (initialMessage && userContext) {
      handleSendMessage(initialMessage);
    }
  }, [initialMessage, userContext]);

  const initializeContext = async () => {
    try {
      const userData = await getUserData();
      if (userData?.id) {
        const context = await AIContextBuilder.buildContext(userData.id);
        setUserContext(context);

        // Add welcome message
        const welcomeMessage: ChatMessage = {
          id: 'welcome',
          role: 'assistant',
          content: getWelcomeMessage(context),
          timestamp: new Date(),
        };
        setMessages([welcomeMessage]);
      }
    } catch (error) {
      console.error('Error initializing AI context:', error);
      setError('Unable to load your profile. Please try again.');
    }
  };

  const getWelcomeMessage = (context: UserContext): string => {
    const timeOfDay = new Date().getHours();
    const greeting = timeOfDay < 12 ? 'Good morning' : timeOfDay < 17 ? 'Hello' : 'Good evening';

    if (context.role === 'child') {
      return `${greeting}${context.name ? ` ${context.name}` : ''}! 👋 I'm MoneyBuddy, your friendly financial learning companion! I'm here to help you understand money, saving, and making smart choices. What would you like to learn about today?`;
    } else {
      return `${greeting}${context.name ? ` ${context.name}` : ''}! 👋 I'm MoneyBuddy, your expert financial education consultant. I'm here to help you teach your ${context.age ? `${context.age}-year-old` : 'child'} about money management. How can I assist you with your financial education journey?`;
    }
  };

  const handleSendMessage = async (messageText: string = inputText.trim()) => {
    if (!messageText || !userContext) return;

    // Validate message
    const validation = aiService.validateMessage(messageText);
    if (!validation.valid) {
      Alert.alert('Message Not Allowed', validation.reason);
      return;
    }

    // Clear input and hide starters
    setInputText('');
    setShowStarters(false);
    setError(null);

    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);
    setIsLoading(true);

    // Update conversation history
    conversationHistory.current.push({ role: 'user', content: messageText });

    try {
      console.log('💬 MoneyBuddyAI: Getting AI response...');
      // Get AI response
      const response = await aiService.sendMessage(
        messageText,
        userContext,
        conversationHistory.current
      );

      console.log('💬 MoneyBuddyAI: AI response received:', response.response.substring(0, 50) + '...');

      // Add AI response
      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: response.response,
        timestamp: new Date(),
      };

      console.log('💬 MoneyBuddyAI: Adding AI message to chat, current messages count:', messages.length);
      setMessages(prev => {
        const newMessages = [...prev, aiMessage];
        console.log('💬 MoneyBuddyAI: Updated messages count:', newMessages.length);
        return newMessages;
      });

      // Update conversation history
      conversationHistory.current.push({ role: 'assistant', content: response.response });

      // Refresh usage stats after successful question
      await loadUsageStats();

    } catch (error) {
      console.error('AI response error:', error);
      setError('Sorry, I couldn\'t get a response right now. Please try again.');

      // Add error message
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Oops! I\'m having trouble responding right now. Please try again in a moment.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
      setIsLoading(false);
    }
  };

  const handleStarterClick = (starter: string) => {
    setInputText(starter);
    handleSendMessage(starter);
  };

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const conversationStarters = userContext ? aiService.getConversationStarters(userContext.role) : [];

  return (
    <KeyboardAvoidingView
      style={compact ? styles.compactContainer : styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Background Pattern */}
      {!compact && (
        <View style={styles.backgroundPattern}>
          {[...Array(20)].map((_, i) => (
            <View
              key={i}
              style={{
                position: 'absolute',
                width: 4,
                height: 4,
                borderRadius: 2,
                backgroundColor: themeColors.primary,
                opacity: 0.1,
                left: Math.random() * screenWidth,
                top: Math.random() * 800,
              }}
            />
          ))}
        </View>
      )}
      {/* Header */}
      <View style={[styles.header, compact && styles.compactHeader]}>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, compact && styles.compactHeaderTitle]} numberOfLines={1}>
            💬 MoneyBuddy AI
          </Text>
          <Text style={[styles.headerSubtitle, compact && styles.compactHeaderSubtitle]} numberOfLines={1}>
            Your financial learning companion • {remainingQuestions} left
          </Text>
        </View>
        {onClose && (
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close MoneyBuddy chat"
            accessibilityHint="Close the AI chat conversation"
          >
            <Text style={[styles.closeButtonText, compact && styles.compactCloseButtonText]}>
              ✕
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((message) => (
          <View key={message.id}>
            {/* Message Header with Avatar */}
            <View style={[styles.messageHeader, message.role === 'user' && { justifyContent: 'flex-end' }]}>
              {message.role === 'assistant' && (
                <View style={styles.avatarContainer}>
                  <Text style={styles.avatarText}>🤖</Text>
                </View>
              )}
              <Text style={[styles.messageSender, message.role === 'user' && { color: '#FFFFFF' }]}>
                {message.role === 'assistant' ? 'MoneyBuddy' : 'You'}
              </Text>
              {message.role === 'user' && (
                <View style={styles.avatarContainer}>
                  <Text style={styles.avatarText}>👤</Text>
                </View>
              )}
            </View>

            {/* Message Bubble */}
            <View
              style={[
                styles.messageBubble,
                message.role === 'user' ? styles.userMessage : styles.assistantMessage
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  message.role === 'user' ? styles.userMessageText : styles.assistantMessageText
                ]}
              >
                {message.content}
              </Text>
              <Text
                style={[
                  styles.messageTimestamp,
                  message.role === 'user' ? styles.userMessageText : styles.assistantMessageText
                ]}
              >
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          </View>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <View style={styles.typingIndicator}>
            <Text style={[styles.assistantMessageText, { fontSize: 14 }]}>MoneyBuddy is typing</Text>
            <View style={styles.typingDots}>
              {[0, 1, 2].map((i) => (
                <View key={i} style={styles.typingDot} />
              ))}
            </View>
          </View>
        )}

        {/* Conversation starters */}
        {showStarters && conversationStarters.length > 0 && messages.length <= 1 && (
          <View style={styles.conversationStarters}>
            <Text style={styles.startersTitle}>💡 Try asking:</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start', width: '100%' }}>
              {conversationStarters.slice(0, 3).map((starter, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.starterButton,
                    { maxWidth: '90%', minWidth: 150, marginBottom: 10, alignSelf: 'flex-start' }
                  ]}
                  onPress={() => handleStarterClick(starter)}
                  accessibilityRole="button"
                  accessibilityLabel={`Ask: ${starter}`}
                  accessibilityHint="Send this suggested question to MoneyBuddy"
                >
                  <Text
                    style={styles.starterButtonText}
                    numberOfLines={2}
                    ellipsizeMode="tail"
                  >
                    {starter}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Error display */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                setError(null);
                if (inputText.trim()) {
                  handleSendMessage();
                }
              }}
              accessibilityRole="button"
              accessibilityLabel="Retry sending message"
              accessibilityHint="Try sending your message again"
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Ask MoneyBuddy anything about money..."
          placeholderTextColor={themeColors.textSecondary}
          multiline
          maxLength={500}
          editable={!isLoading}
          accessibilityLabel="Message input"
          accessibilityHint="Type your question for MoneyBuddy AI"
          onSubmitEditing={() => handleSendMessage()}
          returnKeyType="send"
        />
        <TouchableOpacity
          style={[styles.sendButton, (isLoading || !inputText.trim()) && styles.sendButtonDisabled]}
          onPress={() => handleSendMessage()}
          disabled={isLoading || !inputText.trim()}
          accessibilityRole="button"
          accessibilityLabel={isLoading ? "Sending message" : "Send message"}
          accessibilityHint="Send your message to MoneyBuddy"
          accessibilityState={{ disabled: isLoading || !inputText.trim() }}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={themeColors.card} />
          ) : (
            <Text style={[styles.sendButtonText, (!inputText.trim()) && styles.sendButtonTextDisabled]}>
              ➤
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// Compact version for embedding in other screens
export function MoneyBuddyCompact(props: Omit<MoneyBuddyAIProps, 'compact'>) {
  return <MoneyBuddyAI {...props} compact={true} />;
}
