/**
 * Monitoring system integration tests - Test all monitoring systems working together
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { analytics, useAnalytics } from '../../services/analytics';
import { errorTracking, useErrorTracking } from '../../services/errorTracking';
import { usageAnalytics, useUsageAnalytics } from '../../services/usageAnalytics';
import { usePerformanceMonitoring, usePerformanceMetrics } from '../../hooks/usePerformanceMonitoring.tsx';

// Mock global APIs
const mockPerformance = {
  now: vi.fn(() => Date.now()),
  mark: vi.fn(),
  measure: vi.fn(),
  getEntriesByType: vi.fn(() => []),
  getEntriesByName: vi.fn(() => []),
  timing: {
    navigationStart: 1000,
    responseStart: 1200,
  },
  memory: {
    usedJSHeapSize: 10000000,
    totalJSHeapSize: 20000000,
    jsHeapSizeLimit: 50000000,
  },
};

Object.defineProperty(global, 'performance', { value: mockPerformance, writable: true });

// Mock PerformanceObserver
Object.defineProperty(global, 'PerformanceObserver', {
  value: class MockPerformanceObserver {
    constructor(callback: Function) {}
    observe = vi.fn();
    disconnect = vi.fn();
  },
  writable: true,
});

describe('Monitoring System Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    
    // Enable all monitoring systems
    analytics.setEnabled(true);
    errorTracking.setEnabled(true);
    usageAnalytics.setEnabled(true);
  });

  afterEach(() => {
    vi.useRealTimers();
    analytics.destroy();
    errorTracking.destroy();
    usageAnalytics.destroy();
  });

  describe('Cross-System Data Consistency', () => {
    it('should maintain consistent user identification across all systems', () => {
      const { result: analyticsResult } = renderHook(() => useAnalytics());
      const { result: errorResult } = renderHook(() => useErrorTracking());
      const { result: usageResult } = renderHook(() => useUsageAnalytics());

      const userId = 'user123';

      act(() => {
        analyticsResult.current.setUserId(userId);
        errorResult.current.setUserId(userId);
        usageResult.current.setUserId(userId);
      });

      // All systems should have the same user ID
      const analyticsSession = analyticsResult.current.getSessionAnalytics();
      expect(analyticsSession.userId).toBe(userId);

      // Error tracking should include user ID in error reports
      act(() => {
        errorResult.current.captureError(new Error('Test error'));
      });

      const errorStats = errorResult.current.getErrorStats();
      expect(errorStats.total).toBe(1);

      // Usage analytics should track user behavior
      const behaviorInsights = usageResult.current.getUserBehaviorInsights();
      expect(behaviorInsights).toBeDefined();
    });

    it('should correlate events across monitoring systems', () => {
      const { result: analyticsResult } = renderHook(() => useAnalytics());
      const { result: errorResult } = renderHook(() => useErrorTracking());
      const { result: usageResult } = renderHook(() => useUsageAnalytics());

      // Simulate a user workflow that generates events in all systems
      act(() => {
        // User starts a feature
        usageResult.current.startFeatureUsage('assignment_generator');
        analyticsResult.current.trackFeatureUsage('assignment_generator', { action: 'start' });

        // User encounters an error
        errorResult.current.captureError(new Error('Validation failed'), {
          context: { feature: 'assignment_generator', step: 'validation' },
        });

        // User completes the feature despite the error
        usageResult.current.endFeatureUsage('assignment_generator', true);
        analyticsResult.current.trackFeatureUsage('assignment_generator', { action: 'complete' });
      });

      // Verify events were recorded in all systems
      const analyticsSession = analyticsResult.current.getSessionAnalytics();
      expect(analyticsSession.eventsCount).toBe(2);

      const errorStats = errorResult.current.getErrorStats();
      expect(errorStats.total).toBe(1);

      const featureStats = usageResult.current.getFeatureUsageStats();
      expect(featureStats.assignment_generator.usageCount).toBe(1);
      expect(featureStats.assignment_generator.successRate).toBe(1);
    });

    it('should maintain session consistency across page navigation', () => {
      const { result: analyticsResult } = renderHook(() => useAnalytics());
      const { result: usageResult } = renderHook(() => useUsageAnalytics());

      // Simulate page navigation
      act(() => {
        usageResult.current.startPageView('/dashboard', 'Dashboard');
        analyticsResult.current.trackPageView('/dashboard', 'Dashboard');
        
        vi.advanceTimersByTime(30000); // 30 seconds on dashboard
        
        usageResult.current.startPageView('/students', 'Students');
        analyticsResult.current.trackPageView('/students', 'Students');
        
        vi.advanceTimersByTime(45000); // 45 seconds on students page
      });

      const analyticsSession = analyticsResult.current.getSessionAnalytics();
      const behaviorInsights = usageResult.current.getUserBehaviorInsights();

      // Both systems should track the same session
      expect(analyticsSession.eventsCount).toBe(2); // Two page views
      expect(behaviorInsights.pageViewsPerSession).toBe(2);
      expect(behaviorInsights.sessionDuration).toBeGreaterThan(70000); // > 70 seconds
    });
  });

  describe('Performance Impact Assessment', () => {
    it('should measure the performance impact of monitoring systems', () => {
      const { result: performanceResult } = renderHook(() => usePerformanceMonitoring('MonitoringTest'));
      const { result: analyticsResult } = renderHook(() => useAnalytics());

      // Measure the performance of monitoring operations
      act(() => {
        const endTiming = performanceResult.current.measureOperation('monitoring_overhead', () => {
          // Simulate typical monitoring operations
          for (let i = 0; i < 100; i++) {
            analyticsResult.current.trackEvent(`test_event_${i}`, { index: i });
          }
        });
      });

      // Monitoring should have minimal performance impact
      const componentMetrics = performanceResult.current.getComponentMetrics();
      expect(componentMetrics?.renderTime).toBeLessThan(50); // Less than 50ms for 100 events
    });

    it('should not significantly impact memory usage', () => {
      const { result: analyticsResult } = renderHook(() => useAnalytics());
      const { result: usageResult } = renderHook(() => useUsageAnalytics());
      const { result: errorResult } = renderHook(() => useErrorTracking());

      const initialMemory = process.memoryUsage().heapUsed;

      // Generate significant monitoring data
      act(() => {
        for (let i = 0; i < 1000; i++) {
          analyticsResult.current.trackEvent(`memory_test_${i}`, {
            data: `Large data string ${i}`.repeat(10),
          });
          
          if (i % 10 === 0) {
            usageResult.current.trackInteraction('click', `element_${i}`);
          }
          
          if (i % 50 === 0) {
            errorResult.current.addBreadcrumb({
              category: 'user',
              level: 'info',
              message: `Action ${i}`,
            });
          }
        }
      });

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // Less than 10MB
    });

    it('should handle high-frequency events efficiently', () => {
      const { result: analyticsResult } = renderHook(() => useAnalytics());
      const { result: performanceResult } = renderHook(() => usePerformanceMetrics());

      const startTime = performance.now();

      // Generate high-frequency events
      act(() => {
        for (let i = 0; i < 10000; i++) {
          analyticsResult.current.trackEvent('high_frequency_event', { index: i });
        }
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should handle high frequency efficiently
      expect(duration).toBeLessThan(1000); // Less than 1 second for 10k events

      const metrics = performanceResult.current.getMetrics();
      expect(metrics).toBeDefined();
    });
  });

  describe('Error Correlation and Recovery', () => {
    it('should correlate errors with performance degradation', () => {
      const { result: performanceResult } = renderHook(() => usePerformanceMonitoring('ErrorCorrelationTest'));
      const { result: errorResult } = renderHook(() => useErrorTracking());
      const { result: analyticsResult } = renderHook(() => useAnalytics());

      // Simulate performance degradation followed by errors
      act(() => {
        // Slow operation
        performanceResult.current.measureOperation('slow_operation', () => {
          // Simulate slow work
          const start = Date.now();
          while (Date.now() - start < 100) {
            // Busy wait
          }
        });

        // Error occurs after slow operation
        errorResult.current.captureError(new Error('Performance-related error'), {
          context: { performanceIssue: true, operation: 'slow_operation' },
        });

        // Track the performance issue
        analyticsResult.current.trackPerformance('operation_duration', 100, {
          operation: 'slow_operation',
          threshold_exceeded: true,
        });
      });

      const errorStats = errorResult.current.getErrorStats();
      const analyticsSession = analyticsResult.current.getSessionAnalytics();

      expect(errorStats.total).toBe(1);
      expect(analyticsSession.performanceMetricsCount).toBe(1);
    });

    it('should track error recovery patterns', () => {
      const { result: errorResult } = renderHook(() => useErrorTracking());
      const { result: usageResult } = renderHook(() => useUsageAnalytics());

      // Simulate error and recovery pattern
      act(() => {
        // Initial error
        errorResult.current.captureError(new Error('Initial failure'));
        usageResult.current.trackInteraction('click', 'retry_button');

        // Retry attempt
        errorResult.current.addBreadcrumb({
          category: 'user',
          level: 'info',
          message: 'User clicked retry',
        });

        // Success after retry
        usageResult.current.trackInteraction('form_submit', 'success_form');
        errorResult.current.addBreadcrumb({
          category: 'user',
          level: 'info',
          message: 'Operation succeeded on retry',
        });
      });

      const errorStats = errorResult.current.getErrorStats();
      const behaviorInsights = usageResult.current.getUserBehaviorInsights();

      expect(errorStats.total).toBe(1);
      expect(errorStats.breadcrumbsCount).toBe(2);
      expect(behaviorInsights.interactionTypes.click).toBe(1);
      expect(behaviorInsights.interactionTypes.form_submit).toBe(1);
    });

    it('should detect error patterns and trends', () => {
      const { result: errorResult } = renderHook(() => useErrorTracking());
      const { result: analyticsResult } = renderHook(() => useAnalytics());

      // Simulate recurring error pattern
      act(() => {
        for (let i = 0; i < 5; i++) {
          vi.advanceTimersByTime(60000); // 1 minute intervals
          
          errorResult.current.captureError(new Error('Recurring network error'), {
            category: 'network',
            context: { attempt: i + 1, endpoint: '/api/students' },
          });
          
          analyticsResult.current.trackEvent('api_error', {
            endpoint: '/api/students',
            attempt: i + 1,
            error_type: 'network',
          });
        }
      });

      const errorStats = errorResult.current.getErrorStats();
      const analyticsSession = analyticsResult.current.getSessionAnalytics();

      expect(errorStats.total).toBe(5);
      expect(errorStats.byCategory.network).toBe(5);
      expect(analyticsSession.eventsCount).toBe(5);
    });
  });

  describe('Real-time Monitoring Coordination', () => {
    it('should coordinate real-time updates across systems', async () => {
      const { result: analyticsResult } = renderHook(() => useAnalytics());
      const { result: usageResult } = renderHook(() => useUsageAnalytics());
      const { result: performanceResult } = renderHook(() => usePerformanceMonitoring('RealTimeTest'));

      // Simulate real-time user activity
      act(() => {
        // User starts an operation
        usageResult.current.startFeatureUsage('real_time_feature');
        analyticsResult.current.trackEvent('feature_start', { feature: 'real_time_feature' });

        // Performance monitoring tracks the operation
        const endTiming = performanceResult.current.measureOperation('real_time_operation', () => {
          // Simulate work
          return 'result';
        });

        // Operation completes
        usageResult.current.endFeatureUsage('real_time_feature', true);
        analyticsResult.current.trackEvent('feature_complete', { feature: 'real_time_feature' });
      });

      // All systems should have coordinated data
      const analyticsSession = analyticsResult.current.getSessionAnalytics();
      const featureStats = usageResult.current.getFeatureUsageStats();
      const componentMetrics = performanceResult.current.getComponentMetrics();

      expect(analyticsSession.eventsCount).toBe(2);
      expect(featureStats.real_time_feature.usageCount).toBe(1);
      expect(componentMetrics?.updateCount).toBeGreaterThan(0);
    });

    it('should handle concurrent monitoring operations', () => {
      const { result: analyticsResult } = renderHook(() => useAnalytics());
      const { result: errorResult } = renderHook(() => useErrorTracking());
      const { result: usageResult } = renderHook(() => useUsageAnalytics());

      // Simulate concurrent operations
      act(() => {
        // Multiple concurrent events
        Promise.all([
          // Analytics events
          ...Array.from({ length: 10 }, (_, i) => 
            analyticsResult.current.trackEvent(`concurrent_event_${i}`)
          ),
          // Usage tracking
          ...Array.from({ length: 5 }, (_, i) => 
            usageResult.current.trackInteraction('click', `concurrent_element_${i}`)
          ),
          // Error tracking
          ...Array.from({ length: 3 }, (_, i) => 
            errorResult.current.addBreadcrumb({
              category: 'user',
              level: 'info',
              message: `Concurrent action ${i}`,
            })
          ),
        ]);
      });

      // All systems should handle concurrent operations
      const analyticsSession = analyticsResult.current.getSessionAnalytics();
      const behaviorInsights = usageResult.current.getUserBehaviorInsights();
      const errorStats = errorResult.current.getErrorStats();

      expect(analyticsSession.eventsCount).toBe(10);
      expect(behaviorInsights.interactionTypes.click).toBe(5);
      expect(errorStats.breadcrumbsCount).toBe(3);
    });
  });

  describe('Data Export and Reporting Integration', () => {
    it('should provide unified monitoring data export', () => {
      const { result: analyticsResult } = renderHook(() => useAnalytics());
      const { result: errorResult } = renderHook(() => useErrorTracking());
      const { result: usageResult } = renderHook(() => useUsageAnalytics());
      const { result: performanceResult } = renderHook(() => usePerformanceMetrics());

      // Generate comprehensive monitoring data
      act(() => {
        analyticsResult.current.trackEvent('export_test_event');
        analyticsResult.current.trackPerformance('export_test_metric', 100);
        errorResult.current.captureError(new Error('Export test error'));
        usageResult.current.trackInteraction('click', 'export_test_element');
      });

      // Collect data from all systems
      const unifiedData = {
        analytics: analyticsResult.current.getSessionAnalytics(),
        errors: errorResult.current.getErrorStats(),
        usage: usageResult.current.getUserBehaviorInsights(),
        performance: performanceResult.current.getMetrics(),
      };

      // Verify unified data structure
      expect(unifiedData.analytics).toBeDefined();
      expect(unifiedData.errors).toBeDefined();
      expect(unifiedData.usage).toBeDefined();
      expect(unifiedData.performance).toBeDefined();

      // Verify data consistency
      expect(unifiedData.analytics.eventsCount).toBe(1);
      expect(unifiedData.analytics.performanceMetricsCount).toBe(1);
      expect(unifiedData.errors.total).toBe(1);
      expect(unifiedData.usage.interactionTypes.click).toBe(1);
    });

    it('should generate comprehensive monitoring reports', () => {
      const { result: analyticsResult } = renderHook(() => useAnalytics());
      const { result: errorResult } = renderHook(() => useErrorTracking());
      const { result: usageResult } = renderHook(() => useUsageAnalytics());

      // Generate report data
      act(() => {
        // Simulate a complete user session
        usageResult.current.startPageView('/dashboard', 'Dashboard');
        analyticsResult.current.trackPageView('/dashboard', 'Dashboard');
        
        usageResult.current.startFeatureUsage('student_management');
        analyticsResult.current.trackFeatureUsage('student_management');
        
        errorResult.current.captureError(new Error('Minor validation error'), {
          severity: 'low',
          category: 'validation',
        });
        
        usageResult.current.endFeatureUsage('student_management', true);
        analyticsResult.current.trackEvent('feature_success');
      });

      // Generate monitoring report
      const report = {
        summary: {
          sessionDuration: usageResult.current.getUserBehaviorInsights().sessionDuration,
          totalEvents: analyticsResult.current.getSessionAnalytics().eventsCount,
          totalErrors: errorResult.current.getErrorStats().total,
          errorRate: errorResult.current.getErrorStats().total / 
                    analyticsResult.current.getSessionAnalytics().eventsCount,
        },
        details: {
          featureUsage: usageResult.current.getFeatureUsageStats(),
          errorBreakdown: errorResult.current.getErrorStats(),
          performanceMetrics: analyticsResult.current.getSessionAnalytics(),
        },
      };

      expect(report.summary.totalEvents).toBeGreaterThan(0);
      expect(report.summary.totalErrors).toBe(1);
      expect(report.summary.errorRate).toBeLessThan(1);
      expect(report.details.featureUsage.student_management).toBeDefined();
    });
  });

  describe('System Health and Monitoring', () => {
    it('should monitor the health of monitoring systems themselves', () => {
      const { result: analyticsResult } = renderHook(() => useAnalytics());
      const { result: errorResult } = renderHook(() => useErrorTracking());

      // Test system health
      act(() => {
        // Analytics system health
        const analyticsHealth = analyticsResult.current.getSessionAnalytics();
        expect(analyticsHealth.sessionId).toBeDefined();

        // Error tracking system health
        const errorHealth = errorResult.current.getErrorStats();
        expect(typeof errorHealth.total).toBe('number');

        // Systems should be responsive
        const startTime = performance.now();
        analyticsResult.current.trackEvent('health_check');
        const endTime = performance.now();
        
        expect(endTime - startTime).toBeLessThan(10); // Less than 10ms response time
      });
    });

    it('should detect and report monitoring system failures', () => {
      const { result: errorResult } = renderHook(() => useErrorTracking());

      // Simulate monitoring system failure
      act(() => {
        try {
          // Force an error in the monitoring system
          throw new Error('Monitoring system failure');
        } catch (error) {
          errorResult.current.captureError(error as Error, {
            category: 'javascript',
            severity: 'critical',
            context: { system: 'monitoring', component: 'error_tracking' },
          });
        }
      });

      const errorStats = errorResult.current.getErrorStats();
      expect(errorStats.total).toBe(1);
      expect(errorStats.bySeverity.critical).toBe(1);
    });
  });
});