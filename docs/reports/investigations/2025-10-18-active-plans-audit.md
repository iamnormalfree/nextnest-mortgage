# Active Plans Audit & Roadmap Alignment

**Date:** 2025-10-18
**Context:** Post folder-consolidation cleanup - align active plans with Phase 1 roadmap
**Current Branch:** `fix/progressive-form-calculation-corrections`
**Roadmap Phase:** Phase 1 (Weeks 1-6) - 80% complete

---

## Executive Summary

**Total Active Plans:** 23 files
**Roadmap Alignment:**
- ✅ **Critical Path (3 plans):** Aligned with Phase 1 roadmap
- ⚠️ **Should Archive (10+ plans):** Completed, superseded, or out of scope
- 🔄 **Needs Consolidation (5+ plans):** Overlapping objectives
- ❓ **Needs Review (5 plans):** Unclear status or relevance

**Current Work:** On branch `fix/progressive-form-calculation-corrections` working on calculation corrections

---

## Roadmap Context (Phase 1)

**Current Phase:** Phase 1 (Weeks 1-6) - Core Experience
**Status:** 80% complete
**Goal:** Ship working mortgage application flow with lead capture and broker handoff

**Critical Path Items (from ROADMAP.md):**
1. Form calculation corrections - `2025-10-31-progressive-form-calculation-correction-plan.md`
2. Mobile form experience - `2025-10-30-progressive-form-experience-implementation-plan.md`
3. Lead form → chat handoff - `2025-11-01-lead-form-chat-handoff-optimization-plan.md`

---

## Active Plans Analysis

### ✅ IMPLEMENT NOW (Phase 1 Critical Path)

**1. 2025-10-31-progressive-form-calculation-correction-plan.md**
- **Status:** `draft`
- **Roadmap:** Phase 1 Critical Path #1
- **Branch:** `fix/progressive-form-calculation-corrections` (current)
- **Action:** ✅ **KEEP - Currently implementing**
- **Justification:** Directly aligned with current branch and Phase 1 roadmap item #1

**2. 2025-10-30-progressive-form-experience-implementation-plan.md**
- **Status:** `needs_corrections`
- **Roadmap:** Phase 1 Critical Path #2
- **Dependencies:** Blocked by plan #1 (calculation corrections)
- **Action:** ✅ **KEEP - Next after #1 complete**
- **Justification:** Phase 1 roadmap item #2, depends on calculation fixes

**3. 2025-11-01-lead-form-chat-handoff-optimization-plan.md**
- **Status:** `active` / P0 (Critical - Users Cannot Reach AI Brokers)
- **Roadmap:** Phase 1 Critical Path #3
- **Priority:** P0 - BLOCKER
- **Action:** ✅ **KEEP - High priority after #2**
- **Justification:** Phase 1 roadmap item #3, critical blocker

---

### 🔄 KEEP ACTIVE (Supporting Work - Phase 1)

**4. mobile-ai-broker-ui-rebuild-plan.md**
- **Roadmap Link:** Week 5-6 Broker Integration
- **Justification:** Mobile broker UI variants evaluation (active decision pending)
- **Action:** ✅ **KEEP**

**5. mobile-loan-form-optimization.md**
- **Roadmap Link:** Week 3-4 Progressive Form
- **Justification:** Form responsiveness (ongoing work)
- **Action:** ✅ **KEEP**

---

### ❌ ARCHIVE (Completed or Superseded)

