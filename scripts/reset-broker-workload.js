// Reset broker workload to make them available for assignment
require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.SUPABASE_URL || 'https://rpqyafvkktjmdvaxuzpc.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwcXlhZnZra3RqbWR2YXh1enBjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTU3NTM4NywiZXhwIjoyMDUxMTUxMzg3fQ.xKx4SQjqz0_QjCcSKz-iy5wWv6YcGvw5rEYRGH_sFLA'

const supabase = createClient(supabaseUrl, supabaseKey)

async function resetBrokerWorkload() {
  console.log('🔄 Resetting broker workloads...\n')

  try {
    // Reset all AI brokers to available state
    const { data, error } = await supabase
      .from('ai_brokers')
      .update({
        current_workload: 0,
        active_conversations: 0,
        is_available: true,
        last_active_at: new Date().toISOString()
      })
      .eq('is_active', true)

    if (error) {
      console.error('❌ Error resetting brokers:', error)
      return
    }

    // Fetch updated brokers to verify
    const { data: brokers, error: fetchError } = await supabase
      .from('ai_brokers')
      .select('name, current_workload, active_conversations, is_available')
      .eq('is_active', true)

    if (fetchError) {
      console.error('❌ Error fetching brokers:', fetchError)
      return
    }

    console.log('✅ Successfully reset broker workloads!\n')
    console.log('Current broker status:')
    brokers.forEach(broker => {
      console.log(`  ${broker.name}:`)
      console.log(`    - Workload: ${broker.current_workload}`)
      console.log(`    - Active conversations: ${broker.active_conversations}`)
      console.log(`    - Available: ${broker.is_available ? '✅' : '❌'}`)
    })

    // Also clear any stale broker_conversations
    const { error: cleanupError } = await supabase
      .from('broker_conversations')
      .update({ status: 'completed' })
      .eq('status', 'active')
      .lt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Older than 24 hours

    if (!cleanupError) {
      console.log('\n✅ Cleaned up old active conversations')
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

resetBrokerWorkload()