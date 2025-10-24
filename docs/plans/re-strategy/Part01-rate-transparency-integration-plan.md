ABOUTME: Full implementation blueprint for rate transparency experience with guarded data flow.
ABOUTME: Guides engineers through ingestion, QA, UI reveal, heuristics, and monitoring.

# Rate Transparency Integration Implementation Plan

---
title: "Rate Transparency Integration"
status: active
owner: engineering
priority: high
created: 2025-10-22
estimated_effort: 7-9 engineering days
dependencies:
  - docs/strategy_integration/nn-deep-research.md
  - docs/strategy_integration/rates-comparison/end-to-end-packages-comparison.md
  - docs/strategy_integration/rates-comparison/organic-version.md
  - docs/plans/active/2025-10-22-ai-broker-realtime-upgrade-plan.md
---

## 0. Orientation

- **Repo setup**
  - Run `npm install` in project root before touching code.
  - Copy `.env.local.example` to `.env.local`; populate Supabase, Airtable, Ably, Redis, and Chatwoot variables. Never commit secrets.
  - Start `npm run dev` once to ensure App Router boots without errors.
  - Read `docs/ROOT_DIRECTORY_GUIDE.md` and `docs/KNOWN_ISSUES.md` for project layout and existing footguns.

- **Working conventions**
  - TDD always: write failing test → implement → re-run until green → refactor.
  - Keep commits minimal (one logical change). Reference Stage/Task in commit messages (e.g., `Stage1-Task1.2: add guardrail checks`).
  - Match surrounding code style; rely on ESLint/Prettier via `npm run lint`.
  - Log decisions and surprises in `docs/work-log.md` at the end of each day.

- Review the strategy docs above plus:
  - `lib/ai/broker-ai-service.ts`
  - `lib/ai/intent-router.ts`
  - `lib/queue/broker-worker.ts`
  - `components/chat/CustomChatInterface.tsx`
  - `app/chat/page.tsx`
  - `app/api/contact/route.ts` (form submission flow)
  - `docs/runbooks/AI_BROKER_COMPLETE_GUIDE.md`
- Refresh parser context:
  - `docs/strategy_integration/rates-comparison/end-to-end-packages-comparison.md`
  - any existing scripts under `scripts/rates/` (create if absent).
- Confirm Supabase credentials and Airtable access are available before coding.

## 1. Milestones Overview

| Stage | Goal | Key Deliverables |
|-------|------|------------------|
| Stage 1 | Harden ingestion & approval pipeline | Automated WhatsApp parsing, guardrails, approval dashboard, Supabase snapshot |
| Stage 2 | Customer experience (gateway + chat reveal) | Form gateway card, AI-triggered reveal UX, mobile bottom sheet, analytics logging |
| Stage 3 | Heuristics & monitoring | Rate-shopper rules, response-awareness tags, dashboards, reconciliation jobs |

Work sequentially; do not skip ahead without clearance. TDD for every change.

---

## Stage 1 – Data Ingestion, Guardrails & Approval Workflow

### Task 1.1 – Parser consolidation & fixtures
- **Files**
  - `lib/parsers/rates/index.ts` (create if missing)
  - `lib/parsers/rates/banks/*.ts`
  - `lib/parsers/rates/__fixtures__/*.json`
  - `tests/rates/parser-contract.test.ts`
- **Steps**
  1. Extract existing parser logic into `lib/parsers/rates/`.
  2. Add canonical fixtures per bank (from strategy doc) with expected normalized output.
  3. Write contract tests asserting JSON equality for each fixture.
  4. Add schema types (Zod) for `MortgagePackage` and `BankMessage`.
- **Tests:** `npm run test -- tests/rates/parser-contract.test.ts`. Must fail when parser drifts.
- **Docs:** Update `docs/runbooks/data/chat-event-mirroring.md` or create `docs/runbooks/data/rate-parser.md`.

### Task 1.2 – Guardrails & response-awareness metadata
- **Files**
  - `lib/parsers/rates/guardrails.ts` (new)
  - `lib/parsers/rates/__tests__/guardrails.test.ts`
- **Steps**
  1. Implement schema validation (Zod) verifying required fields, acceptable ranges.
  2. Implement LCL comparison: ensure unchanged packages retain prior values.
  3. Add semantic checks (spread within configured bounds per bank).
  4. Return structured failure reasons for the approval dashboard.
- **Tests:** Add unit coverage for pass/fail scenarios.

### Task 1.3 – Ingestion service & Airtable integration
- **Files**
  - `app/api/rates/ingest/route.ts` (new API triggered by WhatsApp webhook)
  - `lib/rates/ingestion-service.ts`
  - `lib/rates/__tests__/ingestion-service.test.ts`
