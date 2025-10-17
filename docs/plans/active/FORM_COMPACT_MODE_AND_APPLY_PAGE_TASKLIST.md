# NextNest Lead Form – Compact Mode and Dedicated /apply Page

Owner: Frontend (Junior Dev)
Reviewer: Design/Brand + Senior FE
Last Updated: 2025-09-17 14:04 (+08:00)

## Objectives
- Deliver a focused, high-conversion dedicated form page at `/apply`.
- Add a compact desktop mode (md+) for the Progressive Form to match the Bloomberg proportional system.
- Keep business logic 100% unchanged; only adjust layout and classes.
- Ensure full brand-lint compliance and avoid code bloat.

## Constraints & Non‑Goals
- Do not change any calculation logic, step flow, validation, or analytics.
- Do not introduce new color tokens or gradients. Use existing brand tokens.
- Do not add new dependencies.

## Success Criteria
- `/apply` renders only the lead form (no homepage sections around it).
- On desktop, controls look compact and proportional: inputs/buttons ~40px height, stepper circles ~32px, tight vertical rhythm.
- Brand-lint and ESLint pass. No regressions in chat transition.

---

## Pre‑Flight Checklist
- Run the app and confirm current form loads: `/` → scroll to form section; `/chat?conversation=...` flows still work.
- Confirm brand-lint exists: `scripts/brand-lint.js`; scripts in `package.json`: `lint:brand` and `lint:all`.
- Identify CTAs that should route to `/apply` (search for links to `#contact`, `#intelligent-contact`, or old CTA anchors).

Suggested greps:
- `href="/#contact"` or `/#intelligent-contact`
- Button texts: "Get AI Analysis", "Continue", "Get Instant Estimate"

Files likely relevant:
- `components/HeroSection.tsx`
- `components/ServicesSection.tsx`
- `components/ContactSection.tsx`

---

## Deliverables
1) New dedicated page: `app/apply/page.tsx` rendering the Progressive Form.
2) Compact desktop mode for `components/forms/ProgressiveForm.tsx` (class-only changes).
3) Emoji removals in Step 3 select options (replace with plain text or Lucide icons).
4) CTA routing to `/apply?loanType=...` from homepage.
5) Lint green: brand-lint + ESLint.

---

## Part A — Dedicated Form Page (`/apply`)

__Tasks__
1. Create `app/apply/page.tsx` that renders the progressive form.
   - Read `loanType` from query string, default to `new_purchase`.
   - Render the form with minimal, fixed header (logo + Back to Home). No other homepage content.
   - Example structure:
     - Parent container: `max-w-3xl mx-auto px-4 md:px-6 py-8`
     - Title area: stepper + label (already handled by the form).

2. Prefill `loanType` via query 
   - Supported values: `new_purchase`, `refinance`, `commercial` (match current schema types).
   - Guard invalid query values; fall back to `new_purchase`.

3. Route homepage CTAs to `/apply`
   - Update applicable CTAs to use `/apply?loanType=<type>` instead of scrolling to on-page anchors.
   - Keep one anchor CTA for SEO/testing if needed but the primary CTA should open `/apply`.

4. QA
   - Open `/apply` at 1440px. Confirm only the form is visible under the fixed header.
   - Links work: Back to Home → `/`; Continue in stepper still moves to next steps.

__Do / Don’t__
- Do: Keep the existing global fixed header; no duplicate navigation bars on `/apply`.
- Don’t: Copy form code; always import the existing `ProgressiveForm` component.

---

## Part B — Compact Desktop Mode (md+ only)

All changes in `components/forms/ProgressiveForm.tsx`. Do not alter validation or logic.

__General rhythm__
- Inputs/Selects: `md:h-10 md:text-sm md:px-3 md:py-2`.
- Buttons: primary `md:h-10 md:text-sm`; secondary `md:h-8 md:text-xs`.
- Cards: `md:p-3` for compact cards; insight cards `p-2` if applicable.
- Vertical gaps: reduce `space-y-6` → `md:space-y-3` where appropriate.
- Container: `max-w-3xl mx-auto` (or `max-w-2xl` if design prefers tighter).

__Stepper__
- Circles: `md:w-8 md:h-8` (currently `w-10 h-10`).
- Connectors: thin `h-px` lines; no gradients.
- Labels: `text-xs`; current step label `text-gold font-semibold`; completed `text-emerald`; future `text-silver`.

