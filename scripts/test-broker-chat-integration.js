#!/usr/bin/env node

/**
 * Integration test for broker-chat alignment
 *
 * Verifies:
 * 1. Enhanced webhook disabled (no requests to endpoint)
 * 2. Broker assigned correctly (Supabase source of truth)
 * 3. Messages appear in correct order
 * 4. No duplicate queue messages
 * 5. Broker name consistent across all systems
 *
 * Usage:
 *   node scripts/test-broker-chat-integration.js
 *
 * Requirements:
 *   - Local dev server running on http://localhost:3000
 *   - Chatwoot accessible at CHATWOOT_BASE_URL
 *   - .env.local with credentials configured
 */

const fetch = require('node-fetch')

// Configuration
const API_BASE = process.env.API_BASE || 'http://localhost:3000'
const CHATWOOT_BASE_URL = process.env.CHATWOOT_BASE_URL || 'https://chat.nextnest.sg'
const CHATWOOT_API_TOKEN = process.env.CHATWOOT_API_TOKEN
const CHATWOOT_ACCOUNT_ID = process.env.CHATWOOT_ACCOUNT_ID || '1'

// Test data
const sampleLeadData = {
  firstName: 'Test',
  lastName: 'User',
  email: `test-${Date.now()}@example.com`,
  phone: '+6591234567',
  loanType: 'HDB',
  propertyValue: 500000,
  loanAmount: 400000,
  monthlyIncome: 5000
}

