'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Send, User, Bot, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Message {
  id: number
  content: string
  role?: 'user' | 'agent' | 'system'  // New role field
  message_type: 'incoming' | 'outgoing' | 'activity'  // Keep for backward compatibility
  created_at: string
  sender?: {
    name: string
    avatar_url?: string
    type: 'contact' | 'agent' | 'bot'
  }
  private: boolean
  original?: any  // Raw Chatwoot payload for debugging
}

interface CustomChatInterfaceProps {
  conversationId: number
  contactName?: string
  contactEmail?: string
  brokerName?: string
  prefillMessage?: string
}

export default function CustomChatInterface({ 
  conversationId, 
  contactName = 'You',
  contactEmail,
  brokerName = 'Agent',
  prefillMessage
}: CustomChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAgentTyping, setIsAgentTyping] = useState(false)
  const [typingMessage, setTypingMessage] = useState(`${brokerName} is typing...`)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastMessageIdRef = useRef<number>(0)
  const isInitializingRef = useRef<boolean>(false)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const hiddenActivityPatterns = [
    /conversation was reopened/i,
    /added property/i
  ]

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Simulate realistic typing behavior
  const simulateTyping = () => {
    setIsAgentTyping(true)
    
    const typingStates = [
      { message: `${brokerName} is typing...`, duration: 1500 },
      { message: 'Analyzing your request...', duration: 1800 },
      { message: 'Preparing response...', duration: 1200 }
    ]
    
    let currentState = 0
    const nextState = () => {
      if (currentState < typingStates.length) {
        setTypingMessage(typingStates[currentState].message)
        typingTimeoutRef.current = setTimeout(() => {
          currentState++
          nextState()
        }, typingStates[currentState].duration)
        currentState++
      } else {
        // Stop typing indicator after total delay (4.5 seconds)
        setIsAgentTyping(false)
        setTypingMessage(`${brokerName} is typing...`)
      }
    }
    
    nextState()
  }

  // Clear typing simulation
  const clearTyping = () => {
    setIsAgentTyping(false)
    setTypingMessage(`${brokerName} is typing...`)
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = null
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isAgentTyping])

  // Apply external prefill for the composer (e.g., from SuggestionChips)
  useEffect(() => {
    if (typeof prefillMessage === 'string') {
      setInputMessage(prefillMessage)
    }
  }, [prefillMessage])

  // Fetch messages for the conversation
  const fetchMessages = async () => {
    try {
      // Prevent concurrent initialization
      if (isInitializingRef.current) {
        console.log('🔄 Fetch already in progress, skipping...')
        return
      }

      isInitializingRef.current = true
      const response = await fetch(`/api/chat/messages?conversation_id=${conversationId}`)
      
      if (!response.ok) {
        console.error('Failed to fetch messages:', response.status)
        throw new Error('Failed to fetch messages')
      }

      const data = await response.json()
      console.log('Fetched messages:', data.messages?.length || 0, 'messages')

      // Add detailed logging
      if (data.messages && data.messages.length > 0) {
        console.log('📥 Message details:', data.messages.map((m: any) => ({
          id: m.id,
          type: m.message_type,
          sender: m.sender?.type,
          content: m.content?.substring(0, 40) + '...',
          private: m.private
        })))

        // Debug specific broker/system messages only once on fetch
        const brokerMessages = data.messages.filter((m: any) =>
          m.content?.includes('reviewing your details') ||
          m.content?.includes('joined the conversation') ||
          m.content?.includes('All AI specialists')
        )

        if (brokerMessages.length > 0) {
          console.log('🔍 Broker/System messages found:', brokerMessages.map((m: any) => ({
            id: m.id,
            messageType: m.message_type,
            senderType: m.sender?.type,
            content: m.content?.substring(0, 50)
          })))
        }
      }

      if (data.messages && Array.isArray(data.messages)) {
        setMessages(data.messages)

        // Reset lastMessageIdRef if we get messages
        if (data.messages.length > 0) {
          const ids = data.messages.map((m: any) => m.id)
          const maxId = Math.max(...ids)
          lastMessageIdRef.current = maxId
          console.log('📌 Updated lastMessageIdRef to:', maxId)
        }
      }
    } catch (err) {
      console.error('Error fetching messages:', err)
      setError('Failed to load messages')
    } finally {
      setIsLoading(false)
      isInitializingRef.current = false
    }
  }

  // Poll for new messages
  const pollNewMessages = async () => {
    try {
      // If we don't have a baseline and we're not already initializing, fetch all messages
      if (lastMessageIdRef.current === 0 && !isInitializingRef.current) {
        await fetchMessages()
        return
      }

      const response = await fetch(
        `/api/chat/messages?conversation_id=${conversationId}&after_id=${lastMessageIdRef.current}`
      )

      if (!response.ok) return

      const data = await response.json()

      if (data.messages && data.messages.length > 0) {
        setMessages(prev => {
          const existingIds = new Set(prev.map(m => m.id))
          const newMessages = data.messages.filter((m: Message) => !existingIds.has(m.id))

          if (newMessages.length > 0) {
            console.log('📨 New messages received:', newMessages.length)
            // Update lastMessageIdRef to the highest ID
            const allIds = [...prev.map(m => m.id), ...newMessages.map((m: any) => m.id)]
            const maxId = Math.max(...allIds)
            lastMessageIdRef.current = maxId
            clearTyping()
            return [...prev, ...newMessages]
          }
          return prev
        })
      } else {
        console.log('🔄 No new messages, last ID:', lastMessageIdRef.current)
      }
    } catch (err) {
      console.error('Error polling messages:', err)
    }
  }

  // Send a message
  const sendMessage = async () => {
    if (!inputMessage.trim() || isSending) return

    const messageText = inputMessage.trim()
    setInputMessage('')
    setIsSending(true)
    setError(null)

    // Optimistically add the message to the UI
    const tempMessage: Message = {
      id: Date.now(),
      content: messageText,
      role: 'user',  // Set role for optimistic message
      message_type: 'incoming',  // Fix: should be 'incoming' for user messages
      created_at: new Date().toISOString(),
      sender: {
        name: contactName,
        type: 'contact'
      },
      private: false
    }
    
    setMessages(prev => [...prev, tempMessage])

    try {
      // Use the real Chatwoot API endpoint for actual AI responses
      console.log('Sending message to Chatwoot...')
      let response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversation_id: conversationId,
          message: messageText,
          message_type: 'incoming' // Important: incoming triggers the webhook for AI response
        })
      })

      // Fallback to test endpoint only if Chatwoot fails
      if (!response.ok) {
        console.log('Chatwoot failed, falling back to test endpoint...')
        response = await fetch('/api/chat/send-test', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            conversation_id: conversationId,
            message: messageText,
            message_type: 'outgoing'
          })
        })
      }

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const data = await response.json()
      console.log('Message sent, response:', data)
      
      // Handle the response based on whether it's simulated
      if (data.isSimulated) {
        console.log('Adding simulated AI response')
        // For simulated responses, keep the user message and add AI response
        setMessages(prev => [...prev, data.message])
        lastMessageIdRef.current = data.message.id
      } else {
        console.log('Message sent to Chatwoot, waiting for AI response...')
        // For real Chatwoot, the AI response will come through polling
        // Keep the temp message and update its ID if Chatwoot provides one
        if (data.message?.id) {
          lastMessageIdRef.current = data.message.id
          // Update the temporary message with the real ID from Chatwoot
          setMessages(prev => prev.map(m => 
            m.id === tempMessage.id 
              ? { ...m, id: data.message.id, created_at: data.message.created_at || m.created_at }
              : m
          ))
        }
        // Start typing indicator simulation for n8n workflow processing
        simulateTyping()
        // Don't remove the temp message - keep it visible
      }
    } catch (err) {
      console.error('Error sending message:', err)
      setError('Failed to send message')
      
      // Remove the optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== tempMessage.id))
      setInputMessage(messageText) // Restore the message text
    } finally {
      setIsSending(false)
    }
  }

  // Initialize chat
  useEffect(() => {
    setIsLoading(true)
    fetchMessages()

    // Set up polling for new messages every 3 seconds
    pollIntervalRef.current = setInterval(pollNewMessages, 3000)

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
      // Clean up typing timeout on unmount
      clearTyping()
    }
    // Intentionally only re-run when conversationId changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId])

  // Format timestamp
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    })
  }

  // Determine message role (with robust type normalization and fallbacks)
  const getMessageRole = (message: Message): 'user' | 'agent' | 'system' => {
    // Use role if available
    if (message.role) {
      return message.role
    }

    // Priority 0: Check for activity message patterns (before message_type)
    const activityPatterns = [
      /is reviewing your details/i,
      /joined the conversation/i,
      /All AI specialists/i
    ]
    if (message.content && activityPatterns.some(pattern => pattern.test(message.content))) {
      return 'system'
    }

    // Normalize message_type to handle both string and numeric values
    const messageType = message.message_type
    const normalizedType = typeof messageType === 'number' ? messageType :
                          messageType === 'incoming' ? 0 :
                          messageType === 'outgoing' ? 1 :
                          messageType === 'activity' ? 2 : null

    // Guard against undefined sender
    const senderType = message.sender?.type

    // Priority 1: Check normalized message_type first (most reliable)
    if (normalizedType !== null) {
      // 2 or 'activity' = system message
      if (normalizedType === 2) {
        return 'system'
      }
      // 1 or 'outgoing' = agent message (from bot/agent)
      if (normalizedType === 1) {
        return 'agent'
      }
      // 0 or 'incoming' = user message ONLY if sender is contact
      if (normalizedType === 0) {
        // Check if it's actually from a contact or if it's a system message
        if (senderType === 'contact') {
          // Additional check: If message content is very long (>200 chars),
          // it's likely a bot response being echoed, not a user message
          if (message.content && message.content.length > 200) {
            return 'agent'  // Treat long echoes as agent messages
          }
          return 'user'
        }
        // If incoming but not from contact, it's likely a system message
        return 'system'
      }
    }

    // Priority 2: Fall back to sender type if message_type is not recognized
    // Note: 'system' is not a valid sender type, only 'contact', 'agent', 'bot'
    if (senderType === 'contact') {
      return 'user'
    }
    if (senderType === 'agent' || senderType === 'bot') {
      return 'agent'
    }

    // Default fallback
    return 'agent'
  }

  return (
    <div className="flex flex-col h-full w-full">

      {/* Messages Area - 75% of height */}
      <div data-testid="messages-container" className="overflow-y-auto px-4 py-3 space-y-2 bg-white" style={{ height: '75%' }}>
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-16 h-1 bg-fog overflow-hidden">
              <div className="h-full bg-gold transition-all duration-200" style={{ width: '60%' }}/>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-graphite mt-8">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => {
            // Hide private messages
            if (message.private) {
              return null
            }

            const messageRole = getMessageRole(message)

            // Handle system messages
            if (messageRole === 'system') {
              // Filter out boilerplate system messages
              const shouldHide = hiddenActivityPatterns.some(pattern => pattern.test(message.content || ''))
              if (shouldHide) {
                return null
              }

              // Render system messages as plain centered text (no box)
              return (
                <div
                  key={message.id}
                  className="flex justify-center my-2"
                >
                  <p className="max-w-[80%] text-graphite text-xs text-center italic">
                    {message.content}
                  </p>
                </div>
              )
            }

            const isUser = messageRole === 'user'

            return (
              <div
                key={message.id}
                data-testid="message-item"
                className={cn(
                  'flex gap-3',
                  isUser ? 'justify-end' : 'justify-start'
                )}
              >
                {!isUser && (
                  <div className="flex-shrink-0">
                    <div className="w-6 h-6 bg-mist border border-fog flex items-center justify-center">
                      <Bot className="w-3 h-3 text-graphite" />
                    </div>
                  </div>
                )}

                <div
                  className={cn(
                    'max-w-[70%] px-3 py-2',
                    isUser
                      ? 'bg-ink text-white'
                      : 'bg-mist text-ink'
                  )}
                >
                  <p className="text-xs whitespace-pre-wrap break-words">
                    {message.content}
                  </p>
                  {message.created_at && (
                    <p
                      className={cn(
                        'text-[10px] mt-1',
                        isUser ? 'text-silver opacity-80' : 'text-silver'
                      )}
                    >
                      {formatTime(message.created_at)}
                    </p>
                  )}
                </div>

                {isUser && (
                  <div className="flex-shrink-0">
                    <div className="w-6 h-6 bg-ink flex items-center justify-center">
                      <User className="w-3 h-3 text-white" />
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
        
        {isSending && (
          <div className="flex justify-end">
            <div className="bg-gold/10 px-4 py-2 border border-gold/30">
              {/* Simple progress bar instead of spinner */}
              <div className="w-12 h-1 bg-fog overflow-hidden">
                <div className="h-full bg-gold transition-all duration-200" style={{ width: '60%' }}/>
              </div>
            </div>
          </div>
        )}
        
        {isAgentTyping && (
          <div data-testid="typing-indicator" className="flex gap-3 justify-start">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-mist border border-fog flex items-center justify-center">
                <Bot className="w-4 h-4 text-graphite" />
              </div>
            </div>
            <div className="max-w-[70%] px-4 py-2 bg-mist">
              <div className="flex items-center gap-2">
                <div className="flex space-x-1">
                  {/* Non-bouncing dots with opacity transition */}
                  <div className="w-2 h-2 bg-gold opacity-30 transition-opacity duration-200"></div>
                  <div className="w-2 h-2 bg-gold opacity-60 transition-opacity duration-200"></div>
                  <div className="w-2 h-2 bg-gold opacity-100 transition-opacity duration-200"></div>
                </div>
                <span className="text-sm text-graphite ml-2">{typingMessage}</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Error Message */}
      {error && (
        <div data-testid="error-state" className="px-6 py-3 bg-ruby/10 border-t border-ruby/30">
          <p className="text-sm text-ruby">{error}</p>
        </div>
      )}

      {/* Input Area - 25% of height */}
      <div className="relative border-t border-fog bg-white" style={{ height: '25%', minHeight: '140px' }}>
        {/* Input Form */}
        <div className="px-4 h-full flex flex-col justify-center">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              sendMessage()
            }}
            className="flex gap-2"
          >
            <input
              data-testid="message-input"
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask about rates, savings, timing, or market conditions..."
              className="flex-1 h-10 px-3 text-sm border border-fog focus:border-gold focus:outline-none transition-colors"
              disabled={isSending}
            />
            <button
              data-testid="send-button"
              type="submit"
              disabled={!inputMessage.trim() || isSending}
              className="h-10 px-4 bg-gold hover:bg-gold-dark text-ink text-sm font-medium transition-colors disabled:opacity-50"
            >
              {isSending ? (
                <span className="text-xs">...</span>
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </form>

          {/* Subtle Quick Actions - Floating Text */}
          <div data-testid="quick-actions" className="flex items-center gap-3 mt-1 overflow-x-auto">
            <span className="text-xs text-silver flex-shrink-0">Quick:</span>
            <button
              onClick={() => setInputMessage('What are current market rates?')}
              className="text-xs text-graphite hover:text-gold transition-colors flex-shrink-0"
            >
              Current rates
            </button>
            <span className="text-xs text-silver flex-shrink-0">•</span>
            <button
              onClick={() => setInputMessage('When is the best time to refinance?')}
              className="text-xs text-graphite hover:text-gold transition-colors flex-shrink-0"
            >
              Best time
            </button>
            <span className="text-xs text-silver flex-shrink-0">•</span>
            <button
              onClick={() => setInputMessage('Calculate my potential savings')}
              className="text-xs text-graphite hover:text-gold transition-colors flex-shrink-0"
            >
              Calculate savings
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}