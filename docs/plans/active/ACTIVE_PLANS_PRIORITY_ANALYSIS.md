# Active Plans Priority Analysis
**Generated:** 2025-10-30
**Purpose:** Align active plans with Stage 0 launch gate and Constraint A

## Stage 0 Requirements (from stage0-launch-gate.md)

### ✅ COMPLETE Categories
1. **Brand & Messaging** - CAN-001, CAN-020, CAN-036 ✅ | CAN-017 ⬜ (design deliverable)
2. **Accessibility & UX** - CAN-016 ✅, CAN-037 ✅

### ⬜ INCOMPLETE Categories (Stage 0 Blockers)
3. **AI Broker Chat** - CAN-053 ✅ (UI 7/7 passing), CAN-054 ⬜ (5 brokers), CAN-055 ⬜ (queue), CAN-056 ⬜ (offboarding)
4. **PDPA & Compliance** - CAN-003 ⬜, CAN-035 ⬜
5. **Follow-Up System** - CAN-002 ⬜, CAN-038 ⬜
6. **Rate Pipeline** - CAN-006 ⬜, CAN-033 ⬜
7. **Scenario Capture** - CAN-004 ⬜, CAN-035 ⬜
8. **Content Foundation** - CAN-005 ⬜, CAN-040 ⬜
9. **Documentation Hygiene** - CAN-034 ⬜, CAN-039 ⬜, CAN-041 ⬜

---

## Active Plans Analysis (8 total)

### 🎯 STAGE 0 PRIORITY (Constraint A)

**1. `2025-10-21-ai-broker-chat-activation-plan.md`**
- **CAN Tasks:** CAN-053, CAN-054, CAN-055, CAN-056
- **Status:** Phase 2 Task 2.2 complete (chat UI), remaining tasks for concurrency/queue
- **Constraint:** A (Public Surfaces Ready)
- **Stage:** 0
- **Recommendation:** **HIGHEST PRIORITY** - Complete CAN-054/055/056 for chat to be production-ready

**2. `2025-10-18-lead-form-mobile-first-rebuild.md`**
- **CAN Tasks:** CAN-051 ✅ (runbook published)
- **Status:** Blocked by desktop UX quick wins (archived 2025-10-24)
- **Constraint:** A (Public Surfaces Ready)
- **Stage:** 0 (mobile optimization)
- **Recommendation:** **ON HOLD** - Desktop work complete, but not critical for Stage 0 launch

**3. `2025-10-26-MANUAL-QA-CHECKLIST.md`**
- **CAN Tasks:** None (operational tool)
- **Status:** Active
- **Constraint:** A (quality assurance)
- **Stage:** 0
- **Recommendation:** **DEFER** - Use for pre-launch QA, not active development work

---

### ⚠️ STAGE 1+ WORK (Post-Launch Optimization)

**4. `2025-10-22-ai-broker-sla-measurement-remediation-plan.md`**
- **CAN Tasks:** CAN-052 (SLA monitoring runbook)
- **Status:** Planning/measurement phase
- **Constraint:** A (performance optimization)
- **Stage:** 1 (optimization, not launch blocker)
- **Recommendation:** **DEFER TO STAGE 1** - SLA <5s is good-to-have, not Stage 0 requirement

**5. `2025-10-23-ai-broker-sla-latency-remediation-implementation-plan.md`**
- **CAN Tasks:** Related to CAN-052
- **Status:** Implementation of SLA fixes
- **Constraint:** A (performance optimization)
- **Stage:** 1
- **Recommendation:** **DEFER TO STAGE 1** - Optimization work, not launch blocker

**6. `2025-10-22-chat-conversation-persistence-debugging-plan.md`**
- **CAN Tasks:** None (bug fix)
- **Status:** Task 2.6 marked complete in ai-broker-chat-activation-plan
- **Constraint:** A (bug fix)
- **Stage:** 0 (if blocking), otherwise 1
- **Recommendation:** **VERIFY COMPLETION** - If already fixed, archive. If not, complete before launch.

