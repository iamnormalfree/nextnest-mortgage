ABOUTME: Weekly constraint review process to maintain re-strategy alignment.
ABOUTME: Ensures systematic progress tracking, evidence collection, and constraint sequencing.

# Weekly Constraint Review

**Frequency:** Every Monday (or weekly cadence of choice)
**Duration:** 30-45 minutes
**Participants:** Brent, engineering leads, AI agents (via work log)
**Outcome:** Updated matrix, assigned CAN tasks, clear priorities for the week

---

## Purpose

This review ensures:
1. **Single bottleneck focus** - Team works on active constraint only
2. **Evidence-based progress** - Status updates backed by test results, metrics, logs
3. **Runbook-first discipline** - No implementation without prerequisite documentation
4. **Early drift detection** - Catch misalignment before it compounds

---

## Pre-Meeting Preparation (15 minutes)

### Owner: Brent or Review Lead

**Open these documents (in browser tabs or editor):**

```bash
# Core strategy docs
docs/plans/re-strategy/strategy-alignment-matrix.md
docs/plans/ROADMAP.md
docs/plans/re-strategy/stage0-launch-gate.md
docs/plans/re-strategy/backlog/master-task-list.csv

# Tracking docs
docs/work-log.md
docs/reports/strategy-alignment-inventory.md

# Active plans directory
docs/plans/active/
```

**Skim work-log.md for:**
- Completion entries since last review
- Blockers or issues raised
- New plans created or archived

**Note any surprises or concerns** to discuss in review.

---

## Meeting Agenda

### Part 1: Constraint Status Review (10 minutes)

**Open:** `docs/plans/re-strategy/strategy-alignment-matrix.md`

**For each constraint row (A, B, C, D):**

1. **Read current status emoji** (⬜/🟡/✅/🔴)
2. **Ask: "Is this status still accurate?"**
   - If Constraint A is 🟡: "What progress this week?"
   - If status changed: "What evidence supports the change?"
3. **Update emoji if needed** with brief note in matrix

**Guiding questions:**
- Is the active constraint (🟡) making measurable progress?
- Are we blocked (🔴)? If yes, what unblocks us?
- Did any constraint complete (✅)? If yes, did we update all artifacts?

**Action:** Update status emojis in matrix. Add one-line notes for any changes.

---

### Part 2: CAN Task Progress (10 minutes)

**Open:** `docs/plans/re-strategy/backlog/master-task-list.csv`

**Focus on active constraint's CAN tasks:**

1. **Filter for active constraint** (e.g., if Constraint A is 🟡, review CAN-001, CAN-016, CAN-017, etc.)
2. **For each CAN task in "In Progress" status:**
   - Ask: "What's the blocker or progress?"
   - Ask: "Do we have evidence it's complete?" (test results, runbook created, etc.)
   - Update Status column: Planned → In Progress → Completed
3. **Identify next CAN tasks to start:**
   - Which CAN tasks are critical path for exit criteria?
   - Do they have owners assigned?
   - Are prerequisite CAN tasks complete?

**Action:** Update Status, Owner, and Notes columns. Assign 2-3 CAN tasks for the coming week.

---

### Part 3: Active Plans Review (10 minutes)

**Open:** `docs/plans/active/` directory

**Questions:**
1. **How many active plans reference the active constraint?**
   - Should be: Most/all plans focus on active constraint
   - Red flag: Plans working on future constraints (B/C/D while A is incomplete)

2. **Are any plans complete or stale?**
   - Complete: Archive to `docs/plans/archive/[year]/[month]/`
   - Stale: Clarify ownership or defer to backlog

3. **Are new plans needed?**
   - Check if assigned CAN tasks need implementation plans
   - Create plan templates for newly assigned work

**Action:** Archive completed plans. Assign owners to create new plans if needed.

---

### Part 4: Runbook Gap Analysis (5 minutes)

**Open:** `docs/reports/strategy-alignment-inventory.md`

**Check "Missing" runbooks for active constraint:**

1. **Are missing runbooks blocking implementation?**
   - Example: If CAN-036 (voice guide) is assigned but runbook doesn't exist, can't start homepage copy work
2. **Which runbooks must be created this week?**
   - Prioritize runbooks prerequisite for active CAN tasks
3. **Are runbooks being created before code?**
   - Red flag: Code committed without corresponding runbook

**Action:** Update inventory report with newly created runbooks. Schedule runbook creation for blocking gaps.

---

### Part 5: Exit Criteria Check (5 minutes)

**Open:** `docs/plans/ROADMAP.md` (active constraint section)

**For active constraint, review exit criteria:**

1. **Which exit criteria are complete?**
   - Ask: "Where's the evidence?" (test results, metrics, Stage 0 checklist)
2. **Which exit criteria are in progress?**
   - Estimate % complete
   - Identify blockers
3. **Are we on track to meet exit criteria?**
   - If no: What changes needed?
   - If yes: What's next after constraint completes?

**Action:** Document exit criteria status. Update Stage 0 gate if applicable.

---

### Part 6: Evidence Collection (5 minutes)

**For Stage 0 work (Constraint A), verify evidence logged:**

**Open:** `docs/plans/re-strategy/stage0-launch-gate.md`

**Check each checklist item:**
- Is evidence link provided? (test output, screenshot, metric)
- Is evidence current (within last 2 weeks)?
- Does evidence support "complete" status?

**Action:** Request missing evidence. Update Stage 0 gate with links.

---

### Part 7: Meeting Output (5 minutes)

**Document the review:**

**Create entry in:** `docs/work-log.md`

