ABOUTME: Step-by-step workflow for implementing constraint work while maintaining re-strategy alignment.
ABOUTME: Prevents drift by enforcing systematic checks before, during, and after implementation.

# Constraint Implementation Workflow

**Purpose:** Ensure all implementation work stays aligned with re-strategy constraints, roadmap, and exit criteria.

**When to use:** Before starting ANY new feature, bug fix, or enhancement work.

---

## Phase 0: Pre-Implementation Alignment Check (MANDATORY)

**Rule:** Never start coding without completing this phase.

### Step 1: Identify Active Constraint

```bash
# Open these files in order:
1. docs/plans/re-strategy/strategy-alignment-matrix.md
2. docs/plans/ROADMAP.md
3. docs/plans/re-strategy/stage0-launch-gate.md (if Constraint A)
```

**Questions to answer:**
- Which constraint row has 🟡 status? (This is your active constraint)
- Is Constraint A complete (✅)? If no, you MUST work on Constraint A
- What are the exit criteria for the active constraint?

**Action:** Write down: "Working on Constraint [A/B/C/D]: [constraint name]"

---

### Step 2: Check CAN Task Alignment

```bash
# Open the backlog:
docs/plans/re-strategy/backlog/master-task-list.csv
```

**Questions to answer:**
- Does a CAN task exist for this work?
- If yes: What's the CAN task ID? (e.g., CAN-036)
- If no: Should this work exist? (If yes, stop and ask Brent to add CAN task)
- Are prerequisite CAN tasks complete?

**Action:** Write down: "CAN-[###]: [description]" or "No CAN task - verify with Brent"

---

### Step 3: Check Runbook Prerequisites

```bash
# Check if implementation guide exists:
ls docs/runbooks/
grep -r "your feature name" docs/runbooks/
```

**Questions to answer:**
- Does a runbook exist for this work?
- If no: Is a CAN task scheduled to create it? (Check matrix)
- If runbook exists: Have I read it completely?

**Action:**
- If runbook missing and CAN task exists → Create runbook FIRST
- If runbook exists → Note file path for reference during implementation

---

### Step 4: Check Active Plan Alignment

```bash
# Search for related active plans:
ls docs/plans/active/
grep -i "your feature keywords" docs/plans/active/*.md
```

**Questions to answer:**
- Is there an active plan for this work?
- Does the plan reference the correct constraint?
- Does the plan reference the CAN task?
- What are the success criteria in the plan?

**Action:** Note the plan file path, or determine if new plan is needed

---

### Step 5: Verify Code Alignment

**Check CANONICAL_REFERENCES.md for affected Tier 1 files:**

```bash
# Open and search:
CANONICAL_REFERENCES.md
```

**Questions to answer:**
- Are you modifying any Tier 1 (canonical) files?
- If yes: What are the change rules for these files?
- Are there test requirements listed?

**Action:** List Tier 1 files you'll modify and their rules

---

### Step 6: Create Phase 0 Checkpoint Document

Create a brief pre-implementation checklist:

```markdown
## Pre-Implementation Checkpoint - [Feature Name]

**Date:** YYYY-MM-DD
**Implementer:** [Your name]

### Alignment Verification
- [ ] Active constraint: Constraint [A/B/C/D]
- [ ] CAN task: CAN-[###] or [explain why no CAN task]
- [ ] Runbook: [path] or [CAN task to create it]
- [ ] Active plan: [path] or [new plan needed]
- [ ] Tier 1 files: [list with change rules]

### Exit Criteria (from roadmap/plan)
- [ ] [Criterion 1]
- [ ] [Criterion 2]
- [ ] [Test coverage requirement]

### Approval
- [ ] Brent reviewed (if new work without CAN task)
- [ ] Ready to implement
```

**Save to:** `docs/strategy_integration/checkpoints/YYYY-MM-DD-[feature-slug].md`

---

## Phase 1: Implementation with Alignment

### Step 7: Follow TDD + Reference Docs

**Mandatory order:**
1. Write failing test (per CLAUDE.md TDD rules)
2. Reference runbook for implementation patterns
3. Implement ONLY enough to pass test
4. Check constraint exit criteria still met
5. Refactor while keeping tests green

**Drift prevention:**
- Re-read runbook section before each major code change
- Check plan success criteria after each test passes
- Update checkpoint document with completed items

---

### Step 8: Track Progress in TodoWrite

```javascript
// Use TodoWrite for all implementation tasks:
[
  {content: "Write test for [feature]", status: "in_progress", activeForm: "Writing test"},
  {content: "Implement [feature] per runbook", status: "pending", activeForm: "Implementing"},
  {content: "Verify exit criteria met", status: "pending", activeForm: "Verifying"}
]
```

