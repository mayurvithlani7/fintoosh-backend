/**
 * AI Service for MoneyBuddy AI integration
 * Provides conversational AI capabilities using Google Gemini
 * Includes context personalization, safety measures, and Indian family focus
 */

import { API_URL } from './config';
import { getAuthToken, getUserData } from './secureStorage';

// AI API configuration - Using Gemini 2.5 Flash for LLM responses
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

// Context types for personalization
export interface UserContext {
  userId: string;
  age?: number;
  role: 'parent' | 'child';
  name?: string;
  familyValues?: string[];
  financialLiteracy?: 'beginner' | 'intermediate' | 'advanced';
  goals?: Array<{
    name: string;
    amount: number;
    saved: number;
    category: string;
  }>;
  recentActivity?: Array<{
    type: string;
    description: string;
    timestamp: Date;
  }>;
  currentFestival?: string;
  preferredLanguage?: string;
}

// AI conversation types
export interface AIConversation {
  id: string;
  userId: string;
  messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    context?: any;
  }>;
  sessionStart: Date;
  lastActivity: Date;
  topic?: string;
  feedback?: {
    helpful: boolean;
    rating?: number;
    notes?: string;
  };
}

// Safety and content guidelines
const SAFETY_GUIDELINES = `
CRITICAL SAFETY RULES:
- NEVER give specific financial advice that could lead to loss
- NEVER suggest investing real money without parental supervision
- NEVER encourage debt or borrowing beyond basic understanding
- ALWAYS promote saving, budgeting, and family discussion
- ALWAYS emphasize that parents make final financial decisions
- ALWAYS encourage positive money habits and family bonding
- NEVER provide investment recommendations or stock tips
- NEVER suggest gambling or high-risk activities
- ALWAYS remind children to consult parents for important decisions
- ALWAYS promote educational and ethical money use

INDIAN CULTURAL CONTEXT:
- Respect Diwali, Holi, Eid, and other festivals
- Understand joint family dynamics
- Recognize importance of education and family values
- Appreciate cultural attitudes toward money and saving
- Promote giving (daan/zakat) and community support
`;

// Base system prompts for different user types
const SYSTEM_PROMPTS = {
  child: (context: UserContext) => `
You are MoneyBuddy, a friendly and encouraging financial education AI assistant designed specifically for children in Indian families. You help kids learn about money through fun, age-appropriate conversations.

ABOUT THE CHILD:
- Age: ${context.age || 'unknown'} years old
- Name: ${context.name || 'young friend'}
- Financial level: ${context.financialLiteracy || 'beginner'}
${context.currentFestival ? `- Current festival: ${context.currentFestival}` : ''}
${context.preferredLanguage ? `- Preferred language: ${context.preferredLanguage}` : ''}

YOUR ROLE:
- Be encouraging, patient, and fun like a friendly teacher
- Use simple language appropriate for a ${context.age || '10'}-year-old
- Include Indian cultural references and examples
- Always promote family discussion and parental involvement
- Focus on teaching concepts like saving, budgeting, and wise spending
- Celebrate small wins and progress
- Ask questions to help children think about their choices
- Never give direct financial advice - guide learning instead

${SAFETY_GUIDELINES}

RESPONSE STYLE:
- Keep responses conversational and engaging
- Use emojis sparingly but meaningfully
- End with a question to continue the conversation
- Make learning feel like a game or adventure
- Always be positive and supportive
`,

  parent: (context: UserContext) => `
You are MoneyBuddy, an expert financial education consultant specializing in helping Indian parents teach their children about money management.

ABOUT THE PARENT:
- Teaching child(ren) aged ${context.age || 'unknown'}
- Family values: ${context.familyValues?.join(', ') || 'education, responsibility, family bonding'}
${context.currentFestival ? `- Current festival context: ${context.currentFestival}` : ''}

YOUR ROLE:
- Provide practical teaching strategies and conversation starters
- Share age-appropriate money lessons and activities
- Help parents understand child development and financial readiness
- Suggest ways to make learning engaging and fun
- Offer guidance on handling money conversations and conflicts
- Recommend resources and activities for continued learning
- Focus on building long-term financial habits and family bonding

${SAFETY_GUIDELINES}

RESPONSE STYLE:
- Professional yet warm and approachable
- Provide specific, actionable advice
- Include cultural context and Indian family dynamics
- Suggest follow-up activities and discussion questions
- Share success stories and real examples
- Always emphasize parental involvement and guidance
`
};

