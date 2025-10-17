#!/bin/bash

# Dr. Elena Staging Quick Test Script
# Version: 1.0
# Purpose: Quick validation of Dr. Elena in staging environment

set -e  # Exit on error

echo "🚀 Dr. Elena Staging Quick Test"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Function to print test result
test_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ PASS${NC}: $2"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}❌ FAIL${NC}: $2"
        FAILED=$((FAILED + 1))
    fi
}

# ==============================================================================
# TEST 1: Environment Variables
# ==============================================================================
echo "📋 Test 1: Checking Environment Variables"
echo "----------------------------------------"

check_env_var() {
    if [ -z "${!1}" ]; then
        echo -e "${RED}❌ Missing${NC}: $1"
        return 1
    else
        echo -e "${GREEN}✅ Set${NC}: $1"
        return 0
    fi
}

check_env_var "OPENAI_API_KEY" || ENV_FAIL=1
check_env_var "REDIS_URL" || ENV_FAIL=1
check_env_var "NEXT_PUBLIC_SUPABASE_URL" || ENV_FAIL=1
check_env_var "SUPABASE_SERVICE_KEY" || ENV_FAIL=1

if [ -z "$ENV_FAIL" ]; then
    test_result 0 "All required environment variables set"
else
    test_result 1 "Some environment variables missing"
fi

echo ""

# ==============================================================================
# TEST 2: Redis Connection
# ==============================================================================
echo "🔌 Test 2: Redis Connection"
echo "----------------------------------------"

if command -v redis-cli &> /dev/null; then
    if redis-cli -u "$REDIS_URL" ping &> /dev/null; then
        test_result 0 "Redis connection successful"
    else
        test_result 1 "Redis connection failed"
    fi
else
    echo -e "${YELLOW}⚠️  SKIP${NC}: redis-cli not installed"
fi

echo ""

# ==============================================================================
# TEST 3: Pure Calculations (No External Dependencies)
# ==============================================================================
echo "🧮 Test 3: Pure Calculation Tests"
echo "----------------------------------------"

if npx tsx scripts/test-dr-elena-pure-calculations.ts 2>&1 | grep -q "ALL TESTS PASSED"; then
    test_result 0 "Pure calculations working correctly"
else
    test_result 1 "Pure calculations have errors"
fi

echo ""

# ==============================================================================
# TEST 4: Full Integration Test (with Redis/Supabase)
# ==============================================================================
echo "🔗 Test 4: Full Integration Test"
echo "----------------------------------------"

if npx tsx scripts/test-dr-elena-integration.ts 2>&1 | grep -q "ALL TESTS PASSED"; then
    test_result 0 "Integration tests passed"
else
    echo -e "${YELLOW}⚠️  WARNING${NC}: Check logs for details"
    test_result 1 "Integration tests have issues"
fi

echo ""

# ==============================================================================
# TEST 5: Database Table Verification
# ==============================================================================
echo "🗄️  Test 5: Database Tables (Manual Check Required)"
echo "----------------------------------------"
echo "Please verify in Supabase dashboard:"
echo "  1. Table 'calculation_audit' exists"
echo "  2. Table 'conversations' exists"
echo "  3. Table 'conversation_turns' exists"
echo ""
echo "Run this query in Supabase SQL Editor:"
echo "  SELECT COUNT(*) FROM calculation_audit;"
echo ""
echo -e "${YELLOW}⏭️  MANUAL${NC}: Verify database tables manually"

echo ""

# ==============================================================================
# SUMMARY
# ==============================================================================
echo "================================"
echo "📊 Test Summary"
echo "================================"
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo "Total: $((PASSED + FAILED))"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All automated tests passed!${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Run manual Chatwoot webhook test"
    echo "  2. Verify database audit trail"
    echo "  3. Check staging logs for any warnings"
    echo "  4. Review: docs/DR_ELENA_STAGING_TEST_PLAN.md"
    exit 0
else
    echo -e "${RED}⚠️  Some tests failed. Review the output above.${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "  1. Check environment variables are correct"
    echo "  2. Verify Redis is accessible"
    echo "  3. Confirm Supabase credentials valid"
    echo "  4. Review: docs/DR_ELENA_QUICK_START.md"
    exit 1
fi
