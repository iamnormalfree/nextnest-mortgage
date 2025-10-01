# G1 & G2 Validation Test Scenarios
# Testing progressive disclosure gates with varying data completeness
# Execute these PowerShell commands to test the n8n webhook

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "GATE 1 (G1) TEST SCENARIOS" -ForegroundColor Cyan
Write-Host "Expected: Basic market overview email only" -ForegroundColor Gray
Write-Host "========================================`n" -ForegroundColor Cyan

# ============================================================================
# GATE 1 SCENARIOS (3 tests) - Email only, no phone
# ============================================================================

# G1 Test 1: Absolute Minimum - Email Only
Write-Host "G1 Test 1: Absolute Minimum (Email Only)" -ForegroundColor Green
Invoke-WebRequest -Uri "https://primary-production-1af6.up.railway.app/webhook-test/api/forms/analyze" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"formData":{"email":"curious@gmail.com"}}'

# G1 Test 2: Email + Loan Type (Early Interest Signal)
Write-Host "G1 Test 2: Email + Loan Type Selection" -ForegroundColor Green
Invoke-WebRequest -Uri "https://primary-production-1af6.up.railway.app/webhook-test/api/forms/analyze" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"formData":{"email":"john.explorer@yahoo.com","loanType":"refinance"}}'

# G1 Test 3: Email + Name + Loan Type (Personalized but No Phone)
Write-Host "G1 Test 3: Email + Name (No Phone Yet)" -ForegroundColor Green
Invoke-WebRequest -Uri "https://primary-production-1af6.up.railway.app/webhook-test/api/forms/analyze" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"formData":{"name":"Sarah Browser","email":"sarah.b@hotmail.com","loanType":"new_purchase"}}'

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "GATE 2 (G2) TEST SCENARIOS" -ForegroundColor Cyan
Write-Host "Expected: Eligibility overview + recommendations" -ForegroundColor Gray
Write-Host "========================================`n" -ForegroundColor Cyan

# ============================================================================
# GATE 2 SCENARIOS (10 tests) - Email + Phone + Some Data
# ============================================================================

# G2 Test 1: Just Crossed to G2 - Email + Phone Only
Write-Host "G2 Test 1: Minimal G2 (Email + Phone)" -ForegroundColor Green
Invoke-WebRequest -Uri "https://primary-production-1af6.up.railway.app/webhook-test/api/forms/analyze" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"formData":{"email":"basic.lead@gmail.com","phone":"+6591111111"}}'

# G2 Test 2: G2 with Name and Loan Type
Write-Host "G2 Test 2: Basic Contact + Loan Intent" -ForegroundColor Green
Invoke-WebRequest -Uri "https://primary-production-1af6.up.railway.app/webhook-test/api/forms/analyze" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"formData":{"name":"Mark Interested","email":"mark.i@gmail.com","phone":"+6592222222","loanType":"refinance"}}'

# G2 Test 3: Refinance with Partial Financial Data
Write-Host "G2 Test 3: Refinance - Some Financial Info" -ForegroundColor Green
Invoke-WebRequest -Uri "https://primary-production-1af6.up.railway.app/webhook-test/api/forms/analyze" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"formData":{"name":"Lisa Chen","email":"lchen@outlook.com","phone":"+6593333333","loanType":"refinance","currentRate":4.0,"outstandingLoan":500000}}'

# G2 Test 4: New Purchase with Property Interest
Write-Host "G2 Test 4: New Purchase - Property Type Known" -ForegroundColor Green
Invoke-WebRequest -Uri "https://primary-production-1af6.up.railway.app/webhook-test/api/forms/analyze" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"formData":{"name":"Tony Buyer","email":"tbuyer@gmail.com","phone":"+6594444444","loanType":"new_purchase","propertyType":"HDB","priceRange":600000}}'

# G2 Test 5: High Intent Signal - Timeline Specified
Write-Host "G2 Test 5: Urgent Buyer Signal" -ForegroundColor Green
Invoke-WebRequest -Uri "https://primary-production-1af6.up.railway.app/webhook-test/api/forms/analyze" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"formData":{"name":"Urgent Amy","email":"amy.urgent@yahoo.com","phone":"+6595555555","loanType":"new_purchase","purchaseTimeline":"immediate","propertyType":"Private"}}'

# G2 Test 6: Refinance with Lock-in Urgency
Write-Host "G2 Test 6: Refinance - Lock-in Ending Signal" -ForegroundColor Green
Invoke-WebRequest -Uri "https://primary-production-1af6.up.railway.app/webhook-test/api/forms/analyze" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"formData":{"name":"Ben Refin","email":"ben.r@gmail.com","phone":"+6596666666","loanType":"refinance","lockInStatus":"ending_soon","currentRate":3.8}}'

