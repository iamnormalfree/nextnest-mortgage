/**
 * Dr. Elena Integration Service
 * Week 3 Phase 5: Orchestrates mortgage calculations with AI explanations
 *
 * This service bridges:
 * - Pure calculations (dr-elena-mortgage.ts)
 * - AI explanations (dr-elena-explainer.ts)
 * - Conversation state (conversation-state-manager.ts)
 * - Intent routing (intent-router.ts)
 *
 * @module dr-elena-integration-service
 * @version 1.0.0
 */

import { calculateMaxLoanAmount, LoanCalculationInputs, LoanCalculationResult } from '@/lib/calculations/dr-elena-mortgage';
import { explainCalculation, ExplanationContext } from '@/lib/ai/dr-elena-explainer';
import { ConversationStateManager } from '@/lib/ai/conversation-state-manager';
import { BrokerPersona } from '@/lib/calculations/broker-persona';
import { ProcessedLeadData } from '@/lib/integrations/chatwoot-client';

/**
 * Request parameters for calculation with AI explanation
 */
export interface CalculationRequest {
  conversationId: number;
  leadData: ProcessedLeadData;
  brokerPersona: BrokerPersona;
  userMessage: string;

  // Optional: Override specific calculation parameters
  overrides?: Partial<LoanCalculationInputs>;
}

/**
 * Enhanced response with calculation and natural language explanation
 */
export interface CalculationResponse {
  // Pure calculation results
  calculation: LoanCalculationResult;

  // AI-generated natural language explanation
  explanation: string;

  // Formatted response for chat (ready to send)
  chatResponse: string;

  // Metadata
  calculationType: 'max_loan' | 'affordability' | 'refinancing' | 'stamp_duty' | 'comparison';
  recorded: boolean;
}

/**
 * Main Dr. Elena Integration Service
 */
export class DrElenaIntegrationService {
  private stateManager: ConversationStateManager;

  constructor() {
    this.stateManager = new ConversationStateManager();
  }

  /**
   * Process calculation request and generate AI explanation
   *
   * Flow:
   * 1. Extract calculation parameters from lead data
   * 2. Run Dr. Elena pure calculations
   * 3. Generate AI explanation with broker persona
   * 4. Record in audit trail and conversation state
   * 5. Format chat response
   */
  async processCalculationRequest(
    request: CalculationRequest
  ): Promise<CalculationResponse> {
    const { conversationId, leadData, brokerPersona, userMessage, overrides } = request;

    console.log(`>� Dr. Elena: Processing calculation for conversation ${conversationId}`);

    try {
      // Step 1: Build calculation inputs from lead data
      const calculationInputs = this.buildCalculationInputs(leadData, overrides);

      console.log(`=� Calculation inputs:`, {
        propertyPrice: calculationInputs.propertyPrice,
        monthlyIncome: calculationInputs.monthlyIncome,
        propertyType: calculationInputs.propertyType,
        citizenship: calculationInputs.citizenship
      });

      // Step 2: Run pure calculations (deterministic, no AI)
      const calculation = calculateMaxLoanAmount(calculationInputs);

      console.log(` Calculation complete:`, {
        maxLoan: calculation.maxLoan,
        limitingFactor: calculation.limitingFactor,
        tdsrUsed: calculation.tdsrUsed,
        masCompliant: calculation.masCompliant
      });

      // Step 3: Generate AI explanation with broker persona
      const explanationContext: ExplanationContext = {
        calculation,
        brokerPersona,
        userQuestion: userMessage,
        conversationPhase: await this.determinePhase(conversationId),
        userProfile: {
          name: leadData.name,
          leadScore: leadData.leadScore,
          propertyType: calculationInputs.propertyType
        }
      };

      const explanation = await explainCalculation(explanationContext);

      console.log(`=� AI explanation generated (${explanation.summary.length} chars)`);

      // Step 4: Determine calculation type
      const calculationType = this.determineCalculationType(userMessage, leadData);

      // Step 5: Record in audit trail and conversation state
      let recorded = false;
      try {
        await this.stateManager.recordCalculation(
          conversationId,
          calculationType,
          calculationInputs,
          calculation
        );
        recorded = true;
        console.log(` Calculation recorded in audit trail`);
      } catch (error) {
        console.error(`� Failed to record calculation (non-critical):`, error);
      }

      // Step 6: Format chat response
      const chatResponse = this.formatChatResponse(
        explanation,
        calculation,
        brokerPersona,
        leadData
      );

      return {
        calculation,
        explanation: explanation.summary,
        chatResponse,
        calculationType,
        recorded
      };

    } catch (error) {
      console.error(`L Dr. Elena calculation failed:`, error);

      // Fallback: Return error message with graceful degradation
      return this.generateFallbackResponse(request, error as Error);
    }
  }

