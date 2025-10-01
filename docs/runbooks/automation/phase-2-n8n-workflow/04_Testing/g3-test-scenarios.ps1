# G3 Validation Test Scenarios
# Testing dynamic validation across all loan types with varying data completeness
# Execute these PowerShell commands to test the n8n webhook

# ============================================================================
# REFINANCING SCENARIOS (5 tests)
# ============================================================================

# Test 1: Refinance - Complete Profile (Premium Lead)
Write-Host "Test 1: Refinance - Complete Premium Profile" -ForegroundColor Green
Invoke-WebRequest -Uri "https://primary-production-1af6.up.railway.app/webhook-test/api/forms/analyze" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"formData":{"name":"Michael Chen","email":"michael.chen@gmail.com","phone":"+6591234567","loanType":"refinance","currentRate":4.5,"outstandingLoan":850000,"monthlyIncome":18000,"lockInStatus":"ending_soon","currentBank":"Local Bank A","propertyValue":1200000,"existingCommitments":500,"propertyType":"Private","yearsRemaining":20}}'

# Test 2: Refinance - High Savings Opportunity (Above Market Rate)
Write-Host "Test 2: Refinance - High Savings Opportunity" -ForegroundColor Green
Invoke-WebRequest -Uri "https://primary-production-1af6.up.railway.app/webhook-test/api/forms/analyze" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"formData":{"name":"Jennifer Tan","email":"jtan@hotmail.com","phone":"+6598765432","loanType":"refinance","currentRate":5.2,"outstandingLoan":1200000,"monthlyIncome":25000,"lockInStatus":"ended","propertyType":"Private"}}'

# Test 3: Refinance - Minimal Required Data Only
Write-Host "Test 3: Refinance - Minimal Required Fields" -ForegroundColor Green
Invoke-WebRequest -Uri "https://primary-production-1af6.up.railway.app/webhook-test/api/forms/analyze" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"formData":{"name":"David Lim","email":"dlim@yahoo.com","phone":"+6592345678","loanType":"refinance","currentRate":3.8,"outstandingLoan":600000,"monthlyIncome":12000}}'

# Test 4: Refinance - Missing Critical Field (No Income)
Write-Host "Test 4: Refinance - Missing Monthly Income" -ForegroundColor Yellow
Invoke-WebRequest -Uri "https://primary-production-1af6.up.railway.app/webhook-test/api/forms/analyze" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"formData":{"name":"Rachel Wong","email":"rwong@gmail.com","phone":"+6593456789","loanType":"refinance","currentRate":4.0,"outstandingLoan":750000,"lockInStatus":"locked_in"}}'

# Test 5: Refinance - High DSR Risk Profile
Write-Host "Test 5: Refinance - High DSR Warning Case" -ForegroundColor Green
Invoke-WebRequest -Uri "https://primary-production-1af6.up.railway.app/webhook-test/api/forms/analyze" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"formData":{"name":"Kevin Ng","email":"kng@outlook.com","phone":"+6594567890","loanType":"refinance","currentRate":3.5,"outstandingLoan":950000,"monthlyIncome":8000,"existingCommitments":3500,"lockInStatus":"ending_soon","propertyType":"HDB"}}'

# ============================================================================
# NEW PURCHASE SCENARIOS (5 tests)
# ============================================================================

# Test 6: New Purchase - First-Time Buyer Complete Profile
Write-Host "Test 6: New Purchase - First-Time Buyer Premium" -ForegroundColor Green
Invoke-WebRequest -Uri "https://primary-production-1af6.up.railway.app/webhook-test/api/forms/analyze" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"formData":{"name":"Amanda Lee","email":"alee@gmail.com","phone":"+6595678901","loanType":"new_purchase","propertyType":"HDB","priceRange":650000,"monthlyIncome":9000,"purchaseTimeline":"immediate","ipaStatus":"approved","firstTimeBuyer":true,"existingCommitments":800,"employmentType":"permanent","citizenship":"citizen"}}'

# Test 7: New Purchase - Luxury Property Buyer
Write-Host "Test 7: New Purchase - Luxury Segment" -ForegroundColor Green
Invoke-WebRequest -Uri "https://primary-production-1af6.up.railway.app/webhook-test/api/forms/analyze" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"formData":{"name":"William Tan","email":"wtan@business.com","phone":"+6596789012","loanType":"new_purchase","propertyType":"Private","priceRange":2500000,"monthlyIncome":45000,"purchaseTimeline":"3_months","ipaStatus":"pending"}}'

# Test 8: New Purchase - Minimal Required Data
Write-Host "Test 8: New Purchase - Basic Requirements Only" -ForegroundColor Green
Invoke-WebRequest -Uri "https://primary-production-1af6.up.railway.app/webhook-test/api/forms/analyze" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"formData":{"name":"Susan Koh","email":"skoh@gmail.com","phone":"+6597890123","loanType":"new_purchase","propertyType":"HDB","priceRange":450000,"monthlyIncome":7500}}'

