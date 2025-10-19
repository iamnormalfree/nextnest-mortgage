# ABOUTME: Desktop UX patterns for lead form quick wins
# Covers number formatting, progressive disclosure, visual weight reduction

# Desktop UX Patterns

**Purpose:** Implementation patterns for desktop lead form UX improvements focused on number formatting, cognitive load reduction, and visual simplification.

**Target Files:**
- `components/forms/ProgressiveFormWithController.tsx`
- `components/forms/sections/Step3NewPurchase.tsx`
- `components/forms/sections/Step3Refinance.tsx`
- `lib/forms/form-config.ts`

**Related Documentation:**
- [Forms Architecture Guide](./FORMS_ARCHITECTURE_GUIDE.md)
- See CANONICAL_REFERENCES.md for tier constraints

---

## Table of Contents

1. [Architecture Context](#architecture-context)
2. [Number Formatting Pattern](#number-formatting-pattern)
3. [Progressive Disclosure Pattern](#progressive-disclosure-pattern)
4. [Visual Weight Reduction Pattern](#visual-weight-reduction-pattern)
5. [Testing Strategies](#testing-strategies)
6. [Deployment Process](#deployment-process)
7. [Success Metrics](#success-metrics)
8. [Troubleshooting](#troubleshooting)

---

## Architecture Context

### Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Form Library:** React Hook Form
- **Validation:** Zod schemas
- **Styling:** Tailwind CSS
- **Component Library:** Shadcn/ui

### Current Form Flow
1. **Step 1:** Contact info (name, email, phone)
2. **Step 2:** Property details - Shows instant calc result automatically
3. **Step 3:** Financial details - Connects to AI broker
4. **Transition:** Broker matching screen - Chat handoff

---

## Number Formatting Pattern

### Overview
Apply comma separators to all monetary input fields for consistency and improved readability.

### Standard Implementation Pattern

Convert number input to formatted text input. Key changes:
- Change type="number" to type="text"
- Add className="font-mono" for readability
- Use formatNumberWithCommas for display value
- Use parseFormattedNumber for onChange parsing
- Update placeholders to show commas

See original plan lines 76-157 for detailed code examples.

### Required Imports

```tsx
import { formatNumberWithCommas, parseFormattedNumber } from '@/lib/utils'
```

### Fields Requiring Formatting

**Step3NewPurchase.tsx:**
- Monthly income (actualIncomes)
- Variable/bonus income (actualVariableIncomes)
- Existing commitments (existingCommitments)

**Step3Refinance.tsx:**
- Income fields (same pattern)
- Outstanding loan amount
- Property value
- Other monetary fields

**DO NOT format:**
- Age fields (use type="number" with spinbutton)
- Percentage fields
- Non-monetary numbers

### Why This Pattern

- type="text" allows comma display
- font-mono improves number readability
- Existing utilities handle parsing/formatting
- Form state stores raw numbers (not strings)

### Mobile Considerations

Add inputMode="numeric" for better mobile keyboard experience.

---

## Progressive Disclosure Pattern

### Overview
Hide complex information until user explicitly requests it, reducing cognitive load.

### Implementation Steps

**1. Add visibility state:**

```tsx
const [showInstantCalcResult, setShowInstantCalcResult] = useState(false)
```

**2. Replace auto-display with trigger button:**

Wrap existing result display with conditional rendering.
See original plan lines 297-334 for full code example.

**3. Reset visibility on navigation:**

```tsx
useEffect(() => {
  setShowInstantCalcResult(false)
}, [currentStep])
```

### CTA Button Text Updates

Update lib/forms/form-config.ts Step 2:

```typescript
ctaText: 'Continue to financial details'
```

---

## Visual Weight Reduction Pattern

### Overview
Reduce visual clutter through smaller text, minimal borders, progressive disclosure.

### Key Changes

**Section Headings:** text-xs uppercase tracking-wider text-[#666666]
**Borders:** Replace bg+border with simple border-b
**Labels:** Reduce mb-2 to mb-1
**Helper Text:** Condense to single line
**MAS Card:** Use details element for progressive disclosure

See original plan lines 480-686 for detailed patterns.

---

## Testing Strategies

### Manual Testing Checklist

**Number Formatting:**
- [ ] Type "5000" displays "5,000"
- [ ] Backspace works naturally
- [ ] Submit saves as numbers

**Progressive Disclosure:**
- [ ] Button appears on Step 2
- [ ] Click reveals result
- [ ] Navigate back resets

**Visual Weight:**
- [ ] Headings smaller/grey
- [ ] No heavy borders
- [ ] Clean feel

### Automated Tests

- Unit: Formatting/parsing functions
- Integration: Form flow with formatting
- E2E: Complete user journey
- Visual: Playwright screenshots

See original plan lines 186-248, 370-441, 617-686 for test code.

---

## Deployment Process

### Pre-Deployment

1. Run: npm test, playwright, lint
2. Build validation
3. Manual QA on mobile/desktop

### Steps

1. Create feature branch
2. TDD: Test first, code second
3. PR with screenshots
4. Staging deployment
5. Production with monitoring

### Rollback Plan

1. Identify issue
2. Quick fix or full revert
3. Post-mortem and re-deploy

See original plan lines 833-876 for details.

---

## Success Metrics

### Targets

1. **Conversion Rate:** +15-20% increase
2. **Step 2→3 Progression:** +10% increase
3. **Instant Calc Engagement:** >70% click-through
4. **Completion Time:** No change (±10%)
5. **Bounce Rate:** -20% Step 2, -15% Step 3

### Analytics Events

```javascript
gtag('event', 'form_step_complete', {
  step_number: 2,
  step_name: 'property_details'
})

gtag('event', 'instant_calc_reveal', {
  step_number: 2,
  trigger: 'user_click'
})
```

See original plan lines 879-908 for complete metrics.

---

## Troubleshooting

### iOS Numeric Keyboard

Add inputMode="numeric" and pattern="[0-9,]*"

### React Hook Form Warnings

Always provide value prop - never undefined

### Comma Parsing

parseFormattedNumber handles edge cases like "5,,,000"

### State Not Resetting

Verify useEffect dependency includes currentStep

### Layout Shifts

Keep consistent padding, test with real content

### Performance

Memoize formatting functions if needed

---

## Related Patterns

**See also:**
- [Forms Architecture Guide](./FORMS_ARCHITECTURE_GUIDE.md)
- CANONICAL_REFERENCES.md

**Dependencies:**
- lib/utils.ts
- lib/forms/form-config.ts
- React Hook Form
- Tailwind CSS

---

**Last Updated:** 2025-10-19
**Maintenance:** Update when form patterns change