async function testBrokerChatIntegration() {
  console.log('🧪 Starting broker-chat integration test...\n')
  console.log('Configuration:')
  console.log(`  API Base: ${API_BASE}`)
  console.log(`  Chatwoot: ${CHATWOOT_BASE_URL}`)
  console.log(`  Test Email: ${sampleLeadData.email}\n`)

  let conversationId = null
  let assignedBroker = null

  try {
    // Test 1: Create conversation via API
    console.log('═══════════════════════════════════════════════════')
    console.log('Test 1: Creating conversation via API')
    console.log('═══════════════════════════════════════════════════')

    const conversationResponse = await fetch(`${API_BASE}/api/chatwoot-conversation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sampleLeadData)
    })

    if (!conversationResponse.ok) {
      throw new Error(`API error: ${conversationResponse.status} ${conversationResponse.statusText}`)
    }

    const conversationData = await conversationResponse.json()

    if (!conversationData.conversationId) {
      throw new Error('No conversationId in API response')
    }

    conversationId = conversationData.conversationId
    assignedBroker = conversationData.widgetConfig?.customAttributes?.ai_broker_name

    console.log(`✅ Conversation created: ${conversationId}`)
    console.log(`✅ Assigned broker: ${assignedBroker || 'MISSING'}`)

    if (!assignedBroker) {
      console.log('❌ WARNING: No broker assigned in API response!')
    }
    console.log()

    // Test 2: Verify no requests to enhanced-flow
    console.log('═══════════════════════════════════════════════════')
    console.log('Test 2: Checking for enhanced-flow requests')
    console.log('═══════════════════════════════════════════════════')
    console.log('⚠️  Manual verification required:')
    console.log('   1. Check application logs (Railway/Vercel)')
    console.log('   2. Search for: POST /api/chatwoot-enhanced-flow')
    console.log('   3. Expected: ZERO requests')
    console.log('   4. If found: Webhook not disabled in Chatwoot admin')
    console.log()

    // Test 3: Wait for messages to be posted
    console.log('═══════════════════════════════════════════════════')
    console.log('Test 3: Waiting for messages (5 seconds)')
    console.log('═══════════════════════════════════════════════════')
    console.log('Waiting for backend to post messages...')
    await new Promise(resolve => setTimeout(resolve, 5000))
    console.log('✅ Wait complete')
    console.log()

    // Test 4: Fetch conversation messages from Chatwoot
    console.log('═══════════════════════════════════════════════════')
    console.log('Test 4: Fetching conversation messages')
    console.log('═══════════════════════════════════════════════════')

    if (!CHATWOOT_API_TOKEN) {
      console.log('⚠️  CHATWOOT_API_TOKEN not configured, skipping Chatwoot API checks')
      console.log('   Set in .env.local to enable full verification')
      console.log()
    } else {
      const messagesResponse = await fetch(
        `${CHATWOOT_BASE_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/conversations/${conversationId}/messages`,
        {
          headers: {
            'Api-Access-Token': CHATWOOT_API_TOKEN
          }
        }
      )

      if (!messagesResponse.ok) {
        console.log(`⚠️  Could not fetch messages: ${messagesResponse.status}`)
      } else {
        const messages = await messagesResponse.json()
        console.log(`✅ Fetched ${messages.length} messages`)

        // Test 5: Verify message sequence
        console.log('\n═══════════════════════════════════════════════════')
        console.log('Test 5: Verifying message sequence')
        console.log('═══════════════════════════════════════════════════')

        const messageContents = messages.map(m => ({
          type: m.message_type,
          content: m.content,
          sender: m.sender?.name || 'system'
        }))

        console.log('\nMessage Timeline:')
        messageContents.forEach((msg, i) => {
          console.log(`  ${i + 1}. [${msg.type}] ${msg.sender}: ${msg.content.substring(0, 60)}${msg.content.length > 60 ? '...' : ''}`)
        })
        console.log()

        // Check for expected messages
        const hasReviewing = messageContents.some(m =>
          m.content.toLowerCase().includes('reviewing your details') ||
          m.content.toLowerCase().includes('reviewing')
        )
        const hasJoined = messageContents.some(m =>
          m.content.toLowerCase().includes('joined the conversation')
        )
        const hasGreeting = messageContents.some(m =>
          (m.content.toLowerCase().includes('hi') ||
           m.content.toLowerCase().includes('hello') ||
           m.content.toLowerCase().includes('good morning') ||
           m.content.toLowerCase().includes('good afternoon')) &&
          m.type === 'outgoing'
        )

        console.log('Expected Message Checks:')
        console.log(`  ${hasReviewing ? '✅' : '❌'} "Reviewing" activity message`)
        console.log(`  ${hasJoined ? '✅' : '❌'} "Joined" activity message`)
        console.log(`  ${hasGreeting ? '✅' : '❌'} Broker greeting message`)
        console.log()

        // Test 6: Check for duplicate queue messages
        console.log('═══════════════════════════════════════════════════')
        console.log('Test 6: Checking for duplicate messages')
        console.log('═══════════════════════════════════════════════════')

        const queueMessages = messageContents.filter(m =>
          m.content.includes('All AI specialists are helping') ||
          m.content.includes('queue')
        )

        if (queueMessages.length > 1) {
          console.log(`❌ DUPLICATE QUEUE MESSAGES: Found ${queueMessages.length}`)
          queueMessages.forEach((msg, i) => {
            console.log(`   ${i + 1}. ${msg.content}`)
          })
        } else if (queueMessages.length === 1) {
          console.log(`⚠️  Found 1 queue message (frontend should filter this)`)
        } else {
          console.log(`✅ No queue messages found`)
        }
        console.log()

        // Test 7: Verify broker name consistency
        console.log('═══════════════════════════════════════════════════')
        console.log('Test 7: Verifying broker name consistency')
        console.log('═══════════════════════════════════════════════════')

        const greetingMessages = messageContents.filter(m =>
          m.type === 'outgoing' &&
          (m.content.includes('I\'m') || m.content.includes('I am'))
        )

        let brokerNameConsistent = true
        let foundBrokerNames = []

        greetingMessages.forEach(msg => {
          // Extract broker name from greeting (e.g., "I'm Sarah Wong")
          const match = msg.content.match(/I[''']m\s+([A-Z][a-z]+\s+[A-Z][a-z]+)|I am\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/)
          if (match) {
            const brokerName = match[1] || match[2]
            foundBrokerNames.push(brokerName)

            if (assignedBroker && brokerName !== assignedBroker) {
              console.log(`❌ Broker name mismatch:`)
              console.log(`   Expected: ${assignedBroker}`)
              console.log(`   Found in greeting: ${brokerName}`)
              brokerNameConsistent = false
            }
          }
        })

        if (brokerNameConsistent && foundBrokerNames.length > 0) {
          console.log(`✅ Broker name consistent: ${foundBrokerNames[0]}`)
        } else if (foundBrokerNames.length === 0) {
          console.log(`⚠️  No broker name found in greeting messages`)
        }
        console.log()

        // Test 8: Check for activity message sender
        console.log('═══════════════════════════════════════════════════')
        console.log('Test 8: Verifying activity message format')
        console.log('═══════════════════════════════════════════════════')

        const joinedMessage = messages.find(m =>
          m.message_type === 'activity' &&
          m.content.toLowerCase().includes('joined')
        )

        if (joinedMessage) {
          console.log(`✅ Found "joined" activity message`)
          console.log(`   Format: "${joinedMessage.content}"`)

          if (joinedMessage.content.includes('added AI-Broker') ||
              joinedMessage.content.includes('Brent added')) {
            console.log(`❌ LEGACY FORMAT: Still using old "added AI-Broker" format`)
            console.log(`   Expected: "[Broker Name] joined the conversation"`)
          } else if (assignedBroker && joinedMessage.content.includes(assignedBroker)) {
            console.log(`✅ Correct format with assigned broker name`)
          }
        } else {
          console.log(`⚠️  No "joined" activity message found`)
        }
        console.log()
      }
    }

    // Test 9: Summary
    console.log('═══════════════════════════════════════════════════')
    console.log('Test Summary')
    console.log('═══════════════════════════════════════════════════')
    console.log(`Conversation ID: ${conversationId}`)
    console.log(`Assigned Broker: ${assignedBroker || 'MISSING'}`)
    console.log(`Chatwoot URL: ${CHATWOOT_BASE_URL}/app/accounts/${CHATWOOT_ACCOUNT_ID}/conversations/${conversationId}`)
    console.log()
    console.log('Manual Verification Checklist:')
    console.log('  [ ] No POST requests to /api/chatwoot-enhanced-flow in logs')
    console.log('  [ ] Broker name in chat header matches greeting')
    console.log('  [ ] Message sequence: reviewing → 2-5s → joined → greeting')
    console.log('  [ ] No duplicate "All AI specialists are helping" messages')
    console.log('  [ ] Join message format: "[Broker Name] joined the conversation"')
    console.log()

    console.log('🎉 Integration test complete!')
    console.log()
    console.log('Next Steps:')
    console.log('  1. Review test results above')
    console.log('  2. Check application logs for enhanced-flow requests')
    console.log('  3. Manually verify conversation in Chatwoot UI')
    console.log('  4. If all checks pass: Webhook successfully disabled')
    console.log('  5. Continue monitoring per runbook (14 days)')
    console.log()

  } catch (error) {
    console.error('\n❌ Integration test failed:')
    console.error(error.message)

    if (error.stack) {
      console.error('\nStack trace:')
      console.error(error.stack)
    }

    console.log('\nTroubleshooting:')
    console.log('  1. Verify dev server running: http://localhost:3000')
    console.log('  2. Check .env.local has required credentials')
    console.log('  3. Verify Chatwoot accessible')
    console.log('  4. Review API logs for detailed errors')

    process.exit(1)
  }
}

// Run test
testBrokerChatIntegration()
