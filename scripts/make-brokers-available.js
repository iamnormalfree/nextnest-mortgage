// Make all brokers available for testing
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function makeBrokersAvailable() {
  console.log('🔄 Making all brokers available...\n')

  // Update all brokers to be available with 0 workload
  const { data, error } = await supabase
    .from('ai_brokers')
    .update({
      is_available: true,
      current_workload: 0,
      active_conversations: 0
    })
    .eq('is_active', true)
    .select()

  if (error) {
    console.error('❌ Error:', error.message)
    return
  }

  console.log(`✅ Successfully updated ${data.length} broker(s):\n`)

  data.forEach(broker => {
    console.log(`   ✅ ${broker.name} - Available: ${broker.is_available}, Workload: ${broker.current_workload}/${broker.max_concurrent_chats}`)
  })

  console.log('\n🎉 All brokers are now available for assignment!')
}

makeBrokersAvailable().catch(console.error)
