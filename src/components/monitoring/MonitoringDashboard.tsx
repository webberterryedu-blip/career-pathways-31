/**
 * Monitoring dashboard for performance and analytics overview
 */
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { usePerformanceMetrics } from '@/hooks/usePerformanceMonitoring';
import { useAnalytics } from '@/services/analytics';
import { useErrorTracking } from '@/services/errorTracking';
import { useUsageAnalytics } from '@/services/usageAnalytics';
import {
  TrendingUp,
  AlertTriangle,
  BarChart3,
  Clock,
  Users,
  Zap,
  TrendingDown,
  Eye,
  MousePointer,
  Smartphone,
  Monitor
} from 'lucide-react';

interface MonitoringDashboardProps {
  className?: string;
}

export const MonitoringDashboard: React.FC<MonitoringDashboardProps> = ({ className }) => {
  const { getMetrics } = usePerformanceMetrics();
  const { getSessionAnalytics } = useAnalytics();
  const { getErrorStats } = useErrorTracking();
  const { getUserBehaviorInsights, getFeatureUsageStats } = useUsageAnalytics();

  const [performanceData, setPerformanceData] = useState<any>(null);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [errorData, setErrorData] = useState<any>(null);
  const [usageData, setUsageData] = useState<any>(null);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchData = () => {
      setPerformanceData(getMetrics());
      setAnalyticsData(getSessionAnalytics());
      setErrorData(getErrorStats());
      setUsageData(getUserBehaviorInsights());
    };

    fetchData();

    // Set up auto-refresh
    const interval = setInterval(fetchData, 5000); // Refresh every 5 seconds
    setRefreshInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  const getPerformanceStatus = (value: number, threshold: number) => {
    if (value <= threshold) return { status: 'good', color: 'bg-green-500' };
    if (value <= threshold * 1.5) return { status: 'warning', color: 'bg-yellow-500' };
    return { status: 'critical', color: 'bg-red-500' };
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">System Monitoring</h2>
          <p className="text-muted-foreground">Real-time performance and usage analytics</p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            setPerformanceData(getMetrics());
            setAnalyticsData(getSessionAnalytics());
            setErrorData(getErrorStats());
            setUsageData(getUserBehaviorInsights());
          }}
        >
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Page Load Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {performanceData?.webVitals?.FCP ? formatDuration(performanceData.webVitals.FCP) : 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">First Contentful Paint</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {performanceData?.memory ? formatBytes(performanceData.memory.usedJSHeapSize) : 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {performanceData?.memory && `of ${formatBytes(performanceData.memory.jsHeapSizeLimit)}`}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Components</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {performanceData?.components?.length || 0}
                </div>
                <p className="text-xs text-muted-foreground">Active components</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Web Vitals</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs">LCP</span>
                    <Badge variant={performanceData?.webVitals?.LCP > 2500 ? 'destructive' : 'default'}>
                      {performanceData?.webVitals?.LCP ? formatDuration(performanceData.webVitals.LCP) : 'N/A'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs">FID</span>
                    <Badge variant={performanceData?.webVitals?.FID > 100 ? 'destructive' : 'default'}>
                      {performanceData?.webVitals?.FID ? formatDuration(performanceData.webVitals.FID) : 'N/A'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs">CLS</span>
                    <Badge variant={performanceData?.webVitals?.CLS > 0.1 ? 'destructive' : 'default'}>
                      {performanceData?.webVitals?.CLS?.toFixed(3) || 'N/A'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {performanceData?.components && (
            <Card>
              <CardHeader>
                <CardTitle>Component Performance</CardTitle>
                <CardDescription>Render times for active components</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {performanceData.components.slice(0, 10).map((component: any, index: number) => {
                    const status = getPerformanceStatus(component.renderTime, 16);
                    return (
                      <div key={index} className="flex items-center space-x-4">
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{component.componentName}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatDuration(component.renderTime)}
                            </span>
                          </div>
                          <Progress
                            value={Math.min((component.renderTime / 50) * 100, 100)}
                            className="h-2 mt-1"
                          />
                        </div>
                        <div className={`w-2 h-2 rounded-full ${status.color}`} />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Session Duration</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analyticsData ? formatDuration(analyticsData.sessionDuration || 0) : 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">Current session</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Events</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analyticsData?.eventsCount || 0}
                </div>
                <p className="text-xs text-muted-foreground">Tracked events</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Performance Metrics</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analyticsData?.performanceMetricsCount || 0}
                </div>
                <p className="text-xs text-muted-foreground">Metrics collected</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">User ID</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-sm font-mono">
                  {analyticsData?.userId || 'Anonymous'}
                </div>
                <p className="text-xs text-muted-foreground">Current user</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Errors</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {errorData?.total || 0}
                </div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recent Errors</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {errorData?.recent || 0}
                </div>
                <p className="text-xs text-muted-foreground">Last hour</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {usageData ? (usageData.errorRate * 100).toFixed(1) : 0}%
                </div>
                <p className="text-xs text-muted-foreground">Of interactions</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Breadcrumbs</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {errorData?.breadcrumbsCount || 0}
                </div>
                <p className="text-xs text-muted-foreground">Debug traces</p>
              </CardContent>
            </Card>
          </div>

          {errorData?.byCategory && (
            <Card>
              <CardHeader>
                <CardTitle>Error Categories</CardTitle>
                <CardDescription>Distribution of errors by category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(errorData.byCategory).map(([category, count]) => {
                    const countNum = Number(count);
                    return (
                      <div key={category} className="flex items-center space-x-4">
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium capitalize">{category}</span>
                            <span className="text-xs text-muted-foreground">{countNum}</span>
                          </div>
                          <Progress
                            value={(countNum / errorData.total) * 100}
                            className="h-2 mt-1"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="usage" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Page Views</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {usageData?.pageViewsPerSession || 0}
                </div>
                <p className="text-xs text-muted-foreground">This session</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Interactions</CardTitle>
                <MousePointer className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {usageData?.interactionsPerMinute?.toFixed(1) || 0}
                </div>
                <p className="text-xs text-muted-foreground">Per minute</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Page Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {usageData ? formatDuration(usageData.averagePageDuration || 0) : 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">Per page</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Device Type</CardTitle>
                <Monitor className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-sm font-medium">
                  {window.innerWidth < 768 ? 'Mobile' : window.innerWidth < 1024 ? 'Tablet' : 'Desktop'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {window.innerWidth} × {window.innerHeight}
                </p>
              </CardContent>
            </Card>
          </div>

          {usageData?.featureUsage && Object.keys(usageData.featureUsage).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Feature Usage</CardTitle>
                <CardDescription>Most used features in this session</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(usageData.featureUsage)
                    .sort(([, a], [, b]) => (b as number) - (a as number))
                    .slice(0, 10)
                    .map(([feature, count]) => {
                      const countNum = Number(count);
                      const maxCount = Math.max(...Object.values(usageData.featureUsage).map(Number));
                      return (
                        <div key={feature} className="flex items-center space-x-4">
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">{feature}</span>
                              <span className="text-xs text-muted-foreground">{countNum} uses</span>
                            </div>
                            <Progress
                              value={(countNum / maxCount) * 100}
                              className="h-2 mt-1"
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};