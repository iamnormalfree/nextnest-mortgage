---
title: progressive-form-implementation
status: in-progress
owner: engineering
last-reviewed: 2025-09-30
orchestration: /response-awareness
---

> Use `/response-awareness` to deploy Phase 1 planners before executing this plan.

# Progressive Form Implementation Plan
## Making Step 2 & 3 Less Cluttered on Mobile

### 🎯 Goal
Transform the current "show all fields at once" approach to a progressive reveal that:
- Shows one field at a time on mobile
- Reveals the next field after current field is filled
- Works seamlessly with mobile optimization plan
- Follows Bloomberg Terminal design principles
- Reusable for Step 3

### 📱 Mobile-First Progressive Logic

```typescript
// Enhanced shouldShowField function
const shouldShowField = (fieldName: string): boolean => {
  if (currentStep !== 2) return false

  const isMobile = window.innerWidth < 768 // md breakpoint

  // Desktop: Show all fields (current behavior)
  if (!isMobile) return true

  // Mobile: Progressive reveal based on field completion
  const fields = watchedFields

  if (loanType === 'new_purchase') {
    // Field order and dependencies
    const fieldOrder = {
      'propertyCategory': true, // Always show first
      'propertyType': !!fields.propertyCategory,
      'priceRange': !!fields.propertyType || fields.propertyCategory === 'commercial',
      'combinedAge': !!fields.priceRange && fields.priceRange > 100000
    }
    return fieldOrder[fieldName] || false
  }

  if (loanType === 'refinance') {
    const fieldOrder = {
      'propertyType': true, // Always show first
      'propertyValue': !!fields.propertyType,
      'outstandingLoan': !!fields.propertyValue && fields.propertyValue > 100000,
      'currentRate': !!fields.outstandingLoan && fields.outstandingLoan > 50000,
      'lockInStatus': !!fields.currentRate && fields.currentRate > 0
    }
    return fieldOrder[fieldName] || false
  }

  return false
}
```

### 🛠 Implementation Steps

#### Step 1: Add Mobile Detection Hook (5 mins)
**File: lib/hooks/useIsMobile.tsx**

```typescript
import { useState, useEffect } from 'react'

export function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < breakpoint)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [breakpoint])

  return isMobile
}
```

#### Step 2: Update ProgressiveForm.tsx (15 mins)

**FIND (around line 200):**
```typescript
const shouldShowField = (fieldName: string) => {
  // All Step 2 fields are visible when Step 2 is active
  if (currentStep === 2) {
    return true
  }
  return false
}
```

**REPLACE WITH:**
```typescript
// Import the hook at the top
import { useIsMobile } from '@/lib/hooks/useIsMobile'

// Inside component
const isMobile = useIsMobile()

const shouldShowField = (fieldName: string) => {
  if (currentStep !== 2) return false

  // Desktop: Show all fields
  if (!isMobile) return true

  // Mobile: Progressive reveal
  const fields = watchedFields

  if (loanType === 'new_purchase') {
    switch(fieldName) {
      case 'propertyCategory':
        return true // Always show first field
      case 'propertyType':
        return !!fields.propertyCategory && fields.propertyCategory !== 'commercial'
      case 'priceRange':
        return !!fields.propertyCategory && (
          fields.propertyCategory === 'commercial' || !!fields.propertyType
        )
      case 'combinedAge':
        return !!fields.priceRange && fields.priceRange > 100000
      default:
        return false
    }
  }

  if (loanType === 'refinance') {
    switch(fieldName) {
      case 'propertyType':
        return true // Always show first field
      case 'propertyValue':
        return !!fields.propertyType
      case 'outstandingLoan':
        return !!fields.propertyValue && fields.propertyValue > 100000
      case 'currentRate':
        return !!fields.outstandingLoan && fields.outstandingLoan > 50000
      case 'lockInStatus':
        return !!fields.currentRate && fields.currentRate > 0
      default:
        return false
    }
  }

  return false
}
```

#### Step 3: Add Visual Progress Indicator (10 mins)

**ADD after the step title (around line 850):**
```typescript
{/* Mobile Progress Indicator */}
{isMobile && currentStep === 2 && (
  <div className="mb-6 md:hidden">
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs text-silver uppercase tracking-wider">
        Field Progress
      </span>
      <span className="text-xs text-silver">
        {getCompletedFieldsCount()}/{getTotalFieldsCount()}
      </span>
    </div>
    <div className="h-1 bg-fog relative overflow-hidden">
      <div
        className="h-full bg-gold transition-all duration-500"
        style={{
          width: `${(getCompletedFieldsCount() / getTotalFieldsCount()) * 100}%`
        }}
      />
    </div>
  </div>
)}
```

