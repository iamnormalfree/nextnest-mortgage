#!/bin/bash
# ABOUTME: Pre-flight validation script for Market Opportunity UI implementation
# ABOUTME: Checks dependencies, configs, and file states before junior dev starts work

set -e

echo "🔍 Validating setup for Market Opportunity UI..."
echo ""

ERRORS=0
WARNINGS=0

# Check 1: @jest/globals dependency
echo "✓ Checking @jest/globals dependency..."
if ! grep -q '"@jest/globals"' package.json; then
  echo "  ❌ FAIL: @jest/globals not in package.json"
  echo "     Fix: npm install --save-dev @jest/globals"
  ERRORS=$((ERRORS + 1))
else
  echo "  ✅ PASS: @jest/globals found in package.json"
fi

# Check 2: @playwright/test for E2E tests
echo "✓ Checking @playwright/test dependency..."
if ! grep -q '"@playwright/test"' package.json; then
  echo "  ❌ FAIL: @playwright/test not in package.json"
  echo "     Fix: npm install --save-dev @playwright/test"
  ERRORS=$((ERRORS + 1))
else
  echo "  ✅ PASS: @playwright/test found in package.json"
fi

# Check 3: TypeScript path alias configuration
echo "✓ Checking TypeScript path alias..."
if ! grep -q '"@/\*": \[".\/\*"\]' tsconfig.json; then
  echo "  ❌ FAIL: @/ path alias not configured in tsconfig.json"
  echo "     Fix: Add '\"@/*\": [\"./*\"]' to compilerOptions.paths"
  ERRORS=$((ERRORS + 1))
else
  echo "  ✅ PASS: @/ path alias configured"
fi

# Check 4: Jest environment configuration
echo "✓ Checking Jest environment..."
if ! grep -q 'jest-environment-jsdom' jest.config.mjs; then
  echo "  ⚠️  WARN: jsdom environment not configured (component tests may fail)"
  WARNINGS=$((WARNINGS + 1))
else
  echo "  ✅ PASS: Jest environment configured for jsdom"
fi

# Check 5: RefinanceOutlookSidebar file state
echo "✓ Checking RefinanceOutlookSidebar.tsx state..."
if [ -f "components/forms/instant-analysis/RefinanceOutlookSidebar.tsx" ]; then
  if ! git ls-files --error-unmatch components/forms/instant-analysis/RefinanceOutlookSidebar.tsx > /dev/null 2>&1; then
    echo "  ⚠️  WARN: RefinanceOutlookSidebar.tsx exists but is untracked"
    echo "     Action: Commit baseline before starting Task 7"
    echo "     Command: git add components/forms/instant-analysis/RefinanceOutlookSidebar.tsx"
    echo "              git commit -m \"feat: baseline RefinanceOutlookSidebar before redesign\""
    WARNINGS=$((WARNINGS + 1))
  else
    echo "  ✅ PASS: RefinanceOutlookSidebar.tsx is tracked"
  fi
else
  echo "  ✅ PASS: RefinanceOutlookSidebar.tsx doesn't exist yet (will be created)"
fi

# Check 6: Verify Tier 1 files exist
echo "✓ Checking Tier 1 canonical files..."
if [ ! -f "lib/calculations/instant-profile.ts" ]; then
  echo "  ❌ FAIL: instant-profile.ts not found"
  ERRORS=$((ERRORS + 1))
else
  echo "  ✅ PASS: instant-profile.ts found"
fi

if [ ! -f "components/forms/ProgressiveFormWithController.tsx" ]; then
  echo "  ❌ FAIL: ProgressiveFormWithController.tsx not found"
  ERRORS=$((ERRORS + 1))
else
  echo "  ✅ PASS: ProgressiveFormWithController.tsx found"
fi

# Check 7: CANONICAL_REFERENCES.md exists
echo "✓ Checking CANONICAL_REFERENCES.md..."
if [ ! -f "CANONICAL_REFERENCES.md" ]; then
  echo "  ❌ FAIL: CANONICAL_REFERENCES.md not found"
  echo "     This file contains critical Tier 1 modification rules"
  ERRORS=$((ERRORS + 1))
else
  echo "  ✅ PASS: CANONICAL_REFERENCES.md found"

  # Find line numbers for references (may drift over time)
  INSTANT_PROFILE_LINE=$(grep -n "Primary Calculator - Dr Elena v2" CANONICAL_REFERENCES.md | cut -d: -f1)
  FORM_CONTROLLER_LINE=$(grep -n "ProgressiveFormWithController.tsx" CANONICAL_REFERENCES.md | head -1 | cut -d: -f1)

  if [ -n "$INSTANT_PROFILE_LINE" ]; then
    echo "     📍 instant-profile.ts rules at line $INSTANT_PROFILE_LINE"
  fi
  if [ -n "$FORM_CONTROLLER_LINE" ]; then
    echo "     📍 ProgressiveFormWithController rules at line $FORM_CONTROLLER_LINE"
  fi
fi

# Check 8: Node modules installed
echo "✓ Checking node_modules..."
if [ ! -d "node_modules" ]; then
  echo "  ❌ FAIL: node_modules not found"
  echo "     Fix: npm install"
  ERRORS=$((ERRORS + 1))
else
  echo "  ✅ PASS: node_modules exists"
fi

# Check 9: Git working directory is clean (optional warning)
echo "✓ Checking git working directory..."
if ! git diff-index --quiet HEAD -- 2>/dev/null; then
  echo "  ⚠️  WARN: Uncommitted changes detected"
  echo "     Consider committing or stashing before starting new work"
  WARNINGS=$((WARNINGS + 1))
else
  echo "  ✅ PASS: Working directory clean"
fi

# Summary
echo ""
echo "================================"
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  echo "✅ ALL VALIDATION CHECKS PASSED!"
  echo ""
  echo "You're ready to start implementation."
  echo "Begin with Task 1: Create Market Rate Data Structure"
  exit 0
elif [ $ERRORS -eq 0 ]; then
  echo "⚠️  VALIDATION PASSED WITH $WARNINGS WARNING(S)"
  echo ""
  echo "You can proceed, but review warnings above."
  exit 0
else
  echo "❌ VALIDATION FAILED: $ERRORS ERROR(S), $WARNINGS WARNING(S)"
  echo ""
  echo "Fix errors above before starting implementation."
  exit 1
fi
