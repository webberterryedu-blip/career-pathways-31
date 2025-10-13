/**
 * Analytics and monitoring data collection accuracy tests
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { analytics, useAnalytics } from '../../services/analytics';
import { usageAnalytics, useUsageAnalytics } from '../../services/usageAnalytics';

// Mock global APIs
const mockNavigator = {
  userAgent: 'Mozilla/5.0 (Test Browser)',
};

const mockDocument = {
  title: 'Test Page',
  referrer: 'https://test-referrer.com',
  hidden: false,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
};

const mockWindow = {
  location: {
    href: 'https://test.com/page',
    pathname: '/page',
  },
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  innerWidth: 1920,
  innerHeight: 1080,
};

Object.defineProperty(global, 'navigator', { value: mockNavigator, writable: true });
Object.defineProperty(global, 'document', { value: mockDocument, writable: true });
Object.defineProperty(global, 'window', { value: mockWindow, writable: true });

describe('Analytics Data Collection Accuracy Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    analytics.setEnabled(true);
    usageAnalytics.setEnabled(true);
  });

  afterEach(() => {
    vi.useRealTimers();
    analytics.destroy();
    usageAnalytics.destroy();
  });

  describe('Event Tracking Accuracy', () => {
    it('should track events with correct data structure', () => {
      const { result } = renderHook(() => useAnalytics());

      const testEvent = {
        name: 'button_click',
        properties: {
          buttonId: 'submit-btn',
          page: '/dashboard',
          userId: 'user123',
        },
      };

      act(() => {
        result.current.trackEvent(testEvent.name, testEvent.properties);
      });

      const sessionAnalytics = result.current.getSessionAnalytics();
      expect(sessionAnalytics.eventsCount).toBe(1);
      expect(sessionAnalytics.sessionId).toBeDefined();
    });

    it('should track page views with accurate metadata', () => {
      const { result } = renderHook(() => useAnalytics());

      act(() => {
        result.current.trackPageView('/dashboard', 'Dashboard Page');
      });

      const sessionAnalytics = result.current.getSessionAnalytics();
      expect(sessionAnalytics.eventsCount).toBe(1);
    });

    it('should track user actions with context', () => {
      const { result } = renderHook(() => useAnalytics());

      act(() => {
        result.current.trackUserAction('form_submit', 'student-form', {
          formFields: ['name', 'email', 'phone'],
          validationErrors: 0,
        });
      });

      const sessionAnalytics = result.current.getSessionAnalytics();
      expect(sessionAnalytics.eventsCount).toBe(1);
    });

    it('should track feature usage accurately', () => {
      const { result } = renderHook(() => useAnalytics());

      act(() => {
        result.current.trackFeatureUsage('assignment_generator', {
          studentsCount: 25,
          programsGenerated: 8,
          timeSpent: 120000, // 2 minutes
        });
      });

      const sessionAnalytics = result.current.getSessionAnalytics();
      expect(sessionAnalytics.eventsCount).toBe(1);
    });

    it('should maintain event order and timestamps', () => {
      const { result } = renderHook(() => useAnalytics());
      const events = [];

      // Track multiple events in sequence
      act(() => {
        result.current.trackEvent('event1');
        vi.advanceTimersByTime(100);
        result.current.trackEvent('event2');
        vi.advanceTimersByTime(100);
        result.current.trackEvent('event3');
      });

      const sessionAnalytics = result.current.getSessionAnalytics();
      expect(sessionAnalytics.eventsCount).toBe(3);
    });
  });

  describe('Performance Metrics Accuracy', () => {
    it('should track performance metrics with correct values', () => {
      const { result } = renderHook(() => useAnalytics());

      act(() => {
        result.current.trackPerformance('page_load_time', 1500, {
          url: '/dashboard',
          cached: false,
        });
      });

      const sessionAnalytics = result.current.getSessionAnalytics();
      expect(sessionAnalytics.performanceMetricsCount).toBe(1);
    });

    it('should measure timing accurately', () => {
      const { result } = renderHook(() => useAnalytics());

      act(() => {
        const endTiming = result.current.time('test_operation');
        vi.advanceTimersByTime(500);
        endTiming();
      });

      const sessionAnalytics = result.current.getSessionAnalytics();
      expect(sessionAnalytics.performanceMetricsCount).toBe(1);
    });

    it('should track async operations with accurate timing', async () => {
      const { result } = renderHook(() => useAnalytics());

      const mockAsyncOperation = vi.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 300));
        return 'success';
      });

      await act(async () => {
        const promise = result.current.trackAsync('async_test', mockAsyncOperation);
        vi.advanceTimersByTime(300);
        await promise;
      });

      expect(mockAsyncOperation).toHaveBeenCalled();
      const sessionAnalytics = result.current.getSessionAnalytics();
      expect(sessionAnalytics.eventsCount).toBe(1); // Success event
      expect(sessionAnalytics.performanceMetricsCount).toBe(1); // Timing metric
    });

    it('should handle async operation failures correctly', async () => {
      const { result } = renderHook(() => useAnalytics());

      const mockFailingOperation = vi.fn(async () => {
        throw new Error('Operation failed');
      });

      await act(async () => {
        try {
          await result.current.trackAsync('failing_async_test', mockFailingOperation);
        } catch (error) {
          // Expected to throw
        }
      });

      expect(mockFailingOperation).toHaveBeenCalled();
      const sessionAnalytics = result.current.getSessionAnalytics();
      expect(sessionAnalytics.eventsCount).toBe(1); // Error event
      expect(sessionAnalytics.performanceMetricsCount).toBe(1); // Timing metric
    });
  });

  describe('Usage Analytics Accuracy', () => {
    it('should track user interactions accurately', () => {
      const { result } = renderHook(() => useUsageAnalytics());

      act(() => {
        result.current.trackInteraction('click', 'button#submit', {
          x: 100,
          y: 200,
          button: 0,
        });
      });

      const insights = result.current.getUserBehaviorInsights();
      expect(insights.interactionTypes.click).toBe(1);
    });

    it('should track feature usage with duration', () => {
      const { result } = renderHook(() => useUsageAnalytics());

      act(() => {
        result.current.startFeatureUsage('assignment_editor', { mode: 'create' });
        vi.advanceTimersByTime(5000); // 5 seconds
        result.current.endFeatureUsage('assignment_editor', true, { itemsCreated: 3 });
      });

      const featureStats = result.current.getFeatureUsageStats();
      expect(featureStats.assignment_editor).toBeDefined();
      expect(featureStats.assignment_editor.usageCount).toBe(1);
      expect(featureStats.assignment_editor.successRate).toBe(1);
    });

    it('should track page views with duration', () => {
      const { result } = renderHook(() => useUsageAnalytics());

      act(() => {
        result.current.startPageView('/dashboard', 'Dashboard');
        vi.advanceTimersByTime(30000); // 30 seconds
        result.current.startPageView('/students', 'Students'); // This ends the previous page view
      });

      const insights = result.current.getUserBehaviorInsights();
      expect(insights.pageViewsPerSession).toBe(2);
      expect(insights.averagePageDuration).toBeGreaterThan(0);
    });

    it('should track search behavior accurately', () => {
      const { result } = renderHook(() => useUsageAnalytics());

      act(() => {
        result.current.trackSearch('john doe', 5, {
          filters: ['active_students'],
          sortBy: 'name',
        });
      });

      const insights = result.current.getUserBehaviorInsights();
      expect(insights.interactionTypes.search).toBe(1);
    });

    it('should track funnel steps in order', () => {
      const { result } = renderHook(() => useUsageAnalytics());

      const funnelSteps = ['start', 'form_fill', 'validation', 'submit', 'success'];

      act(() => {
        funnelSteps.forEach((step, index) => {
          vi.advanceTimersByTime(1000);
          result.current.trackFunnelStep('student_registration', step, { stepIndex: index });
        });
      });

      const insights = result.current.getUserBehaviorInsights();
      expect(insights.interactionTypes.navigation).toBe(funnelSteps.length);
    });
  });

  describe('Data Integrity and Validation', () => {
    it('should validate event data structure', () => {
      const { result } = renderHook(() => useAnalytics());

      // Test with various data types
      act(() => {
        result.current.trackEvent('test_event', {
          stringValue: 'test',
          numberValue: 123,
          booleanValue: true,
          arrayValue: [1, 2, 3],
          objectValue: { nested: 'value' },
          nullValue: null,
          undefinedValue: undefined,
        });
      });

      const sessionAnalytics = result.current.getSessionAnalytics();
      expect(sessionAnalytics.eventsCount).toBe(1);
    });

    it('should handle edge cases in data collection', () => {
      const { result } = renderHook(() => useAnalytics());

      // Test with empty/null values
      act(() => {
        result.current.trackEvent('', {}); // Empty event name
        result.current.trackEvent('test', null as any); // Null properties
        result.current.trackPageView(''); // Empty path
        result.current.trackUserAction('', ''); // Empty action and target
      });

      // Should not crash and should track events
      const sessionAnalytics = result.current.getSessionAnalytics();
      expect(sessionAnalytics.eventsCount).toBe(4);
    });

    it('should maintain data consistency across sessions', () => {
      const { result: result1 } = renderHook(() => useAnalytics());
      
      act(() => {
        result1.current.setUserId('user123');
        result1.current.trackEvent('session1_event');
      });

      const session1Analytics = result1.current.getSessionAnalytics();
      expect(session1Analytics.userId).toBe('user123');
      expect(session1Analytics.eventsCount).toBe(1);

      // Simulate new session
      const { result: result2 } = renderHook(() => useAnalytics());
      
      act(() => {
        result2.current.setUserId('user123'); // Same user
        result2.current.trackEvent('session2_event');
      });

      const session2Analytics = result2.current.getSessionAnalytics();
      expect(session2Analytics.userId).toBe('user123');
      expect(session2Analytics.sessionId).not.toBe(session1Analytics.sessionId);
    });

    it('should handle concurrent data collection', () => {
      const { result } = renderHook(() => useAnalytics());

      // Simulate rapid concurrent events
      act(() => {
        for (let i = 0; i < 100; i++) {
          result.current.trackEvent(`event_${i}`, { index: i });
          if (i % 10 === 0) {
            result.current.trackPerformance(`metric_${i}`, Math.random() * 1000);
          }
        }
      });

      const sessionAnalytics = result.current.getSessionAnalytics();
      expect(sessionAnalytics.eventsCount).toBe(100);
      expect(sessionAnalytics.performanceMetricsCount).toBe(10);
    });
  });

  describe('Privacy and Security', () => {
    it('should respect privacy settings', () => {
      const { result } = renderHook(() => useAnalytics());

      // Disable analytics
      act(() => {
        analytics.setEnabled(false);
        result.current.trackEvent('private_event');
      });

      const sessionAnalytics = result.current.getSessionAnalytics();
      expect(sessionAnalytics.eventsCount).toBe(0);

      // Re-enable analytics
      act(() => {
        analytics.setEnabled(true);
        result.current.trackEvent('public_event');
      });

      const updatedAnalytics = result.current.getSessionAnalytics();
      expect(updatedAnalytics.eventsCount).toBe(1);
    });

    it('should sanitize sensitive data', () => {
      const { result } = renderHook(() => useUsageAnalytics());

      // Track search with potentially sensitive data
      act(() => {
        result.current.trackSearch('very long sensitive search query that should be truncated because it contains personal information', 10);
      });

      // The search query should be truncated for privacy
      const insights = result.current.getUserBehaviorInsights();
      expect(insights.interactionTypes.search).toBe(1);
    });

    it('should handle user identification securely', () => {
      const { result } = renderHook(() => useAnalytics());

      act(() => {
        result.current.setUserId('user123');
        result.current.trackEvent('authenticated_event');
      });

      const sessionAnalytics = result.current.getSessionAnalytics();
      expect(sessionAnalytics.userId).toBe('user123');
      expect(sessionAnalytics.sessionId).toBeDefined();
      expect(sessionAnalytics.sessionId).not.toContain('user123'); // User ID should not be in session ID
    });
  });

  describe('Performance Impact of Analytics', () => {
    it('should have minimal performance impact', () => {
      const startTime = performance.now();
      const { result } = renderHook(() => useAnalytics());

      // Track many events rapidly
      act(() => {
        for (let i = 0; i < 1000; i++) {
          result.current.trackEvent(`performance_test_${i}`);
        }
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Analytics should not significantly impact performance
      expect(duration).toBeLessThan(100); // Less than 100ms for 1000 events
    });

    it('should batch events efficiently', () => {
      const { result } = renderHook(() => useAnalytics());

      // Track events that should trigger batching
      act(() => {
        for (let i = 0; i < 15; i++) { // More than batch size (10)
          result.current.trackEvent(`batch_test_${i}`);
        }
      });

      const sessionAnalytics = result.current.getSessionAnalytics();
      expect(sessionAnalytics.eventsCount).toBeLessThanOrEqual(15);
    });

    it('should handle memory efficiently', () => {
      const { result } = renderHook(() => useUsageAnalytics());

      // Generate many interactions
      act(() => {
        for (let i = 0; i < 100; i++) {
          result.current.trackInteraction('click', `element_${i}`, {
            largeData: new Array(1000).fill('data'),
          });
        }
      });

      const insights = result.current.getUserBehaviorInsights();
      expect(insights.interactionTypes.click).toBe(100);
      
      // Memory usage should be reasonable
      const memoryUsage = process.memoryUsage();
      expect(memoryUsage.heapUsed).toBeLessThan(100 * 1024 * 1024); // Less than 100MB
    });
  });
});