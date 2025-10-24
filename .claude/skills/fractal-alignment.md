# Fractal Alignment Skill

**Purpose:** Enforce the fractal double-entry alignment system for all code changes.

**When to use:** Before, during, and after any code/plan/runbook modification to ensure alignment across all tiers (Code → Runbooks → Plans → Roadmap → Re-Strategy).

---

## System Overview

You are enforcing a **fractal double-entry system** where every change:
1. **References tier above** (upward alignment to strategy)
2. **Has evidence below** (downward verification with tests/metrics)
3. **Serves active constraint** (Theory of Constraints - single bottleneck)
4. **Creates audit trail** (work log documentation)

**Tiers:**
- **Tier 5:** Re-strategy parts (`docs/plans/re-strategy/Part*.md`)
- **Tier 4:** Roadmap constraints (`docs/plans/ROADMAP.md`)
- **Tier 3:** Active plans (`docs/plans/active/*.md`)
- **Tier 2:** Runbooks (`docs/runbooks/**/*.md`)
- **Tier 1:** Code (`CANONICAL_REFERENCES.md` files)
- **Tier 0:** Tests (`tests/**/*.test.ts`)

---

## Phase 1: CHECK Operation (Pre-Implementation)

### Step 1.1: Load Context

**Read these files in order:**

```bash
# Strategy layer
docs/plans/re-strategy/strategy-alignment-matrix.md
docs/plans/ROADMAP.md
docs/plans/re-strategy/backlog/master-task-list.csv

# Tracking layer
docs/work-log.md (last 200 lines)
docs/reports/strategy-alignment-inventory.md

# Governance
CANONICAL_REFERENCES.md
```

### Step 1.2: Identify Change Tier

Analyze user request and determine tier:

- Mentions "test" or "spec" → **Tier 0**
- Mentions file in `lib/`, `components/`, `app/` → **Tier 1**
- Mentions "runbook" or "guide" → **Tier 2**
- Mentions "plan" → **Tier 3**
- Mentions "roadmap" or "constraint" → **Tier 4**
- Mentions "re-strategy" or "Part 0X" → **Tier 5**

**Output:** "Target tier: Tier [0-5]"

### Step 1.3: Verify Active Constraint

**From strategy-alignment-matrix.md:**

```bash
# Find the constraint with 🟡 status
grep "🟡" docs/plans/re-strategy/strategy-alignment-matrix.md
```

**Questions:**
1. Is there exactly ONE constraint with 🟡? (If multiple: RED FLAG)
2. What is the active constraint? (A, B, C, or D)
3. Does user request serve this constraint?

**Output:** "Active constraint: Constraint [A/B/C/D]"

**BLOCKING CHECK:** If user request targets different constraint → STOP and say:
```
❌ ALIGNMENT BLOCK: User request targets Constraint [X], but active constraint is [Y].

Per Theory of Constraints, we focus on single bottleneck at a time.

Options:
1. Defer this work until Constraint [Y] complete
2. Re-scope to serve Constraint [Y]
3. Discuss with Brent if truly urgent

Cannot proceed without resolution.
```

### Step 1.4: Check CAN Task Exists

**Search master-task-list.csv:**

```bash
grep -i "keywords from user request" docs/plans/re-strategy/backlog/master-task-list.csv
```

**Questions:**
1. Does a CAN task exist for this work?
2. If yes: What's the CAN-### ID?
3. What's the status? (Planned/In Progress/Completed)
4. Is there an owner assigned?

**Output:** "CAN task: CAN-[###] - [Description] (Status: [X])"

**BLOCKING CHECK:** If no CAN task exists and work is non-trivial → STOP and say:
```
⚠️ NO CAN TASK: This work has no CAN task in the backlog.

This could indicate:
1. Work is not aligned with re-strategy
2. CAN task should be created
3. Work is exploratory (document in work log)

Request user confirmation:
- Should I create a CAN task for this? (Provide CAN-XXX number + description)
- Is this exploratory work? (Will log as experiment)
- Should we discuss with Brent first?
```

