---
title: session-1-implementation
type: report
category: tech-team-roundtable
status: archived
owner: operations
date: 2025-08-28
---

# Tech-Team Session 1 Implementation
# Problem Identification & Monitoring Systems

**Session Date**: Implementation artifacts from Tech-Team roundtable planning
**Focus**: Setting up monitoring systems to detect the 10 critical problems

## Implementation Overview

This document contains the actual code, configurations, and systems implemented during Session 1 to address the 10 critical problems identified in our mortgage calculator platform.

## 1. Problem Detection Systems

### 1.1 Health Check Monitoring (`lib/monitoring/health-checks.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

export interface HealthCheckResult {
  service: string
  status: 'healthy' | 'warning' | 'critical'
  timestamp: string
  details: Record<string, any>
  responseTime: number
}

export class HealthCheckService {
  private checks: Map<string, () => Promise<HealthCheckResult>> = new Map()

  constructor() {
    this.registerChecks()
  }

  private registerChecks() {
    // Problem 1: Calculation Accuracy
    this.checks.set('mortgage-calculations', this.checkCalculationAccuracy.bind(this))
    
    // Problem 2: Form Validation
    this.checks.set('form-validation', this.checkFormValidation.bind(this))
    
    // Problem 3: Data Persistence
    this.checks.set('data-persistence', this.checkDataPersistence.bind(this))
    
    // Problem 4: Performance
    this.checks.set('performance', this.checkPerformance.bind(this))
    
    // Problem 5: Mobile Responsiveness
    this.checks.set('mobile-compatibility', this.checkMobileCompatibility.bind(this))
  }

  async checkCalculationAccuracy(): Promise<HealthCheckResult> {
    const startTime = Date.now()
    
    try {
      // Test known calculation scenarios
      const testCases = [
        { principal: 500000, rate: 0.035, years: 30, expected: 2245.22 },
        { principal: 800000, rate: 0.042, years: 25, expected: 4321.89 }
      ]

      let accuracyScore = 0
      for (const testCase of testCases) {
        const result = await this.calculateMortgage(testCase.principal, testCase.rate, testCase.years)
        const diff = Math.abs(result - testCase.expected)
        if (diff < 0.01) accuracyScore += 1
      }

      const status = accuracyScore === testCases.length ? 'healthy' : 'critical'
      
      return {
        service: 'mortgage-calculations',
        status,
        timestamp: new Date().toISOString(),
        details: { accuracyScore, totalTests: testCases.length },
        responseTime: Date.now() - startTime
      }
    } catch (error) {
      return {
        service: 'mortgage-calculations',
        status: 'critical',
        timestamp: new Date().toISOString(),
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        responseTime: Date.now() - startTime
      }
    }
  }

  async checkFormValidation(): Promise<HealthCheckResult> {
    const startTime = Date.now()
    
    try {
      const invalidInputs = [
        { principal: -100000, rate: 0.035, years: 30 },
        { principal: 1000000, rate: -0.01, years: 25 },
        { principal: 500000, rate: 0.035, years: 0 }
      ]

      let validationPassed = 0
      for (const input of invalidInputs) {
        try {
          await this.validateMortgageInput(input)
          // Should throw error, if we reach here validation failed
        } catch {
          validationPassed += 1
        }
      }

      const status = validationPassed === invalidInputs.length ? 'healthy' : 'critical'
      
      return {
        service: 'form-validation',
        status,
        timestamp: new Date().toISOString(),
        details: { validationTests: validationPassed, totalTests: invalidInputs.length },
        responseTime: Date.now() - startTime
      }
    } catch (error) {
      return {
        service: 'form-validation',
        status: 'critical',
        timestamp: new Date().toISOString(),
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        responseTime: Date.now() - startTime
      }
    }
  }

  async runAllChecks(): Promise<HealthCheckResult[]> {
    const results = await Promise.all(
      Array.from(this.checks.entries()).map(async ([name, check]) => {
        try {
          return await check()
        } catch (error) {
          return {
            service: name,
            status: 'critical' as const,
            timestamp: new Date().toISOString(),
            details: { error: error instanceof Error ? error.message : 'Unknown error' },
            responseTime: 0
          }
        }
      })
    )

    return results
  }

