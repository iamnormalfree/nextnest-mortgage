ABOUTME: Analysis of oversized plans in docs/plans/active/ and their relationship to re-strategy runbook CAN tasks.
ABOUTME: Identifies what should be extracted to runbooks and whether those runbooks are tracked in the backlog.

# Plan Refactoring Analysis - 2025-10-31

**Date:** 2025-10-31
**Context:** Phase 6 QA identified 5 plans approaching/exceeding length limits
**Goal:** Map each plan to re-strategy runbook CAN tasks and determine extraction strategy

---

## Summary

| Plan | Lines | Status | Runbook Needed | CAN Task? | Action |
|------|-------|--------|----------------|-----------|--------|
| 2025-10-22-ai-broker-realtime-upgrade-plan.md | ~~402~~ → 236 | ✅ Fixed | chat-event-mirroring.md, realtime-implementation-guide.md | CAN-033 | **COMPLETED** |
| 2025-10-18-lead-form-mobile-first-rebuild.md | 230 | ⚠️ Warning | Mobile forms optimization guide | ❌ Not tracked | **Recommend new CAN task** |
| 2025-10-30-dr-elena-audit-plan.md | 212 | ⚠️ Warning | Dr Elena calculation audit procedures | ❌ Not tracked | **Consider archiving** (one-time audit) |
| 2025-10-21-ai-broker-chat-activation-plan.md | 195 | ⚠️ Warning | Chat activation procedures | Partial (CAN-034) | **Extract to existing AI_BROKER guide** |
| 2025-10-22-ai-broker-sla-measurement-remediation-plan.md | 196 | ⚠️ Warning | SLA monitoring & alerting guide | ❌ Not tracked | **Extend monitoring docs** |
| 2025-10-30-progressive-form-experience-implementation-plan.md | 192 | ⚠️ Warning | Forms UX patterns & validation | ❌ Not tracked | **Extend FORMS_ARCHITECTURE_GUIDE** |

---

## Plan-by-Plan Analysis

### 1. ✅ 2025-10-22-ai-broker-realtime-upgrade-plan.md (COMPLETED)

**Original:** 402 lines → **Refactored:** 236 lines (41% reduction)

**Extracted runbooks:**
- `docs/runbooks/data/chat-event-mirroring.md` (CAN-033 ✅)
- `docs/runbooks/chat/realtime-implementation-guide.md` (comprehensive Ably guide)

**Re-strategy alignment:** ✅ CAN-033 fulfilled
**Status:** Complete, serves as model for other refactorings

---

### 2. ⚠️ 2025-10-18-lead-form-mobile-first-rebuild.md (230 lines)

**Current state:**
- References non-existent runbooks: `docs/runbooks/mobile-form-optimization/tasks/task-2-conditional-fields.md`
- Contains implementation patterns (session storage details, A/B testing setup)
- Has detailed technical specifications for conditional visibility, smart defaults

**What should be extracted:**
1. **Mobile Forms Optimization Guide** (new runbook)
   - Touch target standards (48px minimum)
   - Conditional field visibility patterns
   - Smart defaults system architecture
   - Session persistence using existing `useLoanApplicationStorage` hook
   - A/B testing framework setup

**Re-strategy status:**
- ❌ **No CAN task exists** for mobile forms runbook
- Closest match: Existing `docs/runbooks/FORMS_ARCHITECTURE_GUIDE.md` (should be extended)

**Recommendation:**
- **Option A:** Create new `docs/runbooks/forms/mobile-optimization-guide.md`
- **Option B:** Extend existing `FORMS_ARCHITECTURE_GUIDE.md` with "Mobile Optimization" section
- **Backlog:** Propose **CAN-051: "Publish mobile forms optimization runbook"** (Stage 0, Systematized Operations)

**Estimated reduction:** 230 lines → ~140 lines (extract ~90 lines of implementation details)

---

### 3. ⚠️ 2025-10-30-dr-elena-audit-plan.md (212 lines)

**Current state:**
- Exhaustive audit procedures for validating persona calculations
- Step-by-step "how to audit" instructions
- Orientation, prerequisites, tooling reference, git hygiene

**What should be extracted:**
- This is a **one-time audit plan**, not ongoing operational documentation
- Contains procedural "HOW" that normally goes in runbooks, but it's audit-specific

**Re-strategy status:**
- ❌ No CAN task for "calculation audit procedures"
- This is a **temporary plan**, not a permanent runbook

