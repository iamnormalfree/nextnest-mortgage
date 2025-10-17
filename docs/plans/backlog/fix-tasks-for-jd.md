# Fix Tasks for Remaining Issues
## Implementation Guide for Junior Developer

_Priority: HIGH - Fix before production launch_
_Time Required: 2-3 hours_
_Complexity: Medium_

---

## Issue 1: Different Loan Types Incorrectly Reusing Conversations

### Problem
When a user submits with a different loan type (e.g., changes from "new_purchase" to "refinance"), the system is still reusing the same conversation instead of creating a new one.

### Root Cause
The loan_type is not being properly stored in conversation custom_attributes when the conversation is created.

### Fix Steps

#### Step 1: Add Debug Logging (5 minutes)
**File:** `lib/integrations/conversation-deduplication.ts`
**Line 70** - Add debugging BEFORE the comparison:

```typescript
// Add this debug log right before line 70
console.log('🔍 Loan type comparison debug:', {
  conversationId: mostRecent.id,
  storedLoanType: mostRecent.custom_attributes?.loan_type,
  incomingLoanType: loanType,
  allAttributes: mostRecent.custom_attributes
})

// Check if it's the same loan type (existing line 70)
const sameLoanType = mostRecent.custom_attributes?.loan_type === loanType
```

#### Step 2: Ensure Loan Type is Stored in Conversation (15 minutes)
**File:** `lib/integrations/chatwoot-client.ts`
**Function:** `createConversationWithContext` (around line 232-279)

**Find this section** (around line 239-247):
```typescript
const enhancedAttributes = {
  ...params.custom_attributes,
  conversation_status: 'bot',
  message_count: 0,
  created_at: new Date().toISOString()
}
```

**Make sure loan_type is included:**
```typescript
const enhancedAttributes = {
  ...params.custom_attributes,
  conversation_status: 'bot',
  message_count: 0,
  created_at: new Date().toISOString(),
  // ENSURE loan_type is explicitly set
  loan_type: params.custom_attributes.loan_type
}

console.log('📝 Creating conversation with attributes:', {
  conversationId: 'new',
  loan_type: enhancedAttributes.loan_type,
  all_attributes: enhancedAttributes
})
```

#### Step 3: Verify Loan Type is Passed Correctly (10 minutes)
**File:** `lib/integrations/chatwoot-client.ts`
**Function:** `createConversation` (around line 307-336)

Check that loan_type is being passed in custom_attributes:
```typescript
custom_attributes: {
  lead_score: leadData.leadScore,
  broker_persona: leadData.brokerPersona.type,
  loan_type: leadData.loanType,  // <-- MAKE SURE THIS LINE EXISTS
  // ... rest of attributes
}
```

#### Step 4: Test the Fix
1. Run the test script again:
```bash
node scripts/test-deduplication-final.js
```

2. Check console output for the new debug logs
3. Verify that different loan types create new conversations

---

## Issue 2: No Brokers Available in Database

### Problem
All broker assignment attempts show "Found 0 available brokers" meaning the Supabase database has no active brokers.

### Root Cause
Either:
1. Supabase is not connected
2. The ai_brokers table is empty
3. All brokers are marked as unavailable

### Fix Steps

#### Step 1: Check Supabase Connection (10 minutes)
**File:** Create `scripts/check-broker-database.js`

```javascript
// scripts/check-broker-database.js
const { createClient } = require('@supabase/supabase-js')

// Use environment variables or hardcoded values for testing
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_KEY'

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  console.log('Please set:')
  console.log('  NEXT_PUBLIC_SUPABASE_URL')
  console.log('  SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkBrokers() {
  console.log('🔍 Checking Supabase connection...')

  // 1. Test connection
  const { data: testData, error: testError } = await supabase
    .from('ai_brokers')
    .select('count')
    .limit(1)

  if (testError) {
    console.error('❌ Cannot connect to Supabase:', testError)
    console.log('\n📝 Possible fixes:')
    console.log('1. Check your Supabase URL and service key')
    console.log('2. Make sure the ai_brokers table exists')
    console.log('3. Check network/firewall settings')
    return
  }

  // 2. Check all brokers
  const { data: allBrokers, error: allError } = await supabase
    .from('ai_brokers')
    .select('*')

  if (allError) {
    console.error('❌ Error fetching brokers:', allError)
    return
  }

  console.log(`\n📊 Broker Database Status:`)
  console.log(`Total brokers: ${allBrokers?.length || 0}`)

  if (allBrokers && allBrokers.length > 0) {
    const active = allBrokers.filter(b => b.is_active)
    const available = allBrokers.filter(b => b.is_available)

    console.log(`Active brokers: ${active.length}`)
    console.log(`Available brokers: ${available.length}`)

    console.log('\n👥 Broker Details:')
    allBrokers.forEach(broker => {
      console.log(`  - ${broker.name}:`)
      console.log(`    ID: ${broker.id}`)
      console.log(`    Active: ${broker.is_active}`)
      console.log(`    Available: ${broker.is_available}`)
      console.log(`    Personality: ${broker.personality_type}`)
    })
  } else {
    console.log('\n⚠️ No brokers found in database!')
    console.log('You need to populate the ai_brokers table.')
  }

  // 3. Check if table structure is correct
  const { data: columns } = await supabase
    .rpc('get_table_columns', { table_name: 'ai_brokers' })
    .single()

  if (columns) {
    console.log('\n📋 Table structure:', columns)
  }
}

checkBrokers()
```

