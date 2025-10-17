'use client'

import React, { useState, useEffect } from 'react'
import { calculateMortgage, calculateLeadScore, calculateSingaporeMetrics } from '@/lib/calculations/mortgage'
import { calculateUrgencyProfile } from '@/lib/calculations/urgency-calculator'
// ARCHIVED: mortgage-insights-generator removed (see components/forms/archive/2025-10/)
// import { generateMortgageInsights } from '@/lib/insights/mortgage-insights-generator'

/**
 * Context Validation Dashboard
 * 
 * Purpose: Visualize how different system layers respond to the same input
 * This helps identify gaps, conflicts, and ensure 100% context alignment
 * across calculations, forms, API, and documentation layers.
 */

interface LayerResponse {
  layer: string
  status: 'success' | 'error' | 'warning' | 'processing'
  response: any
  details: string[]
  conflicts?: string[]
  gaps?: string[]
  source?: string
}

interface ValidationInput {
  rawText: string
  parsedData?: any
  scenario?: 'new_purchase' | 'refinance' | 'commercial'
}

interface FormDataBuilderProps {
  onDataGenerated: (data: any) => void
  onValidate: () => void
  isProcessing: boolean
  currentInput: string
  onInputChange: (text: string) => void
}

// Form Data Builder Component
function FormDataBuilder({ onDataGenerated, onValidate, isProcessing, currentInput, onInputChange }: FormDataBuilderProps) {
  const [formData, setFormData] = useState<any>({
    loanType: 'new_purchase',
    name: 'Test User',
    email: 'test@example.com',
    phone: '91234567',
    propertyType: '',
    priceRange: '',
    purchaseTimeline: '',
    currentRate: '',
    outstandingLoan: '',
    lockInStatus: '',
    propertyValue: '',
    purpose: '',
    monthlyIncome: '',
    existingCommitments: ''
  })

  // Field options based on your intelligent form
  const fieldOptions = {
    loanType: [
      { value: 'new_purchase', label: 'Buying a Property' },
      { value: 'refinance', label: 'Refinancing' },
      { value: 'commercial', label: 'Commercial Property' }
    ],
    propertyType: [
      { value: 'HDB', label: 'HDB Flat' },
      { value: 'Private', label: 'Private Condo' },
      { value: 'Landed', label: 'Landed Property' },
      { value: 'Commercial', label: 'Commercial Property' }
    ],
    purchaseTimeline: [
      { value: 'this_month', label: 'This Month' },
      { value: 'next_3_months', label: 'Next 3 Months' },
      { value: '3_6_months', label: '3-6 Months' },
      { value: 'exploring', label: 'Just Exploring' }
    ],
    lockInStatus: [
      { value: 'ending_soon', label: 'Ending Soon' },
      { value: 'no_lock', label: 'No Lock-in' },
      { value: 'locked', label: 'Currently Locked' },
      { value: 'not_sure', label: 'Not Sure' }
    ],
    purpose: [
      { value: 'investment', label: 'Investment' },
      { value: 'business', label: 'Business Capital' },
      { value: 'personal', label: 'Personal Use' },
      { value: 'other', label: 'Other' }
    ]
  }

  // Generate JSON from form
  const generateJSON = () => {
    // Clean up empty fields
    const cleanData = Object.entries(formData).reduce((acc, [key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        // Convert numeric fields
        if (['priceRange', 'currentRate', 'outstandingLoan', 'propertyValue', 'monthlyIncome', 'existingCommitments'].includes(key)) {
          acc[key] = Number(value) || 0
        } else {
          acc[key] = value
        }
      }
      return acc
    }, {} as any)

    const jsonString = JSON.stringify(cleanData, null, 2)
    onDataGenerated(jsonString)
  }

  // Quick fill presets
  const presets = {
    newPurchase: {
      loanType: 'new_purchase',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '91234567',
      propertyType: 'HDB',
      priceRange: '800000',
      purchaseTimeline: 'this_month',
      monthlyIncome: '8000',
      existingCommitments: '2000'
    },
    refinance: {
      loanType: 'refinance',
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '98765432',
      currentRate: '4.2',
      outstandingLoan: '500000',
      lockInStatus: 'ending_soon',
      propertyValue: '1000000',
      monthlyIncome: '10000',
      existingCommitments: '3000'
    },
    equityLoan: {
      loanType: 'commercial',
      name: 'Bob Chen',
      email: 'bob@example.com',
      phone: '96543210',
      propertyValue: '1500000',
      outstandingLoan: '600000',
      purpose: 'investment',
      monthlyIncome: '15000',
      existingCommitments: '4000'
    }
  }

  const loadPreset = (preset: keyof typeof presets) => {
    setFormData({ ...formData, ...presets[preset] })
  }

  // Determine which fields to show based on loan type
  const getVisibleFields = () => {
    const baseFields = ['loanType', 'name', 'email', 'phone']
    
    switch (formData.loanType) {
      case 'new_purchase':
        return [...baseFields, 'propertyType', 'priceRange', 'purchaseTimeline', 'monthlyIncome', 'existingCommitments']
      case 'refinance':
        return [...baseFields, 'currentRate', 'outstandingLoan', 'lockInStatus', 'propertyValue', 'monthlyIncome', 'existingCommitments']
      case 'commercial':
        return [...baseFields, 'propertyValue', 'outstandingLoan', 'purpose', 'monthlyIncome', 'existingCommitments']
      default:
        return baseFields
    }
  }

  return (
    <div className="space-y-4">
      {/* Quick Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Form Data Builder</h3>
        
        <div className="flex gap-2">
          <button
            onClick={() => loadPreset('newPurchase')}
            className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
          >
            New Purchase
          </button>
          <button
            onClick={() => loadPreset('refinance')}
            className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
          >
            Refinance
          </button>
          <button
            onClick={() => loadPreset('equityLoan')}
            className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
          >
            Equity Loan
          </button>
        </div>
      </div>

      {/* Form Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {getVisibleFields().map((fieldName) => {
          const options = fieldOptions[fieldName as keyof typeof fieldOptions]
          
          return (
            <div key={fieldName}>
              <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                {fieldName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </label>
              
              {options ? (
                <select
                  value={formData[fieldName] || ''}
                  onChange={(e) => setFormData({ ...formData, [fieldName]: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select...</option>
                  {options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={['priceRange', 'currentRate', 'outstandingLoan', 'propertyValue', 'monthlyIncome', 'existingCommitments'].includes(fieldName) ? 'number' : 'text'}
                  value={formData[fieldName] || ''}
                  onChange={(e) => setFormData({ ...formData, [fieldName]: e.target.value })}
                  placeholder={
                    fieldName === 'email' ? 'user@example.com' :
                    fieldName === 'phone' ? '91234567' :
                    fieldName.includes('Rate') ? '3.5' :
                    fieldName.includes('Range') || fieldName.includes('Value') || fieldName.includes('Loan') || fieldName.includes('Income') || fieldName.includes('Commitments') ? '0' :
                    `Enter ${fieldName}`
                  }
                  step={fieldName.includes('Rate') ? '0.1' : '1'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>
          )
        })}
      </div>
      
      <div className="flex gap-3">
        <button
          onClick={generateJSON}
          className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
        >
          Generate JSON
        </button>
        <button
          onClick={onValidate}
          disabled={!currentInput || isProcessing}
          className={`flex-1 py-2 px-4 rounded-lg font-medium ${
            !currentInput || isProcessing 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isProcessing ? 'Processing...' : 'Validate'}
        </button>
      </div>
      
      {/* Generated JSON Preview - Editable */}
      {currentInput && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Generated JSON (Editable):</h4>
          <textarea
            value={currentInput}
            onChange={(e) => onInputChange(e.target.value)}
            className="w-full h-32 p-3 bg-gray-50 border border-gray-300 rounded text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            placeholder="Generated JSON will appear here..."
          />
        </div>
      )}
    </div>
  )
}

