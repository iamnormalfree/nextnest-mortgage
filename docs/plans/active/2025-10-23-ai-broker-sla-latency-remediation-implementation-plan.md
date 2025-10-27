---
title: "AI Broker SLA Latency Remediation Implementation Plan"
status: active
owner: engineering
created: 2025-10-23
priority: critical
estimated_hours: 18-24
dependencies:
  - docs/plans/active/2025-10-21-ai-broker-chat-activation-plan.md
  - docs/plans/active/2025-10-22-ai-broker-sla-measurement-remediation-plan.md
  - docs/plans/active/2025-10-22-ai-broker-realtime-upgrade-plan.md
---

# AI Broker SLA Latency Remediation Implementation Plan

## 0. Orientation & Guardrails

**Read first (no keyboard until done):**
- `docs/work-log.md` entries dated 2025-10-22 (SLA measurements and Chatwoot fixes).
- `docs/strategy_integration/hybrid-agent/README.md` for hybrid agent intent/KB structure.
- `lib/queue/broker-worker.ts`, `lib/ai/ai-orchestrator.ts`, `lib/ai/broker-ai-service.ts`, `lib/integrations/chatwoot-client.ts`.
- `components/chat/CustomChatInterface.tsx`, `lib/realtime/` (if present) for streaming context.

**Principles:**
- DRY the plan: reuse helpers when available (`lib/cache`, hybrid agent utilities).
- YAGNI: implement only what the SLA goal needs (≤5 s P95 with ≥95 % compliance).
- TDD: each task describes the failing test to write before code.
- Frequent commits: one logical commit per task (tests + implementation + docs together).
- Never modify third-party generated files (`.next`, `node_modules`).
- Use feature flags where noted; default new capabilities OFF.

## Stage 1 – Baseline Instrumentation Hardening (4h)

### Task 1.1 – Verify warm worker boot path
- **Goal:** Ensure workers auto-warm so queue→worker delay stays <500 ms.
- **Files:** `lib/queue/worker-manager.ts`, `app/api/worker/start/route.ts`, `tests/integration/queue-warmstart.test.ts` (new).
- **Steps:**
  1. Add `ensureWorkerWarm()` that idempotently initializes worker on import (guarded by env `ENABLE_WORKER_AUTOWARM`).
  2. Expose small helper in worker-manager; call from `/api/worker/start` and from `scripts/profile-sla-timing.ts` before queuing samples.
  3. Write integration test: start test Redis, call helper, assert `getWorkerStatus().warm === true`.
- **Tests:** `npm run test -- tests/integration/queue-warmstart.test.ts`.
- **Docs:** Append troubleshooting note to `docs/runbooks/AI_BROKER_COMPLETE_GUIDE.md` (worker warmstart section).

### Task 1.2 – Persistent timing logger
- **Goal:** Capture per-hop metrics to structured store without log scraping.
- **Files:** `lib/monitoring/slalogger.ts` (new), `lib/queue/broker-queue.ts`, `lib/queue/broker-worker.ts`, `lib/ai/ai-orchestrator.ts`, `lib/integrations/chatwoot-client.ts`, `tests/unit/slalogger.test.ts`.
- **Steps:**
  1. Create `logTiming(conversationId, hop, payload)` writing to Supabase table `ai_sla_events` via existing admin client (or add minimal client in `lib/db/supabase-admin.ts`).
  2. Swap inline `console.log` calls to `await logTiming(...)`. Ensure non-blocking (fire-and-forget with error swallow + console warn).
  3. Unit tests mock Supabase client; assert payload normalization.
- **Tests:** `npm run test -- tests/unit/slalogger.test.ts`.
- **Docs:** Update `docs/runbooks/data/chat-event-mirroring.md` with new table schema.

## Stage 2 – Fast Path Decision Engine (6h)

### Task 2.1 – Lightweight intent triage
- **Goal:** Decide between cache, fast model, full model within 5 ms.
- **Files:** `lib/ai/intent-triage.ts` (new), `lib/ai/__tests__/intent-triage.test.ts`, integrate in `lib/queue/broker-worker.ts`.
- **Steps:**
  1. Implement `choosePath(input)` returning `cache` | `fast_model` | `full_model`.
     - Inputs: message length, detected keywords, hybrid agent tool hints.
  2. Use hybrid agent KB (RAG) by loading minimal metadata from `docs/strategy_integration/hybrid-agent/data/kb/` (no heavy retrieval yet; rely on exported tags).
  3. TDD: feed sample utterances verifying route selection.
