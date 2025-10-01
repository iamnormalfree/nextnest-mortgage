/**
 * Enhanced Chatwoot Webhook - Natural Human-like Conversation
 * Fixes timing issues and removes system messages
 */

import { NextRequest, NextResponse } from 'next/server'
import { AI_BROKERS } from '@/lib/ai/natural-conversation-flow'

const CHATWOOT_BASE_URL = process.env.CHATWOOT_BASE_URL || 'https://chat.nextnest.sg'
const CHATWOOT_API_TOKEN = process.env.CHATWOOT_API_TOKEN
const CHATWOOT_ACCOUNT_ID = process.env.CHATWOOT_ACCOUNT_ID || '1'

// Track conversation states to prevent duplicate messages
const conversationStates = new Map<number, {
  brokerAssigned: boolean
  lastMessageId: number
  isTyping: boolean
  formSubmitted: boolean
}>()

export async function POST(request: NextRequest) {
  try {
    const event = await request.json()

    console.log('🎭 Enhanced Flow:', {
      event: event.event,
      conversationId: event.conversation?.id,
      messageType: event.message?.message_type,
      messageId: event.message?.id,
      content: event.message?.content?.substring(0, 50)
    })

    const conversationId = event.conversation?.id
    if (!conversationId) return NextResponse.json({ skipped: true })

    // Get or create conversation state
    let state = conversationStates.get(conversationId)
    if (!state) {
      state = {
        brokerAssigned: false,
        lastMessageId: 0,
        isTyping: false,
        formSubmitted: false
      }
      conversationStates.set(conversationId, state)
    }

    // Handle different event types
    switch (event.event) {
      case 'conversation_created':
        await handleConversationCreated(event, state)
        break

      case 'message_created':
        await handleMessageCreated(event, state)
        break

      case 'conversation_status_changed':
        // Clean up state if conversation is resolved
        if (event.conversation?.status === 'resolved') {
          conversationStates.delete(conversationId)
        }
        break
    }

    return NextResponse.json({ handled: true })

  } catch (error) {
    console.error('❌ Enhanced flow error:', error)
    return NextResponse.json({ error: 'Failed to process' }, { status: 500 })
  }
}

/**
 * Handle new conversation - assign broker naturally
 */
async function handleConversationCreated(event: any, state: any) {
  const { conversation } = event
  const attributes = conversation.custom_attributes || {}

  // Skip if this is a form submission echo (already has lead data)
  if (attributes.lead_score && !state.brokerAssigned) {
    // Mark as form submitted to prevent duplicate messages
    state.formSubmitted = true

    // Select broker based on lead score
    const broker = selectBrokerForLead(attributes)

    // Wait naturally before broker joins (2-4 seconds)
    const joinDelay = broker.joinDelay || 2500
    await new Promise(resolve => setTimeout(resolve, joinDelay))

    // Send natural joining message
    await sendBrokerJoinedMessage(conversation.id, broker.name)

    // Mark broker as assigned
    state.brokerAssigned = true

    // Wait a bit more before greeting
    await new Promise(resolve => setTimeout(resolve, 1500))

    // Send personalized greeting
    const greeting = generatePersonalizedGreeting(attributes, broker)
    await sendBrokerMessage(conversation.id, greeting, broker)

    // Update conversation attributes
    await updateConversationAttributes(conversation.id, {
      ai_broker_assigned: true,
      ai_broker_name: broker.name,
      ai_broker_personality: broker.personality,
      conversation_stage: 'greeting'
    })
  }
}

/**
 * Handle incoming messages - respond naturally
 */
