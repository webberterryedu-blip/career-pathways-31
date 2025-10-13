/**
 * Performance monitoring hook for tracking app performance
 */
import React, { useEffect, useCallback, useRef } from 'react';

interface PerformanceMetrics {
  componentName: string;
  renderTime: number;
  mountTime: number;
  updateCount: number;
  lastUpdate: number;
}

interface WebVitals {
  FCP?: number; // First Contentful Paint
  LCP?: number; // Largest Contentful Paint
  FID?: number; // First Input Delay
  CLS?: number; // Cumulative Layout Shift
  TTFB?: number; // Time to First Byte
}

class PerformanceTracker {
  private metrics: Map<string, PerformanceMetrics> = new Map();
  private webVitals: WebVitals = {};
  private observers: PerformanceObserver[] = [];

  constructor() {
    this.initWebVitalsTracking();
  }

  private initWebVitalsTracking() {
    // Track First Contentful Paint
    if ('PerformanceObserver' in window) {
      try {
        const paintObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name === 'first-contentful-paint') {
              this.webVitals.FCP = entry.startTime;
            }
          }
        });
        paintObserver.observe({ entryTypes: ['paint'] });
        this.observers.push(paintObserver);

        // Track Largest Contentful Paint
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.webVitals.LCP = lastEntry.startTime;
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(lcpObserver);

        // Track First Input Delay
        const fidObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.webVitals.FID = (entry as any).processingStart - entry.startTime;
          }
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.push(fidObserver);

        // Track Cumulative Layout Shift
        const clsObserver = new PerformanceObserver((list) => {
          let clsValue = 0;
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
          this.webVitals.CLS = clsValue;
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(clsObserver);
      } catch (error) {
        console.warn('Performance Observer not supported:', error);
      }
    }

    // Track Time to First Byte
    if (performance.timing) {
      this.webVitals.TTFB = performance.timing.responseStart - performance.timing.navigationStart;
    }
  }

  trackComponent(componentName: string) {
    const startTime = performance.now();
    const existing = this.metrics.get(componentName);

    if (existing) {
      existing.updateCount++;
      existing.lastUpdate = Date.now();
      existing.renderTime = performance.now() - startTime;
    } else {
      this.metrics.set(componentName, {
        componentName,
        renderTime: 0,
        mountTime: startTime,
        updateCount: 1,
        lastUpdate: Date.now(),
      });
    }

    return () => {
      const metric = this.metrics.get(componentName);
      if (metric) {
        metric.renderTime = performance.now() - startTime;
      }
    };
  }

  getMetrics() {
    return {
      components: Array.from(this.metrics.values()),
      webVitals: this.webVitals,
      memory: (performance as any).memory ? {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
        jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
      } : null,
    };
  }

  clearMetrics() {
    this.metrics.clear();
  }

  destroy() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Global performance tracker instance
const performanceTracker = new PerformanceTracker();

// Performance monitoring hook
export const usePerformanceMonitoring = (componentName: string) => {
  const renderCountRef = useRef(0);
  const mountTimeRef = useRef<number>();

  useEffect(() => {
    mountTimeRef.current = performance.now();
    return performanceTracker.trackComponent(componentName);
  }, [componentName]);

  useEffect(() => {
    renderCountRef.current++;
  });

  const measureOperation = useCallback((operationName: string, operation: () => void | Promise<void>) => {
    const startTime = performance.now();
    
    const result = operation();
    
    if (result instanceof Promise) {
      return result.finally(() => {
        const duration = performance.now() - startTime;
        console.log(`${componentName}.${operationName} took ${duration.toFixed(2)}ms`);
      });
    } else {
      const duration = performance.now() - startTime;
      console.log(`${componentName}.${operationName} took ${duration.toFixed(2)}ms`);
      return result;
    }
  }, [componentName]);

  const getComponentMetrics = useCallback(() => {
    const allMetrics = performanceTracker.getMetrics();
    return allMetrics.components.find(m => m.componentName === componentName);
  }, [componentName]);

  return {
    measureOperation,
    getComponentMetrics,
    renderCount: renderCountRef.current,
    mountTime: mountTimeRef.current,
  };
};

// Hook for getting overall performance metrics
export const usePerformanceMetrics = () => {
  const getMetrics = useCallback(() => {
    return performanceTracker.getMetrics();
  }, []);

  const clearMetrics = useCallback(() => {
    performanceTracker.clearMetrics();
  }, []);

  return {
    getMetrics,
    clearMetrics,
  };
};

// Performance monitoring component wrapper
export const withPerformanceMonitoring = <P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
) => {
  const WrappedComponent = (props: P) => {
    const name = componentName || Component.displayName || Component.name || 'Unknown';
    usePerformanceMonitoring(name);
    return <Component {...props} />;
  };

  WrappedComponent.displayName = `withPerformanceMonitoring(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

// Cleanup function for when app unmounts
export const cleanupPerformanceTracking = () => {
  performanceTracker.destroy();
};