# Test 9: New Purchase - Missing Property Type
Write-Host "Test 9: New Purchase - Incomplete Profile" -ForegroundColor Yellow
Invoke-WebRequest -Uri "https://primary-production-1af6.up.railway.app/webhook-test/api/forms/analyze" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"formData":{"name":"Peter Goh","email":"pgoh@email.com","phone":"+6598901234","loanType":"new_purchase","priceRange":800000,"monthlyIncome":11000,"purchaseTimeline":"6_months"}}'

# Test 10: New Purchase - Urgent Timeline with IPA
Write-Host "Test 10: New Purchase - Urgent Buyer" -ForegroundColor Green
Invoke-WebRequest -Uri "https://primary-production-1af6.up.railway.app/webhook-test/api/forms/analyze" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"formData":{"name":"Grace Ong","email":"gong@yahoo.com","phone":"+6599012345","loanType":"new_purchase","propertyType":"EC","priceRange":1100000,"monthlyIncome":14000,"purchaseTimeline":"immediate","ipaStatus":"approved","existingCommitments":1200}}'

# ============================================================================
# EQUITY/CASH-OUT SCENARIOS (5 tests)
# ============================================================================

# Test 11: Equity Loan - Business Expansion Complete Profile
Write-Host "Test 11: Equity Loan - Business Purpose Premium" -ForegroundColor Green
Invoke-WebRequest -Uri "https://primary-production-1af6.up.railway.app/webhook-test/api/forms/analyze" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"formData":{"name":"Thomas Lau","email":"tlau@company.com","phone":"+6590123456","loanType":"equity_loan","propertyValue":1800000,"outstandingLoan":500000,"monthlyIncome":30000,"equityNeeded":500000,"purpose":"business_expansion","existingCommitments":2000,"propertyType":"Private","tenureDesired":15}}'

# Test 12: Equity Loan - Investment Purpose
Write-Host "Test 12: Equity Loan - Investment Purpose" -ForegroundColor Green
Invoke-WebRequest -Uri "https://primary-production-1af6.up.railway.app/webhook-test/api/forms/analyze" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"formData":{"name":"Catherine Sim","email":"csim@gmail.com","phone":"+6591234567","loanType":"equity_loan","propertyValue":950000,"outstandingLoan":300000,"monthlyIncome":16000,"equityNeeded":300000,"purpose":"investment"}}'

# Test 13: Equity Loan - Minimal Required Fields
Write-Host "Test 13: Equity Loan - Basic Requirements" -ForegroundColor Green
Invoke-WebRequest -Uri "https://primary-production-1af6.up.railway.app/webhook-test/api/forms/analyze" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"formData":{"name":"Robert Chan","email":"rchan@email.com","phone":"+6592345678","loanType":"equity_loan","propertyValue":750000,"outstandingLoan":200000,"monthlyIncome":10000}}'

# Test 14: Equity Loan - High LTV Request
Write-Host "Test 14: Equity Loan - High Leverage" -ForegroundColor Green
Invoke-WebRequest -Uri "https://primary-production-1af6.up.railway.app/webhook-test/api/forms/analyze" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"formData":{"name":"Michelle Yeo","email":"myeo@hotmail.com","phone":"+6593456789","loanType":"equity_loan","propertyValue":2200000,"outstandingLoan":1100000,"monthlyIncome":35000,"equityNeeded":800000,"purpose":"renovation","propertyType":"Landed"}}'

# Test 15: Equity Loan - Missing Income (Validation Failure)
Write-Host "Test 15: Equity Loan - Missing Required Income" -ForegroundColor Yellow
Invoke-WebRequest -Uri "https://primary-production-1af6.up.railway.app/webhook-test/api/forms/analyze" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"formData":{"name":"Daniel Tay","email":"dtay@gmail.com","phone":"+6594567890","loanType":"equity_loan","propertyValue":850000,"outstandingLoan":400000,"purpose":"education"}}'

Write-Host "`n=== All G3 Test Scenarios Completed ===" -ForegroundColor Cyan
Write-Host "Expected Results:" -ForegroundColor Cyan
Write-Host "- Tests 1,6,11: Premium segment (80%+ completeness)" -ForegroundColor White
Write-Host "- Tests 2,5,10,14: High urgency or special situations" -ForegroundColor White
Write-Host "- Tests 3,8,13: Qualified segment (60-70% completeness)" -ForegroundColor White
Write-Host "- Tests 4,9,15: Validation failures (missing required fields)" -ForegroundColor White
Write-Host "- Tests 7,12: High-value leads (property >1.5M)" -ForegroundColor White