/**
 * Performance monitoring and optimization utilities for React Native.
 * Provides real-time performance tracking, memory monitoring, and optimization alerts.
 */

import React from 'react';
import { Animated, Dimensions, Platform } from 'react-native';

// Performance metrics storage
const PERFORMANCE_DATA = {
  frameDrops: 0,
  memoryUsage: 0,
  renderTime: 0,
  lastFrameTime: 0,
  frameCount: 0,
  slowRenders: 0
};

const PERFORMANCE_THRESHOLDS = {
  SLOW_RENDER_MS: 16.67, // 60fps threshold
  MEMORY_WARNING_MB: 100,
  FRAME_DROP_THRESHOLD: 5
};

// Animation performance tracking
let animationFrameCallback: number | null = null;
let lastFrameTime = 0;
let frameDrops = 0;

export interface PerformanceMetrics {
  frameRate: number;
  memoryUsage: number;
  renderTime: number;
  frameDrops: number;
  slowRenders: number;
  deviceInfo: {
    platform: string;
    dimensions: { width: number; height: number };
    pixelRatio: number;
  };
}

/**
 * Start performance monitoring
 */
export function startPerformanceMonitoring() {
  if (animationFrameCallback) {
    stopPerformanceMonitoring();
  }

  const monitorFrameRate = (timestamp: number) => {
    if (lastFrameTime > 0) {
      const frameTime = timestamp - lastFrameTime;
      const targetFrameTime = 1000 / 60; // 60fps

      if (frameTime > targetFrameTime * 1.5) { // Allow 50% tolerance
        frameDrops++;
        PERFORMANCE_DATA.frameDrops = frameDrops;
      }

      PERFORMANCE_DATA.frameCount++;

      // Calculate frame rate every 60 frames
      if (PERFORMANCE_DATA.frameCount % 60 === 0) {
        const avgFrameTime = frameTime;
        const frameRate = 1000 / avgFrameTime;

        if (frameRate < 50) { // Below 50fps
          console.warn(`Performance Alert: Low frame rate detected: ${frameRate.toFixed(1)}fps`);

          // Alert for consistently poor performance
          if (frameDrops > PERFORMANCE_THRESHOLDS.FRAME_DROP_THRESHOLD) {
            console.error(`Critical Performance Issue: High frame drops (${frameDrops}) detected. Consider optimizing animations.`);
          }
        }
      }
    }

    lastFrameTime = timestamp;
    animationFrameCallback = requestAnimationFrame(monitorFrameRate);
  };

  animationFrameCallback = requestAnimationFrame(monitorFrameRate);
  console.log('Performance monitoring started');
}

/**
 * Stop performance monitoring
 */
export function stopPerformanceMonitoring() {
  if (animationFrameCallback) {
    cancelAnimationFrame(animationFrameCallback);
    animationFrameCallback = null;
    lastFrameTime = 0;
    frameDrops = 0;
  }
}

/**
 * Get current performance metrics
 */
export function getPerformanceMetrics(): PerformanceMetrics {
  const { width, height } = Dimensions.get('window');

  return {
    frameRate: PERFORMANCE_DATA.frameCount > 0 ? 60 / (1 + PERFORMANCE_DATA.frameDrops / PERFORMANCE_DATA.frameCount) : 60,
    memoryUsage: PERFORMANCE_DATA.memoryUsage,
    renderTime: PERFORMANCE_DATA.renderTime,
    frameDrops: PERFORMANCE_DATA.frameDrops,
    slowRenders: PERFORMANCE_DATA.slowRenders,
    deviceInfo: {
      platform: Platform.OS,
      dimensions: { width, height },
      pixelRatio: Dimensions.get('screen').scale
    }
  };
}

/**
 * Measure render time for components
 */
export function measureRenderTime<T extends any[]>(
  componentName: string,
  renderFunction: (...args: T) => React.ReactElement,
  ...args: T
): React.ReactElement {
  const startTime = performance.now();

  const element = renderFunction(...args);

  const endTime = performance.now();
  const renderTime = endTime - startTime;

  PERFORMANCE_DATA.renderTime = renderTime;

  if (renderTime > PERFORMANCE_THRESHOLDS.SLOW_RENDER_MS) {
    PERFORMANCE_DATA.slowRenders++;
    console.warn(`Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`);
  }

  return element;
}

/**
 * Optimized animation utilities with performance monitoring
 */
export const AnimationUtils = {
  /**
   * Create optimized timing animation with performance tracking
   */
  createOptimizedTiming: (config: {
    toValue: number | Animated.Value;
    duration?: number;
    useNativeDriver?: boolean;
    easing?: (value: number) => number;
    onComplete?: () => void;
  }) => {
    const startTime = performance.now();

    return {
      ...config,
      useNativeDriver: config.useNativeDriver !== false, // Default to true
      onComplete: () => {
        const animationTime = performance.now() - startTime;

        if (animationTime > 500) { // Slow animation warning
          console.warn(`Slow animation detected: ${animationTime.toFixed(2)}ms`);
        }

        config.onComplete?.();
      }
    };
  },

  /**
   * Check if native drivers should be used for an animation
   */
  shouldUseNativeDriver: (animatedProperty: string): boolean => {
    // Properties that support native drivers
    const nativeDriverProperties = [
      'opacity',
      'transform',
      'scale',
      'rotate',
      'translateX',
      'translateY',
      'scaleX',
      'scaleY',
      'rotation'
    ];

    // Properties that don't support native drivers (layout properties)
    const layoutProperties = [
      'width',
      'height',
      'margin',
      'padding',
      'flex',
      'position'
    ];

    // Check if it's a layout property
    const isLayoutProperty = layoutProperties.some(prop =>
      animatedProperty.toLowerCase().includes(prop)
    );

    return !isLayoutProperty && nativeDriverProperties.some(prop =>
      animatedProperty.toLowerCase().includes(prop)
    );
  },

  /**
   * Batch multiple animations for better performance
   */
  createAnimationBatch: (animations: Animated.CompositeAnimation[]) => {
    return Animated.parallel(animations, { stopTogether: false });
  },

  /**
   * Optimized spring animation with performance tracking
   */
  createOptimizedSpring: (config: {
    toValue: number;
    friction?: number;
    tension?: number;
    useNativeDriver?: boolean;
    onComplete?: () => void;
  }) => {
    const startTime = performance.now();

    return {
      ...config,
      friction: config.friction || 7,
      tension: config.tension || 40,
      useNativeDriver: config.useNativeDriver !== false,
      onComplete: () => {
        const animationTime = performance.now() - startTime;
        config.onComplete?.();
      }
    };
  }
};

