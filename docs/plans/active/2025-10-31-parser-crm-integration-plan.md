ABOUTME: Migrates external rate parser and CRM assets into NextNest with staged audits.
ABOUTME: Defines audit, decision, and integration tasks that respect re-strategy constraints.

# Parser & CRM Integration Initiative

---
title: "External Assets Integration"
status: draft
owner: engineering
created: 2025-10-31
dependencies:
  - docs/plans/re-strategy/Part01-rate-transparency-integration-plan.md
  - docs/plans/re-strategy/Part03-scenario-database-system.md
  - docs/plans/re-strategy/stage0-launch-gate.md
---

## Context

We have partially built assets outside this repo:
- Parser repo: `PackagesBrowser` (C:\Users\HomePC\Desktop\Code\PackagesBrowser)
- CRM repo: `MortgageCrafter` (C:\Users\HomePC\Desktop\Code\MortgageCrafter)

Goal: harvest viable modules into the canonical NextNest codebase without derailing current constraints. Work only proceeds when it does not block Stage 0 readiness (Constraint 1). Parser migration aligns with Constraint 2; CRM migration aligns with Part 03 once parser tasks are stable.

## Stage A – Audit & Decision (non-blocking)

1. **Snapshot & Inventory (Parser)**
   - Export dependency list, build scripts, and key modules (`src/`, `__fixtures__/`).
   - Record current test coverage and outstanding issues.
   - Deliverable: `docs/reports/parser-audit-2025-10.md`.

2. **Snapshot & Inventory (CRM)**
   - Document data models, auth flows, and Supabase/Drizzle usage.
   - Identify overlap with Part 03 schema and admin UI requirements.
   - Deliverable: `docs/reports/crm-audit-2025-10.md`.

3. **Integration Decision Review**
   - Compare audits against re-strategy specs.
   - Flag items that would interfere with active constraints (Stage 0 tasks). Defer anything that conflicts.
   - Update `docs/plans/re-strategy/backlog/master-task-list.csv` with resulting CAN tasks.

## Constraint Alignment

- Constraint B – Data In, Data Approved (`docs/plans/re-strategy/strategy-alignment-matrix.md`, C2): Parser migration feeds the Stage 1 rate transparency system and delivers ingestion, guardrail, and reconciliation capabilities required before exposing data publicly.
- Constraint D – Close the Loop (`docs/plans/re-strategy/strategy-alignment-matrix.md`, C4): CRM integration steps are deferred until parser work stabilizes so the scenario backbone can extend without blocking the Stage 0 launch gate.

## Stage B – Parser Migration Path (runs after Constraint 1 cleared)

4. **Module Extraction Planning**
   - Map parser modules → target locations (`lib/parsers/rates/`, `tests/rates/`).
   - Define fixture format compatible with Part 01 contract tests.

5. **Incremental Integration**
   - Import core parser logic behind feature flag.
   - Port existing fixtures/tests; rewrite to match NextNest testing stack (Jest/PNPM).
   - Create runbook `docs/runbooks/data/rate-parser.md` before enabling feature flag.

6. **Operational Hooks**
   - Wire ingestion service, guardrails, and reconciliation scripts to new parser modules.
   - Validate via `npm run test -- tests/rates/parser-contract.test.ts` and manual fixture replay.

## Stage C – CRM Migration Path (runs after parser integration stabilized)

7. **Schema Alignment**
   - Translate CRM schema into Supabase migrations defined in Part 03.
   - Ensure consent/retention hooks match Stage 0 requirements.

8. **Admin Console Integration**
   - Port usable UI components into `components/admin/`; align with scenario console patterns.
   - Update or author runbooks (`docs/runbooks/data/scenario-retention.md`, `docs/runbooks/ops/airtable-schema.md`) before exposing features.

9. **Decommission External Repos**
   - Archive migrated modules in source repos with references back to NextNest.
   - Document final status in `docs/reports/parser-crm-migration-log.md`.

## Guardrails

- Abort or pause any task that threatens Stage 0 readiness; revisit during weekly constraint review.
- All migrations follow TDD; parity tests must pass in NextNest before removing external dependencies.
- Update `CANONICAL_REFERENCES.md` only after modules are adopted and runbooks published.
- Update `CLAUDE.md` and `AGENTS.md` once alignment initiative is complete to reflect the single-source workflow.
