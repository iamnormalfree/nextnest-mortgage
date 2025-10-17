import { Database } from './lib/db/types/database.types'

// Test that the types include the new fields
type BrokerRow = Database['public']['Tables']['ai_brokers']['Row']
type BrokerUpdate = Database['public']['Tables']['ai_brokers']['Update']

const testBroker: BrokerRow = {
  id: 'test',
  name: 'Test',
  slug: 'test',
  photo_url: null,
  role: 'test',
  personality_type: 'balanced',
  voice_description: 'test',
  communication_style: 'test',
  approach_style: 'test',
  favorite_phrases: [],
  speaking_speed: 'test',
  voice_model: 'test',
  current_workload: 0,
  is_active: true,
  performance_metrics: null,
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
  // NEW FIELDS - should be available
  max_concurrent_chats: 1,
  active_conversations: 0,
  is_available: true,
  last_active_at: null
}

const testUpdate: BrokerUpdate = {
  current_workload: 1,
  active_conversations: 1,
  is_available: false,
  last_active_at: '2024-01-01'
}

console.log('Types test passed!', testBroker, testUpdate)
