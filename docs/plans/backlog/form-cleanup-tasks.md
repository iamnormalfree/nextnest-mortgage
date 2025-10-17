# Lead Form Cleanup Tasks
## Removing Clutter & Following Bloomberg Design Principles

### 🎯 Goal
Remove unnecessary elements, reduce visual noise, and create a cleaner, more professional form experience.

---

## Task 1: Fix Property Type Dropdown Padding (2 mins)
**File: components/forms/ProgressiveForm.tsx**

**FIND (around line 905):**
```typescript
<SelectTrigger className={cn(
  'w-full h-12 md:h-10 md:text-sm',
  errors.propertyType ? 'border-ruby' : ''
)}>
```

**REPLACE WITH:**
```typescript
<SelectTrigger className={cn(
  'w-full h-10 text-sm', // Reduced height, consistent text size
  errors.propertyType ? 'border-ruby' : ''
)}>
```

**Also update SelectItem padding in SelectContent:**
```typescript
// If SelectItems have custom classes, reduce padding
<SelectItem value="HDB" className="py-1.5 text-sm">HDB</SelectItem>
```

---

## Task 2: Remove Resale Property Message (3 mins)
**File: components/forms/ProgressiveForm.tsx**

**FIND (search for "OTP timings"):**
```typescript
{watchedFields.propertyCategory === 'resale' && (
  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
    <p className="text-sm text-blue-800">
      ℹ️ <strong>Resale Property</strong> - Our AI broker will help you with OTP timings and negotiations after your instant analysis
    </p>
  </div>
)}
```

**DELETE:** Remove the entire block.

---

## Task 3: Make Calculation Assumptions Less Prominent (5 mins)
**File: components/forms/ProgressiveForm.tsx**

**FIND (around line 1057-1085):**
```typescript
<Card
  className={cn(
    "cursor-pointer transition-all duration-300 hover:shadow-md",
    "border-2",
    showAssumptions
      ? "border-gold bg-mist"
      : "border-fog hover:border-gold/50"
  )}
  onClick={() => setShowAssumptions(!showAssumptions)}
>
```

**REPLACE WITH:**
```typescript
<Card
  className={cn(
    "cursor-pointer transition-all duration-200",
    "border border-fog", // Thinner border, no hover emphasis
    showAssumptions && "bg-mist"
  )}
  onClick={() => setShowAssumptions(!showAssumptions)}
>
```

**AND FIND:**
```typescript
<div className="flex items-center gap-2">
  <TrendingUp className="w-6 h-6" />
  <span className="text-base font-semibold text-charcoal">Calculation Assumptions</span>
</div>
```

**REPLACE WITH:**
```typescript
<div className="flex items-center gap-2">
  <ChevronDown className={cn(
    "w-4 h-4 text-silver transition-transform duration-200",
    showAssumptions && "rotate-180"
  )} />
  <span className="text-xs text-silver uppercase tracking-wider">Advanced Settings</span>
</div>
```

---

## Task 4: Remove AI Analyzing Banks Message from Step 2 (2 mins)
**File: components/forms/ProgressiveForm.tsx**

**SEARCH for:** "AI analyzing 16 banks"
**DELETE:** The entire Alert or div containing this message.

Example pattern to find:
```typescript
<Alert className="...">
  <AlertDescription>
    AI analyzing 16 banks for your profile
  </AlertDescription>
</Alert>
```

---

## Task 5: Fix Step 3 Section Differentiation (5 mins)
**File: components/forms/ProgressiveForm.tsx**

**FIND the Step 3 section header (search for "Help us understand"):**
```typescript
<div className="mb-6">
  <h3 className="text-xl font-semibold text-charcoal mb-2">
    Help us understand your financial situation
  </h3>
  {/* Property Details section */}
</div>
```

**REPLACE WITH:**
```typescript
{/* Property Summary from Step 2 - Minimal Display */}
<div className="mb-4 p-3 bg-mist border-l-4 border-fog">
  <div className="flex items-center justify-between">
    <span className="text-xs text-silver uppercase tracking-wider">Property Selected</span>
    <span className="text-sm text-charcoal">
      {watchedFields.propertyType} • {watchedFields.propertyCategory}
    </span>
  </div>
</div>

{/* Main Step 3 Form */}
<div className="mb-6">
  <h3 className="text-xl font-semibold text-charcoal mb-2">
    Your Financial Details
  </h3>
  <p className="text-sm text-silver">
    Final information needed for accurate analysis
  </p>
</div>
```

