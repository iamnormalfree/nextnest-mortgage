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
