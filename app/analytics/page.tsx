'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { ArrowUp, ArrowDown, Users, Target, TrendingUp, Clock, AlertCircle, CheckCircle } from 'lucide-react';

interface AnalyticsData {
  metrics: {
    formStarts: number;
    formCompletions: number;
    formAbandoned: number;
    chatTransitionsAttempted: number;
    chatTransitionsSuccessful: number;
    fallbacksUsed: number;
    firstMessageEngagements: number;
    conversionRates: {
      formToCompletion: string;
      formToTransition: string;
      transitionToChat: string;
      chatToEngagement: string;
      overallFormToEngagement: string;
    };
    averageTransitionTime: string;
    averageCompletionTime: string;
    leadScoreDistribution: {
      high: number;
      medium: number;
      low: number;
    };
    fallbackReasons: Record<string, number>;
    performanceMetrics: {
      avgFormCompletionTime: string;
      avgChatLoadTime: string;
      avgTimeToFirstMessage: string;
    };
  };
  funnelData: Array<{
    stage: string;
    count: number;
    percentage: number;
  }>;
  timeSeriesData: Array<{
    hour: number;
    formStarts: number;
    conversions: number;
  }>;
  summary: {
    totalSessions: number;
    successfulConversions: number;
    overallConversionRate: string;
    avgSessionDuration: string;
    topFallbackReason: string;
  };
}

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [timeRange, setTimeRange] = useState('24h');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/analytics/conversion-dashboard?timeRange=${timeRange}`);
      if (!response.ok) throw new Error('Failed to fetch analytics');
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError('Failed to load analytics data');
      console.error('Analytics error:', err);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [fetchAnalytics]);

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Conversion Analytics</h1>
            <p className="text-gray-600 mt-1">Real-time form-to-chat conversion tracking</p>
          </div>
          <div className="flex items-center space-x-4">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">Last Hour</SelectItem>
                <SelectItem value="24h">Last 24 Hours</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={fetchAnalytics} variant="outline">
              Refresh
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Sessions</p>
                  <p className="text-2xl font-bold">{data.summary.totalSessions}</p>
                  <p className="text-xs text-gray-500 mt-1">Form starts</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Conversions</p>
                  <p className="text-2xl font-bold">{data.summary.successfulConversions}</p>
                  <p className="text-xs text-gray-500 mt-1">Engaged chats</p>
                </div>
                <Target className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Conversion Rate</p>
                  <p className="text-2xl font-bold">{data.summary.overallConversionRate}%</p>
                  <p className="text-xs text-gray-500 mt-1">Form to engagement</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Duration</p>
                  <p className="text-2xl font-bold">{data.summary.avgSessionDuration}m</p>
                  <p className="text-xs text-gray-500 mt-1">Form completion</p>
                </div>
                <Clock className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Conversion Funnel */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Conversion Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.funnelData.map((stage, index) => (
                <div key={stage.stage}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">{stage.stage}</span>
                    <span className="text-sm text-gray-600">
                      {stage.count} ({stage.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <Progress value={stage.percentage} className="h-2" />
                  {index < data.funnelData.length - 1 && (
                    <div className="flex items-center mt-2 text-xs text-gray-500">
                      <ArrowDown className="h-3 w-3 mr-1" />
                      Drop-off: {(stage.percentage - data.funnelData[index + 1].percentage).toFixed(1)}%
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics and Lead Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Form Completion Time</span>
                    <span className="text-sm font-medium">{data.metrics.performanceMetrics.avgFormCompletionTime} min</span>
                  </div>
                  <Progress value={parseFloat(data.metrics.performanceMetrics.avgFormCompletionTime) * 10} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Chat Load Time</span>
                    <span className="text-sm font-medium">{data.metrics.performanceMetrics.avgChatLoadTime} sec</span>
                  </div>
                  <Progress value={parseFloat(data.metrics.performanceMetrics.avgChatLoadTime) * 20} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Time to First Message</span>
                    <span className="text-sm font-medium">{data.metrics.performanceMetrics.avgTimeToFirstMessage} sec</span>
                  </div>
                  <Progress value={parseFloat(data.metrics.performanceMetrics.avgTimeToFirstMessage) * 2} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lead Score Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Lead Score Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">High (75-100)</span>
                    <span className="text-sm font-medium">{data.metrics.leadScoreDistribution.high} leads</span>
                  </div>
                  <Progress 
                    value={(data.metrics.leadScoreDistribution.high / (data.metrics.leadScoreDistribution.high + data.metrics.leadScoreDistribution.medium + data.metrics.leadScoreDistribution.low)) * 100} 
                    className="h-2 bg-green-100" 
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Medium (45-74)</span>
                    <span className="text-sm font-medium">{data.metrics.leadScoreDistribution.medium} leads</span>
                  </div>
                  <Progress 
                    value={(data.metrics.leadScoreDistribution.medium / (data.metrics.leadScoreDistribution.high + data.metrics.leadScoreDistribution.medium + data.metrics.leadScoreDistribution.low)) * 100} 
                    className="h-2 bg-yellow-100" 
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Low (0-44)</span>
                    <span className="text-sm font-medium">{data.metrics.leadScoreDistribution.low} leads</span>
                  </div>
                  <Progress 
                    value={(data.metrics.leadScoreDistribution.low / (data.metrics.leadScoreDistribution.high + data.metrics.leadScoreDistribution.medium + data.metrics.leadScoreDistribution.low)) * 100} 
                    className="h-2 bg-red-100" 
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Conversion Rates Grid */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Detailed Conversion Rates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{data.metrics.conversionRates.formToCompletion}%</p>
                <p className="text-xs text-gray-600 mt-1">Form → Complete</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{data.metrics.conversionRates.formToTransition}%</p>
                <p className="text-xs text-gray-600 mt-1">Complete → Transition</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{data.metrics.conversionRates.transitionToChat}%</p>
                <p className="text-xs text-gray-600 mt-1">Transition → Chat</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{data.metrics.conversionRates.chatToEngagement}%</p>
                <p className="text-xs text-gray-600 mt-1">Chat → Engaged</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{data.metrics.conversionRates.overallFormToEngagement}%</p>
                <p className="text-xs text-gray-600 mt-1">Overall</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fallback Analysis */}
        {data.metrics.fallbacksUsed > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Fallback Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-600">Total Fallbacks Used</span>
                <span className="text-xl font-bold">{data.metrics.fallbacksUsed}</span>
              </div>
              <div className="space-y-2">
                {Object.entries(data.metrics.fallbackReasons).map(([reason, count]) => (
                  <div key={reason} className="flex justify-between">
                    <span className="text-sm capitalize">{reason.replace('_', ' ')}</span>
                    <span className="text-sm font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}