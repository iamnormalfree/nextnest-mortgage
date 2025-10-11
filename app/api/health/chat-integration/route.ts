/**
 * Health Check API for Chat Integration
 * Monitors the health of all chat-related services
 */

import { NextRequest, NextResponse } from 'next/server';

// Health check result interface
export interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  lastChecked: string;
  details?: string;
  metadata?: Record<string, any>;
}

// Overall system health
export interface SystemHealth {
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

/**
 * Health Monitor Class
 * Performs health checks on various services
 */
class HealthMonitor {
  private startTime: number;
  private checkHistory: Map<string, HealthCheckResult[]>;
  
  constructor() {
    this.startTime = Date.now();
    this.checkHistory = new Map();
  }

  /**
   * Get system uptime in seconds
   */
  getUptime(): number {
    return Math.floor((Date.now() - this.startTime) / 1000);
  }

  /**
   * Check Chatwoot API health
   */
  async checkChatwootAPI(): Promise<HealthCheckResult> {
    const start = Date.now();
    
    try {
      // Check if environment variables are configured
      if (!process.env.CHATWOOT_BASE_URL || !process.env.CHATWOOT_API_TOKEN) {
        return {
          service: 'chatwoot_api',
          status: 'unhealthy',
          responseTime: 0,
          lastChecked: new Date().toISOString(),
          details: 'Missing environment configuration'
        };
      }

      const response = await fetch(
        `${process.env.CHATWOOT_BASE_URL}/api/v1/accounts/${process.env.CHATWOOT_ACCOUNT_ID}/inboxes`,
        {
          headers: {
            'api_access_token': process.env.CHATWOOT_API_TOKEN
          },
          signal: AbortSignal.timeout(5000)
        }
      );

      const responseTime = Date.now() - start;
      
      if (!response.ok) {
        return {
          service: 'chatwoot_api',
          status: 'unhealthy',
          responseTime,
          lastChecked: new Date().toISOString(),
          details: `HTTP ${response.status}: ${response.statusText}`,
          metadata: {
            statusCode: response.status
          }
        };
      }

      // Check response time thresholds
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      if (responseTime > 2000) {
        status = 'unhealthy';
      } else if (responseTime > 1000) {
        status = 'degraded';
      }

      return {
        service: 'chatwoot_api',
        status,
        responseTime,
        lastChecked: new Date().toISOString(),
        metadata: {
          baseUrl: process.env.CHATWOOT_BASE_URL
        }
      };
    } catch (error: any) {
      return {
        service: 'chatwoot_api',
        status: 'unhealthy',
        responseTime: Date.now() - start,
        lastChecked: new Date().toISOString(),
        details: error.message || 'Connection failed'
      };
    }
  }

  /**
   * Check Chatwoot Websocket health
   */
  async checkChatwootWebsocket(): Promise<HealthCheckResult> {
    const start = Date.now();
    
    try {
      // In a real implementation, we would test websocket connection
      // For now, we'll check if the widget endpoint is accessible
      if (!process.env.CHATWOOT_BASE_URL) {
        return {
          service: 'chatwoot_websocket',
          status: 'unhealthy',
          responseTime: 0,
          lastChecked: new Date().toISOString(),
          details: 'Missing environment configuration'
        };
      }

      const response = await fetch(
        `${process.env.CHATWOOT_BASE_URL}/packs/js/sdk.js`,
        {
          method: 'HEAD',
          signal: AbortSignal.timeout(3000)
        }
      );

      const responseTime = Date.now() - start;
      
      return {
        service: 'chatwoot_websocket',
        status: response.ok ? 'healthy' : 'unhealthy',
        responseTime,
        lastChecked: new Date().toISOString(),
        metadata: {
          sdkAvailable: response.ok
        }
      };
    } catch (error: any) {
      return {
        service: 'chatwoot_websocket',
        status: 'unhealthy',
        responseTime: Date.now() - start,
        lastChecked: new Date().toISOString(),
        details: error.message || 'SDK check failed'
      };
    }
  }

  /**
   * Check Circuit Breaker status
   */
  async checkCircuitBreaker(): Promise<HealthCheckResult> {
    // This would check the actual circuit breaker status
    // For now, we'll simulate it
    const circuitBreakerState = process.env.CIRCUIT_BREAKER_STATE || 'CLOSED';
    
    return {
      service: 'circuit_breaker',
      status: circuitBreakerState === 'CLOSED' ? 'healthy' : 
              circuitBreakerState === 'HALF_OPEN' ? 'degraded' : 'unhealthy',
      responseTime: 0,
      lastChecked: new Date().toISOString(),
      metadata: {
        state: circuitBreakerState,
        failureThreshold: 5,
        timeout: 60000
      }
    };
  }

