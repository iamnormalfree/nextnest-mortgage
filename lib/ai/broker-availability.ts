import { getSupabaseAdmin } from '@/lib/db/supabase-client'

type BrokerRecord = {
  id: string
  current_workload?: number | null
  active_conversations?: number | null
  max_concurrent_chats?: number | null
}

const DEFAULT_MAX_CONCURRENT_CHATS = 1

export async function markBrokerBusy(broker: BrokerRecord, conversationId?: number) {
  const supabaseAdmin = getSupabaseAdmin()

  const currentWorkload = Math.max(broker.current_workload ?? 0, 0)
  const maxConcurrent = Math.max(broker.max_concurrent_chats ?? DEFAULT_MAX_CONCURRENT_CHATS, 1)
  const newWorkload = Math.min(currentWorkload + 1, maxConcurrent)
  const newActiveCount = Math.max((broker.active_conversations ?? 0) + 1, 1)

  const { error } = await supabaseAdmin
    .from('ai_brokers')
    .update({
      current_workload: newWorkload,
      active_conversations: newActiveCount,
      is_available: newWorkload < maxConcurrent,
      last_active_at: new Date().toISOString()
    })
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

  const maxConcurrent = Math.max(broker.max_concurrent_chats ?? DEFAULT_MAX_CONCURRENT_CHATS, 1)
  const currentWorkload = Math.max(broker.current_workload ?? 0, 0)
  const newWorkload = Math.max(currentWorkload - 1, 0)
  const activeConversations = Math.max(broker.active_conversations ?? 0, 0)
  const newActiveCount = Math.max(activeConversations - 1, 0)

  const { error: updateError } = await supabaseAdmin
    .from('ai_brokers')
    .update({
      current_workload: newWorkload,
      active_conversations: newActiveCount,
      is_available: newWorkload < maxConcurrent,
      updated_at: new Date().toISOString()
    })
    .eq('id', brokerId)

  if (updateError) {
    console.error('Failed to release broker capacity:', updateError)
    return
  }

  console.log('🔓 Broker capacity released', { brokerId, newWorkload, maxConcurrent })
}