- **Steps**
  1. Accept payload (bank tag, raw message, bank metadata).
  2. Run classifier → parser → guardrails.
  3. Write pending row to Airtable with status `pending`, include hash and diff snapshot.
  4. Log `ingestion_events` in Supabase for audit.
- **Tests:** Integration test mocking Airtable client and verifying pending row creation.
- **Docs:** Update `docs/runbooks/chatops/webhook-disable-procedure.md` to include new route.

### Task 1.4 – Approval dashboard (in-app)
- **Files**
  - `app/(admin)/rates/pending/page.tsx` (new admin route)
  - `lib/rates/approval-service.ts`
  - `components/admin/RatesDiffCard.tsx`
  - Tests under `app/(admin)/rates/__tests__/pending.test.tsx`
- **Steps**
  1. Display pending entries with summary (diff, source hash, guardrail notes).
  2. Approve button writes normalized data to Supabase tables (`rate_packages`, `rate_ranges`, `rate_audit`) and flips Airtable status.
  3. Reject button sets status `needs_review`, stores failure reason.
  4. Protect route with existing admin middleware (or add new guard).
- **Tests:** Component tests for rendering, action tests for approve/reject.

### Task 1.5 – Messaging notifications
- **Files**
  - `lib/notifications/notifier.ts`
  - `app/api/rates/notify/route.ts` (if using webhooks)
- **Steps**
  1. Integrate existing WhatsApp/Telegram webhook (e.g., Twilio/Telegram Bot) to send summary message with deep link.
  2. Trigger notifications on new pending entry creation.
- **Tests:** Unit test verifying payload formatting; manual end-to-end to confirm message receipt.

### Task 1.6 – Daily reconciliation job
- **Files**
  - `scripts/verify-rate-snapshot.ts`
  - `package.json` scripts entry.
- **Steps**
  1. Reparse last 24h of messages.
  2. Compare outputs with Supabase snapshot (checksum).
  3. Email digest if differences detected (reuse existing mailer) and log in `rate_audit`.
- **Tests:** Integration test with mocked Supabase/Airtable clients.
- **Docs:** Append instructions to `docs/runbooks/data/rate-parser.md`.

---

## Stage 2 – Customer Experience & Reveal Logic

### Task 2.1 – Form gateway market snapshot
- **Files**
  - `app/apply/page.tsx` or relevant layout step (confirm actual location of gateway)
  - `components/forms/MarketSnapshotCard.tsx` (new)
  - `app/api/rates/summary/route.ts` (returns SORA prints + anonymized ranges)
