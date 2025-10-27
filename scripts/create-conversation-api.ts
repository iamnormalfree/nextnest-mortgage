#!/usr/bin/env tsx

/**
 * Create Real Chatwoot Conversation via API
 *
 * Uses Chatwoot API to create a valid conversation for SLA testing
 * Bypasses the frontend form completion issues
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { ChatwootClient } from '../lib/integrations/chatwoot-client';

async function createConversationViaAPI() {
  console.log('🎯 Creating Real Chatwoot Conversation via API');
  console.log('   Timestamp:', new Date().toISOString());

  try {
    const chatwootClient = new ChatwootClient();

    // First, let's check for existing conversations we can use
    console.log('\n📋 Step 1: Checking for existing conversations...');

    try {
      const existingConversations = await chatwootClient.listConversations({
        accountId: process.env.CHATWOOT_ACCOUNT_ID!,
        status: 'open',
        limit: 5
      });

      if (existingConversations.length > 0) {
        const conversation = existingConversations[0];
        console.log('✅ Found existing conversation:');
        console.log(`   ID: ${conversation.id}`);
        console.log(`   Status: ${conversation.status}`);
        console.log(`   Messages: ${conversation.messages?.length || 0}`);
        return conversation.id;
      }
    } catch (error) {
      console.log('   ⚠️ Could not retrieve existing conversations');
    }

    // Create a new conversation
    console.log('\n📋 Step 2: Creating new conversation...');

    const conversationPayload = {
      inbox_id: process.env.CHATWOOT_INBOX_ID || '1',
      contact_id: process.env.CHATWOOT_CONTACT_ID || '1',
      status: 'open',
      priority: 1, // Normal priority
      source_id: 'web', // Web widget
      additional_attributes: {
        source: 'SLA Test Script',
        test_purpose: 'SLA Timing Validation',
        created_at: new Date().toISOString()
      }
    };

    console.log('   Payload:', JSON.stringify(conversationPayload, null, 2));

    const newConversation = await chatwootClient.createConversation({
      accountId: process.env.CHATWOOT_ACCOUNT_ID!,
      ...conversationPayload
    });

    console.log('✅ New conversation created:');
    console.log(`   ID: ${newConversation.id}`);
    console.log(`   Status: ${newConversation.status}`);
    console.log(`   Created at: ${newConversation.created_at}`);

    // Send an initial message to establish the conversation
    console.log('\n📋 Step 3: Sending initial message...');

    const messagePayload = {
      content: 'Hello, I need help with a mortgage application. This is a test message for SLA validation.',
      message_type: 'outgoing', // From agent/broker
      private: false
    };

    const message = await chatwootClient.sendMessage({
      accountId: process.env.CHATWOOT_ACCOUNT_ID!,
      conversationId: newConversation.id,
      ...messagePayload
    });

    console.log('✅ Initial message sent:');
    console.log(`   Message ID: ${message.id}`);
    console.log(`   Content: ${message.content}`);

    return newConversation.id;

  } catch (error) {
    console.error('❌ Error creating conversation via API:', error);
    throw error;
  }
}

async function main() {
  try {
    console.log('🚀 Starting Chatwoot API Conversation Creation');

    const conversationId = await createConversationViaAPI();

    console.log('\n🎯 RESULT:');
    console.log(`   Real Chatwoot Conversation ID: ${conversationId}`);
    console.log('   Ready for end-to-end SLA profiling');
    console.log('\nNext step: Update SLA profiling script to use this conversation ID');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Failed to create conversation:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}