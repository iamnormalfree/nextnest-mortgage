# Dr. Elena Staging Quick Test Script (PowerShell)
# Version: 1.0
# Purpose: Quick validation of Dr. Elena in staging environment

Write-Host "🚀 Dr. Elena Staging Quick Test" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Test counter
$script:PASSED = 0
$script:FAILED = 0

# Function to print test result
function Test-Result {
    param(
        [bool]$Success,
        [string]$Message
    )

    if ($Success) {
        Write-Host "✅ PASS: $Message" -ForegroundColor Green
        $script:PASSED++
    } else {
        Write-Host "❌ FAIL: $Message" -ForegroundColor Red
        $script:FAILED++
    }
}

# ==============================================================================
# TEST 1: Environment Variables
# ==============================================================================
Write-Host "📋 Test 1: Checking Environment Variables" -ForegroundColor Yellow
Write-Host "----------------------------------------"

$requiredVars = @(
    "OPENAI_API_KEY",
    "REDIS_URL",
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_SERVICE_KEY"
)

$allVarsPresent = $true
foreach ($var in $requiredVars) {
    $value = [Environment]::GetEnvironmentVariable($var)
    if ([string]::IsNullOrEmpty($value)) {
        Write-Host "❌ Missing: $var" -ForegroundColor Red
        $allVarsPresent = $false
    } else {
        Write-Host "✅ Set: $var" -ForegroundColor Green
    }
}

Test-Result -Success $allVarsPresent -Message "All required environment variables set"
Write-Host ""

# ==============================================================================
# TEST 2: Redis Connection
# ==============================================================================
Write-Host "🔌 Test 2: Redis Connection" -ForegroundColor Yellow
Write-Host "----------------------------------------"

try {
    $redisUrl = $env:REDIS_URL
    if ($redisUrl) {
        # Try to ping Redis using redis-cli if available
        $redisPing = & redis-cli -u $redisUrl ping 2>&1
        if ($redisPing -match "PONG") {
            Test-Result -Success $true -Message "Redis connection successful"
        } else {
            Test-Result -Success $false -Message "Redis connection failed"
        }
    } else {
        Test-Result -Success $false -Message "REDIS_URL not set"
    }
} catch {
    Write-Host "⚠️  SKIP: redis-cli not installed or not in PATH" -ForegroundColor Yellow
}

Write-Host ""

# ==============================================================================
# TEST 3: Pure Calculations (No External Dependencies)
# ==============================================================================
Write-Host "🧮 Test 3: Pure Calculation Tests" -ForegroundColor Yellow
Write-Host "----------------------------------------"

try {
    $output = & npx tsx scripts/test-dr-elena-pure-calculations.ts 2>&1 | Out-String
    if ($output -match "ALL TESTS PASSED") {
        Test-Result -Success $true -Message "Pure calculations working correctly"
    } else {
        Test-Result -Success $false -Message "Pure calculations have errors"
        Write-Host "Output preview:" -ForegroundColor Gray
        Write-Host $output.Substring(0, [Math]::Min(500, $output.Length)) -ForegroundColor Gray
    }
} catch {
    Test-Result -Success $false -Message "Error running pure calculation tests: $_"
}

Write-Host ""

# ==============================================================================
# TEST 4: Full Integration Test (with Redis/Supabase)
# ==============================================================================
Write-Host "🔗 Test 4: Full Integration Test" -ForegroundColor Yellow
Write-Host "----------------------------------------"

try {
    $output = & npx tsx scripts/test-dr-elena-integration.ts 2>&1 | Out-String
    if ($output -match "ALL TESTS PASSED") {
        Test-Result -Success $true -Message "Integration tests passed"
    } else {
        Write-Host "⚠️  WARNING: Check logs for details" -ForegroundColor Yellow
        Test-Result -Success $false -Message "Integration tests have issues"

        # Show relevant errors
        $errors = $output -split "`n" | Where-Object { $_ -match "error|fail" } | Select-Object -First 5
        if ($errors) {
            Write-Host "`nRecent errors:" -ForegroundColor Gray
            $errors | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
        }
    }
} catch {
    Test-Result -Success $false -Message "Error running integration tests: $_"
}

Write-Host ""

# ==============================================================================
# TEST 5: Database Table Verification
# ==============================================================================
Write-Host "🗄️  Test 5: Database Tables (Manual Check Required)" -ForegroundColor Yellow
Write-Host "----------------------------------------"
Write-Host "Please verify in Supabase dashboard:"
Write-Host "  1. Table 'calculation_audit' exists"
Write-Host "  2. Table 'conversations' exists"
Write-Host "  3. Table 'conversation_turns' exists"
Write-Host ""
Write-Host "Run this query in Supabase SQL Editor:"
Write-Host "  SELECT COUNT(*) FROM calculation_audit;"
Write-Host ""
Write-Host "⏭️  MANUAL: Verify database tables manually" -ForegroundColor Yellow

Write-Host ""

# ==============================================================================
# SUMMARY
# ==============================================================================
Write-Host "================================" -ForegroundColor Cyan
Write-Host "📊 Test Summary" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Passed: $($script:PASSED)" -ForegroundColor Green
Write-Host "Failed: $($script:FAILED)" -ForegroundColor Red
Write-Host "Total: $($script:PASSED + $script:FAILED)"
Write-Host ""

if ($script:FAILED -eq 0) {
    Write-Host "🎉 All automated tests passed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:"
    Write-Host "  1. Run manual Chatwoot webhook test"
    Write-Host "  2. Verify database audit trail"
    Write-Host "  3. Check staging logs for any warnings"
    Write-Host "  4. Review: docs/DR_ELENA_STAGING_TEST_PLAN.md"
    exit 0
} else {
    Write-Host "Some tests failed. Review the output above." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Troubleshooting:"
    Write-Host "  1. Check environment variables are correct"
    Write-Host "  2. Verify Redis is accessible"
    Write-Host "  3. Confirm Supabase credentials valid"
    Write-Host "  4. Review docs/DR_ELENA_QUICK_START.md"
    exit 1
}
