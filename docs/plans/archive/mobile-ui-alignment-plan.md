# Mobile UI Alignment Implementation Plan

## Owner
- Primary: Junior Frontend Developer (assigned)
- Reviewer: Senior Frontend Engineer (Sarah Lim) or equivalent mentor

## Objective
Bring the mortgage funnel mobile experience in line with current design expectations by:
- smoothing the Step 3 success handoff card to the broker dashboard for narrow screens
- ensuring the loan type chooser swaps the helper copy correctly on selection
- standardising default placeholder sizing across all homepage form inputs/selects

## Prerequisites
- Local environment installed (`npm install` completed, Node 18+)
- Familiarity with Tailwind utility classes and shadcn/ui component overrides
- Run `npm run dev` to preview changes on http://localhost:3000 with responsive DevTools
- Confirm you are on the `bloomberg-compact-apply-stepper` branch (project default)

## Implementation Steps

### 1. Sync Baseline and Open Preview
1. Pull latest changes to ensure local workspace is current.
2. Start the dev server with `npm run dev`.
3. In browser DevTools, enable mobile viewport (iPhone 14 and Pixel 6 presets) to watch live updates.

### 2. Harmonise Form Placeholder Sizing
1. Open `components/ui/select.tsx`.
2. Update the trigger class to use `text-base` so select placeholders match the `Input` component.
3. Update `SelectItem` text to `text-base` for consistency inside dropdowns.
4. Confirm no other typography utility conflicts remain (clear custom overrides in consuming components if present).

### 3. Fix Loan Type Helper Copy Behaviour
1. Open `components/LoanTypeSection.tsx`.
2. Locate the mobile helper text near the button footer (`Tap to select`).
3. Replace the stack layout with a single flex row that conditionally renders either:
   - gold “Selected” badge with dot when selected, or
   - neutral “Tap to select” helper for unselected state (mobile only via `md:hidden`).
4. Verify there is no vertical stacking on mobile; keep desktop unaffected.

### 4. Refine Step 3 → Broker Success Card
1. Open `components/forms/ChatTransitionScreen.tsx` and focus on the `state === 'success'` block.
2. Constrain the card width using `max-w-sm sm:max-w-md` and tighten padding (`p-6 sm:p-8`).
3. Replace the square placeholder with:
   - a circular avatar shell (14x14) using gradient background, gold border, and broker initials.
   - an `aria-label` describing the placeholder to keep screen reader context.
4. Align textual elements in a centered flex column with small spacing so the layout breathes on mobile.
5. Ensure the conversation ID text shrinks slightly (`text-[11px]`) to avoid wrapping.

### 5. Manual QA Checklist
1. With dev server running, navigate to the homepage and:
   - inspect the loan type section on iPhone 14 viewport; confirm helper text toggles and no layout jumps.
   - submit Step 1 quickly to reach the success card (mock data acceptable) and verify avatar + spacing.
2. Examine every form field placeholder (`Your name`, `Email`, phone, selects) to make sure typography is uniform.
3. Repeat checks on a wider mobile breakpoint (Pixel 6) to catch density issues.

### 6. Linting and Handoff
1. Run `npm run lint` and ensure no new errors appear (existing hook warnings are documented; do not silence unless instructed).
2. Capture before/after screenshots for mobile views (loan type tile + Step 3 success card) to share with reviewer.
3. Prepare a short change summary noting files touched and validation run, ready for PR description.

## Validation Commands
- `npm run lint`

## Risks & Mitigations
- **Risk**: Inconsistent typography in downstream selects. **Mitigation**: search repo for `SelectTrigger` overrides and validate none conflict.
- **Risk**: Accessibility regression due to dynamic text. **Mitigation**: keep badge text high contrast and ensure `aria-label` exists on avatar placeholder.
- **Risk**: Layout shifts on desktop. **Mitigation**: use responsive utility scope (`md:`) to limit edits to mobile-only contexts.

## Estimated Effort
- Coding: 1.5 hours
- QA + screenshots: 0.5 hour

## Sign-off Checklist
- [ ] Mobile placeholders match `Input` default size
- [ ] Loan type helper text swaps in place without stacking
- [ ] Broker success card responsive avatar and spacing verified
- [ ] `npm run lint` executed and results documented
- [ ] Screenshots ready for reviewer
