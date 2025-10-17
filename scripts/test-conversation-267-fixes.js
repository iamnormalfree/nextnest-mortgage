#!/usr/bin/env node
/**
 * Test script for Conversation ID 267 fixes
 * Validates deduplication and broker assignment fixes
 *
 * Usage:
 *   node scripts/test-conversation-267-fixes.js
 */

require('dotenv').config({ path: '.env.local' });

const CHATWOOT_BASE_URL = process.env.CHATWOOT_BASE_URL;
const CHATWOOT_API_TOKEN = process.env.CHATWOOT_API_TOKEN;
const CHATWOOT_ACCOUNT_ID = process.env.CHATWOOT_ACCOUNT_ID;

if (!CHATWOOT_BASE_URL || !CHATWOOT_API_TOKEN || !CHATWOOT_ACCOUNT_ID) {
  console.error('❌ Missing required environment variables');
  console.error('Required: CHATWOOT_BASE_URL, CHATWOOT_API_TOKEN, CHATWOOT_ACCOUNT_ID');
  process.exit(1);
}

// Test utilities
async function fetchConversationMessages(conversationId) {
  const response = await fetch(
    `${CHATWOOT_BASE_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/conversations/${conversationId}/messages`,
    {
      headers: {
        'Api-Access-Token': CHATWOOT_API_TOKEN,
        'Content-Type': 'application/json'
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch messages: ${response.statusText}`);
  }

  const data = await response.json();
  return data.payload || data || [];
}

async function analyzeConversation(conversationId) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📊 ANALYZING CONVERSATION ${conversationId}`);
  console.log('='.repeat(80));

  const messages = await fetchConversationMessages(conversationId);

  console.log(`\n📨 Total messages: ${messages.length}\n`);

  // Categorize messages
  const outgoingMessages = messages.filter(m => m.message_type === 'outgoing' || m.message_type === 1);
  const activityMessages = messages.filter(m => m.message_type === 'activity' || m.message_type === 2);
  const incomingMessages = messages.filter(m => m.message_type === 'incoming' || m.message_type === 0);

  console.log('📤 Outgoing messages (broker greetings):', outgoingMessages.length);
  console.log('🔔 Activity messages (system messages):', activityMessages.length);
  console.log('📥 Incoming messages (user messages):', incomingMessages.length);

  // Check for duplicate greetings
  console.log('\n🔍 CHECKING FOR DUPLICATE GREETINGS:\n');
  const greetings = outgoingMessages.filter(m => {
    const content = m.content?.toLowerCase() || '';
    return content.includes("i'm") && (
      content.includes('michelle') ||
      content.includes('jasmine') ||
      content.includes('rachel') ||
      content.includes('sarah') ||
      content.includes('grace')
    );
  });

  if (greetings.length === 0) {
    console.log('ℹ️  No greetings found');
  } else if (greetings.length === 1) {
    console.log('✅ Exactly 1 greeting found (CORRECT)');
    console.log(`   From: ${extractBrokerName(greetings[0].content)}`);
    console.log(`   Time: ${new Date(greetings[0].created_at * 1000).toLocaleString()}`);
  } else {
    console.log(`❌ ${greetings.length} greetings found (DUPLICATE DETECTED)`);
    greetings.forEach((msg, idx) => {
      console.log(`\n   Greeting ${idx + 1}:`);
      console.log(`   From: ${extractBrokerName(msg.content)}`);
      console.log(`   Time: ${new Date(msg.created_at * 1000).toLocaleString()}`);
      console.log(`   Preview: ${msg.content.substring(0, 100)}...`);
    });

    // Check if duplicates are from same broker
    const brokerNames = greetings.map(g => extractBrokerName(g.content));
    const uniqueBrokers = [...new Set(brokerNames)];
    if (uniqueBrokers.length < brokerNames.length) {
      console.log(`\n   ⚠️  ISSUE: Same broker (${uniqueBrokers[0]}) sent multiple greetings`);
    } else {
      console.log(`\n   ⚠️  ISSUE: Different brokers sent greetings: ${uniqueBrokers.join(', ')}`);
    }
  }

  // Check for duplicate activity messages
  console.log('\n🔍 CHECKING FOR DUPLICATE ACTIVITY MESSAGES:\n');

  const reviewingMessages = activityMessages.filter(m =>
    m.content?.toLowerCase().includes('reviewing')
  );
  const joinedMessages = activityMessages.filter(m =>
    m.content?.toLowerCase().includes('joined')
  );
  const resubmissionMessages = activityMessages.filter(m =>
    m.content?.toLowerCase().includes('resubmitted')
  );

  console.log('📝 "Reviewing" messages:', reviewingMessages.length);
  if (reviewingMessages.length > 1) {
    console.log('   ❌ DUPLICATE DETECTED');
    reviewingMessages.forEach((msg, idx) => {
      console.log(`   ${idx + 1}. ${new Date(msg.created_at * 1000).toLocaleString()} - ${msg.content}`);
    });
  } else if (reviewingMessages.length === 1) {
    console.log('   ✅ Exactly 1 (CORRECT)');
  }

  console.log('\n🤝 "Joined" messages:', joinedMessages.length);
  if (joinedMessages.length > 1) {
    console.log('   ❌ DUPLICATE DETECTED');
    joinedMessages.forEach((msg, idx) => {
      console.log(`   ${idx + 1}. ${new Date(msg.created_at * 1000).toLocaleString()} - ${msg.content}`);
    });
  } else if (joinedMessages.length === 1) {
    console.log('   ✅ Exactly 1 (CORRECT)');
  }

  console.log('\n♻️  "Resubmitted" messages:', resubmissionMessages.length);
  if (resubmissionMessages.length > 0) {
    console.log('   ℹ️  This conversation was reopened');
    resubmissionMessages.forEach((msg, idx) => {
      console.log(`   ${idx + 1}. ${new Date(msg.created_at * 1000).toLocaleString()} - ${msg.content}`);
    });
  }

  // Timeline analysis
  console.log('\n📅 MESSAGE TIMELINE:\n');

  const sortedMessages = [...messages].sort((a, b) => a.created_at - b.created_at);

  sortedMessages.forEach((msg, idx) => {
    const time = new Date(msg.created_at * 1000).toLocaleString();
    const type = getMessageTypeLabel(msg.message_type);
    const preview = msg.content?.substring(0, 60) || '[no content]';
    console.log(`${idx + 1}. [${time}] ${type}: ${preview}...`);
  });

  // Broker consistency check
  console.log('\n🤖 BROKER CONSISTENCY CHECK:\n');

  const brokerNames = greetings.map(g => extractBrokerName(g.content));
  const uniqueBrokers = [...new Set(brokerNames)];

  if (uniqueBrokers.length === 0) {
    console.log('ℹ️  No broker identified in messages');
  } else if (uniqueBrokers.length === 1) {
    console.log(`✅ Consistent broker: ${uniqueBrokers[0]}`);
  } else {
    console.log(`❌ Multiple brokers detected: ${uniqueBrokers.join(', ')}`);
    console.log('   This indicates a broker assignment mismatch');
  }

  // Final verdict
  console.log('\n' + '='.repeat(80));
  console.log('📋 FINAL VERDICT:');
  console.log('='.repeat(80));

  const issues = [];

  if (greetings.length > 1) {
    issues.push(`${greetings.length} duplicate greetings`);
  }
  if (reviewingMessages.length > 1) {
    issues.push(`${reviewingMessages.length} duplicate "reviewing" messages`);
  }
  if (joinedMessages.length > 1) {
    issues.push(`${joinedMessages.length} duplicate "joined" messages`);
  }
  if (uniqueBrokers.length > 1) {
    issues.push('broker name mismatch');
  }

  if (issues.length === 0) {
    console.log('\n✅ ALL CHECKS PASSED - No issues detected!\n');
    console.log('   ✓ No duplicate greetings');
    console.log('   ✓ No duplicate system messages');
    console.log('   ✓ Broker name consistent');
    if (resubmissionMessages.length > 0) {
      console.log('   ✓ Conversation reopen handled correctly');
    }
  } else {
    console.log(`\n❌ ISSUES FOUND: ${issues.length}\n`);
    issues.forEach(issue => {
      console.log(`   • ${issue}`);
    });
  }

  console.log('\n' + '='.repeat(80) + '\n');
}

function extractBrokerName(content) {
  if (!content) return 'Unknown';

  const match = content.match(/I'm\s+([^,]+)/i);
  if (match) {
    return match[1].trim();
  }

  return 'Unknown';
}

function getMessageTypeLabel(messageType) {
  switch (messageType) {
    case 'incoming':
    case 0:
      return '📥 USER';
    case 'outgoing':
    case 1:
      return '📤 BROKER';
    case 'activity':
    case 2:
      return '🔔 SYSTEM';
    default:
      return `❓ ${messageType}`;
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: node scripts/test-conversation-267-fixes.js [conversation_id]');
    console.log('\nExample:');
    console.log('  node scripts/test-conversation-267-fixes.js 267');
    console.log('\nAnalyzes a conversation for duplicate messages and broker assignment issues.');
    process.exit(0);
  }

  const conversationId = args[0];

  try {
    await analyzeConversation(conversationId);
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

main();
