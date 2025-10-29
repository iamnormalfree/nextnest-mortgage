---
status: active
priority: high
complexity: medium
estimated_hours: 8
constraint: C1 – Public Surface Readiness
can_tasks: CAN-051
---

# Mobile AI Broker Chat Integration

## Context

Mobile users cannot effectively use AI Broker features on the chat page. Current implementation (`app/chat/page.tsx`) uses desktop-only components causing poor mobile UX.

**Problems:**
- Desktop layout forced on mobile (sidebars, large padding)
- Touch targets <44px (WCAG violation)
- Horizontal scroll on 320px-375px viewports
- No progressive disclosure

**Strategic alignment (Part 04 § 4.3):** Chat experience must adapt to mobile with full-screen, chat-first layout.

## Solution

**Decision:** Integrate existing `ResponsiveBrokerShell` component with production chat page.

**Why ResponsiveBrokerShell:**
- Already built and tested (mobile components exist)
- Feature flag enabled (`FEATURE_FLAGS.MOBILE_AI_BROKER_UI`)
- Automatic viewport detection and routing
- Aligns with "Invisible Automation" principle (Part 04)

**What changes:**
- `app/chat/page.tsx`: ChatLayoutShell → ResponsiveBrokerShell
- Shell routes to MobileAIAssistantCompact (mobile) or IntegratedBrokerChat (desktop)

## Implementation Guide

**All code examples, file paths, testing procedures, and troubleshooting:**
`docs/runbooks/ai-broker/mobile-chat-integration-guide.md` ← **READ THIS**

This plan contains only decisions (what/why/when). Runbook has implementation details (how).

## Success Criteria

- [ ] ResponsiveBrokerShell integrated with chat page
- [ ] Feature flag toggle works (mobile/desktop UI switch)
- [ ] Mobile viewport (375px): mobile UI, no horizontal scroll
- [ ] Desktop viewport (1440px): desktop UI with sidebar
- [ ] Props pass through correctly (conversationId, broker, formData)
- [ ] All tests pass (unit + E2E)
- [ ] Touch targets ≥44px (verified via E2E)
- [ ] Production build succeeds

## Tasks

**Pre-Implementation: Read These First (30 min)**

1. Strategic: `Part04-brand-ux-canon.md` § 4.3, `Part02-strategic-canon.md`, `ROADMAP.md`
2. Technical: `mobile-chat-integration-guide.md` (full runbook), `MOBILE_FIRST_ARCHITECTURE.md`
3. Current code: `app/chat/page.tsx`, `ResponsiveBrokerShell.tsx`, `types.ts`
4. Testing: `CLAUDE.md` (TDD rules), `TECH_STACK_GUIDE.md`

### Task 0: Environment Setup (5 min, Commit 1)

**Decision:** Enable mobile feature flag in `.env.local`

**Files:** Create `.env.local` with `NEXT_PUBLIC_MOBILE_AI_BROKER=true`

**See:** Runbook Task 0 for complete steps

**Verify:** Flag enabled, dev server restarts

**Commit:** `chore: enable mobile AI broker feature flag for development`

---

### Task 1: Write Integration Test (15 min, Commit 2)

**Decision:** Write failing test (TDD RED phase)

**Files:** Create `app/chat/__tests__/ChatPageMobileIntegration.test.tsx`

**Tests verify:** ResponsiveBrokerShell renders, props pass through, empty state works

**See:** Runbook Task 1 for complete test code

**Verify:** Tests run and FAIL (expected)

**Commit:** `test: add failing test for mobile AI broker chat integration`

---

### Task 2: Refactor Chat Page (30 min, Commit 3)

**Decision:** Replace ChatLayoutShell with ResponsiveBrokerShell in `app/chat/page.tsx`

**Changes:**
- Import ResponsiveBrokerShell
- Remove unused imports (ChatLayoutShell, CustomChatInterface, InsightsSidebar, HandoffNotification)
- Simplify return: Pass props to ResponsiveBrokerShell
- Remove unused state (isHandoff, handoffDetails, inputMessage)

**See:** Runbook Task 2 for complete refactored code

**Verify:** Tests PASS (TDD GREEN), no TypeScript errors, page renders

**Commit:** `feat: integrate ResponsiveBrokerShell with chat page`

---

### Task 3: Manual Toggle Verification (10 min, doc commit)

**Decision:** Manually verify feature flag toggle (no code changes)

**Test scenarios:**
1. Flag ON + 375px → Mobile UI
2. Flag ON + 1440px → Desktop UI
3. Flag OFF + any viewport → Desktop UI (fallback)

