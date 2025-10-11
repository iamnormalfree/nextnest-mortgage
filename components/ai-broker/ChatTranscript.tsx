'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Bot, User, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface ChatMessage {
  id: string
  type: 'user' | 'system' | 'insight'
  content: string
  timestamp: Date
  metadata?: {
    insightType?: 'score' | 'analysis' | 'rate' | 'action'
    priority?: 'high' | 'medium' | 'low'
  }
}

interface ChatTranscriptProps {
  messages: ChatMessage[]
  isLoading?: boolean
  className?: string
  onScroll?: (scrollTop: number, scrollHeight: number, clientHeight: number) => void
}

/**
 * Chat-first mobile transcript component
 * Primary surface for mobile AI broker experience
 * Compact spacing for mobile viewports
 */
export const ChatTranscript: React.FC<ChatTranscriptProps> = ({
  messages,
  isLoading = false,
  className,
  onScroll
}) => {
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (onScroll) {
      const target = e.currentTarget
      onScroll(target.scrollTop, target.scrollHeight, target.clientHeight)
    }
  }
  return (
    <div
      className={cn(
        'overflow-y-auto py-2 space-y-3',
        'max-h-[30vh] min-h-[120px]', // Reduced height - input is main focus
        className // Parent passes shared spacing
      )}
      onScroll={handleScroll}
    >
      {messages.map((message) => (
        <ChatBubble key={message.id} message={message} />
      ))}
      
      {isLoading && <StreamingBubble />}
      
      {messages.length === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Bot className="w-12 h-12 text-gray-300 mb-3" />
          <p className="text-sm text-gray-500 mb-1">AI Broker Ready</p>
          <p className="text-xs text-gray-400">Ask about your mortgage situation</p>
        </div>
      )}
    </div>
  )
}

// Individual chat bubble component
const ChatBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
  const isUser = message.type === 'user'
  const isInsight = message.type === 'insight'

  return (
    <div className={cn(
      'flex gap-2 max-w-[85%]',
      isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
    )}>
      {/* Avatar */}
      <div className={cn(
        'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1',
        isUser
          ? 'bg-gray-300'
          : 'bg-gold'
      )}>
        {isUser ? (
          <span className="text-xs font-medium text-gray-700">U</span>
        ) : (
          <div className="w-2 h-2 bg-ink rounded-full" />
        )}
      </div>

      {/* Message Content */}
      <div className="flex flex-col gap-1">
        <div className={cn(
          'rounded-lg px-3 py-2 text-sm leading-relaxed',
          isUser
            ? 'bg-gold text-ink rounded-br-sm' // User bubbles - brand gold, right-aligned
            : isInsight
            ? 'bg-blue-50 border border-blue-200 text-blue-900 rounded-bl-sm' // Insight bubbles - distinct blue
            : 'bg-gray-100 text-gray-900 rounded-bl-sm' // System bubbles - light gray
        )}>
          {/* AI Label for non-user messages */}
          {!isUser && (
            <div className="flex items-center gap-1 mb-1">
              <span className={cn(
                'text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-full',
                isInsight
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-200 text-gray-600'
              )}>
                {isInsight ? 'INSIGHT' : 'AI'}
              </span>
              {isInsight && message.metadata && (
                <>
                  <div className={cn(
                    'w-2 h-2 rounded-full',
                    message.metadata.priority === 'high' ? 'bg-red-500' :
                    message.metadata.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                  )} />
                  <span className="text-xs font-medium opacity-75">
                    {message.metadata.insightType?.toUpperCase()}
                  </span>
                </>
              )}
            </div>
          )}

          <div className="whitespace-pre-wrap break-words">{message.content}</div>
        </div>

        {/* Timestamp */}
        <div className={cn(
          'flex items-center gap-1 text-xs text-gray-500 px-1',
          isUser ? 'justify-end' : 'justify-start'
        )}>
          <Clock className="w-3 h-3" />
          <span>
            {formatDistanceToNow(message.timestamp, { addSuffix: true })}
          </span>
        </div>
      </div>
    </div>
  )
}

// Streaming indicator for AI responses
const StreamingBubble: React.FC = () => {
  return (
    <div className="flex gap-2 max-w-[85%] mr-auto">
      {/* AI Avatar */}
      <div className="w-8 h-8 rounded-full bg-gold flex items-center justify-center flex-shrink-0 mt-1">
        <div className="w-2 h-2 bg-ink rounded-full" />
      </div>

      <div className="flex flex-col gap-1">
        <div className="bg-gray-100 text-gray-900 rounded-lg rounded-bl-sm px-3 py-2">
          <div className="flex items-center gap-1 mb-1">
            <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-full bg-gray-200 text-gray-600">
              AI
            </span>
          </div>
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
          </div>
        </div>

        <div className="flex items-center gap-1 text-xs text-gray-500 px-1">
          <Clock className="w-3 h-3" />
          <span>typing...</span>
        </div>
      </div>
    </div>
  )
}

export type { ChatMessage }