**6. 2025-09-19-mobile-optimization-plan.md**
- **Created:** 2025-09-19
- **Reason:** Superseded by newer mobile plans (mobile-loan-form-optimization.md)
- **Action:** ❌ **ARCHIVE to docs/plans/archive/2025/09/**
- **Extract:** Mobile optimization insights to newer plans if needed

**7. 2025-09-19-progressive-form-implementation.md**
- **Created:** 2025-09-19
- **Reason:** Superseded by 2025-10-30-progressive-form-experience-implementation-plan.md
- **Action:** ❌ **ARCHIVE to docs/plans/archive/2025/09/**
- **Extract:** Implementation patterns to newer plan (likely already done)

**8. 2025-09-25-broker-message-fix-plan.md**
- **Created:** 2025-09-25
- **Reason:** Specific bugfix (likely completed or obsolete)
- **Status Check Needed:** Verify if broker messaging is currently working
- **Action:** ❌ **ARCHIVE if complete, or consolidate into 2025-11-01-lead-form-chat-handoff**

**9. 2025-09-25-broker-ui-reintegration-plan.md**
- **Created:** 2025-09-25
- **Reason:** Superseded by mobile-ai-broker-ui-rebuild-plan.md
- **Action:** ❌ **ARCHIVE to docs/plans/archive/2025/09/**
- **Extract:** Reintegration insights to newer plan if needed

**10. 2025-09-26-apply-production-readiness-plan.md**
- **Created:** 2025-09-26
- **Reason:** Generic production readiness - should be folded into Phase 1 completion
- **Action:** ❌ **ARCHIVE to docs/plans/archive/2025/09/**
- **Extract:** Checklist items to Phase 1 completion criteria in ROADMAP.md

**11. 2025-10-14-progressive-form-restoration-plan.md**
- **Created:** 2025-10-14
- **Reason:** Restoration work superseded by newer implementation plans
- **Action:** ❌ **ARCHIVE to docs/plans/archive/2025/10/**
- **Extract:** Implementation insights already captured in newer plans

**12. 2025-10-28-progressive-form-restoration-implementation-plan.md**
- **Created:** 2025-10-28
- **Reason:** Superseded by 2025-10-30-progressive-form-experience-implementation-plan.md
- **Action:** ❌ **ARCHIVE to docs/plans/archive/2025/10/**
- **Note:** Only 2 days older than current plan - check for unique content first

**13. 2025-10-03-next-implementation-priorities.md**
- **Created:** 2025-10-03
- **Status:** `PLANNING`
- **Reason:** Priority planning doc from 6 weeks ago - likely stale
- **Action:** ❌ **ARCHIVE to docs/plans/archive/2025/10/**
- **Extract:** Any unaddressed priorities to current roadmap backlog

**14. 2025-09-26-broker-chat-alignment-plan.md**
- **Created:** 2025-09-26
- **Status:** `ready-for-testing`
- **Reason:** If ready for testing, should be in testing phase not active plans
- **Action:** ❌ **ARCHIVE to docs/plans/archive/2025/09/** OR **Move to testing/validation**
- **Extract:** Testing checklist to current testing workflow

---

### 🔄 CONSOLIDATE (Overlapping Objectives)

**15-16. 2025-10-17-lead-form-conversion-optimization-path1.md & path2.md**
- **Issue:** Two separate paths for same objective (conversion optimization)
- **Action:** 🔄 **Consolidate into single plan OR choose one path**
- **Justification:** Confusing to have two active paths - make decision and archive one

**17. 2025-10-30-dr-elena-audit-plan.md**
- **Related To:** 2025-10-31-progressive-form-calculation-correction-plan.md (audit → corrections)
- **Action:** 🔄 **Consolidate audit findings into correction plan**
- **Justification:** Audit is done, corrections are active - no need for separate audit plan

**18. 2025-10-30-progressive-form-experience-spec.md**
- **Type:** Specification (not implementation plan)
- **Related To:** 2025-10-30-progressive-form-experience-implementation-plan.md
- **Action:** 🔄 **Move to docs/runbooks/** as specification reference
- **Justification:** Specs are Tier 2 (runbooks), not Tier 3 (plans)

---

### ❓ UNCLEAR / NEEDS REVIEW

**19. 2025-10-18-function-usage-audit-plan.md**
- **Created:** Today (2025-10-18)
- **Question:** Is this plan started? Needed?
- **Action:** ❓ **Review with user - keep or archive**

**20. Broker_System_Message_Plan.md**
- **Name:** Not date-prefixed (no naming convention)
- **Question:** Status unknown, scope unclear
- **Action:** ❓ **Review with user - consolidate into broker plans or archive**

**21. FORM_COMPACT_MODE_AND_APPLY_PAGE_TASKLIST.md**
- **Type:** Tasklist (not plan format)
- **Question:** Is this still relevant? Related to current form work?
- **Action:** ❓ **Review - consolidate tasks into current plans or archive**

**22. PATH2_AMENDMENT_EXISTING_SOLUTIONS.md**
- **Name:** No date prefix, unclear scope
- **Question:** Part of conversion optimization path2?
- **Action:** ❓ **Consolidate into path2 plan or archive**

**23. TASK_3_IMPLEMENTATION_PLAN.md**
- **Name:** No date prefix, generic name
- **Question:** What is "Task 3"? Related to what?
- **Action:** ❓ **Review - archive if obsolete, rename if active**

---

## Recommended Actions

### Immediate (This Session)

1. ✅ **Current Work:** Continue with `2025-10-31-progressive-form-calculation-correction-plan.md` on branch `fix/progressive-form-calculation-corrections`

2. ❌ **Archive 9 plans** to `docs/plans/archive/2025/{09|10}/`:
   - 2025-09-19-mobile-optimization-plan.md
   - 2025-09-19-progressive-form-implementation.md
   - 2025-09-25-broker-message-fix-plan.md
   - 2025-09-25-broker-ui-reintegration-plan.md
   - 2025-09-26-apply-production-readiness-plan.md
   - 2025-10-14-progressive-form-restoration-plan.md
   - 2025-10-28-progressive-form-restoration-implementation-plan.md
   - 2025-10-03-next-implementation-priorities.md
   - 2025-09-26-broker-chat-alignment-plan.md

3. 🔄 **Consolidate:**
   - Merge path1 & path2 lead-form-conversion plans → choose one path
   - Move 2025-10-30-dr-elena-audit-plan.md findings into correction plan
   - Move 2025-10-30-progressive-form-experience-spec.md to `docs/runbooks/`

4. ❓ **User Decision Required:**
   - 2025-10-18-function-usage-audit-plan.md - keep or archive?
   - Broker_System_Message_Plan.md - consolidate or archive?
   - FORM_COMPACT_MODE_AND_APPLY_PAGE_TASKLIST.md - extract tasks or archive?
   - PATH2_AMENDMENT_EXISTING_SOLUTIONS.md - consolidate or archive?
   - TASK_3_IMPLEMENTATION_PLAN.md - what is this?

### Next (After Calculation Corrections Complete)

5. **Implement in priority order:**
   - 2025-10-30-progressive-form-experience-implementation-plan.md (Phase 1 Critical #2)
   - 2025-11-01-lead-form-chat-handoff-optimization-plan.md (Phase 1 Critical #3 - P0 BLOCKER)
   - mobile-ai-broker-ui-rebuild-plan.md (Week 5-6 Broker Integration)
   - mobile-loan-form-optimization.md (Week 3-4 Progressive Form)

---

## Roadmap Linkage Matrix

| Plan | Roadmap Week | Status | Priority |
|------|--------------|--------|----------|
| 2025-10-31 calculation correction | Week 3-4 | 🔄 IN PROGRESS | P0 |
| 2025-10-30 form experience | Week 3-4 | ⏳ BLOCKED | P0 |
| 2025-11-01 chat handoff | Week 5-6 | ⏳ PENDING | P0 |
| mobile-ai-broker-ui-rebuild | Week 5-6 | 📋 ACTIVE | P1 |
| mobile-loan-form-optimization | Week 3-4 | 📋 ACTIVE | P1 |

**Phase 1 Completion Path:**
1. Fix calculations (current)
2. Polish form experience (next)
3. Fix chat handoff (critical blocker)
4. Finalize mobile broker UI
5. Phase 1 complete → Move to Phase 1.5

---

## Extract Before Archiving

**From deprecated plans, extract these to roadmap:**

1. **Production Readiness Checklist** (from 2025-09-26-apply-production-readiness-plan.md):
   - Bundle size checks
   - Performance testing
   - Error tracking
   - Analytics validation
   → Add to Phase 1 completion criteria in ROADMAP.md

2. **Testing Procedures** (from 2025-09-26-broker-chat-alignment-plan.md):
   - Broker assignment verification
   - Chat flow testing
   - Chatwoot integration checks
   → Add to testing runbooks

3. **Conversion Optimization Insights** (from path1 & path2):
   - Form drop-off metrics
   - UX friction points
   - A/B testing strategy
   → Add to Phase 2 backlog (after Phase 1 complete)

---

## Questions for User

1. **Current work priority:** Should we pause calculation corrections to fix P0 chat handoff blocker? Or finish calculations first?

2. **Plan consolidation:**
   - Path1 vs Path2 lead-form-conversion - which path to keep?
   - 5 unclear plans - review individually or bulk archive?

3. **Roadmap updates:**
   - Should we update ROADMAP.md with extracted checklist items now?
   - Any plans missing from this audit that you know exist?

---

## Next Steps

**If approved:**

1. Archive 9 deprecated plans to appropriate archive folders
2. Consolidate overlapping plans (path1/path2, audit → corrections, spec → runbook)
3. Extract useful tasks/checklists to roadmap
4. Update this audit with user decisions on unclear plans
5. Create clean active plans list (max 6-8 plans)
6. Update ROADMAP.md with extracted completion criteria

**Result:** Clean active plans folder aligned with Phase 1 roadmap priorities.
