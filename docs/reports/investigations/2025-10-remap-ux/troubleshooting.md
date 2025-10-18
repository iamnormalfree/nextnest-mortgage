# 🔧 UX IMPROVEMENT TROUBLESHOOTING GUIDE
**Common issues and solutions during implementation**

---

## 🚨 CRITICAL ISSUES (Stop Work)

### **1. Completion Rate Drops Below 40%**

**Symptoms:**
- Metrics show completion < baseline
- Users abandoning earlier than before

**Diagnosis:**
```bash
# Check specific drop-off point
1. Review gate completion metrics
2. Identify which step has highest abandonment
3. Check error logs for that step
```

**Solution:**
```bash
# Immediate rollback
git revert HEAD
# or use feature flag
setFeatureFlag('ux-improvements', false)

# Then investigate:
- Was change too drastic?
- Did validation become stricter?
- Are fields not saving properly?
```

---

### **2. TypeScript Compilation Fails**

**Common Errors:**

#### Error: "Property does not exist on type"
```typescript
// Problem: Field moved but type not updated
// Solution: Update types/mortgage.ts

interface Step1Data {
  name: string
  email: string
  phone: string  // Add if moved from Step 2
}
```

#### Error: "Type 'undefined' is not assignable"
```typescript
// Problem: Optional field not marked optional
// Solution: Add ? to optional fields

interface Step2Data {
  propertyCategory?: string  // Optional with ?
  propertyType?: string
}
```

**Quick Fix:**
```bash
# Check all type errors
npm run type-check

# Auto-fix some issues
npm run lint -- --fix
```

---

### **3. Mobile Experience Breaks**

**Symptoms:**
- Touch targets too small
- Can't tap buttons
- Keyboard covers input

**Diagnosis:**
```bash
# Chrome DevTools
1. F12 → Toggle device toolbar
2. Select iPhone SE (smallest)
3. Check touch target overlay
4. Verify 44px minimum sizes
```

**Common Fixes:**

```css
/* Increase touch targets */
.field-input {
  min-height: 48px;  /* Was 36px */
  padding: 12px 16px;  /* More padding */
}

/* Fix keyboard covering */
.form-container {
  padding-bottom: 100px;  /* Space for keyboard */
}
```

---

## ⚠️ COMMON ISSUES

### **4. Fields Not Showing Progressively**

**Problem:** All fields showing at once despite progressive disclosure

**Check:**
```typescript
// In ProgressiveForm.tsx
console.log('Visible fields:', visibleFields)
console.log('Completed fields:', completedFields)
```

**Fix:**
```typescript
// Ensure FieldLimiter is working
<FieldLimiter maxVisible={2}>
  {fields.map(field => 
    visibleFields.includes(field.name) && (
      <FieldComponent key={field.name} {...field} />
    )
  )}
</FieldLimiter>
```

---

### **5. State Not Syncing**

**Problem:** Form data lost between steps

**Diagnosis:**
```typescript
// Add debug logging
const handleStepComplete = (step, data) => {
  console.log('Step completed:', step)
  console.log('Data received:', data)
  console.log('Current formData:', formData)
}
```

**Fix:**
```typescript
// Ensure proper state update
setFormData(prev => ({
  ...prev,
  [`step${step}`]: data  // Preserve previous steps
}))
```

---

### **6. AI Indicators Not Showing**

**Problem:** ✨ indicators missing from AI-triggered fields

**Check:**
```typescript
// Verify constant is defined
console.log('AI_TRIGGERED_FIELDS:', AI_TRIGGERED_FIELDS)
```

**Fix:**
```typescript
const AI_TRIGGERED_FIELDS = [
  'priceRange',
  'propertyType',
  'currentRate',
  'monthlyIncome'
]

// In render
{AI_TRIGGERED_FIELDS.includes(fieldName) && (
  <AIIndicator field={fieldName} />
)}
```

---

### **7. Trust Badges in Wrong Position**

**Problem:** Trust badges showing after fields, not before

**Fix:**
```jsx
// Correct order
<div className="field-group">
  <TrustBadge message="🔒 Never shared" />  {/* FIRST */}
  <label>Email</label>
  <input {...field} />
</div>
```

