# Path 2 Onboarding Guide

**Read this FIRST if you're new to the project or this plan.**

This guide assumes you're a skilled developer but know **nothing about our codebase or problem domain**.

---

## 📚 Required Reading (Before Starting ANY Task)

Read these files in order:

1. **`CLAUDE.md`** - Project rules and development philosophy
2. **`./reference/amendment-existing-storage.md`** - ⚠️ CRITICAL: Use existing storage solutions
3. **`components/forms/ProgressiveForm.tsx`** - Existing desktop form (gate-based system)
4. **`lib/calculations/instant-profile.ts`** - Dr Elena v2 mortgage calculation engine
5. **`lib/contracts/form-contracts.ts`** - TypeScript interfaces and types
6. **`lib/forms/form-config.ts`** - Form field configuration and validation rules
7. **`hooks/useLoanApplicationContext.tsx`** - Form state management hook
8. **`lib/hooks/useLoanApplicationStorage.ts`** - Existing 7-day persistence

---

## 🛠️ Tech Stack Summary

| Technology | Version | Purpose | Notes |
|------------|---------|---------|-------|
| **Next.js** | 14 | Framework | App Router (NOT Pages Router) |
| **React Hook Form** | 7 | Forms | Controller pattern for controlled inputs |
| **Zod** | Latest | Validation | NOT yup, NOT joi |
| **Tailwind CSS** | Latest | Styling | Monochrome + yellow accent only |
| **TypeScript** | Strict | Type Safety | NO `any` types allowed |
| **Jest** | Latest | Unit Tests | TDD required for ALL features |
| **Playwright** | Latest | E2E Tests | Mobile device testing |

---

## 🧠 Key Concepts

### 1. Gate-Based Forms (NOT Steps)

**CRITICAL:** Our forms use "gates" (0-3), not "steps"

- Gates unlock based on data quality, not sequential completion
- Users can jump backwards: Gate 2 → Gate 0 to edit name
- This is NOT a wizard/stepper pattern

**Common Pitfall:**
```tsx
// ❌ WRONG
const [currentStep, setCurrentStep] = useState(0)
const nextStep = () => setCurrentStep(prev => prev + 1)

// ✅ RIGHT
const [currentGate, setCurrentGate] = useState(0)
const advanceGate = () => { /* validate, then advance */ }
```

### 2. Dr Elena v2 Mortgage Engine

Singapore MAS regulations:
- **TDSR ≤ 55%** (Total Debt Servicing Ratio)
- **MSR ≤ 30%** (Mortgage Servicing Ratio)

Three calculation types:
1. `calculateInstantProfile()` - Quick estimate at Gate 2
2. `calculateComplianceSnapshot()` - Full validation at Gate 3
3. `calculateRefinanceOutlook()` - Refinancing scenarios

**NEVER mock these in tests - use real data fixtures from `tests/fixtures/dr-elena-v2-scenarios.ts`**

### 3. Singapore Mortgage Context

**Property Types:**
- **HDB** - Public housing (~$500k typical)
- **EC** - Executive Condo (~$850k typical)
- **Private** - Private property (~$1.2M typical)
- **Landed** - Landed property (~$2.5M typical)

**Loan Types:**
- **New Purchase** - First-time or additional property
- **Refinance** - Switch from existing loan
- **Equity Loan** - Borrow against property value

**Typical Buyer:**
- Age: 30-40 years old
- Income: $5-12k/month
- Market data: Q3 2024

### 4. Mobile-First Mandate

**60%+ users browse on mobile first**

Requirements:
- Touch targets MUST be 48px+ (WCAG 2.1 Level AAA)
- Use `inputMode="numeric"` for number inputs (NOT `type="number"`)
- NO rounded corners (sharp rectangles only)
- NO framer-motion (40KB bundle) - use native touch events

**Common Pitfalls:**
```tsx
// ❌ WRONG - Breaks comma formatting, poor mobile UX
<input type="number" />

// ✅ RIGHT - Shows numeric keyboard, allows formatting
<input type="text" inputMode="numeric" />
```

### 5. Design System: Sophisticated Flow

**Reference:** Design system documented in `docs/DESIGN_SYSTEM.md` and `tailwind.config.ts`

