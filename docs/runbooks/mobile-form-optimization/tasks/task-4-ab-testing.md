# Task 4: A/B Testing Framework

**Status:** ⏸️ PENDING
**Estimated Time:** 5-7 hours
**Prerequisites:** Task 3 completed

[← Back to Index](../00-INDEX.md) | [Previous: Task 3](task-3-smart-defaults.md) | [Next: Task 5 →](task-5-feature-flags.md)

---

## Overview

**Objective:** Enable data-driven optimization through built-in experimentation

**Why This Matters:**
- Continuous improvement requires testing hypotheses
- A/B testing eliminates guesswork
- Data-driven decisions prevent costly mistakes

**Expected Impact:**
- Find 10-20% conversion improvements through testing
- Reduce decision-making time from weeks to days
- Build culture of experimentation

**Files to Create:**
- `lib/ab-testing/experiments.ts` - Experiment configuration
- `lib/hooks/useExperiment.ts` - React hook for experiments
- `lib/analytics/events.ts` - Event tracking
- `lib/ab-testing/__tests__/experiments.test.ts` - Unit tests

**Files to Update:**
- `components/forms/ProgressiveFormWithController.tsx` - Apply experiments
- `components/forms/ProgressiveFormMobile.tsx` - Apply to mobile

---

## Implementation Steps

### 4.1 Install Analytics/Experiment Tool

**Choose One:**

**Option A: PostHog (Recommended)**
```bash
npm install posthog-js
```

**Option B: Statsig**
```bash
npm install statsig-js
```

**Option C: Custom (if budget constrained)**
Use existing analytics + simple bucketing

**For this guide, we'll use Option C (custom) to avoid dependencies.**

---

### 4.2 Create Experiment Configuration

**Create:** `lib/ab-testing/experiments.ts`

```typescript
// ABOUTME: A/B test experiment definitions for lead form optimization
// ABOUTME: Centralized config for all active experiments with feature flags

export interface Experiment {
  id: string
  name: string
  variants: {
    control: string
    treatment: string | string[]
  }
  allocation: number // % of users in experiment
  active: boolean
}

export const ACTIVE_EXPERIMENTS: Experiment[] = [
  {
    id: 'step2_cta_copy',
    name: 'Step 2 CTA Button Copy',
    variants: {
      control: 'Get instant loan estimate',
      treatment: [
        'See your max loan amount',
        'Calculate my borrowing power',
        'Continue to financial details'
      ]
    },
    allocation: 100,
    active: true
  },
  {
    id: 'instant_calc_timing',
    name: 'When to Show Instant Calculation',
    variants: {
      control: 'auto', // Show automatically
      treatment: 'on_demand' // Show on button click
    },
    allocation: 50,
    active: true
  },
  {
    id: 'field_order_step3',
    name: 'Step 3 Field Order',
    variants: {
      control: 'income_first', // Ask income before age
      treatment: 'age_first' // Ask age before income
    },
    allocation: 50,
    active: true
  },
  {
    id: 'trust_signal_position',
    name: 'Trust Signal Display Position',
    variants: {
      control: 'top', // Show at top of form
      treatment: 'inline' // Show next to relevant fields
    },
    allocation: 50,
    active: false // Not yet ready
  }
]

export function getActiveVariant(experimentId: string, userId: string): string {
  const experiment = ACTIVE_EXPERIMENTS.find(e => e.id === experimentId)
  if (!experiment || !experiment.active) {
    return 'control'
  }

  // Simple hash-based bucketing (deterministic)
  const hash = simpleHash(userId + experimentId)
  const bucket = hash % 100

  // Check if user is in experiment allocation
  if (bucket >= experiment.allocation) {
    return 'control'
  }

  // If treatment is array, distribute evenly
  if (Array.isArray(experiment.variants.treatment)) {
    const treatmentIndex = bucket % experiment.variants.treatment.length
    return experiment.variants.treatment[treatmentIndex]
  }

  return experiment.variants.treatment
}

function simpleHash(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash)
}
```

**Key Design Decisions:**
1. **Deterministic bucketing** - Same user always gets same variant
2. **Percentage allocation** - Control experiment traffic
3. **Multi-variant support** - Test more than 2 variants
4. **Active flag** - Easy enable/disable without code changes

---

### 4.3 Create Experiment Hook

**Create:** `lib/hooks/useExperiment.ts`

```typescript
// ABOUTME: React hook for accessing A/B test variants in components
// ABOUTME: Handles experiment allocation, tracking, and variant rendering

import { useMemo, useEffect } from 'react'
import { getActiveVariant } from '@/lib/ab-testing/experiments'
import { trackEvent } from '@/lib/analytics/events'

export function useExperiment(experimentId: string, userId: string) {
  const variant = useMemo(
    () => getActiveVariant(experimentId, userId),
    [experimentId, userId]
  )

  // Track experiment exposure
  useEffect(() => {
    trackEvent('experiment_exposure', {
      experimentId,
      variant,
      userId
    })
  }, [experimentId, variant, userId])

  return variant
}

// Utility hook for rendering variant-specific content
export function useVariantContent<T extends Record<string, any>>(
  experimentId: string,
  userId: string,
  contentMap: T
): T[keyof T] {
  const variant = useExperiment(experimentId, userId)
  return contentMap[variant] || contentMap.control
}
```

