ABOUTME: Implementation plan for AI broker realtime upgrade across chat experience.
ABOUTME: Tracks tasks, deliverables, and completion criteria for Ably integration.

# AI Broker Real-Time Upgrade Implementation Plan

---
title: "AI Broker Real-Time Upgrade Implementation Plan"
status: active
owner: engineering
priority: critical
created: 2025-10-22
estimated_effort: 5-7 engineering days
dependencies:
  - docs/plans/active/2025-10-21-ai-broker-chat-activation-plan.md
  - docs/plans/active/2025-10-22-ai-broker-sla-measurement-remediation-plan.md
---

## Implementation Guides

**Before starting, read these runbooks:**
- `docs/runbooks/chat/realtime-implementation-guide.md` - Ably setup, patterns, code examples
- `docs/runbooks/data/chat-event-mirroring.md` - Event pipeline architecture
- `docs/runbooks/AI_BROKER_COMPLETE_GUIDE.md` - Existing broker context
- `docs/runbooks/testing/QUICK_START_AI_TEST.md` - Testing approach

## High-Level Milestones

| Stage | Goal | Deliverables |
|-------|------|--------------|
| Stage 1 | Real-time transport & event mirroring foundation | Ably integration, publisher hooks, webhook → Redis/Supabase pipeline, resume tokens |
| Stage 2 | Chat + broker UI upgrades | Typing/read presence, quick prompts, accessibility polish, mobile parity |
| Stage 3 | AI orchestration enhancements & observability | Context pull from Redis, compliance scaffolding, analytics API, monitoring |

Complete tasks in order using TDD. Commit frequently. Ask when unclear.

---

## Stage 1 – Real-Time Transport & Event Mirroring

### Task 1.1 – Add Ably dependencies & configuration

- **Goal:** Install Ably SDK and configure environment
- **Files:** `package.json`, `env.d.ts`, `.env.local.example`, `docs/runbooks/devops/deployment-env-variables.md`
- **Steps:** Install `ably`, update env types, document variables
- **Tests:** `npm run lint` passes (no type errors)
- **Reference:** `docs/runbooks/chat/realtime-implementation-guide.md#getting-started`

### Task 1.2 – Create Ably server publisher utility

- **Goal:** Reusable helper for publishing events from server/worker
- **Files:** `lib/realtime/ably-server.ts`, tests
- **Tests:** Mock Ably client, validate env vars, channel naming
- **Reference:** `docs/runbooks/chat/realtime-implementation-guide.md#server-side-publishing`

### Task 1.3 – Integrate Ably publisher into Chatwoot webhook & worker

- **Goal:** Emit real-time events when messages created
- **Files:** `app/api/chatwoot-webhook/route.ts`, `lib/queue/broker-worker.ts`, tests
- **Events:** `message:user`, `message:ai`, `sla:warning`, `sla:violation`
- **Tests:** Extend worker tests, add route integration test
- **Reference:** `docs/runbooks/chat/realtime-implementation-guide.md#integration-points`

### Task 1.4 – Build Ably client hook for chat interface

- **Goal:** React hook for subscribing to conversation channel
- **Files:** `lib/realtime/useConversationChannel.ts`, tests, `components/chat/CustomChatInterface.tsx`
- **Features:** Message subscription, typing/read callbacks, reconnection handling
- **Tests:** Hook test with mock events, component test with fallback polling
- **Reference:** `docs/runbooks/chat/realtime-implementation-guide.md#client-side-subscription`

### Task 1.5 – Implement Ably webhook → Redis + Supabase mirroring

- **Goal:** Persist events for resume, analytics, compliance
- **Files:** `app/api/ably/events/route.ts`, `lib/realtime/ably-webhook.ts`, tests, Supabase migration
- **Pipeline:** Validate signature → Write to Redis (24h TTL) → Insert to Supabase
- **Tests:** Signature validation unit tests, integration test with mock payload
- **Reference:** `docs/runbooks/data/chat-event-mirroring.md` (complete architecture guide)

