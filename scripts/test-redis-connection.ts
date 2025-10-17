// Test Redis connection for NextNest AI Broker system
import Redis from 'ioredis'

async function testRedisConnection() {
  console.log('🔍 Testing Redis Connection for NextNest AI Broker\n')
  console.log('=' .repeat(60))

  const redisUrl = process.env.REDIS_URL

  if (!redisUrl) {
    console.error('❌ ERROR: REDIS_URL not found in environment variables')
    console.log('\n📝 Please add REDIS_URL to your .env.local file:')
    console.log('   1. Go to Railway Dashboard')
    console.log('   2. Click on Redis service')
    console.log('   3. Go to Variables tab')
    console.log('   4. Copy REDIS_URL value')
    console.log('   5. Paste it in .env.local')
    process.exit(1)
  }

  // Mask password in logs
  const maskedUrl = redisUrl.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')
  console.log(`\n📍 Connecting to: ${maskedUrl}`)

  const redis = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => {
      if (times > 3) {
        console.error(`\n❌ Failed to connect after ${times} attempts`)
        return null
      }
      const delay = Math.min(times * 200, 1000)
      console.log(`⏳ Retry attempt ${times}/3 in ${delay}ms...`)
      return delay
    },
    connectTimeout: 10000,
  })

  try {
    console.log('\n🧪 Running Redis Tests...\n')

    // Test 1: PING
    console.log('Test 1: PING')
    const start1 = Date.now()
    const pong = await redis.ping()
    const latency1 = Date.now() - start1
    console.log(`✅ PONG received (${latency1}ms)`)

    // Test 2: SET/GET
    console.log('\nTest 2: SET/GET')
    const testKey = 'test:nextnest:connection'
    const testValue = `Test from NextNest at ${new Date().toISOString()}`

    const start2 = Date.now()
    await redis.set(testKey, testValue)
    const latency2 = Date.now() - start2
    console.log(`✅ SET operation successful (${latency2}ms)`)

    const start3 = Date.now()
    const retrieved = await redis.get(testKey)
    const latency3 = Date.now() - start3
    console.log(`✅ GET operation successful (${latency3}ms)`)
    console.log(`   Retrieved: "${retrieved?.substring(0, 50)}..."`)

    // Test 3: DELETE
    console.log('\nTest 3: DELETE')
    const start4 = Date.now()
    await redis.del(testKey)
    const latency4 = Date.now() - start4
    console.log(`✅ DELETE operation successful (${latency4}ms)`)

    // Test 4: Server Info
    console.log('\nTest 4: Server Info')
    const info = await redis.info('server')
    const version = info.match(/redis_version:([^\r\n]+)/)?.[1]
    const mode = info.match(/redis_mode:([^\r\n]+)/)?.[1]
    const os = info.match(/os:([^\r\n]+)/)?.[1]

    console.log(`✅ Redis Version: ${version}`)
    console.log(`   Mode: ${mode}`)
    console.log(`   OS: ${os}`)

    // Test 5: Memory Info
    console.log('\nTest 5: Memory Info')
    const memInfo = await redis.info('memory')
    const usedMemory = memInfo.match(/used_memory_human:([^\r\n]+)/)?.[1]
    const maxMemory = memInfo.match(/maxmemory_human:([^\r\n]+)/)?.[1]

    console.log(`✅ Memory Used: ${usedMemory}`)
    if (maxMemory && maxMemory !== '0B') {
      console.log(`   Max Memory: ${maxMemory}`)
    }

    // Test 6: BullMQ Specific - Check if we can use lists
    console.log('\nTest 6: BullMQ Compatibility (List operations)')
    const listKey = 'test:nextnest:bullmq:queue'
    await redis.rpush(listKey, 'job1', 'job2', 'job3')
    const listLength = await redis.llen(listKey)
    await redis.del(listKey)
    console.log(`✅ List operations working (created list with ${listLength} items)`)

    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('✅ ALL TESTS PASSED! Redis is ready for BullMQ.')
    console.log('='.repeat(60))

    console.log('\n📊 Performance Summary:')
    console.log(`   Average Latency: ${Math.round((latency1 + latency2 + latency3 + latency4) / 4)}ms`)
    console.log(`   Connection: ${latency1 < 100 ? 'Excellent' : latency1 < 500 ? 'Good' : 'Slow'}`)

    console.log('\n✅ Next Steps:')
    console.log('   1. Set ENABLE_BULLMQ_BROKER=true in .env.local')
    console.log('   2. Set BULLMQ_ROLLOUT_PERCENTAGE=0 (validation mode)')
    console.log('   3. Run: npm run dev')
    console.log('   4. Visit: http://localhost:3006/api/admin/migration-status')

    await redis.quit()
    process.exit(0)

  } catch (error: any) {
    console.error('\n❌ Redis Test Failed!')
    console.error('=' .repeat(60))
    console.error('Error:', error.message)

    if (error.code === 'ECONNREFUSED') {
      console.error('\n🔧 Connection Refused - Possible Issues:')
      console.error('   1. Redis service not running in Railway')
      console.error('   2. Incorrect REDIS_URL')
      console.error('   3. Network/firewall blocking connection')
      console.error('\n💡 Try:')
      console.error('   - Check Railway Dashboard > Redis service status')
      console.error('   - Verify REDIS_URL is correct')
      console.error('   - Check if Railway services are in same project')
    } else if (error.code === 'ENOTFOUND') {
      console.error('\n🔧 Host Not Found - Check:')
      console.error('   1. REDIS_URL hostname is correct')
      console.error('   2. Redis service is deployed in Railway')
    } else if (error.message?.includes('AUTH')) {
      console.error('\n🔧 Authentication Failed - Check:')
      console.error('   1. Redis password in REDIS_URL is correct')
      console.error('   2. Copy fresh REDIS_URL from Railway dashboard')
    }

    await redis.quit()
    process.exit(1)
  }
}

testRedisConnection()
