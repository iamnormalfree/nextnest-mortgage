# PowerShell script to test n8n webhook with dynamic conversation ID
# Usage: .\test-n8n-quick.ps1 [ConversationID] [LeadScore]

param(
    [int]$ConversationID = 999,
    [int]$LeadScore = 85
)

$webhookUrl = "https://primary-production-1af6.up.railway.app/webhook-test/chatwoot-ai-broker"

Write-Host "🚀 Testing n8n webhook" -ForegroundColor Green
Write-Host "Conversation ID: $ConversationID" -ForegroundColor Yellow
Write-Host "Lead Score: $LeadScore" -ForegroundColor Yellow
Write-Host ""

$payload = @{
    event = "message_created"
    id = "test-webhook-$(Get-Date -Format 'yyyyMMddHHmmss')"
    conversation = @{
        id = $ConversationID
        contact_id = 5679
        status = "bot"
        custom_attributes = @{
            name = "Test User $ConversationID"
            email = "test-$ConversationID@example.com"
            phone = "+6591234567"
            lead_score = $LeadScore
            loan_type = "refinancing"
            property_category = "private_condo"
            monthly_income = 12000
            loan_amount = 1200000
            purchase_timeline = "urgent"
            employment_type = "self_employed"
            message_count = 1
            status = "bot"
        }
        contact = @{
            id = 5679
            name = "Test User"
            email = "test@example.com"
            phone_number = "+6591234567"
        }
    }
    message = @{
        id = 98766
        content = "I need help refinancing my condo. What are the best rates?"
        message_type = "incoming"
        created_at = (Get-Date -Format "yyyy-MM-ddTHH:mm:ss.000Z")
        sender = @{
            id = 5679
            type = "contact"
            name = "Test User"
        }
    }
    account = @{
        id = 1
        name = "NextNest"
    }
    inbox = @{
        id = 1
        name = "Website"
    }
} | ConvertTo-Json -Depth 10

Write-Host "📤 Sending webhook..." -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod -Uri $webhookUrl `
        -Method Post `
        -Headers @{
            "Content-Type" = "application/json"
            "X-Chatwoot-Signature" = "test-signature"
        } `
        -Body $payload
    
    Write-Host "✅ Success!" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json -Compress)" -ForegroundColor Gray
    
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "📊 Check n8n execution logs at:" -ForegroundColor Yellow
Write-Host "https://primary-production-1af6.up.railway.app/workflow/I6fx7kySryKCu4zi/executions" -ForegroundColor Blue
Write-Host ""
Write-Host "🔍 Verify in the execution:" -ForegroundColor Yellow
Write-Host "1. Conversation ID shows as $ConversationID (not 24)" -ForegroundColor White
Write-Host "2. Broker assigned based on score $LeadScore" -ForegroundColor White
Write-Host "3. All nodes are green (no errors)" -ForegroundColor White