### Task 1.6 – Resume token generation and validation

- **Goal:** Allow customers to resume conversations via secure link
- **Files:** `lib/chat/resume-token.ts`, `app/api/chat/resume/route.ts`, tests, `app/chat/page.tsx`
- **Implementation:** JWT with conversationId + email, httpOnly cookie, email stub
- **Tests:** Token sign/verify, API validation, expiration handling
- **Reference:** `docs/runbooks/chat/realtime-implementation-guide.md` (see resume flow section if added, otherwise document here)

**Stage 1 Exit Criteria:**
- [ ] All dependencies installed, env docs updated
- [ ] Publisher helper tested and integrated
- [ ] Chatwoot webhook & worker emit Ably events
- [ ] Chat UI consumes Ably events (fallback ready)
- [ ] Webhook mirrors data to Redis & Supabase
- [ ] Resume tokens issued and validated
- [ ] `npm run lint && npm test && npm run test:integration` all green

---

## Stage 2 – Chat & Broker UX Enhancements

### Task 2.1 – Typing/read/presence integration

- **Goal:** Real-time typing indicators and read receipts
- **Files:** `components/chat/CustomChatInterface.tsx`, `components/chat/BrokerProfile.tsx`, tests
- **Features:** Subscribe to typing/read events, emit when customer types, update UI state
- **Tests:** Verify indicator reflects events, read receipts update timestamp
- **Reference:** `docs/runbooks/chat/realtime-implementation-guide.md#typing-indicators`

### Task 2.2 – Quick-reply chips & analytics

- **Goal:** Dynamic suggestions based on persona/context
- **Files:** `components/chat/SuggestionChips.tsx`, `app/api/chat/suggestions/route.ts`, tests
- **Features:** API returns persona-scoped suggestions, clicking emits analytics event
- **Tests:** API test for default/persona variants, component test for click behavior
- **Reference:** `docs/runbooks/chat/realtime-implementation-guide.md#quick-reply-chips`

### Task 2.3 – Accessibility & mobile polish

- **Goal:** ARIA roles, high-contrast support, responsive layouts
- **Files:** `components/chat/CustomChatInterface.tsx`, `components/chat/ChatLayoutShell.tsx`, global styles
- **Features:** ARIA roles (log, live, button labels), keyboard nav, reconnection banner, 320/360/390px testing
- **Tests:** React Testing Library ARIA assertions, Playwright responsive snapshots
- **Reference:** `docs/runbooks/chat/realtime-implementation-guide.md#accessibility`

### Task 2.4 – Broker dashboard parity

- **Goal:** Broker sees customer typing, SLA countdown, resume events
- **Files:** Identify broker dashboard module, add Ably subscription similar to customer hook
- **Tests:** Unit tests for dashboard updates, manual dual-browser QA
- **Reference:** `docs/runbooks/chat/realtime-implementation-guide.md#client-side-subscription`

### Task 2.5 – Documentation updates

- **Files:** `docs/runbooks/AI_BROKER_COMPLETE_GUIDE.md`, `docs/runbooks/testing/QUICK_START_AI_TEST.md`
- **Content:** Add real-time sections, testing checklists, fallback procedures
- **New file:** `docs/runbooks/chat/ably-oncall-checklist.md` (monitoring/escalation playbook)

**Stage 2 Exit Criteria:**
- [ ] Typing/read presence live on customer + broker UIs
- [ ] Quick suggestions dynamic with analytics
- [ ] Accessibility and responsive requirements met
- [ ] Documentation updated
- [ ] All tests pass

---

## Stage 3 – AI Orchestration & Observability

### Task 3.1 – Worker context hydration from Redis/Supabase

