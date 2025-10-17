---
title: implementation-file-changes-ux
type: report
status: analysis
owner: engineering
date: 2025-09-02
---

# 📝 UX IMPROVEMENT - FILE CHANGES MATRIX
**Complete list of files to modify for UX improvements**
**Based on Tech Team Roundtable**

---

## 🎯 FILE MODIFICATION OVERVIEW

### **Total Files to Modify:** ~25
### **Total New Files to Create:** ~20
### **Critical Path Files:** 8

---

## 📂 PHASE 1: FOUNDATION FIXES (Week 1)

### **Modified Files**

#### 1. `components/forms/ProgressiveForm.tsx` ⚡ CRITICAL
```typescript
CHANGES:
Line 114: Change initial gate from 1 to 0 (fix confusing numbering)
Line 43-82: Reorganize formGates array with new structure:
  - Gate 0 → Step 1: "Who You Are"
  - Gate 1 → Step 2: "What You Need"  
  - Gate 2 → Step 3: "Your Finances"
Lines 221-224: Expand AI_TRIGGERED_FIELDS constant
Lines 289-296: Remove manual state syncing
Lines 1283-1396: Move phone field from Gate 2 to Step 1
Lines 1486-1546: Make progress indicator responsive
Lines 1656-1658: Add AI indicator labels to fields

ADDITIONS:
- Progressive value delivery logic after 2 fields
- Field visibility management
- AI indicator components
- Trust badges before sensitive fields
```

#### 2. `components/forms/IntelligentMortgageForm.tsx`
```typescript
CHANGES:
Lines 78-82: Move urgency calculation to server
Lines 169-178: Remove duplicate insight generation
Lines 114-120: Add early value delivery triggers
Lines 408-416: Simplify insight type handling
Lines 419-494: Redesign insight cards for mobile

ADDITIONS:
- Progressive insight display logic
- Compliant preliminary analysis
- Three-tier fallback system
```

#### 3. `lib/validation/mortgage-schemas.ts`
```typescript
CHANGES:
- Update gate schemas for new 3-step structure
- Move phone to Step 1 validation
- Add propertyCategory field
- Add commercial form validation
- Remove ownershipStructure (now AI-inferred)

ADDITIONS:
- UEN validation for commercial
- Progressive field schemas
- Conditional validation based on visibility
```

### **New Files to Create**

#### 1. `components/forms/CommercialQuickForm.tsx` 🆕
```typescript
// 4-field form for commercial properties
// Prevents dead-end user experience
interface CommercialQuickFormProps {
  onSubmit: (data: CommercialData) => void
}

// Fields: name, email, phone, uen
// Clear broker handoff messaging
```

#### 2. `components/ui/TrustBadge.tsx` 🆕
```typescript
// Proactive trust signals
// Shows before sensitive fields
interface TrustBadgeProps {
  field: string
  message: string
  icon?: string
}
```

#### 3. `lib/constants/loadingMessages.ts` 🆕
```typescript
// Context-aware loading messages
export const LOADING_MESSAGES = {
  calculating: "Calculating your eligibility...",
  analyzing: "Comparing 23 banks...",
  submitting: "Securing your report..."
}
```

#### 4. `lib/utils/debounce.ts` 🆕
```typescript
// Field-level debouncing utility
export function debounce<T>(
  func: (...args: T[]) => void,
  delay: number
): (...args: T[]) => void
```

---

## 📂 PHASE 2: STRUCTURAL IMPROVEMENTS (Week 2)

### **Modified Files**

#### 4. `lib/domains/forms/entities/LeadForm.ts` 🗑️ DELETE
```typescript
REMOVAL:
- Entire file deleted
- Consolidating on React Hook Form
- Update all imports/references
```

#### 5. `types/mortgage.ts`
```typescript
CHANGES:
- Add Step1Data, Step2Data, Step3Data interfaces
- Add PropertyCategory type
- Add CommercialData interface
- Remove OwnershipStructure

ADDITIONS:
interface StepData {
  step1: { name: string; email: string; phone: string }
  step2: { propertyCategory: string; propertyType: string; ... }
  step3: { monthlyIncome: number; commitments?: number; ... }
}
```