**Why hooks:**
- Automatic experiment exposure tracking
- Type-safe variant selection
- React-friendly API
- Reusable across components

---

### 4.4 Add Conversion Tracking

**Create:** `lib/analytics/events.ts`

```typescript
// ABOUTME: Analytics event tracking for form interactions and conversions
// ABOUTME: Integrates with PostHog/Statsig for A/B test analysis

export function trackEvent(
  eventName: string,
  properties: Record<string, any>
) {
  // PostHog example (if using PostHog)
  if (typeof window !== 'undefined' && window.posthog) {
    window.posthog.capture(eventName, properties)
  }

  // Also log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics]', eventName, properties)
  }

  // Send to custom analytics endpoint (optional)
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: eventName,
        properties,
        timestamp: new Date().toISOString()
      })
    }).catch(err => {
      console.error('Analytics tracking failed:', err)
    })
  }
}

// Form-specific events
export const FormEvents = {
  STEP_STARTED: 'form_step_started',
  STEP_COMPLETED: 'form_step_completed',
  FIELD_CHANGED: 'form_field_changed',
  INSTANT_CALC_VIEWED: 'instant_calc_viewed',
  INSTANT_CALC_CLICKED: 'instant_calc_button_clicked',
  FORM_ABANDONED: 'form_abandoned',
  FORM_COMPLETED: 'form_completed',
  BROKER_MATCHED: 'broker_matched'
}
```

**Why custom tracking:**
- Works with any analytics provider
- Console logging for development
- Graceful failure (no blocking)
- Type-safe event names

---

### 4.5 Apply Experiments to Form

**Update:** `components/forms/ProgressiveFormWithController.tsx`

```tsx
import { useExperiment, useVariantContent } from '@/lib/hooks/useExperiment'
import { trackEvent, FormEvents } from '@/lib/analytics/events'

export function ProgressiveFormWithController({ sessionId, ... }) {
  // Experiment: Step 2 CTA copy
  const step2CtaText = useVariantContent(
    'step2_cta_copy',
    sessionId,
    {
      control: 'Get instant loan estimate',
      'See your max loan amount': 'See your max loan amount →',
      'Calculate my borrowing power': 'Calculate my borrowing power',
      'Continue to financial details': 'Continue to financial details'
    }
  )

  // Experiment: Instant calc timing
  const calcTiming = useExperiment('instant_calc_timing', sessionId)
  const showCalcAutomatically = calcTiming === 'auto'

  // Experiment: Field order in Step 3
  const fieldOrder = useExperiment('field_order_step3', sessionId)
  const showIncomeFirst = fieldOrder === 'income_first'

  // Track CTA click
  const handleStep2Continue = () => {
    trackEvent(FormEvents.INSTANT_CALC_CLICKED, {
      ctaText: step2CtaText,
      sessionId,
      experimentVariant: step2CtaText
    })
    // ... rest of logic
  }

  return (
    <div>
      {/* Step 2 CTA uses experiment variant */}
      <Button type="submit" onClick={handleStep2Continue}>
        {step2CtaText}
      </Button>

      {/* Instant calc respects timing experiment */}
      {showCalcAutomatically ? (
        instantCalcResult && <CalcResult {...instantCalcResult} />
      ) : (
        <button onClick={() => {
          setShowCalc(true)
          trackEvent(FormEvents.INSTANT_CALC_VIEWED, { sessionId })
        }}>
          See your max loan amount →
        </button>
      )}

      {/* Step 3 field order experiment */}
      {currentStep === 3 && (
        showIncomeFirst ? (
          <>
            <IncomeField />
            <AgeField />
          </>
        ) : (
          <>
            <AgeField />
            <IncomeField />
          </>
        )
      )}
    </div>
  )
}
```

**Update:** `components/forms/ProgressiveFormMobile.tsx`

Apply same experiments to mobile form:

```tsx
import { useExperiment, useVariantContent } from '@/lib/hooks/useExperiment'

export function ProgressiveFormMobile({ sessionId, ... }) {
  const step2CtaText = useVariantContent(
    'step2_cta_copy',
    sessionId,
    {
      control: 'Get instant loan estimate',
      'See your max loan amount': 'See your max loan amount →',
      'Calculate my borrowing power': 'Calculate my borrowing power',
      'Continue to financial details': 'Continue to financial details'
    }
  )

  return (
    <button className="w-full h-12 bg-[#FCD34D]">
      {step2CtaText}
    </button>
  )
}
```

---

## Testing

### 4.6 Test Experiment Bucketing

