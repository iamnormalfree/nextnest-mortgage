---
title: testing-guide
type: runbook
domain: qa
owner: qa
last-reviewed: 2025-09-30
---

# NextNest AI Lead Form - Testing Guide

## Testing What's Currently Working

### Phase 1 Foundation Components - Testing Checklist

### **1. LoanTypeSelector Component**
**Location**: `components/forms/LoanTypeSelector.tsx`

#### **Manual Testing Steps:**

1. **Visual Layout Testing**
   ```bash
   # Start dev server
   npm run dev
   # Navigate to component page or integrate into homepage
   ```
   - [ ] Three loan type cards display correctly
   - [ ] Cards show: icon, label, subtext, benefits, urgency hook
   - [ ] NextNest branding (gold #FFB800, blue trust colors) applied
   - [ ] Hover effects work smoothly
   - [ ] Mobile responsive layout works

2. **Trust Signal Cascade Testing**
   - [ ] Authority signal shows immediately (MAS Licensed)
   - [ ] Social proof appears after 3 seconds (12,847 saved)
   - [ ] Urgency signal shows after 8 seconds (DBS rates increase)
   - [ ] Signals animate smoothly with slide-down effect

3. **Interaction Testing**
   - [ ] Click loan type â†’ Selection indicator appears
   - [ ] Loading overlay shows for 800ms
   - [ ] Event is published to event bus
   - [ ] Selection persisted to localStorage

#### **Event Bus Testing**
```typescript
// Open browser console and test event emission
eventBus.subscribe('LOAN_TYPE_SELECTED', (event) => {
  console.log('Loan type selected:', event.data)
})
// Then click a loan type card
```

#### **Animation Performance Testing**
- [ ] CSS animations run at 60fps (no janky transitions)
- [ ] No layout shifts during trust signal cascade
- [ ] Hover effects responsive (<16ms response)

### **2. ProgressiveForm Component**
**Location**: `components/forms/ProgressiveForm.tsx`

#### **Manual Testing Steps:**

1. **Gate Progression Testing**
   - [ ] Gate 0: Loan type selection works
   - [ ] Gate 1: Basic info form appears
   - [ ] Gate 2: Detailed form shows
   - [ ] Progress bar updates correctly
   - [ ] Gate validation prevents skipping

2. **Form Validation Testing**
   ```typescript
   // Test Singapore phone validation
   // Valid: 91234567, 81234567, 61234567
   // Invalid: 21234567, 1234567, +6591234567
   ```
   - [ ] Singapore phone numbers validate correctly
   - [ ] Email validation works
   - [ ] Required fields show error states
   - [ ] Form prevents submission with invalid data

3. **State Persistence Testing**
   - [ ] Form data saves to localStorage
   - [ ] Returning users see saved progress
   - [ ] Form state survives page refresh
   - [ ] Can clear saved data

### **3. Event Bus System**
**Location**: `lib/events/event-bus.ts`

#### **Console Testing:**
```javascript
// Test event publishing
eventBus.publish({
  type: 'TEST_EVENT',
  sessionId: 'test-session',
  data: { test: 'data' }
})

// Test event subscription
eventBus.subscribe('TEST_EVENT', (event) => {
  console.log('Received:', event)
})

// Test circuit breaker
// Publish many events rapidly to trigger circuit breaker
for(let i = 0; i < 100; i++) {
  eventBus.publish({ type: 'SPAM_EVENT', sessionId: 'test', data: {} })
}
```

#### **Circuit Breaker Testing**
- [ ] High frequency events trigger circuit breaker
- [ ] Circuit breaker prevents event overflow
- [ ] System recovers after breaker cooldown
- [ ] Error events logged properly

### **4. Mortgage Calculation Service**
**Location**: `lib/domains/forms/services/MortgageCalculationService.ts`

#### **Calculation Testing:**
```typescript
// Test TDSR calculation
const result = mortgageService.calculateTDSR(8000, 2000, 'Private')
console.log('TDSR Result:', result)

// Expected: should not exceed 55% limit
// Should show stress test rate impact
```

- [ ] TDSR calculation matches MAS requirements (55% limit)
- [ ] MSR calculation applies correctly for HDB/EC (30% limit)
- [ ] LTV limits enforce properly (75%/45%/35% for 1st/2nd/3rd+ property)
- [ ] Stress test rate of 4% applied correctly
- [ ] Client-protective rounding (down for eligibility, up for funds)

### **5. Animation System**
**Location**: `styles/animations.css` & `lib/hooks/useAnimation.ts`

#### **Performance Testing:**
```javascript
// Measure animation performance
performance.mark('animation-start')
// Trigger animation
setTimeout(() => {
  performance.mark('animation-end')
  performance.measure('animation-duration', 'animation-start', 'animation-end')
  console.log(performance.getEntriesByName('animation-duration')[0].duration)
}, 1000)
```

- [ ] Animations run smoothly on mobile
- [ ] No layout shifts during animations
- [ ] prefers-reduced-motion respected
- [ ] GPU acceleration working (check DevTools)

## **Automated Testing Setup**

### **Unit Tests** (Not yet implemented - Phase 2)
```bash
# Future testing commands
npm run test
npm run test:coverage
npm run test:e2e
```

### **Performance Testing**
```bash
# Lighthouse audit
npx lighthouse http://localhost:3000 --output=json
# Should score >90 for Performance

# Bundle size check
npm run build
npx bundle-analyzer
# Should be <140KB gzipped
```

## **Browser Testing Matrix**

### **Desktop Testing**
- [ ] Chrome (latest)
- [ ] Safari (latest) 
- [ ] Firefox (latest)
- [ ] Edge (latest)

### **Mobile Testing**
- [ ] Safari iOS (iPhone)
- [ ] Chrome Android
- [ ] Samsung Internet

## **Error Scenario Testing**

### **Network Issues**
- [ ] Test with slow 3G connection
- [ ] Test with offline mode
- [ ] Test with intermittent connection

### **JavaScript Errors**
- [ ] Component gracefully handles missing props
- [ ] Form works with JavaScript disabled (basic functionality)
- [ ] Error boundaries catch component crashes

## **Integration Testing**

### **Event Flow Testing**
```typescript
// Test complete user journey
1. Load LoanTypeSelector
2. Select "Buying a Property"  
3. Progress to ProgressiveForm
4. Fill Gate 1 fields
5. Verify events published correctly
6. Check form state persistence
```

### **Data Flow Testing**
- [ ] Form data passes correctly between components
- [ ] Validation schemas work with form data
- [ ] Calculation service receives correct inputs
- [ ] Results display properly

## **Red Flags to Watch For**

### **Performance Issues**
- [ ] Animations dropping frames
- [ ] Bundle size exceeding 140KB
- [ ] JavaScript errors in console
- [ ] Layout shifts during loading

### **User Experience Issues**
- [ ] Trust signals not appearing
- [ ] Form validation too strict/lenient  
- [ ] Mobile layout broken
- [ ] Accessibility issues (keyboard navigation)

### **Technical Issues**
- [ ] Event bus memory leaks
- [ ] LocalStorage quota exceeded
- [ ] Circuit breaker not working
- [ ] TypeScript compilation errors

## **Next Phase Prerequisites**

**Before implementing Phase 2 (AI Integration):**
- [ ] All Phase 1 components pass testing checklist
- [ ] Performance meets targets (<800ms load, >90 Lighthouse)
- [ ] No JavaScript errors in production
- [ ] Mobile experience smooth on real devices
- [ ] Event bus handles high load without memory leaks

**Success Criteria:**
- Form completion rate >50% (vs current baseline)
- Trust signals increase engagement time >30 seconds
- No technical errors reported
- Smooth 60fps animations on all target devices

## **Development Testing Workflow**

```bash
# 1. Start development
npm run dev

# 2. Run in multiple browsers
# Use localhost tunneling for mobile testing
npx localtunnel --port 3000

# 3. Monitor performance
# Keep DevTools Performance tab open
# Watch for layout thrashing and frame drops

# 4. Test TypeScript compilation
npm run type-check

# 5. Run linting
npm run lint
```

This testing guide ensures Phase 1 foundation is solid before moving to Phase 2 AI integration.
