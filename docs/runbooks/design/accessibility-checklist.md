ABOUTME: Accessibility checklist for Constraint A public surfaces.
ABOUTME: Enables repeatable WCAG AA audits of homepage, form, chat, and PDFs.

# Constraint A Accessibility Checklist

Stage 0 requires every public surface to meet WCAG 2.1 AA expectations and the Brand & UX Canon. Use this runbook before major releases and whenever components change.

## Scope

- `app/page.tsx` homepage
- Progressive form flow (`components/forms/ProgressiveFormWithController.tsx` and children)
- AI broker shell (`components/ai-broker/ResponsiveBrokerShell.tsx` and mobile rebuild)
- Downloadable artifacts (scenario PDFs, banker packs)

## Roles and Timing

- **Design/Content** owns visual and copy conformance prior to handoff.
- **Engineering** executes technical checks during implementation and regression testing.
- **QA** verifies evidence and logs completion in `docs/work-log.md`.
- Run the checklist at least: pre-merge for material UI PRs, before Stage 0 gate review, and after any dependency upgrades that affect rendering.

## Tools

- Chrome Lighthouse (Accessibility tab, mobile + desktop)
- Axe DevTools browser extension
- VoiceOver (macOS/iOS) and TalkBack (Android)
- Keyboard navigation (Tab, Shift+Tab, Enter, Space, Arrow keys, Escape)
- Color contrast analyzers (e.g., Stark, WebAIM Contrast Checker)
- Reduced motion simulator (`prefers-reduced-motion` dev tools override)

## Core Principles

1. **Perceivable** – Text contrast ≥ 4.5:1, non-text contrast ≥ 3:1, alt text for images, transcripts for multimedia.
2. **Operable** – Full keyboard support, logical focus order, visible focus indicators, gesture alternatives.
3. **Understandable** – Consistent labeling, clear error messaging, instructions before inputs, language set to `en-SG`.
4. **Robust** – Semantic HTML, ARIA only when needed, live regions for streaming updates, passes automated checks without suppressions.

## Pre-Flight Checklist

- [ ] Confirm Tailwind tokens in use align with trust blue/charcoal palette to guarantee contrast.
- [ ] Verify Inter is the applied typeface and font stacks include system fallbacks.
- [ ] Ensure motion utilities respect `prefers-reduced-motion`.
- [ ] Validate feature flags default to accessible experiences when disabled.
- [ ] Confirm copy references voice/tone guide and avoids color-only instructions (“tap the blue button”).

## Surface Audits

### Homepage (`app/page.tsx`)

- [ ] Hero text contrast ≥ 4.5:1 against background gradient.
- [ ] Primary and secondary CTAs: 44px min height, visible focus rings, descriptive labels.
- [ ] Navigation links reachable via keyboard; skip link or equivalent jump to main content.
- [ ] Metric cards announce context to screen readers (use headings and `aria-describedby` for numbers).
- [ ] Images (`Logo`, scenario graphics) contain descriptive `alt` text or `role="presentation"` when decorative.
- [ ] Trust strip icons paired with text; no color-only cues.
- [ ] Content order in DOM matches visual order when toggling landing vs loan selection views.
- [ ] Auto-playing animations avoided; any animated counters stop or present static text for assistive tech.

### Progressive Form (`components/forms/ProgressiveFormWithController.tsx`)

- [ ] Step titles rendered as headings (`h2`/`h3`) with aria-live updates announcing step changes.
- [ ] Inputs include explicit `<label>` elements or `aria-labelledby` that remain visible.
- [ ] Helper text describes why data is required; errors surface inline and announce via `aria-live="assertive"`.
- [ ] Keyboard users can advance/return without hitting unexpected focus traps.
- [ ] Touch targets ≥ 44px; check radio buttons, dropdowns, toggles.
- [ ] Validation avoids timing out; no auto-advance before assistive tech reads the content.
- [ ] Loading states include text (“Processing your scenario…”) in addition to spinners.

### AI Broker Shell (`components/ai-broker/ResponsiveBrokerShell.tsx` and mobile UI)

- [ ] Chat transcripts use semantic grouping (`<ol>`/`<ul>` with `<li>` or `<article>` per message) and announce speaker names.
- [ ] Streaming responses expose progress through `aria-live="polite"` regions without overwhelming repetition.
- [ ] Composer input labeled; send button and quick-action chips accessible via keyboard and 44px touch size.
- [ ] Feature flag fallback (SimpleAgentUI) audited with the same checklist.
- [ ] Modals, drawers, and carousels trap focus while open and restore focus on close; Escape key exits.
- [ ] Horizontal gestures (e.g., tabs, carousels) offer keyboard alternatives (arrow keys or buttons).
- [ ] High contrast maintained on chat background vs text, especially in mobile dark/light modes if provided.

### Reports & PDFs

- [ ] Exported PDFs include tagged headings, table structures, and reading order for screen readers.
- [ ] Alt text embedded for charts or diagrams; decorative elements marked as artifacts.
- [ ] Text contrast preserved (avoid light gold on white).
- [ ] Links and CTAs descriptive (“Review detailed analysis” instead of “Click here”).
- [ ] Document metadata populated (title, author, language).

## Validation Log Template

Record evidence in `docs/work-log.md` using this structure:

```
### Accessibility Audit – [Surface]
- Constraint: A – Public Surfaces Ready
- CAN Tasks: CAN-016, CAN-037
- Date & Auditor:
- Tools & Findings:
- Follow-ups:
```

Attach screenshots, Lighthouse exports, or screen reader notes where relevant.

## Regression Triggers

- Palette updates (Tailwind tokens, CSS variables)
- Component refactors affecting navigation/menu structures
- Introduction of animations, carousels, drawers, or new form fields
- Third-party embeds or analytics scripts injected into public pages

When any trigger occurs, rerun the relevant surface audit before release.

## Exit Criteria for Stage 0

- All checklist items verified for homepage, form, chat, and PDFs.
- Evidence logged in `docs/work-log.md` with links to audits.
- Open issues tracked with owners and due dates; blocker issues resolved before launch review.
- Strategy alignment matrix remains 🟡 until audits and documentation are complete, then upgrade to ✅ with supporting links.
