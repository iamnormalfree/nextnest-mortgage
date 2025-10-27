# Production Performance Monitoring Guide

## Overview

This guide covers monitoring the AI Broker Chat SLA performance in production using the enhanced `/api/admin/performance-analysis` endpoint and supporting monitoring tools.

## What We're Monitoring

### SLA Thresholds
- **< 1s**: Excellent performance
- **< 2s**: Good performance
- **< 5s**: SLA compliant ✅
- **5-10s**: SLA breach ⚠️
- **10-30s**: Critical issues 🚨
- **> 30s**: Severe issues 🚨

### End-to-End Timing Pipeline
1. **Queue Add Timestamp** → Message enters queue
2. **Worker Start Timestamp** → Processing begins
3. **Worker Complete Timestamp** → Worker finishes
4. **Chatwoot Send Timestamp** → Message delivered to Chatwoot ✨ **Primary Metric**

### Expected Performance
- **SLA Compliance**: ≥95% of messages < 5s
- **Mean Latency**: < 2000ms (with queue optimizations)
- **P95 Latency**: < 5000ms
- **Critical Messages**: 0 messages > 30s
- **Chatwoot API**: < 2000ms latency

## Quick Start Commands

### Development Monitoring
```bash
# One-time performance check
npm run monitor:performance

# Continuous monitoring (30s intervals)
npm run monitor:performance:continuous

# Test the endpoint structure
npm run test:performance
```

### Production Monitoring
```bash
# One-time production check
NEXT_PUBLIC_APP_URL=https://nextnest-production.up.railway.app npm run monitor:performance

# Continuous production monitoring
NEXT_PUBLIC_APP_URL=https://nextnest-production.up.railway.app npm run monitor:performance:continuous

# Direct API call
curl https://nextnest-production.up.railway.app/api/admin/performance-analysis
```

## Understanding the Performance Analysis Endpoint

### Endpoint: `/api/admin/performance-analysis`

**Response Structure:**
```json
{
  "success": true,
  "data": {
    "totalMessages": 150,
    "completeMessages": 142,
    "partialMessages": 8,
    "distribution": {
      "under1s": 80,
      "under2s": 35,
      "under5s": 20,
      "over5s": 10,
      "over10s": 4,
      "over30s": 1
    },
    "stats": {
      "meanLatency": 1850,
      "medianLatency": 1200,
      "p95Latency": 4800,
      "p99Latency": 7200,
      "minLatency": 450,
      "maxLatency": 35000
    },
    "phaseBreakdown": {
      "queueToWorker": 250,
      "workerProcessing": 1200,
      "workerToChatwoot": 400
    },
    "systemInfo": {
      "enabled": true,
      "lastUpdated": "2025-01-22T10:30:00.000Z",
      "sampleWindow": "Last hour (TTL: 3600s)"
    }
  }
}
```

### Query Parameters
- `?conversationId=123` - Filter by specific conversation
- `?limit=50` - Limit recent samples returned (default: 100)

## Alert Types and Thresholds

### Critical Alerts 🚨
- **SLA Compliance < 95%**: Systemic performance issues
- **Messages > 30s**: Severe latency requiring immediate attention
- **Complete Message Rate < 80%**: Missing end-to-end timing data

### Warning Alerts ⚠️
- **Mean Latency > 2000ms**: Performance degradation
- **P95 Latency > 5000ms**: SLA risk
- **Chatwoot API > 2000ms**: External API issues
- **Queue Wait Time > 5000ms**: Queue backup

### Info Alerts 🔵
- **Insufficient Data**: Less than 5 messages for analysis
- **Latency Trends**: ±50% change from previous measurements

## Monitoring Dashboard

### Performance Dashboard Component
Location: `components/admin/PerformanceDashboard.tsx`

**Features:**
- Real-time SLA compliance percentage
- Latency distribution visualization
- Phase breakdown timing
- Statistical analysis (min, median, mean, P95, P99, max)
- Auto-refresh every 30 seconds
- Alert indicators for performance issues

**To integrate:**
```tsx
import PerformanceDashboard from '@/components/admin/PerformanceDashboard';

// In your admin page
<PerformanceDashboard />
```

## Continuous Monitoring Setup

### 1. Basic Monitoring Script
```bash
# Run continuous monitoring in terminal
npm run monitor:performance:continuous

# Custom interval (60 seconds)
npm run monitor:performance:continuous -- --interval=60000
```

### 2. Production Monitoring
```bash
# Set production URL and run continuous monitoring
export NEXT_PUBLIC_APP_URL=https://nextnest-production.up.railway.app
npm run monitor:performance:continuous
```

### 3. Integration with External Monitoring

**Prometheus/Grafana:**
```bash
# Export metrics for external monitoring
curl -s https://nextnest-production.up.railway.app/api/admin/performance-analysis | \
  jq '.data | {sla_compliance: (.distribution.under5s / (.completeMessages + .partialMessages) * 100), mean_latency: .stats.meanLatency}'
```

