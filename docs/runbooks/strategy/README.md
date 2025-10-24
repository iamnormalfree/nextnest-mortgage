ABOUTME: Strategy runbooks index and quick reference guide.
ABOUTME: Start here to understand the fractal alignment system and find the right runbook.

# Strategy Runbooks - Quick Reference

**Purpose:** This directory contains runbooks for maintaining strategic alignment across all development work using the fractal double-entry system.

---

## The Fractal Alignment System

Every code change creates **bidirectional verification** across 6 tiers:

```
Tier 5: Re-Strategy (Part 01-08)
   ║ ↓ defines
Tier 4: Roadmap Constraints (A/B/C/D)
   ║ ↓ defines
Tier 3: Active Plans (what to build)
   ║ ↓ references
Tier 2: Runbooks (how to build)
   ║ ↓ implements
Tier 1: Code (actual implementation)
   ║ ↓ proves
Tier 0: Tests (verification)
   ║ ↓ produces
Evidence: validation-reports/, test-results/
```

**Like double-entry accounting:** Every change recorded at multiple tiers, books must balance.

---

## Runbooks in This Directory

### 1. **Fractal Alignment System**
`fractal-alignment-system.md` (24KB)

**Read this first!** Conceptual foundation explaining:
- The accounting analogy
- Fractal nature (pattern repeats at all scales)
- Bidirectional verification (up & down tiers)
- Balance equation
- Drift patterns and prevention

**When to read:**
- Onboarding to NextNest
- Need to understand "why" behind the system
- Designing new processes

---

### 2. **Constraint Implementation Workflow**
`constraint-implementation-workflow.md` (9KB)

**Use before, during, and after EVERY code change.**

**Contains:**
- Phase 0: Pre-implementation checks (MANDATORY - 5-10 min)
- Phase 1: Implementation with alignment
- Phase 2: Post-implementation verification
- Phase 3: Drift prevention review

**Critical sections:**
- Step-by-step CHECK operation (prevents misalignment)
- Tier reference creation patterns
- Evidence collection requirements

**When to use:**
- Before starting ANY feature, bug fix, or enhancement
- When code review catches alignment issues
- Teaching new developers the workflow

**Quick check:**
```bash
# Before coding:
1. Active constraint? (from matrix)
2. CAN task exists? (from backlog)
3. Runbook exists? (or CAN task to create it)
4. Tier 1 rules? (from CANONICAL_REFERENCES.md)
5. Conflicts? (work log, active plans)

If ANY fails → STOP
```

---

### 3. **Weekly Constraint Review**
`weekly-constraint-review.md` (11KB)

**Run every Monday (or chosen weekly cadence).**

**Contains:**
- 7-part review agenda (30-45 min)
- Reconciliation checklist
- Red flag detection (6 drift patterns)
- Meeting output template

**The 7 Parts:**
1. Constraint status (update emojis)
2. CAN task progress (assign 2-3 for week)
3. Active plans (archive completed, flag future-constraint work)
4. Runbook gaps (schedule blocking runbooks)
5. Exit criteria (verify evidence)
6. Evidence collection (Stage 0 gate)
7. Meeting output (document in work log)

