/**
 * Test script for Chatwoot API connection
 * Verifies API access and gets account/inbox information
 */

async function testChatwootAPI() {
  console.log('🔧 Testing Chatwoot API connection...');
  
  const baseUrl = 'https://chat.nextnest.sg';
  const apiToken = process.env.CHATWOOT_API_TOKEN; // You'll need to provide this
  
  if (!apiToken) {
    console.log('❌ Please add your Chatwoot API token to this script');
    console.log('Get it from: https://chat.nextnest.sg/app/accounts/1/settings/integrations/api');
    return;
  }
  
  try {
    console.log('\n1. Testing API access...');
    
    // For Chatwoot, you typically work with a specific account ID
    // Most self-hosted instances use account ID 1
    const accountId = 1;
    console.log(`Using account ID: ${accountId}`);
    
    // Test API access by getting account profile
    const profileResponse = await fetch(`${baseUrl}/api/v1/profile`, {
      headers: {
        'Api-Access-Token': apiToken,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`Profile response: ${profileResponse.status}`);
    
    if (profileResponse.ok) {
      const profile = await profileResponse.json();
      console.log('✅ API access successful!');
      console.log('API Token belongs to:', profile.name || profile.email);
      console.log('Account ID:', profile.account_id || accountId);
    } else {
      console.log('⚠️ Could not fetch profile, but continuing with account ID 1...');
    }
    
    console.log(`\n2. Getting inboxes for account ${accountId}...`);
    
    // Get inboxes
    const inboxesResponse = await fetch(`${baseUrl}/api/v1/accounts/${accountId}/inboxes`, {
      headers: {
        'Api-Access-Token': apiToken,
        'Content-Type': 'application/json'
      }
    });
    
    if (inboxesResponse.ok) {
      const inboxesData = await inboxesResponse.json();
      console.log('✅ Inboxes retrieved successfully!');
      
      // Handle both payload and direct array response
      const inboxes = inboxesData.payload || inboxesData;
      
      if (Array.isArray(inboxes) && inboxes.length > 0) {
        inboxes.forEach(inbox => {
          console.log(`  - ID: ${inbox.id}, Name: ${inbox.name}, Channel: ${inbox.channel_type}`);
        });
        
        const webInbox = inboxes.find(inbox => inbox.channel_type === 'Channel::WebWidget');
        if (webInbox) {
          console.log(`\n✅ Web widget inbox found: ${webInbox.id}`);
        }
      } else {
        console.log('⚠️ No inboxes found. You may need to create one in Chatwoot dashboard.');
      }
    } else {
      const errorText = await inboxesResponse.text();
      console.log('❌ Failed to get inboxes:', inboxesResponse.status);
      console.log('Error:', errorText.substring(0, 200));
      
      // Try Platform API token format
      console.log('\n🔄 Trying Platform API token format...');
      const platformResponse = await fetch(`${baseUrl}/platform/api/v1/accounts`, {
        headers: {
          'api_access_token': apiToken,
          'Content-Type': 'application/json'
        }
      });
      
      if (platformResponse.ok) {
        console.log('✅ This appears to be a Platform API token!');
        console.log('Note: Platform tokens work differently than Application tokens.');
      }
    }
    
    console.log('\n3. Testing conversation creation...');
    
    // Create a test conversation
    const testContact = {
      name: 'Test User from NextNest',
      email: 'test@nextnest.sg',
      phone: '+65 1234 5678'
    };
    
    // Use inbox ID 1 as default, or from retrieved inboxes
    let inboxId = 1;
    if (inboxesResponse && inboxesResponse.ok) {
      const inboxesData = await inboxesResponse.json();
      const inboxes = inboxesData.payload || inboxesData;
      if (Array.isArray(inboxes) && inboxes.length > 0) {
        inboxId = inboxes[0].id;
      }
    }
    
    const conversationData = {
      source_id: `nextnest_test_${Date.now()}`,
      inbox_id: inboxId,
      contact: testContact,
      custom_attributes: {
        lead_score: 75,
        broker_persona: 'balanced',
        property_type: 'HDB',
        loan_amount: 500000,
        source: 'nextnest_form_test'
      }
    };
    
    const conversationResponse = await fetch(`${baseUrl}/api/v1/accounts/${accountId}/conversations`, {
      method: 'POST',
      headers: {
        'Api-Access-Token': apiToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(conversationData)
    });
    
    console.log(`Conversation creation: ${conversationResponse.status}`);
    
    if (!conversationResponse.ok) {
      const errorText = await conversationResponse.text();
      console.log('❌ Conversation creation failed:', errorText);
    } else {
      const conversation = await conversationResponse.json();
      console.log('✅ Test conversation created successfully!');
      console.log('Conversation details:', {
        id: conversation.id,
        inbox: conversation.inbox_id,
        contact: conversation.meta?.sender?.name
      });
      
      // Test sending a message
      console.log('\n4. Testing message sending...');
      
      const messageResponse = await fetch(`${baseUrl}/api/v1/accounts/${accountId}/conversations/${conversation.id}/messages`, {
        method: 'POST',
        headers: {
          'api_access_token': apiToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: 'Hello! Thank you for completing the NextNest mortgage form. I\'m your assigned broker and I\'m here to help you find the best mortgage options. Based on your profile, I can see you\'re looking at properties around $500k. What questions do you have?',
          message_type: 'outgoing'
        })
      });
      
      if (messageResponse.ok) {
        console.log('✅ Test message sent successfully!');
        
        // Generate the conversation URL
        const conversationUrl = `${baseUrl}/app/accounts/${accountId}/conversations/${conversation.id}`;
        console.log('\n🔗 View conversation at:');
        console.log(conversationUrl);
        
        console.log('\n🎉 Complete success! Chatwoot integration ready.');
        console.log('\n📋 Configuration for your app:');
        console.log(`CHATWOOT_BASE_URL=${baseUrl}`);
        console.log(`CHATWOOT_API_TOKEN=${apiToken}`);
        console.log(`CHATWOOT_ACCOUNT_ID=${accountId}`);
        console.log(`CHATWOOT_INBOX_ID=${inboxes.payload[0].id}`);
        
      } else {
        const msgError = await messageResponse.text();
        console.log('⚠️ Message sending failed:', msgError);
      }
    }
    
  } catch (error) {
    console.error('\n❌ Error testing Chatwoot API:', error.message);
    console.log('\n🔍 Troubleshooting:');
    console.log('1. Check that your API token is correct');
    console.log('2. Verify https://chat.nextnest.sg is accessible');
    console.log('3. Make sure you have admin permissions');
    console.log('4. Check API token hasn\'t expired');
  }
}

// Run the test
testChatwootAPI();