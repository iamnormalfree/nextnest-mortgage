# Path2 Lead Form Optimization - Documentation Index

**Status:** Supporting documentation for main Path2 plan
**Main Plan:** `../2025-10-17-lead-form-conversion-optimization-path2.md`

---

## Purpose

This directory contains **reference materials** and **testing templates** extracted from the main Path2 plan to reduce cognitive load. Engineers implementing Path2 tasks can reference these focused documents instead of searching through the 2,200-line main plan.

---

## Directory Structure

```
path2-lead-form-optimization/
├── README.md (this file)
├── reference/
│   ├── amendment-existing-storage.md
│   ├── design-system-rules.md
│   ├── singapore-mortgage-context.md
│   └── success-metrics.md
└── testing/
    ├── unit-test-template.md
    ├── integration-test-template.md
    └── e2e-test-scenarios.md
```

---

## Reference Files

### 1. Design System Rules
**File:** `reference/design-system-rules.md`
**Lines:** 85 lines
**Purpose:** Design constraints for mobile-first form components

**Contents:**
- Color palette (monochrome + yellow accent)
- Typography rules (allowed font weights)
- Border radius policy (sharp rectangles only)
- "Rule of One" for CTAs
- Touch target minimums (48px WCAG)
- Forbidden libraries (framer-motion)

**When to use:**
- Before creating any UI component
- When reviewing component designs
- During pre-commit code quality checks

---

### 2. Singapore Mortgage Context
**File:** `reference/singapore-mortgage-context.md`
**Lines:** 95 lines
**Purpose:** Domain knowledge for engineers unfamiliar with Singapore property market

**Contents:**
- Property types (HDB, EC, Private, Landed)
- Loan types (New Purchase, Refinance, Equity Loan)
- Typical buyer demographics (age, income, property choice)
- MAS regulations (TDSR ≤55%, MSR ≤30%, LTV limits)
- Market data Q3 2024 (property prices, interest rates)
- Glossary (CPF, ABSD, MOP, SORA, etc.)

**When to use:**
- Before implementing smart defaults
- When writing validation logic
- When creating test fixtures
- When explaining form fields to non-Singaporean engineers

---

### 3. Success Metrics
**File:** `reference/success-metrics.md`
**Lines:** 102 lines
**Purpose:** Define measurable outcomes for Path2 features

**Contents:**
- Mobile conversion rate (+40% target)
- Fields shown per user (8-10 target)
- Session restoration rate (>30% target)
- Smart default acceptance (>70% target)
- A/B test winner criteria (>10% lift)
- Rollout decision framework

**When to use:**
- Setting up analytics tracking
- Defining A/B test experiments
- Making rollout decisions (10% → 25% → 50% → 100%)
- Writing weekly progress reports

---

### 4. Amendment: Existing Storage Solutions
**File:** `reference/amendment-existing-storage.md`
**Lines:** 107 lines
**Purpose:** CRITICAL - Explains why NOT to create new storage hooks

**Contents:**
- Existing solutions inventory (969 lines of battle-tested code)
- What NOT to create (useFormSession.ts, useOfflineQueue.ts, OfflineIndicator.tsx)
- What to use instead (useLoanApplicationStorage, session-manager, /api/forms/analyze)
- Code examples showing integration

**When to use:**
- BEFORE starting Task 3 (Session Persistence)
- When tempted to create new storage hooks
- When reviewing PRs for redundant code

---

## Testing Templates

### 1. Unit Test Template
**File:** `testing/unit-test-template.md`
**Lines:** 175 lines
**Purpose:** Generic template for testing form components and utilities

**Contents:**
- Template 1: Pure functions (TypeScript)
- Template 2: React components (TSX)
- Template 3: React hooks
- Common patterns (snapshots, async, error boundaries)
- Running tests commands

**When to use:**
- Writing tests for smart-defaults.ts
- Testing MobileNumberInput.tsx
- Testing useFieldVisibility.ts hook

**Example usage:**
```bash
# Copy template structure
# Replace function names and test cases
# Run: npm test -- smart-defaults.test.ts
```

---