- **Tests:** `npm run test -- lib/ai/__tests__/intent-triage.test.ts`.
- **Docs:** Add section to `docs/strategy_integration/hybrid-agent/README.md` describing production usage.

### Task 2.2 – Cached snippet responder
- **Goal:** Serve static but persona-specific answers instantly.
- **Files:** `lib/ai/cached-snippets.ts`, `lib/ai/__tests__/cached-snippets.test.ts`, register in worker.
- **Steps:**
  1. Build snippet registry keyed by triage tags; source safe copy from new `docs/ai/snippets/*.md`.
  2. Persona overlay: allow template variables (`{{persona.tone}}`).
  3. Integration: when triage returns `cache`, send snippet via Chatwoot without hitting OpenAI.
- **Tests:** Unit tests + worker integration test verifying no OpenAI calls (mock).
- **Docs:** Document snippet curation process in new `docs/runbooks/ai/snippet-refresh.md`.

### Task 2.3 – Tiered model execution
- **Goal:** Use fast model for simple cases, fall back only when necessary.
- **Files:** `lib/ai/model-router.ts`, `lib/ai/__tests__/model-router.test.ts`, `lib/ai/broker-ai-service.ts`.
- **Steps:**
  1. Implement router returning `{model: 'gpt-4o-mini' | 'gpt-4o' | 'claude-3.5-sonnet', reason}` based on triage + conversation context.
  2. Modify `generateBrokerResponse` to request router outcome and record in timing payload (`aiSegment.model`).
  3. Tests ensure router chooses fast model for <100 char messages lacking complex keywords.
- **Tests:** `npm run test -- lib/ai/__tests__/model-router.test.ts`.
- **Docs:** Append model logic summary to `docs/runbooks/AI_BROKER_COMPLETE_GUIDE.md`.

## Stage 3 – Streaming UX & Human Reassurance (4h)

### Task 3.1 – Ably status streaming hook
- **Goal:** Send “human touch” updates instantly.
- **Files:** `lib/realtime/useConversationChannel.ts` (if not created), `lib/realtime/__tests__/useConversationChannel.test.tsx`, `components/chat/CustomChatInterface.tsx`, `lib/queue/broker-worker.ts`.
- **Steps:**
  1. Publish `eventType: 'status:received' | 'status:working' | 'status:reply_ready'` from worker around AI execution.
  2. Hook subscribes via Ably, updates local UI state, shows natural phrases.
  3. Component test ensures fallback polling still works when Ably disabled.
- **Tests:** `npm run test -- lib/realtime/__tests__/useConversationChannel.test.tsx`.
- **Docs:** `docs/runbooks/testing/QUICK_START_AI_TEST.md` add manual streaming QA checklist.

### Task 3.2 – Typing indicator copy & persona voice
- **Goal:** Ensure streaming messages feel human and consistent.
- **Files:** `components/chat/CustomChatInterface.tsx`, `components/chat/__tests__/StreamingExperience.test.tsx` (new).
- **Steps:**
  1. Map persona to natural reassurance strings (e.g., “Let me run the numbers for you now…”).
  2. Guard to avoid flicker if reply arrives <500 ms.
- **Tests:** React Testing Library snapshot verifying correct message sequence.
- **Docs:** Document copy guidelines in `docs/ai/persona-voice.md`.

## Stage 4 – Monitoring & Ops Playbooks (4h)

### Task 4.1 – SLA analytics aggregation API
- **Goal:** Serve P50/P95 + breach counts for dashboards.
- **Files:** `app/api/analytics/sla/route.ts` (new), `app/api/analytics/sla/__tests__/route.test.ts`, `lib/analytics/sla.ts`.
- **Steps:**
  1. Query Supabase `ai_sla_events` for last hour; compute metrics.
  2. Return JSON {p50, p95, breachRate, sampleCount, cacheHitRate}.
- **Tests:** Integration test mocking Supabase client.
- **Docs:** Note endpoint usage in `docs/runbooks/monitoring/ai-sla.md`.

