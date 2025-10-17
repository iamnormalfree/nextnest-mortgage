# CANONICAL_REFERENCES.md

**Last Updated:** 2025-10-17
**Purpose:** Defines Tier 1 files (canonical source of truth) and rules for modifying them

---

## What is Tier 1?

**Tier 1 files are the canonical source of truth** - actual production code that documentation should reference but never duplicate.

**The 3-Tier Documentation System:**
- **Tier 1:** Code (this file) - THE source of truth
- **Tier 2:** Runbooks in `docs/runbooks/` - Implementation guides that LINK to Tier 1 code
- **Tier 3:** Plans in `docs/plans/` - <200 lines, reference runbooks, archived after completion

**Rule:** Before modifying ANY file listed below, check its specific rules in this document.

---

## Production Forms (Tier 1)

### Primary Form
**File:** `components/forms/ProgressiveFormWithController.tsx`
**Purpose:** 3-step progressive mortgage application (Who You Are → What You Need → Your Finances)
**Status:** ✅ PRODUCTION
**Used by:** `/app/apply/page.tsx`

**Allowed Changes:**
- Bug fixes to form logic
- New field additions (must update form-contracts.ts first)
- UI/UX improvements
- Chatwoot integration enhancements

**Forbidden Changes:**
- Do NOT rename step structure (step 0/1/2/3 is canonical)
- Do NOT change calculation integration without updating instant-profile.ts
- Do NOT duplicate this form - use responsive CSS for mobile instead

**Dependencies:**
- `lib/contracts/form-contracts.ts` (interfaces)
- `lib/calculations/instant-profile.ts` (calculations)
- `lib/forms/form-config.ts` (field configuration)
- `hooks/useProgressiveFormController.ts` (state management)

---

### Form Section Components

**File:** `components/forms/sections/Step3NewPurchase.tsx`
**Purpose:** Financial details for new purchase scenarios
**Allowed Changes:** Field additions, validation rules, UI improvements
**Forbidden Changes:** Do NOT change InstantProfileInput interface without updating contracts

**File:** `components/forms/sections/Step3Refinance.tsx`
**Purpose:** Financial details for refinance scenarios
**Allowed Changes:** Field additions, validation rules, UI improvements
**Forbidden Changes:** Do NOT change RefinanceOutlookInput interface without updating contracts

---

### Chat Transition

**File:** `components/forms/ChatTransitionScreen.tsx`
**Purpose:** Handoff from form completion to Chatwoot broker chat
**Allowed Changes:** Transition UI/animation improvements, loading states
**Forbidden Changes:** Do NOT change Chatwoot integration logic without testing broker handoff

**File:** `components/forms/ChatWidgetLoader.tsx`
**Purpose:** Async loader for chat widget
**Allowed Changes:** Loading optimization, error handling
**Forbidden Changes:** Do NOT change widget injection logic

---

## Calculation Engine (Tier 1)

### Primary Calculator - Dr Elena v2

**File:** `lib/calculations/instant-profile.ts`
**Purpose:** Main calculator aligned with Dr Elena v2 persona - TDSR, MSR, LTV, down payment
**Status:** ✅ PRODUCTION
**Used by:** ProgressiveFormWithController, Step 3 sections

**Key Functions:**
- `calculateInstantProfile()` - Core loan eligibility
- `calculateComplianceSnapshot()` - TDSR/MSR compliance
- `calculateRefinanceOutlook()` - Refinance analysis
- `calculateRecognizedIncome()` - MAS Notice 645 income rules

**Allowed Changes:**
- Bug fixes in calculation logic
- New regulation updates from MAS
- Rounding rule improvements (must be client-protective)
- Performance optimizations

**Forbidden Changes:**
- Do NOT change rounding strategy without Dr Elena v2 approval (loans DOWN, payments UP, funds UP)
- Do NOT add calculations without corresponding constants in dr-elena-constants.ts
- Do NOT modify interfaces without updating form-contracts.ts
- Do NOT change stress test rates without MAS Notice 632 verification

**Testing Required:**
- Update `tests/calculations/instant-profile.test.ts`
- Update `tests/dr-elena-v2-regulation.test.ts`
- Verify against Dr Elena v2 scenarios in `tests/fixtures/dr-elena-v2-scenarios.ts`

---

### Constants Module

**File:** `lib/calculations/dr-elena-constants.ts`
**Purpose:** All MAS regulatory constants, sourced from `dr-elena-mortgage-expert-v2.json`
**Status:** ✅ PRODUCTION