### 2. Integration Test Template
**File:** `testing/integration-test-template.md`
**Lines:** 185 lines
**Purpose:** Test interactions between components and form state

**Contents:**
- Template 1: Form field interactions
- Template 2: Conditional field logic
- Template 3: Session persistence
- Template 4: Real calculation engine tests (NO MOCKS)

**When to use:**
- Testing ProgressiveFormWithController
- Testing conditional field visibility
- Testing form persistence across page reloads
- Testing Dr Elena v2 calculations with real data

**Example usage:**
```bash
# Run integration tests only
npm test -- --testPathPattern=Integration
```

---

### 3. E2E Test Scenarios
**File:** `testing/e2e-test-scenarios.md`
**Lines:** 231 lines
**Purpose:** End-to-end testing of mobile form experience

**Contents:**
- Scenario 1: Complete mobile flow (happy path)
- Scenario 2: Conditional field visibility
- Scenario 3: Session persistence & restoration
- Scenario 4: Touch interactions & swipe navigation
- Scenario 5: A/B test variant rendering
- Helper functions

**When to use:**
- Testing on real mobile devices (iPhone 13)
- Verifying touch target sizes (≥48px)
- Testing session restore after page reload
- Validating A/B test variant rendering

**Example usage:**
```bash
# Run E2E tests with UI mode
npx playwright test --ui

# Run on mobile device
npx playwright test --project='Mobile Chrome'
```

---

## Usage Workflow

### Before Starting Implementation

1. **Read main plan:** `../2025-10-17-lead-form-conversion-optimization-path2.md`
2. **Review reference docs:**
   - `reference/amendment-existing-storage.md` (CRITICAL for Task 3)
   - `reference/design-system-rules.md` (for UI tasks)
   - `reference/singapore-mortgage-context.md` (for smart defaults)
3. **Bookmark testing templates:** Use as copy-paste starting points

### During Implementation

- **Creating UI component?** → Check `design-system-rules.md`
- **Writing smart defaults?** → Reference `singapore-mortgage-context.md`
- **Adding session storage?** → STOP, read `amendment-existing-storage.md`
- **Writing tests?** → Copy relevant template from `testing/`

### After Implementation

- **Setting up analytics?** → Use events from `success-metrics.md`
- **Making rollout decision?** → Check thresholds in `success-metrics.md`

---

## Quick Links

| Document | Lines | Purpose |
|----------|-------|---------|
| [Main Plan](../2025-10-17-lead-form-conversion-optimization-path2.md) | 2,219 | Complete implementation guide |
| [Design System](reference/design-system-rules.md) | 85 | UI component constraints |
| [SG Mortgage Context](reference/singapore-mortgage-context.md) | 95 | Domain knowledge |
| [Success Metrics](reference/success-metrics.md) | 102 | Measurable outcomes |
| [Storage Amendment](reference/amendment-existing-storage.md) | 107 | Use existing solutions |
| [Unit Tests](testing/unit-test-template.md) | 175 | Component test templates |
| [Integration Tests](testing/integration-test-template.md) | 185 | Form interaction tests |
| [E2E Tests](testing/e2e-test-scenarios.md) | 231 | Mobile flow scenarios |

---

## File Size Summary

**Reference Files:** 387 lines total
- design-system-rules.md: 85 lines
- singapore-mortgage-context.md: 95 lines
- success-metrics.md: 102 lines
- amendment-existing-storage.md: 107 lines

**Testing Templates:** 591 lines total
- unit-test-template.md: 175 lines
- integration-test-template.md: 185 lines
- e2e-test-scenarios.md: 231 lines

**Total Documentation:** 978 lines
**Main Plan:** 2,219 lines

**Reduction:** Engineers can reference ~400-line focused docs instead of searching 2,200-line main plan.

---

## Maintenance

**When to update these files:**
- Design system changes → Update `design-system-rules.md`
- New market data (quarterly) → Update `singapore-mortgage-context.md`
- Metrics thresholds change → Update `success-metrics.md`
- New storage solutions added → Update `amendment-existing-storage.md`
- New testing patterns discovered → Add to relevant template

**Owner:** Path2 implementation team
**Last Updated:** 2025-10-17