#### 6. `lib/contracts/form-contracts.ts`
```typescript
CHANGES:
- Update FormState to match 3-step structure
- Remove LeadForm references
- Add progressive disclosure state

ADDITIONS:
interface ProgressiveFormState {
  visibleFields: string[]
  completedFields: string[]
  currentFocus: string
}
```

### **New Files to Create**

#### 5. `components/forms/FieldLimiter.tsx` 🆕
```typescript
// Limits visible fields to reduce cognitive load
interface FieldLimiterProps {
  children: React.ReactNode[]
  maxVisible: number
  showNext: boolean
}
```

#### 6. `components/forms/PropertyCategorySelector.tsx` 🆕
```typescript
// Visual card selector for property categories
// Replaces dropdown for better UX
interface PropertyCategorySelectorProps {
  onSelect: (category: PropertyCategory) => void
}
```

#### 7. `lib/hooks/useProgressiveFields.ts` 🆕
```typescript
// Manages progressive field disclosure
export function useProgressiveFields(
  step: number,
  completedFields: string[]
): VisibleFields
```

---

## 📂 PHASE 3: UX ENHANCEMENTS (Week 3)

### **Modified Files**

#### 7. `styles/animations.css`
```typescript
CHANGES:
- Add smooth field reveal animations
- Mobile-optimized transitions
- Reduced motion for accessibility

ADDITIONS:
.field-reveal { animation: slideIn 0.3s ease-out; }
.field-hide { animation: slideOut 0.2s ease-in; }
@media (prefers-reduced-motion) { /* reduced animations */ }
```

#### 8. `app/layout.tsx`
```typescript
CHANGES:
- Add mobile viewport optimizations
- Preload critical fonts
- Add CSS custom properties for UX

ADDITIONS:
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5">
CSS Variables for responsive touch targets
```

#### 9. `components/ContactSection.tsx`
```typescript
CHANGES:
- Update to use new 3-step form
- Add mobile optimizations
- Implement trust signals

REMOVAL:
- Old gate-based logic
```

### **New Files to Create**

#### 8. `components/ui/SmartLoader.tsx` 🆕
```typescript
// Context-aware loading states
interface SmartLoaderProps {
  operation: 'calculating' | 'analyzing' | 'submitting'
  progress?: number
}
```

#### 9. `lib/hooks/useSwipeGesture.ts` 🆕
```typescript
// Mobile swipe navigation between steps
export function useSwipeGesture(
  onSwipeLeft: () => void,
  onSwipeRight: () => void
)
```

#### 10. `lib/utils/networkDetection.ts` 🆕
```typescript
// Detect network speed for adaptive debouncing
export function getNetworkSpeed(): 'slow' | 'fast' | 'offline'
```

#### 11. `components/ui/MobileProgressDots.tsx` 🆕
```typescript
// Vertical progress dots for mobile
interface MobileProgressDotsProps {
  steps: string[]
  currentStep: number
  completedSteps: number[]
}
```

---

## 📂 PHASE 4: TRUST & TRANSPARENCY (Week 4)

### **Modified Files**

#### 10. `components/forms/AIInsightsPanel.tsx`
```typescript
CHANGES:
- Add compliance disclaimers
- Simplify insight display
- Mobile-optimized cards

ADDITIONS:
- "Preliminary analysis" warnings
- "Not final rates" disclaimers
- Market aggregate display (no bank names)
```

#### 11. `lib/insights/mortgage-insights-generator.ts`
```typescript
CHANGES:
- Generate insights after just 2 fields
- Add progressive insight levels
- Remove bank-specific information

ADDITIONS:
function generatePreliminaryInsight(email: string, price: number)
function generateMarketPulse(propertyType: string)
```

### **New Files to Create**

#### 12. `components/ui/AIStatus.tsx` 🆕
```typescript
// Real-time AI analysis status
interface AIStatusProps {
  analyzing: boolean
  field?: string
  insightCount: number
  banksCompared: number
}
```

