import { NextRequest, NextResponse } from 'next/server'
import { trackBotMessage } from '@/lib/utils/message-tracking'
import { generateBrokerResponse } from '@/lib/ai/broker-ai-service'
import { calculateBrokerPersona } from '@/lib/calculations/broker-persona'
import { ProcessedLeadData } from '@/lib/integrations/chatwoot-client'

// Force dynamic rendering - needs runtime environment variables for Chatwoot API
export const dynamic = 'force-dynamic'

/**
 * Chatwoot AI Webhook Handler with Dr. Elena Integration
 *
 * Week 3 Enhancement: Integrated MAS-compliant mortgage calculations
 *
 * Flow:
 * 1. Receives message from Chatwoot
 * 2. Extracts lead data and calculates broker persona
 * 3. Routes to generateBrokerResponse (broker-ai-service.ts)
 *    - Intent router classifies message
 *    - Calculation requests → Dr. Elena (MAS-compliant)
 *    - General questions → Standard AI response
 * 4. Checks for handoff triggers
 * 5. Sends response back to Chatwoot
 */
export async function POST(request: NextRequest) {
  try {
    const event = await request.json()
    
    console.log('🤖 AI Webhook received:', {
      event: event.event,
      conversationId: event.conversation?.id,
      messageType: event.message?.message_type,
      status: event.conversation?.status,
      senderType: event.message?.sender?.type
    })
    
    // Only process incoming customer messages
    if (
      event.event === 'message_created' && 
      event.message?.message_type === 'incoming' &&
      !event.message?.private &&
      event.message?.sender?.type !== 'agent'
    ) {
      const { conversation, message } = event

      // Extract lead data from conversation custom attributes
      const leadData = extractLeadData(conversation)

      // Calculate broker persona based on lead profile
      const brokerPersona = calculateBrokerPersona(
        leadData.leadScore,
        {
          propertyCategory: leadData.propertyCategory || 'HDB',
          loanType: leadData.loanType || 'new_purchase'
        }
      )

      // Get conversation history
      const history = await getConversationHistory(conversation.id)
      const conversationHistory = history.map((msg: any) => ({
        role: msg.sender_type === 'contact' ? 'user' as const : 'assistant' as const,
        content: msg.content
      }))

      // Generate AI response using Dr. Elena-integrated broker service
      const aiResponse = await generateBrokerResponse({
        message: message.content,
        persona: brokerPersona,
        leadData,
        conversationId: conversation.id,
        conversationHistory
      })
      
      if (aiResponse) {
        // Check if handoff is needed before sending response
        const handoffAnalysis = await analyzeForHandoff({
          userMessage: message.content,
          aiResponse,
          leadData,
          conversationHistory
        })
        
        if (handoffAnalysis.shouldHandoff) {
          // Trigger human handoff
          await triggerHumanHandoff(conversation, handoffAnalysis.reason)
          
          // Send handoff message
          await sendMessageToChatwoot(
            conversation.id,
            `I understand this is important. Let me connect you with a senior mortgage specialist who can provide more detailed assistance. They'll be with you shortly.\n\n${handoffAnalysis.reason}`
          )
        } else {
          // Send AI response
          await sendMessageToChatwoot(conversation.id, aiResponse)
          
          // Update conversation attributes
          await updateConversationAttributes(conversation.id, {
            message_count: (leadData.messageCount || 0) + 1,
            last_ai_response: new Date().toISOString(),
            ai_broker_name: brokerPersona.name
          })
        }

        // Track in analytics
        await trackInAnalytics({
          conversationId: conversation.id,
          userMessage: message.content,
          aiResponse,
          handoffTriggered: handoffAnalysis.shouldHandoff,
          leadScore: leadData.leadScore,
          brokerPersona: brokerPersona.name
        })
      }
    }
    
    return NextResponse.json({ received: true })
    
  } catch (error) {
    console.error('Error processing AI webhook:', error)
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    )
  }
}

/**
 * Extract lead data from conversation attributes as ProcessedLeadData
 * Week 3: Updated to provide Dr. Elena with proper lead context
 */
