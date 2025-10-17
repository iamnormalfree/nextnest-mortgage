# Progressive Form → Broker UI Implementation Plan

Status: Draft v1 (2025-09-17)
Owner: Frontend Team
Audience: Junior–Mid Frontend Devs (reviewed by Senior)
Scope: UI/UX and integration flow only. No changes to business or calculation logic.

---

## 1) Objective
Deliver an elegant, brand-compliant journey from homepage → loan type → legacy Progressive Form → chat/broker UI, fully aligned with Evaluation 2 and Design Principles, without modifying core business logic or calculations.

Success criteria:
- Single, coherent flow without duplicate chat creation.
- Strict brand compliance: monochrome + gold, no emojis, no gradients (except hero), no rounded corners, 8px spacing grid, 200ms micro-interactions.
- No regressions to validation, calculations, insights, or scoring.
- Brand lint passes (`npm run lint:brand`).

---

## 2) Non‑Goals
- Do not change mortgage calculation logic in `lib/calculations/`.
- Do not change schema/business validation in `lib/validation/`.
- Do not alter API contracts or backend behavior.

---

## 3) References (read these first)
- Design: `redesign/independent-ux-evaluation-2.md`, `redesign/design-principles-guide.md`
- Form flow: `components/forms/IntelligentMortgageForm.tsx`, `components/forms/ProgressiveForm.tsx`
- Chat handoff: `components/forms/ChatTransitionScreen.tsx`
- Chat page: `app/chat/page.tsx`
- Tokens & UI kit: `styles/`, `components/ui/*`
- Brand lint: `scripts/brand-lint.js`, `package.json` scripts

---

## 4) Current Flow (baseline)
1. Homepage renders `ContactSection` → `IntelligentMortgageForm`.
2. User selects loan type (pre‑gate) → legacy `ProgressiveForm` runs Steps 1..N.
3. Gate 2 & Gate 3 submissions occur (AI insights & lead score).
4. Chat transition → `/chat?conversation=<id>`.

Issues to address:
- Duplicate chat creation risk (IntelligentMortgageForm G3 vs ChatTransitionScreen).
- Chat page off-brand (tailwind grays/blue, emojis, rounded corners, spinner).
- CTA anchor mismatch: hero links `#contact` but form is `#intelligent-contact`.
- Minor step/UI polish (icons sizing, labels, spacing) to match principles.

---

## 5) Implementation Overview (no logic changes)
- Match Hero CTA anchor to form section.
- Ensure single source of chat creation (transition screen owns it).
- Refactor Chat UI to Evaluation 2:
  - Replace emojis with Lucide icons.
  - Replace tailwind `gray-*`/`blue-*` with tokens (`ink`, `graphite`, `silver`, `fog`, `mist`, `gold`).
  - Remove rounded corners; keep sharp.
  - Replace continuous spinner with skeleton or subtle progress (200ms micro‑interactions only).
  - Align spacing to 8/16/24/32.
- Minor Progressive Form polish: replace any emoji-like icons, ensure 16px icon sizing and token usage, optional copy improvement for Step 2.
- Run brand-lint; fix violations.

---

## 6) Work Breakdown Structure (WBS)

### Task A — Baseline & Verification
- A1. Start dev server and visit homepage and `/chat`.
- A2. Open DevTools → Console and Network (monitor `/api/...`).
- A3. Run `npm run lint:brand` and note any violations (expect chat page offenders).
- A4. Record current behavior of Gate 3 (ensure only one POST to `/api/chatwoot-conversation`).

Deliverables:
- Short notes of lint errors and any duplicate POSTs observed.

---

### Task B — Homepage CTA Alignment (UI polish)
- File: `components/HeroSection.tsx`
- B1. Update CTA anchor to match the form section id (`#intelligent-contact`).
- B2. Verify scroll works from hero to intelligent form.

Test:
- Manual click → ensure smooth navigation to the correct section.

---

### Task C — Prevent Duplicate Chat Creation (flow integrity)
- File: `components/forms/IntelligentMortgageForm.tsx`
- Context: We now render the legacy `ProgressiveForm`, which ends with `ChatTransitionScreen` that creates the conversation and routes to `/chat`.
- C1. In `handleStepCompletion`, `case 3`, disable or guard the POST to `/api/chatwoot-conversation` (leave it to `ChatTransitionScreen`).
  - Approach: Feature flag or simple early return with comment: "Chat creation is owned by ChatTransitionScreen to avoid duplicates".
- C2. Keep insights/lead score logic untouched.

Test:
- Complete flow to Gate 3; check Network tab shows a single POST for chat creation.

---

### Task D — Chat UI Refactor (brand compliance)
- Primary File: `app/chat/page.tsx`
- Support Files: `components/chat/BrokerProfile.tsx`, `components/chat/CustomChatInterface.tsx`, `components/chat/HandoffNotification.tsx`

