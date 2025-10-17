#!/bin/bash

# Dr. Elena Staging End-to-End Test via Chatwoot API
# Tests the complete flow: Chatwoot → Webhook → Dr. Elena → Response

set -e

echo "🧪 Dr. Elena Staging E2E Test"
echo "================================"
echo ""

# Configuration from .env.local
CHATWOOT_BASE_URL="https://chat.nextnest.sg"
CHATWOOT_API_TOKEN="ML1DyhzJyDKFFvsZLvEYfHnC"
CHATWOOT_ACCOUNT_ID="1"
CHATWOOT_INBOX_ID="1"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "📋 Test Configuration:"
echo "  Base URL: $CHATWOOT_BASE_URL"
echo "  Account ID: $CHATWOOT_ACCOUNT_ID"
echo "  Inbox ID: $CHATWOOT_INBOX_ID"
echo ""

# Step 1: Create a test contact
echo "👤 Step 1: Creating test contact..."
CONTACT_RESPONSE=$(curl -s -X POST \
  "$CHATWOOT_BASE_URL/api/v1/accounts/$CHATWOOT_ACCOUNT_ID/contacts" \
  -H "Api-Access-Token: $CHATWOOT_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "inbox_id": '"$CHATWOOT_INBOX_ID"',
    "name": "Dr Elena Test User",
    "email": "test-dr-elena@nextnest.test",
    "phone_number": "+6512345678",
    "custom_attributes": {
      "lead_score": 75,
      "loan_type": "new_purchase",
      "property_category": "HDB",
      "monthly_income": 6000,
      "property_price": 500000,
      "age": 30,
      "citizenship": "Citizen",
      "property_count": 1,
      "existing_commitments": 500
    }
  }')

CONTACT_ID=$(echo $CONTACT_RESPONSE | grep -o '"id":[0-9]*' | head -1 | grep -o '[0-9]*')

if [ -z "$CONTACT_ID" ]; then
  echo -e "${RED}❌ Failed to create contact${NC}"
  echo "Response: $CONTACT_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✅ Contact created: ID=$CONTACT_ID${NC}"
echo ""

# Step 2: Create a conversation
echo "💬 Step 2: Creating conversation..."
CONVERSATION_RESPONSE=$(curl -s -X POST \
  "$CHATWOOT_BASE_URL/api/v1/accounts/$CHATWOOT_ACCOUNT_ID/conversations" \
  -H "Api-Access-Token: $CHATWOOT_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "inbox_id": '"$CHATWOOT_INBOX_ID"',
    "contact_id": '"$CONTACT_ID"',
    "status": "open"
  }')

CONVERSATION_ID=$(echo $CONVERSATION_RESPONSE | grep -o '"id":[0-9]*' | head -1 | grep -o '[0-9]*')

if [ -z "$CONVERSATION_ID" ]; then
  echo -e "${RED}❌ Failed to create conversation${NC}"
  echo "Response: $CONVERSATION_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✅ Conversation created: ID=$CONVERSATION_ID${NC}"
echo ""

# Step 3: Send test message (triggers Dr. Elena)
echo "📨 Step 3: Sending calculation request..."
MESSAGE_REQUEST="How much can I borrow?"

MESSAGE_RESPONSE=$(curl -s -X POST \
  "$CHATWOOT_BASE_URL/api/v1/accounts/$CHATWOOT_ACCOUNT_ID/conversations/$CONVERSATION_ID/messages" \
  -H "Api-Access-Token: $CHATWOOT_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "'"$MESSAGE_REQUEST"'",
    "message_type": "incoming",
    "private": false
  }')

MESSAGE_ID=$(echo $MESSAGE_RESPONSE | grep -o '"id":[0-9]*' | head -1 | grep -o '[0-9]*')

if [ -z "$MESSAGE_ID" ]; then
  echo -e "${RED}❌ Failed to send message${NC}"
  echo "Response: $MESSAGE_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✅ Message sent: ID=$MESSAGE_ID${NC}"
echo "   Question: \"$MESSAGE_REQUEST\""
echo ""

# Step 4: Wait for AI response (webhook processing)
echo "⏳ Step 4: Waiting for Dr. Elena response (max 15 seconds)..."
WAIT_TIME=0
MAX_WAIT=15
AI_RESPONSE=""

