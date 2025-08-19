import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, loanAmount, propertyType, message } = body

    // Basic validation
    if (!name || !email || !phone || !loanAmount || !propertyType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Here you would typically:
    // 1. Save to database
    // 2. Send email notification
    // 3. Integrate with CRM
    
    // For now, just log the submission
    console.log('New lead submission:', {
      name,
      email,
      phone,
      loanAmount,
      propertyType,
      message,
      timestamp: new Date().toISOString()
    })

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    return NextResponse.json(
      { 
        success: true, 
        message: 'Form submitted successfully',
        leadId: `lead_${Date.now()}`
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Error processing contact form:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
