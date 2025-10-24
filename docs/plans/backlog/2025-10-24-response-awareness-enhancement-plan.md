---
status: draft
complexity: heavy
estimated_hours: 32
related_frameworks: Response-Awareness, META_FRAMEWORKS.md
---

# Response-Awareness Enhancement: Learning from CAFE

## Problem

Response-Awareness successfully prevents LLM errors within single conversations through complexity scoring and tier routing, but operates in isolation. Each conversation forgets previous tier choices, has no concept of ongoing projects, and treats all code equally. CAFE's cross-conversation learning, constraint sequencing, audit trails, canonical references, and work item hierarchy could make RA more effective over time.

## Success Criteria

- [ ] RA metrics persist across conversations (task completion, escalations, common tags)
- [ ] RA complexity scoring considers project context (active constraint, canonical files)
- [ ] RA learns from past tier choices (if file X always escalates, start higher)
- [ ] RA knows which files are protected (CANONICAL_REFERENCES.md integration)
- [ ] RA tasks link to CAN-### IDs (multi-conversation context)
- [ ] RA generates weekly calibration report (tier effectiveness, tag analysis)
- [ ] RA has tier optimization roadmap (improve LIGHT, then MEDIUM, then HEAVY)

## Gap Analysis Reference

From `docs/META_FRAMEWORKS.md` section "What CAFE Has That Response-Awareness Doesn't Use":

1. **Periodic Reconciliation** - Cross-conversation learning through weekly review
2. **Constraint Sequencing** - Optimize tiers over time (roadmap for tier improvement)
3. **Audit Trail Persistence** - Knowledge accumulation across conversations
4. **Canonical References** - Context-aware tier routing based on file importance
5. **Work Item Hierarchy** - CAN-### IDs link tasks to larger initiatives

## Tasks

### Phase 1: Metrics Persistence (8h)

- [ ] Design RA metrics schema: `{date, task_id, initial_tier, final_tier, escalation_reason, tags_used[]}`
- [ ] Create `data/response-awareness/metrics/` directory
- [ ] Create `lib/response-awareness/metrics-logger.ts` to persist metrics after each conversation
- [ ] Log format: `YYYY-MM-DD-{conversation_id}.json`
- [ ] Create `scripts/aggregate-ra-metrics.ts` to generate weekly summaries
- [ ] Test: Complete 5 RA conversations with different tiers, verify all logged
- [ ] Document in `docs/runbooks/response-awareness/metrics-persistence-guide.md`

### Phase 2: Project Context Integration (10h)

- [ ] Update RA complexity scoring to receive CAFE context
- [ ] Read `docs/plans/re-strategy/strategy-alignment-matrix.md` for active constraint
- [ ] Read `CANONICAL_REFERENCES.md` for protected files
- [ ] Complexity adjustments: +1 if touches canonical, +1 if active constraint domain
- [ ] Example: Homepage task (base 3) + Constraint A (public surface) + instant-profile.ts (canonical) = 5 (HEAVY)
- [ ] Create `lib/response-awareness/cafe-context-adapter.ts`
- [ ] Test: Same task scores 3 without context, 5 with CAFE context
- [ ] Update `.claude/skills/response-awareness-*/SKILL.md` to call adapter
- [ ] Document in `docs/runbooks/response-awareness/cafe-context-integration.md`

### Phase 3: Learning from History (6h)

- [ ] Create `lib/response-awareness/escalation-analyzer.ts`
- [ ] Analyze last 50 tasks: which files triggered escalations?
- [ ] If file X escalated 4+ times → flag as "historically complex"
- [ ] Next task touching file X: start at escalated tier (skip underestimation)
- [ ] Store learning: `data/response-awareness/learned-complexity.json`
- [ ] Weekly review resets learning (prevents stale patterns)
- [ ] Test: File escalates 4 times, next task starts at higher tier
- [ ] Document in `docs/runbooks/response-awareness/historical-learning-guide.md`

### Phase 4: CAN Task Integration (4h)

- [ ] Update RA task descriptions to include CAN-### ID if available
- [ ] When RA starts task, check if work references CAN task in plan
- [ ] If yes, log: `{can_task_id: "CAN-037", ra_tier: "MEDIUM"}`
- [ ] Aggregate: "CAN-037 completed 3 MEDIUM tasks, 1 HEAVY task this week"
- [ ] Links multi-conversation work to strategic initiative
- [ ] Test: Complete 3 tasks for same CAN ID, verify aggregation
- [ ] Document in `docs/runbooks/response-awareness/can-task-linking.md`

### Phase 5: Weekly Calibration Report (4h)

