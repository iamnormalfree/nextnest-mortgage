ABOUTME: End-to-end implementation plan aligning all tiers to re-strategy constraints.
ABOUTME: Guides engineers through documentation, roadmap, and tooling updates with rigorous QA.

# Strategy Alignment Implementation Plan

---
title: "Strategy Alignment Execution Plan"
status: draft
owner: engineering
created: 2025-10-31
---

## 0. Prerequisites & Orientation

1. **Read First**
   - `docs/plans/re-strategy/Part01-rate-transparency-integration-plan.md`
   - `docs/plans/re-strategy/Part02-strategic-canon-and-launch-alignment.md`
   - `docs/plans/re-strategy/stage0-launch-gate.md`
   - `CANONICAL_REFERENCES.md`
   - `docs/plans/ROADMAP.md` (existing version)
   - `CLAUDE.md` and `AGENTS.md`
2. **Environment Setup**
   - Ensure Node 18.x, pnpm/npm tooling installed.
   - Run `npm install` in repo root.
3. **Testing Baseline**
   - Execute `npm run lint` and `npm test` to confirm clean slate.
4. **Version Control Discipline**
   - Work on feature branch `strategy-alignment/<initials>-<date>`.
   - Commit after each major subsection (e.g., matrix draft, roadmap update).

## 1. Artifact Inventory & Gap Analysis

### ✅ Task 1.1 – Catalogue Canonical & Plan References
- Files to inspect:
  - `CANONICAL_REFERENCES.md`
  - `docs/plans/ROADMAP.md`
  - `docs/plans/re-strategy/Part0*.md` (Parts 01–08)
  - `docs/plans/active/*.md`
  - `docs/runbooks/**`
- Deliverable: short notes in `docs/reports/strategy-alignment-inventory.md` summarizing current state (existing, missing, conflicting).
- Testing: none (documentation only).

### ✅ Task 1.2 – Confirm Backlog Coverage
- Open `docs/plans/re-strategy/backlog/master-task-list.csv`.
- Verify CAN-033…CAN-048 exist; note missing owners/dates.
- Record gaps in the same inventory report.

## 2. Strategy Alignment Matrix

### ✅ Task 2.1 – Create Matrix Skeleton
- New file: `docs/plans/re-strategy/strategy-alignment-matrix.md`.
- Sections: Overview, How to read, Table with columns (Constraint, Re-Strategy Sources, Roadmap Phase, Canonical Files, Runbooks, Active Plans, Code Modules/Tests, CAN Tasks, Status).
- Reference links should be relative (e.g., `Part02-strategic-canon-and-launch-alignment.md#stage-alignment-map`).
- Testing: `npm run lint` (covers markdown formatting via existing tooling).

### ✅ Task 2.2 – Populate Constraint Rows
- Fill rows for:
  1. Public Surface Readiness (Stage 0 gate).
  2. Rate Pipeline Reliability.
  3. PSEO Foundation.
  4. Ops Automation & Scenario Backbone (rotation).
- Include CAN task IDs, key code modules (e.g., `components/landing/HeroSection.tsx`, existing rate logic in `lib/calculations/`, note missing `content/` scaffold with backlog reference), and test expectations.
- Update `docs/work-log.md` with a summary entry once draft complete.

### ✅ Task 2.3 – Validate Code Artefacts
- For each matrix row, confirm referenced modules/tests exist today. Example checks:
  - Public surfaces: `components/landing/*.tsx`, `components/forms/ProgressiveFormWithController.tsx`, `components/ai-broker/ResponsiveBrokerShell.tsx`.
  - Rate pipeline: document current location of rate parsing/calculation code in `lib/calculations/instant-profile.ts` and note gaps for future modules.
  - PSEO foundation: note absence of `content/` scaffold and reference CAN-049 for future creation.
  - Ops/scenario: inspect `supabase` migrations, `components/admin/` (if present).
- Record findings in the inventory report, flagging missing artefacts that require follow-up tasks.
- Testing: run targeted test suites where available (e.g., `npm test -- tests/calculations/instant-profile.test.ts`) to ensure current modules still pass.

## 3. Roadmap Rewrite

### ✅ Task 3.1 – Draft Constraint-Focused Roadmap
- Modify `docs/plans/ROADMAP.md`:
  - Introduce “Constraint Chain” framing.
  - Replace phase list with Constraint A/B/C/D, each containing goal, critical tasks, dependencies, exit criteria.
  - Explicitly note performance budgets (TTFB <2s, bundle <140KB, caching strategy).
  - Link each roadmap item back to the matrix row and CAN tasks.
- Retain archival/metric sections updated to new structure.
- Run `npm run lint` to ensure formatting scripts pass.

### ✅ Task 3.2 – Update Stage Alignment References
- In `docs/plans/re-strategy/Part02-strategic-canon-and-launch-alignment.md`, ensure roadmap references point to new phases if necessary.
- If edits needed, keep diff minimal; mention change in work log.

## 4. Guidance Updates for LLM Agents

### ✅ Task 4.1 – Update `CLAUDE.md`
- Add section describing:
  - Re-strategy as master intent layer.
  - Requirement to consult `strategy-alignment-matrix.md` before planning.
  - Documentation tier workflow (matrix → roadmap → canonical → runbooks → code).
- Review existing pending edits (`git status`) and coordinate merge to avoid overwriting current guidance. Resolve conflicts in collaboration with repo maintainers.
- Specify commands for matrix lookup and referencing CAN tasks.

### ✅ Task 4.2 – Update `AGENTS.md`
- Mirror high-level instructions for Codex workflow.
- Highlight expectation to record journal entries referencing matrix rows.
- Remind about Stage 0 launch gate as initial constraint.

### ✅ Task 4.3 – Verification
- Run `npm run lint`.
- Add note to `docs/work-log.md` capturing changes.

## 5. Backlog & Active Plan Sync

### ✅ Task 5.1 – Assign Owners/Due Dates
- Update `docs/plans/re-strategy/backlog/master-task-list.csv` with Owner and TargetStage details for CAN-033…CAN-048.
- Ensure dates reflect realistic cadence (coordinate with Brent as needed).

### ✅ Task 5.2 – Align Active Plans
- For each file in `docs/plans/active/`:
  - Append a “Constraint Alignment” section referencing relevant matrix row(s).
  - Flag contradictions in `docs/reports/strategy-alignment-inventory.md` for follow-up discussions.

## ⬜ 6. QA & Verification

1. `npm run lint`
2. `npm test`
3. Execute targeted test suites referenced in Task 2.3 (e.g., calculation tests, chat E2E) to confirm baseline behaviour remains.
4. Review `docs/work-log.md` entry for completeness.
5. Ensure new files pass pre-commit hooks (run manually if configured: `bash scripts/validate-plan-length.sh`).

## ⬜ 7. Handoff Checklist

- Matrix file committed and linked.
- Roadmap rewritten with constraint chain.
- `CLAUDE.md` and `AGENTS.md` updated.
- Backlog entries updated with owners/dates.
- Inventory report logged.
- Work log entry detailing completion.

## 8. Suggested Commit Sequence

1. `chore(strategy): add alignment inventory report`
2. `docs(strategy): introduce constraint alignment matrix`
3. `chore(roadmap): rewrite around constraint chain`
4. `docs(agents): clarify re-strategy workflow`
5. `chore(backlog): populate owners and dates`

Keep commits small and descriptive; run tests before each commit.
