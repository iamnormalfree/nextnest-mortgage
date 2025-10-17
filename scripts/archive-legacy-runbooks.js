#!/usr/bin/env node
/**
 * Archive legacy runbooks that have been consolidated into complete guides
 * Moves old files to archive with deprecation notices
 */

const fs = require('fs');
const path = require('path');

console.log('📚 Archiving legacy runbooks that have been merged...\n');

// Files to archive (already superseded by complete guides)
const filesToArchive = [
  {
    source: 'docs/runbooks/chatops/chatwoot-setup-guide.md',
    target: 'docs/runbooks/archive/chatwoot/chatwoot-setup-guide-legacy.md',
    supersededBy: 'docs/runbooks/chatops/CHATWOOT_COMPLETE_SETUP_GUIDE.md'
  },
  {
    source: 'docs/runbooks/N8N_CHATWOOT_AI_WORKFLOW.md',
    target: 'docs/runbooks/archive/chatwoot/n8n-chatwoot-ai-workflow-legacy.md',
    supersededBy: 'docs/runbooks/chatops/CHATWOOT_COMPLETE_SETUP_GUIDE.md (Part 4: n8n Workflow Setup)'
  }
];

// Ensure archive directories exist
const archiveDirs = ['docs/runbooks/archive/chatwoot'];
archiveDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  }
});

let archivedCount = 0;

filesToArchive.forEach(({ source, target, supersededBy }) => {
  if (!fs.existsSync(source)) {
    console.log(`⚠️  Skipped (not found): ${source}`);
    return;
  }

  // Read original content
  const content = fs.readFileSync(source, 'utf8');

  // Add deprecation notice
  const deprecationNotice = `# ⚠️ DEPRECATED - Archived ${new Date().toISOString().split('T')[0]}

**This document has been superseded by**: \`${supersededBy}\`

**Why archived**: Content consolidated into comprehensive guide for better maintenance.

**Original content preserved below for reference**:

---

`;

  const archivedContent = deprecationNotice + content;

  // Write to archive
  fs.writeFileSync(target, archivedContent);
  console.log(`✅ Archived: ${source} → ${target}`);

  // Delete original
  fs.unlinkSync(source);
  console.log(`   Deleted original: ${source}`);

  archivedCount++;
});

console.log(`\n✅ Archived ${archivedCount} legacy runbooks`);
console.log('📁 Archive location: docs/runbooks/archive/');
