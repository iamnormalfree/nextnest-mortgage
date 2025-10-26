# IWAA & 55% LTV Tenure Fix

**Date:** 2025-10-26
**Status:** Active
**Priority:** HIGH - Mortgage Compliance Issue
**Complexity:** MEDIUM
**Implementation Guide:** [docs/runbooks/mortgage/IWAA_TENURE_IMPLEMENTATION_GUIDE.md](../../runbooks/mortgage/IWAA_TENURE_IMPLEMENTATION_GUIDE.md)

---

## Problem

Two critical mortgage calculation bugs affecting joint applicant scenarios:

### Bug #1: IWAA Not Calculated
- **Current:** Uses only primary applicant age for tenure calculation
- **Impact:** Younger co-applicants can't extend tenure → lower max loan amounts
- **Example:** Primary 50yo + Co-applicant 30yo → system uses 50, should use weighted average (IWAA ≈ 47)

### Bug #2: Missing 55% LTV Extended Tenure
- **Current:** All LTV tiers use same tenure caps
- **Impact:** Safer borrowers (55% LTV) penalized with shorter tenure when they should get longer
- **Example:** HDB 55% LTV should cap at 30 years (not 25)

---

## Solution

### What We're Building

1. **IWAA Calculation**
   - Formula: `(Age1 × Income1 + Age2 × Income2) / (Income1 + Income2)`
   - Rounding: `Math.ceil()` (round UP per Dr Elena v2 line 167)
   - Use when: `ages[]` and `incomes[]` arrays provided
   - Fallback: Single `age` parameter (backwards compatibility)

2. **55% LTV Extended Tenure Rules**

   | Property | 75% LTV Cap | 55% LTV Cap (Extended) |
   |----------|-------------|------------------------|
   | HDB | `MIN(65-IWAA, 25)` | `MIN(75-IWAA, 30)` ⚠️ |
   | EC/Private/Landed | `MIN(65-IWAA, 30)` | `MIN(65-IWAA, 35)` ⚠️ |
   | Commercial | `MIN(65-IWAA, 30)` | `MIN(65-IWAA, 35)` ⚠️ |

### Why This Approach

- **Dr Elena v2 Compliant:** Matches `dr-elena-mortgage-expert-v2.json` lines 164-168, 630-735
- **Backwards Compatible:** Old code (single age) continues to work
- **TDD:** Write failing tests first, implement to make them pass
- **DRY:** IWAA function already exists, just needs to be called
- **YAGNI:** No UI changes, no LTV auto-detection (separate tasks)

---

## Architecture Changes

### Data Flow (Before → After)

**Before (WRONG):**
```
Form Data: actualAges=[35,30], actualIncomes=[5000,3000]
    ↓
Controller: age=35 (ignores co-applicant)
    ↓
Calculation: tenure = MIN(65-35, 25) = 25
```

**After (CORRECT):**
```
Form Data: actualAges=[35,30], actualIncomes=[5000,3000]
    ↓
Controller: ages=[35,30], incomes=[5000,3000]
    ↓
Calculation: IWAA=34, tenure = MIN(65-34, 25) = 25 (but 31 before cap!)
```

### Files Modified

| File | Change | Reason |
|------|--------|--------|
| `lib/calculations/instant-profile.ts` | Add `ages?` and `incomes?` to interface<br>Use IWAA when arrays provided<br>Implement 55% LTV tenure formulas | Core calculation engine (Tier 1) |
| `hooks/useProgressiveFormController.ts` | Extract `actualAges` and `actualIncomes`<br>Pass arrays to calculation | Data orchestration |
| `lib/calculations/__tests__/iwaa-tenure-integration.test.ts` | Create 20+ integration tests | TDD verification |

---

## Implementation Steps

**Full details:** See [IWAA_TENURE_IMPLEMENTATION_GUIDE.md](../../runbooks/mortgage/IWAA_TENURE_IMPLEMENTATION_GUIDE.md)

