'use client'

/**
 * ABOUTME: Enhanced page for Playwright E2E testing of CustomChatInterface
 * ABOUTME: Supports polling, persistence, and error scenarios for complete QA coverage
 */

import React, { useState, useEffect, useRef } from 'react'

const STORAGE_KEY = 'playwright-chat-messages'
const POLL_INTERVAL_MS = 3000 // 3 seconds

export default function PlaywrightChatTestPage() {
  // Load messages from localStorage on mount
  const [messages, setMessages] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          return parsed.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        } catch {
          // Fallback to default message
        }
      }
    }
    return [
      { id: 1, text: 'Hello! How can I help you today?', sender: 'bot', timestamp: new Date() }
    ]
  })

  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [simulateApiFailure, setSimulateApiFailure] = useState(false)
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Save messages to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
  }, [messages])

  // Polling mechanism - check for new messages every 3 seconds
  useEffect(() => {
    const poll = () => {
      // Simulate occasional new message from "server"
      if (Math.random() > 0.9) { // 10% chance each poll
        setMessages(prev => {
          const lastId = Math.max(...prev.map(m => m.id), 0)
          return [...prev, {
            id: lastId + 1,
            text: `Polled message at ${new Date().toLocaleTimeString()}`,
            sender: 'bot' as const,
            timestamp: new Date()
          }]
        })
      }
    }

    pollTimerRef.current = setInterval(poll, POLL_INTERVAL_MS)
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current)
    }
  }, [])

  const handleSend = async () => {
    if (!inputValue.trim()) return

    // Clear any previous errors
    setError(null)

    // Add user message (optimistic UI)
    const lastId = Math.max(...messages.map(m => m.id), 0)
    const userMessage = {
      id: lastId + 1,
      text: inputValue,
      sender: 'user' as const,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    const messageText = inputValue
    setInputValue('')

    try {
      // Call real API endpoint (can be intercepted by Playwright tests)
      setIsTyping(true)
      const response = await fetch('/api/chat/send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: 1,
          message: messageText,
        }),
      })

      setIsTyping(false)

      if (!response.ok) {
        throw new Error(`API failed with status ${response.status}`)
      }

      const data = await response.json()

      // Add bot response
      const botMessage = {
        id: lastId + 2,
        text: data.message?.content || `Echo: ${messageText}`,
        sender: 'bot' as const,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, botMessage])
    } catch (err) {
      setIsTyping(false)
      setError(err instanceof Error ? err.message : 'Failed to send message. Please try again.')
    }
  }

  // Auto-scroll to bottom when new messages arrive
  const messagesEndRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  return (
    <div className="flex h-screen flex-col bg-white">
      {/* Messages container */}
      <div
        data-testid="messages-container"
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            data-testid="message-item"
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] rounded-lg px-4 py-2 break-words ${
                msg.sender === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {isTyping && (
          <div data-testid="typing-indicator" className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-2">
              <span className="text-gray-600">Typing...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error state */}
      {error && (
        <div
          data-testid="error-state"
          className="bg-red-50 border-l-4 border-red-500 p-4 mx-4"
        >
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Quick actions (for scrollability test) */}
      <div className="border-t border-gray-200 p-2">
        <div data-testid="quick-actions" className="flex gap-2 whitespace-nowrap overflow-x-auto">
          <button className="px-4 py-2 bg-gray-100 rounded-lg text-sm">Action 1</button>
          <button className="px-4 py-2 bg-gray-100 rounded-lg text-sm">Action 2</button>
          <button className="px-4 py-2 bg-gray-100 rounded-lg text-sm">Action 3</button>
        </div>
      </div>

      {/* Input area */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex gap-2">
          <input
            data-testid="message-input"
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            data-testid="send-button"
            onClick={handleSend}
            className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
