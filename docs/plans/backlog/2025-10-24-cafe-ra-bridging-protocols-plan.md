---
status: draft
complexity: medium
estimated_hours: 16
related_frameworks: CAFE, Response-Awareness, META_FRAMEWORKS.md
dependencies:
  - 2025-10-24-cafe-enhancement-plan.md (Phase 1-3)
  - 2025-10-24-response-awareness-enhancement-plan.md (Phase 1-5)
---

# CAFE ↔ Response-Awareness: Scale-Bridging Protocols

## Problem

CAFE (week-scale constraint management) and Response-Awareness (task-scale complexity management) are instances of the same meta-pattern at different timescales. Currently they operate independently. Implementing scale-bridging protocols enables bidirectional information flow: RA metrics inform CAFE constraint prioritization, CAFE context improves RA complexity scoring, and both systems test each other's hypotheses.

## Success Criteria

- [ ] Protocol 1 (RA → CAFE): Weekly review Part 9 uses RA metrics to identify constraint blockers
- [ ] Protocol 2 (CAFE → RA): Complexity scoring receives active constraint + canonical file context
- [ ] Protocol 3 (Bidirectional): CAFE constraint hypotheses validated with RA task evidence
- [ ] All 3 protocols documented in META_FRAMEWORKS.md with working examples
- [ ] Weekly review automation (`scripts/run-weekly-review.sh`) includes Protocol 1 & 3
- [ ] RA skill auto-invokes Protocol 2 during complexity assessment
- [ ] Test: Complete 1 constraint cycle with all protocols active, verify information flows correctly

## Prerequisites

**Must complete BEFORE this plan:**
1. CAFE Enhancement Plan - Phase 1 (metacognitive scaffolding), Phase 2 (technical enforcement)
2. RA Enhancement Plan - Phase 1 (metrics persistence), Phase 2 (CAFE context integration), Phase 5 (calibration report)

Without these, the protocols have no data sources to bridge.

## Tasks

### Phase 1: Protocol 1 - RA Metrics → CAFE Weekly Review (6h)

**Purpose:** RA task-level insights inform CAFE constraint-level decisions

- [ ] Update weekly review to include Part 9: RA Calibration
- [ ] Part 9 template:
  ```markdown
  ## Part 9: Response-Awareness Calibration (10 minutes)

  **Metrics from RA this week:**
  - Tasks completed: {count} ({LIGHT}/{MEDIUM}/{HEAVY}/{FULL})
  - Escalations: {count} ({from_tier} → {to_tier})
  - Most common tags: {tag}: {count}x

  **Insights:**
  - [ ] Do escalations correlate with specific constraint?
  - [ ] Do common tags indicate missing runbooks/canonical updates?
  - [ ] Do task failures cluster around specific files?

  **Actions for CAFE:**
  - If #COMPLETION_DRIVE frequent → Check runbook coverage for active constraint
  - If escalations in domain X → Check if Constraint hypothesis wrong (maybe X is real bottleneck)
  - If canonical file changes frequent → Check if CANONICAL_REFERENCES.md outdated
  ```
- [ ] Create `scripts/extract-ra-insights.ts` to auto-populate Part 9 template
- [ ] Script reads: `data/response-awareness/metrics/*.json` from past week
- [ ] Script outputs: `docs/reports/ra-insights-YYYY-MM-DD.md` (copy into weekly review)
- [ ] Test: Run after week with 5 #COMPLETION_DRIVE tags, verify script identifies runbook gap
- [ ] Update `docs/runbooks/strategy/weekly-constraint-review.md` to include Part 9
- [ ] Document in `docs/runbooks/strategy/protocol-1-ra-to-cafe.md`

### Phase 2: Protocol 2 - CAFE Context → RA Complexity Scoring (4h)

**Purpose:** CAFE constraint-level context adjusts RA task-level scoring

- [ ] This was implemented in RA Enhancement Plan Phase 2, now we formalize as protocol
- [ ] Create `docs/runbooks/response-awareness/protocol-2-cafe-to-ra.md`
- [ ] Document scoring adjustments:
  ```markdown
  Base RA Score: (files, clarity, scope, change type) = 0-12

  CAFE Adjustments:
  + Active constraint domain match: +1
    (Task touches public surface while Constraint A active)
  + Touches canonical file: +1
    (Task modifies instant-profile.ts from CANONICAL_REFERENCES.md)
  + Recent escalations in this domain: +1
    (Last 3 tasks in domain escalated → this task probably will too)

  Final Score: Base + Adjustments → Tier
  ```
