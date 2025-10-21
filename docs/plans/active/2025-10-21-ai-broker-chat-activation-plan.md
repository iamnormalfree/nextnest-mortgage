---
title: AI Broker Chat Activation - Make Chat Functional & Intelligent
status: active
owner: engineering
created: 2025-10-21
priority: critical
estimated_hours: 13
complexity: medium
dependencies:
  - BullMQ queue system
  - Vercel AI SDK integration
  - Chatwoot integration
  - CustomChatInterface UI
context: |
  BullMQ, personas, and UI are already implemented, but the queue is still routed to n8n and we have gaps in reliability testing. Focus on re-enabling the existing BullMQ path, proving it is stable on desktop and mobile, and rolling out safely without regressing the current Chatwoot experience.
---

# AI Broker Chat Activation Plan

## Overview

**Problem:** Customers can open the chat on desktop or mobile, but AI replies are inconsistent because BullMQ is not receiving traffic and the worker health is uncertain.  
**Root cause:** `BULLMQ_ROLLOUT_PERCENTAGE` is still at 0, the worker may be idling, and we have thin automated coverage for the queue → worker → Chatwoot flow.  
**Approach:** Re-activate the BullMQ pipeline, harden it with targeted tests and UX verification, then stage a rollout with monitoring and a documented fallback.

## Success Criteria

- BullMQ handles production traffic within SLA: first AI response < 5 s for 95th percentile chats.
- End-to-end message flow (queue → worker → Chatwoot) covered by automated tests.
- Desktop and mobile chat UIs show the same conversation history, no polling gaps, no console errors.
- Worker health is observable via `/api/worker/start` and Railway logs; alerting for failed jobs in place.
- Rollout staged (10% → 50% → 100%) with clear gating metrics and rollback steps.

---

## Phase 0: Confirm Current State (30 minutes)

### Task 0.1: Read canonical references
- `docs/runbooks/AI_BROKER_COMPLETE_GUIDE.md`
- `lib/queue/broker-queue.ts`
- `lib/queue/broker-worker.ts`
- `lib/ai/broker-ai-service.ts`
- `components/chat/CustomChatInterface.tsx`

Focus on: persona prompts, queue job signatures, worker lifecycle via `worker-manager.ts`, and existing UI polling.

### Task 0.2: Snapshot migration status (API)
```bash
# Requires dev server or deployed environment
curl -s http://localhost:3000/api/admin/migration-status | jq
```
Confirm current values for:
- `"bullmqEnabled"`
- `"trafficPercentage"`
- `"n8nEnabled"`

Document findings in `docs/work-log.md`.

---

## Phase 1: Reactivate BullMQ Message Flow (3.5 hours)

### Task 1.1: Align environment toggles (30 minutes)
Update `.env.local` (and Railway) to:
```bash
ENABLE_BULLMQ_BROKER=true
BULLMQ_ROLLOUT_PERCENTAGE=10   # Start at 10% for validation
ENABLE_AI_BROKER=true          # Keep n8n available until BullMQ is proven
WORKER_CONCURRENCY=3
QUEUE_RATE_LIMIT=10
REDIS_URL=<railway-redis-url>
OPENAI_API_KEY=<openai-key>
CHATWOOT_BASE_URL=https://chat.nextnest.sg
CHATWOOT_API_TOKEN=<token>
CHATWOOT_ACCOUNT_ID=1
```
Re-run `/api/admin/migration-status` and capture the JSON diff in the work log. If the target is immediate full cutover, note the rationale and planned date for flipping `ENABLE_AI_BROKER=false`.

### Task 1.2: Worker health check (45 minutes)
- Call `POST /api/worker/start` locally and in staging/production.
- Verify logs show `🚀 BullMQ worker initialized` plus the expected concurrency and rate limit.
- Track worker status via `GET /api/worker/start` (uses `getWorkerStatus()`).
- On Railway, confirm the worker service is running and reading from Redis. Capture screenshots/log snippets in the work log.

### Task 1.3: Validate queue handshake (1 hour)
- Use `scripts/test-bullmq-incoming-message.ts` to enqueue a sample message; assert worker logs the processing path end-to-end.
- Confirm Chatwoot conversation receives the generated reply (use a test account).
- Ensure `shouldUseBullMQ` is logging migration decisions (check `logs/` output) and that the job status can be observed in Redis CLI or Bull board (if available).

### Task 1.4: Clean up configuration drift (1 hour)
- Audit `app/api/chatwoot-webhook/route.ts` to ensure fallback to n8n remains intact while BullMQ takes percentage traffic.
- Verify no redundant worker scripts are invoked (`worker-manager.ts` is the single entrypoint). Remove or deprecate references to `scripts/start-worker.ts` if they exist in docs.
- Update `docs/runbooks/AI_BROKER_COMPLETE_GUIDE.md` with any adjustments to the activation flow discovered during Tasks 1.1–1.3.

---

## Phase 2: Hardening & UX Polish (6 hours)

