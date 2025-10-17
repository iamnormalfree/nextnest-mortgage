/**
 * Enhance Chatwoot Conversations for Better Visibility
 * 
 * This script adds labels and ensures all user messages are properly visible:
 * 1. Creates labels for AI brokers (Marcus Chen, Sarah Wong, Jasmine Lee)
 * 2. Adds broker labels to conversations based on custom attributes
 * 3. Adds a welcome message from the AI broker to make conversations more engaging
 * 4. Ensures user form responses are captured as messages
 */

const CHATWOOT_BASE_URL = 'https://chat.nextnest.sg';
const CHATWOOT_API_TOKEN = process.env.CHATWOOT_API_TOKEN;

if (!CHATWOOT_API_TOKEN) {
  console.error('❌ Error: CHATWOOT_API_TOKEN environment variable is required');
  process.exit(1);
}
const ACCOUNT_ID = 1;
const USER_ID = 1;

// AI Broker configurations
const AI_BROKERS = {
  'Marcus Chen': {
    label: 'AI-Broker-Marcus',
    color: '#FF6B6B',
    description: 'Marcus Chen - Aggressive Premium Broker'
  },
  'Sarah Wong': {
    label: 'AI-Broker-Sarah', 
    color: '#4ECDC4',
    description: 'Sarah Wong - Balanced Educational Broker'
  },
  'Jasmine Lee': {
    label: 'AI-Broker-Jasmine',
    color: '#45B7D1', 
    description: 'Jasmine Lee - Consultative Gentle Broker'
  }
};

// Property type labels
const PROPERTY_LABELS = {
  'HDB': { label: 'Property-HDB', color: '#96CEB4' },
  'EC': { label: 'Property-EC', color: '#FFEAA7' },
  'Private': { label: 'Property-Private', color: '#DDA0DD' }
};

async function enhanceConversations() {
  console.log('🎨 Enhancing Chatwoot conversations for better visibility...');
  
  try {
    // Step 1: Create labels if they don't exist
    await createLabels();
    
    // Step 2: Get all conversations
    console.log('\n2. Getting all conversations...');
    const conversationsResponse = await fetch(`${CHATWOOT_BASE_URL}/api/v1/accounts/${ACCOUNT_ID}/conversations?status=open`, {
      headers: {
        'Api-Access-Token': CHATWOOT_API_TOKEN,
        'Content-Type': 'application/json'
      }
    });
    
    if (!conversationsResponse.ok) {
      throw new Error(`Failed to fetch conversations: ${conversationsResponse.status}`);
    }
    
    const conversationsData = await conversationsResponse.json();
    const conversations = conversationsData.data.payload;
    
    console.log(`Found ${conversations.length} conversations to enhance`);
    
    // Step 3: Enhance each conversation
    let enhancedCount = 0;
    
    for (const conversation of conversations) {
      try {
        const brokerName = conversation.custom_attributes?.ai_broker_name;
        const propertyType = conversation.custom_attributes?.property_type;
        
        if (brokerName || propertyType) {
          console.log(`\n  Enhancing conversation ${conversation.id}...`);
          
          // Add labels
          await addLabelsToConversation(conversation.id, brokerName, propertyType);
          
          // Add user form submission message if missing
          await addUserFormMessage(conversation);
          
          // Add broker introduction message if needed
          await addBrokerIntroMessage(conversation, brokerName);
          
          enhancedCount++;
          console.log(`    ✅ Enhanced conversation ${conversation.id}`);
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.log(`    ❌ Failed to enhance conversation ${conversation.id}: ${error.message}`);
      }
    }
    
    console.log(`\n🎉 Enhanced ${enhancedCount} conversations!`);
    console.log('💡 Now you can see AI broker assignments at a glance in your dashboard!');
    
  } catch (error) {
    console.error('❌ Error enhancing conversations:', error.message);
  }
}

async function createLabels() {
  console.log('\n1. Creating AI Broker labels...');
  
  // Create AI Broker labels
  for (const [brokerName, config] of Object.entries(AI_BROKERS)) {
    try {
      const response = await fetch(`${CHATWOOT_BASE_URL}/api/v1/accounts/${ACCOUNT_ID}/labels`, {
        method: 'POST',
        headers: {
          'Api-Access-Token': CHATWOOT_API_TOKEN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: config.label,
          description: config.description,
          color: config.color
        })
      });
      
      if (response.ok) {
        console.log(`  ✅ Created label: ${config.label}`);
      } else if (response.status === 422) {
        console.log(`  ℹ️ Label already exists: ${config.label}`);
      } else {
        console.log(`  ⚠️ Failed to create label ${config.label}: ${response.status}`);
      }
      
    } catch (error) {
      console.log(`  ❌ Error creating label ${config.label}: ${error.message}`);
    }
  }
  
  // Create Property Type labels
  for (const [propertyType, config] of Object.entries(PROPERTY_LABELS)) {
    try {
      const response = await fetch(`${CHATWOOT_BASE_URL}/api/v1/accounts/${ACCOUNT_ID}/labels`, {
        method: 'POST',
        headers: {
          'Api-Access-Token': CHATWOOT_API_TOKEN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: config.label,
          description: `${propertyType} Property Type`,
          color: config.color
        })
      });
      
      if (response.ok) {
        console.log(`  ✅ Created label: ${config.label}`);
      } else if (response.status === 422) {
        console.log(`  ℹ️ Label already exists: ${config.label}`);
      }
      
    } catch (error) {
      console.log(`  ❌ Error creating property label ${config.label}: ${error.message}`);
    }
  }
}

