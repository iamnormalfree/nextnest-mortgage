// Check actual broker table schema
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkSchema() {
  console.log('🔍 Checking ai_brokers table schema...\n')

  // Try to get any existing record to see the structure
  const { data, error } = await supabase
    .from('ai_brokers')
    .select('*')
    .limit(1)

  if (error) {
    console.log('Error:', error.message)
    console.log('\n💡 Table might be empty or not exist. Let me try inserting a minimal record...\n')

    // Try minimal insert to see what's required
    const { data: insertData, error: insertError } = await supabase
      .from('ai_brokers')
      .insert({
        name: 'Test Broker',
        slug: 'test-broker',
        personality_type: 'balanced'
      })
      .select()

    if (insertError) {
      console.log('Insert error:', insertError.message)
      console.log('Details:', insertError.details)
      console.log('Hint:', insertError.hint)
    } else {
      console.log('✅ Successfully inserted minimal record')
      console.log('Record structure:', insertData)

      // Delete the test record
      await supabase
        .from('ai_brokers')
        .delete()
        .eq('slug', 'test-broker')
      console.log('🗑️  Test record deleted')
    }
  } else if (data && data.length > 0) {
    console.log('✅ Found existing record. Schema:')
    console.log('Columns:', Object.keys(data[0]))
    console.log('\nSample record:', JSON.stringify(data[0], null, 2))
  } else {
    console.log('Table exists but is empty. No data to show schema.')
  }
}

checkSchema().catch(console.error)
