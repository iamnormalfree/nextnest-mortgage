// List all AI brokers and their availability
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function listBrokers() {
  console.log('📋 Listing all AI brokers...\n')

  const { data, error } = await supabase
    .from('ai_brokers')
    .select('id, name, slug, personality_type, is_active, is_available, current_workload, max_concurrent_chats')
    .order('name')

  if (error) {
    console.error('❌ Error:', error.message)
    return
  }

  if (!data || data.length === 0) {
    console.log('No brokers found in database')
    return
  }

  console.log(`Found ${data.length} broker(s):\n`)

  data.forEach((broker, index) => {
    const statusEmoji = broker.is_active ? '✅' : '❌'
    const availEmoji = broker.is_available ? '🟢' : '🔴'
    const workload = `${broker.current_workload}/${broker.max_concurrent_chats}`

    console.log(`${index + 1}. ${broker.name}`)
    console.log(`   ID: ${broker.id}`)
    console.log(`   Slug: ${broker.slug}`)
    console.log(`   Personality: ${broker.personality_type}`)
    console.log(`   Active: ${statusEmoji} ${broker.is_active}`)
    console.log(`   Available: ${availEmoji} ${broker.is_available}`)
    console.log(`   Workload: ${workload}`)
    console.log('')
  })

  // Check if any are available
  const availableBrokers = data.filter(b => b.is_active && b.is_available)
  console.log('📊 Summary:')
  console.log(`   Total brokers: ${data.length}`)
  console.log(`   Active brokers: ${data.filter(b => b.is_active).length}`)
  console.log(`   Available brokers: ${availableBrokers.length}`)

  if (availableBrokers.length === 0) {
    console.log('\n⚠️  No brokers are currently available!')
    console.log('💡 To make brokers available, run: node scripts/reset-broker-workload.js')
  }
}

listBrokers().catch(console.error)
