# Task 5: Feature Flags & Progressive Rollout

**Status:** ⏸️ PENDING
**Estimated Time:** 3-4 hours
**Prerequisites:** Task 4 completed

[← Back to Index](../00-INDEX.md) | [Previous: Task 4](task-4-ab-testing.md) | [Next: Task 6 →](task-6-integration-tests.md)

---

## Overview

**Objective:** Safely deploy Path 2 changes using feature flags with progressive rollout

**Why This Matters:**
- Big-bang releases are risky
- Progressive rollout limits blast radius
- Instant rollback capability if issues arise
- Test with real users before full launch

**Expected Impact:**
- Zero-downtime deployment
- Reduced production incidents
- Confidence in release quality
- Easy rollback if needed

**Files to Create:**
- `lib/feature-flags.ts` - Feature flag configuration
- `lib/feature-flags/__tests__/feature-flags.test.ts` - Unit tests

**Files to Update:**
- `app/apply/page.tsx` - Conditional component rendering

---

## Implementation Steps

### 5.1 Add Feature Flag System

**Create:** `lib/feature-flags.ts`

```typescript
// ABOUTME: Feature flag system for progressive rollout of Path 2 changes
// ABOUTME: Allows safe deployment with instant rollback capability

export interface FeatureFlag {
  key: string
  enabled: boolean
  rolloutPercentage: number
  allowlist?: string[] // User IDs or emails
}

const FEATURE_FLAGS: Record<string, FeatureFlag> = {
  mobile_first_form: {
    key: 'mobile_first_form',
    enabled: false,
    rolloutPercentage: 0,
    allowlist: [] // Add test user emails
  },
  conditional_fields: {
    key: 'conditional_fields',
    enabled: true,
    rolloutPercentage: 50
  },
  smart_defaults: {
    key: 'smart_defaults',
    enabled: true,
    rolloutPercentage: 100
  },
  ab_testing: {
    key: 'ab_testing',
    enabled: true,
    rolloutPercentage: 100
  }
}

export function isFeatureEnabled(
  flagKey: string,
  userId?: string,
  userEmail?: string
): boolean {
  const flag = FEATURE_FLAGS[flagKey]
  if (!flag) return false

  // Check if explicitly disabled
  if (!flag.enabled) return false

  // Check allowlist
  if (flag.allowlist && (userId || userEmail)) {
    if (
      flag.allowlist.includes(userId || '') ||
      flag.allowlist.includes(userEmail || '')
    ) {
      return true
    }
  }

  // Check rollout percentage
  if (userId) {
    const hash = simpleHash(userId + flagKey)
    const bucket = hash % 100
    return bucket < flag.rolloutPercentage
  }

  return flag.rolloutPercentage === 100
}

function simpleHash(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash = hash & hash
  }
  return Math.abs(hash)
}

// Helper to get all active flags for debugging
export function getActiveFlags(userId?: string, userEmail?: string): string[] {
  return Object.keys(FEATURE_FLAGS).filter(key =>
    isFeatureEnabled(key, userId, userEmail)
  )
}
```

**Key Design Decisions:**
1. **Percentage-based rollout** - Gradually increase traffic
2. **Allowlist for testing** - Test with specific users first
3. **Global enable/disable** - Instant rollback
4. **Deterministic bucketing** - Same user always sees same experience

---

### 5.2 Conditional Component Rendering

**Update:** `app/apply/page.tsx`

