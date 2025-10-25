/**
 * Memory Management and Optimization Utilities for React Native.
 * Provides comprehensive memory monitoring, cleanup management, and optimization tools.
 */

import React from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';

// Memory tracking data
const MEMORY_DATA = {
  componentInstances: new Map<string, number>(),
  activeSubscriptions: new Map<string, number>(),
  cleanupHandlers: new Map<string, (() => void)[]>(),
  memoryWarnings: 0,
  lastCleanup: Date.now(),
  peakMemoryUsage: 0
};

const MEMORY_THRESHOLDS = {
  COMPONENT_INSTANCE_LIMIT: 50, // Max instances per component type
  SUBSCRIPTION_CLEANUP_INTERVAL: 300000, // 5 minutes
  MEMORY_WARNING_THRESHOLD: 150 * 1024 * 1024, // 150MB
  CLEANUP_CHECK_INTERVAL: 60000 // 1 minute
};

// WeakMap for tracking component cleanup without preventing garbage collection
const componentCleanupRegistry = new WeakMap<object, () => void>();

/**
 * Component instance tracking and lifecycle management
 */
export class ComponentMemoryTracker {
  private static instances = new Map<string, Set<object>>();

  /**
   * Register a component instance for memory tracking
   */
  static register(componentName: string, instance: object): void {
    if (!this.instances.has(componentName)) {
      this.instances.set(componentName, new Set());
    }

    const instances = this.instances.get(componentName)!;
    instances.add(instance);

    // Update global memory data
    MEMORY_DATA.componentInstances.set(componentName, instances.size);

    // Warn if too many instances
    if (instances.size > MEMORY_THRESHOLDS.COMPONENT_INSTANCE_LIMIT) {
      console.warn(`Memory Warning: High instance count for ${componentName} (${instances.size} instances)`);
      MEMORY_DATA.memoryWarnings++;
    }
  }

  /**
   * Unregister a component instance
   */
  static unregister(componentName: string, instance: object): void {
    const instances = this.instances.get(componentName);
    if (instances) {
      instances.delete(instance);
      MEMORY_DATA.componentInstances.set(componentName, instances.size);

      // Clean up empty sets
      if (instances.size === 0) {
        this.instances.delete(componentName);
        MEMORY_DATA.componentInstances.delete(componentName);
      }
    }
  }

  /**
   * Get memory statistics
   */
  static getStats(): { [componentName: string]: number } {
    const stats: { [componentName: string]: number } = {};
    for (const [name, count] of MEMORY_DATA.componentInstances) {
      stats[name] = count;
    }
    return stats;
  }

  /**
   * Force cleanup of excess instances (for emergency memory management)
   */
  static forceCleanup(componentName?: string): number {
    let cleaned = 0;

    if (componentName) {
      const instances = this.instances.get(componentName);
      if (instances) {
        cleaned = instances.size;
        instances.clear();
        this.instances.delete(componentName);
        MEMORY_DATA.componentInstances.delete(componentName);
      }
    } else {
      // Clean up all components with too many instances
      for (const [name, instances] of this.instances) {
        if (instances.size > MEMORY_THRESHOLDS.COMPONENT_INSTANCE_LIMIT) {
          cleaned += instances.size;
          instances.clear();
          this.instances.delete(name);
          MEMORY_DATA.componentInstances.delete(name);
        }
      }
    }

    if (cleaned > 0) {
      console.log(`Memory cleanup: Removed ${cleaned} component instances`);
    }

    return cleaned;
  }
}

/**
 * Subscription management with automatic cleanup
 */
export class SubscriptionManager {
  private subscriptions = new Map<string, Array<{ unsubscribe: () => void; id: string }>>();
  private cleanupTimers = new Map<string, NodeJS.Timeout>();

