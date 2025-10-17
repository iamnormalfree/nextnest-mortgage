#!/usr/bin/env node
/**
 * Auto-fix Chatwoot Conversation Visibility
 * 
 * This script automatically fixes the known Chatwoot UI bug where:
 * 1. Conversations with status "pending" and no assignee are invisible in dashboard
 * 2. Assigned conversations with status "pending" don't show in default "Open" view
 * 
 * Run this periodically (via cron) to automatically:
 * - Assign unassigned conversations to the configured user
 * - Change pending conversations to open status for visibility
 */

// ⚠️ SECURITY WARNING: Never commit actual API tokens to version control
// Use environment variables instead
const CHATWOOT_BASE_URL = process.env.CHATWOOT_BASE_URL || 'https://chat.nextnest.sg';
const CHATWOOT_API_TOKEN = process.env.CHATWOOT_API_TOKEN;
const ACCOUNT_ID = process.env.CHATWOOT_ACCOUNT_ID || 1;
const USER_ID = process.env.CHATWOOT_USER_ID || 1;
const LOG_PREFIX = new Date().toISOString();

// Validate required environment variables
if (!CHATWOOT_API_TOKEN) {
  console.error('❌ ERROR: CHATWOOT_API_TOKEN environment variable is required');
  console.error('Set it with: export CHATWOOT_API_TOKEN=your-token-here');
  process.exit(1);
}

// Logging function
function log(message, level = 'INFO') {
  console.log(`[${LOG_PREFIX}] [${level}] ${message}`);
}

async function autoFixConversations() {
  log('🔧 Starting automatic Chatwoot conversation fix...');
  
  let totalFixed = 0;
  
  try {
    // Step 1: Assign unassigned pending conversations
    log('Step 1: Fixing unassigned conversations...');
    
    const pendingResponse = await fetch(`${CHATWOOT_BASE_URL}/api/v1/accounts/${ACCOUNT_ID}/conversations?status=pending`, {
      headers: {
        'Api-Access-Token': CHATWOOT_API_TOKEN,
        'Content-Type': 'application/json'
      }
    });
    
    if (!pendingResponse.ok) {
      throw new Error(`Failed to fetch pending conversations: ${pendingResponse.status}`);
    }
    
    const pendingData = await pendingResponse.json();
    const pendingConversations = pendingData.data.payload;
    
    // Filter unassigned conversations
    const unassignedConversations = pendingConversations.filter(conv => 
      !conv.meta?.assignee?.id
    );
    
    log(`Found ${unassignedConversations.length} unassigned conversations`);
    
    // Assign unassigned conversations
    for (const conversation of unassignedConversations) {
      try {
        const assignResponse = await fetch(`${CHATWOOT_BASE_URL}/api/v1/accounts/${ACCOUNT_ID}/conversations/${conversation.id}/assignments`, {
          method: 'POST',
          headers: {
            'Api-Access-Token': CHATWOOT_API_TOKEN,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            assignee_id: USER_ID
          })
        });
        
        if (assignResponse.ok) {
          log(`✅ Assigned conversation ${conversation.id}`);
          totalFixed++;
        } else {
          log(`❌ Failed to assign conversation ${conversation.id}`, 'ERROR');
        }
        
        await new Promise(resolve => setTimeout(resolve, 50));
        
      } catch (error) {
        log(`❌ Error assigning conversation ${conversation.id}: ${error.message}`, 'ERROR');
      }
    }
    
    // Step 2: Change pending conversations assigned to user to open status
    log('Step 2: Changing pending conversations to open status...');
    
    // Re-fetch pending conversations to get updated assignment status
    const updatedPendingResponse = await fetch(`${CHATWOOT_BASE_URL}/api/v1/accounts/${ACCOUNT_ID}/conversations?status=pending`, {
      headers: {
        'Api-Access-Token': CHATWOOT_API_TOKEN,
        'Content-Type': 'application/json'
      }
    });
    
    if (updatedPendingResponse.ok) {
      const updatedPendingData = await updatedPendingResponse.json();
      const allPendingConversations = updatedPendingData.data.payload;
      
      // Filter for conversations assigned to the user
      const userPendingConversations = allPendingConversations.filter(conv => 
        conv.meta?.assignee?.id === USER_ID
      );
      
      log(`Found ${userPendingConversations.length} pending conversations assigned to user`);
      
      // Change status to open
      for (const conversation of userPendingConversations) {
        try {
          const statusResponse = await fetch(`${CHATWOOT_BASE_URL}/api/v1/accounts/${ACCOUNT_ID}/conversations/${conversation.id}/toggle_status`, {
            method: 'POST',
            headers: {
              'Api-Access-Token': CHATWOOT_API_TOKEN,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              status: 'open'
            })
          });
          
          if (statusResponse.ok) {
            log(`✅ Changed conversation ${conversation.id} to open`);
            totalFixed++;
          } else {
            log(`❌ Failed to change status of conversation ${conversation.id}`, 'ERROR');
          }
          
          await new Promise(resolve => setTimeout(resolve, 50));
          
        } catch (error) {
          log(`❌ Error changing status of conversation ${conversation.id}: ${error.message}`, 'ERROR');
        }
      }
    }
    
    // Step 3: Report final status
    log('Step 3: Checking final status...');
    
    const finalResponse = await fetch(`${CHATWOOT_BASE_URL}/api/v1/accounts/${ACCOUNT_ID}/conversations?status=open`, {
      headers: {
        'Api-Access-Token': CHATWOOT_API_TOKEN,
        'Content-Type': 'application/json'
      }
    });
    
    if (finalResponse.ok) {
      const finalData = await finalResponse.json();
      const meta = finalData.data.meta;
      
      log(`📊 Final Status:`);
      log(`  Open conversations assigned to user: ${meta.mine_count}`);
      log(`  Total open conversations: ${meta.all_count}`);
      log(`  Total operations performed: ${totalFixed}`);
    }
    
    if (totalFixed > 0) {
      log(`🎉 Successfully fixed ${totalFixed} conversation visibility issues!`);
    } else {
      log('✅ No conversation fixes needed - all conversations are properly visible');
    }
    
  } catch (error) {
    log(`❌ Error in auto-fix process: ${error.message}`, 'ERROR');
    process.exit(1);
  }
}

// Run the auto-fix
autoFixConversations();