**7. `2025-10-22-ai-broker-realtime-upgrade-plan.md`**
- **CAN Tasks:** None
- **Status:** Planning
- **Constraint:** A (enhancement)
- **Stage:** 1+ (future enhancement)
- **Recommendation:** **DEFER TO STAGE 1+** - Realtime is enhancement, not requirement

---

### 📊 CONSTRAINT B WORK (Not Stage 0)

**8. `2025-10-31-parser-crm-integration-plan.md`**
- **CAN Tasks:** CAN-043, CAN-044, CAN-045, CAN-046
- **Status:** Stage A (audit phase)
- **Constraint:** B (Data In, Data Approved)
- **Stage:** B0 → B1 → B2
- **Recommendation:** **ON HOLD UNTIL CONSTRAINT A COMPLETE** - Dependency: Constraint A ✅ first

---

## Priority Ranking for Stage 0

### 🔴 CRITICAL (Must Complete for Launch)
1. **AI Broker Chat Activation** (CAN-053 ✅, CAN-054-056 ⬜)
   - Complete concurrency control (5 brokers)
   - Build queue management system
   - Create offboarding flow
   - **Estimated Time:** 3-5 days

2. **Production E2E Tests** (currently fixing)
   - Fix chat-production-e2e.spec.ts (7/7 passing)
   - **Estimated Time:** 1 day

### 🟡 IMPORTANT (Stage 0, but not blockers)
3. **PDPA & Compliance** (CAN-003, CAN-035)
4. **Follow-Up System** (CAN-002, CAN-038)
5. **Documentation Hygiene** (CAN-034, CAN-039, CAN-041)

### ⬜ DEFER (Stage 1+ work)
6. SLA measurement/remediation plans
7. Realtime upgrade plan
8. Mobile-first rebuild (blocked, non-critical)
9. Parser/CRM integration (Constraint B)

---

## Recommended Action Plan

### Week 1 (Stage 0 Focus)
1. ✅ Fix production E2E tests
2. Complete chat activation (CAN-054/055/056)
   - Day 1-2: Concurrency control (5 brokers) + load testing
   - Day 3: Queue management UI + position tracking
   - Day 4: Offboarding flow + follow-up integration
   - Day 5: E2E testing + documentation

3. Verify chat conversation persistence (if not complete)

### Week 2 (Stage 0 Gate Review)
4. Complete remaining Stage 0 categories:
   - PDPA & Compliance documentation
   - Follow-up system documentation
   - Documentation hygiene cleanup

5. Run full Stage 0 verification checklist
6. Update stage0-launch-gate.md with evidence
7. **Launch Gate Review with Brent**

### Post-Launch (Stage 1)
8. SLA optimization work
9. Realtime upgrades
10. Parser/CRM migration (Constraint B)

---

## Plans to Archive/Close

1. **`2025-10-22-chat-conversation-persistence-debugging-plan.md`** - If Task 2.6 truly complete, archive immediately
2. **`2025-10-26-MANUAL-QA-CHECKLIST.md`** - Keep active but not for development, use for QA only

---

## Missing Plans (Need to Create)

Based on Stage 0 gate, we're missing plans for:
1. PDPA & Compliance (CAN-003, CAN-035)
2. Follow-Up System (CAN-002, CAN-038)  
3. Rate Pipeline (CAN-006, CAN-033) - **But this is Stage 1, not Stage 0!**
4. Scenario Capture (CAN-004, CAN-035)
5. Content Foundation (CAN-005, CAN-040)

**Note:** Some of these may not be true Stage 0 blockers. Need Brent to confirm minimum viable launch requirements.

---

## Summary

**Stage 0 Status:**
- ✅ Brand & Messaging (mostly complete)
- ✅ Accessibility & UX (complete)
- 🟡 AI Broker Chat (UI complete, need concurrency/queue/offboarding)
- ⬜ 6 other categories (may not all be launch blockers)

**Active Plans Status:**
- 1 plan is CRITICAL Stage 0 work (chat activation)
- 2 plans are Stage 0 but not critical (mobile rebuild, QA checklist)
- 5 plans are Stage 1+ work (should be deferred)

**Recommended Focus:**
Complete chat activation (CAN-054/055/056) as highest priority, then confirm with Brent which other Stage 0 categories are true launch blockers.
