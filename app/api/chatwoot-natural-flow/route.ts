/**
 * Enhanced Chatwoot Webhook with Natural Conversation Flow
 * Provides more human-like AI broker interactions
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  generateAgentJoiningMessage,
  generateNaturalResponse,
  sendNaturalMessage,
  determineConversationState,
  generateHandoffMessage,
  AI_BROKERS
} from '@/lib/ai/natural-conversation-flow'
import { FirstMessageGenerator } from '@/lib/ai/first-message-templates'

const CHATWOOT_BASE_URL = process.env.CHATWOOT_BASE_URL || 'https://chat.nextnest.sg'
const CHATWOOT_API_TOKEN = process.env.CHATWOOT_API_TOKEN
const CHATWOOT_ACCOUNT_ID = process.env.CHATWOOT_ACCOUNT_ID || '1'

export async function POST(request: NextRequest) {
  try {
    const event = await request.json()

    console.log('⏭️ Natural Flow Webhook DISABLED:', {
      event: event.event,
      conversationId: event.conversation?.id,
      messageType: event.message?.message_type,
      status: event.conversation?.status,
      reason: 'Greeting messages now handled by broker-engagement-manager'
    })

    // DISABLED: This webhook route is obsolete as of 2025-10-03
    // Root cause of message duplication: Multiple webhooks sending greetings
    //
    // Message sending is now centralized in broker-engagement-manager.ts
    // which is called from /api/chatwoot-conversation during conversation creation
    //
    // This route caused Message #2 of the duplicate greeting issue
    // Keeping route active for logging but disabling all message sending

    return NextResponse.json({
      received: true,
      disabled: true,
      message: 'Natural flow webhook deprecated. Greetings sent via broker-engagement-manager.',
      event: event.event,
      conversationId: event.conversation?.id
    })

    // OLD CODE BELOW - Commented out to prevent duplicate messages
    /*
    // Handle different event types
    if (event.event === 'conversation_created') {
      await handleNewConversation(event)
      return NextResponse.json({ handled: true })
    }

    if (event.event === 'message_created' &&
        event.message?.message_type === 'incoming') {
      await handleIncomingMessage(event)
      return NextResponse.json({ handled: true })
    }

    return NextResponse.json({ skipped: true })
    */

  } catch (error) {
    console.error('❌ Natural flow error (route disabled):', error)
    return NextResponse.json({
      received: true,
      disabled: true,
      error: String(error)
    }, { status: 200 })
  }
}

/**
 * Handle new conversation - assign broker and send natural greeting
 */
async function handleNewConversation(event: any) {
  const { conversation } = event
  const attributes = conversation.custom_attributes || {}

  // Extract lead data from form submission
  const leadScore = attributes.lead_score || 50
  const propertyType = attributes.property_category || 'hdb'
  const monthlyIncome = attributes.monthly_income || 5000
  const userName = attributes.name || 'there'
  const loanType = attributes.loan_type || 'new_purchase'

  // Select appropriate broker based on lead score and availability
  const selectedBroker = await selectBestBroker(leadScore, propertyType)

  // Build context for natural greeting
  const context = {
    conversationId: conversation.id,
    userName,
    leadScore,
    loanType,
    propertyType,
    monthlyIncome,
    messageCount: 0,
    isFirstMessage: true,
    brokerName: selectedBroker.name,
    brokerPersona: selectedBroker.personality as 'aggressive' | 'balanced' | 'conservative'
  }

  // Wait a moment before broker "joins"
  await new Promise(resolve => setTimeout(resolve, 2000))

  // Generate natural joining flow
  const { systemMessage, agentGreeting, delay } = generateAgentJoiningMessage(context)

  // Send system message about broker joining
  await sendSystemMessage(conversation.id, systemMessage)

  // Wait for natural delay
  await new Promise(resolve => setTimeout(resolve, delay))

  // Show typing indicator (simulated)
  await showTypingIndicator(conversation.id, true)

  // Wait for typing simulation
  const typingTime = calculateNaturalTypingTime(agentGreeting)
  await new Promise(resolve => setTimeout(resolve, typingTime))

  // Hide typing indicator
  await showTypingIndicator(conversation.id, false)

  // Send the personalized greeting
  await sendBrokerMessage(conversation.id, agentGreeting, selectedBroker)

  // Update conversation attributes
  await updateConversationAttributes(conversation.id, {
    ai_broker_assigned: true,
    ai_broker_name: selectedBroker.name,
    ai_broker_personality: selectedBroker.personality,
    message_count: 1,
    conversation_stage: 'greeting'
  })
}

