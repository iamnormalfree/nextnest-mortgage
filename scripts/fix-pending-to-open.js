/**
 * Fix Conversation Status - Change Pending to Open
 * 
 * Chatwoot dashboards typically show "open" conversations by default.
 * This script changes "pending" status conversations to "open" to make them visible.
 */

const CHATWOOT_BASE_URL = 'https://chat.nextnest.sg';
const CHATWOOT_API_TOKEN = process.env.CHATWOOT_API_TOKEN;

if (!CHATWOOT_API_TOKEN) {
  console.error('❌ Error: CHATWOOT_API_TOKEN environment variable is required');
  process.exit(1);
}
const ACCOUNT_ID = 1;
const USER_ID = 1; // Brent's user ID

async function fixPendingToOpen() {
  console.log('🔧 Changing pending conversations to open status...');
  
  try {
    // 1. Get all pending conversations assigned to user
    console.log('\n1. Fetching pending conversations assigned to you...');
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
    const allPendingConversations = pendingData.data.payload;
    
    // Filter for conversations assigned to the user
    const userPendingConversations = allPendingConversations.filter(conv => 
      conv.meta?.assignee?.id === USER_ID
    );
    
    console.log(`Total pending conversations: ${allPendingConversations.length}`);
    console.log(`Pending conversations assigned to you: ${userPendingConversations.length}`);
    
    if (userPendingConversations.length === 0) {
      console.log('✅ No pending conversations assigned to you to fix!');
      return;
    }
    
    // 2. Change each pending conversation to open
    console.log(`\n2. Changing status from pending to open...`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const conversation of userPendingConversations) {
      try {
        console.log(`  Changing conversation ${conversation.id} to open...`);
        
        const statusResponse = await fetch(`${CHATWOOT_BASE_URL}/api/v1/accounts/${ACCOUNT_ID}/conversations/${conversation.id}/toggle_status`, {
          method: 'POST',
          headers: {
            'Api-Access-Token': CHATWOOT_API_TOKEN,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            status: 'open'
          })
        });
        
        if (statusResponse.ok) {
          console.log(`    ✅ Changed conversation ${conversation.id} to open`);
          successCount++;
        } else {
          const errorText = await statusResponse.text();
          console.log(`    ❌ Failed to change conversation ${conversation.id}: ${errorText}`);
          errorCount++;
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.log(`    ❌ Error changing conversation ${conversation.id}: ${error.message}`);
        errorCount++;
      }
    }
    
    console.log(`\n📊 Status Change Results:`);
    console.log(`  ✅ Successfully changed to open: ${successCount}`);
    console.log(`  ❌ Failed to change: ${errorCount}`);
    
    // 3. Verify the fix worked
    console.log('\n3. Verifying fix...');
    
    const verifyResponse = await fetch(`${CHATWOOT_BASE_URL}/api/v1/accounts/${ACCOUNT_ID}/conversations?status=open`, {
      headers: {
        'Api-Access-Token': CHATWOOT_API_TOKEN,
        'Content-Type': 'application/json'
      }
    });
    
    if (verifyResponse.ok) {
      const verifyData = await verifyResponse.json();
      console.log(`📈 Open conversation counts:`);
      console.log(`  Assigned to you: ${verifyData.data.meta.mine_count}`);
      console.log(`  Total open: ${verifyData.data.meta.all_count}`);
      
      console.log('\n🎉 Success! Your conversations should now be visible in the "Open" tab of your dashboard!');
    }
    
  } catch (error) {
    console.error('\n❌ Error fixing conversation status:', error.message);
  }
}

// Alternative: Show conversation status breakdown
async function showConversationsByStatus() {
  console.log('📊 Showing conversation status breakdown...');
  
  const statuses = ['open', 'pending', 'resolved'];
  
  for (const status of statuses) {
    try {
      const response = await fetch(`${CHATWOOT_BASE_URL}/api/v1/accounts/${ACCOUNT_ID}/conversations?status=${status}`, {
        headers: {
          'Api-Access-Token': CHATWOOT_API_TOKEN,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const meta = data.data.meta;
        
        console.log(`\n${status.toUpperCase()} conversations:`);
        console.log(`  Total: ${meta.all_count}`);
        console.log(`  Assigned to you: ${meta.mine_count}`);
        console.log(`  Unassigned: ${meta.unassigned_count}`);
      }
    } catch (error) {
      console.log(`Error fetching ${status} conversations:`, error.message);
    }
  }
}

// Choose what to run
const action = process.argv[2];

if (action === 'show') {
  showConversationsByStatus();
} else {
  fixPendingToOpen();
}