async function handleMessageCreated(event: any, state: any) {
  const { conversation, message } = event

  // Skip if we've already processed this message
  if (message.id <= state.lastMessageId) {
    return
  }
  state.lastMessageId = message.id

  // Only respond to incoming customer messages
  if (message.message_type !== 'incoming' ||
      message.private ||
      message.sender?.type === 'agent') {
    return
  }

  // Skip form submission messages (they contain bullet points)
  if (message.content?.includes('• Loan Type:') ||
      message.content?.includes('📝 Form Submission:')) {
    return
  }

  // Skip system messages
  if (message.content?.includes('added AI-Broker') ||
      message.content?.includes('Conversation was reopened') ||
      message.content?.includes('added Property-') ||
      message.message_type === 'activity') {
    return
  }

  const attributes = conversation.custom_attributes || {}

  // Ensure broker is assigned
  if (!state.brokerAssigned && attributes.lead_score) {
    // Assign broker first
    await handleConversationCreated({ conversation }, state)
    // Wait before responding to the question
    await new Promise(resolve => setTimeout(resolve, 2000))
  }

  // Skip if no broker assigned yet
  if (!attributes.ai_broker_name) {
    return
  }

  const broker = AI_BROKERS[getBrokerSlug(attributes.ai_broker_name)] ||
                 AI_BROKERS['sarah-wong']

  // Start typing immediately (natural reaction time)
  state.isTyping = true
  // Note: Chatwoot doesn't have a public typing indicator API,
  // but we simulate the timing

  // Generate response
  const response = await generateBrokerResponse(message.content, attributes)

  // Calculate natural typing time based on response length
  const typingTime = calculateNaturalTypingTime(response, broker)

  // Wait for typing simulation (but at least 2 seconds, max 8 seconds)
  const waitTime = Math.min(Math.max(typingTime, 2000), 8000)
  await new Promise(resolve => setTimeout(resolve, waitTime))

  // Stop typing 1 second before sending
  state.isTyping = false
  await new Promise(resolve => setTimeout(resolve, 1000))

  // Send the response
  await sendBrokerMessage(conversation.id, response, broker)

  // Update conversation state
  await updateConversationAttributes(conversation.id, {
    message_count: (attributes.message_count || 0) + 1,
    last_interaction: new Date().toISOString()
  })
}

/**
 * Select appropriate broker based on lead profile
 */
function selectBrokerForLead(attributes: any) {
  const leadScore = attributes.lead_score || 50

  if (leadScore >= 80) {
    // High-value: Michelle or Jasmine
    const brokers = ['michelle-chen', 'jasmine-lee']
    const selected = brokers[Math.floor(Math.random() * brokers.length)]
    return AI_BROKERS[selected]
  }

  if (leadScore >= 60) {
    // Medium: Sarah or Rachel
    const brokers = ['sarah-wong', 'rachel-tan']
    const selected = brokers[Math.floor(Math.random() * brokers.length)]
    return AI_BROKERS[selected]
  }

  // Conservative: Grace
  return AI_BROKERS['grace-lim']
}

/**
 * Generate personalized greeting
 */
function generatePersonalizedGreeting(attributes: any, broker: any): string {
  const name = attributes.name || 'there'
  const propertyType = attributes.property_category || 'property'
  const loanType = attributes.loan_type || 'mortgage'
  const income = attributes.monthly_income || 5000
  const leadScore = attributes.lead_score || 50

  const timeOfDay = getTimeOfDay()

  // Personality-specific greetings
  if (broker.personality === 'aggressive') {
    if (broker.name === 'Michelle Chen') {
      return `${timeOfDay} ${name}! I'm Michelle Chen. I just reviewed your profile and you're in an excellent position! With your score of ${leadScore}/100 and current market conditions, we have a unique opportunity. I have exclusive access to rates that aren't publicly available. Let me show you how we can save you thousands on your ${propertyType} purchase.`
    } else {
      // Jasmine Lee
      return `${name}, I'm Jasmine Lee. Your timing is perfect! I specialize in premium ${propertyType} mortgages and with your income of S$${income}, you qualify for our platinum tier rates. These exclusive rates are only available for the next 48 hours. Shall we secure them for you?`
    }
  }

  if (broker.personality === 'balanced') {
    if (broker.name === 'Sarah Wong') {
      return `${timeOfDay} ${name}, I'm Sarah Wong. Thank you for reaching out about your ${loanType} needs. I've been helping families secure their homes for over 10 years, and I'm here to guide you through your options. Based on your profile, you have several strong paths forward. What's most important to you in choosing a mortgage?`
    } else {
      // Rachel Tan
      return `Hey ${name}! I'm Rachel Tan, your mortgage specialist. Exciting that you're looking at ${propertyType}! I'll use all the latest tools to find you the best rates and make this process super smooth. With your income of S$${income}, you've got great options. What questions can I answer for you?`
    }
  }

  // Conservative (Grace Lim)
  return `${timeOfDay} ${name}, I'm Grace Lim. Welcome! I understand that exploring mortgage options can feel overwhelming, especially for ${propertyType} purchases. I've been helping families like yours for 15 years, and I'm here to guide you step by step, with no pressure at all. What would you like to know first?`
}

/**
 * Generate broker response to user message
 */