**Recommendation:**
- **Option A:** Archive this plan once audit completes (don't extract to runbook)
- **Option B:** Extract general "Calculation Testing & Validation Guide" if patterns repeat
- **Decision needed:** Is this a one-time activity or repeatable process?

**If one-time:** Leave as-is, mark for archival post-completion
**If repeatable:** Extract to `docs/runbooks/testing/calculation-validation-guide.md`

---

### 4. ⚠️ 2025-10-21-ai-broker-chat-activation-plan.md (195 lines)

**Current state:**
- Chat system activation tasks (BullMQ, worker health, integration tests)
- References existing guides but doesn't duplicate them
- Contains activation checklist and rollout procedures

**What should be extracted:**
1. **Chat Activation & Rollout Procedures**
   - BullMQ worker health checks
   - Integration test patterns
   - Staged rollout strategy
   - Production verification checklist

**Re-strategy status:**
- ⚠️ **Partial match:** CAN-034 tracks `docs/runbooks/chat/rate-reveal-guide.md` (different focus)
- Closest existing: `docs/runbooks/AI_BROKER_COMPLETE_GUIDE.md` (should be extended)

**Recommendation:**
- **Extend** existing `docs/runbooks/AI_BROKER_COMPLETE_GUIDE.md` with:
  - "Deployment & Activation" section
  - "Health Checks & Monitoring" section
  - "Rollout Procedures" section

**Estimated reduction:** 195 lines → ~120 lines (extract ~75 lines of procedures)

---

### 5. ⚠️ 2025-10-22-ai-broker-sla-measurement-remediation-plan.md (196 lines)

**Current state:**
- SLA measurement instrumentation
- Monitoring setup (timing injection, Redis timing data, alerting)
- Testing & validation procedures

**What should be extracted:**
1. **SLA Monitoring & Alerting Guide**
   - Timing injection patterns
   - Redis timing data structure
   - Alert threshold configuration
   - Validation procedures

**Re-strategy status:**
- ❌ No CAN task for SLA monitoring runbook
- Related: `lib/monitoring/alert-service.ts` exists (code-level monitoring)

**Recommendation:**
- **Create** `docs/runbooks/monitoring/sla-monitoring-guide.md`
- **Alternative:** Extend existing `docs/runbooks/PRODUCTION_PERFORMANCE_MONITORING.md` if it exists

**Backlog:** Propose **CAN-052: "Publish SLA monitoring runbook"** (Stage 1, Systematized Operations)

**Estimated reduction:** 196 lines → ~120 lines (extract ~76 lines of monitoring patterns)

---

### 6. ⚠️ 2025-10-30-progressive-form-experience-implementation-plan.md (192 lines)

**Current state:**
- Progressive form UX implementation
- Validation patterns
- Step transitions
- Instant calculation integration

**What should be extracted:**
1. **Forms UX Patterns & Validation**
   - Progressive disclosure patterns
   - Validation timing (on blur vs on submit)
   - Step transition logic
   - Instant calculation triggers

**Re-strategy status:**
- ❌ No specific CAN task
- Related: Existing `docs/runbooks/FORMS_ARCHITECTURE_GUIDE.md` (should be extended)

**Recommendation:**
- **Extend** `docs/runbooks/FORMS_ARCHITECTURE_GUIDE.md` with:
  - "Progressive Disclosure Patterns" section
  - "Validation Strategies" section
  - "Instant Calculation Integration" section

**Estimated reduction:** 192 lines → ~120 lines (extract ~72 lines of patterns)

---

## Proposed New CAN Tasks

To properly track runbook creation, recommend adding to `master-task-list.csv`:

```csv
CAN-051,Publish mobile forms optimization runbook,Systematized Operations,2025-10-18-lead-form-mobile-first-rebuild.md,Planned,Brent,Stage0,"Create docs/runbooks/forms/mobile-optimization-guide.md covering touch targets, conditional fields, smart defaults, and A/B testing"

CAN-052,Publish SLA monitoring runbook,Systematized Operations,2025-10-22-ai-broker-sla-measurement-remediation-plan.md,Planned,Brent,Stage1,"Create docs/runbooks/monitoring/sla-monitoring-guide.md covering timing injection, Redis data structures, and alerting"
```

---

## Recommended Action Plan

### Tier 1: High-Value Extractions (Do First)

1. **2025-10-18-lead-form-mobile-first-rebuild.md**
   - Extract to new `docs/runbooks/forms/mobile-optimization-guide.md`
   - Add CAN-051 to backlog
   - Reduce plan to ~140 lines

2. **2025-10-21-ai-broker-chat-activation-plan.md**
   - Extend existing `docs/runbooks/AI_BROKER_COMPLETE_GUIDE.md`
   - Add deployment/activation sections
   - Reduce plan to ~120 lines

### Tier 2: Moderate Extractions (Do if time allows)

3. **2025-10-22-ai-broker-sla-measurement-remediation-plan.md**
   - Create `docs/runbooks/monitoring/sla-monitoring-guide.md`
   - Add CAN-052 to backlog
   - Reduce plan to ~120 lines

4. **2025-10-30-progressive-form-experience-implementation-plan.md**
   - Extend existing `docs/runbooks/FORMS_ARCHITECTURE_GUIDE.md`
   - Add UX pattern sections
   - Reduce plan to ~120 lines

### Tier 3: Special Case (Decide first)

5. **2025-10-30-dr-elena-audit-plan.md**
   - **Decision needed:** Is this one-time or repeatable?
   - If one-time: Leave as-is, archive after completion
   - If repeatable: Extract to `docs/runbooks/testing/calculation-validation-guide.md`

---

## Success Metrics

After refactoring:
- ✅ All plans <200 lines (soft limit compliance)
- ✅ Implementation details moved to runbooks (proper 3-tier separation)
- ✅ CAN tasks updated or proposed for new runbooks
- ✅ strategy-alignment-inventory.md updated with new runbooks
- ✅ docs/work-log.md entries for each refactoring

---

## Questions for Brent

1. **Dr Elena audit plan:** One-time activity or repeatable process? Should we extract to runbook or just archive after completion?

2. **New CAN tasks:** Approve CAN-051 (mobile forms) and CAN-052 (SLA monitoring) for backlog addition?

3. **Priority:** Should we refactor all 5 plans now, or focus on Tier 1 (high-value) first?

4. **Runbook structure:** Prefer new standalone runbooks vs extending existing guides?

---

## Next Steps (Awaiting Approval)

1. Get decision on dr-elena audit plan (one-time vs repeatable)
2. Get approval for new CAN tasks (CAN-051, CAN-052)
3. Proceed with Tier 1 refactorings
4. Update re-strategy tracking as each refactoring completes
