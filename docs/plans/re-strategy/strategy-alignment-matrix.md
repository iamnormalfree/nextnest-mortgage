ABOUTME: Alignment matrix linking re-strategy constraints to roadmap, docs, and code.
ABOUTME: Serves as weekly review artifact for constraint-driven execution.

# Strategy Alignment Matrix

## Overview

This matrix centralizes every active constraint defined in the re-strategy suite. Each row captures the authoritative references (plans, runbooks, code, tests) that must stay in sync. Use it during weekly reviews and before drafting any new plan or implementation work. Status cells should be updated as work progresses (⬜ pending, 🟡 in progress, ✅ complete, 🔴 blocked).

## How to Use

1. Start each planning session here; identify the highest-priority constraint with outstanding items.
2. Trace the row to find relevant documents, code modules, and CAN tasks.
3. When implementation completes, update status and log evidence in `docs/work-log.md` and `stage0-launch-gate.md` (for Constraint 1).
4. If a row references missing assets, ensure the corresponding CAN task is owned and scheduled.

## Constraint Map

| Constraint | Re-Strategy Sources | Roadmap Phase | Canonical Files | Runbooks | Active Plans | Code Modules / Tests | CAN Tasks | Status |
|------------|--------------------|---------------|-----------------|----------|--------------|----------------------|-----------|--------|
| **C1: Public Surface Readiness**<br/>Stage 0 Launch Gate (homepage, form, chat, accessibility) | - Part02 §Stage Alignment Map<br/>- Part04 Brand & UX Canon<br/>- Stage0 Launch Gate doc | **Phase A** – "Public Surfaces Ready" | - `app/page.tsx`<br/>- `components/landing/*.tsx`<br/>- `components/forms/ProgressiveFormWithController.tsx`<br/>- `hooks/useProgressiveFormController.ts`<br/>- `components/ai-broker/ResponsiveBrokerShell.tsx`<br/>- `tailwind.config.ts` (brand tokens) | - `docs/runbooks/brand/messaging.md`<br/>- `docs/runbooks/brand/copywriting-guide.md`<br/>- ✅ `docs/content/voice-and-tone.md` (CAN-036 complete)<br/>- ✅ `docs/test-reports/2025-10-29-accessibility-audit-can-037.md` (CAN-037 complete) | - ✅ Progressive form plan (archived 2025-10-24)<br/>- `mobile-ai-broker-ui-rebuild-plan.md` | - `tests/e2e/step3-ux-report.spec.ts`<br/>- `tests/e2e/chat-production-e2e.spec.ts`<br/>- `tests/hooks/useProgressiveFormController.test.tsx`<br/>- `tests/calculations/instant-profile.test.ts` (28/28 passing)<br/>- ✅ `tests/e2e/accessibility-audit.spec.ts` (13/13 WCAG 2.1 AA) | CAN-001, CAN-016, CAN-017, CAN-020, CAN-036, CAN-037 | 🟡 |
| **C2: Rate Pipeline Reliability**<br/>Part01 Stage 1 (parser → guardrails → approval → notification → reconciliation) | - Part01 Rate Transparency Plan<br/>- Part02 §Stage Alignment Map | **Phase B** – “Data In, Data Approved” | - ⬜ `lib/parsers/rates/*` (to be migrated)<br/>- `lib/calculations/instant-profile.ts` (current stopgap)<br/>- ⬜ `app/api/rates/ingest/route.ts`<br/>- ⬜ `app/(admin)/rates/pending/page.tsx`<br/>- ⬜ `scripts/verify-rate-snapshot.ts` | - ⬜ `docs/runbooks/data/rate-parser.md` (CAN-033)<br/>- ⬜ `docs/runbooks/chat/rate-reveal-guide.md` (CAN-034) | - `2025-10-31-parser-crm-integration-plan.md` (Stage A) | - `tests/calculations/instant-profile.test.ts`<br/>- `tests/dr-elena-v2-regulation.test.ts`<br/>- ⬜ `tests/rates/parser-contract.test.ts` | CAN-006, CAN-008, CAN-033, CAN-034, CAN-043, CAN-045, CAN-050 | ⬜ |
| **C3: PSEO Foundation**<br/>Part06 Stage 0 (content scaffolding, performance budgets, caching) | - Part06 Programmatic SEO Plan | **Phase C** – “Rhizome Lift-Off” | - ⬜ `content/prime-nodes/`<br/>- ⬜ `content/templates/`<br/>- ⬜ `content/generated/`<br/>- ⬜ `prompts/pseo/`<br/>- ⬜ `scripts/pseo/` | - ⬜ `docs/runbooks/content/pseo-rhizome-playbook.md`<br/>- ⬜ `docs/runbooks/content/template-library.md`<br/>- ⬜ `docs/runbooks/content/query-shaping.md`<br/>- ⬜ `docs/runbooks/content/pseo-setup.md` (CAN-040)<br/>- ⬜ `docs/runbooks/devops/pseo-edge-caching.md` (CAN-048) | - None yet (to be drafted after constraint sign-off) | - ⬜ PSEO lint/test scripts (package.json) (CAN-047)<br/>- ⬜ Lighthouse budget checks (CI) | CAN-005, CAN-040, CAN-047, CAN-048, CAN-049 | ⬜ |
| **C4: Ops Automation & Scenario Backbone**<br/>Part03 Stage 0 + Part05 Stage 0 (follow-up loop & Supabase scenario system) | - Part03 Scenario Database System<br/>- Part05 Client-Controlled Contact Plan | **Phase D** – “Close the Loop” | - `components/admin/PerformanceDashboard.tsx` (partial SLA tooling)<br/>- ⬜ Scenario admin console (`app/(admin)/scenarios/...`)<br/>- `app/api/admin/performance-analysis/route.ts`<br/>- ⬜ Supabase migrations for scenario tables | - ⬜ `docs/runbooks/data/scenario-retention.md` (CAN-035)<br/>- ⬜ `docs/runbooks/operations/follow-up-playbook.md` (CAN-038)<br/>- ⬜ `docs/runbooks/engineering/automation-platform.md` (CAN-039)<br/>- ⬜ `docs/runbooks/ops/{airtable-schema.md, referral-playbook.md, partner-care.md}` (CAN-041) | - None yet (to be created when work begins) | - ⬜ Follow-up tests (unit/integration)<br/>- ⬜ Supabase migration tests<br/>- Existing analytics scripts under review | CAN-035, CAN-038, CAN-039, CAN-041, CAN-046 | ⬜ |

Legend: ⬜ Not started · 🟡 In progress · ✅ Complete · 🔴 Blocked

---

*Last updated: 2025-10-29* (CAN-037 accessibility audit complete - 13/13 WCAG 2.1 AA tests passing)
