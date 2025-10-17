// scripts/seed-brokers.js
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

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

const brokers = [
  {
    id: 'broker_1',
    name: 'Jasmine Lee',
    slug: 'jasmine-lee',
    photo_url: null,
    role: 'Senior Mortgage Specialist',
    personality_type: 'aggressive',
    voice_description: 'Confident and energetic, speaks with authority',
    communication_style: 'direct',
    approach_style: 'premium_rates_focus',
    favorite_phrases: ['Let me get that sorted for you right away!', 'Great choice!', 'This is a fantastic opportunity'],
    speaking_speed: 'fast',
    voice_model: 'alloy',
    current_workload: 0,
    is_active: true
  },
  {
    id: 'broker_2',
    name: 'Rachel Tan',
    slug: 'rachel-tan',
    photo_url: null,
    role: 'Mortgage Consultant',
    personality_type: 'balanced',
    voice_description: 'Warm and reassuring, speaks clearly',
    communication_style: 'consultative',
    approach_style: 'balanced_analysis',
    favorite_phrases: ['Let me explain how this works', 'That\'s a good question', 'Here are your options'],
    speaking_speed: 'medium',
    voice_model: 'nova',
    current_workload: 0,
    is_active: true
  },
  {
    id: 'broker_3',
    name: 'David Chen',
    slug: 'david-chen',
    photo_url: null,
    role: 'Commercial Loan Specialist',
    personality_type: 'conservative',
    voice_description: 'Measured and thoughtful, speaks deliberately',
    communication_style: 'educational',
    approach_style: 'risk_mitigation_focus',
    favorite_phrases: ['Let\'s review this carefully', 'It\'s important to understand...', 'Here\'s what you should know'],
    speaking_speed: 'slow',
    voice_model: 'echo',
    current_workload: 0,
    is_active: true
  },
  {
    id: 'broker_4',
    name: 'Marcus Wong',
    slug: 'marcus-wong',
    photo_url: null,
    role: 'HDB Loan Specialist',
    personality_type: 'aggressive',
    voice_description: 'Dynamic and persuasive, speaks enthusiastically',
    communication_style: 'direct',
    approach_style: 'quick_approval_focus',
    favorite_phrases: ['We can make this happen!', 'Perfect timing!', 'Let me fast-track this for you'],
    speaking_speed: 'fast',
    voice_model: 'onyx',
    current_workload: 0,
    is_active: true
  },
  {
    id: 'broker_5',
    name: 'Sarah Chen',
    slug: 'sarah-chen',
    photo_url: null,
    role: 'Private Property Consultant',
    personality_type: 'balanced',
    voice_description: 'Professional and friendly, speaks with clarity',
    communication_style: 'consultative',
    approach_style: 'comprehensive_analysis',
    favorite_phrases: ['Let me walk you through this', 'Based on market conditions...', 'I recommend we consider'],
    speaking_speed: 'medium',
    voice_model: 'shimmer',
    current_workload: 0,
    is_active: true
  }
]

async function seedBrokers() {
  console.log('🌱 Seeding brokers...')
  console.log(`Preparing to seed ${brokers.length} brokers`)

  let successCount = 0
  let errorCount = 0

  for (const broker of brokers) {
    try {
      // First, check if broker exists
      const { data: existing, error: checkError } = await supabase
        .from('ai_brokers')
        .select('id')
        .eq('id', broker.id)
        .single()

      if (existing) {
        // Update existing broker
        const { error } = await supabase
          .from('ai_brokers')
          .update(broker)
          .eq('id', broker.id)

        if (error) {
          console.error(`❌ Error updating ${broker.name}:`, error.message)
          errorCount++
        } else {
          console.log(`✅ Updated broker: ${broker.name}`)
          successCount++
        }
      } else {
        // Insert new broker
        const { error } = await supabase
          .from('ai_brokers')
          .insert(broker)

        if (error) {
          console.error(`❌ Error inserting ${broker.name}:`, error.message)
          errorCount++
        } else {
          console.log(`✅ Created broker: ${broker.name}`)
          successCount++
        }
      }
    } catch (error) {
      console.error(`❌ Unexpected error for ${broker.name}:`, error)
      errorCount++
    }
  }

  console.log('\n📊 Seeding Results:')
  console.log(`✅ Success: ${successCount}`)
  console.log(`❌ Errors: ${errorCount}`)

  if (successCount === brokers.length) {
    console.log('\n🎉 All brokers seeded successfully!')
  } else if (successCount > 0) {
    console.log('\n⚠️ Partial success. Some brokers were seeded.')
  } else {
    console.log('\n❌ Seeding failed. Please check your database connection and table structure.')
  }
}

seedBrokers().catch(console.error)