### Step 1.5: Check Runbook Prerequisite

**If tier is 1 or 0 (code/tests), verify runbook exists:**

```bash
# Search for relevant runbook
ls docs/runbooks/**/*.md | grep -i "topic keywords"
```

**Questions:**
1. Does a runbook exist for this implementation?
2. If yes: What's the file path?
3. If no: Is there a CAN task to create it?

**Output:** "Runbook: [path] or [CAN-### to create]"

**BLOCKING CHECK:** If runbook missing and no CAN task → STOP and say:
```
🚫 MISSING RUNBOOK: Code implementation requires Tier 2 runbook first.

Per fractal alignment: Tier 2 (runbook) must exist before Tier 1 (code).

Options:
1. Create runbook now (extract patterns from similar code)
2. Add CAN task to backlog for runbook creation
3. Reference existing runbook if applicable

Cannot implement code before implementation guide exists.
```

### Step 1.6: Check Tier 1 Rules

**If modifying canonical files:**

```bash
grep "filename" CANONICAL_REFERENCES.md
```

**Questions:**
1. Is this a Tier 1 (canonical) file?
2. What are the change rules?
3. Are there test requirements?
4. Are there review requirements?

**Output:** "Tier 1 rules: [rules from CANONICAL_REFERENCES]"

**BLOCKING CHECK:** If Tier 1 rules exist → Must follow them (note in verification phase)

### Step 1.7: Check for Conflicts

**Search work log and active plans:**

```bash
# Recent work on same files/features
grep -i "keywords" docs/work-log.md
grep -i "keywords" docs/plans/active/*.md
```

**Questions:**
1. Is there recent work on this area? (last 2 weeks)
2. Is there an active plan already covering this?
3. Are there blockers noted in work log?

**Output:** "Conflicts: [none | describe conflict]"

**BLOCKING CHECK:** If active plan already exists → Should update existing plan, not create new one

### Step 1.8: CHECK Phase Summary

**Create checkpoint report:**

```markdown
## Pre-Implementation Checkpoint - [Feature Name]

**Date:** [YYYY-MM-DD]
**User Request:** [summarize]

### Alignment Verification
- ✅/❌ Target tier: Tier [0-5]
- ✅/❌ Active constraint: Constraint [A/B/C/D]
- ✅/❌ Request serves active constraint: [yes/no]
- ✅/❌ CAN task: CAN-[###] or [reason if none]
- ✅/❌ Runbook: [path] or [CAN-### to create]
- ✅/❌ Tier 1 rules: [rules or N/A]
- ✅/❌ No conflicts: [none or describe]

### Decision
[✅ PROCEED | ❌ BLOCKED - resolve issues above]

### Next Steps (if PROCEED)
1. [Implementation steps]
2. [Verification steps]
3. [Evidence to collect]
```

**If ANY check failed → STOP. Present checkpoint report to user. Do not proceed to implementation.**

**If ALL checks passed → Present checkpoint report and proceed to Phase 2.**

---

## Phase 2: IMPLEMENT Operation (During)

### Step 2.1: Follow TDD Cycle

**MANDATORY: Write test first (CLAUDE.md TDD rules)**

1. Write failing test
2. Run test to confirm failure
3. Implement ONLY enough to pass test
4. Run test to confirm success
5. Refactor while keeping tests green

