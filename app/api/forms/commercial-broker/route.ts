import { NextRequest, NextResponse } from 'next/server'

/**
 * Commercial Broker Direct Submission API
 * Routes commercial loan inquiries directly to broker without AI processing
 */

interface CommercialFormData {
  name: string
  email: string
  phone: string
  uen: string
  commercialLoanType: 'new_purchase' | 'refinancing'
  sessionId: string
  timestamp: string
  directToBroker: boolean
}

export async function POST(request: NextRequest) {
  try {
    const data: CommercialFormData = await request.json()
    
    console.log('🏢 Commercial form received:', {
      name: data.name,
      email: data.email,
      phone: data.phone,
      uen: data.uen,
      commercialLoanType: data.commercialLoanType,
      sessionId: data.sessionId,
      timestamp: data.timestamp
    })
    
    // Validate required fields
    if (!data.name || !data.email || !data.phone || !data.uen || !data.commercialLoanType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // Validate UEN format
    const uenRegex = /^[0-9]{9}[A-Z]$/
    if (!uenRegex.test(data.uen)) {
      return NextResponse.json(
        { error: 'Invalid UEN format' },
        { status: 400 }
      )
    }
    
    // In a real implementation, this would:
    // 1. Store in database
    // 2. Send notification to broker
    // 3. Send email confirmation to client
    // 4. Create lead in CRM system
    
    // For now, we'll simulate a successful submission
    const response = {
      success: true,
      referenceId: `COM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      message: 'Your commercial loan inquiry has been submitted successfully',
      details: {
        brokerAssigned: true,
        expectedResponse: '24 hours',
        directRouting: true,
        aiProcessing: false,
        loanType: data.commercialLoanType,
        submittedAt: data.timestamp
      }
    }
    
    // Log for tracking
    console.log('✅ Commercial form processed:', {
      referenceId: response.referenceId,
      loanType: data.commercialLoanType,
      uen: data.uen
    })
    
    // Send webhook to n8n or broker system (if configured)
    if (process.env.COMMERCIAL_BROKER_WEBHOOK_URL) {
      try {
        await fetch(process.env.COMMERCIAL_BROKER_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...data,
            referenceId: response.referenceId,
            submittedAt: new Date().toISOString(),
            source: 'nextnest_commercial_form'
          })
        })
        console.log('📤 Webhook sent to broker system')
      } catch (webhookError) {
        console.error('❌ Webhook error (non-fatal):', webhookError)
        // Don't fail the request if webhook fails
      }
    }
    
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('❌ Error processing commercial form:', error)
    return NextResponse.json(
      { 
        error: 'Failed to process commercial form',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}