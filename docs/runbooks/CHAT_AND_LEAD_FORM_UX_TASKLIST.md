# NextNest Lead Form and AI Broker UI UX Refactor — Junior Developer Task List

Purpose: Bring the legacy Lead Form → Chat (AI Broker) experience to parity with the sophisticated flow, while enforcing brand principles and zero business-logic changes.

Constraints
- [ ] Do NOT change logic in `lib/calculations/*`, `lib/validation/*`, or rate/tenure math.
- [ ] Follow brand lint rules (tokens only; no banned Tailwind utilities; no emojis).
- [ ] 200ms micro-interactions only. No loops like `animate-pulse`, `animate-bounce`, `animate-spin`.
- [ ] Sharp corners. No `rounded-*` unless a component explicitly requires it (prefer none).
- [ ] Keep code modular and avoid duplication. New view components go under `components/chat/`.

Quick Start
- [ ] Pull latest main
- [ ] Create branch: `feat/chat-ui-refactor`
- [ ] Run: `npm run dev` and `npm run lint:brand`

## A) Fix: Header overlapping content (nav bar “eating” the top of page)
Context: Header is fixed (`fixed top-0 h-12`) and overlapped content below.

Already applied globally:
- `app/layout.tsx` wraps children in `<main className="pt-12">` to offset the 48px fixed header.

You must:
- [ ] Verify no individual pages add redundant extra top padding. Remove any page-level `pt-12` if present to avoid double spacing.
- [ ] Ensure section anchors account for fixed header when using in-page links. Apply `scroll-mt-12` to top-level sections with anchors: `#hero`, `#services`, `#contact`.
- [ ] Confirm `components/ConditionalNav.tsx` keeps `h-12` and remains consistent with header standards.

Acceptance
- [ ] Scrolling to `#hero` positions content below header cleanly, no overlap.
- [ ] All pages render with correct spacing beneath the header.

## B) Build the Bloomberg-style Chat Page Shell
Goal: Match sophisticated flow proportions.

Layout shell
- [ ] Create `components/chat/ChatLayoutShell.tsx` with:
  - [ ] Sticky header h-12; left: logo/title; right: actions (Back to Form, Dashboard)
  - [ ] CSS grid: left sidebar `w-60` (hidden on small screens), main content area
  - [ ] Main content padding: `p-4`
  - [ ] Use tokens only (`ink/graphite/silver/fog/mist/gold/emerald/ruby`)

Integrate shell
- [ ] Refactor `app/chat/page.tsx` to use `ChatLayoutShell` and slots:
  - [ ] Left: `InsightsSidebar`
  - [ ] Main: `AdvisorHeader`, `MetricsRow`, `SummaryInsightBanner`, `CustomChatInterface`

Responsive
- [ ] Sidebar hidden on mobile; header condenses; composer stays sticky at bottom

Acceptance
- [ ] Page loads with 2-column layout (desktop) and collapses to 1-column (mobile)

## C) Insights Sidebar (Left Rail)
- [ ] Create `components/chat/InsightsSidebar.tsx` containing:
  - [ ] Card: AI Confidence Score (from session or fallback), add LIVE badge
  - [ ] Section nav: Overview / Analysis / Action (no routing necessary yet)
  - [ ] Three compact insight cards (Rate Optimization, Timing Analysis, Savings Potential)

Data wiring
- [ ] Confidence score from `sessionStorage.lead_score` (fallback to 70%)
- [ ] Insight cards use placeholder numbers (e.g., 1.33%, 45 days) until backend provides real data

Acceptance
- [ ] Sidebar renders and respects brand tokens and sharp corners

## D) Advisor Header + Metrics Row
Advisor header
- [ ] Create `components/chat/AdvisorHeader.tsx` with title + tagline
  - [ ] Title: “AI Mortgage Advisor”
  - [ ] Tagline: “Powered by GPT-4 • Analyzing 286 packages in real-time”
  - [ ] Right: “AI Enhanced” badge and optional star/favorite icon (Lucide)

Metrics row
- [ ] Create `components/chat/MetricsRow.tsx` with 3 KPIs:
  - [ ] Packages analyzed (286)
  - [ ] Banks compared (23)
  - [ ] Optimal matches (3)

Acceptance
- [ ] Typography scale: title `text-2xl font-light`, KPI labels `text-xs`, values `text-xl`

