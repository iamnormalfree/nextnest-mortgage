$uri = "https://chat.nextnest.sg/api/v1/accounts/1/webhooks/1"
$headers = @{
    "Api-Access-Token" = "ML1DyhzJyDKFFvsZLvEYfHnC"
    "Content-Type" = "application/json"
}
$body = @{
    subscriptions = @("message_created")
} | ConvertTo-Json

Write-Host "Updating webhook subscriptions..."
$response = Invoke-WebRequest -Uri $uri -Method PUT -Headers $headers -Body $body
Write-Host "Response: $($response.StatusCode)"
Write-Host $response.Content

Write-Host "`nVerifying webhook configuration..."
$verify = Invoke-WebRequest -Uri "https://chat.nextnest.sg/api/v1/accounts/1/webhooks" -Headers @{"Api-Access-Token"="ML1DyhzJyDKFFvsZLvEYfHnC"}
Write-Host $verify.Content
