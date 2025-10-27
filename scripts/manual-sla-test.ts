#!/usr/bin/env tsx

/**
 * Manual SLA Test with Playwright + Human Interaction
 *
 * Uses Playwright to navigate to the application, then allows manual form completion
 * to get real conversation IDs and capture end-to-end SLA timing
 */

import { chromium } from 'playwright';
import { config } from 'dotenv';
config({ path: '.env.local' });

import { getSLATimingData } from '@/lib/queue/broker-queue';

async function manualSLATest() {
  console.log('🎯 Manual SLA Test - Playwright + Human Interaction');
  console.log('   Timestamp:', new Date().toISOString());

  const browser = await chromium.launch({
    headless: false, // Keep visible for manual interaction
    slowMo: 100 // Slow down for easier manual control
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('\n📱 Step 1: Navigating to application...');
    await page.goto('http://localhost:3002', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    console.log('✅ Page loaded successfully');

    console.log('\n📱 Step 2: Look for Get Started button...');

    // Wait for manual interaction
    console.log('\n🎮 MANUAL INTERACTION NEEDED:');
    console.log('   1. Click the "Get Started" button');
    console.log('   2. Select "New Purchase" (or any loan type)');
    console.log('   3. Fill out the form with REAL information');
    console.log('   4. Click Continue/Submit');
    console.log('   5. Wait for redirect to chat page');
    console.log('   6. Send a test message like: "Hi, I need help with a mortgage application"');
    console.log('\n⏳ I will wait for you to complete these steps...');
    console.log('   Press ENTER in this terminal when you are on the chat page and have sent a message');

    // Wait for user to press Enter
    await new Promise(resolve => {
      process.stdin.once('data', () => {
        resolve();
      });
    });

    console.log('\n📱 Step 3: Extracting conversation information...');

    // Try to extract conversation ID from URL
    const currentUrl = page.url();
    console.log(`   Current URL: ${currentUrl}`);

    let conversationId = null;

    // Look for conversation ID in URL
    const urlMatch = currentUrl.match(/[?&]conversation_id=(\d+)/);
    if (urlMatch) {
      conversationId = parseInt(urlMatch[1]);
      console.log(`   ✅ Found conversation ID in URL: ${conversationId}`);
    } else {
      // Try to find conversation ID in page content or localStorage
      try {
        const pageContent = await page.content();
        const idMatch = pageContent.match(/conversation[_\s-]?id[:\s]+(\d+)/i);

        if (idMatch) {
          conversationId = parseInt(idMatch[1]);
          console.log(`   ✅ Found conversation ID in page content: ${conversationId}`);
        } else {
          // Try localStorage
          const localStorage = await page.evaluate(() => {
            return {
              conversationId: localStorage.getItem('conversationId'),
              sessionData: localStorage.getItem('sessionData'),
            };
          });

          if (localStorage.conversationId) {
            conversationId = parseInt(localStorage.conversationId);
            console.log(`   ✅ Found conversation ID in localStorage: ${conversationId}`);
          }
        }
      } catch (e) {
        console.log('   ⚠️ Could not extract conversation ID automatically');
      }
    }

    if (!conversationId) {
      console.log('   ⚠️ Could not find conversation ID. You may need to check the browser console or network tab.');
      console.log('   Please enter the conversation ID manually (or press Enter to continue without it):');

      // Allow manual input
      await new Promise(resolve => {
        process.stdin.once('data', (data) => {
          const input = data.toString().trim();
          if (input && !isNaN(parseInt(input))) {
            conversationId = parseInt(input);
            console.log(`   ✅ Using manual conversation ID: ${conversationId}`);
          }
          resolve();
        });
      });
    }

    console.log('\n📱 Step 4: Waiting for worker processing...');

    // Wait for worker to process the message
    console.log('   ⏳ Waiting 10 seconds for worker to process your message...');
    await page.waitForTimeout(10000);

    console.log('\n📱 Step 5: Retrieving SLA timing data...');

    if (conversationId) {
      try {
        const timingDataList = await getSLATimingData(conversationId);

        if (timingDataList.length > 0) {
          console.log(`✅ Found ${timingDataList.length} timing records:`);

          timingDataList.forEach((timingData, index) => {
            console.log(`\n   📈 Record ${index + 1}:`);
            console.log(`      Message ID: ${timingData.messageId}`);
            console.log(`      Queue Timestamp: ${timingData.queueAddTimestamp ? new Date(timingData.queueAddTimestamp).toISOString() : 'N/A'}`);
            console.log(`      Worker Start: ${timingData.workerStartTimestamp ? new Date(timingData.workerStartTimestamp).toISOString() : 'N/A'}`);
            console.log(`      Worker Complete: ${timingData.workerCompleteTimestamp ? new Date(timingData.workerCompleteTimestamp).toISOString() : 'N/A'}`);
            console.log(`      Chatwoot Send: ${timingData.chatwootSendTimestamp ? new Date(timingData.chatwootSendTimestamp).toISOString() : 'N/A'}`);
            console.log(`      Total Duration: ${timingData.totalDuration ? timingData.totalDuration + 'ms' : 'N/A'}`);

            if (timingData.aiSegment) {
              console.log(`      🤖 AI Segment:`);
              console.log(`         Model: ${timingData.aiSegment.model || 'N/A'}`);
              console.log(`         Prompt Length: ${timingData.aiSegment.promptLength || 'N/A'} chars`);
              console.log(`         Response Length: ${timingData.aiSegment.responseLength || 'N/A'} chars`);
              console.log(`         Orchestrator Path: ${timingData.aiSegment.orchestratorPath || 'N/A'}`);
              console.log(`         AI Processing Time: ${timingData.aiSegment.aiProcessingTime ? timingData.aiSegment.aiProcessingTime + 'ms' : 'N/A'}`);
            }

            // Calculate phase breakdown if we have complete data
            if (timingData.queueAddTimestamp && timingData.workerStartTimestamp && timingData.workerCompleteTimestamp) {
              const queueToWorker = timingData.workerStartTimestamp - timingData.queueAddTimestamp;
              const workerProcessing = timingData.workerCompleteTimestamp - timingData.workerStartTimestamp;
              const totalDuration = timingData.totalDuration || (Date.now() - timingData.queueAddTimestamp);

              console.log(`      ⏱️ Phase Breakdown:`);
              console.log(`         Queue→Worker: ${queueToWorker}ms (${(queueToWorker/1000).toFixed(1)}s)`);
              console.log(`         Worker Processing: ${workerProcessing}ms (${(workerProcessing/1000).toFixed(1)}s)`);

              if (timingData.chatwootSendTimestamp) {
                const workerToChatwoot = timingData.chatwootSendTimestamp - timingData.workerCompleteTimestamp;
                console.log(`         Worker→Chatwoot: ${workerToChatwoot}ms (${(workerToChatwoot/1000).toFixed(1)}s)`);
              }

              console.log(`      🎯 SLA Status: ${totalDuration < 5000 ? '✅ COMPLIANT' : '❌ BREACH'} (${totalDuration}ms)`);
            }
          });

          // Check for complete end-to-end timing
          const completeTiming = timingDataList.find(t => t.totalDuration && t.chatwootSendTimestamp);

          if (completeTiming) {
            console.log('\n🎉 SUCCESS: Complete end-to-end SLA timing captured!');
            console.log(`   Total Duration: ${completeTiming.totalDuration}ms (${(completeTiming.totalDuration/1000).toFixed(1)}s)`);
            console.log(`   P95 Status: ${completeTiming.totalDuration < 5000 ? '✅ UNDER 5s TARGET' : '❌ EXCEEDS 5s TARGET'}`);
          } else {
            console.log('\n⚠️ Partial timing captured - check if Chatwoot integration completed');
          }

        } else {
          console.log('   ❌ No timing data found for this conversation');
          console.log('   The worker may not have processed the message yet, or there may be an issue');
        }
      } catch (error) {
        console.error('   ❌ Error retrieving timing data:', error);
      }
    } else {
      console.log('   ❌ No conversation ID available - cannot retrieve timing data');
    }

    console.log('\n📱 Step 6: Keeping browser open for inspection...');
    console.log('   You can now inspect the chat interface, browser console, or network tab');
    console.log('   Press ENTER to close the browser and finish the test');

    // Wait for final user input before closing
    await new Promise(resolve => {
      process.stdin.once('data', () => {
        resolve();
      });
    });

    return conversationId;

  } catch (error) {
    console.error('❌ Error in manual SLA test:', error);
    throw error;
  } finally {
    await context.close();
    await browser.close();
  }
}

async function main() {
  try {
    console.log('🚀 Starting Manual SLA Test');
    console.log('   This test requires manual interaction to complete the form and send messages');
    console.log('   Make sure the dev server is running on http://localhost:3002');

    // Enable stdin for manual interaction
    process.stdin.resume();
    process.stdin.setEncoding('utf8');

    const conversationId = await manualSLATest();

    console.log('\n🎯 FINAL RESULT:');
    if (conversationId) {
      console.log(`   ✅ Test completed with conversation ID: ${conversationId}`);
      console.log('   Check the timing data above for SLA compliance');
      console.log('   You can repeat this test with different messages to gather more samples');
    } else {
      console.log('   ⚠️ Test completed but no conversation ID was captured');
      console.log('   Check the browser console and network tab for debugging information');
    }

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Manual SLA test failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}