```tsx
import { isFeatureEnabled } from '@/lib/feature-flags'
import { ProgressiveFormWithController } from '@/components/forms/ProgressiveFormWithController'
import { ProgressiveFormMobile } from '@/components/forms/ProgressiveFormMobile'

export default function ApplyPage() {
  const [sessionId] = useState(generateSessionId())
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    setIsMobile(window.innerWidth < 768)
  }, [])

  const useMobileForm =
    isMobile &&
    isFeatureEnabled('mobile_first_form', sessionId)

  const useConditionalFields = isFeatureEnabled('conditional_fields', sessionId)
  const useSmartDefaults = isFeatureEnabled('smart_defaults', sessionId)
  const useABTesting = isFeatureEnabled('ab_testing', sessionId)

  return (
    <main>
      {/* Debug panel (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-0 left-0 bg-black text-white p-2 text-xs">
          <div>Mobile Form: {useMobileForm ? '✅' : '❌'}</div>
          <div>Conditional Fields: {useConditionalFields ? '✅' : '❌'}</div>
          <div>Smart Defaults: {useSmartDefaults ? '✅' : '❌'}</div>
          <div>A/B Testing: {useABTesting ? '✅' : '❌'}</div>
        </div>
      )}

      {useMobileForm ? (
        <ProgressiveFormMobile
          loanType={loanType}
          sessionId={sessionId}
          onComplete={handleComplete}
        />
      ) : (
        <ProgressiveFormWithController
          loanType={loanType}
          sessionId={sessionId}
          onStepCompletion={handleStepCompletion}
          onAIInsight={handleAIInsight}
          onScoreUpdate={handleScoreUpdate}
          enableConditionalFields={useConditionalFields}
          enableSmartDefaults={useSmartDefaults}
          enableABTesting={useABTesting}
        />
      )}
    </main>
  )
}
```

**Why debug panel:**
- Quickly see which features are enabled
- Development-only (removed in production)
- Helps with testing and troubleshooting

---

### 5.3 Rollout Strategy

**3-Week Progressive Rollout Plan:**

#### Week 1: Internal Testing (Days 1-7)
```typescript
// lib/feature-flags.ts
mobile_first_form: {
  key: 'mobile_first_form',
  enabled: true,
  rolloutPercentage: 0,
  allowlist: [
    'brent@nextnest.sg',
    'team@nextnest.sg',
    // Add team member emails
  ]
}
```

**Tasks:**
- [ ] Enable for team emails (allowlist)
- [ ] Test on real devices (iPhone, Android, iPad)
- [ ] Fix any critical bugs
- [ ] Run full test suite
- [ ] Gather team feedback

#### Week 2: Beta Rollout (Days 8-14)
```typescript
// Day 8-9: 10% rollout
mobile_first_form: {
  enabled: true,
  rolloutPercentage: 10,
  allowlist: [] // Remove allowlist
}

// Day 10-11: 25% rollout
rolloutPercentage: 25

// Day 12-14: 50% rollout
rolloutPercentage: 50
```

**Monitor:**
- Error rates (should be <0.1%)
- Conversion metrics (should improve)
- User feedback (support tickets)
- Performance (page load times)

#### Week 3: Full Launch (Days 15-21)
```typescript
// Day 15-16: 75% rollout
rolloutPercentage: 75

// Day 17+: 100% rollout
rolloutPercentage: 100
```

**Final Steps:**
- [ ] All users on Path 2
- [ ] Remove Path 1 code (deprecate)
- [ ] Document learnings
- [ ] Plan Path 3 improvements

---

## Testing

### 5.4 Test Feature Flags

**Create:** `lib/feature-flags/__tests__/feature-flags.test.ts`

