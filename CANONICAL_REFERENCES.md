# CANONICAL_REFERENCES.md

**Last Updated:** 2025-10-18
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

## Landing Page & Layout Components (Tier 1)

### Layout Components

**File:** `components/layout/ConditionalNav.tsx`
**Purpose:** Root navigation component with conditional rendering based on route
**Status:** ✅ PRODUCTION - CRITICAL
**Used by:** `app/layout.tsx` (root layout)

**Allowed Changes:**
- Navigation links and menu items
- Mobile responsiveness improvements
- Authentication state handling

**Forbidden Changes:**
- Do NOT remove from root layout without replacement navigation
- Do NOT change component export name (breaks root layout)
- Do NOT add dependencies that increase bundle size significantly

**File:** `components/layout/Footer.tsx`
**Purpose:** Site footer with legal links
**Status:** ✅ PRODUCTION
**Used by:** `app/page.tsx`

**Allowed Changes:**
- Footer content and links
- Social media integrations
- Legal text updates

**Forbidden Changes:**
- Do NOT remove PDPA/compliance links without legal approval

---

### Landing Page Sections

**Files:**
- `components/landing/HeroSection.tsx` - Homepage hero with value proposition
- `components/landing/ServicesSection.tsx` - Service offerings with tabs
- `components/landing/ContactSection.tsx` - Lead capture form
- `components/landing/CTASection.tsx` - Call-to-action section
- `components/landing/LoanTypeSection.tsx` - Loan type selection cards
- `components/landing/FeatureCards.tsx` - Feature highlights grid
- `components/landing/StatsSection.tsx` - Animated statistics display

**Purpose:** Homepage sections composed in `app/page.tsx`
**Status:** ✅ PRODUCTION
**Used by:** `app/page.tsx`

**Allowed Changes:**
- Content updates (copy, metrics, features)
- Design improvements (colors, spacing, animations)
- A/B testing variants

**Forbidden Changes:**
- Do NOT remove sections without updating app/page.tsx
- Do NOT change component export names (breaks page composition)
- Do NOT add heavy dependencies (target <140KB bundle)

**Dependencies:**
- `components/shared/AnimatedCounter.tsx` - Used by HeroSection, StatsSection
- `components/shared/icons.tsx` - Used by HeroSection, ServicesSection

---

### Shared Utilities

**File:** `components/shared/AnimatedCounter.tsx`
**Purpose:** Number animation component for metrics display
**Status:** ✅ PRODUCTION
**Used by:** HeroSection, StatsSection, FeatureCards

**Props Interface:**
```typescript
{
  end: number
  duration?: number
  prefix?: string
  suffix?: string
}
```

**Allowed Changes:**
- Animation easing functions
- Performance optimizations
- Additional formatting options

**Forbidden Changes:**
- Do NOT change prop interface (breaking change for 3 consumers)
- Do NOT add dependencies (keep lightweight)

---

**File:** `components/shared/ErrorBoundary.tsx`
**Purpose:** React error boundary for graceful error handling
**Status:** ✅ PRODUCTION
**Used by:** Root layout and critical pages

**Allowed Changes:**
- Error UI improvements
- Error reporting integration
- Fallback component enhancements

**Forbidden Changes:**
- Do NOT remove error catching (breaks error handling)
- Do NOT log sensitive user data

---

**File:** `components/shared/icons.tsx`
**Purpose:** Icon library for landing page components
**Status:** ✅ PRODUCTION
**Used by:** HeroSection, ServicesSection

**Exports:**
- `Clock`, `Users`, `Star` - Used by HeroSection
- `CheckCircle`, `Shield`, `TrendingUp` - Used by ServicesSection

**Allowed Changes:**
- New icon additions
- SVG optimization
- Accessibility improvements (aria-labels)

**Forbidden Changes:**
- Do NOT remove exported icons without checking usage
- Do NOT change icon names (breaking change)

---

**File:** `components/shared/ChatwootWidget.tsx`
**Purpose:** Chatwoot chat widget loader
**Status:** ✅ PRODUCTION
**Used by:** Chat integration flows