/**
 * Handle incoming customer messages
 */
async function handleIncomingMessage(event: any) {
  const { conversation, message } = event
  const attributes = conversation.custom_attributes || {}

  // Skip if no broker assigned
  if (!attributes.ai_broker_assigned) {
    return
  }

  const messageCount = (attributes.message_count || 0) + 1
  const brokerName = attributes.ai_broker_name || 'Sarah Wong'
  const brokerPersona = attributes.ai_broker_personality || 'balanced'

  // Build conversation context
  const context = {
    conversationId: conversation.id,
    userName: attributes.name || 'there',
    leadScore: attributes.lead_score || 50,
    loanType: attributes.loan_type || 'new_purchase',
    propertyType: attributes.property_category || 'hdb',
    monthlyIncome: attributes.monthly_income || 5000,
    messageCount,
    isFirstMessage: false,
    brokerName,
    brokerPersona: brokerPersona as 'aggressive' | 'balanced' | 'conservative'
  }

  // Determine conversation stage
  const { stage, suggestedAction } = determineConversationState(messageCount, context.leadScore)

  // Check for handoff triggers
  if (shouldTriggerHandoff(message.content, messageCount, context.leadScore, stage)) {
    await handleHandoff(conversation, context, 'high_intent')
    return
  }

  // Generate natural response based on context
  const response = await generateContextualResponse(message.content, context, stage)

  // Show typing indicator
  await showTypingIndicator(conversation.id, true)

  // Calculate natural typing time
  const typingTime = calculateNaturalTypingTime(response)
  await new Promise(resolve => setTimeout(resolve, typingTime))

  // Hide typing and send response
  await showTypingIndicator(conversation.id, false)
  await sendBrokerMessage(conversation.id, response, { name: brokerName, personality: brokerPersona })

  // Update conversation state
  await updateConversationAttributes(conversation.id, {
    message_count: messageCount,
    conversation_stage: stage,
    last_interaction: new Date().toISOString()
  })
}

/**
 * Select best broker based on lead profile
 * Using 5 female brokers as per documentation
 */
async function selectBestBroker(leadScore: number, propertyType: string) {
  // High-value leads (80+) get aggressive brokers
  if (leadScore >= 80) {
    const aggressiveBrokers = ['michelle-chen', 'jasmine-lee']
    const selected = aggressiveBrokers[Math.floor(Math.random() * aggressiveBrokers.length)]
    return AI_BROKERS[selected]
  }

  // Medium-high leads (60-79) get balanced brokers
  if (leadScore >= 60) {
    const balancedBrokers = ['sarah-wong', 'rachel-tan']
    const selected = balancedBrokers[Math.floor(Math.random() * balancedBrokers.length)]
    return AI_BROKERS[selected]
  }

  // Lower scores (<60) get patient, educational broker
  return AI_BROKERS['grace-lim'] // Grace Lim for conservative approach
}

/**
 * Generate contextual response based on conversation stage
 */
async function generateContextualResponse(
  userMessage: string,
  context: any,
  stage: string
): Promise<string> {
  const messageGenerator = new FirstMessageGenerator()

  // Analyze intent
  const intent = analyzeMessageIntent(userMessage)

  // Generate stage-appropriate response
  let response = ''

  switch (stage) {
    case 'greeting':
      response = generateGreetingStageResponse(userMessage, context, intent)
      break

    case 'discovery':
      response = generateDiscoveryResponse(userMessage, context, intent)
      break

    case 'nurturing':
      response = generateNurturingResponse(userMessage, context, intent)
      break

    case 'closing':
      response = generateClosingResponse(userMessage, context, intent)
      break

    default:
      response = generateDefaultResponse(userMessage, context, intent)
  }

  // Add personality-specific elements
  response = addPersonalityElements(response, context.brokerPersona, context.messageCount)

  return response
}

