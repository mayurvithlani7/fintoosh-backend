import { useCallback, useEffect, useState } from 'react';
import { AnalyticsData, exportAnalyticsData } from '../utils/analyticsEngine';

interface UseAnalyticsOptions {
  familyId?: string;
  autoFetch?: boolean;
  cacheTime?: number; // in milliseconds
}

interface UseAnalyticsReturn {
  analyticsData: AnalyticsData | null;
  loading: boolean;
  error: string | null;
  refetch: (startDate?: string, endDate?: string) => Promise<void>;
  exportData: () => string | null;
  clearCache: () => void;
  processData: () => Promise<void>; // New lazy processing method
}

export function useAnalytics(options: UseAnalyticsOptions = {}): UseAnalyticsReturn {
  const [familyId, setFamilyId] = useState<string | null>(options.familyId || null);

  // Load familyId from secure storage on mount
  useEffect(() => {
    const loadFamilyId = async () => {
      if (!options.familyId) {
        try {
          const { getUser } = await import('../utils/secureStorage');
          const user = await getUser();
          if (user && user.familyId) {
            setFamilyId(user.familyId);
          } else {
            // If no user or familyId, set error immediately
            setError('Family ID not available');
          }
        } catch (error) {
          console.error('Error loading familyId:', error);
          setError('Family ID not available');
        }
      }
    };

    loadFamilyId();
  }, [options.familyId]);
  const { autoFetch = true, cacheTime = 5 * 60 * 1000 } = options; // 5 minutes default cache

  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<number>(0);

  // Lazy processing state
  const [rawData, setRawData] = useState<any>(null);
  const [isProcessed, setIsProcessed] = useState(false);

  // Cache key for this family's analytics
  const cacheKey = familyId ? `analytics_${familyId}` : null;

  const fetchAnalytics = useCallback(async (startDate?: string, endDate?: string, forceRefresh: boolean = false) => {
    if (!familyId) {
      setError('Family ID not available');
      return;
    }

    // Check cache validity (skip if force refresh)
    const now = Date.now();
    if (!forceRefresh && analyticsData && (now - lastFetch) < cacheTime && !startDate && !endDate) {
      return; // Use cached data
    }

    setLoading(true);
    setError(null);

    try {
      // Lazy loading: fetch raw data first (lightweight)
    const { fetchAnalyticsRawData, processAnalyticsRawData } = await import('../utils/analyticsEngine');
    const rawData = await fetchAnalyticsRawData(familyId, startDate, endDate, forceRefresh);
      setRawData(rawData);
      setIsProcessed(false);

      // Process data immediately for now (can be made lazy later)
      const processedData = processAnalyticsRawData(rawData);
      setAnalyticsData(processedData);
      setIsProcessed(true);
      setLastFetch(now);

      // Cache in localStorage for persistence across sessions
      if (typeof localStorage !== "undefined" && cacheKey) {
        localStorage.setItem(cacheKey, JSON.stringify({
          data: processedData,
          timestamp: now
        }));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch analytics data';
      setError(errorMessage);

      // Try to load from cache if available
      if (typeof localStorage !== "undefined" && cacheKey) {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          try {
            const { data, timestamp } = JSON.parse(cached);
            if (now - timestamp < cacheTime * 2) { // Allow slightly older cache on error
              setAnalyticsData(data);
              setError(`${errorMessage} (showing cached data)`);
            }
          } catch (cacheErr) {
            // Ignore cache parsing errors
          }
        }
      }
    } finally {
      setLoading(false);
    }
  }, [familyId, analyticsData, lastFetch, cacheTime, cacheKey]);

  const refetch = useCallback(async (startDate?: string, endDate?: string) => {
    await fetchAnalytics(startDate, endDate, true); // Force refresh
  }, [fetchAnalytics]);

  const exportData = useCallback(() => {
    if (!analyticsData) return null;
    return exportAnalyticsData(analyticsData);
  }, [analyticsData]);

  const clearCache = useCallback(() => {
    console.log('[ANALYTICS] Clearing all analytics caches');
    if (typeof localStorage !== "undefined") {
      // Clear all analytics caches
      const keys = Object.keys(localStorage).filter(key => key.startsWith('analytics_'));
      keys.forEach(key => {
        console.log('[ANALYTICS] Removing cache:', key);
        localStorage.removeItem(key);
      });
    }
    setAnalyticsData(null);
    setLastFetch(0);
    setRawData(null);
    setIsProcessed(false);
  }, []);

  // Lazy processing function - processes raw data when called
  const processData = useCallback(async () => {
    if (!rawData || isProcessed) return;

    try {
      const { processAnalyticsRawData } = await import('../utils/analyticsEngine');
      const processedData = processAnalyticsRawData(rawData);
      setAnalyticsData(processedData);
      setIsProcessed(true);
    } catch (err) {
      console.error('Error processing analytics data:', err);
      setError('Failed to process analytics data');
    }
  }, [rawData, isProcessed]);

  // Load cached data on mount (but skip if cache was just cleared)
  useEffect(() => {
    if (typeof localStorage !== "undefined" && lastFetch === 0 && cacheKey) { // Only load if not recently cleared and cacheKey exists
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const { data, timestamp } = JSON.parse(cached);
          const now = Date.now();
          if (now - timestamp < cacheTime) {
            console.log('[ANALYTICS] Loading cached data for', cacheKey);
            setAnalyticsData(data);
            setLastFetch(timestamp);
          } else {
            // Cache expired, remove it
            console.log('[ANALYTICS] Cache expired, removing', cacheKey);
            localStorage.removeItem(cacheKey);
          }
        } catch (err) {
          // Invalid cache, remove it
          console.log('[ANALYTICS] Invalid cache, removing', cacheKey);
          localStorage.removeItem(cacheKey);
        }
      }
    }
  }, [cacheKey, cacheTime, lastFetch]);

  // Auto-fetch on mount if enabled and no cached data
  useEffect(() => {
    if (autoFetch && familyId && !analyticsData) {
      fetchAnalytics();
    }
  }, [autoFetch, familyId, analyticsData, fetchAnalytics]);

  return {
    analyticsData,
    loading,
    error,
    refetch,
    exportData,
    clearCache,
    processData
  };
}

