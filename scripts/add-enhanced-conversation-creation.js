/**
 * Enhanced Conversation Creation Helper
 * 
 * This script adds a helper function to your Chatwoot client that automatically:
 * 1. Sets conversation status to "open"
 * 2. Assigns to the configured user
 * 3. Adds appropriate labels for AI broker and property type
 * 4. Adds user form submission message
 * 5. Adds AI broker introduction message
 */

const CHATWOOT_BASE_URL = 'https://chat.nextnest.sg';
const CHATWOOT_API_TOKEN = process.env.CHATWOOT_API_TOKEN;

if (!CHATWOOT_API_TOKEN) {
  console.error('❌ Error: CHATWOOT_API_TOKEN environment variable is required');
  process.exit(1);
}
const ACCOUNT_ID = 1;
const USER_ID = 1;

// AI Broker configurations (same as enhance script)
const AI_BROKERS = {
  'Marcus Chen': { label: 'AI-Broker-Marcus', color: '#FF6B6B' },
  'Sarah Wong': { label: 'AI-Broker-Sarah', color: '#4ECDC4' },
  'Jasmine Lee': { label: 'AI-Broker-Jasmine', color: '#45B7D1' }
};

const PROPERTY_LABELS = {
  'HDB': { label: 'Property-HDB', color: '#96CEB4' },
  'EC': { label: 'Property-EC', color: '#FFEAA7' },
  'Private': { label: 'Property-Private', color: '#DDA0DD' }
};

/**
 * Enhanced conversation creation that includes all visibility features
 */
async function createEnhancedConversation(leadData) {
  console.log('🎨 Creating enhanced conversation for:', leadData.name);
  
  try {
    // 1. Create conversation with all custom attributes
    const conversationData = {
      source_id: leadData.sessionId || `nextnest_${Date.now()}`,
      inbox_id: 1,
      contact: {
        name: leadData.name,
        email: leadData.email,
        phone: leadData.phone,
        custom_attributes: {
          lead_score: leadData.leadScore,
          loan_type: leadData.loanType,
          employment_type: leadData.employmentType,
          property_category: leadData.propertyCategory,
          session_id: leadData.sessionId
        }
      },
      // Enhanced custom attributes including broker info
      custom_attributes: {
        lead_score: leadData.leadScore,
        broker_persona: leadData.brokerPersona?.type,
        loan_type: leadData.loanType,
        monthly_income: leadData.actualIncomes?.[0] || leadData.monthlyIncome,
        form_completed_at: new Date().toISOString(),
        session_id: leadData.sessionId,
        ai_broker_name: leadData.brokerPersona?.name || leadData.aiBrokerName,
        property_category: leadData.propertyCategory,
        property_type: leadData.propertyType,
        property_price: leadData.propertyPrice,
        ages: JSON.stringify(leadData.actualAges || [30]),
        incomes: JSON.stringify(leadData.actualIncomes || [leadData.monthlyIncome]),
        employment_type: leadData.employmentType || 'employed',
        existing_commitments: leadData.existingCommitments || 0,
        broker_approach: leadData.brokerPersona?.approach,
        broker_urgency: leadData.brokerPersona?.urgencyLevel,
        source: 'progressive_form',
        integration_version: '2.0'
      },
      // Auto-assign to user (prevents UI bug)
      assignee_id: USER_ID,
      // Set to open status immediately (prevents UI bug)
      status: 'open'
    };

    console.log('  Creating conversation with full context...');
    const conversationResponse = await fetch(`${CHATWOOT_BASE_URL}/api/v1/accounts/${ACCOUNT_ID}/conversations`, {
      method: 'POST',
      headers: {
        'Api-Access-Token': CHATWOOT_API_TOKEN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(conversationData)
    });

    if (!conversationResponse.ok) {
      const errorText = await conversationResponse.text();
      throw new Error(`Failed to create conversation: ${conversationResponse.status} ${errorText}`);
    }

    const conversation = await conversationResponse.json();
    const conversationId = conversation.id;
    console.log(`  ✅ Created conversation ${conversationId}`);

    // 2. Add labels for visual identification
    await addLabels(conversationId, leadData);

    // 3. Add user form submission message
    await addUserFormMessage(conversationId, leadData);

    // 4. Add AI broker introduction
    await addBrokerIntroMessage(conversationId, leadData);

    console.log(`🎉 Enhanced conversation ${conversationId} ready!`);
    return conversation;

  } catch (error) {
    console.error('❌ Error creating enhanced conversation:', error);
    throw error;
  }
}

async function addLabels(conversationId, leadData) {
  const labelsToAdd = [];
  const brokerName = leadData.brokerPersona?.name || leadData.aiBrokerName;
  const propertyType = leadData.propertyType;
  
  // Add broker label
  if (brokerName && AI_BROKERS[brokerName]) {
    labelsToAdd.push(AI_BROKERS[brokerName].label);
  }
  
  // Add property label  
  if (propertyType && PROPERTY_LABELS[propertyType]) {
    labelsToAdd.push(PROPERTY_LABELS[propertyType].label);
  }

  for (const label of labelsToAdd) {
    try {
      const response = await fetch(`${CHATWOOT_BASE_URL}/api/v1/accounts/${ACCOUNT_ID}/conversations/${conversationId}/labels`, {
        method: 'POST',
        headers: {
          'Api-Access-Token': CHATWOOT_API_TOKEN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          labels: [label]
        })
      });
      
      if (response.ok) {
        console.log(`    ✅ Added label: ${label}`);
      }
    } catch (error) {
      console.log(`    ❌ Failed to add label ${label}: ${error.message}`);
    }
  }
}

