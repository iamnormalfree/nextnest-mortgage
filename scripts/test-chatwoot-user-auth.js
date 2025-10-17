/**
 * Alternative test using user authentication
 * Some Chatwoot instances require user login instead of API tokens
 */

async function testChatwootWithUserAuth() {
  console.log('🔧 Testing Chatwoot with user authentication...');
  
  const baseUrl = 'https://chat.nextnest.sg';
  
  // You'll need to update these with your Chatwoot admin credentials
  const email = 'your-email@example.com'; // Update this
  const password = 'your-password'; // Update this
  
  try {
    console.log('\n1. Attempting user login...');
    
    // Try to login as a user
    const loginResponse = await fetch(`${baseUrl}/api/v1/auth/sign_in`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: email,
        password: password
      })
    });
    
    console.log(`Login response: ${loginResponse.status}`);
    
    if (!loginResponse.ok) {
      const errorText = await loginResponse.text();
      console.log('Login failed:', errorText);
      
      // Try alternative auth endpoint
      console.log('\n🔄 Trying alternative auth endpoint...');
      const altLoginResponse = await fetch(`${baseUrl}/auth/sign_in`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email,
          password: password
        })
      });
      
      if (altLoginResponse.ok) {
        console.log('✅ Alternative login successful!');
        const authData = await altLoginResponse.json();
        console.log('Auth token:', authData.auth_token || authData.access_token);
      }
      return;
    }
    
    const authData = await loginResponse.json();
    console.log('✅ Login successful!');
    console.log('User:', authData.data?.email || authData.email);
    
    // Extract auth headers
    const authHeaders = {
      'access-token': loginResponse.headers.get('access-token') || authData.auth_token || authData.access_token,
      'token-type': 'Bearer',
      'client': loginResponse.headers.get('client') || '',
      'expiry': loginResponse.headers.get('expiry') || '',
      'uid': loginResponse.headers.get('uid') || authData.data?.uid || email
    };
    
    console.log('\n2. Testing authenticated API access...');
    console.log('Auth headers:', authHeaders);
    
    // Test getting inboxes with user auth
    const inboxesResponse = await fetch(`${baseUrl}/api/v1/accounts/1/inboxes`, {
      headers: {
        ...authHeaders,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`Inboxes response: ${inboxesResponse.status}`);
    
    if (inboxesResponse.ok) {
      const inboxes = await inboxesResponse.json();
      console.log('✅ Successfully retrieved inboxes!');
      console.log('Inboxes:', inboxes);
      
      console.log('\n🎉 Authentication method confirmed: User login required');
      console.log('\n📋 Next steps:');
      console.log('1. Use user login for API access');
      console.log('2. Store auth headers from login response');
      console.log('3. Use those headers for subsequent API calls');
    } else {
      console.log('❌ Failed to get inboxes with user auth');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Also test if the access token works with different header formats
async function testAccessTokenFormats() {
  console.log('\n🔍 Testing different access token formats...');
  
  const baseUrl = 'https://chat.nextnest.sg';
  const token = process.env.CHATWOOT_API_TOKEN;
  
  const formats = [
    { name: 'api_access_token', headers: { 'api_access_token': token } },
    { name: 'Authorization Bearer', headers: { 'Authorization': `Bearer ${token}` } },
    { name: 'X-Api-Key', headers: { 'X-Api-Key': token } },
    { name: 'access-token', headers: { 'access-token': token } },
    { name: 'Api-Access-Token', headers: { 'Api-Access-Token': token } }
  ];
  
  for (const format of formats) {
    console.log(`\nTrying ${format.name}...`);
    
    const response = await fetch(`${baseUrl}/api/v1/accounts/1/inboxes`, {
      headers: {
        ...format.headers,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`Response: ${response.status}`);
    
    if (response.ok) {
      console.log(`✅ SUCCESS with ${format.name}!`);
      const data = await response.json();
      console.log('Data received:', data);
      break;
    }
  }
}

// Run tests
console.log('='.repeat(50));
console.log('CHATWOOT API AUTHENTICATION TEST');
console.log('='.repeat(50));

testAccessTokenFormats().then(() => {
  console.log('\n' + '='.repeat(50));
  console.log('If none of the above worked, try user authentication:');
  console.log('Update email and password in this script, then uncomment:');
  console.log('// testChatwootWithUserAuth();');
});