import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { ChatwootClient, ProcessedLeadData } from '@/lib/integrations/chatwoot-client'
import { calculateBrokerPersona } from '@/lib/calculations/broker-persona'
import { getChatwootCircuitBreaker, ChatwootCircuitBreaker } from '@/lib/patterns/circuit-breaker'
import { dataSanitizer } from '@/lib/security/data-sanitization'
import { auditLogger } from '@/lib/security/audit-logger'
import { brokerEngagementManager } from '@/lib/engagement/broker-engagement-manager'
import { getConversationDeduplicator } from '@/lib/integrations/conversation-deduplication'
import { queueNewConversation } from '@/lib/queue/broker-queue'
import { shouldUseBullMQ, logMigrationDecision } from '@/lib/utils/migration-control'

// Request validation schema matching ProgressiveForm Step 3 data
const chatwootConversationSchema = z.object({
  formData: z.object({
    // Step 1 fields
    name: z.string().min(2).max(100),
    email: z.string().email(),
    phone: z.string().regex(/^(\+65)?[\s]?[689][\s]?\d{3}[\s]?\d{4}$/),  // Accept various Singapore phone formats
    
    // Loan type and property details from Step 2
    loanType: z.enum(['new_purchase', 'refinance', 'commercial']),
    propertyCategory: z.enum(['resale', 'new_launch', 'bto', 'commercial']).optional(),
    propertyType: z.string().optional(),
    propertyPrice: z.number().optional(),
    
    // Step 3 fields - Income and employment
    actualAges: z.array(z.number().min(21).max(100)).optional().default([]),
    actualIncomes: z.array(z.number().min(0)).optional().default([]),
    // Employment type is required for new_purchase, optional for refinance
    employmentType: z.enum(['employed', 'self-employed', 'recently-changed', 'not-working']).optional().default('employed'),
    
    // Optional fields
    existingCommitments: z.number().optional(),
    creditCardCount: z.string().optional(),
    applicantType: z.enum(['single', 'joint']).optional(),
    
    // Co-applicant fields (optional for joint applications)
    coApplicantEmployment: z.string().optional(),
    coApplicantCommitments: z.number().optional(),
    coApplicantCreditCards: z.string().optional(),
    
    // Refinance specific fields
    hasExistingLoan: z.boolean().optional(),
    existingLoanDetails: z.object({
      outstandingAmount: z.number(),
      monthlyPayment: z.number(),
      remainingTenure: z.number(),
      currentRate: z.number().optional()
    }).optional(),
    lockInStatus: z.enum(['no_lock', 'ending_soon', 'locked', 'not_sure']).optional(),
    refinancingGoals: z.array(z.string()).optional(),
    propertyValue: z.number().optional(),
    yearsInProperty: z.number().optional(),
    outstandingLoan: z.number().optional(),
    
    // Commercial specific fields
    commercialPropertyType: z.string().optional(),
    purchaseStructure: z.enum(['personal', 'company']).optional()
  }),
  sessionId: z.string(),
  leadScore: z.number().min(0).max(100)
})

// Response interface
interface ChatwootConversationResponse {
  success: boolean
  conversationId: number
  widgetConfig: {
    baseUrl: string
    websiteToken: string
    conversationId: number
    locale: 'en'
    position: 'right'
    hideMessageBubble: boolean
    customAttributes: object
  }
  error?: string
  fallback?: {
    type: 'phone' | 'email' | 'form'
    contact: string
    message: string
  }
}