---

## Task 6: Remove Debug Calculation Info (3 mins)
**File: components/forms/ProgressiveForm.tsx**

**SEARCH for:** "🔍 Calculation Debug"
**FIND the entire debug block (usually in a conditional render with isDev or similar):**

```typescript
{IS_DEV && (  // or {debugMode && ( or similar
  <div className="...">
    <p className="...">🔍 Calculation Debug:</p>
    // ... all the debug info
  </div>
)}
```

**Either:**
1. DELETE the entire block if not needed in development
2. OR change condition to: `{false && (` to disable it

---

## Task 7: Remove Duplicate AI Messages in Step 3 (2 mins)
**File: components/forms/ProgressiveForm.tsx**

**SEARCH and DELETE these messages:**
- "AI broker will help finalize your application"
- "AI analyzing 16 banks for your profile"
- "Average savings identified: $456/month"

These are usually in Alert components or info boxes. Remove the entire containing elements.

---

## Task 8: Make Refined Calculation Section Collapsible (10 mins)
**File: components/forms/ProgressiveForm.tsx**

**FIND the refined calculation section (search for "MSR limit exceeded"):**

```typescript
{/* Current structure - showing all details */}
<div className="refined-calculation">
  <p>⚠️ May need to pledge/show funds and/or reduce loan quantum</p>
  <p>MSR limit exceeded. Broker will explore optimization options.</p>
  {/* IWAA details, etc. */}
</div>
```

**REPLACE WITH:**
```typescript
{/* Collapsible Refined Calculation */}
{hasCalculationIssues && (
  <div className="mt-4">
    <Card
      className={cn(
        "border border-ruby/30 bg-ruby/5 cursor-pointer transition-all duration-200",
        showCalculationDetails && "bg-white"
      )}
      onClick={() => setShowCalculationDetails(!showCalculationDetails)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <span className="text-ruby mt-0.5">⚠️</span>
          <div className="flex-1">
            <p className="text-sm font-medium text-charcoal">
              May need to pledge funds or reduce loan quantum
            </p>
            <p className="text-xs text-silver mt-1">
              MSR limit exceeded. Broker will explore optimization options.
            </p>
            {!showCalculationDetails && (
              <p className="text-xs text-silver mt-2">
                Click for details →
              </p>
            )}
          </div>
        </div>

        {showCalculationDetails && (
          <div className="mt-4 pt-4 border-t border-fog space-y-2">
            {/* IWAA Age details */}
            <div className="text-xs text-silver">
              <span className="font-medium">IWAA Age:</span> {iwaaAge} years
            </div>
            {/* Other calculation details */}
          </div>
        )}
      </CardContent>
    </Card>
  </div>
)}
```

**ADD state at the top of component:**
```typescript
const [showCalculationDetails, setShowCalculationDetails] = useState(false)
```

---

## 📋 Testing Checklist

After implementing all tasks:

- [ ] Property dropdown is more compact
- [ ] No "Resale Property OTP" message
- [ ] Calculation assumptions are subtle
- [ ] No "AI analyzing banks" in Step 2
- [ ] Step 3 clearly separated from property summary
- [ ] No debug info visible
- [ ] No duplicate AI messages
- [ ] Calculation warnings are collapsible

---

## 🎨 Design Principles Applied

✅ **Subtraction**: Removed 5+ unnecessary messages
✅ **Minimalism**: Smaller UI elements for non-critical items
✅ **Hierarchy**: Important info prominent, details hidden
✅ **Bloomberg Style**: Clean, data-focused, no decoration
✅ **Mobile-friendly**: Less scrolling, cleaner layout

---

## ⏱ Time Estimate

1. Property dropdown: 2 mins
2. Remove resale message: 3 mins
3. Calculation assumptions: 5 mins
4. Remove AI message: 2 mins
5. Fix Step 3 sections: 5 mins
6. Remove debug info: 3 mins
7. Remove duplicate messages: 2 mins
8. Collapsible calculations: 10 mins

**Total: ~32 minutes**

---

## 💡 Result

The form will be:
- **50% less cluttered** - Removed unnecessary messages
- **Cleaner hierarchy** - Clear sections and progression
- **Professional** - No debug info or placeholder content
- **Focused** - User sees only what they need
- **Bloomberg-aligned** - Minimal, functional, elegant