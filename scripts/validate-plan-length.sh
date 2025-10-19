#!/bin/bash
# ABOUTME: Validates that Tier 3 plans in docs/plans/active/ comply with 200-line limit
# ABOUTME: Warns at 180 lines (soft limit), blocks at 250 lines (hard limit)

# Exit codes:
# 0 = All plans compliant
# 1 = Warnings only (soft limit exceeded)
# 2 = Hard limit exceeded (should block commit)

PLANS_DIR="docs/plans/active"
SOFT_LIMIT=180
TARGET_LIMIT=200
HARD_LIMIT=250

# Color codes for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Track violations
has_warnings=0
has_errors=0
total_plans=0
compliant_plans=0

echo ""
echo "📋 Validating Tier 3 Plan Lengths..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if plans directory exists
if [ ! -d "$PLANS_DIR" ]; then
    echo -e "${YELLOW}⚠️  Warning: $PLANS_DIR directory not found${NC}"
    exit 0
fi

# Find all markdown files in active plans
while IFS= read -r plan_file; do
    if [ -f "$plan_file" ]; then
        total_plans=$((total_plans + 1))
        line_count=$(wc -l < "$plan_file" 2>/dev/null || echo 0)
        filename=$(basename "$plan_file")

        if [ "$line_count" -ge "$HARD_LIMIT" ]; then
            # HARD LIMIT VIOLATION - Block commit
            echo -e "${RED}❌ ERROR: Plan exceeds hard limit${NC}"
            echo -e "   File: ${BLUE}$filename${NC}"
            echo -e "   Lines: ${RED}$line_count${NC} (hard limit: $HARD_LIMIT)"
            echo -e "   Target: <$TARGET_LIMIT lines"
            echo ""
            echo -e "   ${YELLOW}Action required:${NC}"
            echo -e "   1. Extract code examples → docs/runbooks/"
            echo -e "   2. Extract tutorials → docs/runbooks/"
            echo -e "   3. Reference runbooks from plan"
            echo -e "   4. Keep only decisions (what/why/when)"
            echo ""
            echo -e "   See: ${BLUE}docs/PLANNING_TEMPLATES.md${NC}"
            echo ""
            has_errors=1

        elif [ "$line_count" -ge "$SOFT_LIMIT" ]; then
            # SOFT LIMIT WARNING - Allow but warn
            echo -e "${YELLOW}⚠️  WARNING: Plan approaching limit${NC}"
            echo -e "   File: ${BLUE}$filename${NC}"
            echo -e "   Lines: ${YELLOW}$line_count${NC} (soft limit: $SOFT_LIMIT, target: <$TARGET_LIMIT)"
            echo -e "   Consider extracting content to runbook"
            echo ""
            has_warnings=1

        else
            # COMPLIANT
            compliant_plans=$((compliant_plans + 1))
            echo -e "${GREEN}✓${NC} $filename ($line_count lines)"
        fi
    fi
done < <(find "$PLANS_DIR" -maxdepth 1 -type f -name "*.md" ! -name "*-ORIGINAL.md" 2>/dev/null)

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Summary
if [ "$total_plans" -eq 0 ]; then
    echo -e "${YELLOW}ℹ️  No active plans found${NC}"
    exit 0
fi

echo ""
echo "Summary: $compliant_plans/$total_plans plans compliant"

if [ "$has_errors" -eq 1 ]; then
    echo ""
    echo -e "${RED}❌ COMMIT BLOCKED${NC}"
    echo -e "   Plans exceed hard limit ($HARD_LIMIT lines)"
    echo -e "   Extract content to runbooks before committing"
    echo ""
    exit 2

elif [ "$has_warnings" -eq 1 ]; then
    echo ""
    echo -e "${YELLOW}⚠️  COMMIT ALLOWED (with warnings)${NC}"
    echo -e "   Some plans approaching limit"
    echo -e "   Consider refactoring soon"
    echo ""
    exit 1

else
    echo ""
    echo -e "${GREEN}✅ All plans compliant${NC}"
    echo ""
    exit 0
fi
