# Dr. Elena Staging Quick Test (Simplified)

Write-Host "Dr. Elena Staging Quick Test" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan
Write-Host ""

$PASSED = 0
$FAILED = 0

function Test-Result {
    param([bool]$Success, [string]$Message)
    if ($Success) {
        Write-Host "PASS: $Message" -ForegroundColor Green
        $script:PASSED++
    } else {
        Write-Host "FAIL: $Message" -ForegroundColor Red
        $script:FAILED++
    }
}

# Test 1: Environment Variables
Write-Host "Test 1: Environment Variables" -ForegroundColor Yellow
$requiredVars = @("OPENAI_API_KEY", "REDIS_URL", "NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_KEY")
$allVarsPresent = $true
foreach ($var in $requiredVars) {
    if ([string]::IsNullOrEmpty([Environment]::GetEnvironmentVariable($var))) {
        Write-Host "Missing: $var" -ForegroundColor Red
        $allVarsPresent = $false
    }
}
Test-Result -Success $allVarsPresent -Message "Environment variables configured"
Write-Host ""

# Test 2: Pure Calculations
Write-Host "Test 2: Pure Calculation Tests" -ForegroundColor Yellow
try {
    $output = & npx tsx scripts/test-dr-elena-pure-calculations.ts 2>&1 | Out-String
    $success = $output -match "ALL TESTS PASSED"
    Test-Result -Success $success -Message "Pure calculations"
} catch {
    Test-Result -Success $false -Message "Pure calculation tests failed"
}
Write-Host ""

# Test 3: Integration Tests
Write-Host "Test 3: Integration Tests" -ForegroundColor Yellow
try {
    $output = & npx tsx scripts/test-dr-elena-integration.ts 2>&1 | Out-String
    $success = $output -match "ALL TESTS PASSED"
    Test-Result -Success $success -Message "Integration tests"
} catch {
    Test-Result -Success $false -Message "Integration tests failed"
}
Write-Host ""

# Summary
Write-Host "=============================" -ForegroundColor Cyan
Write-Host "Test Summary" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan
Write-Host "Passed: $PASSED" -ForegroundColor Green
Write-Host "Failed: $FAILED" -ForegroundColor Red
Write-Host ""

if ($FAILED -eq 0) {
    Write-Host "All tests passed! Ready for staging." -ForegroundColor Green
} else {
    Write-Host "Some tests failed. Check output above." -ForegroundColor Yellow
}
