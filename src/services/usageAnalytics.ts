/**
 * Usage analytics for feature adoption and optimization
 */

interface FeatureUsage {
  featureName: string;
  userId?: string;
  sessionId: string;
  timestamp: number;
  duration?: number;
  success: boolean;
  metadata?: Record<string, any>;
}

interface UserSession {
  sessionId: string;
  userId?: string;
  startTime: number;
  endTime?: number;
  pageViews: PageView[];
  interactions: UserInteraction[];
  features: FeatureUsage[];
  errors: number;
  performance: PerformanceData;
}

interface PageView {
  path: string;
  title: string;
  timestamp: number;
  duration?: number;
  referrer?: string;
}

interface UserInteraction {
  type: 'click' | 'scroll' | 'form_submit' | 'search' | 'navigation';
  target: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface PerformanceData {
  pageLoadTime?: number;
  timeToInteractive?: number;
  memoryUsage?: number;
  errorCount: number;
}

interface FeatureAdoptionMetrics {
  featureName: string;
  totalUsers: number;
  activeUsers: number;
  adoptionRate: number;
  averageUsageTime: number;
  successRate: number;
  dropOffPoints: string[];
  trends: {
    daily: number[];
    weekly: number[];
    monthly: number[];
  };
}

class UsageAnalyticsService {
  private currentSession: UserSession;
  private featureTimers: Map<string, number> = new Map();
  private interactionBuffer: UserInteraction[] = [];
  private isEnabled: boolean = true;
  private flushInterval: number = 60000; // 1 minute
  private flushTimer?: NodeJS.Timeout;

  constructor() {
    this.currentSession = this.createNewSession();
    this.setupInteractionTracking();
    this.setupPageTracking();
    this.startPeriodicFlush();
  }

  private createNewSession(): UserSession {
    return {
      sessionId: this.generateSessionId(),
      startTime: Date.now(),
      pageViews: [],
      interactions: [],
      features: [],
      errors: 0,
      performance: {
        errorCount: 0,
      },
    };
  }

  private generateSessionId(): string {
    return `usage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupInteractionTracking() {
    // Track clicks
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      this.trackInteraction('click', this.getElementSelector(target), {
        x: event.clientX,
        y: event.clientY,
        button: event.button,
      });
    });

    // Track form submissions
    document.addEventListener('submit', (event) => {
      const target = event.target as HTMLFormElement;
      this.trackInteraction('form_submit', this.getElementSelector(target), {
        formId: target.id,
        formName: target.name,
      });
    });

    // Track scroll behavior
    let scrollTimeout: NodeJS.Timeout;
    document.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        this.trackInteraction('scroll', 'document', {
          scrollY: window.scrollY,
          scrollX: window.scrollX,
          maxScroll: document.documentElement.scrollHeight - window.innerHeight,
        });
      }, 250);
    });
  }

  private setupPageTracking() {
    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.endCurrentPageView();
      } else {
        this.startPageView(window.location.pathname, document.title);
      }
    });

    // Track page unload
    window.addEventListener('beforeunload', () => {
      this.endSession();
    });
  }

  private startPeriodicFlush() {
    this.flushTimer = setInterval(() => {
      this.flushData();
    }, this.flushInterval);
  }

  private getElementSelector(element: HTMLElement): string {
    // Create a simple selector for the element
    const tag = element.tagName.toLowerCase();
    const id = element.id ? `#${element.id}` : '';
    const classes = element.className ? `.${element.className.split(' ').join('.')}` : '';
    const text = element.textContent?.trim().substring(0, 20) || '';
    
    return `${tag}${id}${classes}${text ? `[${text}]` : ''}`;
  }

