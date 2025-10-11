'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Send, User, Bot, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import BrokerProfile from './BrokerProfile'

interface Message {
  id: number
  content: string
  role?: 'user' | 'agent' | 'system'  // New role field
  message_type: 'incoming' | 'outgoing'  // Keep for backward compatibility
  created_at: string
  sender?: {
    name: string
    avatar_url?: string
    type: 'contact' | 'agent' | 'bot'
  }
  private: boolean
  original?: any  // Raw Chatwoot payload for debugging
}

interface ConversationAttributes {
  assigned_broker_name?: string
  assigned_broker_id?: string
  broker_photo_url?: string
  broker_personality?: string
  lead_score?: number
  message_count?: number
  handoff_triggered?: boolean
  handoff_reason?: string
}

interface EnhancedChatInterfaceProps {
  conversationId: number
  contactName?: string
  contactEmail?: string
  customAttributes?: ConversationAttributes
}

export default function EnhancedChatInterface({ 
  conversationId, 
  contactName = 'You',
  contactEmail,
  customAttributes 
}: EnhancedChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [brokerInfo, setBrokerInfo] = useState<ConversationAttributes>(customAttributes || {})
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastMessageIdRef = useRef<number>(0)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchMessages = useCallback(async (isPolling = false) => {
    if (!isPolling) {
      setIsLoading(true)
    }
    setError(null)

    try {
      const url = lastMessageIdRef.current > 0 && isPolling
        ? `/api/chat/messages?conversation_id=${conversationId}&after_id=${lastMessageIdRef.current}`
        : `/api/chat/messages?conversation_id=${conversationId}`
      
      const response = await fetch(url)
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please complete the form first to access the chat')
        }
        throw new Error('Failed to fetch messages')
      }

      const data = await response.json()
      
      if (data.messages && data.messages.length > 0) {
        const newMessages = data.messages.filter((msg: Message) => !msg.private)
        
        if (isPolling && lastMessageIdRef.current > 0) {
          // Check if there's a new bot message (typing indicator)
          const hasBotMessage = newMessages.some((msg: Message) => 
            msg.sender?.type === 'bot' || msg.message_type === 'outgoing'
          )
          
          if (hasBotMessage) {
            // Show typing indicator briefly before showing message
            setIsTyping(true)
            if (typingTimeoutRef.current) {
              clearTimeout(typingTimeoutRef.current)
            }
            typingTimeoutRef.current = setTimeout(() => {
              setIsTyping(false)
              setMessages(prev => {
                const messageIds = new Set(prev.map(m => m.id))
                const uniqueNewMessages = newMessages.filter((m: Message) => !messageIds.has(m.id))
                return [...prev, ...uniqueNewMessages]
              })
            }, 1500) // Show typing for 1.5 seconds
          } else {
            setMessages(prev => {
              const messageIds = new Set(prev.map(m => m.id))
              const uniqueNewMessages = newMessages.filter((m: Message) => !messageIds.has(m.id))
              return [...prev, ...uniqueNewMessages]
            })
          }
        } else {
          setMessages(newMessages)
        }
        
        if (newMessages.length > 0) {
          const lastMessage = newMessages[newMessages.length - 1]
          lastMessageIdRef.current = lastMessage.id
        }
      }

      // Update broker info from conversation attributes
      if (data.conversationAttributes) {
        setBrokerInfo(data.conversationAttributes)
      }
    } catch (err) {
      console.error('Error fetching messages:', err)
      setError(err instanceof Error ? err.message : 'Failed to load messages')
    } finally {
      setIsLoading(false)
    }
  }, [conversationId])

  // Fetch messages initially and set up polling (after fetchMessages is declared)
  useEffect(() => {
    fetchMessages()
    
    // Poll for new messages every 3 seconds
    pollIntervalRef.current = setInterval(() => {
      fetchMessages(true)
    }, 3000)

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [conversationId, fetchMessages])

  const sendMessage = async () => {
    if (!inputMessage.trim() || isSending) return

    setIsSending(true)
    setError(null)

    try {
      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversation_id: conversationId,
          message: inputMessage.trim()
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const data = await response.json()
      
      // Add the sent message immediately to the UI
      const newMessage: Message = {
        id: data.id || Date.now(),
        content: inputMessage.trim(),
        role: 'user',  // Set role for optimistic message
        message_type: 'incoming',
        created_at: new Date().toISOString(),
        sender: {
          name: contactName,
          type: 'contact'
        },
        private: false
      }
      
      setMessages(prev => [...prev, newMessage])
      setInputMessage('')
      
      // The bot response will come through polling
    } catch (err) {
      console.error('Error sending message:', err)
      setError('Failed to send message. Please try again.')
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Get broker photo URL
  const getBrokerPhoto = (brokerName?: string) => {
    if (brokerInfo.broker_photo_url) return brokerInfo.broker_photo_url
    
    switch(brokerName) {
      case 'Michelle Chen':
        return '/images/brokers/michelle-chen.jpg'
      case 'Sarah Wong':
        return '/images/brokers/sarah-wong.jpg'
      case 'Grace Lim':
        return '/images/brokers/grace-lim.jpg'
      case 'Rachel Tan':
        return '/images/brokers/rachel-tan.jpg'
      case 'Jasmine Lee':
        return '/images/brokers/jasmine-lee.jpg'
      default:
        return '/images/default-broker.jpg'
    }
  }

  const brokerName = brokerInfo.assigned_broker_name || 'AI Assistant'
  const brokerPhoto = getBrokerPhoto(brokerName)

  return (
    <div className="flex flex-col h-[600px] w-full max-w-4xl mx-auto">
      <Card className="flex flex-col h-full shadow-lg">
        <div className="border-b bg-hero-gradient p-4">
          <div className="flex justify-between items-start">
            <div className="text-ink">
              <h2 className="text-xl font-semibold">Mortgage Consultation</h2>
              <p className="text-gold text-sm mt-1">
                Conversation #{conversationId} • Lead Score: {brokerInfo.lead_score || 'N/A'}
              </p>
              {brokerInfo.handoff_triggered && (
                <div className="bg-gold text-ink px-3 py-1 rounded text-xs font-semibold">
                  Human Agent Requested
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Broker Profile */}
        <div className="px-4 pt-3">
          <BrokerProfile
            brokerName={brokerName}
            brokerPhoto={brokerPhoto}
            brokerPersonality={brokerInfo.broker_personality}
            isTyping={isTyping}
            isOnline={!brokerInfo.handoff_triggered}
          />
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading && messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-gold" />
            </div>
          ) : error ? (
            <div className="text-center text-ruby p-4">
              <p>{error}</p>
              <Button 
                onClick={() => fetchMessages()} 
                variant="outline" 
                size="sm"
                className="mt-2"
              >
                Retry
              </Button>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-graphite p-8">
              <Bot className="h-12 w-12 mx-auto mb-3 text-fog" />
              <p className="text-lg font-medium">Start your conversation</p>
              <p className="text-sm mt-2">
                {brokerName} is here to help with your mortgage needs
              </p>
            </div>
          ) : (
            <>
              {messages.map((message) => {
                // Determine message role with robust type normalization
                const getMessageRole = (): 'user' | 'agent' | 'system' => {
                  // Use role if available
                  if (message.role) {
                    return message.role
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
                    // 0 or 'incoming' = user message (from contact)
                    if (normalizedType === 0) {
                      return 'user'
                    }
                    // 1 or 'outgoing' = agent message (from bot/agent)
                    if (normalizedType === 1) {
                      return 'agent'
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

                const messageRole = getMessageRole()

                // Hide private messages
                if (message.private) {
                  return null
                }

                // Render system messages as centered status chips
                if (messageRole === 'system') {
                  // Filter out boilerplate system messages
                  const hiddenPatterns = [/conversation was reopened/i, /added property/i]
                  const shouldHide = hiddenPatterns.some(pattern => pattern.test(message.content || ''))
                  if (shouldHide) {
                    return null
                  }

                  return (
                    <div key={message.id} className="flex justify-center my-2">
                      <div className="px-3 py-1 bg-mist/70 text-graphite text-xs text-center rounded-md border border-fog/70">
                        <p className="whitespace-pre-wrap break-words">{message.content}</p>
                      </div>
                    </div>
                  )
                }

                const isUserMessage = messageRole === 'user'

                return (
                  <div
                    key={message.id}
                    className={cn(
                      "flex items-start gap-3",
                      isUserMessage ? "justify-end" : "justify-start"
                    )}
                  >
                    {!isUserMessage && (
                      <div className="flex-shrink-0">
                        <Image
                          src={brokerPhoto}
                          alt={brokerName}
                          width={32}
                          height={32}
                          className=""
                        />
                      </div>
                    )}
                    
                    <div
                      className={cn(
                        "max-w-[70%] px-4 py-2.5 shadow-sm",
                        isUserMessage
                          ? "bg-gold text-ink"
                          : "bg-mist text-ink border border-fog"
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
                      <p className={cn(
                        "text-xs mt-1.5",
                        isUserMessage ? "text-gold" : "text-graphite"
                      )}>
                        {new Date(message.created_at).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                    
                    {isUserMessage && (
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-fog flex items-center justify-center">
                          <User className="h-5 w-5 text-graphite" />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
              
              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex items-start gap-3 justify-start">
                  <div className="flex-shrink-0">
                    <Image
                      src={brokerPhoto}
                      alt={brokerName}
                      width={32}
                      height={32}
                      className=""
                    />
                  </div>
                  <div className="bg-mist text-ink border border-fog">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-gold animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-gold animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-gold animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Stats Bar */}
        {messages.length > 0 && (
          <div className="px-4 py-2 bg-mist border-t border-b text-xs text-graphite flex justify-between">
            <span>Messages: {brokerInfo.message_count || messages.length}</span>
            <span>Broker: {brokerName}</span>
            {brokerInfo.handoff_triggered && (
              <span className="text-gold">Escalation: {brokerInfo.handoff_reason}</span>
            )}
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 border-t bg-mist">
          <div className="flex gap-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Message ${brokerName}...`}
              disabled={isSending}
              className="flex-1"
            />
            <Button 
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isSending}
              className="bg-gold hover:bg-gold-dark"
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          {/* Quick Actions */}
          <div className="flex gap-2 mt-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => setInputMessage("What are the current rates?")}
            >
              📊 Current Rates
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => setInputMessage("How much can I borrow?")}
            >
              💰 Affordability
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => setInputMessage("I'm ready to apply")}
            >
              ✅ Apply Now
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}