'use client'

import React, { useState } from 'react'
import { Send, Mic, Plus, Paperclip, Sliders, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuickReply {
  id: string
  text: string
  action: string
}

interface MobileChatComposerProps {
  onSendMessage: (message: string) => void
  onVoiceInput?: () => void
  onQuickReply?: (reply: QuickReply) => void
  isLoading?: boolean
  quickReplies?: QuickReply[]
  placeholder?: string
  className?: string
  bottomOffset?: number // To account for action sheet height
}

/**
 * Sticky mobile chat composer with voice input and quick replies
 * Stays within thumb reach at bottom of viewport
 * Meets 56px minimum height for comfortable touch targets
 */
export const MobileChatComposer: React.FC<MobileChatComposerProps> = ({
  onSendMessage,
  onVoiceInput,
  onQuickReply,
  isLoading = false,
  quickReplies = [],
  placeholder = "Ask about your mortgage...",
  className,
  bottomOffset = 0
}) => {
  const [message, setMessage] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)

  const handleSend = () => {
    if (message.trim() && !isLoading) {
      onSendMessage(message.trim())
      setMessage('')
      setIsExpanded(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleQuickReplyClick = (reply: QuickReply) => {
    if (onQuickReply) {
      onQuickReply(reply)
    } else {
      onSendMessage(reply.text)
    }
  }

  return (
    <div
      className={cn(
        'sticky bottom-0 left-0 right-0 bg-white border-t border-gray-200',
        className
      )}
      style={{
        bottom: `${bottomOffset}px`,
        paddingBottom: 'env(safe-area-inset-bottom)'
      }}
    >
      <div className="px-3 py-2 space-y-2 bg-white border-t border-gray-200">
        {/* Row 1 – text input */}
        <div className="relative">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={isLoading}
            rows={1}
            className={cn(
              'w-full min-h-[48px] rounded-2xl bg-gray-50 focus:bg-white border border-gray-400',
              'focus:border-gold focus:ring-2 focus:ring-gold/40 px-4 py-3 text-sm placeholder:text-gray-600',
              'resize-none focus:outline-none',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          />
          {/* Send or mic button */}
          {message.trim() ? (
            <button
              onClick={handleSend}
              disabled={isLoading}
              className={cn(
                'absolute right-2 top-1/2 -translate-y-1/2 size-10 rounded-full bg-gold flex items-center justify-center',
                'hover:bg-gold/90 transition-colors',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              <Send className="size-5 text-ink" />
            </button>
          ) : onVoiceInput ? (
            <button
              onClick={onVoiceInput}
              disabled={isLoading}
              className={cn(
                'absolute right-2 top-1/2 -translate-y-1/2 size-10 rounded-full bg-blue-500 flex items-center justify-center',
                'hover:bg-blue-600 transition-colors',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              <Mic className="size-5 text-white" />
            </button>
          ) : null}
        </div>

        {/* Row 2 – utility icons */}
        <div className="flex items-center justify-between px-1 text-gray-600">
          <button
            onClick={() => console.log('Add')}
            className="size-10 rounded-full flex items-center justify-center hover:bg-gray-100"
          >
            <Plus className="size-5" />
          </button>
          <button
            onClick={() => console.log('Settings')}
            className="size-10 rounded-full flex items-center justify-center hover:bg-gray-100"
          >
            <Sliders className="size-5" />
          </button>
          <button
            onClick={() => console.log('Voice')}
            className="size-10 rounded-full flex items-center justify-center hover:bg-gray-100"
          >
            <Mic className="size-5" />
          </button>
          <button
            onClick={() => console.log('AI Assistant')}
            className="size-10 rounded-full flex items-center justify-center bg-gold text-ink hover:bg-gold/90"
          >
            <Sparkles className="size-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

export type { QuickReply }