# G2 Test 7: Equity Loan Explorer
Write-Host "G2 Test 7: Equity Loan - Early Stage" -ForegroundColor Green
Invoke-WebRequest -Uri "https://primary-production-1af6.up.railway.app/webhook-test/api/forms/analyze" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"formData":{"name":"Carol Equity","email":"carol.e@hotmail.com","phone":"+6597777777","loanType":"equity_loan","propertyValue":900000}}'

# G2 Test 8: Mixed Signals - Income but No Property Details
Write-Host "G2 Test 8: Financial Capacity Known" -ForegroundColor Green
Invoke-WebRequest -Uri "https://primary-production-1af6.up.railway.app/webhook-test/api/forms/analyze" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"formData":{"name":"David Strong","email":"dstrong@gmail.com","phone":"+6598888888","monthlyIncome":15000,"loanType":"new_purchase"}}'

# G2 Test 9: Just Below G3 - Missing One Critical Field
Write-Host "G2 Test 9: Almost G3 (Missing Income)" -ForegroundColor Green
Invoke-WebRequest -Uri "https://primary-production-1af6.up.railway.app/webhook-test/api/forms/analyze" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"formData":{"name":"Ellen Close","email":"eclose@yahoo.com","phone":"+6599999999","loanType":"refinance","currentRate":4.2,"outstandingLoan":750000,"lockInStatus":"ended"}}'

# G2 Test 10: First-Timer with Partial Info
Write-Host "G2 Test 10: First-Time Buyer Exploring" -ForegroundColor Green
Invoke-WebRequest -Uri "https://primary-production-1af6.up.railway.app/webhook-test/api/forms/analyze" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"formData":{"name":"Frank First","email":"ffirst@gmail.com","phone":"+6590000000","loanType":"new_purchase","firstTimeBuyer":true,"propertyType":"HDB","monthlyIncome":8000}}'

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "GATE PROGRESSION TESTS" -ForegroundColor Cyan
Write-Host "Testing the journey from G1 to G3" -ForegroundColor Gray
Write-Host "========================================`n" -ForegroundColor Cyan

# ============================================================================
# PROGRESSIVE DISCLOSURE JOURNEY (3 tests showing progression)
# ============================================================================

# Journey Test 1: Same User - G1 Stage
Write-Host "Journey Test 1: Jane Doe at G1 (Email Only)" -ForegroundColor Yellow
Invoke-WebRequest -Uri "https://primary-production-1af6.up.railway.app/webhook-test/api/forms/analyze" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"formData":{"email":"jane.doe@gmail.com","loanType":"refinance"}}'

# Journey Test 2: Same User - G2 Stage (Added Phone)
Write-Host "Journey Test 2: Jane Doe at G2 (Added Phone)" -ForegroundColor Yellow
Invoke-WebRequest -Uri "https://primary-production-1af6.up.railway.app/webhook-test/api/forms/analyze" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"formData":{"name":"Jane Doe","email":"jane.doe@gmail.com","phone":"+6591234567","loanType":"refinance","currentRate":3.9}}'

# Journey Test 3: Same User - G3 Stage (Complete Profile)
Write-Host "Journey Test 3: Jane Doe at G3 (Full Profile)" -ForegroundColor Yellow
Invoke-WebRequest -Uri "https://primary-production-1af6.up.railway.app/webhook-test/api/forms/analyze" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"formData":{"name":"Jane Doe","email":"jane.doe@gmail.com","phone":"+6591234567","loanType":"refinance","currentRate":3.9,"outstandingLoan":650000,"monthlyIncome":12000,"lockInStatus":"ending_soon","propertyType":"Private","existingCommitments":500}}'

Write-Host "`n=== All G1 & G2 Test Scenarios Completed ===" -ForegroundColor Cyan
Write-Host "Expected Gate Detection Results:" -ForegroundColor Cyan
Write-Host "- G1 Tests 1-3: Gate 1 (Email only, basic market overview)" -ForegroundColor White
Write-Host "- G2 Tests 1-10: Gate 2 (Email + Phone, eligibility insights)" -ForegroundColor White
Write-Host "- Journey Tests: Shows progression G1 → G2 → G3" -ForegroundColor White
Write-Host "`nExpected Email Sequences:" -ForegroundColor Cyan
Write-Host "- G1: 'Welcome to NextNest – Market insights inside'" -ForegroundColor Gray
Write-Host "- G2: 'Your eligibility overview' + recommendations" -ForegroundColor Gray
Write-Host "- G3: 'Your Personal Mortgage Brain insights' + full analysis" -ForegroundColor Gray