```typescript
import { isFeatureEnabled, getActiveFlags } from '../feature-flags'

describe('Feature Flags', () => {
  describe('isFeatureEnabled', () => {
    it('should return false for disabled flags', () => {
      expect(isFeatureEnabled('mobile_first_form', 'user-123')).toBe(false)
    })

    it('should return true for 100% rollout', () => {
      expect(isFeatureEnabled('smart_defaults', 'user-123')).toBe(true)
    })

    it('should enable for allowlist users', () => {
      // Mock flag with allowlist
      const originalFlags = require('../feature-flags').FEATURE_FLAGS
      originalFlags.mobile_first_form.allowlist = ['test@example.com']
      originalFlags.mobile_first_form.enabled = true

      expect(
        isFeatureEnabled('mobile_first_form', undefined, 'test@example.com')
      ).toBe(true)
    })

    it('should respect rollout percentage', () => {
      const results = new Map()

      // Test 1000 users
      for (let i = 0; i < 1000; i++) {
        const enabled = isFeatureEnabled('conditional_fields', `user-${i}`)
        results.set(enabled, (results.get(enabled) || 0) + 1)
      }

      // Should be roughly 50/50 split (50% rollout)
      const enabledCount = results.get(true) || 0
      const disabledCount = results.get(false) || 0

      expect(enabledCount).toBeGreaterThan(400)
      expect(enabledCount).toBeLessThan(600)
      expect(disabledCount).toBeGreaterThan(400)
      expect(disabledCount).toBeLessThan(600)
    })

    it('should return consistent results for same user', () => {
      const userId = 'user-123'
      const result1 = isFeatureEnabled('conditional_fields', userId)
      const result2 = isFeatureEnabled('conditional_fields', userId)

      expect(result1).toBe(result2)
    })
  })

  describe('getActiveFlags', () => {
    it('should return all enabled flags', () => {
      const activeFlags = getActiveFlags('user-123')

      expect(activeFlags).toContain('smart_defaults')
      expect(activeFlags).toContain('ab_testing')
    })
  })
})
```

---

## Run Tests

```bash
# Run feature flag tests
npm test -- lib/feature-flags/__tests__/feature-flags.test.ts

# Run all tests
npm test
```

---

## Commit Point

```bash
git add lib/feature-flags.ts
git add lib/feature-flags/__tests__/feature-flags.test.ts
git add app/apply/page.tsx

git commit -m "feat: add progressive rollout system for Path 2

- Create feature flag system with percentage rollout
- Add allowlist for team testing
- Implement conditional component rendering
- Add debug panel for development
- Define 3-week rollout plan with monitoring checkpoints

Enables safe deployment with instant rollback capability"
```

---

## Success Criteria

- [ ] All tests pass (`npm test`)
- [ ] Feature flags control component rendering
- [ ] Allowlist enables features for specific users
- [ ] Rollout percentage distributes users correctly
- [ ] Debug panel shows active features (dev mode)
- [ ] Easy to change rollout percentage

---

## Rollback Procedure

If issues arise during rollout:

1. **Instant Rollback:**
```typescript
// lib/feature-flags.ts
mobile_first_form: {
  enabled: false, // ← Set to false
  rolloutPercentage: 0
}
```

2. **Partial Rollback (reduce percentage):**
```typescript
rolloutPercentage: 10 // ← Reduce from 50% to 10%
```

3. **Allowlist Only:**
```typescript
enabled: true,
rolloutPercentage: 0,
allowlist: ['team@nextnest.sg'] // Team only
```

---

## Monitoring Dashboard

Track these metrics during rollout:

| Metric | Baseline | Target | Alert Threshold |
|--------|----------|--------|-----------------|
| Error Rate | <0.05% | <0.1% | >0.5% |
| Conversion Rate | 12% | 16-17% | <11% |
| Page Load Time | 2.1s | <2.5s | >3s |
| Form Completion Time | 4.2min | 3-3.5min | >5min |
| Abandonment Rate | 68% | 50-55% | >70% |

**Alert Response:**
- If ANY metric crosses alert threshold → Immediate rollback
- If metrics stable for 48 hours → Increase rollout percentage
- If target reached → Full rollout

---

## Next Steps

After committing this task:
1. Test feature flags in browser (`npm run dev`)
2. Verify debug panel shows correct feature states
3. Test allowlist by adding your email
4. Proceed to [Task 6: Integration Tests](task-6-integration-tests.md)

---

[← Back to Index](../00-INDEX.md) | [Previous: Task 4](task-4-ab-testing.md) | [Next: Task 6 →](task-6-integration-tests.md)
