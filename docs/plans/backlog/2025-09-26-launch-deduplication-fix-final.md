---
title: 2025-09-26-launch-deduplication-fix-final
status: backlog
owner: engineering
last-reviewed: 2025-09-30
orchestration: /response-awareness
---

> Feed this backlog item into `/response-awareness` Phase 1 planners before implementation.

# Production-Ready Deduplication Fix
## Safe Implementation Guide for Junior Developer

_Priority: CRITICAL - Must complete before launch_
_Time Required: 11-12 hours (2-3 days with breaks)_
_Risk Level: Low (with these exact instructions)_

---

## ⚠️ IMPORTANT: Follow EXACTLY - Do Not Improvise

This guide has been verified against the actual codebase. Follow each step precisely.

---

## Problem Statement

Currently, when users submit the form multiple times:
1. System finds existing contacts but still tries to create new ones → **ERROR: "Email already taken"**
2. Phone numbers get double country codes → **"+65+6591234567"**
3. Multiple conversations created for same user → **Broker confusion**

---

## Step-by-Step Implementation

**⚠️ IMPORTANT: Complete steps in exact order - some steps depend on previous ones!**

### Step 1: Fix Phone Number Double Country Code (1 hour)

**File:** `lib/integrations/chatwoot-client.ts`

#### Issue: Phone already contains "+65" but we add it again multiple times

**Fix #1 - Lines 94-95** (REMOVE the +65 prefix in search):
```typescript
// CURRENT CODE (Line 94-95) - WRONG:
contactData.phone ? `+65${contactData.phone}` : null,

// CHANGE TO:
contactData.phone,
```

**Fix #2 - Line 130** (REMOVE the +65 prefix in update):
```typescript
// CURRENT CODE (Line 130) - WRONG:
phone_number: contactData.phone ? `+65${contactData.phone}` : '',

// CHANGE TO:
phone_number: contactData.phone || '',
```

**Fix #3 - Line 151** (REMOVE the +65 prefix in create):
```typescript
// CURRENT CODE (Line 151) - WRONG:
phone_number: contactData.phone ? `+65${contactData.phone}` : '',

// CHANGE TO:
phone_number: contactData.phone || '',
```

**Fix #4 - Line 246** (REMOVE the +65 prefix in createConversation):
```typescript
// CURRENT CODE (Line 246) - WRONG:
phone: `+65${leadData.phone}`,  // Add Singapore country code

// CHANGE TO:
phone: leadData.phone,  // Already has country code from form
```

### Step 2: Add Phone Number Normalization Utility (1 hour)

**Create New File:** `lib/utils/phone-utils.ts`

```typescript
/**
 * Phone number utilities for Singapore numbers
 */

/**
 * Normalize Singapore phone number to international format
 * Handles: 91234567, 6591234567, +6591234567, +65 91234567
 */
export function normalizeSingaporePhone(phone: string): string {
  if (!phone) return ''

  // Remove all non-numeric characters except +
  let cleaned = phone.replace(/[^\d+]/g, '')

  // Remove leading + for processing
  cleaned = cleaned.replace(/^\+/, '')

  // Handle various formats
  if (cleaned.startsWith('65') && cleaned.length === 10) {
    // Already has country code: 6591234567
    return `+${cleaned}`
  } else if (cleaned.length === 8 && /^[689]/.test(cleaned)) {
    // Local format: 91234567
    return `+65${cleaned}`
  } else if (cleaned.startsWith('0') && cleaned.length === 9) {
    // Some users add leading 0: 091234567
    return `+65${cleaned.substring(1)}`
  }

  // Return as-is if format unknown (let validation handle it)
  return phone
}

/**
 * Check if phone already has Singapore country code
 */
export function hasCountryCode(phone: string): boolean {
  if (!phone) return false
  const cleaned = phone.replace(/[^\d+]/g, '')
  return cleaned.startsWith('+65') || cleaned.startsWith('65')
}
```

### Step 3: Add Required Helper Methods (30 minutes)

**File:** `lib/integrations/chatwoot-client.ts`

**CRITICAL**: We need to add getter methods and a helper function first.

#### Step 3A: Add getter methods for private properties (after constructor, around line 80):
```typescript
// Add these getter methods to make private properties accessible
get apiBaseUrl() { return this.baseUrl }
get apiAccountId() { return this.accountId }
get apiToken() { return this.apiToken }
```