**Reference runbook:** During implementation, consult runbook for patterns (don't guess).

### Step 2.2: Create Tier References

**While implementing, create references:**

**If writing code (Tier 1):**
```typescript
// In component file:
// Implementation follows: docs/runbooks/forms/mobile-optimization-guide.md
// Serves: Constraint A, CAN-051 (mobile forms)
```

**If creating runbook (Tier 2):**
```markdown
## Constraint Alignment
This runbook supports Constraint A (Public Surface Readiness).
References: Part 04 Brand & UX Canon
Related CAN tasks: CAN-051
```

**If updating plan (Tier 3):**
```markdown
## Constraint Alignment
**Constraint:** Constraint A – Public Surface Readiness
**CAN Tasks:** CAN-051, CAN-037
**Re-Strategy References:** Part 02 (Stage 0 gate), Part 04 (Brand canon)
```

### Step 2.3: Track Progress with TodoWrite

**Create paired todos:**

```javascript
[
  // Entry 1: The work
  {content: "Implement [feature] per runbook", status: "in_progress", activeForm: "Implementing"},

  // Entry 2: The verification
  {content: "Verify [feature] meets exit criteria", status: "pending", activeForm: "Verifying"}
]
```

**Mark completed IMMEDIATELY** after each todo finishes.

### Step 2.4: Log in Work Log

**Add entry to docs/work-log.md:**

```markdown
## [Feature Name] - In Progress

**Date:** [YYYY-MM-DD]
**Constraint:** Constraint [A/B/C/D]
**CAN Task:** CAN-[###]
**Tier:** [0-5]

### Implementation Notes
- Files modified: [list]
- Runbook referenced: [path]
- Tests added/updated: [list]
- Next: [what's remaining]
```

---

## Phase 3: VERIFY Operation (Post-Implementation)

### Step 3.1: Collect Evidence

**Based on tier, collect appropriate evidence:**

**Tier 0/1 (Tests/Code):**
- Run tests: `npm test [relevant suite]`
- Save output to: `validation-reports/test-results-[feature]-[date].txt`
- Check coverage: `npm test -- --coverage`

**Tier 1 (Code):**
- Take screenshots (if UI change): `validation-reports/screenshots/[feature]-[date].png`
- Run Lighthouse (if public surface): `validation-reports/lighthouse-[date].json`
- Check bundle size: `npm run build` output

**Tier 2 (Runbook):**
- Verify code examples work (test them)
- Check runbook referenced in code comments

**Tier 3 (Plan):**
- Verify all task checkboxes marked
- Verify success criteria met
- Create completion report if plan fully done

### Step 3.2: Verify Success Criteria

**From the tier above, check success criteria:**

**If Tier 0/1 → Check Plan (Tier 3):**
```bash
# Open relevant plan
code docs/plans/active/[plan-name].md

# Check "Success Criteria" section
# Verify each criterion met
```

**If Tier 2 → Check Roadmap (Tier 4):**
```bash
# Open roadmap
code docs/plans/ROADMAP.md

# Check constraint exit criteria
# Verify this runbook contributes to exit
```

**If Tier 3 → Check Matrix (Tier 4):**
```bash
# Open matrix
code docs/plans/re-strategy/strategy-alignment-matrix.md

# Check constraint row
# Verify this plan listed in "Active Plans" column
```

### Step 3.3: Update Tier Above

**Propagate status update:**

**If code complete → Update plan:**
- Mark task checkbox: `- [x] Implement feature X`
- Add evidence link: `Evidence: validation-reports/...`

**If plan complete → Update constraint:**
- Move plan to archive: `docs/plans/archive/[year]/[month]/`
- Update matrix constraint status (if all plans done)

**If constraint complete → Update roadmap:**
- Change emoji: 🟡 → ✅
- Document exit criteria satisfaction

### Step 3.4: Link Evidence

**In Stage 0 gate (if Constraint A):**

```markdown
- [x] Form accessibility verified
  - Evidence: validation-reports/accessibility-scan-2025-10-31.pdf
  - Tests: tests/a11y/form-accessibility.test.ts (passing)
  - Date: 2025-10-31
```

**In plan completion report:**

```markdown
## Evidence Archive
- Test results: validation-reports/test-results-mobile-forms-2025-10-31.txt
- Screenshots: validation-reports/screenshots/mobile-forms-*.png
- Lighthouse: validation-reports/lighthouse-2025-10-31.json
```

### Step 3.5: Update Work Log

**Add completion entry:**

```markdown
## [Feature Name] - Complete ✅

**Date:** [YYYY-MM-DD]
**Constraint:** Constraint [A/B/C/D]
**CAN Task:** CAN-[###] (Completed)
**Tier:** [0-5]

### Summary
- Implemented: [what was built]
- Tests: [X/X passing]
- Evidence: [links to validation reports]

### Tier References
- ↑ Serves: [plan/constraint/re-strategy reference]
- ↓ Verified by: [tests/evidence files]

### Next Steps
- [Follow-up work if any]
```

---

## Phase 4: RECONCILE Operation (Periodic)

**This phase runs during weekly constraint review.**

### Step 4.1: Verify Tier Balance

**For each constraint in matrix:**

```bash
# Check bidirectional references
1. Does constraint reference re-strategy part? (↑ upward)
2. Do plans reference constraint? (↓ downward)
3. Do runbooks exist for plans? (↓ downward)
4. Does code follow runbooks? (↓ downward)
5. Do tests verify code? (↓ downward)
6. Is evidence linked? (↓ downward)
```

**If ANY link broken → Flag drift for remediation.**

### Step 4.2: Detect Drift Patterns

**Red flags:**

🚩 **Multiple constraints 🟡:** Violates Theory of Constraints
🚩 **Plan references future constraint:** Premature work
🚩 **Code without runbook:** Tier skipping
🚩 **Status ✅ without evidence:** Unverified claim
🚩 **CAN task "In Progress" >2 weeks:** Likely blocked

**For each red flag → Create remediation task.**

### Step 4.3: Update Matrix

**After reconciliation:**

```bash
# Update strategy-alignment-matrix.md
# Change status emojis based on evidence
# Add notes for any status changes
```

---

## Output Format

After completing CHECK/IMPLEMENT/VERIFY cycle, provide:

```markdown
## Fractal Alignment Report - [Feature Name]

### CHECK Phase ✅
- Target tier: Tier [X]
- Active constraint: Constraint [X]
- CAN task: CAN-[###]
- Runbook: [path or N/A]
- Tier 1 rules: [followed or N/A]
- Conflicts: None
- **Decision: PROCEED**

### IMPLEMENT Phase ✅
- Files modified: [list]
- Tests created: [list]
- Runbook referenced: [path]
- Tier references created: [code comments, plan sections]

### VERIFY Phase ✅
- Evidence collected:
  - Test results: [path]
  - Screenshots: [path]
  - Metrics: [values]
- Success criteria verified: [list from plan/roadmap]
- Tier above updated: [plan/constraint/matrix]
- Work log updated: [entry added]

### Audit Trail
- ↑ Tier 5 (Re-Strategy): [Part reference]
- ↑ Tier 4 (Roadmap): [Constraint + exit criterion]
- ↑ Tier 3 (Plan): [Plan + success criterion]
- ↑ Tier 2 (Runbook): [Runbook + pattern]
- → Tier 1 (Code): [Files modified]
- ↓ Tier 0 (Tests): [Test files + results]
- ↓ Evidence: [Validation reports]

### Balance Check
- [✅] References tier above
- [✅] Evidence from tier below
- [✅] Serves active constraint
- [✅] Audit trail complete
- [✅] Work logged

**System Status: BALANCED** ⚖️
```

---

## Integration with Other Skills

**Before invoking other skills:**

1. Run CHECK phase first
2. If blocked → Don't invoke skill, report blocker
3. If passed → Invoke skill with context:
   - "This work serves Constraint A, CAN-051"
   - "Must follow runbook: docs/runbooks/forms/mobile-optimization-guide.md"
   - "Must update plan: docs/plans/active/2025-10-18-lead-form-mobile-first-rebuild.md"

**After skill completes:**

1. Run VERIFY phase
2. Collect evidence from skill output
3. Update tracking documents
4. Report audit trail

---

## When to Invoke This Skill

**Automatically invoke for:**
- Any request to modify code in `lib/`, `components/`, `app/`
- Any request to create/update plans or runbooks
- Any request to mark constraint complete
- Before weekly review (reconciliation)

**Can skip for:**
- Reading files (no modification)
- Answering questions about codebase
- Exploratory analysis (not implementing)

**User can explicitly invoke:**
- `/fractal-alignment` command
- Mention "check alignment" or "verify tiers"

---

*Last updated: 2025-10-31*
