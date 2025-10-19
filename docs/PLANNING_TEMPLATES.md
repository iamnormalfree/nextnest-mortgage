<!-- ABOUTME: Templates and structures for creating plans, work logs, and completion reports in NextNest -->
<!-- Extracted from CLAUDE.md 2025-10-19 to improve findability and reduce main file length -->

# Planning Templates

This document provides standardized templates for planning, tracking, and completing work in NextNest. All templates follow the 3-tier documentation system (Code → Runbooks → Plans).

> **Reference:** This content is extracted from [CLAUDE.md](../CLAUDE.md) Planning & Documentation Workflow section.

---

## Plan Template

**File naming:** `docs/plans/active/{date}-{feature-slug}.md`

**Maximum length:** 200 lines (if longer, split into multiple plans OR extract to runbook)

### Basic Structure

```yaml
---
status: draft | active | completed
complexity: light | medium | heavy
estimated_hours: X
---

# Feature Name

## Problem (2-3 sentences)
What are we solving?

## Success Criteria (3-5 measurable outcomes)
- Outcome 1
- Outcome 2

## Tasks (5-15 tasks, each <2h)
- [ ] Task 1 (test file, doc link if needed)
- [ ] Task 2

## Testing Strategy
Unit/Integration/E2E: which files

## Rollback Plan
How to undo if it fails
```

### Usage Notes

**Plans contain DECISIONS:**
- What to build
- Why we're building it
- Testing approach
- Risk mitigation

**Plans do NOT contain INSTRUCTIONS:**
- Code examples >20 lines
- Copy-paste tutorials
- Troubleshooting sections
- "Read this first" prerequisites

**Red flags your plan is too long:**
- Contains code examples >20 lines
- Contains "read this first" prerequisites
- Contains troubleshooting sections
- Contains copy-paste tutorials
- Over 200 lines

**When plan grows too large:**
1. Extract code examples → delete or move to `docs/runbooks/`
2. Extract tutorials → link to existing runbook
3. Split into Phase 1, Phase 2 plans if still >200 lines

**Before creating a new plan:**
1. Check `docs/plans/active/` - does a plan for this feature already exist?
2. If yes, update existing plan instead of creating new one
3. If creating new plan, set old related plans to `status: archived` and move them

---

## Pre-Implementation Checklist

**Add this section to every plan before starting work:**

```markdown
## Pre-Implementation Checklist

**Before starting implementation:**
- [ ] Check CANONICAL_REFERENCES.md for folder structure standards
- [ ] Verify no Tier 1 files will be modified (if yes, review change rules)
- [ ] Confirm file placement using Component Placement Decision Tree (CLAUDE.md)
- [ ] Check for existing similar components/features to avoid duplication
- [ ] Identify which tests need to be written first (TDD)
- [ ] Review related runbooks for implementation patterns

**File placement decisions:**
- [ ] New app/ routes → Production route or app/_dev/?
- [ ] New components → Which domain folder? (ui, layout, landing, shared, forms, etc.)
- [ ] New tests → Colocated __tests__/ or tests/ directory?
- [ ] New utilities → lib/ or hooks/?
- [ ] Archive format → YYYY-MM if archiving anything
```

---

## Work Log Entry Template

**File location:** `docs/work-log.md`

**When to use:** Daily notes during implementation (NOT for creating new plans or reports)

### Entry Structure

```markdown
## {YYYY-MM-DD} - {Feature Name}

**Branch:** {branch-name}
**Plan:** docs/plans/active/{date}-{feature-slug}.md
**Status:** in-progress | blocked | completed

### Progress Today
- [x] Completed task 1
- [ ] Blocked on task 2

### Key Decisions
- Decision: {what we chose and why}

### Issues Found
- Issue: {description} - fixed in commit abc1234

### Next Session
- Start with task X
```

### Usage Notes

**During implementation, use ONLY:**
- `TodoWrite` tool for task tracking
- `docs/work-log.md` for daily notes
- Git commits as execution log
- Nothing else

**DO NOT create during execution:**
- New plans
- Investigation reports (use journal)
- Status updates (use journal)
- Fix summaries (git log is your summary)

---

## Completion Report Template

**File naming:** `docs/plans/active/{date}-{feature-slug}-COMPLETION.md`

**When to use:** Create ONE completion report when fully done (not partial/interim reports)

### Report Structure

```markdown
---
plan: {date}-{feature-slug}.md
completed: YYYY-MM-DD
outcome: success | partial | failed
---

# Completion: Feature Name

## What We Built
- Feature 1: {1 sentence}

## Metrics
- Baseline: X → Current: Y

## What Worked / Didn't Work
...

## Next Actions
- [ ] Monitor X
- [ ] Archive plan
```

### When to Create Completion Report

Create completion report when:
- All tasks in plan are completed OR explicitly deferred
- All tests are passing
- Code is merged to main branch

**Never create:**
- Partial/interim reports
- Status updates (use work-log.md instead)

### After Completion

**Archive immediately after completion report:**

```bash
git mv docs/plans/active/{plan}.md docs/plans/archive/2025/10/
git mv docs/plans/active/{plan}-COMPLETION.md docs/plans/archive/2025/10/
```

**Archive structure:** `docs/plans/archive/{year}/{month}/`

---

## Document Type Quick Reference

| Document Type | Location | Purpose | Lifecycle |
|---------------|----------|---------|-----------|
| Active plan | `docs/plans/active/` | WHAT to build, WHY, testing | Temporary (archive after completion) |
| Work log | `docs/work-log.md` | Daily progress notes | Ongoing |
| Completion report | `docs/plans/active/` then archive | Final summary of work | Created once, then archived |
| Runbook | `docs/runbooks/{domain}/` | HOW to implement features | Permanent reference |
| Code | Files in `CANONICAL_REFERENCES.md` | Canonical implementation truth | Production code |

---

## Forbidden Patterns

**NEVER create these at repository root:**
- `*_SUMMARY.md`
- `*_REPORT.md`
- `*_FIX.md`
- `*_STATUS.md`
- `*_IMPLEMENTATION.md`
- `*.txt` status files

**Exception:** README.md, CLAUDE.md, AGENTS.md, SKILL.md, standard configs

**If you find root-level docs:**
1. Is it a plan? → move to `docs/plans/archive/{year}/{month}/`
2. Investigation notes? → move to `docs/reports/investigations/`
3. Fix summary? → delete (git log has it)
4. Status update? → delete (stale)

---

**Last Updated:** 2025-10-19  
**Source:** [CLAUDE.md](../CLAUDE.md) lines 406-633