**See:** Runbook Task 3 for step-by-step instructions

**Document:** Create `docs/test-reports/2025-11-07-mobile-chat-integration-manual-test.md`

**Verify:** All scenarios work, no console errors

**Commit:** `docs: add mobile chat integration manual test report`

---

### Task 4: Add E2E Test (20 min, Commit 4)

**Decision:** Write Playwright test for mobile flow

**Files:** Create `tests/e2e-mobile-chat-integration.spec.ts`

**Tests verify:** Form→chat redirect, mobile/desktop UI per viewport, no horizontal scroll, touch targets ≥44px

**See:** Runbook Task 4 for complete E2E test code

**Verify:** E2E tests pass on mobile and desktop viewports

**Commit:** `test: add e2e tests for mobile chat integration`

---

### Task 5: Create Test Playground Pages (15 min, Commit 5)

**Decision:** Create isolated test pages for rapid manual QA

**Files:**
- `app/test-mobile-chat/page.tsx` (forces mobile UI + mock data)
- `app/test-desktop-chat/page.tsx` (forces desktop UI + mock data)

**See:** Runbook Task 5 for complete page code with mock data

**Verify:** Pages load, mock data displays, useful for visual QA

**Commit:** `feat: add test playground pages for mobile/desktop chat`

---

## Testing Strategy

**See runbook for complete testing procedures.**

**Test levels:**
1. Unit tests (Jest + RTL) - Logic, state, props
2. E2E tests (Playwright) - Full flow, viewport behavior
3. Manual tests - Visual regression, touch interactions

**Key files:**
- `app/chat/__tests__/ChatPageMobileIntegration.test.tsx`
- `tests/e2e-mobile-chat-integration.spec.ts`
- `docs/test-reports/2025-11-07-mobile-chat-integration-manual-test.md`

**Passing criteria:** All unit tests pass, all E2E tests pass, manual verification complete, production build succeeds

## Rollback Plan

**Quick rollback:** `git revert HEAD && npm run dev`

**Feature flag disable:** Set `NEXT_PUBLIC_MOBILE_AI_BROKER=false` in `.env.local`, restart

**Code rollback:** Revert Task 2 commits, restore ChatLayoutShell

**Monitoring:** Check console errors, mobile user analytics, Chatwoot conversation rates

## Execution Order

1. Read prerequisites (30 min)
2. Task 0 - Environment (5 min, Commit 1)
3. Task 1 - Failing test (15 min, Commit 2)
4. Task 2 - Refactor (30 min, Commit 3)
5. Task 3 - Manual test (10 min, doc commit)
6. Task 4 - E2E test (20 min, Commit 4)
7. Task 5 - Test pages (15 min, Commit 5)

**Total:** ~2 hours active work, 8 hours estimated (includes reading + debugging buffer)

**Commits:** 5 commits (1 every 20-30 min of work)

## Related Documentation

**Primary:** `docs/runbooks/ai-broker/mobile-chat-integration-guide.md` ← **COMPLETE STEP-BY-STEP GUIDE**

**See runbook for full documentation list** (strategic, technical, component references)

## Constraint Alignment

**Constraint A – Public Surfaces Ready** (Stage 0 Launch Gate):

**Exit criteria:**
- ✅ Stage 0 checklist green
- ✅ WCAG AA verified (touch targets ≥44px)
- ✅ E2E tests pass
- ⬜ Work log entry (after completion)

**This integration satisfies:**
- Accessibility: Touch targets ≥44px
- Mobile parity: Chat works on all viewports
- Professional readiness: Systematic, testable, feature-flagged

**Aligns with:**
- Part 04 § 2 "Invisible Automation" - User doesn't see complexity
- Part 02 "Systematized Operations" - Single routing point
- DRY - No duplicate responsive logic
- Testable - Feature flag toggle easy to verify

## Notes

**What already exists (no need to build):**
- ✅ Mobile components (MobileAIBrokerUI, MobileAIAssistantCompact)
- ✅ Design tokens (lib/design-tokens/mobile.ts)
- ✅ Feature flag system (lib/features/feature-flags.ts)
- ✅ ResponsiveBrokerShell router
- ✅ Desktop fallback (IntegratedBrokerChat)

**What this plan adds:**
- Integration with production chat page
- Tests (unit + E2E)
- Test playground pages
- Manual test documentation

---

**Last Updated:** 2025-11-07
**Estimated Hours:** 8 (reading + implementation + testing + docs)
**Actual Commits:** 5
**Runbook:** docs/runbooks/ai-broker/mobile-chat-integration-guide.md