// Context builder for personalization
export class AIContextBuilder {
  static async buildContext(userId: string): Promise<UserContext> {
    try {
      const token = await getAuthToken();
      const userData = await getUserData();

      if (!userData) {
        throw new Error('User data not available');
      }

      // Get user profile
      const userResponse = await fetch(`${API_URL}/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!userResponse.ok) {
        throw new Error('Failed to fetch user data');
      }

      const user = await userResponse.json();

      // Get recent goals and activity
      const goalsResponse = await fetch(`${API_URL}/goals/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      let goals = [];
      if (goalsResponse.ok) {
        const goalsData = await goalsResponse.json();
        goals = Array.isArray(goalsData) ? goalsData : [];
      }

      // Get recent transactions
      const transactionsResponse = await fetch(`${API_URL}/transactions/${userId}?limit=10`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      let transactions = [];
      if (transactionsResponse.ok) {
        const transactionsData = await transactionsResponse.json();
        transactions = Array.isArray(transactionsData) ? transactionsData : [];
      }

      // Determine current festival (simplified)
      const now = new Date();
      const currentFestival = this.getCurrentFestival(now);

      return {
        userId,
        age: user.age,
        role: user.role || 'child',
        name: user.name,
        familyValues: ['education', 'family', 'responsibility'], // Default values
        financialLiteracy: this.assessFinancialLiteracy(user, goals),
        goals: goals.slice(0, 3).map((goal: any) => ({
          name: goal.name,
          amount: goal.targetAmount,
          saved: goal.currentAmount,
          category: goal.category
        })),
        recentActivity: transactions.slice(0, 5).map((tx: any) => ({
          type: tx.type,
          description: tx.description || `${tx.type} transaction`,
          timestamp: new Date(tx.date)
        })),
        currentFestival,
        preferredLanguage: 'English' // Default, can be expanded
      };
    } catch (error) {
      console.error('Error building AI context:', error);
      // Return minimal context on error
      return {
        userId,
        role: 'child',
        financialLiteracy: 'beginner'
      };
    }
  }

  private static getCurrentFestival(date: Date): string | undefined {
    const month = date.getMonth() + 1;
    const day = date.getDate();

    // Simplified festival detection
    if (month === 11 && day >= 1 && day <= 15) return 'Diwali';
    if (month === 3 && day >= 20 && day <= 31) return 'Holi';
    if (month === 6 && day >= 20 && day <= 30) return 'Eid';
    if (month === 10 && day >= 20 && day <= 31) return 'Dussehra';

    return undefined;
  }

  private static assessFinancialLiteracy(user: any, goals: any[]): 'beginner' | 'intermediate' | 'advanced' {
    // Simple assessment based on goals and activity
    if (!Array.isArray(goals)) {
      return 'beginner';
    }

    const hasActiveGoals = goals.some(g => g.status === 'active');
    const completedGoals = goals.filter(g => g.status === 'completed').length;

    if (completedGoals >= 3) return 'advanced';
    if (hasActiveGoals || completedGoals >= 1) return 'intermediate';
    return 'beginner';
  }
}

// Main AI service class
export class AIService {
  private static instance: AIService;
  private apiKey: string | null = null;

  private constructor() {}

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  async initialize(apiKey?: string) {
    // Use API key if provided, otherwise use Gemini API key for Expo Web compatibility
    this.apiKey = apiKey ||
                  process.env.EXPO_PUBLIC_GEMINI_API_KEY ||
                  process.env.EXPO_PUBLIC_OPENAI_API_KEY ||
                  'AIzaSyCoV0PWbrj8mXWUeuoDFYDr1FyxRphd_bw'; // Gemini API key for testing

    console.log('🔑 MoneyBuddy AI: Initializing service...');
    console.log('🔑 MoneyBuddy AI: API key configured:', !!this.apiKey);

    if (this.apiKey) {
      console.log('🔑 MoneyBuddy AI: Using Gemini 2.5 Flash LLM responses!');
      console.log('🔑 MoneyBuddy AI: Service ready for advanced AI responses! 🤖✨');
    } else {
      console.log('🎓 MoneyBuddy AI: Using smart educational fallback responses!');
      console.log('🎓 MoneyBuddy AI: Fallback responses are comprehensive and educational!');
    }
  }

  async sendMessage(
    userMessage: string,
    context: UserContext,
    conversationHistory: Array<{ role: string; content: string }> = []
  ): Promise<{
    response: string;
    confidence: number;
    metadata: any;
  }> {
    // Check usage limits with backend API
    try {
      const usageResponse = await fetch(`${API_URL}/ai/usage`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`,
        },
      });

      if (!usageResponse.ok) {
        // If API fails, allow question but don't record it
        console.warn('Could not check usage limits, proceeding with question');
      } else {
        const usageData = await usageResponse.json();

        if (!usageData.success || !usageData.data.canAsk) {
          const resetTime = usageData.data?.resetTime ? new Date(usageData.data.resetTime) : null;
          const resetMessage = resetTime
            ? `resets at ${resetTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
            : 'resets tomorrow';

          return {
            response: `You've reached your daily limit of 10 questions to MoneyBuddy AI. This helps ensure everyone gets a fair chance to learn! Your questions ${resetMessage}. 💪`,
            confidence: 1.0,
            metadata: {
              limitReached: true,
              resetTime: resetTime?.toISOString(),
              reason: usageData.data?.reason || 'Daily limit reached'
            }
          };
        }
      }
    } catch (error) {
      console.warn('Error checking usage limits:', error);
      // Allow question if API check fails
    }

    // If no API key, provide helpful fallback responses
    if (!this.apiKey) {
      console.log('🎓 MoneyBuddy AI: Using fallback response for message:', userMessage.substring(0, 50) + '...');
      const fallbackResponse = this.getFallbackResponse(userMessage, context);
      console.log('🎓 MoneyBuddy AI: Fallback response generated:', fallbackResponse.response.substring(0, 50) + '...');
      return fallbackResponse;
    }

    try {
      // Build system prompt based on user context
      const systemPrompt = SYSTEM_PROMPTS[context.role](context);

      // Create conversation context for Gemini
      const conversationContext = conversationHistory.slice(-5).map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

      // Add contextual information to the user message
      const enhancedMessage = this.enhanceMessageWithContext(userMessage, context);

      // Prepare Gemini request
      const geminiPrompt = `${systemPrompt}\n\nConversation History:\n${conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}\n\nUser: ${enhancedMessage}`;

      console.log('MoneyBuddy AI: Making Gemini API call...');
      console.log('MoneyBuddy AI: Prompt length:', geminiPrompt.length);

      const requestBody = {
        contents: [{
          parts: [{
            text: geminiPrompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096,
          topP: 0.8,
          topK: 10
        }
      };

      console.log('MoneyBuddy AI: Request body:', JSON.stringify(requestBody).substring(0, 200) + '...');

      // For PaLM API, use different request format
      const palmRequestBody = {
        prompt: {
          text: geminiPrompt
        },
        temperature: 0.7,
        candidateCount: 1,
        maxOutputTokens: 500,
        topP: 0.8,
        topK: 10
      };

      const response = await fetch(`${GEMINI_API_URL}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('MoneyBuddy AI: Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('MoneyBuddy AI: API error response:', errorText);
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('MoneyBuddy AI: Full API response:', JSON.stringify(data, null, 2));
      console.log('MoneyBuddy AI: Response structure check - candidates:', !!data.candidates);

      // Handle different Gemini API response structures
      let aiResponse = '';
      let finishReason = data.candidates?.[0]?.finishReason || 'UNKNOWN';

      if (data.candidates && data.candidates[0]) {
        // Check finish reason first
        if (finishReason === 'MAX_TOKENS') {
          console.warn('MoneyBuddy AI: Response was truncated due to MAX_TOKENS limit');
          aiResponse = 'I\'m sorry, but my response got a bit too long! Let me give you a shorter answer: Money is a tool that helps us make choices about what we need and want. The most important thing is to talk to your parents about money - they\'re the best teachers! What specific question do you have?';
        } else if (data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
          aiResponse = data.candidates[0].content.parts[0].text;
        }
      } else if (data.response && data.response.text) {
        // Alternative response structure
        aiResponse = data.response.text;
      } else if (data.text) {
        // Direct text response
        aiResponse = data.text;
      }

      if (!aiResponse) {
        console.error('MoneyBuddy AI: Could not extract response text from:', JSON.stringify(data, null, 2));
        // Provide fallback response instead of throwing error
        aiResponse = context.role === 'child'
          ? "I'm having trouble responding right now, but I'm here to help you learn about money! 💭 Try asking me about saving, spending, or talking to your parents about money choices."
          : "I'm having trouble generating a response right now. Please try rephrasing your question about teaching your child financial concepts.";
      }

      console.log('MoneyBuddy AI: Generated response length:', aiResponse.length);

      // Record successful question usage with backend API
      try {
        await fetch(`${API_URL}/ai/question`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await getAuthToken()}`,
          },
          body: JSON.stringify({
            messageLength: userMessage.length,
            responseLength: aiResponse.length,
            question: userMessage,
            response: aiResponse
          }),
        });
      } catch (error) {
        console.warn('Failed to record question usage:', error);
        // Don't fail the response if logging fails
      }

      // Calculate confidence based on finish reason
      let confidence = 0.7; // Default
      if (finishReason === 'STOP') {
        confidence = 0.9; // Complete response
      } else if (finishReason === 'MAX_TOKENS') {
        confidence = 0.6; // Truncated response
      } else if (finishReason === 'SAFETY') {
        confidence = 0.8; // Safety filtered but complete
      }

      return {
        response: aiResponse,
        confidence,
        metadata: {
          model: 'gemini-2.5-flash',
          tokens: data.usageMetadata,
          finishReason
        }
      };
    } catch (error) {
      console.error('AI service error:', error);
      // On API failure, provide fallback response instead of throwing error
      return this.getFallbackResponse(userMessage, context);
    }
  }

  private enhanceMessageWithContext(message: string, context: UserContext): string {
    let enhanced = message;

    // Add current goals context if relevant
    if (context.goals && context.goals.length > 0 && message.toLowerCase().includes('goal')) {
      enhanced += `\n\nCurrent Goals: ${context.goals.map(g => `${g.name} (${g.saved}/${g.amount})`).join(', ')}`;
    }

    // Add festival context if relevant
    if (context.currentFestival && (message.toLowerCase().includes('festival') || message.toLowerCase().includes('diwali') || message.toLowerCase().includes('holi'))) {
      enhanced += `\n\nCurrent Festival: ${context.currentFestival} - Consider festival-related saving or spending discussions.`;
    }

    // Add recent activity context for continuity
    if (context.recentActivity && context.recentActivity.length > 0) {
      const recent = context.recentActivity[0];
      enhanced += `\n\nRecent Activity: ${recent.description} (${new Date(recent.timestamp).toLocaleDateString()})`;
    }

    return enhanced;
  }

  // Predefined conversation starters
  getConversationStarters(userType: 'parent' | 'child', context?: UserContext): string[] {
    if (userType === 'child') {
      return [
        "How can I save money for a new toy?",
        "What's the difference between needs and wants?",
        "How do I make a budget for my allowance?",
        "What should I do with my extra money?",
        "How can I help my family with money?"
      ];
    } else {
      return [
        "How do I talk to my child about money?",
        "What money lessons are appropriate for my child's age?",
        "How can I make saving fun for my child?",
        "What should I do when my child wants expensive things?",
        "How do I teach delayed gratification?"
      ];
    }
  }

  // Safety check for messages
  validateMessage(message: string): { valid: boolean; reason?: string } {
    const lowerMessage = message.toLowerCase();

    // Check for inappropriate content
    const inappropriateTerms = ['gambling', 'drugs', 'violence', 'inappropriate'];
    for (const term of inappropriateTerms) {
      if (lowerMessage.includes(term)) {
        return { valid: false, reason: 'Message contains inappropriate content' };
      }
    }

    // Check message length
    if (message.length > 1000) {
      return { valid: false, reason: 'Message too long' };
    }

    return { valid: true };
  }

  // Fallback responses when API key is not available
  private getFallbackResponse(
    userMessage: string,
    context: UserContext
  ): {
    response: string;
    confidence: number;
    metadata: any;
  } {
    const lowerMessage = userMessage.toLowerCase();
    let response = '';

    // Simple keyword-based responses
    if (lowerMessage.includes('save') || lowerMessage.includes('saving')) {
      response = context.role === 'child'
        ? "Saving money is like planting seeds for a beautiful garden! 💰🌱 When you save a little each day, it grows bigger and bigger. Talk to your parents about setting up a savings goal for something special you want. What are you saving for?"
        : "Teaching children about saving helps them understand delayed gratification. Try setting small, achievable savings goals and celebrate each milestone. Consider using the 5 money pots system to make saving visual and fun!";
    } else if (lowerMessage.includes('budget') || lowerMessage.includes('spend')) {
      response = context.role === 'child'
        ? "A budget is like a treasure map for your money! 🗺️ It helps you decide what to spend on and what to save for later. Ask your parents to help you make a simple budget for your allowance. What do you spend most of your money on?"
        : "Budgets help children understand trade-offs between wants and needs. Start with simple categories and use visual aids like the money jars. Make it a family discussion rather than a lecture!";
    } else if (lowerMessage.includes('goal')) {
      response = context.role === 'child'
        ? "Goals are like dreams with deadlines! 🎯 Setting goals helps you work towards something special. Think about what you really want, tell your parents, and make a plan together. What's your biggest dream right now?"
        : "Goal setting teaches children about planning and persistence. Make goals specific, measurable, and celebratable. Use visual progress trackers and involve the whole family in the journey!";
    } else if (lowerMessage.includes('need') && lowerMessage.includes('want')) {
      response = context.role === 'child'
        ? "Needs are things you must have to live and be healthy, like food, clothes, and a safe home. 🏠 Wants are nice things but you can live without them, like toys or candy. 🤔 Can you think of something you thought was a need but is really a want?"
        : "Teaching the difference between needs and wants is fundamental to financial literacy. Use real-life examples and role-playing scenarios. Make it relatable to their daily life!";
    } else if (lowerMessage.includes('family') || lowerMessage.includes('parent')) {
      response = context.role === 'child'
        ? "Family discussions about money are so important! 💬 Talking with your parents about money helps you learn and makes decisions together. Remember, your parents want to help you understand money so you can make good choices. What money questions do you have for your family?"
        : "Family money discussions build trust and teach values. Create regular, low-pressure times to talk about money. Listen more than you lecture, and use real family situations as teaching moments!";
    } else {
      // Generic fallback responses
      if (context.role === 'child') {
        response = "That's a great question about money! 💭 Money is a tool that helps us buy things we need and want. The most important thing is to talk to your parents about money - they're the best teachers! What made you think about this?";
      } else {
        response = "That's an important aspect of teaching children about money. The key is to make learning conversational and tied to real-life situations. Focus on building positive associations with money management. What specific challenge are you facing with your child?";
      }
    }

    return {
      response,
      confidence: 0.6, // Lower confidence for fallback responses
      metadata: {
        fallback: true,
        messageType: 'generic_fallback'
      }
    };
  }
}

// Global instance
export const aiService = AIService.getInstance();

// Initialize on module load
aiService.initialize();
