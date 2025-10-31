ABOUTME: Mobile forms optimization implementation guide covering touch targets, conditional visibility, smart defaults, and A/B testing.
ABOUTME: Comprehensive patterns for building mobile-first mortgage application forms with session persistence and gradual rollout.

# Mobile Forms Optimization Guide

---
**Owner:** Engineering
**Status:** Active
**Last Updated:** 2025-10-31
**Related Plans:** `docs/plans/active/2025-10-18-lead-form-mobile-first-rebuild.md`
**Related Runbooks:** `docs/runbooks/FORMS_ARCHITECTURE_GUIDE.md`
---

## Overview

This guide covers mobile-first optimization patterns for mortgage application forms, focusing on touch-friendly interfaces, progressive disclosure, session persistence, and data-driven optimization.

**Key Principles:**
- Touch targets ≥48px (WCAG AAA)
- Show only relevant fields (8-10 vs 15)
- Smart defaults reduce cognitive load
- Session persistence enables resume
- A/B testing drives conversion

---

## Touch Target Standards

### Minimum Sizes (WCAG AAA Compliance)

| Element Type | Minimum Size | Recommended | Notes |
|--------------|-------------|-------------|-------|
| Primary buttons | 48x48px | 56x56px | CTA buttons |
| Input fields | 48px height | 56px height | Text inputs, selects |
| Checkboxes/radio | 44x44px | 48x48px | Touch area, not visual |
| Icon buttons | 48x48px | 56x56px | Navigation, actions |
| Links in text | 48px tall | 56px tall | Inline tappable area |

### Implementation Pattern

**Components:** `components/forms/mobile/MobileNumberInput.tsx`, `components/forms/mobile/MobileSelect.tsx`

```typescript
import { MobileNumberInput } from '@/components/forms/mobile/MobileNumberInput'

<MobileNumberInput
  label="Monthly income"
  name="monthlyIncome"
  value={monthlyIncome}
  onChange={(val) => setMonthlyIncome(val)}
  helperText="Gross income before CPF contributions"
/>
```

**Key CSS Properties:**
- `min-h-[56px]` - Ensures touch target height
- `touch-manipulation` - Disables zoom on double-tap
- `text-base` (16px) - Prevents iOS zoom on focus
- Warm-gold focus states (`#FCD34D`) and sharp corners to match Part 04 canon

### Touch Gesture Support

Use **native events** instead of libraries to keep bundle small:

```typescript
// In component/hook
const handleSwipe = useCallback((direction: 'left' | 'right') => {
  if (direction === 'right' && currentStep > 0) {
    goToPreviousStep();
  } else if (direction === 'left' && currentStep < totalSteps) {
    goToNextStep();
  }
}, [currentStep, goToPreviousStep, goToNextStep]);

useEffect(() => {
  let touchStartX = 0;

  const onTouchStart = (e: TouchEvent) => {
    touchStartX = e.touches[0].clientX;
  };

  const onTouchEnd = (e: TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;

    if (Math.abs(diff) > 50) { // Minimum swipe distance
      handleSwipe(diff > 0 ? 'left' : 'right');
    }
  };

  document.addEventListener('touchstart', onTouchStart);
  document.addEventListener('touchend', onTouchEnd);

  return () => {
    document.removeEventListener('touchstart', onTouchStart);
    document.removeEventListener('touchend', onTouchEnd);
  };
}, [handleSwipe]);
```

**Bundle Impact:** 0KB (native APIs vs 40KB framer-motion)

---

## Conditional Field Visibility

### Field Conditional Rules

**File:** `lib/forms/field-visibility-rules.ts`

```typescript
import type { LoanType, PropertyCategory, PropertyType } from '@/lib/contracts/form-contracts';

export interface Step2State {
  loanType: LoanType;
  propertyCategory: PropertyCategory | null;
  propertyType: PropertyType | null;
}

export function getStep2VisibleFields(state: Step2State): string[] {
  const fields: string[] = [];

  if (state.loanType === 'refinance') {
    return [
      'propertyType',
      'priceRange',
      'outstandingLoan',
      'currentRate',
      'currentBank',
      'existingProperties',
    ];
  }

  fields.push('propertyCategory');

  if (state.propertyCategory) {
    fields.push('propertyType');
  }

  if (state.propertyType) {
    fields.push('priceRange', 'combinedAge');

    if (['Private', 'EC', 'Landed'].includes(state.propertyType)) {
      fields.push('existingProperties');
    }
  }

  return fields;
}

export function shouldShowField(fieldName: string, visibleFields: string[]): boolean {
  return visibleFields.includes(fieldName);
}
```

