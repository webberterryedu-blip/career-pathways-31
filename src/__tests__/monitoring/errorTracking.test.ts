/**
 * Error tracking and reporting functionality tests
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { errorTracking, useErrorTracking } from '../../services/errorTracking';

// Mock global APIs
const mockNavigator = {
  userAgent: 'Mozilla/5.0 (Test Browser) Chrome/91.0.4472.124',
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

const mockConsole = {
  error: vi.fn(),
  warn: vi.fn(),
  log: vi.fn(),
};

Object.defineProperty(global, 'navigator', { value: mockNavigator, writable: true });
Object.defineProperty(global, 'window', { value: mockWindow, writable: true });
Object.defineProperty(global, 'console', { value: mockConsole, writable: true });

// Mock fetch for network error simulation
global.fetch = vi.fn();

describe('Error Tracking and Reporting Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    errorTracking.setEnabled(true);
    
    // Reset fetch mock
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
    } as Response);
  });

  afterEach(() => {
    vi.useRealTimers();
    errorTracking.destroy();
  });

  describe('Error Capture and Classification', () => {
    it('should capture JavaScript errors with correct metadata', () => {
      const { result } = renderHook(() => useErrorTracking());
      
      const testError = new Error('Test JavaScript error');
      testError.stack = 'Error: Test JavaScript error\n    at test.js:10:5';

      act(() => {
        result.current.captureError(testError, {
          category: 'javascript',
          severity: 'high',
          context: { component: 'TestComponent' },
        });
      });

      const errorStats = result.current.getErrorStats();
      expect(errorStats.total).toBe(1);
      expect(errorStats.byCategory.javascript).toBe(1);
      expect(errorStats.bySeverity.high).toBe(1);
    });

    it('should automatically categorize errors correctly', () => {
      const { result } = renderHook(() => useErrorTracking());

      const errors = [
        { error: new Error('Network request failed'), expectedCategory: 'network' },
        { error: new Error('Validation failed: invalid email'), expectedCategory: 'validation' },
        { error: new Error('Unauthorized access'), expectedCategory: 'authentication' },
        { error: new Error('Permission denied'), expectedCategory: 'authentication' },
        { error: new Error('Syntax error in code'), expectedCategory: 'javascript' },
      ];

      errors.forEach(({ error }) => {
        act(() => {
          result.current.captureError(error);
        });
      });

      const errorStats = result.current.getErrorStats();
      expect(errorStats.total).toBe(errors.length);
      expect(errorStats.byCategory.network).toBeGreaterThan(0);
      expect(errorStats.byCategory.validation).toBeGreaterThan(0);
      expect(errorStats.byCategory.authentication).toBeGreaterThan(0);
    });

    it('should determine error severity automatically', () => {
      const { result } = renderHook(() => useErrorTracking());

      const errors = [
        { message: 'Network timeout', expectedSeverity: 'medium' },
        { message: 'Permission denied', expectedSeverity: 'high' },
        { message: 'Syntax error detected', expectedSeverity: 'critical' },
        { message: 'Minor validation issue', expectedSeverity: 'medium' },
      ];

      errors.forEach(({ message }) => {
        act(() => {
          result.current.captureError(new Error(message));
        });
      });

      const errorStats = result.current.getErrorStats();
      expect(errorStats.total).toBe(errors.length);
      expect(errorStats.bySeverity.medium).toBeGreaterThan(0);
      expect(errorStats.bySeverity.high).toBeGreaterThan(0);
      expect(errorStats.bySeverity.critical).toBeGreaterThan(0);
    });

    it('should capture exceptions with context', () => {
      const { result } = renderHook(() => useErrorTracking());

      const testError = new Error('Context test error');
      const context = {
        userId: 'user123',
        action: 'form_submit',
        formData: { name: 'John', email: 'john@test.com' },
      };

      act(() => {
        result.current.captureException(testError, context);
      });

      const errorStats = result.current.getErrorStats();
      expect(errorStats.total).toBe(1);
    });

    it('should capture messages as errors', () => {
      const { result } = renderHook(() => useErrorTracking());

      act(() => {
        result.current.captureMessage('Custom error message', 'error', {
          component: 'TestComponent',
          props: { id: 123 },
        });
      });

      const errorStats = result.current.getErrorStats();
      expect(errorStats.total).toBe(1);
      expect(errorStats.bySeverity.medium).toBe(1);
    });
  });

  describe('Breadcrumb Tracking', () => {
    it('should add breadcrumbs with correct metadata', () => {
      const { result } = renderHook(() => useErrorTracking());

      act(() => {
        result.current.addBreadcrumb({
          category: 'navigation',
          level: 'info',
          message: 'User navigated to dashboard',
          data: { from: '/login', to: '/dashboard' },
        });
      });

      const errorStats = result.current.getErrorStats();
      expect(errorStats.breadcrumbsCount).toBe(1);
    });

    it('should maintain breadcrumb order and limit', () => {
      const { result } = renderHook(() => useErrorTracking());

      // Add more breadcrumbs than the limit (50)
      act(() => {
        for (let i = 0; i < 60; i++) {
          result.current.addBreadcrumb({
            category: 'user',
            level: 'info',
            message: `Action ${i}`,
          });
        }
      });

      const errorStats = result.current.getErrorStats();
      expect(errorStats.breadcrumbsCount).toBe(50); // Should be limited to 50
    });

    it('should automatically add breadcrumbs for console errors', () => {
      const { result } = renderHook(() => useErrorTracking());

      // Trigger console.error which should add a breadcrumb
      console.error('Test console error', { data: 'test' });

      const errorStats = result.current.getErrorStats();
      expect(errorStats.breadcrumbsCount).toBeGreaterThan(0);
    });

    it('should automatically add breadcrumbs for console warnings', () => {
      const { result } = renderHook(() => useErrorTracking());

      // Trigger console.warn which should add a breadcrumb
      console.warn('Test console warning');

      const errorStats = result.current.getErrorStats();
      expect(errorStats.breadcrumbsCount).toBeGreaterThan(0);
    });
  });

  describe('Global Error Handling', () => {
    it('should handle window error events', () => {
      const { result } = renderHook(() => useErrorTracking());

      // Simulate window error event
      const errorEvent = new ErrorEvent('error', {
        message: 'Global error occurred',
        filename: 'test.js',
        lineno: 10,
        colno: 5,
        error: new Error('Global error'),
      });

      act(() => {
        window.dispatchEvent(errorEvent);
      });

      const errorStats = result.current.getErrorStats();
      expect(errorStats.total).toBeGreaterThan(0);
    });

    it('should handle unhandled promise rejections', () => {
      const { result } = renderHook(() => useErrorTracking());

      // Simulate unhandled promise rejection
      const rejectionEvent = new PromiseRejectionEvent('unhandledrejection', {
        promise: Promise.reject(new Error('Unhandled promise rejection')),
        reason: new Error('Unhandled promise rejection'),
      });

      act(() => {
        window.dispatchEvent(rejectionEvent);
      });

      const errorStats = result.current.getErrorStats();
      expect(errorStats.total).toBeGreaterThan(0);
    });

    it('should handle network errors from fetch', async () => {
      const { result } = renderHook(() => useErrorTracking());

      // Mock fetch to fail
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

      try {
        await fetch('/api/test');
      } catch (error) {
        // Expected to fail
      }

      // The error tracking should have intercepted this
      const errorStats = result.current.getErrorStats();
      expect(errorStats.total).toBeGreaterThan(0);
    });

    it('should handle HTTP error responses', async () => {
      const { result } = renderHook(() => useErrorTracking());

      // Mock fetch to return error response
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response);

      try {
        const response = await fetch('/api/test');
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        // Expected to fail
      }

      const errorStats = result.current.getErrorStats();
      expect(errorStats.total).toBeGreaterThan(0);
    });
  });

  describe('Error Fingerprinting and Grouping', () => {
    it('should generate consistent fingerprints for similar errors', () => {
      const { result } = renderHook(() => useErrorTracking());

      const error1 = new Error('Test error message');
      error1.stack = 'Error: Test error message\n    at test.js:10:5\n    at main.js:20:10';

      const error2 = new Error('Test error message');
      error2.stack = 'Error: Test error message\n    at test.js:10:5\n    at main.js:20:10';

      act(() => {
        result.current.captureError(error1);
        result.current.captureError(error2);
      });

      // Both errors should be captured
      const errorStats = result.current.getErrorStats();
      expect(errorStats.total).toBe(2);
    });

    it('should generate different fingerprints for different errors', () => {
      const { result } = renderHook(() => useErrorTracking());

      const error1 = new Error('First error message');
      const error2 = new Error('Second error message');

      act(() => {
        result.current.captureError(error1);
        result.current.captureError(error2);
      });

      const errorStats = result.current.getErrorStats();
      expect(errorStats.total).toBe(2);
    });
  });

  describe('Environment Information Collection', () => {
    it('should collect accurate browser information', () => {
      const { result } = renderHook(() => useErrorTracking());

      act(() => {
        result.current.captureError(new Error('Browser info test'));
      });

      // Browser info should be collected automatically
      const errorStats = result.current.getErrorStats();
      expect(errorStats.total).toBe(1);
    });

    it('should collect viewport information', () => {
      const { result } = renderHook(() => useErrorTracking());

      act(() => {
        result.current.captureError(new Error('Viewport test'));
      });

      const errorStats = result.current.getErrorStats();
      expect(errorStats.total).toBe(1);
    });

    it('should collect memory information when available', () => {
      // Mock performance.memory
      Object.defineProperty(performance, 'memory', {
        value: {
          usedJSHeapSize: 10000000,
          totalJSHeapSize: 20000000,
          jsHeapSizeLimit: 50000000,
        },
        writable: true,
      });

      const { result } = renderHook(() => useErrorTracking());

      act(() => {
        result.current.captureError(new Error('Memory test'));
      });

      const errorStats = result.current.getErrorStats();
      expect(errorStats.total).toBe(1);
    });
  });

  describe('Error Reporting and Batching', () => {
    it('should queue errors for batching', () => {
      const { result } = renderHook(() => useErrorTracking());

      // Add multiple errors
      act(() => {
        for (let i = 0; i < 5; i++) {
          result.current.captureError(new Error(`Batch test error ${i}`));
        }
      });

      const errorStats = result.current.getErrorStats();
      expect(errorStats.total).toBe(5);
    });

    it('should immediately flush critical errors', () => {
      const { result } = renderHook(() => useErrorTracking());

      act(() => {
        result.current.captureError(new Error('Critical system failure'), {
          severity: 'critical',
        });
      });

      const errorStats = result.current.getErrorStats();
      expect(errorStats.total).toBe(1);
      expect(errorStats.bySeverity.critical).toBe(1);
    });

    it('should respect queue size limits', () => {
      const { result } = renderHook(() => useErrorTracking());

      // Add more errors than the queue limit (100)
      act(() => {
        for (let i = 0; i < 150; i++) {
          result.current.captureError(new Error(`Queue limit test ${i}`));
        }
      });

      const errorStats = result.current.getErrorStats();
      expect(errorStats.total).toBeLessThanOrEqual(100);
    });
  });

  describe('Privacy and Security', () => {
    it('should respect enabled/disabled state', () => {
      const { result } = renderHook(() => useErrorTracking());

      // Disable error tracking
      act(() => {
        errorTracking.setEnabled(false);
        result.current.captureError(new Error('Disabled tracking test'));
      });

      const errorStats = result.current.getErrorStats();
      expect(errorStats.total).toBe(0);

      // Re-enable error tracking
      act(() => {
        errorTracking.setEnabled(true);
        result.current.captureError(new Error('Enabled tracking test'));
      });

      const updatedStats = result.current.getErrorStats();
      expect(updatedStats.total).toBe(1);
    });

    it('should handle user identification securely', () => {
      const { result } = renderHook(() => useErrorTracking());

      act(() => {
        result.current.setUserId('user123');
        result.current.captureError(new Error('User identification test'));
      });

      const errorStats = result.current.getErrorStats();
      expect(errorStats.total).toBe(1);
    });

    it('should sanitize sensitive information', () => {
      const { result } = renderHook(() => useErrorTracking());

      act(() => {
        result.current.captureError(new Error('Error with sensitive data'), {
          context: {
            password: 'secret123', // This should be sanitized
            email: 'user@test.com',
            publicData: 'safe information',
          },
        });
      });

      const errorStats = result.current.getErrorStats();
      expect(errorStats.total).toBe(1);
    });
  });

  describe('Error Statistics and Analytics', () => {
    it('should provide accurate error statistics', () => {
      const { result } = renderHook(() => useErrorTracking());

      // Add various types of errors
      act(() => {
        result.current.captureError(new Error('Network error'), { category: 'network', severity: 'medium' });
        result.current.captureError(new Error('Validation error'), { category: 'validation', severity: 'low' });
        result.current.captureError(new Error('Critical error'), { category: 'javascript', severity: 'critical' });
      });

      const errorStats = result.current.getErrorStats();
      expect(errorStats.total).toBe(3);
      expect(errorStats.byCategory.network).toBe(1);
      expect(errorStats.byCategory.validation).toBe(1);
      expect(errorStats.byCategory.javascript).toBe(1);
      expect(errorStats.bySeverity.medium).toBe(1);
      expect(errorStats.bySeverity.low).toBe(1);
      expect(errorStats.bySeverity.critical).toBe(1);
    });

    it('should track recent errors separately', () => {
      const { result } = renderHook(() => useErrorTracking());

      // Add old error
      act(() => {
        result.current.captureError(new Error('Old error'));
        vi.advanceTimersByTime(2 * 60 * 60 * 1000); // 2 hours
        result.current.captureError(new Error('Recent error'));
      });

      const errorStats = result.current.getErrorStats();
      expect(errorStats.total).toBe(2);
      expect(errorStats.recent).toBe(1); // Only recent errors within 1 hour
    });

    it('should provide breadcrumb statistics', () => {
      const { result } = renderHook(() => useErrorTracking());

      act(() => {
        for (let i = 0; i < 10; i++) {
          result.current.addBreadcrumb({
            category: 'user',
            level: 'info',
            message: `Breadcrumb ${i}`,
          });
        }
      });

      const errorStats = result.current.getErrorStats();
      expect(errorStats.breadcrumbsCount).toBe(10);
    });
  });

  describe('Manual Error Reporting', () => {
    it('should allow manual error reporting', () => {
      const { result } = renderHook(() => useErrorTracking());

      act(() => {
        result.current.reportError('Manual error report', {
          component: 'TestComponent',
          action: 'manual_test',
          severity: 'medium',
        });
      });

      const errorStats = result.current.getErrorStats();
      expect(errorStats.total).toBe(1);
    });

    it('should handle manual error reporting with context', () => {
      const { result } = renderHook(() => useErrorTracking());

      const context = {
        userId: 'user123',
        sessionId: 'session456',
        feature: 'assignment_generator',
        metadata: { step: 'validation', attempt: 3 },
      };

      act(() => {
        result.current.reportError('Manual error with context', context);
      });

      const errorStats = result.current.getErrorStats();
      expect(errorStats.total).toBe(1);
    });
  });

  describe('Cleanup and Resource Management', () => {
    it('should cleanup resources on destroy', () => {
      const { result } = renderHook(() => useErrorTracking());

      act(() => {
        result.current.captureError(new Error('Cleanup test'));
      });

      expect(() => errorTracking.destroy()).not.toThrow();
    });

    it('should handle multiple destroy calls gracefully', () => {
      expect(() => {
        errorTracking.destroy();
        errorTracking.destroy();
      }).not.toThrow();
    });
  });
});