### Phase 1: Tests (TDD)
1. ✅ **IWAA Rounding Tests** - Already done (6 tests passing)
2. **Integration Tests** - Create failing tests for all property types × LTV tiers
   - Expected: 20+ tests fail (interface doesn't have `ages/incomes` yet)

### Phase 2: Interface
3. **Update InstantProfileInput** - Add optional `ages?: number[]` and `incomes?: number[]`
   - Backwards compatible (existing code works)

### Phase 3: Calculation Engine
4. **Implement IWAA-Based Tenure** - Replace lines 265-272 in `instant-profile.ts`
   - Use `calculateIWAA()` when arrays provided
   - Apply property + LTV tier specific formulas
   - Handle edge cases (old applicants, zero income co-applicant)

### Phase 4: Data Flow
5. **Update Form Controller** - Extract `actualAges` and `actualIncomes` from form
   - Parse and validate arrays
   - Pass to `calculateInstantProfile()`

### Phase 5: Verification
6. **Regression Testing** - Verify all existing tests still pass
7. **Manual Browser Testing** - Test with real form inputs
8. **Documentation** - Add Dr Elena v2 references in code comments

---

## Testing Strategy

### Test Levels

```
Manual (E2E)         ← Browser testing with form
    ↓
Integration (20+)    ← All property types × LTV tiers
    ↓
Unit (6)             ← IWAA rounding function
```

### Coverage Requirements

- **IWAA Function:** 100% (rounding, single/joint, edge cases)
- **Tenure Calculation:** All property types (HDB, EC, Private, Commercial) × Both LTV tiers (75%, 55%)
- **Backwards Compat:** Single age scenarios must still work
- **Regression:** All existing `instant-profile.test.ts` must pass

---

## Success Criteria

### Functional
- [x] IWAA calculation uses `Math.ceil()` (round UP)
- [ ] Joint applicant tenure uses IWAA (not single age)
- [ ] 55% LTV extended tenure caps implemented
- [ ] HDB 55% LTV uses 75-IWAA formula (not 65-IWAA)
- [ ] All 20+ integration tests pass
- [ ] All existing tests still pass (no regressions)

### Non-Functional
- [ ] Zero TypeScript errors
- [ ] No breaking API changes
- [ ] Dr Elena v2 compliance documented
- [ ] Code comments reference Dr Elena v2 line numbers

---

## Out of Scope

These are **separate tasks** to be done AFTER this fix:

1. **LTV Tier Auto-Detection**
   - Code supports 55% LTV, but doesn't detect when it applies
   - Need logic for MAS triggers (age > 65, lease < 20yr, etc.)

2. **MasReadiness Sidebar UI Updates**
   - Calculation engine fixed, but sidebar may not display new max loan
   - Separate UI/UX task

3. **Refinancing Tenure Rules**
   - Different formula: `MIN(original_tenure - years_elapsed, caps)`
   - Separate implementation

---

## Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking existing calculations | HIGH | TDD + run all existing tests |
| IWAA rounding wrong | HIGH | Already fixed (Math.ceil) + unit tests |
| Form doesn't collect co-applicant data | MEDIUM | Already exists (`actualAges`, `actualIncomes`) |
| 55% LTV never triggered | LOW | Out of scope - LTV detection is separate task |

---

## Rollback Plan

If bugs found after merge:

**Immediate:** Revert all commits related to IWAA
```bash
git revert <merge-commit>
```

**Partial:** Keep IWAA rounding fix, revert only tenure calculation
```bash
git revert <tenure-calculation-commit>
```

**Hot Fix:** Create `hotfix/iwaa-tenure` branch, fix specific bug, fast-track PR

---

## Timeline Estimate

| Phase | Time | Tasks |
|-------|------|-------|
| Tests (TDD) | 30min | Create 20+ failing integration tests |
| Interface | 10min | Add `ages?` and `incomes?` to interface |
| Implementation | 60min | IWAA tenure logic + 55% LTV rules + edge cases |
| Data Flow | 30min | Update form controller to pass arrays |
| Testing | 30min | Regression + manual browser testing |
| Docs | 20min | Code comments + completion report |
| **Total** | **3 hours** | Assumes no major issues |

---

## Sign-Off Checklist

**Before marking complete:**

- [ ] All tests passing (IWAA + integration + existing)
- [ ] TypeScript compiles with no errors
- [ ] Manual browser test completed
- [ ] Code comments with Dr Elena v2 references
- [ ] Work log updated
- [ ] Completion report created
- [ ] Plan archived to `docs/plans/archive/2025/10/`

---

## References

- **Dr Elena v2 Spec:** `dr-elena-mortgage-expert-v2.json`
  - IWAA formula: lines 164-168
  - HDB tenure: lines 633-642
  - EC tenure: lines 664-674
  - Private tenure: lines 681-690
  - Commercial tenure: lines 703-712

- **Implementation Guide:** [IWAA_TENURE_IMPLEMENTATION_GUIDE.md](../../runbooks/mortgage/IWAA_TENURE_IMPLEMENTATION_GUIDE.md)
  - Step-by-step instructions
  - Code snippets
  - Test examples
  - Debugging tips

- **CANONICAL_REFERENCES.md:** Rules for modifying `instant-profile.ts` (Tier 1 file)

- **CLAUDE.md:** TDD workflow (Critical Rules section)