### Visibility Hook

**File:** `lib/hooks/useFieldVisibility.ts`

```typescript
import { useMemo } from 'react';
import { getStep2VisibleFields, shouldShowField } from '@/lib/forms/field-visibility-rules';

export function useFieldVisibility(formState: Step2State) {
  return useMemo(() => {
    const visible = getStep2VisibleFields(formState);
    return (fieldName: string) => shouldShowField(fieldName, visible);
  }, [formState]);
}
```

### Integration with React Hook Form

```typescript
// In ProgressiveFormWithController.tsx
import type { Step2State } from '@/lib/forms/field-visibility-rules';
import { useFieldVisibility } from '@/lib/hooks/useFieldVisibility';
import { MobileNumberInput } from '@/components/forms/mobile/MobileNumberInput';

export function ProgressiveFormWithController() {
  const { watch, setValue } = useForm();
  const formData = watch();
  const step2State: Step2State = {
    loanType: formData.loanType,
    propertyCategory: formData.propertyCategory,
    propertyType: formData.propertyType,
  };
  const isVisible = useFieldVisibility(step2State);

  return (
    <div>
      {isVisible('cpfUsage') && (
        <MobileNumberInput
          label="CPF Usage"
          value={formData.cpfUsage}
          onChange={(val) => setValue('cpfUsage', val)}
        />
      )}

      {isVisible('currentRate') && (
        <MobileNumberInput
          label="Current Interest Rate"
          type="number"
          value={formData.currentRate}
          onChange={(val) => setValue('currentRate', val)}
        />
      )}
    </div>
  );
}
```

**Result:** Reduces visible fields from 15 → 8-10 per scenario

---

## Smart Defaults System

### Affordability Validation

**File:** `lib/forms/smart-defaults.ts`

```typescript
import { calculateInstantProfile } from '@/lib/calculations/instant-profile';

export interface SmartDefaultsInput {
  income: number;
  propertyType: 'hdb' | 'private' | 'ec' | 'commercial';
  loanType: 'new_purchase' | 'refinance';
  existingProperties: number;
}

export interface SmartDefaultsResult {
  suggestedPrice: number;
  suggestedLTV: number;
  suggestedTenure: number;
  confidenceLevel: 'high' | 'medium' | 'low';
  reasoning: string;
}

export function generateSmartDefaults(
  input: SmartDefaultsInput
): SmartDefaultsResult {
  const { income, propertyType, existingProperties } = input;

  // Prevent suggesting unaffordable properties
  const maxAffordableMonthly = income * 0.3; // Conservative 30% DTI
  const assumedRate = 0.04; // 4% stress test
  const assumedTenure = 25; // Conservative tenure

  // Monthly payment formula: P * r * (1+r)^n / ((1+r)^n - 1)
  const monthlyRate = assumedRate / 12;
  const months = assumedTenure * 12;
  const factor = Math.pow(1 + monthlyRate, months);
  const maxLoan = (maxAffordableMonthly * (factor - 1)) / (monthlyRate * factor);

  // Apply LTV based on property count
  const ltv = existingProperties === 0 ? 0.75 :
               existingProperties === 1 ? 0.45 : 0.35;

  const suggestedPrice = Math.floor(maxLoan / ltv / 1000) * 1000; // Round to nearest K

  // Validation: Don't suggest $1.2M to $3k/mo income
  if (income < 5000 && suggestedPrice > 800000) {
    return {
      suggestedPrice: 600000,
      suggestedLTV: ltv,
      suggestedTenure: assumedTenure,
      confidenceLevel: 'low',
      reasoning: 'Income may not support higher property prices'
    };
  }

  return {
    suggestedPrice,
    suggestedLTV: ltv,
    suggestedTenure: assumedTenure,
    confidenceLevel: income > 10000 ? 'high' : 'medium',
    reasoning: `Based on ${ltv * 100}% LTV and 30% debt-to-income ratio`
  };
}
```

### Usage in Form