Goals:
- Replace emojis with Lucide icons (24px grid for header, 16px inline where applicable).
- Replace `text-gray-*`, `bg-gray-*`, `text-blue-*` with tokens (`ink`, `graphite`, `silver`, `fog`, `mist`, `gold`).
- Remove `rounded-*` classes; keep sharp corners.
- Replace continuous spinner with skeleton loaders or simple progress using `gold` and 200ms transitions.
- Apply 8px spacing grid (section padding, card padding, gaps).

Steps:
- D1. Header: `text-ink` title, `text-silver` subtitle, white background, bottom `border-fog`, height ~64px.
- D2. Container backgrounds: use `bg-mist` for page, `bg-white` for cards.
- D3. Replace emoji features (🤖, 🔒, 👨‍💼, 📞, 💬, ✉️) with Lucide icons (e.g., `Shield`, `User`, `Phone`, `MessageSquare`, `Mail`):
  - Size: inline `w-4 h-4`, section hero icons up to `w-6 h-6` if needed.
- D4. Loading states: replace `Loader2` blue spinner with skeleton or gold progress bar; if spinner is kept temporarily, recolor to tokens and ensure it’s not continuous.
- D5. Buttons: primary gold (`bg-gold text-ink hover:bg-gold-dark`), secondary ghost (`border-fog text-graphite hover:bg-mist`). No rounded.
- D6. Messages:
  - AI: `bg-white border border-fog text-graphite`.
  - User: `bg-ink text-white`.
  - Max width ~70%, consistent padding (16px), sharp corners.
- D7. Remove decorative animations; keep micro‑interactions at 200ms, ease.

Test:
- Visual check vs design docs.
- `npm run lint:brand` passes (no purple, blue accents, tailwind grays, rounded, or gradients).

---

### Task E — Progressive Form Minor UI Tidying (optional, no logic change)
- Files: `components/forms/ProgressiveForm.tsx`, `components/forms/ProgressiveFormWithController.tsx` (if used anywhere), `components/forms/SimpleLoanTypeSelector.tsx` (already refactored).
- E1. Replace any remaining emoji-like icons with Lucide at `w-4 h-4`.
- E2. Ensure labels use `text-xs uppercase tracking-wide text-silver`.
- E3. Ensure inputs height 48px, border `fog`, focus `gold`, no shadows.
- E4. Optional copy: Step 2 header to “Select Property Category” (to clearly distinguish from the earlier loan type selection). Keep validation unchanged.

Test:
- Step through both `new_purchase` and `refinance` flows; confirm no schema/logic regressions.

---

### Task F — QA & Compliance
- F1. Manual walkthrough: homepage → loan type → steps → chat page.
- F2. Verify only one chat creation request is made.
- F3. Verify no emojis, no tailwind grays/blues, no rounded.
- F4. Verify spacing grid (8/16/24/32) and 200ms micro‑interactions.
- F5. `npm run lint:brand` → 0 errors.
- F6. Lighthouse quick pass; ensure no major regressions.

Deliverable:
- Short QA report with screenshots.

---

## 7) Acceptance Criteria
- Anchor fix: Hero CTA scrolls to `#intelligent-contact`.
- Single chat creation source: only `ChatTransitionScreen` creates conversations.
- Chat page matches Evaluation 2 (no emojis, tokens only, sharp corners, skeleton/progress instead of spinners, spacing grid).
- Progressive Form visuals tidy and consistent; no change to logic.
- Brand lint passes; no purple/blue accents/gradients/rounded banned by script.

---

## 8) Risks & Mitigations
- Risk: Breaking chat creation by disabling wrong path.
  - Mitigation: Keep change localized; test network requests explicitly.
- Risk: Over‑refactoring chat UI introduces layout bugs.
  - Mitigation: Small PRs per subcomponent; visual snapshot tests.
- Risk: Brand‑lint fails due to legacy files not in use.
  - Mitigation: Move legacy demos to `Archive/` or refactor minimal classes.

---

## 9) Rollback Plan
- Each task is a separate commit:
  - Revert the specific commit to roll back.
- Keep feature flag or code comment in `IntelligentMortgageForm.tsx` to quickly re‑enable old behavior if needed.

---

## 10) Effort Estimate
- B (CTA): 0.25h
- C (Guard): 0.5h
- D (Chat UI): 3–5h (depends on subcomponents)
- E (Form polish): 1–2h
- F (QA): 1h

Total: ~1 day

---

## 11) Command & Checklist

Commands:
```bash
npm run lint:brand
npm run dev
```

PR Checklist:
- [ ] No business logic changes in `lib/calculations/*` or `lib/validation/*`.
- [ ] No emojis anywhere.
- [ ] No tailwind `gray-*` or `blue-*` classes; token equivalents used.
- [ ] No `rounded-*` classes.
- [ ] 8px spacing grid followed.
- [ ] 200ms micro‑interactions only.
- [ ] Brand lint passes.
- [ ] Network shows single chat creation POST.
```
