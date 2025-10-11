import { NextRequest, NextResponse } from 'next/server'
import { trackBotMessage } from '@/lib/utils/message-tracking'

/**
 * Track Bot Message Endpoint
 * Called by n8n AFTER successfully sending a message to Chatwoot
 * Ensures the message is tracked for echo detection to prevent loops
 */
export async function POST(request: NextRequest) {
  try {
    const { conversationId, content, messageId } = await request.json()

    console.log('📝 Tracking bot message from n8n:', {
      conversationId,
      messageId,
      contentLength: content?.length
    })

    if (!conversationId || !content || !messageId) {
      console.error('❌ Missing required fields for message tracking')
      return NextResponse.json(
        {
          error: 'Missing required fields: conversationId, content, messageId',
          received: {
            conversationId: !!conversationId,
            content: !!content,
            messageId: !!messageId
          }
        },
        { status: 400 }
      )
    }

    // Track the bot message for echo detection
    trackBotMessage(conversationId, content, messageId)

    console.log('✅ n8n message tracked successfully:', {
      conversationId,
      messageId,
      contentPreview: content.substring(0, 50) + '...'
    })

    return NextResponse.json({
      success: true,
      tracked: true,
      conversationId,
      messageId,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ Error tracking n8n message:', error)
    return NextResponse.json(
      {
        error: 'Failed to track message',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