```typescript
// When user enters income
const handleIncomeChange = async (newIncome: string) => {
  setValue('income', newIncome);

  if (Number(newIncome) > 0) {
    const defaults = generateSmartDefaults({
      income: Number(newIncome),
      propertyType: watch('propertyType'),
      loanType: watch('loanType'),
      existingProperties: watch('existingProperties')
    });

    // Pre-fill with smart defaults (user can override)
    setValue('propertyPrice', defaults.suggestedPrice);
    setValue('ltv', defaults.suggestedLTV);
    setValue('tenure', defaults.suggestedTenure);

    // Show reasoning tooltip
    setDefaultReasoning(defaults.reasoning);
  }
};
```

**Target:** 70% of users keep defaults unchanged

---

## Session Persistence

### Using Existing Storage Hook

**CRITICAL:** Use `useLoanApplicationStorage` (already exists at `lib/hooks/useLoanApplicationStorage.ts`)

**DO NOT create new storage hooks.** We have battle-tested solutions:
- `useLoanApplicationStorage` - 113 lines, 7-day persistence
- `useChatSessionStorage` - 95 lines
- `sessionManager` - 116 lines at `lib/utils/session-manager.ts`
- **Total:** 969 lines of proven code

### Integration Pattern

**Update:** `hooks/useProgressiveFormController.ts`

```typescript
import { useLoanApplicationStorage } from '@/lib/hooks/useLoanApplicationStorage';

export function useProgressiveFormController() {
  const {
    saveLoanApplicationData,
    retrieveLoanApplicationData,
    clearLoanApplicationData
  } = useLoanApplicationStorage();

  // Restore persisted data on mount
  useEffect(() => {
    const sessionId = getSessionId(); // From cookie or localStorage
    const savedData = retrieveLoanApplicationData(sessionId);

    if (savedData) {
      reset(savedData); // React Hook Form reset with saved values
      setCurrentStep(savedData.lastCompletedStep + 1);
    }
  }, []);

  // Auto-save on field changes (debounced)
  const debouncedSave = useMemo(
    () => debounce((data: any) => {
      const sessionId = getSessionId();
      saveLoanApplicationData(sessionId, {
        ...data,
        lastCompletedStep: currentStep,
        lastUpdated: new Date().toISOString()
      });
    }, 500),
    [currentStep]
  );

  useEffect(() => {
    const subscription = watch((data) => {
      debouncedSave(data);
    });
    return () => subscription.unsubscribe();
  }, [watch, debouncedSave]);

  // Clear on successful submission
  const handleSubmit = async (data: any) => {
    await submitToAPI(data);
    clearLoanApplicationData(getSessionId());
  };
}
```

**Error Handling:**
- Form data auto-saves to localStorage
- On submission failure → users reload and retry
- No complex offline queue needed (YAGNI)

**Target:** 30% session restoration rate

---

## A/B Testing Framework

### Experiment Configuration

**File:** `lib/ab-testing/experiments.ts`

```typescript
export interface Experiment {
  id: string;
  variants: string[];
  defaultVariant: string;
  active: boolean;
}

export const EXPERIMENTS: Record<string, Experiment> = {
  step2_cta_copy: {
    id: 'step2_cta_copy',
    variants: ['control', 'urgent', 'benefit', 'social_proof'],
    defaultVariant: 'control',
    active: true
  },
  instant_calc_timing: {
    id: 'instant_calc_timing',
    variants: ['auto', 'on_demand'],
    defaultVariant: 'auto',
    active: true
  },
  step3_field_order: {
    id: 'step3_field_order',
    variants: ['income_first', 'age_first'],
    defaultVariant: 'income_first',
    active: true
  }
};

export const CTA_COPY_VARIANTS = {
  control: 'Continue',
  urgent: 'Get My Rate Now',
  benefit: 'See What I Qualify For',
  social_proof: 'Join 10,000+ Borrowers'
};
```

### Experiment Hook

**File:** `lib/hooks/useExperiment.ts`

```typescript
import { useMemo } from 'react';
import { EXPERIMENTS } from '@/lib/ab-testing/experiments';

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

export function useExperiment(experimentId: string): string {
  const experiment = EXPERIMENTS[experimentId];

  return useMemo(() => {
    if (!experiment || !experiment.active) {
      return experiment?.defaultVariant || 'control';
    }

    // Deterministic bucketing based on session ID
    const sessionId = getSessionId();
    const hash = hashString(`${experimentId}:${sessionId}`);
    const variantIndex = hash % experiment.variants.length;

    return experiment.variants[variantIndex];
  }, [experimentId, experiment]);
}

// Usage in component
export function Step2CTAButton() {
  const variant = useExperiment('step2_cta_copy');
  const ctaText = CTA_COPY_VARIANTS[variant];

  return (
    <button
      onClick={handleContinue}
      data-experiment="step2_cta_copy"
      data-variant={variant}
    >
      {ctaText}
    </button>
  );
}
```

