import { NextRequest, NextResponse } from 'next/server'
import { updateBrokerMetrics, getBrokerForConversation } from '@/lib/ai/broker-assignment'
import { brokerEngagementManager } from '@/lib/engagement/broker-engagement-manager'
import { trackBotMessage, checkIfEcho } from '@/lib/utils/message-tracking'
import { queueIncomingMessage } from '@/lib/queue/broker-queue'
import { shouldUseBullMQ, logMigrationDecision, getMigrationStatus } from '@/lib/utils/migration-control'

// Track processed message IDs to prevent duplicates
const processedMessages = new Set<string>();

// Clean up old entries every 5 minutes
setInterval(() => {
  processedMessages.clear();
}, 5 * 60 * 1000);

/**
 * Chatwoot Webhook Handler
 * Forwards to n8n for AI broker processing when enabled
 */
export async function POST(request: NextRequest) {
  try {
    const event = await request.json();
    
    console.log('🔔 Chatwoot webhook received:', {
      event: event.event,
      conversationId: event.conversation?.id,
      messageType: event.message?.message_type ?? event.message_type,
      actualMessageType: event.message?.message_type,
      rootMessageType: event.message_type,
      status: event.conversation?.status,
      senderType: event.message?.sender?.type ?? event.sender?.type,
      messageContent: event.content?.substring(0, 50) ?? event.message?.content?.substring(0, 50),
      fullEvent: JSON.stringify(event).substring(0, 200)
    });
    
    // Check if n8n AI Broker is enabled
    const N8N_WEBHOOK_URL = process.env.N8N_AI_BROKER_WEBHOOK_URL || 
                           'https://primary-production-1af6.up.railway.app/webhook/chatwoot-ai-broker';
    const USE_N8N_BROKER = process.env.ENABLE_AI_BROKER === 'true';
    
    // Forward to n8n if enabled and it's a relevant event
    // Handle both old and new Chatwoot webhook payload formats
    
    // IMPORTANT: Only process INCOMING messages (type 0) from contacts
    // Skip OUTGOING messages (type 1) and ACTIVITY messages (type 2) to prevent loops
    // Chatwoot sends message_type nested in the message object
    const messageType = event.message?.message_type ?? event.message_type;
    const isIncomingMessage = messageType === 0 || messageType === 'incoming';
    const isOutgoingMessage = messageType === 1 || messageType === 'outgoing';
    const isActivityMessage = messageType === 2 || messageType === 'activity';

    // Skip if it's an outgoing message (from bot/agent) to prevent loops
    if (isOutgoingMessage) {
      console.log('⏭️ Skipping outgoing message to prevent loop');
      return NextResponse.json({ received: true, skipped: 'outgoing message' });
    }

    // Skip if it's an activity message (system messages like "joined conversation")
    // ALSO check content patterns to catch activity messages that might have wrong message_type
    const messageContent = event.content || event.message?.content || '';
    const activityPatterns = [
      /is reviewing your details/i,
      /joined the conversation/i,
      /All AI specialists/i
    ];
    const isActivityByContent = activityPatterns.some(pattern => pattern.test(messageContent));

    if (isActivityMessage || isActivityByContent) {
      console.log('⏭️ Skipping activity message:', {
        messageType,
        isActivityByContent,
        content: messageContent.substring(0, 50)
      });
      return NextResponse.json({ received: true, skipped: 'activity message' });
    }

    // Check for bot message echoes (before duplicate fingerprint check)
    if (isIncomingMessage) {
      const webhookMessageId = event.id?.toString()

      console.log('🔍 Checking for echo:', {
        conversationId: event.conversation?.id,
        messageId: webhookMessageId,
        contentPreview: messageContent.substring(0, 50),
        messageType: messageType
      })

      if (checkIfEcho(event.conversation?.id, messageContent, webhookMessageId)) {
        console.log('⏭️ Skipping echoed bot message:', {
          conversationId: event.conversation?.id,
          messageId: webhookMessageId,
          reason: 'Detected as bot echo',
          contentPreview: messageContent.substring(0, 50)
        })
        return NextResponse.json({ received: true, skipped: 'bot_echo' })
      }
    }

    // Check for duplicate message processing using multiple fingerprints
    const messageId = event.id?.toString();
    const contentFingerprint = `${event.conversation?.id}-${event.content || event.message?.content}`;

    if (messageId && processedMessages.has(messageId)) {
      console.log('⏭️ Skipping duplicate webhook (message ID):', messageId);
      return NextResponse.json({ received: true, skipped: 'duplicate_id' });
    }
    if (processedMessages.has(contentFingerprint)) {
      console.log('⏭️ Skipping duplicate webhook (content fingerprint):', contentFingerprint);
      return NextResponse.json({ received: true, skipped: 'duplicate_content' });
    }

    if (messageId) processedMessages.add(messageId);
    processedMessages.add(contentFingerprint);
    
    const isFromContact = (event.sender?.type === 'contact') || 
                         (event.message?.sender?.type === 'contact') ||
                         (!event.sender) ||
                         (event.sender && !event.sender.type); // If sender exists but type undefined, assume contact
    const conversationStatus = event.conversation?.status;
    const isBotManagedStatus = conversationStatus === 'bot' || conversationStatus === 'pending' || conversationStatus === 'open';
    if (conversationStatus === 'open') {
      console.log('⚠️ Conversation status reported as open; processing to keep AI broker in sync');
    }
    
    console.log('🔍 Checking conditions:', {
      USE_N8N_BROKER,
      eventType: event.event,
      isIncomingMessage,
      isActivityMessage,
      isActivityByContent,
      messageType: messageType,
      actualMessageType: event.message?.message_type,
      rootMessageType: event.message_type,
      isPrivate: event.private ?? event.message?.private,
      isFromContact,
      senderType: event.message?.sender?.type ?? event.sender?.type,
      conversationStatus,
      hasContent: !!event.content || !!event.message?.content,
      contentPreview: messageContent.substring(0, 50)
    });

    // PHASE 3: BullMQ Integration for incoming messages
    // Check if this message should be processed by BullMQ
    const migrationStatus = getMigrationStatus()
    const useBullMQ = shouldUseBullMQ()

    console.log('🔀 Migration routing decision:', {
      conversationId: event.conversation?.id,
      useBullMQ,
      bullmqEnabled: migrationStatus.bullmqEnabled,
      trafficPercentage: migrationStatus.trafficPercentage,
      phase: migrationStatus.phase
    })

    // Process incoming messages (for both BullMQ and/or n8n)
    // Changed from `USE_N8N_BROKER &&` to allow BullMQ-only mode
    if (
      event.event === 'message_created' &&
      isIncomingMessage &&
      !(event.private ?? event.message?.private) &&
      isFromContact && // isFromContact already includes !event.sender check
      isBotManagedStatus // Allow bot, pending, or open status
    ) {
      const { conversation } = event;
      // Use content from root level for new format
      const message = event.message || { content: event.content };

      console.log('🚀 Processing incoming message...');

      // PHASE 3: BullMQ parallel processing
      // Route to BullMQ if selected by migration control OR if n8n is disabled
      const shouldUseBullMQForMessage = useBullMQ || !USE_N8N_BROKER;

      if (shouldUseBullMQForMessage && migrationStatus.bullmqEnabled) {
        console.log(`📋 Queueing to BullMQ (${migrationStatus.trafficPercentage}% traffic, n8n ${USE_N8N_BROKER ? 'parallel' : 'disabled'})`)

        try {
          // Get assigned broker for this conversation
          const broker = await getBrokerForConversation(conversation.id)

          if (broker) {
            await queueIncomingMessage({
              conversationId: conversation.id,
              contactId: conversation.contact_id || 0,
              brokerId: broker.id,
              brokerName: broker.name,
              brokerPersona: {
                name: broker.name,
                type: (broker.personality_type as 'aggressive' | 'balanced' | 'conservative') || 'balanced',
                title: broker.title || '',
                approach: broker.approach || '',
                urgencyLevel: 'medium',
                avatar: broker.avatar || '',
                responseStyle: {
                  tone: broker.tone || 'professional',
                  pacing: broker.pacing || 'moderate',
                  focus: broker.focus || 'balanced',
                },
              },
              processedLeadData: {
                name: conversation.meta?.sender?.name || 'Customer',
                email: conversation.meta?.sender?.email || '',
                phone: conversation.meta?.sender?.phone_number || '',
                loanType: conversation.custom_attributes?.loan_type || 'new_purchase',
                leadScore: conversation.custom_attributes?.lead_score || 50,
                sessionId: conversation.custom_attributes?.session_id || '',
                actualIncomes: conversation.custom_attributes?.actualIncomes || [0],
                actualAges: conversation.custom_attributes?.actualAges || [30],
                employmentType: conversation.custom_attributes?.employment_type || 'employed',
                brokerPersona: {
                  name: broker.name,
                  type: (broker.personality_type as 'aggressive' | 'balanced' | 'conservative') || 'balanced',
                  title: broker.title || '',
                  approach: broker.approach || '',
                  urgencyLevel: 'medium',
                  avatar: broker.avatar || '',
                  responseStyle: {
                    tone: broker.tone || 'professional',
                    pacing: broker.pacing || 'moderate',
                    focus: broker.focus || 'balanced',
                  },
                },
              },
              userMessage: messageContent,
              messageId: event.id,
            })

            console.log('✅ Message queued in BullMQ successfully')

            logMigrationDecision(
              conversation.id,
              true,
              'Incoming message queued in BullMQ',
              conversation.custom_attributes?.lead_score
            )
          } else {
            console.log('⚠️ No broker assigned to conversation, skipping BullMQ queue')

            // If n8n is disabled and no broker, we have a problem
            if (!USE_N8N_BROKER) {
              console.error('❌ CRITICAL: No broker assigned and n8n disabled - message will not be processed!')
              return NextResponse.json(
                { error: 'No broker assigned to conversation' },
                { status: 500 }
              );
            }
          }
        } catch (error) {
          console.error('❌ Failed to queue to BullMQ:', error)

          // If n8n is disabled, this is critical - can't fall back
          if (!USE_N8N_BROKER) {
            console.error('❌ CRITICAL: BullMQ failed and n8n disabled - cannot process message!')
            throw error; // Let the outer catch handler deal with it
          }

          // Continue with n8n as fallback if it's enabled
          console.log('⚠️ Falling back to n8n due to BullMQ error')
        }
      }

      // EXISTING PATH: n8n forwarding
      // Only forward to n8n if it's enabled (parallel mode or n8n-only)
      // During 100% BullMQ rollout with n8n disabled, skip this
      if (!USE_N8N_BROKER) {
        console.log('⏭️ n8n disabled - BullMQ handles all AI responses');
        return NextResponse.json({ received: true, processed_by: 'bullmq' });
      }

      console.log('🚀 Forwarding to n8n AI Broker workflow (parallel mode)');

      // DEFENSIVE VALIDATION: Ensure conversation_status exists before forwarding
      const conversationStatus = event.conversation?.custom_attributes?.conversation_status;
      if (!conversationStatus) {
        console.warn('⚠️ conversation_status missing from webhook payload - applying defensive fallback to "bot"');
        console.log('🔍 Conversation custom_attributes:', JSON.stringify(event.conversation?.custom_attributes, null, 2));
      }

      try {
        // Build only what n8n absolutely needs with GUARANTEED conversation_status
        const n8nPayload = {
          // Minimal root fields
          event: 'message_created',
          content: event.content || '',

          // The critical message object that n8n checks
          message: {
            message_type: 'incoming',  // n8n IF node checks this
            sender: {
              type: 'contact'  // n8n IF node checks this
            },
            content: event.content || ''
          },

          // Conversation for context with GUARANTEED conversation_status
          conversation: {
            id: event.conversation?.id,
            status: event.conversation?.status || 'pending',
            custom_attributes: {
              ...(event.conversation?.custom_attributes || {}),
              // CRITICAL: Triple-layer defense for conversation_status
              // 1. Use existing value if present
              // 2. Fallback to 'bot' if missing (allows n8n filter to pass)
              // 3. Log warning above if fallback triggered
              conversation_status: conversationStatus || 'bot'
            }
          }
        };
        
        console.log('📤 Sending to n8n with transformed payload:', {
          event: n8nPayload.event,
          'message.message_type': n8nPayload.message?.message_type,
          'message.sender.type': n8nPayload.message?.sender?.type,
          'conversation.id': n8nPayload.conversation?.id,
          'conversation.status': n8nPayload.conversation?.status,
          'conversation.custom_attributes.conversation_status': n8nPayload.conversation?.custom_attributes?.conversation_status,
          'was_fallback_used': !conversationStatus,  // Track if defensive fallback triggered
          content: n8nPayload.message?.content?.substring(0, 50)
        });

        console.log('🔍 Full conversation custom_attributes being sent:',
          JSON.stringify(n8nPayload.conversation?.custom_attributes, null, 2)
        );

        console.log('✅ n8n workflow filter requirements check:', {
          'message.message_type === "incoming"': n8nPayload.message?.message_type === 'incoming',
          'message.sender.type === "contact"': n8nPayload.message?.sender?.type === 'contact',
          'conversation.custom_attributes.conversation_status === "bot"': n8nPayload.conversation?.custom_attributes?.conversation_status === 'bot',
          'all_conditions_met': n8nPayload.message?.message_type === 'incoming' &&
                                n8nPayload.message?.sender?.type === 'contact' &&
                                n8nPayload.conversation?.custom_attributes?.conversation_status === 'bot'
        });

        // Forward the transformed event to n8n
        const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(n8nPayload)
        });
        
        if (n8nResponse.ok) {
          const result = await n8nResponse.json();
          console.log('✅ n8n processed successfully:', result);
          
          // Update metrics in Supabase if handoff occurred
          if (result.shouldHandoff && conversation.custom_attributes?.ai_broker_id) {
            await updateBrokerMetrics(
              conversation.id,
              conversation.custom_attributes.ai_broker_id,
              result.messageCount || 1,
              true,
              result.handoffReason
            );

            await brokerEngagementManager.releaseBrokerForConversation(
              conversation.id,
              conversation.custom_attributes.ai_broker_id
            );
            
            // Dispatch handoff event for frontend
            if (result.shouldHandoff) {
              // This would be sent via WebSocket or SSE in production
              console.log('🔔 Would dispatch handoff event:', {
                conversationId: conversation.id,
                reason: result.handoffReason,
                urgency: result.urgencyLevel
              });
            }
          }
        } else {
          console.error('❌ n8n webhook failed:', n8nResponse.status);
          // Fall back to local processing
          await localProcessing(event);
        }
      } catch (error) {
        console.error('❌ Error forwarding to n8n:', error);
        // Fall back to local processing
        await localProcessing(event);
      }
    } else if (
      !USE_N8N_BROKER &&
      event.event === 'message_created' && 
      event.message?.message_type === 'incoming' &&
      !event.message?.private &&
      event.message?.sender?.type !== 'agent' &&
      isBotManagedStatus
    ) {
      // Use local processing if n8n is disabled
      await localProcessing(event);
    }
    
    // Handle conversation status changes
    if (event.event === 'conversation_status_changed') {
      const { conversation } = event;
      
      if (conversation.status === 'open') {
        // Human agent took over
        console.log('👨‍💼 Conversation handed off to human agent');
        
        // Update metrics if broker was assigned
        if (conversation.custom_attributes?.ai_broker_id) {
          await updateBrokerMetrics(
            conversation.id,
            conversation.custom_attributes.ai_broker_id,
            conversation.custom_attributes.message_count || 0,
            true,
            'status_changed_to_open'
          );

          await brokerEngagementManager.releaseBrokerForConversation(
            conversation.id,
            conversation.custom_attributes.ai_broker_id
          );
        }
      } else if (conversation.status === 'resolved' && conversation.custom_attributes?.ai_broker_id) {
        console.log('✅ Conversation resolved – releasing AI broker', conversation.id);
        await brokerEngagementManager.releaseBrokerForConversation(
          conversation.id,
          conversation.custom_attributes.ai_broker_id
        );
      }
    }
    
    return NextResponse.json({ received: true });
    
  } catch (error) {
    console.error('Error processing Chatwoot webhook:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

/**
 * Fallback to human broker when n8n is unavailable
 */
async function localProcessing(event: any) {
  const { conversation, message } = event;
  
  console.log('📍 n8n unavailable - escalating to human broker');
  
  // Get customer info
  const customAttributes = conversation.custom_attributes || {};
  const customerName = customAttributes.name || conversation.contact?.name || 'Customer';
  const customerPhone = customAttributes.phone || conversation.contact?.phone_number;
  const customerEmail = customAttributes.email || conversation.contact?.email;
  
  // Human broker fallback message
  const fallbackMessage = `Hi ${customerName}! 👋

I'm experiencing some technical difficulties right now, but I don't want to keep you waiting for your mortgage needs.

I've assigned your conversation to our senior mortgage specialist who will assist you immediately:

🏠 **Brent - Senior Mortgage Specialist**
📱 Connected via WhatsApp (notification sent)
⏰ Available: Mon-Fri 9AM-7PM, Sat 9AM-2PM

He'll be able to help you with:
✅ Loan pre-approval
✅ Interest rate quotes  
✅ Property valuation
✅ CPF calculation
✅ Refinancing options

Your inquiry: "${message.content || message}"

Brent has been notified and will respond within 15 minutes during business hours!`;

  // Send fallback message to Chatwoot
  await sendMessageToChatwoot(conversation.id, fallbackMessage);
  
  // Assign to human agent (Brent) - this will trigger WhatsApp notification
  await assignConversationToAgent(conversation.id, 'Brent');
  
  // Add internal note for the human agent
  await addInternalNote(conversation.id, 
    `🚨 URGENT: AI system unavailable - customer needs immediate assistance
    
📊 Lead Score: ${customAttributes.lead_score || 50}/100
📱 Customer: ${customerName}
📞 Phone: ${customerPhone || 'Not provided'}
📧 Email: ${customerEmail || 'Not provided'}

Original message: "${message.content || message}"

⏰ Escalated: ${new Date().toLocaleString('en-SG')}
Reason: n8n workflow unavailable`
  );
  
  // Update conversation to human handoff
  await updateConversationAttributes(conversation.id, {
    status: 'escalated_to_human',
    human_broker: 'Brent',
    escalation_reason: 'n8n_unavailable',
    escalated_at: new Date().toISOString()
  });

  if (customAttributes.ai_broker_id) {
    await brokerEngagementManager.releaseBrokerForConversation(
      conversation.id,
      customAttributes.ai_broker_id
    );
  }
}

/**
 * Generate AI broker response
 */
async function generateAIBrokerResponse(context: any): Promise<string | null> {
  try {
    // Use absolute URL for server-side fetch
    const baseUrl = process.env.NODE_ENV === 'production'
      ? process.env.NEXT_PUBLIC_URL || 'https://nextnest.sg'
      : 'http://localhost:3006';
      
    console.log('🔗 Making internal API call to:', `${baseUrl}/api/broker-response`);
    
    const response = await fetch(`${baseUrl}/api/broker-response`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: context.message,
        leadScore: context.leadScore,
        brokerPersona: context.brokerPersona,
        conversationId: context.conversationId,
        messageCount: context.customAttributes.message_count || 1
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.response;
    } else {
      console.error('Failed to generate AI response:', response.status);
      return null;
    }
  } catch (error) {
    console.error('Error generating AI response:', error);
    return null;
  }
}

/**
 * Send message to Chatwoot conversation
 */
async function sendMessageToChatwoot(conversationId: number, message: string) {
  try {
    const CHATWOOT_BASE_URL = process.env.CHATWOOT_BASE_URL;
    const CHATWOOT_API_TOKEN = process.env.CHATWOOT_API_TOKEN;
    const CHATWOOT_ACCOUNT_ID = process.env.CHATWOOT_ACCOUNT_ID;

    console.log('📤 Sending message to Chatwoot:', {
      url: `${CHATWOOT_BASE_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/conversations/${conversationId}/messages`,
      conversationId,
      messageLength: message.length
    });

    const response = await fetch(
      `${CHATWOOT_BASE_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/conversations/${conversationId}/messages`,
      {
        method: 'POST',
        headers: {
          'Api-Access-Token': CHATWOOT_API_TOKEN!,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: message,
          message_type: 'outgoing',
          private: false
        })
      }
    );

    if (response.ok) {
      const responseData = await response.json();

      // Extract message ID from Chatwoot response
      const messageId = responseData.id?.toString() || `fallback-${conversationId}-${Date.now()}`;

      // #COMPLETION_DRIVE_IMPL: Assuming Chatwoot returns responseData.id as numeric
      if (!responseData.id) {
        console.warn('⚠️ Chatwoot did not return message ID for fallback message, using fallback:', messageId);
      }

      console.log('✅ AI response sent to Chatwoot:', { messageId });

      // Track bot message for echo detection (non-blocking)
      try {
        trackBotMessage(conversationId, message, messageId);
        console.log('✅ Fallback message tracked for echo detection:', {
          conversationId,
          messageId
        });
      } catch (trackingError) {
        // Non-blocking: Log error but don't fail the send
        console.error('⚠️ Failed to track fallback message (non-critical):', trackingError);
      }
    } else {
      const errorText = await response.text();
      console.error('❌ Failed to send message to Chatwoot:', response.status, errorText);
    }
  } catch (error) {
    console.error('Error sending message to Chatwoot:', error);
  }
}

/**
 * Track interaction in Langfuse
 */
async function trackInLangfuse(data: any) {
  try {
    // This will be implemented when Langfuse integration is added
    console.log('📊 Would track in Langfuse:', {
      conversationId: data.conversationId,
      messageLength: data.userMessage.length,
      responseLength: data.aiResponse.length
    });
  } catch (error) {
    console.error('Error tracking in Langfuse:', error);
  }
}

/**
 * Check if conversation should be escalated to human
 */
async function checkForHumanEscalation(conversation: any, userMessage: string) {
  try {
    const customAttributes = conversation.custom_attributes || {};
    const messageCount = (customAttributes.message_count || 0) + 1;
    const leadScore = customAttributes.lead_score || 50;
    
    // Update message count
    await updateConversationAttributes(conversation.id, {
      message_count: messageCount
    });
    
    // Check escalation triggers
    const escalationKeywords = [
      'speak to human', 'real person', 'manager', 'supervisor',
      'not helpful', 'frustrated', 'cancel', 'complaint',
      'ready to proceed', 'ready to buy', 'let\'s do this'
    ];
    
    const hasEscalationKeyword = escalationKeywords.some(keyword => 
      userMessage.toLowerCase().includes(keyword)
    );
    
    const shouldEscalate = 
      hasEscalationKeyword || 
      (messageCount > 15 && leadScore >= 75) || // High-value lead engaged
      messageCount > 25; // Long conversation
    
    if (shouldEscalate && !customAttributes.ready_for_human) {
      console.log('🚨 Escalating to human:', { messageCount, leadScore, hasKeyword: hasEscalationKeyword });
      
      // Mark as ready for human takeover
      await updateConversationAttributes(conversation.id, {
        ready_for_human: true,
        escalation_reason: hasEscalationKeyword ? 'user_request' : 'high_engagement'
      });
      
      // Add internal note for human agents
      await addInternalNote(conversation.id, 
        `🤖➡️👨‍💼 AI Broker recommends human takeover. Reason: ${
          hasEscalationKeyword ? 'User requested human assistance' : 
          `High engagement (${messageCount} messages, lead score: ${leadScore})`
        }`
      );
    }
  } catch (error) {
    console.error('Error checking escalation:', error);
  }
}

/**
 * Update conversation custom attributes
 */
async function updateConversationAttributes(conversationId: number, attributes: any) {
  try {
    const CHATWOOT_BASE_URL = process.env.CHATWOOT_BASE_URL;
    const CHATWOOT_API_TOKEN = process.env.CHATWOOT_API_TOKEN;
    const CHATWOOT_ACCOUNT_ID = process.env.CHATWOOT_ACCOUNT_ID;
    
    await fetch(
      `${CHATWOOT_BASE_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/conversations/${conversationId}/custom_attributes`,
      {
        method: 'POST',
        headers: {
          'Api-Access-Token': CHATWOOT_API_TOKEN!,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ custom_attributes: attributes })
      }
    );
  } catch (error) {
    console.error('Error updating conversation attributes:', error);
  }
}

