/**
 * Request Deduplication Utility
 * Prevents duplicate API calls for the same endpoint within a short time window
 * Improves performance and reduces server load
 */

interface PendingRequest {
  promise: Promise<any>;
  timestamp: number;
  abortController?: AbortController;
}

interface RequestCache {
  [key: string]: PendingRequest;
}

// Cache for pending requests
const pendingRequests = new Map<string, PendingRequest>();

// Configuration
const DEDUPLICATION_WINDOW = 5000; // 5 seconds - requests within this window are deduplicated
const MAX_CACHE_SIZE = 50; // Maximum number of cached requests

/**
 * Generate a unique key for request deduplication
 */
export function generateRequestKey(method: string, url: string, body?: any): string {
  const bodyKey = body ? JSON.stringify(body) : '';
  return `${method}:${url}:${bodyKey}`;
}

/**
 * Check if a request is currently pending
 */
export function isRequestPending(key: string): boolean {
  const request = pendingRequests.get(key);
  if (!request) return false;

  // Check if request has expired
  const now = Date.now();
  if (now - request.timestamp > DEDUPLICATION_WINDOW) {
    // Clean up expired request
    pendingRequests.delete(key);
    return false;
  }

  return true;
}

/**
 * Get a pending request promise
 */
export function getPendingRequest(key: string): Promise<any> | null {
  const request = pendingRequests.get(key);
  return request ? request.promise : null;
}

/**
 * Store a pending request
 */
export function storePendingRequest(
  key: string,
  promise: Promise<any>,
  abortController?: AbortController
): void {
  // Clean up old requests if cache is getting too large
  if (pendingRequests.size >= MAX_CACHE_SIZE) {
    cleanupExpiredRequests();
  }

  pendingRequests.set(key, {
    promise,
    timestamp: Date.now(),
    abortController
  });
}

/**
 * Remove a completed request from cache
 */
export function removePendingRequest(key: string): void {
  pendingRequests.delete(key);
}

/**
 * Cancel all pending requests for a specific pattern
 */
export function cancelPendingRequests(pattern: string): void {
  for (const [key, request] of pendingRequests.entries()) {
    if (key.includes(pattern) && request.abortController) {
      request.abortController.abort();
      pendingRequests.delete(key);
    }
  }
}

/**
 * Cancel all pending requests
 */
export function cancelAllPendingRequests(): void {
  for (const [key, request] of pendingRequests.entries()) {
    if (request.abortController) {
      request.abortController.abort();
    }
  }
  pendingRequests.clear();
}

/**
 * Clean up expired requests
 */
function cleanupExpiredRequests(): void {
  const now = Date.now();
  const keysToDelete: string[] = [];

  for (const [key, request] of pendingRequests.entries()) {
    if (now - request.timestamp > DEDUPLICATION_WINDOW) {
      keysToDelete.push(key);
    }
  }

  keysToDelete.forEach(key => pendingRequests.delete(key));
}

/**
 * Get deduplication statistics
 */
export function getDeduplicationStats(): {
  pendingRequests: number;
  cacheSize: number;
  keys: string[];
} {
  cleanupExpiredRequests(); // Clean before reporting stats

  return {
    pendingRequests: pendingRequests.size,
    cacheSize: pendingRequests.size,
    keys: Array.from(pendingRequests.keys())
  };
}

/**
 * Enhanced fetch with deduplication
 */
export async function deduplicatedFetch(
  url: string,
  options: RequestInit = {},
  deduplicationKey?: string
): Promise<Response> {
  const method = options.method || 'GET';
  const key = deduplicationKey || generateRequestKey(method, url, options.body);

  // Check if request is already pending
  if (isRequestPending(key)) {
    console.log(`[DEDUPLICATION] Returning cached request for: ${key}`);
    const pendingPromise = getPendingRequest(key);
    if (pendingPromise) {
      // Wait for the original request to complete
      await pendingPromise;
      // Return a new fetch (since we can't return the original Response)
      return fetch(url, options);
    }
  }

  // Create abort controller for this request
  const abortController = new AbortController();
  const enhancedOptions = {
    ...options,
    signal: abortController.signal
  };

  // Create the fetch promise
  const fetchPromise = fetch(url, enhancedOptions);

  // Store the promise
  storePendingRequest(key, fetchPromise, abortController);

  try {
    const response = await fetchPromise;

    // Remove from pending requests
    removePendingRequest(key);

    return response;
  } catch (error) {
    // Remove from pending requests on error
    removePendingRequest(key);
    throw error;
  }
}
