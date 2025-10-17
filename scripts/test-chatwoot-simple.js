#!/usr/bin/env node
// Simple test to check Chatwoot API with proper environment variables

require('dotenv').config({ path: '.env.local' });

async function testChatwoot() {
  const baseUrl = process.env.CHATWOOT_BASE_URL;
  const apiToken = process.env.CHATWOOT_API_TOKEN;
  const accountId = process.env.CHATWOOT_ACCOUNT_ID;
  
  console.log('Testing Chatwoot API with:');
  console.log('Base URL:', baseUrl);
  console.log('API Token:', apiToken?.substring(0, 4) + '****');
  console.log('Account ID:', accountId);
  console.log('');
  
  // Test creating a contact
  try {
    const testContact = {
      name: 'Test User',
      email: 'test@example.com',
      phone_number: '+6591234567'
    };
    
    console.log('Creating test contact...');
    const response = await fetch(`${baseUrl}/api/v1/accounts/${accountId}/contacts`, {
      method: 'POST',
      headers: {
        'Api-Access-Token': apiToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testContact)
    });
    
    console.log('Response status:', response.status);
    
    if (response.ok) {
      const contact = await response.json();
      console.log('✅ Contact created:', contact.payload?.id || contact.id);
      return contact;
    } else {
      const error = await response.text();
      console.log('❌ Error:', error);
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
}

testChatwoot();