function extractLeadData(conversation: any): ProcessedLeadData {
  const attributes = conversation.custom_attributes || {}

  // Parse income array (can be single or multiple for co-applicants)
  const monthlyIncome = attributes.monthly_income || 5000
  const actualIncomes = Array.isArray(monthlyIncome)
    ? monthlyIncome
    : [monthlyIncome]

  return {
    name: attributes.name || 'there',
    email: attributes.email || 'unknown@nextnest.sg',
    phone: attributes.phone || '',
    leadScore: attributes.lead_score || 50,
    loanType: attributes.loan_type || 'new_purchase',
    propertyCategory: attributes.property_category || 'HDB',
    propertyType: attributes.property_type || attributes.property_category || 'HDB',
    propertyPrice: attributes.property_price || 500000,
    actualIncomes,
    actualAges: attributes.ages ? JSON.parse(attributes.ages) : [attributes.age || 30],
    existingCommitments: attributes.existing_commitments || 0,
    age: attributes.age || 30,
    citizenship: attributes.citizenship || 'Citizen',
    propertyCount: attributes.property_count || 1,
    employmentType: attributes.employment_type || 'employed',
    purchaseTimeline: attributes.purchase_timeline,
    sessionId: attributes.session_id || `webhook-${Date.now()}`,
    brokerPersona: {} as any, // Will be calculated next

    // Co-applicant if exists
    coApplicantAge: attributes.co_applicant_age,

    // Additional context
    messageCount: attributes.message_count || 0,
    urgencyScore: determineUrgency(attributes.purchase_timeline, attributes.lead_score) === 'high' ? 0.8 : 0.5
  }
}

/**
 * Analyze conversation for handoff triggers
 * Week 3: Updated to use ProcessedLeadData
 */
async function analyzeForHandoff({
  userMessage,
  aiResponse,
  leadData,
  conversationHistory
}: {
  userMessage: string;
  aiResponse: string;
  leadData: ProcessedLeadData;
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
}): Promise<{ shouldHandoff: boolean; reason: string }> {
  // Immediate handoff triggers
  const handoffKeywords = [
    'speak to human', 'real person', 'human agent', 'manager',
    'not a bot', 'actual person', 'call me', 'phone number',
    'ready to proceed', 'sign up now', 'start application'
  ]
  
  const hasHandoffKeyword = handoffKeywords.some(keyword => 
    userMessage.toLowerCase().includes(keyword)
  )
  
  if (hasHandoffKeyword) {
    return {
      shouldHandoff: true,
      reason: '🤝 Great! I can see you\'re ready to move forward. Let me connect you with a specialist who can process your application immediately.'
    }
  }
  
  // Check for high-value lead engagement
  const messageCount = leadData.messageCount || 0
  const leadScore = leadData.leadScore || 50

  if (messageCount > 10 && leadScore >= 80) {
    return {
      shouldHandoff: true,
      reason: '🌟 Based on our conversation, you\'re an excellent candidate for our premium mortgage packages. Let me connect you with a senior specialist who can unlock exclusive rates for you.'
    }
  }

  // Check for complex queries that need human expertise
  const complexTopics = [
    'divorce', 'bankruptcy', 'legal', 'lawsuit', 'dispute',
    'foreign income', 'overseas property', 'trust', 'estate',
    'complicated', 'special case', 'unique situation'
  ]

  const hasComplexTopic = complexTopics.some(topic =>
    userMessage.toLowerCase().includes(topic)
  )

  if (hasComplexTopic) {
    return {
      shouldHandoff: true,
      reason: '📋 Your situation requires specialized expertise. Let me connect you with a senior advisor who handles complex cases.'
    }
  }

  // Check for frustration signals
  const frustrationSignals = [
    'not helpful', 'don\'t understand', 'frustrated', 'annoying',
    'stupid bot', 'useless', 'waste of time', 'not working'
  ]

  const showsFrustration = frustrationSignals.some(signal =>
    userMessage.toLowerCase().includes(signal)
  )

  if (showsFrustration) {
    return {
      shouldHandoff: true,
      reason: '😊 I apologize if I haven\'t been helpful enough. Let me immediately connect you with a human specialist who can better assist you.'
    }
  }

  // High purchase intent signals - check urgency score
  const isHighUrgency = (leadData.urgencyScore || 0) >= 0.7
  if (isHighUrgency && messageCount > 5) {
    const intentSignals = ['when can', 'how fast', 'urgent', 'asap', 'immediately', 'today', 'now']
    const hasHighIntent = intentSignals.some(signal => 
      userMessage.toLowerCase().includes(signal)
    )
    
    if (hasHighIntent) {
      return {
        shouldHandoff: true,
        reason: '⚡ I can see this is time-sensitive. Let me connect you with a specialist who can fast-track your application today.'
      }
    }
  }
  
  return { shouldHandoff: false, reason: '' }
}

/**
 * Trigger human handoff in Chatwoot
 */
