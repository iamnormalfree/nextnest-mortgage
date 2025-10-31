// Quick worker connection test
const { getBrokerQueue } = require('./lib/queue/broker-queue.ts');

async function testWorkerConnection() {
  console.log('Testing worker connection...\n');
  
  try {
    const queue = getBrokerQueue();
    
    // Add a test job
    const job = await queue.add('test-job', {
      type: 'new-conversation',
      conversationId: 99999,
      contactId: 88888,
      processedLeadData: {
        leadScore: 75,
        loanType: 'purchase',
        propertyType: 'condo',
        employmentType: 'employed',
        actualIncomes: [7000]
      },
      brokerPersona: {
        name: 'Test Broker',
        personality_type: 'energetic',
        greeting_style: 'friendly'
      },
      skipGreeting: true // Skip actual Chatwoot call
    });
    
    console.log('✅ Job added to queue:', job.id);
    console.log('   Waiting for worker to process...\n');
    
    // Wait for job to complete
    const result = await job.waitUntilFinished(getBrokerQueueEvents());
    
    console.log('✅ Job completed successfully!');
    console.log('   Result:', result);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testWorkerConnection();
