# Clear Form Storage - Troubleshooting Guide

## Purpose

When testing progressive form calculations, old localStorage data can persist and contaminate new test sessions. This guide explains how to clear form storage.

## Quick Fix (Browser Console)

Open browser DevTools console (F12) and run:

```javascript
// Clear all NextNest form storage
Object.keys(localStorage).forEach(key => {
  if (key.startsWith('nextnest_form_')) {
    localStorage.removeItem(key);
    console.log('Removed:', key);
  }
});

// Clear useFormState storage
localStorage.removeItem('nextnest_form_new_purchase');
localStorage.removeItem('nextnest_form_new_purchase_recovery');
localStorage.removeItem('nextnest_form_new_purchase_abandonment');
localStorage.removeItem('nextnest_form_refinance');
localStorage.removeItem('nextnest_form_refinance_recovery');
localStorage.removeItem('nextnest_form_refinance_abandonment');

console.log('✅ Form storage cleared');
```

## What Gets Stored

### 1. Form State Persistence (`lib/hooks/useFormState.ts`)

**Keys:**
- `nextnest_form_{loanType}` - Main form data
- `nextnest_form_{loanType}_recovery` - Recovery backup
- `nextnest_form_{loanType}_abandonment` - Abandonment tracking

**Data Stored:**
- name, email, phone
- loanType, propertyType, priceRange
- employmentType, monthlyIncome, existingCommitments
- ❌ Does NOT store `existingProperties` (not in schema)

### 2. Chatwoot Integration

**Keys:**
- `chatwoot_widget_config` - Widget configuration
- `form_data` - Basic form snapshot
- `lead_score` - Lead scoring data

**Stored in:** sessionStorage (cleared on tab close)

### 3. Conversion Tracking

**Key:** `nextnest_conversion_events`

**Data:** Last 100 conversion events (analytics only)

## Why Old Data Persists

1. **Browser localStorage survives page refresh** - Data stays even after reload
2. **Auto-save every 5 seconds** - `useFormState` saves continuously
3. **Recovery on mount** - Form checks for recovery data on initialization
4. **Schema mismatch doesn't clear data** - If field not in schema, value persists but isn't validated

## Impact on `existingProperties` Bug

**Before Fix (2025-10-19):**
- `existingProperties` NOT in `lib/hooks/useFormState.ts` schema
- Not saved to localStorage by `useFormState` hook
- BUT persisted by React Hook Form's internal state across re-renders
- Possible source: Manual `setValue('existingProperties', 1)` during testing

**After Fix (2025-10-19):**
- Added `existingProperties: 0` to `lib/forms/form-config.ts`
- React Hook Form uses this default on initialization
- Value of 0 = first property = 75% LTV ✓

## Testing New Property Tiers

To test different property ownership scenarios:

```javascript
// Open console on /apply page after form loads

// Test first property (75% LTV)
useProgressiveFormController.form.setValue('existingProperties', 0)

// Test second property (45% LTV)
useProgressiveFormController.form.setValue('existingProperties', 1)

// Test third+ property (35% LTV)
useProgressiveFormController.form.setValue('existingProperties', 2)

// Then trigger recalculation by changing age or property price
```

## When to Clear Storage

**Clear localStorage when:**
- Starting fresh test session for property tier calculations
- Getting unexpected LTV percentages
- Form shows old data from previous session
- Testing refinance after testing new purchase

**Don't need to clear when:**
- Just page refresh (React Hook Form reinitializes with defaultValues)
- Different browser/incognito window
- After localStorage.clear() already run

## Related Files

- `lib/hooks/useFormState.ts` - Form persistence logic
- `lib/forms/form-config.ts` - Default values (includes `existingProperties: 0`)
- `hooks/useProgressiveFormController.ts` - Form controller using defaults
- `components/forms/ProgressiveFormWithController.tsx` - Main form component

## Future Enhancement

Consider adding debug UI in development mode:

```tsx
{process.env.NODE_ENV === 'development' && (
  <Button onClick={() => {
    localStorage.clear();
    window.location.reload();
  }}>
    Clear Storage & Reload
  </Button>
)}
```

---

**Created:** 2025-10-19
**Related Issue:** Property tier calculation showing wrong LTV percentages