__Form controls__
- `SelectTrigger`, `Input`, `Button` heights: ensure `md:h-10`.
- Replace any large paddings `px-4 py-3` with `md:px-3 md:py-2`.
- Ensure error text stays `text-sm` or `text-xs` per hierarchy.

__Headings and text__
- Use tokens: `text-ink` for headings, `text-graphite` for body, `text-silver` for meta labels.
- Remove any legacy hex blues.

__Motion__
- Replace any spinners with a 200ms progress bar where loading is needed.
- No continuous pulses, bounces, or spins.

__QA__
- Desktop: check stepper, input heights, button sizes, gaps.
- Mobile: verify no regressions (compact applies at `md:` and up only).

---

## Part C — Brand-Lint Compliance

__Colors__
- Use only brand tokens (e.g., `bg-gold`, `text-ink`, `text-graphite`, `text-emerald`, `bg-mist`, `border-fog`).
- Remove Tailwind green/blue/red/purple utility variants and any gradients not allowed by brand-lint.
- Replace `text-green-600` with `text-emerald` (already updated in several spots).

__Gradients__
- Remove Tailwind gradients except the sanctioned custom ones (`bg-hero-gradient`, `bg-gradient-gold-text`).
- Progress bars should be solid token colors (e.g., `bg-gold`).

__No emojis__
- Step 3 select options currently include emojis (e.g., ⏰, 📅). Replace with plain text or a small Lucide icon on the left of the label.
  - Example replacements:
    - `no_lock` → "No lock-in period"
    - `ending_soon` → "Ending within 2–4 months"
    - `locked` → "Still locked in"
    - `not_sure` → "Unsure"

__Run linters__
- `npm run lint:brand` → must be green.
- `npm run lint` → must be green.

---

## Part D — ESLint Dependency Warning (Chat)

File: `components/chat/CustomChatInterface.tsx`
- The init effect references local functions and triggers a warning about missing deps.
- Fix options (choose one):
  1) Wrap `fetchMessages`, `pollNewMessages`, and `clearTyping` in `useCallback` and include them in the dependency array.
  2) If there’s a designed reason to run only on mount, add a targeted disable above that effect with a brief comment explaining intentional single-run.

QA: Chat still loads, polling works, no duplicate intervals on re-render, and lints are clean.

---

## Part E — CTA Routing Update

- Update main homepage CTAs to point to `/apply` with `loanType` when known:
  - `new_purchase` → `/apply?loanType=new_purchase`
  - `refinance` → `/apply?loanType=refinance`
  - `commercial` → `/apply?loanType=commercial`
- Keep anchor-based CTA only if intentionally needed for A/B testing; the default path should be `/apply`.

QA: Clicking CTAs navigates to `/apply`, correct step and defaults load, no double nav bars.

---

## Part F — Testing Matrix

__Desktop (≥1280px)__
- `/apply` renders only the form under the global fixed header (48px). No overlap.
- Stepper circles ~32px, connector thin, labels `text-xs`.
- Inputs/selects/buttons ~40px heights. Vertical rhythm `space-y-3`.
- Submit shows 200ms progress bar (no continuous spinners).

__Mobile (≤640px)__
- Control heights remain touch-friendly; no visual regressions.
- Stepper and CTA text still readable.

__Flow QA__
- Step 1 → Step 2 → Step 3 → Chat transition → `/chat?conversation=…` works.
- Session storage and analytics unchanged.
- Brand-lint + ESLint pass.

---

## Rollback Plan
- All changes are class-only and routing-only. To rollback: revert `/apply` route and CSS class changes in `ProgressiveForm.tsx`.

## Time Estimate
- Part A (Apply page + CTAs): 1–2 hours
- Part B (Compact mode classes): 2–3 hours
- Part C (Brand-lint pass + emoji removals): 30–60 minutes
- Part D (ESLint fix): 15–30 minutes
- QA and polish: 1 hour

---

## Notes for Reviewer
- Validate no gradients or banned utilities slipped in (purple, tailwind greens/blues/reds backgrounds/borders, rounded-full, etc.).
- Spot-check messages spacing in chat is `space-y-3` and icons are `w-4 h-4`.
- Confirm `/apply` page uses only necessary elements (avoid code bloat or duplication).
