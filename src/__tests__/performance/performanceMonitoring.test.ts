/**
 * Performance monitoring tests - Test performance optimization effectiveness and load times
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePerformanceMonitoring, usePerformanceMetrics, withPerformanceMonitoring, cleanupPerformanceTracking } from '../../hooks/usePerformanceMonitoring.tsx';

// Mock performance API
const mockPerformanceObserver = vi.fn();
const mockPerformanceEntry = {
  name: 'test-entry',
  startTime: 100,
  duration: 50,
};

// Mock global performance API
Object.defineProperty(global, 'performance', {
  value: {
    now: vi.fn(() => Date.now()),
    mark: vi.fn(),
    measure: vi.fn(),
    getEntriesByType: vi.fn(() => [mockPerformanceEntry]),
    getEntriesByName: vi.fn(() => [mockPerformanceEntry]),
    timing: {
      navigationStart: 1000,
      responseStart: 1200,
    },
    memory: {
      usedJSHeapSize: 10000000,
      totalJSHeapSize: 20000000,
      jsHeapSizeLimit: 50000000,
    },
  },
  writable: true,
});

Object.defineProperty(global, 'PerformanceObserver', {
  value: class MockPerformanceObserver {
    constructor(callback: Function) {
      mockPerformanceObserver(callback);
    }
    observe = vi.fn();
    disconnect = vi.fn();
  },
  writable: true,
});

describe('Performance Monitoring Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanupPerformanceTracking();
  });

  describe('usePerformanceMonitoring Hook', () => {
    it('should track component render performance', () => {
      const { result } = renderHook(() => usePerformanceMonitoring('TestComponent'));

      expect(result.current.renderCount).toBe(1);
      expect(result.current.mountTime).toBeDefined();
      expect(typeof result.current.measureOperation).toBe('function');
      expect(typeof result.current.getComponentMetrics).toBe('function');
    });

    it('should measure operation performance', () => {
      const { result } = renderHook(() => usePerformanceMonitoring('TestComponent'));
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const mockOperation = vi.fn(() => {
        // Simulate some work
        for (let i = 0; i < 1000; i++) {
          Math.random();
        }
      });

      act(() => {
        result.current.measureOperation('testOperation', mockOperation);
      });

      expect(mockOperation).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('TestComponent.testOperation took')
      );

      consoleSpy.mockRestore();
    });

    it('should measure async operation performance', async () => {
      const { result } = renderHook(() => usePerformanceMonitoring('TestComponent'));
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const mockAsyncOperation = vi.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return 'result';
      });

      await act(async () => {
        const promise = result.current.measureOperation('asyncOperation', mockAsyncOperation);
        vi.advanceTimersByTime(100);
        await promise;
      });

      expect(mockAsyncOperation).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('TestComponent.asyncOperation took')
      );

      consoleSpy.mockRestore();
    });

    it('should track render count across re-renders', () => {
      const { result, rerender } = renderHook(() => usePerformanceMonitoring('TestComponent'));

      expect(result.current.renderCount).toBe(1);

      rerender();
      expect(result.current.renderCount).toBe(2);

      rerender();
      expect(result.current.renderCount).toBe(3);
    });

    it('should get component metrics', () => {
      const { result } = renderHook(() => usePerformanceMonitoring('TestComponent'));

      const metrics = result.current.getComponentMetrics();
      expect(metrics).toBeDefined();
      expect(metrics?.componentName).toBe('TestComponent');
    });
  });

  describe('usePerformanceMetrics Hook', () => {
    it('should provide global performance metrics', () => {
      const { result } = renderHook(() => usePerformanceMetrics());

      const metrics = result.current.getMetrics();
      expect(metrics).toBeDefined();
      expect(metrics.components).toBeInstanceOf(Array);
      expect(metrics.webVitals).toBeDefined();
      expect(metrics.memory).toBeDefined();
    });

    it('should clear metrics when requested', () => {
      const { result } = renderHook(() => usePerformanceMetrics());

      // First get metrics to ensure they exist
      const initialMetrics = result.current.getMetrics();
      expect(initialMetrics.components.length).toBeGreaterThanOrEqual(0);

      // Clear metrics
      act(() => {
        result.current.clearMetrics();
      });

      // Verify metrics are cleared
      const clearedMetrics = result.current.getMetrics();
      expect(clearedMetrics.components).toHaveLength(0);
    });
  });

  describe('Performance Optimization Effectiveness', () => {
    it('should track Web Vitals metrics', () => {
      const { result } = renderHook(() => usePerformanceMetrics());
      
      const metrics = result.current.getMetrics();
      
      // Check that Web Vitals are being tracked
      expect(metrics.webVitals).toBeDefined();
      expect(typeof metrics.webVitals.TTFB).toBe('number');
    });

    it('should track memory usage', () => {
      const { result } = renderHook(() => usePerformanceMetrics());
      
      const metrics = result.current.getMetrics();
      
      expect(metrics.memory).toBeDefined();
      expect(typeof metrics.memory.usedJSHeapSize).toBe('number');
      expect(typeof metrics.memory.totalJSHeapSize).toBe('number');
      expect(typeof metrics.memory.jsHeapSizeLimit).toBe('number');
    });

    it('should detect performance regressions', () => {
      const { result } = renderHook(() => usePerformanceMonitoring('SlowComponent'));

      // Simulate a slow operation
      const slowOperation = () => {
        const start = Date.now();
        while (Date.now() - start < 100) {
          // Busy wait to simulate slow operation
        }
      };

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      act(() => {
        result.current.measureOperation('slowOperation', slowOperation);
      });

      // Verify that the slow operation was logged
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('SlowComponent.slowOperation took')
      );

      consoleSpy.mockRestore();
    });

    it('should track component lifecycle performance', () => {
      const TestComponent = () => null;
      const WrappedComponent = withPerformanceMonitoring(TestComponent, 'TestComponent');

      expect(WrappedComponent.displayName).toBe('withPerformanceMonitoring(TestComponent)');

      // The component should be trackable
      const { result } = renderHook(() => usePerformanceMetrics());
      const metrics = result.current.getMetrics();
      
      // Metrics should be available
      expect(metrics).toBeDefined();
    });
  });

  describe('Load Time Performance', () => {
    it('should measure page load performance', () => {
      // Mock navigation timing
      const mockNavigationTiming = {
        navigationStart: 1000,
        loadEventEnd: 3000,
        domContentLoadedEventEnd: 2500,
      };

      vi.mocked(performance.getEntriesByType).mockReturnValue([mockNavigationTiming as any]);

      // Simulate page load event
      const loadEvent = new Event('load');
      window.dispatchEvent(loadEvent);

      // Verify that performance tracking was initiated
      expect(performance.getEntriesByType).toHaveBeenCalledWith('navigation');
    });

    it('should track paint timing metrics', () => {
      const mockPaintEntries = [
        { name: 'first-paint', startTime: 1500 },
        { name: 'first-contentful-paint', startTime: 1800 },
      ];

      vi.mocked(performance.getEntriesByType).mockReturnValue(mockPaintEntries as any);

      const { result } = renderHook(() => usePerformanceMetrics());
      const metrics = result.current.getMetrics();

      // Paint metrics should be available through the performance API
      expect(performance.getEntriesByType).toHaveBeenCalledWith('paint');
    });

    it('should measure component mount time', () => {
      const startTime = Date.now();
      vi.mocked(performance.now).mockReturnValue(startTime);

      const { result } = renderHook(() => usePerformanceMonitoring('TestComponent'));

      expect(result.current.mountTime).toBe(startTime);
    });

    it('should track render performance over time', () => {
      const { result, rerender } = renderHook(() => usePerformanceMonitoring('TestComponent'));

      // Simulate multiple renders with different performance
      const renderTimes = [10, 15, 12, 18, 14];
      
      renderTimes.forEach((time, index) => {
        vi.mocked(performance.now).mockReturnValue(time);
        rerender();
      });

      const metrics = result.current.getComponentMetrics();
      expect(metrics?.updateCount).toBe(renderTimes.length + 1); // +1 for initial render
    });
  });

  describe('Performance Thresholds', () => {
    const PERFORMANCE_THRESHOLDS = {
      componentRender: 16, // 60fps
      dataProcessing: 100,
      memoryUsage: 50 * 1024 * 1024, // 50MB
    };

    it('should validate component render performance', () => {
      const { result } = renderHook(() => usePerformanceMonitoring('TestComponent'));

      const fastOperation = () => {
        // Simulate fast operation
        return 'result';
      };

      const startTime = performance.now();
      result.current.measureOperation('fastOperation', fastOperation);
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.componentRender);
    });

    it('should detect when operations exceed thresholds', () => {
      const { result } = renderHook(() => usePerformanceMonitoring('TestComponent'));
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // Mock a slow operation
      vi.mocked(performance.now)
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(200); // 200ms duration

      const slowOperation = () => {
        // This will be measured as taking 200ms due to our mock
        return 'result';
      };

      act(() => {
        result.current.measureOperation('slowOperation', slowOperation);
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('TestComponent.slowOperation took 200.00ms')
      );

      consoleSpy.mockRestore();
    });

    it('should track memory usage within limits', () => {
      const { result } = renderHook(() => usePerformanceMetrics());
      const metrics = result.current.getMetrics();

      if (metrics.memory) {
        expect(metrics.memory.usedJSHeapSize).toBeLessThan(PERFORMANCE_THRESHOLDS.memoryUsage);
      }
    });
  });

  describe('Performance Observer Integration', () => {
    it('should initialize performance observers', () => {
      // Performance observers should be created during initialization
      expect(mockPerformanceObserver).toHaveBeenCalled();
    });

    it('should handle performance observer errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Mock PerformanceObserver to throw an error
      Object.defineProperty(global, 'PerformanceObserver', {
        value: class {
          constructor() {
            throw new Error('PerformanceObserver not supported');
          }
        },
        writable: true,
      });

      // This should not throw, but should log a warning
      expect(() => {
        renderHook(() => usePerformanceMonitoring('TestComponent'));
      }).not.toThrow();

      consoleSpy.mockRestore();
    });
  });

  describe('Cleanup and Resource Management', () => {
    it('should cleanup performance tracking on unmount', () => {
      const { unmount } = renderHook(() => usePerformanceMonitoring('TestComponent'));

      // Component should track performance
      const { result } = renderHook(() => usePerformanceMetrics());
      const initialMetrics = result.current.getMetrics();
      
      // Unmount should not cause errors
      expect(() => unmount()).not.toThrow();
    });

    it('should cleanup global performance tracking', () => {
      expect(() => cleanupPerformanceTracking()).not.toThrow();
    });
  });
});