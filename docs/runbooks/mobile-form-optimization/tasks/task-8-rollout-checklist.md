# Task 8: Production Rollout Checklist

**Status:** ⏸️ PENDING
**Estimated Time:** 3 weeks (gradual rollout)
**Prerequisites:** Tasks 1-7 completed ✅

[← Back to Index](../00-INDEX.md) | [Previous: Task 7](task-7-documentation.md)

---

## Overview

**Objective:** Safely deploy Path 2 to production with gradual rollout and monitoring

**Why This Matters:**
- Big-bang releases are high risk
- Progressive rollout limits blast radius
- Real-world validation before full launch
- Easy rollback if issues arise

**Timeline:** 3 weeks
- **Week 1:** Internal testing + allowlist
- **Week 2:** 10% → 50% gradual increase
- **Week 3:** 75% → 100% full launch

---

## Pre-Rollout Checklist

### Code Quality

- [ ] All unit tests pass (`npm test`)
- [ ] All E2E tests pass (`npx playwright test`)
- [ ] No TypeScript errors (`npm run build`)
- [ ] No lint errors (`npm run lint`)
- [ ] Bundle size < 140KB gzipped
- [ ] Lighthouse score > 90

### Documentation

- [ ] Forms Architecture Guide updated
- [ ] README.md updated
- [ ] CHANGELOG.md created
- [ ] Troubleshooting guide complete
- [ ] Migration guide complete

### Monitoring Setup

- [ ] Analytics tracking configured
- [ ] Error monitoring active (Sentry/similar)
- [ ] Performance monitoring active
- [ ] Conversion funnel tracking
- [ ] A/B test event tracking

### Rollback Plan

- [ ] Feature flags configured
- [ ] Rollback procedure documented
- [ ] Team knows how to rollback
- [ ] Rollback tested in staging

---

## Week 1: Internal Testing

**Dates:** Days 1-7

**Goal:** Validate with team before public release

### Day 1-2: Team Testing Setup

**Feature Flag Configuration:**
```typescript
// lib/feature-flags.ts
mobile_first_form: {
  key: 'mobile_first_form',
  enabled: true,
  rolloutPercentage: 0,
  allowlist: [
    'brent@nextnest.sg',
    'team@nextnest.sg',
    // Add all team member emails
  ]
}
```

**Tasks:**
- [ ] Deploy to staging environment
- [ ] Enable feature flag for team
- [ ] Send testing instructions to team
- [ ] Create bug tracking sheet

### Day 3-5: Testing & Iteration

**Test Scenarios:**
- [ ] Desktop: Chrome, Safari, Firefox
- [ ] Mobile: iPhone 13, Samsung Galaxy S21
- [ ] Tablet: iPad Pro
- [ ] Network: 4G, 3G, offline
- [ ] Edge cases: Very low income, joint applicants, refinance

**Bug Tracking:**
| Severity | Description | Assigned | Status |
|----------|-------------|----------|--------|
| Critical | [Example: Form not submitting] | Developer | Open |
| High | [Example: Default price wrong] | Developer | Fixed |
| Medium | [Example: Button text unclear] | Designer | Open |
| Low | [Example: Spacing issue] | Developer | Backlog |

**Acceptance Criteria:**
- [ ] Zero critical bugs
- [ ] < 3 high priority bugs
- [ ] All team members tested successfully
- [ ] Positive feedback from team

### Day 6-7: Final Prep

**Tasks:**
- [ ] Fix all critical and high priority bugs
- [ ] Re-test after fixes
- [ ] Update documentation with findings
- [ ] Prepare monitoring dashboard
- [ ] Schedule daily standups for Week 2

**Commit Point:**
```bash
git add lib/feature-flags.ts
git commit -m "chore: enable Path 2 for team testing

Allowlist:
- brent@nextnest.sg
- team@nextnest.sg
[List all team emails]

Ready for internal validation"
```

---

## Week 2: Beta Rollout

**Dates:** Days 8-14

**Goal:** Gradual increase to 50% with monitoring

### Day 8-9: 10% Rollout

**Feature Flag Update:**
```typescript
mobile_first_form: {
  enabled: true,
  rolloutPercentage: 10, // ← 10% of users
  allowlist: [] // Remove allowlist
}
```

