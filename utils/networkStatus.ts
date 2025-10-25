/**
 * Network status monitoring and offline detection utilities.
 * Provides real-time network connectivity monitoring and graceful degradation.
 */

import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';

export interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string;
  isWifiEnabled?: boolean;
}

export interface NetworkStatusHook {
  networkState: NetworkState;
  isOnline: boolean;
  isOffline: boolean;
  connectionType: string;
  refreshNetworkStatus: () => Promise<void>;
}

/**
 * Hook for monitoring network connectivity status
 */
export function useNetworkStatus(): NetworkStatusHook {
  const [networkState, setNetworkState] = useState<NetworkState>({
    isConnected: true,
    isInternetReachable: true,
    type: 'unknown'
  });

  useEffect(() => {
    // Get initial network state
    const getInitialState = async () => {
      try {
        const state = await NetInfo.fetch();
        setNetworkState({
          isConnected: state.isConnected ?? false,
          isInternetReachable: state.isInternetReachable ?? null,
          type: state.type ?? 'unknown',
          isWifiEnabled: state.isWifiEnabled
        });
      } catch (error) {
        console.warn('Failed to get initial network state:', error);
        // Default to online if we can't determine
        setNetworkState({
          isConnected: true,
          isInternetReachable: true,
          type: 'unknown'
        });
      }
    };

    getInitialState();

    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener(state => {
      setNetworkState({
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable ?? null,
        type: state.type ?? 'unknown',
        isWifiEnabled: state.isWifiEnabled
      });
    });

    return unsubscribe;
  }, []);

  const refreshNetworkStatus = async () => {
    try {
      const state = await NetInfo.refresh();
      setNetworkState({
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable ?? null,
        type: state.type ?? 'unknown',
        isWifiEnabled: state.isWifiEnabled
      });
    } catch (error) {
      console.warn('Failed to refresh network status:', error);
    }
  };

  const isOnline = networkState.isConnected && networkState.isInternetReachable !== false;
  const isOffline = !networkState.isConnected || networkState.isInternetReachable === false;

  return {
    networkState,
    isOnline,
    isOffline,
    connectionType: networkState.type,
    refreshNetworkStatus
  };
}

/**
 * Check if the device has internet connectivity
 */
export async function checkInternetConnectivity(): Promise<boolean> {
  try {
    const state = await NetInfo.fetch();
    // Not connected at all
    if (!state.isConnected) {
      return false;
    }
    // Connected but explicitly no internet access
    if (state.isInternetReachable === false) {
      return false;
    }
    // Connected and either reachable or unknown (assume reachable)
    return true;
  } catch (error) {
    console.warn('Failed to check internet connectivity:', error);
    // Fallback: assume online if we can't determine
    return true;
  }
}

/**
 * Get user-friendly network status description
 */
export function getNetworkStatusDescription(networkState: NetworkState): string {
  if (!networkState.isConnected) {
    return 'No network connection';
  }

  if (networkState.isInternetReachable === false) {
    return 'Connected but no internet access';
  }

  switch (networkState.type) {
    case 'wifi':
      return 'Connected via Wi-Fi';
    case 'cellular':
      return 'Connected via mobile data';
    case 'ethernet':
      return 'Connected via Ethernet';
    case 'bluetooth':
      return 'Connected via Bluetooth';
    case 'wimax':
      return 'Connected via WiMAX';
    case 'vpn':
      return 'Connected via VPN';
    case 'other':
      return 'Connected via other network';
    default:
      return 'Network connection available';
  }
}

/**
 * Determine if network conditions are suitable for heavy operations
 */
export function isNetworkSuitableForHeavyOperations(networkState: NetworkState): boolean {
  // Prefer Wi-Fi for heavy operations
  if (networkState.type === 'wifi') {
    return true;
  }

  // Allow cellular only if explicitly connected and internet reachable
  if (networkState.type === 'cellular' && networkState.isConnected && networkState.isInternetReachable) {
    return true;
  }

  // For other connection types, be conservative
  return false;
}

/**
 * Network-aware request queue for handling offline/online transitions
 */
