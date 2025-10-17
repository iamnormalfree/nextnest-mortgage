# Tier 1 Canonicalization - Action Items

**Date:** 2025-10-17
**Status:** Partially Complete
**Context:** Documentation overhaul and Tier 1 file identification

## Completed Actions

### 1. SingaporeMortgageCalculator
- ✅ Added abandonment header to `components/calculators/SingaporeMortgageCalculator.tsx`
- ✅ Moved to `components/calculators/archive/2025-10/`
- ⚠️ Campaign pages (app/campaigns/*) need manual move (Windows file locks)
- ⚠️ Calculator pages (app/calculators/*) need manual move (Windows file locks)

## Pending Actions - Manual Completion Required

### 2. Archive validation-dashboard
**File:** `app/validation-dashboard/page.tsx`
**Reason:** Internal debugging tool, no user integration, no active plan references
**Action:**
```bash
# Add abandonment header
git mv app/validation-dashboard app/archive/2025-10/validation-dashboard
```

**Header to add:**
```typescript
/**
 * ARCHIVED: 2025-10-17
 *
 * REASON FOR ARCHIVAL:
 * Internal debugging tool created for context validation between system layers.
 * Never integrated into user-facing application, no navigation links exist.
 *
 * PURPOSE:
 * Validated form data through calculations, forms, API, and documentation layers
 * to ensure alignment across the system.
 *
 * REPLACED BY:
 * Modern form testing uses:
 * - Jest/React Testing Library for component tests
 * - Integration tests for API layer validation
 * - This tool is preserved for historical reference only
 */
```

### 3. Archive generate-report API
**File:** `app/api/generate-report/route.ts`
**Reason:** Dead endpoint - zero frontend usage, unfinished implementation
**Action:**
```bash
git mv app/api/generate-report app/archive/2025-10/api/generate-report
```

**Header to add:**
```typescript
/**
 * ARCHIVED: 2025-10-17
 *
 * REASON FOR ARCHIVAL:
 * Abandoned API endpoint for PDF report generation feature that was never completed.
 * Zero frontend integration - no component or page calls this endpoint.
 *
 * PURPOSE:
 * Was designed to generate comprehensive mortgage reports with analysis and recommendations.
 * Database storage functionality commented out ("// in production").
 *
 * REPLACED BY:
 * Report generation is now handled by:
 * - AI broker chat providing personalized recommendations
 * - Email-based detailed analysis reports
 */
```

### 4. Migrate dr-elena-integration-service to instant-profile.ts
**Files to update:**
- `lib/ai/dr-elena-integration-service.ts` (primary)
- `lib/ai/conversation-state-manager.ts` (interfaces)
- `lib/ai/dr-elena-explainer.ts` (interfaces)
- `lib/db/repositories/calculation-repository.ts` (interfaces)

**Current state:**
- These files import from `dr-elena-mortgage.ts` (hardcoded constants)
- Need to migrate to `instant-profile.ts` (dynamic Dr Elena v2 constants)

**Migration plan:**
1. Update imports in dr-elena-integration-service.ts:
   ```typescript
   // OLD:
   import { calculateMaxLoanAmount, LoanCalculationInputs, LoanCalculationResult } from '@/lib/calculations/dr-elena-mortgage'

   // NEW:
   import { calculateInstantProfile, InstantProfileInput, InstantProfileResult } from '@/lib/calculations/instant-profile'
   ```

2. Map interface fields (LoanCalculationInputs → InstantProfileInput)
3. Update function calls (calculateMaxLoanAmount → calculateInstantProfile)
4. Test AI broker responses to ensure no regressions
5. Archive dr-elena-mortgage.ts after successful migration

**IMPORTANT:** This requires careful testing as it affects AI broker backend calculations.

### 5. Archive tailwind.bloomberg.config.ts
**File:** `tailwind.bloomberg.config.ts`
**Reason:** All useful tokens merged into main config, file is stale (33 days old)
**Action:**
```bash
git mv tailwind.bloomberg.config.ts tailwind.bloomberg.config.ts.archived
```

**Documentation updates needed:**
1. Update `docs/runbooks/TECH_STACK_GUIDE.md` line 11:
   ```markdown
   <!-- OLD: -->
   Bloomberg theme work lives alongside production tokens via `tailwind.bloomberg.config.ts`

   <!-- NEW: -->
   Bloomberg design tokens (ink, gold, charcoal, etc.) are merged into tailwind.config.ts
   ```

2. Add note to CLAUDE.md:
   ```markdown
   **Design System:** Single `tailwind.config.ts` is source of truth for both NextNest brand and Bloomberg colors. Bloomberg config archived 2025-10-17 after successful merge of all 12 color tokens.
   ```

**What was merged:**
- ✅ All 12 Bloomberg colors (ink, charcoal, graphite, silver, pearl, fog, mist, gold×3, emerald, ruby)
- ❌ Font stack (SF Pro Display) - intentionally not merged, using Inter instead
- ❌ Custom font sizes - not merged, using Tailwind defaults
- ❌ Animations (skeleton-wave, counter) - not used in codebase

### 6. Document AI Broker mobile variants
**Files:**
- `components/ai-broker/MobileAIAssistant.tsx`
- `components/ai-broker/MobileAIAssistantCompact.tsx` (PRODUCTION)
- `components/ai-broker/MobileAIAssistantFixed.tsx`

**Status:** Keep all 3 variants
**Reason:** Active plan `mobile-ai-broker-ui-rebuild-plan.md` in progress

**Documentation to add:**
Create `components/ai-broker/README.md`:
```markdown
# AI Broker Mobile UI Variants

## Production Variant
- **MobileAIAssistantCompact.tsx** - Currently wired to production via ResponsiveBrokerShell

## Test/Experimental Variants
- **MobileAIAssistant.tsx** - Original/full version (370 lines)
- **MobileAIAssistantFixed.tsx** - Medium-compact version (317 lines)

## Status
All 3 variants are available in test harness at `/app/test-mobile/page.tsx` for manual QA.

Active plan: `docs/plans/active/mobile-ai-broker-ui-rebuild-plan.md`

## Decision Pending
After mobile broker plan completion, evaluate whether to:
- A) Consolidate to MobileAIAssistantCompact only
- B) Add density props to single component
- C) Keep all 3 for A/B testing

**Do not delete these variants until plan completion and evaluation.**
```

## Summary

**Completed:** 1/6
**Pending Manual:** 5/6

**Next steps:**
1. Manually move campaign/calculator pages (Windows file lock issue)
2. Archive validation-dashboard and generate-report
3. Migrate AI broker to instant-profile.ts (requires testing)
4. Archive Bloomberg config with merge documentation
5. Document AI broker mobile variants status

**Files requiring careful migration:**
- dr-elena-integration-service.ts (AI broker backend - test thoroughly)
