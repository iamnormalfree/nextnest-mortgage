'use client'

import React, { useState, useEffect } from 'react'
import { Menu, MoreVertical } from 'lucide-react'
import { ChatTranscript, type ChatMessage } from './ChatTranscript'
import { MobileChatComposer, type QuickReply } from './MobileChatComposer'
import { MobileInsightStrip } from './MobileInsightStrip'
import { MobileStickyActions } from './MobileStickyActions'
import type { MobileAIBrokerUIProps } from './types'
import { cn } from '@/lib/utils'

/**
 * Chat-first mobile AI broker UI
 * Primary surface is chat transcript with contextual insights
 * Implements proper mobile-first architecture as specified
 */
export const MobileAIBrokerUI: React.FC<MobileAIBrokerUIProps> = ({
  situationalInsights,
  rateIntelligence,
  defenseStrategy,
  leadScore,
  isLoading = false,
  onBrokerConsultation
}) => {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [showInsights, setShowInsights] = useState(true)
  const [isTyping, setIsTyping] = useState(false)
  const [actionSheetHeight, setActionSheetHeight] = useState(0)
  const [transcriptScrollTop, setTranscriptScrollTop] = useState(0)

  // Generate initial chat messages from analysis data
  useEffect(() => {
    if (!chatMessages.length && (situationalInsights || rateIntelligence || defenseStrategy)) {
      const messages: ChatMessage[] = []

      // Welcome message
      messages.push({
        id: 'welcome',
        type: 'system',
        content: 'I\'ve analyzed your mortgage situation. Let me share the key insights.',
        timestamp: new Date(Date.now() - 60000)
      })

      // Lead score insight
      if (leadScore && leadScore > 0) {
        messages.push({
          id: 'score',
          type: 'insight',
          content: `Your mortgage profile scores ${leadScore}% confidence. This indicates ${leadScore > 70 ? 'excellent' : leadScore > 40 ? 'good' : 'moderate'} positioning for optimization.`,
          timestamp: new Date(Date.now() - 45000),
          metadata: {
            insightType: 'score',
            priority: leadScore > 70 ? 'high' : 'medium'
          }
        })
      }

      // Urgent analysis
      if (situationalInsights?.otpAnalysis?.urgencyLevel === 'critical' || situationalInsights?.otpAnalysis?.urgencyLevel === 'high') {
        messages.push({
          id: 'urgency',
          type: 'insight',
          content: `URGENT: ${situationalInsights.otpAnalysis.urgencyLevel.toUpperCase()} priority - ${situationalInsights.otpAnalysis.timeline}`,
          timestamp: new Date(Date.now() - 30000),
          metadata: {
            insightType: 'analysis',
            priority: 'high'
          }
        })
      }

      // Rate intelligence
      if (rateIntelligence?.timingRecommendation) {
        messages.push({
          id: 'timing',
          type: 'insight',
          content: `Market Timing: ${rateIntelligence.timingRecommendation}`,
          timestamp: new Date(Date.now() - 15000),
          metadata: {
            insightType: 'rate',
            priority: 'medium'
          }
        })
      }

      setChatMessages(messages)
    }
  }, [situationalInsights, rateIntelligence, defenseStrategy, leadScore, chatMessages.length])

  const handleSendMessage = (message: string) => {
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: message,
      timestamp: new Date()
    }

    setChatMessages(prev => [...prev, userMessage])
    setIsTyping(true)

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: `ai-${Date.now()}`,
        type: 'system',
        content: 'I\'ll help you with that. Let me connect you with a specialist who can provide detailed guidance.',
        timestamp: new Date()
      }
      setChatMessages(prev => [...prev, aiResponse])
      setIsTyping(false)
    }, 1500)
  }

  const quickReplies: QuickReply[] = [
    { id: 'rates', text: 'Show current rates', action: 'show_rates' },
    { id: 'timing', text: 'When should I act?', action: 'timing_advice' },
    { id: 'consultant', text: 'Speak to advisor', action: 'book_consultation' },
    { id: 'options', text: 'What are my options?', action: 'show_options' }
  ]

  return (
    <div className="flex flex-col min-h-[400px] bg-white w-full">
      {/* Top App Bar - Consistent spacing */}
      <div className={cn(
        'flex items-center gap-3 py-2 px-4 bg-white border-b border-gray-200',
        'min-h-[44px]' // Touch target height
      )}>
        {/* Status Indicator */}
        <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" />

        {/* Title - Takes available space */}
        <div className="flex-1">
          <span className="text-sm font-medium text-gray-900">AI Mortgage Advisor</span>
        </div>

        {/* Action Buttons - Fixed size group */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setShowInsights(!showInsights)}
            className="p-2 hover:bg-gray-100 rounded-lg w-10 h-10 flex items-center justify-center"
          >
            <Menu className="w-4 h-4 text-gray-600" />
          </button>

          <button className="p-2 hover:bg-gray-100 rounded-lg w-10 h-10 flex items-center justify-center">
            <MoreVertical className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Collapsible Insight Strip */}
      {showInsights && (
        <div className="px-4 py-2">
          <MobileInsightStrip
            leadScore={leadScore}
            urgencyLevel={situationalInsights?.otpAnalysis?.urgencyLevel}
            primaryRecommendation={situationalInsights?.overallRecommendation}
            onToggle={() => setShowInsights(false)}
            className=""
          />
        </div>
      )}

      {/* Chat Transcript - Primary Surface */}
      <div className="flex-1 px-4 py-2">
        <ChatTranscript
          messages={chatMessages}
          isLoading={isTyping}
          className=""
          onScroll={(scrollTop) => setTranscriptScrollTop(scrollTop)}
        />
      </div>

      {/* Sticky Chat Composer */}
      <MobileChatComposer
        onSendMessage={handleSendMessage}
        onVoiceInput={() => console.log('Voice input')}
        isLoading={isTyping}
        quickReplies={quickReplies}
        bottomOffset={actionSheetHeight}
      />

      {/* Sticky Bottom Actions - Appears on scroll */}
      <MobileStickyActions
        onPrimaryAction={onBrokerConsultation}
        onSecondaryAction={() => console.log('Schedule later')}
        defenseStrategy={defenseStrategy}
        onHeightChange={setActionSheetHeight}
        transcriptScrolled={transcriptScrollTop}
      />
    </div>
  )
}

// Loading skeleton for the entire mobile UI
const MobileLoadingSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col min-h-[400px] bg-white animate-pulse">
      {/* Top bar skeleton */}
      <div className="h-12 bg-gray-100 border-b" />

      {/* Chat transcript skeleton */}
      <div className="flex-1 p-3 space-y-4">
        <div className="flex gap-2">
          <div className="w-6 h-6 bg-gray-200 rounded-full" />
          <div className="bg-gray-200 rounded-lg p-3 max-w-[70%]">
            <div className="h-4 bg-gray-300 rounded w-32 mb-2" />
            <div className="h-3 bg-gray-300 rounded w-24" />
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <div className="bg-gray-200 rounded-lg p-3 max-w-[70%]">
            <div className="h-4 bg-gray-300 rounded w-28" />
          </div>
          <div className="w-6 h-6 bg-gray-200 rounded-full" />
        </div>
      </div>

      {/* Composer skeleton */}
      <div className="p-3 border-t bg-gray-50">
        <div className="h-12 bg-gray-200 rounded-2xl" />
      </div>
    </div>
  )
}

export default MobileAIBrokerUI