# NextNest Founder Ops Guide

Tags: Rendering • Forms • AI Broker • Chatwoot

This guide explains how the homepage, forms, AI broker UI, and Chatwoot integration render and work together — with exact file paths so you can navigate quickly. You can export this Markdown to PDF from your editor or browser.

## My thoughts:

1. What does the layout renders?

2. Which components are used in homepage?

3. Which components are used in the forms and broker UI?

4. I need to know how the domain state, zod schemas, mortgage calculations, form contracts and other lib's event-bus and analytics work.

5. How does the api work?

---

## 1) High-level layers

- __Pages (Routes)__
  - `app/page.tsx` — Production homepage (sophisticated landing + loan type selector)
  - `app/apply/page.tsx` — Progressive mortgage application form
  - `app/layout.tsx` — Global wrapper (fonts, globals, conditional nav)

- __Components__
  - `components/HeroSection.tsx`, `components/ServicesSection.tsx`, `components/ContactSection.tsx`
  - `components/forms/ProgressiveFormWithController.tsx` (PRODUCTION - main form at /apply)
  - `components/forms/sections/Step3NewPurchase.tsx`, `components/forms/sections/Step3Refinance.tsx`
  - `components/archive/2025-10/redesign-experiments/SophisticatedProgressiveForm.tsx` (archived experimental UI)

- __Engine / Domain (business logic)__
  - `lib/domains/forms/entities/LeadForm.ts` (domain state)
  - `lib/validation/mortgage-schemas.ts` (Zod schemas per step and loan type)
  - `lib/calculations/mortgage.ts` (eligibility & savings)
  - `lib/contracts/form-contracts.ts` (shared types/contracts)
  - `lib/events/event-bus.ts`, `lib/analytics/conversion-tracking.ts`

- __API Routes__ (backend endpoints)
  - See `app/api/**/route.ts` for routes such as:
    - `app/api/forms/analyze/route.ts`, `app/api/forms/commercial-broker/route.ts`
    - `app/api/chatwoot-conversation/route.ts`, `app/api/chatwoot-webhook/route.ts`, `app/api/chatwoot-ai-webhook/route.ts`

- __Design System__
  - Tokens & gradients: `tailwind.config.ts`
  - Global CSS: `app/globals.css`
  - Brand lint: `scripts/brand-lint.js` via `npm run lint:brand`
  - Proportional system: header h-12 (48px), 16px icons, compact inputs/buttons

---

## 2) How the homepage renders

- `app/page.tsx` composes: `HeroSection`, `ServicesSection`, `ContactSection`.
- `app/layout.tsx` wraps all pages and shows `components/ConditionalNav.tsx` except on `/redesign/*`.
- Most homepage UI is server-rendered (small hydration cost). It uses more decorative effects (blur/rounded) than redesign, which adds paint cost.

---

## 3) The form flow (main app)

1) __Entry__: Homepage at `app/page.tsx`
   - Loan type selection that routes to `/apply?loanType=...`

2) __Main form__: `components/forms/ProgressiveFormWithController.tsx`
   - Production form at `/app/apply/page.tsx` (1,517 lines)
   - Holds the step model (Step 0: Loan Type → Step 1: Who You Are → Step 2: What You Need → Step 3: Your Finances)
   - Uses form contracts from `lib/contracts/form-contracts.ts`
   - Triggers instant calculations from `lib/calculations/instant-profile.ts` (Dr Elena v2 engine)
   - Publishes analytics/events through `lib/analytics/conversion-tracking.ts` and `lib/events/event-bus.ts`
   - After completion, hands off to Chatwoot via `components/forms/ChatTransitionScreen.tsx`

__Note__: This form uses headless controller hook `hooks/useProgressiveFormController.ts` for state management.

---

## 4) Domain state: `LeadForm`

File: `lib/domains/forms/entities/LeadForm.ts`