**Rules:**
- **Colors:** 90% monochrome + 10% yellow accent (#FCD34D)
- **Fonts:** font-light (300), font-normal (400), font-semibold (600)
- **Corners:** SHARP RECTANGLES ONLY (no rounded corners)
- **Rule of One:** ONE yellow CTA button per viewport max

**❌ FORBIDDEN:**
- Purple colors
- Rounded corners (`rounded-lg`, `rounded-md`)
- Font weights: `font-medium`, `font-bold`

**Common Pitfall:**
```tsx
// ❌ WRONG - Violates design system
<button className="rounded-lg bg-purple-500 font-bold">
  Continue
</button>

// ✅ RIGHT - Sharp rectangles, yellow accent, correct font
<button className="bg-[#FCD34D] font-semibold">
  Continue
</button>
```

---

## 🚀 Development Workflow

### Before Starting ANY Task

```bash
# 1. Verify branch
git status  # Should show: fix/progressive-form-calculation-corrections

# 2. Pull latest
git pull origin fix/progressive-form-calculation-corrections

# 3. Install dependencies (if needed)
npm install

# 4. Start dev server
npm run dev  # Runs on http://localhost:3000
```

### Test-Driven Development (MANDATORY)

1. Write FAILING test that validates desired functionality
2. Run test to confirm failure: `npm test -- <test-file>.test.ts`
3. Write ONLY enough code to make test pass
4. Run test to confirm success
5. Refactor while keeping tests green
6. Commit with descriptive message

**Example Flow:**
```bash
# 1. Write failing test
npm test -- components/forms/__tests__/MobileNumberInput.test.tsx
# Expected: FAIL (test not implemented yet)

# 2. Implement feature
# ... edit MobileNumberInput.tsx ...

# 3. Test passes
npm test -- components/forms/__tests__/MobileNumberInput.test.tsx
# Expected: PASS

# 4. Commit
git add components/forms/mobile/MobileNumberInput.tsx
git add components/forms/__tests__/MobileNumberInput.test.tsx
git commit -m "feat: add mobile number input with haptic feedback"
```

### Commit Frequency

**Commit after EACH completed sub-task**

Format: `feat: <what you did> (<why it matters>)`

Examples:
```bash
git commit -m "feat: add mobile number input with haptic feedback (improves mobile UX)"
git commit -m "fix: prevent double-tap on CTA button (eliminates duplicate submissions)"
git commit -m "test: add conditional field visibility tests (ensures reliability)"
```

**NEVER batch multiple features into one commit**

---

## ✅ Code Quality Checklist

Before committing, verify:

- [ ] No TypeScript errors: `npm run build`
- [ ] No lint errors: `npm run lint`
- [ ] All tests pass: `npm test`
- [ ] No `any` types (use proper TypeScript interfaces)
- [ ] Design system compliance (no rounded corners, correct colors)
- [ ] ABOUTME comments at top of new files (2 lines explaining purpose)
- [ ] No framer-motion or other heavy dependencies

**ABOUTME Comment Example:**
```tsx
// ABOUTME: Mobile-optimized selection component using bottom sheet pattern
// ABOUTME: Replaces tiny dropdowns with full-screen selection for better UX
export function MobileSelect() { ... }
```

---

## 🧪 Testing Instructions

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- components/forms/__tests__/ProgressiveForm.test.tsx

# Run in watch mode
npm test -- --watch

# Run with coverage
npm test -- --coverage
```

### Expected Test Output

```
PASS  components/forms/__tests__/MobileNumberInput.test.tsx
  MobileNumberInput
    ✓ should render with label (23ms)
    ✓ should trigger numeric keyboard on mobile (12ms)
    ✓ should format currency with prefix (18ms)
    ✓ should show error state when invalid (15ms)

Test Suites: 1 passed, 1 total
Tests:       4 passed, 4 total
Snapshots:   0 total
Time:        2.456s
```

### Manual Testing

After automated tests pass:

1. Open `http://localhost:3000/apply?loanType=new_purchase`
2. Test on mobile viewport: Chrome DevTools → Toggle device toolbar → iPhone 13
3. Verify touch targets: Element inspector → Should be ≥48px
4. Test keyboard types: Tap income field → Should show numeric keyboard
5. Test session restore: Fill form partially → Reload page → Data should persist

---

## ⚠️ Common Pitfalls & Solutions

### Pitfall 1: Confusing Gates with Steps
```tsx
// ❌ WRONG
currentStep, nextStep(), previousStep()

// ✅ RIGHT
currentGate, advanceGate(), returnToGate(0)
```

### Pitfall 2: Wrong Input Type
```tsx
// ❌ WRONG
<input type="number" />

// ✅ RIGHT
<input type="text" inputMode="numeric" />
```

### Pitfall 3: Missing ABOUTME Comments
```tsx
// ❌ WRONG
export function MobileSelect() { ... }

// ✅ RIGHT
// ABOUTME: Mobile-optimized selection component using bottom sheet pattern
// ABOUTME: Replaces tiny dropdowns with full-screen selection for better UX
export function MobileSelect() { ... }
```

### Pitfall 4: Rounded Corners
```tsx
// ❌ WRONG
<button className="rounded-lg bg-[#FCD34D]">Continue</button>

// ✅ RIGHT
<button className="bg-[#FCD34D]">Continue</button>
```

### Pitfall 5: Mocking Calculation Engine
```tsx
// ❌ WRONG
jest.mock('@/lib/calculations/instant-profile')

// ✅ RIGHT
import { calculateInstantProfile } from '@/lib/calculations/instant-profile'
const result = calculateInstantProfile(fixtureData)
expect(result.maxLoanAmount).toBe(400000)
```

---

## 🔧 Troubleshooting

### Problem: "Module not found: @/lib/..."
**Cause:** TypeScript path alias not resolved
**Solution:** Restart TypeScript server in VSCode: Cmd+Shift+P → "TypeScript: Restart TS Server"

### Problem: "localStorage is not defined"
**Cause:** Server-side rendering (SSR) doesn't have localStorage
**Solution:** Check `typeof window !== 'undefined'` before accessing localStorage

### Problem: Tests fail with "Cannot find module 'react-hook-form'"
**Cause:** Missing dev dependencies
**Solution:** `npm install` then `npm test`

### Problem: Bundle size increased by >50KB
**Cause:** Accidentally imported heavy library
**Solution:** Run `ANALYZE=true npm run build` to identify culprit, remove import

### Problem: Touch targets too small on mobile
**Cause:** Forgot to set explicit height
**Solution:** Add `h-12` or `h-14` class (48px or 56px minimum)

---

## 🆘 Getting Help

If stuck after trying troubleshooting:

1. Check existing implementations in `components/forms/` directory
2. Search codebase: `grep -r "useForm" components/`
3. Read canonical docs: `docs/runbooks/FORMS_ARCHITECTURE_GUIDE.md`
4. Ask Brent with specific context: "I'm implementing X, tried Y, got error Z"

---

**Ready to start?** → [Return to Index](./00-INDEX.md) or [Begin Task 2](./tasks/task-2-conditional-fields.md)
