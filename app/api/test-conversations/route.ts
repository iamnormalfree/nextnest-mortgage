import { NextRequest, NextResponse } from 'next/server'

/**
 * Conversation Monitoring API
 * GET without params: Returns last 20 conversations sorted by recent activity
 * GET with ?id=X: Returns full conversation details + messages
 */

const CHATWOOT_BASE_URL = process.env.CHATWOOT_BASE_URL || 'https://chat.nextnest.sg'
const CHATWOOT_API_TOKEN = process.env.CHATWOOT_API_TOKEN || ''
const CHATWOOT_ACCOUNT_ID = process.env.CHATWOOT_ACCOUNT_ID || '1'

export async function GET(request: NextRequest) {
  try {
    if (!CHATWOOT_API_TOKEN) {
      return NextResponse.json(
        { success: false, error: 'Chatwoot API token not configured' },
        { status: 500 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const conversationId = searchParams.get('id')

    // If specific conversation requested, return full details + messages
    if (conversationId) {
      const [conversationRes, messagesRes] = await Promise.all([
        fetch(`${CHATWOOT_BASE_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/conversations/${conversationId}`, {
          headers: {
            'Api-Access-Token': CHATWOOT_API_TOKEN,
            'Content-Type': 'application/json'
          }
        }),
        fetch(`${CHATWOOT_BASE_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/conversations/${conversationId}/messages`, {
          headers: {
            'Api-Access-Token': CHATWOOT_API_TOKEN,
            'Content-Type': 'application/json'
          }
        })
      ])

      if (!conversationRes.ok || !messagesRes.ok) {
        const error = `Failed to fetch conversation: ${conversationRes.status} / ${messagesRes.status}`
        return NextResponse.json({ success: false, error }, { status: conversationRes.status })
      }

      const conversation = await conversationRes.json()
      const messagesData = await messagesRes.json()
      const messages = messagesData.payload || messagesData

      const customAttrs = conversation.custom_attributes || {}
      const contact = conversation.meta?.sender || {}

      // Format detailed conversation data
      const formattedConversation = {
        id: conversation.id,
        status: conversation.status,
        contactName: contact.name || customAttrs.name || 'Unknown',
        contactEmail: contact.email || customAttrs.email || '',
        contactPhone: contact.phone_number || customAttrs.phone || '',
        brokerName: customAttrs.ai_broker_name || customAttrs.broker_name || 'Unassigned',
        brokerId: customAttrs.ai_broker_id || customAttrs.broker_id || null,
        messageCount: messages.length,
        leadScore: customAttrs.lead_score || null,
        createdAt: conversation.created_at,
        lastActivityAt: conversation.last_activity_at,
        inboxId: conversation.inbox_id,
        customAttributes: customAttrs,
        messages: messages.map((msg: any) => ({
          id: msg.id,
          content: msg.content,
          messageType: msg.message_type,
          createdAt: msg.created_at,
          sender: {
            type: msg.sender?.type || 'unknown',
            name: msg.sender?.name || 'Unknown',
            email: msg.sender?.email || ''
          },
          private: msg.private || false,
          contentType: msg.content_type || 'text'
        }))
      }

      return NextResponse.json({
        success: true,
        conversation: formattedConversation
      })
    }

    // Otherwise fetch recent conversations (last 20)
    const response = await fetch(
      `${CHATWOOT_BASE_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/conversations?status=all`,
      {
        headers: {
          'Api-Access-Token': CHATWOOT_API_TOKEN,
          'Content-Type': 'application/json'
        }
      }
    )

    if (!response.ok) {
      const error = `Failed to fetch conversations: ${response.status}`
      return NextResponse.json({ success: false, error }, { status: response.status })
    }

    const data = await response.json()
    const conversations = data.payload || data.data?.payload || []

    // Sort by most recent activity
    const sorted = conversations.sort((a: any, b: any) => {
      const aTime = a.last_activity_at || a.created_at || 0
      const bTime = b.last_activity_at || b.created_at || 0
      return bTime - aTime
    })

    // Format conversation list data
    const formattedConversations = sorted.slice(0, 20).map((conv: any) => {
      const customAttrs = conv.custom_attributes || {}
      const contact = conv.meta?.sender || {}
      const lastMessage = conv.messages?.[conv.messages.length - 1]

      return {
        id: conv.id,
        status: conv.status,
        contactName: contact.name || customAttrs.name || 'Unknown',
        contactEmail: contact.email || customAttrs.email || '',
        brokerName: customAttrs.ai_broker_name || customAttrs.broker_name || 'Unassigned',
        brokerId: customAttrs.ai_broker_id || customAttrs.broker_id || null,
        messageCount: conv.messages?.length || 0,
        lastMessageAt: conv.last_activity_at || conv.created_at,
        lastMessageContent: lastMessage?.content?.substring(0, 100) || '',
        leadScore: customAttrs.lead_score || null,
        createdAt: conv.created_at
      }
    })

    return NextResponse.json({
      success: true,
      conversations: formattedConversations,
      total: formattedConversations.length
    })

  } catch (error) {
    console.error('Error fetching conversations:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
