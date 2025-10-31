# Field Leakage Analysis: propertyCategory = 'brent'
**Date:** 2025-10-31
**Issue:** User input "brent" leaking into propertyCategory field
**Status:** Root cause investigation complete - Hypothesis formed

---

## Evidence Collected

### Console Log Source
**File:** `hooks/useProgressiveFormController.ts:871`

```typescript
console.log('🔍 Initial trigger (new_purchase): Has required fields?', result, {
  propertyCategory: fields.propertyCategory,
  propertyType: fields.propertyType,
  priceRange: fields.priceRange,
  propertyPrice: fields.propertyPrice,
  combinedAge: fields.combinedAge
})
```

**Where `fields` comes from:** Line 163
```typescript
const watchedFields = watch() // Watches ALL form fields via React Hook Form
```

### Observed Behavior
After entering name "brent" in Gate 1:
```javascript
{
  propertyCategory: 'brent',  // ❌ Should be undefined
  propertyType: '',
  priceRange: undefined,
  propertyPrice: undefined,
  combinedAge: undefined
}
```

---

## Hypothesis: Browser Autofill Interference

### Why This Happens

**Browser autofill** attempts to intelligently fill forms by matching:
1. Input field names
2. Input field types
3. Label text
4. Input positioning
5. Form structure patterns

**The propertyCategory select** might be getting autofilled because:
- Browser sees "name" input filled with "brent"
- Browser attempts to fill other fields it thinks match
- Radix UI Select components use hidden inputs internally
- Browser autofill can populate these hidden inputs incorrectly

### Supporting Evidence

1. **No code sets propertyCategory to user input**
   - Grepped entire codebase - no setValue calls that would do this
   - Only explicit setValue calls use valid enum values ('resale', 'bto', 'commercial')

2. **React Hook Form watches all fields**
   - `watchedFields = watch()` captures everything, including autofilled values
   - If browser autofills a hidden Radix input, RHF sees it

3. **Similar pattern affects employment type**
   - Employment select also uses Radix UI Select
   - If autofill is the root cause, it would explain why employment values don't stick
   - Autofill might be competing with programmatic setValue calls

---

## How This Connects to Employment Select Bug

### The Connection

If browser autofill is interfering with Radix UI Selects:

1. **During test:** Playwright fills name="brent"
2. **Browser autofill:** Tries to fill other fields
3. **Radix Select (propertyCategory):** Gets "brent" from autofill
4. **Later, employmentType select:** Gets autofilled value that competes with test click
5. **RHF sees:** Autofill value, not the programmatically set value
6. **Result:** Test clicks "employed" but autofill overwrites it

### Why PropertyType Works But EmploymentType Doesn't

**PropertyType (Gate 2):**
- Appears earlier in form
- Less autofill history by that point
- Might not match browser's autofill patterns

**EmploymentType (Gate 3):**
- Appears later after more fields filled
- Browser has more context for autofill guessing
- Might match common employment-related autofill patterns

---

## Testing Strategy

### Step 1: Confirm Autofill is the Culprit

**Test A: With autofill enabled (current)**
```bash
npx playwright test tests/e2e/chat-production-e2e.spec.ts --project=chromium
```
Expected: Employment select fails

**Test B: Disable browser autofill**
Add to test setup:
```typescript
await page.goto('https://nextnest.sg');
await page.evaluate(() => {
  document.querySelectorAll('input, select').forEach(el => {
    el.setAttribute('autocomplete', 'off');
  });
});
```
Expected: If hypothesis correct, employment select works

### Step 2: Permanent Fix

**Add autocomplete attributes to form fields:**

```typescript
// Gate 1 fields (ProgressiveFormWithController.tsx)
<Input
  name="name"
  autoComplete="off"  // ← Add this
  placeholder="Tan Wei Ming"
/>

<Input
  name="email"
  autoComplete="off"  // ← Add this
  placeholder="weiming@gmail.com"
/>

// Radix Select components
<Select
  name="propertyCategory"
  autoComplete="off"  // ← Add this
  ...
/>

<Select
  name="employmentType"
  autoComplete="off"  // ← Add this
  ...
/>
```

**OR** use React Hook Form's built-in autofill prevention:
```typescript
register('propertyCategory', {
  shouldUnregister: false,
  autoComplete: 'off'
})
```

---

## Alternative Hypotheses (Less Likely)

### Hypothesis 2: Radix UI Portal Event Binding
- Radix Select uses portals for dropdown content
- Events might not bubble correctly to RHF
- **Why unlikely:** PropertyType select works fine with same Radix setup

### Hypothesis 3: RHF Field Registration Timing
- Employment field registers too late
- RHF loses track of field state
- **Why unlikely:** Console log shows onValueChange fires correctly

### Hypothesis 4: React Concurrent Mode Race Condition
- Multiple state updates compete
- Autofill + programmatic setValue race
- **Why more likely:** This aligns with autofill hypothesis

---

## Next Actions

1. ✅ **Instrumentation added** - Console logs in place
2. ⏳ **Test with autofill disabled** - Confirm hypothesis
3. ⏳ **Add autocomplete="off"** - Implement fix
4. ⏳ **Verify employment select** - Retest end-to-end

---

## Files Involved

- `hooks/useProgressiveFormController.ts:163, 871` - Console log source
- `components/forms/ProgressiveFormWithController.tsx:804` - propertyCategory field
- `components/forms/sections/EmploymentPanel.tsx:181` - employmentType field
- `tests/e2e/chat-production-e2e.spec.ts:163-177` - Failing test

---

## Key Insight

**The employment select bug and the propertyCategory='brent' bug are likely the same root cause:**
Browser autofill interfering with Radix UI Select components' internal hidden inputs, causing React Hook Form to see autofilled values instead of programmatically set values.

**Fix:** Disable browser autofill on all form inputs and selects.

**Verification:** After fix, both issues should disappear.