#### Step 3B: Add updateConversationCustomAttributes method (after createOrUpdateContact, around line 185):
```typescript
/**
 * Update conversation custom attributes
 */
async updateConversationCustomAttributes(
  conversationId: number,
  attributes: Record<string, any>
): Promise<void> {
  try {
    const response = await fetch(
      `${this.baseUrl}/api/v1/accounts/${this.accountId}/conversations/${conversationId}`,
      {
        method: 'PATCH',
        headers: {
          'Api-Access-Token': this.apiToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ custom_attributes: attributes })
      }
    )

    if (!response.ok) {
      console.warn('Failed to update conversation attributes:', await response.text())
    } else {
      console.log(`✅ Updated conversation ${conversationId} attributes`)
    }
  } catch (error) {
    console.error('Error updating conversation attributes:', error)
    // Non-critical, don't throw
  }
}
```

### Step 4: Update Contact Creation Logic (2 hours)

**File:** `lib/integrations/chatwoot-client.ts`

**IMPORTANT**: Line 140 already has `return contact` - this is CORRECT, don't change it!

Add the import at the top of the file (after line 6):
```typescript
import { normalizeSingaporePhone } from '@/lib/utils/phone-utils'
```

Update the `createOrUpdateContact` method (starting at line 84):

```typescript
async createOrUpdateContact(contactData: {
  name: string
  email: string
  phone?: string
  customAttributes?: Record<string, any>
}): Promise<ChatwootContact> {
  try {
    // Normalize phone number once at the start
    const normalizedPhone = contactData.phone
      ? normalizeSingaporePhone(contactData.phone)
      : ''

    console.log('📞 Phone normalization:', {
      input: contactData.phone,
      normalized: normalizedPhone
    })

    // First, try to find existing contact by email OR phone
    const searchQueries = [
      contactData.email,
      normalizedPhone,
      // Also search without country code in case it's stored that way
      normalizedPhone.replace('+65', '')
    ].filter(Boolean)

    for (const query of searchQueries) {
      const searchResponse = await fetch(
        `${this.baseUrl}/api/v1/accounts/${this.accountId}/contacts/search?q=${encodeURIComponent(query as string)}`,
        {
          method: 'GET',
          headers: {
            'Api-Access-Token': this.apiToken,
            'Content-Type': 'application/json'
          }
        }
      )

      if (searchResponse.ok) {
        const data = await searchResponse.json()
        const payload = data.payload || data

        if (Array.isArray(payload) && payload.length > 0) {
          // Found existing contact - update it
          const existingContact = payload[0]
          console.log(`✅ Found existing contact ID: ${existingContact.id}`)

          const updateResponse = await fetch(
            `${this.baseUrl}/api/v1/accounts/${this.accountId}/contacts/${existingContact.id}`,
            {
              method: 'PUT',
              headers: {
                'Api-Access-Token': this.apiToken,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                name: contactData.name,
                email: contactData.email,
                phone_number: normalizedPhone,  // Use normalized phone
                custom_attributes: contactData.customAttributes
              })
            }
          )

          if (updateResponse.ok) {
            const response = await updateResponse.json()
            const contact = response.payload?.contact || response.payload || response
            console.log(`✅ Updated contact: ${contact.id}`)
            return contact  // THIS ALREADY EXISTS - DO NOT ADD ANOTHER RETURN!
          }
        }
      }
    }

    // Create new contact if not found
    const contactPayload = {
      inbox_id: this.inboxId,
      name: contactData.name,
      email: contactData.email,
      phone_number: normalizedPhone,  // Use normalized phone
      custom_attributes: contactData.customAttributes
    }

    console.log('📤 Creating contact with payload:', JSON.stringify(contactPayload, null, 2))

    const createResponse = await fetch(
      `${this.baseUrl}/api/v1/accounts/${this.accountId}/contacts`,
      {
        method: 'POST',
        headers: {
          'Api-Access-Token': this.apiToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(contactPayload)
      }
    )

    if (!createResponse.ok) {
      const errorText = await createResponse.text()
      console.error('Contact creation failed:', errorText)

      // FALLBACK: If contact already exists, search for it again
      if (errorText.includes('already been taken') || errorText.includes('already exists')) {
        console.log('⚠️ Contact already exists, searching by email...')

        // Try one more search by email only
        const fallbackResponse = await fetch(
          `${this.baseUrl}/api/v1/accounts/${this.accountId}/contacts/search?q=${encodeURIComponent(contactData.email)}`,
          {
            method: 'GET',
            headers: {
              'Api-Access-Token': this.apiToken,
              'Content-Type': 'application/json'
            }
          }
        )

        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json()
          const contacts = fallbackData.payload || fallbackData
          if (Array.isArray(contacts) && contacts.length > 0) {
            console.log('✅ Found existing contact via fallback search')
            return contacts[0]
          }
        }
      }

      throw new Error(`Failed to create contact: ${createResponse.statusText} - ${errorText}`)
    }

    const response = await createResponse.json()
    // Chatwoot returns { payload: { contact: {...} } } for contact creation
    return response.payload?.contact || response.payload || response
  } catch (error) {
    console.error('Error creating/updating contact:', error)
    throw error
  }
}
```