### Conversion Tracking

**File:** `lib/analytics/events.ts`

```typescript
export function trackExperimentExposure(experimentId: string, variant: string) {
  // PostHog/analytics
  analytics.track('experiment_exposure', {
    experiment_id: experimentId,
    variant: variant,
    timestamp: new Date().toISOString()
  });
}

export function trackFormEvent(eventName: string, properties: Record<string, any>) {
  analytics.track(eventName, {
    ...properties,
    timestamp: new Date().toISOString()
  });
}

// Usage
useEffect(() => {
  trackExperimentExposure('step2_cta_copy', variant);
}, [variant]);

const handleStepComplete = () => {
  trackFormEvent('step_completed', {
    step: currentStep,
    fields_shown: visibleFieldCount,
    time_spent_seconds: timeSpent
  });
};
```

---

## Feature Flags & Gradual Rollout

### Feature Flag System

**File:** `lib/feature-flags.ts`

```typescript
export interface FeatureFlag {
  enabled: boolean;
  rolloutPercentage: number; // 0-100
  allowlist?: string[]; // Session IDs or emails
}

export const FEATURE_FLAGS: Record<string, FeatureFlag> = {
  mobile_first_form: {
    enabled: true,
    rolloutPercentage: 0, // Start at 0%
    allowlist: ['team@nextnest.com'] // Team testing
  }
};

export function isFeatureEnabled(flagName: string): boolean {
  const flag = FEATURE_FLAGS[flagName];
  if (!flag || !flag.enabled) return false;

  // Check allowlist
  const sessionId = getSessionId();
  const email = getUserEmail();
  if (flag.allowlist?.includes(sessionId) || flag.allowlist?.includes(email)) {
    return true;
  }

  // Percentage rollout
  const hash = hashString(sessionId);
  const bucket = hash % 100;
  return bucket < flag.rolloutPercentage;
}
```

### Conditional Rendering

**Update:** `app/apply/page.tsx`

```typescript
import { isFeatureEnabled } from '@/lib/feature-flags';

export default function ApplyPage() {
  const showMobileForm = isFeatureEnabled('mobile_first_form');
  const isMobile = useMediaQuery('(max-width: 768px)');

  if (isMobile && showMobileForm) {
    return <ProgressiveFormMobileOptimized />;
  }

  return <ProgressiveFormWithController />;
}
```

### Rollout Schedule

| Week | Percentage | Monitoring |
|------|-----------|------------|
| Week 1 | 0% (allowlist only) | Team testing, fix bugs |
| Week 2 - Day 1 | 10% | Monitor error rates, conversion |
| Week 2 - Day 3 | 25% | Validate metrics stable |
| Week 2 - Day 5 | 50% | Check session restore rate |
| Week 3 - Day 1 | 75% | Monitor performance |
| Week 3 - Day 3 | 100% | Full rollout |

**Rollback triggers:**
- Error rate >5% → immediate rollback to 0%
- Conversion drop >10% → pause, investigate
- Bundle size >140KB → block deployment

---

## Testing Patterns

### Unit Test Template

```typescript
// lib/forms/__tests__/field-visibility-rules.test.ts
import type { Step2State } from '../field-visibility-rules';
import { getStep2VisibleFields, shouldShowField } from '../field-visibility-rules';

describe('Step 2 visibility rules', () => {
  const baseState: Step2State = {
    loanType: 'new_purchase',
    propertyCategory: null,
    propertyType: null,
  };

  it('always shows propertyCategory first', () => {
    const fields = getStep2VisibleFields(baseState);
    expect(shouldShowField('propertyCategory', fields)).toBe(true);
    expect(shouldShowField('priceRange', fields)).toBe(false);
  });

  it('reveals propertyType once category selected', () => {
    const fields = getStep2VisibleFields({
      ...baseState,
      propertyCategory: 'HDB',
    });
    expect(shouldShowField('propertyType', fields)).toBe(true);
  });

  it('reveals price and age only after property type selected', () => {
    const fields = getStep2VisibleFields({
      ...baseState,
      propertyCategory: 'Private',
      propertyType: 'Private',
    });
    expect(shouldShowField('priceRange', fields)).toBe(true);
    expect(shouldShowField('combinedAge', fields)).toBe(true);
  });
});
```

