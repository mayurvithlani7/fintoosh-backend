import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from "react";
import { Platform } from 'react-native';

/**
 * Shared stale data warning (reset warning everywhere when data refetched).
 * - Returns [showStaleWarning, lastRefreshed, markRefreshed]
 * - markRefreshed updates AsyncStorage and clears warnings.
 * - showStaleWarning becomes true after timeout from last refresh.
 */
const STORAGE_KEY = "staleDataLastRefreshedTs";

async function getSharedLastRefreshed(defaultValue = Date.now()): Promise<number> {
  try {
    if (Platform.OS === 'web' && typeof window !== "undefined" && window.localStorage) {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const ts = Number(stored);
        if (!isNaN(ts) && ts > 0) return ts;
      }
    } else {
      // React Native: use AsyncStorage
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const ts = Number(stored);
        if (!isNaN(ts) && ts > 0) return ts;
      }
    }
  } catch (error) {
    console.warn('Error reading stale data timestamp:', error);
  }
  return defaultValue;
}

async function setSharedLastRefreshed(ts: number): Promise<void> {
  try {
    if (Platform.OS === 'web' && typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY, ts.toString());
      // For single-tab, dispatch storage event
      if (window.dispatchEvent) {
        window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
      }
    } else {
      // React Native: use AsyncStorage
      await AsyncStorage.setItem(STORAGE_KEY, ts.toString());
    }
  } catch (error) {
    console.warn('Error saving stale data timestamp:', error);
  }
}

export function useStaleDataWarning(staleTimeoutMs = 60000): [boolean, number, () => void] {
  const [lastRefreshed, setLastRefreshed] = useState<number>(Date.now());
  const [showStaleWarning, setShowStaleWarning] = useState(false);

  // Initialize lastRefreshed from storage
  useEffect(() => {
    getSharedLastRefreshed().then(ts => {
      setLastRefreshed(ts);
    });
  }, []);

  // Listen for storage changes to update warning (web only)
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== "undefined" && window.addEventListener) {
      function storageListener(e: StorageEvent) {
        if (e.key === STORAGE_KEY) {
          getSharedLastRefreshed().then(ts => {
            setLastRefreshed(ts);
            setShowStaleWarning(false);
          });
        }
      }
      window.addEventListener("storage", storageListener);
      return () => window.removeEventListener("storage", storageListener);
    }
  }, []);

  // Auto-mark as stale after timeout
  useEffect(() => {
    const checkStale = () => {
      if (Date.now() - lastRefreshed > staleTimeoutMs) {
        setShowStaleWarning(true);
      } else {
        setShowStaleWarning(false);
      }
    };
    checkStale();
    const interval = setInterval(checkStale, 5000);
    return () => clearInterval(interval);
  }, [lastRefreshed, staleTimeoutMs]);

  // Call this after a fresh API fetch - updates shared storage and clears warnings
  const markRefreshed = () => {
    const now = Date.now();
    setLastRefreshed(now);
    setShowStaleWarning(false);
    setSharedLastRefreshed(now);
  };

  return [showStaleWarning, lastRefreshed, markRefreshed];
}
