# PowerShell script to update useProgressiveFormController.ts with step-aware calculations

$file = "C:\Users\HomePC\Desktop\Code\NextNest\hooks\useProgressiveFormController.ts"
$content = Get-Content $file -Raw

# 1. Add type imports after line 14
$content = $content -replace 
    'import \{ FormStep, LeadScore, AIInsightResponse, LoanType \} from',
    'import { FormStep, LeadScore, AIInsightResponse, LoanType } from ''@/lib/contracts/form-contracts''
import type { InstantCalcResult, PureLtvCalcResult, FullAnalysisCalcResult, RefinanceCalcResult } from'

# 2. Add pure LTV import after instant-profile imports
$content = $content -replace
    'from ''@/lib/calculations/instant-profile''',
    'from ''@/lib/calculations/instant-profile''
import { calculatePureLtvMaxLoan } from ''@/lib/calculations/instant-profile-pure-ltv'''

# 3. Update instantCalcResult type in interface
$content = $content -replace
    'instantCalcResult: any',
    'instantCalcResult: InstantCalcResult | null'

# 4. Update instantCalcResult state variable type  
$content = $content -replace
    'const \[instantCalcResult, setInstantCalcResult\] = useState<any>\(null\)',
    'const [instantCalcResult, setInstantCalcResult] = useState<InstantCalcResult | null>(null)'

# Save updated content
Set-Content -Path $file -Value $content

Write-Host "Phase 1 complete: Types and imports updated"
