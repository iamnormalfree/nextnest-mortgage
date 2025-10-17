#!/usr/bin/env tsx
/**
 * Test AI Broker Flow End-to-End
 *
 * This script tests the complete BullMQ AI broker system:
 * 1. Check system status
 * 2. Check worker status
 * 3. Fetch messages from a conversation
 * 4. Show queue metrics
 */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3005'

interface TestResult {
  test: string
  status: 'PASS' | 'FAIL' | 'WARN'
  message: string
  data?: any
}

const results: TestResult[] = []

async function runTests() {
  console.log('🧪 Testing NextNest AI Broker System')
  console.log('=' .repeat(60))
  console.log()

  // Test 1: Check Migration Status
  console.log('📊 Test 1: Migration Status...')
  try {
    const response = await fetch(`${BASE_URL}/api/admin/migration-status`)
    const data = await response.json()

    if (data.migration.bullmqEnabled && data.migration.trafficPercentage === 100) {
      results.push({
        test: 'Migration Status',
        status: 'PASS',
        message: `✅ BullMQ enabled at ${data.migration.trafficPercentage}%`,
        data: {
          phase: data.migration.phase,
          queueTotal: data.queue.total,
          queueCompleted: data.queue.completed,
        }
      })
    } else {
      results.push({
        test: 'Migration Status',
        status: 'WARN',
        message: `⚠️ BullMQ not at 100% (currently ${data.migration.trafficPercentage}%)`,
        data
      })
    }
  } catch (error: any) {
    results.push({
      test: 'Migration Status',
      status: 'FAIL',
      message: `❌ Failed: ${error.message}`
    })
  }

  // Test 2: Check Worker Status
  console.log('🏃 Test 2: Worker Status...')
  try {
    const response = await fetch(`${BASE_URL}/api/worker/start`)
    const data = await response.json()

    if (data.status.initialized && data.status.running) {
      results.push({
        test: 'Worker Status',
        status: 'PASS',
        message: '✅ Worker initialized and running',
        data: data.status
      })
    } else {
      results.push({
        test: 'Worker Status',
        status: 'WARN',
        message: `⚠️ Worker status: ${JSON.stringify(data.status)}`,
        data
      })
    }
  } catch (error: any) {
    results.push({
      test: 'Worker Status',
      status: 'FAIL',
      message: `❌ Failed: ${error.message}`
    })
  }

  // Test 3: Fetch Messages (if conversation ID provided)
  const conversationId = process.argv[2]
  if (conversationId) {
    console.log(`💬 Test 3: Fetching messages for conversation ${conversationId}...`)
    try {
      const response = await fetch(
        `${BASE_URL}/api/chat/messages?conversation_id=${conversationId}`
      )
      const data = await response.json()

      if (data.success && data.messages && data.messages.length > 0) {
        results.push({
          test: 'Message Fetching',
          status: 'PASS',
          message: `✅ Found ${data.messages.length} messages`,
          data: {
            conversationId: data.conversation_id,
            messageCount: data.messages.length,
            messages: data.messages.map((m: any) => ({
              id: m.id,
              role: m.role,
              preview: m.content.substring(0, 50) + '...'
            }))
          }
        })

        console.log('\n📝 Messages Preview:')
        console.log('─'.repeat(60))
        data.messages.forEach((msg: any) => {
          const roleIcon = msg.role === 'system' ? '🔔' : msg.role === 'agent' ? '🤖' : '👤'
          const roleName = msg.role.toUpperCase().padEnd(8)
          console.log(`${roleIcon} ${roleName} | ${msg.content.substring(0, 80)}${msg.content.length > 80 ? '...' : ''}`)
        })
        console.log('─'.repeat(60))
        console.log()
      } else {
        results.push({
          test: 'Message Fetching',
          status: 'WARN',
          message: '⚠️ No messages found',
          data
        })
      }
    } catch (error: any) {
      results.push({
        test: 'Message Fetching',
        status: 'FAIL',
        message: `❌ Failed: ${error.message}`
      })
    }
  } else {
    console.log('💬 Test 3: Skipped (no conversation ID provided)')
    console.log('   Usage: npm run test:broker <conversation_id>')
    console.log()
  }

  // Print Summary
  console.log('\n' + '='.repeat(60))
  console.log('📋 Test Summary')
  console.log('='.repeat(60))

  let passCount = 0
  let warnCount = 0
  let failCount = 0

  results.forEach(result => {
    if (result.status === 'PASS') passCount++
    if (result.status === 'WARN') warnCount++
    if (result.status === 'FAIL') failCount++

    const statusIcon = result.status === 'PASS' ? '✅' : result.status === 'WARN' ? '⚠️' : '❌'
    console.log(`${statusIcon} ${result.test}: ${result.message}`)

    if (result.data && (result.status === 'WARN' || result.status === 'FAIL')) {
      console.log(`   Data: ${JSON.stringify(result.data, null, 2).substring(0, 200)}...`)
    }
  })

  console.log('\n' + '─'.repeat(60))
  console.log(`✅ Passed: ${passCount} | ⚠️ Warnings: ${warnCount} | ❌ Failed: ${failCount}`)
  console.log('='.repeat(60))

  // Exit with appropriate code
  if (failCount > 0) {
    process.exit(1)
  } else if (warnCount > 0) {
    process.exit(0) // Warnings are OK
  } else {
    console.log('\n🎉 All tests passed!')
    process.exit(0)
  }
}

runTests().catch(error => {
  console.error('❌ Test script failed:', error)
  process.exit(1)
})
