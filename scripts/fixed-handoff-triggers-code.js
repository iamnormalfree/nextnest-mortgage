// FIXED Check Handoff Triggers Code
// Copy this into your n8n workflow's "Check Handoff Triggers" node

// Get inputs
const aiData = $input.first().json;
const processHistory = $('Process History').first().json;

// Debug logging
console.log('AI Data received:', JSON.stringify(aiData, null, 2));
console.log('AI Data type:', typeof aiData, 'isArray:', Array.isArray(aiData));

// Extract AI response with enhanced logic
let response;

// Try multiple extraction methods
try {
  // Method 1: Direct array format from OpenAI HTTP request
  if (Array.isArray(aiData) && aiData[0] && aiData[0].choices) {
    console.log('Using Method 1: Array format');
    response = aiData[0].choices[0].message.content;
  }
  // Method 2: Direct object format from OpenAI HTTP request  
  else if (aiData && aiData.choices && Array.isArray(aiData.choices)) {
    console.log('Using Method 2: Direct object format');
    response = aiData.choices[0].message.content;
  }
  // Method 3: n8n OpenAI node format (old)
  else if (aiData && aiData.message && aiData.message.content) {
    console.log('Using Method 3: n8n OpenAI node format');
    response = aiData.message.content;
  }
  // Method 4: Direct content
  else if (aiData && aiData.content) {
    console.log('Using Method 4: Direct content');
    response = aiData.content;
  }
  // Method 5: Check if response is nested deeper
  else if (aiData && aiData.data && Array.isArray(aiData.data)) {
    console.log('Using Method 5: Nested data array');
    const firstItem = aiData.data[0];
    if (firstItem && firstItem.choices) {
      response = firstItem.choices[0].message.content;
    }
  }
  // Method 6: If aiData itself might be the content
  else if (typeof aiData === 'string') {
    console.log('Using Method 6: String content');
    response = aiData;
  }
  else {
    console.log('No valid AI response found, using fallback');
    console.log('aiData structure:', Object.keys(aiData || {}));
    response = null;
  }
} catch (error) {
  console.log('Error extracting AI response:', error.message);
  response = null;
}

// If we still don't have a response, use fallback
if (!response || response.trim().length === 0) {
  console.log('Using fallback response');
  response = "I can help you with your mortgage needs.";
}

console.log('Final extracted response:', response);

// Extract data
const customer = processHistory.customer;
const broker = processHistory.broker;
const messageCount = processHistory.totalMessages;
const userMessage = customer.currentMessage ? customer.currentMessage.toLowerCase() : '';

// Initialize
let shouldHandoff = false;
let handoffReason = 'none';
let urgencyLevel = 'normal';

// Check for handoff keywords
const handoffKeywords = [
  'ready to apply', 'apply now', 'lets proceed',
  'speak to human', 'real person', 'human agent',
  'sign up', 'start application', 'move forward'
];

for (const keyword of handoffKeywords) {
  if (userMessage.includes(keyword)) {
    shouldHandoff = true;
    handoffReason = 'Customer explicitly requested to proceed or speak with human';
    urgencyLevel = 'high';
    break;
  }
}

// Check high-value lead at optimal handoff point
if (!shouldHandoff && messageCount >= 7 && customer.leadScore >= 80) {
  shouldHandoff = true;
  handoffReason = 'High-value lead (score: ' + customer.leadScore + ') ready for conversion after ' + messageCount + ' messages';
  urgencyLevel = 'medium';
}

// Check urgent timeline
if (!shouldHandoff && customer.timeline === 'urgent' && messageCount >= 5) {
  shouldHandoff = true;
  handoffReason = 'Urgent timeline customer engaged for ' + messageCount + ' messages';
  urgencyLevel = 'high';
}

// Check complex situations
const complexKeywords = ['divorce', 'bankruptcy', 'foreigner', 'overseas', 'complicated'];
for (const keyword of complexKeywords) {
  if (userMessage.includes(keyword)) {
    shouldHandoff = true;
    handoffReason = 'Complex situation requiring specialist attention';
    urgencyLevel = 'medium';
    break;
  }
}

// Check frustration
const frustrationKeywords = ['frustrated', 'not helpful', 'speak to someone else', 'waste time'];
for (const keyword of frustrationKeywords) {
  if (userMessage.includes(keyword)) {
    shouldHandoff = true;
    handoffReason = 'Customer showing frustration - immediate attention needed';
    urgencyLevel = 'urgent';
    break;
  }
}

// Add handoff message if needed
let finalResponse = response;
if (shouldHandoff) {
  const handoffMessage = 'I can see you are ready to take the next step! Let me connect you with our senior mortgage specialist who can process your application immediately and secure these rates for you.';
  finalResponse = response + '\n\n---\n' + handoffMessage;
}

console.log('Final result:', {
  response: finalResponse,
  shouldHandoff,
  handoffReason,
  urgencyLevel
});

// Return result
return {
  aiResponse: finalResponse,
  shouldHandoff: shouldHandoff,
  handoffReason: handoffReason,
  urgencyLevel: urgencyLevel,
  conversationId: customer.conversationId,
  brokerId: broker.id,
  brokerName: broker.name,
  messageCount: messageCount + 1
};