async function addUserFormMessage(conversationId, leadData) {
  const userName = leadData.name || 'User';
  
  const formSummary = `📝 Form Submission:
• Loan Type: ${leadData.loanType || 'new_purchase'}
• Property: ${leadData.propertyType || 'N/A'} (${leadData.propertyCategory || 'resale'})
• Monthly Income: S$${leadData.monthlyIncome || leadData.actualIncomes?.[0] || 'N/A'}
• Lead Score: ${leadData.leadScore || 'N/A'}/100
• Employment: ${leadData.employmentType || 'employed'}
• Age: ${leadData.actualAges?.[0] || 30}

I'm interested in learning more about mortgage options for my situation.`;

  try {
    const response = await fetch(`${CHATWOOT_BASE_URL}/api/v1/accounts/${ACCOUNT_ID}/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: {
        'Api-Access-Token': CHATWOOT_API_TOKEN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: formSummary,
        message_type: 'incoming',
        private: false
      })
    });
    
    if (response.ok) {
      console.log(`    ✅ Added user form message`);
    }
  } catch (error) {
    console.log(`    ❌ Failed to add user message: ${error.message}`);
  }
}

async function addBrokerIntroMessage(conversationId, leadData) {
  const brokerName = leadData.brokerPersona?.name || leadData.aiBrokerName;
  if (!brokerName) return;

  const userName = leadData.name || 'there';
  const leadScore = leadData.leadScore || 75;
  const monthlyIncome = leadData.monthlyIncome || leadData.actualIncomes?.[0] || 5000;
  const propertyType = leadData.propertyType || 'property';
  
  const brokerIntros = {
    'Marcus Chen': `Hi ${userName}! 🎯

I'm Marcus Chen, your dedicated mortgage specialist. I've analyzed your ${leadData.loanType || 'mortgage'} application and have excellent news!

✅ **Pre-qualification Status**: Highly Likely Approved
💰 **Your Profile Score**: ${leadScore}/100 (${leadScore > 85 ? 'Premium' : leadScore > 70 ? 'Strong' : 'Good'} tier)
🏆 **Monthly Income**: S$${monthlyIncome} puts you in a strong position

Based on your ${propertyType} choice, I've identified 3 strategies that could maximize your savings.

The market is moving fast right now, and with your ${leadScore > 80 ? 'excellent' : 'strong'} profile, we should secure your rate ASAP.

**Ready to lock in these rates today?** I can have your pre-approval letter ready within 2 hours. 🚀`,

    'Sarah Wong': `Hello ${userName}! 👋

I'm Sarah Wong, and I'm excited to help you with your ${leadData.loanType || 'mortgage'} journey.

I've reviewed your application and here's what I found:

📊 **Your Profile Assessment**: ${leadScore}/100
✅ ${leadScore > 80 ? 'Excellent' : leadScore > 70 ? 'Strong' : 'Good'} approval likelihood
💡 Your S$${monthlyIncome} income puts you in a ${leadScore > 80 ? 'excellent' : 'good'} position

**What this means for you:**
• ${propertyType} properties offer several financing options
• Current market conditions are favorable for your timeline

I'm here to answer any questions and guide you through each step. What would you like to explore first?`,

    'Jasmine Lee': `Hi ${userName},

Thank you for taking the time to complete your ${leadData.loanType || 'mortgage'} application. I'm Jasmine Lee, and I'm here to help you understand your options without any pressure.

I know mortgage decisions can feel overwhelming, so let's take this step by step:

🏠 **What I understand about your situation:**
• You're exploring ${leadData.loanType || 'mortgage'} options
• Looking at ${propertyType} properties
• Want to make sure you're getting the best value

**My approach:**
• No pressure - we'll move at your pace
• Clear explanations of all options
• Honest advice about what makes sense for your situation

Feel free to ask me anything - even questions you think might be "basic." That's what I'm here for! 😊`
  };
  
  const introMessage = brokerIntros[brokerName] || brokerIntros['Sarah Wong'];
  
  try {
    const response = await fetch(`${CHATWOOT_BASE_URL}/api/v1/accounts/${ACCOUNT_ID}/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: {
        'Api-Access-Token': CHATWOOT_API_TOKEN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: introMessage,
        message_type: 'outgoing',
        private: false
      })
    });
    
    if (response.ok) {
      console.log(`    ✅ Added ${brokerName} intro message`);
    }
  } catch (error) {
    console.log(`    ❌ Failed to add broker intro: ${error.message}`);
  }
}

// Test the enhanced conversation creation
async function testEnhancedCreation() {
  const testLead = {
    name: 'Test Enhanced User',
    email: 'test.enhanced@nextnest.sg',
    phone: '+6512345678',
    sessionId: `test_enhanced_${Date.now()}`,
    loanType: 'new_purchase',
    leadScore: 85,
    monthlyIncome: 8000,
    employmentType: 'employed',
    propertyCategory: 'resale',
    propertyType: 'EC',
    propertyPrice: 650000,
    actualAges: [32],
    actualIncomes: [8000],
    existingCommitments: 1500,
    brokerPersona: {
      name: 'Marcus Chen',
      type: 'aggressive',
      approach: 'premium_rates_focus',
      urgencyLevel: 'high'
    }
  };
  
  const conversation = await createEnhancedConversation(testLead);
  console.log(`🎉 Test conversation created: https://chat.nextnest.sg/app/accounts/1/conversations/${conversation.id}`);
}

// Export for use in other modules
module.exports = {
  createEnhancedConversation,
  AI_BROKERS,
  PROPERTY_LABELS
};

// Run test if called directly
if (require.main === module) {
  testEnhancedCreation().catch(console.error);
}