**When to use:**
- Every Monday morning
- Before claiming constraint complete
- When drift suspected (books don't balance)

**Success metrics:**
- ✅ Active constraint status changes weekly
- ✅ 2-3 CAN tasks assigned and owned
- ✅ No future-constraint work
- ✅ Evidence for all ✅ claims

---

### 4. **Constraint A Audit Checklist**
`constraint-a-audit-checklist.md` (17KB)

**Comprehensive audit of Stage 0 launch gate requirements.**

**Contains:**
- 8 sections, 50+ checklist items
- Evidence collection instructions
- Status marking (✅/🟡/❌/🔴)
- Final completion criteria

**The 8 Sections:**
1. Homepage & landing pages
2. Progressive form experience
3. AI broker chat
4. Design system & brand
5. Performance & technical
6. Content & messaging
7. Testing & CI/CD
8. Documentation & handoff

**When to use:**
- Now (get baseline state)
- Before weekly reviews (track progress)
- Before claiming Constraint A complete
- When user asks "are we aligned?"

**Output:**
- Gap analysis report
- Prioritized CAN tasks
- Evidence archive

---

## Integration with CLAUDE.md

**CLAUDE.md now includes:**

```markdown
## Fractal Alignment System (Meta-Framework)

### Mandatory Workflow

1. CHECK Phase (before coding)
   - Active constraint?
   - CAN task exists?
   - Runbook exists?
   - Tier 1 rules?
   - No conflicts?

2. IMPLEMENT Phase
   - Follow TDD cycle
   - Reference runbook patterns
   - Create tier references in code
   - Track with TodoWrite

3. VERIFY Phase
   - Collect evidence
   - Verify success criteria
   - Update tier above
   - Link evidence
   - Update work log
```

**Key rule:** If CHECK phase fails → STOP, do not code.

---

## Integration with Skills

**New skill:** `.claude/skills/fractal-alignment.md`

**What it does:**
- Automatically runs CHECK/IMPLEMENT/VERIFY cycle
- Enforces blocking checks (stops work if misaligned)
- Creates audit trail across all tiers
- Detects drift patterns

**When invoked:**
- Before code modifications
- Before marking constraint complete
- During weekly reviews

**Can invoke manually:** `/fractal-alignment` or mention "check alignment"

---

## Quick Decision Tree

**"Should I use the fractal alignment system for this work?"**

```
Is this work...

├─ Reading files only?
│  └─ NO → Just read, no alignment needed
│
├─ Local experiment (not committed)?
│  └─ OPTIONAL → Log intent/outcome in work log
│
├─ Trivial fix (typo, comment)?
│  └─ OPTIONAL → Quick check, but can skip
│
├─ Code change affecting public surfaces?
│  └─ YES → MANDATORY
│     Use: constraint-implementation-workflow.md
│
├─ New feature or major refactor?
│  └─ YES → MANDATORY
│     Use: constraint-implementation-workflow.md
│
├─ Creating/updating plan or runbook?
│  └─ YES → MANDATORY
│     Use: constraint-implementation-workflow.md
│
└─ Weekly review time?
   └─ YES → MANDATORY
      Use: weekly-constraint-review.md
```

---

## Common Questions

### Q: "This seems like overhead. Why bother?"

**A:** Prevents costly rework. The alternative is:

❌ **Without fractal alignment:**
- Code doesn't serve constraint → Rework (days/weeks)
- Status claimed ✅ without evidence → Can't verify (trust issues)
- Work on future constraints while current incomplete → Bottleneck unchanged (months)
- Runbooks created after code → Inconsistent patterns (technical debt)
- Drift detected after 6 months → Major refactor needed (project delay)

✅ **With fractal alignment:**
- CHECK phase catches misalignment in 5 minutes → Pivot before coding
- VERIFY phase collects evidence → Trusted status updates
- Single-constraint focus → Bottleneck relieved systematically
- Runbooks before code → Consistent patterns from day 1
- Drift detected in 1 week → Quick remediation (hours, not months)

**ROI:** 5-10 min CHECK phase saves days/weeks of rework.

---

### Q: "Which runbook do I use for [scenario]?"

| Scenario | Runbook |
|----------|---------|
| About to start coding | `constraint-implementation-workflow.md` Phase 0 |
| Coding in progress | `constraint-implementation-workflow.md` Phase 1-2 |
| Just finished feature | `constraint-implementation-workflow.md` Phase 2-3 |
| Weekly review meeting | `weekly-constraint-review.md` |
| Check overall alignment | `constraint-a-audit-checklist.md` |
| Understand the system | `fractal-alignment-system.md` |

---

### Q: "What if I don't know what Constraint A is?"

**A:** Run this:

```bash
# 1. Check active constraint
grep "🟡" docs/plans/re-strategy/strategy-alignment-matrix.md

# 2. If Constraint A is 🟡:
cat docs/plans/ROADMAP.md | grep -A 20 "Constraint A"

# 3. Check exit criteria
cat docs/plans/re-strategy/stage0-launch-gate.md
```

Current active constraint is always marked 🟡 in the matrix.

---

### Q: "Can I use this for other projects?"

**A:** Yes! The fractal alignment system is project-agnostic.

**Adapt by:**
1. Create your own Tier 5 (strategy documents)
2. Create your own Tier 4 (roadmap/constraints)
3. Use the same runbooks for implementation workflow
4. Adjust Stage 0 gate for your project's launch criteria

**Core pattern stays the same:** Every change recorded at multiple tiers, bidirectional verification, periodic reconciliation.

---

## Visual Summary

```
┌─────────────────────────────────────────────────────────┐
│              FRACTAL ALIGNMENT SYSTEM                   │
│         (Double-Entry Software Development)             │
└─────────────────────────────────────────────────────────┘

BEFORE CODING (CHECK):
  ↓
constraint-implementation-workflow.md (Phase 0)
  ├─ Active constraint? ━━━━┐
  ├─ CAN task exists?       │
  ├─ Runbook exists?        │ ALL MUST PASS
  ├─ Tier 1 rules?          │ OR STOP
  └─ No conflicts?  ━━━━━━━━┘
  ↓
[If ALL pass → PROCEED]
  ↓
DURING CODING (IMPLEMENT):
  ↓
constraint-implementation-workflow.md (Phase 1)
  ├─ Follow TDD cycle (CLAUDE.md)
  ├─ Reference runbook patterns
  ├─ Create tier references in code
  └─ Track with TodoWrite
  ↓
AFTER CODING (VERIFY):
  ↓
constraint-implementation-workflow.md (Phase 2)
  ├─ Collect evidence (tests, screenshots, metrics)
  ├─ Verify success criteria (from plan/roadmap)
  ├─ Update tier above (plan/constraint/matrix)
  └─ Link evidence + update work log
  ↓
WEEKLY (RECONCILE):
  ↓
weekly-constraint-review.md
  ├─ Review constraint status (update emojis)
  ├─ Check CAN task progress (assign 2-3)
  ├─ Verify tiers balance (no drift)
  └─ Detect red flags (remediate)
  ↓
WHEN CLAIMING COMPLETE (AUDIT):
  ↓
constraint-a-audit-checklist.md
  ├─ Verify all 50+ items ✅
  ├─ Evidence for every claim
  ├─ Exit criteria satisfied
  └─ Stakeholders reviewed
  ↓
[Constraint A: 🟡 → ✅]
  ↓
Activate Constraint B (Theory of Constraints)
```

---

## Next Steps

### For New Developers:

1. **Read:** `fractal-alignment-system.md` (understand why)
2. **Skim:** `constraint-implementation-workflow.md` (learn workflow)
3. **Try:** Before your next code change, run Phase 0 (CHECK)
4. **Ask:** If ANY check fails, ask Brent or senior dev

### For This Week (Constraint A Focus):

1. **Run:** `constraint-a-audit-checklist.md` to get baseline
2. **Prioritize:** Gaps that block Stage 0 launch gate (CAN-036, CAN-037, CAN-016)
3. **Follow:** `constraint-implementation-workflow.md` for all work
4. **Review:** Monday using `weekly-constraint-review.md`

### For Brent (Weekly Review):

1. **Every Monday:** Run `weekly-constraint-review.md` (30-45 min)
2. **Assign:** 2-3 CAN tasks for the week
3. **Detect:** Any red flags (drift patterns)
4. **Document:** Update work log with review summary

---

*Last updated: 2025-10-31*
