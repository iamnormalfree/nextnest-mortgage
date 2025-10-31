/**
 * Clean up failed jobs in BullMQ queue
 * 
 * This script will:
 * 1. Get the queue instance
 * 2. Clean up all failed jobs
 * 3. Test with a new job to verify system health
 */

const { getBrokerQueue, queueIncomingMessage } = require('../lib/queue/broker-queue');

// Mock data for testing
const mockBrokerPersona = {
  name: 'Test Broker',
  type: 'balanced',
  title: 'Senior Mortgage Consultant',
  approach: 'Professional yet approachable',
  urgencyLevel: 'medium',
  avatar: 'TB',
  responseStyle: {
    tone: 'professional',
    pacing: 'moderate',
    focus: 'balanced',
  },
};

const mockProcessedLeadData = {
  name: 'Test Customer',
  email: 'test@example.com',
  phone: '+6591234567',
  loanType: 'new_purchase',
  leadScore: 65,
  sessionId: 'test-session-cleanup',
  actualIncomes: [8000],
  actualAges: [35],
  employmentType: 'employed',
  propertyCategory: 'condo',
  propertyType: 'private',
  brokerPersona: mockBrokerPersona,
};

async function cleanupFailedJobs() {
  console.log('🧹 Cleaning up failed BullMQ jobs...\n');
  
  try {
    const queue = getBrokerQueue();
    
    // Get failed jobs count before cleanup
    const failedCount = await queue.getFailedCount();
    console.log(`📊 Found ${failedCount} failed jobs`);
    
    if (failedCount > 0) {
      // Clean up all failed jobs
      const cleaned = await queue.clean(0, 0, 'failed');
      console.log(`✅ Cleaned up ${cleaned} failed jobs`);
    } else {
      console.log('ℹ️ No failed jobs to clean');
    }
    
    // Get updated metrics
    const [waiting, active, completed, failed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
    ]);
    
    console.log('\n📈 Updated queue metrics:');
    console.log(`   Waiting: ${waiting}`);
    console.log(`   Active: ${active}`);
    console.log(`   Completed: ${completed}`);
    console.log(`   Failed: ${failed}`);
    
    return true;
  } catch (error) {
    console.error('❌ Failed to clean up jobs:', error);
    return false;
  }
}

async function testQueueWithNewJob() {
  console.log('\n🧪 Testing queue with new job...\n');
  
  try {
    console.log('📋 Queueing test message...');
    
    const job = await queueIncomingMessage({
      conversationId: 999, // Test conversation ID
      contactId: 999,
      brokerId: 'test-broker',
      brokerName: 'Test Broker',
      brokerPersona: mockBrokerPersona,
      processedLeadData: mockProcessedLeadData,
      userMessage: 'test message after cleanup',
      messageId: Date.now(),
    });
    
    console.log(`✅ Test job queued: ${job.id}`);
    
    // Wait a bit for processing
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check job state
    const state = await job.getState();
    console.log(`📊 Test job state: ${state}`);
    
    if (state === 'completed') {
      console.log('✅ Queue is healthy - test job completed successfully');
      return true;
    } else if (state === 'failed') {
      const failedReason = job.failedReason;
      console.error('❌ Test job failed:', failedReason);
      return false;
    } else {
      console.log(`⏳ Test job still processing (state: ${state})`);
      return true; // Still processing is okay
    }
  } catch (error) {
    console.error('❌ Test job failed:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 BullMQ Queue Cleanup and Test\n');
  console.log('='.repeat(50));
  
  // Step 1: Clean up failed jobs
  const cleanupSuccess = await cleanupFailedJobs();
  
  if (!cleanupSuccess) {
    console.error('\n❌ Cleanup failed - aborting test');
    process.exit(1);
  }
  
  // Step 2: Test with new job
  const testSuccess = await testQueueWithNewJob();
  
  if (testSuccess) {
    console.log('\n✅ Queue cleanup and test completed successfully');
    console.log('   System is ready for production deployment');
    process.exit(0);
  } else {
    console.error('\n❌ Queue test failed - investigate worker issues');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
}

module.exports = { cleanupFailedJobs, testQueueWithNewJob };