export default function ContextValidationDashboard() {
  const [isMounted, setIsMounted] = useState(false)
  const [input, setInput] = useState<ValidationInput>({
    rawText: '',
    scenario: 'new_purchase'
  })
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [layerResponses, setLayerResponses] = useState<LayerResponse[]>([])
  const [overallAlignment, setOverallAlignment] = useState<number>(0)

  // Prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Sample test data for quick testing
  const sampleInputs = {
    newPurchase: {
      loanType: 'new_purchase',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '91234567',
      propertyType: 'HDB',
      priceRange: 800000,
      purchaseTimeline: 'this_month',
      monthlyIncome: 8000,
      existingCommitments: 2000
    },
    refinance: {
      loanType: 'refinance',
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '98765432',
      currentRate: 4.2,
      outstandingLoan: 500000,
      lockInStatus: 'ending_soon',
      propertyValue: 1000000,
      monthlyIncome: 10000,
      existingCommitments: 3000
    },
    equityLoan: {
      loanType: 'commercial',
      name: 'Bob Chen',
      email: 'bob@example.com',
      phone: '96543210',
      propertyValue: 1500000,
      outstandingLoan: 600000,
      purpose: 'investment',
      monthlyIncome: 15000,
      existingCommitments: 4000
    }
  }

  // Parse raw text input into structured data
  const parseInput = (text: string) => {
    try {
      // Try to parse as JSON first
      return JSON.parse(text)
    } catch {
      // Fallback to parsing key-value pairs
      const parsed: any = {}
      const lines = text.split('\n')
      
      lines.forEach(line => {
        const [key, value] = line.split(':').map(s => s.trim())
        if (key && value) {
          // Try to parse numbers
          if (!isNaN(Number(value))) {
            parsed[key] = Number(value)
          } else {
            parsed[key] = value
          }
        }
      })
      
      return parsed
    }
  }

  // Process input through all layers
  const validateThroughAllLayers = async () => {
    setIsProcessing(true)
    setLayerResponses([])
    
    const parsedData = parseInput(input.rawText)
    const responses: LayerResponse[] = []
    
    // 1. CALCULATIONS LAYER
    try {
      const calcResponse = await validateCalculationsLayer(parsedData)
      responses.push(calcResponse)
    } catch (error) {
      responses.push({
        layer: 'Calculations Layer',
        status: 'error',
        response: null,
        details: [`Error: ${error instanceof Error ? error.message : 'Unknown error'}`],
        gaps: ['Failed to process through calculations layer']
      })
    }
    
    // 2. FORM LAYER
    try {
      const formResponse = await validateFormLayer(parsedData)
      responses.push(formResponse)
    } catch (error) {
      responses.push({
        layer: 'Form Layer',
        status: 'error',
        response: null,
        details: [`Error: ${error instanceof Error ? error.message : 'Unknown error'}`],
        gaps: ['Failed to process through form layer']
      })
    }
    
    // 3. API LAYER
    try {
      const apiResponse = await validateAPILayer(parsedData)
      responses.push(apiResponse)
    } catch (error) {
      responses.push({
        layer: 'API Layer',
        status: 'error',
        response: null,
        details: [`Error: ${error instanceof Error ? error.message : 'Unknown error'}`],
        gaps: ['Failed to process through API layer']
      })
    }
    
    // 4. DOCUMENTATION LAYER
    try {
      const docResponse = await validateDocumentationLayer(parsedData)
      responses.push(docResponse)
    } catch (error) {
      responses.push({
        layer: 'Documentation Layer',
        status: 'error',
        response: null,
        details: [`Error: ${error instanceof Error ? error.message : 'Unknown error'}`],
        gaps: ['Failed to validate against documentation']
      })
    }
    
    // Calculate overall alignment score
    const successCount = responses.filter(r => r.status === 'success').length
    const alignment = (successCount / responses.length) * 100
    
    setLayerResponses(responses)
    setOverallAlignment(alignment)
    setIsProcessing(false)
  }

  // Validate through Calculations Layer
  const validateCalculationsLayer = async (data: any): Promise<LayerResponse> => {
    const details: string[] = []
    const gaps: string[] = []
    const conflicts: string[] = []
    let response: any = {}
    
    try {
      // Test urgency calculation
      const urgencyProfile = calculateUrgencyProfile(data)
      response.urgency = urgencyProfile
      details.push(`Urgency: ${urgencyProfile.level} (${urgencyProfile.score} points)`)
      details.push(`Source: ${urgencyProfile.source}`)
      
      // Test mortgage calculation if applicable
      if (data.loanAmount && data.interestRate && data.loanTerm) {
        const mortgageResult = calculateMortgage({
          loanAmount: data.loanAmount,
          interestRate: data.interestRate,
          loanTerm: data.loanTerm,
          propertyType: data.propertyType
        })
        response.mortgage = mortgageResult
        details.push(`Monthly Payment: $${mortgageResult.monthlyPayment}`)
        
        // Singapore metrics if available
        if (data.propertyValue && data.monthlyIncome) {
          const sgMetrics = calculateSingaporeMetrics(data, mortgageResult.monthlyPayment)
          response.singaporeMetrics = sgMetrics
          details.push(`TDSR: ${sgMetrics.tdsr}% (Limit: ${sgMetrics.tdsrLimit}%)`)
          details.push(`LTV: ${sgMetrics.ltvRatio}% (Limit: ${sgMetrics.ltvLimit}%)`)
          
          if (!sgMetrics.tdsrCompliant) conflicts.push('TDSR non-compliant')
          if (!sgMetrics.ltvCompliant) conflicts.push('LTV exceeds limit')
        }
      }
      
      // Test lead score
      if (data.loanType) {
        const leadScore = calculateLeadScore(data, response.mortgage || {}, false)
        response.leadScore = leadScore
        details.push(`Lead Score: ${leadScore}/100`)
      }
      
      // Test insights generation
      // ARCHIVED: generateMortgageInsights removed (legacy form pattern)
      // const insights = generateMortgageInsights(data, 2)
      // response.insights = insights
      // if (insights.length > 0) {
      //   details.push(`Generated ${insights.length} insights`)
      // } else {
      //   gaps.push('No insights generated from calculation layer')
      // }
      response.insights = []
      details.push('Insights generation: Legacy pattern archived')
      
    } catch (error) {
      throw error
    }
    
    return {
      layer: 'Calculations Layer',
      status: gaps.length > 0 || conflicts.length > 0 ? 'warning' : 'success',
      response,
      details,
      conflicts: conflicts.length > 0 ? conflicts : undefined,
      gaps: gaps.length > 0 ? gaps : undefined,
      source: 'lib/calculations/'
    }
  }

  // Validate through Form Layer
  const validateFormLayer = async (data: any): Promise<LayerResponse> => {
    const details: string[] = []
    const gaps: string[] = []
    const conflicts: string[] = []
    let response: any = {}
    
    // Determine which gate this data would be at
    let currentGate = 0
    
    if (data.loanType) {
      currentGate = 0
      details.push('Gate 0: Loan type selected')
    }
    
    if (data.name && data.email) {
      currentGate = 1
      details.push('Gate 1: Basic identity captured')
    }
    
    if (data.phone && (data.propertyType || data.currentRate || data.propertyValue)) {
      currentGate = 2
      details.push('Gate 2: Contact & core details captured')
      details.push('SUBMISSION POINT: Would trigger n8n G2')
    }
    
    if (data.monthlyIncome) {
      currentGate = 3
      details.push('Gate 3: Financial profile complete')
      details.push('SUBMISSION POINT: Would trigger n8n G3')
    }
    
    response.currentGate = currentGate
    response.gateStatus = {
      0: data.loanType ? 'complete' : 'incomplete',
      1: data.name && data.email ? 'complete' : 'incomplete',
      2: data.phone ? 'complete' : 'incomplete',
      3: data.monthlyIncome ? 'complete' : 'incomplete'
    }
    
    // Check field requirements per gate
    const requiredFields = {
      0: ['loanType'],
      1: ['name', 'email'],
      2: {
        new_purchase: ['phone', 'propertyType', 'priceRange', 'purchaseTimeline'],
        refinance: ['phone', 'currentRate', 'outstandingLoan', 'lockInStatus'],
        commercial: ['phone', 'propertyValue', 'businessType', 'monthlyIncome']
      },
      3: ['monthlyIncome']
    }
    
    // Validate field presence
    if (currentGate >= 2 && data.loanType) {
      const gate2Fields = requiredFields[2][data.loanType as keyof typeof requiredFields[2]]
      if (Array.isArray(gate2Fields)) {
        gate2Fields.forEach(field => {
          if (!data[field]) {
            gaps.push(`Missing required field for Gate 2: ${field}`)
          }
        })
      }
    }
    
    // Check submission strategy compliance
    if (currentGate === 0 || currentGate === 1) {
      details.push('NO API SUBMISSION (per cumulative strategy)')
    } else if (currentGate === 2) {
      details.push('Would submit cumulative data to n8n G2')
    } else if (currentGate === 3) {
      details.push('Would submit all data to n8n G3')
    }
    
    return {
      layer: 'Form Layer',
      status: gaps.length > 0 ? 'warning' : 'success',
      response,
      details,
      gaps: gaps.length > 0 ? gaps : undefined,
      source: 'components/forms/'
    }
  }

  // Validate through API Layer
  const validateAPILayer = async (data: any): Promise<LayerResponse> => {
    const details: string[] = []
    const gaps: string[] = []
    let response: any = {}
    
    // Check if data would pass API validation
    const requiredForAPI = ['loanType']
    const missingRequired = requiredForAPI.filter(field => !data[field])
    
    if (missingRequired.length > 0) {
      gaps.push(`Missing required fields for API: ${missingRequired.join(', ')}`)
    }
    
    // Check urgency enrichment
    if (data.loanType) {
      details.push('Would enrich with urgencyProfile before n8n')
      
      // Check if correct urgency field exists
      const urgencyFields = {
        new_purchase: 'purchaseTimeline',
        refinance: 'lockInStatus',
        commercial: 'businessType'
      }
      
      const expectedField = urgencyFields[data.loanType as keyof typeof urgencyFields]
      if (expectedField && !data[expectedField]) {
        gaps.push(`Missing urgency indicator: ${expectedField}`)
      }
    }
    
    // Check gate detection
    const hasGate2Data = data.phone && (data.propertyType || data.currentRate || data.propertyValue)
    const hasGate3Data = data.monthlyIncome
    
    if (hasGate3Data) {
      response.detectedGate = 'G3'
      details.push('API would route to n8n G3 workflow')
      details.push('Would trigger PDF generation')
      details.push('Would notify broker if score > 70')
    } else if (hasGate2Data) {
      response.detectedGate = 'G2'
      details.push('API would route to n8n G2 workflow')
      details.push('Would return preliminary analysis')
    } else {
      response.detectedGate = 'insufficient'
      details.push('Insufficient data for n8n submission')
      details.push('Would return fallback psychological response')
    }
    
    // Check fallback readiness
    details.push('Fallback mechanism: Ready (generateAlgorithmicInsight)')
    
    return {
      layer: 'API Layer',
      status: gaps.length > 0 ? 'warning' : 'success',
      response,
      details,
      gaps: gaps.length > 0 ? gaps : undefined,
      source: 'app/api/forms/analyze/'
    }
  }

  // Validate against Documentation Layer
  const validateDocumentationLayer = async (data: any): Promise<LayerResponse> => {
    const details: string[] = []
    const conflicts: string[] = []
    let response: any = {}
    
    // Check gate structure compliance
    details.push('Gate Structure (per NEXTNEST_GATE_STRUCTURE_ROUNDTABLE):')
    details.push('- Gate 0: Loan type only (no email)')
    details.push('- Gate 1: Name + Email only')
    details.push('- Gate 2: Phone + loan-specific fields')
    details.push('- Gate 3: Monthly income + commitments')
    
    // Check submission points
    if (data.name && data.email && !data.phone) {
      details.push('✓ Correctly at Gate 1 (no submission)')
    }
    if (data.phone && !data.monthlyIncome) {
      details.push('✓ Correctly at Gate 2 (first submission)')
    }
    if (data.monthlyIncome) {
      details.push('✓ Correctly at Gate 3 (second submission)')
    }
    
    // Check urgency mapping compliance
    if (data.loanType === 'new_purchase' && data.urgency) {
      conflicts.push('Using "urgency" field instead of "purchaseTimeline"')
    }
    if (data.loanType === 'refinance' && data.urgency) {
      conflicts.push('Using "urgency" field instead of "lockInStatus"')
    }
    if (data.loanType === 'commercial' && data.urgency) {
      conflicts.push('Using "urgency" field instead of "purpose"')
    }
    
    // Check MAS compliance requirements
    details.push('MAS Compliance Requirements:')
    details.push('- TDSR: 55% max with 4% stress test')
    details.push('- MSR: 30% for HDB/Private, 35% Commercial')
    details.push('- LTV: Property & citizenship specific')
    
    return {
      layer: 'Documentation Layer',
      status: conflicts.length > 0 ? 'warning' : 'success',
      response,
      details,
      conflicts: conflicts.length > 0 ? conflicts : undefined,
      source: 'Documentation files'
    }
  }

  // Load sample input
  const loadSampleInput = (type: keyof typeof sampleInputs) => {
    const sample = sampleInputs[type]
    setInput({
      rawText: JSON.stringify(sample, null, 2),
      scenario: sample.loanType as any
    })
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-50 border-green-200'
      case 'warning': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'error': return 'text-red-600 bg-red-50 border-red-200'
      case 'processing': return 'text-blue-600 bg-blue-50 border-blue-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  // Get alignment color
  const getAlignmentColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    if (score >= 50) return 'text-orange-600'
    return 'text-red-600'
  }

  // Prevent hydration mismatch by showing loading state until mounted
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-gray-50 py-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse text-gray-600">Loading Context Validation Dashboard...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4">
      <div className="max-w-7xl mx-auto px-4">
        {/* Compact Header - No main navigation */}
        {layerResponses.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-gray-900">Context Validation Results</span>
              <span className={`text-2xl font-bold ${getAlignmentColor(overallAlignment)}`}>
                {overallAlignment.toFixed(0)}% Aligned
              </span>
            </div>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${
                  overallAlignment >= 90 ? 'bg-green-500' :
                  overallAlignment >= 70 ? 'bg-yellow-500' :
                  overallAlignment >= 50 ? 'bg-orange-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${overallAlignment}%` }}
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <FormDataBuilder 
              onDataGenerated={(jsonString) => setInput({ ...input, rawText: jsonString })}
              onValidate={validateThroughAllLayers}
              isProcessing={isProcessing}
              currentInput={input.rawText}
              onInputChange={(text) => setInput({ ...input, rawText: text })}
            />
          </div>

          {/* Output Section */}
          <div className="space-y-4">
            {layerResponses.map((layer, index) => (
              <div key={index} className={`bg-white rounded-lg shadow-sm p-6 border-2 ${getStatusColor(layer.status)}`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold">{layer.layer}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    layer.status === 'success' ? 'bg-green-100 text-green-700' :
                    layer.status === 'warning' ? 'bg-orange-100 text-orange-700' :
                    layer.status === 'error' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {layer.status.toUpperCase()}
                  </span>
                </div>
                
                {layer.source && (
                  <p className="text-xs text-gray-500 mb-2">Source: {layer.source}</p>
                )}
                
                {/* Details */}
                {layer.details.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm font-semibold text-gray-700 mb-1">Response:</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {layer.details.map((detail, i) => (
                        <li key={i} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Conflicts */}
                {layer.conflicts && layer.conflicts.length > 0 && (
                  <div className="mb-3 p-3 bg-orange-50 rounded">
                    <p className="text-sm font-semibold text-orange-700 mb-1">⚠️ Conflicts:</p>
                    <ul className="text-sm text-orange-600 space-y-1">
                      {layer.conflicts.map((conflict, i) => (
                        <li key={i}>{conflict}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Gaps */}
                {layer.gaps && layer.gaps.length > 0 && (
                  <div className="p-3 bg-red-50 rounded">
                    <p className="text-sm font-semibold text-red-700 mb-1">❌ Gaps:</p>
                    <ul className="text-sm text-red-600 space-y-1">
                      {layer.gaps.map((gap, i) => (
                        <li key={i}>{gap}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Response Data (Collapsed) */}
                {layer.response && Object.keys(layer.response).length > 0 && (
                  <details className="mt-3">
                    <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                      View Raw Response
                    </summary>
                    <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-auto">
                      {JSON.stringify(layer.response, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
            
            {layerResponses.length === 0 && !isProcessing && (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center text-gray-500">
                <p className="text-lg font-medium mb-2">No validation results yet</p>
                <p className="text-sm">Enter data and click &quot;Validate Through All Layers&quot; to begin</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}