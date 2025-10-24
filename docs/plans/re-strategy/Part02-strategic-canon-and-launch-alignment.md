ABOUTME: Strategic canon aligning launch plans, production playbook, and codebase pillars.
ABOUTME: Defines sequencing, readiness gates, and reconciles prior strategy documents.

# Strategic Canon & Launch Alignment (Part 02)

---
title: "Strategic Canon & Launch Alignment"
status: draft
owner: strategy
created: 2025-10-22
parts:
  - references:
      - docs/strategy_integration/nn-launch-tasks.md
      - docs/strategy_integration/nn-production-playbook.md
      - docs/strategy_integration/older/LAUNCH_PLAN_v2.md
      - docs/strategy_integration/pieters-launch-plan.md
      - docs/plans/re-strategy/Part01-rate-transparency-integration-plan.md
---

## 0. Canon Commitments (Do Not Permutate)

1. **Six Domains (Permanent Pillars)**  
   - Evidence-Based Positioning  
   - Secure Tech Stack  
   - Quality-First Programmatic SEO  
   - Client-Controlled Contact  
   - Systematized Operations  
   - Scenario Database Growth  
   Every future plan must tag tasks to one or more of these domains.

2. **Value Prop**  
   - Public promise: “We run every path—stay, reprice, refinance—and give you the math that matters.”  
   - Internal stance: Default to driving a refinance when the data and timing justify it; acknowledge repricing only when the client raises it or when our model shows it clearly wins.  
   - No self-imposed obligation to shepherd repricing for free. Light guidance is discretionary.

3. **Rate Transparency Boundaries**  
   - Maintain masked ranges (Part 01) with human approval.  
   - Never publish bank names or exact deviated rates publicly.  
   - One reveal per session; human broker unmasking happens only post-consent.

4. **Scenario Database Trajectory**  
   - Honest milestones (per production playbook): 5 documented scenarios by Day 30, 25 by Month 2, 60 by Month 3, 100 by Month 6.  
   - Scenario entries must capture: client profile, stay/reprice/refinance calculations, decision rationale, outcome, and follow-up result.

5. **Quality-First PSEO Cadence**  
   - Week 1–2: 20 pages, handcrafted.  
   - Ongoing: 50 pages/month with automated scaffolding plus human QA.  
   - Total goal: 500 pages by Month 6; no mass publishing without review.

6. **Professional Readiness Gate (Stage 0)**  
   - Brand/UX: home hero, trust strip, copy consistent with promises.  
   - Operations: approvals, follow-up scripts, scenario logging in place.  
   - Compliance: PDPA consent, auto-expiry, audit logs.  
   All three must be satisfied before “open gate” launch.

7. **Sequencing**  
   - Stage 0 (Constraint A – Public Surfaces Ready): Professional readiness (polish + ops + compliance).  
   - Stage 1 (Constraint B – Data In, Data Approved): Controlled funnel opening (lead form → AI brokers → human handoff).  
   - Stage 2 (Constraint C – Rhizome Lift-Off): Scenario scale & PSEO machine.  
   - Stage 3 (Constraint D – Close the Loop): Growth levers (referrals, licensing) only after Stage 2 stabilized.

8. **Historical Claims Retired**  
 - “23 banks, 15-minute updates” removed permanently.  
  - V2 launch plan assertions (200 scenarios Day 22, 10h/week ops) declared aspirational and superseded by V3 corrections.

## Stage Alignment Map

Part 01 retains a three-stage delivery framing for the rate transparency system. Use this crosswalk when sequencing work so that scheduling, backlog grooming, and reporting stay aligned with the canon stages used throughout Parts 02–08.

| Rate Transparency Plan Stage | Canon Stage | Focus | Notes |
|------------------------------|-------------|-------|-------|
| Stage 1 – Data Ingestion, Guardrails & Approval Workflow | Stage 0 – Professional Readiness (Constraint A – Public Surfaces Ready) | Parser consolidation, guardrails, ingestion API, approval dashboard, notifications, reconciliation scripts | Must be completed (and documented in `stage0-launch-gate.md`) before opening the funnel. |
| Stage 2 – Customer Experience & Reveal Logic | Stage 1 – Controlled Funnel Opening (Constraint B – Data In, Data Approved) | Gateway card, reveal UX, AI trigger, one-shot enforcement, analytics logging | Roll out behind `ENABLE_RATE_REVEAL` once Stage 0 gate is cleared. |
| Stage 3 – Heuristics, Monitoring & Iterative Feedback | Stage 2 – Scenario Scale & PSEO Machine (Constraint C – Rhizome Lift-Off) | Rate-shopper heuristics, awareness logging, dashboards, manual sampling automation | Works in parallel with scenario/PSEO scaling once controlled funnel is stable. |

## 1. Reconciling Existing Documents

### 1.1 Launch Tasks (nn-launch-tasks.md)

| Task Range | Status | Notes | Domain |
|------------|--------|-------|--------|
| 1–15 (vision/niche) | Completed | Company positioning defined in canon | Evidence-Based |
| 16–35 (MVP scope, tech setup) | Superseded | Embedded in Part 01 + current codebase | Secure Tech Stack |
| 36–55 (AI ops, BullMQ, Chatwoot) | Active | Many items align with Part 01 Stage 1–3 | Secure Tech Stack / Systematized Ops |
| 56–70 (PSEO, content) | Active backlog | To be reorganized under PSEO roadmap | Quality-First PSEO |
| 71–85 (Sales/follow-up) | Active | Map to Client-Controlled Contact plan | Client-Controlled Contact |
| 86–100 (Metrics, scale, team) | Deferred | Will reappear in later parts | Systematized Ops / Scenario Growth |

