import { useCallback, useEffect, useState } from 'react';
import { AnalyticsData, exportAnalyticsData, processAnalyticsData } from '../utils/analyticsEngine';

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
}

export function useAnalytics(options: UseAnalyticsOptions = {}): UseAnalyticsReturn {
  const [familyId, setFamilyId] = useState<string | null>(options.familyId || null);
  const { autoFetch = true, cacheTime = 5 * 60 * 1000 } = options; // 5 minutes default cache

  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<number>(0);

  // Cache key for this family's analytics
  const cacheKey = `analytics_${familyId}`;

  const fetchAnalytics = useCallback(async (startDate?: string, endDate?: string) => {
    if (!familyId) {
      setError('Family ID not available');
      return;
    }

    // Check cache validity
    const now = Date.now();
    if (analyticsData && (now - lastFetch) < cacheTime && !startDate && !endDate) {
      return; // Use cached data
    }

    setLoading(true);
    setError(null);

    try {
      const data = await processAnalyticsData(familyId, startDate, endDate);
      setAnalyticsData(data);
      setLastFetch(now);

      // Cache in localStorage for persistence across sessions
      localStorage.setItem(cacheKey, JSON.stringify({
        data,
        timestamp: now
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch analytics data';
      setError(errorMessage);

      // Try to load from cache if available
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
    } finally {
      setLoading(false);
    }
  }, [familyId, analyticsData, lastFetch, cacheTime, cacheKey]);

  const refetch = useCallback(async (startDate?: string, endDate?: string) => {
    await fetchAnalytics(startDate, endDate);
  }, [fetchAnalytics]);

  const exportData = useCallback(() => {
    if (!analyticsData) return null;
    return exportAnalyticsData(analyticsData);
  }, [analyticsData]);

  const clearCache = useCallback(() => {
    localStorage.removeItem(cacheKey);
    setAnalyticsData(null);
    setLastFetch(0);
  }, [cacheKey]);

  // Load cached data on mount
  useEffect(() => {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const { data, timestamp } = JSON.parse(cached);
        const now = Date.now();
        if (now - timestamp < cacheTime) {
          setAnalyticsData(data);
          setLastFetch(timestamp);
        } else {
          // Cache expired, remove it
          localStorage.removeItem(cacheKey);
        }
      } catch (err) {
        // Invalid cache, remove it
        localStorage.removeItem(cacheKey);
      }
    }
  }, [cacheKey, cacheTime]);

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
    clearCache
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
    savingsPotential: 0,
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
