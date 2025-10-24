ABOUTME: Systematic audit checklist for verifying Constraint A (Public Surface Readiness) implementation.
ABOUTME: Compares current codebase state against Stage 0 launch gate requirements.

# Constraint A Audit Checklist

**Constraint:** Public Surface Readiness (Stage 0 Launch Gate)
**Purpose:** Verify codebase meets all Stage 0 requirements before marking Constraint A complete
**Frequency:** Run before weekly review, or when claiming Constraint A is ✅

---

## How to Use This Checklist

1. **Work through sections in order** (don't skip)
2. **Collect evidence for each item** (test output, screenshots, metrics)
3. **Mark status:** ✅ Complete | 🟡 In Progress | ❌ Not Started | 🔴 Blocked
4. **Link evidence** in Stage 0 gate document
5. **Don't claim Constraint A complete** until all items are ✅

---

## Section 1: Homepage & Landing Pages

### 1.1 Homepage Hero Section

**File:** `app/page.tsx`, `components/landing/HeroSection.tsx`

**Checklist:**
- [ ] Hero headline matches Part 04 brand messaging (evidence-based positioning)
- [ ] Subhead uses approved copy (no pressure language)
- [ ] CTA text aligned with voice guide (CAN-036 prerequisite)
- [ ] Trust statement present and accurate
- [ ] Visual hierarchy correct (headings, spacing, contrast)

**Evidence to collect:**
- Screenshot of hero section (desktop 1920px, mobile 390px)
- Copy audit comparing current text vs Part 04 messaging
- Link to approved voice guide (CAN-036)

**Status:** [ ] | **Evidence:** `validation-reports/homepage-hero-audit-[date].md`

---

### 1.2 Trust Strip & Social Proof

**Files:** Check components in `components/landing/`

**Checklist:**
- [ ] Trust indicators present (security, regulation compliance)
- [ ] No misleading claims (rates, guarantees, timeframes)
- [ ] Testimonials (if present) are authentic and PDPA-compliant
- [ ] Partner logos (if present) have approval/contracts

**Evidence to collect:**
- Screenshot of trust elements
- PDPA compliance verification for testimonials

**Status:** [ ] | **Evidence:** `validation-reports/trust-elements-[date].png`

---

### 1.3 Navigation & Footer

**Files:** `components/layout/ConditionalNav.tsx`, `components/layout/Footer.tsx`

**Checklist:**
- [ ] Navigation links work (no 404s)
- [ ] Mobile menu functional (<768px)
- [ ] Footer legal links present (Privacy, Terms, PDPA)
- [ ] Contact information accurate
- [ ] Accessibility: keyboard navigation works

**Evidence to collect:**
- Manual QA checklist (all links clicked)
- Mobile navigation test (320px, 390px, 768px)
- Keyboard navigation video/notes

**Status:** [ ] | **Evidence:** `validation-reports/navigation-qa-[date].md`

---

## Section 2: Progressive Form Experience

### 2.1 Form UX & Flow

**Files:** `components/forms/ProgressiveFormWithController.tsx`, `hooks/useProgressiveFormController.ts`

**Checklist:**
- [ ] Step 1: Property details capture works
- [ ] Step 2: Instant calculation triggers correctly
- [ ] Step 3: Personal details conditional fields work (CAN-051)
- [ ] Progress indicator shows current step
- [ ] Back navigation preserves data
- [ ] Validation messages clear and helpful

**Evidence to collect:**
- E2E test results: `npm test -- tests/e2e/step3-ux-report.spec.ts`
- Manual QA: Complete form flow 3 times (desktop, tablet, mobile)
- Screenshot each step

**Status:** [ ] | **Evidence:** `test-results/form-e2e-[date].json`

---

### 2.2 Instant Calculation (Dr. Elena v2)

**Files:** `lib/calculations/instant-profile.ts`, `lib/calculations/dr-elena-constants.ts`

**Checklist:**
- [ ] TDSR calculation correct (55% limit enforced)
- [ ] MSR calculation correct (30% limit enforced)
- [ ] LTV limits correct (per property type, buyer profile)
- [ ] Tenure limits correct (age-based, property-age-based)
- [ ] CPF usage correct (OA limits, withdrawal rules)
- [ ] Stress test applied (3.5% rate)
- [ ] Output matches Dr. Elena persona expectations

**Evidence to collect:**
- Test results: `npm test -- tests/calculations/instant-profile.test.ts`
- Test results: `npm test -- tests/dr-elena-v2-regulation.test.ts`
- 97/97 tests passing confirmation

**Status:** [ ] | **Evidence:** Test output already in `docs/reports/dr-elena-validation-report-2025-10-31.md` ✅

---

### 2.3 Form Accessibility (WCAG AA Minimum)

**Files:** All form components

**Checklist:**
- [ ] All inputs have labels (aria-label or <label>)
- [ ] Error messages announced to screen readers
- [ ] Keyboard navigation: Tab order logical
- [ ] Focus indicators visible
- [ ] Color contrast ≥4.5:1 (text), ≥3:1 (UI elements)
- [ ] Touch targets ≥48px (mobile) - CAN-051 prerequisite

**Evidence to collect:**
- axe DevTools scan results (0 critical issues)
- WAVE accessibility scan results
- Manual keyboard navigation test
- Touch target audit (CAN-051 mobile guide)

**Status:** [ ] | **Evidence:** `validation-reports/accessibility-scan-[date].pdf`
**Blocker:** CAN-037 (accessibility checklist runbook) needed first

---

## Section 3: AI Broker Chat

### 3.1 Chat UI & Responsiveness

**Files:** `components/ai-broker/ResponsiveBrokerShell.tsx`, `components/chat/CustomChatInterface.tsx`

**Checklist:**
- [ ] Chat widget loads on desktop (≥1024px)
- [ ] Chat widget loads on mobile (320px, 390px, 768px)
- [ ] Message history persists across refresh
- [ ] Typing indicators work
- [ ] Send button functional
- [ ] No console errors in browser

**Evidence to collect:**
- E2E test results: `npm test -- tests/e2e/chat-production-e2e.spec.ts`
- Screenshots: desktop, mobile (3 widths)
- Browser console log (should be clean)

**Status:** [ ] | **Evidence:** `test-results/chat-e2e-[date].json`

---

### 3.2 Chat Functionality & SLA

**Files:** `lib/ai/broker-ai-service.ts`, `lib/queue/broker-queue.ts`, `lib/queue/broker-worker.ts`

**Checklist:**
- [ ] BullMQ worker running (check `/api/worker/start` status)
- [ ] Messages enqueue correctly
- [ ] AI responses arrive within SLA (P95 <5s)
- [ ] Persona routing works (Dr. Elena for calculations)
- [ ] Fallback messages work (when OpenAI fails)
- [ ] Chatwoot integration functional (messages sync)

**Evidence to collect:**
- Worker health check: `curl http://localhost:3000/api/worker/start | jq`
- SLA profiling: Run `scripts/profile-sla-timing.ts` with 10+ samples
- Test BullMQ flow: `scripts/test-bullmq-incoming-message.ts`
- Chatwoot message delivery confirmation

**Status:** [ ] | **Evidence:** `validation-reports/chat-sla-metrics-[date].json`

---

### 3.3 Chat Conversation Persistence

**Files:** Check Chatwoot integration, Supabase schema

**Checklist:**
- [ ] Conversations persist in Chatwoot
- [ ] Message history repopulates on page refresh
- [ ] Conversation ID consistent across sessions
- [ ] No duplicate messages on reload

**Evidence to collect:**
- Manual test: Send 3 messages → refresh page → verify history
- Chatwoot dashboard screenshot showing conversation
- Database query showing conversation records

**Status:** [ ] | **Evidence:** `validation-reports/chat-persistence-[date].md`

---

## Section 4: Design System & Brand

### 4.1 Color Tokens (Brand Consistency)

**Files:** `tailwind.config.ts`, brand runbooks

**Checklist:**
- [ ] Purple tokens removed (CAN-016)
- [ ] Gold palette defined and used correctly
- [ ] Charcoal palette defined and used correctly
- [ ] Trust blue palette defined and used correctly
- [ ] No hardcoded colors in components (use Tailwind classes)

**Evidence to collect:**
- `grep -r "nn-purple" components/` (should return 0 results)
- `grep -r "#[0-9A-Fa-f]{6}" components/` (should return minimal results)
- Screenshot of Tailwind config showing only approved palettes

**Status:** [ ] | **Evidence:** `validation-reports/color-token-audit-[date].txt`
**Blocker:** CAN-016 (purple token cleanup) not yet complete

---

### 4.2 Typography

**Files:** `tailwind.config.ts`, `app/globals.css`, component files

**Checklist:**
- [ ] Inter font loaded and set as default
- [ ] Gilda Display removed from codebase (CAN-018)
- [ ] Font sizes follow scale (text-sm, text-base, text-lg, etc.)
- [ ] Line heights appropriate for readability
- [ ] No `font-gilda` classes remain

**Evidence to collect:**
- `grep -r "font-gilda" .` (should return 0 results)
- `grep -r "Gilda" .` (should return 0 results)
- Screenshot of typography in use (homepage, form, chat)

**Status:** [ ] | **Evidence:** `validation-reports/typography-audit-[date].txt`

---

### 4.3 Visual Identity Alignment

**Files:** All public-facing components

**Checklist:**
- [ ] CTAs use trust blue (not gold) per Part 04 canon
- [ ] Spacing consistent (using Tailwind spacing scale)
- [ ] Border radius consistent
- [ ] Shadow usage consistent
- [ ] Component styling matches Figma (if designs exist)

**Evidence to collect:**
- Visual regression screenshots comparing before/after Part 04 alignment
- Figma link and code comparison notes

**Status:** [ ] | **Evidence:** `validation-reports/visual-identity-[date].md`

---

## Section 5: Performance & Technical

### 5.1 Lighthouse & PageSpeed

**Files:** All pages

**Checklist:**
- [ ] Homepage: Performance ≥90, Accessibility ≥90, Best Practices ≥90, SEO ≥90
- [ ] Form page: Performance ≥85, Accessibility ≥90
- [ ] TTFB <2s (per roadmap requirement)
- [ ] FCP <1.8s
- [ ] LCP <2.5s

**Evidence to collect:**
- Lighthouse report (JSON export): `lighthouse https://nextnest.sg --output=json`
- PageSpeed Insights screenshot
- WebPageTest results (optional)

**Status:** [ ] | **Evidence:** `validation-reports/lighthouse-[date].json`

---

### 5.2 Bundle Size

**Files:** Build output

**Checklist:**
- [ ] Total bundle size <140KB gzipped (per roadmap requirement)
- [ ] No duplicate dependencies (check npm ls warnings)
- [ ] Code splitting working (check build output)
- [ ] Largest chunks identified and acceptable

**Evidence to collect:**
- Build output: `npm run build > validation-reports/build-output-[date].txt`
- Bundle analyzer: `npm run analyze` (if configured)
- List of chunks with sizes

**Status:** [ ] | **Evidence:** `validation-reports/build-output-[date].txt`

---

### 5.3 Error Handling & Monitoring

**Files:** Error boundaries, monitoring setup

**Checklist:**
- [ ] Error boundaries in place for form, chat, pages
- [ ] Console errors <5 on production build
- [ ] Failed API calls don't break UI
- [ ] User-friendly error messages (no stack traces shown)
- [ ] Monitoring configured (Sentry, LogRocket, or equivalent)

**Evidence to collect:**
- Error boundary test: Trigger error, verify graceful fallback
- Console log from production build (clean or minimal warnings)
- Screenshot of monitoring dashboard

**Status:** [ ] | **Evidence:** `validation-reports/error-handling-[date].md`

---

## Section 6: Content & Messaging

### 6.1 Voice & Tone Alignment

**Files:** All copy in components

**Checklist:**
- [ ] Voice guide created (CAN-036)
- [ ] Homepage copy follows voice guide
- [ ] Form copy follows voice guide (friendly, no pressure)
- [ ] Chat prompts follow voice guide (Dr. Elena persona)
- [ ] Error messages follow voice guide (helpful, not blaming)

**Evidence to collect:**
- Link to voice guide: `docs/content/voice-and-tone.md`
- Copy audit: Sample text vs voice guide principles

**Status:** [ ] | **Evidence:** `docs/content/voice-and-tone.md` (CAN-036)
**Blocker:** CAN-036 not yet complete

---

### 6.2 Positioning & Messaging

**Files:** Homepage, about page, form headers

**Checklist:**
- [ ] Evidence-based positioning (not competitor comparison)
- [ ] Transparency emphasis (rates, process, fees)
- [ ] Human-led, AI-assisted messaging (not "AI replaces brokers")
- [ ] No misleading claims (100% accuracy, guaranteed savings, etc.)
- [ ] Regulatory disclaimers present where needed

**Evidence to collect:**
- Copy audit comparing current text vs Part 04 messaging principles
- Legal review confirmation (if available)

**Status:** [ ] | **Evidence:** `validation-reports/messaging-audit-[date].md`

---

## Section 7: Testing & CI/CD

### 7.1 Test Coverage

**Files:** All test files

**Checklist:**
- [ ] Unit tests pass: `npm test` (calculation tests, component tests)
- [ ] Integration tests pass (form flow, chat flow)
- [ ] E2E tests pass: `npx playwright test`
- [ ] No skipped tests (.skip or .todo) in critical paths
- [ ] Coverage ≥70% for critical paths (calculations, form logic)

**Evidence to collect:**
- Test output: `npm test > validation-reports/test-results-[date].txt`
- Coverage report: `npm test -- --coverage`
- Playwright test results

**Status:** [ ] | **Evidence:** `validation-reports/test-results-[date].txt`

---

### 7.2 Pre-Commit Hooks & CI

**Files:** `.husky/`, `.github/workflows/` (if present)

**Checklist:**
- [ ] Pre-commit hooks run (lint, test, plan validation)
- [ ] Hooks pass on current branch
- [ ] CI pipeline configured (if using GitHub Actions, etc.)
- [ ] CI passes on main branch
- [ ] No force-push to main (git history clean)

**Evidence to collect:**
- Pre-commit hook output: `bash scripts/validate-plan-length.sh`
- Git log showing no force-pushes
- CI dashboard screenshot (if applicable)

**Status:** [ ] | **Evidence:** `validation-reports/ci-status-[date].md`

---

## Section 8: Documentation & Handoff

### 8.1 Runbooks Present

**Files:** `docs/runbooks/`

**Checklist:**
- [ ] AI Broker runbook: `AI_BROKER_COMPLETE_GUIDE.md` (section 3.7 complete)
- [ ] Forms runbook: `mobile-optimization-guide.md` (CAN-051)
- [ ] Brand runbooks: `messaging.md`, `copywriting-guide.md` (updated for Part 04)
- [ ] Missing runbooks tracked in CAN tasks

**Evidence to collect:**
- List of runbooks: `ls docs/runbooks/**/*.md`
- Comparison vs strategy-alignment-inventory.md

**Status:** [ ] | **Evidence:** `docs/reports/strategy-alignment-inventory.md`

---

### 8.2 Stage 0 Launch Gate

**Files:** `docs/plans/re-strategy/stage0-launch-gate.md`

**Checklist:**
- [ ] All checklist items have status (✅/🟡/❌)
- [ ] All ✅ items have evidence links
- [ ] Evidence is current (<2 weeks old)
- [ ] Launch gate reviewed by stakeholders

**Evidence to collect:**
- Link to Stage 0 gate: `docs/plans/re-strategy/stage0-launch-gate.md`
- Stakeholder approval (email, Slack, meeting notes)

**Status:** [ ] | **Evidence:** `docs/plans/re-strategy/stage0-launch-gate.md`

---

## Final Checklist: Constraint A Completion Criteria

Before marking Constraint A as ✅ in the matrix, verify ALL of these:

**From Roadmap:**
- [ ] Stage 0 checklist fully green (all items ✅ with evidence)
- [ ] Lighthouse: TTFB <2s, bundle <140KB, WCAG AA verified
- [ ] E2E tests pass: `chat-production-e2e.spec.ts` and `step3-ux-report.spec.ts`
- [ ] Work log entry confirms completion

**From Matrix (Constraint A Row):**
- [ ] All CAN tasks for Constraint A complete (CAN-001, CAN-016, CAN-017, CAN-020, CAN-036, CAN-037)
- [ ] All runbooks present (or tracked as missing with CAN tasks)
- [ ] All active plans focusing on Constraint A complete or archived

**From Stage 0 Gate:**
- [ ] Homepage copy aligned
- [ ] Progressive form functional and accessible
- [ ] Chat system operational within SLA
- [ ] Brand tokens consistent
- [ ] Performance budgets met

**Evidence Archive:**
- [ ] All validation reports saved to `validation-reports/`
- [ ] Screenshots saved to `validation-reports/screenshots/`
- [ ] Test outputs saved to `test-results/`
- [ ] Evidence linked in Stage 0 gate document

---

## Audit Workflow

### Step 1: Run the Audit
Work through this checklist section by section. For each item:
1. Check current codebase state
2. Collect evidence (run tests, take screenshots, etc.)
3. Mark status: ✅/🟡/❌/🔴
4. Save evidence to `validation-reports/`

### Step 2: Document Gaps
For any ❌ or 🔴 items:
1. Note blocker or missing work
2. Check if CAN task exists
3. If no CAN task: Create one or ask Brent
4. Estimate effort to complete

### Step 3: Update Tracking Documents
1. Update `docs/plans/re-strategy/stage0-launch-gate.md` with evidence
2. Update `docs/reports/strategy-alignment-inventory.md` with gaps
3. Update work log with audit findings

### Step 4: Plan Remediation
1. Prioritize gaps (critical path first)
2. Assign CAN tasks
3. Create implementation plans if needed
4. Schedule work in weekly review

### Step 5: Re-Audit Before Claiming Complete
Don't claim Constraint A complete until:
- Re-run this entire checklist
- All items are ✅
- All evidence is current
- Stakeholders reviewed

---

*Last updated: 2025-10-31*
