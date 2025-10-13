/**
 * Monitoring dashboard component tests - Test monitoring and analytics integration
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MonitoringDashboard } from '../../components/monitoring/MonitoringDashboard';

// Mock the monitoring services
vi.mock('../../services/analytics', () => ({
  analytics: {
    getSessionAnalytics: vi.fn(() => ({
      sessionId: 'test-session-123',
      userId: 'user123',
      eventsCount: 25,
      performanceMetricsCount: 8,
      errorsCount: 2,
      sessionDuration: 300000, // 5 minutes
    })),
    setEnabled: vi.fn(),
    trackEvent: vi.fn(),
  },
  useAnalytics: () => ({
    trackEvent: vi.fn(),
    trackPageView: vi.fn(),
    trackUserAction: vi.fn(),
    trackFeatureUsage: vi.fn(),
    trackPerformance: vi.fn(),
    getSessionAnalytics: vi.fn(() => ({
      sessionId: 'test-session-123',
      userId: 'user123',
      eventsCount: 25,
      performanceMetricsCount: 8,
      errorsCount: 2,
      sessionDuration: 300000,
    })),
  }),
}));

vi.mock('../../services/errorTracking', () => ({
  errorTracking: {
    getErrorStats: vi.fn(() => ({
      total: 5,
      recent: 2,
      byCategory: {
        javascript: 2,
        network: 1,
        validation: 1,
        authentication: 1,
      },
      bySeverity: {
        low: 1,
        medium: 2,
        high: 1,
        critical: 1,
      },
      breadcrumbsCount: 15,
    })),
    setEnabled: vi.fn(),
  },
  useErrorTracking: () => ({
    getErrorStats: vi.fn(() => ({
      total: 5,
      recent: 2,
      byCategory: {
        javascript: 2,
        network: 1,
        validation: 1,
        authentication: 1,
      },
      bySeverity: {
        low: 1,
        medium: 2,
        high: 1,
        critical: 1,
      },
      breadcrumbsCount: 15,
    })),
    captureError: vi.fn(),
    reportError: vi.fn(),
  }),
}));

vi.mock('../../services/usageAnalytics', () => ({
  usageAnalytics: {
    getUserBehaviorInsights: vi.fn(() => ({
      sessionDuration: 300000,
      pageViewsPerSession: 5,
      interactionsPerMinute: 12,
      averagePageDuration: 60000,
      featureUsage: {
        assignment_generator: 3,
        student_management: 5,
        reports: 2,
      },
      interactionTypes: {
        click: 45,
        scroll: 20,
        form_submit: 3,
        search: 2,
      },
      errorRate: 0.02,
      performance: {
        pageLoadTime: 1200,
        timeToInteractive: 800,
        memoryUsage: 25000000,
        errorCount: 2,
      },
    })),
    getFeatureUsageStats: vi.fn(() => ({
      assignment_generator: {
        usageCount: 3,
        totalDuration: 180000,
        successCount: 3,
        averageDuration: 60000,
        successRate: 1.0,
      },
      student_management: {
        usageCount: 5,
        totalDuration: 300000,
        successCount: 4,
        averageDuration: 60000,
        successRate: 0.8,
      },
    })),
  },
  useUsageAnalytics: () => ({
    getUserBehaviorInsights: vi.fn(),
    getFeatureUsageStats: vi.fn(),
  }),
}));

vi.mock('../../hooks/usePerformanceMonitoring', () => ({
  usePerformanceMetrics: () => ({
    getMetrics: vi.fn(() => ({
      components: [
        {
          componentName: 'Dashboard',
          renderTime: 12,
          mountTime: 1000,
          updateCount: 5,
          lastUpdate: Date.now(),
        },
        {
          componentName: 'EstudantesPage',
          renderTime: 15,
          mountTime: 2000,
          updateCount: 3,
          lastUpdate: Date.now() - 60000,
        },
      ],
      webVitals: {
        FCP: 1200,
        LCP: 2500,
        FID: 50,
        CLS: 0.1,
        TTFB: 300,
      },
      memory: {
        usedJSHeapSize: 25000000,
        totalJSHeapSize: 50000000,
        jsHeapSizeLimit: 100000000,
      },
    })),
    clearMetrics: vi.fn(),
  }),
}));

describe('Monitoring Dashboard Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Dashboard Rendering', () => {
    it('should render monitoring dashboard with all sections', () => {
      render(<MonitoringDashboard />);

      expect(screen.getByText('System Monitoring Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Performance Metrics')).toBeInTheDocument();
      expect(screen.getByText('Error Tracking')).toBeInTheDocument();
      expect(screen.getByText('Usage Analytics')).toBeInTheDocument();
      expect(screen.getByText('Session Information')).toBeInTheDocument();
    });

    it('should display performance metrics correctly', () => {
      render(<MonitoringDashboard />);

      // Check Web Vitals
      expect(screen.getByText('First Contentful Paint')).toBeInTheDocument();
      expect(screen.getByText('1.20s')).toBeInTheDocument(); // FCP value
      expect(screen.getByText('Largest Contentful Paint')).toBeInTheDocument();
      expect(screen.getByText('2.50s')).toBeInTheDocument(); // LCP value

      // Check memory usage
      expect(screen.getByText('Memory Usage')).toBeInTheDocument();
      expect(screen.getByText('25.0 MB')).toBeInTheDocument();
    });

    it('should display error statistics correctly', () => {
      render(<MonitoringDashboard />);

      expect(screen.getByText('Total Errors')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('Recent Errors')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();

      // Check error categories
      expect(screen.getByText('JavaScript: 2')).toBeInTheDocument();
      expect(screen.getByText('Network: 1')).toBeInTheDocument();
      expect(screen.getByText('Validation: 1')).toBeInTheDocument();
    });

    it('should display usage analytics correctly', () => {
      render(<MonitoringDashboard />);

      expect(screen.getByText('Session Duration')).toBeInTheDocument();
      expect(screen.getByText('5.0 min')).toBeInTheDocument();
      expect(screen.getByText('Page Views')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('Interactions/Min')).toBeInTheDocument();
      expect(screen.getByText('12')).toBeInTheDocument();
    });

    it('should display component performance metrics', () => {
      render(<MonitoringDashboard />);

      expect(screen.getByText('Component Performance')).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('12ms')).toBeInTheDocument(); // Render time
      expect(screen.getByText('EstudantesPage')).toBeInTheDocument();
      expect(screen.getByText('15ms')).toBeInTheDocument(); // Render time
    });
  });

  describe('Interactive Features', () => {
    it('should allow toggling analytics tracking', async () => {
      const { analytics } = await import('../../services/analytics');
      render(<MonitoringDashboard />);

      const toggleButton = screen.getByText('Disable Analytics');
      fireEvent.click(toggleButton);

      expect(analytics.setEnabled).toHaveBeenCalledWith(false);
      expect(screen.getByText('Enable Analytics')).toBeInTheDocument();
    });

    it('should allow toggling error tracking', async () => {
      const { errorTracking } = await import('../../services/errorTracking');
      render(<MonitoringDashboard />);

      const toggleButton = screen.getByText('Disable Error Tracking');
      fireEvent.click(toggleButton);

      expect(errorTracking.setEnabled).toHaveBeenCalledWith(false);
      expect(screen.getByText('Enable Error Tracking')).toBeInTheDocument();
    });

    it('should allow clearing performance metrics', async () => {
      render(<MonitoringDashboard />);

      const clearButton = screen.getByText('Clear Metrics');
      fireEvent.click(clearButton);

      // Should trigger metrics clearing
      await waitFor(() => {
        expect(screen.getByText('Metrics cleared')).toBeInTheDocument();
      });
    });

    it('should refresh data when refresh button is clicked', async () => {
      render(<MonitoringDashboard />);

      const refreshButton = screen.getByText('Refresh Data');
      fireEvent.click(refreshButton);

      // Should show loading state briefly
      await waitFor(() => {
        expect(screen.getByText('Refreshing...')).toBeInTheDocument();
      });

      // Should return to normal state
      await waitFor(() => {
        expect(screen.getByText('Refresh Data')).toBeInTheDocument();
      });
    });
  });

  describe('Data Accuracy Validation', () => {
    it('should display accurate session information', () => {
      render(<MonitoringDashboard />);

      expect(screen.getByText('Session ID')).toBeInTheDocument();
      expect(screen.getByText('test-session-123')).toBeInTheDocument();
      expect(screen.getByText('User ID')).toBeInTheDocument();
      expect(screen.getByText('user123')).toBeInTheDocument();
    });

    it('should calculate percentages correctly', () => {
      render(<MonitoringDashboard />);

      // Error rate should be calculated correctly (2/100 interactions = 2%)
      expect(screen.getByText('Error Rate')).toBeInTheDocument();
      expect(screen.getByText('2.0%')).toBeInTheDocument();
    });

    it('should format time values correctly', () => {
      render(<MonitoringDashboard />);

      // Session duration should be formatted as minutes
      expect(screen.getByText('5.0 min')).toBeInTheDocument();
      
      // Performance metrics should be formatted as seconds/milliseconds
      expect(screen.getByText('1.20s')).toBeInTheDocument(); // FCP
      expect(screen.getByText('50ms')).toBeInTheDocument(); // FID
    });

    it('should format memory values correctly', () => {
      render(<MonitoringDashboard />);

      // Memory should be formatted in MB
      expect(screen.getByText('25.0 MB')).toBeInTheDocument();
      expect(screen.getByText('/ 100.0 MB')).toBeInTheDocument(); // Heap limit
    });
  });

  describe('Performance Indicators', () => {
    it('should show performance status indicators', () => {
      render(<MonitoringDashboard />);

      // Good performance should show green indicators
      const goodIndicators = screen.getAllByTestId('performance-good');
      expect(goodIndicators.length).toBeGreaterThan(0);
    });

    it('should show warning indicators for poor performance', () => {
      // Mock poor performance metrics
      const { usePerformanceMetrics } = require('../../hooks/usePerformanceMonitoring');
      vi.mocked(usePerformanceMetrics).mockReturnValue({
        getMetrics: vi.fn(() => ({
          webVitals: {
            FCP: 4000, // Poor FCP (>3s)
            LCP: 5000, // Poor LCP (>4s)
            FID: 200,  // Poor FID (>100ms)
            CLS: 0.3,  // Poor CLS (>0.25)
          },
        })),
        clearMetrics: vi.fn(),
      });

      render(<MonitoringDashboard />);

      // Poor performance should show warning indicators
      const warningIndicators = screen.getAllByTestId('performance-warning');
      expect(warningIndicators.length).toBeGreaterThan(0);
    });

    it('should show error indicators for critical issues', () => {
      render(<MonitoringDashboard />);

      // Critical errors should be highlighted
      expect(screen.getByText('Critical: 1')).toBeInTheDocument();
      const criticalIndicator = screen.getByTestId('error-critical');
      expect(criticalIndicator).toHaveClass('text-red-600');
    });
  });

  describe('Real-time Updates', () => {
    it('should update metrics in real-time', async () => {
      const { rerender } = render(<MonitoringDashboard />);

      // Mock updated analytics data
      const { analytics } = await import('../../services/analytics');
      vi.mocked(analytics.getSessionAnalytics).mockReturnValue({
        sessionId: 'test-session-123',
        userId: 'user123',
        eventsCount: 30, // Updated count
        performanceMetricsCount: 10,
        errorsCount: 3,
        sessionDuration: 360000, // 6 minutes
      });

      rerender(<MonitoringDashboard />);

      // Should show updated values
      expect(screen.getByText('30')).toBeInTheDocument(); // Updated events count
      expect(screen.getByText('6.0 min')).toBeInTheDocument(); // Updated duration
    });

    it('should handle data loading states', () => {
      // Mock loading state
      const { usePerformanceMetrics } = require('../../hooks/usePerformanceMonitoring');
      vi.mocked(usePerformanceMetrics).mockReturnValue({
        getMetrics: vi.fn(() => null), // Simulate loading
        clearMetrics: vi.fn(),
      });

      render(<MonitoringDashboard />);

      expect(screen.getByText('Loading metrics...')).toBeInTheDocument();
    });

    it('should handle error states gracefully', () => {
      // Mock error state
      const { usePerformanceMetrics } = require('../../hooks/usePerformanceMonitoring');
      vi.mocked(usePerformanceMetrics).mockImplementation(() => {
        throw new Error('Failed to load metrics');
      });

      expect(() => render(<MonitoringDashboard />)).not.toThrow();
    });
  });

  describe('Export and Reporting', () => {
    it('should allow exporting monitoring data', async () => {
      render(<MonitoringDashboard />);

      const exportButton = screen.getByText('Export Data');
      fireEvent.click(exportButton);

      // Should trigger export functionality
      await waitFor(() => {
        expect(screen.getByText('Data exported')).toBeInTheDocument();
      });
    });

    it('should generate monitoring reports', async () => {
      render(<MonitoringDashboard />);

      const reportButton = screen.getByText('Generate Report');
      fireEvent.click(reportButton);

      // Should show report generation
      await waitFor(() => {
        expect(screen.getByText('Generating report...')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility and Usability', () => {
    it('should be accessible with keyboard navigation', () => {
      render(<MonitoringDashboard />);

      const toggleButton = screen.getByText('Disable Analytics');
      toggleButton.focus();
      expect(document.activeElement).toBe(toggleButton);

      // Should be able to activate with Enter key
      fireEvent.keyDown(toggleButton, { key: 'Enter' });
      expect(screen.getByText('Enable Analytics')).toBeInTheDocument();
    });

    it('should have proper ARIA labels', () => {
      render(<MonitoringDashboard />);

      const dashboard = screen.getByRole('main');
      expect(dashboard).toHaveAttribute('aria-label', 'System Monitoring Dashboard');

      const metricsSection = screen.getByRole('region', { name: 'Performance Metrics' });
      expect(metricsSection).toBeInTheDocument();
    });

    it('should provide screen reader friendly content', () => {
      render(<MonitoringDashboard />);

      // Important metrics should have descriptive text
      expect(screen.getByText('5 total errors recorded')).toBeInTheDocument();
      expect(screen.getByText('2 recent errors in the last hour')).toBeInTheDocument();
    });
  });

  describe('Performance Impact', () => {
    it('should render efficiently with large datasets', () => {
      // Mock large dataset
      const { usePerformanceMetrics } = require('../../hooks/usePerformanceMonitoring');
      vi.mocked(usePerformanceMetrics).mockReturnValue({
        getMetrics: vi.fn(() => ({
          components: Array.from({ length: 100 }, (_, i) => ({
            componentName: `Component${i}`,
            renderTime: Math.random() * 20,
            mountTime: Date.now() - Math.random() * 100000,
            updateCount: Math.floor(Math.random() * 10),
            lastUpdate: Date.now(),
          })),
          webVitals: {
            FCP: 1200,
            LCP: 2500,
            FID: 50,
            CLS: 0.1,
            TTFB: 300,
          },
          memory: {
            usedJSHeapSize: 25000000,
            totalJSHeapSize: 50000000,
            jsHeapSizeLimit: 100000000,
          },
        })),
        clearMetrics: vi.fn(),
      });

      const startTime = performance.now();
      render(<MonitoringDashboard />);
      const endTime = performance.now();

      // Should render quickly even with large datasets
      expect(endTime - startTime).toBeLessThan(100); // Less than 100ms
    });

    it('should not cause memory leaks', () => {
      const { unmount } = render(<MonitoringDashboard />);

      // Should cleanup properly
      expect(() => unmount()).not.toThrow();
    });
  });
});