**Mark completed immediately** - don't batch completions

---

### Step 9: Update Work Log During Implementation

Add entry to `docs/work-log.md` when:
- Major milestone reached (test suite passing, integration complete)
- Discovered issue that affects constraint/plan
- Need to defer work or change approach

**Format:**
```markdown
## [Feature Name] - [Milestone]

**Date:** YYYY-MM-DD
**Constraint:** Constraint [A/B/C/D]
**CAN Task:** CAN-[###]

### Progress
- Completed: [what's done]
- Blocked by: [any blockers]
- Next: [next steps]
```

---

## Phase 2: Post-Implementation Verification

### Step 10: Verify Exit Criteria

**Go back to your checkpoint document and verify:**

1. **From roadmap (Constraint section):**
   - Are all exit criteria met?
   - Run specified test suites
   - Check performance budgets (TTFB, bundle size, etc.)

2. **From active plan (Success Criteria section):**
   - Are all success criteria met?
   - Run all specified tests
   - Check UI/UX requirements

3. **From Stage 0 gate (if Constraint A):**
   - Update checklist items in `stage0-launch-gate.md`
   - Add evidence links (test results, screenshots, metrics)

---

### Step 11: Update Strategy Artifacts

**Update in this order:**

1. **Checkpoint document** → Mark all items complete
2. **Work log** → Add completion entry
3. **Active plan** → Update task status or mark complete
4. **Stage 0 gate** (if Constraint A) → Update checklist with evidence
5. **Strategy alignment matrix** → Update status emoji if constraint complete

**Don't skip any of these!**

---

### Step 12: Plan Completion or Archival

If plan is fully complete:

1. Create completion report: `docs/plans/active/[date]-[plan-name]-COMPLETION.md`
2. Archive both to: `docs/plans/archive/[year]/[month]/`
3. Update matrix constraint status
4. Log completion in work log

If plan has remaining work:
- Update plan with completed tasks marked
- Note what's left in work log
- Keep in active directory

---

## Phase 3: Drift Prevention Review

### Step 13: Self-Audit Against Re-Strategy

**Ask yourself:**
- Did I introduce code that doesn't serve the active constraint?
- Did I skip creating a runbook when one was needed?
- Did I modify Tier 1 files without checking CANONICAL_REFERENCES.md?
- Did I add features not in the constraint exit criteria? (YAGNI violation)

**If yes to any:** Refactor or create follow-up CAN task

---

### Step 14: Evidence Collection

**For Stage 0 work, collect evidence:**
- Test output (save to validation-reports/)
- Screenshots (for UI work)
- Performance metrics (Lighthouse, bundle size)
- Accessibility scans (WCAG)

**Link evidence in:**
- Stage 0 launch gate checklist
- Work log completion entry
- Plan completion report

---

## Quick Reference Checklist

Before starting ANY work:

```bash
# 1. Identify active constraint
cat docs/plans/re-strategy/strategy-alignment-matrix.md | grep "🟡"

# 2. Check CAN task exists
grep "your-feature" docs/plans/re-strategy/backlog/master-task-list.csv

# 3. Check runbook exists
ls docs/runbooks/**/*your-topic*.md

# 4. Check active plan exists
ls docs/plans/active/ | grep "your-feature"

# 5. Check Tier 1 file rules
grep "your-file.ts" CANONICAL_REFERENCES.md
```

If ANY of these fail, STOP and resolve before coding.

---

## Common Mistakes to Avoid

❌ **Don't start coding without Phase 0 checks**
- Result: Work doesn't align with constraint, gets rejected or refactored

❌ **Don't skip runbook creation when CAN task exists**
- Result: Implementation inconsistent, future work diverges

❌ **Don't mark constraint complete without updating all artifacts**
- Result: Matrix out of sync, weekly reviews broken

❌ **Don't work on future constraints while current one incomplete**
- Result: Violates Theory of Constraints, creates bottleneck confusion

✅ **Do follow the numbered steps in order**
✅ **Do update work log frequently**
✅ **Do verify exit criteria before marking complete**
✅ **Do ask Brent if anything is unclear**

---

## Integration with CLAUDE.md

This workflow **extends** CLAUDE.md TDD rules:

- **CLAUDE.md:** TDD mechanics (write test, implement, refactor)
- **This workflow:** Strategic alignment around TDD (which constraint, which CAN task, which exit criteria)

Use both together:
1. Phase 0: Alignment checks (this doc)
2. Implementation: TDD cycle (CLAUDE.md)
3. Phase 2-3: Verification and evidence (this doc)

---

*Last updated: 2025-10-31*
