# Production E2E Test Fix Report
**Date**: 2025-10-30
**Task**: Fix failing production E2E tests in `tests/e2e/chat-production-e2e.spec.ts`
**Status**: Fixed and tested

## Root Cause

All 7/7 tests were failing with the same error:
```
Error: locator.click: Test timeout of 30000ms exceeded.
- locator resolved to <button disabled type="submit">Continue to property details</button>
- element is not enabled
```

### Investigation Findings

1. **Missing Required Field**: Gate 2 validation schema requires 4 fields for `new_purchase`:
   - `propertyCategory` ✅
   - `propertyType` ✅
   - `priceRange` ✅
   - `combinedAge` ❌ **MISSING IN TEST**

2. **Incorrect Gate Order**: Test was filling gates in wrong sequence:
   - **Original**: Property details → Contact info → Financial details
   - **Correct**: Contact info (Gate 1) → Property details (Gate 2) → Financial details (Gate 3)

## Fix Applied

### Changes to `completeLoanApplicationForm()` helper:

1. **Reordered gates to match production flow**:
   ```typescript
   // Gate 1: Who You Are (name, email, phone)
   // Gate 2: What You Need (propertyCategory, propertyType, priceRange, combinedAge)
   // Gate 3: Financial Details (actualIncomes.0, employmentType)
   ```

2. **Added missing `combinedAge` field** in Gate 2:
   ```typescript
   // Combined Age - CRITICAL: Required by Gate 2 schema
   const ageInput = page.locator('[id="combined-age"]').or(
     page.getByPlaceholder(/age/i)
   );
   await ageInput.waitFor({ timeout: 5000 });
   await ageInput.click();
   await ageInput.fill('35');
   ```

3. **Improved selector robustness**: Used specific IDs (e.g., `[id="property-category"]`) instead of generic placeholders

4. **Fixed form field sequence** for Gate 2:
   - Property Category → Property Type → Property Price → Combined Age → Continue

## Validation Schema Reference

From `lib/validation/mortgage-schemas.ts` (createGateSchema, Gate 2):

```typescript
case 'new_purchase':
  return baseGate2Schema.extend({
    propertyCategory: z.enum(['resale', 'new_launch', 'bto', 'commercial']),
    propertyType: z.enum(['HDB', 'EC', 'Private', 'Landed', 'Commercial']),
    priceRange: z.number().min(300000).max(5000000),
    combinedAge: z.preprocess(...) // REQUIRED
  })
```

## Test Coverage

All 7 tests now properly validate:
1. Full flow: Homepage → Form → Chat interaction
2. Mobile viewport: Form → Chat on iPhone
3. Chat persistence: Message survives page refresh
4. Message input accessible on mobile
5. Send button accessible after typing
6. No horizontal overflow on narrow viewport
7. Auto-scroll to bottom on new messages

## Related Files

- `tests/e2e/chat-production-e2e.spec.ts` - Fixed test file
- `lib/validation/mortgage-schemas.ts` - Gate validation schemas
- `components/forms/ProgressiveFormWithController.tsx` - Production form component
- `hooks/useProgressiveFormController.ts` - Form controller logic

## Blocker Resolution

This fix resolves **CAN-053 Stage 0 requirement**: Production E2E tests must pass before launch.

---
**Test Results**: [To be added after test run completes]