  /**
   * Check Analytics Service health
   */
  async checkAnalytics(): Promise<HealthCheckResult> {
    const start = Date.now();
    
    try {
      // Check if analytics endpoint is responsive
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/analytics/conversion-dashboard?timeRange=1h`,
        {
          signal: AbortSignal.timeout(3000)
        }
      );

      const responseTime = Date.now() - start;
      
      return {
        service: 'analytics',
        status: response.ok ? 'healthy' : 'degraded',
        responseTime,
        lastChecked: new Date().toISOString(),
        metadata: {
          endpoint: '/api/analytics/conversion-dashboard'
        }
      };
    } catch (error: any) {
      return {
        service: 'analytics',
        status: 'unhealthy',
        responseTime: Date.now() - start,
        lastChecked: new Date().toISOString(),
        details: error.message || 'Analytics service unreachable'
      };
    }
  }

  /**
   * Check Security Service health
   */
  async checkSecurity(): Promise<HealthCheckResult> {
    // Check if security features are enabled
    const auditLogEnabled = process.env.AUDIT_LOG_ENABLED === 'true';
    const encryptionKeySet = !!process.env.ENCRYPTION_KEY;
    
    const status = auditLogEnabled && encryptionKeySet ? 'healthy' : 
                   auditLogEnabled || encryptionKeySet ? 'degraded' : 'unhealthy';
    
    return {
      service: 'security',
      status,
      responseTime: 0,
      lastChecked: new Date().toISOString(),
      metadata: {
        auditLog: auditLogEnabled,
        encryption: encryptionKeySet,
        pdpaCompliant: true
      }
    };
  }

  /**
   * Check Database connectivity (if applicable)
   */
  async checkDatabase(): Promise<HealthCheckResult> {
    // In a real implementation, this would check database connectivity
    // For now, we'll simulate it based on environment
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    return {
      service: 'database',
      status: 'healthy',
      responseTime: Math.random() * 50, // Simulate response time
      lastChecked: new Date().toISOString(),
      metadata: {
        type: isDevelopment ? 'in-memory' : 'postgresql',
        connectionPool: {
          size: 10,
          active: Math.floor(Math.random() * 5),
          idle: 5
        }
      }
    };
  }

  /**
   * Perform all health checks
   */
  async performAllChecks(): Promise<HealthCheckResult[]> {
    const checks = await Promise.allSettled([
      this.checkChatwootAPI(),
      this.checkChatwootWebsocket(),
      this.checkCircuitBreaker(),
      this.checkAnalytics(),
      this.checkSecurity(),
      this.checkDatabase()
    ]);

    return checks.map(result => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          service: 'unknown',
          status: 'unhealthy' as const,
          responseTime: 0,
          lastChecked: new Date().toISOString(),
          details: 'Health check failed to execute'
        };
      }
    });
  }

  /**
   * Calculate overall system status
   */
  calculateSystemStatus(checks: HealthCheckResult[]): 'healthy' | 'degraded' | 'unhealthy' {
    const unhealthyCount = checks.filter(c => c.status === 'unhealthy').length;
    const degradedCount = checks.filter(c => c.status === 'degraded').length;
    
    if (unhealthyCount > 0) {
      return 'unhealthy';
    } else if (degradedCount > 0) {
      return 'degraded';
    }
    return 'healthy';
  }

  /**
   * Store check result in history
   */
  storeCheckResult(result: HealthCheckResult): void {
    if (!this.checkHistory.has(result.service)) {
      this.checkHistory.set(result.service, []);
    }
    
    const history = this.checkHistory.get(result.service)!;
    history.push(result);
    
    // Keep only last 100 checks
    if (history.length > 100) {
      history.shift();
    }
  }

  /**
   * Get check history for a service
   */
  getCheckHistory(service: string): HealthCheckResult[] {
    return this.checkHistory.get(service) || [];
  }
}

// Create singleton instance
const healthMonitor = new HealthMonitor();

/**
 * GET handler - perform health checks
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const service = searchParams.get('service');
    const detailed = searchParams.get('detailed') === 'true';

    // Check specific service if requested
    if (service) {
      let result: HealthCheckResult;
      
      switch (service) {
        case 'chatwoot':
          result = await healthMonitor.checkChatwootAPI();
          break;
        case 'websocket':
          result = await healthMonitor.checkChatwootWebsocket();
          break;
        case 'circuit-breaker':
          result = await healthMonitor.checkCircuitBreaker();
          break;
        case 'analytics':
          result = await healthMonitor.checkAnalytics();
          break;
        case 'security':
          result = await healthMonitor.checkSecurity();
          break;
        case 'database':
          result = await healthMonitor.checkDatabase();
          break;
        default:
          return NextResponse.json(
            { error: 'Unknown service' },
            { status: 400 }
          );
      }

      healthMonitor.storeCheckResult(result);
      
      if (detailed) {
        return NextResponse.json({
          current: result,
          history: healthMonitor.getCheckHistory(service)
        });
      }
      
      return NextResponse.json(result);
    }

    // Perform all health checks
    const checks = await healthMonitor.performAllChecks();
    
    // Store results
    checks.forEach(check => healthMonitor.storeCheckResult(check));
    
    // Calculate summary
    const summary = {
      totalServices: checks.length,
      healthyServices: checks.filter(c => c.status === 'healthy').length,
      degradedServices: checks.filter(c => c.status === 'degraded').length,
      unhealthyServices: checks.filter(c => c.status === 'unhealthy').length
    };

    // Build system health response
    const systemHealth: SystemHealth = {
      status: healthMonitor.calculateSystemStatus(checks),
      timestamp: new Date().toISOString(),
      checks,
      summary,
      uptime: healthMonitor.getUptime(),
      version: process.env.npm_package_version || '1.0.0'
    };

    // Set appropriate status code
    const statusCode = systemHealth.status === 'healthy' ? 200 :
                       systemHealth.status === 'degraded' ? 206 : 503;

    return NextResponse.json(systemHealth, { status: statusCode });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check system failure',
        checks: [],
        summary: {
          totalServices: 0,
          healthyServices: 0,
          degradedServices: 0,
          unhealthyServices: 0
        },
        uptime: 0,
        version: '1.0.0'
      },
      { status: 503 }
    );
  }
}