### Integration Test Template

```typescript
// tests/integration/conditional-fields.test.ts
import { render, screen, fireEvent } from '@testing-library/react';
import { ProgressiveFormWithController } from '@/components/forms/ProgressiveFormWithController';

describe('Conditional Fields Integration', () => {
  it('shows/hides fields based on loan type', async () => {
    render(<ProgressiveFormWithController />);

    // Select refinance
    fireEvent.change(screen.getByLabelText('Loan Type'), {
      target: { value: 'refinance' }
    });

    // Refinance fields should appear
    expect(await screen.findByLabelText('Current Interest Rate')).toBeInTheDocument();
    expect(await screen.findByLabelText('Outstanding Loan')).toBeInTheDocument();

    // Select new purchase
    fireEvent.change(screen.getByLabelText('Loan Type'), {
      target: { value: 'new_purchase' }
    });

    // Refinance fields should disappear
    expect(screen.queryByLabelText('Current Interest Rate')).not.toBeInTheDocument();
  });
});
```

### E2E Test Scenarios

```typescript
// tests/e2e/mobile-form-complete-flow.test.ts
import { test, expect } from '@playwright/test';

test('Complete mobile form journey with session restore', async ({ page, context }) => {
  // Set mobile viewport
  await page.setViewportSize({ width: 390, height: 844 }); // iPhone 13

  await page.goto('/apply');

  // Step 1: Fill basic info
  await page.fill('[name="loanType"]', 'new_purchase');
  await page.fill('[name="propertyType"]', 'private');
  await page.click('button:has-text("Continue")');

  // Step 2: Fill property details
  await page.fill('[name="propertyPrice"]', '1000000');

  // Refresh page to test session restore
  await page.reload();

  // Data should be restored
  await expect(page.locator('[name="propertyPrice"]')).toHaveValue('1000000');
  await expect(page.locator('[name="loanType"]')).toHaveValue('new_purchase');
});

test('Validates touch targets are ≥48px', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/apply');

  // Get all interactive elements
  const buttons = await page.locator('button, input, select, a').all();

  for (const element of buttons) {
    const box = await element.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(48);
  }
});
```

---

## Singapore Mortgage Context

### MAS Regulatory Constraints

Forms must respect:
- **TDSR (Total Debt Servicing Ratio):** 55% income cap
- **MSR (Mortgage Servicing Ratio):** 30% for HDB/EC
- **LTV (Loan-to-Value):** 75% first property, 45% second, 35% third+
- **Stress Test:** 4% residential, 5% commercial

### Common Scenarios

| Scenario | Fields Needed | Smart Defaults |
|----------|--------------|----------------|
| First-time HDB buyer | 8 fields | $500K property, 75% LTV, 25Y tenure |
| Second property investor | 10 fields | 45% LTV, cash servicing |
| Refinance with cash-out | 12 fields | Private only, equity calculation |
| Commercial purchase | 9 fields | No CPF, 5% stress, 60% LTV |

### Affordability Rules

**Conservative estimate:**
- Income × 0.3 = Max monthly payment
- Assumes 4% stress test rate
- Max 25-year tenure
- Prevents suggesting $1.2M to $3K/mo income

---

## Success Metrics

Track in PostHog/analytics:

| Metric | Baseline | Target | Measurement |
|--------|----------|--------|-------------|
| Mobile conversion rate | Current % | +35% | Completed / Started (mobile only) |
| Fields shown (avg) | 15 | 8-10 | Count visible fields per session |
| Session restore rate | 0% | 30% | Restored / Incomplete |
| Smart default acceptance | 0% | 70% | Unchanged / Shown |
| Touch target compliance | 80% | 100% | Elements ≥48px / Total |
| Bundle size | Current | <140KB | Webpack bundle analyzer |

---

## References

- **Existing Forms Guide:** `docs/runbooks/FORMS_ARCHITECTURE_GUIDE.md`
- **Dr Elena Calculations:** `lib/calculations/instant-profile.ts` (CANONICAL_REFERENCES.md)
- **Session Storage:** `lib/hooks/useLoanApplicationStorage.ts` (113 lines, proven)
- **Tech Stack:** `docs/runbooks/TECH_STACK_GUIDE.md`
- **Plan:** `docs/plans/active/2025-10-18-lead-form-mobile-first-rebuild.md`