#### 13. `components/ui/ComplianceBadges.tsx` 🆕
```typescript
// MAS regulation and PDPA compliance badges
export function ComplianceBadges() {
  return (
    <div className="compliance-badges">
      <Badge icon="🏛️" text="MAS Regulated" />
      <Badge icon="🔒" text="PDPA Compliant" />
    </div>
  )
}
```

#### 14. `lib/utils/insightCache.ts` 🆕
```typescript
// Local storage caching for insights
export class InsightCache {
  store(key: string, insight: Insight): void
  retrieve(key: string): Insight | null
  clear(): void
}
```

#### 15. `app/fallback/page.tsx` 🆕
```typescript
// Static HTML form fallback
// Works without JavaScript
export default function FallbackForm() {
  return (
    <form action="/api/contact" method="POST">
      {/* Basic HTML form */}
    </form>
  )
}
```

---

## 🔄 INTEGRATION FILES

### **API Routes to Modify**

#### 12. `app/api/forms/analyze/route.ts`
```typescript
CHANGES:
- Add progressive analysis endpoints
- Implement early value delivery
- Add compliance filtering

ADDITIONS:
- /api/forms/preliminary - After 2 fields
- /api/forms/market-pulse - After property type
- Response filtering for compliance
```

#### 13. `app/api/contact/route.ts`
```typescript
CHANGES:
- Support both AJAX and form POST
- Add commercial quick form handling
- Implement graceful degradation
```

### **Configuration Files**

#### 14. `tailwind.config.ts`
```typescript
CHANGES:
- Add mobile-first utility classes
- Touch target size utilities
- Responsive typography scale

ADDITIONS:
'touch-target': '44px',
'mobile-input': { height: '48px' }
```

#### 15. `next.config.js`
```typescript
CHANGES:
- Add security headers
- Enable progressive web app
- Optimize for mobile

ADDITIONS:
headers: {
  'Content-Security-Policy',
  'X-Frame-Options'
}
```

---

## 📊 IMPACT SUMMARY BY FILE CRITICALITY

### **🔴 CRITICAL PATH (Must modify first)**
1. `components/forms/ProgressiveForm.tsx` - Core form logic
2. `lib/validation/mortgage-schemas.ts` - Validation rules
3. `components/forms/IntelligentMortgageForm.tsx` - Parent orchestration
4. `types/mortgage.ts` - Type definitions

### **🟡 HIGH PRIORITY (Significant UX impact)**
5. `components/forms/CommercialQuickForm.tsx` - Prevents dead-ends
6. `components/ui/TrustBadge.tsx` - Builds confidence
7. `lib/utils/debounce.ts` - Performance improvement
8. `components/forms/FieldLimiter.tsx` - Reduces overload

### **🟢 ENHANCEMENT (Polish and optimization)**
9. `components/ui/SmartLoader.tsx` - Better feedback
10. `components/ui/AIStatus.tsx` - Transparency
11. `lib/utils/insightCache.ts` - Offline capability
12. `app/fallback/page.tsx` - Graceful degradation

---

## 🚨 BREAKING CHANGES

### **Data Structure Changes**
- FormState structure completely revised
- Gate numbering changed from 0-3 to 1-3
- Phone field moved between gates

### **Component API Changes**
- ProgressiveForm props interface changed
- Validation schemas restructured
- Event handlers updated

### **State Management**
- LeadForm entity removed
- React Hook Form as single source of truth
- Parent-child sync only on step completion

---

## 📋 MIGRATION CHECKLIST

### **Before Starting**
- [ ] Backup current form components
- [ ] Document current form submission flow
- [ ] Capture baseline metrics
- [ ] Create feature flags for rollout

### **During Implementation**
- [ ] Test each phase independently
- [ ] Maintain backward compatibility
- [ ] Run A/B tests on changes
- [ ] Monitor error rates

### **After Completion**
- [ ] Verify all paths work
- [ ] Test mobile thoroughly
- [ ] Check accessibility
- [ ] Update documentation