while [ $WAIT_TIME -lt $MAX_WAIT ]; do
  sleep 1
  WAIT_TIME=$((WAIT_TIME + 1))

  # Fetch conversation messages
  MESSAGES=$(curl -s \
    "$CHATWOOT_BASE_URL/api/v1/accounts/$CHATWOOT_ACCOUNT_ID/conversations/$CONVERSATION_ID/messages" \
    -H "Api-Access-Token: $CHATWOOT_API_TOKEN")

  # Look for outgoing (AI) messages after our message
  AI_RESPONSE=$(echo "$MESSAGES" | grep -o '"message_type":1[^}]*"content":"[^"]*"' | grep -o '"content":"[^"]*"' | tail -1 | sed 's/"content":"//' | sed 's/"$//')

  if [ ! -z "$AI_RESPONSE" ] && [ "$AI_RESPONSE" != "$MESSAGE_REQUEST" ]; then
    echo -e "${GREEN}✅ AI response received in ${WAIT_TIME}s${NC}"
    break
  fi

  echo -n "."
done

echo ""
echo ""

if [ -z "$AI_RESPONSE" ] || [ "$AI_RESPONSE" == "$MESSAGE_REQUEST" ]; then
  echo -e "${RED}❌ No AI response received within ${MAX_WAIT} seconds${NC}"
  echo ""
  echo "Troubleshooting steps:"
  echo "1. Check Railway logs: railway logs --follow"
  echo "2. Verify webhook is configured in Chatwoot"
  echo "3. Check if webhook URL is correct"
  exit 1
fi

# Step 5: Validate response content
echo "🔍 Step 5: Validating response content..."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "AI RESPONSE:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "$AI_RESPONSE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Validation checks
VALIDATION_PASSED=true

# Check 1: Contains max loan amount
if echo "$AI_RESPONSE" | grep -qi "341,000\|341000\|340,000\|340000"; then
  echo -e "${GREEN}✅ Check 1: Max loan amount found (~S\$341,000)${NC}"
else
  echo -e "${RED}❌ Check 1: Max loan amount NOT found (expected ~S\$341,000)${NC}"
  VALIDATION_PASSED=false
fi

# Check 2: Contains TDSR
if echo "$AI_RESPONSE" | grep -qi "TDSR\|38%\|38.33"; then
  echo -e "${GREEN}✅ Check 2: TDSR mentioned${NC}"
else
  echo -e "${RED}❌ Check 2: TDSR NOT mentioned${NC}"
  VALIDATION_PASSED=false
fi

# Check 3: Contains limiting factor (MSR for HDB)
if echo "$AI_RESPONSE" | grep -qi "MSR"; then
  echo -e "${GREEN}✅ Check 3: Limiting factor (MSR) mentioned${NC}"
else
  echo -e "${YELLOW}⚠️  Check 3: MSR not explicitly mentioned (acceptable)${NC}"
fi

# Check 4: Response length (should be substantial)
RESPONSE_LENGTH=${#AI_RESPONSE}
if [ $RESPONSE_LENGTH -gt 100 ]; then
  echo -e "${GREEN}✅ Check 4: Response length adequate (${RESPONSE_LENGTH} chars)${NC}"
else
  echo -e "${RED}❌ Check 4: Response too short (${RESPONSE_LENGTH} chars)${NC}"
  VALIDATION_PASSED=false
fi

echo ""

# Step 6: Cleanup (optional - keep conversation for manual review)
echo "🧹 Step 6: Cleanup..."
echo -e "${YELLOW}ℹ️  Keeping test conversation for manual review${NC}"
echo "   Conversation ID: $CONVERSATION_ID"
echo "   View at: $CHATWOOT_BASE_URL/app/accounts/$CHATWOOT_ACCOUNT_ID/conversations/$CONVERSATION_ID"
echo ""

# Final summary
echo "================================"
echo "📊 TEST SUMMARY"
echo "================================"
if [ "$VALIDATION_PASSED" = true ]; then
  echo -e "${GREEN}✅ ALL CHECKS PASSED${NC}"
  echo ""
  echo "Dr. Elena is working correctly in staging!"
  echo ""
  echo "Next steps:"
  echo "  1. Review the response above"
  echo "  2. Check Supabase for audit trail"
  echo "  3. Monitor Railway logs for any errors"
  echo "  4. Ready for production deployment!"
  exit 0
else
  echo -e "${RED}❌ SOME CHECKS FAILED${NC}"
  echo ""
  echo "Review the failures above and:"
  echo "  1. Check Railway logs for errors"
  echo "  2. Verify all environment variables"
  echo "  3. Test webhook manually in Chatwoot"
  exit 1
fi