**Key Constants:**
- `DR_ELENA_LTV_LIMITS` - LTV by property count and citizenship
- `DR_ELENA_STRESS_TEST_FLOORS` - 4% residential, 5% commercial
- `DR_ELENA_INCOME_RECOGNITION` - Income recognition rates by type
- `DR_ELENA_CPF_USAGE_RULES` - CPF withdrawal and accrued interest
- `DR_ELENA_POLICY_REFERENCES` - MAS Notice numbers

**Allowed Changes:**
- Updates when MAS regulations change (with documentation)
- New constant additions for new calculation features

**Forbidden Changes:**
- Do NOT modify values without verifying against official MAS notices
- Do NOT add constants without updating dr-elena-mortgage-expert-v2.json first
- Do NOT change constant names (breaking change for all consumers)

---

### Legacy Calculators (NOT Canonical)

**File:** `lib/calculations/archive/2025-10/dr-elena-mortgage.ts`
**Status:** ❌ ARCHIVED (2025-10-17)
**Reason:** Superseded by instant-profile.ts with adapter pattern for backward compatibility
**Action:** Do NOT use for new code. Existing adapters in dr-elena-integration-service.ts provide compatibility.

**File:** `types/mortgage.ts` (legacy interfaces)
**Status:** ⚠️ LEGACY
**Action:** New code should use `lib/contracts/form-contracts.ts` instead

---

## Form Contracts & Types (Tier 1)

**File:** `lib/contracts/form-contracts.ts`
**Purpose:** Form-first domain contracts - source of truth for form architecture
**Status:** ✅ PRODUCTION

**Key Types:**
- `LoanType = 'new_purchase' | 'refinance' | 'commercial'`
- `FormState`, `FormStep` (0/1/2/3)
- `InstantProfileInput`, `InstantProfileResult`
- `RefinanceOutlookInput`, `RefinanceOutlookResult`

**Allowed Changes:**
- New field additions (must update form components)
- New validation rules
- Type refinements for better type safety

**Forbidden Changes:**
- Do NOT change LoanType values (breaking change)
- Do NOT rename existing fields (breaking change)
- Do NOT change step numbers (0/1/2/3 is canonical architecture)

**Change Process:**
1. Update contracts first
2. Update instant-profile.ts calculations
3. Update form components
4. Update tests
5. Build and verify

---

## Form Configuration (Tier 1)

**File:** `lib/forms/form-config.ts`
**Purpose:** Form step definitions, field mappings, property options
**Status:** ✅ PRODUCTION

**Exports:**
- `formSteps` - Step 0/1/2/3 configuration
- `propertyCategoryOptions` - Property type options
- `getPropertyTypeOptions()` - Dynamic options by loan type

**Allowed Changes:**
- New property type options
- New field configurations
- Step metadata updates

**Forbidden Changes:**
- Do NOT change step order (0 → 1 → 2 → 3 is canonical)
- Do NOT remove existing property types without migration plan

---

## Event Bus (Tier 1)

**File:** `lib/events/event-bus.ts`
**Purpose:** Form event publishing and subscription for analytics
**Status:** ✅ PRODUCTION

**Event Types:**
- `FIELD_CHANGED`, `STEP_COMPLETED`, `VALIDATION_ERROR`
- `CALCULATION_TRIGGERED`, `CHAT_HANDOFF`

**Allowed Changes:**
- New event types
- Event metadata enrichment
- Performance optimizations

**Forbidden Changes:**
- Do NOT change existing event payload structures (breaking change)
- Do NOT remove events without deprecation period

---

## Hooks (Tier 1)

**File:** `hooks/useProgressiveFormController.ts`
**Purpose:** Headless form state management for ProgressiveFormWithController
**Status:** ✅ PRODUCTION

**Allowed Changes:**
- Bug fixes to state management
- New state helpers
- Performance optimizations

**Forbidden Changes:**
- Do NOT change hook return signature (breaking change for form)
- Do NOT modify step progression logic without form component updates

**File:** `lib/hooks/useLoanApplicationContext.tsx`
**Purpose:** Global application state for loan journey
**Status:** ⚠️ CHECK USAGE BEFORE CHANGES

---

## AI Broker Components (Tier 1)

**File:** `components/ai-broker/MobileAIAssistantCompact.tsx`
**Purpose:** Production mobile AI broker chat interface
**Status:** ✅ PRODUCTION
**Used by:** `components/ai-broker/ResponsiveBrokerShell.tsx`

**Allowed Changes:**
- UI/UX improvements
- New insight card types
- Performance optimizations

**Forbidden Changes:**
- Do NOT change component props without updating ResponsiveBrokerShell
- Do NOT remove existing features (leads to feature parity issues)

**Note:** See `components/ai-broker/README.md` for variant documentation

