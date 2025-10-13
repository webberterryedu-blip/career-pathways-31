/**
 * Analytics and user interaction tracking service
 */

interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp: number;
  userId?: string;
  sessionId: string;
}

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface ErrorEvent {
  message: string;
  stack?: string;
  url: string;
  line?: number;
  column?: number;
  timestamp: number;
  userId?: string;
  sessionId: string;
  userAgent: string;
  additionalContext?: Record<string, any>;
}

class AnalyticsService {
  private sessionId: string;
  private userId?: string;
  private events: AnalyticsEvent[] = [];
  private performanceMetrics: PerformanceMetric[] = [];
  private errors: ErrorEvent[] = [];
  private isEnabled: boolean = true;
  private batchSize: number = 10;
  private flushInterval: number = 30000; // 30 seconds
  private flushTimer?: NodeJS.Timeout;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.setupErrorTracking();
    this.setupPerformanceTracking();
    this.startBatchFlush();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupErrorTracking() {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.trackError({
        message: event.message,
        stack: event.error?.stack,
        url: event.filename,
        line: event.lineno,
        column: event.colno,
        timestamp: Date.now(),
        userId: this.userId,
        sessionId: this.sessionId,
        userAgent: navigator.userAgent,
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        url: window.location.href,
        timestamp: Date.now(),
        userId: this.userId,
        sessionId: this.sessionId,
        userAgent: navigator.userAgent,
        additionalContext: {
          type: 'unhandledrejection',
          reason: event.reason,
        },
      });
    });
  }

  private setupPerformanceTracking() {
    // Track page load performance
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigation) {
          this.trackPerformance('page_load_time', navigation.loadEventEnd - navigation.navigationStart, {
            domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
            firstPaint: this.getFirstPaint(),
            firstContentfulPaint: this.getFirstContentfulPaint(),
          });
        }
      }, 0);
    });

    // Track Core Web Vitals
    this.trackWebVitals();
  }

  private getFirstPaint(): number | null {
    const paintEntries = performance.getEntriesByType('paint');
    const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
    return firstPaint ? firstPaint.startTime : null;
  }

  private getFirstContentfulPaint(): number | null {
    const paintEntries = performance.getEntriesByType('paint');
    const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    return fcp ? fcp.startTime : null;
  }

  private trackWebVitals() {
    // Track Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.trackPerformance('largest_contentful_paint', lastEntry.startTime);
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        // Track First Input Delay (FID)
        const fidObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const fid = (entry as any).processingStart - entry.startTime;
            this.trackPerformance('first_input_delay', fid);
          }
        });
        fidObserver.observe({ entryTypes: ['first-input'] });

        // Track Cumulative Layout Shift (CLS)
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
          this.trackPerformance('cumulative_layout_shift', clsValue);
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (error) {
        console.warn('Performance Observer not supported:', error);
      }
    }
  }

  private startBatchFlush() {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  setUserId(userId: string) {
    this.userId = userId;
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  // Track user interactions
  trackEvent(name: string, properties?: Record<string, any>) {
    if (!this.isEnabled) return;

    const event: AnalyticsEvent = {
      name,
      properties,
      timestamp: Date.now(),
      userId: this.userId,
      sessionId: this.sessionId,
    };

    this.events.push(event);
    this.checkBatchSize();
  }

  // Track page views
  trackPageView(path: string, title?: string) {
    this.trackEvent('page_view', {
      path,
      title: title || document.title,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
    });
  }

  // Track user actions
  trackUserAction(action: string, target?: string, properties?: Record<string, any>) {
    this.trackEvent('user_action', {
      action,
      target,
      ...properties,
    });
  }

  // Track feature usage
  trackFeatureUsage(feature: string, properties?: Record<string, any>) {
    this.trackEvent('feature_usage', {
      feature,
      ...properties,
    });
  }

  // Track performance metrics
  trackPerformance(name: string, value: number, metadata?: Record<string, any>) {
    if (!this.isEnabled) return;

    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      metadata,
    };

    this.performanceMetrics.push(metric);
    this.checkBatchSize();
  }

  // Track errors
  trackError(error: Omit<ErrorEvent, 'timestamp' | 'sessionId' | 'userAgent'>) {
    if (!this.isEnabled) return;

    const errorEvent: ErrorEvent = {
      ...error,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userAgent: navigator.userAgent,
    };

    this.errors.push(errorEvent);
    
    // Immediately flush errors for quick response
    this.flushErrors();
  }

  // Track custom metrics
  trackCustomMetric(name: string, value: number, unit?: string, tags?: Record<string, string>) {
    this.trackPerformance(`custom_${name}`, value, {
      unit,
      tags,
    });
  }

  // Track timing
  time(name: string): () => void {
    const startTime = performance.now();
    return () => {
      const duration = performance.now() - startTime;
      this.trackPerformance(`timing_${name}`, duration, {
        unit: 'milliseconds',
      });
    };
  }

  // Track async operations
  async trackAsync<T>(name: string, operation: () => Promise<T>): Promise<T> {
    const endTiming = this.time(name);
    try {
      const result = await operation();
      this.trackEvent(`${name}_success`);
      return result;
    } catch (error) {
      this.trackEvent(`${name}_error`, {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    } finally {
      endTiming();
    }
  }

  private checkBatchSize() {
    const totalEvents = this.events.length + this.performanceMetrics.length;
    if (totalEvents >= this.batchSize) {
      this.flush();
    }
  }

  private async flush() {
    if (this.events.length === 0 && this.performanceMetrics.length === 0) {
      return;
    }

    const payload = {
      sessionId: this.sessionId,
      userId: this.userId,
      events: [...this.events],
      performanceMetrics: [...this.performanceMetrics],
      timestamp: Date.now(),
    };

    // Clear the arrays
    this.events = [];
    this.performanceMetrics = [];

    try {
      await this.sendToAnalytics(payload);
    } catch (error) {
      console.warn('Failed to send analytics data:', error);
      // In a real implementation, you might want to retry or store locally
    }
  }

  private async flushErrors() {
    if (this.errors.length === 0) return;

    const payload = {
      sessionId: this.sessionId,
      userId: this.userId,
      errors: [...this.errors],
      timestamp: Date.now(),
    };

    // Clear the errors array
    this.errors = [];

    try {
      await this.sendErrorsToAnalytics(payload);
    } catch (error) {
      console.warn('Failed to send error data:', error);
    }
  }

  private async sendToAnalytics(payload: any) {
    // In a real implementation, this would send to your analytics service
    // For now, we'll just log to console in development
    if (import.meta.env.DEV) {
      console.log('Analytics payload:', payload);
    }

    // Example implementation for a real analytics service:
    /*
    await fetch('/api/analytics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    */
  }

  private async sendErrorsToAnalytics(payload: any) {
    // In a real implementation, this would send to your error tracking service
    if (import.meta.env.DEV) {
      console.error('Error tracking payload:', payload);
    }

    // Example implementation for a real error tracking service:
    /*
    await fetch('/api/errors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    */
  }

  // Get current session analytics
  getSessionAnalytics() {
    return {
      sessionId: this.sessionId,
      userId: this.userId,
      eventsCount: this.events.length,
      performanceMetricsCount: this.performanceMetrics.length,
      errorsCount: this.errors.length,
      sessionDuration: Date.now() - parseInt(this.sessionId.split('_')[1]),
    };
  }

  // Cleanup
  destroy() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flush(); // Final flush
  }
}

// Create singleton instance
export const analytics = new AnalyticsService();

// React hook for analytics
export const useAnalytics = () => {
  return {
    trackEvent: analytics.trackEvent.bind(analytics),
    trackPageView: analytics.trackPageView.bind(analytics),
    trackUserAction: analytics.trackUserAction.bind(analytics),
    trackFeatureUsage: analytics.trackFeatureUsage.bind(analytics),
    trackPerformance: analytics.trackPerformance.bind(analytics),
    trackError: analytics.trackError.bind(analytics),
    time: analytics.time.bind(analytics),
    trackAsync: analytics.trackAsync.bind(analytics),
    setUserId: analytics.setUserId.bind(analytics),
    getSessionAnalytics: analytics.getSessionAnalytics.bind(analytics),
  };
};