'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Send, ArrowLeft, MoreVertical } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  type: 'user' | 'agent'
  content: string
  time: string
}

export const SimpleMobileChatUI: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'agent',
      content: 'Hello! I can help you optimize your mortgage. What would you like to know?',
      time: '9:41 AM'
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = () => {
    if (!inputValue.trim()) return

    const now = new Date()
    const time = now.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      type: 'user',
      content: inputValue,
      time
    }

    setMessages(prev => [...prev, newMessage])
    setInputValue('')

    // Simulate response
    setTimeout(() => {
      const agentMessage: Message = {
        id: `agent-${Date.now()}`,
        type: 'agent',
        content: 'Let me analyze that for you...',
        time: new Date().toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        })
      }
      setMessages(prev => [...prev, agentMessage])
    }, 1500)
  }

  return (
    <div className="h-full w-full flex flex-col bg-white">
      {/* Simple Header - 48px height */}
      <div className="h-12 bg-white border-b flex items-center px-3 gap-3 flex-shrink-0">
        <button className="w-8 h-8 flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex-1">
          <div className="text-sm font-semibold">AI Advisor</div>
          <div className="text-xs text-green-600">Online</div>
        </div>

        <button className="w-8 h-8 flex items-center justify-center">
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto bg-gray-50 px-3 py-3">
        <div className="space-y-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex",
                msg.type === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              <div
                className={cn(
                  "max-w-[70%] rounded-2xl px-3 py-2",
                  msg.type === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white'
                )}
              >
                <p className="text-sm">{msg.content}</p>
                <p className={cn(
                  "text-xs mt-1",
                  msg.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                )}>
                  {msg.time}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Simple Input Area - 56px height */}
      <div className="h-14 bg-white border-t flex items-center px-3 gap-2 flex-shrink-0">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type a message..."
          className="flex-1 h-9 px-3 bg-gray-100 rounded-full text-sm outline-none focus:bg-white focus:ring-1 focus:ring-blue-500"
        />
        <button
          onClick={handleSend}
          disabled={!inputValue.trim()}
          className={cn(
            "w-9 h-9 rounded-full flex items-center justify-center transition-colors",
            inputValue.trim()
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-gray-400"
          )}
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}