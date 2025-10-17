#!/bin/bash

# Test n8n webhook with real conversation ID
# Usage: ./test-n8n-webhook.sh [conversation_id]

CONVERSATION_ID=${1:-123}  # Default to 123 if not provided
N8N_WEBHOOK_URL="https://primary-production-1af6.up.railway.app/webhook/chatwoot-ai-broker"

echo "🚀 Testing n8n webhook with conversation ID: $CONVERSATION_ID"
echo ""

# Create the webhook payload with real conversation ID
PAYLOAD=$(cat <<EOF
{
  "event": "message_created",
  "id": "test-webhook-$(date +%s)",
  "conversation": {
    "id": $CONVERSATION_ID,
    "contact_id": 5679,
    "status": "bot",
    "custom_attributes": {
      "name": "Test User",
      "email": "test@example.com",
      "phone": "+6591234567",
      "lead_score": 85,
      "loan_type": "refinancing",
      "property_category": "private_condo",
      "monthly_income": 12000,
      "loan_amount": 1200000,
      "purchase_timeline": "urgent",
      "employment_type": "self_employed",
      "message_count": 1,
      "status": "bot"
    },
    "contact": {
      "id": 5679,
      "name": "Test User",
      "email": "test@example.com",
      "phone_number": "+6591234567"
    }
  },
  "message": {
    "id": 98766,
    "content": "I need help refinancing my condo loan. Current rates are too high.",
    "message_type": "incoming",
    "created_at": "$(date -u +%Y-%m-%dT%H:%M:%S.000Z)",
    "sender": {
      "id": 5679,
      "type": "contact",
      "name": "Test User"
    }
  },
  "account": {
    "id": 1,
    "name": "NextNest"
  },
  "inbox": {
    "id": 1,
    "name": "Website"
  }
}
EOF
)

# Send the webhook
echo "📤 Sending webhook to: $N8N_WEBHOOK_URL"
echo ""

curl -X POST "$N8N_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "X-Chatwoot-Signature: test-signature" \
  -d "$PAYLOAD" \
  -v

echo ""
echo "✅ Webhook sent! Check n8n execution logs for results."
echo ""
echo "To check if it worked:"
echo "1. Go to n8n workflow executions"
echo "2. Look for the latest execution"
echo "3. Check if conversation ID $CONVERSATION_ID was used"
echo "4. Verify no errors in the workflow"