  /**
   * Build calculation inputs from lead data
   * Maps ProcessedLeadData � LoanCalculationInputs
   */
  private buildCalculationInputs(
    leadData: ProcessedLeadData,
    overrides?: Partial<LoanCalculationInputs>
  ): LoanCalculationInputs {
    // Extract primary income
    const monthlyIncome = leadData.actualIncomes?.[0] || 5000;

    // Map property category to property type
    const propertyType = this.mapPropertyType(
      leadData.propertyCategory || leadData.propertyType || 'HDB'
    );

    // Default values with lead data
    const inputs: LoanCalculationInputs = {
      propertyPrice: leadData.propertyPrice || 500000,
      propertyType,
      monthlyIncome,
      existingCommitments: leadData.existingCommitments || 0,
      age: leadData.age || 30,
      citizenship: this.mapCitizenship(leadData.citizenship || 'Citizen'),
      propertyCount: (leadData.propertyCount || 1) as 1 | 2 | 3,

      // Co-applicant if available
      ...(leadData.actualIncomes?.[1] && {
        coApplicant: {
          monthlyIncome: leadData.actualIncomes[1],
          age: leadData.coApplicantAge || 30,
          existingCommitments: 0
        }
      })
    };

    // Apply overrides
    return { ...inputs, ...overrides };
  }

  /**
   * Map property category strings to calculation property types
   */
  private mapPropertyType(category: string): 'HDB' | 'EC' | 'Private' | 'Commercial' {
    const normalized = category.toUpperCase();

    if (normalized.includes('HDB')) return 'HDB';
    if (normalized.includes('EC')) return 'EC';
    if (normalized.includes('COMMERCIAL') || normalized.includes('COMMERCIAL')) return 'Commercial';
    return 'Private';
  }

  /**
   * Map citizenship strings to calculation citizenship types
   */
  private mapCitizenship(citizenship: string): 'Citizen' | 'PR' | 'Foreigner' {
    const normalized = citizenship.toLowerCase();

    if (normalized.includes('pr') || normalized.includes('permanent')) return 'PR';
    if (normalized.includes('foreign') || normalized.includes('expat')) return 'Foreigner';
    return 'Citizen';
  }

  /**
   * Determine calculation type from user message
   */
  private determineCalculationType(
    userMessage: string,
    leadData: ProcessedLeadData
  ): 'max_loan' | 'affordability' | 'refinancing' | 'stamp_duty' | 'comparison' {
    const lower = userMessage.toLowerCase();

    if (lower.includes('refinanc')) return 'refinancing';
    if (lower.includes('stamp') || lower.includes('duty') || lower.includes('tax')) return 'stamp_duty';
    if (lower.includes('compare') || lower.includes('vs') || lower.includes('versus')) return 'comparison';
    if (lower.includes('afford') || lower.includes('budget')) return 'affordability';

    return 'max_loan'; // Default
  }

  /**
   * Determine conversation phase from state
   */
  private async determinePhase(
    conversationId: number
  ): Promise<'greeting' | 'discovery' | 'calculation' | 'recommendation' | 'closing'> {
    try {
      const state = await this.stateManager.getState(conversationId);
      return state?.phase || 'calculation';
    } catch {
      return 'calculation';
    }
  }

