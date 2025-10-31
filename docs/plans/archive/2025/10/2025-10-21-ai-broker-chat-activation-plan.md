---
title: AI Broker Chat Activation - Make Chat Functional & Intelligent
status: active
owner: engineering
created: 2025-10-21
updated: 2025-10-31
priority: critical
estimated_hours: 13
complexity: medium
dependencies:
  - BullMQ queue system
  - Vercel AI SDK integration
  - Chatwoot integration
  - CustomChatInterface UI
---

# AI Broker Chat Activation Plan

## Activation Guide

**Read first:** `docs/runbooks/AI_BROKER_COMPLETE_GUIDE.md` - Section 3.7 "System Activation & Deployment"

Covers:
- Worker auto-start procedures and health checks
- Environment configuration (BullMQ, Redis, OpenAI, Chatwoot)
- Queue handshake validation
- Migration status API
- Staged rollout playbook (10% → 50% → 100%)
- Production deployment checklist
- Integration testing patterns
- Rollback procedures
- Common issues & solutions

## Overview

**Problem:** BullMQ queue at 0% rollout, AI responses inconsistent, worker health uncertain

**Root Cause:** `BULLMQ_ROLLOUT_PERCENTAGE=0`, thin automated test coverage

**Approach:** Re-activate BullMQ pipeline, harden with tests, deploy at 100% with close monitoring (staged rollout skipped)

## Success Criteria

- BullMQ handles production traffic within SLA: first AI response <5s (P95)
- End-to-end message flow (queue → worker → Chatwoot) covered by automated tests
- Desktop and mobile chat UIs show same conversation history, no polling gaps, no console errors
- Worker health observable via `/api/worker/start` and Railway logs
- Direct 100% activation with monitoring dashboards and rollback plan ready

---

## Phase 0: Confirm Current State (30 minutes)

### Task 0.1: Read canonical references
- Review `docs/runbooks/AI_BROKER_COMPLETE_GUIDE.md` section 3.7
- Check queue: `lib/queue/broker-queue.ts`, `lib/queue/broker-worker.ts`
- Check AI service: `lib/ai/broker-ai-service.ts`
- Check UI: `components/chat/CustomChatInterface.tsx`

### Task 0.2: Snapshot migration status
```bash
curl http://localhost:3000/api/admin/migration-status | jq
```
Document current `bullmqEnabled`, `trafficPercentage`, `n8nEnabled` in work log.

**Reference:** `AI_BROKER_COMPLETE_GUIDE.md#migration-status-api`

---

## Phase 1: Reactivate BullMQ Message Flow (3.5 hours)

### Task 1.1: Configure environment variables
Update `.env.local` and Railway with required variables:
- `ENABLE_BULLMQ_BROKER=true`
- `BULLMQ_ROLLOUT_PERCENTAGE=100` (going straight to 100% - no staged rollout)
- Worker concurrency and rate limits
- Redis, OpenAI, Chatwoot credentials

**Note:** Decision made to skip gradual rollout (10% → 50% → 100%) and go directly to full BullMQ activation. Phase 3 staged rollout tasks are superseded by this approach.

**Reference:** `AI_BROKER_COMPLETE_GUIDE.md#environment-configuration`

### Task 1.2: Verify worker health
- Call `POST /api/worker/start` locally and in staging
- Verify logs show worker initialization with expected concurrency
- Check `GET /api/worker/start` for status
- Confirm Railway worker service running

**Reference:** `AI_BROKER_COMPLETE_GUIDE.md#worker-auto-start-railway--development`

### Task 1.3: Validate queue handshake
- Run `scripts/test-bullmq-incoming-message.ts`
- Confirm Chatwoot receives generated reply (test account)
- Verify `shouldUseBullMQ` logging migration decisions

**Reference:** `AI_BROKER_COMPLETE_GUIDE.md#queue-handshake-validation`

### Task 1.4: Clean up configuration drift
- Audit `app/api/chatwoot-webhook/route.ts` for n8n fallback integrity
- Verify `worker-manager.ts` is single worker entrypoint
- Update runbook with any discovered adjustments

---

## Phase 2: Hardening & UX Polish (6 hours)

### Task 2.1: Integration test coverage (TDD, 2 hours)
Write tests in `tests/integration/ai-broker-message-flow.test.ts`:
- Queue enqueues jobs with correct payload
- Worker processes and calls ChatwootClient
- AI fallback works when OpenAI fails
- Message type filtering and persona prompts

**Reference:** `AI_BROKER_COMPLETE_GUIDE.md#integration-testing-for-activation`

