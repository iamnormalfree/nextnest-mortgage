'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Send, Mic, Paperclip, MoreVertical, ArrowLeft, Phone, Video } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

interface Message {
  id: string
  type: 'user' | 'agent' | 'system'
  content: string
  timestamp: Date
  status?: 'sending' | 'sent' | 'delivered' | 'read'
}

interface MobileChatUIProps {
  agentName?: string
  agentStatus?: 'online' | 'typing' | 'offline'
  leadScore?: number | null
  onSendMessage?: (message: string) => void
  onBack?: () => void
}

export const MobileChatUI: React.FC<MobileChatUIProps> = ({
  agentName = 'AI Mortgage Advisor',
  agentStatus = 'online',
  leadScore,
  onSendMessage,
  onBack
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'agent',
      content: 'Hello! I\'m your AI mortgage advisor. How can I help you optimize your mortgage today?',
      timestamp: new Date(Date.now() - 60000),
      status: 'read'
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = () => {
    if (!inputValue.trim()) return

    const newMessage: Message = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
      status: 'sending'
    }

    setMessages(prev => [...prev, newMessage])
    setInputValue('')

    // Update status to sent
    setTimeout(() => {
      setMessages(prev =>
        prev.map(msg =>
          msg.id === newMessage.id ? { ...msg, status: 'sent' } : msg
        )
      )
    }, 500)

    // Show typing indicator
    setTimeout(() => {
      setIsTyping(true)
    }, 1000)

    // Simulate agent response
    setTimeout(() => {
      setIsTyping(false)
      const agentResponse: Message = {
        id: `agent-${Date.now()}`,
        type: 'agent',
        content: 'I understand you\'re looking for mortgage optimization. Let me analyze your options...',
        timestamp: new Date(),
        status: 'delivered'
      }
      setMessages(prev => [...prev, agentResponse])
    }, 3000)

    if (onSendMessage) {
      onSendMessage(inputValue)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-screen w-full bg-white">
      {/* Header - Fixed */}
      <header className="flex-shrink-0 bg-white border-b">
        <div className="flex items-center justify-between p-3 gap-3">
          {/* Left section */}
          <div className="flex items-center gap-3 flex-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={onBack}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>

            <div className="flex items-center gap-3 flex-1">
              {/* Avatar */}
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold to-amber-500 flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">AI</span>
                </div>
                <div className={cn(
                  "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white",
                  agentStatus === 'online' ? 'bg-green-500' :
                  agentStatus === 'typing' ? 'bg-yellow-500' :
                  'bg-gray-400'
                )} />
              </div>

              {/* Agent info */}
              <div className="flex-1 min-w-0">
                <h1 className="text-sm font-semibold text-gray-900 truncate">
                  {agentName}
                </h1>
                <p className="text-xs text-gray-500">
                  {agentStatus === 'typing' ? 'typing...' :
                   agentStatus === 'online' ? 'Active now' :
                   'Offline'}
                </p>
              </div>
            </div>
          </div>

          {/* Right section */}
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Phone className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Video className="h-4 w-4" />
            </Button>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px]">
                <div className="space-y-4 mt-6">
                  <div>
                    <h3 className="font-semibold mb-2">Conversation Info</h3>
                    {leadScore && (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Lead Score</span>
                          <Badge variant={leadScore > 70 ? 'default' : leadScore > 40 ? 'secondary' : 'outline'}>
                            {leadScore}%
                          </Badge>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start">
                      View Profile
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      Export Chat
                    </Button>
                    <Button variant="outline" className="w-full justify-start text-red-600">
                      End Conversation
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Messages Area - Scrollable */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="px-4 py-4 space-y-4">
          {/* Date divider */}
          <div className="flex items-center justify-center">
            <span className="text-xs text-gray-500 bg-white px-3 py-1 rounded-full">
              Today
            </span>
          </div>

          {/* Messages */}
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-2",
                message.type === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {message.type !== 'user' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold to-amber-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-semibold">AI</span>
                </div>
              )}

              <div className={cn(
                "max-w-[75%] space-y-1",
                message.type === 'user' ? 'items-end' : 'items-start'
              )}>
                <div className={cn(
                  "px-4 py-2 rounded-2xl",
                  message.type === 'user'
                    ? 'bg-gold text-ink rounded-br-sm'
                    : 'bg-white text-gray-900 rounded-bl-sm shadow-sm'
                )}>
                  <p className="text-sm leading-relaxed">{message.content}</p>
                </div>

                <div className={cn(
                  "flex items-center gap-1 px-1",
                  message.type === 'user' ? 'justify-end' : 'justify-start'
                )}>
                  <span className="text-[10px] text-gray-400">
                    {format(message.timestamp, 'h:mm a')}
                  </span>
                  {message.type === 'user' && message.status && (
                    <span className="text-[10px] text-gray-400">
                      {message.status === 'sending' && '•'}
                      {message.status === 'sent' && '✓'}
                      {message.status === 'delivered' && '✓✓'}
                      {message.status === 'read' && <span className="text-blue-500">✓✓</span>}
                    </span>
                  )}
                </div>
              </div>

              {message.type === 'user' && (
                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                  <span className="text-gray-700 text-xs font-semibold">U</span>
                </div>
              )}
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex gap-2 justify-start">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold to-amber-500 flex items-center justify-center">
                <span className="text-white text-xs font-semibold">AI</span>
              </div>
              <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Quick Actions - Optional */}
      {messages.length === 1 && (
        <div className="flex-shrink-0 px-4 py-2 border-t bg-white">
          <div className="flex gap-2 overflow-x-auto">
            <Button
              variant="outline"
              size="sm"
              className="flex-shrink-0 text-xs"
              onClick={() => setInputValue('What are current mortgage rates?')}
            >
              Current Rates
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-shrink-0 text-xs"
              onClick={() => setInputValue('Should I refinance now?')}
            >
              Refinance Analysis
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-shrink-0 text-xs"
              onClick={() => setInputValue('Calculate my savings')}
            >
              Calculate Savings
            </Button>
          </div>
        </div>
      )}

      {/* Input Area - Fixed */}
      <div className="flex-shrink-0 border-t bg-white">
        <div className="flex items-end gap-2 p-3">
          <Button variant="ghost" size="icon" className="h-9 w-9 mb-0.5">
            <Paperclip className="h-5 w-5" />
          </Button>

          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="pr-10 bg-gray-50 border-gray-200 focus:bg-white"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full w-10"
              onClick={() => console.log('Voice input')}
            >
              <Mic className="h-4 w-4" />
            </Button>
          </div>

          <Button
            size="icon"
            className={cn(
              "h-9 w-9 mb-0.5 transition-colors",
              inputValue.trim()
                ? "bg-gold hover:bg-gold/90 text-ink"
                : "bg-gray-100 text-gray-400"
            )}
            onClick={handleSend}
            disabled={!inputValue.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export default MobileChatUI