## E) Summary Insight Banner (above chat messages)
- [ ] Create `components/chat/SummaryInsightBanner.tsx`:
  - [ ] Mist card with one-paragraph summary of findings
  - [ ] Gold chips for “286 packages”, “23 banks”, “3 matches”

Acceptance
- [ ] Renders above messages area with `mb-3`, tokens only, 200ms transitions

## F) Composer Enhancements
- [ ] Create `components/chat/SuggestionChips.tsx` with chips: Rates, Savings, Timing, Market
- [ ] On click, inject template text into `CustomChatInterface` input
- [ ] Improve placeholder copy to guide next action (no emoji)

Acceptance
- [ ] Chips visible under composer and functional

## G) Chat Surface Polish
Inside `components/chat/CustomChatInterface.tsx`:
- [ ] Remove inner header (“Mortgage Advisory Chat”) after page header exists
- [ ] Replace any `animate-pulse` and pulsing “Online” dot with non-looping 200ms transitions or static state
- [ ] Keep message spacing `space-y-3` and brand tokens

Acceptance
- [ ] No continuous animations; messages/bubbles conform to tokens and spacing

## H) Progressive Form UX Polishing (no logic changes)
`components/forms/ProgressiveForm.tsx`:
- [ ] Replace remaining emojis in helper cards (Resale/New Launch/BTO) with Lucide icons (`Home`, `Sparkles`/`Building`)
- [ ] Replace emoji strings in trust signals (`showTrustSignal`) with icon tags or remove emojis from strings
- [ ] Ensure labels `text-xs uppercase` where appropriate and inputs `h-12`
- [ ] Keep all durations `duration-200`; remove heavy shadows (prefer none or `shadow-sm`)

`components/forms/ChatTransitionScreen.tsx`:
- [ ] Confirm tokens only, no emojis, no rounded, and 200ms transitions

Acceptance
- [ ] Form steps render with consistent proportions; brand-lint passes

## I) Data: Confidence & Metrics
- [ ] In `components/forms/ChatTransitionScreen.tsx`, store `leadScore` in `sessionStorage` when redirecting to `/chat`
- [ ] In chat page, read score and compute a simple “confidence” (e.g., 70% default; or map score→confidence)
- [ ] Keep metrics placeholders for now; wire to `/api/chat/context` later

Acceptance
- [ ] Chat shows confidence and KPIs even without backend data (placeholders)

## J) Brand-Lint & Token Guardrails
- [ ] Run `npm run lint:brand` after each major section
- [ ] Remove or refactor any of the following if found:
  - [ ] Tailwind `purple-*`, `gray-*`, `blue-*`, `red-*`, `green-*` utilities
  - [ ] Gradients (except custom `bg-hero-gradient`, `bg-gradient-gold-text`)
  - [ ] `rounded-full` or large/custom rounded classes
  - [ ] Emojis in UI strings

Acceptance
- [ ] `npm run lint:brand` produces 0 violations

## K) Responsive + Accessibility
- [ ] Sidebar collapses; header condenses on small screens
- [ ] Icons consistently `w-4 h-4`
- [ ] Inputs `aria-label` when icon-only buttons appear
- [ ] Sufficient contrast per tokens

Acceptance
- [ ] Mobile, tablet, desktop layouts verified

## L) QA and Final Checklist
- [ ] One chat creation only (still created via `ChatTransitionScreen`)
- [ ] No regression in form validation and calculations
- [ ] No emojis anywhere in Lead Form or Chat
- [ ] 200ms micro-interactions only; no loops
- [ ] Brand-lint green; `npm run dev` shows no errors

## M) Git & PR Hygiene
- [ ] Commit in small logical chunks with scopes, e.g., `feat(chat): add layout shell`
- [ ] PR title: `refactor(chat): implement Bloomberg layout + insights`
- [ ] PR description includes: what changed, why, screenshots (desktop/mobile), and `lint:brand` output

## Risk & Second-Order Considerations
- Avoid duplicating components: prefer `components/chat/*` and reuse.
- Do not alter API endpoints or calculations; UI only.
- Keep imports at top of files; avoid inline imports in function body.
- Watch for double top-padding after the header fix; remove page-level `pt-12` if any exist.
- Use `scroll-mt-12` on anchored sections to prevent header overlap.
- No new dependencies; use existing `lucide-react` and tokens.
