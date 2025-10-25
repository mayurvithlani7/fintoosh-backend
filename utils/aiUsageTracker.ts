/**
 * AI Usage Tracker for MoneyBuddy AI
 * Tracks daily usage limits and manages user quotas
 * Stores data locally using AsyncStorage for persistence
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UsageRecord {
  userId: string;
  date: string; // YYYY-MM-DD format
  questionCount: number;
  lastQuestionTime: number;
  messages: Array<{
    timestamp: number;
    messageLength: number;
    responseLength: number;
  }>;
}

export interface UsageLimits {
  dailyQuestions: number;
  resetHour: number; // Hour of day when limits reset (0-23)
}

class AIUsageTracker {
  private static instance: AIUsageTracker;
  private readonly STORAGE_KEY = '@fintoosh_ai_usage';
  private readonly LIMITS: UsageLimits = {
    dailyQuestions: 10, // 10 questions per day
    resetHour: 0 // Reset at midnight
  };

  private constructor() {}

  static getInstance(): AIUsageTracker {
    if (!AIUsageTracker.instance) {
      AIUsageTracker.instance = new AIUsageTracker();
    }
    return AIUsageTracker.instance;
  }

  /**
   * Check if user can ask another question today
   */
  async canAskQuestion(userId: string): Promise<{
    allowed: boolean;
    remainingQuestions: number;
    resetTime?: Date;
    reason?: string;
  }> {
    try {
      const today = this.getTodayString();
      const usage = await this.getUsageRecord(userId, today);

      const remaining = Math.max(0, this.LIMITS.dailyQuestions - usage.questionCount);

      if (usage.questionCount >= this.LIMITS.dailyQuestions) {
        // Calculate next reset time
        const resetTime = this.getNextResetTime();
        return {
          allowed: false,
          remainingQuestions: 0,
          resetTime,
          reason: 'Daily question limit reached'
        };
      }

      return {
        allowed: true,
        remainingQuestions: remaining, // Current remaining questions
        reason: undefined
      };
    } catch (error) {
      console.error('Error checking usage limit:', error);
      // Allow on error to avoid blocking users
      return {
        allowed: true,
        remainingQuestions: this.LIMITS.dailyQuestions - 1,
        reason: undefined
      };
    }
  }

  /**
   * Record a question being asked
   */
  async recordQuestion(
    userId: string,
    messageLength: number,
    responseLength: number
  ): Promise<void> {
    try {
      const today = this.getTodayString();
      const usage = await this.getUsageRecord(userId, today);

      // Add new message record
      usage.messages.push({
        timestamp: Date.now(),
        messageLength,
        responseLength
      });

      usage.questionCount += 1;
      usage.lastQuestionTime = Date.now();

      // Save updated record
      await this.saveUsageRecord(userId, today, usage);

      // Clean up old records (older than 7 days)
      await this.cleanupOldRecords(userId);
    } catch (error) {
      console.error('Error recording question:', error);
      // Don't throw - logging is best effort
    }
  }

  /**
   * Get usage statistics for user
   */
  async getUsageStats(userId: string): Promise<{
    today: UsageRecord;
    thisWeek: number;
    thisMonth: number;
    averageQuestionsPerDay: number;
  }> {
    try {
      const today = this.getTodayString();
      const todayRecord = await this.getUsageRecord(userId, today);

      // Get all records for this user
      const allRecords = await this.getAllUserRecords(userId);

      // Calculate weekly total
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const thisWeek = allRecords
        .filter(record => new Date(record.date) >= weekAgo)
        .reduce((total, record) => total + record.questionCount, 0);

      // Calculate monthly total
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      const thisMonth = allRecords
        .filter(record => new Date(record.date) >= monthAgo)
        .reduce((total, record) => total + record.questionCount, 0);

      // Calculate average
      const totalQuestions = allRecords.reduce((total, record) => total + record.questionCount, 0);
      const averageQuestionsPerDay = allRecords.length > 0 ? totalQuestions / allRecords.length : 0;

      return {
        today: todayRecord,
        thisWeek,
        thisMonth,
        averageQuestionsPerDay
      };
    } catch (error) {
      console.error('Error getting usage stats:', error);
      return {
        today: this.createEmptyRecord(userId, this.getTodayString()),
        thisWeek: 0,
        thisMonth: 0,
        averageQuestionsPerDay: 0
      };
    }
  }

  /**
   * Reset usage for testing (admin function)
   */
  async resetUsage(userId: string): Promise<void> {
    try {
      const allRecords = await AsyncStorage.getItem(this.STORAGE_KEY);
      const records: Record<string, UsageRecord> = allRecords ? JSON.parse(allRecords) : {};

      // Remove all records for this user
      Object.keys(records).forEach(key => {
        if (key.startsWith(`${userId}_`)) {
          delete records[key];
        }
      });

      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(records));
    } catch (error) {
      console.error('Error resetting usage:', error);
    }
  }

  /**
   * Get usage record for specific user and date
   */
  private async getUsageRecord(userId: string, date: string): Promise<UsageRecord> {
    try {
      const allRecords = await AsyncStorage.getItem(this.STORAGE_KEY);
      const records: Record<string, UsageRecord> = allRecords ? JSON.parse(allRecords) : {};

      const key = `${userId}_${date}`;
      return records[key] || this.createEmptyRecord(userId, date);
    } catch (error) {
      console.error('Error getting usage record:', error);
      return this.createEmptyRecord(userId, date);
    }
  }

  /**
   * Save usage record
   */
  private async saveUsageRecord(userId: string, date: string, record: UsageRecord): Promise<void> {
    try {
      const allRecords = await AsyncStorage.getItem(this.STORAGE_KEY);
      const records: Record<string, UsageRecord> = allRecords ? JSON.parse(allRecords) : {};

      const key = `${userId}_${date}`;
      records[key] = record;

      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(records));
    } catch (error) {
      console.error('Error saving usage record:', error);
    }
  }

  /**
   * Get all records for a user
   */
  private async getAllUserRecords(userId: string): Promise<UsageRecord[]> {
    try {
      const allRecords = await AsyncStorage.getItem(this.STORAGE_KEY);
      const records: Record<string, UsageRecord> = allRecords ? JSON.parse(allRecords) : {};

      return Object.values(records).filter((record: UsageRecord) =>
        record.userId === userId
      );
    } catch (error) {
      console.error('Error getting all user records:', error);
      return [];
    }
  }

  /**
   * Clean up records older than 30 days
   */
  private async cleanupOldRecords(userId: string): Promise<void> {
    try {
      const allRecords = await AsyncStorage.getItem(this.STORAGE_KEY);
      const records: Record<string, UsageRecord> = allRecords ? JSON.parse(allRecords) : {};

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Remove old records
      Object.keys(records).forEach(key => {
        const record = records[key];
        if (record.userId === userId && new Date(record.date) < thirtyDaysAgo) {
          delete records[key];
        }
      });

      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(records));
    } catch (error) {
      console.error('Error cleaning up old records:', error);
    }
  }

  /**
   * Create empty usage record
   */
  private createEmptyRecord(userId: string, date: string): UsageRecord {
    return {
      userId,
      date,
      questionCount: 0,
      lastQuestionTime: 0,
      messages: []
    };
  }

  /**
   * Get today's date string in YYYY-MM-DD format
   */
  private getTodayString(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  /**
   * Get next reset time (tomorrow at reset hour)
   */
  private getNextResetTime(): Date {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(this.LIMITS.resetHour, 0, 0, 0);
    return tomorrow;
  }

  /**
   * Get current limits
   */
  getLimits(): UsageLimits {
    return { ...this.LIMITS };
  }

  /**
   * Update limits (for admin/testing purposes)
   */
  setLimits(limits: Partial<UsageLimits>): void {
    Object.assign(this.LIMITS, limits);
  }
}

// Export singleton instance
export const aiUsageTracker = AIUsageTracker.getInstance();