- **Goal:** AI receives conversation history for context-aware responses
- **Files:** `lib/queue/broker-worker.ts`, `lib/chat/context-loader.ts`, tests
- **Implementation:** Fetch recent events from Redis (fallback to Supabase), merge with form data, pass to AI
- **Tests:** Unit tests with sample Redis/Supabase data, integration test verifying AI receives history
- **Reference:** `docs/runbooks/data/chat-event-mirroring.md#redis-integration`

### Task 3.2 – Compliance scaffolding & SLA-aware AI prompts

- **Goal:** Prepend compliance opener, modify prompts when SLA triggered
- **Files:** `lib/ai/broker-ai-service.ts`, tests
- **Implementation:** Inject compliance template per persona, adjust prompt on SLA warning, log response metadata
- **Tests:** Assert compliance text prepended, validate SLA-influenced prompts, mock AI for deterministic outputs

### Task 3.3 – Analytics API & dashboards

- **Goal:** Live chat metrics for internal monitoring
- **Files:** `app/api/analytics/chat/live/route.ts`, `lib/analytics/chat-live.ts`, tests
- **Implementation:** Aggregate active conversations from Redis, calculate P50/P95 response times, SLA breach counts
- **Tests:** Unit test aggregator, integration test with mocked services
- **Reference:** See performance monitoring patterns in existing codebase

### Task 3.4 – Monitoring hooks

- **Goal:** Automated alerts for Ably health and SLA violations
- **Files:** `scripts/monitor-performance.ts`, `scripts/run-sla-smoke-tests.ts`, `lib/monitoring/alert-service.ts`
- **Implementation:** Monitor Ably connection health, message backlog, SLA violations; emit to Slack/email
- **Tests:** Unit tests for monitoring logic, manual script runs documented in `validation-reports/`
- **Reference:** `docs/runbooks/chat/realtime-implementation-guide.md#monitoring`

**Stage 3 Exit Criteria:**
- [ ] Worker pulls context from Redis/Supabase
- [ ] Compliance scaffold and SLA prompts implemented
- [ ] Analytics API returns expected metrics
- [ ] Monitoring scripts support Ably + SLA
- [ ] All automated tests + linting pass

---

## Testing Strategy

**TDD Workflow:** Write failing test → See it fail → Implement → Pass → Refactor

**Test Types:**
- **Unit:** Every helper/hook (mock dependencies)
- **Integration:** API routes, worker flows (use existing `tests/integration` structure)
- **E2E:** Dual-browser (customer + broker), mobile viewports, network throttle
- **Performance:** `npm run test:sla-validation` - confirm P95 <5s for 10 sample chats

**CI Commands:**
```bash
npm run lint && npm run lint:all && npm test && npm run test:integration
```

**Reference:** `docs/runbooks/chat/realtime-implementation-guide.md#testing-strategy`

---

## Deployment & Rollout

**Feature Flag:** `ENABLE_ABLY_REALTIME` (env var)

**Environments:**
- Dev → Staging (24h soak) → Production (gradual: 10% → 50% → 100%)

**Cutover:** Store flag in Supabase or env for per-conversation control

**Rollback:** Set flag to `false`, revert to polling endpoints

**Reference:** `docs/runbooks/chat/realtime-implementation-guide.md#deployment`

---

## Constraint Alignment

**Constraint A – Public Surface Readiness** (`docs/plans/re-strategy/strategy-alignment-matrix.md`)
- Real-time delivery, monitoring, and accessibility are required to meet Stage 0 chat SLA and observability requirements before launch gate clearance.
- Related CAN tasks: CAN-033 (chat event mirroring runbook - completed via this plan)

---

## Delivery Expectations

- **Incremental PRs:** One per task or tight cluster (no monolithic PRs)
- **PR Requirements:** Code + tests + docs, references task ID (e.g., "Stage1-Task1.3"), confirm lint/tests ran locally
- **Completion:** Update `docs/work-log.md` with summary, metrics, PR links; schedule demo with Brent (desktop + mobile + analytics dashboard walkthrough)

**Keep changes minimal.** Ask before deviating from plan. Loop in Brent for architectural changes.