**Allowed Changes:**
- Widget configuration options
- Loading optimization
- Position customization

**Forbidden Changes:**
- Do NOT change Chatwoot API integration without testing
- Do NOT modify widget ID or account settings

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

---

## Folder Structure Standards (Tier 1)

**This section defines the canonical folder organization rules. Check here before creating new folders or files.**

### app/ Directory Structure

**Production Routes** (public-facing):
- `app/page.tsx` - Homepage landing
- `app/layout.tsx` - Root layout with metadata
- `app/globals.css` - Global styles
- `app/sitemap.ts` - SEO sitemap generation

**Feature Routes:**
- `app/apply/` - Main mortgage application flow (ProgressiveFormWithController)
- `app/apply/insights/` - Post-submission AI insights & chat
- `app/calculator/` - Mortgage calculator pages
- `app/calculators/` - Calculator variants (TDSR, affordability)
- `app/chat/` - Broker chat interface
- `app/analytics/` - Analytics dashboard
- `app/compliance/` - Compliance reporting
- `app/dashboard/` - User dashboard
- `app/campaigns/` - Marketing campaign landing pages
- `app/pdpa/` - Privacy policy
- `app/system-status/` - System health monitoring

**API Routes:**
- `app/api/forms/` - Form processing endpoints
- `app/api/ai-insights/` - AI insights generation
- `app/api/analytics/` - Analytics tracking
- `app/api/chat/` - Chat message handling
- `app/api/chatwoot-*/` - Chatwoot integration webhooks
- `app/api/compliance/` - Compliance report generation
- `app/api/health/` - Health check endpoints

**Development Routes** (excluded from production builds):
- `app/_dev/test-mobile/` - Mobile testing harness
- `app/_dev/[feature]/` - Any experimental/testing pages
- **Rule:** Underscore prefix (`_dev`) excludes from production builds

**Archives** (NOT built):
- `app/archive/YYYY-MM/[feature]/` - Archived production pages
- Example: `app/archive/2025-10/validation-dashboard/`

**Forbidden:**
- ❌ `app/test-*` - Use `app/_dev/` instead
- ❌ `app/temp-*` - Use `app/_dev/` or delete
- ❌ `app/*.backup.tsx` - Use git history

### components/ Directory Structure

**Design System Primitives:**
- `components/ui/` - Shadcn/ui components (button, input, card, select, etc.)

**Layout Components:**
- `components/layout/Footer.tsx` - Site footer
- `components/layout/ConditionalNav.tsx` - Conditional navigation
- `components/layout/Header.tsx` - Site header (if exists)

**Landing Page Sections:**
- `components/landing/HeroSection.tsx` - Homepage hero
- `components/landing/ServicesSection.tsx` - Services overview
- `components/landing/ContactSection.tsx` - Contact form section
- `components/landing/CTASection.tsx` - Call-to-action sections
- `components/landing/LoanTypeSection.tsx` - Loan type selection
- `components/landing/FeatureCards.tsx` - Feature highlights
- `components/landing/StatsSection.tsx` - Statistics showcase

**Shared Utilities:**
- `components/shared/AnimatedCounter.tsx` - Number animation component
- `components/shared/ErrorBoundary.tsx` - Error boundary wrapper
- `components/shared/icons.tsx` - Icon library
- `components/shared/ChatwootWidget.tsx` - Chatwoot widget loader

**Feature Domains:**
- `components/forms/` - Form components (Tier 1: ProgressiveFormWithController.tsx)
  - `components/forms/sections/` - Form step components (Step3NewPurchase.tsx, Step3Refinance.tsx)
  - `components/forms/mobile/` - Mobile-specific form components
  - `components/forms/__tests__/` - Form component tests
  - `components/forms/archive/` - Archived form experiments

- `components/ai-broker/` - AI broker components (Tier 1: MobileAIAssistantCompact.tsx)
- `components/chat/` - Chat UI components
- `components/analytics/` - Analytics visualization components
- `components/calculators/` - Calculator widget components
  - `components/calculators/archive/` - Archived calculators

