ABOUTME: Critical enhancement needed - add Tier 6 (Meta) to fractal alignment system
ABOUTME: System must verify itself (CLAUDE.md, skills, runbooks must check each other)

# Meta-Tier Enhancement Needed

**Date:** 2025-10-31
**Priority:** CRITICAL
**Status:** TO DO (next session)

---

## The Problem

The fractal alignment system currently has Tiers 0-5, but **misses Tier 6 (Meta)** - the governance layer itself.

**Current state:**
- Tier 5: Re-Strategy
- Tier 4: Roadmap
- Tier 3: Plans
- Tier 2: Runbooks
- Tier 1: Code
- Tier 0: Tests

**Missing:** Tier 6 (Meta) - CLAUDE.md, AGENTS.md, `.claude/skills/*`

**Why this matters:**
- CLAUDE.md is the "gateway" to understanding the entire system
- The fractal alignment system talks about checking tiers, but doesn't check if **its own documentation** is aligned
- The system is not truly fractal until it applies to itself
- We're not "eating our own dog food"

---

## What Needs to Happen

###  1. Add Tier 6 to All Documentation

**Files to update:**
- `docs/runbooks/strategy/fractal-alignment-system.md`
- `.claude/skills/fractal-alignment.md`
- `CLAUDE.md` (already updated with meta-framework section)
- `docs/runbooks/strategy/README.md`

**Changes:**
```markdown
### Software Alignment Double-Entry

Change: Add homepage hero copy
Tier 0:  Tests (e2e/homepage.spec.ts)    → Copy verified in browser
Tier 1:  Code (app/page.tsx)             → Hero component updated
Tier 2:  Runbook (voice-and-tone.md)     → Copy follows voice guide
Tier 3:  Plan (homepage-copy-plan.md)    → Task marked complete
Tier 4:  Roadmap (Constraint A)          → Exit criterion verified
Tier 5:  Re-Strategy (Part 04)           → Brand canon satisfied
Tier 6:  CLAUDE.md                       → Fractal Alignment enforced ← NEW
                                          -------------------------
Balance: All tiers reference each other   → System aligned
```

**The 7 Tiers (including meta-tier):**
- **Tier 6 (Meta):** System Governance - `CLAUDE.md`, `AGENTS.md`, `.claude/skills/*`
- **Tier 5:** Re-Strategy - `docs/plans/re-strategy/Part*.md`
- **Tier 4:** Roadmap Constraints - `docs/plans/ROADMAP.md`
- **Tier 3:** Active Plans - `docs/plans/active/*.md`
- **Tier 2:** Runbooks - `docs/runbooks/**/*.md`
- **Tier 1:** Code - Files listed in `CANONICAL_REFERENCES.md`
- **Tier 0:** Tests - `tests/**/*.test.ts`

###  2. Add Scale 6: Meta-Level Verification

Add new section to `fractal-alignment-system.md`:

```markdown
### Scale 6: Meta-Level (Tier 5 → Tier 6)
\```
System Governance:
  Entry 1: Re-strategy parts satisfy constraints
  Entry 2: CLAUDE.md enforces fractal alignment

Verification: Runbooks exist for all processes mentioned in CLAUDE.md
Reconciliation: Meta-audit checks that docs self-reference correctly
\```

**Example:**
- CLAUDE.md says: "Follow constraint implementation workflow"
- Verification: Does `docs/runbooks/strategy/constraint-implementation-workflow.md` exist? ✅
- Verification: Does it implement what CLAUDE.md describes? ✅
- Verification: Is it referenced in re-strategy? ✅
```

###  3. Add Self-Verification Section

Add new section in `fractal-alignment-system.md`:

```markdown
## Meta-Verification: The System Checks Itself

**True fractal property:** The alignment system must apply to itself.

### Meta-Tier Checklist

**Every runbook/skill/governance doc must:**
1. ✅ Reference tier above (CLAUDE.md → re-strategy → constraints)
2. ✅ Have evidence below (tests, usage logs, work log entries)
3. ✅ Serve active constraint (even meta-docs align with strategy)
4. ✅ Create audit trail (changes to CLAUDE.md logged in work log)

### Example: This File (`fractal-alignment-system.md`)

**Tier 6 (Meta):** Itself - describes the system
**Tier 5:** References re-strategy (Part 02 constraint chain)
**Tier 4:** Serves Constraint A (prevents drift during public surface work)
**Tier 3:** Referenced by plans (plans say "per fractal alignment")
**Tier 2:** Implemented by other runbooks (workflow, review, audit)
**Tier 1:** Code follows patterns (tier references in comments)
**Tier 0:** Tests verify (skills work, processes followed)
**Evidence:** Work log shows system being used

**Self-check:** Does this file follow its own rules? YES
```

