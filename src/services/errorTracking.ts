/**
 * Error tracking and reporting service for production issues
 */

interface ErrorReport {
  id: string;
  message: string;
  stack?: string;
  url: string;
  timestamp: number;
  userId?: string;
  sessionId: string;
  userAgent: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'javascript' | 'network' | 'validation' | 'authentication' | 'permission' | 'unknown';
  context: {
    component?: string;
    action?: string;
    props?: Record<string, any>;
    state?: Record<string, any>;
    route?: string;
    breadcrumbs?: Breadcrumb[];
  };
  environment: {
    browser: string;
    os: string;
    viewport: { width: number; height: number };
    connection?: string;
    memory?: any;
  };
  tags: Record<string, string>;
  fingerprint: string;
}

interface Breadcrumb {
  timestamp: number;
  category: 'navigation' | 'user' | 'http' | 'console' | 'error';
  message: string;
  level: 'info' | 'warning' | 'error';
  data?: Record<string, any>;
}

class ErrorTrackingService {
  private breadcrumbs: Breadcrumb[] = [];
  private maxBreadcrumbs: number = 50;
  private sessionId: string;
  private userId?: string;
  private isEnabled: boolean = true;
  private errorQueue: ErrorReport[] = [];
  private maxQueueSize: number = 100;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.setupGlobalErrorHandlers();
    this.setupNetworkErrorTracking();
    this.setupConsoleTracking();
  }

  private generateSessionId(): string {
    return `error_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupGlobalErrorHandlers() {
    // JavaScript errors
    window.addEventListener('error', (event) => {
      this.captureError(event.error || new Error(event.message), {
        category: 'javascript',
        severity: 'high',
        context: {
          url: event.filename,
          line: event.lineno,
          column: event.colno,
        },
      });
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError(
        event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
        {
          category: 'javascript',
          severity: 'high',
          context: {
            type: 'unhandledrejection',
          },
        }
      );
    });
  }

  private setupNetworkErrorTracking() {
    // Intercept fetch requests
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = Date.now();
      try {
        const response = await originalFetch(...args);
        
        // Track failed HTTP requests
        if (!response.ok) {
          this.captureError(new Error(`HTTP ${response.status}: ${response.statusText}`), {
            category: 'network',
            severity: response.status >= 500 ? 'high' : 'medium',
            context: {
              url: args[0]?.toString(),
              method: args[1]?.method || 'GET',
              status: response.status,
              duration: Date.now() - startTime,
            },
          });
        }

        return response;
      } catch (error) {
        this.captureError(error as Error, {
          category: 'network',
          severity: 'high',
          context: {
            url: args[0]?.toString(),
            method: args[1]?.method || 'GET',
            duration: Date.now() - startTime,
          },
        });
        throw error;
      }
    };
  }

  private setupConsoleTracking() {
    // Track console errors
    const originalConsoleError = console.error;
    console.error = (...args) => {
      this.addBreadcrumb({
        category: 'console',
        level: 'error',
        message: args.join(' '),
        timestamp: Date.now(),
      });
      originalConsoleError.apply(console, args);
    };

    // Track console warnings
    const originalConsoleWarn = console.warn;
    console.warn = (...args) => {
      this.addBreadcrumb({
        category: 'console',
        level: 'warning',
        message: args.join(' '),
        timestamp: Date.now(),
      });
      originalConsoleWarn.apply(console, args);
    };
  }

  setUserId(userId: string) {
    this.userId = userId;
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  addBreadcrumb(breadcrumb: Omit<Breadcrumb, 'timestamp'>) {
    if (!this.isEnabled) return;

    this.breadcrumbs.push({
      ...breadcrumb,
      timestamp: Date.now(),
    });

    // Keep only the most recent breadcrumbs
    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs = this.breadcrumbs.slice(-this.maxBreadcrumbs);
    }
  }

  captureError(
    error: Error,
    options: {
      category?: ErrorReport['category'];
      severity?: ErrorReport['severity'];
      context?: Partial<ErrorReport['context']>;
      tags?: Record<string, string>;
    } = {}
  ) {
    if (!this.isEnabled) return;

    const errorReport: ErrorReport = {
      id: this.generateErrorId(),
      message: error.message,
      stack: error.stack,
      url: window.location.href,
      timestamp: Date.now(),
      userId: this.userId,
      sessionId: this.sessionId,
      userAgent: navigator.userAgent,
      severity: options.severity || this.determineSeverity(error),
      category: options.category || this.categorizeError(error),
      context: {
        route: window.location.pathname,
        breadcrumbs: [...this.breadcrumbs],
        ...options.context,
      },
      environment: this.getEnvironmentInfo(),
      tags: {
        environment: import.meta.env.MODE,
        ...options.tags,
      },
      fingerprint: this.generateFingerprint(error),
    };

    this.queueError(errorReport);
    this.addBreadcrumb({
      category: 'error',
      level: 'error',
      message: error.message,
      data: {
        stack: error.stack,
        category: errorReport.category,
        severity: errorReport.severity,
      },
    });
  }

  captureException(error: Error, context?: Record<string, any>) {
    this.captureError(error, {
      category: 'javascript',
      severity: 'high',
      context,
    });
  }

  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: Record<string, any>) {
    const error = new Error(message);
    this.captureError(error, {
      category: 'unknown',
      severity: level === 'error' ? 'medium' : 'low',
      context,
    });
  }

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private determineSeverity(error: Error): ErrorReport['severity'] {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      return 'medium';
    }
    
    if (message.includes('permission') || message.includes('unauthorized')) {
      return 'high';
    }
    
    if (message.includes('syntax') || message.includes('reference')) {
      return 'critical';
    }
    
    return 'medium';
  }

  private categorizeError(error: Error): ErrorReport['category'] {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || '';
    
    if (message.includes('network') || message.includes('fetch') || message.includes('http')) {
      return 'network';
    }
    
    if (message.includes('validation') || message.includes('invalid')) {
      return 'validation';
    }
    
    if (message.includes('auth') || message.includes('permission') || message.includes('unauthorized')) {
      return 'authentication';
    }
    
    if (stack.includes('supabase') || stack.includes('auth')) {
      return 'authentication';
    }
    
    return 'javascript';
  }

  private getEnvironmentInfo() {
    return {
      browser: this.getBrowserInfo(),
      os: this.getOSInfo(),
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      connection: (navigator as any).connection?.effectiveType,
      memory: (performance as any).memory ? {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
        jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
      } : undefined,
    };
  }

  private getBrowserInfo(): string {
    const userAgent = navigator.userAgent;
    
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    
    return 'Unknown';
  }

  private getOSInfo(): string {
    const userAgent = navigator.userAgent;
    
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    
    return 'Unknown';
  }

  private generateFingerprint(error: Error): string {
    // Create a unique fingerprint for grouping similar errors
    const key = `${error.name}:${error.message}:${this.getStackTrace(error)}`;
    return btoa(key).replace(/[^a-zA-Z0-9]/g, '').substr(0, 32);
  }

  private getStackTrace(error: Error): string {
    if (!error.stack) return '';
    
    // Extract the first few lines of the stack trace for fingerprinting
    return error.stack
      .split('\n')
      .slice(0, 3)
      .map(line => line.trim())
      .join('|');
  }

  private queueError(errorReport: ErrorReport) {
    this.errorQueue.push(errorReport);
    
    // Keep queue size manageable
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue = this.errorQueue.slice(-this.maxQueueSize);
    }
    
    // Send immediately for critical errors
    if (errorReport.severity === 'critical') {
      this.flushErrors();
    }
  }

  private async flushErrors() {
    if (this.errorQueue.length === 0) return;
    
    const errors = [...this.errorQueue];
    this.errorQueue = [];
    
    try {
      await this.sendErrorsToService(errors);
    } catch (error) {
      console.warn('Failed to send error reports:', error);
      // Re-queue errors for retry
      this.errorQueue.unshift(...errors);
    }
  }

  private async sendErrorsToService(errors: ErrorReport[]) {
    // In a real implementation, this would send to your error tracking service
    if (import.meta.env.DEV) {
      console.group('Error Reports');
      errors.forEach(error => {
        console.error(`[${error.severity.toUpperCase()}] ${error.category}:`, error);
      });
      console.groupEnd();
    }
    
    // Example implementation for a real error tracking service:
    /*
    await fetch('/api/errors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ errors }),
    });
    */
  }

  // Get error statistics
  getErrorStats() {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const recentErrors = this.errorQueue.filter(error => now - error.timestamp < oneHour);
    
    const byCategory = recentErrors.reduce((acc, error) => {
      acc[error.category] = (acc[error.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const bySeverity = recentErrors.reduce((acc, error) => {
      acc[error.severity] = (acc[error.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      total: this.errorQueue.length,
      recent: recentErrors.length,
      byCategory,
      bySeverity,
      breadcrumbsCount: this.breadcrumbs.length,
    };
  }

  // Manual error reporting
  reportError(message: string, context?: Record<string, any>) {
    this.captureError(new Error(message), {
      category: 'unknown',
      severity: 'medium',
      context,
    });
  }

  // Cleanup
  destroy() {
    this.flushErrors();
  }
}

// Create singleton instance
export const errorTracking = new ErrorTrackingService();

// React hook for error tracking
export const useErrorTracking = () => {
  return {
    captureError: errorTracking.captureError.bind(errorTracking),
    captureException: errorTracking.captureException.bind(errorTracking),
    captureMessage: errorTracking.captureMessage.bind(errorTracking),
    addBreadcrumb: errorTracking.addBreadcrumb.bind(errorTracking),
    reportError: errorTracking.reportError.bind(errorTracking),
    setUserId: errorTracking.setUserId.bind(errorTracking),
    getErrorStats: errorTracking.getErrorStats.bind(errorTracking),
  };
};