### Task 2.1: Integration coverage for message flow (TDD, 2 hours)
1. **Write failing tests** in `tests/integration/ai-broker-message-flow.test.ts` covering:
   - `queueIncomingMessage` enqueues jobs with correct payload.
   - Worker processes the job and calls `ChatwootClient.sendMessage`.
   - AI fallback returns templated text when OpenAI fails.
2. Run tests (expect red).
3. Fill any gaps in stubs/mocks until green.
4. Ensure test suite exercises both `message_type` filtering and persona prompt creation.

### Task 2.2: Desktop & mobile chat verification (2 hours)
- Use `app/test-mobile/page.tsx` or the existing mobile playground to QA `CustomChatInterface` at 320 px, 360 px, and 390 px widths.
- Validate polling, typing indicators, and error surfaces on both mobile and desktop; log findings with screenshots in `validation-reports/`.
- Add/lightly adjust component tests in `components/chat/__tests__/CustomChatInterface.test.tsx` to assert message rendering and error handling (TDD workflow).
- Confirm there are no console errors or layout regressions when BullMQ responses stream in.

### Task 2.3: Persona & response polish (1.5 hours)
- Review `lib/ai/broker-ai-service.ts` prompts to ensure tone and professionalism align with brokerage guidelines; incorporate any wording improvements inspired by Vercel's AI chat template while keeping persona specificity.
- Verify Dr. Elena routing by replaying a calculation request and confirming `drElenaService.processCalculationRequest` is invoked.
- Ensure logs redact customer PII before shipping to monitoring destinations.

### Task 2.4: Observability & guardrails (30 minutes)
- Configure alerts (or lightweight log watchers) for BullMQ failed jobs and worker crashes.
- Confirm `logMigrationDecision` output surfaces in production logging dashboards.
- Document expected dashboards/commands in `docs/runbooks/AI_BROKER_COMPLETE_GUIDE.md`.

---

## Phase 3: Rollout & Monitoring (3.5 hours)

### Task 3.1: Staged rollout plan
| Stage | Target | Preconditions | Actions | Observability |
|-------|--------|---------------|---------|---------------|
| Validation | 10% | Phase 2 tests passed, worker stable 24h | keep `ENABLE_AI_BROKER=true`; monitor BullMQ queue depth | `/api/admin/migration-status`, Redis metrics |
| Ramp | 50% | <1% failed jobs, response SLA met | update `BULLMQ_ROLLOUT_PERCENTAGE=50`; notify stakeholders | Worker logs, Chatwoot conversation QA |
| Full Cutover | 100% | No critical issues for 72h, human approval | set `ENABLE_AI_BROKER=false`, `BULLMQ_ROLLOUT_PERCENTAGE=100`; redeploy worker | Synthetic chat tests, error budget tracking |

Rollback: revert `BULLMQ_ROLLOUT_PERCENTAGE` to previous value, re-enable `ENABLE_AI_BROKER=true`, redeploy worker, postmortem within 24h.

### Task 3.2: Production verification checklist (1 hour)
- Run smoke chat from homepage (desktop + mobile) and confirm AI response within SLA.
- Validate conversation persistence after refresh and device rotation.
- Ensure Chatwoot inbox shows correct persona name and that human handoff still works.

### Task 3.3: Launch documentation & handoff (1 hour)
- Update `docs/work-log.md` with final status, metrics, and rollout decisions.
- Refresh any customer-facing SOPs that reference AI response behaviour.
- Schedule post-launch monitoring review (48h after full cutover).

---

## Follow-up / Backlog (Not in this activation window)

- Multi-conversation sidebar & session management (requires new data model; align with Jesse before starting).
- Real-time updates (SSE/WebSocket) once BullMQ path is battle-tested.
- Advanced analytics pipeline for persona performance.
- Evaluate deeper UI refinements or component swaps after stability is confirmed (e.g., re-assessing Vercel template adoption vs. current bespoke UI).

---

## References

- Queue: `lib/queue/broker-queue.ts`
- Worker lifecycle: `lib/queue/worker-manager.ts`
- AI service: `lib/ai/broker-ai-service.ts`
- Chat webhook: `app/api/chatwoot-webhook/route.ts`
- Chat UI: `components/chat/CustomChatInterface.tsx`, `components/chat/EnhancedChatInterface.tsx`
- Worker admin API: `app/api/worker/start/route.ts`
- Migration controls: `lib/utils/migration-control.ts`

---

## Final Success Checklist

- [ ] `/api/admin/migration-status` reports `bullmqEnabled: true` with planned rollout percentage.
- [ ] Worker status via `/api/worker/start` shows `running: true`.
- [ ] Integration tests for queue → worker → Chatwoot run green in CI.
- [ ] Manual QA on desktop and mobile demonstrates professional, on-brand responses.
- [ ] Observability dashboards/alerts configured for BullMQ errors.
- [ ] Rollout notes and rollback steps documented and shared with stakeholders.