Actions:
- Create `docs/plans/re-strategy/backlog/master-task-list.csv` summarizing surviving tasks with domain tags and current status.
- Archive original list as appendix in Part 02 (Section 5.2).

### 1.2 Production Playbook V3

Key elements adopted into canon:
- Scenario database milestones (Section 0.4).
- PSEO cadence (Section 0.5).
- Operations time expectations (Stage 2 target 12–14h/week).
- Launch readiness triggers (Stage 0 gate).
- Revenue math (0.15% commission; $15–18k/month target).

### 1.3 Older Launch Plans / Pieters Plans

Conflicts noted:
- `LAUNCH_PLAN_v2`: outdated claims, contradictory timelines. Marked as legacy reference only.
- `pieters-launch-plan`: Overlapping tasks with `nn-launch-tasks`; integrate surviving insights into backlog.
- `nn-context.md`: Provides narrative context; ensure persona training references align with new canon.
- `zip2-nn-strategy.md`: Evaluate later for relevant tactical ideas (not critical for Part 02).

## 2. Strategic Readiness Checklist (Stage 0 / Constraint A)

| Area | Requirements | Owner |
|------|--------------|-------|
| Brand/UX | Updated hero copy, trust strip, scenario CTA; masked rate messaging consistent with canon | Design/Marketing |
| Lead Funnel | Progressive form, consent flows, AI broker scripts seeded with new decision logic | Engineering / AI Ops |
| Compliance | PDPA consent, auto expiry, audit log review; data retention policy in place | Ops |
| Operations | Approval dashboard live, notification loop tested, follow-up nudges templated, scenario logging workflow documented | Ops/Engineering |
| Content | Initial 20 handcrafted PSEO pages ready with QA, scenario library seeded (≥5 documented cases) | Content/Brent |

All boxes must be checked and recorded in `docs/work-log.md` before Stage 1 launch.

## 3. Controlled Funnel Opening (Stage 1 / Constraint B)

1. **Pilot Cohort**  
   - Open form to a limited audience (e.g., existing clients, warm leads).  
   - Monitor lead progression: form completion, chat engagement, human handoff.  
   - Record whether rate reveal triggered; log heuristics in Supabase.

2. **Dark Arts Defense Protocol**  
   - Preemptive leads: focus on refinance packages, emphasize urgency (“rebate windows”) without prompting repricing.  
   - Counter-offer leads: capture bank quote, rerun scenario, highlight our advantages.  
   - Retention risk leads (high loan quantum): Set expectation that bank will call; request they loop us in before signing.

3. **Follow-Up Cadence**  
   - Value-driven nudges only (eligibility updates, banker pack ready, recordings).  
   - Rate-shopper flag triggers human review; AI refrains from multiple reveals.

4. **Metrics to track**  
   - Lead → chat engagement rate  
   - Rate reveal utilization vs handoff success  
   - Time to human broker contact  
   - Conversion outcome (reprice, stay, refinance) logged in scenario DB

## 4. Scenario & PSEO Scale (Stage 2 / Constraint C)

1. **Scenario Capture Workflow**  
   - Standardized template (JSON + narrative log).  
   - Each case tagged with outcome (stay/reprice/refi), bank masked, decision rationale, handoff notes.  
   - Weekly review meeting to ensure logging discipline.

2. **Scenario Database Usage**  
   - Feed into AI persona prompt context.  
   - Power PSEO pages (real anonymized stories).  
   - Provide metrics (repeat customer rate, success reasons).

3. **PSEO Machine**  
   - 20 handcrafted pillars first; integrate scenario data to generate long-tail pages.  
   - Automation safeguards: human review, compliance check (no bank names).  
   - Track impressions/conversions; adjust cadence as quality permits.

4. **Ops Load Management**  
   - Target 12–14 hours/week total human effort at steady state.  
   - Hire VA in Month 5 only if backlog proves consistent (per production playbook).

## 5. Appendices

### 5.1 Backlog (Living Document)

- `docs/plans/re-strategy/backlog/master-task-list.csv` (to be created). Columns: Task ID, Description, Domain(s), Source Doc, Status, Owner, Target Stage.
- Growth/Ops own the backlog review cadence: meet weekly to update CAN task statuses, add new entries surfaced during implementation, and ensure links back to `docs/plans/re-strategy/stage0-launch-gate.md`.
- Review backlog quarterly; update Part 02 if strategy-level changes occur or if the canon domains shift.

### 5.2 Archived Artifacts

- Original `nn-launch-tasks.md` retained under `docs/strategy_integration/archive/nn-launch-tasks-original.md` for historical reference.  
- `LAUNCH_PLAN_v2.md` and `pieters-launch-plan*.md` tagged as legacy; relevant insights imported into backlog where applicable.

---

## Next Steps

1. Confirm Stage 0 checklist items and assign owners.  
2. Create backlog CSV with surviving tasks categorized under six domains.  
3. Update `docs/work-log.md` with canon commitments and readiness status.  
4. Begin drafting Part 03 (likely Scenario Database System) once Stage 1 planning starts.