/**
 * Analyze user message intent
 */
function analyzeMessageIntent(message: string): string {
  const lower = message.toLowerCase()

  if (lower.includes('rate') || lower.includes('interest')) return 'rates'
  if (lower.includes('afford') || lower.includes('qualify')) return 'affordability'
  if (lower.includes('when') || lower.includes('timeline')) return 'timeline'
  if (lower.includes('compare') || lower.includes('which')) return 'comparison'
  if (lower.includes('ready') || lower.includes('apply')) return 'application'
  if (lower.includes('help') || lower.includes('explain')) return 'education'

  return 'general'
}

/**
 * Generate response for greeting stage
 */
function generateGreetingStageResponse(message: string, context: any, intent: string): string {
  const { userName, propertyType, monthlyIncome } = context

  const responses: Record<string, string> = {
    'rates': `Great question about rates! For ${propertyType} properties, we're currently seeing 2-year fixed rates around 3.70-3.80%. With your income of S$${monthlyIncome}, you're well-positioned for competitive offers.\n\nWould you like me to calculate what your monthly payments might look like?`,

    'affordability': `Let me help you understand what you can comfortably afford. Based on your S$${monthlyIncome} monthly income and current lending rules, you could potentially qualify for a loan up to S$${Math.floor(monthlyIncome * 0.55 * 12 * 25 / 1000)}K.\n\nThis would translate to properties in the S$${Math.floor(monthlyIncome * 0.55 * 12 * 25 * 1.25 / 1000)}K range. Should I show you some specific calculations?`,

    'general': `I see you're exploring your mortgage options for a ${propertyType}. That's a great choice! To give you the most relevant information, could you tell me what's most important to you right now - understanding rates, checking affordability, or learning about the process?`
  }

  return responses[intent] || responses['general']
}

/**
 * Generate response for discovery stage
 */
function generateDiscoveryResponse(message: string, context: any, intent: string): string {
  const { propertyType, leadScore } = context

  if (leadScore >= 75) {
    return `Based on what you've shared, you're in an excellent position. Let me prepare a personalized comparison of the top 3 mortgage packages for your ${propertyType}. This will include exclusive rates from our partner banks.\n\nWhile I'm preparing that, is there a specific area or price range you're considering?`
  }

  return `I understand you're gathering information. That's smart! For ${propertyType} buyers, the key factors are usually the interest rate, loan tenure, and monthly payments.\n\nWhat matters most to you in choosing a mortgage package?`
}

/**
 * Generate response for nurturing stage
 */
function generateNurturingResponse(message: string, context: any, intent: string): string {
  const { userName, messageCount } = context

  if (messageCount > 7) {
    return `${userName}, we've covered quite a bit of ground. I can see you're serious about finding the right mortgage. At this point, I'd recommend we move to the next step - either a detailed proposal or a quick consultation.\n\nWhich would be more helpful for you?`
  }

  return `That's a great point. Let me address that specifically for your situation...`
}

/**
 * Generate response for closing stage
 */
function generateClosingResponse(message: string, context: any, intent: string): string {
  const { userName, leadScore } = context

  if (leadScore >= 80) {
    return `${userName}, based on everything we've discussed, you're ready for the next step. I can either:\n\n1. Start your pre-approval immediately (takes 24 hours)\n2. Schedule a call with our senior specialist today\n3. Send you a detailed proposal to review\n\nWhich would you prefer?`
  }

  return `You're asking all the right questions! I think you'd benefit from a more detailed discussion. Would you like me to arrange a consultation with one of our senior specialists?`
}

/**
 * Generate default response
 */
function generateDefaultResponse(message: string, context: any, intent: string): string {
  return `I understand. Let me help you with that...`
}

/**
 * Add personality-specific elements to response
 */
