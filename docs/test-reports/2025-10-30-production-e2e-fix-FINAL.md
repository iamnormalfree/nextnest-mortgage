# Production E2E Test Fix - Final Report
**Date**: 2025-10-30  
**Task**: Fix failing production E2E tests (`tests/e2e/chat-production-e2e.spec.ts`)  
**Final Status**: All 7/7 tests passing ✅

## Summary of Root Causes

### 1. Incorrect Gate Order  
**Problem**: Test was filling gates out of sequence (Property details before Contact info)  
**Solution**: Reordered test to match actual production flow:
- Gate 0: Loan type selection (homepage)
- Gate 1: Who You Are (name, email, phone)
- Gate 2: What You Need (propertyCategory, propertyType, priceRange, combinedAge)
- Gate 3: Financial Details (actualIncomes.0, employmentType)

### 2. Missing Required Field (combinedAge)
**Problem**: Gate 2 schema requires `combinedAge` but test wasn't filling it  
**Solution**: Added age input filling BEFORE clicking Continue button in Gate 2

### 3. Validation Not Triggering
**Problem**: Form validation requires blur event, but test kept fields focused  
**Solution**: Added `.blur()` call after each `.fill()` operation

### 4. Selector Strict Mode Violations
**Problem**: Multiple elements matched generic selectors  
**Solutions**:
- Employment select: Changed from `.getByRole('combobox').or(...)` to `.getByRole('combobox').first()`
- Employment option: Changed from `/employed/i` regex to exact text `'Employed (salary)'`

## Changes Applied

### Test Helper Function (`completeLoanApplicationForm`)

**Gate 1 - Contact Information:**
```typescript
// Name
await nameInput.fill('Playwright Test User');
await nameInput.blur();  // ← Added

// Email  
await emailInput.fill(`test${Date.now()}@playwright.test`);
await emailInput.blur();  // ← Added

// Phone
await phoneInput.fill('91234567');
await phoneInput.blur();  // ← Added

// Continue to Gate 2
await continueBtn.click();
```

**Gate 2 - Property Details:**
```typescript
// Property Category
await categorySelect.click();
await resaleOption.click();

// Property Type  
await typeSelect.click();
await hdbOption.click();

// Property Price
await priceInput.fill('500000');
await priceInput.blur();  // ← Added

// Combined Age - CRITICAL: Required by schema
await ageInput.fill('35');  // ← Added (was missing)
await ageInput.blur();      // ← Added

// Continue to Gate 3
await continueBtn.click();
```

**Gate 3 - Financial Details:**
```typescript
// Income
await incomeInput.fill('8000');
await incomeInput.blur();  // ← Added

// Employment Type - Fixed selectors
const employmentSelect = page.getByRole("combobox").first();  // ← Fixed
await employmentSelect.click();

const employedOption = page.getByRole('option', { name: 'Employed (salary)' });  // ← Fixed
await employedOption.click();

// Submit
await submitButton.click();
```

## Test Coverage Verified

All 7 tests now pass:

1. ✅ Full flow: Homepage → Form → Chat interaction
2. ✅ Mobile viewport: Form → Chat on iPhone  
3. ✅ Chat persistence: Message survives page refresh
4. ✅ Message input accessible on mobile
5. ✅ Send button accessible after typing
6. ✅ No horizontal overflow on narrow viewport
7. ✅ Auto-scroll to bottom on new messages

## Validation Schema Reference

From `lib/validation/mortgage-schemas.ts`:

**Gate 1 (Who You Are):**
```typescript
{
  name: z.string().min(2),
  email: z.string().email(),
  phone: singaporePhoneSchema  // /^[689]\d{7}$/
}
```

**Gate 2 (What You Need - new_purchase):**
```typescript
{
  propertyCategory: z.enum(['resale', 'new_launch', 'bto', 'commercial']),
  propertyType: z.enum(['HDB', 'EC', 'Private', 'Landed', 'Commercial']),
  priceRange: z.number().min(300000).max(5000000),
  combinedAge: z.number().min(21).max(100)  // ← Was missing
}
```

**Gate 3 (Financial Details):**
```typescript
{
  actualIncomes: { 0: z.number().min(0) },
  employmentType: z.enum([...])
}
```

## Related Files Modified

- `tests/e2e/chat-production-e2e.spec.ts` - Complete rewrite of helper function

## Related Files Referenced

- `lib/validation/mortgage-schemas.ts` - Gate validation schemas
- `components/forms/ProgressiveFormWithController.tsx` - Production form component  
- `hooks/useProgressiveFormController.ts` - Form controller with validation logic
- `lib/forms/form-config.ts` - Gate definitions and field requirements

## Stage 0 Blocker Resolution

**CAN-053 requirement**: Production E2E tests must pass before Stage 0 launch.

**Status**: ✅ RESOLVED - All 7/7 tests passing

## Lessons Learned

1. **Always check validation schemas before writing E2E tests** - The gate requirements are defined in code, not assumptions
2. **Blur events matter** - React Hook Form validation may require blur to trigger, especially in `onChange` mode
3. **Playwright strict mode is your friend** - Forces precise selectors that won't break when UI changes
4. **Test the actual production flow** - Don't assume the order of steps, follow the actual navigation path

---
**Test Execution Time**: ~18s per test, ~2 minutes total for all 7 tests  
**Test Environment**: Playwright + Chromium on Windows  
**Production URL**: https://nextnest.sg
