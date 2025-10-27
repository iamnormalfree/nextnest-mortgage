/**
 * Performance Dashboard Component
 *
 * Displays real-time SLA performance metrics and latency distribution
 * for production monitoring of the AI broker chat system.
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, Clock, TrendingUp, Activity, RefreshCw } from 'lucide-react';

interface PerformanceMetrics {
  totalMessages: number;
  completeMessages: number;
  partialMessages: number;
  distribution: {
    under1s: number;
    under2s: number;
    under5s: number;
    over5s: number;
    over10s: number;
    over30s: number;
  };
  stats: {
    meanLatency: number;
    medianLatency: number;
    p95Latency: number;
    p99Latency: number;
    minLatency: number;
    maxLatency: number;
  };
  phaseBreakdown: {
    queueToWorker: number;
    workerProcessing: number;
    workerToChatwoot: number;
  };
  systemInfo: {
    enabled: boolean;
    lastUpdated: string;
    sampleWindow: string;
  };
}

interface PerformanceResponse {
  success: boolean;
  data?: PerformanceMetrics;
  error?: string;
}

export default function PerformanceDashboard() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/performance-analysis');
      const result: PerformanceResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch performance metrics');
      }

      setMetrics(result.data || null);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  const getSlaComplianceRate = () => {
    if (!metrics || metrics.completeMessages + metrics.partialMessages === 0) return 0;
    const total = metrics.completeMessages + metrics.partialMessages;
    return (metrics.distribution.under5s / total) * 100;
  };

  const getLatencyColor = (latency: number) => {
    if (latency < 1000) return 'text-green-600';
    if (latency < 2000) return 'text-yellow-600';
    if (latency < 5000) return 'text-orange-600';
    return 'text-red-600';
  };

  const getSeverityIcon = (count: number, threshold: number) => {
    if (count === 0) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (count <= threshold) return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    return <AlertTriangle className="h-4 w-4 text-red-500" />;
  };

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading performance metrics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center text-red-600">
            <AlertTriangle className="h-5 w-5 mr-2" />
            <span>Error: {error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p>No performance data available</p>
        </CardContent>
      </Card>
    );
  }

  const slaComplianceRate = getSlaComplianceRate();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center">
            <Activity className="h-6 w-6 mr-2" />
            Performance Dashboard
          </h2>
          <p className="text-gray-600">
            Real-time SLA monitoring and latency analysis
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={metrics.systemInfo.enabled ? "default" : "secondary"}>
            {metrics.systemInfo.enabled ? "SLA Enabled" : "SLA Disabled"}
          </Badge>
          <Button onClick={fetchMetrics} variant="outline" size="sm">
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">SLA Compliance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {slaComplianceRate.toFixed(1)}%
            </div>
            <p className="text-xs text-gray-600">
              {metrics.distribution.under5s} / {metrics.completeMessages + metrics.partialMessages} messages {'<'} 5s
            </p>
            <Progress value={slaComplianceRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Mean Latency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getLatencyColor(metrics.stats.meanLatency)}`}>
              {Math.round(metrics.stats.meanLatency)}ms
            </div>
            <p className="text-xs text-gray-600">
              P95: {Math.round(metrics.stats.p95Latency)}ms
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.totalMessages}
            </div>
            <p className="text-xs text-gray-600">
              {metrics.completeMessages} complete, {metrics.partialMessages} partial
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {lastRefresh.toLocaleTimeString()}
            </div>
            <p className="text-xs text-gray-600">
              {metrics.systemInfo.sampleWindow}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Latency Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Latency Distribution
            </CardTitle>
            <CardDescription>
              Message latency distribution across SLA thresholds
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm flex items-center">
                  {getSeverityIcon(metrics.distribution.over30s, 0)}
                  <span className="ml-2">&gt; 30s (Critical)</span>
                </span>
                <span className="font-medium text-red-600">{metrics.distribution.over30s}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm flex items-center">
                  {getSeverityIcon(metrics.distribution.over10s, 2)}
                  <span className="ml-2">10-30s (Severe)</span>
                </span>
                <span className="font-medium text-orange-600">{metrics.distribution.over10s}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm flex items-center">
                  {getSeverityIcon(metrics.distribution.over5s, 5)}
                  <span className="ml-2">5-10s (SLA Breach)</span>
                </span>
                <span className="font-medium text-orange-600">{metrics.distribution.over5s}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  &lt; 5s (SLA Compliant)
                </span>
                <span className="font-medium text-green-600">{metrics.distribution.under5s}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  &lt; 2s (Good)
                </span>
                <span className="font-medium text-green-600">{metrics.distribution.under2s}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  &lt; 1s (Excellent)
                </span>
                <span className="font-medium text-green-600">{metrics.distribution.under1s}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Phase Breakdown
            </CardTitle>
            <CardDescription>
              Average time spent in each processing phase
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium">Queue → Worker</span>
                  <span className={`text-sm font-medium ${getLatencyColor(metrics.phaseBreakdown.queueToWorker)}`}>
                    {metrics.phaseBreakdown.queueToWorker}ms
                  </span>
                </div>
                <Progress
                  value={Math.min((metrics.phaseBreakdown.queueToWorker / 5000) * 100, 100)}
                  className="h-2"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium">Worker Processing</span>
                  <span className={`text-sm font-medium ${getLatencyColor(metrics.phaseBreakdown.workerProcessing)}`}>
                    {metrics.phaseBreakdown.workerProcessing}ms
                  </span>
                </div>
                <Progress
                  value={Math.min((metrics.phaseBreakdown.workerProcessing / 3000) * 100, 100)}
                  className="h-2"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium">Worker → Chatwoot</span>
                  <span className={`text-sm font-medium ${getLatencyColor(metrics.phaseBreakdown.workerToChatwoot)}`}>
                    {metrics.phaseBreakdown.workerToChatwoot}ms
                  </span>
                </div>
                <Progress
                  value={Math.min((metrics.phaseBreakdown.workerToChatwoot / 2000) * 100, 100)}
                  className="h-2"
                />
              </div>
            </div>

            {/* Warnings */}
            {metrics.phaseBreakdown.workerToChatwoot > 2000 && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="flex items-center text-yellow-800">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  <span className="text-sm">
                    High Chatwoot API latency detected
                  </span>
                </div>
              </div>
            )}

            {metrics.distribution.over30s > 0 && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-center text-red-800">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  <span className="text-sm">
                    {metrics.distribution.over30s} critical latency messages
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Statistics */}
      {metrics.completeMessages > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Detailed Statistics</CardTitle>
            <CardDescription>
              Statistical analysis of {metrics.completeMessages} complete end-to-end messages
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="text-center">
                <div className="text-lg font-semibold">{Math.round(metrics.stats.minLatency)}ms</div>
                <div className="text-xs text-gray-600">Min</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-blue-600">{Math.round(metrics.stats.medianLatency)}ms</div>
                <div className="text-xs text-gray-600">Median</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-green-600">{Math.round(metrics.stats.meanLatency)}ms</div>
                <div className="text-xs text-gray-600">Mean</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-orange-600">{Math.round(metrics.stats.p95Latency)}ms</div>
                <div className="text-xs text-gray-600">P95</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-red-600">{Math.round(metrics.stats.p99Latency)}ms</div>
                <div className="text-xs text-gray-600">P99</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold">{Math.round(metrics.stats.maxLatency)}ms</div>
                <div className="text-xs text-gray-600">Max</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}