#### Step 2: Create Brokers if Missing (20 minutes)
**File:** Create `scripts/seed-brokers.js`

```javascript
// scripts/seed-brokers.js
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_KEY'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const brokers = [
  {
    id: 'broker_1',
    name: 'Jasmine Lee',
    slug: 'jasmine-lee',
    personality_type: 'aggressive',
    specialization: 'new_purchase',
    is_active: true,
    is_available: true,
    capacity: 5,
    current_load: 0,
    bio: 'Top performer specializing in quick approvals'
  },
  {
    id: 'broker_2',
    name: 'David Tan',
    slug: 'david-tan',
    personality_type: 'balanced',
    specialization: 'refinance',
    is_active: true,
    is_available: true,
    capacity: 5,
    current_load: 0,
    bio: 'Experienced broker with balanced approach'
  },
  {
    id: 'broker_3',
    name: 'Sarah Chen',
    slug: 'sarah-chen',
    personality_type: 'conservative',
    specialization: 'commercial',
    is_active: true,
    is_available: true,
    capacity: 5,
    current_load: 0,
    bio: 'Careful and thorough, perfect for complex cases'
  }
]

async function seedBrokers() {
  console.log('🌱 Seeding brokers...')

  for (const broker of brokers) {
    const { error } = await supabase
      .from('ai_brokers')
      .upsert(broker, { onConflict: 'id' })

    if (error) {
      console.error(`❌ Error inserting ${broker.name}:`, error)
    } else {
      console.log(`✅ Created/Updated broker: ${broker.name}`)
    }
  }

  console.log('\n✅ Seeding complete!')
}

seedBrokers()
```

#### Step 3: Fix Environment Variables (10 minutes)
**File:** `.env.local`

Make sure these are set:
```env
# Supabase (Required for broker assignment)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# If you don't have Supabase, add this flag to disable broker assignment
DISABLE_BROKER_ASSIGNMENT=true
```

#### Step 4: Add Fallback for No Database (15 minutes)
**File:** `lib/ai/broker-assignment.ts`
**Line 20-33** - Add fallback logic:

```typescript
// Query available brokers
const { data: brokers, error: brokersError } = await supabaseAdmin
  .from('ai_brokers')
  .select('*')
  .eq('is_active', true)
  .eq('is_available', true);

if (brokersError) {
  console.error('❌ Error fetching brokers:', brokersError);

  // FALLBACK: If database is not available, return a default broker
  if (process.env.DISABLE_BROKER_ASSIGNMENT === 'true') {
    console.log('⚠️ Broker assignment disabled - using default broker');
    return {
      id: 'default_broker',
      name: 'AI Mortgage Specialist',
      personality_type: 'balanced',
      is_available: true
    };
  }

  return null;
}
```

---

## Testing Checklist

After implementing all fixes:

1. **Test Loan Type Deduplication:**
```bash
node scripts/test-deduplication-final.js
```
- ✅ Same loan type within 30 min → reuses conversation
- ✅ Different loan type → creates new conversation
- ✅ After 30 minutes → creates new conversation

2. **Test Broker Database:**
```bash
node scripts/check-broker-database.js
```
- ✅ Shows connection status
- ✅ Lists all brokers
- ✅ Shows available count

3. **Seed Brokers if Needed:**
```bash
node scripts/seed-brokers.js
```

4. **Test Complete Flow:**
```bash
# Start dev server
npm run dev

# In another terminal
node scripts/test-deduplication-final.js
```

---

## Expected Results

### Success Indicators:
1. **Loan Type Fix:**
   - Console shows: "Different loan type from previous conversation"
   - New conversation ID for different loan types

2. **Broker Fix:**
   - Console shows: "✅ Found 3 available brokers"
   - Broker gets assigned to conversation

### If Still Having Issues:

1. **Loan Type Still Reusing:**
   - Check if Chatwoot is actually saving custom_attributes
   - Try fetching a conversation via API to see its attributes
   - May need to use a different field name (e.g., `form_loan_type`)

2. **Brokers Still Not Found:**
   - Database connection issue
   - Table doesn't exist
   - Need to run migrations
   - Firewall blocking Supabase

---

## Time Estimate
- Issue 1 (Loan Type): 30-45 minutes
- Issue 2 (Brokers): 45-60 minutes
- Testing: 30 minutes
- **Total: 2-3 hours**

---

## Notes for JD

1. **Start with Issue 1** - It's simpler and more critical
2. **Add all debug logs** - Don't skip them, they help identify issues
3. **Test after each step** - Don't wait until the end
4. **If Supabase is not available**, use the DISABLE_BROKER_ASSIGNMENT flag
5. **Save your work** frequently - commit after each working fix

Good luck! These fixes should resolve the remaining issues. 🚀

---

## Outstanding Tasks After Audit

- [x] Update `scripts/check-broker-database.js` to call the `get_table_columns` RPC so table structure validation runs as documented in Step 1.
- [x] Capture and attach the latest output from `node scripts/test-deduplication-final.js` showing the new loan-type debug logs for future verification.