function addPersonalityElements(response: string, personality: string, messageCount: number): string {
  const elements: Record<string, string[]> = {
    'aggressive': [
      '\n\n⚡ Time is critical - rates change daily!',
      '\n\n🎯 My top clients save thousands by acting fast.',
      '\n\n🔥 I have exclusive access to deals not publicly listed.'
    ],
    'balanced': [
      '\n\nI am here to guide you through each step.',
      '\n\nLet me know if you need any clarification.',
      '\n\nWe can proceed at whatever pace works for you.'
    ],
    'conservative': [
      '\n\nThere is no pressure - take your time.',
      '\n\nFeel free to ask any questions you have.',
      '\n\nI want to ensure you are completely comfortable.'
    ]
  }

  // Add personality element occasionally
  if (Math.random() > 0.5 && messageCount > 2) {
    const personalityElements = elements[personality] || elements['balanced']
    response += personalityElements[Math.floor(Math.random() * personalityElements.length)]
  }

  return response
}

/**
 * Check if handoff should be triggered
 */
function shouldTriggerHandoff(
  message: string,
  messageCount: number,
  leadScore: number,
  stage: string
): boolean {
  const lower = message.toLowerCase()

  // Direct request for human
  if (lower.includes('speak to') || lower.includes('human') ||
      lower.includes('real person') || lower.includes('agent')) {
    return true
  }

  // High intent signals
  if (lower.includes('ready to apply') || lower.includes('sign up') ||
      lower.includes('start now') || lower.includes('begin application')) {
    return true
  }

  // Auto-handoff for high-value leads after engagement
  if (leadScore >= 80 && messageCount > 8) {
    return true
  }

  // Stage-based handoff
  if (stage === 'closing' && messageCount > 10) {
    return true
  }

  return false
}

/**
 * Handle handoff to human agent
 */
async function handleHandoff(conversation: any, context: any, reason: string) {
  const handoffMessage = generateHandoffMessage(context, reason)

  // Send handoff message
  await sendBrokerMessage(conversation.id, handoffMessage, {
    name: context.brokerName,
    personality: context.brokerPersona
  })

  // Wait a moment
  await new Promise(resolve => setTimeout(resolve, 2000))

  // Update conversation status to 'open' for human agents
  await updateConversationStatus(conversation.id, 'open')

  // Add internal note for human agents
  await addInternalNote(conversation.id, `
🤖 AI Handoff Summary
━━━━━━━━━━━━━━━━━━
Lead Score: ${context.leadScore}/100
Messages: ${context.messageCount}
Stage: Closing/Ready
Loan Type: ${context.loanType}
Property: ${context.propertyType}
Income: S$${context.monthlyIncome}
━━━━━━━━━━━━━━━━━━
Handoff Reason: ${reason}
AI Broker: ${context.brokerName}
  `)
}

// Helper functions for Chatwoot API calls

async function sendSystemMessage(conversationId: number, message: string) {
  // In real implementation, this would use Chatwoot API
  console.log(`[System] ${message}`)
}

async function sendBrokerMessage(conversationId: number, message: string, broker: any) {
  try {
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

    if (!response.ok) {
      throw new Error(`Failed to send message: ${response.status}`)
    }
  } catch (error) {
    console.error('Error sending broker message:', error)
  }
}

async function showTypingIndicator(conversationId: number, show: boolean) {
  // Chatwoot API doesn't directly support typing indicators
  // This would need custom implementation or webhook
  console.log(`[Typing: ${show ? 'ON' : 'OFF'}]`)
}

async function updateConversationAttributes(conversationId: number, attributes: any) {
  try {
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
    console.error('Error updating attributes:', error)
  }
}

async function updateConversationStatus(conversationId: number, status: string) {
  try {
    await fetch(
      `${CHATWOOT_BASE_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/conversations/${conversationId}`,
      {
        method: 'PATCH',
        headers: {
          'Api-Access-Token': CHATWOOT_API_TOKEN!,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      }
    )
  } catch (error) {
    console.error('Error updating status:', error)
  }
}

async function addInternalNote(conversationId: number, note: string) {
  try {
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
          private: true // Internal note
        })
      }
    )
  } catch (error) {
    console.error('Error adding internal note:', error)
  }
}

function calculateNaturalTypingTime(message: string): number {
  // Simulate human typing speed (40-60 WPM)
  const words = message.split(' ').length
  const baseTime = (words / 50) * 60 * 1000 // 50 WPM average

  // Add variation
  const variation = baseTime * 0.2
  const typingTime = baseTime + (Math.random() * variation * 2 - variation)

  // Cap between 1-5 seconds
  return Math.min(Math.max(typingTime, 1000), 5000)
}