**Archives:**
- `components/archive/YYYY-MM/[category]/` - Archived components
- Example: `components/archive/2025-10/examples/bloomberg-example.tsx`

**Component Organization Rules:**
1. **3+ related files** → Create subfolder
2. **Single utility** → Place in `shared/`
3. **Domain-specific** → Create domain folder
4. **UI primitive** → Use `ui/` (Shadcn components only)

### lib/ Directory Structure

**Tier 1 Files:**
- `lib/calculations/instant-profile.ts` - Dr Elena v2 calculator
- `lib/calculations/dr-elena-constants.ts` - MAS regulatory constants
- `lib/contracts/form-contracts.ts` - Form-first domain contracts
- `lib/forms/form-config.ts` - Form step definitions
- `lib/events/event-bus.ts` - Event publishing system

**Archives:**
- `lib/calculations/archive/2025-10/` - Archived calculators
- `lib/hooks/archive/` - Archived hooks

### hooks/ Directory Structure

**Tier 1 Hooks:**
- `hooks/useProgressiveFormController.ts` - Form state management

**Archives:**
- `hooks/archive/` - Archived hooks

### types/ Directory Structure

**Production Types:**
- `types/mortgage.ts` - Legacy mortgage types (use form-contracts.ts for new code)
- `types/forms.ts` - Form-specific types
- `types/api.ts` - API request/response types

### tests/ Directory Structure

**Test Organization:**
- `tests/calculations/` - Calculation engine tests
- `tests/dr-elena-v2-regulation.test.ts` - Dr Elena v2 regulatory compliance
- `tests/fixtures/` - Test data fixtures
- `tests/e2e/` - End-to-end tests (if exists)

**Component Tests:**
- Colocated with components: `components/[domain]/__tests__/`

### Git Worktree Location Standard

**Canonical Location:** `.worktrees/[branch-name]/`

**Purpose:** Parallel development workspaces sharing same .git directory

**Examples:**
- ✅ `.worktrees/fix-calculator-bug/` - Bug fix worktree
- ✅ `.worktrees/feature-email-validation/` - Feature worktree
- ✅ `.worktrees/test-production-issue/` - Testing worktree
- ❌ `worktrees/` - Missing dot prefix
- ❌ `.git/worktrees/` - Git internal directory (not for code)

**Naming Convention:**
- Use branch name as folder name (consistency)
- Lowercase with hyphens (no spaces, underscores)
- Descriptive: `fix-[bug]`, `feature-[name]`, `test-[scenario]`

**Git Configuration:**
- Entry in `.gitignore`: `.worktrees/`
- Managed via `git worktree` command (not manual file operations)
- Documented in: `docs/runbooks/devops/GIT_WORKTREE_WORKFLOW.md`

**Allowed Changes:**
- Create worktrees via `git worktree add .worktrees/[name] -b [branch]`
- Work on code inside worktree folders
- Remove worktrees via `git worktree remove .worktrees/[name]`

**Forbidden Changes:**
- Do NOT commit `.worktrees/` directory (in .gitignore)
- Do NOT manually create worktree folders (use git worktree command)
- Do NOT share worktrees between developers (each creates their own)
- Do NOT use other locations (`.worktrees/` is canonical)

**Related:**
- Tier 2: `docs/runbooks/devops/GIT_WORKTREE_WORKFLOW.md` - Complete workflow guide
- Agent: `.claude/agents/worktree-helper.md` - Automated worktree creation
- Config: `.claude/config/response-awareness-config.json` - Worktree integration settings

---

### Archive Folder Naming

**Canonical Format:** `YYYY-MM` (e.g., `2025-10`, `2025-11`)

**Examples:**
- ✅ `app/archive/2025-10/validation-dashboard/`
- ✅ `components/archive/2025-10/examples/`
- ✅ `lib/calculations/archive/2025-10/`
- ❌ `archive-oct-2025/` - Wrong format
- ❌ `old-stuff/` - Not date-based

