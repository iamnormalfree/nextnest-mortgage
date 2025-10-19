# Lead Form to Chat Handoff Implementation Guide

**ABOUTME:** Comprehensive implementation guide for NextNest lead form to AI broker chat handoff system.
**ABOUTME:** Covers architecture, technology stack, testing strategies, and troubleshooting for Singapore mortgage lead capture flow.

---

## Context for New Engineers

### What Is This Project?

NextNest is a mortgage lead capture website for the Singapore market. The core user flow is:

1. User fills out a 4-step progressive form about their mortgage needs
2. Form provides instant mortgage calculations powered by Dr Elena v2 (a persona-driven calculation engine)
3. User transitions to live chat with an AI mortgage specialist (via Chatwoot)
4. AI specialist helps user through their mortgage journey

### Key Technical Concepts

- **Progressive Form**: 4-step form that builds trust through progressive disclosure
- **Dr Elena v2 Persona**: Calculation engine with persona-driven reason codes that must be translated to user-friendly language
- **Instant Calculation**: Real-time mortgage calculations shown as user fills property details
- **MAS Compliance**: Singapore Monetary Authority regulations for TDSR/MSR
- **ChatTransitionScreen**: Loading screen after Step 4, creates Chatwoot contact, redirects to chat

## Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Forms**: React Hook Form + Zod validation
- **State**: React hooks (no Redux/Zustand)
- **Styling**: Tailwind CSS (90 percent monochrome + 10 percent yellow accent, sharp rectangles)
- **Chat**: Chatwoot integration via /api/chatwoot-contact-from-lead endpoint
- **Testing**: Jest + React Testing Library

## File Structure

Key files:
- app/apply/page.tsx - Main form page route
- components/forms/ProgressiveFormWithController.tsx - Main form component (UI layer, ~1500 LOC)
- components/forms/ChatTransitionScreen.tsx - Transition screen to chat (~150 LOC)
- components/forms/sections/Step3NewPurchase.tsx - Step 3 property details
- hooks/useProgressiveFormController.ts - Form state controller (business logic, ~700 LOC)
- lib/calculations/instant-profile.ts - Dr Elena v2 calculation engine (~900 LOC)
- lib/forms/form-config.ts - Form step definitions and defaults (~300 LOC)
- lib/contracts/form-contracts.ts - TypeScript interfaces for form data
- lib/validation/mortgage-schemas.ts - Zod validation schemas

## Development Principles

From CLAUDE.md:

1. **TDD**: Write failing test, make it pass, refactor
2. **DRY**: Refactor duplication even if tedious
3. **YAGNI**: Do not add features we do not need right now
4. **Frequent Commits**: Commit after each passing test
5. **NO shortcuts**: Doing it right over doing it fast

## Testing Strategies

### Manual Testing Checklist

- Chat transition appears after Step 4
- Instant analysis shows big number, plain English
- Age pre-fills from Step 2 to Step 4
- MAS Readiness updates live
- No loans path is one click

### Automated Testing

Run tests:
- npm test
- npm test -- components/forms/__tests__
- npm test -- --watch

Mock ChatTransitionScreen to avoid Chatwoot API calls in tests.

### Performance Testing

- npm run build
- npm run analyze

Target: Bundle less than 140KB gzipped, Lighthouse score over 90

## FAQ

### Q: What is Dr Elena v2?

Persona-driven mortgage calculation engine in lib/calculations/instant-profile.ts. Outputs numeric results, reason codes, and policy references. Always translate reason codes to plain English for users.

### Q: Why is the form so complex?

Singapore mortgage regulations: TDSR (55 percent cap), MSR (30 percent for HDB/EC), LTV (75 percent first, 45 percent second), CPF usage restrictions, tenure limits (25yr HDB, 35yr private).

### Q: What happens after form completion?

ChatTransitionScreen shows loading, calls /api/chatwoot-contact-from-lead, stores form data in contact attributes, redirects to Chatwoot chat, AI broker receives data via n8n automation.

### Q: Why TDD for all tasks?

Per CLAUDE.md: prevents regressions, ensures code quality.

### Q: How to run one test?

npm test -- ChatTransition.test.tsx
npm test -- --testNamePattern "should show ChatTransitionScreen"
npm test -- --watch ChatTransition.test.tsx

### Q: Can I skip tests for quick fixes?

No. Per CLAUDE.md - every non-trivial change needs tests.

## Troubleshooting

### ChatTransitionScreen Never Appears

Common causes: currentStep index mismatch, form validation errors, JavaScript errors.
Debug by adding logging to onFormComplete callback.

### MAS Readiness Shows 0.0 percent

Common causes: Missing fields, calculation errors, debounce delay (500ms).
Debug by logging calculation trigger.

### Age Not Pre-filling

Common causes: combinedAge not stored, setValue not called, joint applicant logic error.
Debug by logging next() callback.

### Test Failures

Common causes: Missing mocks, async timing issues, form validation.
Debug with screen.debug() to see DOM state.

## Related Plans

- Active Plan: docs/plans/active/2025-11-01-lead-form-chat-handoff-optimization-plan.md

**Last Updated**: 2025-10-19
**Maintainer**: NextNest Development Team
