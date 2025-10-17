---
title: apply-production-readiness-plan
status: in-progress
owner: engineering
last-reviewed: 2025-09-30
orchestration: /response-awareness
---

> Use `/response-awareness` to deploy Phase 1 planners before executing this plan.

# /apply Production Readiness Plan

_Last updated: 2025-09-24 14:40_

## Objectives
- Stabilize the /apply route for production usage by hardening session handling, persistence, and error recovery.
- Document clear expectations so junior developers can implement safely.

## Preconditions
- Working knowledge of the current /apply flow (ProgressiveForm + commercial quick form).
- Ability to run 
pm run dev, 
pm run lint, and inspect browser devtools (Application ? Storage).

---

## Task Checklist

### 1. Session & Storage Hardening
- [ ] Persist the generated sessionId to sessionStorage before LoanApplicationProvider mounts so refreshes don�t create new IDs.
- [ ] Add a �resume session� guard: if cached data exists but context state is empty, hydrate it automatically.
- [ ] Implement an explicit �Reset application� action that clears localStorage/sessionStorage keys (useLoanApplicationStorage + Chatwoot entries).
- [ ] Add a retention policy: wipe cached loan data after successful chat creation or after N days (align with PDPA requirements).

### 1b. Journey Tracking & Temporal Intelligence (NEW)
- [ ] Implement browser fingerprinting for cross-session journey tracking without cookies
- [ ] Create `user_journeys` and `form_submissions` tables in Supabase for temporal tracking
- [ ] Add `UserJourneyTracker` class to track all submissions without deduplication
- [ ] Calculate `months_to_eligibility` based on lock-in status and purchase timeline
- [ ] Implement professional user detection (agents/brokers snooping)
- [ ] Add journey context to Chatwoot conversation creation for intelligent routing
- [ ] Set up eligibility reminder system for users who are locked-in
- [ ] Track form field changes between submissions to identify user intent evolution

### 2. Error & Retry Flow
- [ ] Update ChatTransitionScreen to surface API errors (e.g., show fallback CTA + log details) and allow retrying the /api/chatwoot-conversation call.
- [ ] Ensure /api/forms/analyze failures surface a friendly message while retaining form data so users can adjust inputs or retry later.
- [ ] Add debug logs or feature-flag toggles (ENABLE_CHAT_TRANSITION) to disable advanced flows quickly during incidents.

### 3. Server Persistence (Optional but Recommended)
- [ ] Design a simple draft-save API (POST /api/applications/draft) that stores essentials in Supabase (sessionId, timestamp, key fields).
- [ ] On mount, if local storage is empty but a server draft exists, prompt the user to restore it (or auto-restore with confirmation).
- [ ] Document data retention and cleanup logic, including cron or Supabase policies.

### 4. UX/QA Enhancements
- [ ] Add a dedicated /apply/test or Storybook story so we can exercise each step without hitting production APIs.
- [ ] Verify mobile + desktop parity: step navigation, CTA states, validation messages.
- [ ] Confirm ChatTransition screen doesn�t double-create conversations (guard against multiple clicks).
- [ ] Run through fallback scenarios: network failure, API returns 503, localStorage disabled.

### 5. Documentation & Hand-off
- [ ] Update Docs/FORM_COMPACT_MODE_AND_APPLY_PAGE_TASKLIST.md (or new doc) with the production readiness steps completed.
- [ ] Record final manual test results in alidation-reports/ (screenshots, commands run, edge cases verified).
- [ ] Surface open questions (e.g., data retention duration, server persistence scope) to product/ops for decision.

---

## Rollback Plan
- If session persistence causes regressions, revert to timestamp-based session IDs and disable server drafts until fixes are ready.
- Keep feature flags (ENABLE_CHAT_TRANSITION) to bypass new flows in emergencies.

## Notes for Reviewer
- Confirm refreshes do not lose form progress.
- Verify error handling covers Chatwoot downtime and AI analysis failures.
- Ensure lint + brand scripts pass and no new console warnings appear.

## Journey Tracking Implementation Notes

### Business Logic for Non-Deduplication
- **Every submission is tracked** - no deduplication at contact/conversation level
- **Journey stages determine handling**:
  - `PROFESSIONAL`: Route to partner program, no broker assignment
  - `LOCKED_IN`: Set reminder for 3 months before eligibility
  - `EXPLORING/PLANNING`: Low-priority nurture campaign
  - `STRIKE_ZONE/READY_NOW`: High-priority, assign senior broker
- **Engagement scoring** based on:
  - Submission frequency (multiple in 24hrs = high intent)
  - Parameter changes (price upgrades, timeline urgency)
  - Time between submissions

### Data Retention & PDPA
- Journey data retained for 2 years (typical refinancing cycle)
- Personal data anonymization after 90 days of inactivity
- Explicit consent captured for reminder communications
- Professional users excluded from marketing communications