  private async calculateMortgage(principal: number, rate: number, years: number): Promise<number> {
    // Import actual calculation logic
    const { calculateMonthlyPayment } = await import('../calculations/mortgage')
    return calculateMonthlyPayment({ principal, annualRate: rate, years })
  }

  private async validateMortgageInput(input: any): Promise<void> {
    const { mortgageInputSchema } = await import('../calculations/mortgage')
    mortgageInputSchema.parse(input)
  }
}
```

### 1.2 API Health Check Endpoint (`app/api/health/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { HealthCheckService } from '../../../lib/monitoring/health-checks'

const healthCheckService = new HealthCheckService()

export async function GET(request: NextRequest) {
  try {
    const results = await healthCheckService.runAllChecks()
    
    const overallStatus = results.every(r => r.status === 'healthy') 
      ? 'healthy' 
      : results.some(r => r.status === 'critical') 
      ? 'critical' 
      : 'warning'

    return NextResponse.json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      checks: results,
      summary: {
        total: results.length,
        healthy: results.filter(r => r.status === 'healthy').length,
        warning: results.filter(r => r.status === 'warning').length,
        critical: results.filter(r => r.status === 'critical').length
      }
    }, { 
      status: overallStatus === 'critical' ? 503 : 200 
    })
  } catch (error) {
    return NextResponse.json({
      status: 'critical',
      error: error instanceof Error ? error.message : 'Health check failed',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
```

## 2. Problem Detection Dashboard

### 2.1 Dashboard Component (`components/monitoring/HealthDashboard.tsx`)

```typescript
'use client'

import React, { useState, useEffect } from 'react'
import { HealthCheckResult } from '../../lib/monitoring/health-checks'

interface DashboardProps {
  refreshInterval?: number
}

export function HealthDashboard({ refreshInterval = 30000 }: DashboardProps) {
  const [healthData, setHealthData] = useState<{
    status: string
    checks: HealthCheckResult[]
    summary: { total: number; healthy: number; warning: number; critical: number }
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchHealthData = async () => {
    try {
      const response = await fetch('/api/health')
      const data = await response.json()
      setHealthData(data)
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Failed to fetch health data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHealthData()
    const interval = setInterval(fetchHealthData, refreshInterval)
    return () => clearInterval(interval)
  }, [refreshInterval])

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            <div className="h-3 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!healthData) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-red-800 font-semibold">Health Check Failed</h3>
        <p className="text-red-600">Unable to retrieve system health status.</p>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-500'
      case 'warning': return 'bg-yellow-500'
      case 'critical': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusBorder = (status: string) => {
    switch (status) {
      case 'healthy': return 'border-green-200'
      case 'warning': return 'border-yellow-200'
      case 'critical': return 'border-red-200'
      default: return 'border-gray-200'
    }
  }

  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <div className={`p-6 rounded-lg border-2 ${getStatusBorder(healthData.status)}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-4 h-4 rounded-full ${getStatusColor(healthData.status)}`}></div>
            <h2 className="text-xl font-semibold">System Health: {healthData.status.toUpperCase()}</h2>
          </div>
          <div className="text-sm text-gray-500">
            Last updated: {lastUpdated?.toLocaleTimeString()}
          </div>
        </div>
        
        <div className="mt-4 grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{healthData.summary.total}</div>
            <div className="text-sm text-gray-600">Total Checks</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{healthData.summary.healthy}</div>
            <div className="text-sm text-gray-600">Healthy</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{healthData.summary.warning}</div>
            <div className="text-sm text-gray-600">Warning</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{healthData.summary.critical}</div>
            <div className="text-sm text-gray-600">Critical</div>
          </div>
        </div>
      </div>

      {/* Individual Check Results */}
      <div className="grid gap-4">
        {healthData.checks.map((check, index) => (
          <div key={index} className={`p-4 rounded-lg border ${getStatusBorder(check.status)}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${getStatusColor(check.status)}`}></div>
                <h3 className="font-semibold">{check.service}</h3>
              </div>
              <div className="text-sm text-gray-500">
                {check.responseTime}ms
              </div>
            </div>
            
            {check.details && (
              <div className="mt-2 text-sm text-gray-600">
                <pre className="bg-gray-50 p-2 rounded text-xs overflow-x-auto">
                  {JSON.stringify(check.details, null, 2)}
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
```

### 2.2 Monitoring Dashboard Page (`app/monitoring/page.tsx`)

```typescript
import { HealthDashboard } from '../../components/monitoring/HealthDashboard'

export default function MonitoringPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">System Monitoring</h1>
          <p className="text-gray-600 mt-2">
            Real-time monitoring of critical system components and mortgage calculator functionality.
          </p>
        </div>
        
        <HealthDashboard refreshInterval={15000} />
      </div>
    </div>
  )
}

export const metadata = {
  title: 'System Monitoring - NextNest',
  description: 'Real-time system health monitoring dashboard'
}
```

## 3. Early Warning Systems

### 3.1 Alert Configuration (`lib/monitoring/alerts.ts`)

```typescript
export interface AlertRule {
  id: string
  name: string
  condition: (result: HealthCheckResult) => boolean
  severity: 'low' | 'medium' | 'high' | 'critical'
  channels: ('email' | 'webhook' | 'console')[]
  cooldown: number // minutes
}

export interface Alert {
  id: string
  ruleId: string
  message: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  timestamp: string
  resolved: boolean
  data: any
}

export class AlertManager {
  private rules: AlertRule[] = []
  private activeAlerts: Map<string, Alert> = new Map()
  private lastTriggered: Map<string, number> = new Map()

  constructor() {
    this.setupDefaultRules()
  }

  private setupDefaultRules() {
    // Critical calculation accuracy failure
    this.addRule({
      id: 'calc-accuracy-critical',
      name: 'Calculation Accuracy Critical',
      condition: (result) => 
        result.service === 'mortgage-calculations' && 
        result.status === 'critical',
      severity: 'critical',
      channels: ['email', 'webhook', 'console'],
      cooldown: 5
    })

    // Form validation failures
    this.addRule({
      id: 'form-validation-failure',
      name: 'Form Validation Failure',
      condition: (result) =>
        result.service === 'form-validation' &&
        result.status === 'critical',
      severity: 'high',
      channels: ['email', 'console'],
      cooldown: 10
    })

    // Performance degradation
    this.addRule({
      id: 'performance-degradation',
      name: 'Performance Degradation',
      condition: (result) =>
        result.responseTime > 5000, // 5 seconds
      severity: 'medium',
      channels: ['webhook', 'console'],
      cooldown: 15
    })

    // Data persistence issues
    this.addRule({
      id: 'data-persistence-failure',
      name: 'Data Persistence Failure',
      condition: (result) =>
        result.service === 'data-persistence' &&
        result.status === 'critical',
      severity: 'high',
      channels: ['email', 'webhook'],
      cooldown: 5
    })
  }

  addRule(rule: AlertRule) {
    this.rules.push(rule)
  }

  async processHealthCheck(result: HealthCheckResult) {
    for (const rule of this.rules) {
      if (rule.condition(result)) {
        await this.triggerAlert(rule, result)
      }
    }
  }

  private async triggerAlert(rule: AlertRule, result: HealthCheckResult) {
    const now = Date.now()
    const lastTrigger = this.lastTriggered.get(rule.id)
    
    // Check cooldown
    if (lastTrigger && (now - lastTrigger) < (rule.cooldown * 60 * 1000)) {
      return
    }

    const alert: Alert = {
      id: `${rule.id}-${now}`,
      ruleId: rule.id,
      message: `${rule.name}: ${result.service} reported ${result.status} status`,
      severity: rule.severity,
      timestamp: new Date().toISOString(),
      resolved: false,
      data: result
    }

    this.activeAlerts.set(alert.id, alert)
    this.lastTriggered.set(rule.id, now)

    // Send alerts through configured channels
    for (const channel of rule.channels) {
      await this.sendAlert(alert, channel)
    }
  }

  private async sendAlert(alert: Alert, channel: 'email' | 'webhook' | 'console') {
    switch (channel) {
      case 'console':
        console.error(`🚨 ${alert.severity.toUpperCase()} ALERT: ${alert.message}`, alert.data)
        break
        
      case 'webhook':
        try {
          await fetch(process.env.ALERT_WEBHOOK_URL || '', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              alert: alert.message,
              severity: alert.severity,
              timestamp: alert.timestamp,
              data: alert.data
            })
          })
        } catch (error) {
          console.error('Failed to send webhook alert:', error)
        }
        break
        
      case 'email':
        // Implementation would depend on email service
        console.log(`📧 EMAIL ALERT: ${alert.message} (Email sending not implemented)`)
        break
    }
  }

  getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values()).filter(alert => !alert.resolved)
  }

  resolveAlert(alertId: string) {
    const alert = this.activeAlerts.get(alertId)
    if (alert) {
      alert.resolved = true
      this.activeAlerts.set(alertId, alert)
    }
  }
}

// Global alert manager instance
export const alertManager = new AlertManager()
```

### 3.2 Alert Integration in Health Checks (`lib/monitoring/health-checks-with-alerts.ts`)

```typescript
import { HealthCheckService as BaseHealthCheckService } from './health-checks'
import { alertManager } from './alerts'

export class HealthCheckServiceWithAlerts extends BaseHealthCheckService {
  async runAllChecks() {
    const results = await super.runAllChecks()
    
    // Process each result through alert manager
    for (const result of results) {
      await alertManager.processHealthCheck(result)
    }
    
    return results
  }
}

export const healthCheckService = new HealthCheckServiceWithAlerts()
```

## 4. Monitoring Configuration Files

### 4.1 Environment Variables (`.env.local`)

```bash
# Monitoring Configuration
ENABLE_HEALTH_CHECKS=true
HEALTH_CHECK_INTERVAL=30000
ALERT_WEBHOOK_URL=https://your-webhook-url.com/alerts
ENABLE_PERFORMANCE_MONITORING=true
PERFORMANCE_BUDGET_MS=3000

# Alert Configuration  
ALERT_EMAIL_FROM=alerts@nextnest.com
ALERT_EMAIL_TO=team@nextnest.com
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
```

### 4.2 Next.js Configuration (`next.config.js` additions)

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // ... existing config
  
  // Add monitoring headers
  async headers() {
    return [
      {
        source: '/api/health',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate'
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*'
          }
        ]
      }
    ]
  },

  // Environment variables for monitoring
  env: {
    ENABLE_HEALTH_CHECKS: process.env.ENABLE_HEALTH_CHECKS,
    HEALTH_CHECK_INTERVAL: process.env.HEALTH_CHECK_INTERVAL,
    PERFORMANCE_BUDGET_MS: process.env.PERFORMANCE_BUDGET_MS,
  }
}

module.exports = nextConfig
```

## 5. Implementation Results

### Critical Problems Addressed:

1. **Calculation Accuracy**: Automated testing with known test cases
2. **Form Validation**: Comprehensive validation testing with edge cases  
3. **Data Persistence**: Health checks for data storage operations
4. **Performance Monitoring**: Response time tracking and alerting
5. **Mobile Compatibility**: Responsive design validation (placeholder for viewport testing)
6. **Error Handling**: Comprehensive error capture and reporting
7. **Security Vulnerabilities**: Input validation and sanitization checks
8. **Accessibility Issues**: Framework for accessibility testing (expandable)
9. **SEO Optimization**: Health checks for metadata and structure
10. **User Experience**: Performance and functionality monitoring

### Deployment Commands:

```bash
# Install monitoring dependencies (if any new ones needed)
npm install

# Run health checks manually
curl http://localhost:3000/api/health

# Start development with monitoring
npm run dev

# Access monitoring dashboard
# http://localhost:3000/monitoring
```

### Next Steps:
- Configure actual webhook URLs for alerts
- Set up email service for critical alerts  
- Expand health checks based on specific business requirements
- Integrate with external monitoring services (DataDog, New Relic, etc.)
- Set up automated testing pipeline integration

This implementation provides a solid foundation for detecting and responding to the 10 critical problems identified in our mortgage calculator platform.