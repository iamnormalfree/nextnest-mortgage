#!/usr/bin/env node
/**
 * Fix hardcoded Chatwoot tokens in n8n workflow JSON files
 * Replaces hardcoded token with environment variable placeholder
 */

const fs = require('fs');
const path = require('path');

const HARDCODED_TOKEN = 'ML1DyhzJyDKFFvsZLvEYfHnC';
const REPLACEMENT = '={{$env.CHATWOOT_API_TOKEN}}'; // n8n environment variable syntax

const workflowDir = path.join(__dirname, '..', 'n8n-workflows');

console.log('🔧 Fixing hardcoded tokens in n8n workflows...\n');

const files = fs.readdirSync(workflowDir).filter(f => f.endsWith('.json'));

let fixedCount = 0;
let totalReplacements = 0;

files.forEach(file => {
  const filePath = path.join(workflowDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  const occurrences = (content.match(new RegExp(HARDCODED_TOKEN, 'g')) || []).length;

  if (occurrences > 0) {
    content = content.replace(new RegExp(HARDCODED_TOKEN, 'g'), REPLACEMENT);
    fs.writeFileSync(filePath, content);

    console.log(`✅ ${file}: Replaced ${occurrences} instance(s)`);
    fixedCount++;
    totalReplacements += occurrences;
  }
});

console.log(`\n✅ Fixed ${fixedCount} files (${totalReplacements} total replacements)`);
console.log('\n📝 Note: n8n workflows now use {{$env.CHATWOOT_API_TOKEN}}');
console.log('   Set this environment variable in n8n settings before importing workflows.');