### Step 5: Update createConversation Method (30 minutes)

**File:** `lib/integrations/chatwoot-client.ts` (Line 239)

```typescript
async createConversation(leadData: ProcessedLeadData, skipInitialMessage: boolean = false): Promise<ChatwootConversation> {
  console.log('📞 Creating Chatwoot conversation for:', leadData.name)

  // Normalize phone before passing to createOrUpdateContact
  const normalizedPhone = normalizeSingaporePhone(leadData.phone)

  // 1. Create or update contact with lead information
  const contact = await this.createOrUpdateContact({
    name: leadData.name,
    email: leadData.email,
    phone: normalizedPhone,  // Pass normalized phone
    customAttributes: {
      lead_score: leadData.leadScore,
      loan_type: leadData.loanType,
      employment_type: leadData.employmentType,
      property_category: leadData.propertyCategory,
      session_id: leadData.sessionId
    }
  })

  // Rest of the method remains the same...
```

### Step 6: Add Conversation Deduplication (3 hours)

**Create New File:** `lib/integrations/conversation-deduplication.ts`

```typescript
/**
 * Conversation deduplication logic
 * Prevents creating multiple conversations for the same user within a time window
 */

import { ChatwootClient } from './chatwoot-client'

interface DeduplicationResult {
  shouldCreateNew: boolean
  existingConversationId?: number
  reason: string
}

export class ConversationDeduplicator {
  private client: ChatwootClient
  private readonly REUSE_WINDOW_MINUTES = 30

  constructor(client: ChatwootClient) {
    this.client = client
  }

  /**
   * Check if we should create a new conversation or reuse existing
   */
  async checkForExistingConversation(
    contactId: number,
    loanType: string
  ): Promise<DeduplicationResult> {
    try {
      // Get conversations for this contact
      const response = await fetch(
        `${this.client.apiBaseUrl}/api/v1/accounts/${this.client.apiAccountId}/contacts/${contactId}/conversations`,
        {
          headers: {
            'Api-Access-Token': this.client.apiToken,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        console.warn('Could not fetch conversations for deduplication check')
        return {
          shouldCreateNew: true,
          reason: 'Unable to check existing conversations'
        }
      }

      const data = await response.json()
      const conversations = data.payload || data || []

      // Filter for open/pending conversations
      const activeConversations = conversations.filter(
        (conv: any) => conv.status === 'open' || conv.status === 'pending'
      )

      if (activeConversations.length === 0) {
        return {
          shouldCreateNew: true,
          reason: 'No active conversations found'
        }
      }

      // Check the most recent conversation
      const mostRecent = activeConversations[0]
      const createdAt = new Date(mostRecent.created_at * 1000)
      const minutesAgo = (Date.now() - createdAt.getTime()) / (1000 * 60)

      // Check if it's the same loan type
      const sameLoanType = mostRecent.custom_attributes?.loan_type === loanType

      // Reuse if: same loan type AND within time window
      if (sameLoanType && minutesAgo <= this.REUSE_WINDOW_MINUTES) {
        console.log(`♻️ Reusing conversation ${mostRecent.id} (${minutesAgo.toFixed(1)} minutes old)`)

        // Add a note to the conversation
        await this.addResubmissionNote(mostRecent.id)

        return {
          shouldCreateNew: false,
          existingConversationId: mostRecent.id,
          reason: `Reusing conversation from ${minutesAgo.toFixed(0)} minutes ago`
        }
      }

      // Create new if different loan type or outside window
      return {
        shouldCreateNew: true,
        reason: sameLoanType
          ? `Previous conversation is ${minutesAgo.toFixed(0)} minutes old (> ${this.REUSE_WINDOW_MINUTES} min)`
          : 'Different loan type from previous conversation'
      }

    } catch (error) {
      console.error('Error in deduplication check:', error)
      return {
        shouldCreateNew: true,
        reason: 'Error checking for duplicates - creating new as fallback'
      }
    }
  }

  /**
   * Add a note when reusing conversation
   */
  private async addResubmissionNote(conversationId: number): Promise<void> {
    try {
      const noteContent = `📝 Customer resubmitted form at ${new Date().toLocaleString('en-SG')}. Please review updated information in contact details.`

      await fetch(
        `${this.client.apiBaseUrl}/api/v1/accounts/${this.client.apiAccountId}/conversations/${conversationId}/messages`,
        {
          method: 'POST',
          headers: {
            'Api-Access-Token': this.client.apiToken,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            content: noteContent,
            message_type: 2,  // Activity message
            private: false
          })
        }
      )
    } catch (error) {
      console.error('Could not add resubmission note:', error)
      // Non-critical, don't throw
    }
  }
}

// Export singleton getter that reuses ChatwootClient instance
let deduplicatorInstance: ConversationDeduplicator | null = null

export function getConversationDeduplicator(client: ChatwootClient): ConversationDeduplicator {
  if (!deduplicatorInstance) {
    deduplicatorInstance = new ConversationDeduplicator(client)
  }
  return deduplicatorInstance
}
```