**Deploy:**
```bash
git add lib/feature-flags.ts
git commit -m "chore: rollout Path 2 to 10% of users

Monitoring:
- Error rate baseline: <0.05%
- Target conversion: 14-15%
- Expected users: ~500/day

Will monitor for 48 hours before increasing"

git push origin fix/progressive-form-calculation-corrections
```

**Monitor (Every 6 hours):**
| Metric | Baseline | Target | Actual | Status |
|--------|----------|--------|--------|--------|
| Error Rate | <0.05% | <0.1% | ___ | ✅/❌ |
| Conversion | 12% | 14-15% | ___ | ✅/❌ |
| Page Load | 2.1s | <2.5s | ___ | ✅/❌ |
| Completion Time | 4.2min | 3-3.5min | ___ | ✅/❌ |

**Decision Point (48 hours):**
- ✅ All metrics green → Proceed to 25%
- ⚠️ Any metric yellow → Investigate, fix, re-test
- ❌ Any metric red → **ROLLBACK IMMEDIATELY**

### Day 10-11: 25% Rollout

**Feature Flag Update:**
```typescript
rolloutPercentage: 25 // ← 25% of users
```

**Monitor (Every 12 hours):**
- Same metrics as 10% rollout
- Increased sample size = more confidence

**Decision Point (48 hours):**
- ✅ Metrics stable → Proceed to 50%
- ⚠️ Metrics unstable → Hold at 25%, investigate
- ❌ Metrics degraded → Rollback to 10%

### Day 12-14: 50% Rollout

**Feature Flag Update:**
```typescript
rolloutPercentage: 50 // ← 50% of users
```

**Monitor (Daily):**
- Same metrics
- Gather user feedback (support tickets, chat)
- A/B test results starting to show significance

**End of Week 2 Review:**
- [ ] Error rate < 0.1%
- [ ] Conversion rate improved
- [ ] No critical bugs
- [ ] Positive user feedback
- [ ] A/B test insights documented

**Decision:**
- ✅ All good → Proceed to Week 3 (75% → 100%)
- ⚠️ Minor issues → Fix and hold at 50% for extra week
- ❌ Major issues → Rollback to 25% or 10%

---

## Week 3: Full Launch

**Dates:** Days 15-21

**Goal:** Reach 100% rollout

### Day 15-16: 75% Rollout

**Feature Flag Update:**
```typescript
rolloutPercentage: 75 // ← 75% of users
```

**Monitor (Daily):**
- Error rate
- Conversion rate
- Support ticket volume
- A/B test results

**Decision Point (48 hours):**
- ✅ Stable → Proceed to 100%
- ⚠️ Issues → Hold at 75%
- ❌ Problems → Rollback to 50%

### Day 17-21: 100% Rollout

**Feature Flag Update:**
```typescript
rolloutPercentage: 100 // ← All users
```

**Deploy:**
```bash
git add lib/feature-flags.ts
git commit -m "chore: Path 2 full rollout (100% of users)

Week 2 results:
- Error rate: 0.03% (well below 0.1% target)
- Conversion: 15.8% (baseline was 12%)
- User feedback: Positive
- A/B test winners identified

Proceeding to full launch"

git push origin fix/progressive-form-calculation-corrections
```

**Monitor (First 7 days):**
- Daily metric review
- Support ticket tracking
- User feedback collection
- A/B test analysis

### Day 21: Post-Launch Review

**Metrics Summary:**
| Metric | Baseline | Target | Actual | Status |
|--------|----------|--------|--------|--------|
| Conversion Rate | 12% | 16-17% | ___ | ✅/❌ |
| Fields Shown | 15 | 8-10 | ___ | ✅/❌ |
| Session Restore | 0% | 25-35% | ___ | ✅/❌ |
| Smart Default Acceptance | N/A | 70%+ | ___ | ✅/❌ |
| Error Rate | <0.05% | <0.1% | ___ | ✅/❌ |

**A/B Test Winners:**
1. **Step 2 CTA:** "___________" (X% improvement)
2. **Calc Timing:** _______ (X% improvement)
3. **Field Order:** _______ (X% improvement)

**Learnings:**
- What worked well:
- What could be improved:
- Unexpected findings:
- Next optimizations:

---

## Rollback Procedures

### Instant Rollback (Critical Issue)

**When to use:** Error rate spikes, site crashes, data loss

```typescript
// lib/feature-flags.ts
mobile_first_form: {
  enabled: false, // ← DISABLE IMMEDIATELY
  rolloutPercentage: 0
}
```

**Steps:**
1. Set `enabled: false`
2. Deploy to production
3. Monitor for stabilization
4. Investigate root cause
5. Fix and re-test in staging
6. Re-enable gradually (start at 10%)

### Gradual Rollback (Performance Issue)

**When to use:** Conversion drop, slow performance, user complaints

**Reduce percentage:**
```typescript
rolloutPercentage: 10 // ← Reduce from current
```

**Steps:**
1. Reduce by 50% (e.g., 50% → 25%)
2. Monitor for 24 hours
3. If issue persists, reduce further
4. Investigate and fix
5. Re-test in staging
6. Gradually increase again

### Selective Rollback (Specific Feature)

**When to use:** One feature problematic, others fine

**Disable specific flag:**
```typescript
conditional_fields: {
  enabled: false // ← Disable just this feature
}
```

---

## Success Metrics (Final)

### Primary Metrics
- **Conversion Rate:** 12% → 16-17% (+35-45%) ✅/❌
- **Fields Shown:** 15 → 8-10 (-40%) ✅/❌
- **Session Restore:** 25-35% of abandoned sessions ✅/❌

### Secondary Metrics
- **Smart Default Acceptance:** 70%+ ✅/❌
- **Error Rate:** <0.1% ✅/❌
- **Page Load Time:** <2.5s ✅/❌
- **Mobile Conversion:** +40% vs baseline ✅/❌

### User Feedback
- Support ticket volume: ___ (should decrease)
- Positive feedback: ___ %
- Negative feedback: ___ %
- Feature requests: ___

---

## Post-Launch Tasks

### Week 4: Stabilization

- [ ] Monitor metrics daily
- [ ] Respond to user feedback
- [ ] Fix minor bugs
- [ ] Apply A/B test winners to 100%
- [ ] Update documentation with findings

### Week 5: Optimization

- [ ] Analyze A/B test results
- [ ] Identify next optimizations
- [ ] Plan Path 3 improvements
- [ ] Document learnings
- [ ] Team retrospective

### Deprecation (Week 6+)

- [ ] Remove Path 1 code (old form)
- [ ] Remove feature flags (when stable)
- [ ] Clean up dead code
- [ ] Archive old tests
- [ ] Update architecture docs

---

## Emergency Contacts

**On-Call Rotation:**
- **Week 1:** ___________ (Team Lead)
- **Week 2:** ___________ (Senior Dev)
- **Week 3:** ___________ (Team Lead)

**Escalation Path:**
1. Developer on-call (< 1 hour response)
2. Team Lead (< 2 hours)
3. CTO (< 4 hours)

**Communication Channels:**
- Slack: #path2-rollout
- Email: engineering@nextnest.sg
- Phone: [Emergency number]

---

## Final Commit

After successful 100% rollout:

```bash
git add lib/feature-flags.ts
git add docs/plans/active/path2-lead-form-optimization/

git commit -m "feat: complete Path 2 rollout to 100% of users

Results:
- Conversion: 12% → 15.8% (+31.7%)
- Error rate: 0.03% (well below target)
- User feedback: Positive
- A/B test winners identified and applied

All targets met. Path 2 is now the default form experience.

Next steps:
- Monitor for 1 week
- Apply A/B test winners
- Plan Path 3 improvements"

git push origin fix/progressive-form-calculation-corrections
```

---

## Celebration! 🎉

**Path 2 is live!**

- 35-45% conversion increase ✅
- Mobile-first experience ✅
- Smart defaults ✅
- Session persistence ✅
- A/B testing framework ✅

**What we learned:**
[Team retrospective notes]

**What's next:**
- Path 3A: Voice input
- Path 3B: Instant approval indicator
- Path 3C: Multi-property comparison
- Path 3D: WhatsApp integration

---

[← Back to Index](../00-INDEX.md) | [Previous: Task 7](task-7-documentation.md)