### Task 4.2 – AlertService SLA thresholds
- **Goal:** Auto-page when metrics drift.
- **Files:** `lib/monitoring/alert-service.ts`, `lib/monitoring/__tests__/alert-service-sla.test.ts`.
- **Steps:**
  1. Add new alert type `sla_breach` triggered when p95 > 5000ms or breachRate > 5%.
  2. Hook into existing Slack/email pipeline.
- **Tests:** Unit tests with mocked analytics data.
- **Docs:** Update `docs/runbooks/chatops/webhook-disable-procedure.md` with new alert response steps.

### Task 4.3 – Ops runbook updates
- **Files:** `docs/runbooks/AI_BROKER_COMPLETE_GUIDE.md`, `docs/runbooks/monitoring/ai-sla.md`, `docs/runbooks/ai/snippet-refresh.md` (ensure cross-links).
- **Content:** Warm worker checklist, cache refresh cadence, alert triage flow, model tier switch instructions.

## Stage 5 – Hybrid Agent Shadow & Data Capture (4-6h)

### Task 5.1 – Shadow executor
- **Goal:** Run hybrid agent in parallel for evaluation.
- **Files:** `lib/ai/hybrid-shadow.ts`, `lib/ai/__tests__/hybrid-shadow.test.ts`, `lib/queue/broker-worker.ts`.
- **Steps:**
  1. After primary reply, invoke hybrid agent (from `docs/strategy_integration/hybrid-agent/agent/` via script entrypoint).
  2. Store comparison (primary vs hybrid) + diff metrics in Supabase `hybrid_shadow_results`.
  3. Feature flag `ENABLE_HYBRID_SHADOW`.
- **Tests:** Unit test mocking subprocess; integration verifying Supabase call.
- **Docs:** `docs/strategy_integration/hybrid-agent/README.md` add production shadow notes.

### Task 5.2 – Data export pipeline
- **Goal:** Produce dataset for future fine-tune.
- **Files:** `scripts/export-sla-dataset.ts` (new), `scripts/__tests__/export-sla-dataset.test.ts`.
- **Steps:**
  1. Pull conversations where P95 < 5 s and replies approved; export anonymized JSONL with prompt/response/timing.
  2. Store under `data/fine-tune/samples/`.
- **Tests:** Jest test ensuring sanitization.
- **Docs:** Mention export cadence in `docs/runbooks/data/chat-event-mirroring.md`.

## Stage 6 – Verification & Rollout Checklist (2h)

1. **Automated tests:** `npm run lint`, `npm run lint:all`, `npm test`, `npm run test:integration`.
2. **Smoke SLA profiling:** run `npm run script profile-sla-timing` (post-warm); confirm 10/10 samples <5 s with logs in `docs/work-log.md`.
3. **Manual QA:** Desktop + mobile (375px) streaming experience, fallback polling disabled, verify persona voice copy.
4. **Shadow monitor:** Enable `ENABLE_HYBRID_SHADOW` in staging for 24 h; review `hybrid_shadow_results`.
5. **Documentation audit:** Ensure runbooks updated, cross-links intact.
6. **Deployment:** Stage → production with `ENABLE_FAST_PATH` + `ENABLE_STREAMING_STATUS` at 10% traffic; monitor new SLA alerts.

## Constraint Alignment

- Constraint A – Public Surfaces Ready (`docs/plans/re-strategy/strategy-alignment-matrix.md`, C1): These latency remediations enforce the chat SLA and monitoring guardrails required for Stage 0 readiness ahead of the public launch.

## Success Criteria
- 10 production-like samples recorded with P95 ≤ 5 000 ms and ≥95 % compliance.
- Cache hit rate ≥ 30 % on safe snippets; fast model usage ≥ 50 %.
- Streaming reassurance visible within 500 ms of user message.
- AlertService fires if p95 climbs above 5 s; dashboard exposed via analytics API.
- Hybrid shadow captures >100 conversations/week for comparison dataset.

## References
- `docs/plans/active/2025-10-21-ai-broker-chat-activation-plan.md`
- `docs/plans/active/2025-10-22-ai-broker-sla-measurement-remediation-plan.md`
- `docs/strategy_integration/hybrid-agent/`
- `docs/runbooks/AI_BROKER_COMPLETE_GUIDE.md`
- `scripts/profile-sla-timing.ts`