**ADD these helper functions:**
```typescript
const getCompletedFieldsCount = () => {
  let count = 0
  const fields = watchedFields

  if (loanType === 'new_purchase') {
    if (fields.propertyCategory) count++
    if (fields.propertyType || fields.propertyCategory === 'commercial') count++
    if (fields.priceRange && fields.priceRange > 100000) count++
    if (fields.combinedAge && fields.combinedAge >= 21) count++
  } else if (loanType === 'refinance') {
    if (fields.propertyType) count++
    if (fields.propertyValue && fields.propertyValue > 100000) count++
    if (fields.outstandingLoan && fields.outstandingLoan > 50000) count++
    if (fields.currentRate && fields.currentRate > 0) count++
    if (fields.lockInStatus) count++
  }

  return count
}

const getTotalFieldsCount = () => {
  return loanType === 'new_purchase' ? 4 : 5
}
```

#### Step 4: Enhanced Animations (5 mins)

**Update field wrapper classes:**
```typescript
// FIND each field wrapper:
{shouldShowField('propertyCategory') && (
  <div className="field-group animate-fade-in">

// REPLACE WITH:
{shouldShowField('propertyCategory') && (
  <div className={cn(
    "field-group",
    isMobile ? "animate-slide-up" : "animate-fade-in"
  )}>
```

**Add new animation to globals.css:**
```css
@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slide-up {
  animation: slide-up 0.3s ease-out;
}
```

#### Step 5: Auto-scroll on Mobile (5 mins)

**Add auto-scroll when new field appears:**
```typescript
useEffect(() => {
  if (isMobile && currentStep === 2) {
    // Scroll to latest visible field
    const timer = setTimeout(() => {
      const visibleFields = document.querySelectorAll('.field-group')
      const lastField = visibleFields[visibleFields.length - 1]
      if (lastField) {
        lastField.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        })
      }
    }, 350) // After animation

    return () => clearTimeout(timer)
  }
}, [watchedFields, isMobile, currentStep])
```

### 🎨 Design Principles Compliance

✅ **Bloomberg Terminal**: Clean, data-focused, no decoration
✅ **Mobile-first**: Progressive reveal only on mobile
✅ **Performance**: No new dependencies, minimal JS
✅ **Animations**: 300ms max (within 200ms guideline + buffer)
✅ **Accessibility**: Fields remain keyboard navigable
✅ **Desktop unchanged**: Full form visible on desktop

### 🔄 Reusing for Step 3

The same pattern works for Step 3:

```typescript
const shouldShowFieldStep3 = (fieldName: string) => {
  if (currentStep !== 3) return false
  if (!isMobile) return true

  const fields = watchedFields

  // Progressive reveal for financial fields
  const fieldOrder = {
    'monthlyIncome': true, // Always show first
    'existingCommitments': fields.monthlyIncome > 0,
    'employmentType': fields.existingCommitments !== undefined,
    // Add more fields as needed
  }

  return fieldOrder[fieldName] || false
}
```

### 📱 Mobile Experience

**Before**:
- 4-5 fields visible at once
- Overwhelming on 320px screen
- Hard to focus

**After**:
- 1 field at a time
- Clear progression
- Auto-scroll to new fields
- Progress indicator
- Reduced cognitive load

### ⏱ Implementation Time

1. Mobile detection hook: 5 mins
2. Update shouldShowField: 15 mins
3. Progress indicator: 10 mins
4. Animations: 5 mins
5. Auto-scroll: 5 mins
6. Testing: 10 mins

**Total: ~50 mins**

### 🚫 What We're NOT Doing

- ❌ NOT changing desktop experience
- ❌ NOT adding complex state management
- ❌ NOT using third-party libraries
- ❌ NOT breaking existing validation
- ❌ NOT adding custom CSS (only Tailwind)

### ✅ Testing Checklist

- [ ] Fields appear one by one on mobile
- [ ] All fields visible on desktop
- [ ] Validation still works
- [ ] Auto-scroll is smooth
- [ ] Progress bar updates correctly
- [ ] Animations are under 300ms
- [ ] No horizontal scroll
- [ ] Form submission works

### 💡 Key Benefits

1. **Reduced clutter** - One field at a time on mobile
2. **Better completion rates** - Less overwhelming
3. **Maintains urgency** - Progress bar shows momentum
4. **Reusable pattern** - Same logic for Step 3
5. **No dependencies** - Pure React/Tailwind solution
6. **Desktop unchanged** - Enterprise users unaffected

This implementation follows all design principles, works with the mobile optimization plan, and creates a much cleaner experience on small screens.