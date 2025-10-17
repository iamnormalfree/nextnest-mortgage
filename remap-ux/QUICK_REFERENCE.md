# 🚀 UX IMPROVEMENT QUICK REFERENCE
**Keep this open while implementing tasks**

---

## 📍 TASK EXECUTION FLOW

```mermaid
1. READ TASK → 2. CHECK FILES → 3. IMPLEMENT SUBTASK → 4. TEST → 5. COMMIT → REPEAT
```

---

## 🎯 CURRENT TASK TRACKER

### **Week 1: Foundation Fixes**
```bash
□ Task 1: Simplify Gate Structure
  □ 1.1: Update gate numbering (Line 114)
  □ 1.2: Reorganize form fields (Lines 43-82)
  □ 1.3: Move phone field (Lines 1283-1396)
  □ 1.4: Update progress labels

□ Task 2: Progressive Value Delivery
  □ 2.1: Create instant calculation triggers
  □ 2.2: Add market pulse insights
  □ 2.3: Implement progressive insight display

□ Task 3: Add Field-Level AI Indicators
  □ 3.1: Define AI-triggered fields
  □ 3.2: Add visual indicators
  □ 3.3: Implement inline loading states
  □ 3.4: Add compliant disclaimers
```

---

## 📝 FILE QUICK REFERENCE

### **Most Modified Files**
| File | Location | Key Changes |
|------|----------|-------------|
| ProgressiveForm.tsx | components/forms/ | Gate structure, fields, progressive disclosure |
| IntelligentMortgageForm.tsx | components/forms/ | State management, early insights |
| mortgage-schemas.ts | lib/validation/ | Validation for 3-step structure |
| mortgage.ts | types/ | New interfaces for steps |

### **New Files to Create (Week 1)**
| File | Location | Purpose |
|------|----------|---------|
| TrustBadge.tsx | components/ui/ | Proactive trust signals |
| loadingMessages.ts | lib/constants/ | Context-aware loading |
| debounce.ts | lib/utils/ | API call optimization |

---

## 🔧 ESSENTIAL COMMANDS

```bash
# Development
npm run dev                    # Start server (keep running)
npm run type-check            # Check TypeScript (after each subtask)
npm run lint                  # Check code quality

# Testing
Chrome DevTools → F12 → Ctrl+Shift+M  # Mobile testing
Console → Check for errors            # Debug issues

# Git
git add .
git commit -m "feat(ux-task-X.Y): [description]"
git revert HEAD              # Emergency rollback
```

---

## ✅ SUBTASK CHECKLIST

Before starting a subtask:
- [ ] Read subtask in IMPLEMENTATION_PLAN
- [ ] Check line numbers in implementation-file-changes
- [ ] Open the file to modify

After implementing:
- [ ] Test in browser
- [ ] Test on mobile view
- [ ] Check TypeScript compiles
- [ ] No console errors
- [ ] Commit with clear message

---

## 📊 KEY METRICS TO WATCH

| Metric | Baseline | Target | Check After |
|--------|----------|--------|-------------|
| Fields visible | 7+ | 2-3 max | Each subtask |
| Completion rate | <40% | >60% | Each task |
| Mobile works | Partially | Fully | Every change |
| Time to value | 2-3 min | <30 sec | Task 2 |

---

## 🚨 STOP IF YOU SEE

1. **More than 3 fields visible at once**
2. **TypeScript compilation errors**
3. **Mobile touch targets < 44px**
4. **Form submission breaks**
5. **Completion rate drops**

---

## 🎯 3-STEP STRUCTURE REFERENCE

### **Step 1: Who You Are**
```typescript
fields: ['name', 'email', 'phone']  // Phone MOVED here
trustBadges: before each field
noApiCall: true
```

### **Step 2: What You Need**
```typescript
fields: ['propertyCategory', 'propertyType', 'priceRange', ...]
progressive: true  // Show 2-3 at a time
firstApiCall: true  // After completion
insights: ['market_pulse', 'preliminary_calculation']
```

### **Step 3: Your Finances**
```typescript
fields: ['monthlyIncome', 'commitments', 'preferences']
progressive: true
finalApiCall: true
insights: ['full_optimization']
```

---

## 💡 COMMON PATTERNS

### **Progressive Field Pattern**
```jsx
{visibleFields.includes('fieldName') && (
  <div className="animate-slideIn">
    <FieldComponent />
  </div>
)}
```

### **Trust Badge Pattern**
```jsx
<TrustBadge message="🔒 Never shared" />
<InputField />
```

### **AI Indicator Pattern**
```jsx
<label>
  Field Label
  {AI_TRIGGERED_FIELDS.includes('fieldName') && (
    <AIIndicator />
  )}
</label>
```

### **Mobile Input Pattern**
```jsx
<input
  type="tel"
  inputMode="numeric"
  pattern="[689][0-9]{7}"
  className="h-12"  // 48px touch target
/>
```

---

## 📁 DOCUMENT LOCATIONS

| Need | Document | Path |
|------|----------|------|
| Task details | IMPLEMENTATION_PLAN | remap-ux/UX_IMPROVEMENT_IMPLEMENTATION_PLAN.md |
| Process steps | IMPLEMENTATION_PROCESS | remap-ux/IMPLEMENTATION_PROCESS_UX.md |
| File changes | FILE_CHANGES | remap-ux/implementation-file-changes-ux.md |
| Field structure | FIELD_MAPPING | remap-ux/field-mapping-ux-improved.md |
| Architecture | ARCHITECTURE | remap-ux/frontend-backend-ai-architecture-ux.md |
| Validation | VALIDATION | remap-ux/NEXTNEST_CONTEXT_VALIDATION_FRAMEWORK_UX.md |
| Issues | TROUBLESHOOTING | remap-ux/troubleshooting.md |

---

## 🔄 QUICK ROLLBACK

```bash
# If something breaks:
1. git status                    # See what changed
2. git diff                      # Review changes
3. git revert HEAD              # Rollback last commit
# OR
4. git checkout -- [filename]    # Rollback specific file
```

---

## 📞 HELP SEQUENCE

1. Check `troubleshooting.md`
2. Review task specification
3. Check implementation process
4. Document in `issues/`

---

**Keep this open in a tab while working!**