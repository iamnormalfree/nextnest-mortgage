'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function TestAIBrokerPage() {
  const [response, setResponse] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [testScenario, setTestScenario] = useState('high')
  const [customMessage, setCustomMessage] = useState('')

  const testScenarios = {
    high: {
      leadScore: 85,
      brokerPersona: 'aggressive',
      firstName: 'John',
      monthlyIncome: 12000,
      propertyType: 'Condo',
      timeline: 'urgent',
      description: 'High-value lead with urgent timeline'
    },
    medium: {
      leadScore: 60,
      brokerPersona: 'balanced',
      firstName: 'Sarah',
      monthlyIncome: 7000,
      propertyType: 'HDB',
      timeline: '3-6 months',
      description: 'Qualified lead exploring options'
    },
    low: {
      leadScore: 35,
      brokerPersona: 'conservative',
      firstName: 'David',
      monthlyIncome: 4000,
      propertyType: 'BTO',
      timeline: 'flexible',
      description: 'Nurture lead needing education'
    }
  }

  const testFirstMessage = async () => {
    setLoading(true)
    const scenario = testScenarios[testScenario as keyof typeof testScenarios]
    
    try {
      const res = await fetch('/api/broker-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'INITIAL_CONTEXT',
          conversationId: Date.now(),
          messageCount: 1,
          isFirstMessage: true,
          ...scenario,
          customAttributes: {
            lead_score: scenario.leadScore,
            broker_persona_type: scenario.brokerPersona,
            broker_persona_name: scenario.brokerPersona === 'aggressive' ? 'Marcus Chen' :
                                scenario.brokerPersona === 'conservative' ? 'David Lim' : 'Sarah Wong',
            contact_name: scenario.firstName,
            loan_type: 'new_purchase',
            property_category: scenario.propertyType?.toLowerCase(),
            monthly_income: scenario.monthlyIncome.toString(),
            employment_type: 'employed'
          }
        })
      })
      
      const data = await res.json()
      setResponse(data)
    } catch (error) {
      console.error('Error:', error)
      setResponse({ error: error instanceof Error ? error.message : 'Unknown error occurred' })
    } finally {
      setLoading(false)
    }
  }

  const testCustomMessage = async () => {
    if (!customMessage) return
    
    setLoading(true)
    const scenario = testScenarios[testScenario as keyof typeof testScenarios]
    
    try {
      const res = await fetch('/api/broker-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: customMessage,
          conversationId: Date.now(),
          messageCount: 2,
          ...scenario
        })
      })
      
      const data = await res.json()
      setResponse(data)
    } catch (error) {
      console.error('Error:', error)
      setResponse({ error: error instanceof Error ? error.message : 'Unknown error occurred' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">AI Broker Response Test</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Test Controls */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Test Scenarios</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Scenario Selection */}
                <div className="space-y-3">
                  {Object.entries(testScenarios).map(([key, scenario]) => (
                    <div
                      key={key}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        testScenario === key ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setTestScenario(key)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold">
                            {scenario.firstName} - Score: {scenario.leadScore}
                          </div>
                          <div className="text-sm text-gray-600">
                            {scenario.description}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Persona: {scenario.brokerPersona} | Income: ${scenario.monthlyIncome}
                          </div>
                        </div>
                        <div className={`w-3 h-3 rounded-full ${
                          testScenario === key ? 'bg-blue-500' : 'bg-gray-300'
                        }`} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Test First Message */}
                <Button 
                  onClick={testFirstMessage}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? 'Generating...' : 'Test First Message'}
                </Button>

                {/* Custom Message Test */}
                <div className="space-y-2">
                  <Label>Test Custom Message</Label>
                  <Input
                    placeholder="e.g., What are the current rates?"
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && testCustomMessage()}
                  />
                  <Button 
                    onClick={testCustomMessage}
                    disabled={loading || !customMessage}
                    variant="outline"
                    className="w-full"
                  >
                    Send Custom Message
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Response Metadata */}
            {response && response.metadata && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-sm">Response Metadata</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 text-sm">
                    <div><strong>Type:</strong> {response.metadata.responseType}</div>
                    <div><strong>Confidence:</strong> {(response.metadata.confidence * 100).toFixed(0)}%</div>
                    <div><strong>Should Transfer:</strong> {response.shouldTransfer ? 'Yes' : 'No'}</div>
                    {response.marketData && (
                      <div><strong>Market:</strong> {response.marketData.currentRates}</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Response Display */}
          <div>
            <Card className="h-[600px] overflow-hidden">
              <CardHeader>
                <CardTitle>AI Response</CardTitle>
              </CardHeader>
              <CardContent className="h-[calc(100%-80px)] overflow-y-auto">
                {response ? (
                  <div className="space-y-4">
                    {/* Main Response */}
                    <div className="p-4 bg-white rounded-lg border">
                      <div className="whitespace-pre-wrap text-sm">
                        {response.response || response.error || 'No response'}
                      </div>
                    </div>

                    {/* Context Info */}
                    {response.context && (
                      <div className="p-3 bg-gray-50 rounded-lg text-xs">
                        <div className="font-semibold mb-1">Context:</div>
                        <div>Lead Score: {response.context.leadScore}</div>
                        <div>Persona: {response.context.brokerPersona}</div>
                        {response.context.calculatedInsights && (
                          <div className="mt-2">
                            <div>Pre-qualification: {response.context.calculatedInsights.preQualificationStatus}</div>
                            <div>Est. Savings: ${response.context.calculatedInsights.estimatedSavings}</div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Suggested Actions */}
                    {response.suggestedActions && response.suggestedActions.length > 0 && (
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="font-semibold text-sm mb-2">Suggested Follow-ups:</div>
                        <ul className="space-y-1">
                          {response.suggestedActions.map((action: string, idx: number) => (
                            <li key={idx} className="text-sm text-gray-700">
                              • {action}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-gray-500 text-center mt-20">
                    Select a scenario and click &quot;Test First Message&quot; to see the AI response
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}