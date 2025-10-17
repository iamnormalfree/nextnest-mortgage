#!/usr/bin/env node

/**
 * Debug script to check sessionStorage data structure
 * Run this in browser console on /apply/insights page
 */

console.log('🔍 SessionStorage Diagnostic\n')

// Check for new session manager format
const sessionKey = Object.keys(sessionStorage).find(k => k.startsWith('chatwoot_session_'))
if (sessionKey) {
  console.log('✅ Found session key:', sessionKey)
  const sessionData = JSON.parse(sessionStorage.getItem(sessionKey) || '{}')
  console.log('📦 Session data:', sessionData)

  if (sessionData.broker) {
    console.log('✅ Broker found in session:', sessionData.broker)
  } else {
    console.log('❌ No broker in session')
  }

  if (sessionData.preselectedPersona) {
    console.log('✅ Pre-selected persona:', sessionData.preselectedPersona)
  }
} else {
  console.log('❌ No chatwoot_session_* key found')
}

// Check legacy keys
console.log('\n🔍 Legacy SessionStorage Keys:')
console.log('chatwoot_widget_config:', sessionStorage.getItem('chatwoot_widget_config') ? '✅ Found' : '❌ Missing')
console.log('form_data:', sessionStorage.getItem('form_data') ? '✅ Found' : '❌ Missing')
console.log('lead_score:', sessionStorage.getItem('lead_score') || '❌ Missing')

// Check widget config for broker data
const widgetConfig = sessionStorage.getItem('chatwoot_widget_config')
if (widgetConfig) {
  const config = JSON.parse(widgetConfig)
  console.log('\n📦 Widget Config customAttributes:')
  console.log('ai_broker_name:', config.customAttributes?.ai_broker_name || '❌ Missing')
  console.log('broker_status:', config.customAttributes?.broker_status || '❌ Missing')
  console.log('ai_broker_id:', config.customAttributes?.ai_broker_id || '❌ Missing')
}

console.log('\n📊 Summary:')
console.log('- If accessing via URL params, sessionStorage may be empty')
console.log('- If coming from form, sessionStorage should have broker data')
console.log('- Check Network tab for /api/chatwoot-conversation response')