- [ ] Add logging: `RA score adjusted: base {X} + CAFE {+Y} = {Z} → {TIER}`
- [ ] Verify in RA metrics: `{base_score, cafe_adjustments[], final_score, tier}`
- [ ] Test: Task with base=3, constraint match + canonical file → final=5 (MEDIUM → HEAVY)
- [ ] Update `.claude/skills/response-awareness-medium/SKILL.md` to document protocol
- [ ] Link from META_FRAMEWORKS.md Protocol 2 section

### Phase 3: Protocol 3 - Bidirectional Hypothesis Testing (6h)

**Purpose:** CAFE constraint hypotheses validated/rejected using RA task evidence

- [ ] Add hypothesis tracking to `strategy-alignment-matrix.md`:
  ```markdown
  | Constraint | Status | Hypothesis | Evidence (RA Tasks) | Confirmed? |
  |------------|--------|------------|---------------------|------------|
  | A          | 🟡     | Public surface blocks launch | 3 tasks, all #COMPLETION_DRIVE "missing voice guide" | ✅ Yes - CAN-036 priority |
  ```
- [ ] Create `scripts/test-constraint-hypothesis.ts`:
  - Input: Constraint hypothesis ("Missing voice guide blocks homepage copy")
  - Search: RA metrics for tasks matching constraint domain
  - Analyze: Do task tags/escalations support hypothesis?
  - Output: Evidence summary (3/5 tasks hit #COMPLETION_DRIVE with reason "voice guide")
- [ ] Weekly review Part 8.5: Test active constraint hypothesis
  ```markdown
  ## Part 8.5: Constraint Hypothesis Testing (5 minutes)

  **Current hypothesis:** {description}

  **RA evidence this week:**
  - Tasks in domain: {count}
  - Failures matching hypothesis: {count} ({percentage}%)
  - Common blockers: {list}

  **Decision:**
  - [ ] Hypothesis confirmed → Continue constraint
  - [ ] Hypothesis weak → Re-score constraint priority
  - [ ] Hypothesis rejected → Mark constraint complete, move to next
  ```
- [ ] Test: Create false hypothesis, run 5 tasks, verify evidence rejects it
- [ ] Update `docs/runbooks/strategy/constraint-hypothesis-testing.md` with protocol
- [ ] Document in `docs/runbooks/strategy/protocol-3-bidirectional-testing.md`

### Phase 4: Automation Integration (0h - uses existing scripts)

- [ ] Update `scripts/run-weekly-review.sh` to include:
  1. Generate RA insights (Protocol 1)
  2. Test constraint hypothesis (Protocol 3)
  3. Output: Pre-filled weekly review template with both sections
- [ ] Weekly review now semi-automated: script generates data, human reviews and decides
- [ ] Test: Run script after test week, verify output includes Part 9 and Part 8.5 pre-filled

### Phase 5: Documentation & Examples (0h - updates only)

- [ ] Update `docs/META_FRAMEWORKS.md` section "Practical Implementation: Fractal Interoperability"
- [ ] Add "Status: ✅ Implemented" to each protocol
- [ ] Add working example from real usage (after 1 constraint cycle completed)
- [ ] Link to runbooks: protocol-1-ra-to-cafe.md, protocol-2-cafe-to-ra.md, protocol-3-bidirectional-testing.md
- [ ] Add visual diagram showing information flow:
  ```
  Week-Scale (CAFE)           Task-Scale (RA)
  ┌─────────────────┐        ┌──────────────────┐
  │ Constraint A    │───────>│ Complexity +1    │  Protocol 2
  │ (public surface)│        │ (constraint ctx) │  (downward)
  └─────────────────┘        └──────────────────┘
         ▲                            │
         │ Protocol 1                 │ Metrics
         │ (upward)                   │
         │                            ▼
  ┌─────────────────┐        ┌──────────────────┐
  │ Weekly Review   │<───────│ 5x #COMPLETION   │
  │ Part 9: RA data │        │ → Runbook gap    │
  └─────────────────┘        └──────────────────┘
         │                            ▲
         │ Protocol 3                 │
         │ (bidirectional)            │
         ▼                            │
  ┌─────────────────┐        ┌──────────────────┐
  │ Hypothesis:     │───────>│ Evidence: 3/5    │
  │ "Voice guide    │        │ tasks blocked    │
  │  blocks copy"   │<───────│ by voice guide"  │
  └─────────────────┘        └──────────────────┘
  ```

## Testing Strategy

**Integration Tests:**
- `tests/scripts/validate-bridging-protocols.ts` - Test all 3 protocols work together
- Test Protocol 1: RA metrics → weekly review insights
- Test Protocol 2: CAFE context → RA score adjustments
- Test Protocol 3: CAFE hypothesis → RA evidence → confirmation/rejection
- Test automation: `run-weekly-review.sh` generates complete report

**E2E Validation:**
- Complete 1 full constraint cycle (4 weeks) with all protocols active:
  - Week 1: Mark Constraint A as 🟡, formulate hypothesis
  - Week 2-4: Complete 15+ RA tasks touching constraint domain
  - Week 4: Run weekly review with Protocol 1 & 3, verify insights correct
- Verify information flows:
  - Downward: CAFE constraint → RA scores higher for related tasks ✅
  - Upward: RA task failures → CAFE identifies runbook gap ✅
  - Bidirectional: Hypothesis tested with RA evidence → decision made ✅

## Rollback Plan

All protocols are additive overlays:
1. Protocol 1: Skip Part 9 in weekly review (no harm, just less insight)
2. Protocol 2: Disable CAFE context adapter (RA reverts to base scoring)
3. Protocol 3: Skip Part 8.5 in weekly review (hypothesis testing optional)
4. Automation: Scripts only generate reports, don't modify system

No risk of breaking CAFE or RA core systems.

## Dependencies

**Prerequisite Plans:**
1. CAFE Enhancement Plan (2025-10-24-cafe-enhancement-plan.md)
   - Must complete Phase 1-3 before Protocol 1
2. RA Enhancement Plan (2025-10-24-response-awareness-enhancement-plan.md)
   - Must complete Phase 1, 2, 5 before Protocol 2 & 3

**Infrastructure:**
- `data/response-awareness/metrics/*.json` (from RA Enhancement Phase 1)
- `lib/response-awareness/cafe-context-adapter.ts` (from RA Enhancement Phase 2)
- `scripts/aggregate-ra-metrics.ts` (from RA Enhancement Phase 1)
- `docs/plans/re-strategy/strategy-alignment-matrix.md` (existing CAFE)

## Success Metrics

**Quantitative:**
- Protocol 1 usage: 100% of weekly reviews include Part 9 with RA insights
- Protocol 2 accuracy: ≥20% of tasks receive CAFE adjustments to complexity
- Protocol 3 decisions: ≥80% of constraint hypotheses reach decision within 3 weeks
- Automation coverage: `run-weekly-review.sh` pre-fills ≥70% of Part 9 data

**Qualitative:**
- Weekly review insights feel more data-driven (not just intuition)
- RA scoring prevents underestimation of critical tasks (fewer escalations)
- Constraint hypothesis testing accelerates decision-making (less ambiguity)
- Developers report "the systems work together seamlessly"

## Notes

This plan implements **fractal interoperability** - the same meta-pattern (measure → route → execute → verify → adjust) operating at nested scales with information flowing between scales.

**Key Insight:** Without protocols, CAFE and RA are independent. With protocols, they form a **coherent system** where week-scale decisions inform task-scale execution, and task-scale evidence validates week-scale hypotheses.

**Analogy:** Like a musician practicing (task-scale) informing concert performance (week-scale), and concert feedback (audience reaction) adjusting practice focus. Same activity, different timescales, bidirectional learning.

**Post-Implementation:** Update `docs/META_FRAMEWORKS.md` to mark protocols as ✅ Implemented with working examples from real usage.

## Relationship to Meta-Frameworks

This plan operationalizes the fractal interoperability concept documented in META_FRAMEWORKS.md. The protocols are the **scale bridges** that convert philosophical understanding ("they're the same pattern") into practical integration ("here's how information flows between them").

After this plan: CAFE and RA remain independent (can work alone) but are interoperable (work better together).