async function triggerHumanHandoff(conversation: any, reason: string) {
  try {
    const CHATWOOT_BASE_URL = process.env.CHATWOOT_BASE_URL
    const CHATWOOT_API_TOKEN = process.env.CHATWOOT_API_TOKEN
    const CHATWOOT_ACCOUNT_ID = process.env.CHATWOOT_ACCOUNT_ID
    
    // Change conversation status from 'bot' to 'open' for human agents
    await fetch(
      `${CHATWOOT_BASE_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/conversations/${conversation.id}`,
      {
        method: 'PATCH',
        headers: {
          'Api-Access-Token': CHATWOOT_API_TOKEN!,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'open' // This assigns to human agents
        })
      }
    )
    
    // Add internal note for agents
    await fetch(
      `${CHATWOOT_BASE_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/conversations/${conversation.id}/messages`,
      {
        method: 'POST',
        headers: {
          'Api-Access-Token': CHATWOOT_API_TOKEN!,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: `🤖➡️👨‍💼 AI Bot Handoff\nReason: ${reason}\nLead Score: ${conversation.custom_attributes?.lead_score || 'N/A'}\nMessages Exchanged: ${conversation.custom_attributes?.message_count || 0}`,
          message_type: 'outgoing',
          private: true // Internal note only visible to agents
        })
      }
    )
    
    // Update conversation attributes
    await updateConversationAttributes(conversation.id, {
      handoff_triggered: true,
      handoff_reason: reason,
      handoff_time: new Date().toISOString()
    })
    
    console.log('✅ Human handoff triggered for conversation:', conversation.id)
    
  } catch (error) {
    console.error('Error triggering handoff:', error)
  }
}

/**
 * Get conversation history from Chatwoot
 */
async function getConversationHistory(conversationId: number) {
  try {
    const CHATWOOT_BASE_URL = process.env.CHATWOOT_BASE_URL
    const CHATWOOT_API_TOKEN = process.env.CHATWOOT_API_TOKEN
    const CHATWOOT_ACCOUNT_ID = process.env.CHATWOOT_ACCOUNT_ID
    
    const response = await fetch(
      `${CHATWOOT_BASE_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/conversations/${conversationId}/messages`,
      {
        headers: {
          'Api-Access-Token': CHATWOOT_API_TOKEN!
        }
      }
    )
    
    if (response.ok) {
      const data = await response.json()
      return data.payload || []
    }
    
    return []
  } catch (error) {
    console.error('Error fetching conversation history:', error)
    return []
  }
}

/**
 * Send message to Chatwoot
 */
async function sendMessageToChatwoot(conversationId: number, message: string) {
  try {
    const CHATWOOT_BASE_URL = process.env.CHATWOOT_BASE_URL
    const CHATWOOT_API_TOKEN = process.env.CHATWOOT_API_TOKEN
    const CHATWOOT_ACCOUNT_ID = process.env.CHATWOOT_ACCOUNT_ID

    console.log('📤 Sending AI message to Chatwoot:', {
      conversationId,
      messageLength: message.length
    })

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
    )

    if (response.ok) {
      const responseData = await response.json()

      // Extract message ID from Chatwoot response
      const messageId = responseData.id?.toString() || `fallback-${conversationId}-${Date.now()}`

      // #COMPLETION_DRIVE_IMPL: Assuming Chatwoot returns responseData.id as numeric
      if (!responseData.id) {
        console.warn('⚠️ Chatwoot did not return message ID for AI response, using fallback:', messageId)
      }

      console.log('✅ AI response sent to Chatwoot:', { messageId })

      // Track bot message for echo detection (non-blocking)
      try {
        trackBotMessage(conversationId, message, messageId)
        console.log('✅ AI message tracked for echo detection:', {
          conversationId,
          messageId
        })
      } catch (trackingError) {
        // Non-blocking: Log error but don't fail the send
        console.error('⚠️ Failed to track AI message (non-critical):', trackingError)
      }
    } else {
      console.error('❌ Failed to send message to Chatwoot:', response.status)
    }
  } catch (error) {
    console.error('Error sending message to Chatwoot:', error)
  }
}

/**
 * Update conversation custom attributes
 */
async function updateConversationAttributes(conversationId: number, attributes: any) {
  try {
    const CHATWOOT_BASE_URL = process.env.CHATWOOT_BASE_URL
    const CHATWOOT_API_TOKEN = process.env.CHATWOOT_API_TOKEN
    const CHATWOOT_ACCOUNT_ID = process.env.CHATWOOT_ACCOUNT_ID
    
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
    )
  } catch (error) {
    console.error('Error updating conversation attributes:', error)
  }
}

/**
 * Track in analytics (Langfuse or your analytics system)
 */
async function trackInAnalytics(data: any) {
  try {
    // Implement your analytics tracking here
    console.log('📊 Analytics:', {
      conversationId: data.conversationId,
      handoffTriggered: data.handoffTriggered,
      leadScore: data.leadScore
    })
  } catch (error) {
    console.error('Error tracking analytics:', error)
  }
}

/**
 * Helper function: Determine urgency level from timeline and lead score
 * Used in extractLeadData for urgency scoring
 */
function determineUrgency(timeline: string | undefined, leadScore: number): string {
  if (timeline === 'immediate' || timeline === '1_month') return 'high'
  if (leadScore >= 80) return 'high'
  if (timeline === '3_months') return 'medium'
  return 'low'
}