### 4. Update Fractal Balance Equation

Change from:
```
∀ tiers t ∈ {0,1,2,3,4,5}:
```

To:
```
∀ tiers t ∈ {0,1,2,3,4,5,6}:
  references_up(t) ≠ ∅        // Every tier references tier above
  ∧
  evidence_down(t) ≠ ∅        // Every tier has evidence below
  ∧
  active_constraint_only(t)   // All work serves active constraint
  ∧
  audit_trail_exists(t)       // Work log documents change
  ∧
  (t = 6 → self_consistent(t)) // Meta-tier verifies itself ← NEW
```

### 5. Update Visualization Diagram

Add Tier 6 at the top:

```
                CLAUDE.md + AGENTS.md (Tier 6)
                System Governance
                      ║
                      ║ (enforces alignment)
                      ▼
                Re-Strategy (Tier 5)
                Part 01, 02, 03, 04...
                      ║
                      ║ (defines constraints)
                      ▼
                Roadmap (Tier 4)
                Constraint A/B/C/D
                      ║
    [rest of diagram continues...]
```

### 6. Update Skills to Include Tier 6 Checks

`.claude/skills/fractal-alignment.md` needs:

```markdown
## Step 1: Identify Tier
What tier is this change targeting?
- [ ] Tier 6 (meta - CLAUDE.md, AGENTS.md, skills)  ← NEW
- [ ] Tier 5 (re-strategy)
- [ ] Tier 4 (roadmap/constraints)
- [ ] Tier 3 (plans)
- [ ] Tier 2 (runbooks)
- [ ] Tier 1 (code)
- [ ] Tier 0 (tests)

## Step 6 Meta-Checks (NEW):
If modifying Tier 6 files:
1. Does change align with re-strategy?
2. Do runbooks implement what CLAUDE.md describes?
3. Are skills consistent with documented workflow?
4. Is this change logged in work log?
5. Self-verification: Does new meta-doc follow its own rules?
```

### 7. Add Meta-Audit to Weekly Review

Update `weekly-constraint-review.md`:

```markdown
## Part 8: Meta-Verification (5 minutes) ← NEW

**Check that governance docs are aligned:**

1. **CLAUDE.md references:**
   - Does it reference all critical runbooks?
   - Are runbooks listed actually created?
   - Is fractal alignment section accurate?

2. **Skills consistency:**
   - Do skills implement CLAUDE.md workflow?
   - Are skill prompts up-to-date?

3. **Runbook completeness:**
   - Are all processes mentioned in CLAUDE.md documented?
   - Do runbooks cross-reference correctly?

**Action:** Update docs if drift detected.
```

---

## Implementation Plan

**Next session:**

1. Update `fractal-alignment-system.md` (add Tier 6, self-verification section)
2. Update `.claude/skills/fractal-alignment.md` (add Tier 6 checks)
3. Update `constraint-implementation-workflow.md` (add meta-tier workflow)
4. Update `weekly-constraint-review.md` (add Part 8: Meta-Verification)
5. Update `constraint-a-audit-checklist.md` (add Section 9: Meta-Tier Governance)
6. Update `README.md` in strategy runbooks (reflect 7 tiers, not 6)
7. Commit all meta-tier enhancements

**Estimated time:** 1-2 hours

---

## Why This Is Critical

Without Tier 6:
- ❌ System talks about alignment but doesn't check if CLAUDE.md is aligned
- ❌ Not truly fractal (doesn't apply to itself)
- ❌ Meta-docs can drift from reality
- ❌ No verification that runbooks implement what CLAUDE.md describes

With Tier 6:
- ✅ System is truly self-referential
- ✅ Meta-docs must follow same rules as code
- ✅ Weekly review catches governance doc drift
- ✅ CLAUDE.md changes treated like code changes (alignment checks required)

---

*Created: 2025-10-31*
*Follow-up task for next session*
