import { NextRequest, NextResponse } from 'next/server'
import { getBrokerForConversation } from '@/lib/ai/broker-assignment'

// Force dynamic rendering - this route needs runtime environment variables
export const dynamic = 'force-dynamic'

// Test endpoint that simulates AI broker responses locally
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { conversation_id, message, message_type = 'incoming' } = body
    
    if (!conversation_id || !message) {
      return NextResponse.json(
        { error: 'conversation_id and message are required' },
        { status: 400 }
      )
    }

    // Get broker for this conversation
    const broker = await getBrokerForConversation(conversation_id)
    const brokerName = broker?.name || 'AI Assistant'
    const personality = broker?.personality_type || 'balanced'

    // Simulate AI response based on broker personality
    let response = ''
    
    // Generate response based on personality
    if (personality === 'aggressive') {
      response = generateAggressiveResponse(message, brokerName)
    } else if (personality === 'conservative') {
      response = generateConservativeResponse(message, brokerName)
    } else {
      response = generateBalancedResponse(message, brokerName)
    }

    // Simulate some processing delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Return the simulated message
    const aiMessage = {
      id: Date.now(),
      content: response,
      message_type: 'incoming',
      created_at: new Date().toISOString(),
      private: false,
      sender: {
        name: brokerName,
        type: 'agent'
      }
    }

    return NextResponse.json({
      success: true,
      message: aiMessage,
      isSimulated: true // Flag to indicate this is a test response
    })
    
  } catch (error) {
    console.error('Error in test chat:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function generateAggressiveResponse(userMessage: string, brokerName: string): string {
  const lowerMessage = userMessage.toLowerCase()
  
  if (lowerMessage.includes('rate') || lowerMessage.includes('interest')) {
    return `${brokerName} here! 🔥 Rates are at their LOWEST point this month - 2.6% for HDB! But here's the thing - banks are already hinting at increases next quarter. We need to lock this in TODAY. I can get you pre-approved in 2 hours. Ready to move?`
  }
  
  if (lowerMessage.includes('afford') || lowerMessage.includes('budget')) {
    return `Let's cut to the chase - with your income, you're looking at up to $850K loan quantum. That's SERIOUS buying power! 💪 Most clients in your position are grabbing properties NOW before prices climb further. Want me to shortlist the best deals in your range? I can have options to you in 30 minutes.`
  }
  
  if (lowerMessage.includes('think') || lowerMessage.includes('consider')) {
    return `I get it, but let me be real with you - every day you wait costs money. Property prices went up 0.8% just last month! 📈 My clients who acted fast are already seeing appreciation. Don't be the one who says "I should have bought earlier." Let's at least get your pre-approval sorted - no obligation, but you'll be ready to STRIKE when you see the right unit!`
  }
  
  // Default aggressive response
  return `${brokerName} here! That's a great question! 🚀 Here's what I'm seeing in the market RIGHT NOW - opportunities are moving FAST. My last 3 clients who waited lost out on their preferred units. I don't want that happening to you! Let's jump on a quick call - 15 minutes and I'll show you exactly how to win in this market. When can we connect?`
}

function generateConservativeResponse(userMessage: string, brokerName: string): string {
  const lowerMessage = userMessage.toLowerCase()
  
  if (lowerMessage.includes('rate') || lowerMessage.includes('interest')) {
    return `Hello dear, ${brokerName} here. 😊 Current rates are around 2.6-3.8%, depending on your profile and loan type lah. No rush to decide - take your time to compare different banks. I can prepare a detailed comparison for you to review slowly at home. Would you like that?`
  }
  
  if (lowerMessage.includes('afford') || lowerMessage.includes('budget')) {
    return `Auntie ${brokerName} here to help! Based on what you shared, we should be conservative with the calculations. Always better to be safe, right? 🏠 I suggest keeping monthly payments below 30% of income. We can look at different options - no pressure at all. Shall I prepare some scenarios for you to think about?`
  }
  
  if (lowerMessage.includes('think') || lowerMessage.includes('consider')) {
    return `Very wise to think carefully! This is a big decision, not something to rush into. 💭 Take all the time you need lah. I'm here whenever you have questions. Maybe discuss with family first? I can prepare some materials for you to share with them if you'd like.`
  }
  
  // Default conservative response
  return `${brokerName} here, dear. That's a very good point you're raising. 😊 In my 20 years experience, I always tell clients - no need to rush. Better to understand everything clearly first. Would you like me to explain more details? I can go through slowly, make sure you're comfortable with everything.`
}

function generateBalancedResponse(userMessage: string, brokerName: string): string {
  const lowerMessage = userMessage.toLowerCase()
  
  if (lowerMessage.includes('rate') || lowerMessage.includes('interest')) {
    return `Hi! ${brokerName} here. Current rates range from 2.6-3.8% depending on your profile. 📊 While rates are relatively favorable now, it's worth noting market trends. I can help you compare options from multiple banks to find the best fit for your situation. Would you like to see a personalized rate comparison?`
  }
  
  if (lowerMessage.includes('afford') || lowerMessage.includes('budget')) {
    return `Great question! Based on your income and current market conditions, you have several good options. 🏡 I typically recommend keeping monthly payments comfortable - around 25-30% of income. This gives you flexibility while building equity. Shall we explore what's available in your comfortable range?`
  }
  
  if (lowerMessage.includes('think') || lowerMessage.includes('consider')) {
    return `That's perfectly reasonable - it's important to make an informed decision. 🤔 While you're considering, I can provide you with market insights and answer any questions. The market is dynamic, so staying informed helps. What specific information would be most helpful for your decision?`
  }
  
  // Default balanced response
  return `Hi there! ${brokerName} here. Thanks for your message. 👋 I'm here to help you navigate your mortgage journey at your pace. Whether you're just exploring or ready to move forward, I can provide the insights you need. What aspect of the mortgage process would you like to discuss?`
}