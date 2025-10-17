# Success Metrics - Path2 Lead Form Optimization

**Source:** Path2 Plan Lines 2141-2169
**Purpose:** Define measurable outcomes for Path2 features

---

## Primary Metrics

### 1. Mobile Conversion Rate
**What:** Percentage of mobile users who complete the form

**Baseline:** Current mobile conversion (measure before Path2)

**Target:** +40% increase from baseline

**Formula:**
```
Mobile Conversion = (Mobile Completions / Mobile Form Starts) × 100
```

**Tracking:**
```typescript
trackEvent('form_completed', {
  device: 'mobile',
  formVersion: 'path2',
  timestamp: Date.now()
})
```

**Success Threshold:**
- ✅ Green: ≥+40% improvement
- ⚠️  Yellow: +20-39% improvement
- ❌ Red: <+20% improvement → Investigate/rollback

---

### 2. Fields Shown Per User
**What:** Average number of visible fields per session (conditional hiding)

**Baseline:** ~15 fields average (current desktop form)

**Target:** 8-10 fields average (conditional logic applied)

**Formula:**
```
Avg Fields = Total Visible Fields / Total Sessions
```

**Tracking:**
```typescript
// Log visible fields per session
trackEvent('session_summary', {
  visibleFields: visibleFieldsList.length,
  hiddenFields: hiddenFieldsList.length,
  loanType: 'new_purchase',
  propertyCategory: 'HDB'
})
```

**Success Threshold:**
- ✅ Green: 8-10 fields average
- ⚠️  Yellow: 10-12 fields average
- ❌ Red: >12 fields average → Review conditional logic

---

### 3. Session Restoration Rate
**What:** Percentage of incomplete sessions that are restored and completed

**Baseline:** N/A (new metric for Path2)

**Target:** >30% of incomplete sessions restored and completed

**Formula:**
```
Restoration Rate = (Restored & Completed / Total Incomplete) × 100
```

**Tracking:**
```typescript
// On session restore
trackEvent('session_restored', {
  sessionId: 'abc123',
  daysElapsed: 2,
  completionStep: 'step2',
  restored: true
})

// On completion after restore
trackEvent('form_completed', {
  sessionId: 'abc123',
  wasRestored: true
})
```

**Success Threshold:**
- ✅ Green: ≥30% restoration rate
- ⚠️  Yellow: 15-29% restoration rate
- ❌ Red: <15% restoration rate → Check localStorage UX

---

### 4. Smart Default Acceptance
**What:** Percentage of pre-filled values that users keep unchanged

**Baseline:** N/A (new metric for Path2)

**Target:** >70% acceptance rate

**Formula:**
```
Acceptance Rate = (Unchanged Defaults / Total Defaults Shown) × 100
```

**Tracking:**
```typescript
// Log smart defaults shown
trackEvent('smart_default_shown', {
  field: 'priceRange',
  defaultValue: 500000,
  propertyType: 'HDB'
})

// Log user changes
trackEvent('smart_default_changed', {
  field: 'priceRange',
  defaultValue: 500000,
  userValue: 450000
})
```

**Success Threshold:**
- ✅ Green: ≥70% acceptance
- ⚠️  Yellow: 50-69% acceptance
- ❌ Red: <50% acceptance → Adjust default logic

---

### 5. A/B Test Winners
**What:** Track winning variants and apply learnings

**Target:** Identify at least 2 winning variants by Week 2

**Tracking:**
```typescript
// Log experiment exposure
trackEvent('experiment_exposure', {
  experimentId: 'step2_cta_copy',
  variant: 'See your max loan amount',
  userId: 'user123'
})

// Log conversion
trackEvent('form_step_completed', {
  experimentId: 'step2_cta_copy',
  variant: 'See your max loan amount'
})
```

**Analysis:**
```
Conversion Rate per Variant =
  (Completions for Variant / Exposures for Variant) × 100
```

**Success Threshold:**
- ✅ Green: Winner has >10% lift over control
- ⚠️  Yellow: Winner has 5-10% lift
- ❌ Red: No clear winner → Extend test duration

---

## Secondary Metrics

### Time to Complete
**Target:** <3 minutes (mobile)

**Tracking:**
```typescript
trackEvent('form_completed', {
  duration: Date.now() - formStartTime,
  device: 'mobile'
})
```

### Error Rate
**Target:** <5% of sessions encounter validation errors

**Tracking:**
```typescript
trackEvent('validation_error', {
  field: 'email',
  errorType: 'invalid_format'
})
```

### Touch Target Violations
**Target:** 0 violations (all targets ≥48px)

**Testing:** Automated Playwright tests check bounding boxes

---

## Monitoring Dashboard

### Real-Time Alerts
Set up alerts for:
- Mobile conversion drops >10% → Investigate immediately
- Error rate spikes >10% → Rollback feature
- Session restoration fails >5% → Check localStorage quota

### Weekly Review
Every Monday, review:
1. Mobile conversion trend (week-over-week)
2. Top 3 fields causing drop-offs
3. A/B test results (statistical significance)
4. Smart default rejection patterns

---

## Rollout Decision Framework

**10% Rollout → 25%:**
- Mobile conversion stable or improving ✅
- No critical errors in last 48 hours ✅
- Session restoration working ✅

**25% → 50%:**
- Mobile conversion +20% over baseline ✅
- Smart defaults >60% acceptance ✅
- No user complaints ✅

**50% → 100%:**
- Mobile conversion +35% over baseline ✅
- All metrics green for 7 days ✅
- A/B test winner identified ✅

---

## Success Report Template

After 4 weeks of 100% rollout:

```markdown
## Path2 Results Summary

**Mobile Conversion:**
- Baseline: X%
- Current: Y%
- Improvement: +Z%

**Conditional Fields:**
- Avg fields shown: X (target: 8-10)
- Reduction: Y%

**Session Restoration:**
- Incomplete sessions: X
- Restored & completed: Y
- Rate: Z% (target: >30%)

**Smart Defaults:**
- Shown: X times
- Accepted: Y times
- Rate: Z% (target: >70%)

**A/B Test Winners:**
1. Experiment 1: Variant X won (+Y% lift)
2. Experiment 2: Variant X won (+Y% lift)

**Next Steps:**
- Apply winning variants to 100%
- Deprecate losing variants
- Plan Path3 enhancements
```

**References:**
- Analytics implementation: `lib/analytics/events.ts`
- Experiment tracking: `lib/ab-testing/experiments.ts`
- Dashboard: [Insert PostHog/Statsig URL]
