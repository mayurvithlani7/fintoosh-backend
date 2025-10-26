import React, { createContext, useCallback, useContext, useState } from 'react';
import { API_URL } from './config';
import { getAuthToken } from './secureStorage';

type FetchStatus = 'idle' | 'loading' | 'error';

/**
 * The slices of data globally cached in the app.
 */
interface DataCacheContextType {
  // Main data slices
  childData: any | null; // balances, etc
  chores: any[] | null;
  requests: any[] | null;
  goals: any[] | null;
  // UI helpers
  childDataStatus: FetchStatus;
  choresStatus: FetchStatus;
  requestsStatus: FetchStatus;
  goalsStatus: FetchStatus;
  // Last fetched timestamps
  lastFetched: {
    childData: number | null;
    chores: number | null;
    requests: number | null;
    goals: number | null;
  };
  // Core cache helpers
  fetchChildData: (force?: boolean, childId?: string) => Promise<void>;
  fetchChores: (force?: boolean) => Promise<void>;
  fetchRequests: (force?: boolean) => Promise<void>;
  fetchGoals: (force?: boolean) => Promise<void>;
  // Returns true if the specified slice is stale (older than cacheTime, in seconds)
  isDataStale: (slice: keyof DataCacheContextType['lastFetched'], cacheTime?: number) => boolean;
  CACHE_TIME_DEFAULT: number;
}

const CACHE_TIME_DEFAULT = 60; // seconds, can be configured

const DataCacheContext = createContext<DataCacheContextType | undefined>(undefined);

