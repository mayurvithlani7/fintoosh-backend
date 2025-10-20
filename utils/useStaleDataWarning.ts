import { useEffect, useState } from "react";

/**
 * Shared stale data warning (reset warning everywhere when data refetched).
 * - Returns [showStaleWarning, lastRefreshed, markRefreshed]
 * - markRefreshed updates localStorage and notifies all tabs/screens.
 * - showStaleWarning becomes true after 60s (default) from last refresh, or window blur (web).
 */
const STORAGE_KEY = "staleDataLastRefreshedTs";

function getSharedLastRefreshed(defaultValue = Date.now()): number {
  if (typeof window !== "undefined" && window.localStorage) {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const ts = Number(stored);
      if (!isNaN(ts) && ts > 0) return ts;
    }
  }
  return defaultValue;
}

function setSharedLastRefreshed(ts: number) {
  if (typeof window !== "undefined" && window.localStorage) {
    localStorage.setItem(STORAGE_KEY, ts.toString());
    // For single-tab, also dispatch an event so hook updates immediately
    window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
  }
}

export function useStaleDataWarning(staleTimeoutMs = 60000): [boolean, number, () => void] {
  const [lastRefreshed, setLastRefreshed] = useState(() => getSharedLastRefreshed());
  const [showStaleWarning, setShowStaleWarning] = useState(false);

  // Mark as stale on window blur (web)
  useEffect(() => {
    const onBlur = () => setShowStaleWarning(true);
    if (typeof window !== "undefined" && window.addEventListener) {
      window.addEventListener("blur", onBlur);
      return () => window.removeEventListener("blur", onBlur);
    }
  }, []);

  // Listen for storage changes to update warning everywhere
  useEffect(() => {
    function storageListener(e: StorageEvent) {
      if (e.key === STORAGE_KEY) {
        const ts = getSharedLastRefreshed();
        setLastRefreshed(ts);
        setShowStaleWarning(false); // Hide warning across all tabs/screens
      }
    }
    if (typeof window !== "undefined" && window.addEventListener) {
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

  // Call this after a fresh API fetch - updates shared storage and clears warnings everywhere
  const markRefreshed = () => {
    const now = Date.now();
    setLastRefreshed(now);
    setShowStaleWarning(false);
    setSharedLastRefreshed(now);
  };

  return [showStaleWarning, lastRefreshed, markRefreshed];
}