async function generateBrokerResponse(userMessage: string, attributes: any): Promise<string> {
  const brokerName = attributes.ai_broker_name || 'Sarah Wong'
  const broker = AI_BROKERS[getBrokerSlug(brokerName)] || AI_BROKERS['sarah-wong']
  const income = attributes.monthly_income || 5000
  const propertyType = attributes.property_category || 'property'

  const lower = userMessage.toLowerCase()

  // Response based on intent and personality
  if (lower.includes('rate') || lower.includes('interest')) {
    if (broker.personality === 'aggressive') {
      return `Great question! Right now I have access to exclusive rates starting from 3.65% for ${propertyType} - but these are only available today. With your income of S$${income}, your monthly payment would be around S$${Math.floor(income * 0.3)}. This rate expires in 48 hours. Should I lock it in for you now?`
    }
    if (broker.personality === 'conservative') {
      return `Of course! Let me explain the current rates clearly. For ${propertyType}, we're seeing 2-year fixed rates around 3.70-3.80%. These have been stable for a few weeks. Based on your income, you could comfortably manage payments of about S$${Math.floor(income * 0.3)} per month. Would you like me to break down how these rates work?`
    }
    // Balanced
    return `Current rates for ${propertyType} are quite favorable:\n\n• 2-year fixed: 3.70-3.80%\n• 3-year fixed: 3.60-3.70%\n• Your estimated payment: S$${Math.floor(income * 0.3)}/month\n\nThese rates are competitive right now. Would you like a detailed comparison of different bank packages?`
  }

  if (lower.includes('qualify') || lower.includes('afford')) {
    const maxLoan = Math.floor(income * 0.55 * 12 * 25 / 1000) * 1000
    if (broker.personality === 'aggressive') {
      return `You're in an EXCELLENT position! With S$${income} monthly income, you qualify for loans up to S$${maxLoan.toLocaleString()}. This puts premium properties within reach. I can get you pre-approved TODAY - shall we start immediately?`
    }
    if (broker.personality === 'conservative') {
      return `Let me help you understand what you can comfortably afford. With your income of S$${income}, banks would typically approve loans up to S$${maxLoan.toLocaleString()}. However, I always recommend staying within a comfortable range - perhaps 80% of that maximum. This ensures you have breathing room for life's other expenses. Would you like to explore properties in a specific price range?`
    }
    // Balanced
    return `Based on your S$${income} monthly income:\n\n• Maximum loan: S$${maxLoan.toLocaleString()}\n• Comfortable payment: S$${Math.floor(income * 0.3)}/month\n• Property budget: S$${Math.floor(maxLoan * 1.25).toLocaleString()}\n\nYou have good options available. Should we look at specific properties or focus on getting you pre-approved first?`
  }

  // General response
  if (broker.personality === 'aggressive') {
    return `I understand what you're asking. The key here is timing - the market is moving fast and your strong profile gives us leverage. What specific aspect would you like to focus on so we can move forward quickly?`
  }
  if (broker.personality === 'conservative') {
    return `That's a great question. Let me make sure I understand exactly what you need so I can give you the most helpful information. There's no rush - we can explore this at your pace.`
  }
  // Balanced
  return `I understand. Let me help you with that. Based on your profile and current market conditions, I can provide you with tailored options. What's your biggest priority right now?`
}

/**
 * Calculate natural typing time
 */
function calculateNaturalTypingTime(message: string, broker: any): number {
  // Base: 40-60 words per minute typing speed
  const words = message.split(' ').length
  const baseWPM = broker.personality === 'aggressive' ? 55 :
                  broker.personality === 'conservative' ? 45 : 50

  const baseTime = (words / baseWPM) * 60 * 1000

  // Add thinking time (1-2 seconds)
  const thinkingTime = 1000 + Math.random() * 1000

  // Add variation (±20%)
  const variation = baseTime * 0.2
  const typingTime = baseTime + thinkingTime + (Math.random() * variation * 2 - variation)

  return Math.floor(typingTime)
}

/**
 * Send broker joined message
 */
async function sendBrokerJoinedMessage(conversationId: number, brokerName: string) {
  // Instead of "Brent added AI-Broker", show natural joining
  const message = `${brokerName} joined the conversation`

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
          content: message,
          message_type: 'activity',
          private: false
        })
      }
    )
  } catch (error) {
    console.error('Error sending join message:', error)
  }
}

/**
 * Send broker message
 */
async function sendBrokerMessage(conversationId: number, message: string, broker: any) {
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
          content: message,
          message_type: 'outgoing',
          private: false
        })
      }
    )
  } catch (error) {
    console.error('Error sending message:', error)
  }
}

/**
 * Update conversation custom attributes
 */
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

// Helper functions
function getTimeOfDay(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function getBrokerSlug(name: string): string {
  return name.toLowerCase().replace(' ', '-')
}