**Create:** `lib/ab-testing/__tests__/experiments.test.ts`

```typescript
import { getActiveVariant } from '../experiments'

describe('A/B Test Bucketing', () => {
  it('should return consistent variant for same user', () => {
    const userId = 'user-123'
    const variant1 = getActiveVariant('step2_cta_copy', userId)
    const variant2 = getActiveVariant('step2_cta_copy', userId)

    expect(variant1).toBe(variant2)
  })

  it('should distribute users across variants', () => {
    const variants = new Set()

    for (let i = 0; i < 1000; i++) {
      const variant = getActiveVariant('step2_cta_copy', `user-${i}`)
      variants.add(variant)
    }

    // Should have multiple variants (control + 3 treatments)
    expect(variants.size).toBeGreaterThan(1)
  })

  it('should return control for inactive experiments', () => {
    const variant = getActiveVariant('trust_signal_position', 'user-123')
    expect(variant).toBe('control')
  })

  it('should respect allocation percentage', () => {
    // Mock experiment with 50% allocation
    const results = new Map()

    for (let i = 0; i < 1000; i++) {
      const variant = getActiveVariant('instant_calc_timing', `user-${i}`)
      results.set(variant, (results.get(variant) || 0) + 1)
    }

    // Should have roughly 50/50 split
    const controlCount = results.get('control') || 0
    const treatmentCount = results.get('on_demand') || 0

    expect(controlCount).toBeGreaterThan(400)
    expect(controlCount).toBeLessThan(600)
    expect(treatmentCount).toBeGreaterThan(400)
    expect(treatmentCount).toBeLessThan(600)
  })
})
```

### 4.7 Integration Test

**Create:** `components/forms/__tests__/ab-test-integration.test.tsx`

```typescript
import { render, screen } from '@testing-library/react'
import { ProgressiveFormWithController } from '../ProgressiveFormWithController'

// Mock experiment hook
jest.mock('@/lib/hooks/useExperiment', () => ({
  useVariantContent: jest.fn((experimentId, userId, contentMap) => {
    return contentMap['See your max loan amount']
  }),
  useExperiment: jest.fn(() => 'auto')
}))

describe('A/B Test Integration', () => {
  it('should render treatment variant CTA', () => {
    render(
      <ProgressiveFormWithController
        loanType="new_purchase"
        sessionId="test-123"
        onStepCompletion={jest.fn()}
        onAIInsight={jest.fn()}
        onScoreUpdate={jest.fn()}
      />
    )

    expect(screen.getByText('See your max loan amount →')).toBeInTheDocument()
  })
})
```

---

## Run Tests

```bash
# Run experiment tests
npm test -- lib/ab-testing/__tests__/experiments.test.ts

# Run integration tests
npm test -- components/forms/__tests__/ab-test-integration.test.tsx

# Run all tests
npm test
```

---

## Commit Point

```bash
git add lib/ab-testing/experiments.ts
git add lib/hooks/useExperiment.ts
git add lib/analytics/events.ts
git add lib/ab-testing/__tests__/experiments.test.ts
git add components/forms/__tests__/ab-test-integration.test.tsx
git add components/forms/ProgressiveFormWithController.tsx
git add components/forms/ProgressiveFormMobile.tsx

git commit -m "feat: add A/B testing framework for continuous optimization

- Create experiment configuration system
- Add useExperiment hook for variant allocation
- Implement conversion event tracking
- Add experiments for CTA copy and calc timing
- Include comprehensive test coverage

Enables data-driven optimization with zero manual intervention"
```

---

## Success Criteria

- [ ] All tests pass (`npm test`)
- [ ] Experiments allocate users consistently
- [ ] Event tracking fires correctly (check console in dev)
- [ ] Variant content renders properly
- [ ] Multiple experiments can run simultaneously
- [ ] Easy to add new experiments via config

---

## Active Experiments to Launch

1. **Step 2 CTA Copy** (4 variants)
   - Control: "Get instant loan estimate"
   - Treatment A: "See your max loan amount"
   - Treatment B: "Calculate my borrowing power"
   - Treatment C: "Continue to financial details"
   - **Measure:** Click-through rate to Step 3

2. **Instant Calc Timing** (2 variants)
   - Control: Auto-show calculation
   - Treatment: On-demand (button click)
   - **Measure:** Time to Step 3, abandonment rate

3. **Field Order Step 3** (2 variants)
   - Control: Income first, then age
   - Treatment: Age first, then income
   - **Measure:** Completion rate, time to complete

---

## Next Steps

After committing this task:
1. Verify experiments work in browser (`npm run dev`)
2. Check console for event tracking logs
3. Test different sessionIds get different variants
4. Proceed to [Task 5: Feature Flags](task-5-feature-flags.md)

---

[← Back to Index](../00-INDEX.md) | [Previous: Task 3](task-3-smart-defaults.md) | [Next: Task 5 →](task-5-feature-flags.md)