---

### **8. Commercial Users Still Hit Dead-End**

**Problem:** Commercial selection doesn't trigger quick form

**Check:**
```typescript
// In handleLoanTypeSelect
console.log('Loan type selected:', type)
if (type === 'commercial') {
  console.log('Should show quick form')
}
```

**Fix:**
```typescript
// Early detection
if (loanType === 'commercial') {
  return <CommercialQuickForm />  // Different component
}
```

---

### **9. Insights Not Appearing Early**

**Problem:** No value after 2 fields

**Check:**
```typescript
// Verify insight triggers
const fieldsCompleted = Object.keys(formData.step1 || {}).length
console.log('Fields completed:', fieldsCompleted)
```

**Fix:**
```typescript
// Trigger after email + 1 field
if (fieldsCompleted === 2 && formData.step1?.email) {
  requestInsight({ type: 'welcome' })
}
```

---

### **10. Bundle Size Exceeds 140KB**

**Problem:** Adding too many dependencies

**Check:**
```bash
# Analyze bundle
npm run analyze
```

**Fix:**
```typescript
// Dynamic imports for heavy components
const HeavyComponent = dynamic(() => import('./Heavy'), {
  loading: () => <Skeleton />,
  ssr: false
})

// Remove unused imports
// Use tree-shakeable imports
import { debounce } from 'lodash-es'  // Not full lodash
```

---

## 🔄 ROLLBACK PROCEDURES

### **Feature Flag Rollback**
```typescript
// In app config
const FEATURE_FLAGS = {
  uxImprovements: false,  // Turn off
  progressiveDisclosure: false,
  commercialQuickForm: false
}
```

### **Git Rollback**
```bash
# Rollback last commit
git revert HEAD

# Rollback specific file
git checkout HEAD~1 components/forms/ProgressiveForm.tsx

# Rollback to specific commit
git reset --hard <commit-hash>
```

### **Emergency Hotfix**
```typescript
// Quick disable in component
const USE_NEW_UX = false  // Emergency switch

return USE_NEW_UX ? (
  <NewProgressiveForm />
) : (
  <OldForm />  // Fallback
)
```

---

## 📊 METRICS TO CHECK

### **After Each Change**
1. Form completion rate
2. Time to first value
3. Mobile completion rate
4. Error rate
5. API response time

### **Red Flags**
- Completion drops >5%
- Mobile errors increase
- Load time >3 seconds
- API timeouts increase
- TypeScript errors

---

## 🆘 ESCALATION PATH

### **Level 1: Self-Diagnosis**
1. Check this troubleshooting guide
2. Review implementation process
3. Check git history
4. Test in isolation

### **Level 2: Rollback**
1. Document issue in issues/
2. Rollback change
3. Notify team
4. Plan fix

### **Level 3: Team Review**
1. Schedule emergency review
2. Analyze metrics together
3. Decide on approach
4. Implement with pair programming

---

## 💡 PREVENTION TIPS

### **Before Implementation**
- [ ] Read task completely
- [ ] Check dependencies
- [ ] Set up testing environment
- [ ] Capture baseline metrics

### **During Implementation**
- [ ] One subtask at a time
- [ ] Test after each change
- [ ] Check mobile constantly
- [ ] Monitor metrics

### **After Implementation**
- [ ] Full regression test
- [ ] Mobile device test
- [ ] Metrics comparison
- [ ] Document learnings

---

## 📝 ISSUE TEMPLATE

```markdown
## Issue: [Brief description]

**Task:** [Task number and name]
**Subtask:** [Subtask number]
**File:** [File being modified]

**Expected:** [What should happen]
**Actual:** [What is happening]

**Steps to Reproduce:**
1. [Step 1]
2. [Step 2]

**Metrics Impact:**
- Completion rate: [before] → [after]
- Mobile: [impact]

**Attempted Solutions:**
1. [What you tried]
2. [Result]

**Rollback Status:** [Not needed / Completed / In progress]
```

---

**Remember:** When in doubt, rollback and reassess. It's better to maintain current functionality than to push broken improvements.