---

## Design System (Tier 1)

**File:** `tailwind.config.ts`
**Purpose:** Single source of truth for design tokens (NextNest + Bloomberg merged)
**Status:** ✅ PRODUCTION

**Color Systems:**
- **NextNest Brand:** nn-gold, nn-blue, nn-purple, nn-red, nn-green (11 colors)
- **Bloomberg:** ink, charcoal, graphite, silver, pearl, fog, mist, gold×3, emerald, ruby (12 colors)

**Allowed Changes:**
- New color tokens (with design approval)
- New utility classes
- Typography scale additions

**Forbidden Changes:**
- Do NOT change existing color hex values (breaking change for all components)
- Do NOT remove Bloomberg colors (used by 40+ files)
- Do NOT remove NextNest colors (used by 11+ files)

**Note:** `tailwind.bloomberg.config.ts.archived` contains historical Bloomberg-only config

---

## Database Types (Tier 1)

**File:** `lib/db/types/database.types.ts`
**Purpose:** Supabase auto-generated types
**Status:** ✅ AUTO-GENERATED

**Allowed Changes:**
- NONE - File is auto-generated from Supabase schema

**Forbidden Changes:**
- Do NOT edit manually
- Do NOT commit manual changes

**Process for changes:**
1. Update Supabase schema via migrations
2. Regenerate types: `npm run db:types`
3. Commit generated file

---

## Configuration Files (Tier 1)

**File:** `package.json`
**Purpose:** Dependency versions and scripts
**Status:** ✅ PRODUCTION

**Allowed Changes:**
- Dependency updates (with testing)
- New script additions
- DevDependency updates

**Forbidden Changes:**
- Do NOT change major versions without thorough testing
- Do NOT remove scripts without checking usage

**File:** `next.config.js`
**Purpose:** Next.js build and runtime configuration
**Status:** ✅ PRODUCTION

**Allowed Changes:**
- Build optimizations
- Environment variable configuration
- Route rewrites/redirects

**Forbidden Changes:**
- Do NOT change webpack config without verifying bundle size
- Do NOT modify image optimization settings without testing

---

## API Routes (Tier 1)

**Critical Endpoints:**

| Route | Purpose | Change Rules |
|-------|---------|-------------|
| `/api/forms/analyze` | Form data analysis | Do NOT change request/response schema without form updates |
| `/api/ai-insights` | AI-generated insights | Do NOT change without testing chat integration |
| `/api/chatwoot-webhook` | Chatwoot webhook receiver | Do NOT change without n8n workflow updates |
| `/api/chat/send` | Chat message sending | Do NOT change without Chatwoot API verification |
| `/api/compliance/report` | MAS compliance checking | Do NOT change without regulation verification |

---

## Change Process for Tier 1 Files

**Before modifying ANY Tier 1 file:**

1. **Check this file** for specific rules
2. **Read the file's ABOUTME comment** (first 2 lines)
3. **Verify dependencies** listed in this document
4. **Write tests first** (TDD for all Tier 1 changes)
5. **Update documentation** (runbooks/plans that reference it)
6. **Build and test** before committing

**If you need to:**
- **Add a field:** Update contracts → calculations → form → tests
- **Change calculations:** Update constants → calculation → tests → verify against Dr Elena v2
- **Modify forms:** Update form → controller → contracts → tests
- **Update API:** Update route → client → types → tests

---

## Archived Files (DO NOT USE)

### Recently Archived (2025-10-17)
- `components/calculators/archive/2025-10/SingaporeMortgageCalculator.tsx` - Use ProgressiveFormWithController instead
- `components/forms/archive/2025-10/ProgressiveForm.tsx` - Gate-based form (use step-based ProgressiveFormWithController)
- `components/forms/archive/2025-10/ProgressiveFormMobile.tsx` - Separate mobile form (use responsive ProgressiveFormWithController)
- `lib/calculations/archive/2025-10/dr-elena-mortgage.ts` - Legacy calculator (use instant-profile.ts)
- `app/archive/2025-10/validation-dashboard` - Internal debugging tool
- `app/archive/2025-10/api/generate-report` - Dead endpoint

### Config Archives
- `tailwind.bloomberg.config.ts.archived` - Bloomberg tokens now merged into main tailwind.config.ts

---

## Questions?

**Before making changes:**
1. Check this file for rules
2. Read `CLAUDE.md` for general code standards
3. Read relevant `docs/runbooks/` for implementation guidance
4. Ask Brent if unsure

**After making changes:**
1. Update this file if you added new Tier 1 files
2. Update relevant runbooks if implementation changed
3. Archive old plans if feature is complete