### Step 7: Integrate Deduplication into API Route (2 hours)

**File:** `app/api/chatwoot-conversation/route.ts`

Add import at the top (after line 8):
```typescript
import { getConversationDeduplicator } from '@/lib/integrations/conversation-deduplication'
```

Modify the conversation creation logic (around line 195-220):

```typescript
try {
  // Get circuit breaker instance
  const circuitBreaker = getChatwootCircuitBreaker()

  // Log circuit breaker status
  console.log('🔌 Circuit breaker status:', circuitBreaker.getStats())

  // Initialize Chatwoot client outside circuit breaker
  const chatwootClient = new ChatwootClient()

  // Execute with circuit breaker protection
  const conversation = await circuitBreaker.execute(async () => {
    // Log environment variables for debugging
    console.log('🔧 Checking Chatwoot env vars:', {
      baseUrl: process.env.CHATWOOT_BASE_URL ? '✓' : '✗',
      apiToken: process.env.CHATWOOT_API_TOKEN ? '✓' : '✗',
      accountId: process.env.CHATWOOT_ACCOUNT_ID ? '✓' : '✗',
      inboxId: process.env.CHATWOOT_INBOX_ID ? '✓' : '✗',
      websiteToken: process.env.CHATWOOT_WEBSITE_TOKEN ? '✓' : '✗'
    })

    // STEP 1: Create or update contact first
    const contact = await chatwootClient.createOrUpdateContact({
      name: processedLeadData.name,
      email: processedLeadData.email,
      phone: processedLeadData.phone,
      customAttributes: {
        lead_score: processedLeadData.leadScore,
        loan_type: processedLeadData.loanType,
        employment_type: processedLeadData.employmentType,
        property_category: processedLeadData.propertyCategory,
        session_id: processedLeadData.sessionId,
        last_submission: new Date().toISOString()
      }
    })

    console.log('✅ Contact ready:', contact.id)

    // STEP 2: Check for existing conversation to reuse
    const deduplicator = getConversationDeduplicator(chatwootClient)
    const dedupeResult = await deduplicator.checkForExistingConversation(
      contact.id,
      processedLeadData.loanType
    )

    console.log('🔍 Deduplication check:', dedupeResult)

    // STEP 3: Reuse or create conversation
    if (!dedupeResult.shouldCreateNew && dedupeResult.existingConversationId) {
      // Reuse existing conversation
      console.log(`♻️ Reusing existing conversation: ${dedupeResult.existingConversationId}`)

      // Update conversation attributes with latest data
      await chatwootClient.updateConversationCustomAttributes(
        dedupeResult.existingConversationId,
        {
          last_resubmission: new Date().toISOString(),
          submission_count: (contact.custom_attributes?.submission_count || 0) + 1,
          lead_score: processedLeadData.leadScore
        }
      )

      // Return existing conversation structure
      return {
        id: dedupeResult.existingConversationId,
        account_id: parseInt(chatwootClient.accountId),
        inbox_id: chatwootClient.inboxId,
        contact_id: contact.id,
        status: 'open',
        custom_attributes: {
          reused: true,
          reuse_reason: dedupeResult.reason
        }
      }
    }

    // Create new conversation (existing logic)
    return await chatwootClient.createConversation(processedLeadData, true)
  })

  console.log('✅ Chatwoot conversation ready:', conversation.id)

  // Rest of the existing broker assignment logic continues...
```