```markdown
## Weekly Constraint Review - [Date]

**Active Constraint:** Constraint [A/B/C/D] - [Name]
**Status:** [⬜/🟡/✅/🔴]

### Progress This Week
- [Key accomplishment 1]
- [Key accomplishment 2]

### CAN Tasks Assigned
- CAN-[###]: [Description] → [Owner]
- CAN-[###]: [Description] → [Owner]

### Blockers
- [Blocker 1] → [Action to resolve]

### Plans Archived
- [Plan name] → archived to [path]

### Next Week Priority
- [Top priority item]
- [Second priority item]

### Notes
- [Any clarifications or decisions made]
```

**Action:** Save meeting notes. Share with team (if applicable).

---

## Review Checklist

Use this checklist during each weekly review:

```markdown
## Weekly Review Checklist - [Date]

### Pre-Meeting
- [ ] Opened all core strategy docs
- [ ] Skimmed work-log.md for updates
- [ ] Noted any surprises or concerns

### Part 1: Constraint Status
- [ ] Reviewed all 4 constraint statuses
- [ ] Updated emojis if changed
- [ ] Added notes for any status changes

### Part 2: CAN Tasks
- [ ] Reviewed active constraint CAN tasks
- [ ] Updated Status/Owner/Notes columns
- [ ] Assigned 2-3 CAN tasks for next week

### Part 3: Active Plans
- [ ] Counted plans by constraint
- [ ] Archived completed plans
- [ ] Assigned owners for new plans if needed

### Part 4: Runbook Gaps
- [ ] Checked missing runbooks for active constraint
- [ ] Identified blocking runbooks
- [ ] Scheduled runbook creation

### Part 5: Exit Criteria
- [ ] Reviewed exit criteria for active constraint
- [ ] Documented completion status
- [ ] Identified blockers

### Part 6: Evidence Collection (if Constraint A)
- [ ] Verified Stage 0 gate evidence links
- [ ] Requested missing evidence
- [ ] Updated gate with current evidence

### Part 7: Meeting Output
- [ ] Created work-log.md entry
- [ ] Documented decisions and assignments
- [ ] Shared notes with team
```

---

## Red Flags to Watch For

🚩 **Multiple constraints showing 🟡 (in progress)**
- Violates Theory of Constraints (single bottleneck)
- Action: Move team to active constraint only

🚩 **Active plans working on future constraints**
- Example: Constraint A is 🟡, but plans reference Constraint C
- Action: Defer future work, focus on active constraint

🚩 **CAN tasks "In Progress" for >2 weeks**
- Likely blocked or forgotten
- Action: Escalate blocker or reassess scope

🚩 **Status changed without evidence**
- Example: Constraint marked ✅ but no test results linked
- Action: Request evidence or revert status

🚩 **Runbooks created after code committed**
- Violates Tier 2 → Tier 3 workflow
- Action: Retroactively create runbook, prevent future occurrences

🚩 **Work log has no entries for >1 week**
- Team not documenting or not working
- Action: Remind team of logging discipline

---

## Integration with Other Processes

### Daily Work (Developers/AI Agents)
- Use: `constraint-implementation-workflow.md` for day-to-day alignment
- Update: `docs/work-log.md` when milestones reached

### Weekly Review (This Process)
- Use: This runbook for systematic review
- Update: Matrix, CAN tasks, work log summary

### Monthly/Quarterly Planning
- Use: Matrix and roadmap to assess constraint progression
- Decide: When to activate next constraint (after exit criteria met)

---

## Success Metrics

**Healthy constraint review:**
✅ Active constraint status changes each week (progress visible)
✅ 2-3 CAN tasks assigned and owned
✅ No active plans working on future constraints
✅ Evidence collected for all "complete" items
✅ Runbooks created before implementation starts
✅ Work log entries every week

**Unhealthy constraint review:**
❌ Same status for multiple weeks (stalled)
❌ CAN tasks with no owners or ancient start dates
❌ Plans scattered across multiple constraints
❌ Status changes with no evidence
❌ Code committed before runbooks exist
❌ Work log empty or minimal

---

## Example Review Session

**Date:** 2025-11-04 (Monday)
**Active Constraint:** Constraint A (Public Surface Readiness)

### Part 1: Constraint Status
- Constraint A: 🟡 (was 🟡 last week, still in progress)
- Constraint B/C/D: ⬜ (correct - not started yet)

### Part 2: CAN Tasks
- CAN-036 (voice guide): Assigned to Brent, target this week
- CAN-037 (accessibility checklist): Assigned to Claude, target this week
- CAN-016 (purple token cleanup): Completed (✅) - archived plan found

### Part 3: Active Plans
- 11 active plans, all reference Constraint A ✅
- Archived: 2025-10-22-chat-conversation-persistence-debugging-plan.md (complete)

### Part 4: Runbook Gaps
- Missing: voice-and-tone.md (CAN-036 in progress)
- Missing: accessibility-checklist.md (CAN-037 scheduled)

### Part 5: Exit Criteria
- Lighthouse/PageSpeed: Not yet tested (blocked by purple token cleanup)
- WCAG AA: Blocked by accessibility checklist (CAN-037)
- E2E tests: Passing ✅

### Part 6: Evidence
- Stage 0 gate: 3/10 items complete with evidence
- Need: Lighthouse report, accessibility scan, homepage copy review

### Part 7: Output
- Work log updated with review summary
- Priorities: Complete CAN-036/037, run Lighthouse, collect evidence

**Next week goal:** Stage 0 gate at 6/10 items complete.

---

*Last updated: 2025-10-31*