export const DataCacheProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Data slices
  const [childData, setChildData] = useState<any | null>(null);
  const [chores, setChores] = useState<any[] | null>(null);
  const [requests, setRequests] = useState<any[] | null>(null);
  const [goals, setGoals] = useState<any[] | null>(null);

  // Fetch status for UI logic
  const [childDataStatus, setChildDataStatus] = useState<FetchStatus>('idle');
  const [choresStatus, setChoresStatus] = useState<FetchStatus>('idle');
  const [requestsStatus, setRequestsStatus] = useState<FetchStatus>('idle');
  const [goalsStatus, setGoalsStatus] = useState<FetchStatus>('idle');

  // lastFetched timestamps (epoch seconds)
  const [lastFetched, setLastFetched] = useState({
    childData: null as number | null,
    chores: null as number | null,
    requests: null as number | null,
    goals: null as number | null,
  });

  // Helper to determine if cache is stale
  const isDataStale = useCallback(
    (slice: keyof DataCacheContextType['lastFetched'], cacheTime: number = CACHE_TIME_DEFAULT) => {
      const now = Math.floor(Date.now() / 1000);
      const last = lastFetched[slice];
      return last == null || (now - last) > cacheTime;
    },
    [lastFetched]
  );

  // Batch API request for optimized data fetching
  const fetchChildData = useCallback(async (force = false, childId?: string) => {
    if (!force && !isDataStale('childData')) return;
    setChildDataStatus('loading');
    try {
      // Get current user from AsyncStorage to get familyId
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const currentUserStr = await AsyncStorage.getItem('user');
      const token = await getAuthToken();

      console.log('fetchChildData: userStr exists:', !!currentUserStr, 'token exists:', !!token, 'childId:', childId);

      if (!currentUserStr || !token) {
        throw new Error('No user session found');
      }

      const currentUser = JSON.parse(currentUserStr);
      const familyId = currentUser.familyId;
      const userId = currentUser.id;

      console.log('fetchChildData: currentUser role:', currentUser.role, 'familyId:', familyId, 'userId:', userId);

      // If no familyId, set childData to null
      if (!familyId) {
        console.log('fetchChildData: No familyId, setting childData to null');
        setChildData(null);
        setLastFetched(prev => ({ ...prev, childData: Math.floor(Date.now() / 1000) }));
        setChildDataStatus('idle');
        return;
      }

      // Use regular API to fetch children data for the family
      const apiUrl = `${API_URL}/users?familyId=${familyId}&role=child`;
      console.log('fetchChildData: API URL:', apiUrl);

      const res = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('fetchChildData: response status:', res.status);

      if (!res.ok) {
        // Handle rate limiting specifically
        if (res.status === 429) {
          const retryAfter = res.headers.get('Retry-After');
          const waitTime = retryAfter ? parseInt(retryAfter) : 60;
          throw new Error(`Too many requests. Please wait ${waitTime} seconds before trying again.`);
        }
        const errorText = await res.text();
        console.error('fetchChildData: API error:', errorText);
        throw new Error('Failed to fetch child data');
      }

      const children = await res.json();
      console.log('fetchChildData: fetched children count:', children?.length || 0);

      let selectedChild = null;

      if (children && children.length > 0) {
        if (childId) {
          // Find the specific child by ID
          selectedChild = children.find((child: any) => child.id === childId) || null;
          console.log('fetchChildData: found specific child:', selectedChild?.name || 'not found');
        } else {
          // Default to first child if no specific child requested
          selectedChild = children[0];
          console.log('fetchChildData: using first child:', selectedChild?.name || 'null');
        }
      }

      console.log('fetchChildData: setting childData:', selectedChild?.name || 'null');
      setChildData(selectedChild);
      setLastFetched(prev => ({ ...prev, childData: Math.floor(Date.now() / 1000) }));
      setChildDataStatus('idle');
    } catch (err) {
      console.error('fetchChildData: error:', err);
      setChildDataStatus('error');
    }
  }, [isDataStale]);

  const fetchChores = useCallback(async (force = false) => {
    if (!force && !isDataStale('chores')) return;
    setChoresStatus('loading');
    try {
      // Get current user for authentication
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const currentUserStr = await AsyncStorage.getItem('user');
      const token = await getAuthToken();

      if (!currentUserStr || !token) {
        throw new Error('No user session found');
      }

      const currentUser = JSON.parse(currentUserStr);
      const res = await fetch(`${API_URL}/chores/${currentUser.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Failed to fetch chores');
      const data = await res.json();
      setChores(data);
      setLastFetched(prev => ({ ...prev, chores: Math.floor(Date.now() / 1000) }));
      setChoresStatus('idle');
    } catch (err) {
      setChoresStatus('error');
    }
  }, [isDataStale]);

  const fetchRequests = useCallback(async (force = false) => {
    if (!force && !isDataStale('requests')) return;
    setRequestsStatus('loading');
    try {
      // Get current user for authentication
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const currentUserStr = await AsyncStorage.getItem('user');
      const token = await getAuthToken();

      if (!currentUserStr || !token) {
        throw new Error('No user session found');
      }

      const currentUser = JSON.parse(currentUserStr);
      const res = await fetch(`${API_URL}/requests/${currentUser.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Failed to fetch requests');
      const data = await res.json();
      setRequests(data);
      setLastFetched(prev => ({ ...prev, requests: Math.floor(Date.now() / 1000) }));
      setRequestsStatus('idle');
    } catch (err) {
      setRequestsStatus('error');
    }
  }, [isDataStale]);

  const fetchGoals = useCallback(async (force = false) => {
    if (!force && !isDataStale('goals')) return;
    setGoalsStatus('loading');
    try {
      // Get current user for authentication
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const currentUserStr = await AsyncStorage.getItem('user');
      const token = await getAuthToken();

      if (!currentUserStr || !token) {
        throw new Error('No user session found');
      }

      const currentUser = JSON.parse(currentUserStr);
      const res = await fetch(`${API_URL}/goals/${currentUser.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Failed to fetch goals');
      const data = await res.json();
      setGoals(data);
      setLastFetched(prev => ({ ...prev, goals: Math.floor(Date.now() / 1000) }));
      setGoalsStatus('idle');
    } catch (err) {
      setGoalsStatus('error');
    }
  }, [isDataStale]);

  // Reset function: clears all cache state and fetch status
  const resetDataCache = useCallback(() => {
    setChildData(null);
    setChores(null);
    setRequests(null);
    setGoals(null);
    setChildDataStatus('idle');
    setChoresStatus('idle');
    setRequestsStatus('idle');
    setGoalsStatus('idle');
    setLastFetched({
      childData: null,
      chores: null,
      requests: null,
      goals: null,
    });
  }, []);

  // Provider value
  const value: DataCacheContextType & { resetDataCache: () => void } = {
    childData,
    chores,
    requests,
    goals,
    childDataStatus,
    choresStatus,
    requestsStatus,
    goalsStatus,
    lastFetched,
    fetchChildData,
    fetchChores,
    fetchRequests,
    fetchGoals,
    isDataStale,
    CACHE_TIME_DEFAULT,
    resetDataCache,
  };

  return (
    <DataCacheContext.Provider value={value}>
      {children}
    </DataCacheContext.Provider>
  );
};

// Hook
export function useDataCache() {
  const ctx = useContext(DataCacheContext);
  if (!ctx) throw new Error('useDataCache must be used within DataCacheProvider');
  return ctx;
}