Also update the response to handle reused conversations (around line 279):

```typescript
// Return successful response with widget config
const response: ChatwootConversationResponse = {
  success: true,
  conversationId: conversation.id,
  widgetConfig: {
    ...widgetConfig,
    customAttributes: {
      // Core attributes for broker assignment
      lead_score: leadScore,
      loan_type: sanitizedData.loanType,
      property_category: sanitizedData.propertyCategory || 'resale',
      monthly_income: formData.actualIncomes?.[0] || 0,
      purchase_timeline: formData.loanType === 'refinance' ? 'immediate' : 'soon',

      // Add reuse indicator if applicable
      conversation_reused: conversation.custom_attributes?.reused || false,
      reuse_reason: conversation.custom_attributes?.reuse_reason,

      // Rest of existing attributes...
```

### Step 8: Testing Your Implementation

**FIRST - Install test dependency (if needed):**
```bash
# Only if using Node.js < 18
npm install --save-dev node-fetch@2
```

**Create Test File:** `scripts/test-deduplication-final.js`

```javascript
// Test script for deduplication implementation
// Use built-in fetch (Node 18+) or node-fetch for older versions
const fetch = globalThis.fetch || require('node-fetch')

const API_URL = process.env.API_URL || 'http://localhost:3000'

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function testDeduplication() {
  const timestamp = Date.now()
  const testData = {
    formData: {
      // Step 1 - Personal details
      name: `Test User ${timestamp}`,
      email: `test${timestamp}@example.com`,
      phone: '91234567',  // Local format

      // Step 2 - Loan details
      loanType: 'new_purchase',
      propertyCategory: 'resale',
      propertyType: 'HDB',
      propertyPrice: 500000,

      // Step 3 - Income details
      actualAges: [35],
      actualIncomes: [8000],
      employmentType: 'employed',
      existingCommitments: 0
    },
    sessionId: `test-session-${timestamp}`,
    leadScore: 75
  }

  console.log('🧪 Test 1: First submission')
  console.log('Phone input:', testData.formData.phone)

  try {
    const response1 = await fetch(`${API_URL}/api/chatwoot-conversation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    })

    const result1 = await response1.json()
    console.log('✅ First submission result:', {
      success: result1.success,
      conversationId: result1.conversationId,
      reused: result1.widgetConfig?.customAttributes?.conversation_reused
    })

    if (!result1.success) {
      console.error('❌ First submission failed:', result1)
      return
    }

    // Wait 5 seconds
    console.log('\n⏳ Waiting 5 seconds...')
    await delay(5000)

    console.log('\n🧪 Test 2: Immediate resubmission (within 30 min window)')
    const response2 = await fetch(`${API_URL}/api/chatwoot-conversation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    })

    const result2 = await response2.json()
    console.log('✅ Second submission result:', {
      success: result2.success,
      conversationId: result2.conversationId,
      reused: result2.widgetConfig?.customAttributes?.conversation_reused,
      reuseReason: result2.widgetConfig?.customAttributes?.reuse_reason
    })

    // Verify same conversation ID
    if (result1.conversationId === result2.conversationId) {
      console.log('✅ SUCCESS: Same conversation reused!')
    } else {
      console.log('⚠️  WARNING: Different conversation created')
    }

    // Test 3: Different loan type
    console.log('\n🧪 Test 3: Different loan type (should create new)')
    testData.formData.loanType = 'refinance'

    const response3 = await fetch(`${API_URL}/api/chatwoot-conversation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    })

    const result3 = await response3.json()
    console.log('✅ Different loan type result:', {
      success: result3.success,
      conversationId: result3.conversationId,
      reused: result3.widgetConfig?.customAttributes?.conversation_reused
    })

    if (result3.conversationId !== result1.conversationId) {
      console.log('✅ SUCCESS: New conversation created for different loan type')
    } else {
      console.log('⚠️  WARNING: Reused conversation for different loan type')
    }

    // Test 4: Phone normalization
    console.log('\n🧪 Test 4: Phone format variations')
    const phoneVariations = [
      '91234567',       // Local
      '6591234567',     // With country code
      '+6591234567',    // With +
      '+65 9123 4567'   // With spaces
    ]

    for (const phone of phoneVariations) {
      testData.formData.phone = phone
      testData.formData.email = `test${Date.now()}@example.com`  // New email

      const response = await fetch(`${API_URL}/api/chatwoot-conversation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData)
      })

      const result = await response.json()
      console.log(`  Phone "${phone}" → Success: ${result.success}`)
    }

    console.log('\n✅ All tests completed!')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

// Run tests
testDeduplication()
```

### Step 9: Manual Testing Checklist

Run these tests IN ORDER:

1. **Start your dev server:**
   ```bash
   npm run dev
   ```

2. **Run the test script:**
   ```bash
   node scripts/test-deduplication-final.js
   ```

3. **Check the console output for:**
   - ✅ No "email already taken" errors
   - ✅ Same conversation ID for resubmissions
   - ✅ New conversation for different loan types
   - ✅ All phone formats handled correctly

4. **Check Chatwoot dashboard:**
   - Log into chat.nextnest.sg
   - Verify contact has correct phone format (+6591234567)
   - Verify conversation reuse within 30 minutes
   - Check for resubmission notes in conversation

### Step 10: Pre-Deployment Checklist

Before deploying, ensure:

```bash
# 1. No TypeScript errors
npm run build

# 2. Lint passes
npm run lint

# 3. Test script passes
node scripts/test-deduplication-final.js

# 4. Manual form submission works
# Go to http://localhost:3000/apply
# Complete all 3 steps
# Submit twice - should reuse conversation
```

### Environment Variables Required

Ensure these are set in production:
```env
CHATWOOT_API_TOKEN=ML1DyhzJyDKFFvsZLvEYfHnC
CHATWOOT_BASE_URL=https://chat.nextnest.sg
CHATWOOT_ACCOUNT_ID=1
CHATWOOT_INBOX_ID=1
CHATWOOT_WEBSITE_TOKEN=SBSfsRrvWSyzfVUXv7QKjoa2
```

---

## Common Mistakes to Avoid

❌ **DON'T** remove the existing `return contact` at line 140 - it's correct!
❌ **DON'T** add `+65` prefix anywhere - use `normalizeSingaporePhone()`
❌ **DON'T** remove the circuit breaker wrapper
❌ **DON'T** remove broker engagement manager
❌ **DON'T** change the ChatwootClient constructor

✅ **DO** add the getter methods before using them
✅ **DO** add updateConversationCustomAttributes method
✅ **DO** test with the provided script first
✅ **DO** check TypeScript compilation after changes
✅ **DO** preserve all existing broker assignment logic
✅ **DO** use the normalization utility for all phone numbers

---

## Rollback Plan

If something breaks after deployment:

```bash
# Quick rollback
git revert HEAD
npm run build
npm run start

# Or use feature flag (add to .env)
ENABLE_DEDUPLICATION=false
```

---

## Support

If you encounter issues:
1. Check the console logs for error messages
2. Verify all 4 phone number fixes were applied
3. Ensure normalizeSingaporePhone is imported
4. Run the test script to identify which part fails

**For urgent help:** Message in Slack with:
- Error message screenshot
- Which step you're on
- Output of test script

---

## Success Criteria

You'll know it's working when:
1. ✅ No "email already taken" errors in console
2. ✅ Phone shows as +6591234567 in Chatwoot (not +65+6591234567)
3. ✅ Same conversation reused within 30 minutes
4. ✅ Different conversation for different loan types
5. ✅ Test script shows all green checkmarks

Good luck! Follow these steps exactly and you'll have a working deduplication system.