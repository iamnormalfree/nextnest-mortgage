// ABOUTME: Test Chatwoot connectivity from production
// Usage: curl https://nextnest.sg/api/test-chatwoot

async function testChatwootConnection() {
  const baseUrl = process.env.CHATWOOT_BASE_URL;
  const apiToken = process.env.CHATWOOT_API_TOKEN;

  console.log('\n🔍 Testing Chatwoot Connection...\n');
  console.log('Base URL:', baseUrl || '❌ NOT SET');
  console.log('API Token:', apiToken ? '✓ SET' : '❌ NOT SET');
  console.log('');

  if (!baseUrl || !apiToken) {
    console.log('❌ Cannot test - missing credentials\n');
    return;
  }

  try {
    console.log(`Attempting to connect to: ${baseUrl}/api/v1/accounts`);

    const response = await fetch(`${baseUrl}/api/v1/accounts`, {
      headers: {
        'api_access_token': apiToken
      }
    });

    console.log('Response status:', response?.status || 'NULL RESPONSE');
    console.log('Response OK:', response?.ok);

    if (response?.ok) {
      const data = await response.json();
      console.log('✅ Connected successfully!');
      console.log('Accounts:', data);
    } else {
      const text = await response?.text();
      console.log('❌ Connection failed');
      console.log('Error:', text);
    }
  } catch (error: any) {
    console.log('❌ Network error:', error?.message);
    console.log('Error type:', error?.constructor?.name);
    console.log('Full error:', error);
  }
}

testChatwootConnection();
