'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  RefreshCw, 
  Activity,
  Shield,
  Database,
  Zap,
  Wifi,
  BarChart3,
  Clock,
  Server
} from 'lucide-react';

interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  lastChecked: string;
  details?: string;
  metadata?: Record<string, any>;
}

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: HealthCheckResult[];
  summary: {
    totalServices: number;
    healthyServices: number;
    degradedServices: number;
    unhealthyServices: number;
  };
  uptime: number;
  version: string;
}

const serviceIcons: Record<string, any> = {
  'chatwoot_api': Zap,
  'chatwoot_websocket': Wifi,
  'circuit_breaker': Shield,
  'analytics': BarChart3,
  'security': Shield,
  'database': Database
};

const statusColors = {
  healthy: 'text-green-600 bg-green-50',
  degraded: 'text-yellow-600 bg-yellow-50',
  unhealthy: 'text-red-600 bg-red-50'
};

const statusIcons = {
  healthy: CheckCircle,
  degraded: AlertCircle,
  unhealthy: XCircle
};

export default function SystemStatusDashboard() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds

  useEffect(() => {
    fetchHealth();
    
    if (autoRefresh) {
      const interval = setInterval(fetchHealth, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  const fetchHealth = async () => {
    try {
      const response = await fetch('/api/health/chat-integration');
      const data = await response.json();
      setHealth(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch system health');
      console.error('Health check error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const formatResponseTime = (ms: number): string => {
    if (ms < 1000) {
      return `${ms}ms`;
    }
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getHealthPercentage = (): number => {
    if (!health) return 0;
    return Math.round((health.summary.healthyServices / health.summary.totalServices) * 100);
  };

  if (loading && !health) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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

  if (error && !health) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-red-600">
                  <AlertCircle className="h-5 w-5" />
                  <span>{error}</span>
                </div>
                <Button onClick={fetchHealth} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!health) return null;

  const StatusIcon = statusIcons[health.status];
  const healthPercentage = getHealthPercentage();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">System Status</h1>
            <p className="text-gray-600 mt-1">Real-time health monitoring for all services</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600">Auto-refresh</label>
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
            </div>
            <Button onClick={fetchHealth} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Overall Status */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-full ${statusColors[health.status]}`}>
                  <StatusIcon className="h-8 w-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold capitalize">{health.status}</h2>
                  <p className="text-gray-600">System Health: {healthPercentage}%</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Uptime</p>
                <p className="text-2xl font-bold">{formatUptime(health.uptime)}</p>
                <p className="text-xs text-gray-500">Version {health.version}</p>
              </div>
            </div>
            <Progress value={healthPercentage} className="mt-4" />
          </CardContent>
        </Card>

        {/* Service Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Services</p>
                  <p className="text-2xl font-bold">{health.summary.totalServices}</p>
                </div>
                <Server className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Healthy</p>
                  <p className="text-2xl font-bold text-green-600">{health.summary.healthyServices}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Degraded</p>
                  <p className="text-2xl font-bold text-yellow-600">{health.summary.degradedServices}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Unhealthy</p>
                  <p className="text-2xl font-bold text-red-600">{health.summary.unhealthyServices}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Service Details */}
        <Card>
          <CardHeader>
            <CardTitle>Service Health Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {health.checks.map((check) => {
                const Icon = serviceIcons[check.service] || Activity;
                const StatusBadgeIcon = statusIcons[check.status];
                
                return (
                  <div key={check.service} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Icon className="h-6 w-6 text-gray-600" />
                        <div>
                          <h3 className="font-semibold capitalize">
                            {check.service.replace(/_/g, ' ')}
                          </h3>
                          {check.details && (
                            <p className="text-sm text-gray-600">{check.details}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Response Time</p>
                          <p className="font-semibold">{formatResponseTime(check.responseTime)}</p>
                        </div>
                        <Badge 
                          variant="outline"
                          className={`${statusColors[check.status]} border-current`}
                        >
                          <StatusBadgeIcon className="h-3 w-3 mr-1" />
                          {check.status}
                        </Badge>
                      </div>
                    </div>
                    
                    {check.metadata && Object.keys(check.metadata).length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {Object.entries(check.metadata).map(([key, value]) => (
                            <div key={key}>
                              <p className="text-xs text-gray-600 capitalize">
                                {key.replace(/_/g, ' ')}
                              </p>
                              <p className="text-sm font-medium">
                                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-2">
                      <p className="text-xs text-gray-500">
                        Last checked: {new Date(check.lastChecked).toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Last Update */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <Clock className="h-4 w-4 inline-block mr-1" />
          Last updated: {new Date(health.timestamp).toLocaleString()}
        </div>
      </div>
    </div>
  );
}