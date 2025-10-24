---
status: draft
complexity: heavy
estimated_hours: 40
related_frameworks: CAFE, META_FRAMEWORKS.md
---

# CAFE Enhancement: Learning from Response-Awareness

## Problem

CAFE (Constraint-Aligned Fractal Execution) successfully provides bidirectional verification across 7 tiers (0-6) but lacks key mechanisms that Response-Awareness has proven effective for LLM-assisted work: metacognitive scaffolding, technical enforcement, and discovery-based complexity adjustment. This gap analysis was documented in `docs/META_FRAMEWORKS.md` after first-principles analysis.

## Success Criteria

- [ ] Weekly review includes RA-style meta-learning loop (Part 9)
- [ ] Git hooks technically BLOCK tier violations (not just warn)
- [ ] Constraint hypothesis can be dynamically reordered based on evidence
- [ ] Plan complexity scoring triggers automatic decomposition >180 lines
- [ ] Work log uses LCL-style compression (state once, extract, reference)
- [ ] Verification uses priority matrix (P0/P1/P2/P3)
- [ ] Tier checks detect correlations (like RA error patterns)
- [ ] Level 5 (Re-strategy) has clarification protocol for vague intent
- [ ] Each blocking check includes resolution playbook (not just detection)

## Gap Analysis Reference

From `docs/META_FRAMEWORKS.md` section "What Response-Awareness Has That CAFE Doesn't Capture":

1. **Metacognitive Scaffolding** - Tags as uncertainty markers
2. **Discovery-Based Complexity** - Escalation is core, not exception
3. **Technical Enforcement** - Firewall prevents violations
4. **Context Management** - Progressive loading with hard limits
5. **Information Compression** - LCL protocol
6. **Verification Priority Ordering** - Critical → assumptions → cleanup → docs
7. **Error Correlation** - Meta-patterns between checks
8. **Intent Clarification** - Pre-checks that FIX unclear L5
9. **Conflict Resolution** - Not just detection, offer solutions

## Tasks

### Phase 1: Metacognitive Scaffolding (8h)

- [ ] Design temporary reference system (debits without credits)
- [ ] Update constraint checks to flag "hypothesis" vs "confirmed"
- [ ] Add verification phase that converts hypotheses to confirmed/rejected
- [ ] Update work log template to include hypothesis → outcome tracking
- [ ] Test: Create plan with 3 tier reference hypotheses, verify they're flagged and resolved

### Phase 2: Technical Enforcement (12h)

- [ ] Create git pre-commit hook: check tier mixing violations
- [ ] Hook blocks: plans without constraint reference, code without runbook link, runbook without plan
- [ ] Hook allows: marking reference as "HYPOTHESIS" (verified later)
- [ ] Add `scripts/validate-tier-alignment.sh` for manual checking
- [ ] Update `.claude/skills/fractal-alignment/SKILL.md` to use technical enforcement
- [ ] Test: Attempt commit with tier violation, verify block with actionable error
- [ ] Document in `docs/runbooks/strategy/tier-enforcement-technical-guide.md`

### Phase 3: Discovery-Based Complexity (6h)

- [ ] Add constraint scoring: evidence strength (weak/medium/strong)
- [ ] Update `strategy-alignment-matrix.md` with hypothesis column
- [ ] Create constraint reordering protocol in weekly review (Part 8.5)
- [ ] If evidence weak after 2 weeks → re-score and potentially reorder
- [ ] Test: Mark Constraint C as 🟡, find evidence it's NOT bottleneck, verify reorder suggested
- [ ] Document in `docs/runbooks/strategy/constraint-hypothesis-testing.md`

### Phase 4: Context Management & Compression (8h)

- [ ] Add plan complexity scoring (0-12 scale matching RA)
- [ ] Auto-warn at 180 lines, auto-suggest decomposition at 200 lines
- [ ] Update `scripts/validate-plan-length.sh` to score complexity, not just line count
- [ ] Create work log compression protocol (LCL-style)
- [ ] Add LCL markers: CRITICAL, FIRM, CASUAL for work log entries
- [ ] Compress entries older than 4 weeks using LCL extraction
- [ ] Test: 250-line plan triggers decomposition guide
- [ ] Document in `docs/runbooks/strategy/plan-complexity-management.md`

### Phase 5: Verification Priority & Correlation (4h)

- [ ] Create verification priority matrix (P0: blocking, P1: critical, P2: important, P3: nice-to-have)
- [ ] Update constraint audit checklist to prioritize P0/P1
- [ ] Add correlation detection: if runbook gap, likely missing CAN task (link checks)
- [ ] Weekly review Part 7 checks: did multiple P0 failures correlate?
- [ ] Test: Trigger 2 correlated check failures, verify correlation flagged
- [ ] Document in `docs/runbooks/strategy/verification-priority-guide.md`

### Phase 6: Resolution Playbooks (2h)

- [ ] For each blocking check in `/check-alignment`, add resolution playbook
- [ ] Example: "Blocked: no runbook" → Playbook: "1. Check if CAN task exists for runbook, 2. If not, create CAN task, 3. Schedule runbook creation"
- [ ] Update all 5 Tier 6 checks with resolution playbooks
- [ ] Test: Trigger block, verify playbook appears in error message
- [ ] Document in `docs/runbooks/strategy/check-resolution-playbooks.md`

## Testing Strategy

**Integration Tests:**
- `tests/scripts/validate-cafe-enhancements.ts` - Test all 9 enhancements work together
- Test hypothesis → verification → confirmation flow
- Test git hook blocks tier violations
- Test constraint reordering when evidence weak
- Test plan decomposition suggestions
- Test work log compression
- Test P0 checks run before P2 checks
- Test correlation detection between related failures
- Test resolution playbooks appear in check outputs

**E2E Validation:**
- Run through one full constraint cycle (A) with all enhancements active
- Verify weekly review includes new sections (8.5, 9)
- Verify git hooks block violations in real commits
- Verify plan complexity scoring works on active plans

## Rollback Plan

All enhancements are additive to existing CAFE system:
1. Git hooks can be disabled via `.git/hooks/` removal
2. Complexity scoring doesn't block, only warns
3. Verification priority doesn't remove checks, only reorders
4. Hypothesis system adds column to matrix, doesn't remove existing
5. If any enhancement causes issues, comment out relevant section in skill/runbooks

## Dependencies

- Existing CAFE system (`docs/runbooks/strategy/`)
- Response-Awareness framework understanding (`docs/META_FRAMEWORKS.md`)
- Git hooks infrastructure (pre-commit)
- Weekly constraint review process

## Success Metrics

**Quantitative:**
- Tier violations blocked by git hook: >90% catch rate
- Plan decomposition suggestions: 100% for plans >180 lines
- Constraint hypothesis confirmation time: <3 weeks
- Work log compression: 50% reduction in verbosity for entries >4 weeks old

**Qualitative:**
- Developers report "git hook saved me from tier mixing"
- Constraint reordering feels natural based on evidence
- Weekly review Part 9 provides actionable RA insights
- Resolution playbooks reduce time to fix blocking checks

## Notes

This plan enhances CAFE by importing proven patterns from Response-Awareness. After completion, CAFE will have metacognitive scaffolding (uncertainty markers), technical enforcement (git hooks), and discovery-based complexity (hypothesis testing).

The enhancements are designed to be fractal - they work at week-scale (constraint management) just like RA patterns work at task-scale (complexity management).

**Post-Implementation:** Update `docs/META_FRAMEWORKS.md` to reflect CAFE now has these 9 mechanisms, reducing the gap with Response-Awareness.
