# Employment Panel Debugging Guide
**Date:** 2025-10-31
**Issue:** Employment type select not retaining value in e2e test
**Approach:** Systematic debugging with Playwright Inspector + React DevTools

---

## Phase 1: Instrumentation Complete ✅

Added console.log instrumentation to track event flow:

### 1. EmploymentPanel.tsx (line 194)
```typescript
onValueChange={(value) => {
  console.log('=== EmploymentPanel onValueChange ===', {
    value,
    fieldName: getFieldName('employmentType'),
    currentFieldValue: field.value,
    applicantNumber
  })
  field.onChange(value)
  onFieldChange(getFieldName('employmentType'), value, { ... })
}}
```

### 2. PropertyType Select (ProgressiveFormWithController.tsx line 861) - Working Comparison
```typescript
onValueChange={(value) => {
  console.log('=== PropertyType onValueChange (NEW_PURCHASE) ===', {
    value,
    fieldName: 'propertyType',
    currentFieldValue: field.value
  })
  field.onChange(value)
  onFieldChange('propertyType', value)
}}
```

---

## Phase 2: Run Test with Playwright Inspector

### Command (Corrected):
```bash
# Available project is "chromium", not "Mobile Chrome"
npx playwright test tests/e2e/chat-production-e2e.spec.ts --project=chromium --debug
```

### What Happens:
1. Browser opens with Playwright Inspector
2. Test pauses at each step
3. You can step through manually
4. Console logs will show in browser DevTools

---

## Phase 3: Observations to Make

### A. For PropertyType Select (Gate 2) - Working Control
When test clicks property type option:

**Check Console Log:**
```
=== PropertyType onValueChange (NEW_PURCHASE) ===
{
  value: "HDB",
  fieldName: "propertyType",
  currentFieldValue: ""  // or previous value
}
```

**Check React DevTools (Components tab):**
1. Find `Controller` component for propertyType
2. Watch `field.value` state
3. Does it update immediately after click?

**Check DOM:**
1. Inspect SelectTrigger element
2. Does SelectValue show "HDB" after selection?

---

### B. For EmploymentType Select (Gate 3) - Broken
When test clicks employment option:

**Check Console Log:**
```
=== EmploymentPanel onValueChange ===
{
  value: "employed",
  fieldName: "employmentType",
  currentFieldValue: "",  // or previous value
  applicantNumber: 0
}
```

**Questions to Answer:**

1. **Does the console.log fire at all?**
   - YES → Radix event is reaching the handler
   - NO → Event not firing (Radix/portal issue)

2. **If log fires, check React DevTools:**
   - Does `field.value` update in Controller component?
   - YES → RHF is updating (issue downstream)
   - NO → RHF not receiving update (field.onChange issue)

3. **Check DOM state:**
   - Does SelectValue show "Employed" text?
   - Does the form validation state change?

---

## Phase 4: Comparison Analysis

### Differences to Document:

| Aspect | PropertyType (Working) | EmploymentType (Broken) | Hypothesis |
|--------|----------------------|------------------------|------------|
| onValueChange fires? | | | |
| field.onChange calls? | | | |
| RHF state updates? | | | |
| DOM reflects change? | | | |
| Validation triggers? | | | |

### Key Questions:

1. **Event Flow:**
   - Does onValueChange fire for both? (console.log evidence)

2. **React Hook Form:**
   - Does field.onChange actually update RHF state?
   - Check `useWatch` for employmentType in parent

3. **Portal/Mounting:**
   - Are dropdowns portal'd differently?
   - Check SelectContent portal attribute

4. **Timing:**
   - Does waiting longer help?
   - Is there a re-render that clears the value?

---

## Phase 5: Expected Outcomes

### If onValueChange NEVER fires:
**Root Cause:** Radix event binding issue
- Check how SelectContent is portal'd
- Verify click target is correct element
- Check if option is actually clickable

### If onValueChange fires but value doesn't stick:
**Root Cause:** RHF wiring issue
- Check field.onChange implementation
- Verify watch() sees the update
- Check for competing state updates

### If everything logs correctly but tests fail:
**Root Cause:** Test timing issue
- Value updates but test checks too early
- Need explicit wait for RHF state propagation

---

## Files Modified (Instrumentation)

1. `components/forms/sections/EmploymentPanel.tsx` - Line 194 (console.log added)
2. `components/forms/ProgressiveFormWithController.tsx` - Line 861 (console.log added)

**To revert instrumentation:**
```bash
git checkout components/forms/sections/EmploymentPanel.tsx
git checkout components/forms/ProgressiveFormWithController.tsx
```

---

## Next Steps After Inspector Run

1. Document exact differences in behavior table above
2. Form specific hypothesis based on evidence
3. Write failing unit test that reproduces the issue
4. Implement minimal fix for root cause (TDD)
5. Verify fix in both unit test and e2e test

---

## References

- Test File: `tests/e2e/chat-production-e2e.spec.ts` (lines 163-177)
- Component: `components/forms/sections/EmploymentPanel.tsx`
- Main Form: `components/forms/ProgressiveFormWithController.tsx`
- Systematic Debugging Protocol: `.claude/frameworks/shared/frameworks/superpowers/systematic-debugging.md`
