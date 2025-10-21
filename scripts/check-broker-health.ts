// ABOUTME: Diagnostic script to check broker assignment and BullMQ health
// Usage: npx tsx scripts/check-broker-health.ts

async function checkBrokerHealth() {
  console.log('🔍 Checking Broker Assignment Health...\n');

  // 1. Check migration status
  console.log('1️⃣  Checking migration status...');
  try {
    const response = await fetch('https://nextnest.sg/api/admin/migration-status');
    const data = await response.json();

    console.log('   Migration Status:', data.migration);
    console.log('   BullMQ Enabled:', data.migration.bullmqEnabled);
    console.log('   Traffic %:', data.migration.trafficPercentage);
    console.log('   Phase:', data.migration.phase);
    console.log('   Worker Status:', data.worker);
    console.log('');
  } catch (error) {
    console.log('   ❌ Error:', error);
    console.log('');
  }

  // 2. Check chat health
  console.log('2️⃣  Checking chat integration health...');
  try {
    const response = await fetch('https://nextnest.sg/api/health/chat-integration');
    const data = await response.json();

    console.log('   Status:', data.status);
    console.log('   Broker Assignment:', data.brokerAssignment);
    console.log('   Chatwoot:', data.chatwoot);
    console.log('   AI Service:', data.aiService);
    console.log('');
  } catch (error) {
    console.log('   ❌ Error:', error);
    console.log('');
  }

  // 3. Check if worker endpoint is accessible
  console.log('3️⃣  Checking worker start endpoint...');
  try {
    const response = await fetch('https://nextnest.sg/api/worker/start', {
      method: 'POST'
    });
    const data = await response.json();

    console.log('   Response:', data);
    console.log('');
  } catch (error) {
    console.log('   ❌ Error:', error);
    console.log('');
  }

  // 4. Summary
  console.log('\n📊 Summary:');
  console.log('If you see errors above, likely issues are:');
  console.log('  - Redis not connected (check REDIS_URL env var)');
  console.log('  - Worker not running (needs to be started)');
  console.log('  - Network/firewall blocking connections');
  console.log('  - Environment variables missing in production');
}

checkBrokerHealth().catch(console.error);