### Enforcement Rules

**Before Creating ANY File:**
1. Check this section for folder structure rules
2. Use Component Placement Decision Tree (see CLAUDE.md)
3. Ask: "Is there an existing folder for this domain?"
4. Never create backup files (use git history)

**Before Creating ANY Folder:**
1. Do you have 3+ related files? (Yes → create folder)
2. Is this a new feature domain? (Yes → create domain folder)
3. Is this temporary/experimental? (Yes → use `archive/YYYY-MM/`)
4. Otherwise → use existing shared/ or layout/ folders

---

## Documentation Folder Structure (Tier 1)

### docs/ Organization Standards

**Last Updated:** 2025-10-18
**Purpose:** Canonical folder structure for all project documentation

**Root-Level Files (Canonical References):**
- `docs/ARCHITECTURE.md` - System architecture and technical design
- `docs/DESIGN_SYSTEM.md` - Design tokens and component patterns
- `docs/KNOWN_ISSUES.md` - Current workarounds and bugs
- `docs/work-log.md` - Daily work log (Tier 2 working document)
- `docs/overview.md` - Documentation index/map

**Folder Structure (10 Folders):**

**`docs/plans/`** - Tier 3: Temporary decision documents
- `active/` - Current implementation plans (<200 lines)
- `archive/YYYY/MM/` - Completed plans (date-organized)
- `backlog/` - Future work
- **Rule:** Plans are temporary, archived after completion

**`docs/runbooks/`** - Tier 2: Implementation guides
- Domain-organized: `chatops/`, `devops/`, `mobile-form-optimization/`, etc.
- **Rule:** Runbooks LINK to Tier 1 code, never duplicate it
- **Rule:** Runbooks never expire (unlike plans)

**`docs/reports/`** - Investigation findings and reports
- `decisions/` - Architecture decision documents
- `evaluations/` - Technology evaluations
- `investigations/` - Ad-hoc investigation findings
- `research/` - Research reports
- `session-context/` - Session summaries
- `validation/` - Validation reports

**`docs/_templates/`** - Document templates

**`docs/completion_drive_plans/`** - Response-awareness framework plans
- Domain-organized: `ai/`, `api/`, `data/`, `forms/`, `integration/`
- Used by slash commands and skills for AI learning

**`docs/completion_drive_checkpoints/`** - Response-awareness checkpoints
- Reserved for framework checkpoint storage

**`docs/design/`** - Design assets and mockups

**`docs/mortgage-lessons/`** - Domain knowledge (mortgage industry)

**`docs/openai-apps-sdk/`** - SDK research and documentation

**`docs/troubleshooting/`** - Troubleshooting guides

**Deprecated Folders (Consolidated 2025-10-18):**
- ❌ `docs/sessions/` → Merged into `docs/reports/session-context/`
- ❌ `docs/evaluations/` → Merged into `docs/reports/evaluations/`
- ❌ `docs/validation-reports/` → Merged into `docs/reports/validation/`
- ❌ `docs/meta/` → Archived to `docs/plans/archive/2025/09/meta-legacy/`
- ❌ `docs/audits/` → Was empty, removed

**Allowed Changes:**
- Add new runbooks in domain folders
- Create new plans in `active/` (archive after completion)
- Add investigation reports to `reports/investigations/`
- Add new domain folders in `completion_drive_plans/` as projects evolve

**Forbidden Changes:**
- Do NOT create new top-level folders without updating this file
- Do NOT create files at `docs/` root (except the 5 canonical references)
- Do NOT recreate deprecated folders (sessions/, evaluations/, validation-reports/, meta/)
- Do NOT move completion_drive folders (breaking change for response-awareness framework)

**Related Files:**
- `CLAUDE.md` - 3-tier documentation system rules
- `AGENTS.md` - Agent configuration references completion drive
- `SKILL.md` - Skill definitions may reference completion drive content
- `.mcp.json` - MCP server configuration for skills/commands
