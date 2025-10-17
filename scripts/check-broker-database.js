// scripts/check-broker-database.js
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

// Use environment variables or hardcoded values for testing
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_KEY'

if (!supabaseUrl || !supabaseServiceKey || supabaseUrl === 'YOUR_SUPABASE_URL') {
  console.error('❌ Missing Supabase credentials')
  console.log('Please set:')
  console.log('  NEXT_PUBLIC_SUPABASE_URL')
  console.log('  SUPABASE_SERVICE_ROLE_KEY')
  console.log('\nOr edit this file to add your credentials directly')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkBrokers() {
  console.log('🔍 Checking Supabase connection...')
  console.log('URL:', supabaseUrl)

  // 1. Test connection
  const { data: testData, error: testError } = await supabase
    .from('ai_brokers')
    .select('count')
    .limit(1)

  if (testError) {
    console.error('❌ Cannot connect to Supabase:', testError)
    console.log('\n📝 Possible fixes:')
    console.log('1. Check your Supabase URL and service key')
    console.log('2. Make sure the ai_brokers table exists')
    console.log('3. Check network/firewall settings')
    console.log('4. Verify the table has the correct permissions')
    return
  }

  console.log('✅ Successfully connected to Supabase!')

  // 2. Check all brokers
  const { data: allBrokers, error: allError } = await supabase
    .from('ai_brokers')
    .select('*')

  if (allError) {
    console.error('❌ Error fetching brokers:', allError)
    return
  }

  console.log(`\n📊 Broker Database Status:`)
  console.log(`Total brokers: ${allBrokers?.length || 0}`)

  if (allBrokers && allBrokers.length > 0) {
    const active = allBrokers.filter(b => b.is_active)
    const available = allBrokers.filter(b => b.is_available)

    console.log(`Active brokers: ${active.length}`)
    console.log(`Available brokers: ${available.length}`)

    console.log('\n👥 Broker Details:')
    allBrokers.forEach(broker => {
      console.log(`  - ${broker.name}:`)
      console.log(`    ID: ${broker.id}`)
      console.log(`    Active: ${broker.is_active}`)
      console.log(`    Available: ${broker.is_available}`)
      console.log(`    Personality: ${broker.personality_type}`)
      console.log(`    Specialization: ${broker.specialization || 'general'}`)
      console.log(`    Capacity: ${broker.capacity || 5}`)
      console.log(`    Current Load: ${broker.current_load || 0}`)
    })
  } else {
    console.log('\n⚠️ No brokers found in database!')
    console.log('You need to populate the ai_brokers table.')
    console.log('Run: node scripts/seed-brokers.js')
  }

  // 3. Check table structure using RPC or alternative method
  console.log('\n📋 Checking table structure...')

  // Try using the get_table_columns RPC if it exists
  try {
    const { data: columns, error: rpcError } = await supabase
      .rpc('get_table_columns', { table_name: 'ai_brokers' })

    if (!rpcError && columns) {
      console.log('Table structure from RPC:', columns)
    } else if (rpcError && rpcError.message.includes('function') && rpcError.message.includes('does not exist')) {
      // Fallback: Query the information_schema if RPC doesn't exist
      console.log('RPC function not found, using fallback method...')

      // Get a single row to infer structure
      const { data: sampleRow } = await supabase
        .from('ai_brokers')
        .select('*')
        .limit(1)
        .single()

      if (sampleRow) {
        console.log('Table columns (inferred from sample):')
        Object.keys(sampleRow).forEach(column => {
          const value = sampleRow[column]
          const type = value === null ? 'unknown' : typeof value
          console.log(`  - ${column}: ${type}`)
        })
      }
    } else if (rpcError) {
      console.log('Could not get table structure:', rpcError.message)
    }
  } catch (structureError) {
    console.log('Could not check table structure:', structureError.message)
  }

  // 4. Check recent assignments
  const { data: assignments, error: assignError } = await supabase
    .from('broker_assignments')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)

  if (!assignError && assignments) {
    console.log('\n📋 Recent Broker Assignments:')
    if (assignments.length > 0) {
      assignments.forEach(assignment => {
        console.log(`  - Conversation ${assignment.conversation_id}: Broker ${assignment.broker_id} at ${assignment.created_at}`)
      })
    } else {
      console.log('  No recent assignments found')
    }
  }

  // Check if table structure is correct (as documented in Step 1)
  try {
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'ai_brokers' })
      .single()

    if (columnsError) {
      console.log('\n⚠️ Could not fetch table structure:', columnsError.message)
      console.log('   The get_table_columns RPC might not exist in your Supabase instance')
    } else if (columns) {
      console.log('\n📋 Table structure:', columns)
    }
  } catch (err) {
    console.log('\n⚠️ Error checking table structure:', err.message)
  }
}

checkBrokers().catch(console.error)