/**
 * Creates a Chatwoot conversation with lead context
 * Called after form completion to transfer lead to AI broker
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json()

    // Check if Chatwoot is properly configured
    const isChatwootConfigured = !!(
      process.env.CHATWOOT_API_TOKEN &&
      process.env.CHATWOOT_BASE_URL &&
      process.env.CHATWOOT_ACCOUNT_ID &&
      process.env.CHATWOOT_INBOX_ID
    )

    if (!isChatwootConfigured) {
      console.warn('⚠️ Chatwoot not fully configured, returning fallback response')
      console.log('🔧 Missing Chatwoot config:', {
        baseUrl: process.env.CHATWOOT_BASE_URL ? '✓' : '✗ (CHATWOOT_BASE_URL)',
        apiToken: process.env.CHATWOOT_API_TOKEN ? '✓' : '✗ (CHATWOOT_API_TOKEN)',
        accountId: process.env.CHATWOOT_ACCOUNT_ID ? '✓' : '✗ (CHATWOOT_ACCOUNT_ID)',
        inboxId: process.env.CHATWOOT_INBOX_ID ? '✓' : '✗ (CHATWOOT_INBOX_ID)',
        websiteToken: process.env.CHATWOOT_WEBSITE_TOKEN ? '✓' : '✗ (CHATWOOT_WEBSITE_TOKEN)'
      })

      // Return a proper fallback response instead of 503
      return NextResponse.json({
        success: false,
        conversationId: 0,
        widgetConfig: {
          baseUrl: '',
          websiteToken: '',
          conversationId: 0,
          locale: 'en' as const,
          position: 'right' as const,
          hideMessageBubble: true,
          customAttributes: {}
        },
        fallback: {
          type: 'phone',
          contact: process.env.CHAT_FALLBACK_PHONE || '+6583341445',
          message: 'Chat service is being configured. Please call us for immediate assistance.'
        }
      }, { status: 200 }) // Return 200 with fallback instead of 503
    }

    const validatedData = chatwootConversationSchema.parse(body)
    const { formData, sessionId, leadScore } = validatedData
    
    // Sanitize form data for security and PDPA compliance
    const sanitizedData = dataSanitizer.sanitizeForChatwoot(formData)
    
    // Check for suspicious patterns
    if (sanitizedData.sanitizationReport?.securityFlags.includes('suspicious_pattern_detected')) {
      await auditLogger.logSuspiciousActivity(
        sessionId,
        'suspicious_form_submission',
        sanitizedData.sanitizationReport,
        request
      )
      
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid form data detected',
          fallback: {
            type: 'phone',
            contact: process.env.CHAT_FALLBACK_PHONE || '+65 8334 1445',
            message: 'For security reasons, please contact us directly.'
          }
        },
        { status: 400 }
      )
    }
    
    console.log('🚀 Creating Chatwoot conversation:', {
      sessionId,
      leadScore,
      loanType: sanitizedData.loanType,
      name: sanitizedData.name,
      sanitized: (sanitizedData.sanitizationReport?.fieldsModified?.length ?? 0) > 0
    })
    
    // Calculate broker persona based on lead score and sanitized data
    const brokerPersona = calculateBrokerPersona(leadScore, sanitizedData)
    console.log('🧠 DEBUG: Calculated broker persona:', {
      leadScore,
      personaType: brokerPersona.type,
      personaName: brokerPersona.name,
      personaApproach: brokerPersona.approach
    })
    
    // Prepare lead data for Chatwoot using sanitized data
    const processedLeadData: ProcessedLeadData = {
      name: sanitizedData.name,
      email: sanitizedData.email,
      phone: sanitizedData.phone,
      loanType: sanitizedData.loanType,
      propertyCategory: sanitizedData.propertyCategory || formData.propertyCategory,
      propertyType: formData.propertyType,
      actualIncomes: formData.actualIncomes,
      actualAges: formData.actualAges,
      employmentType: sanitizedData.employmentType || formData.employmentType,
      leadScore,
      sessionId,
      brokerPersona,
      existingCommitments: formData.existingCommitments,
      propertyPrice: formData.propertyPrice || formData.propertyValue
    }
    
    try {
      // Get circuit breaker instance
      const circuitBreaker = getChatwootCircuitBreaker()

      // Log circuit breaker status
      console.log('🔌 Circuit breaker status:', circuitBreaker.getStats())

      // Initialize Chatwoot client outside circuit breaker
      const chatwootClient = new ChatwootClient()

      // Execute with circuit breaker protection
      const conversation = await circuitBreaker.execute(async () => {
        // Log environment variables for debugging
        console.log('🔧 Checking Chatwoot env vars:', {
          baseUrl: process.env.CHATWOOT_BASE_URL ? '✓' : '✗',
          apiToken: process.env.CHATWOOT_API_TOKEN ? '✓' : '✗',
          accountId: process.env.CHATWOOT_ACCOUNT_ID ? '✓' : '✗',
          inboxId: process.env.CHATWOOT_INBOX_ID ? '✓' : '✗',
          websiteToken: process.env.CHATWOOT_WEBSITE_TOKEN ? '✓' : '✗'
        })

        // STEP 1: Create or update contact first
        const contact = await chatwootClient.createOrUpdateContact({
          name: processedLeadData.name,
          email: processedLeadData.email,
          phone: processedLeadData.phone,
          customAttributes: {
            lead_score: processedLeadData.leadScore,
            loan_type: processedLeadData.loanType,
            employment_type: processedLeadData.employmentType,
            property_category: processedLeadData.propertyCategory,
            session_id: processedLeadData.sessionId,
            last_submission: new Date().toISOString()
          }
        })

        console.log('✅ Contact ready:', contact.id)

        // STEP 2: Check for existing conversation to reuse
        const deduplicator = getConversationDeduplicator(chatwootClient)
        const dedupeResult = await deduplicator.checkForExistingConversation(
          contact.id,
          processedLeadData.loanType
        )

        console.log('🔍 Deduplication check:', dedupeResult)

        // STEP 3: Reuse or create conversation
        if (!dedupeResult.shouldCreateNew && dedupeResult.existingConversationId) {
          // Reuse existing conversation
          console.log(`♻️ Reusing existing conversation: ${dedupeResult.existingConversationId}`)

          // CRITICAL: Update conversation attributes with GUARANTEED conversation_status for n8n workflow
          // This MUST be set before any user messages trigger webhooks
          await chatwootClient.updateConversationCustomAttributes(
            dedupeResult.existingConversationId,
            {
              last_resubmission: new Date().toISOString(),
              submission_count: (contact.custom_attributes?.submission_count || 0) + 1,
              lead_score: processedLeadData.leadScore,
              conversation_status: 'bot',  // CRITICAL: Reset to 'bot' status for n8n AI workflow filter
              ai_broker_name: processedLeadData.brokerPersona.name,  // Ensure broker context preserved
              loan_type: processedLeadData.loanType  // Ensure loan_type preserved for workflow
            }
          )

          console.log(`✅ Conversation ${dedupeResult.existingConversationId} attributes updated with conversation_status: 'bot'`)

          // Return existing conversation structure with REOPEN flag
          return {
            id: dedupeResult.existingConversationId,
            account_id: parseInt(chatwootClient.apiAccountId),
            inbox_id: chatwootClient.apiInboxId,
            contact_id: contact.id,
            status: 'bot',
            custom_attributes: {
              reused: true,
              reuse_reason: dedupeResult.reason,
              is_conversation_reopen: true  // NEW FLAG to prevent duplicate greetings
            }
          }
        }

        // Create new conversation (existing logic)
        return await chatwootClient.createConversation(processedLeadData, true)
      })

      console.log('✅ Chatwoot conversation ready:', conversation.id)

      // CHECK: Skip broker engagement sequence if conversation is being reopened
      const isConversationReopen = conversation.custom_attributes?.is_conversation_reopen === true

      if (isConversationReopen) {
        console.log('♻️ Conversation reopen detected - skipping broker engagement sequence to prevent duplicate messages')
        console.log('   Conversation will remain in existing state with assigned broker')
      }

      // PHASE 3: BullMQ Integration with gradual migration control
      // Check if this conversation should use BullMQ or existing broker engagement manager
      let useBullMQ = shouldUseBullMQ(leadScore)

      logMigrationDecision(
        conversation.id,
        useBullMQ,
        useBullMQ
          ? 'Selected for BullMQ based on rollout percentage'
          : 'Using existing broker engagement manager',
        leadScore
      )

      let engagementResult: any = null

      if (!isConversationReopen) {
        if (useBullMQ) {
          // NEW PATH: Queue conversation in BullMQ for processing
          console.log('📋 Queueing conversation via BullMQ...')

          try {
            await queueNewConversation({
              conversationId: conversation.id,
              contactId: conversation.contact_id || 0,
              processedLeadData,
              isConversationReopen: false,
              skipGreeting: false
            })

            console.log('✅ Conversation queued in BullMQ successfully')

            // Set placeholder engagement result for BullMQ
            // Actual broker assignment happens asynchronously in worker
            engagementResult = {
              status: 'queued',
              queuePosition: null,
              broker: null,
              message: 'Conversation queued for AI broker assignment'
            }
          } catch (bullmqError) {
            console.error('❌ Failed to queue conversation in BullMQ:', bullmqError)
            console.log('⚠️ Falling back to existing broker engagement manager')

            // FALLBACK: Use existing system if BullMQ fails
            useBullMQ = false // Disable for this request
          }
        }

        // EXISTING PATH: Use broker engagement manager
        // This runs if: (1) Not selected for BullMQ, or (2) BullMQ failed
        if (!useBullMQ) {
          console.log('🔍 DEBUG: Starting broker engagement orchestrator:', {
            leadScore,
            loanType: sanitizedData.loanType,
            propertyCategory: sanitizedData.propertyCategory || 'resale',
            monthlyIncome: formData.actualIncomes?.[0] || 0,
            timeline: formData.loanType === 'refinance' ? 'immediate' : 'soon',
            conversationId: conversation.id
          })

          engagementResult = await brokerEngagementManager.handleNewConversation({
            conversationId: conversation.id,
            leadScore,
            loanType: sanitizedData.loanType,
            propertyCategory: sanitizedData.propertyCategory || 'resale',
            monthlyIncome: formData.actualIncomes?.[0] || 0,
            timeline: formData.loanType === 'refinance' ? 'immediate' : 'soon',
            processedLeadData,
            sessionId
          })
        }
      }

      let assignedBroker: any = null
      let queuePosition: number | null = null
      let leadStatus = 'queued'
      let leadStatusReason = 'All brokers busy'

      // For reopened conversations, retrieve existing broker assignment
      if (isConversationReopen) {
        // Try to get existing broker from conversation attributes
        const existingBrokerName = conversation.custom_attributes?.ai_broker_name
        const existingBrokerId = conversation.custom_attributes?.ai_broker_id
        const existingBrokerPersonality = conversation.custom_attributes?.broker_persona

        if (existingBrokerName && existingBrokerId) {
          assignedBroker = {
            id: existingBrokerId,
            name: existingBrokerName,
            personality_type: existingBrokerPersonality || 'balanced'
          }
          leadStatus = 'assigned'
          leadStatusReason = `Previously assigned to ${existingBrokerName}`

          console.log('♻️ Reusing existing broker assignment:', {
            id: assignedBroker.id,
            name: assignedBroker.name,
            personality: assignedBroker.personality_type
          })
        }
      } else if (engagementResult && engagementResult.status === 'assigned') {
        assignedBroker = engagementResult.broker
        leadStatus = 'assigned'
        leadStatusReason = `Assigned to ${assignedBroker.name}`

        // CRITICAL FIX: Update processedLeadData.brokerPersona to match assigned broker
        // This ensures API response and future operations use the CORRECT broker
        processedLeadData.brokerPersona = {
          ...processedLeadData.brokerPersona,
          name: assignedBroker.name,
          type: (assignedBroker.personality_type as "aggressive" | "balanced" | "conservative") || processedLeadData.brokerPersona.type
        }

        console.log('✅ Broker assignment successful:', {
          id: assignedBroker.id,
          name: assignedBroker.name,
          personality: assignedBroker.personality_type,
          joinEtaSeconds: engagementResult.joinEtaSeconds
        })
      } else if (engagementResult && engagementResult.status === 'queued') {
        queuePosition = engagementResult.queuePosition
        console.log('⏳ All AI brokers busy – conversation queued for next availability', { queuePosition })
        await chatwootClient.updateConversationCustomAttributes(conversation.id, {
          broker_status: 'queued',
          broker_queue_position: queuePosition
        })
      }

      // Get widget configuration
      const widgetConfig = chatwootClient.getWidgetConfig(conversation.id)
      
      // Log successful conversation creation for PDPA compliance
      await auditLogger.logFormToChatTransition(
        sessionId,
        sanitizedData,
        conversation.id,
        request
      )
      
      // Return successful response with widget config
      const response: ChatwootConversationResponse = {
        success: true,
        conversationId: conversation.id,
        widgetConfig: {
          ...widgetConfig,
          customAttributes: {
            // Core attributes for broker assignment
            lead_score: leadScore,
            loan_type: sanitizedData.loanType,
            property_category: sanitizedData.propertyCategory || 'resale',
            monthly_income: formData.actualIncomes?.[0] || 0,
            purchase_timeline: formData.loanType === 'refinance' ? 'immediate' : 'soon',

            // Add reuse indicator if applicable
            conversation_reused: conversation.custom_attributes?.reused || false,
            reuse_reason: conversation.custom_attributes?.reuse_reason,

            // Broker assignment metadata from Supabase
            ai_broker_id: assignedBroker?.id || '',
            ai_broker_name: assignedBroker?.name || brokerPersona.name,
            broker_persona: assignedBroker?.personality_type || brokerPersona.type,
            broker_slug: assignedBroker?.slug || '',
            broker_status: leadStatus,
            broker_join_eta: engagementResult.status === 'assigned' ? engagementResult.joinEtaSeconds : undefined,
            broker_queue_position: queuePosition ?? undefined,
            session_id: sessionId,

            // Additional context for AI conversations
            employment_type: sanitizedData.employmentType,
            property_price: formData.propertyPrice || formData.propertyValue || 0,
            existing_commitments: formData.existingCommitments || 0,
            applicant_ages: formData.actualAges,

            // Bot status to trigger n8n workflow
            status: 'bot'
          }
        }
      }
      
      return NextResponse.json(response)
      
    } catch (chatwootError: any) {
      console.error('⚠️ Chatwoot API error:', chatwootError?.message || chatwootError)
      
      // Check if circuit breaker triggered
      if (chatwootError?.message?.includes('Circuit breaker')) {
        console.log('🚫 Circuit breaker is OPEN - returning fallback')
        const fallback = ChatwootCircuitBreaker.fallbackResponse()
        return NextResponse.json({
          ...fallback,
          conversationId: 0,
          widgetConfig: {
            baseUrl: '',
            websiteToken: '',
            conversationId: 0,
            locale: 'en' as const,
            position: 'right' as const,
            hideMessageBubble: true,
            customAttributes: {}
          }
        }, { status: 503 })
      }
      
      // Return fallback response for other Chatwoot failures
      const fallbackResponse: ChatwootConversationResponse = {
        success: false,
        conversationId: 0,
        widgetConfig: {
          baseUrl: '',
          websiteToken: '',
          conversationId: 0,
          locale: 'en',
          position: 'right',
          hideMessageBubble: true,
          customAttributes: {}
        },
        fallback: {
          type: 'phone',
          contact: process.env.CHAT_FALLBACK_PHONE || '+6583341445',
          message: 'Chat temporarily unavailable. Please call us directly for immediate assistance.'
        }
      }
      
      return NextResponse.json(fallbackResponse, { status: 503 })
    }
    
  } catch (error) {
    console.error('❌ Chatwoot conversation creation error:', error)
    
    // Log API failure for monitoring
    const sessionId = (error as any)?.sessionId || 'unknown'
    await auditLogger.logAPICall(
      '/api/chatwoot-conversation',
      'POST',
      false,
      Date.now(),
      request,
      error instanceof Error ? error.message : 'Unknown error'
    )
    
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          conversationId: 0,
          widgetConfig: {
            baseUrl: '',
            websiteToken: '',
            conversationId: 0,
            locale: 'en' as const,
            position: 'right' as const,
            hideMessageBubble: true,
            customAttributes: {}
          },
          error: 'Form data validation failed',
          details: error.issues
        },
        { status: 400 }
      )
    }
    
    // Return fallback response for other errors
    const fallbackResponse: ChatwootConversationResponse = {
      success: false,
      conversationId: 0,
      widgetConfig: {
        baseUrl: '',
        websiteToken: '',
        conversationId: 0,
        locale: 'en',
        position: 'right',
        hideMessageBubble: true,
        customAttributes: {}
      },
      fallback: {
        type: 'phone',
        contact: process.env.CHAT_FALLBACK_PHONE || '+6591234567',
        message: 'Chat temporarily unavailable. Please call us directly for immediate assistance.'
      }
    }
    
    return NextResponse.json(fallbackResponse, { status: 500 })
  }
}