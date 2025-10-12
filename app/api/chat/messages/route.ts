import { NextRequest, NextResponse } from 'next/server'

// Force dynamic rendering - needs runtime environment variables for Chatwoot API
export const dynamic = 'force-dynamic'

// GET /api/chat/messages - Fetch messages for a conversation
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const conversationId = searchParams.get('conversation_id')
    const afterId = searchParams.get('after_id')
    
    if (!conversationId) {
      return NextResponse.json(
        { error: 'conversation_id is required' },
        { status: 400 }
      )
    }

    // Chatwoot API configuration
    const CHATWOOT_BASE_URL = process.env.CHATWOOT_BASE_URL || 'https://chat.nextnest.sg'
    const CHATWOOT_API_TOKEN = process.env.CHATWOOT_API_TOKEN
    const CHATWOOT_ACCOUNT_ID = process.env.CHATWOOT_ACCOUNT_ID || '1'

    if (!CHATWOOT_API_TOKEN) {
      console.error('CHATWOOT_API_TOKEN not configured')
      return NextResponse.json(
        { error: 'Chat service not configured' },
        { status: 500 }
      )
    }

    // Fetch messages from Chatwoot
    const messagesUrl = `${CHATWOOT_BASE_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/conversations/${conversationId}/messages`

    const messagesResponse = await fetch(messagesUrl, {
      method: 'GET',
      headers: {
        'Api-Access-Token': CHATWOOT_API_TOKEN,
        'Content-Type': 'application/json'
      }
    })

    if (!messagesResponse.ok) {
      const errorText = await messagesResponse.text()
      console.error('Chatwoot API error:', messagesResponse.status, errorText)
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: messagesResponse.status }
      )
    }

    const messagesData = await messagesResponse.json()

    // Also fetch conversation details to get custom attributes
    const conversationUrl = `${CHATWOOT_BASE_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/conversations/${conversationId}`
    let conversationData = null

    try {
      const conversationResponse = await fetch(conversationUrl, {
        method: 'GET',
        headers: {
          'Api-Access-Token': CHATWOOT_API_TOKEN,
          'Content-Type': 'application/json'
        }
      })

      if (conversationResponse.ok) {
        conversationData = await conversationResponse.json()
      }
    } catch (error) {
      console.error('Error fetching conversation details:', error)
    }

    // Filter messages if afterId is provided (for polling new messages)
    let messages = messagesData.payload || messagesData || []
    
    if (afterId) {
      const afterIdNum = parseInt(afterId)
      messages = messages.filter((msg: any) => msg.id > afterIdNum)
    }
    
    // Sort messages by created_at (oldest first)
    messages.sort((a: any, b: any) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )

    // DEDUPLICATION: Remove duplicate queue messages
    // Issue: Chatwoot emits queue activity twice - once as system message, once as incoming user message
    const queueMessagePatterns = [
      'All AI specialists are helping other homeowners',
      'All AI specialists are helping',
      'We\'ll connect you as soon as one is free'
    ]

    const seenQueueMessages = new Set<string>()
    messages = messages.filter((msg: any) => {
      const content = msg.content || ''

      // Check if this is a queue message
      const isQueueMessage = queueMessagePatterns.some(pattern => content.includes(pattern))

      if (isQueueMessage) {
        // Keep only the first occurrence (system message with message_type: 2)
        if (seenQueueMessages.has(content)) {
          console.log('🗑️ Filtered duplicate queue message:', {
            id: msg.id,
            message_type: msg.message_type,
            sender_type: msg.sender?.type,
            content: content.substring(0, 50)
          })
          return false // Filter out duplicate
        }
        seenQueueMessages.add(content)
      }

      return true // Keep message
    })

    // Format messages for the frontend with normalized roles
    const formattedMessages = messages.map((msg: any) => {
      // Derive role from message_type, sender.type, and private flag
      let role: 'user' | 'agent' | 'system' = 'agent'

      // Map message_type to role (message_type: 0=incoming, 1=outgoing, 2=activity)
      // CRITICAL: Check message_type FIRST before sender.type to handle edge cases correctly
      if (msg.message_type === 2 || msg.message_type === 'activity') {
        role = 'system'
      } else if (msg.message_type === 1 || msg.message_type === 'outgoing') {
        role = 'agent'
      } else if (msg.message_type === 0 || msg.message_type === 'incoming') {
        role = 'user'
      } else if (msg.sender?.type === 'system') {
        role = 'system'
      } else if (msg.sender?.type === 'agent' || msg.sender?.type === 'bot') {
        role = 'agent'
      } else if (msg.sender?.type === 'contact') {
        role = 'user'
      }

      // Private messages remain as agent role but keep the private flag
      if (msg.private) {
        role = 'agent'
      }

      return {
        id: msg.id,
        content: msg.content,
        role,
        message_type: msg.message_type,
        created_at: msg.created_at,
        private: msg.private || false,
        sender: msg.sender ? {
          name: msg.sender.name || 'Agent',
          avatar_url: msg.sender.avatar_url,
          type: msg.sender.type || 'agent'
        } : null,
        original: msg // Keep raw Chatwoot payload for debugging
      }
    })

    return NextResponse.json({
      success: true,
      messages: formattedMessages,
      conversation_id: conversationId,
      conversation: conversationData ? {
        id: conversationData.id,
        custom_attributes: conversationData.custom_attributes || {}
      } : null
    })
    
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}