- Tracks current step, completed steps, all field values.
- Gatekeeps progression: checks required fields before moving forward.
- Emits events (`STEP_STARTED`, `FIELD_CHANGED`, `STEP_COMPLETED`) to the event bus for analytics/monitoring.
- Stores lead score and AI insights.

Think of it as the single source of truth for a user’s form session.

---

## 5) Validation & calculations

- __Form Contracts__: `lib/contracts/form-contracts.ts`
  - Define interfaces for form state, inputs, and results
  - Source of truth for field names and types

- __Calculators__: `lib/calculations/instant-profile.ts` (Dr Elena v2)
  - Power instant eligibility (new purchase) and refinancing savings
  - Uses MAS regulatory constants from `lib/calculations/dr-elena-constants.ts`
  - Triggered automatically in Step 3 when enough fields are complete
  - Functions: `calculateInstantProfile()`, `calculateRefinanceOutlook()`, `calculateComplianceSnapshot()`

---

## 6) Landing page (production homepage)

- `app/page.tsx` — Production homepage with sophisticated design
- Loan type selector that routes users to `/apply?loanType=new_purchase|refinance|commercial`
- Bloomberg-inspired design: 48px controls, minimal effects, 200ms transitions, yellow accent CTAs
- Follows design system from `lib/design/tokens.ts`

---

## 7) Chatwoot integration

- __Trigger point__: After Gate 3 in `components/forms/IntelligentMortgageForm.tsx`.
  - Calls `POST /api/chatwoot-conversation` to create a conversation and return URL + assigned AI broker.

- __Client/UI__: `components/ChatwootWidget.tsx`, `components/forms/ChatTransitionScreen.tsx` (post-form prompt).

- __API routes__:
  - `app/api/chatwoot-conversation/route.ts`
  - `app/api/chatwoot-webhook/route.ts`, `app/api/chatwoot-ai-webhook/route.ts`
  - Health: `app/api/health/chat-integration/route.ts`
  - AI analysis submissions: `app/api/forms/analyze/route.ts`
  - Commercial direct: `app/api/forms/commercial-broker/route.ts`

---

## 8) Decisions & where to change them

- __Visuals (safe to change)__
  - Homepage UI: `components/*.tsx`
  - Redesign UI: `redesign/*.tsx`
  - Tokens & gradients: `tailwind.config.ts`
  - Global rules: `app/globals.css`
  - Brand lint: `npm run lint:brand`

- __Business rules__
  - Required fields & constraints: `lib/validation/mortgage-schemas.ts`
  - Step progression logic: `LeadForm.progressToStep()`
  - Calculations: `lib/calculations/mortgage.ts`
  - Analytics / events: `lib/analytics/conversion-tracking.ts`, `lib/events/event-bus.ts`
  - Chatwoot behaviors: API routes under `app/api/`

---

## 9) Field mapping (keep UIs consistent with schemas)

- Loan type: UI `new | refinance | commercial` → schema `new_purchase | refinance | commercial`
- New purchase Step 2: `propertyCategory`, `propertyType`, `priceRange:number`, `combinedAge:number`
- Refinance Step 2: `propertyType`, `currentRate:number`, `outstandingLoan:number`, `currentBank:string`
- Income mapping: UI `monthlyIncome` → schema `actualIncomes.0` (or set both)

---

## 10) Performance notes

- Redesign landing is lighter: nav hidden, minimal effects, dynamic import for form UI.
- Main form logic is shared; only the UI skin changes.
- Build to inspect bundles:

```bash
npm run build
```

---

## 11) Commands (quick reference)

```bash
npm run dev          # start dev server
npm run build        # production build
npm run start        # start production server
npm run lint:brand   # check brand colors/tokens
```

---

## 12) Why the headless controller matters

- One engine (LeadForm + schemas + calculators + analytics) reused by both UIs.
- Faster landing for sophisticated-flow (heavy logic loads only when needed).
- Safer iterations: designers can change UI without touching business rules.

---

Generated by Cascade on 2025-09-15 • Paths reflect your current repository structure under `c:/Users/HomePC/Desktop/Code/NextNest/`.
