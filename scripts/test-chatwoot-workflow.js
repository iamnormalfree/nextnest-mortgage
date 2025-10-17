/**
 * Test script to create a pending conversation for n8n workflow testing
 * This will trigger your n8n workflow to enhance the conversation
 */

const API_BASE = 'https://chat.nextnest.sg/api/v1/accounts/1';
const API_TOKEN = process.env.CHATWOOT_API_TOKEN;

if (!API_TOKEN) {
  console.error('❌ Error: CHATWOOT_API_TOKEN environment variable is required');
  process.exit(1);
}
const INBOX_ID = 1;

const headers = {
  'Api-Access-Token': API_TOKEN,
  'Content-Type': 'application/json'
};

async function createTestConversation() {
  try {
    console.log('🧪 Creating test conversation for n8n workflow...');
    
    // Create a conversation that will be "pending" status
    const response = await fetch(`${API_BASE}/conversations`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        source_id: `test-${Date.now()}@nextnest.sg`,
        inbox_id: INBOX_ID,
        contact_attributes: {
          name: 'Test User',
          email: `test-${Date.now()}@nextnest.sg`
        },
        custom_attributes: {
          ai_broker_name: 'Marcus Chen',
          ai_broker_persona: 'aggressive',
          property_type: 'EC',
          loan_type: 'new_purchase',
          monthly_income: 5000,
          lead_score: 100,
          employment_status: 'employed',
          age: 30
        }
      })
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const conversation = await response.json();
    
    console.log('✅ Test conversation created!');
    console.log(`📋 Conversation ID: ${conversation.id}`);
    console.log(`📊 Status: ${conversation.status} (should be "pending")`);
    console.log(`🔗 URL: https://chat.nextnest.sg/app/accounts/1/conversations/${conversation.id}`);
    console.log('');
    console.log('🕐 Your n8n workflow should process this in the next minute!');
    console.log('');
    console.log('📝 What to expect:');
    console.log('   ✅ Status will change from "pending" to "open"');
    console.log('   ✅ Will be assigned to user (visible in dashboard)');
    console.log('   ✅ Will get labels: AI-Broker-Marcus + Property-EC');
    console.log('   ✅ Will get user form message');
    console.log('   ✅ Will get Marcus Chen introduction');
    
    return conversation.id;
    
  } catch (error) {
    console.error('❌ Failed to create test conversation:', error.message);
    return null;
  }
}

async function checkConversationStatus(conversationId) {
  try {
    const response = await fetch(`${API_BASE}/conversations/${conversationId}`, {
      headers: { 'Api-Access-Token': API_TOKEN }
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const conversation = await response.json();
    
    console.log(`📊 Conversation ${conversationId} Status Check:`);
    console.log(`   Status: ${conversation.status}`);
    console.log(`   Assignee: ${conversation.assignee?.name || 'Unassigned'}`);
    console.log(`   Labels: ${conversation.labels?.map(l => l.title).join(', ') || 'None'}`);
    console.log(`   Messages: ${conversation.messages?.length || 0}`);
    
    return conversation;
    
  } catch (error) {
    console.error('❌ Failed to check conversation:', error.message);
    return null;
  }
}

async function runTest() {
  console.log('🚀 Starting Chatwoot n8n Workflow Test\n');
  
  // Step 1: Create test conversation
  const conversationId = await createTestConversation();
  
  if (!conversationId) {
    console.log('❌ Test failed - could not create conversation');
    return;
  }
  
  // Step 2: Wait and check status
  console.log('\n⏳ Waiting 90 seconds for n8n workflow to process...');
  
  setTimeout(async () => {
    console.log('\n🔍 Checking if n8n workflow enhanced the conversation...');
    await checkConversationStatus(conversationId);
    
    console.log('\n💡 Next Steps:');
    console.log('1. Check n8n Executions tab for workflow run');
    console.log('2. Visit Chatwoot dashboard to see enhanced conversation');
    console.log('3. Look for labels and messages added by workflow');
  }, 90000);
  
  // Immediate check
  console.log('\n🔍 Initial status check (before n8n processing):');
  await checkConversationStatus(conversationId);
}

// Run the test
runTest();