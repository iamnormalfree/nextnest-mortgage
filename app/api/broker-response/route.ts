import { NextRequest, NextResponse } from 'next/server'
import { FirstMessageGenerator } from '@/lib/ai/first-message-templates'

/**
 * AI Broker Response Generator
 * Enhanced with context-aware first messages
 * Called by Chatwoot bot to generate contextual responses based on lead profile
 */
export async function POST(request: NextRequest) {
  try {
    const {
      message,
      leadScore,
      brokerPersona,
      propertyType,
      budget,
      loanAmount,
      monthlyIncome,
      timeline,
      firstName,
      conversationId,
      messageCount = 1,
      isFirstMessage = false,
      customAttributes = {}
    } = await request.json();

    console.log('🤖 Generating broker response for:', { conversationId, brokerPersona, leadScore, isFirstMessage });

    // Detect if this is an initial context message
    const isInitialContext = isFirstMessage || 
                             message === 'INITIAL_CONTEXT' || 
                             message === '__start__' ||
                             messageCount === 1;

    // Fetch current market data for context
    const marketData = await getMarketData();
    
    // Generate persona-specific response
    const response = await generateBrokerResponse({
      message,
      leadScore: parseInt(leadScore) || 50,
      brokerPersona: brokerPersona || 'balanced',
      propertyType,
      budget: parseFloat(budget) || 0,
      loanAmount: parseFloat(loanAmount) || 0,
      monthlyIncome: parseFloat(monthlyIncome) || 0,
      timeline,
      firstName,
      marketData,
      messageCount: parseInt(messageCount) || 1,
      isInitialContext,
      customAttributes
    });

    // Check if we should recommend human handoff
    const shouldTransfer = checkTransferSignals(message, parseInt(messageCount), parseInt(leadScore));

    return NextResponse.json({
      response,
      shouldTransfer,
      marketData: {
        currentRates: marketData.summary,
        bestRate: marketData.bestRate
      },
      metadata: {
        responseType: getResponseType(brokerPersona, messageCount),
        confidence: 0.95,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error generating broker response:', error);
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
}

/**
 * Get current market data
 */
async function getMarketData() {
  // In production, fetch from actual sources
  const rates = {
    dbs: { fixed2yr: 3.75, fixed3yr: 3.65, floating: 4.25 },
    ocbc: { fixed2yr: 3.70, fixed3yr: 3.60, floating: 4.20 },
    uob: { fixed2yr: 3.72, fixed3yr: 3.62, floating: 4.22 }
  };

  const bestRate = Math.min(
    rates.dbs.fixed2yr,
    rates.ocbc.fixed2yr,
    rates.uob.fixed2yr
  );

  return {
    rates,
    bestRate,
    fedRate: 5.5,
    soraRate: 3.67,
    summary: `Current best 2-year fixed rate: ${bestRate}% (market stable)`
  };
}

/**
 * Generate broker response based on persona and context
 */
async function generateBrokerResponse(context: any) {
  const {
    message,
    leadScore,
    brokerPersona,
    propertyType,
    budget,
    loanAmount,
    monthlyIncome,
    timeline,
    firstName,
    marketData,
    messageCount,
    isInitialContext,
    customAttributes
  } = context;

  // Define persona characteristics
  const personas = {
    aggressive: {
      tone: 'urgent and opportunity-focused',
      style: 'direct, emphasizing time-sensitivity and exclusive deals',
      focus: 'closing quickly, FOMO, competitive advantage',
      opener: messageCount === 1 ? 
        `Hi ${firstName}! Great timing - rates just dropped and I have exclusive access to deals not publicly listed. With your score of ${leadScore}/100, you qualify for premium rates.` :
        null
    },
    balanced: {
      tone: 'professional and informative',
      style: 'educational, providing clear options and comparisons',
      focus: 'building trust, explaining benefits, steady guidance',
      opener: messageCount === 1 ?
        `Hello ${firstName}, thank you for reaching out. Based on your profile (score: ${leadScore}/100), I can help you navigate the best mortgage options for your ${propertyType}.` :
        null
    },
    conservative: {
      tone: 'patient and educational',
      style: 'supportive, no-pressure, focusing on understanding',
      focus: 'education, long-term relationships, comfort building',
      opener: messageCount === 1 ?
        `Welcome ${firstName}! I'm here to help you understand your mortgage options. No rush - let's explore what works best for your situation.` :
        null
    }
  };

  const persona = personas[brokerPersona as keyof typeof personas] || personas.balanced;

  // First message (conversation opener) - Use enhanced template system
  if (isInitialContext || messageCount === 1) {
    const messageGenerator = new FirstMessageGenerator()
    
    // Build context for first message
    const firstMessageContext = {
      formData: {
        name: firstName || 'there',
        loanType: propertyType || 'property',
        propertyCategory: propertyType?.toLowerCase(),
        monthlyIncome: monthlyIncome || 5000,
        employmentType: 'employed', // Default, should be passed in context
        purchaseTimeline: timeline || 'flexible'
      },
      leadScore,
      brokerPersona: {
        type: brokerPersona as 'aggressive' | 'balanced' | 'conservative',
        name: brokerPersona === 'aggressive' ? 'Michelle Chen' :
              brokerPersona === 'conservative' ? 'Grace Lim' : 'Sarah Wong',
        approach: persona.focus,
        urgencyLevel: leadScore >= 75 ? 'high' : leadScore >= 45 ? 'medium' : 'low'
      },
      calculatedInsights: messageGenerator.calculateInsights({
        actualIncomes: [monthlyIncome],
        loanType: propertyType,
        propertyCategory: propertyType?.toLowerCase()
      }, leadScore)
    }
    
    // Add market data to insights
    firstMessageContext.calculatedInsights.currentBestRate = marketData.bestRate
    firstMessageContext.calculatedInsights.marketSummary = marketData.summary
    
    return messageGenerator.generatePersonalizedGreeting(firstMessageContext)
  }

  // Analyze user message intent
  const intent = analyzeIntent(message);
  
  // Generate contextual response
  let response = '';

  switch (intent) {
    case 'rates':
      response = generateRatesResponse(persona, marketData, budget, loanAmount);
      break;
    
    case 'affordability':
      response = generateAffordabilityResponse(persona, monthlyIncome, budget);
      break;
    
    case 'timeline':
      response = generateTimelineResponse(persona, timeline, marketData);
      break;
    
    case 'comparison':
      response = generateComparisonResponse(persona, marketData);
      break;
    
    case 'qualification':
      response = generateQualificationResponse(persona, leadScore, monthlyIncome);
      break;
    
    default:
      response = generateGeneralResponse(persona, leadScore, propertyType, marketData);
  }

  // Add persona-specific closing based on message count
  if (messageCount > 3 && leadScore >= 75 && brokerPersona === 'aggressive') {
    response += '\n\n⚡ Special: I can lock in today\'s rate for you right now. Shall we proceed?';
  } else if (messageCount > 5 && brokerPersona === 'balanced') {
    response += '\n\nWould you like me to prepare a detailed comparison for your specific situation?';
  }

  return response;
}

/**
 * Analyze user message intent
 */
function analyzeIntent(message: string): string {
  const lower = message.toLowerCase();
  
  if (lower.includes('rate') || lower.includes('interest')) return 'rates';
  if (lower.includes('afford') || lower.includes('qualify')) return 'affordability';
  if (lower.includes('when') || lower.includes('how long') || lower.includes('timeline')) return 'timeline';
  if (lower.includes('compare') || lower.includes('which bank')) return 'comparison';
  if (lower.includes('eligible') || lower.includes('qualify')) return 'qualification';
  
  return 'general';
}

/**
 * Generate rates-specific response
 */
function generateRatesResponse(persona: any, marketData: any, budget: number, loanAmount: number) {
  const monthly = calculateMonthlyPayment(loanAmount || budget * 0.75, marketData.bestRate);
  
  if (persona.style.includes('urgent')) {
    return `📊 EXCLUSIVE RATES (Limited Time):\n\n` +
           `Best 2-year fixed: ${marketData.bestRate}%\n` +
           `Your estimated payment: $${monthly.toFixed(0)}/month\n\n` +
           `⚡ These rates expire in 48 hours. I can lock this in for you TODAY.`;
  }
  
  return `Based on current market conditions:\n\n` +
         `• 2-year fixed rates: ${marketData.bestRate}% - ${marketData.bestRate + 0.1}%\n` +
         `• 3-year fixed rates: ${marketData.bestRate - 0.1}% - ${marketData.bestRate}%\n` +
         `• Your estimated payment: $${monthly.toFixed(0)}/month\n\n` +
         `Would you like a detailed breakdown for your specific loan amount?`;
}

/**
 * Generate affordability response
 */
function generateAffordabilityResponse(persona: any, monthlyIncome: number, budget: number) {
  const maxLoan = monthlyIncome * 0.3 * 12 * 20; // Simplified TDSR calculation
  const affordable = Math.min(maxLoan, budget);
  
  if (persona.style.includes('direct')) {
    return `💰 YOUR BUYING POWER:\n\n` +
           `Maximum loan: $${(affordable/1000).toFixed(0)}K\n` +
           `Safe monthly payment: $${(monthlyIncome * 0.3).toFixed(0)}\n\n` +
           `You're in a STRONG position. Let's maximize your leverage!`;
  }
  
  return `Based on your income of $${monthlyIncome}:\n\n` +
         `• Recommended loan amount: $${(affordable/1000).toFixed(0)}K\n` +
         `• Comfortable monthly payment: $${(monthlyIncome * 0.3).toFixed(0)}\n` +
         `• This keeps you within healthy debt ratios\n\n` +
         `Would you like to explore properties in this range?`;
}

/**
 * Generate timeline response
 */
function generateTimelineResponse(persona: any, timeline: string, marketData: any) {
  if (persona.style.includes('urgent')) {
    return `⏰ TIME IS CRITICAL!\n\n` +
           `Rates are at ${marketData.bestRate}% NOW but Fed meeting next month could change everything.\n\n` +
           `My fast-track process:\n` +
           `Day 1-2: Pre-approval\n` +
           `Day 3-5: Property selection\n` +
           `Day 6-14: Full approval\n\n` +
           `Start TODAY to secure current rates!`;
  }
  
  return `For your ${timeline} timeline:\n\n` +
         `Week 1: Documentation & pre-approval\n` +
         `Week 2-3: Property search & selection\n` +
         `Week 3-4: Formal application\n` +
         `Week 5-6: Approval & completion\n\n` +
         `Current market conditions are favorable. Shall we begin with pre-approval?`;
}

/**
 * Generate comparison response
 */
function generateComparisonResponse(persona: any, marketData: any) {
  if (persona.style.includes('direct')) {
    return `🏆 TOP 3 DEALS RIGHT NOW:\n\n` +
           `1. DBS: ${marketData.rates.dbs.fixed2yr}% (Quick approval)\n` +
           `2. OCBC: ${marketData.rates.ocbc.fixed2yr}% (Flexible terms)\n` +
           `3. UOB: ${marketData.rates.uob.fixed2yr}% (Cash rebate)\n\n` +
           `I have EXCLUSIVE rates with DBS. Want me to secure this?`;
  }
  
  return `Current market comparison:\n\n` +
         `DBS: ${marketData.rates.dbs.fixed2yr}% fixed (2-year)\n` +
         `OCBC: ${marketData.rates.ocbc.fixed2yr}% fixed (2-year)\n` +
         `UOB: ${marketData.rates.uob.fixed2yr}% fixed (2-year)\n\n` +
         `Each bank has different strengths. Would you like personalized recommendations based on your profile?`;
}

/**
 * Generate qualification response
 */
function generateQualificationResponse(persona: any, leadScore: number, monthlyIncome: number) {
  const qualification = leadScore >= 75 ? 'excellent' : leadScore >= 50 ? 'good' : 'developing';
  
  if (persona.style.includes('urgent')) {
    return `✅ QUALIFICATION STATUS: ${qualification.toUpperCase()}\n\n` +
           `Your score: ${leadScore}/100\n` +
           `Income: $${monthlyIncome} ✓\n\n` +
           `You qualify for PREMIUM packages. Let's move fast before requirements change!`;
  }
  
  return `Your qualification status: ${qualification}\n\n` +
         `• Lead score: ${leadScore}/100\n` +
         `• Monthly income: $${monthlyIncome}\n` +
         `• This positions you well for competitive rates\n\n` +
         `Would you like to know which banks are most likely to approve your application?`;
}

/**
 * Generate general response
 */
function generateGeneralResponse(persona: any, leadScore: number, propertyType: string, marketData: any) {
  if (persona.style.includes('direct')) {
    return `With your profile (score: ${leadScore}), you're looking at premium rates starting from ${marketData.bestRate}% for your ${propertyType}.\n\n` +
           `The market is moving fast. What's your biggest concern right now?`;
  }
  
  return `I understand you're exploring mortgage options for your ${propertyType}. ` +
         `With current rates at ${marketData.bestRate}%, it's a good time to explore your options.\n\n` +
         `What aspect would you like to discuss first - rates, affordability, or the application process?`;
}

/**
 * Calculate simple monthly payment
 */
function calculateMonthlyPayment(principal: number, annualRate: number): number {
  const monthlyRate = annualRate / 100 / 12;
  const numPayments = 30 * 12; // 30-year loan
  
  if (monthlyRate === 0) return principal / numPayments;
  
  return principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
         (Math.pow(1 + monthlyRate, numPayments) - 1);
}

/**
 * Check if conversation should transfer to human
 */
function checkTransferSignals(message: string, messageCount: number, leadScore: number): boolean {
  const transferKeywords = [
    'speak to someone', 'human', 'agent', 'call me',
    'schedule', 'appointment', 'meet', 'visit',
    'ready to proceed', 'sign', 'apply now'
  ];
  
  const hasKeyword = transferKeywords.some(keyword => 
    message.toLowerCase().includes(keyword)
  );
  
  // Transfer logic based on engagement and lead quality
  return hasKeyword || 
         (messageCount > 10 && leadScore >= 75) || 
         messageCount > 20;
}

/**
 * Determine response type for metadata
 */
function getResponseType(persona: string, messageCount: number): string {
  if (messageCount === 1) return 'greeting';
  if (messageCount < 5) return 'discovery';
  if (messageCount < 10) return 'nurturing';
  return 'conversion';
}