// Hook for specific analytics components
export function useSpendingTrends(timeRange: number = 30) {
  const { analyticsData, loading, error } = useAnalytics();

  const trends = analyticsData?.spendingTrends.filter(trend => {
    const trendDate = new Date(trend.date);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - timeRange);
    return trendDate >= cutoffDate;
  }) || [];

  return { trends, loading, error };
}

export function useChoreCompletion() {
  const { analyticsData, loading, error } = useAnalytics();

  const completionStats = analyticsData?.choreCompletion || [];
  const topPerformers = completionStats.slice(0, 5); // Top 5 chores
  const averageCompletionRate = completionStats.length > 0
    ? completionStats.reduce((sum, chore) => sum + chore.completionRate, 0) / completionStats.length
    : 0;

  return {
    completionStats,
    topPerformers,
    averageCompletionRate: Math.round(averageCompletionRate),
    loading,
    error
  };
}

export function useJarAnalytics() {
  const { analyticsData, loading, error } = useAnalytics();

  const jarData = analyticsData?.jarDistribution || [];
  const totalBalance = jarData.reduce((sum, jar) => sum + jar.currentBalance, 0);
  const bestPerformingJar = jarData.reduce((best, current) =>
    current.growthRate > best.growthRate ? current : best,
    jarData[0] || { growthRate: 0 }
  );

  return {
    jarData,
    totalBalance,
    bestPerformingJar,
    loading,
    error
  };
}

export function useGoalProgress() {
  const { analyticsData, loading, error } = useAnalytics();

  const goalMetrics = analyticsData?.goalProgress || [];
  const onTrackGoals = goalMetrics.filter(g => g.projectedCompletion === 'On Track');
  const behindScheduleGoals = goalMetrics.filter(g => g.projectedCompletion === 'Behind Schedule');
  const overdueGoals = goalMetrics.filter(g => g.projectedCompletion === 'Overdue');

  const overallProgress = goalMetrics.length > 0
    ? goalMetrics.reduce((sum, goal) => sum + goal.progress, 0) / goalMetrics.length
    : 0;

  return {
    goalMetrics,
    onTrackGoals,
    behindScheduleGoals,
    overdueGoals,
    overallProgress: Math.round(overallProgress),
    loading,
    error
  };
}

export function usePredictions() {
  const { analyticsData, loading, error } = useAnalytics();

  const predictions = analyticsData?.predictions || {
    nextMonthSpending: 0,
    nextMonthSavingsPot: 0,
    nextMonthSpendingPot: 0,
    recommendations: [],
    riskLevel: 'low' as const
  };

  const riskColor = {
    low: '#4CAF50',
    medium: '#FF9800',
    high: '#F44336'
  };

  const riskText = {
    low: 'Low Risk',
    medium: 'Medium Risk',
    high: 'High Risk'
  };

  return {
    predictions,
    riskColor: riskColor[predictions.riskLevel],
    riskText: riskText[predictions.riskLevel],
    loading,
    error
  };
}