- **Steps**
  1. Fetch Supabase-published ranges and current SORA from data source (existing or new table).
  2. Render card with macro headline (current SORA, # of competitive packages) + “See market context” link.
  3. Show two or three range pills with bullet rationales.
  4. Include disclaimer about human confirmation.
- **Tests:** Component tests for rendering; integration test ensuring API returns sanitized data.

### Task 2.2 – Rate reveal panel (desktop sidebar)
- **Files**
  - `components/chat/InsightsSidebar.tsx`
  - `components/chat/RateRevealPanel.tsx` (new)
- **Steps**
  1. Add hidden panel state that becomes visible on reveal.
  2. Populate with the same anonymized ranges + CTA (“Speak with Michelle to lock an offer”).
  3. Ensure existing insights remain accessible when panel closed.
- **Tests:** Extend chat component tests to assert reveal toggling works.

### Task 2.3 – Mobile bottom sheet
- **Files**
  - `components/chat/RateRevealSheet.tsx` (new)
  - `components/chat/__tests__/RateRevealSheet.test.tsx`
- **Steps**
  1. Implement bottom sheet using existing design tokens (Tailwind + shadcn dialog).
  2. Ensure accessible focus trap, close controls, and disclaimers.
  3. Sync content with desktop panel (reuse same data fetch hook).
- **Tests:** Component tests verifying open/close, content, and ARIA roles.

### Task 2.4 – AI broker trigger & messaging
- **Files**
  - `lib/ai/broker-ai-service.ts`
  - `lib/ai/intent-router.ts` (add new intent)
  - `lib/ai/__tests__/broker-ai-service.test.ts`
  - `components/chat/CustomChatInterface.tsx` (to handle reveal event)
- **Steps**
  1. Add new intent classification for “rates inquiry”.
  2. When heuristics allow, AI crafts message (“I’ve just pulled today’s indicative ranges…”).
  3. Emit Ably event (from real-time plan) `rate_reveal` with anonymized data.
  4. Frontend listens for event and opens panel/sheet once per session.
  5. Log reveal in Supabase (`rate_reveal_events`).
- **Tests:** Unit tests verifying AI message includes explanation; integration tests with mocked Ably event.

### Task 2.5 – One-shot reveal enforcement
- **Files**
  - `lib/chat/session-flags.ts` (new helper)
  - `lib/chat/__tests__/session-flags.test.ts`
- **Steps**
  1. Track reveal status in Redis/session storage and Supabase.
  2. Prevent repeated reveals; AI responds with human handoff prompt if requested again.
- **Tests:** Ensure state persists across message polling and refresh.

### Task 2.6 – Analytics logging
- **Files**
  - `lib/analytics/rate-reveal.ts`
  - `app/api/analytics/rates/reveal/route.ts`
- **Steps**
  1. Record reveal metadata (lead ID, heuristics triggered, packages shown) in Supabase.
  2. Provide API for dashboards to query conversion funnel impact.
- **Tests:** Integration tests verifying logging occurs exactly once per reveal.

---

## Stage 3 – Heuristics, Monitoring & Iterative Feedback

### Task 3.1 – Rate shopper heuristics
- **Files**
  - `lib/ai/response-awareness/tags.ts`
  - `lib/ai/__tests__/response-awareness-tags.test.ts`
  - `lib/chat/rate-shopper-detector.ts` (new)
- **Steps**
  1. Implement rule set: low lead score, repetitive rate phrases, parallel sessions.
  2. Expose `isRateShopper` flag to AI orchestrator.
  3. If true, AI skips reveal and suggests human follow-up.
- **Tests:** Cases for each heuristic; integration test showing flag prevents reveal.

### Task 3.2 – Response-awareness logging
- **Files**
  - `lib/ai/response-awareness/ledger.ts`
  - `lib/ai/__tests__/ledger.test.ts`
- **Steps**
  1. Tag conversations with metadata (#rates_inquiry, #rate_shopper).
  2. Store tags alongside existing response-awareness data.
- **Tests:** Ensure tags append correctly and survive multiple turns.

### Task 3.3 – Monitoring dashboards
- **Files**
  - `app/(admin)/analytics/rates/page.tsx`
  - `lib/analytics/rates-dashboard.ts`
- **Steps**
  1. Display reveal counts, conversion outcomes, rate-shopper incidence.
  2. Highlight parser rejection rates and manual audit results.
- **Tests:** Component tests with mocked data.

### Task 3.4 – Automation for manual sampling
- **Files**
  - `scripts/rates/manual-sample.ts`
  - Add cron note to `docs/runbooks/data/rate-parser.md`.
- **Steps**
  1. Randomly pick 5 approved entries daily, email list for manual review.
  2. Provide CLI to mark sample as pass/fail, stored in Supabase.
- **Tests:** Unit tests for sampling logic.

---

## Testing & Validation Summary

- **Automated**
  - `npm run lint`
  - `npm test`
  - `npm run test:integration`
  - New parser contract tests must run in CI.
- **Manual QA**
  - Desktop + mobile chat reveal.
  - Gateway card visual check.
  - WhatsApp/Telegram notifications and approval flow.
  - Rate shopper scenarios (with/without reveal).
- **Load/Resilience**
  - Simulate burst of ingestions via script feeding fixtures.
  - Verify reconciliation job catches intentional drift.

---

## Documentation Deliverables

- Update or create:
  - `docs/runbooks/data/rate-parser.md` – parser, guardrails, reconciliation.
  - `docs/runbooks/chat/rate-reveal-guide.md` – how the reveal works, operations steps.
  - `docs/runbooks/testing/QUICK_START_AI_TEST.md` – add rate reveal test cases.
  - `docs/work-log.md` – append progress notes per stage.

---

## Stage Exit Checklists

**Stage 1**
- [ ] Parser fixtures/tests green for all banks.
- [ ] Guardrails rejecting invalid data.
- [ ] Ingestion writes to Airtable pending queue.
- [ ] Approval dashboard operational; Supabase snapshot updated.
- [ ] Notifications sending summaries.
- [ ] Reconciliation script running via cron/manual.

**Stage 2**
- [ ] Gateway card live with macro headline.
- [ ] Chat reveal works on desktop (sidebar) and mobile (bottom sheet).
- [ ] AI broker triggers reveal once with explanatory message.
- [ ] Rate-shopper leads skip reveal and push to human.
- [ ] Supabase logging of reveals verified.

**Stage 3**
- [ ] Heuristic detector integrated and logged.
- [ ] Response-awareness tags recorded.
- [ ] Analytics dashboard surfaces key metrics.
- [ ] Manual sampling workflow operational.

---

## Rollout Guidance

1. Feature flag `ENABLE_RATE_REVEAL` controlling the customer experience.
2. Launch sequence:
   - Deploy Stage 1 to staging; run parser fixtures + manual audits.
   - Enable reveal flag for internal accounts first.
   - Once parser error rate at 0% for 7 consecutive days, expand to production (10% traffic), then 100%.
3. Rollback plan:
   - Disable feature flag, revert to existing chat behavior.
   - Supabase snapshot remains intact; ingestion can continue while UI is off.

Maintain minimal diff commits, request review for each stage, and keep Brent informed of any deviations.