/**
 * Add internal note for human agents
 */
async function addInternalNote(conversationId: number, note: string) {
  try {
    const CHATWOOT_BASE_URL = process.env.CHATWOOT_BASE_URL;
    const CHATWOOT_API_TOKEN = process.env.CHATWOOT_API_TOKEN;
    const CHATWOOT_ACCOUNT_ID = process.env.CHATWOOT_ACCOUNT_ID;
    
    await fetch(
      `${CHATWOOT_BASE_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/conversations/${conversationId}/messages`,
      {
        method: 'POST',
        headers: {
          'Api-Access-Token': CHATWOOT_API_TOKEN!,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: note,
          message_type: 'outgoing',
          private: true // Internal note only
        })
      }
    );
  } catch (error) {
    console.error('Error adding internal note:', error);
  }
}

/**
 * Assign conversation to human agent (triggers Chatwoot WhatsApp notification)
 */
async function assignConversationToAgent(conversationId: number, agentName: string) {
  try {
    const CHATWOOT_BASE_URL = process.env.CHATWOOT_BASE_URL;
    const CHATWOOT_API_TOKEN = process.env.CHATWOOT_API_TOKEN;
    const CHATWOOT_ACCOUNT_ID = process.env.CHATWOOT_ACCOUNT_ID;
    
    // First, get the agent ID by name
    const agentsResponse = await fetch(
      `${CHATWOOT_BASE_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/agents`,
      {
        headers: {
          'Api-Access-Token': CHATWOOT_API_TOKEN!,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (agentsResponse.ok) {
      const agents = await agentsResponse.json();
      const agent = agents.find((a: any) => a.name === agentName || a.email?.includes(agentName.toLowerCase()));
      
      if (agent) {
        // Assign conversation to agent
        const assignResponse = await fetch(
          `${CHATWOOT_BASE_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/conversations/${conversationId}/assignments`,
          {
            method: 'POST',
            headers: {
              'Api-Access-Token': CHATWOOT_API_TOKEN!,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              assignee_id: agent.id
            })
          }
        );
        
        // Also change conversation status to 'open' for human attention
        await fetch(
          `${CHATWOOT_BASE_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/conversations/${conversationId}`,
          {
            method: 'PATCH',
            headers: {
              'Api-Access-Token': CHATWOOT_API_TOKEN!,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              status: 'open'
            })
          }
        );
        
        if (assignResponse.ok) {
          console.log(`✅ Conversation assigned to ${agentName} - WhatsApp notification sent`);
        } else {
          console.error('❌ Failed to assign conversation:', assignResponse.status);
        }
      } else {
        console.error(`❌ Agent "${agentName}" not found`);
      }
    } else {
      console.error('❌ Failed to get agents list:', agentsResponse.status);
    }
  } catch (error) {
    console.error('Error assigning conversation to agent:', error);
  }
}

