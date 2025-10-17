/**
 * Debug conversation status and visibility
 */

const CHATWOOT_BASE_URL = 'https://chat.nextnest.sg';
const CHATWOOT_API_TOKEN = process.env.CHATWOOT_API_TOKEN;

if (!CHATWOOT_API_TOKEN) {
  console.error('❌ Error: CHATWOOT_API_TOKEN environment variable is required');
  process.exit(1);
}
const ACCOUNT_ID = 1;

async function debugConversationStatus() {
  console.log('🔧 Debugging conversation status and visibility...');
  
  const statuses = ['open', 'resolved', 'pending', 'snoozed'];
  
  for (const status of statuses) {
    try {
      console.log(`\n📊 Checking ${status} conversations...`);
      
      const response = await fetch(`${CHATWOOT_BASE_URL}/api/v1/accounts/${ACCOUNT_ID}/conversations?status=${status}`, {
        headers: {
          'Api-Access-Token': CHATWOOT_API_TOKEN,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const meta = data.data.meta;
        const conversations = data.data.payload;
        
        console.log(`  Total: ${meta.all_count}`);
        console.log(`  Mine: ${meta.mine_count}`);
        console.log(`  Assigned: ${meta.assigned_count}`);
        console.log(`  Unassigned: ${meta.unassigned_count}`);
        
        if (conversations.length > 0) {
          console.log(`  Recent conversation IDs: ${conversations.slice(0, 5).map(c => c.id).join(', ')}`);
          
          // Show status breakdown
          const statusCount = {};
          conversations.forEach(conv => {
            statusCount[conv.status] = (statusCount[conv.status] || 0) + 1;
          });
          console.log(`  Status breakdown:`, statusCount);
        }
      } else {
        console.log(`  ❌ Failed to fetch ${status} conversations:`, response.status);
      }
      
    } catch (error) {
      console.log(`  ❌ Error fetching ${status} conversations:`, error.message);
    }
  }
  
  // Check specific conversation details
  console.log('\n🔍 Checking specific recent conversations...');
  const testIds = [71, 70, 69, 68];
  
  for (const id of testIds) {
    try {
      const response = await fetch(`${CHATWOOT_BASE_URL}/api/v1/accounts/${ACCOUNT_ID}/conversations/${id}`, {
        headers: {
          'Api-Access-Token': CHATWOOT_API_TOKEN,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const conv = await response.json();
        console.log(`Conversation ${id}:`);
        console.log(`  Status: ${conv.status}`);
        console.log(`  Assignee: ${conv.meta?.assignee?.name || 'None'}`);
        console.log(`  Inbox: ${conv.inbox_id}`);
        console.log(`  Contact: ${conv.meta?.sender?.name}`);
        console.log(`  Messages: ${conv.messages?.length || 0}`);
      } else {
        console.log(`Conversation ${id}: ❌ ${response.status}`);
      }
    } catch (error) {
      console.log(`Conversation ${id}: ❌ ${error.message}`);
    }
  }
}

debugConversationStatus();