import { getSupabaseAdmin } from '@/lib/db/supabase-client'
import { Database } from '@/lib/db/types/database.types'

// Use the proper Database type from Supabase
type BrokerRecord = Database['public']['Tables']['ai_brokers']['Row']
type BrokerUpdate = Database['public']['Tables']['ai_brokers']['Update']

// Type for partial broker data from select queries
type BrokerCapacityData = Pick<BrokerRecord, 'current_workload' | 'active_conversations' | 'max_concurrent_chats'>

const DEFAULT_MAX_CONCURRENT_CHATS = 1

export async function markBrokerBusy(broker: BrokerRecord, conversationId?: number) {
  const supabaseAdmin = getSupabaseAdmin()

  const currentWorkload = Math.max(broker.current_workload ?? 0, 0)
  const maxConcurrent = Math.max(broker.max_concurrent_chats ?? DEFAULT_MAX_CONCURRENT_CHATS, 1)
  const newWorkload = Math.min(currentWorkload + 1, maxConcurrent)
  const newActiveCount = Math.max((broker.active_conversations ?? 0) + 1, 1)

  // Type-safe update data - validated as BrokerUpdate
  const updateData: BrokerUpdate = {
    current_workload: newWorkload,
    active_conversations: newActiveCount,
    is_available: newWorkload < maxConcurrent,
    last_active_at: new Date().toISOString()
  }

  const { error } = await supabaseAdmin
    .from('ai_brokers')
    // Supabase v2.75.0 bug: .update() parameter incorrectly typed as 'never' despite updateData being properly typed
    // @ts-expect-error - Type error on next line due to Supabase client bug
    .update(updateData)
    .eq('id', broker.id)

  if (error) {
    console.error('Failed to mark broker busy:', error)
    throw new Error('Failed to reserve broker capacity')
  }

  if (conversationId) {
    console.log('🔒 Broker capacity reserved', { brokerId: broker.id, conversationId, newWorkload, maxConcurrent })
  }
}

export async function releaseBrokerCapacity(brokerId: string) {
  const supabaseAdmin = getSupabaseAdmin()

  const { data: broker, error: fetchError } = await supabaseAdmin
    .from('ai_brokers')
    .select('current_workload, active_conversations, max_concurrent_chats')
    .eq('id', brokerId)
    .maybeSingle()

  if (fetchError) {
    console.error('Failed to fetch broker for release:', fetchError)
    return
  }

  if (!broker) {
    console.warn('Attempted to release broker capacity for unknown broker', brokerId)
    return
  }

  // Type-safe access to broker properties using Pick<> utility type
  const brokerData = broker as BrokerCapacityData
  
  const maxConcurrent = Math.max(brokerData.max_concurrent_chats ?? DEFAULT_MAX_CONCURRENT_CHATS, 1)
  const currentWorkload = Math.max(brokerData.current_workload ?? 0, 0)
  const newWorkload = Math.max(currentWorkload - 1, 0)
  const activeConversations = Math.max(brokerData.active_conversations ?? 0, 0)
  const newActiveCount = Math.max(activeConversations - 1, 0)

  // Type-safe update data - validated as BrokerUpdate
  const updateData: BrokerUpdate = {
    current_workload: newWorkload,
    active_conversations: newActiveCount,
    is_available: newWorkload < maxConcurrent,
    updated_at: new Date().toISOString()
  }

  const { error: updateError } = await supabaseAdmin
    .from('ai_brokers')
    // Supabase v2.75.0 bug: .update() parameter incorrectly typed as 'never' despite updateData being properly typed
    // @ts-expect-error - Type error on next line due to Supabase client bug
    .update(updateData)
    .eq('id', brokerId)

  if (updateError) {
    console.error('Failed to release broker capacity:', updateError)
    return
  }

  console.log('🔓 Broker capacity released', { brokerId, newWorkload, maxConcurrent })
}
