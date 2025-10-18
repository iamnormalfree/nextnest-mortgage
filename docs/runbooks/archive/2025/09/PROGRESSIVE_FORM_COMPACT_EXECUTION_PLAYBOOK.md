# Progressive Form Compact Mode — Execution Playbook (Modular Work Packets)

Owner: Frontend (Junior Dev)
Reviewer: Senior FE + Brand/Design
Updated: 2025-09-17 14:14 (+08:00)

## Goal
Make `components/forms/ProgressiveForm.tsx` compact on desktop (md+) without touching business logic. All edits are class-only.

## Non‑Goals
- No refactors, no component splits, no schema/validation changes.
- No new dependencies. No new tokens. No Tailwind gradient utilities.

## How to Work Safely in a Large File
- Use focused greps to jump to sections rather than scrolling:
  - Stepper circle: `w-10 h-10 flex items-center justify-center`
  - Connectors: `h-1 bg-fog`
  - Headings: `text-xl` near `formSteps[currentStep]?.label`
  - Spacing blocks: `space-y-6` or `space-y-4`
  - Controls: `SelectTrigger className="... h-12` or `className="w-full h-12"`
  - Emojis: search for `✅|⏰|📅|🤔` (regex)
  - Gradients: `bg-gradient-to-`
- Only edit class strings; never touch function signatures, types, or logic.
- After each packet, run brand-lint and a quick UI check.

---

## Packet 0 — Readiness & Snapshots
- __Objective__: Prepare before any changes
- __Steps__:
  1. Open `/apply` (when created) or current form section and take a screenshot at ~1440px.
  2. Confirm brand-lint script exists and runs.
  3. Ensure you can find the following anchors in `ProgressiveForm.tsx`:
     - `return (<div className={cn('progressive-form', className)}>)`
     - Stepper block (look for `progress-indicator` and `w-10 h-10`).
     - Select/Input blocks (look for `SelectTrigger`, `Input`).

---

## Packet 1 — Container Width & Top Spacing (Optional)
- __Objective__: Ensure a focused width on desktop
- __Where__: Near the root return: `return (<div className={cn('progressive-form', className)}>)`
- __Change__: add outer container utilities where the parent renders this component (preferred) or here:
  - Suggested: wrap in a container on the usage site (e.g., `/apply` page) `max-w-3xl mx-auto px-4 md:px-6 py-8`.
- __QA__: Desktop width ≤ 1200px; content centered.

---

## Packet 2 — Stepper Size & Labels
- __Objective__: Tighten stepper
- __Where__: `progress-indicator` block; circle currently `w-10 h-10`
- __Change__:
  - Circles: add `md:w-8 md:h-8` (keep mobile size as is).
  - Connector line: change to `md:h-px` (keep `h-1` for mobile if needed).
  - Label text: keep `text-xs`; current step `text-gold font-semibold`; completed `text-emerald`; future `text-silver`.
- __QA__: Circles ≈ 32px at desktop; no gradients.

---

## Packet 3 — Headings & Meta Text
- __Objective__: Ensure consistent tokens
- __Where__: The heading block around `formSteps[currentStep]?.label`
- __Change__:
  - Replace any hex colors with `text-ink` for headings, `text-graphite` for description.
- __QA__: No hex colors, brand tokens only.

---

## Packet 4 — Controls Height & Density
- __Objective__: Reduce control heights on desktop
- __Where__: All `SelectTrigger`, `Input`, any `className="w-full h-12 ..."`
- __Change__ (class-only):
  - Add responsive compact classes: `md:h-10 md:text-sm md:px-3 md:py-2`.
  - Keep mobile heights (h-12) intact; only constrain at `md+`.
- __QA__: Controls ≈ 40px tall at desktop; labels remain legible.

---

## Packet 5 — Vertical Rhythm
- __Objective__: Reduce vertical spacing
- __Where__: Major groups using `space-y-6` / `space-y-4`
- __Change__: add `md:space-y-3` (don’t remove mobile spacing).
- __QA__: Desktop rhythm is tighter; mobile unchanged.

---

## Packet 6 — Card Paddings
- __Objective__: Compact cards
- __Where__: `CardContent className="p-4"` / `p-6`
- __Change__: add `md:p-3`; insight cards can use `p-2` if dense.
- __QA__: Content remains readable; no cut-off.

---

## Packet 7 — Progress Bars & Motion
- __Objective__: Align motion with brand
- __Where__: Lead score bars, trust/progress bars, button loading state
- __Change__:
  - Replace `bg-gradient-to-...` with solid `bg-gold`.
  - Replace spinners with a 200ms bar (already applied in many places).
- __QA__: No continuous animations; transitions feel crisp.

---

## Packet 8 — Emoji Removal in Options
- __Objective__: Remove emojis from select items
- __Where__: Step 3 options (e.g., `SelectItem value="no_lock">✅ No lock-in period`)
- __Change__:
  - Convert to plain text: `No lock-in period`, `Ending within 2–4 months`, `Still locked in`, `Unsure`.
- __QA__: No emojis anywhere in the form.

---

## Packet 9 — Brand-Lint Pass
- __Objective__: Ensure compliance
- __Where__: Entire file
- __Check__:
  - No Tailwind green/blue/red/purple utilities (use tokens like `text-emerald`).
  - No Tailwind gradient utilities (except sanctioned custom ones elsewhere).
  - No `rounded-full` or xl+ rounded classes.
- __Run__: `npm run lint:brand` (must pass).

---

## Packet 10 — ESLint & Smoke QA
- __Objective__: Keep code quality high
- __Where__: `components/forms/ProgressiveForm.tsx`, `components/chat/CustomChatInterface.tsx`
- __Change__:
  - If ESLint flags the chat init effect deps, resolve via `useCallback` or a targeted disable with a clear comment.
- __Run__: `npm run lint`
- __QA__: Form submits → chat transition works; no console errors.

---

## Packet 11 — CTA Routing (Outside the Form)
- __Objective__: Route users to the dedicated page
- __Where__: Homepage CTAs
- __Change__: Update links to `/apply?loanType=<type>`; keep one anchor CTA if needed for A/B.
- __QA__: Clicking CTA opens the dedicated page with the correct loan type.

---

## Packet 12 — Final Visual QA (Desktop & Mobile)
- Desktop: 1440px review — stepper ~32px, inputs/buttons ~40px, `space-y-3`, token-only colors.
- Mobile: ensure no regressions.
- Compare to pre-change screenshots; changes should be purely density/spacing and not functional.

---

## Tips to Avoid Second-Order Mistakes
- Never modify function names, props, or business logic.
- Make class changes in small, focused commits per packet.
- After each packet, run the app and lints; don’t batch too many edits without QA.
- If unsure, comment with `// UI-only change` above the edit for future maintainers.

## Rollback Plan
- Each packet is reversible by reverting its commit; keep commits small and labeled, e.g., `PF-Compact: Packet 4 – Controls height (md)`.
