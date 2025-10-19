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
  fetchChildData: (force?: boolean) => Promise<void>;
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

  // Example API GET requests: customize endpoints as needed
  const fetchChildData = useCallback(async (force = false) => {
    if (!force && !isDataStale('childData')) return;
    setChildDataStatus('loading');
    try {
      // Get current user from AsyncStorage to get familyId
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const currentUserStr = await AsyncStorage.getItem('user');
      const token = await getAuthToken();

      console.log('fetchChildData: userStr exists:', !!currentUserStr, 'token exists:', !!token);

      if (!currentUserStr || !token) {
        throw new Error('No user session found');
      }

      const currentUser = JSON.parse(currentUserStr);
      const familyId = currentUser.familyId;

      console.log('fetchChildData: currentUser familyId:', familyId, 'userId:', currentUser.id);

      // Fetch children in the family
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
      console.log('fetchChildData: received children:', children.length, 'children');

      // For now, return the first child (assuming single child per family)
      // TODO: Update UI to handle multiple children
      const childData = children.length > 0 ? children[0] : null;
      console.log('fetchChildData: setting childData:', childData?.name || 'null');
      setChildData(childData);
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

  // Provider value
  const value: DataCacheContextType = {
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
    CACHE_TIME_DEFAULT
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