async function addLabelsToConversation(conversationId, brokerName, propertyType) {
  const labelsToAdd = [];
  
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
        console.log(`      ✅ Added label: ${label}`);
      }
    } catch (error) {
      console.log(`      ❌ Failed to add label ${label}: ${error.message}`);
    }
  }
}

async function addUserFormMessage(conversation) {
  // Check if conversation already has user messages
  const hasUserMessages = conversation.messages?.some(msg => 
    msg.message_type === 0 && msg.sender_type === 'Contact'
  );
  
  if (!hasUserMessages) {
    // Create a user form submission message
    const formData = conversation.custom_attributes || {};
    const userName = conversation.meta?.sender?.name || 'User';
    
    const formSummary = `📝 Form Submission:
• Loan Type: ${formData.loan_type || 'N/A'}
• Property: ${formData.property_type || 'N/A'} (${formData.property_category || 'N/A'})
• Monthly Income: S$${formData.monthly_income || 'N/A'}
• Lead Score: ${formData.lead_score || 'N/A'}/100
• Employment: ${formData.employment_type || 'N/A'}
• Age: ${formData.ages ? JSON.parse(formData.ages)[0] : 'N/A'}

I'm interested in learning more about mortgage options for my situation.`;

    try {
      const response = await fetch(`${CHATWOOT_BASE_URL}/api/v1/accounts/${ACCOUNT_ID}/conversations/${conversation.id}/messages`, {
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
        console.log(`      ✅ Added user form message`);
      }
    } catch (error) {
      console.log(`      ❌ Failed to add user message: ${error.message}`);
    }
  }
}

async function addBrokerIntroMessage(conversation, brokerName) {
  if (!brokerName) return;
  
  // Check if there's already a broker intro message
  const hasBrokerIntro = conversation.messages?.some(msg => 
    msg.content?.includes(`I'm ${brokerName}`) || msg.content?.includes(`Hi ${conversation.meta?.sender?.name}`)
  );
  
  if (!hasBrokerIntro) {
    const formData = conversation.custom_attributes || {};
    const userName = conversation.meta?.sender?.name || 'there';
    
    // Get broker-specific intro based on persona
    const brokerIntro = getBrokerIntroMessage(brokerName, formData, userName);
    
    try {
      const response = await fetch(`${CHATWOOT_BASE_URL}/api/v1/accounts/${ACCOUNT_ID}/conversations/${conversation.id}/messages`, {
        method: 'POST',
        headers: {
          'Api-Access-Token': CHATWOOT_API_TOKEN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: brokerIntro,
          message_type: 'outgoing',
          private: false
        })
      });
      
      if (response.ok) {
        console.log(`      ✅ Added ${brokerName} intro message`);
      }
    } catch (error) {
      console.log(`      ❌ Failed to add broker intro: ${error.message}`);
    }
  }
}

function getBrokerIntroMessage(brokerName, formData, userName) {
  const leadScore = formData.lead_score || 75;
  const monthlyIncome = formData.monthly_income || 5000;
  const propertyType = formData.property_type || 'property';
  
  const brokerIntros = {
    'Marcus Chen': `Hi ${userName}! 🎯

I'm Marcus Chen, your dedicated mortgage specialist. I've analyzed your ${formData.loan_type || 'mortgage'} application and have excellent news!

✅ **Pre-qualification Status**: Highly Likely Approved
💰 **Your Profile Score**: ${leadScore}/100 (${leadScore > 85 ? 'Premium' : leadScore > 70 ? 'Strong' : 'Good'} tier)
🏆 **Monthly Income**: S$${monthlyIncome} puts you in a strong position

Based on your ${propertyType} choice, I've identified 3 strategies that could maximize your savings.

The market is moving fast right now, and with your ${leadScore > 80 ? 'excellent' : 'strong'} profile, we should secure your rate ASAP.

**Ready to lock in these rates today?** I can have your pre-approval letter ready within 2 hours. 🚀`,

    'Sarah Wong': `Hello ${userName}! 👋

I'm Sarah Wong, and I'm excited to help you with your ${formData.loan_type || 'mortgage'} journey.

I've reviewed your application and here's what I found:

📊 **Your Profile Assessment**: ${leadScore}/100
✅ ${leadScore > 80 ? 'Excellent' : leadScore > 70 ? 'Strong' : 'Good'} approval likelihood
💡 Your S$${monthlyIncome} income puts you in a ${leadScore > 80 ? 'excellent' : 'good'} position

**What this means for you:**
• ${propertyType} properties offer several financing options
• Current market conditions are favorable for your timeline

I'm here to answer any questions and guide you through each step. What would you like to explore first?`,

    'Jasmine Lee': `Hi ${userName},

Thank you for taking the time to complete your ${formData.loan_type || 'mortgage'} application. I'm Jasmine Lee, and I'm here to help you understand your options without any pressure.

I know mortgage decisions can feel overwhelming, so let's take this step by step:

🏠 **What I understand about your situation:**
• You're exploring ${formData.loan_type || 'mortgage'} options
• Looking at ${propertyType} properties
• Want to make sure you're getting the best value

**My approach:**
• No pressure - we'll move at your pace
• Clear explanations of all options
• Honest advice about what makes sense for your situation

Feel free to ask me anything - even questions you think might be "basic." That's what I'm here for! 😊`
  };
  
  return brokerIntros[brokerName] || brokerIntros['Sarah Wong'];
}

// Run the enhancement
enhanceConversations();