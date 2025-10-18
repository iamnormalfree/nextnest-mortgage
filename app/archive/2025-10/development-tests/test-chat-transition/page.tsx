'use client'

import React, { useState } from 'react'
import ChatTransitionScreen from '@/components/forms/ChatTransitionScreen'
import ChatWidgetLoader from '@/components/forms/ChatWidgetLoader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestChatTransitionPage() {
  const [showTransition, setShowTransition] = useState(false)
  const [leadScore, setLeadScore] = useState(75)
  const [chatConfig, setChatConfig] = useState<any>(null)
  const [transitionComplete, setTransitionComplete] = useState(false)

  const testFormData = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '91234567',
    loanType: 'new_purchase',
    propertyCategory: 'new_launch' as 'new_launch',
    propertyType: 'Condo',
    actualAges: [35],
    actualIncomes: [8000],
    employmentType: 'employed',
    hasExistingLoan: false,
    existingLoanDetails: undefined
  }

  const handleStartTransition = (score: number) => {
    setLeadScore(score)
    setShowTransition(true)
    setTransitionComplete(false)
  }

  const handleTransitionComplete = (conversationId: number) => {
    console.log('✅ Chat transition completed:', conversationId)
    setTransitionComplete(true)
    
    // Simulate loading chat widget config
    const mockConfig = {
      baseUrl: 'https://chat.nextnest.sg',
      websiteToken: 'test-token',
      conversationId: conversationId,
      locale: 'en' as const,
      position: 'right' as const,
      hideMessageBubble: false,
      customAttributes: {
        leadScore: leadScore,
        name: testFormData.name
      }
    }
    setChatConfig(mockConfig)
  }

  const handleFallbackRequired = (fallbackData: any) => {
    console.log('📞 Fallback triggered:', fallbackData)
    setTransitionComplete(true)
  }

  if (!showTransition) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Chat Transition Test Page</h1>
          
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Test Different Lead Score Scenarios</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Click a button below to see how the chat transition behaves with different lead scores:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-2 hover:border-blue-500 transition-colors cursor-pointer" 
                      onClick={() => handleStartTransition(85)}>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl mb-2">🔥</div>
                      <h3 className="font-semibold text-lg mb-1">High Score (85)</h3>
                      <p className="text-sm text-gray-600 mb-3">Premium Lead</p>
                      <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm inline-block mb-3">
                        Marcus Chen
                      </div>
                      <p className="text-xs text-gray-500">
                        Aggressive approach, premium rates focus, high urgency
                      </p>
                      <Button className="w-full mt-3 bg-green-600 hover:bg-green-700">
                        Test High Score
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 hover:border-blue-500 transition-colors cursor-pointer" 
                      onClick={() => handleStartTransition(60)}>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl mb-2">⚖️</div>
                      <h3 className="font-semibold text-lg mb-1">Medium Score (60)</h3>
                      <p className="text-sm text-gray-600 mb-3">Qualified Lead</p>
                      <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm inline-block mb-3">
                        Sarah Wong
                      </div>
                      <p className="text-xs text-gray-500">
                        Balanced approach, educational & consultative, medium urgency
                      </p>
                      <Button className="w-full mt-3 bg-blue-600 hover:bg-blue-700">
                        Test Medium Score
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 hover:border-blue-500 transition-colors cursor-pointer" 
                      onClick={() => handleStartTransition(35)}>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl mb-2">🌱</div>
                      <h3 className="font-semibold text-lg mb-1">Low Score (35)</h3>
                      <p className="text-sm text-gray-600 mb-3">Nurture Lead</p>
                      <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm inline-block mb-3">
                        David Lim
                      </div>
                      <p className="text-xs text-gray-500">
                        Conservative approach, value-focused & supportive, low urgency
                      </p>
                      <Button className="w-full mt-3 bg-yellow-600 hover:bg-yellow-700">
                        Test Low Score
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-6 p-4 bg-gray-100 rounded-lg">
                <h4 className="font-semibold mb-2">Test Form Data:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="font-medium">Name:</span> {testFormData.name}</div>
                  <div><span className="font-medium">Email:</span> {testFormData.email}</div>
                  <div><span className="font-medium">Phone:</span> {testFormData.phone}</div>
                  <div><span className="font-medium">Loan Type:</span> {testFormData.loanType}</div>
                  <div><span className="font-medium">Property:</span> {testFormData.propertyCategory}</div>
                  <div><span className="font-medium">Income:</span> ${testFormData.actualIncomes[0]}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-600">
              <p>1. <strong>Loading State (0-3 seconds):</strong> Shows &quot;Connecting to Your Broker&quot; with animated progress bar</p>
              <p>2. <strong>Success State:</strong> Displays the matched AI broker persona with their name and specialization</p>
              <p>3. <strong>Fallback State:</strong> If API fails, shows phone, WhatsApp, and email contact options</p>
              <p>4. <strong>Chat Widget:</strong> Once connected, loads the Chatwoot chat widget in the corner</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => {
              setShowTransition(false)
              setChatConfig(null)
              setTransitionComplete(false)
            }}
          >
            ← Back to Test Selection
          </Button>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Testing Lead Score: {leadScore}/100
        </h1>

        <div className="flex justify-center">
          <ChatTransitionScreen
            formData={testFormData}
            leadScore={leadScore}
            sessionId={`test-session-${Date.now()}`}
            onTransitionComplete={handleTransitionComplete}
            onFallbackRequired={handleFallbackRequired}
          />
        </div>

        {transitionComplete && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-semibold">
              ✅ Transition Complete! 
              {chatConfig ? ' Chat widget would load here.' : ' Fallback options displayed.'}
            </p>
          </div>
        )}

        {chatConfig && (
          <ChatWidgetLoader
            config={chatConfig}
            autoOpen={true}
            onLoad={() => console.log('💬 Chat widget loaded')}
            onError={(error) => console.error('❌ Chat widget error:', error)}
          />
        )}
      </div>
    </div>
  )
}