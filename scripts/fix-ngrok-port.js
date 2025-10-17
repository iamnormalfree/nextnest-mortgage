// Fix ngrok port issue - update webhook to correct port
require('dotenv').config({ path: '.env.local' });

console.log('\n⚠️ NGROK PORT MISMATCH DETECTED');
console.log('===================================');
console.log('Problem: Ngrok is forwarding to port 3004');
console.log('But your Next.js server is on port 3000');
console.log('\n');

console.log('🔧 Solutions:');
console.log('\n1. QUICK FIX - Start Next.js on port 3004:');
console.log('   npm run dev -- -p 3004');
console.log('\n2. OR - Restart ngrok with correct port:');
console.log('   a. Close the current ngrok window/terminal');
console.log('   b. Run: ngrok http 3000');
console.log('   c. Get new URL and update webhook in Chatwoot');
console.log('\n3. OR - Use existing ngrok but on port 3004:');
console.log('   PORT=3004 npm run dev');

console.log('\n📝 Current Status:');
console.log('   Ngrok URL: https://e07cec3fd516.ngrok-free.app');
console.log('   Forwarding to: http://localhost:3004');
console.log('   Next.js running on: http://localhost:3000');

console.log('\n🎯 Recommended Action:');
console.log('   Run your Next.js on port 3004 to match ngrok:');
console.log('   > npm run dev -- -p 3004');
console.log('\nThen the webhook flow will work!');