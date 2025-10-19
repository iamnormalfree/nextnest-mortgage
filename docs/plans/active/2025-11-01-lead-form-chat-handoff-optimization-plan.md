# Lead Form to AI Broker Chat Handoff Optimization Plan

---
status: active
priority: P0
complexity: medium
estimated_hours: 16-24
---

## Problem

Two critical issues prevent users from reaching AI broker chat:

1. **BLOCKER**: Chat transition screen never triggers (currentStep index mismatch in ProgressiveFormWithController.tsx line 105)
2. **UX FRICTION**: Information overload and form fatigue cause drop-off before Step 4 completion

## Success Criteria

- ChatTransitionScreen appears after Step 4 completion
- Instant analysis shows ONE primary metric with plain English summary
- Age pre-fills from Step 2 to Step 4
- MAS Readiness updates live as user types
- No loans path is one click
- All tests passing, no performance degradation

## Tasks

### Task 1: Fix Chat Transition Trigger (P0, 30min)
- **File**: components/forms/ProgressiveFormWithController.tsx:105-111
- **Change**: currentStep === 2 to currentStep === 3
- **Test**: Manual + Task 2

### Task 2: Add Chat Transition Test (P0, 45min)
- **Create**: components/forms/__tests__/ChatTransition.test.tsx
- **Cases**: Positive (triggers after Step 4), Negative (does not trigger early)

### Task 3: Simplify Instant Analysis (P1, 2hr)
- **File**: components/forms/sections/Step3NewPurchase.tsx:244-394
- **Changes**: Big number prominent, translate persona codes to English, hide jargon, add expandable details
- **Pattern**: See runbook

### Task 4: Test Instant Analysis (P1, 1hr)
- **Create**: components/forms/__tests__/InstantAnalysis.test.tsx
- **Cases**: Big number visible, codes hidden, summary present, toggle works

### Task 5: Pre-fill Age (P1, 45min)
- **File**: hooks/useProgressiveFormController.ts:540-560 (next() callback)
- **Logic**: Single = combinedAge, Joint = combinedAge / 2
- **Pattern**: See runbook

### Task 6: Test Age Pre-fill (P1, 45min)
- **Create**: components/forms/__tests__/AgePrefill.test.tsx
- **Cases**: Single uses full, joint divides, editable, graceful degradation

### Task 7: Live MAS Updates (P1, 2hr)
- **File**: components/forms/sections/Step3NewPurchase.tsx
- **Implementation**: useWatch + useMemo + debounce (500ms)
- **Pattern**: See runbook

### Task 8: Test Live MAS Updates (P1, 1hr)
- **Create**: components/forms/__tests__/LiveMASUpdates.test.tsx
- **Cases**: TDSR updates on income change, handles incomplete data, liability changes, debounce works

### Task 9: Simplify Commitments (P1, 2hr)
- **File**: components/forms/sections/Step3NewPurchase.tsx:550-630
- **Changes**: Yes/No gate instead of 4 checkboxes, No = clear all (1 click), Yes = expandable sections
- **Pattern**: See runbook

### Task 10: Test Commitments (P1, 1hr)
- **Create**: components/forms/__tests__/CommitmentInputs.test.tsx
- **Cases**: No hides fields, Yes shows fields, toggle clears data, submission works

## Testing Strategy

**Manual**: See runbook checklist
**Automated**: Tasks 2, 4, 6, 8, 10
**Performance**: npm run build && npm run analyze (target: less than 140KB gzipped)

Full testing documentation: docs/runbooks/forms/LEAD_FORM_HANDOFF_GUIDE.md

## Rollback Plan

- Chat broken: Revert Task 1
- Calculation errors: Disable Task 7 live updates
- User confusion: Revert Task 9 commitments

## Implementation Guide

**All implementation patterns, code examples, FAQ, and troubleshooting:**

See docs/runbooks/forms/LEAD_FORM_HANDOFF_GUIDE.md

Runbook contains:
- Context for new engineers
- Technology stack and file structure
- Implementation patterns (Dr Elena translation, age pre-fill, live calculations, gate questions)
- Testing strategies and examples
- FAQ (Dr Elena v2, Singapore regulations, post-completion flow)
- Troubleshooting (ChatTransitionScreen, MAS Readiness, age pre-fill, test failures)

## Success Metrics

Pre/post deployment tracking:

- **Completion Rate**: +15% (60% to 75%)
- **Time to Chat**: -30% (5min to 3.5min)
- **Step 4 Drop-off**: -40% (20% to 12%)
- **Contact Creation**: 100%

---

**Total**: 10 tasks, 2-3 days, sequential dependencies
**Date**: 2025-11-01