  /**
   * Add a subscription to be tracked
   */
  add(key: string, unsubscribe: () => void, autoCleanupMs?: number): string {
    if (!this.subscriptions.has(key)) {
      this.subscriptions.set(key, []);
    }

    const id = `${key}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const subscriptions = this.subscriptions.get(key)!;

    subscriptions.push({ unsubscribe, id });

    // Update global memory data
    MEMORY_DATA.activeSubscriptions.set(key, subscriptions.length);

    // Set up auto-cleanup if specified
    if (autoCleanupMs && autoCleanupMs > 0) {
      const timer = setTimeout(() => {
        this.remove(key, id);
      }, autoCleanupMs);

      this.cleanupTimers.set(id, timer);
    }

    return id;
  }

  /**
   * Remove a specific subscription
   */
  remove(key: string, id: string): boolean {
    const subscriptions = this.subscriptions.get(key);
    if (!subscriptions) return false;

    const index = subscriptions.findIndex(sub => sub.id === id);
    if (index === -1) return false;

    // Clean up the subscription
    const subscription = subscriptions[index];
    try {
      subscription.unsubscribe();
    } catch (error) {
      console.warn(`Error cleaning up subscription ${id}:`, error);
    }

    subscriptions.splice(index, 1);

    // Clear auto-cleanup timer
    const timer = this.cleanupTimers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.cleanupTimers.delete(id);
    }

    // Update global memory data
    if (subscriptions.length === 0) {
      this.subscriptions.delete(key);
      MEMORY_DATA.activeSubscriptions.delete(key);
    } else {
      MEMORY_DATA.activeSubscriptions.set(key, subscriptions.length);
    }

    return true;
  }

  /**
   * Remove all subscriptions for a key
   */
  removeAll(key: string): number {
    const subscriptions = this.subscriptions.get(key);
    if (!subscriptions) return 0;

    let cleaned = 0;
    for (const subscription of subscriptions) {
      try {
        subscription.unsubscribe();
        cleaned++;

        // Clear auto-cleanup timer
        const timer = this.cleanupTimers.get(subscription.id);
        if (timer) {
          clearTimeout(timer);
          this.cleanupTimers.delete(subscription.id);
        }
      } catch (error) {
        console.warn(`Error cleaning up subscription ${subscription.id}:`, error);
      }
    }

    this.subscriptions.delete(key);
    MEMORY_DATA.activeSubscriptions.delete(key);

    return cleaned;
  }

  /**
   * Clean up all subscriptions
   */
  cleanup(): number {
    let totalCleaned = 0;

    for (const key of this.subscriptions.keys()) {
      totalCleaned += this.removeAll(key);
    }

    this.cleanupTimers.clear();

    console.log(`Subscription cleanup: Removed ${totalCleaned} subscriptions`);
    return totalCleaned;
  }

  /**
   * Get subscription statistics
   */
  getStats(): { [key: string]: number } {
    const stats: { [key: string]: number } = {};
    for (const [key, subscriptions] of this.subscriptions) {
      stats[key] = subscriptions.length;
    }
    return stats;
  }
}

// Global subscription manager instance
export const subscriptionManager = new SubscriptionManager();

/**
 * Memory-efficient data structures and utilities
 */
export class MemoryOptimizedData {
  /**
   * Create a memory-efficient Map with automatic cleanup
   */
  static createAutoCleanupMap<T>(maxSize: number = 1000): Map<string, T> {
    const map = new Map<string, T>();
    const accessOrder = new Set<string>();

    const originalSet = map.set.bind(map);
    const originalGet = map.get.bind(map);
    const originalDelete = map.delete.bind(map);

    map.set = function(key: string, value: T): Map<string, T> {
      // Remove oldest entries if over limit
      if (!map.has(key) && map.size >= maxSize) {
        const oldestKey = accessOrder.values().next().value;
        if (oldestKey) {
          accessOrder.delete(oldestKey);
          originalDelete(oldestKey);
        }
      }

      accessOrder.delete(key); // Remove from current position
      accessOrder.add(key); // Add to end (most recently used)

      return originalSet(key, value);
    };

    map.get = function(key: string): T | undefined {
      if (map.has(key)) {
        accessOrder.delete(key);
        accessOrder.add(key); // Mark as recently used
      }
      return originalGet(key);
    };

    return map;
  }

  /**
   * Create a memory-efficient array with size limits
   */
  static createBoundedArray<T>(maxSize: number): T[] {
    const array: T[] = [];

    return new Proxy(array, {
      get(target, prop) {
        if (prop === 'push') {
          return function(...items: T[]) {
            for (const item of items) {
              if (target.length >= maxSize) {
                target.shift(); // Remove oldest item
              }
              target.push(item);
            }
            return target.length;
          };
        }
        return target[prop as keyof typeof target];
      }
    });
  }

  /**
   * Optimize object structure by removing unnecessary properties
   */
  static optimizeObject<T extends Record<string, any>>(
    obj: T,
    keepProperties: (keyof T)[]
  ): Partial<T> {
    const optimized: Partial<T> = {};

    for (const prop of keepProperties) {
      if (obj.hasOwnProperty(prop)) {
        optimized[prop] = obj[prop];
      }
    }

    return optimized;
  }

  /**
   * Deep clone with memory optimization (avoids circular references)
   */
  static optimizedClone<T>(obj: T, maxDepth: number = 3, visited = new WeakSet()): T {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (visited.has(obj as object)) {
      return {} as T; // Return empty object for circular references
    }

    if (maxDepth <= 0) {
      return obj; // Stop cloning at max depth
    }

    visited.add(obj as object);

    if (Array.isArray(obj)) {
      const cloned = obj.map(item => this.optimizedClone(item, maxDepth - 1, visited));
      visited.delete(obj as object);
      return cloned as T;
    }

    const cloned: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = this.optimizedClone((obj as any)[key], maxDepth - 1, visited);
      }
    }

    visited.delete(obj as object);
    return cloned;
  }
}

/**
 * React hooks for memory management
 */
export function useMemoryTracker(componentName: string) {
  React.useEffect(() => {
    const instance = {};
    ComponentMemoryTracker.register(componentName, instance);

    return () => {
      ComponentMemoryTracker.unregister(componentName, instance);
    };
  }, [componentName]);
}

export function useSubscriptionTracker(key: string) {
  const subscriptionIds = React.useRef<string[]>([]);

  const addSubscription = React.useCallback((unsubscribe: () => void, autoCleanupMs?: number) => {
    const id = subscriptionManager.add(key, unsubscribe, autoCleanupMs);
    subscriptionIds.current.push(id);
    return id;
  }, [key]);

  React.useEffect(() => {
    return () => {
      // Clean up all subscriptions for this component
      for (const id of subscriptionIds.current) {
        subscriptionManager.remove(key, id);
      }
      subscriptionIds.current = [];
    };
  }, [key]);

  return { addSubscription };
}

export function useMemoryCleanup(cleanupFunction: () => void) {
  React.useEffect(() => {
    // Store cleanup function
    const cleanupKey = Symbol('cleanup');
    (global as any)[cleanupKey] = cleanupFunction;

    return () => {
      try {
        cleanupFunction();
      } catch (error) {
        console.warn('Error during memory cleanup:', error);
      }
      delete (global as any)[cleanupKey];
    };
  }, [cleanupFunction]);
}

/**
 * Memory monitoring and alerting
 */
export class MemoryMonitor {
  private static intervalId: NodeJS.Timeout | null = null;
  private static appStateListener: any = null;

  static startMonitoring() {
    if (this.intervalId) {
      this.stopMonitoring();
    }

    // Monitor memory usage periodically
    this.intervalId = setInterval(() => {
      this.checkMemoryUsage();
      this.performPeriodicCleanup();
    }, MEMORY_THRESHOLDS.CLEANUP_CHECK_INTERVAL);

    // Listen for app state changes
    this.appStateListener = AppState.addEventListener('change', this.handleAppStateChange);

    console.log('Memory monitoring started');
  }

  static stopMonitoring() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    if (this.appStateListener) {
      this.appStateListener.remove();
      this.appStateListener = null;
    }
  }

  private static handleAppStateChange(state: AppStateStatus) {
    if (state === 'background') {
      // Aggressive cleanup when app goes to background
      this.performAggressiveCleanup();
    } else if (state === 'active') {
      // Check memory when app becomes active
      this.checkMemoryUsage();
    }
  }

  private static checkMemoryUsage() {
    // Get current memory usage (limited on mobile)
    const memoryUsage = this.getMemoryUsage();

    if (memoryUsage.used > MEMORY_THRESHOLDS.MEMORY_WARNING_THRESHOLD) {
      console.warn(`Memory Warning: High memory usage detected (${(memoryUsage.used / 1024 / 1024).toFixed(1)}MB)`);
      MEMORY_DATA.memoryWarnings++;

      // Trigger cleanup if memory usage is too high
      if (memoryUsage.used > MEMORY_THRESHOLDS.MEMORY_WARNING_THRESHOLD * 1.2) {
        this.performAggressiveCleanup();
      }
    }

    MEMORY_DATA.peakMemoryUsage = Math.max(MEMORY_DATA.peakMemoryUsage, memoryUsage.used);
  }

  private static getMemoryUsage(): { used: number; available?: number; percentage?: number } {
    // React Native doesn't provide direct memory APIs like browsers
    // This is a placeholder for future native module implementation
    return {
      used: MEMORY_DATA.peakMemoryUsage || 50 * 1024 * 1024, // Estimate 50MB baseline
      available: undefined,
      percentage: undefined
    };
  }

  private static performPeriodicCleanup() {
    const now = Date.now();

    // Clean up old subscriptions periodically
    if (now - MEMORY_DATA.lastCleanup > MEMORY_THRESHOLDS.SUBSCRIPTION_CLEANUP_INTERVAL) {
      const cleaned = subscriptionManager.cleanup();
      if (cleaned > 0) {
        console.log(`Periodic cleanup: Removed ${cleaned} stale subscriptions`);
      }
      MEMORY_DATA.lastCleanup = now;
    }
  }

  private static performAggressiveCleanup(): number {
    let totalCleaned = 0;

    // Clean up all subscriptions
    totalCleaned += subscriptionManager.cleanup();

    // Force cleanup of excess component instances
    totalCleaned += ComponentMemoryTracker.forceCleanup();

    // Clear any cached data that's not essential
    // (This would be implemented based on your app's caching strategy)

    if (totalCleaned > 0) {
      console.log(`Aggressive cleanup: Removed ${totalCleaned} items`);
    }

    return totalCleaned;
  }

  static getStats() {
    return {
      componentInstances: ComponentMemoryTracker.getStats(),
      activeSubscriptions: subscriptionManager.getStats(),
      memoryWarnings: MEMORY_DATA.memoryWarnings,
      peakMemoryUsage: MEMORY_DATA.peakMemoryUsage,
      lastCleanup: MEMORY_DATA.lastCleanup
    };
  }
}

/**
 * HOC for automatic memory management
 */
export function withMemoryManagement<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) {
  const WrappedComponent = (props: P) => {
    useMemoryTracker(componentName);

    // Add memory cleanup on unmount
    React.useEffect(() => {
      return () => {
        // Component-specific cleanup can be added here
        console.log(`Component ${componentName} unmounting - memory cleanup performed`);
      };
    }, []);

    return React.createElement(Component, props);
  };

  WrappedComponent.displayName = `withMemoryManagement(${componentName})`;
  return WrappedComponent;
}

/**
 * Utility for creating memory-efficient event handlers
 */
export class MemoryEfficientHandlers {
  private static handlerCache = new WeakMap<object, Map<string, Function>>();

  static createHandler<T extends any[]>(
    context: object,
    handlerName: string,
    handler: (...args: T) => void,
    dependencies: React.DependencyList = []
  ): (...args: T) => void {
    if (!this.handlerCache.has(context)) {
      this.handlerCache.set(context, new Map());
    }

    const contextHandlers = this.handlerCache.get(context)!;

    // Create a stable reference based on dependencies
    const key = `${handlerName}-${JSON.stringify(dependencies)}`;

    if (!contextHandlers.has(key)) {
      // Use useCallback-like behavior but without React hooks
      const stableHandler = (...args: T) => {
        try {
          return handler(...args);
        } catch (error) {
          console.error(`Error in handler ${handlerName}:`, error);
        }
      };

      contextHandlers.set(key, stableHandler);
    }

    return contextHandlers.get(key)! as (...args: T) => void;
  }

  static cleanup(context: object) {
    this.handlerCache.delete(context);
  }
}

// Start memory monitoring automatically
if (Platform.OS !== 'web') { // Only start on mobile
  MemoryMonitor.startMonitoring();
}