/**
 * Memory usage monitoring (limited on mobile)
 */
export function getMemoryUsage(): { used: number; available?: number; percentage?: number } {
  // Note: React Native doesn't provide direct memory monitoring APIs
  // This is a placeholder for future implementation with custom native modules
  return {
    used: PERFORMANCE_DATA.memoryUsage,
    available: undefined,
    percentage: undefined
  };
}

/**
 * Performance alert system
 */
export class PerformanceAlertSystem {
  private alerts: Array<{
    id: string;
    condition: () => boolean;
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    lastTriggered?: number;
  }> = [];

  constructor() {
    this.setupDefaultAlerts();
  }

  private setupDefaultAlerts() {
    // Low frame rate alert
    this.addAlert({
      id: 'low-framerate',
      condition: () => getPerformanceMetrics().frameRate < 45,
      message: 'Low frame rate detected. Consider optimizing animations.',
      severity: 'medium'
    });

    // High memory usage alert
    this.addAlert({
      id: 'high-memory',
      condition: () => getMemoryUsage().used > PERFORMANCE_THRESHOLDS.MEMORY_WARNING_MB,
      message: 'High memory usage detected. Consider optimizing memory usage.',
      severity: 'high'
    });

    // Too many slow renders
    this.addAlert({
      id: 'slow-renders',
      condition: () => PERFORMANCE_DATA.slowRenders > 10,
      message: 'High number of slow renders detected. Optimize component re-renders.',
      severity: 'medium'
    });
  }

  addAlert(alert: {
    id: string;
    condition: () => boolean;
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }) {
    this.alerts.push(alert);
  }

  checkAlerts(): Array<{
    id: string;
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }> {
    const triggeredAlerts: Array<{
      id: string;
      message: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
    }> = [];

    for (const alert of this.alerts) {
      if (alert.condition()) {
        const now = Date.now();
        // Prevent alert spam (only trigger once every 30 seconds)
        if (!alert.lastTriggered || now - alert.lastTriggered > 30000) {
          alert.lastTriggered = now;
          triggeredAlerts.push({
            id: alert.id,
            message: alert.message,
            severity: alert.severity
          });
        }
      }
    }

    return triggeredAlerts;
  }

  getAlertSummary() {
    const alerts = this.checkAlerts();
    return {
      totalAlerts: alerts.length,
      critical: alerts.filter(a => a.severity === 'critical').length,
      high: alerts.filter(a => a.severity === 'high').length,
      medium: alerts.filter(a => a.severity === 'medium').length,
      low: alerts.filter(a => a.severity === 'low').length
    };
  }
}

// Global performance alert system
export const performanceAlertSystem = new PerformanceAlertSystem();

/**
 * Performance optimization HOC for components
 */
export function withPerformanceMonitoring<P extends Record<string, any>>(
  Component: React.ComponentType<P>,
  componentName: string
) {
  const WrappedComponent = (props: P) => {
    const renderStartTime = performance.now();

    // Use useEffect to measure after render
    React.useEffect(() => {
      const renderTime = performance.now() - renderStartTime;
      PERFORMANCE_DATA.renderTime = renderTime;

      if (renderTime > PERFORMANCE_THRESHOLDS.SLOW_RENDER_MS) {
        PERFORMANCE_DATA.slowRenders++;
        console.warn(`Slow render in ${componentName}: ${renderTime.toFixed(2)}ms`);
      }
    });

    return React.createElement(Component, props);
  };

  WrappedComponent.displayName = `withPerformanceMonitoring(${componentName})`;
  return WrappedComponent;
}

/**
 * Optimized image loading with performance tracking
 */
export class OptimizedImageLoader {
  private imageCache = new Map<string, boolean>();

  async preloadImage(uri: string): Promise<void> {
    if (this.imageCache.has(uri)) {
      return; // Already cached
    }

    const startTime = performance.now();

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const loadTime = performance.now() - startTime;
        this.imageCache.set(uri, true);

        if (loadTime > 1000) { // Slow image load
          console.warn(`Slow image load: ${uri} (${loadTime.toFixed(2)}ms)`);
        }

        resolve();
      };
      img.onerror = reject;
      img.src = uri;
    });
  }

  isImageCached(uri: string): boolean {
    return this.imageCache.has(uri);
  }

  clearCache() {
    this.imageCache.clear();
  }
}

// Global image loader instance
export const optimizedImageLoader = new OptimizedImageLoader();

// Performance monitoring hook
export function usePerformanceMonitor() {
  const [metrics, setMetrics] = React.useState(getPerformanceMetrics());
  const [alerts, setAlerts] = React.useState(performanceAlertSystem.checkAlerts());

  React.useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(getPerformanceMetrics());
      setAlerts(performanceAlertSystem.checkAlerts());
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return { metrics, alerts };
}