- [ ] Create `scripts/generate-ra-calibration-report.ts`
- [ ] Run weekly (Part 9 of CAFE weekly review)
- [ ] Report includes:
  - Tasks completed by tier (LIGHT: 5, MEDIUM: 8, HEAVY: 2)
  - Escalation rate (2 escalations / 15 tasks = 13%)
  - Most common tags (#COMPLETION_DRIVE: 5x, #FALSE_FLUENCY: 1x)
  - Insights: "Missing runbooks caused 5 COMPLETION_DRIVE tags"
  - Recommendations: "Create runbooks for domain X"
- [ ] Output: `docs/reports/ra-calibration-YYYY-MM-DD.md`
- [ ] Test: Run after week of RA usage, verify insights actionable
- [ ] Document in `docs/runbooks/response-awareness/calibration-report-guide.md`

### Phase 6: Tier Optimization Roadmap (0h - planning only)

- [ ] Create `docs/plans/backlog/response-awareness-tier-optimization-roadmap.md`
- [ ] Structure like CAFE constraints: Tier L → Tier M → Tier H → Tier F
- [ ] Example: "Constraint L: LIGHT tier accuracy <85% → investigate threshold"
- [ ] Roadmap shows: which tier to optimize next (bottleneck)
- [ ] Links to calibration reports for evidence
- [ ] Test: Review after 4 weeks of calibration, verify bottleneck identified
- [ ] Document reference in `docs/META_FRAMEWORKS.md`

## Testing Strategy

**Integration Tests:**
- `tests/scripts/validate-ra-enhancements.ts` - Test all 5 enhancements work together
- Test metrics persist after conversation
- Test CAFE context adjusts complexity scoring
- Test historical learning prevents repeated underestimation
- Test CAN task linking aggregates multi-conversation work
- Test calibration report generates actionable insights

**E2E Validation:**
- Run 20 RA conversations over 1 week with enhancements active
- Generate weekly calibration report
- Verify metrics show tier distribution, escalations, tag frequency
- Verify CAFE context influenced at least 3 complexity scores
- Verify at least 1 file learned as "historically complex"
- Verify at least 1 CAN task linked across multiple conversations

## Rollback Plan

All enhancements are additive to existing Response-Awareness:
1. Metrics logging can be disabled (comment out logger calls)
2. CAFE context adapter returns empty if disabled
3. Historical learning file can be deleted (reverts to base scoring)
4. CAN task linking optional (doesn't block if missing)
5. Calibration report generation is separate script (doesn't affect RA tiers)

## Dependencies

- Existing Response-Awareness framework (`.claude/skills/response-awareness-*/`)
- CAFE system for context (`strategy-alignment-matrix.md`, `CANONICAL_REFERENCES.md`)
- File system access for metrics persistence (`data/response-awareness/`)
- Weekly review process to run calibration report

## Success Metrics

**Quantitative:**
- Metrics persistence: 100% of RA conversations logged
- CAFE context adjustments: ≥20% of tasks receive +1 or +2 complexity
- Historical learning accuracy: Files with 4+ escalations start at correct tier 80% of time
- CAN task linking: ≥50% of tasks linked to CAN IDs
- Calibration report actionability: ≥3 insights per weekly report

**Qualitative:**
- Weekly calibration reports feel useful (not noise)
- CAFE context prevents underestimation of critical tasks
- Historical learning reduces redundant escalations
- CAN task aggregation shows strategic progress
- Tier optimization roadmap guides RA improvement

## Notes

This plan enhances Response-Awareness by importing proven patterns from CAFE. After completion, RA will have cross-conversation memory (metrics), project context awareness (CAFE integration), learning from history (escalation patterns), strategic alignment (CAN tasks), and meta-learning loop (calibration reports).

The enhancements create **temporal continuity** - RA stops being isolated conversations and becomes a learning system that improves over time.

**Key Insight:** RA currently operates like a stateless function (same input → same output). With CAFE patterns, it becomes stateful (same input + history → better output).

**Post-Implementation:** Update `docs/META_FRAMEWORKS.md` to reflect RA now has these 5 CAFE mechanisms, reducing the gap between systems.

## Integration with Plan 3 (Bridging Protocols)

This plan creates the infrastructure for scale-bridging protocols:
- Phase 1 (metrics) → enables Protocol 1 (RA → CAFE metric flow)
- Phase 2 (context) → enables Protocol 2 (CAFE → RA context flow)
- Phase 5 (calibration) → enables Protocol 3 (bidirectional hypothesis testing)

Complete this plan BEFORE implementing bridging protocols (Plan 3).
