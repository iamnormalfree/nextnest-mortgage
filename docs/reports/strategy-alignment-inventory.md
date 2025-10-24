ABOUTME: Running log of strategy alignment inventory for constraints and artefacts.
ABOUTME: Captures audited modules, documentation, and gaps before matrix rewrite.

# Strategy Alignment Inventory – 2025-10-31

## Constraint 1 – Public Surface Readiness (Stage 0 Gate)

**Re-Strategy References**
- `docs/plans/re-strategy/Part02-strategic-canon-and-launch-alignment.md` (Stage alignment map, Stage 0 checklist)
- `docs/plans/re-strategy/Part04-brand-ux-canon.md` (Brand canon requirements)
- `docs/plans/re-strategy/stage0-launch-gate.md` (Launch gate table)

**Canonical Components & Files**
- Homepage: `app/page.tsx`, `components/landing/*.tsx`, `components/layout/{ConditionalNav.tsx,Footer.tsx}`
- Progressive form: `components/forms/ProgressiveFormWithController.tsx`, `hooks/useProgressiveFormController.ts`
- Chat shell: `components/ai-broker/ResponsiveBrokerShell.tsx`, `components/chat/CustomChatInterface.tsx`
- Design tokens: `tailwind.config.ts` (note: purple tokens still referenced; CAN-016/037 pending)

**Tests & QA Assets**
- `tests/e2e/step3-ux-report.spec.ts`, `tests/e2e/chat-production-e2e.spec.ts`
- `tests/hooks/useProgressiveFormController.test.tsx`
- Lighthouse budgets not automated (future work under CAN-047)

**Runbooks / Docs**
- `docs/runbooks/brand/{messaging.md,copywriting-guide.md}` (needs update to new voice guide; CAN-036)
- ✅ Present: `docs/runbooks/forms/mobile-optimization-guide.md` (CAN-051 - completed 2025-10-31)
- ✅ Present: `docs/runbooks/AI_BROKER_COMPLETE_GUIDE.md` section 3.7 extended with activation procedures (2025-10-31)
- Missing: `docs/runbooks/design/accessibility-checklist.md` (CAN-037)
- Missing: updated `voice-and-tone` doc (CAN-036)

**Active Plans**
- `docs/plans/active/2025-10-21-ai-broker-chat-activation-plan.md` (refactored 2025-10-31, 215 lines)
- `docs/plans/active/2025-10-30-progressive-form-experience-implementation-plan.md`
- `docs/plans/active/mobile-ai-broker-ui-rebuild-plan.md`

**Gaps / Actions**
- Accessibility runbook absent → CAN-037.
- Voice guide not yet created → CAN-036.
- Tailwind still exports purple tokens; cleanup required (CAN-016).
- Need explicit homepage copy alignment task (tracked via CAN-001/CAN-020; ensure ownership).

---

## Constraint 2 – Rate Pipeline Reliability (Part 01 Stage 1)

**Re-Strategy References**
- `docs/plans/re-strategy/Part01-rate-transparency-integration-plan.md`
- Stage alignment map in Part 02.

**Current Code Artefacts**
- No `lib/parsers/rates/` directory yet.
- Existing rate logic in `lib/calculations/instant-profile.ts` (focused on eligibility, not bank ingestion).
- Ingestion/approval infrastructure absent (no `app/api/rates/` routes, no admin dashboard for rates).
- Notifications/reconciliation scripts missing.

**Tests**
- Calculation tests: `tests/calculations/instant-profile.test.ts`, `tests/dr-elena-v2-regulation.test.ts`
- No parser contract tests yet.

**Runbooks**
- ✅ Present: `docs/runbooks/data/chat-event-mirroring.md` (CAN-033 - completed 2025-10-31)
- ✅ Present: `docs/runbooks/chat/realtime-implementation-guide.md` (comprehensive Ably guide, created 2025-10-31)
- Missing: `docs/runbooks/data/rate-parser.md` (CAN-034 pending)
- Missing: `docs/runbooks/chat/rate-reveal-guide.md` (CAN-034 pending)

**Active Plans**
- None specific beyond re-strategy; new plan `2025-10-31-parser-crm-integration-plan.md` (audit stage).

**Gaps / Actions**
- Parser modules absent; external audit required (CAN-043).
- Guardrail implementation and tests missing.
- Admin dashboard for approvals not present.
- Reconciliation job absent.

---

## Constraint 3 – PSEO Foundation (Part 06 Stage 0)

**Re-Strategy References**
- `docs/plans/re-strategy/Part06-pseo-rhizome-system.md`

**Current Code Artefacts**
- No `content/` directory.
- No `prompts/pseo/`, `scripts/pseo/`.
- Next.js routing currently lacks MDX pipeline for programmatic content.

**Runbooks**
- Missing: `docs/runbooks/content/pseo-rhizome-playbook.md`, `template-library.md`, `query-shaping.md`, `pseo-setup.md` (CAN-040).
- Edge caching runbook absent (CAN-048).

**Tests**
- No PSEO-specific tests/scripts in package.json.

**Gaps / Actions**
- Scaffold directories (CAN-049).
- Add performance checks (CAN-047).
- Create runbooks before code lands (CAN-040/CAN-048).

---

## Constraint 4 – Ops Automation & Scenario Backbone Rotation

**Re-Strategy References**
- `docs/plans/re-strategy/Part03-scenario-database-system.md`
- `docs/plans/re-strategy/Part05-client-controlled-contact.md`

**Current Code Artefacts**
- Supabase migrations minimal (`supabase/migrations/20251012045549_add_broker_availability_fields.sql` only).
- Partial admin tooling: `components/admin/PerformanceDashboard.tsx` plus `app/api/admin/performance-analysis/route.ts` cover SLA monitoring but not scenario approvals.
- Follow-up automation code not present; `lib/analytics/`, `lib/engagement/` contain some scaffolding but not the required flows.

**Tests**
- No tests for scenario capture or follow-up automation.

**Runbooks**
- Missing: `docs/runbooks/data/scenario-retention.md` (CAN-035).
- Missing: `docs/runbooks/operations/follow-up-playbook.md` (CAN-038).
- Missing: `docs/runbooks/engineering/automation-platform.md` (CAN-039).
- Ops referral runbooks not yet created (CAN-041).

**Active Plans**
- None focused on scenario/follow-up yet; rely on backlog.

**Gaps / Actions**
- Need Supabase schema migrations per Part 03.
- Admin console components to be created.
- Follow-up automation to be implemented with feature flags.
- Runbooks to be authored before coding.

---

## Cross-Cutting Observations

- `CLAUDE.md` and `AGENTS.md` already have extensive edits pending; coordination required when updating strategy guidance.
- `CANONICAL_REFERENCES.md` updated (purple tokens note), but rate pipeline entries still absent; update once modules land.
- `docs/work-log.md` contains recent entries documenting alignment progress—continue logging after each major step.
- Active plan audit on 2025-10-24 added Constraint Alignment sections; no contradictions with current matrix rows identified.

---

*Last updated: 2025-10-31*
