/**
 * Fix Chatwoot UI Bug - Assign Pending Conversations 
 * 
 * This script fixes the known Chatwoot issue where conversations with 
 * status: "pending" and assignee_id: null don't appear in the dashboard
 * even in the "Unassigned" tab.
 * 
 * GitHub Issue: https://github.com/chatwoot/chatwoot/issues/12131
 */

const CHATWOOT_BASE_URL = 'https://chat.nextnest.sg';
const CHATWOOT_API_TOKEN = process.env.CHATWOOT_API_TOKEN;

if (!CHATWOOT_API_TOKEN) {
  console.error('❌ Error: CHATWOOT_API_TOKEN environment variable is required');
  process.exit(1);
}
const ACCOUNT_ID = 1;
const USER_ID = 1; // Brent's user ID

async function fixUnassignedConversations() {
  console.log('🔧 Fixing unassigned conversation visibility bug...');
  
  try {
    // 1. Get all pending conversations (these are the invisible ones)
    console.log('\n1. Fetching pending conversations...');
    const pendingResponse = await fetch(`${CHATWOOT_BASE_URL}/api/v1/accounts/${ACCOUNT_ID}/conversations?status=pending`, {
      headers: {
        'Api-Access-Token': CHATWOOT_API_TOKEN,
        'Content-Type': 'application/json'
      }
    });
    
    if (!pendingResponse.ok) {
      throw new Error(`Failed to fetch pending conversations: ${pendingResponse.status}`);
    }
    
    const pendingData = await pendingResponse.json();
    const pendingConversations = pendingData.data.payload;
    
    console.log(`Found ${pendingConversations.length} pending conversations`);
    console.log(`Unassigned count from API: ${pendingData.data.meta.unassigned_count}`);
    
    if (pendingConversations.length === 0) {
      console.log('✅ No pending conversations to fix!');
      return;
    }
    
    // 2. Assign each pending conversation to the user
    console.log(`\n2. Assigning conversations to user ${USER_ID}...`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const conversation of pendingConversations) {
      try {
        console.log(`  Assigning conversation ${conversation.id}...`);
        
        const assignResponse = await fetch(`${CHATWOOT_BASE_URL}/api/v1/accounts/${ACCOUNT_ID}/conversations/${conversation.id}/assignments`, {
          method: 'POST',
          headers: {
            'Api-Access-Token': CHATWOOT_API_TOKEN,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            assignee_id: USER_ID
          })
        });
        
        if (assignResponse.ok) {
          console.log(`    ✅ Assigned conversation ${conversation.id}`);
          successCount++;
        } else {
          const errorText = await assignResponse.text();
          console.log(`    ❌ Failed to assign conversation ${conversation.id}: ${errorText}`);
          errorCount++;
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.log(`    ❌ Error assigning conversation ${conversation.id}: ${error.message}`);
        errorCount++;
      }
    }
    
    console.log(`\n📊 Assignment Results:`);
    console.log(`  ✅ Successfully assigned: ${successCount}`);
    console.log(`  ❌ Failed to assign: ${errorCount}`);
    
    // 3. Verify the fix worked
    console.log('\n3. Verifying fix...');
    
    const verifyResponse = await fetch(`${CHATWOOT_BASE_URL}/api/v1/accounts/${ACCOUNT_ID}/conversations`, {
      headers: {
        'Api-Access-Token': CHATWOOT_API_TOKEN,
        'Content-Type': 'application/json'
      }
    });
    
    if (verifyResponse.ok) {
      const verifyData = await verifyResponse.json();
      console.log(`📈 New conversation counts:`);
      console.log(`  Assigned to you: ${verifyData.data.meta.mine_count}`);
      console.log(`  Total assigned: ${verifyData.data.meta.assigned_count}`);
      console.log(`  Unassigned: ${verifyData.data.meta.unassigned_count}`);
      console.log(`  Total: ${verifyData.data.meta.all_count}`);
      
      if (verifyData.data.meta.unassigned_count === 0) {
        console.log('\n🎉 Success! All conversations are now assigned and should be visible in your dashboard!');
      } else {
        console.log(`\n⚠️ ${verifyData.data.meta.unassigned_count} conversations are still unassigned`);
      }
    }
    
  } catch (error) {
    console.error('\n❌ Error fixing conversations:', error.message);
    console.log('\n🔍 This might be due to:');
    console.log('1. Network connectivity issues');
    console.log('2. API token permissions');
    console.log('3. User ID not found');
    console.log('4. Rate limiting');
  }
}

// Alternative: Just show the conversations that would be assigned
async function showUnassignedConversations() {
  console.log('🔍 Showing unassigned conversations that are invisible in UI...');
  
  try {
    const response = await fetch(`${CHATWOOT_BASE_URL}/api/v1/accounts/${ACCOUNT_ID}/conversations?status=pending`, {
      headers: {
        'Api-Access-Token': CHATWOOT_API_TOKEN,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }
    
    const data = await response.json();
    const conversations = data.data.payload;
    
    console.log(`\n📋 Found ${conversations.length} invisible conversations:`);
    
    conversations.forEach((conv, index) => {
      console.log(`\n${index + 1}. Conversation ID: ${conv.id}`);
      console.log(`   Status: ${conv.status}`);
      console.log(`   Assignee: ${conv.meta?.assignee?.name || 'Unassigned'}`);
      console.log(`   Contact: ${conv.meta?.sender?.name || 'Unknown'}`);
      console.log(`   Last activity: ${new Date(conv.last_activity_at * 1000).toLocaleString()}`);
      console.log(`   Custom attributes: ${JSON.stringify(conv.custom_attributes || {}, null, 2)}`);
    });
    
    console.log(`\n💡 To make these visible, run: fixUnassignedConversations()`);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Choose what to run
const action = process.argv[2];

if (action === 'show') {
  showUnassignedConversations();
} else {
  fixUnassignedConversations();
}