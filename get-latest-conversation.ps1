$response = Invoke-WebRequest -Uri "http://localhost:3000/api/test-conversations" -Method GET
$data = $response.Content | ConvertFrom-Json

if ($data.conversations -and $data.conversations.Count -gt 0) {
    $latestId = $data.conversations[0].id
    Write-Host "Latest conversation ID: $latestId"

    # Fetch full conversation details
    $detailResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/test-conversations?id=$latestId" -Method GET
    $details = $detailResponse.Content | ConvertFrom-Json

    Write-Host "`n=== CONVERSATION $latestId ===" -ForegroundColor Cyan
    Write-Host "Contact: $($details.conversation.contactName)" -ForegroundColor Yellow
    Write-Host "Broker: $($details.conversation.brokerName)" -ForegroundColor Yellow
    Write-Host "Status: $($details.conversation.status)" -ForegroundColor Yellow
    Write-Host "Messages: $($details.conversation.messageCount)" -ForegroundColor Yellow
    Write-Host "`n=== MESSAGES ===" -ForegroundColor Cyan

    foreach ($msg in $details.conversation.messages) {
        $senderType = $msg.sender.type
        $senderName = $msg.sender.name
        $content = $msg.content
        $time = $msg.createdAt

        if ($msg.messageType -eq 0) {
            Write-Host "`n[USER - $time] ${senderName}:" -ForegroundColor Green
        } elseif ($msg.messageType -eq 1) {
            Write-Host "`n[BOT - $time] ${senderName}:" -ForegroundColor Blue
        } else {
            Write-Host "`n[SYSTEM - $time]:" -ForegroundColor Gray
        }
        Write-Host $content
    }
} else {
    Write-Host "No conversations found"
}
