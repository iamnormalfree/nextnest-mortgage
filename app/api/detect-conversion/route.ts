import { NextRequest, NextResponse } from 'next/server'

/**
 * Conversion detection endpoint for Chatwoot bot
 * Analyzes conversation signals to determine if human handoff is needed
 */
export async function POST(request: NextRequest) {
  try {
    const { message, messageCount, leadScore } = await request.json();
    
    // High-intent keywords that signal conversion readiness
    const conversionSignals = [
      'schedule', 'appointment', 'call', 'speak to someone', 
      'human', 'agent', 'when can we meet', 'contact',
      'ready to proceed', 'next steps', 'sign up'
    ];
    
    // Check for conversion signals in message
    const hasSignal = conversionSignals.some(signal => 
      message.toLowerCase().includes(signal)
    );
    
    // Business logic for transfer decision
    const shouldTransfer = 
      hasSignal || // Explicit request
      (messageCount > 15 && leadScore >= 75) || // High-value lead engaged
      messageCount > 20; // Long conversation
    
    // Calculate confidence score
    let confidence = 0.1;
    if (hasSignal) confidence = 0.9;
    else if (messageCount > 15 && leadScore >= 75) confidence = 0.7;
    else if (messageCount > 20) confidence = 0.6;
    
    return NextResponse.json({
      shouldTransfer,
      confidence,
      reason: hasSignal ? 'explicit_request' : 
              messageCount > 15 ? 'high_engagement' : 
              'normal_flow',
      suggestedAction: shouldTransfer ? 'transfer_to_human' : 'continue_bot'
    });
    
  } catch (error) {
    console.error('Error detecting conversion:', error);
    return NextResponse.json(
      { error: 'Failed to analyze conversion signals' },
      { status: 500 }
    );
  }
}