  /**
   * Format chat response from explanation and calculation
   * Combines AI explanation with key numbers in broker persona style
   */
  private formatChatResponse(
    explanation: any,
    calculation: LoanCalculationResult,
    brokerPersona: BrokerPersona,
    leadData: ProcessedLeadData
  ): string {
    const { summary, keyInsights, nextSteps, tone } = explanation;

    // Start with personalized greeting
    let response = `${leadData.name}, ${summary}\n\n`;

    // Add key numbers in formatted box
    response += `=� **Your Mortgage Snapshot:**\n`;
    response += `" Max Loan: **S$${calculation.maxLoan.toLocaleString()}**\n`;
    response += `" Monthly Payment: **S$${calculation.monthlyPayment.toLocaleString()}**\n`;
    response += `" Down Payment: **S$${calculation.downPayment.toLocaleString()}**\n`;
    response += `" Cash Required: **S$${calculation.minCashRequired.toLocaleString()}**\n`;
    response += `" TDSR: ${calculation.tdsrUsed}% (limit: 55%)\n\n`;

    // Add key insights
    if (keyInsights && keyInsights.length > 0) {
      response += `=� **Key Points:**\n`;
      keyInsights.slice(0, 3).forEach((insight: string) => {
        response += `" ${insight}\n`;
      });
      response += `\n`;
    }

    // Add next steps based on broker persona
    if (nextSteps && nextSteps.length > 0) {
      if (brokerPersona.urgencyLevel === 'high') {
        response += `� **Immediate Next Steps:**\n`;
      } else if (brokerPersona.urgencyLevel === 'low') {
        response += `< **Suggested Next Steps (No Rush):**\n`;
      } else {
        response += `=� **Recommended Next Steps:**\n`;
      }

      nextSteps.slice(0, 3).forEach((step: string) => {
        response += `${nextSteps.indexOf(step) + 1}. ${step}\n`;
      });
      response += `\n`;
    }

    // Add persona-specific closing
    response += this.getPersonaClosing(brokerPersona, calculation, tone);

    return response;
  }

  /**
   * Get persona-specific closing message
   */
  private getPersonaClosing(
    brokerPersona: BrokerPersona,
    calculation: LoanCalculationResult,
    tone: string
  ): string {
    if (brokerPersona.urgencyLevel === 'high' && calculation.masCompliant) {
      return `This is an excellent opportunity - let's move quickly to secure the best rates. Would you like me to start your pre-approval today?`;
    }

    if (brokerPersona.urgencyLevel === 'low') {
      return `Take your time to review these numbers. I'm here to answer any questions you have. What would you like to explore next?`;
    }

    if (!calculation.masCompliant) {
      return `We'll need to adjust some parameters to meet MAS requirements. Would you like me to show you what options are available?`;
    }

    return `What questions do you have about these calculations? I'm here to help clarify anything.`;
  }

  /**
   * Generate fallback response when calculation fails
   */
  private generateFallbackResponse(
    request: CalculationRequest,
    error: Error
  ): CalculationResponse {
    console.error(`Generating fallback response due to error:`, error);

    const fallbackMessage = `${request.leadData.name}, I apologize - I'm experiencing a technical issue with the calculation right now. Let me get a senior specialist to help you immediately with accurate numbers.\n\nIn the meantime, based on your income of S$${request.leadData.actualIncomes?.[0]?.toLocaleString() || '5,000'}, you should qualify for competitive mortgage options.\n\nWould you like me to connect you with a specialist who can provide detailed calculations?`;

    // Create minimal calculation result for fallback
    const fallbackCalculation: LoanCalculationResult = {
      maxLoan: 0,
      ltvApplied: 75,
      ltvPenalty: false,
      monthlyPayment: 0,
      stressTestPayment: 0,
      tdsrUsed: 0,
      msrUsed: null,
      limitingFactor: 'TDSR',
      downPayment: 0,
      minCashRequired: 0,
      cpfAllowed: 0,
      stampDuty: 0,
      totalFundsRequired: 0,
      maxTenure: 25,
      recommendedTenure: 25,
      reasoning: ['Calculation failed - fallback response'],
      masCompliant: false,
      warnings: ['Technical error occurred during calculation']
    };

    return {
      calculation: fallbackCalculation,
      explanation: 'Calculation temporarily unavailable',
      chatResponse: fallbackMessage,
      calculationType: 'max_loan',
      recorded: false
    };
  }

  /**
   * Close connections (call on shutdown)
   */
  async disconnect(): Promise<void> {
    await this.stateManager.disconnect();
  }
}

// Export singleton instance with lazy initialization
let _instance: DrElenaIntegrationService | null = null;

export const drElenaService = {
  get instance(): DrElenaIntegrationService {
    if (!_instance) {
      _instance = new DrElenaIntegrationService();
    }
    return _instance;
  },

  // Proxy methods for backwards compatibility
  processCalculationRequest: (request: CalculationRequest) => {
    return drElenaService.instance.processCalculationRequest(request);
  },

  disconnect: () => {
    return drElenaService.instance.disconnect();
  }
};