export class NetworkAwareRequestQueue {
  private queue: Array<{
    id: string;
    request: () => Promise<any>;
    resolve: (value: any) => void;
    reject: (error: any) => void;
    priority: 'high' | 'medium' | 'low';
  }> = [];

  private isProcessing = false;
  private isOnline = true;

  constructor() {
    // Monitor network status
    const unsubscribe = NetInfo.addEventListener(state => {
      const wasOnline = this.isOnline;
      // Explicitly check connectivity: connected and not explicitly unreachable
      this.isOnline = Boolean(state.isConnected && state.isInternetReachable !== false);

      // If we just came back online, process the queue
      if (!wasOnline && this.isOnline) {
        this.processQueue();
      }
    });

    // Note: In React Native, NetInfo subscriptions are automatically cleaned up
    // when the app terminates. Manual cleanup is not needed for mobile apps.
  }

  /**
   * Add a request to the queue
   */
  async add<T>(
    request: () => Promise<T>,
    priority: 'high' | 'medium' | 'low' = 'medium'
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);

      this.queue.push({
        id,
        request,
        resolve,
        reject,
        priority
      });

      // Sort by priority (high first)
      this.queue.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });

      // If online, process immediately
      if (this.isOnline && !this.isProcessing) {
        this.processQueue();
      }
    });
  }

  /**
   * Process queued requests
   */
  private async processQueue() {
    if (this.isProcessing || !this.isOnline || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.queue.length > 0 && this.isOnline) {
      const item = this.queue.shift()!;

      try {
        const result = await item.request();
        item.resolve(result);
      } catch (error) {
        item.reject(error);
      }

      // Small delay between requests to avoid overwhelming the network
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.isProcessing = false;
  }

  /**
   * Clear all queued requests
   */
  clear() {
    this.queue.forEach(item => {
      item.reject(new Error('Request cancelled due to network issues'));
    });
    this.queue = [];
  }

  /**
   * Get queue status
   */
  getStatus() {
    return {
      queuedRequests: this.queue.length,
      isProcessing: this.isProcessing,
      isOnline: this.isOnline,
      priorityBreakdown: {
        high: this.queue.filter(item => item.priority === 'high').length,
        medium: this.queue.filter(item => item.priority === 'medium').length,
        low: this.queue.filter(item => item.priority === 'low').length
      }
    };
  }
}

// Global instance for app-wide network-aware request queuing
export const networkRequestQueue = new NetworkAwareRequestQueue();

/**
 * Network-aware API wrapper that handles offline scenarios
 */
export async function networkAwareApiRequest<T>(
  request: () => Promise<T>,
  options: {
    priority?: 'high' | 'medium' | 'low';
    fallbackData?: T;
    showOfflineMessage?: boolean;
    feature?: string;
  } = {}
): Promise<T> {
  const { priority = 'medium', fallbackData, showOfflineMessage = true, feature = 'API' } = options;

  const isOnline = await checkInternetConnectivity();

  if (!isOnline) {
    if (showOfflineMessage) {
      console.warn(`[${feature}] Attempted network request while offline`);
      // Could show offline message here
    }

    if (fallbackData !== undefined) {
      console.log(`[${feature}] Using fallback data while offline`);
      return fallbackData;
    }

    throw new Error('No internet connection available');
  }

  // Use network-aware queue for online requests
  return networkRequestQueue.add(request, priority);
}

/**
 * Hook for graceful degradation based on network conditions
 */
export function useNetworkAwareFeature(
  onlineComponent: React.ComponentType<any>,
  offlineComponent: React.ComponentType<any>,
  degradedComponent?: React.ComponentType<any>
) {
  const { networkState, isOnline, isOffline } = useNetworkStatus();

  // Use degraded component if on slow/unreliable connection
  const shouldUseDegraded = isOnline && !isNetworkSuitableForHeavyOperations(networkState);

  if (isOffline) {
    return offlineComponent;
  }

  if (shouldUseDegraded && degradedComponent) {
    return degradedComponent;
  }

  return onlineComponent;
}
