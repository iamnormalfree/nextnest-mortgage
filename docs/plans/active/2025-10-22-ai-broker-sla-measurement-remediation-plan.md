---
title: "AI Broker SLA Measurement & Remediation Plan"
domain: Performance
date: 2025-10-22
status: active
priority: critical
estimated_effort: 2-3 days
team: performance, ai, infrastructure
---

# AI Broker SLA Measurement & Remediation Plan

## Executive Summary

**Issue**: Production smoke test revealed AI response SLA of 128+ seconds vs 5-second target. Message "Hello, I have questions about my loan application" was sent successfully but no AI response arrived within 2+ minutes.

**Critical Metrics**:
- Current SLA: 128+ seconds (unacceptable)
- Target SLA: 5 seconds maximum
- Architecture: BullMQ queue → worker → AI Orchestrator → OpenAI → Chatwoot delivery

## Root Cause Analysis

### Current Architecture Flow
```
[User Message] → [Chatwoot Webhook] → [BullMQ Queue] → [Worker] → [AI Orchestrator] → [OpenAI API] → [Chatwoot Delivery]
```

### Identified Bottlenecks

#### #PATH_DECISION: Hop-by-Hop Latency Measurement
**Approach 1: Comprehensive Tracing System** (High Implementation Effort)
- Implement OpenTelemetry tracing across all components
- Add distributed tracing IDs to every request
- Create detailed performance dashboards
- **Trade-off**: Complex to implement, but provides complete visibility

**Approach 2: Timestamp Injection System** (Medium Implementation Effort) ⭐ **RECOMMENDED**
- Add timestamps at each hop in existing pipeline
- Use existing logging infrastructure
- Minimal code changes required
- **Trade-off**: Less detailed than full tracing, but faster to implement

**Approach 3: External API Monitoring** (Low Implementation Effort)
- Add synthetic monitoring from chat interface
- Measure end-to-end response times
- No code changes required initially
- **Trade-off**: Does not identify internal bottlenecks

### #PLAN_UNCERTAINTY: Current Bottleneck Hypotheses

Based on the production failure, we believe bottlenecks exist in:

1. **Queue Processing Delay** (Hypothesis: Primary)
   - Worker may not be processing jobs promptly
   - Redis connection issues
   - Worker concurrency limits too low

2. **AI Service Latency** (Hypothesis: Secondary)
   - OpenAI API response time (>30s for complex requests)
   - AI Orchestrator overhead (intent classification + generation)
   - Fallback template usage causing delays

3. **Chatwoot Delivery Issues** (Hypothesis: Tertiary)
   - API rate limiting on Chatwoot side
   - Network connectivity issues
   - Message delivery failures

## Implementation Plan

### Phase 1: Immediate Measurement (Day 1)

#### 1.1 Implement Timestamp Injection System
**Files to modify**:
- lib/queue/broker-queue.ts - Add queue enqueue timestamp
- lib/queue/broker-worker.ts - Add worker start/complete timestamps
- lib/ai/ai-orchestrator.ts - Add AI processing timestamps
- lib/ai/broker-ai-service.ts - Add OpenAI API timestamps
- lib/integrations/chatwoot-client.ts - Add delivery timestamps

**Implementation**:
```typescript
// Add to each processing step
const hopData = {
  conversationId,
  hopName: "queue_enqueue",
  timestamp: Date.now(),
  previousHop: previousTimestamp
};

// Log hop data for performance analysis
console.log(`📍 HOP: ${hopData.hopName} for ${hopData.conversationId} at ${hopData.timestamp}`);
```

#### 1.2 Create Performance Analysis Endpoint
**New file**: app/api/admin/performance-analysis/route.ts
- Aggregate hop-by-hop timing data
- Calculate bottleneck identification
- Provide SLA compliance reporting

#### 1.3 Add Real-time SLA Monitoring
**File to modify**: lib/monitoring/alert-service.ts
- Add SLA breach alerts (response time >10s)
- Monitor hop-by-hop delays
- Auto-escalate critical SLA failures

### Phase 2: Bottleneck Resolution (Day 2)

#### 2.1 Queue Optimization
**Priority**: HIGH (likely primary bottleneck)

**Worker Concurrency Increase**:
- Current: 3 concurrent jobs
- Target: 10 concurrent jobs (adjustable via WORKER_CONCURRENCY)
- Add dynamic scaling based on queue depth

**Queue Rate Limit Optimization**:
- Current: 10 jobs/second
- Target: 30 jobs/second for burst handling
- Implement intelligent rate limiting

**Redis Connection Pooling**:
- Add connection pool configuration
- Monitor Redis latency
- Add Redis health checks

#### 2.2 AI Service Optimization
**Priority**: MEDIUM

**OpenAI API Optimization**:
- Implement request timeout (30s max)
- Add intelligent retry logic
- Use faster models for non-complex requests (gpt-4o-mini vs gpt-4o)

**AI Orchestrator Optimization**:
- Cache intent classifications for common patterns
- Implement parallel processing where possible
- Add timeout handling for each step

## Critical Decisions

### #LCL_EXPORT_CRITICAL: Implementation Decisions

1. **Timestamp Injection Over Full Tracing**: Implementing hop-by-hop timestamps first because it provides 80% of the value with 20% of the implementation effort.

2. **Queue Optimization Priority**: Based on the 128-second delay, queue processing is likely the primary bottleneck. Worker concurrency and rate limits need immediate attention.

3. **SLA Alerting Thresholds**: Set conservative thresholds initially (10s warning, 30s critical) to avoid alert fatigue while gathering baseline metrics.

4. **Gradual Rollout**: Implement measurement in staging first, then production with feature flags to avoid impacting existing conversations.

## Success Metrics

### Primary Success Metrics
- **SLA Compliance**: 95% of responses within 5 seconds
- **P95 Response Time**: Under 8 seconds
- **Queue Processing Time**: Under 2 seconds average
- **AI Generation Time**: Under 3 seconds average

### Secondary Success Metrics
- **Error Rate**: <1% failed jobs
- **Queue Depth**: <20 jobs waiting
- **Worker Utilization**: 70-85% (not overloaded)
- **User Satisfaction**: >4.5/5 for response speed

## Implementation Timeline

### Day 1: Measurement Implementation
- [ ] Implement hop-by-hop timestamp tracking
- [ ] Create performance analysis endpoint
- [ ] Add SLA monitoring to alert service
- [ ] Deploy to staging environment

### Day 2: Queue Optimization
- [ ] Increase worker concurrency to 10
- [ ] Optimize queue rate limits
- [ ] Add Redis connection pooling
- [ ] Deploy to production with monitoring

### Day 3: Advanced Optimizations
- [ ] Implement AI service optimizations
- [ ] Add response caching
- [ ] Create performance dashboard
- [ ] Document SLA monitoring procedures

## Constraint Alignment

- Constraint A – Public Surfaces Ready (`docs/plans/re-strategy/strategy-alignment-matrix.md`, C1): This remediation work restores the chat SLA guardrail required for Stage 0 readiness and feeds the Stage 0 launch gate evidence.

## Next Steps

1. **Immediate**: Implement timestamp injection in existing pipeline
2. **Short-term**: Optimize queue processing and worker concurrency  
3. **Long-term**: Implement comprehensive tracing and monitoring

**Success Criteria**: 95% of AI responses within 5-second SLA target within 7 days of implementation.
