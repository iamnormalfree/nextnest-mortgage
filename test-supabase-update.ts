import { createClient } from '@supabase/supabase-js'
import { Database } from './lib/db/types/database.types'

const supabaseUrl = 'https://example.supabase.co'
const supabaseKey = 'test-key'

const client = createClient<Database>(supabaseUrl, supabaseKey)

type BrokerUpdate = Database['public']['Tables']['ai_brokers']['Update']

const updateData: BrokerUpdate = {
  current_workload: 1,
  active_conversations: 1,
  is_available: false,
  last_active_at: '2024-01-01'
}

// This should work
const test = client.from('ai_brokers').update(updateData)

console.log('Test compilation successful')
