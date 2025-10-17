#!/usr/bin/env node

/**
 * Check broker availability in Supabase
 */

require('dotenv').config({ path: '.env.local' })

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Found' : 'Missing')
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? 'Found' : 'Missing')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkBrokers() {
  console.log('🔍 Checking broker availability in Supabase...\n')

  // Check all brokers
  const { data: allBrokers, error: allError } = await supabase
    .from('ai_brokers')
    .select('*')

  if (allError) {
    console.error('❌ Error fetching brokers:', allError)
    return
  }

  console.log(`📊 Total brokers in database: ${allBrokers?.length || 0}\n`)

  if (!allBrokers || allBrokers.length === 0) {
    console.log('❌ NO BROKERS FOUND IN DATABASE')
    console.log('\nTo fix: Run seeding script to create brokers')
    console.log('  npm run seed:brokers')
    return
  }

  // Check active brokers
  const { data: activeBrokers } = await supabase
    .from('ai_brokers')
    .select('*')
    .eq('is_active', true)

  console.log(`✅ Active brokers: ${activeBrokers?.length || 0}`)

  // Check available brokers
  const { data: availableBrokers } = await supabase
    .from('ai_brokers')
    .select('*')
    .eq('is_active', true)
    .eq('is_available', true)

  console.log(`✅ Available brokers: ${availableBrokers?.length || 0}\n`)

  if (!availableBrokers || availableBrokers.length === 0) {
    console.log('⚠️  NO AVAILABLE BROKERS - All conversations will be queued\n')
    console.log('Possible reasons:')
    console.log('  1. All brokers have is_available = false')
    console.log('  2. All brokers are at max_concurrent_chats capacity')
    console.log('  3. All brokers have is_active = false')
    console.log('\nTo fix:')
    console.log('  - Update brokers: UPDATE ai_brokers SET is_available = true WHERE is_active = true;')
    console.log('  - Or increase capacity: UPDATE ai_brokers SET max_concurrent_chats = 10;')
  } else {
    console.log('📋 Available brokers:\n')
    availableBrokers.forEach(broker => {
      console.log(`  ✅ ${broker.broker_name || broker.name}`)
      console.log(`     ID: ${broker.id}`)
      console.log(`     Active conversations: ${broker.active_conversations || 0}/${broker.max_concurrent_chats || 5}`)
      console.log(`     Workload: ${broker.current_workload || 0}`)
      console.log('')
    })
  }

  // Check Michelle Chen specifically
  const { data: michelle } = await supabase
    .from('ai_brokers')
    .select('*')
    .or('broker_name.eq.Michelle Chen,name.eq.Michelle Chen')
    .single()

  if (michelle) {
    console.log('🔍 Michelle Chen status:')
    console.log(`   is_active: ${michelle.is_active}`)
    console.log(`   is_available: ${michelle.is_available}`)
    console.log(`   active_conversations: ${michelle.active_conversations || 0}`)
    console.log(`   max_concurrent_chats: ${michelle.max_concurrent_chats || 5}`)
    console.log(`   current_workload: ${michelle.current_workload || 0}`)
  } else {
    console.log('❌ Michelle Chen not found in database')
  }
}

checkBrokers().catch(console.error)
