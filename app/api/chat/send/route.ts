import { NextRequest, NextResponse } from 'next/server'

// POST /api/chat/send - Send a message to a conversation
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

    // Convert message_type string to number for Chatwoot API
    // Chatwoot expects: 0 = incoming (from user), 1 = outgoing (from bot), 2 = activity
    const numericMessageType = message_type === 'incoming' ? 0 :
                               message_type === 'outgoing' ? 1 :
                               typeof message_type === 'number' ? message_type : 0

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

    // Send message to Chatwoot
    const url = `${CHATWOOT_BASE_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/conversations/${conversation_id}/messages`
    
    console.log('📤 DEBUG: Sending message to Chatwoot:', {
      url,
      conversation_id,
      message_type: numericMessageType,
      originalMessageType: message_type,
      messageLength: message.length,
      messagePreview: message.substring(0, 50)
    })

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Api-Access-Token': CHATWOOT_API_TOKEN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: message,
        message_type: numericMessageType,
        private: false
      })
    })
    
    console.log('📥 DEBUG: Chatwoot response:', {
      status: response.status,
      ok: response.ok,
      statusText: response.statusText
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Chatwoot API error:', response.status, errorText)
      return NextResponse.json(
        { error: 'Failed to send message' },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    // Format the response
    const formattedMessage = {
      id: data.id,
      content: data.content,
      message_type: data.message_type,
      created_at: data.created_at,
      private: data.private || false,
      sender: data.sender ? {
        name: data.sender.name || 'You',
        avatar_url: data.sender.avatar_url,
        type: data.sender.type || 'contact'
      } : null
    }

    return NextResponse.json({
      success: true,
      message: formattedMessage
    })
    
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}