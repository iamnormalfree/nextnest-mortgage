<!-- ABOUTME: Decision tree for determining correct file placement for components, pages, and tests in NextNest -->
<!-- Extracted from CLAUDE.md 2025-10-19 to improve findability and reduce main file length -->

# Component Placement Decision Tree

**Before creating ANY file in app/ or components/, answer these questions:**

This guide helps you determine the correct location for new files in the NextNest codebase. Follow the questions in order to find the right placement for your component, page, or test file.

> **Reference:** This content is extracted from [CLAUDE.md](../CLAUDE.md) and should be kept in sync with the main ruleset.

---

## Question 1: Is this a test/development page?

- **YES** → Create in `app/_dev/[feature-name]/page.tsx`
  - Underscore prefix excludes from production builds
  - Examples: `app/_dev/test-mobile/`, `app/_dev/test-broker/`
- **NO** → Continue to Question 2

---

## Question 2: Is this experimental/in-progress code?

- **YES** → Create in `components/archive/YYYY-MM/[experiment-name]/`
  - Use date format: `2025-10`, `2025-11`
  - Add README explaining the experiment
- **NO** → Continue to Question 3

---

## Question 3: Is this a production page route?

- **YES** → Create in `app/[route-name]/page.tsx`
  - ✅ Allowed: `app/apply/`, `app/calculator/`, `app/chat/`
  - ❌ Forbidden: `app/test-*`, `app/temp-*`, `app/*.backup.tsx`
- **NO** → Continue to Question 4

---

## Question 4: Is this a reusable component?

- **YES** → Determine folder based on purpose:
  - **UI primitives** → `components/ui/[component-name].tsx` (Shadcn/ui components)
  - **Layout components** → `components/layout/[component-name].tsx` (Footer, Header, Nav)
  - **Landing page sections** → `components/landing/[SectionName].tsx` (Hero, Services, CTA)
  - **Shared utilities** → `components/shared/[component-name].tsx` (ErrorBoundary, icons, AnimatedCounter)
  - **Forms** → `components/forms/[component-name].tsx`
  - **Form sections** → `components/forms/sections/[section-name].tsx`
  - **Mobile forms** → `components/forms/mobile/[component-name].tsx`
  - **AI Broker** → `components/ai-broker/[component-name].tsx`
  - **Chat** → `components/chat/[component-name].tsx`
  - **Analytics** → `components/analytics/[component-name].tsx`
  - **Calculators** → `components/calculators/[component-name].tsx`
- **NO** → STOP - Reconsider if you need this file

---

## Question 5: Where do tests go?

- **Component tests** → `components/[folder]/__tests__/[ComponentName].test.tsx`
- **Integration tests** → `tests/[domain]/[feature].test.ts`
- **E2E tests** → `tests/e2e/[flow].test.ts`
- **Test fixtures** → `tests/fixtures/[data-set].ts`

---

## Question 6: What about backup files?

- **NEVER commit .backup.tsx files** - Use git history instead (`git show HEAD~1:path/to/file.tsx`)
- **Alternative implementation?** → Archive to `components/archive/YYYY-MM/[descriptive-name].tsx`

---

## Forbidden Patterns

- ❌ `app/test-*` pages (use `app/_dev/` instead)
- ❌ `app/temp-*` pages (use `app/_dev/` or delete)
- ❌ `*.backup.tsx` files (use git history)
- ❌ Top-level components without clear domain (organize into subfolders)
- ❌ Random subfolders without 3+ related files

---

## Quick Reference Matrix

| File Type | Correct Location | Wrong Location |
|-----------|-----------------|----------------|
| Dev/test page | `app/_dev/test-feature/` | `app/test-feature/` |
| Experiment | `components/archive/2025-10/experiment/` | `components/experiment/` |
| Production route | `app/apply/page.tsx` | `app/temp-apply.tsx` |
| UI component | `components/ui/button.tsx` | `components/button.tsx` |
| Form component | `components/forms/SignupForm.tsx` | `components/SignupForm.tsx` |
| Component test | `components/forms/__tests__/SignupForm.test.tsx` | `tests/SignupForm.test.tsx` |
| Integration test | `tests/forms/signup-flow.test.ts` | `components/__tests__/signup-flow.test.ts` |

---

**Last Updated:** 2025-10-19  
**Source:** [CLAUDE.md](../CLAUDE.md) lines 126-179
