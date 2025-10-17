#!/usr/bin/env node
/**
 * Quick Chatwoot Connection Test
 * Tests if your Chatwoot instance is accessible and configured correctly
 */

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const https = require('https');
const http = require('http');

// Read from environment
const CHATWOOT_BASE_URL = process.env.CHATWOOT_BASE_URL || 'https://chat.nextnest.sg';
const CHATWOOT_API_TOKEN = process.env.CHATWOOT_API_TOKEN || 'YOUR_API_TOKEN';
const CHATWOOT_ACCOUNT_ID = process.env.CHATWOOT_ACCOUNT_ID || '1';

console.log('🔍 Chatwoot Connection Test');
console.log('===========================');
console.log(`Base URL: ${CHATWOOT_BASE_URL}`);
console.log(`API Token: ${CHATWOOT_API_TOKEN.substring(0, 4)}****`);
console.log(`Account ID: ${CHATWOOT_ACCOUNT_ID}`);
console.log('');

// Parse URL
const url = new URL(`${CHATWOOT_BASE_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/inboxes`);
const client = url.protocol === 'https:' ? https : http;

// Test API connection
const options = {
  hostname: url.hostname,
  port: url.port || (url.protocol === 'https:' ? 443 : 80),
  path: url.pathname,
  method: 'GET',
  headers: {
    'Api-Access-Token': CHATWOOT_API_TOKEN,
    'Content-Type': 'application/json'
  }
};

console.log('Testing API connection...');

const req = client.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log(`\nStatus Code: ${res.statusCode}`);
    
    if (res.statusCode === 200) {
      console.log('✅ Connection successful!');
      
      try {
        const response = JSON.parse(data);
        
        if (response.payload && response.payload.length > 0) {
          console.log('\n📦 Found Inboxes:');
          response.payload.forEach(inbox => {
            console.log(`  - ID: ${inbox.id}, Name: ${inbox.name}, Type: ${inbox.channel_type}`);
            
            if (inbox.website_token) {
              console.log(`    Website Token: ${inbox.website_token}`);
            }
          });
          
          console.log('\n✅ Your configuration:');
          console.log(`CHATWOOT_ACCOUNT_ID=${CHATWOOT_ACCOUNT_ID}`);
          console.log(`CHATWOOT_INBOX_ID=${response.payload[0].id}`);
        } else {
          console.log('\n⚠️  No inboxes found. Please create a Website inbox in Chatwoot.');
        }
      } catch (e) {
        console.log('\nResponse:', data.substring(0, 200));
      }
    } else if (res.statusCode === 401) {
      console.log('❌ Authentication failed - Check your API token');
    } else if (res.statusCode === 404) {
      console.log('❌ Account not found - Check your Account ID');
    } else {
      console.log('❌ Connection failed');
      console.log('Response:', data.substring(0, 200));
    }
  });
});

req.on('error', (error) => {
  console.log('❌ Connection error:', error.message);
  console.log('\nPossible issues:');
  console.log('1. Chatwoot instance not accessible (check if it\'s running)');
  console.log('2. Incorrect URL (check CHATWOOT_BASE_URL)');
  console.log('3. Network/firewall blocking connection');
  console.log('4. SSL certificate issues (try http:// instead of https://)');
  console.log('5. Nginx/reverse proxy not configured correctly');
  
  console.log('\nFor self-hosted Chatwoot on Hetzner:');
  console.log('- Make sure port 3000 is open (or your configured port)');
  console.log('- Check nginx/caddy reverse proxy configuration');
  console.log('- Verify SSL certificate is valid');
  console.log('- Try accessing: curl ' + CHATWOOT_BASE_URL + '/api');
});

req.end();