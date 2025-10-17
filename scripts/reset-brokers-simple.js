// Simple script to reset broker availability using direct HTTP request
const SUPABASE_URL = 'https://xlncuntbqajqfkegmuvo.supabase.co'
// Using anon key as the app does - it has necessary permissions via RLS
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsbmN1bnRicWFqcWZrZWdtdXZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1NTM2ODMsImV4cCI6MjA3MzEyOTY4M30.bHiwII2RVw48sJGNl-30pJnXe82zDDbR5gMqdl3WWT8'

async function resetBrokers() {
  console.log('🔄 Resetting all brokers to available...\n')

  try {
    // Update all brokers to available
    const response = await fetch(`${SUPABASE_URL}/rest/v1/ai_brokers?is_active=eq.true`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        current_workload: 0,
        active_conversations: 0,
        is_available: true,
        max_concurrent_chats: 5,
        last_active_at: new Date().toISOString()
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('❌ Failed to reset brokers:', response.status, error)
      return
    }

    const brokers = await response.json()
    console.log('✅ Successfully reset', brokers.length, 'brokers!\n')

    brokers.forEach(broker => {
      console.log(`  ${broker.name}:`)
      console.log(`    - Workload: ${broker.current_workload}/${broker.max_concurrent_chats}`)
      console.log(`    - Available: ${broker.is_available ? '✅' : '❌'}`)
    })

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

resetBrokers()