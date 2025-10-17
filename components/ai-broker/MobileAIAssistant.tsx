'use client'

import React, { useState, useRef, useEffect } from 'react'
import {
  Send, Mic, Camera, Image as ImageIcon, FileText, MoreHorizontal,
  Phone, ArrowLeft, Star, TrendingUp, AlertCircle,
  CheckCircle2, Clock, DollarSign, Home, Calculator
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

interface InsightCard {
  id: string
  type: 'rate' | 'urgency' | 'opportunity' | 'analysis'
  title: string
  description: string
  value?: string
  trend?: 'up' | 'down' | 'stable'
  priority?: 'high' | 'medium' | 'low'
  action?: {
    label: string
    onClick: () => void
  }
}

interface MobileAIAssistantProps {
  leadScore?: number | null
  situationalInsights?: any
  rateIntelligence?: any
  onBrokerConsultation?: () => void
}

export const MobileAIAssistant: React.FC<MobileAIAssistantProps> = ({
  leadScore = 85,
  situationalInsights,
  rateIntelligence,
  onBrokerConsultation
}) => {
  const [activeView, setActiveView] = useState<'chat' | 'insights' | 'analysis'>('chat')
  const [messages, setMessages] = useState<any[]>([])
  const [inputValue, setInputValue] = useState('')
  const [showQuickActions, setShowQuickActions] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Sample insight cards
  const insightCards: InsightCard[] = [
    {
      id: '1',
      type: 'urgency',
      title: 'Time-Sensitive Opportunity',
      description: 'OTP expiring in 30 days',
      priority: 'high',
      action: {
        label: 'Act Now',
        onClick: () => console.log('Act now')
      }
    },
    {
      id: '2',
      type: 'rate',
      title: 'Rate Outlook',
      description: 'Fixed rates competitive',
      value: '3.85%',
      trend: 'down',
      priority: 'medium'
    },
    {
      id: '3',
      type: 'opportunity',
      title: 'Potential Savings',
      description: 'Refinance could save',
      value: '$450/mo',
      trend: 'up',
      priority: 'high'
    }
  ]

  const quickActions = [
    { icon: Calculator, label: 'Calculate', onClick: () => setInputValue('Calculate my mortgage') },
    { icon: TrendingUp, label: 'Rates', onClick: () => setInputValue('Show current rates') },
    { icon: Home, label: 'Refinance', onClick: () => setInputValue('Should I refinance?') },
    { icon: DollarSign, label: 'Save', onClick: () => setInputValue('How much can I save?') }
  ]

  const handleSend = () => {
    if (!inputValue.trim()) return

    const newMessage = {
      id: Date.now(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, newMessage])
    setInputValue('')
    setShowQuickActions(false)

    // Simulate response
    setTimeout(() => {
      const response = {
        id: Date.now() + 1,
        type: 'agent',
        content: 'I\'ll analyze that for you right away.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, response])
    }, 1000)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  return (
    <div className="flex flex-col h-screen w-full bg-gray-50">
      {/* Enhanced Header */}
      <header className="flex-shrink-0 bg-white shadow-sm">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-base font-semibold">AI Mortgage Assistant</h1>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-xs text-gray-600">Active • Analyzing</span>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Phone className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Score Banner */}
        {leadScore && (
          <div className="px-4 pb-3">
            <div className="bg-gradient-to-r from-gold/10 to-amber-50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gold rounded-full flex items-center justify-center">
                    <span className="text-ink font-bold">{leadScore}%</span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Optimization Score</p>
                    <p className="text-sm font-semibold">Strong Position</p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Ready
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* View Tabs */}
        <div className="flex border-b">
          {['chat', 'insights', 'analysis'].map((view) => (
            <button
              key={view}
              onClick={() => setActiveView(view as any)}
              className={cn(
                "flex-1 py-2 px-4 text-sm font-medium capitalize transition-colors",
                "border-b-2",
                activeView === view
                  ? "border-gold text-gold"
                  : "border-transparent text-gray-600"
              )}
            >
              {view}
            </button>
          ))}
        </div>
      </header>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        {activeView === 'chat' && (
          <div className="flex flex-col h-full">
            {/* Messages */}
            <div className="flex-1 px-4 py-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-20 h-20 bg-gold/10 rounded-full flex items-center justify-center mb-4">
                    <Home className="w-10 h-10 text-gold" />
                  </div>
                  <h2 className="text-lg font-semibold mb-2">Welcome Back!</h2>
                  <p className="text-sm text-gray-600 mb-4">
                    I&apos;m here to help optimize your mortgage
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex gap-2",
                        msg.type === 'user' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      <div className={cn(
                        "max-w-[80%] rounded-2xl px-4 py-2",
                        msg.type === 'user'
                          ? "bg-gold text-ink ml-auto"
                          : "bg-white shadow-sm"
                      )}>
                        <p className="text-sm">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Quick Actions */}
            {showQuickActions && messages.length === 0 && (
              <div className="px-4 pb-4">
                <p className="text-xs text-gray-600 mb-3">Quick Actions</p>
                <div className="grid grid-cols-2 gap-2">
                  {quickActions.map((action, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      className="justify-start"
                      onClick={action.onClick}
                    >
                      <action.icon className="w-4 h-4 mr-2" />
                      {action.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeView === 'insights' && (
          <div className="px-4 py-4 space-y-3">
            {insightCards.map((card) => (
              <Card key={card.id} className="shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {card.type === 'urgency' && <AlertCircle className="w-4 h-4 text-red-500" />}
                        {card.type === 'rate' && <TrendingUp className="w-4 h-4 text-blue-500" />}
                        {card.type === 'opportunity' && <Star className="w-4 h-4 text-gold" />}
                        <h3 className="text-sm font-semibold">{card.title}</h3>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">{card.description}</p>
                      {card.value && (
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-gold">{card.value}</span>
                          {card.trend && (
                            <Badge variant={card.trend === 'up' ? 'default' : 'secondary'}>
                              {card.trend}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                    {card.action && (
                      <Button size="sm" variant="outline" onClick={card.action.onClick}>
                        {card.action.label}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {activeView === 'analysis' && (
          <div className="px-4 py-4 space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Market conditions favor action within 30 days
              </AlertDescription>
            </Alert>

            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">Your Position</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Optimization Potential</span>
                      <span className="font-semibold">85%</span>
                    </div>
                    <Progress value={85} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Market Timing</span>
                      <span className="font-semibold">Favorable</span>
                    </div>
                    <Progress value={70} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button
              className="w-full bg-gold hover:bg-gold/90 text-ink"
              onClick={onBrokerConsultation}
            >
              <Phone className="w-4 h-4 mr-2" />
              Speak with Specialist
            </Button>
          </div>
        )}
      </div>

      {/* Input Area - Only show in chat view */}
      {activeView === 'chat' && (
        <div className="flex-shrink-0 bg-white border-t">
          <div className="flex items-center gap-2 p-3">
            <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Attach image">
              <ImageIcon className="h-5 w-5" />
            </Button>

            <div className="flex-1">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask about your mortgage..."
                className="bg-gray-50"
              />
            </div>

            {inputValue ? (
              <Button
                size="icon"
                className="h-9 w-9 bg-gold hover:bg-gold/90 text-ink"
                onClick={handleSend}
              >
                <Send className="h-4 w-4" />
              </Button>
            ) : (
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Mic className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default MobileAIAssistant