  setUserId(userId: string) {
    this.currentSession.userId = userId;
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  // Track page views
  startPageView(path: string, title: string, referrer?: string) {
    if (!this.isEnabled) return;

    this.endCurrentPageView();

    const pageView: PageView = {
      path,
      title,
      timestamp: Date.now(),
      referrer,
    };

    this.currentSession.pageViews.push(pageView);
  }

  private endCurrentPageView() {
    const currentPageView = this.currentSession.pageViews[this.currentSession.pageViews.length - 1];
    if (currentPageView && !currentPageView.duration) {
      currentPageView.duration = Date.now() - currentPageView.timestamp;
    }
  }

  // Track user interactions
  trackInteraction(type: UserInteraction['type'], target: string, metadata?: Record<string, any>) {
    if (!this.isEnabled) return;

    const interaction: UserInteraction = {
      type,
      target,
      timestamp: Date.now(),
      metadata,
    };

    this.interactionBuffer.push(interaction);
    
    // Flush interactions periodically to avoid memory buildup
    if (this.interactionBuffer.length >= 50) {
      this.currentSession.interactions.push(...this.interactionBuffer);
      this.interactionBuffer = [];
    }
  }

  // Track feature usage
  startFeatureUsage(featureName: string, metadata?: Record<string, any>) {
    if (!this.isEnabled) return;

    this.featureTimers.set(featureName, Date.now());
    
    // Track feature start
    this.trackInteraction('navigation', `feature:${featureName}`, {
      action: 'start',
      ...metadata,
    });
  }

  endFeatureUsage(featureName: string, success: boolean = true, metadata?: Record<string, any>) {
    if (!this.isEnabled) return;

    const startTime = this.featureTimers.get(featureName);
    if (!startTime) return;

    const duration = Date.now() - startTime;
    this.featureTimers.delete(featureName);

    const featureUsage: FeatureUsage = {
      featureName,
      userId: this.currentSession.userId,
      sessionId: this.currentSession.sessionId,
      timestamp: startTime,
      duration,
      success,
      metadata,
    };

    this.currentSession.features.push(featureUsage);

    // Track feature end
    this.trackInteraction('navigation', `feature:${featureName}`, {
      action: 'end',
      duration,
      success,
      ...metadata,
    });
  }

  // Track feature adoption funnel
  trackFunnelStep(funnelName: string, step: string, metadata?: Record<string, any>) {
    this.trackInteraction('navigation', `funnel:${funnelName}:${step}`, metadata);
  }

  // Track search behavior
  trackSearch(query: string, results: number, metadata?: Record<string, any>) {
    this.trackInteraction('search', 'search_box', {
      query: query.substring(0, 100), // Limit query length for privacy
      resultsCount: results,
      ...metadata,
    });
  }

  // Track performance metrics
  trackPerformanceMetric(name: string, value: number, metadata?: Record<string, any>) {
    if (!this.isEnabled) return;

    this.currentSession.performance = {
      ...this.currentSession.performance,
      [name]: value,
    };
  }

  // Track errors in the session
  trackError() {
    this.currentSession.errors++;
    this.currentSession.performance.errorCount++;
  }

  // Get feature adoption metrics
  async getFeatureAdoptionMetrics(featureName: string, timeRange: 'day' | 'week' | 'month' = 'week'): Promise<FeatureAdoptionMetrics> {
    // In a real implementation, this would query your analytics database
    // For now, we'll return mock data
    
    const mockMetrics: FeatureAdoptionMetrics = {
      featureName,
      totalUsers: 150,
      activeUsers: 89,
      adoptionRate: 0.593, // 59.3%
      averageUsageTime: 45000, // 45 seconds
      successRate: 0.87, // 87%
      dropOffPoints: ['step_2', 'step_4'],
      trends: {
        daily: [12, 15, 18, 22, 19, 25, 28],
        weekly: [89, 95, 102, 87],
        monthly: [340, 380, 420],
      },
    };

    return mockMetrics;
  }

  // Get user behavior insights
  getUserBehaviorInsights() {
    const session = this.currentSession;
    const sessionDuration = Date.now() - session.startTime;
    
    // Calculate engagement metrics
    const pageViewsPerSession = session.pageViews.length;
    const interactionsPerMinute = (session.interactions.length / sessionDuration) * 60000;
    const averagePageDuration = session.pageViews.reduce((sum, pv) => sum + (pv.duration || 0), 0) / session.pageViews.length;
    
    // Identify most used features
    const featureUsage = session.features.reduce((acc, feature) => {
      acc[feature.featureName] = (acc[feature.featureName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Identify interaction patterns
    const interactionTypes = session.interactions.reduce((acc, interaction) => {
      acc[interaction.type] = (acc[interaction.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      sessionDuration,
      pageViewsPerSession,
      interactionsPerMinute,
      averagePageDuration,
      featureUsage,
      interactionTypes,
      errorRate: session.errors / Math.max(session.interactions.length, 1),
      performance: session.performance,
    };
  }

  // Get feature usage statistics
  getFeatureUsageStats() {
    const features = this.currentSession.features;
    
    const stats = features.reduce((acc, feature) => {
      if (!acc[feature.featureName]) {
        acc[feature.featureName] = {
          usageCount: 0,
          totalDuration: 0,
          successCount: 0,
          averageDuration: 0,
          successRate: 0,
        };
      }
      
      const stat = acc[feature.featureName];
      stat.usageCount++;
      stat.totalDuration += feature.duration || 0;
      if (feature.success) stat.successCount++;
      
      return acc;
    }, {} as Record<string, any>);
    
    // Calculate averages and rates
    Object.values(stats).forEach((stat: any) => {
      stat.averageDuration = stat.totalDuration / stat.usageCount;
      stat.successRate = stat.successCount / stat.usageCount;
    });
    
    return stats;
  }

  // End the current session
  private endSession() {
    this.endCurrentPageView();
    this.currentSession.endTime = Date.now();
    
    // Add remaining interactions
    this.currentSession.interactions.push(...this.interactionBuffer);
    this.interactionBuffer = [];
    
    this.flushData();
  }

  // Flush data to analytics service
  private async flushData() {
    if (!this.isEnabled) return;

    const sessionData = {
      ...this.currentSession,
      interactions: [...this.currentSession.interactions, ...this.interactionBuffer],
    };

    try {
      await this.sendToAnalyticsService(sessionData);
      
      // Clear sent interactions but keep the session active
      this.currentSession.interactions = [];
      this.interactionBuffer = [];
    } catch (error) {
      console.warn('Failed to send usage analytics:', error);
    }
  }

  private async sendToAnalyticsService(sessionData: UserSession) {
    // In a real implementation, this would send to your analytics service
    if (import.meta.env.DEV) {
      console.log('Usage Analytics:', {
        sessionId: sessionData.sessionId,
        duration: Date.now() - sessionData.startTime,
        pageViews: sessionData.pageViews.length,
        interactions: sessionData.interactions.length,
        features: sessionData.features.length,
        insights: this.getUserBehaviorInsights(),
      });
    }

    // Example implementation:
    /*
    await fetch('/api/usage-analytics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sessionData),
    });
    */
  }

  // Cleanup
  destroy() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.endSession();
  }
}

// Create singleton instance
export const usageAnalytics = new UsageAnalyticsService();

// React hook for usage analytics
export const useUsageAnalytics = () => {
  return {
    startPageView: usageAnalytics.startPageView.bind(usageAnalytics),
    trackInteraction: usageAnalytics.trackInteraction.bind(usageAnalytics),
    startFeatureUsage: usageAnalytics.startFeatureUsage.bind(usageAnalytics),
    endFeatureUsage: usageAnalytics.endFeatureUsage.bind(usageAnalytics),
    trackFunnelStep: usageAnalytics.trackFunnelStep.bind(usageAnalytics),
    trackSearch: usageAnalytics.trackSearch.bind(usageAnalytics),
    trackPerformanceMetric: usageAnalytics.trackPerformanceMetric.bind(usageAnalytics),
    trackError: usageAnalytics.trackError.bind(usageAnalytics),
    getFeatureAdoptionMetrics: usageAnalytics.getFeatureAdoptionMetrics.bind(usageAnalytics),
    getUserBehaviorInsights: usageAnalytics.getUserBehaviorInsights.bind(usageAnalytics),
    getFeatureUsageStats: usageAnalytics.getFeatureUsageStats.bind(usageAnalytics),
    setUserId: usageAnalytics.setUserId.bind(usageAnalytics),
  };
};