'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Send, Mic, Paperclip, MoreVertical, ArrowLeft, Phone } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

interface Message {
  id: string
  type: 'user' | 'agent' | 'system'
  content: string
  timestamp: Date
  status?: 'sending' | 'sent' | 'delivered' | 'read'
}

interface MobileChatUIFixedProps {
  agentName?: string
  agentStatus?: 'online' | 'typing' | 'offline'
  leadScore?: number | null
  onSendMessage?: (message: string) => void
  onBack?: () => void
}

export const MobileChatUIFixed: React.FC<MobileChatUIFixedProps> = ({
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
  const [showOptions, setShowOptions] = useState(false)
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
        content: 'I understand your inquiry. Let me analyze your options for the best mortgage solution.',
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
    <div className="h-full w-full flex flex-col bg-white">
      {/* Compact Header - 48px */}
      <div className="h-12 bg-white border-b flex items-center px-3 gap-2 flex-shrink-0">
        <button onClick={onBack} className="w-8 h-8 flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Agent Info */}
        <div className="flex-1 flex items-center gap-2">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center">
              <span className="text-white font-semibold text-xs">AI</span>
            </div>
            <div className={cn(
              "absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white",
              agentStatus === 'online' ? 'bg-green-500' :
              agentStatus === 'typing' ? 'bg-yellow-500' :
              'bg-gray-400'
            )} />
          </div>

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

        {/* Action Buttons */}
        <button className="w-8 h-8 flex items-center justify-center">
          <Phone className="w-4 h-4" />
        </button>
        <button
          className="w-8 h-8 flex items-center justify-center"
          onClick={() => setShowOptions(!showOptions)}
        >
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>

      {/* Options Menu */}
      {showOptions && (
        <div className="absolute top-12 right-3 bg-white rounded-lg shadow-lg border z-50 py-1">
          <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50">View Profile</button>
          <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50">Export Chat</button>
          <button className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50">End Chat</button>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="px-3 py-3 space-y-3">
          {/* Date divider */}
          <div className="flex items-center justify-center my-2">
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
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-semibold">AI</span>
                </div>
              )}

              <div className={cn(
                "max-w-[75%]",
                message.type === 'user' ? 'items-end' : 'items-start'
              )}>
                <div className={cn(
                  "px-3 py-2 rounded-2xl",
                  message.type === 'user'
                    ? 'bg-amber-400 text-white rounded-br-sm'
                    : 'bg-white text-gray-900 rounded-bl-sm shadow-sm'
                )}>
                  <p className="text-sm leading-relaxed">{message.content}</p>
                </div>

                <div className={cn(
                  "flex items-center gap-1 px-1 mt-1",
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
                <div className="w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-gray-700 text-xs font-semibold">U</span>
                </div>
              )}
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex gap-2 justify-start">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center">
                <span className="text-white text-xs font-semibold">AI</span>
              </div>
              <div className="bg-white rounded-2xl rounded-bl-sm px-3 py-2 shadow-sm">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Quick Actions - Optional */}
      {messages.length === 1 && (
        <div className="bg-white border-t px-3 py-2 flex-shrink-0">
          <div className="flex gap-2 overflow-x-auto">
            <button
              className="flex-shrink-0 text-xs px-3 py-1.5 bg-gray-100 rounded-full hover:bg-gray-200"
              onClick={() => setInputValue('What are current mortgage rates?')}
            >
              Current Rates
            </button>
            <button
              className="flex-shrink-0 text-xs px-3 py-1.5 bg-gray-100 rounded-full hover:bg-gray-200"
              onClick={() => setInputValue('Should I refinance now?')}
            >
              Refinance?
            </button>
            <button
              className="flex-shrink-0 text-xs px-3 py-1.5 bg-gray-100 rounded-full hover:bg-gray-200"
              onClick={() => setInputValue('Calculate my savings')}
            >
              Calculate
            </button>
          </div>
        </div>
      )}

      {/* Input Area - Compact 48px */}
      <div className="h-12 bg-white border-t flex items-center px-3 gap-2 flex-shrink-0">
        <button className="w-8 h-8 flex items-center justify-center text-gray-500">
          <Paperclip className="w-4 h-4" />
        </button>

        <input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          className="flex-1 h-8 px-3 bg-gray-100 rounded-full text-sm outline-none focus:bg-white focus:ring-1 focus:ring-amber-400"
        />

        {inputValue.trim() ? (
          <button
            onClick={handleSend}
            className="w-8 h-8 bg-amber-400 text-white rounded-full flex items-center justify-center"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button className="w-8 h-8 flex items-center justify-center text-gray-500">
            <Mic className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}

export default MobileChatUIFixed