**Slack/Webhook Alerts:**
The monitoring script can be extended to send alerts to Slack when thresholds are breached.

## Performance Validation Workflow

### Daily Checklist
1. **Check SLA Compliance**: Should be ≥95%
2. **Review Mean Latency**: Should be < 2000ms
3. **Look for Critical Issues**: 0 messages > 30s
4. **Verify Phase Breakdown**:
   - Queue → Worker: < 5000ms
   - Worker Processing: < 3000ms
   - Worker → Chatwoot: < 2000ms

### Weekly Analysis
1. **Trend Analysis**: Compare performance week-over-week
2. **Pattern Detection**: Identify peak usage times
3. **Bottleneck Investigation**: Analyze phase breakdown changes
4. **Capacity Planning**: Review queue capacity and worker concurrency

### Monthly Review
1. **SLA Report**: Overall compliance rate
2. **Performance Regression**: Compare with baseline
3. **Optimization Impact**: Measure effect of performance improvements
4. **Incident Review**: Analyze any performance incidents

## Troubleshooting Common Issues

### High Latency (> 5s)
1. **Check Phase Breakdown**: Identify which phase is causing delays
2. **Queue Backup**: High `queueToWorker` time indicates capacity issues
3. **Worker Performance**: High `workerProcessing` suggests AI generation delays
4. **Chatwoot API**: High `workerToChatwoot` indicates external API issues

### Low SLA Compliance (< 95%)
1. **Review Distribution**: Check if issues are widespread or isolated
2. **Recent Changes**: Correlate with recent deployments
3. **Load Patterns**: Check if high traffic periods cause degradation
4. **Resource Constraints**: Verify worker concurrency and queue settings

### Missing Timing Data
1. **Partial Messages**: High `partialMessages` indicates missing Chatwoot timestamps
2. **System Configuration**: Verify `ENABLE_SLA_TIMING=true`
3. **Recent Deployment**: Check if timing features were disabled

### Performance Regression
1. **Compare with Baseline**: Use historical data to identify changes
2. **Recent Code Changes**: Check for performance-related deployments
3. **External Dependencies**: Verify Chatwoot API performance
4. **Infrastructure**: Check Redis performance and worker health

## Emergency Response Procedures

### Critical Performance Incident
1. **Immediate Assessment**: Run `npm run monitor:performance:prod`
2. **Identify Scope**: Check if issue affects all messages or specific conversations
3. **Determine Impact**: Calculate SLA compliance rate
4. **Investigate**: Check phase breakdown for bottleneck identification
5. **Escalate**: If SLA compliance < 80% or > 10 messages > 30s

### SLA Breach Response
1. **Alert**: Notify team of SLA compliance drop
2. **Analyze**: Review recent performance data
3. **Identify**: Determine root cause (queue, worker, or API)
4. **Mitigate**: Apply appropriate fix (scale workers, optimize code, etc.)
5. **Monitor**: Continue monitoring until SLA compliance restored

## Integration with CI/CD

### Pre-deployment Checks
```bash
# Test performance endpoint before deployment
npm run test:performance

# Verify SLA timing is enabled
curl -s http://localhost:3000/api/admin/performance-analysis | jq '.data.systemInfo.enabled'
```

### Post-deployment Validation
```bash
# Monitor performance for 10 minutes after deployment
npm run monitor:performance:continuous -- --interval=60000 &
MONITOR_PID=$!

# Wait 10 minutes
sleep 600

# Stop monitoring and check results
kill $MONITOR_PID
```

## Configuration

### Environment Variables
- `ENABLE_SLA_TIMING=true` - Enable SLA timing collection
- `WORKER_CONCURRENCY=10` - Worker thread pool size
- `QUEUE_RATE_LIMIT=30` - Maximum jobs per second
- `REDIS_URL` - Redis connection for timing data storage

### Performance Tuning
- **Worker Concurrency**: Increase for better throughput
- **Rate Limits**: Adjust based on system capacity
- **Redis TTL**: Balance data retention vs storage usage
- **Monitoring Intervals**: Balance real-time visibility vs overhead

## Data Retention

### Timing Data
- **TTL**: 3600 seconds (1 hour)
- **Storage**: Redis hash with automatic expiration
- **Sampling**: Limited to 100 most recent messages for API responses

### Historical Analysis
- **Export**: Use monitoring script to export data
- **Archiving**: Implement custom solution for long-term storage
- **Trends**: Calculate rolling averages for trend analysis

---

## Support

For questions about performance monitoring or to report issues:
1. Check this guide first
2. Review console logs from monitoring scripts
3. Test with `npm run test:performance`
4. Check system status at `/api/health`
5. Review queue metrics at `/api/admin/migration-status`