### Task 2.2: Desktop & mobile chat verification (2 hours)
- QA `CustomChatInterface` at 320px, 360px, 390px widths
- Validate polling, typing indicators, error surfaces
- Add component tests for message rendering and error handling
- Confirm no console errors or layout regressions

**Reference:** `AI_BROKER_COMPLETE_GUIDE.md#desktop--mobile-chat-ui-testing`

### Task 2.3: Persona & response polish (1.5 hours)
- Review `lib/ai/broker-ai-service.ts` prompts for tone alignment
- Verify Dr. Elena routing with calculation request replay
- Ensure logs redact customer PII

### Task 2.4: Observability & guardrails (30 minutes)
- Configure alerts for BullMQ failed jobs and worker crashes
- Confirm `logMigrationDecision` output in production dashboards
- Document monitoring setup in runbook

### Task 2.5: Response SLA remediation (1 hour)
- Update `scripts/profile-sla-timing.ts` to use real Chatwoot conversation IDs
- Create real conversations via `ChatwootClient.createConversation`
- Run profiling with 10+ samples, compute P95
- Document metrics and code touchpoints in work log

### Task 2.6: Conversation persistence fix (✅ COMPLETED)
- Minimal fix for Chatwoot history repopulation on refresh
- Add regression coverage in component tests
- Record root cause analysis in validation reports

---

## Phase 3: Rollout & Monitoring (3.5 hours)

### Task 3.1: Execute direct 100% rollout ⚠️ MODIFIED
**Decision:** Going directly to 100% BullMQ (staged rollout skipped per Task 1.1 update)

**Preconditions before activating:**
- Phase 2 tests green (integration tests passing)
- Worker health verified via `/api/worker/start`
- Migration status API shows healthy state

**Monitoring during initial 24h:**
- Watch `/api/admin/migration-status` for failed jobs
- Monitor worker logs for errors
- Track Chatwoot message delivery
- Alert on SLA breaches (P95 >5s)

**Rollback:** Set `BULLMQ_ROLLOUT_PERCENTAGE=0`, re-enable n8n fallback if needed, redeploy

**Reference:** `AI_BROKER_COMPLETE_GUIDE.md#staged-rollout-playbook` (adapted for direct cutover)

### Task 3.2: Production verification (1 hour)
Use checklist from `AI_BROKER_COMPLETE_GUIDE.md#production-verification-checklist`:
- Desktop + mobile smoke chat within SLA
- Conversation persistence after refresh/rotation
- Chatwoot shows correct persona, human handoff works

### Task 3.3: Launch documentation & handoff (1 hour)
- Update work log with final status, metrics, rollout decisions
- Refresh customer-facing SOPs for AI response behavior
- Schedule 48h post-launch monitoring review

**Reference:** `AI_BROKER_COMPLETE_GUIDE.md#post-launch-monitoring--handoff`

---

## Follow-up / Backlog

**Not in this activation window:**
- Multi-conversation sidebar & session management
- Real-time enhancements (`2025-10-22-ai-broker-realtime-upgrade-plan.md`)
- Advanced analytics pipeline for persona performance
- UI refinements after stability confirmed

---

## References

**Primary Guide:** `docs/runbooks/AI_BROKER_COMPLETE_GUIDE.md` (section 3.7)

**Code:**
- Queue: `lib/queue/broker-queue.ts`
- Worker: `lib/queue/worker-manager.ts`
- AI service: `lib/ai/broker-ai-service.ts`
- Webhook: `app/api/chatwoot-webhook/route.ts`
- Chat UI: `components/chat/CustomChatInterface.tsx`
- Worker API: `app/api/worker/start/route.ts`

## Constraint Alignment

**Constraint A – Public Surfaces Ready** (`docs/plans/re-strategy/strategy-alignment-matrix.md`, C1)
- Activating BullMQ-backed chat restores production-grade AI responses
- Ensures chat surface meets Stage 0 reliability and SLA requirements before launch gate opens
- Related: Existing `AI_BROKER_COMPLETE_GUIDE.md` provides operational procedures

---

## Final Success Checklist

- [x] `/api/admin/migration-status` reports `bullmqEnabled: true` with planned rollout %
- [x] Worker status via `/api/worker/start` shows `running: true`
- [x] Integration tests for queue → worker → Chatwoot run green in CI
- [x] P95 AI response latency <5s validated with production-like smoke tests
- [x] Chat history persists across refresh and device changes in manual QA
- [x] Manual QA on desktop and mobile demonstrates professional responses
- [ ] Observability dashboards/alerts configured for BullMQ errors
- [x] Rollout notes and rollback steps documented and shared with stakeholders
