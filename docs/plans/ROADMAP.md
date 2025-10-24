ABOUTME: Constraint-based roadmap aligning execution to re-strategy priorities.
ABOUTME: Defines single critical path with measurable exits and guardrails.

# NextNest Constraint Roadmap

**Last Updated:** 2025-10-31  
**Status:** Constraint Phase A in progress  
**Vision:** Deliver mortgage transparency with an AI-assisted, human-led loop that wins by reliability, speed, and trust.

---

## Roadmap Philosophy

- **Single bottleneck at a time.** We apply Theory of Constraints: relieve the current choke point completely before activating the next.  
- **Re-Strategy is the source.** Every work item must trace back to a re-strategy part, the alignment matrix, and an active CAN task.  
- **Production bar only.** “Done” means code + tests + runbooks + documentation logging. Feature flags stay in place until exit criteria are satisfied.

Use this roadmap with `docs/plans/re-strategy/strategy-alignment-matrix.md` during weekly reviews. Status emojis: ⬜ not started · 🟡 in progress · ✅ complete · 🔴 blocked.

---

## Constraint Chain

### Constraint A – Public Surfaces Ready (🟡)
- **Bottleneck:** Stage 0 launch gate unmet; homepage, progressive form, and chat UI not yet aligned with brand canon or accessibility.  
- **Goal:** Ship a polished, accessible public experience that can accept production traffic.  
- **Critical Work Packages:**  
  - Homepage hero/trust strip rewrite (CAN-001, CAN-020) with updated voice guide (CAN-036).  
  - Progressive form UX + instant calc audit (active plan `2025-10-30-progressive-form-experience-implementation-plan.md`).  
  - Broker chat UX throughput and SLA verification (`mobile-ai-broker-ui-rebuild-plan.md`, SLA tests).  
  - Accessibility runbook + token cleanup (CAN-016, CAN-037).  
- **Dependencies:** Brand canon (Part 04), Stage 0 checklist, existing E2E suites.  
- **Exit Criteria:**  
  - Stage 0 checklist fully green with evidence logged in `stage0-launch-gate.md`.  
  - Lighthouse/PageSpeed: TTFB <2s, bundle <140KB, WCAG AA verified.  
  - `tests/e2e/chat-production-e2e.spec.ts` and `tests/e2e/step3-ux-report.spec.ts` pass on CI.  
  - Work log entry confirming Gate review.  
- **Status Notes:** Final copy + accessibility work outstanding. Weekly focus until ✅.

### Constraint B – Data In, Data Approved (⬜)
- **Bottleneck:** No production-grade rate ingestion or approval flow; transparency depends on guarded data.  
- **Goal:** Build the parser → guardrail → approval → notification → reconciliation system described in Part 01.  
- **Critical Work Packages:**  
  - External parser audit & migration (CAN-043, CAN-045; plan `2025-10-31-parser-crm-integration-plan.md`).  
  - Guardrail & contract test suite (`tests/rates/parser-contract.test.ts`).  
  - Ingestion API (`app/api/rates/ingest/route.ts`) and admin approval UI (`app/(admin)/rates/pending/page.tsx`).  
  - Notification + reconciliation script (`scripts/verify-rate-snapshot.ts`, CAN-050).  
  - Runbooks: `docs/runbooks/data/rate-parser.md`, `docs/runbooks/chat/rate-reveal-guide.md` (CAN-033, CAN-034).  
- **Dependencies:** Constraint A complete; supabase credentials validated.  
- **Exit Criteria:**  
  - All parser tests green with fixtures per bank.  
  - Approval dashboard writes to Supabase and Airtable with audit logging.  
  - Notifications fire with feature flag controlled roll-out.  
  - Reconciliation script logs differences and emails operators.  
  - Alignment matrix row flipped to 🟡 or ✅ with supporting evidence.

### Constraint C – Rhizome Lift-Off (⬜)
- **Bottleneck:** No programmatic SEO scaffolding; we cannot accumulate compounding traffic.  
- **Goal:** Stand up the lean PSEO engine with static/ISR pages, caching, and scripts.  
- **Critical Work Packages:**  
  - Scaffold directories (`content/prime-nodes`, `content/templates`, `content/generated`, `prompts/pseo`, `scripts/pseo`) – CAN-049.  
  - Runbook suite covering rhizome workflow, templates, query shaping, setup – CAN-040.  
  - Performance guardrails in CI (Lighthouse/Next analytics) – CAN-047.  
  - Edge caching documentation/config (Cloudflare/Vercel + Redis) – CAN-048.  
  - Publish first 5 Prime Nodes, 20-item idea backlog sourced from scenario data.  
- **Dependencies:** Constraint B delivering rate data summaries; Stage 0 surfaces stable.  
- **Exit Criteria:**  
  - Scripts (`npm run pseo:generate`, `npm run pseo:lint`, `npm run pseo:test`) added and passing.  
  - Pages deploy via SSG/ISR with caches verified (<2s TTFB).  
  - Runbooks provide repeatable workflow; tests ensure schema validity.  
  - Analytics dashboard shows traffic + conversion metrics hooked into Supabase.

### Constraint D – Close the Loop (⬜)
- **Bottleneck:** Scenario capture and follow-up automation are manual; without them we cannot scale operations.  
- **Goal:** Implement the minimum viable follow-up automation and Supabase scenario backbone, then iterate.  
- **Critical Work Packages:**  
  - Author ops runbooks (`scenario-retention`, `follow-up-playbook`, `automation-platform`, referral ops) – CAN-035, CAN-038, CAN-039, CAN-041.  
  - Build Supabase migrations for scenario tables, link to admin console (migrate CRM artefacts via CAN-046).  
  - Implement simple AI draft + human approval queue with feature flags.  
  - Extend SLA dashboard into scenario/admin console, tagging response-awareness.  
- **Dependencies:** Constraints A–C complete; parser data flowing into Supabase.  
- **Exit Criteria:**  
  - Follow-up automation behind guardrails, logging to `scenario_events`.  
  - Scenario admin console supports review/edit with audit trail.  
  - Supabase RLS and retention jobs validated.  
  - Response-awareness tags propagate into analytics.

---

## Active Plans

- `2025-10-30-progressive-form-experience-implementation-plan.md` → Constraint A  
- `mobile-ai-broker-ui-rebuild-plan.md` → Constraint A  
- `2025-10-31-parser-crm-integration-plan.md` → Constraint B (Stage A audit)  
- Additional plans must name their constraint row before approval.

---

## Metrics & Guardrails

- **Performance:** TTFB <2s, bundle <140KB gzipped, 95th percentile chat latency <5s.  
- **Reliability:** Supabase error rate <0.5%, parser reconciliation zero-drift tolerance.  
- **Output Tracking:** Work log entry per constraint exit, Stage 0 verification table updated, alignment matrix status maintained.

---

## Beyond Constraint D

Once Constraints A–D are ✅, revisit re-strategy Part 07 (referrals) and Part 08 (B2B readiness) with fresh capacity. Any future constraint must be documented here before work begins.

